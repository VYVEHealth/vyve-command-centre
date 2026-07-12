// =====================================================================
// VYVE Command Centre — cc-sync (PM-777, 12 July 2026)
//
// Server backing for the legacy localStorage layer. The pre-overhaul CC
// pages (clients, competitors, compliance, intel, knowledge, marketing,
// org, team, delivery, action-plans, social-blueprint, brief, dashboard,
// strategy, inbox, trash) read and write localStorage keys through
// VYVE_DATA / VYVE_STORE / their own lsSet helpers. This module makes
// those keys server-backed without touching a single page:
//
//   1. HYDRATE — on boot (after auth), pull all cc_kv rows and write them
//      into localStorage under their legacy keys, then re-render the
//      current page so it picks up server truth.
//   2. WRITE-THROUGH — localStorage.setItem is patched: writes to keys on
//      the sync allowlist also upsert to cc_kv (debounced per key).
//   3. REFRESH — re-hydrate on window focus, so Dean's edits appear on
//      Lewis's machine at next focus and vice versa.
//
// Collections that graduated to first-class tables (cc_tasks, cc_leads,
// cc_finance, …) keep their pages untouched; if those pages still mirror
// a vyve_* cache key it simply becomes shared too, which is harmless.
// Last-write-wins per collection — acceptable for a 2-person admin team.
// =====================================================================

(function(){
  'use strict';

  // Keys that sync: the legacy ops collections + the store.js audit/trash
  // layer. Auth/session/theme keys deliberately do NOT match.
  function syncable(key){
    if (typeof key !== 'string') return false;
    if (key.indexOf('vyve.store.') === 0) return true;            // audit + trash
    if (key.indexOf('vyve_') === 0){
      if (key.indexOf('vyve_auth') === 0) return false;           // never sync auth
      if (MIRROR_KEYS[key]) return false;  // mirrored from first-class tables, read-only
      return true;
    }
    return false;
  }

  // Legacy keys whose entities graduated to first-class cc_* tables in the
  // overhaul (Phase 3). VYVE_DATA readers (Brief, Dashboard, Inbox, entities
  // registry) still read these localStorage keys synchronously — so hydrate
  // mirrors the live tables into them, mapped to the legacy field names.
  // These keys never write back: the rebuilt pages own their tables.
  var MIRROR_KEYS = {
    vyve_tasks: true, vyve_deals: true, vyve_finance_entries: true,
    vyve_content_items: true, vyve_podcast_eps: true, vyve_sessions: true
  };

  async function mirrorTables(client){
    function put(key, arr){
      try { origSetItem.call(localStorage, key, JSON.stringify(arr || [])); } catch(e){}
    }
    var jobs = [
      client.from('cc_tasks').select('*').then(function(r){
        if (r.error) return;
        put('vyve_tasks', (r.data||[]).map(function(t){
          return { id: t.id, title: t.title, owner: t.assignee, due: t.due_date,
                   status: t.completed_at ? 'done' : (t.stage || 'open'),
                   pillar: t.pillar, priority: t.priority,
                   created_at: t.created_at, updated_at: t.updated_at };
        }));
      }),
      client.from('cc_leads').select('*').then(function(r){
        if (r.error) return;
        put('vyve_deals', (r.data||[]).map(function(d){
          return { id: d.id, company: d.company, title: d.company, contact: d.contact,
                   value: d.value, stage: d.stage, expected_close: d.next_action ? null : null,
                   created_at: d.created_at, updated_at: d.updated_at };
        }));
      }),
      client.from('cc_finance').select('*').order('recorded_date', { ascending: false }).limit(24).then(function(r){
        if (r.error) return;
        put('vyve_finance_entries', (r.data||[]).map(function(f){
          return { id: f.id, month: (f.recorded_date||'').slice(0,7), mrr: f.mrr,
                   cash: f.cash, burn: f.burn, created_at: f.created_at };
        }));
      }),
      client.from('cc_posts').select('*').order('updated_at', { ascending: false }).limit(300).then(function(r){
        if (r.error) return;
        put('vyve_content_items', (r.data||[]).map(function(c){
          return { id: c.id, title: c.title || (c.platform + ' post'), channel: c.platform,
                   status: c.status, pillar: c.pillar, published_at: c.published_at,
                   created_at: c.created_at, updated_at: c.updated_at };
        }));
      }),
      client.from('cc_episodes').select('*').then(function(r){
        if (r.error) return;
        put('vyve_podcast_eps', (r.data||[]).map(function(e){
          return { id: e.id, title: e.title, guest: e.guest, status: e.status,
                   date: e.episode_date, created_at: e.created_at, updated_at: e.updated_at };
        }));
      }),
      client.from('calendar_occurrences').select('*')
        .eq('active', true).is('cancelled_at', null)
        .gte('starts_at', new Date(Date.now() - 86400000).toISOString())
        .lte('starts_at', new Date(Date.now() + 8 * 86400000).toISOString())
        .then(function(r){
          if (r.error) return;
          put('vyve_sessions', (r.data||[]).map(function(s){
            return { id: s.id, title: s.title || s.session_title || s.name,
                     date: s.starts_at, pillar: s.pillar,
                     updated_at: s.updated_at || s.starts_at };
          }));
        })
    ];
    try { await Promise.all(jobs); } catch(e){ console.warn('[cc-sync] mirror threw', e); }
  }

  var origSetItem = Storage.prototype.setItem;
  var hydrating = false;
  var timers = {};
  var DEBOUNCE_MS = 800;

  function sb(){ return (window.VYVE_SUPABASE && window.VYVE_SUPABASE.client) || null; }

  function pushKey(key){
    var client = sb();
    if (!client) return;
    var raw;
    try { raw = localStorage.getItem(key); } catch(e){ return; }
    var value;
    try { value = raw == null ? null : JSON.parse(raw); }
    catch(e){ value = raw; } // non-JSON strings stored as JSON string
    if (value == null) return;
    client.from('cc_kv').upsert({ key: key, value: value }, { onConflict: 'key' })
      .then(function(res){
        if (res && res.error) console.warn('[cc-sync] push failed', key, res.error.message);
      });
  }

  function queuePush(key){
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(function(){ delete timers[key]; pushKey(key); }, DEBOUNCE_MS);
  }

  Storage.prototype.setItem = function(key, value){
    origSetItem.call(this, key, value);
    if (!hydrating && this === window.localStorage && syncable(key)) queuePush(key);
  };

  async function hydrate(){
    var client = sb();
    if (!client) return false;
    try {
      var res = await client.from('cc_kv').select('key,value');
      if (res.error){ console.warn('[cc-sync] hydrate failed', res.error.message); return false; }
      hydrating = true;
      (res.data || []).forEach(function(row){
        if (!syncable(row.key)) return;
        try {
          origSetItem.call(localStorage, row.key,
            typeof row.value === 'string' ? JSON.stringify(row.value) : JSON.stringify(row.value));
        } catch(e){}
      });
      hydrating = false;
      // Migration seed (fill-gaps only): any local syncable collection with
      // NO server row gets pushed up. Never overwrites existing server data —
      // so whichever machine holds a collection (Dean's or Lewis's) populates
      // it on first load, and both converge.
      try {
        var serverKeys = {};
        (res.data || []).forEach(function(row){ serverKeys[row.key] = true; });
        for (var i = 0; i < localStorage.length; i++){
          var k = localStorage.key(i);
          if (syncable(k) && !serverKeys[k]) pushKey(k);
        }
      } catch(e){ console.warn('[cc-sync] seed threw', e); }
      await mirrorTables(client);
      window.__ccSyncHydrated = true;
      try { window.dispatchEvent(new CustomEvent('vyve:cc-sync')); } catch(e){}
      return true;
    } catch(e){
      hydrating = false;
      console.warn('[cc-sync] hydrate threw', e);
      return false;
    }
  }

  // First hydrate: after the Supabase client is ready and a session exists,
  // then re-render the current page so it shows server truth instead of the
  // device-local cache it may have rendered from.
  function rerender(){
    try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch(e){
      try { window.dispatchEvent(new Event('hashchange')); } catch(_e){}
    }
  }
  function boot(){
    if (!window.VYVE_SUPABASE || !window.VYVE_SUPABASE.onReady){ setTimeout(boot, 100); return; }
    window.VYVE_SUPABASE.onReady(async function(){
      var session = await window.VYVE_SUPABASE.getSession();
      if (session){
        if (await hydrate()) rerender();
        return;
      }
      // Not signed in yet (magic-link flow) — hydrate on the first sign-in.
      var client = sb();
      if (!client) return;
      var sub = client.auth.onAuthStateChange(async function(event){
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED'){
          try { sub.data.subscription.unsubscribe(); } catch(e){}
          if (await hydrate()) rerender();
        }
      });
    });
  }
  boot();

  // Refresh on focus (multi-device: pick up the other machine's edits).
  var lastFocusPull = 0;
  window.addEventListener('focus', function(){
    var now = Date.now();
    if (now - lastFocusPull < 15000) return; // throttle
    lastFocusPull = now;
    hydrate();
  });

  window.VYVE_CC_SYNC = { hydrate: hydrate, syncable: syncable };
})();
