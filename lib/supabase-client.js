// =====================================================================
// VYVE Command Centre - Supabase client
// Wraps @supabase/supabase-js (loaded via CDN) with hub-specific helpers.
// Tables prefixed cc_* are gated by the cc_team_only RLS policy.
// =====================================================================

(function(){
  'use strict';

  var SUPABASE_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';

  var client = null;
  var ready = false;
  var readyCallbacks = [];
  var cachedAdminRow = undefined;

  function init(){
    if (!window.supabase || !window.supabase.createClient){
      setTimeout(init, 50);
      return;
    }
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,  // auto-handles ?code= and #access_token= in URL
          flowType: 'pkce',
          storageKey: 'vyve-cc-supabase-auth'
        }
      });
      ready = true;
      // Handle PKCE code flow if Supabase didn\u2019t do it automatically
      handleAuthCallback();
      readyCallbacks.forEach(function(cb){ try { cb(); } catch(e){} });
      readyCallbacks = [];
    } catch(e){
      console.error('[supabase] init failed', e);
    }
  }

  // Detect ?code=... in the URL (PKCE flow) and exchange it for a session,
  // then strip the URL params so a refresh doesn\u2019t retry.
  async function handleAuthCallback(){
    if (!client) return;
    try {
      var url = new URL(window.location.href);
      var code = url.searchParams.get('code');
      if (!code) return;
      var res = await client.auth.exchangeCodeForSession(code);
      if (res.error){
        console.warn('[supabase] exchangeCodeForSession failed', res.error);
        return;
      }
      // Clean the URL
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      var clean = url.origin + url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      window.history.replaceState({}, document.title, clean);
    } catch(e){
      console.warn('[supabase] auth callback handler threw', e);
    }
  }

  function onReady(cb){
    if (ready) cb();
    else readyCallbacks.push(cb);
  }

  async function getSession(){
    if (!client) return null;
    var res = await client.auth.getSession();
    return res && res.data ? res.data.session : null;
  }

  async function getUser(){
    var s = await getSession();
    return s ? s.user : null;
  }

  async function getUserEmail(){
    var u = await getUser();
    return u ? u.email : null;
  }

  async function getCurrentAdmin(opts){
    opts = opts || {};
    if (cachedAdminRow !== undefined && !opts.refresh) return cachedAdminRow;
    var email = await getUserEmail();
    if (!email){ cachedAdminRow = null; return null; }
    try {
      var res = await client.from('admin_users').select('*').eq('email', email).eq('active', true).maybeSingle();
      if (res.error){ console.warn('[supabase] admin lookup failed', res.error); cachedAdminRow = null; return null; }
      cachedAdminRow = res.data || null;
      return cachedAdminRow;
    } catch(e){
      console.warn('[supabase] admin lookup threw', e);
      cachedAdminRow = null;
      return null;
    }
  }

  async function isAdmin(){
    var row = await getCurrentAdmin();
    return !!row;
  }

  // Always redirect the magic link back to the hub root, never to whatever
  // origin/pathname happens to be in the browser address bar. This protects
  // against the user starting sign-in from a deep link.
  var AUTH_REDIRECT = 'https://admin.vyvehealth.co.uk/';

  async function signInWithEmail(email){
    if (!client) throw new Error('Supabase not ready');
    var res = await client.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: AUTH_REDIRECT }
    });
    return res;
  }

  async function signOut(){
    if (!client) return;
    cachedAdminRow = undefined;
    await client.auth.signOut();
  }

  async function list(table, opts){
    if (!client) return { data: [], error: 'not ready' };
    opts = opts || {};
    var q = client.from(table).select(opts.select || '*');
    if (opts.eq){ Object.keys(opts.eq).forEach(function(k){ q = q.eq(k, opts.eq[k]); }); }
    if (opts.order){ q = q.order(opts.order.column, { ascending: opts.order.ascending !== false }); }
    if (opts.limit){ q = q.limit(opts.limit); }
    if (opts.range){ q = q.range(opts.range[0], opts.range[1]); }
    var res = await q;
    return res;
  }

  async function getOne(table, id){
    if (!client) return null;
    var res = await client.from(table).select('*').eq('id', id).maybeSingle();
    return res.data;
  }

  window.VYVE_SUPABASE = {
    URL: SUPABASE_URL,
    // PM-779 back-compat with the retired lib/supabase.js stub API —
    // Phase 3-6 pages were written against it (getClient()/isStub()/url()).
    getClient: function(){ return client; },
    isStub: function(){ return false; },
    url: function(){ return SUPABASE_URL; },
    onReady: onReady,
    isReady: function(){ return ready; },
    get client(){ return client; },
    getSession: getSession,
    getUser: getUser,
    getUserEmail: getUserEmail,
    getCurrentAdmin: getCurrentAdmin,
    isAdmin: isAdmin,
    signInWithEmail: signInWithEmail,
    signOut: signOut,
    list: list,
    getOne: getOne
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
