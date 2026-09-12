  async function loadExerciseNames(){
    if (exerciseNames.length) return;
    try {
      var rows = await rest('/workout_plans?select=exercise_name&order=exercise_name.asc');
      var seen = {};
      exerciseNames = (rows||[]).map(function(r){ return r.exercise_name; }).filter(function(n){ if (!n || seen[n]) return false; seen[n] = 1; return true; });
    } catch(e){ exerciseNames = []; }
  }
  /* ── Leads inbox + Calendar (PM-959) ── */
  var leadFormMap = null, partnerSlug = null;
  async function partnerSlugGet(){
    if (partnerSlug !== null) return partnerSlug;
    try { var p = await rest('/partner_partners?id=eq.' + partnerId + '&select=slug&limit=1'); partnerSlug = (p && p[0] && p[0].slug) || ''; }
    catch(e){ partnerSlug = ''; }
    return partnerSlug;
  }
  async function leadsLoad(){
    var slug = await partnerSlugGet();
    var link = slug ? ('www.vyvehealth.co.uk/lead/' + slug) : 'Link available once your partner profile has a handle \u2014 contact the VYVE team.';
    $c('lead-link').textContent = link;
    $c('lead-copy').style.display = slug ? '' : 'none';
    var el = $c('lead-list');
    var res = [[],[]];
    try {
      res = await Promise.all([
        rest('/coach_leads?' + pscope() + '&order=created_at.desc&limit=100&select=id,name,email,answers,form_id,status,created_at'),
        rest('/coach_forms?' + pscope() + '&kind=eq.lead&select=id,questions')
      ]);
    } catch(e){}
    var leads = res[0] || [];
    leadFormMap = {};
    (res[1] || []).forEach(function(f){ leadFormMap[f.id] = f.questions || []; });
    if (!leads.length){
      el.innerHTML = '<div class="empty-state"><h3>No leads yet</h3><p>Build a lead form under Forms, then share your link \u2014 submissions land here and you get an email each time.</p></div>';
      return;
    }
    el.innerHTML = leads.map(function(L){
      var qs = leadFormMap[L.form_id] || [];
      var extra = '';
      qs.forEach(function(q){
        var v = (L.answers || {})[q.id];
        if (v === undefined || v === null || v === '') return;
        extra += '<div style="font-size:12px;margin-top:3px;"><span style="color:var(--text-muted);">' + esc(q.label) + ':</span> ' + esc(String(v)) + '</div>';
      });
      var stBadge = L.status === 'new' ? '<span class="src-tag" style="background:rgba(232,131,74,.13);color:#E8834A;border:1px solid rgba(232,131,74,.45);">New</span>'
        : L.status === 'contacted' ? '<span class="src-tag src-vyve">Contacted</span>' : '<span class="src-tag" style="opacity:.6;">Archived</span>';
      var acts = '';
      if (L.status === 'new') acts += '<button class="btn" data-ld-st="contacted" data-ld="' + L.id + '" style="font-size:11.5px;">Mark contacted</button> ';
      if (L.status !== 'archived') acts += '<button class="btn" data-ld-st="archived" data-ld="' + L.id + '" style="font-size:11.5px;">Archive</button>';
      return '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px;' + (L.status === 'new' ? 'border-left:3px solid #E8834A;' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-size:13.5px;">' + esc(L.name || 'Someone') + '</strong>' + stBadge +
        '<span style="font-size:11.5px;color:var(--text-muted);margin-left:auto;">' + new Date(L.created_at).toLocaleDateString('en-GB') + '</span></div>' +
        '<div style="font-size:12.5px;color:var(--teal-lt);margin-top:2px;">' + esc(L.email || '') + '</div>' + extra +
        '<div style="display:flex;gap:6px;margin-top:8px;">' + acts + '</div></div>';
    }).join('');
    el.querySelectorAll('[data-ld]').forEach(function(b){
      b.addEventListener('click', async function(){
        b.disabled = true;
        try { await rest('/coach_leads?id=eq.' + b.dataset.ld, { method: 'PATCH', body: { status: b.dataset.ldSt } }); leadsLoad(); }
        catch(e){ alert('That didn\u2019t save: ' + e.message); b.disabled = false; }
      });
    });
  }
  $c('lead-copy').addEventListener('click', async function(){
    try { await navigator.clipboard.writeText('https://' + $c('lead-link').textContent); this.textContent = 'Copied \u2713'; var self = this; setTimeout(function(){ self.textContent = 'Copy link'; }, 1800); }
    catch(e){ prompt('Copy your lead link:', 'https://' + $c('lead-link').textContent); }
  });

  async function calLoad(){
    var el = $c('cal-list');
    el.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    var rows = [];
    try { rows = await rest('/coach_sessions?' + pscope() + '&status=eq.scheduled&starts_at=gte.' + encodeURIComponent(new Date(Date.now() - 3600e3).toISOString()) + '&order=starts_at.asc&limit=60&select=id,member_email,title,starts_at,duration_minutes,link_url,notes') || []; } catch(e){}
    // client picker
    var sel = $c('calf-client');
    var actives = roster.filter(function(c){ return c.status !== 'archived'; });
    sel.innerHTML = actives.map(function(c){ return '<option value="' + esc(c.member_email) + '">' + esc(nameOf(c)) + '</option>'; }).join('');
    if (!rows.length){ el.innerHTML = '<div class="empty-state"><h3>Nothing booked</h3><p>Book a call and it appears in your client\u2019s VYVE app with a Join button.</p></div>'; return; }
    var lastDay = null, html = '';
    rows.forEach(function(s){
      var d = new Date(s.starts_at);
      var day = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      if (day !== lastDay){ html += '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 6px;">' + day + '</div>'; lastDay = day; }
      var who = nameOf(roster.find(function(c){ return c.member_email === s.member_email; }) || { member_email: s.member_email });
      html += '<div style="display:flex;gap:12px;align-items:center;padding:10px 8px;border-bottom:1px solid var(--border);flex-wrap:wrap;">' +
        '<div style="font-weight:700;font-size:13px;min-width:52px;">' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</div>' +
        '<div style="flex:1;min-width:180px;"><div style="font-size:13px;font-weight:600;">' + esc(s.title) + ' \u00b7 ' + esc(who) + '</div>' +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + s.duration_minutes + ' min' + (s.notes ? ' \u00b7 ' + esc(s.notes) : '') + '</div></div>' +
        (s.link_url ? '<a class="btn" href="' + esc(s.link_url) + '" target="_blank" rel="noopener" style="font-size:11.5px;">Open link</a>' : '') +
        '<button class="btn" data-cal-del="' + s.id + '" style="font-size:11.5px;">Cancel</button></div>';
    });
    el.innerHTML = html;
    el.querySelectorAll('[data-cal-del]').forEach(function(b){
      b.addEventListener('click', async function(){
        if (!confirm('Cancel this call? Your client will stop seeing it in their app.')) return;
        b.disabled = true;
        try { await rest('/coach_sessions?id=eq.' + b.dataset.calDel, { method: 'PATCH', body: { status: 'cancelled' } }); calLoad(); }
        catch(e){ alert('Cancel failed: ' + e.message); b.disabled = false; }
      });
    });
  }
  $c('cal-new').addEventListener('click', function(){ $c('cal-editor').style.display = ''; $c('calf-msg').textContent = ''; });
  $c('calf-cancel').addEventListener('click', function(){ $c('cal-editor').style.display = 'none'; });
  $c('calf-save').addEventListener('click', async function(){
    var msg = $c('calf-msg');
    var em = $c('calf-client').value, title = $c('calf-title').value.trim(), when = $c('calf-when').value;
    var mins = parseInt($c('calf-mins').value) || 30, link = $c('calf-link').value.trim();
    if (!em){ msg.textContent = 'Add a client first.'; return; }
    if (!title){ msg.textContent = 'Give the call a title.'; return; }
    if (!when){ msg.textContent = 'Pick a date and time.'; return; }
    if (link && !/^https?:\/\//i.test(link)){ msg.textContent = 'The call link should start with https://'; return; }
    this.disabled = true; msg.textContent = 'Booking\u2026';
    try {
      await rest('/coach_sessions', { method: 'POST', body: {
        partner_id: partnerId, member_email: em, title: title,
        starts_at: new Date(when).toISOString(), duration_minutes: mins,
        link_url: link || null, notes: $c('calf-notes').value.trim() || null
      }});
      $c('cal-editor').style.display = 'none';
      $c('calf-title').value = ''; $c('calf-link').value = ''; $c('calf-notes').value = '';
      calLoad();
    } catch(e){ msg.textContent = 'Booking failed: ' + e.message; }
    this.disabled = false;
  });

  /* ── Automations editor (PM-958g) ── */
  var AUTO_EVENTS_UI = [
    ['workout_updated', 'Workout plan updated'],
    ['habits_updated', 'Habits updated'],
    ['nutrition_updated', 'Nutrition updated'],
    ['supplements_updated', 'Supplement plan updated']
  ];
  var AUTO_DEFAULTS = {
    workout_updated: { subject: '{{coach_name}} updated your training plan', body: 'Hi {{first_name}},\n\n{{coach_name}} has just updated your training \u2014 "{{plan_name}}" is live in your VYVE app now. Open Workouts to see what\u2019s changed.\n\nKeep going,\nVYVE Health' },
    habits_updated: { subject: '{{coach_name}} updated your daily habits', body: 'Hi {{first_name}},\n\n{{coach_name}} has refreshed your daily habits \u2014 "{{plan_name}}" is live in your VYVE app. They\u2019ll appear on your habits screen from today.\n\nKeep going,\nVYVE Health' },
    nutrition_updated: { subject: '{{coach_name}} updated your nutrition targets', body: 'Hi {{first_name}},\n\n{{coach_name}} has updated your nutrition \u2014 "{{plan_name}}" now sets your calories and macros in the VYVE app. Open Nutrition to see your new targets.\n\nKeep going,\nVYVE Health' },
    supplements_updated: { subject: '{{coach_name}} updated your supplement plan', body: 'Hi {{first_name}},\n\n{{coach_name}} has updated your supplement plan \u2014 "{{plan_name}}" is live in your VYVE app under Nutrition.\n\nKeep going,\nVYVE Health' }
  };
  var autoRows = {};
  async function autoLoad(){
    var el = $c('auto-list');
    try {
      var rows = await rest('/coach_automations?' + pscope() + '&select=event,enabled,subject,body,channel') || [];
      autoRows = {}; rows.forEach(function(r){ autoRows[r.event] = r; });
    } catch(e){ autoRows = {}; }
    el.innerHTML = AUTO_EVENTS_UI.map(function(ev){
      var key = ev[0], label = ev[1];
      var cfg = autoRows[key] || {};
      var on = cfg.enabled !== false;
      var subj = (cfg.subject != null && cfg.subject !== '') ? cfg.subject : AUTO_DEFAULTS[key].subject;
      var bdy = (cfg.body != null && cfg.body !== '') ? cfg.body : AUTO_DEFAULTS[key].body;
      return '<div class="auto-card" data-ev="' + key + '" style="border:1px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:12px;' + (on ? '' : 'opacity:.6;') + '">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><strong style="font-size:13.5px;flex:1;">' + label + '</strong>' +
        '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text-muted);cursor:pointer;"><input type="checkbox" class="au-on"' + (on ? ' checked' : '') + ' style="accent-color:var(--vyve-teal);width:16px;height:16px;"/> ' + (on ? 'On' : 'Off') + '</label></div>' +
        '<div class="field" style="margin-bottom:8px;"><label>Send as</label><select class="au-chan"><option value="email"' + ((cfg.channel||'email')==='email'?' selected':'') + '>Email</option><option value="message"' + (cfg.channel==='message'?' selected':'') + '>In-app message</option><option value="both"' + (cfg.channel==='both'?' selected':'') + '>Email + in-app message</option></select></div>' +
        '<div class="field" style="margin-bottom:8px;"><label>Subject (email only)</label><input class="au-subj" type="text" maxlength="160" value="' + esc(subj) + '"/></div>' +
        '<div class="field"><label>Email message</label><textarea class="au-body" rows="5" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;">' + esc(bdy) + '</textarea></div>' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:8px;"><button class="btn btn-primary au-save" type="button" style="font-size:12px;">Save</button>' +
        '<button class="btn au-reset" type="button" style="font-size:12px;">Reset to default</button>' +
        '<span class="au-msg" style="font-size:12px;color:var(--text-muted);"></span></div></div>';
    }).join('');
    el.querySelectorAll('.auto-card').forEach(function(card){
      var key = card.dataset.ev;
      var onBox = card.querySelector('.au-on');
      async function save(){
        var msg = card.querySelector('.au-msg'); msg.textContent = 'Saving\u2026';
        var body = {
          partner_id: partnerId, event: key,
          enabled: onBox.checked,
          channel: card.querySelector('.au-chan').value || 'email',
          subject: card.querySelector('.au-subj').value.trim() || null,
          body: card.querySelector('.au-body').value.trim() || null,
          updated_at: new Date().toISOString()
        };
        try {
          if (autoRows[key]) await rest('/coach_automations?' + pscope() + '&event=eq.' + key, { method: 'PATCH', body: body });
          else { await rest('/coach_automations', { method: 'POST', body: body }); autoRows[key] = body; }
          autoRows[key] = body;
          card.style.opacity = onBox.checked ? '' : '.6';
          var chLbl = { email: 'as an email', message: 'as an in-app message', both: 'as email + in-app message' }[body.channel] || 'as an email';
          msg.textContent = onBox.checked ? ('Saved \u2014 sends ' + chLbl + ' when you update this plan.') : 'Saved \u2014 this automation is off.';
        } catch(e){ msg.textContent = 'Save failed: ' + e.message; }
      }
      card.querySelector('.au-save').addEventListener('click', save);
      onBox.addEventListener('change', save);
      card.querySelector('.au-chan').addEventListener('change', save);
      card.querySelector('.au-reset').addEventListener('click', function(){
        card.querySelector('.au-subj').value = AUTO_DEFAULTS[key].subject;
        card.querySelector('.au-body').value = AUTO_DEFAULTS[key].body;
        save();
      });
    });
  }

  /* ── Notifications feed + check-in review (PM-958e) ── */
  var nfEvents = [], nfFilter = 'all', nfLoadedAt = 0;
  var DIFF_LBL = { 1:'Easy', 2:'Fine', 3:'Solid', 4:'Hard', 5:'Brutal' };
  function nfSeenKey(){ return 'vyve-coach-seen-' + (partnerId || ''); }
  function nfSeen(){ try { return localStorage.getItem(nfSeenKey()) || ''; } catch(_) { return ''; } }
  function nfBadge(){
    var seen = nfSeen();
    var n = nfEvents.filter(function(e){ return !seen || e.t > seen; }).length;
    var b = $c('cp-notif-badge');
    if (!b) return;
    b.textContent = n > 20 ? '20+' : String(n);
    b.style.display = n ? '' : 'none';
  }
  async function notifLoad(interactive){
    if (!partnerId) return;
    var now = Date.now();
    if (!interactive && now - nfLoadedAt < 60000) { nfBadge(); return; }
    var actives = roster.filter(function(c){ return c.status === 'active' && c.consent_accepted_at; });
    var emails = actives.map(function(c){ return c.member_email; });
    var inList = emails.map(function(e){ return '"' + e + '"'; }).join(',');
    var qs = [
      emails.length ? rest('/workouts?member_email=in.(' + encodeURIComponent(inList) + ')&order=logged_at.desc&limit=40&select=member_email,workout_name,duration_minutes,difficulty_rating,member_note,logged_at').catch(function(){ return []; }) : Promise.resolve([]),
      rest('/coach_form_responses?' + pscope() + '&order=submitted_at.desc&limit=40&select=id,member_email,form_id,week_start,submitted_at,reviewed_at').catch(function(){ return []; }),
      emails.length ? rest('/members?email=in.(' + encodeURIComponent(inList) + ')&select=email,trial_ends_at,subscription_status').catch(function(){ return []; }) : Promise.resolve([])
    ];
    var res = await Promise.all(qs);
    var ev = [];
    (res[0] || []).forEach(function(x){
      var d = 'Completed ' + (x.workout_name || 'a workout') + (x.duration_minutes ? ' \u00b7 ' + x.duration_minutes + ' min' : '');
      if (x.difficulty_rating) d += ' \u00b7 felt ' + (DIFF_LBL[x.difficulty_rating] || x.difficulty_rating) + ' (' + x.difficulty_rating + '/5)';
      ev.push({ t: x.logged_at, kind: 'workout', email: x.member_email, title: d, note: x.member_note || '' });
    });
    (res[1] || []).forEach(function(x){
      ev.push({ t: x.submitted_at, kind: 'checkin', email: x.member_email, title: 'Submitted a check-in' + (x.week_start ? ' (w/c ' + x.week_start + ')' : ''), note: '', unreviewed: !x.reviewed_at });
    });
    roster.forEach(function(c){
      if (c.consent_accepted_at) ev.push({ t: c.consent_accepted_at, kind: 'client', email: c.member_email, title: 'Accepted your terms \u2014 coaching active', note: '' });
    });
    (res[2] || []).forEach(function(m){
      if (!m.trial_ends_at || m.subscription_status !== 'trial') return;
      var days = Math.ceil((new Date(m.trial_ends_at) - Date.now()) / 864e5);
      /* PM-1218: stamp the reminder with the moment it became due (5 days out, or the
         trial end itself once passed) — new Date() made every trial row read as "just
         now", sit at the top, stay highlighted and keep the badge lit for ever. */
      if (days <= 5){
        var te = new Date(m.trial_ends_at), due = days < 0 ? te : new Date(te.getTime() - 5 * 864e5);
        if (due > new Date()) due = new Date();
        ev.push({ t: due.toISOString(), kind: 'trial', email: m.email, title: days < 0 ? 'Trial ended \u2014 \u00a310/month email sent' : ('Trial ends in ' + days + ' day' + (days === 1 ? '' : 's')), note: '', when: (days < 0 ? 'Ended ' : 'Ends ') + te.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) });
      }
    });
    nfEvents = ev.filter(function(e){ return e.t; }).sort(function(a, b){ return (b.t || '').localeCompare(a.t || ''); }).slice(0, 80);
    nfLoadedAt = now;
    nfBadge();
    if (interactive){
      nfRender();
      try { localStorage.setItem(nfSeenKey(), new Date().toISOString()); } catch(_){}
    }
  }
  function nfRender(){
    var el = $c('nf-feed');
    var seen = nfSeen();
    var rows = nfEvents.filter(function(e){ return nfFilter === 'all' || e.kind === nfFilter; });
    if (!rows.length){ el.innerHTML = '<div class="empty-state"><h3>Nothing yet</h3><p>Client activity lands here \u2014 workouts, check-ins, activations and trial deadlines.</p></div>'; nfBadge(); return; }
    var ICON = { workout: '\ud83c\udfcb', checkin: '\ud83d\udcdd', client: '\u2705', trial: '\u23f3' };
    function dayLabel(t){
      var d = new Date(t), today = new Date();
      var diff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
      return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    var html = '', lastDay = null;
    rows.forEach(function(e){
      var dl = dayLabel(e.t);
      if (dl !== lastDay){ html += '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 6px;">' + dl + '</div>'; lastDay = dl; }
      var who = nameOf(roster.find(function(c){ return c.member_email === e.email; }) || { member_email: e.email });
      var fresh = !seen || e.t > seen;
      html += '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 8px;border-bottom:1px solid var(--border);' + (fresh ? 'background:rgba(27,120,120,.06);border-radius:8px;' : '') + '">' +
        '<div style="font-size:17px;flex:none;">' + ICON[e.kind] + '</div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:13px;"><strong>' + esc(who) + '</strong> \u2014 ' + esc(e.title) + (e.unreviewed ? ' <span style="color:#E8834A;font-size:11px;font-weight:700;">\u25cf needs review</span>' : '') + '</div>' +
        (e.note ? '<div style="font-size:12.5px;color:var(--text-muted);font-style:italic;">\u201c' + esc(e.note) + '\u201d</div>' : '') +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + new Date(e.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</div></div>' +
        '<button class="btn" data-nf-view="' + esc(e.email) + '" style="font-size:11.5px;flex:none;">' + (e.kind === 'checkin' ? 'Review' : 'View') + '</button></div>';
    });
    el.innerHTML = html;
    el.querySelectorAll('[data-nf-view]').forEach(function(b){
      b.addEventListener('click', function(){
        go('clients');
        viewClient(b.dataset.nfView);
        setTimeout(function(){ var t = $c('cd-checkins'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
      });
    });
    nfBadge();
  }
  document.querySelectorAll('.nf-f').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.nf-f').forEach(function(x){ x.classList.remove('active'); x.classList.remove('btn-primary'); });
      b.classList.add('active'); b.classList.add('btn-primary');
      nfFilter = b.dataset.f; nfRender();
    });
  });

  /* ── Client check-in review timeline ── */
