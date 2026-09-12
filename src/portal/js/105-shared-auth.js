  /* PM-1158: forgot-password + in-page recovery. The recovery link (redirectTo = this page) arrives as
     #access_token=…&type=recovery; the SDK fires SIGNED_IN with a session BEFORE PASSWORD_RECOVERY, so
     showApp() must not open the portal while a recovery is pending — the new password gets set first. */
  var cpRecovery = /type=recovery/.test(window.location.hash);
  /* PM-1208: per-page copy — physio-portal reassigns these before boot(). */
  var CP_LOGIN_LEAD = 'Sign in with your VYVE coach login.', CP_RESET_LEAD = 'Choose a new password for your VYVE login — it works for the coach portal and the app.';
  function showReset(){
    $g('shell').classList.remove('show');
    $g('login-overlay').classList.add('show');
    $g('cp-login-fields').style.display = 'none';
    $g('cp-reset').style.display = '';
    $g('cp-login-lead').textContent = CP_RESET_LEAD;
    $g('login-msg').textContent = '';
  }
  $g('cp-forgot').addEventListener('click', async function(ev){
    ev.preventDefault();
    var email = $g('cp-email').value.trim(), msg = $g('login-msg');
    msg.style.color = '';
    if (!email){ msg.textContent = 'Type your email above first, then tap Forgot your password.'; $g('cp-email').focus(); return; }
    this.textContent = 'Sending\u2026';
    var r = await sb().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
    this.textContent = 'Forgot your password?';
    if (r.error){ msg.textContent = r.error.message; return; }
    msg.style.color = 'var(--success, #3DB89F)';
    msg.textContent = 'Check your inbox \u2014 the reset link brings you straight back here.';
  });
  $g('cp-reset-btn').addEventListener('click', async function(){
    var pw = $g('cp-new-pw').value, pw2 = $g('cp-new-pw2').value, msg = $g('login-msg');
    msg.style.color = '';
    if (pw.length < 8){ msg.textContent = 'Use at least 8 characters.'; return; }
    if (pw !== pw2){ msg.textContent = 'Those don\u2019t match.'; return; }
    this.disabled = true;
    var r = await sb().auth.updateUser({ password: pw });
    this.disabled = false;
    if (r.error){ msg.textContent = r.error.message; return; }
    cpRecovery = false;
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch(_){}
    $g('cp-reset').style.display = 'none'; $g('cp-login-fields').style.display = '';
    $g('cp-login-lead').textContent = CP_LOGIN_LEAD;
    var s = await sb().auth.getSession();
    if (s.data.session) showApp(s.data.session); else showLogin();
  });
  $g('cp-new-pw2').addEventListener('keydown', function(e){ if (e.key === 'Enter') $g('cp-reset-btn').click(); });
  function showApp(sess){
    if (cpRecovery){ showReset(); return; }
    $g('login-overlay').classList.remove('show');
    $g('shell').classList.add('show');
    $g('cp-user-email').textContent = (sess.user && sess.user.email) || '';
    init();
  }
  function showLogin(){
    $g('shell').classList.remove('show');
    $g('login-overlay').classList.add('show');
    inited = false; partnerId = null; vyveScope = false;
  }
  async function boot(){
    var client = sb();
    if (!client){ setTimeout(boot, 200); return; }
    var r = await client.auth.getSession();
    client.auth.onAuthStateChange(function(ev, sess){
      if (ev === 'PASSWORD_RECOVERY'){ cpRecovery = true; showReset(); return; }
      if (sess) showApp(sess); else showLogin();
    });
    if (r.data.session) showApp(r.data.session); else showLogin();
  }
  $g('cp-login-btn').addEventListener('click', async function(){
    var email = $g('cp-email').value.trim(), pw = $g('cp-password').value;
    var msg = $g('login-msg'); msg.textContent = '';
    if (!email || !pw){ msg.textContent = 'Email and password required.'; return; }
    this.disabled = true;
    var r = await sb().auth.signInWithPassword({ email: email, password: pw });
    this.disabled = false;
    if (r.error) msg.textContent = r.error.message === 'Invalid login credentials' ? 'Wrong email or password.' : r.error.message;
  });
  $g('cp-password').addEventListener('keydown', function(e){ if (e.key === 'Enter') $g('cp-login-btn').click(); });
  $g('cp-signout').addEventListener('click', function(){ sb().auth.signOut(); });
  $g('cp-theme-toggle').addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('vyve-coach-theme', next); } catch(_){}
  });
