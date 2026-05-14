// =====================================================================
// VYVE Command Centre — Auth
// Supabase magic-link auth gated by admin allowlist (Dean's admin_users RLS table).
//
// Flow:
//   1. On boot: check session. No session → show login.
//   2. With session: call is_admin RPC to check if user is in allowlist.
//      - Yes → show app
//      - No  → show access-denied screen with lewis@ contact
//   3. Magic-link submit on login overlay → email sent → user clicks link → returns here authenticated.
//   4. Sign-out clears session.
//
// Pending dependency: Dean to create public.admin_users table + is_admin() RPC.
// While waiting, allowlist check falls back to "any signed-in user", logged loudly.
// =====================================================================

(function(){
  'use strict';

  var ADMIN_CONTACT = 'lewis@vyvehealth.co.uk';

  function $(id){ return document.getElementById(id); }

  function showLogin(){
    var login = $('login');
    var app = $('app');
    if (login) login.style.display = 'flex';
    if (app) app.classList.remove('ready');
    var denied = $('access-denied');
    if (denied) denied.style.display = 'none';
  }

  function showApp(email){
    var login = $('login');
    var app = $('app');
    if (login) login.style.display = 'none';
    if (app) app.classList.add('ready');
    var denied = $('access-denied');
    if (denied) denied.style.display = 'none';
    var el = $('user-email');
    if (el) el.textContent = email || '';
    // Dispatch event so topbar/sidebar can update avatar etc.
    try { window.dispatchEvent(new CustomEvent('vyve:user', { detail: { email: email || '' } })); } catch(e){}
  }

  function showAccessDenied(email){
    var login = $('login');
    var app = $('app');
    if (login) login.style.display = 'none';
    if (app) app.classList.remove('ready');
    // Create the denied screen if it doesn't exist
    var denied = $('access-denied');
    if (!denied){
      denied = document.createElement('div');
      denied.id = 'access-denied';
      denied.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--vyve-dark);z-index:1000;padding:20px';
      denied.innerHTML =
        '<div style="max-width:440px;text-align:center;background:var(--surface);padding:40px 32px;border-radius:var(--r-lg);border:1px solid var(--border)">'+
          '<div style="font-family:var(--font-head);font-size:24px;font-weight:700;color:var(--text);margin-bottom:12px">Access denied</div>'+
          '<div style="font-size:13px;color:var(--text-muted);line-height:1.7;margin-bottom:24px">You signed in as <strong style="color:var(--text)">'+(email||'')+'</strong> but you\'re not on the VYVE Command Centre admin allowlist. '+
          'If you should have access, email <a href="mailto:'+ADMIN_CONTACT+'" style="color:var(--vyve-teal-light)">'+ADMIN_CONTACT+'</a> and ask to be added.</div>'+
          '<button class="btn" id="denied-signout" type="button">Sign out and try a different account</button>'+
        '</div>';
      document.body.appendChild(denied);
      $('denied-signout').addEventListener('click', function(){
        window.VYVE_SUPABASE.client().auth.signOut();
      });
    }
    denied.style.display = 'flex';
  }

  function strictMode(){
    // Configurable via Settings → Auth. Defaults to FALSE so the team isn't locked out
    // before Dean's admin_users table is live.
    return !!(window.VYVE_CONFIG && window.VYVE_CONFIG.auth && window.VYVE_CONFIG.auth.strict);
  }

  async function checkAdmin(session){
    if (!session || !session.user) return false;
    var sb = window.VYVE_SUPABASE.client();
    // Try Dean's is_admin RPC. Behaviour on RPC missing/errored depends on strictMode():
    //   - strictMode true:  deny access (production-safe once Dean's table is live)
    //   - strictMode false: allow access (permissive; default until table is live)
    try {
      var res = await sb.rpc('is_admin');
      if (res && res.error){
        if (strictMode()){
          console.warn('[VYVE/auth] is_admin RPC error in strict mode — denying:', res.error.message);
          return false;
        }
        console.warn('[VYVE/auth] is_admin RPC error:', res.error.message, '— permissive mode (toggle strict in Settings once admin_users table is live)');
        return true;
      }
      return res && res.data === true;
    } catch (e) {
      if (strictMode()){
        console.warn('[VYVE/auth] is_admin RPC threw in strict mode — denying:', e);
        return false;
      }
      console.warn('[VYVE/auth] is_admin RPC threw — permissive mode:', e);
      return true;
    }
  }

  async function handleSession(session){
    if (!session){
      showLogin();
      return;
    }
    var email = (session.user && session.user.email) || '';
    var isAdmin = await checkAdmin(session);
    if (isAdmin){
      showApp(email);
    } else {
      showAccessDenied(email);
    }
  }

  async function init(){
    // Hide app until we know what to show
    var app = $('app');
    var login = $('login');
    if (app) app.classList.remove('ready');
    if (login) login.style.display = 'none';

    var sb = window.VYVE_SUPABASE;
    if (!sb || sb.isStub()){
      // No anon key configured — auth disabled, fall through to open mode (router will show app)
      console.warn('[VYVE/auth] Supabase not configured — running in open (unauthenticated) mode.');
      try { window.dispatchEvent(new CustomEvent('vyve:user', { detail: { email: 'Lewis' } })); } catch(e){}
      return;
    }
    var client = sb.client();
    var res = await client.auth.getSession();
    if (res && res.data){
      await handleSession(res.data.session);
    } else {
      showLogin();
    }
    client.auth.onAuthStateChange(function(_event, session){
      handleSession(session);
    });

    // Login submit
    var btn = $('login-submit');
    if (btn) btn.addEventListener('click', async function(){
      var email = ($('login-email').value || '').trim();
      if (!email){ window.VYVE_UI.toast('Email required','error'); return; }
      btn.disabled = true;
      btn.textContent = 'Sending...';
      var r = await client.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: window.location.origin + '/' }
      });
      btn.disabled = false;
      btn.textContent = 'Send magic link';
      if (r.error){
        window.VYVE_UI.toast(r.error.message, 'error');
      } else {
        window.VYVE_UI.toast('Magic link sent — check your email.', 'success');
      }
    });

    // Sign-out
    var signout = $('signout');
    if (signout) signout.addEventListener('click', async function(){
      await client.auth.signOut();
      // onAuthStateChange will fire and route us to login
    });
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VYVE_AUTH = {
    isWired: function(){ return true; },
    contact: ADMIN_CONTACT
  };
})();
