  function go(view){
    document.querySelectorAll('.cp-item').forEach(function(x){ x.classList.toggle('active', x.dataset.go === view); });
    var show = 'view-soon';
    if (view === 'dashboard') show = 'view-dashboard';
    else if (view === 'clients') show = 'view-clients';
    else if (view === 'profile') show = 'view-profile';
    else if (view === 'settings') show = 'view-settings';
    else if (view === 'exercises') show = 'view-exercises';
    else if (view === 'notifications') show = 'view-notifs';
    else if (view === 'automations') show = 'view-autos';
    else if (view === 'leads') show = 'view-leads';
    else if (view === 'messages') show = 'view-msgs';
    else if (view === 'calendar') show = 'view-cal';
    else if (SECTION_KINDS[view]) show = 'view-plans';
    VIEW_IDS.forEach(function(id){ $c(id).style.display = id === show ? '' : 'none'; });
    if (SECTION_KINDS[view]){
      var kinds = SECTION_KINDS[view];
      var first = null;
      document.querySelectorAll('.pl-kind').forEach(function(b){
        var inSec = kinds.indexOf(b.dataset.kind) >= 0;
        b.style.display = inSec ? '' : 'none';
        if (inSec && !first) first = b;
      });
      if (kinds.indexOf(plKind) < 0 && first) first.click();
      else { plLoad(); }
      loadExerciseNames(); exLoad();
    }
    if (view === 'exercises') exInit();
    if (view === 'notifications') notifLoad(true);
    if (view === 'automations') autoLoad();
    if (view === 'leads') leadsLoad();
    if (view === 'messages') msgInit();
    if (view === 'calendar') calLoad();
    if (view === 'dashboard') renderDashboard();
    if (view === 'profile') renderProfile();
    if (view === 'settings') loadCoachTerms();
    if (SOON_COPY[view]){ $c('soon-title').textContent = SOON_COPY[view][0]; $c('soon-desc').textContent = SOON_COPY[view][1]; }
    var side = $c('cp-side'); if (side) side.classList.remove('open');
    var ov = $c('cp-overlay'); if (ov) ov.classList.remove('show');
  }
  document.querySelectorAll('.cp-item').forEach(function(b){ b.addEventListener('click', function(){ go(b.dataset.go); }); });
  $c('cp-burger').addEventListener('click', function(){ $c('cp-side').classList.toggle('open'); $c('cp-overlay').classList.toggle('show'); });
  $c('cp-overlay').addEventListener('click', function(){ $c('cp-side').classList.remove('open'); $c('cp-overlay').classList.remove('show'); });
  $c('set-theme').addEventListener('click', function(){ $c('cp-theme-toggle').click(); });
  $c('set-signout').addEventListener('click', function(){ $c('cp-signout').click(); });

  // ── Coaching terms editor (PM-956) ─────────────────────────────────────────
  var TERMS_EXAMPLE = '## Coaching Agreement\n\n' +
    '**1. The service.** I provide training programmes, habit plans, nutrition targets and regular check-ins through the VYVE Health app.\n\n' +
    '**2. Payment.** Coaching fees are agreed and paid directly between us, separate from your VYVE app subscription.\n\n' +
    '**3. Your commitment.** Complete your check-ins honestly and tell me about any injury or health change straight away. The programme only works with accurate information.\n\n' +
    '**4. Health disclaimer.** I am not a medical professional and nothing I provide is medical advice. Consult your GP before starting if you have any condition affecting exercise or diet.\n\n' +
    '**5. Ending coaching.** Either of us can end the coaching arrangement with 7 days\u2019 notice. Your VYVE membership and your data in the app are unaffected.';
  var ctCurrentVersion = 0;
  async function loadCoachTerms(){
    var st = $c('ct-status'); st.textContent = 'Loading\u2026';
    try {
      var rows = await rest('/coach_terms?' + pscope() + '&active=eq.true&select=version,content_md&order=version.desc&limit=1');
      if (rows && rows.length){
        ctCurrentVersion = rows[0].version;
        $c('ct-editor').value = rows[0].content_md || '';
        st.textContent = 'Live version: v' + ctCurrentVersion + '. Editing and saving publishes v' + (ctCurrentVersion + 1) + '.';
      } else {
        ctCurrentVersion = 0;
        st.textContent = 'No terms published yet \u2014 new clients currently skip the terms step.';
      }
    } catch(e){ st.textContent = 'Couldn\u2019t load terms: ' + e.message; }
  }
  $c('ct-example').addEventListener('click', function(){
    if ($c('ct-editor').value.trim() && !confirm('Replace what\u2019s in the editor with the example template?')) return;
    $c('ct-editor').value = TERMS_EXAMPLE;
  });
  $c('ct-save').addEventListener('click', async function(){
    var body = $c('ct-editor').value.trim();
    var msg = $c('ct-msg');
    if (!body){ msg.textContent = 'Write your terms first (or load the example).'; return; }
    this.disabled = true; msg.textContent = 'Publishing\u2026';
    try {
      // Versioned publish: retire the active version, insert the next. Fresh max
      // fetched at save time so parallel edits can't collide on version numbers.
      var rows = await rest('/coach_terms?' + pscope() + '&select=version&order=version.desc&limit=1');
      var next = ((rows && rows[0] && rows[0].version) || 0) + 1;
      await rest('/coach_terms?' + pscope() + '&active=eq.true', { method: 'PATCH', body: { active: false } });
      await rest('/coach_terms', { method: 'POST', body: { partner_id: partnerId, version: next, content_md: body, active: true } });
      ctCurrentVersion = next;
      msg.textContent = 'Published v' + next + ' \u2014 new clients see this from now on.';
      $c('ct-status').textContent = 'Live version: v' + next + '. Editing and saving publishes v' + (next + 1) + '.';
    } catch(e){ msg.textContent = 'Publish failed: ' + e.message; }
    this.disabled = false;
  });
  function renderDashboard(){
    var t = { total: roster.length, active: 0, invited: 0, archived: 0 };
    roster.forEach(function(c){ if (t[c.status] !== undefined) t[c.status]++; });
    $c('dash-tiles').innerHTML =
      '<div class="dash-tile"><div class="n">' + t.total + '</div><div class="l">Clients</div></div>' +
      '<div class="dash-tile"><div class="n">' + t.active + '</div><div class="l">Active</div></div>' +
      '<div class="dash-tile"><div class="n">' + t.invited + '</div><div class="l">Invited</div></div>' +
      '<div class="dash-tile"><div class="n">' + t.archived + '</div><div class="l">Archived</div></div>';
    var rec = roster.slice(0, 5);
    $c('dash-recent').innerHTML = rec.length ? rec.map(function(c){
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 2px;border-bottom:1px solid var(--border);">' +
        '<span>' + esc(nameOf(c)) + '</span><span style="color:var(--text-muted);font-size:12px;">' + esc(c.status) + '</span></div>';
    }).join('') : '<div style="color:var(--text-muted);padding:8px 2px;">No clients yet \u2014 add your first from the Clients tab.</div>';
  }
  async function renderProfile(){
    var em = ($c('cp-user-email').textContent || '').trim();
    var rows = [['Email', em || '\u2014']];
    try {
      var p = await rest('/partner_partners?id=eq.' + partnerId + '&select=name,slug,status,partner_type&limit=1');
      if (p && p[0]){ rows.unshift(['Name', p[0].name || '\u2014']); rows.push(['Partner status', p[0].status || '\u2014'], ['Invite link base', 'www.vyvehealth.co.uk/start/\u2026 (per client, on the Clients tab)']); }
    } catch(e){}
    rows.push(['Clients', String(roster.length)]);
    $c('prof-body').innerHTML = rows.map(function(r){ return '<div class="prof-row"><span class="k">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>'; }).join('');
  }
  document.querySelectorAll('.pl-kind').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.pl-kind').forEach(function(x){ x.classList.remove('active'); x.classList.remove('btn-primary'); });
      b.classList.add('active'); b.classList.add('btn-primary');
      plKind = b.dataset.kind;
      $c('pl-editor').style.display = 'none';
      plLoad();
    });
  });
  $c('pl-new').addEventListener('click', function(){ plOpen(null); });
  $c('pl-cancel').addEventListener('click', function(){ $c('pl-editor').style.display = 'none'; });
  $c('pl-save').addEventListener('click', plSave);

  /* PM-1158: forgot-password + in-page recovery. The recovery link (redirectTo = this page) arrives as
     #access_token=…&type=recovery; the SDK fires SIGNED_IN with a session BEFORE PASSWORD_RECOVERY, so
     showApp() must not open the portal while a recovery is pending — the new password gets set first. */
  var cpRecovery = /type=recovery/.test(window.location.hash);
  function showReset(){
    $g('shell').classList.remove('show');
    $g('login-overlay').classList.add('show');
    $g('cp-login-fields').style.display = 'none';
    $g('cp-reset').style.display = '';
    $g('cp-login-lead').textContent = 'Choose a new password for your VYVE login — it works for the coach portal and the app.';
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
    $g('cp-login-lead').textContent = 'Sign in with your VYVE coach login.';
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
