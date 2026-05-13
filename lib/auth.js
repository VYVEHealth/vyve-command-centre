// =====================================================================
// VYVE Command Centre — Auth (PLACEHOLDER)
// Per Dean: use the shared Supabase project (ixjfklpckgxrwjlfsaaz).
//
// PENDING from Dean before this file is wired up:
//   1. Anon publishable key for the shared project
//   2. admin.vyvehealth.co.uk added to allowed redirect URLs
//
// When both are in: uncomment the wiring block, drop the anon key into
// VYVE_CONFIG.supabase.anonKey (settings page or env var), and the magic-link
// flow becomes live. Role gating is a phase-2 conversation.
// =====================================================================

(function(){
  'use strict';

  // Currently a no-op. The login overlay is hidden by router.js so the app is
  // browseable. When auth is wired, this script will: (a) re-show #login if no
  // session, (b) handle magic-link submit, (c) listen for auth state changes
  // and hide/show the app accordingly.

  /* === WIRING (commented out until Dean confirms anon key) ===

  function showLogin()  { document.getElementById('login').style.display = 'flex';
                          document.getElementById('app').classList.remove('ready'); }
  function showApp(email) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').classList.add('ready');
    var el = document.getElementById('user-email');
    if (el) el.textContent = email || '';
  }

  async function init() {
    var sb = window.VYVE_SUPABASE.client();
    var res = await sb.auth.getSession();
    if (res && res.data && res.data.session) {
      showApp(res.data.session.user.email);
    } else {
      showLogin();
    }
    sb.auth.onAuthStateChange(function(_event, session){
      if (session) showApp(session.user.email); else showLogin();
    });
    document.getElementById('login-submit').addEventListener('click', async function(){
      var email = document.getElementById('login-email').value.trim();
      if (!email) return;
      var sb = window.VYVE_SUPABASE.client();
      var { error } = await sb.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) window.VYVE_UI.toast(error.message, 'error');
      else window.VYVE_UI.toast('Check your email for the magic link.', 'success');
    });
    document.getElementById('signout').addEventListener('click', async function(){
      await window.VYVE_SUPABASE.client().auth.signOut();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  =========================================================== */

  window.VYVE_AUTH = {
    isWired: function(){ return false; },
    pending: ['anon key from Dean', 'admin.vyvehealth.co.uk in redirect URLs']
  };
})();
