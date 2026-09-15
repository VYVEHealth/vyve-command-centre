// coach-stripe-connect v1 — PM-1263
// Standard Connect only: the coach connects their OWN Stripe account. VYVE never holds funds, never
// stores keys, and is not the merchant of record. Three actions, all JWT-gated to the caller's own
// partner: start (an onboarding link), sync (re-read the account from Stripe), disconnect.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// PM-1264: coach Connect uses its OWN key. STRIPE_SECRET_KEY is VYVE's member billing (stripe-webhook
// trial→£10 conversion, booking-paid-confirm) and must never be repurposed here — one wrong overwrite
// stops member conversions. Falls back only if the Connect key is absent.
const STRIPE_KEY = Deno.env.get('STRIPE_CONNECT_SECRET_KEY') ?? Deno.env.get('STRIPE_SECRET_KEY')!;
const PORTAL_URL = Deno.env.get('COACH_PORTAL_URL') ?? 'https://admin.vyvehealth.co.uk/coach-portal';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function stripe(path: string, method = 'GET', form?: Record<string, string>) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20'
    },
    body: form ? new URLSearchParams(form).toString() : undefined
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `Stripe ${res.status}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!jwt) return json({ error: 'not signed in' }, 401);

    const asUser = createClient(SB_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });
    const { data: userData } = await asUser.auth.getUser();
    const email = userData?.user?.email;
    if (!email) return json({ error: 'not signed in' }, 401);

    const db = createClient(SB_URL, SB_SERVICE);

    // the caller's partner — derived server-side, never taken from the request body
    const { data: partner } = await db
      .from('partner_partners')
      .select('id, name, contact_email')
      .eq('contact_email', email)
      .maybeSingle();
    if (!partner) return json({ error: 'no partner for this account' }, 403);

    const { action } = await req.json().catch(() => ({ action: 'sync' }));
    const { data: row } = await db
      .from('coach_stripe_accounts').select('*').eq('partner_id', partner.id).maybeSingle();

    if (action === 'start') {
      let acct = row?.stripe_account_id;
      if (!acct) {
        const created = await stripe('accounts', 'POST', {
          type: 'standard',
          country: 'GB',
          email,
          'business_profile[name]': partner.name ?? '',
          'business_profile[product_description]': 'Online coaching delivered through VYVE',
          'metadata[partner_id]': partner.id
        });
        acct = created.id;
        await db.from('coach_stripe_accounts').upsert({
          partner_id: partner.id, stripe_account_id: acct, status: 'pending', created_at: new Date().toISOString()
        });
      }
      const link = await stripe('account_links', 'POST', {
        account: acct!,
        type: 'account_onboarding',
        refresh_url: `${PORTAL_URL}#settings?stripe=retry`,
        return_url: `${PORTAL_URL}#settings?stripe=done`
      });
      return json({ url: link.url });
    }

    if (action === 'disconnect') {
      if (row?.stripe_account_id) {
        // Standard accounts belong to the coach: we detach, we do not delete their account.
        try { await stripe(`oauth/deauthorize`, 'POST', { client_id: Deno.env.get('STRIPE_CONNECT_CLIENT_ID') ?? '', stripe_user_id: row.stripe_account_id }); } catch (_) { /* already detached */ }
        await db.from('coach_stripe_accounts')
          .update({ status: 'disconnected', charges_enabled: false, payouts_enabled: false, last_synced_at: new Date().toISOString() })
          .eq('partner_id', partner.id);
      }
      return json({ ok: true, status: 'disconnected' });
    }

    // sync (default)
    if (!row?.stripe_account_id) return json({ status: 'none' });
    const a = await stripe('accounts/' + row.stripe_account_id);
    const status = a.charges_enabled ? 'connected' : (a.requirements?.disabled_reason ? 'restricted' : 'pending');
    await db.from('coach_stripe_accounts').update({
      status,
      charges_enabled: !!a.charges_enabled,
      payouts_enabled: !!a.payouts_enabled,
      details_submitted: !!a.details_submitted,
      country: a.country ?? null,
      default_currency: a.default_currency ?? null,
      connected_at: a.charges_enabled && !row.connected_at ? new Date().toISOString() : row.connected_at,
      last_synced_at: new Date().toISOString()
    }).eq('partner_id', partner.id);

    return json({
      status,
      charges_enabled: !!a.charges_enabled,
      payouts_enabled: !!a.payouts_enabled,
      details_submitted: !!a.details_submitted,
      needs: a.requirements?.currently_due ?? []
    });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 400);
  }
});
