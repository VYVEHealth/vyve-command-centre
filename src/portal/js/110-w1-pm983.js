  /* ================================================================
     PM-983 WAVE 1 — coach portal overhaul (Kahunas gap-map #1-12 + #38 default forms).
     Function declarations below intentionally shadow the originals above
     (same-scope hoisting: last declaration wins for every call site):
     go, loadClients, renderRoster, renderDashboard. The legacy #cl-editor
     stays in the DOM (hidden via CSS) so the original top-level listeners
     keep their targets — soft-kill, not removal.
     ================================================================ */
  var clExtra = { lastCi: {}, ci7: 0, unrev: {}, unread: {} };
  var clQ = '', clStatus = 'all', clShown = 25;
  var CL_PAGE = 25;
  var DAY_LBL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  function clMode(){ try { return localStorage.getItem('vyve-coach-clmode') || 'list'; } catch(_) { return 'list'; } }
  function clSetMode(m){ try { localStorage.setItem('vyve-coach-clmode', m); } catch(_){} }
  function initials(c){
    var n = nameOf(c) || c.member_email || '?';
    var p = n.trim().split(/\s+/);
    return ((p[0] ? p[0][0] : '') + (p[1] ? p[1][0] : '')).toUpperCase() || '?';
  }

  /* ── loadClients v2: roster + member enrichment + check-in/message context ── */
  async function loadClients(){
    roster = await rest('/coach_clients?' + pscope() + '&order=created_at.desc&select=*') || [];
    memberMap = {};
    if (roster.length){
      try {
        var emails = roster.map(function(c){ return c.member_email; }).join(',');
        var ms = await rest('/members?email=in.(' + encodeURIComponent(emails) + ')&select=email,first_name,last_name,last_active_at,weight_kg,trial_ends_at,subscription_status') || [];
        ms.forEach(function(m){ memberMap[(m.email||'').toLowerCase()] = m; });
      } catch(e){ /* unconsented rows simply not visible — expected */ }
    }
    // Enrichment is never fatal to the roster render.
    clExtra = { lastCi: {}, ci7: 0, unrev: {}, unread: {} };
    try {
      var resp = await rest('/coach_form_responses?' + pscope() + '&order=submitted_at.desc&limit=400&select=member_email,submitted_at,reviewed_at') || [];
      var wk = Date.now() - 7 * 864e5;
      resp.forEach(function(r){
        var em = (r.member_email || '').toLowerCase();
        if (!clExtra.lastCi[em]) clExtra.lastCi[em] = r.submitted_at;
        if (new Date(r.submitted_at).getTime() >= wk) clExtra.ci7++;
        if (!r.reviewed_at) clExtra.unrev[em] = (clExtra.unrev[em] || 0) + 1;
      });
    } catch(_){}
    try {
      var um = await rest('/coach_messages?' + pscope() + '&sender=eq.member&read_at=is.null&select=member_email&limit=200') || [];
      um.forEach(function(r){ var em = (r.member_email||'').toLowerCase(); clExtra.unread[em] = (clExtra.unread[em] || 0) + 1; });
    } catch(_){}
    renderRoster();
  }

  /* ── renderRoster v2: stats strip + search/filter + table|grid + pagination + actions dropdown ── */
  var clToolbarWired = false;
  function clStats(){
    var t = { active: 0, invited: 0, archived: 0, new7: 0, trial7: 0 };
    var wk = Date.now() - 7 * 864e5;
    roster.forEach(function(c){
      if (t[c.status] !== undefined) t[c.status]++;
      if (c.created_at && new Date(c.created_at).getTime() >= wk) t.new7++;
      var m = memberMap[(c.member_email||'').toLowerCase()];
      if (m && m.subscription_status === 'trial' && m.trial_ends_at){
        var d = (new Date(m.trial_ends_at) - Date.now()) / 864e5;
        if (d >= 0 && d <= 7) t.trial7++;
      }
    });
    var unreadTotal = Object.keys(clExtra.unread).reduce(function(a, k){ return a + clExtra.unread[k]; }, 0);
    function tile(n, l){ return '<div class="dash-tile" style="padding:10px 14px;"><div class="n" style="font-size:20px;">' + n + '</div><div class="l">' + l + '</div></div>'; }
    $c('cl-stats').innerHTML = tile(t.active, 'Active') + tile(t.invited, 'Invited') + tile(t.new7, 'New (7d)') + tile(t.archived, 'Archived') + tile(clExtra.ci7, 'Check-ins (7d)') + tile(unreadTotal, 'Unread msgs') + tile(t.trial7, 'Trials ending');
  }
  function clFiltered(){
    var q = clQ.toLowerCase();
    return roster.filter(function(c){
      if (clStatus !== 'all' && c.status !== clStatus) return false;
      if (!q) return true;
      return (nameOf(c) + ' ' + c.member_email).toLowerCase().indexOf(q) >= 0;
    });
  }
  function clRowActions(c){
    var em = esc(c.member_email);
    var items = '<button data-cda="view" data-em="' + em + '" type="button">View profile</button>' +
      '<button data-cda="edit" data-em="' + em + '" type="button">Edit</button>';
    if (c.status === 'active') items += '<button data-cda="message" data-em="' + em + '" type="button">Message</button>';
    if (c.status === 'invited') items += '<button data-cda="resend" data-em="' + em + '" type="button">Resend invite</button>' +
      '<button data-cda="copy_link" data-em="' + em + '" type="button">Copy login link</button>';
    if (c.status !== 'archived') items += '<button data-cda="archive" data-em="' + em + '" class="danger" type="button">Archive</button>';
    else items += '<button data-cda="reactivate" data-em="' + em + '" type="button">Reactivate</button>';
    return '<div class="cl-dd"><button class="btn cl-dd-btn" data-em="' + em + '" type="button" style="font-size:14px;padding:4px 10px;" aria-label="Actions">&#8943;</button><div class="cl-ddm" data-ddm="' + em + '">' + items + '</div></div>';
  }
  function clCellSub(c){
    var em = (c.member_email || '').toLowerCase();
    if (c.status === 'invited') return 'Invited ' + (c.invite_sent_at ? new Date(c.invite_sent_at).toLocaleDateString('en-GB') : '') + (c.invite_count > 1 ? ' \u00b7 ' + c.invite_count + ' invites' : '');
    return esc(c.member_email) + (clExtra.unread[em] ? ' \u00b7 <span style="color:#E8834A;font-weight:700;">' + clExtra.unread[em] + ' unread</span>' : '');
  }
  function clCiDay(c){
    var a = c.assignments || {};
    return (a.checkin_day !== undefined && a.checkin_day !== null) ? DAY_LBL[a.checkin_day] : '\u2014';
  }
  function clLastCi(c){
    var em = (c.member_email || '').toLowerCase();
    var t = clExtra.lastCi[em];
    if (!t) return '<span style="color:var(--text-muted);">\u2014</span>';
    var s = new Date(t).toLocaleDateString('en-GB');
    if (clExtra.unrev[em]) s += ' <span style="color:#E8834A;font-size:10.5px;font-weight:700;">\u25cf</span>';
    return s;
  }
  function renderRoster(){
    clStats();
    var el = $c('cl-list');
    var rows = clFiltered();
    if (!roster.length){ el.innerHTML = '<div class="empty-state"><h3>No clients yet</h3><p>Add your first client to send them their VYVE login.</p></div>'; }
    else if (!rows.length){ el.innerHTML = '<div class="empty-state"><h3>No matches</h3><p>Nothing fits that search or filter.</p></div>'; }
    else {
      var page = rows.slice(0, clShown);
      if (clMode() === 'grid'){
        el.innerHTML = '<div class="cl-grid">' + page.map(function(c){
          return '<div class="cl-gcard"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span class="cl-av">' + esc(initials(c)) + '</span><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nameOf(c)) + '</div><div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + clCellSub(c) + '</div></div>' + clRowActions(c) + '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--text-muted);"><span>Check-in: ' + clCiDay(c) + '</span>' + badge(c.status) + '</div>' +
            '<div style="font-size:11.5px;color:var(--text-muted);margin-top:5px;">Last check-in: ' + clLastCi(c) + '</div></div>';
        }).join('') + '</div>';
      } else {
        el.innerHTML = '<div style="overflow-x:auto;"><table class="cl-tbl"><tr><th></th><th>Client</th><th>Check-in day</th><th>Last check-in</th><th>Status</th><th style="text-align:right;">Actions</th></tr>' +
          page.map(function(c){
            return '<tr><td style="width:38px;"><span class="cl-av">' + esc(initials(c)) + '</span></td>' +
              '<td><div style="font-weight:600;">' + esc(nameOf(c)) + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + clCellSub(c) + '</div></td>' +
              '<td>' + clCiDay(c) + '</td><td>' + clLastCi(c) + '</td><td>' + badge(c.status) + '</td>' +
              '<td style="text-align:right;">' + clRowActions(c) + '</td></tr>';
          }).join('') + '</table></div>';
      }
      if (rows.length > clShown) el.innerHTML += '<div style="text-align:center;margin-top:12px;"><button class="btn" id="cl-more" type="button" style="font-size:12px;">Show more (' + (rows.length - clShown) + ' remaining)</button></div>';
    }
    var more = $c('cl-more');
    if (more) more.addEventListener('click', function(){ clShown += CL_PAGE; renderRoster(); });
    /* PM-1156: the whole card / row opens the client. Profiles were reachable only via the three-dot menu, so tapping a name did nothing. Controls inside the row keep their own handlers. */
    el.querySelectorAll('.cl-gcard, .cl-tbl tr').forEach(function(host){
      var dd = host.querySelector('.cl-dd-btn[data-em]'); if (!dd) return;
      host.style.cursor = 'pointer';
      host.addEventListener('click', function(ev){
        if (ev.target.closest('button, input, a, label, .cl-dd, .cl-ddm')) return;
        viewClient(dd.dataset.em);
      });
    });
    el.querySelectorAll('.cl-dd-btn').forEach(function(b){
      b.addEventListener('click', function(ev){
        ev.stopPropagation();
        var m = el.querySelector('[data-ddm="' + b.dataset.em.replace(/"/g,'\\"') + '"]');
        el.querySelectorAll('.cl-ddm.open').forEach(function(x){ if (x !== m) x.classList.remove('open'); });
        if (m) m.classList.toggle('open');
      });
    });
    el.querySelectorAll('[data-cda]').forEach(function(b){
      b.addEventListener('click', function(ev){
        ev.stopPropagation();
        var a = b.dataset.cda, em = b.dataset.em;
        el.querySelectorAll('.cl-ddm.open').forEach(function(x){ x.classList.remove('open'); });
        if (a === 'view') return viewClient(em);
        if (a === 'edit'){ var c = roster.find(function(x){ return x.member_email === em; }); return wzOpen(c); }
        if (a === 'message'){ go('messages'); return setTimeout(function(){ msgOpen(em.toLowerCase()); }, 250); }
        act(a, em, b);
      });
    });
    if (!clToolbarWired){
      clToolbarWired = true;
      $c('cl-q').addEventListener('input', function(){ clQ = this.value.trim(); clShown = CL_PAGE; renderRoster(); });
      document.querySelectorAll('.cl-st').forEach(function(b){
        b.addEventListener('click', function(){
          document.querySelectorAll('.cl-st').forEach(function(x){ x.classList.remove('active'); x.classList.remove('btn-primary'); });
          b.classList.add('active'); b.classList.add('btn-primary');
          clStatus = b.dataset.st; clShown = CL_PAGE; renderRoster();
        });
      });
      $c('cl-mode').addEventListener('click', function(){
        var next = clMode() === 'list' ? 'grid' : 'list';
        clSetMode(next); this.textContent = next === 'list' ? 'Grid view' : 'List view';
        renderRoster();
      });
      $c('cl-mode').textContent = clMode() === 'list' ? 'Grid view' : 'List view';
      document.addEventListener('click', function(){ document.querySelectorAll('.cl-ddm.open').forEach(function(x){ x.classList.remove('open'); }); });
    }
  }

  /* ── Add / edit client wizard (4 steps) ── */
  var wzStep = 1, wzEditing = null, wzPackPath = '';
  var WZ_TITLES = { 1: 'Personal info', 2: 'Assign plans', 3: 'Forms & check-in rhythm', 4: 'Review' };
  function wzSlotFill(){
    function fill(id, pool, cur, def){
      var el = $c(id); if (!el) return;
      el.innerHTML = '<option value="">None</option>' + pool.map(function(p){
        var sel = cur ? (p.id === cur) : (def && p.is_default);
        return '<option value="' + p.id + '"' + (sel ? ' selected' : '') + '>' + esc(p.label) + '</option>';
      }).join('');
    }
    var a = (wzEditing && wzEditing.assignments) || {};
    fill('wza-workout', lib.tpls.filter(function(t){ return t.kind === 'workout' || t.kind === 'program'; }).map(function(t){ return { id: t.id, label: t.name + (t.kind === 'program' ? ' (programme)' : '') }; }), a.workout_template_id, false);
    fill('wza-habits', lib.tpls.filter(function(t){ return t.kind === 'habits'; }).map(function(t){ return { id: t.id, label: t.name }; }), a.habits_template_id, false);
    fill('wza-nutrition', lib.tpls.filter(function(t){ return t.kind === 'nutrition'; }).map(function(t){ return { id: t.id, label: t.name }; }), a.nutrition_template_id, false);
    fill('wza-supplements', lib.tpls.filter(function(t){ return t.kind === 'supplements'; }).map(function(t){ return { id: t.id, label: t.name }; }), a.supplements_template_id, false);
    fill('wza-onboarding', lib.forms.filter(function(f){ return f.kind === 'onboarding'; }).map(function(f){ return { id: f.id, label: f.title, is_default: f.is_default }; }), a.onboarding_form_id, !wzEditing);
    fill('wza-checkin', lib.forms.filter(function(f){ return f.kind === 'checkin'; }).map(function(f){ return { id: f.id, label: f.title, is_default: f.is_default }; }), a.checkin_form_id, !wzEditing);
  }
  function wzPaint(){
    document.querySelectorAll('.wz-step').forEach(function(s){ s.style.display = parseInt(s.dataset.step) === wzStep ? '' : 'none'; });
    $c('wz-steps').innerHTML = [1,2,3,4].map(function(n){ return '<span class="wz-dot' + (n === wzStep ? ' on' : (n < wzStep ? ' done' : '')) + '">' + n + '</span>'; }).join('');
    $c('wz-title').textContent = (wzEditing ? 'Edit ' + (nameOf(wzEditing) || 'client') : 'New client') + ' \u2014 ' + WZ_TITLES[wzStep];
    $c('wz-back').style.display = wzStep > 1 ? '' : 'none';
    $c('wz-next').style.display = wzStep < 4 ? '' : 'none';
    $c('wz-submit').style.display = wzStep === 4 ? '' : 'none';
    $c('wz-submit').textContent = wzEditing ? 'Save changes' : 'Create & send invite';
    if (wzStep === 4) wzReview();
  }
  function wzReview(){
    var lines = [];
    function line(k, v){ if (v) lines.push('<div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid var(--border);"><span style="min-width:150px;color:var(--text-muted);font-size:12px;">' + k + '</span><span>' + esc(v) + '</span></div>'); }
    line('Name', ($c('wzf-first').value + ' ' + $c('wzf-last').value).trim());
    line('Email', $c('wzf-email').value.trim());
    line('Phone', $c('wzf-phone').value.trim());
    line('Weight unit', $c('wzf-wu').value);
    function selTxt(id){ var el = $c(id); return el.value ? el.options[el.selectedIndex].text : ''; }
    line('Workout plan', selTxt('wza-workout'));
    line('Habits plan', selTxt('wza-habits'));
    line('Nutrition plan', selTxt('wza-nutrition'));
    line('Supplements', selTxt('wza-supplements'));
    line('Onboarding form', selTxt('wza-onboarding'));
    line('Check-in form', selTxt('wza-checkin'));
    line('Check-in rhythm', ($c('wzf-ciday').value !== '' ? DAY_LBL[$c('wzf-ciday').value] + ', ' : '') + $c('wzf-cifreq').value);
    line('Welcome pack', wzPackPath ? 'Attached (PDF)' : '');
    $c('wz-review').innerHTML = lines.join('') || '<p style="color:var(--text-muted);font-size:12.5px;">Nothing set yet.</p>';
    $c('wz-timing').style.display = wzEditing ? 'none' : '';
  }
  function wzOpen(editRow){
    wzEditing = editRow || null; wzStep = 1; wzPackPath = (editRow && editRow.assignments && editRow.assignments._meta && editRow.assignments._meta.welcome_pack_path) || '';
    $c('wz-card').style.display = '';
    $c('wz-msg').textContent = '';
    $c('wzf-pack-status').textContent = wzPackPath ? 'Welcome pack already attached \u2014 upload again to replace.' : '';
    $c('wzf-pack').value = '';
    var m = editRow ? (memberMap[(editRow.member_email||'').toLowerCase()] || {}) : {};
    var meta = (editRow && editRow.assignments && editRow.assignments._meta) || {};
    $c('wzf-first').value = editRow ? (m.first_name || editRow.invited_first_name || '') : '';
    $c('wzf-last').value = editRow ? (m.last_name || editRow.invited_last_name || '') : '';
    $c('wzf-email').value = editRow ? editRow.member_email : '';
    $c('wzf-email').disabled = !!editRow;
    $c('wzf-phone').value = meta.phone || '';
    $c('wzf-dob').value = ''; $c('wzf-gender').value = '';
    $c('wzf-wu').value = meta.weight_unit || 'kg';
    $c('wzf-ciday').value = (editRow && editRow.assignments && editRow.assignments.checkin_day !== undefined && editRow.assignments.checkin_day !== null) ? String(editRow.assignments.checkin_day) : '';
    $c('wzf-cifreq').value = (editRow && editRow.assignments && editRow.assignments.checkin_frequency) || 'weekly';
    wzSlotFill();
    wzPaint();
    $c('wz-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $c('wzf-first').focus();
  }
  function wzClose(){ $c('wz-card').style.display = 'none'; wzEditing = null; }
  $c('wz-close').addEventListener('click', wzClose);
  $c('wz-back').addEventListener('click', function(){ if (wzStep > 1){ wzStep--; wzPaint(); } });
  $c('wz-next').addEventListener('click', function(){
    if (wzStep === 1){
      var fn = $c('wzf-first').value.trim(), em = $c('wzf-email').value.trim().toLowerCase();
      if (!fn || !em || em.indexOf('@') < 0){ $c('wz-msg').textContent = 'First name and a valid email are required.'; return; }
      $c('wz-msg').textContent = '';
    }
    if (wzStep < 4){ wzStep++; wzPaint(); }
  });
  $c('wzf-pack').addEventListener('change', async function(){
    var f = this.files && this.files[0];
    if (!f) return;
    var st = $c('wzf-pack-status');
    if (f.type !== 'application/pdf'){ st.textContent = 'PDF files only.'; return; }
    if (f.size > 10 * 1024 * 1024){ st.textContent = 'Too big \u2014 10MB max.'; return; }
    st.textContent = 'Uploading\u2026';
    try {
      var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      var path = pprefix() + '/pack-' + Date.now() + '-' + safe;
      var up = await sb().storage.from('coach-content').upload(path, f, { contentType: 'application/pdf', upsert: true });
      if (up.error) throw up.error;
      wzPackPath = path;
      st.textContent = f.name + ' \u00b7 uploaded.';
    } catch(e){ st.textContent = 'Upload failed: ' + (e.message || e); }
  });
  function wzAssignSpec(){
    var spec = {};
    function pick(id, slot){ var el = $c(id); if (el && el.value) spec[slot] = el.value; }
    pick('wza-workout', 'workout'); pick('wza-habits', 'habits'); pick('wza-nutrition', 'nutrition');
    pick('wza-supplements', 'supplements'); pick('wza-onboarding', 'onboarding'); pick('wza-checkin', 'checkin');
    if ($c('wzf-ciday').value !== '') spec.checkin_day = parseInt($c('wzf-ciday').value);
    spec.checkin_frequency = $c('wzf-cifreq').value;
    if ($c('wzf-phone').value.trim()) spec.phone = $c('wzf-phone').value.trim();
    spec.weight_unit = $c('wzf-wu').value;
    if (wzPackPath) spec.welcome_pack_path = wzPackPath;
    return spec;
  }
  $c('wz-submit').addEventListener('click', async function(){
    var btn = this, msg = $c('wz-msg');
    var fn = $c('wzf-first').value.trim(), ln = $c('wzf-last').value.trim(), em = $c('wzf-email').value.trim().toLowerCase();
    if (!fn || !em || em.indexOf('@') < 0){ msg.textContent = 'First name and a valid email are required.'; wzStep = 1; wzPaint(); return; }
    btn.disabled = true;
    try {
      if (wzEditing){
        msg.textContent = 'Saving\u2026';
        await ef({ action: 'update_client', email: em, firstName: fn, lastName: ln, dob: $c('wzf-dob').value || null, gender: $c('wzf-gender').value || undefined, weightUnit: $c('wzf-wu').value });
        var spec = wzAssignSpec();
        var asg = {};
        // update_assignments takes resolved key names — map the wizard slots across.
        var KEYMAP = { workout: 'workout_template_id', habits: 'habits_template_id', nutrition: 'nutrition_template_id', supplements: 'supplements_template_id', onboarding: 'onboarding_form_id', checkin: 'checkin_form_id' };
        Object.keys(KEYMAP).forEach(function(s){ if (spec[s]) asg[KEYMAP[s]] = spec[s]; });
        ['checkin_day','checkin_frequency','phone','weight_unit','welcome_pack_path'].forEach(function(k){ if (spec[k] !== undefined) asg[k] = spec[k]; });
        var r = await ef({ action: 'update_assignments', email: em, assignments: asg });
        msg.textContent = 'Saved.' + (r.applied && !r.applied.error ? ' Changes pushed to their app.' : '');
      } else {
        msg.textContent = 'Creating account\u2026';
        var when = document.querySelector('input[name="wz-when"]:checked');
        var sendAt = (when && when.value === 'later' && $c('wzf-sendat').value) ? new Date($c('wzf-sendat').value).toISOString() : null;
        var r2 = await ef({ action: 'create', firstName: fn, lastName: ln, email: em, dob: $c('wzf-dob').value || null, gender: $c('wzf-gender').value || null, assignments: wzAssignSpec(), inviteSendAt: sendAt });
        if (r2.email_scheduled) msg.textContent = 'Account created \u2014 invite scheduled for ' + new Date(r2.email_scheduled).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '.';
        else msg.textContent = r2.email_sent ? 'Invite sent to ' + em + '.' : 'Account created \u2014 email failed, use Copy login link.';
        if (r2.invite_link){ $c('cl-link-row').style.display = ''; $c('cl-link-input').value = r2.invite_link; }
      }
      await loadClients();
      setTimeout(wzClose, 2200);
    } catch(e){ msg.textContent = 'That didn\u2019t work: ' + e.message; }
    btn.disabled = false;
  });
  $c('cl-add-btn').addEventListener('click', function(){ wzOpen(null); });
  $c('qa-client').addEventListener('click', function(){ go('clients'); wzOpen(null); });
  $c('qa-workout').addEventListener('click', function(){ go('kindsel:program'); setTimeout(function(){ var b = $c('pl-new'); if (b) b.click(); }, 300); });
  $c('qa-nutrition').addEventListener('click', function(){ go('kindsel:nutrition'); setTimeout(function(){ var b = $c('pl-new'); if (b) b.click(); }, 300); });

  /* ── Dashboard v2: tiles + latest clients / check-ins / messages ── */
  async function renderDashboard(){
    var t = { total: roster.length, active: 0, invited: 0, archived: 0 };
    roster.forEach(function(c){ if (t[c.status] !== undefined) t[c.status]++; });
    $c('dash-tiles').innerHTML =
      '<div class="dash-tile"><div class="n">' + t.total + '</div><div class="l">Clients</div></div>' +
      '<div class="dash-tile"><div class="n">' + t.active + '</div><div class="l">Active</div></div>' +
      '<div class="dash-tile"><div class="n">' + t.invited + '</div><div class="l">Invited</div></div>' +
      '<div class="dash-tile"><div class="n">' + clExtra.ci7 + '</div><div class="l">Check-ins (7d)</div></div>';
    var rec = roster.slice(0, 5);
    $c('dash-recent').innerHTML = rec.length ? rec.map(function(c){
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--border);">' +
        '<span class="cl-av">' + esc(initials(c)) + '</span><span style="flex:1;">' + esc(nameOf(c)) + '</span>' + badge(c.status) +
        (c.status === 'active' ? '<button class="btn dr-msg" data-em="' + esc(c.member_email) + '" type="button" style="font-size:11px;">Message</button>' : '') +
        '<button class="btn dr-view" data-em="' + esc(c.member_email) + '" type="button" style="font-size:11px;">View</button></div>';
    }).join('') : '<div style="color:var(--text-muted);padding:8px 2px;">No clients yet \u2014 add your first with the button above.</div>';
    $c('dash-recent').querySelectorAll('.dr-view').forEach(function(b){ b.addEventListener('click', function(){ go('clients'); viewClient(b.dataset.em); }); });
    $c('dash-recent').querySelectorAll('.dr-msg').forEach(function(b){ b.addEventListener('click', function(){ go('messages'); setTimeout(function(){ msgOpen(b.dataset.em.toLowerCase()); }, 250); }); });
    // Latest check-ins
    try {
      var resp = await rest('/coach_form_responses?' + pscope() + '&order=submitted_at.desc&limit=5&select=member_email,form_id,week_start,submitted_at,reviewed_at') || [];
      $c('dash-checkins').innerHTML = resp.length ? resp.map(function(r){
        var c = roster.find(function(x){ return x.member_email === r.member_email; }) || { member_email: r.member_email };
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--border);">' +
          '<span style="flex:1;"><strong>' + esc(nameOf(c)) + '</strong> \u00b7 ' + new Date(r.submitted_at).toLocaleDateString('en-GB') + (r.week_start ? ' (w/c ' + r.week_start + ')' : '') + '</span>' +
          (r.reviewed_at ? '<span class="src-tag src-mine">Reviewed</span>' : '<span style="color:#E8834A;font-size:11px;font-weight:700;">\u25cf needs review</span>') +
          '<button class="btn dc-rev" data-em="' + esc(r.member_email) + '" type="button" style="font-size:11px;">Open</button></div>';
      }).join('') : '<p style="font-size:12.5px;color:var(--text-muted);">No check-ins yet.</p>';
      $c('dash-checkins').querySelectorAll('.dc-rev').forEach(function(b){
        b.addEventListener('click', function(){
          go('clients'); viewClient(b.dataset.em);
          setTimeout(function(){ var x = $c('cd-checkins'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
        });
      });
    } catch(_){ $c('dash-checkins').innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Couldn\u2019t load check-ins.</p>'; }
    // Latest messages
    try {
      var ms = await rest('/coach_messages?' + pscope() + '&order=created_at.desc&limit=5&select=member_email,sender,body,created_at,read_at') || [];
      $c('dash-msgs').innerHTML = ms.length ? ms.map(function(m){
        var c = roster.find(function(x){ return (x.member_email||'').toLowerCase() === (m.member_email||'').toLowerCase(); }) || { member_email: m.member_email };
        var unread = m.sender === 'member' && !m.read_at;
        return '<div class="dm-row" data-em="' + esc((m.member_email||'').toLowerCase()) + '" style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--border);cursor:pointer;">' +
          '<span class="cl-av">' + esc(initials(c)) + '</span><span style="flex:1;min-width:0;"><strong>' + esc(nameOf(c)) + '</strong>' + (m.sender === 'coach' ? ' <span style="font-size:10.5px;color:var(--text-muted);">(you)</span>' : '') + '<div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(m.body.slice(0, 80)) + '</div></span>' +
          (unread ? '<span style="background:#E8834A;color:#fff;border-radius:99px;font-size:9.5px;font-weight:800;padding:2px 7px;">NEW</span>' : '') +
          '<span style="font-size:11px;color:var(--text-muted);">' + new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</span></div>';
      }).join('') : '<p style="font-size:12.5px;color:var(--text-muted);">No messages yet.</p>';
      $c('dash-msgs').querySelectorAll('.dm-row').forEach(function(r){ r.addEventListener('click', function(){ go('messages'); setTimeout(function(){ msgOpen(r.dataset.em); }, 250); }); });
    } catch(_){ $c('dash-msgs').innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Couldn\u2019t load messages.</p>'; }
  }

  /* ── Bell popover ── */
  var bellTab = 'all';
  function bellRender(){
    var pop = $c('cp-bell-pop');
    var seen = nfSeen();
    var rows = nfEvents.filter(function(e){ return bellTab === 'all' || e.kind === bellTab; }).slice(0, 10);
    var tabs = '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">' +
      [['all','All'],['checkin','Check-ins'],['workout','Workouts'],['client','Clients']].map(function(t){
        return '<button class="bell-tab' + (bellTab === t[0] ? ' on' : '') + '" data-bt="' + t[0] + '" type="button">' + t[1] + '</button>';
      }).join('') + '</div>';
    var list = rows.length ? rows.map(function(e){
      var who = nameOf(roster.find(function(c){ return c.member_email === e.email; }) || { member_email: e.email });
      var fresh = !seen || e.t > seen;
      return '<div style="padding:8px 6px;border-bottom:1px solid var(--border);' + (fresh ? 'background:rgba(27,120,120,.06);border-radius:8px;' : '') + '"><div style="font-size:12.5px;"><strong>' + esc(who) + '</strong> \u2014 ' + esc(e.title) + '</div><div style="font-size:10.5px;color:var(--text-muted);">' + (e.when ? esc(e.when) : new Date(e.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + new Date(e.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) + '</div></div>';
    }).join('') : '<p style="font-size:12.5px;color:var(--text-muted);padding:8px 4px;">Nothing here yet.</p>';
    pop.innerHTML = tabs + list +
      '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn" id="bell-markread" type="button" style="font-size:11.5px;flex:1;">Mark all read</button><button class="btn" id="bell-feed" type="button" style="font-size:11.5px;flex:1;">Open feed</button></div>';
    pop.querySelectorAll('.bell-tab').forEach(function(b){ b.addEventListener('click', function(ev){ ev.stopPropagation(); bellTab = b.dataset.bt; bellRender(); }); });
    $c('bell-markread').addEventListener('click', function(ev){
      ev.stopPropagation();
      try { localStorage.setItem(nfSeenKey(), new Date().toISOString()); } catch(_){}
      nfBadge(); bellBadge(); bellRender();
    });
    $c('bell-feed').addEventListener('click', function(){ $c('cp-bell-pop').style.display = 'none'; go('notifications'); });
  }
  function bellBadge(){
    var seen = nfSeen();
    var n = nfEvents.filter(function(e){ return !seen || e.t > seen; }).length;
    var b = $c('cp-bell-badge');
    b.textContent = n > 20 ? '20+' : String(n);
    b.style.display = n ? '' : 'none';
  }
  $c('cp-bell').addEventListener('click', async function(ev){
    ev.stopPropagation();
    var pop = $c('cp-bell-pop');
    if (pop.style.display !== 'none'){ pop.style.display = 'none'; return; }
    pop.style.display = '';
    pop.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);padding:8px 4px;">Loading\u2026</p>';
    try { await notifLoad(false); } catch(_){}
    bellRender();
    /* PM-1218: opening the bell counts as seeing it — highlight the new rows this once, then clear the mark so the badge drops and the next open is calm ("Mark all read" stays for the feed). */
    try { localStorage.setItem(nfSeenKey(), new Date().toISOString()); } catch(_){}
    bellBadge(); nfBadge();
  });
  document.addEventListener('click', function(e){
    var pop = $c('cp-bell-pop');
    if (pop.style.display !== 'none' && !pop.contains(e.target) && e.target !== $c('cp-bell')) pop.style.display = 'none';
  });
  // Keep the header badge in step whenever the sidebar badge updates.
  setInterval(function(){ if (nfEvents.length || nfLoadedAt) bellBadge(); }, 20000);

  /* ── Messages: broadcast + new-message picker ── */
  $c('msg-bcast').addEventListener('click', function(){
    var p = $c('bc-panel');
    p.style.display = p.style.display === 'none' ? '' : 'none';
    $c('nm-panel').style.display = 'none';
  });
  $c('bc-cancel').addEventListener('click', function(){ $c('bc-panel').style.display = 'none'; $c('bc-msg').textContent = ''; });
  $c('bc-send').addEventListener('click', async function(){
    var body = $c('bc-text').value.trim();
    var msg = $c('bc-msg');
    if (!body){ msg.textContent = 'Write the message first.'; return; }
    var actives = roster.filter(function(c){ return c.status === 'active'; });
    if (!actives.length){ msg.textContent = 'No active clients to send to.'; return; }
    if (!confirm('Send this to all ' + actives.length + ' active client' + (actives.length === 1 ? '' : 's') + '? Each gets it as a message from you in their app.')) return;
    this.disabled = true; msg.textContent = 'Sending\u2026';
    var sent = 0;
    for (var i = 0; i < actives.length; i++){
      try {
        await rest('/coach_messages', { method: 'POST', body: { partner_id: partnerId, member_email: actives[i].member_email, sender: 'coach', body: body } });
        sent++;
        msg.textContent = 'Sending\u2026 ' + sent + '/' + actives.length;
      } catch(_){}
    }
    msg.textContent = 'Sent to ' + sent + ' of ' + actives.length + ' clients.';
    $c('bc-text').value = '';
    this.disabled = false;
    setTimeout(function(){ $c('bc-panel').style.display = 'none'; $c('bc-msg').textContent = ''; }, 2500);
  });
  $c('msg-new').addEventListener('click', function(){
    var p = $c('nm-panel');
    if (p.style.display !== 'none'){ p.style.display = 'none'; return; }
    var actives = roster.filter(function(c){ return c.status === 'active'; });
    $c('nm-client').innerHTML = actives.length ? actives.map(function(c){ return '<option value="' + esc((c.member_email||'').toLowerCase()) + '">' + esc(nameOf(c)) + '</option>'; }).join('') : '<option value="">No active clients</option>';
    p.style.display = 'flex';
    $c('bc-panel').style.display = 'none';
  });
  $c('nm-open').addEventListener('click', function(){
    var em = $c('nm-client').value;
    if (em){ $c('nm-panel').style.display = 'none'; msgOpen(em); }
  });

  /* ── Roster check-ins page ── */
  var ciLoaded = false;
  async function ciLoad(){
    var host = $c('ci-table');
    host.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    var resp = [], formMap = {};
    try {
      resp = await rest('/coach_form_responses?' + pscope() + '&order=submitted_at.desc&limit=100&select=id,member_email,form_id,week_start,submitted_at,reviewed_at') || [];
      var ids = [];
      resp.forEach(function(r){ if (r.form_id && ids.indexOf(r.form_id) < 0) ids.push(r.form_id); });
      if (ids.length){
        (await rest('/coach_forms?id=in.(' + ids.map(function(i){ return '"' + i + '"'; }).join(',') + ')&select=id,title,kind') || []).forEach(function(f){ formMap[f.id] = f; });
      }
    } catch(e){ host.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Couldn\u2019t load: ' + esc(e.message) + '</p>'; return; }
    function paint(){
      var unrevOnly = $c('ci-unrev').checked;
      var rows = unrevOnly ? resp.filter(function(r){ return !r.reviewed_at; }) : resp;
      if (!rows.length){ host.innerHTML = '<div class="empty-state"><h3>' + (unrevOnly ? 'All reviewed' : 'No check-ins yet') + '</h3><p>' + (unrevOnly ? 'Nothing waiting on you.' : 'Submissions land here as your clients check in.') + '</p></div>'; return; }
      host.innerHTML = '<div style="overflow-x:auto;"><table class="cl-tbl"><tr><th>Client</th><th>Form</th><th>Week</th><th>Submitted</th><th>Status</th><th style="text-align:right;"></th></tr>' +
        rows.map(function(r){
          var c = roster.find(function(x){ return x.member_email === r.member_email; }) || { member_email: r.member_email };
          var f = formMap[r.form_id] || {};
          var d = new Date(r.submitted_at);
          return '<tr><td><div style="display:flex;align-items:center;gap:8px;"><span class="cl-av" style="width:26px;height:26px;font-size:10px;">' + esc(initials(c)) + '</span><strong>' + esc(nameOf(c)) + '</strong></div></td>' +
            '<td>' + esc(f.title || (f.kind === 'onboarding' ? 'Onboarding' : 'Check-in')) + '</td>' +
            '<td>' + (r.week_start ? 'w/c ' + r.week_start : '\u2014') + '</td>' +
            '<td>' + d.toLocaleDateString('en-GB') + ' <span style="color:var(--text-muted);font-size:11px;">' + d.toLocaleDateString('en-GB', { weekday: 'short' }) + '</span></td>' +
            '<td>' + (r.reviewed_at ? '<span class="src-tag src-mine">Reviewed</span>' : '<span style="color:#E8834A;font-size:11px;font-weight:700;">\u25cf needs review</span>') + '</td>' +
            '<td style="text-align:right;"><button class="btn ci-open" data-em="' + esc(r.member_email) + '" type="button" style="font-size:11.5px;">Review</button></td></tr>';
        }).join('') + '</table></div>';
      host.querySelectorAll('.ci-open').forEach(function(b){
        b.addEventListener('click', function(){
          go('clients'); viewClient(b.dataset.em);
          setTimeout(function(){ var x = $c('cd-checkins'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
        });
      });
    }
    if (!ciLoaded){ ciLoaded = true; $c('ci-unrev').addEventListener('change', paint); }
    paint();
  }

  /* ── Daily check-ins grid (roster × Mon-Sun) ── */
  var dgOffset = 0, dgWired = false;
  function dgMonday(offset){
    var d = new Date();
    var dow = (d.getDay() + 6) % 7; // 0 = Monday
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - dow + offset * 7);
    return d;
  }
  function dgFmt(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  async function dgLoad(){
    if (!dgWired){
      dgWired = true;
      $c('dg-prev').addEventListener('click', function(){ dgOffset--; dgLoad(); });
      $c('dg-next').addEventListener('click', function(){ if (dgOffset < 0) { dgOffset++; dgLoad(); } });
      $c('dg-today').addEventListener('click', function(){ dgOffset = 0; dgLoad(); });
    }
    var mon = dgMonday(dgOffset), sun = new Date(mon.getTime() + 6 * 864e5);
    $c('dg-range').textContent = mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' \u2013 ' + sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + (dgOffset === 0 ? ' (this week)' : '');
    var host = $c('dg-grid');
    var actives = roster.filter(function(c){ return c.status === 'active' && c.consent_accepted_at; });
    if (!actives.length){ host.innerHTML = '<div class="empty-state"><h3>No active clients</h3><p>Daily habit tracking appears once clients are active.</p></div>'; return; }
    host.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    var emails = actives.map(function(c){ return c.member_email; });
    var inList = encodeURIComponent(emails.join(','));
    var byKey = {}, targetBy = {}, noteBy = {}; // PM-984: #43 client daily notes
    try {
      var res = await Promise.all([
        rest('/daily_habits?member_email=in.(' + inList + ')&activity_date=gte.' + dgFmt(mon) + '&activity_date=lte.' + dgFmt(sun) + '&select=member_email,activity_date,habit_completed,note&limit=1000'),
        rest('/member_habits?member_email=in.(' + inList + ')&active=eq.true&select=member_email&limit=500')
      ]);
      (res[0] || []).forEach(function(r){
        var k = (r.member_email||'').toLowerCase() + '|' + r.activity_date;
        if (r.note) (noteBy[k] = noteBy[k] || []).push(r.note); // PM-984
        if (r.habit_completed === false) return;
        byKey[k] = (byKey[k] || 0) + 1;
      });
      (res[1] || []).forEach(function(r){ var em = (r.member_email||'').toLowerCase(); targetBy[em] = (targetBy[em] || 0) + 1; });
    } catch(e){ host.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Couldn\u2019t load: ' + esc(e.message) + '</p>'; return; }
    var days = [];
    for (var i = 0; i < 7; i++){ var d = new Date(mon.getTime() + i * 864e5); days.push({ ds: dgFmt(d), lbl: d.toLocaleDateString('en-GB', { weekday: 'short' }) }); }
    var todayStr = dgFmt(new Date());
    host.innerHTML = '<div style="overflow-x:auto;"><table class="cl-tbl" style="min-width:560px;"><tr><th>Client</th>' +
      days.map(function(dy){ return '<th style="text-align:center;' + (dy.ds === todayStr ? 'color:var(--teal-lt);' : '') + '">' + dy.lbl + '</th>'; }).join('') + '</tr>' +
      actives.map(function(c){
        var em = (c.member_email||'').toLowerCase();
        var target = targetBy[em] || 0;
        var cells = days.map(function(dy){
          if (dy.ds > todayStr) return '<td class="dg-cell" style="color:var(--text-muted);">\u00b7</td>';
          var k = byKey[em + '|' + dy.ds] || 0;
          if (!k) return '<td class="dg-cell" style="color:var(--text-muted);">\u2014</td>';
          var col = target ? (k >= target ? '#3DB89F' : '#E8834A') : 'var(--teal-lt)';
          var nts = noteBy[em + '|' + dy.ds]; // PM-984: hover/long-press shows the client's note
          var mark = nts ? '<span title="' + esc(nts.join(' \u00b7 ')) + '" style="color:var(--vyve-gold,#C9A84C);font-weight:800;cursor:help;">\u270e</span>' : '';
          return '<td class="dg-cell" style="color:' + col + ';" ' + (nts ? 'title="' + esc(nts.join(' \u00b7 ')) + '"' : '') + '>' + k + (target ? '/' + target : '') + mark + '</td>';
        }).join('');
        return '<tr><td><div style="display:flex;align-items:center;gap:8px;"><span class="cl-av" style="width:26px;height:26px;font-size:10px;">' + esc(initials(c)) + '</span><strong>' + esc(nameOf(c)) + '</strong></div></td>' + cells + '</tr>';
      }).join('') + '</table></div>' +
      '<p style="font-size:11.5px;color:var(--text-muted);margin-top:8px;">Numbers show habits logged each day' + ' \u2014 green when they hit their full set, amber when partial. \u270e marks a day with a note from your client \u2014 hover or long-press to read it.</p>';
  }

  /* ── Sidebar: group toggles + router v2 ── */
  document.querySelectorAll('.cp-ghead').forEach(function(h){
    h.addEventListener('click', function(){
      var sub = document.querySelector('.cp-sub[data-sub="' + h.dataset.grp + '"]');
      var open = sub.classList.contains('open');
      h.classList.toggle('open', !open);
      if (sub) sub.classList.toggle('open', !open);
    });
  });
  var goFromHash = false;
  function go(view){
    if (!goFromHash){ try { history.replaceState(null, '', '#' + view); } catch(_){} }
    document.querySelectorAll('.cp-item').forEach(function(x){ x.classList.toggle('active', x.dataset.go === view); });
    // auto-open the group that owns the active sub-item
    var activeSub = document.querySelector('.cp-subitem[data-go="' + String(view).replace(/"/g, '') + '"]');
    if (activeSub){
      var sub = activeSub.closest('.cp-sub');
      if (sub && !sub.classList.contains('open')){
        sub.classList.add('open');
        var h = document.querySelector('.cp-ghead[data-grp="' + sub.dataset.sub + '"]');
        if (h) h.classList.add('open');
      }
    }
    var V = ['view-dashboard','view-clients','view-leads','view-msgs','view-cal','view-plans','view-exercises','view-notifs','view-autos','view-profile','view-soon','view-settings','view-ci','view-daily'];
    var kindSel = null;
    var show = 'view-soon';
    if (view === 'dashboard') show = 'view-dashboard';
    else if (view === 'clients') show = 'view-clients';
    else if (view === 'clients_checkins') show = 'view-ci';
    else if (view === 'clients_daily') show = 'view-daily';
    else if (view === 'profile') show = 'view-profile';
    else if (view === 'settings' || view === 'terms') show = 'view-settings';
    else if (view === 'exercises') show = 'view-exercises';
    else if (view === 'notifications') show = 'view-notifs';
    else if (view === 'automations') show = 'view-autos';
    else if (view === 'leads') show = 'view-leads';
    else if (view === 'messages') show = 'view-msgs';
    else if (view === 'calendar') show = 'view-cal';
    else if (String(view).indexOf('kindsel:') === 0){ show = 'view-plans'; kindSel = String(view).slice(8); }
    else if (SECTION_KINDS[view]) show = 'view-plans';
    V.forEach(function(id){ var e = $c(id); if (e) e.style.display = id === show ? '' : 'none'; });
    if (kindSel){
      var target = null;
      document.querySelectorAll('.pl-kind').forEach(function(b){
        var on = b.dataset.kind === kindSel;
        b.style.display = on ? '' : 'none';
        if (on) target = b;
      });
      if (target) target.click();
      loadExerciseNames(); exLoad();
    } else if (SECTION_KINDS[view]){
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
    if (view === 'terms'){ loadCoachTerms(); setTimeout(function(){ var x = $c('ct-editor'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); }
    if (view === 'clients_checkins') ciLoad();
    if (view === 'clients_daily') dgLoad();
    if (SOON_COPY[view]){ $c('soon-title').textContent = SOON_COPY[view][0]; $c('soon-desc').textContent = SOON_COPY[view][1]; }
    var side = $c('cp-side'); if (side) side.classList.remove('open');
    var ov = $c('cp-overlay'); if (ov) ov.classList.remove('show');
  }
  /* PM-983c: hash deep-links — #clients, #clients_checkins, #kindsel:program etc.
     Back/forward + bookmarkable sections without splitting the SPA. */
  var HASH_OK = /^(dashboard|clients|clients_checkins|clients_daily|profile|settings|terms|exercises|notifications|automations|leads|messages|calendar|content|kindsel:(onboarding|checkin|lead|habits|program|workout|workout_day|nutrition|supplements))$/;
  function hashView(){
    var h = decodeURIComponent((location.hash || '').slice(1));
    return HASH_OK.test(h) ? h : null;
  }
  window.addEventListener('hashchange', function(){
    var v = hashView();
    if (!v) return;
    goFromHash = true;
    try { go(v); } finally { goFromHash = false; }
  });
  // Deep link on load: init() lands on dashboard by default; honour a valid hash instead.
  (function(){
    var v = hashView();
    if (!v || v === 'dashboard') return;
    var t = setInterval(function(){
      if (!partnerId && !vyveScope) return; // wait for init (scope resolved)
      clearInterval(t);
      goFromHash = true;
      try { go(v); } finally { goFromHash = false; }
    }, 300);
    setTimeout(function(){ clearInterval(t); }, 15000);
  })();
  /* ============================ end PM-983 Wave 1 ============================ */

