  /* ── PM-1263 · Stripe Connect in Settings (Standard accounts) ────────────────────────────────
     Dean, after seeing Kahunas' Configuration › Stripe Setup: one "Connect with Stripe" button and
     nothing else visible. **Standard Connect**: the coach connects their own Stripe account, Stripe
     bills them directly, so VYVE pays no account / payout / platform fee and is not the merchant of
     record — their business, their terms, their disputes. We never see a key; the Edge Function
     holds the platform secret and returns a one-time onboarding link.
     PayPal (Kahunas' other tab) deliberately skipped: a second integration for a fraction of coaches,
     and it would mean coaches pasting their own secret token into our database.
     This is the connection only. Charging a client for their package is the next piece, and the
     card says so rather than implying money already moves.                                    ── */
  var SC_EF = 'coach-stripe-connect';
  var sc = { row: null, busy: false };

  function scBadge(s){
    var map = { connected: ['Connected', 'var(--success,#4ADE80)'], pending: ['Finishing setup', 'var(--warning,#E8A855)'],
                restricted: ['Action needed', 'var(--danger,#F87171)'], disconnected: ['Disconnected', 'var(--text-muted)'],
                none: ['Not connected', 'var(--text-muted)'] };
    var m = map[s] || map.none;
    return '<span style="font-size:11px;font-weight:700;color:' + m[1] + ';">\u25cf ' + m[0] + '</span>';
  }
  async function scCall(action){
    var r = await fetch(SUPA_URL + '/functions/v1/' + SC_EF, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (await jwt()) },
      body: JSON.stringify({ action: action })
    });
    var body = await r.json();
    if (!r.ok || body.error) throw new Error(body.error || ('HTTP ' + r.status));
    return body;
  }
  function scRender(){
    var host = $c('sc-body'); if (!host) return;
    var s = (sc.row && sc.row.status) || 'none';
    var connected = s === 'connected';
    host.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' + scBadge(s) +
        (sc.row && sc.row.stripe_account_id ? '<span style="font-size:11.5px;color:var(--text-muted);">' + esc(sc.row.stripe_account_id) + '</span>' : '') +
      '</div>' +
      (connected
        ? '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">Your Stripe account is connected. Payments from your clients go straight to you \u2014 VYVE never holds the money and takes nothing from it. Stripe\u2019s usual fee applies (1.5% + 20p on standard UK cards).</p>'
        : s === 'pending' || s === 'restricted'
        ? '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">Stripe still needs a few details before you can take payments.' +
          (sc.needs && sc.needs.length ? ' Outstanding: ' + esc(sc.needs.slice(0, 4).join(', ')) + '.' : '') + '</p>'
        : '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">Connect your own Stripe account to charge clients for your packages from inside VYVE. You keep the money \u2014 it goes to your Stripe account, not ours \u2014 and you can disconnect whenever you like. If you already use Stripe you can connect the account you have.</p>') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary" id="sc-go" type="button" style="font-size:12.5px;">' + (connected ? 'Manage on Stripe' : s === 'pending' || s === 'restricted' ? 'Finish setting up' : 'Connect with Stripe') + '</button>' +
        (sc.row && sc.row.stripe_account_id ? '<button class="btn" id="sc-sync" type="button" style="font-size:12.5px;">Refresh status</button>' : '') +
        (connected ? '<button class="btn" id="sc-off" type="button" style="font-size:12.5px;color:var(--danger);">Disconnect</button>' : '') +
      '</div>' +
      '<p style="font-size:12px;color:var(--text-muted);background:var(--gold-pale,rgba(201,168,76,.12));border:1px solid var(--gold);border-radius:10px;padding:10px 12px;margin-top:14px;">Connecting doesn\u2019t charge anyone yet \u2014 putting a price on a package and billing a client for it comes next. Your VYVE membership and the \u00a35 you earn per member are separate from this and don\u2019t change.</p>';

    if ($c('sc-go')) $c('sc-go').addEventListener('click', async function(){
      if (sc.busy) return; sc.busy = true;
      var b = this; var old = b.textContent; b.textContent = 'Opening Stripe\u2026'; b.disabled = true;
      try {
        var r = await scCall('start');
        if (r.url) window.open(r.url, '_blank', 'noopener');
      } catch(e){ alert('Couldn\u2019t open Stripe \u2014 ' + (e.message || e)); }
      finally { sc.busy = false; b.textContent = old; b.disabled = false; }
    });
    if ($c('sc-sync')) $c('sc-sync').addEventListener('click', function(){ scLoad(true); });
    if ($c('sc-off')) $c('sc-off').addEventListener('click', async function(){
      if (!confirm('Disconnect Stripe? Your Stripe account stays exactly as it is \u2014 VYVE just stops being able to charge clients through it.')) return;
      try { await scCall('disconnect'); await scLoad(true); } catch(e){ alert('Couldn\u2019t disconnect \u2014 ' + (e.message || e)); }
    });
  }
  async function scLoad(fresh){
    try {
      if (fresh){
        var r = await scCall('sync');
        sc.needs = r.needs || [];
        sc.row = Object.assign({}, sc.row, { status: r.status, charges_enabled: r.charges_enabled });
      } else {
        var rows = await rest('/coach_stripe_accounts?partner_id=eq.' + partnerId + '&select=*') || [];
        sc.row = rows[0] || null;
      }
    } catch(e){ /* not connected yet, or the function isn't deployed — the card still renders */ }
    scRender();
  }
  (function(){
    var t = setInterval(function(){
      var host = $c('view-settings'); if (!host || !partnerId) return;
      clearInterval(t);
      if ($c('sc-card')) return;
      var card = document.createElement('div');
      card.className = 'card'; card.id = 'sc-card'; card.style.cssText = 'max-width:860px;margin:18px 0;';
      card.innerHTML = '<h2 style="margin:0 0 6px;font-size:17px;">Taking payments</h2>' +
        '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">For charging your own clients for your own packages.</p>' +
        '<div id="sc-body"><p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p></div>';
      host.firstElementChild.parentElement.insertBefore(card, host.firstElementChild.nextSibling);
      scLoad(false);
      /* coming back from Stripe's onboarding: re-read the real state from Stripe, not the browser */
      if ((location.hash || '').indexOf('stripe=') >= 0) setTimeout(function(){ scLoad(true); }, 400);
    }, 400);
    setTimeout(function(){ clearInterval(t); }, 25000);
  })();
