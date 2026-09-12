  /* =========================================================================
     PM-987 WAVE 5 — client detail restructure (gap-map #50-61 + slim #46).
     viewClient SHADOWED below (same-scope redeclaration, last-wins hoisting —
     every existing caller, incl. the PM-955 act(), Wave-1 act shadow, dashboard
     and notification deep-links, now lands here). The PM-955 original above is
     legacy-dead but NOT deleted (soft-kill rule). #cl-detail-card / #cl-detail-body
     ids are reused as the host. Tabs: Overview / Check-ins / Gallery / Q&A /
     Nutrition / Workouts / Habits / Logs / Goals / Plans. Slim #46 gates =
     load_calc + exercise_library only (both member-enforced on OTA 587); water
     goal is assignments.water_goal. All writes ride coach-provision-client v10
     (assignments) or RLS-direct (notes, goals, events, message popover, answer
     edits). Edit the versions in THIS zone in future waves.
     ========================================================================= */
  (function w5css(){
    var s = document.createElement('style');
    s.textContent =
      '.w5-head{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:12px}' +
      '.w5-av{width:52px;height:52px;border-radius:50%;background:var(--vyve-teal,#1B7878);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;letter-spacing:.03em}' +
      '.w5-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:10px 0 14px}' +
      '.w5-tile{border:1px solid var(--border);border-radius:10px;padding:8px 10px}' +
      '.w5-tile b{display:block;font-size:15px} .w5-tile span{font-size:10.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}' +
      '.w5-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--border);margin-bottom:14px}' +
      '.w5-tab{padding:8px 12px;font-size:12.5px;font-weight:600;color:var(--text-muted);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent}' +
      '.w5-tab.on{color:var(--text);border-bottom-color:var(--vyve-teal,#1B7878)}' +
      '.w5-sec{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px}' +
      '.w5-box{border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px}' +
      '.w5-ci-table{width:100%;border-collapse:collapse;font-size:11.5px;min-width:520px}' +
      '.w5-ci-table th{ text-align:left;color:var(--text-muted);font-weight:600;padding:6px;white-space:nowrap}' +
      '.w5-ci-table td{padding:6px;border-top:1px solid var(--border);white-space:nowrap}' +
      '.w5-dot{display:inline-block;width:8px;height:8px;border-radius:50%}' +
      '.w5-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;background:var(--surface-2,#123);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-size:12.5px;z-index:9000;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
      '.w5-chat-fab{position:fixed;right:22px;bottom:22px;z-index:8900;background:var(--vyve-teal,#1B7878);color:#fff;border:none;border-radius:50%;width:50px;height:50px;font-size:20px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.3)}' +
      '.w5-chat{position:fixed;right:22px;bottom:82px;z-index:8901;width:min(330px,88vw);height:400px;background:var(--surface,#0f2323);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;box-shadow:0 10px 26px rgba(0,0,0,.35)}' +
      '.w5-chat-log{flex:1;overflow-y:auto;padding:10px;font-size:12.5px}' +
      '.w5-msg{max-width:82%;padding:7px 10px;border-radius:9px;margin-bottom:6px;word-wrap:break-word}' +
      '.w5-msg.me{background:var(--vyve-teal,#1B7878);color:#fff;margin-left:auto}' +
      '.w5-msg.them{background:var(--surface-2);}' +
      '.w5-modal{position:fixed;inset:0;z-index:8950;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:18px}' +
      '.w5-modal-card{background:var(--surface,#0f2323);border:1px solid var(--border);border-radius:12px;max-width:560px;width:100%;max-height:86vh;overflow-y:auto;padding:18px}';
    document.head.appendChild(s);
  })();

  var w5 = { c: null, member: {}, weights: [], resp: [], forms: {}, tab: 'overview', cache: {}, chatTimer: null, logsWeek: 0 };
  var W5_DIFF = { 1: 'Easy', 2: 'Fine', 3: 'Solid', 4: 'Hard', 5: 'Brutal' };
  var W5_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  function w5fmt(t){ var d = new Date(t); return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }
  function w5day(t){ return new Date(t).toLocaleDateString('en-GB'); }
  function w5toast(txt){
    var t = document.createElement('div'); t.className = 'w5-toast'; t.textContent = txt;
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 6000);
  }
  function w5consented(){ return w5.c && w5.c.status === 'active' && w5.c.consent_accepted_at; }

  async function viewClient(em){ // PM-987 SHADOW — tabbed client workspace
    var c = roster.find(function(x){ return x.member_email === em; });
    if (!c){ try { await loadClients(); } catch(_){} c = roster.find(function(x){ return x.member_email === em; }); if (!c) return; }
    w5.c = c; w5.tab = 'overview'; w5.cache = {}; w5.logsWeek = 0;
    if (w5.chatTimer){ clearInterval(w5.chatTimer); w5.chatTimer = null; }
    $c('cl-detail-card').style.display = '';
    $c('cl-detail-name').textContent = nameOf(c);
    var body = $c('cl-detail-body');
    body.innerHTML = '<p style="color:var(--text-muted);font-size:12.5px;">Loading\u2026</p>';
    /* PM-1156: the workspace card sits BELOW the roster + bulk-upload cards — with a page of clients it opened off-screen and looked like nothing happened. */
    try { $c('cl-detail-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_){}
    try {
    if (!lib.tpls.length && !lib.forms.length){ try { await loadLibraries(); } catch(_){} }
    var enc = encodeURIComponent(em);
    var res = await Promise.all([
      rest('/members?email=eq.' + enc + '&select=first_name,last_name,dob,last_active_at,trial_ends_at,subscription_status,macro_override,tdee_target,weight_kg').catch(function(){ return []; }),
      w5consented() ? rest('/weight_logs?member_email=eq.' + enc + '&order=logged_at.desc&limit=400&select=weight_kg,logged_at,logged_date').catch(function(){ return []; }) : Promise.resolve([]),
      rest('/coach_form_responses?member_email=eq.' + enc + '&' + pscope() + '&order=submitted_at.desc&limit=40&select=id,form_id,answers,week_start,submitted_at,reviewed_at').catch(function(){ return []; })
    ]);
    w5.member = (res[0] || [])[0] || {};
    w5.weights = res[1] || [];
    w5.resp = res[2] || [];
    w5.forms = {};
    var fids = []; w5.resp.forEach(function(r){ if (r.form_id && fids.indexOf(r.form_id) < 0) fids.push(r.form_id); });
    if (fids.length){
      try {
        (await rest('/coach_forms?id=in.(' + fids.map(function(i){ return '"' + i + '"'; }).join(',') + ')&select=id,kind,title,questions') || []).forEach(function(f){ w5.forms[f.id] = f; });
      } catch(_){}
    }
    w5RenderShell();
    w5Tab('overview');
    // #54 — contextual check-in-day banner
    var asg = c.assignments || {};
    if (asg.checkin_day != null && w5consented()){
      var today = (new Date().getDay() + 6) % 7; // 0=Mon
      var diff = (asg.checkin_day - today + 7) % 7;
      var when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : W5_DAYS[asg.checkin_day] + ' (in ' + diff + ' days)';
      w5toast((c.invited_first_name || 'Their') + (c.invited_first_name ? '\u2019s' : '') + ' check-in day is ' + when + '.');
    }
    } catch(e){
      /* PM-1156: a render fault used to leave "Loading…" or nothing — surface it. */
      console.error('viewClient', e);
      body.innerHTML = '<p style="color:#E8834A;font-size:12.5px;">Couldn\u2019t open this client: ' + esc(e && e.message || e) + '</p>';
      w5toast('Couldn\u2019t open this client \u2014 ' + (e && e.message || e));
    }
  }

  function w5RenderShell(){
    var c = w5.c, m = w5.member, asg = c.assignments || {};
    var body = $c('cl-detail-body');
    var initials = ((c.invited_first_name || m.first_name || '?')[0] || '?').toUpperCase() + ((c.invited_last_name || m.last_name || '')[0] || '').toUpperCase();
    var age = '';
    if (m.dob){ var b = new Date(m.dob), n = new Date(); var a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; age = a; }
    var startW = w5.weights.length ? w5.weights[w5.weights.length - 1].weight_kg : null;
    var curW = w5.weights.length ? w5.weights[0].weight_kg : (m.weight_kg || null);
    var delta = (startW != null && curW != null) ? Math.round((curW - startW) * 10) / 10 : null;
    var weeks = '';
    var since = c.consent_accepted_at || c.created_at;
    if (since) weeks = Math.max(1, Math.ceil((Date.now() - new Date(since).getTime()) / (7 * 864e5)));
    var badge = c.status === 'active' ? '#3DB89F' : c.status === 'archived' ? 'var(--text-muted)' : '#E8834A';
    var head =
      '<div class="w5-head">' +
        '<div class="w5-av">' + esc(initials) + '</div>' +
        '<div style="flex:1;min-width:180px;">' +
          '<div style="font-size:15px;font-weight:700;">' + esc(nameOf(c)) + ' <span class="w5-dot" style="background:' + badge + ';margin-left:4px;"></span> <span style="font-size:11px;color:var(--text-muted);font-weight:600;">' + esc(c.status) + '</span></div>' +
          '<div style="font-size:12px;color:var(--text-muted);">' + esc(c.member_email) + (asg._meta && asg._meta.phone ? ' \u00b7 ' + esc(asg._meta.phone) : '') + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);">' +
            /* members.last_active_at is dead (populated for 1 of 97, newest 2026-05-25);
           the W9 strip reports real activity off member_activity_log instead. */
        (m.subscription_status ? esc(String(m.subscription_status).replace(/_/g,' ')) : 'Member') +
            (m.trial_ends_at ? ' \u00b7 trial ends ' + w5day(m.trial_ends_at) : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="w5-tiles">' +
        '<div class="w5-tile"><span>Check-in day</span><b>' + (asg.checkin_day != null ? W5_DAYS[asg.checkin_day].slice(0,3) : '\u2014') + (asg.checkin_frequency ? ' <em style="font-size:10px;font-style:normal;color:var(--text-muted);">' + esc(asg.checkin_frequency) + '</em>' : '') + '</b></div>' +
        '<div class="w5-tile"><span>Weeks</span><b>' + (weeks || '\u2014') + '</b></div>' +
        '<div class="w5-tile"><span>Start weight</span><b>' + (startW != null ? startW + ' kg' : '\u2014') + '</b></div>' +
        '<div class="w5-tile"><span>Current weight</span><b>' + (curW != null ? curW + ' kg' : '\u2014') + (delta != null && delta !== 0 ? ' <em style="font-size:11px;font-style:normal;color:' + (delta < 0 ? '#3DB89F' : '#E8834A') + ';">' + (delta > 0 ? '+' : '') + delta + '</em>' : '') + '</b></div>' +
        '<div class="w5-tile"><span>Age</span><b>' + (age || '\u2014') + '</b></div>' +
      '</div>';
    var TABS = [['overview','Overview'],['checkins','Check-ins'],['gallery','Gallery'],['qa','Q&A'],['nutrition','Nutrition'],['workouts','Workouts'],['habits','Habits'],['logs','Logs'],['goals','Goals'],['progress','Progress'],['plans','Plans'],['calendar','Calendar']];
    var tabs = '<div class="w5-tabs">' + TABS.map(function(t){ return '<button type="button" class="w5-tab" data-w5tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    body.innerHTML = head + tabs + '<div id="w5-pane"></div>' +
      '<button type="button" class="w5-chat-fab" id="w5-chat-fab" title="Message client">\u2709</button>';
    body.querySelectorAll('.w5-tab').forEach(function(b){ b.addEventListener('click', function(){ w5Tab(b.dataset.w5tab); }); });
    $c('w5-chat-fab').addEventListener('click', w5ChatToggle);
    if (!w5consented()){
      var note = document.createElement('div');
      note.style.cssText = 'padding:10px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font-size:12.5px;color:var(--text-muted);margin-bottom:12px;';
      note.textContent = 'Training data unlocks when ' + (c.invited_first_name || 'they') + ' logs in and accepts your terms and data sharing. Plans and goals can be set up in the meantime.';
      body.insertBefore(note, body.querySelector('.w5-tabs'));
    }
  }

  function w5Tab(name){
    w5.tab = name;
    var body = $c('cl-detail-body');
    body.querySelectorAll('.w5-tab').forEach(function(b){ b.classList.toggle('on', b.dataset.w5tab === name); });
    var pane = $c('w5-pane');
    pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    ({ overview: w5Overview, checkins: w5Checkins, gallery: w5Gallery, qa: w5QA, nutrition: w5Nutrition, workouts: w5Workouts, habits: w5Habits, logs: w5Logs, goals: w5Goals, progress: function(){ (window.w9Progress || function(){})(); }, plans: w5Plans, calendar: w6ClientCal })[name]();
  }

  /* ── Overview (#52): notes + timeline + latest check-ins + weight card ── */
  async function w5Overview(){
    var pane = $c('w5-pane'), c = w5.c, enc = encodeURIComponent(c.member_email);
    var res = await Promise.all([
      rest('/coach_client_events?' + pscope() + '&member_email=eq.' + enc + '&order=created_at.desc&limit=40&select=kind,label,created_at').catch(function(){ return []; }),
      w5consented() ? rest('/workouts?member_email=eq.' + enc + '&order=logged_at.desc&limit=10&select=workout_name,duration_minutes,logged_at,difficulty_rating,member_note').catch(function(){ return []; }) : Promise.resolve([])
    ]);
    if (w5.tab !== 'overview') return;
    var events = (res[0] || []).map(function(e){ return { t: e.created_at, label: e.label }; });
    if (c.created_at) events.push({ t: c.created_at, label: 'Client created' });
    if (c.coach_terms_accepted_at) events.push({ t: c.coach_terms_accepted_at, label: 'Accepted your terms' });
    if (c.consent_accepted_at) events.push({ t: c.consent_accepted_at, label: 'Accepted data sharing \u2014 coaching active' });
    if (c.archived_at && c.status === 'archived') events.push({ t: c.archived_at, label: 'Archived' });
    (res[1] || []).forEach(function(x){
      var label = 'Completed ' + (x.workout_name || 'workout') + (x.duration_minutes ? ' (' + x.duration_minutes + ' min)' : '');
      if (x.difficulty_rating) label += ' \u2014 felt ' + (W5_DIFF[x.difficulty_rating] || x.difficulty_rating) + ' (' + x.difficulty_rating + '/5)';
      if (x.member_note) label += ' \u2014 \u201c' + x.member_note + '\u201d';
      events.push({ t: x.logged_at, label: label });
    });
    w5.weights.slice(0, 5).forEach(function(x){ events.push({ t: x.logged_at, label: 'Logged weight: ' + x.weight_kg + ' kg' }); });
    w5.resp.slice(0, 8).forEach(function(r){
      var f = w5.forms[r.form_id] || {};
      events.push({ t: r.submitted_at, label: (f.kind === 'onboarding' ? 'Completed onboarding questionnaire' : 'Submitted check-in') + (r.week_start ? ' (w/c ' + r.week_start + ')' : '') });
    });
    events = events.filter(function(e){ return e.t; }).sort(function(a, b){ return new Date(b.t) - new Date(a.t); }).slice(0, 40);
    var latest = w5.resp.slice(0, 3).map(function(r){
      var f = w5.forms[r.form_id] || {};
      return '<div style="font-size:12.5px;padding:4px 0;">' + esc(f.title || (f.kind === 'onboarding' ? 'Onboarding' : 'Check-in')) + ' \u00b7 ' + w5day(r.submitted_at) + (r.reviewed_at ? '' : ' <span style="color:#E8834A;font-weight:700;">new</span>') + '</div>';
    }).join('') || '<p style="font-size:12.5px;color:var(--text-muted);">Nothing submitted yet.</p>';
    var curW = w5.weights[0];
    var prevW = w5.weights[1];
    var wPct = (curW && prevW && prevW.weight_kg) ? Math.round((curW.weight_kg - prevW.weight_kg) / prevW.weight_kg * 1000) / 10 : null;
    pane.innerHTML =
      '<div class="w5-sec">Client notes (private to you)</div>' +
      '<div class="w5-box"><textarea id="w5-notes" rows="3" style="width:100%;background:none;border:none;color:var(--text);font-size:13px;resize:vertical;outline:none;" placeholder="Anything worth remembering about this client\u2026">' + esc(c.notes || '') + '</textarea>' +
      '<div style="display:flex;justify-content:flex-end;"><span id="w5-notes-msg" style="font-size:11px;color:var(--text-muted);"></span></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">' +
        '<div><div class="w5-sec">Latest check-ins</div><div class="w5-box">' + latest + '</div>' +
        (curW ? '<div class="w5-sec">Latest weight</div><div class="w5-box"><b style="font-size:17px;">' + curW.weight_kg + ' kg</b>' + (wPct != null && wPct !== 0 ? ' <span style="font-size:12px;color:' + (wPct < 0 ? '#3DB89F' : '#E8834A') + ';font-weight:700;">' + (wPct > 0 ? '+' : '') + wPct + '%</span>' : '') + '<div style="font-size:11.5px;color:var(--text-muted);">' + w5day(curW.logged_at) + '</div></div>' : '') + '</div>' +
        '<div><div class="w5-sec" style="display:flex;align-items:center;gap:10px;">Activity log <input id="w5-ev-q" placeholder="Search\u2026" style="flex:1;max-width:150px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11.5px;padding:3px 8px;"/></div>' +
        '<div id="w5-ev-list" style="border-left:2px solid var(--border);padding-left:14px;max-height:340px;overflow-y:auto;"></div></div>' +
      '</div>';
    function drawEvents(q){
      var qq = (q || '').toLowerCase();
      var list = events.filter(function(e){ return !qq || e.label.toLowerCase().indexOf(qq) >= 0; });
      $c('w5-ev-list').innerHTML = list.length ? list.map(function(e){
        return '<div style="margin-bottom:9px;"><div style="font-size:12.5px;">' + esc(e.label) + '</div><div style="font-size:11px;color:var(--text-muted);">' + w5fmt(e.t) + '</div></div>';
      }).join('') : '<p style="font-size:12.5px;color:var(--text-muted);">No activity yet.</p>';
    }
    drawEvents('');
    $c('w5-ev-q').addEventListener('input', function(){ drawEvents(this.value); });
    var nt = $c('w5-notes'), ntTimer = null;
    nt.addEventListener('input', function(){
      clearTimeout(ntTimer); $c('w5-notes-msg').textContent = '';
      ntTimer = setTimeout(async function(){
        try {
          await rest('/coach_clients?id=eq.' + c.id, { method: 'PATCH', body: { notes: nt.value.slice(0, 4000) } });
          c.notes = nt.value.slice(0, 4000);
          $c('w5-notes-msg').textContent = 'Saved';
        } catch(e){ $c('w5-notes-msg').textContent = 'Save failed'; }
      }, 900);
    });
  }

  /* ── Check-ins (#53 metric table + #59 progress modal) ── */
  function w5MetricCols(){
    var cols = [], seen = {};
    w5.resp.forEach(function(r){
      var f = w5.forms[r.form_id];
      if (!f || f.kind !== 'checkin') return;
      (f.questions || []).forEach(function(q){
        if (['number','scale','stars','yesno'].indexOf(q.type) < 0) return;
        if (seen[q.label]) return; seen[q.label] = 1;
        cols.push({ label: q.label, ids: [q.id], type: q.type });
      });
    });
    // same label across forms → merge ids
    w5.resp.forEach(function(r){
      var f = w5.forms[r.form_id];
      if (!f || f.kind !== 'checkin') return;
      (f.questions || []).forEach(function(q){
        var col = cols.find(function(x){ return x.label === q.label; });
        if (col && col.ids.indexOf(q.id) < 0) col.ids.push(q.id);
      });
    });
    return cols.slice(0, 16);
  }
  async function w5Checkins(){
    var pane = $c('w5-pane');
    var cis = w5.resp.filter(function(r){ var f = w5.forms[r.form_id]; return !f || f.kind !== 'onboarding'; });
    if (!cis.length){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No check-ins submitted yet.</p>'; return; }
    var cols = w5MetricCols();
    var hideKey = 'w5cols_' + partnerId;
    var hidden = {}; try { hidden = JSON.parse(localStorage.getItem(hideKey) || '{}'); } catch(_){}
    function visCols(){ return cols.filter(function(cc){ return !hidden[cc.label]; }); }
    function cellVal(r, col){
      var a = r.answers || {};
      for (var i = 0; i < col.ids.length; i++){
        var v = a[col.ids[i]];
        if (v == null || v === '') continue;
        if (col.type === 'yesno') return (String(v).toLowerCase() === 'yes' || v === true) ? 'Y' : 'N';
        if (col.type === 'stars') return v + '\u2605';
        return String(v);
      }
      return '\u2014';
    }
    function draw(){
      var vc = visCols();
      var html =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">' +
          '<div class="w5-sec" style="margin:0;flex:1;">Check-in history</div>' +
          '<button class="btn" type="button" id="w5-prog-btn" style="font-size:11.5px;">Progress</button>' +
          '<button class="btn" type="button" id="w5-cols-btn" style="font-size:11.5px;">Columns \u2699</button>' +
        '</div>' +
        '<div id="w5-cols-pop" style="display:none;border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:8px;font-size:12px;">' +
          cols.map(function(cc){ return '<label style="display:inline-flex;align-items:center;gap:5px;margin-right:12px;"><input type="checkbox" data-w5col="' + esc(cc.label) + '"' + (hidden[cc.label] ? '' : ' checked') + '/>' + esc(cc.label) + '</label>'; }).join('') +
        '</div>' +
        '<div class="w5-box" style="overflow-x:auto;padding:6px 10px;"><table class="w5-ci-table"><tr><th></th><th>Date</th>' +
        vc.map(function(cc){ return '<th>' + esc(cc.label) + '</th>'; }).join('') + '<th></th></tr>' +
        cis.map(function(r){
          return '<tr><td><span class="w5-dot" style="background:' + (r.reviewed_at ? '#3DB89F' : '#E8834A') + ';"></span></td>' +
            '<td>' + (r.week_start ? 'w/c ' + r.week_start : w5day(r.submitted_at)) + '</td>' +
            vc.map(function(cc){ return '<td>' + esc(cellVal(r, cc)) + '</td>'; }).join('') +
            '<td><button class="btn" type="button" data-w5open="' + r.id + '" style="font-size:11px;">Open</button>' +
            (r.reviewed_at ? '' : ' <button class="btn" type="button" data-w5rev="' + r.id + '" style="font-size:11px;">Reviewed</button>') + '</td></tr>' +
            '<tr id="w5-exp-' + r.id + '" style="display:none;"><td colspan="' + (vc.length + 3) + '"><div style="padding:8px 4px;" id="w5-expb-' + r.id + '"></div></td></tr>';
        }).join('') + '</table></div>' +
        (cols.length ? '' : '<p style="font-size:11.5px;color:var(--text-muted);">Add number, scale or star questions to your check-in form to see metric columns here.</p>');
      pane.innerHTML = html;
      $c('w5-cols-btn').addEventListener('click', function(){ var p = $c('w5-cols-pop'); p.style.display = p.style.display === 'none' ? '' : 'none'; });
      pane.querySelectorAll('[data-w5col]').forEach(function(cb){
        cb.addEventListener('change', function(){
          hidden[cb.dataset.w5col] = !cb.checked;
          localStorage.setItem(hideKey, JSON.stringify(hidden));
          draw();
        });
      });
      pane.querySelectorAll('[data-w5open]').forEach(function(b){
        b.addEventListener('click', function(){
          var id = b.dataset.w5open, tr = $c('w5-exp-' + id);
          if (tr.style.display === 'none'){ tr.style.display = ''; w5AnswerCard(cis.find(function(x){ return x.id === id; }), $c('w5-expb-' + id)); }
          else tr.style.display = 'none';
        });
      });
      pane.querySelectorAll('[data-w5rev]').forEach(function(b){
        b.addEventListener('click', async function(){
          try {
            await rest('/coach_form_responses?id=eq.' + b.dataset.w5rev, { method: 'PATCH', body: { reviewed_at: new Date().toISOString() } });
            var r = cis.find(function(x){ return x.id === b.dataset.w5rev; });
            if (r) r.reviewed_at = new Date().toISOString();
            draw();
          } catch(e){ alert('That didn\u2019t work: ' + e.message); }
        });
      });
      $c('w5-prog-btn').addEventListener('click', w5Progress);
    }
    draw();
  }
  async function w5AnswerCard(r, host){
    if (!r || !host) return;
    host.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">Loading\u2026</span>';
    var f = w5.forms[r.form_id] || {}, a = r.answers || {}, qs = f.questions || [];
    var paths = [];
    Object.keys(a).forEach(function(k){ var v = a[k]; if (v && typeof v === 'object' && v.path) paths.push(v.path); });
    var urls = {};
    if (paths.length){
      try {
        var su = await sb().storage.from('coach-checkins').createSignedUrls(paths, 3600);
        (su.data || []).forEach(function(u, i){ if (u && u.signedUrl) urls[paths[i]] = u.signedUrl; });
      } catch(_){}
    }
    var parts = '', done = {}, lastSec = null;
    function one(q, v){
      var bodyH;
      if (v == null || v === '') bodyH = '<span style="color:var(--text-muted);">\u2014</span>';
      else if (typeof v === 'object' && v.path) bodyH = urls[v.path] ? '<a href="' + urls[v.path] + '" target="_blank" rel="noopener"><img src="' + urls[v.path] + '" loading="lazy" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid var(--border);"/></a>' : '<span style="color:var(--text-muted);">file unavailable</span>';
      else if (q && q.type === 'scale') bodyH = '<strong>' + esc(String(v)) + '</strong>/10';
      else if (q && q.type === 'stars'){ var sv = parseInt(v) || 0; bodyH = '<span style="color:var(--vyve-gold,#C9A84C);">' + '\u2605'.repeat(Math.min(sv, 5)) + '\u2606'.repeat(Math.max(0, 5 - sv)) + '</span>'; }
      else if (q && q.type === 'yesno') bodyH = '<strong>' + (String(v).toLowerCase() === 'yes' || v === true ? 'Yes' : 'No') + '</strong>';
      else bodyH = esc(String(v));
      return '<div style="margin-bottom:7px;"><div style="font-size:11px;color:var(--text-muted);">' + esc(q ? q.label : 'Answer') + '</div><div style="font-size:12.5px;">' + bodyH + '</div></div>';
    }
    qs.forEach(function(q){
      if (!(q.id in a)) return;
      var sec = q.section || null;
      if (sec !== lastSec){
        lastSec = sec;
        if (sec) parts += '<div style="font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--teal-lt,var(--vyve-teal));margin:8px 0 5px;">' + (sec === 'progress' ? 'Progress tracking' : esc(sec)) + '</div>';
      }
      parts += one(q, a[q.id]); done[q.id] = 1;
    });
    Object.keys(a).forEach(function(k){ if (!done[k]) parts += one(null, a[k]); });
    host.innerHTML = parts || '<span style="font-size:12px;color:var(--text-muted);">Empty submission.</span>';
  }
  /* #59 — progress modal over weight_logs */
  function w5Progress(){
    var periods = { week: 7, month: 30, year: 365, all: 1e5 };
    var host = document.createElement('div'); host.className = 'w5-modal';
    host.innerHTML = '<div class="w5-modal-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><b style="flex:1;">Progress \u2014 weight</b>' +
      Object.keys(periods).map(function(p, i){ return '<button class="btn" type="button" data-w5p="' + p + '" style="font-size:11.5px;' + (i === 3 ? 'font-weight:800;' : '') + '">' + p[0].toUpperCase() + p.slice(1) + '</button>'; }).join('') +
      '<button class="btn" type="button" id="w5-prog-x" style="font-size:11.5px;">Close</button></div><div id="w5-prog-body"></div></div>';
    document.body.appendChild(host);
    function draw(p){
      var cut = Date.now() - periods[p] * 864e5;
      var rows = w5.weights.filter(function(w){ return new Date(w.logged_at).getTime() >= cut; });
      var el = host.querySelector('#w5-prog-body');
      if (rows.length < 1){ el.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No weight entries in this period.</p>'; return; }
      var start = rows[rows.length - 1].weight_kg, end = rows[0].weight_kg;
      var avg = Math.round(rows.reduce(function(s, w){ return s + parseFloat(w.weight_kg); }, 0) / rows.length * 10) / 10;
      var chg = start ? Math.round((end - start) / start * 1000) / 10 : 0;
      el.innerHTML = '<div class="w5-tiles">' +
        '<div class="w5-tile"><span>Start</span><b>' + start + ' kg</b></div>' +
        '<div class="w5-tile"><span>Current</span><b>' + end + ' kg</b></div>' +
        '<div class="w5-tile"><span>Average</span><b>' + avg + ' kg</b></div>' +
        '<div class="w5-tile"><span>Change</span><b style="color:' + (chg < 0 ? '#3DB89F' : chg > 0 ? '#E8834A' : 'var(--text)') + ';">' + (chg > 0 ? '+' : '') + chg + '%</b></div>' +
        '</div><p style="font-size:11.5px;color:var(--text-muted);">' + rows.length + ' entries in period.</p>';
    }
    draw('all');
    host.querySelectorAll('[data-w5p]').forEach(function(b){ b.addEventListener('click', function(){ host.querySelectorAll('[data-w5p]').forEach(function(x){ x.style.fontWeight = ''; }); b.style.fontWeight = '800'; draw(b.dataset.w5p); }); });
    host.querySelector('#w5-prog-x').addEventListener('click', function(){ host.remove(); });
    host.addEventListener('click', function(e){ if (e.target === host) host.remove(); });
  }

  /* ── Gallery — check-in photos, tap two to compare ── */
  async function w5Gallery(){
    var pane = $c('w5-pane');
    var paths = [], byKey = {};
    w5.resp.forEach(function(r){
      var a = r.answers || {};
      Object.keys(a).forEach(function(k){
        var v = a[k];
        if (v && typeof v === 'object' && v.path){ paths.push(v.path); var key = r.week_start || r.submitted_at.slice(0, 10); (byKey[key] = byKey[key] || []).push(v.path); }
      });
    });
    if (!paths.length){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No photos submitted yet.</p>'; return; }
    var urls = {};
    try {
      var su = await sb().storage.from('coach-checkins').createSignedUrls(paths, 3600);
      (su.data || []).forEach(function(u, i){ if (u && u.signedUrl) urls[paths[i]] = u.signedUrl; });
    } catch(_){}
    if (w5.tab !== 'gallery') return;
    var keys = Object.keys(byKey).sort().reverse();
    pane.innerHTML = '<div class="w5-sec">Photo timeline</div>' +
      '<div id="w5-cmp-bar" style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Tap two photos to compare side by side.</div>' +
      '<div id="w5-cmp" style="display:none;gap:10px;margin-bottom:14px;"></div>' +
      keys.map(function(k){
        return '<div style="margin-bottom:14px;"><div style="font-size:11.5px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">w/c ' + esc(k) + '</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          byKey[k].filter(function(p){ return urls[p]; }).map(function(p){ return '<img src="' + urls[p] + '" data-w5img="' + urls[p] + '" loading="lazy" style="width:96px;height:96px;object-fit:cover;border-radius:8px;border:2px solid var(--border);cursor:pointer;"/>'; }).join('') +
        '</div></div>';
      }).join('');
    var picked = [];
    pane.querySelectorAll('[data-w5img]').forEach(function(img){
      img.addEventListener('click', function(){
        var i = picked.indexOf(img);
        if (i >= 0){ picked.splice(i, 1); img.style.borderColor = 'var(--border)'; }
        else { if (picked.length === 2){ picked.shift().style.borderColor = 'var(--border)'; } picked.push(img); img.style.borderColor = 'var(--vyve-gold,#C9A84C)'; }
        var cmp = $c('w5-cmp');
        if (picked.length === 2){
          cmp.style.display = 'flex';
          cmp.innerHTML = picked.map(function(p){ return '<img src="' + p.dataset.w5img + '" style="flex:1;min-width:0;max-height:340px;object-fit:contain;border-radius:10px;border:1px solid var(--border);"/>'; }).join('');
        } else { cmp.style.display = 'none'; cmp.innerHTML = ''; }
      });
    });
  }

  /* ── Q&A (#55): onboarding viewer + edit text answers + print ── */
  async function w5QA(){
    var pane = $c('w5-pane');
    var obs = w5.resp.filter(function(r){ var f = w5.forms[r.form_id]; return f && f.kind === 'onboarding'; });
    if (!obs.length){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No onboarding questionnaire submitted yet.</p>'; return; }
    var r = obs[0], f = w5.forms[r.form_id] || {}, qs = f.questions || [], a = r.answers || {};
    pane.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><div class="w5-sec" style="margin:0;flex:1;">' + esc(f.title || 'Onboarding questionnaire') + ' \u00b7 ' + w5day(r.submitted_at) + '</div>' +
      '<button class="btn" type="button" id="w5-qa-print" style="font-size:11.5px;">Print / PDF</button></div>' +
      '<div class="w5-box" id="w5-qa-body"></div>' +
      '<p style="font-size:11px;color:var(--text-muted);">Edits are visible to you and your client. Photo and video answers can\u2019t be edited here.</p>';
    var hostB = $c('w5-qa-body');
    await w5AnswerCard(r, hostB);
    // add edit buttons for text-ish answers
    qs.forEach(function(q){
      if (['text','textarea','number','select','yesno','scale','stars'].indexOf(q.type) < 0) return;
      if (!(q.id in a)) return;
      var labels = hostB.querySelectorAll('div');
      // find label div matching q.label, attach edit to its value sibling
    });
    // simpler: one Edit-answers mode toggling prompts per question
    var editBtn = document.createElement('button');
    editBtn.className = 'btn'; editBtn.type = 'button'; editBtn.style.fontSize = '11.5px'; editBtn.textContent = 'Edit an answer';
    pane.querySelector('div').appendChild(editBtn);
    editBtn.addEventListener('click', async function(){
      var editable = qs.filter(function(q){ return ['text','textarea','number','yesno','scale','stars','select'].indexOf(q.type) >= 0; });
      if (!editable.length){ alert('No editable answers on this form.'); return; }
      var pick = prompt('Which answer? Type the number:\n' + editable.map(function(q, i){ return (i + 1) + '. ' + q.label; }).join('\n'));
      var idx = parseInt(pick) - 1;
      if (isNaN(idx) || !editable[idx]) return;
      var q = editable[idx];
      var nv = prompt('New answer for \u201c' + q.label + '\u201d:', a[q.id] == null ? '' : String(a[q.id]));
      if (nv == null) return;
      var na = {}; Object.keys(a).forEach(function(k){ na[k] = a[k]; }); na[q.id] = nv;
      try {
        await rest('/coach_form_responses?id=eq.' + r.id, { method: 'PATCH', body: { answers: na } });
        r.answers = na; a = na;
        await w5AnswerCard(r, hostB);
        try { await rest('/coach_client_events', { method: 'POST', body: { partner_id: partnerId, member_email: w5.c.member_email, kind: 'qa_edited', label: 'Edited onboarding answer: ' + q.label.slice(0, 60) } }); } catch(_){}
      } catch(e){ alert('That didn\u2019t work: ' + e.message); }
    });
    $c('w5-qa-print').addEventListener('click', function(){
      var win = window.open('', '_blank');
      if (!win) return;
      win.document.write('<html><head><title>' + esc(nameOf(w5.c)) + ' \u2014 Onboarding</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#222}h2{font-size:18px}div.q{margin-bottom:10px}div.q b{display:block;font-size:12px;color:#666}</style></head><body><h2>' + esc(nameOf(w5.c)) + ' \u2014 ' + esc(f.title || 'Onboarding questionnaire') + '</h2>' +
        qs.filter(function(q){ return q.id in a; }).map(function(q){
          var v = a[q.id];
          var vs = (v && typeof v === 'object' && v.path) ? '[photo/video upload]' : String(v == null ? '' : v);
          return '<div class="q"><b>' + esc(q.label) + '</b>' + esc(vs) + '</div>';
        }).join('') + '</body></html>');
      win.document.close(); win.print();
    });
  }

  /* ── Nutrition tab — 7-day adherence + targets ── */
  async function w5Nutrition(){
    var pane = $c('w5-pane'), m = w5.member, enc = encodeURIComponent(w5.c.member_email);
    if (!w5consented()){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Nutrition data unlocks once coaching is active.</p>'; return; }
    var since7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    var nlogs = await rest('/nutrition_logs?member_email=eq.' + enc + '&activity_date=gte.' + since7 + '&select=activity_date,calories_kcal,protein_g').catch(function(){ return []; }) || [];
    if (w5.tab !== 'nutrition') return;
    var mo = m.macro_override || {};
    var kcalT = parseInt(mo.calories || m.tdee_target || 0) || 0;
    var protT = parseInt(mo.protein || 0) || 0;
    var byDay = {};
    nlogs.forEach(function(n){ var d = byDay[n.activity_date] = byDay[n.activity_date] || { k: 0, p: 0 }; d.k += (parseFloat(n.calories_kcal) || 0); d.p += (parseFloat(n.protein_g) || 0); });
    var days = [];
    for (var di = 6; di >= 0; di--){
      var dd = new Date(Date.now() - di * 864e5);
      var ds = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
      days.push({ label: dd.toLocaleDateString('en-GB', { weekday: 'short' }), d: byDay[ds] });
    }
    var loggedDays = days.filter(function(x){ return x.d && x.d.k > 0; }).length;
    var rows7 = days.map(function(x){
      var k = x.d ? Math.round(x.d.k) : 0, p = x.d ? Math.round(x.d.p) : 0;
      var kPct = kcalT ? Math.min(100, Math.round(k / kcalT * 100)) : 0;
      var kCol = !k ? 'var(--border)' : (kcalT && Math.abs(k - kcalT) <= kcalT * 0.1 ? '#3DB89F' : '#E8834A');
      return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 0;">' +
        '<span style="width:34px;color:var(--text-muted);">' + x.label + '</span>' +
        '<span style="flex:1;height:7px;border-radius:4px;background:var(--surface-2);overflow:hidden;"><span style="display:block;height:100%;width:' + kPct + '%;background:' + kCol + ';"></span></span>' +
        '<span style="width:150px;text-align:right;color:' + (k ? 'var(--text)' : 'var(--text-muted)') + ';">' + (k ? (k + (kcalT ? '/' + kcalT : '') + ' kcal \u00b7 ' + p + (protT ? '/' + protT : '') + 'g P') : 'nothing logged') + '</span></div>';
    }).join('');
    var asg = w5.c.assignments || {};
    pane.innerHTML = '<div class="w5-sec">Nutrition \u2014 last 7 days' + (kcalT ? ' (target ' + kcalT + ' kcal' + (protT ? ' \u00b7 ' + protT + 'g protein' : '') + ')' : '') + '</div>' +
      '<div class="w5-box">' + rows7 + '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">' + loggedDays + '/7 days logged' + (kcalT ? ' \u00b7 green = within 10% of target' : ' \u00b7 no coach targets set \u2014 assign a nutrition plan on the Plans tab') + '</div></div>' +
      (asg.water_goal ? '<div class="w5-sec">Water goal</div><div class="w5-box" style="font-size:13px;">' + asg.water_goal + 'L per day (set on the Plans tab)</div>' : '');
  }

  /* ── Workouts tab ── */
  async function w5Workouts(){
    var pane = $c('w5-pane'), enc = encodeURIComponent(w5.c.member_email);
    if (!w5consented()){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Workout data unlocks once coaching is active.</p>'; return; }
    var since30 = new Date(Date.now() - 30 * 864e5).toISOString();
    var wk = await rest('/workouts?member_email=eq.' + enc + '&logged_at=gte.' + encodeURIComponent(since30) + '&order=logged_at.desc&select=workout_name,duration_minutes,logged_at,difficulty_rating,member_note').catch(function(){ return []; }) || [];
    if (w5.tab !== 'workouts') return;
    pane.innerHTML = '<div class="w5-sec">Workouts \u2014 last 30 days (' + wk.length + ')</div>' +
      (wk.length ? '<div class="w5-box">' + wk.slice(0, 15).map(function(x){
        return '<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12.5px;"><b>' + esc(x.workout_name || 'Workout') + '</b>' +
          (x.duration_minutes ? ' \u00b7 ' + x.duration_minutes + ' min' : '') +
          (x.difficulty_rating ? ' \u00b7 felt ' + (W5_DIFF[x.difficulty_rating] || x.difficulty_rating) + ' (' + x.difficulty_rating + '/5)' : '') +
          '<div style="font-size:11px;color:var(--text-muted);">' + w5fmt(x.logged_at) + (x.member_note ? ' \u00b7 \u201c' + esc(x.member_note) + '\u201d' : '') + '</div></div>';
      }).join('') + '</div>' : '<p style="font-size:12.5px;color:var(--text-muted);">No workouts logged yet.</p>');
  }

  /* ── Habits tab — 7-day grid (lifted from PM-961) ── */
  async function w5Habits(){
    var pane = $c('w5-pane'), enc = encodeURIComponent(w5.c.member_email);
    if (!w5consented()){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Habit data unlocks once coaching is active.</p>'; return; }
    var since7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    var res = await Promise.all([
      rest('/member_habits?member_email=eq.' + enc + '&active=eq.true&select=habit_id').catch(function(){ return []; }),
      rest('/daily_habits?member_email=eq.' + enc + '&activity_date=gte.' + since7 + '&select=habit_id,activity_date,habit_completed,value,note').catch(function(){ return []; })
    ]);
    if (w5.tab !== 'habits') return;
    var mhRows = res[0] || [], dh = res[1] || [], hlMap = {};
    if (!mhRows.length){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No habits assigned.</p>'; return; }
    try {
      var ids = mhRows.map(function(x){ return x.habit_id; }).join(',');
      (await rest('/habit_library?id=in.(' + ids + ')&select=id,habit_title,input_rule,health_rule') || []).forEach(function(x){ hlMap[x.id] = x; });
    } catch(_){}
    var dhByKey = {};
    dh.forEach(function(r){ dhByKey[r.habit_id + '|' + r.activity_date] = r; });
    var days7 = [];
    for (var hi = 6; hi >= 0; hi--){
      var hd = new Date(Date.now() - hi * 864e5);
      days7.push({ ds: hd.getFullYear() + '-' + String(hd.getMonth() + 1).padStart(2, '0') + '-' + String(hd.getDate()).padStart(2, '0'), lbl: hd.toLocaleDateString('en-GB', { weekday: 'short' }) });
    }
    var gridRows = mhRows.map(function(mh){
      var hl = hlMap[mh.habit_id] || {};
      var ir = hl.input_rule || null;
      var cells = days7.map(function(dy){
        var r = dhByKey[mh.habit_id + '|' + dy.ds];
        if (!r) return '<td style="padding:5px 6px;border-top:1px solid var(--border);color:var(--text-muted);">\u2014</td>';
        var v = r.value, done = r.habit_completed !== false;
        var noteMark = r.note ? ' <span title="' + esc(r.note) + '" style="cursor:help;">\u270e</span>' : '';
        if (v != null && typeof v === 'object' && 'n' in v){
          var n = parseFloat(v.n) || 0;
          var disp = n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n);
          var tgt = ir && ir.type === 'number' && ir.target != null ? parseFloat(ir.target) : null;
          var hitCol = tgt != null ? (n >= tgt ? '#3DB89F' : '#E8834A') : 'var(--text)';
          return '<td style="padding:5px 6px;border-top:1px solid var(--border);font-weight:700;color:' + hitCol + ';">' + disp + noteMark + '</td>';
        }
        if (v != null && typeof v === 'object' && 's' in v) return '<td style="padding:5px 6px;border-top:1px solid var(--border);font-weight:700;">' + parseInt(v.s) + noteMark + '</td>';
        if (v != null && typeof v === 'object' && 't' in v){
          var tt = String(v.t || '').slice(0, 18);
          return '<td style="padding:5px 6px;border-top:1px solid var(--border);font-size:10.5px;color:var(--text-muted);" title="' + esc(String(v.t || '')) + '">\u201c' + esc(tt) + (String(v.t || '').length > 18 ? '\u2026' : '') + '\u201d' + noteMark + '</td>';
        }
        return done ? '<td style="padding:5px 6px;border-top:1px solid var(--border);color:#3DB89F;font-weight:700;">\u2713' + noteMark + '</td>' : '<td style="padding:5px 6px;border-top:1px solid var(--border);color:var(--text-muted);">\u2014</td>';
      }).join('');
      var typeTag = ir ? (ir.type === 'number' ? (ir.unit || 'number') : ir.type) : (hl.health_rule ? 'auto' : '');
      return '<tr><td style="padding:5px 6px;border-top:1px solid var(--border);font-weight:600;">' + esc(hl.habit_title || 'Habit') + (typeTag ? ' <span style="font-size:9.5px;color:var(--text-muted);">' + esc(typeTag) + '</span>' : '') + '</td>' + cells + '</tr>';
    }).join('');
    pane.innerHTML = '<div class="w5-sec">Habits \u2014 last 7 days</div>' +
      '<div class="w5-box" style="padding:6px 10px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11.5px;min-width:430px;"><tr><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;"></th>' +
      days7.map(function(dy){ return '<th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;">' + dy.lbl + '</th>'; }).join('') + '</tr>' +
      gridRows + '</table></div>';
  }

  /* ── Logs (#58): week-paged raw member logs ── */
  async function w5Logs(){
    var pane = $c('w5-pane');
    if (!w5consented()){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Log data unlocks once coaching is active.</p>'; return; }
    var enc = encodeURIComponent(w5.c.member_email);
    var now = new Date();
    var monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + w5.logsWeek * 7); monday.setHours(0, 0, 0, 0);
    var sunday = new Date(monday.getTime() + 6 * 864e5);
    function ds(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    var from = ds(monday), to = ds(sunday);
    var fromIso = monday.toISOString(), toIso = new Date(sunday.getTime() + 864e5).toISOString();
    var res = await Promise.all([
      rest('/nutrition_logs?member_email=eq.' + enc + '&activity_date=gte.' + from + '&activity_date=lte.' + to + '&select=activity_date,calories_kcal,protein_g,fat_g,carbs_g').catch(function(){ return []; }),
      rest('/workouts?member_email=eq.' + enc + '&logged_at=gte.' + encodeURIComponent(fromIso) + '&logged_at=lt.' + encodeURIComponent(toIso) + '&select=workout_name,duration_minutes,logged_at,difficulty_rating').catch(function(){ return []; }),
      rest('/cardio?member_email=eq.' + enc + '&logged_at=gte.' + encodeURIComponent(fromIso) + '&logged_at=lt.' + encodeURIComponent(toIso) + '&select=*').catch(function(){ return []; }),
      rest('/weight_logs?member_email=eq.' + enc + '&logged_date=gte.' + from + '&logged_date=lte.' + to + '&select=weight_kg,logged_date').catch(function(){ return []; })
    ]);
    if (w5.tab !== 'logs') return;
    var nl = res[0] || [], wk = res[1] || [], cd = res[2] || [], wl = res[3] || [];
    var byDay = {};
    nl.forEach(function(n){ var d = byDay[n.activity_date] = byDay[n.activity_date] || { k: 0, p: 0, f: 0, c: 0 }; d.k += parseFloat(n.calories_kcal) || 0; d.p += parseFloat(n.protein_g) || 0; d.f += parseFloat(n.fat_g) || 0; d.c += parseFloat(n.carbs_g) || 0; });
    var nutRows = [];
    for (var i = 0; i < 7; i++){
      var dd = new Date(monday.getTime() + i * 864e5), k = ds(dd), d = byDay[k];
      nutRows.push('<tr><td style="padding:5px 6px;border-top:1px solid var(--border);color:var(--text-muted);">' + dd.toLocaleDateString('en-GB', { weekday: 'short' }) + '</td>' +
        (d ? '<td style="padding:5px 6px;border-top:1px solid var(--border);">' + Math.round(d.k) + '</td><td style="padding:5px 6px;border-top:1px solid var(--border);">' + Math.round(d.p) + 'g</td><td style="padding:5px 6px;border-top:1px solid var(--border);">' + Math.round(d.f) + 'g</td><td style="padding:5px 6px;border-top:1px solid var(--border);">' + Math.round(d.c) + 'g</td>'
           : '<td colspan="4" style="padding:5px 6px;border-top:1px solid var(--border);color:var(--text-muted);">nothing logged</td>') + '</tr>');
    }
    pane.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
        '<button class="btn" type="button" id="w5-lg-prev" style="font-size:12px;">\u2039</button>' +
        '<b style="font-size:12.5px;">w/c ' + monday.toLocaleDateString('en-GB') + '</b>' +
        '<button class="btn" type="button" id="w5-lg-next" style="font-size:12px;"' + (w5.logsWeek >= 0 ? ' disabled' : '') + '>\u203a</button>' +
      '</div>' +
      '<div class="w5-sec">Nutrition</div><div class="w5-box" style="padding:6px 10px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11.5px;"><tr><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;"></th><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;">kcal</th><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;">P</th><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;">F</th><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;">C</th></tr>' + nutRows.join('') + '</table></div>' +
      '<div class="w5-sec">Workouts (' + wk.length + ')</div><div class="w5-box">' + (wk.length ? wk.map(function(x){ return '<div style="font-size:12.5px;padding:3px 0;">' + w5day(x.logged_at) + ' \u00b7 ' + esc(x.workout_name || 'Workout') + (x.duration_minutes ? ' \u00b7 ' + x.duration_minutes + ' min' : '') + (x.difficulty_rating ? ' \u00b7 ' + x.difficulty_rating + '/5' : '') + '</div>'; }).join('') : '<span style="font-size:12.5px;color:var(--text-muted);">None this week.</span>') + '</div>' +
      '<div class="w5-sec">Cardio (' + cd.length + ')</div><div class="w5-box">' + (cd.length ? cd.map(function(x){ return '<div style="font-size:12.5px;padding:3px 0;">' + w5day(x.logged_at || x.created_at) + ' \u00b7 ' + esc(x.activity_name || x.cardio_type || 'Cardio') + (x.duration_minutes ? ' \u00b7 ' + x.duration_minutes + ' min' : '') + '</div>'; }).join('') : '<span style="font-size:12.5px;color:var(--text-muted);">None this week.</span>') + '</div>' +
      '<div class="w5-sec">Weight</div><div class="w5-box">' + (wl.length ? wl.map(function(x){ return '<div style="font-size:12.5px;padding:3px 0;">' + x.logged_date + ' \u00b7 ' + x.weight_kg + ' kg</div>'; }).join('') : '<span style="font-size:12.5px;color:var(--text-muted);">No entries this week.</span>') + '</div>';
    $c('w5-lg-prev').addEventListener('click', function(){ w5.logsWeek--; w5Logs(); });
    $c('w5-lg-next').addEventListener('click', function(){ if (w5.logsWeek < 0){ w5.logsWeek++; w5Logs(); } });
  }

  /* ── Goals (#56) ── */
  async function w5Goals(){
    var pane = $c('w5-pane'), c = w5.c, enc = encodeURIComponent(c.member_email);
    var goals = await rest('/coach_client_goals?' + pscope() + '&member_email=eq.' + enc + '&active=eq.true&order=created_at.desc&select=*').catch(function(){ return []; }) || [];
    if (w5.tab !== 'goals') return;
    function daysTo(d){ if (!d) return null; return Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 864e5); }
    pane.innerHTML =
      '<div class="w5-sec">Goals</div>' +
      '<div id="w5-goal-list">' + (goals.length ? goals.map(function(g){
        var dt = daysTo(g.target_date);
        return '<div class="w5-box" data-w5goal="' + g.id + '">' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
            '<b style="flex:1;font-size:13.5px;">' + esc(g.title) + (g.achieved_at ? ' <span style="color:#3DB89F;font-size:11px;">achieved ' + w5day(g.achieved_at) + '</span>' : '') + '</b>' +
            (g.target_date && !g.achieved_at ? '<span style="font-size:12px;color:' + (dt != null && dt < 0 ? '#E8834A' : 'var(--text)') + ';">' + (dt != null ? (dt >= 0 ? dt + ' days to go' : Math.abs(dt) + ' days past') : '') + ' \u00b7 ' + new Date(g.target_date + 'T00:00:00').toLocaleDateString('en-GB') + '</span>' : '') +
          '</div>' +
          (g.notes ? '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + esc(g.notes) + '</div>' : '') +
          '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;">' +
            '<label style="font-size:11.5px;display:inline-flex;align-items:center;gap:5px;"><input type="checkbox" data-w5cd="' + g.id + '"' + (g.countdown_enabled ? ' checked' : '') + '/> Show countdown in their app</label>' +
            (!g.achieved_at ? '<button class="btn" type="button" data-w5ach="' + g.id + '" style="font-size:11px;">Mark achieved</button>' : '') +
            '<button class="btn" type="button" data-w5del="' + g.id + '" style="font-size:11px;">Remove</button>' +
          '</div></div>';
      }).join('') : '<p style="font-size:12.5px;color:var(--text-muted);">No goals set yet.</p>') + '</div>' +
      '<div class="w5-sec">Add a goal</div><div class="w5-box">' +
        '<div class="field-row"><div class="field"><label>Goal</label><input id="w5-g-title" maxlength="120" placeholder="e.g. First 10K run"/></div>' +
        '<div class="field"><label>Target date</label><input id="w5-g-date" type="date"/></div></div>' +
        '<div class="field"><label>Notes (optional)</label><input id="w5-g-notes" maxlength="1000"/></div>' +
        '<label style="font-size:12px;display:inline-flex;align-items:center;gap:6px;margin:6px 0 10px;"><input type="checkbox" id="w5-g-cd" checked/> Show countdown in their app</label>' +
        '<div><button class="btn btn-primary" type="button" id="w5-g-add" style="font-size:12px;">Add goal</button> <span id="w5-g-msg" style="font-size:11.5px;color:var(--text-muted);"></span></div>' +
      '</div>';
    $c('w5-g-add').addEventListener('click', async function(){
      var t = $c('w5-g-title').value.trim();
      if (!t){ $c('w5-g-msg').textContent = 'Goal name required.'; return; }
      this.disabled = true;
      try {
        await rest('/coach_client_goals', { method: 'POST', body: { partner_id: partnerId, member_email: c.member_email, title: t, target_date: $c('w5-g-date').value || null, notes: $c('w5-g-notes').value.trim() || null, countdown_enabled: $c('w5-g-cd').checked } });
        try { await rest('/coach_client_events', { method: 'POST', body: { partner_id: partnerId, member_email: c.member_email, kind: 'goal_added', label: 'Added goal: ' + t.slice(0, 80) } }); } catch(_){}
        w5Goals();
      } catch(e){ $c('w5-g-msg').textContent = 'That didn\u2019t work: ' + e.message; this.disabled = false; }
    });
    pane.querySelectorAll('[data-w5cd]').forEach(function(cb){
      cb.addEventListener('change', async function(){
        try { await rest('/coach_client_goals?id=eq.' + cb.dataset.w5cd, { method: 'PATCH', body: { countdown_enabled: cb.checked } }); }
        catch(e){ cb.checked = !cb.checked; alert('That didn\u2019t work: ' + e.message); }
      });
    });
    pane.querySelectorAll('[data-w5ach]').forEach(function(b){
      b.addEventListener('click', async function(){
        try {
          await rest('/coach_client_goals?id=eq.' + b.dataset.w5ach, { method: 'PATCH', body: { achieved_at: new Date().toISOString() } });
          try { await rest('/coach_client_events', { method: 'POST', body: { partner_id: partnerId, member_email: c.member_email, kind: 'goal_achieved', label: 'Goal achieved' } }); } catch(_){}
          w5Goals();
        } catch(e){ alert('That didn\u2019t work: ' + e.message); }
      });
    });
    pane.querySelectorAll('[data-w5del]').forEach(function(b){
      b.addEventListener('click', async function(){
        if (!confirm('Remove this goal?')) return;
        try { await rest('/coach_client_goals?id=eq.' + b.dataset.w5del, { method: 'PATCH', body: { active: false } }); w5Goals(); }
        catch(e){ alert('That didn\u2019t work: ' + e.message); }
      });
    });
  }

  /* ── Plans tab — assignments editor + water goal + slim gates (#46/#57/#61) ── */
  function w5Plans(){
    var pane = $c('w5-pane'), c = w5.c, asg = c.assignments || {};
    function slotSel(sl){
      var key = { onboarding: 'onboarding_form_id', checkin: 'checkin_form_id', habits: 'habits_template_id', workout: 'workout_template_id', nutrition: 'nutrition_template_id', supplements: 'supplements_template_id' }[sl.slot];
      var cur = asg[key] || '';
      var pool = sl.slot === 'onboarding' || sl.slot === 'checkin'
        ? lib.forms.filter(function(f){ return f.kind === sl.slot; }).map(function(f){ return { id: f.id, label: f.title }; })
        : lib.tpls.filter(function(t){ return wkKindMatch(sl.slot, t.kind); }).map(function(t){ return { id: t.id, label: t.name + (t.kind === 'program' ? ' (programme)' : '') }; });
      return '<div class="field"><label>' + sl.col + '</label><select class="w5-asg" data-key="' + key + '"><option value="">None</option>' +
        pool.map(function(p){ return '<option value="' + p.id + '"' + (p.id === cur ? ' selected' : '') + '>' + esc(p.label) + '</option>'; }).join('') + '</select></div>';
    }
    var g = asg.gates || {};
    pane.innerHTML =
      '<div class="w5-sec">Assigned plans</div>' +
      '<div class="field-row">' + slotSel(SLOTS[0]) + slotSel(SLOTS[1]) + '</div>' +
      '<div class="field-row">' + slotSel(SLOTS[2]) + slotSel(SLOTS[3]) + '</div>' +
      '<div class="field-row">' + slotSel(SLOTS[4]) + slotSel(SLOTS[5]) + '</div>' +
      '<div class="w5-sec" style="margin-top:14px;">Daily water goal</div>' +
      '<div class="field" style="max-width:220px;"><label>Litres per day (blank = app default)</label><input id="w5-water" type="number" min="0.5" max="8" step="0.1" value="' + (asg.water_goal || '') + '"/></div>' +
      '<div class="w5-sec" style="margin-top:14px;">Client app features</div>' +
      '<div class="w5-box">' +
        '<label style="font-size:12.5px;display:flex;align-items:center;gap:8px;margin-bottom:8px;"><input type="checkbox" id="w5-gate-lc"' + (g.load_calc === true ? ' checked' : '') + '/> Show estimated 1-rep max on exercises (from their logged sets)</label>' +
        '<label style="font-size:12.5px;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="w5-gate-el"' + (g.exercise_library !== false ? ' checked' : '') + '/> Allow swapping to any exercise in the library (off = only your approved swaps)</label>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:10px;"><button class="btn btn-primary" type="button" id="w5-plans-save" style="font-size:12px;">Save</button><span id="w5-plans-msg" style="font-size:12px;color:var(--text-muted);"></span></div>';
    $c('w5-plans-save').addEventListener('click', async function(){
      var na = {};
      pane.querySelectorAll('.w5-asg').forEach(function(sel){ if (sel.value) na[sel.dataset.key] = sel.value; });
      na.water_goal = $c('w5-water').value === '' ? null : parseFloat($c('w5-water').value);
      na.gates = { load_calc: $c('w5-gate-lc').checked, exercise_library: $c('w5-gate-el').checked };
      var msg = $c('w5-plans-msg'); this.disabled = true; msg.textContent = 'Saving\u2026';
      try {
        var r = await ef({ action: 'update_assignments', email: c.member_email, assignments: na });
        c.assignments = r.assignments || na; asg = c.assignments;
        if (r.applied && !r.applied.error){
          var a = r.applied, bits = [];
          if (a.workout) bits.push('programme');
          if (a.habits) bits.push(a.habits + ' habits');
          if (a.nutrition) bits.push('nutrition');
          if (a.supplements) bits.push(a.supplements + ' supplements');
          var autoBit = (r.automations && r.automations.length) ? ' Update email sent to your client.' : '';
          msg.textContent = (bits.length ? 'Saved \u2014 pushed to their app (' + bits.join(', ') + ').' : 'Saved.') + autoBit;
        } else if (r.applied && r.applied.error) msg.textContent = 'Saved, but apply failed: ' + r.applied.error;
        else msg.textContent = 'Saved \u2014 applies when they accept your terms.';
      } catch(e){ msg.textContent = 'Save failed: ' + e.message; }
      this.disabled = false;
    });
  }

  /* ── #60 chat popover over coach_messages ── */
  function w5ChatClose(){
    var open = $c('w5-chat-pop');
    if (open) open.remove();
    if (w5.chatTimer){ clearInterval(w5.chatTimer); w5.chatTimer = null; }
  }
  (function(){ var x = $c('cl-detail-close'); if (x) x.addEventListener('click', w5ChatClose); })();
  async function w5ChatToggle(){
    var open = $c('w5-chat-pop');
    if (open){ w5ChatClose(); return; }
    var el = document.createElement('div');
    el.className = 'w5-chat'; el.id = 'w5-chat-pop';
    el.innerHTML = '<div style="padding:9px 12px;border-bottom:1px solid var(--border);font-size:12.5px;font-weight:700;">' + esc(nameOf(w5.c)) + '</div>' +
      '<div class="w5-chat-log" id="w5-chat-log"></div>' +
      '<div style="display:flex;gap:6px;padding:8px;border-top:1px solid var(--border);">' +
        '<input id="w5-chat-in" maxlength="4000" placeholder="Message\u2026" style="flex:1;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12.5px;padding:7px 10px;"/>' +
        '<button class="btn btn-primary" type="button" id="w5-chat-send" style="font-size:12px;">Send</button></div>';
    document.body.appendChild(el);
    async function load(){
      try {
        var ms = await rest('/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(w5.c.member_email) + '&order=created_at.desc&limit=30&select=sender,body,created_at') || [];
        var log = $c('w5-chat-log'); if (!log) return;
        log.innerHTML = ms.reverse().map(function(m){
          return '<div class="w5-msg ' + (m.sender === 'coach' ? 'me' : 'them') + '">' + esc(m.body) + '<div style="font-size:9.5px;opacity:.7;margin-top:2px;">' + w5fmt(m.created_at) + '</div></div>';
        }).join('') || '<p style="color:var(--text-muted);">No messages yet.</p>';
        log.scrollTop = log.scrollHeight;
      } catch(_){}
    }
    load();
    w5.chatTimer = setInterval(function(){
      var card = $c('cl-detail-card');
      if (!card || card.style.display === 'none' || card.offsetParent === null){ w5ChatClose(); return; }
      load();
    }, 15000);
    async function send(){
      var inp = $c('w5-chat-in'), txt = inp.value.trim();
      if (!txt) return;
      inp.value = '';
      try {
        await rest('/coach_messages', { method: 'POST', body: { partner_id: partnerId, member_email: w5.c.member_email, sender: 'coach', body: txt } });
        load();
      } catch(e){ alert('Send failed: ' + e.message); }
    }
    $c('w5-chat-send').addEventListener('click', send);
    $c('w5-chat-in').addEventListener('keydown', function(e){ if (e.key === 'Enter') send(); });
  }
  /* ============================ end PM-987 Wave 5 ============================ */

