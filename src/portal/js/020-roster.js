  function renderRoster(){
    var el = $c('cl-list');
    if (!roster.length){ el.innerHTML = '<div class="empty-state"><h3>No clients yet</h3><p>Add your first client to send them their VYVE login.</p></div>'; return; }
    el.innerHTML = roster.map(function(c){
      var acts = '';
      if (c.status === 'invited') acts = '<button class="btn" data-act="resend" data-em="' + esc(c.member_email) + '" style="font-size:11.5px;">Resend invite</button> <button class="btn" data-act="copy_link" data-em="' + esc(c.member_email) + '" style="font-size:11.5px;">Copy link</button> ';
      if (c.status !== 'archived') acts += '<button class="btn" data-act="view" data-em="' + esc(c.member_email) + '" style="font-size:11.5px;">View</button> <button class="btn" data-act="archive" data-em="' + esc(c.member_email) + '" style="font-size:11.5px;">Archive</button>';
      else acts += '<button class="btn" data-act="reactivate" data-em="' + esc(c.member_email) + '" style="font-size:11.5px;">Reactivate</button>';
      var sub = c.status === 'invited' ? 'Invited ' + (c.invite_sent_at ? new Date(c.invite_sent_at).toLocaleDateString('en-GB') : '') + (c.invite_count > 1 ? ' \u00b7 ' + c.invite_count + ' invites sent' : '') : esc(c.member_email);
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--border);flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:180px;"><div style="font-weight:600;">' + esc(nameOf(c)) + '</div><div style="font-size:12px;color:var(--text-muted);">' + sub + '</div></div>' +
        badge(c.status) + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + acts + '</div></div>';
    }).join('');
    el.querySelectorAll('[data-act]').forEach(function(b){ b.addEventListener('click', function(){ act(b.dataset.act, b.dataset.em, b); }); });
  }
  async function loadClients(){
    roster = await rest('/coach_clients?' + pscope() + '&order=created_at.desc&select=*') || [];
    var emails = roster.map(function(c){ return '"' + c.member_email + '"'; }).join(',');
    memberMap = {};
    if (roster.length){
      try {
        var ms = await rest('/members?email=in.(' + encodeURIComponent(emails.replace(/"/g,'')) + ')&select=email,first_name,last_name,last_active_at,weight_kg') || [];
        ms.forEach(function(m){ memberMap[(m.email||'').toLowerCase()] = m; });
      } catch(e){ /* unconsented rows simply not visible \u2014 expected */ }
    }
    renderRoster();
  }
  async function act(a, em, btn){
    if (a === 'view') return viewClient(em);
    if (a === 'archive' && !confirm('Archive this client? They keep their VYVE membership (and your \u00a35/month continues) \u2014 you just stop managing their training.')) return;
    var old = btn.textContent; btn.disabled = true; btn.textContent = '\u2026';
    try {
      var r = await ef({ action: a, email: em });
      if (a === 'copy_link' && r.invite_link){
        $c('cl-link-row').style.display = '';
        $c('cl-link-input').value = r.invite_link;
        try { await navigator.clipboard.writeText(r.invite_link); btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = old; btn.disabled = false; }, 1500); return; } catch(_){}
      }
      if (a === 'resend'){ btn.textContent = r.email_sent ? 'Sent!' : 'Link made \u2014 email failed'; setTimeout(function(){ btn.textContent = old; btn.disabled = false; }, 2000); return; }
      await loadClients();
    } catch(e){ alert('That didn\u2019t work: ' + e.message); btn.textContent = old; btn.disabled = false; }
  }
  async function viewClient(em){
    var c = roster.find(function(x){ return x.member_email === em; });
    $c('cl-detail-card').style.display = '';
    $c('cl-detail-name').textContent = nameOf(c);
    var body = $c('cl-detail-body');
    body.innerHTML = '<p style="color:var(--text-muted);font-size:12.5px;">Loading\u2026</p>';
    var enc = encodeURIComponent(em), since30 = new Date(Date.now()-30*864e5).toISOString(), since7 = new Date(Date.now()-7*864e5).toISOString().slice(0,10);
    var consented = c.status === 'active' && c.consent_accepted_at;
    var res = [[],[],[],[],[]];
    if (consented){
      res = await Promise.all([
        rest('/weight_logs?member_email=eq.' + enc + '&order=logged_at.desc&limit=3&select=weight_kg,logged_at').catch(function(){return [];}),
        rest('/workouts?member_email=eq.' + enc + '&logged_at=gte.' + encodeURIComponent(since30) + '&order=logged_at.desc&select=workout_name,duration_minutes,logged_at,difficulty_rating,member_note').catch(function(){return [];}),
        rest('/daily_habits?member_email=eq.' + enc + '&activity_date=gte.' + since7 + '&select=habit_id,activity_date,habit_completed,value,notes').catch(function(){return [];}),
        rest('/coach_form_responses?member_email=eq.' + enc + '&order=submitted_at.desc&limit=3&select=answers,week_start,submitted_at').catch(function(){return [];}),
        rest('/members?email=eq.' + enc + '&select=last_active_at,trial_ends_at,subscription_status,macro_override,tdee_target').catch(function(){return [];}),
        rest('/nutrition_logs?member_email=eq.' + enc + '&activity_date=gte.' + since7 + '&select=activity_date,calories_kcal,protein_g').catch(function(){return [];})
      ]);
    }
    var w = res[0] && res[0][0], wkRows = res[1]||[], wk = wkRows.length, hb = (res[2]||[]).length, cis = res[3]||[], mrow = (res[4]||[])[0] || {};
    var nlogs = res[5] || [];
    var mhRows = [], hlMap = {};
    if (consented){
      try {
        mhRows = await rest('/member_habits?member_email=eq.' + enc + '&active=eq.true&select=habit_id') || [];
        if (mhRows.length){
          var ids = mhRows.map(function(x){ return x.habit_id; }).join(',');
          (await rest('/habit_library?id=in.(' + ids + ')&select=id,habit_title,input_rule,health_rule') || []).forEach(function(x){ hlMap[x.id] = x; });
        }
      } catch(_){}
    }

    // ── Header stats ──
    var stats = '<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12.5px;color:var(--text-muted);margin-bottom:14px;">' +
      '<span>Status: <strong style="color:var(--text);">' + c.status + '</strong></span>' +
      (mrow.trial_ends_at ? '<span>Trial ends: <strong style="color:var(--text);">' + new Date(mrow.trial_ends_at).toLocaleDateString('en-GB') + '</strong></span>' : '') +
      (mrow.last_active_at ? '<span>Last active: <strong style="color:var(--text);">' + new Date(mrow.last_active_at).toLocaleDateString('en-GB') + '</strong></span>' : '') +
      (consented ? '<span>Workouts 30d: <strong style="color:var(--text);">' + wk + '</strong></span><span>Habits 7d: <strong style="color:var(--text);">' + hb + '</strong></span>' + (w ? '<span>Weight: <strong style="color:var(--text);">' + w.weight_kg + ' kg</strong></span>' : '') : '') +
      '</div>';

    // ── Assignments editor (works at any status) ──
    var asg = c.assignments || {};
    function slotSel(sl){
      var key = { onboarding:'onboarding_form_id', checkin:'checkin_form_id', habits:'habits_template_id', workout:'workout_template_id', nutrition:'nutrition_template_id', supplements:'supplements_template_id' }[sl.slot];
      var cur = asg[key] || '';
      var pool = sl.slot === 'onboarding' || sl.slot === 'checkin'
        ? lib.forms.filter(function(f){ return f.kind === sl.slot; }).map(function(f){ return { id: f.id, label: f.title }; })
        : lib.tpls.filter(function(t){ return wkKindMatch(sl.slot, t.kind); }).map(function(t){ return { id: t.id, label: t.name + (t.kind === 'program' ? ' (programme)' : '') }; });
      return '<div class="field"><label>' + sl.col + '</label><select class="cd-asg" data-key="' + key + '"><option value="">None</option>' +
        pool.map(function(p){ return '<option value="' + p.id + '"' + (p.id === cur ? ' selected' : '') + '>' + esc(p.label) + '</option>'; }).join('') + '</select></div>';
    }
    var asgHtml = '<div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px;">Assigned plans</div>' +
      '<div class="field-row">' + slotSel(SLOTS[0]) + slotSel(SLOTS[1]) + '</div>' +
      '<div class="field-row">' + slotSel(SLOTS[2]) + slotSel(SLOTS[3]) + '</div>' +
      '<div class="field-row">' + slotSel(SLOTS[4]) + slotSel(SLOTS[5]) + '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin:4px 0 16px;"><button class="btn btn-primary" id="cd-asg-save" type="button" style="font-size:12px;">Save assignments</button><span id="cd-asg-msg" style="font-size:12px;color:var(--text-muted);"></span></div>';

    // \u2500\u2500 Nutrition adherence (PM-960d) \u2500\u2500
    var nutHtml = '';
    if (consented){
      var mo = mrow.macro_override || {};
      var kcalT = parseInt(mo.calories || mrow.tdee_target || 0) || 0;
      var protT = parseInt(mo.protein || 0) || 0;
      var byDay = {};
      nlogs.forEach(function(n){ var d = byDay[n.activity_date] = byDay[n.activity_date] || { k: 0, p: 0 }; d.k += (parseFloat(n.calories_kcal) || 0); d.p += (parseFloat(n.protein_g) || 0); });
      var days = [];
      for (var di = 6; di >= 0; di--){
        var dd = new Date(Date.now() - di * 864e5);
        var ds = dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
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
      nutHtml = '<div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px;">Nutrition \u2014 last 7 days' + (kcalT ? ' (target ' + kcalT + ' kcal' + (protT ? ' \u00b7 ' + protT + 'g protein' : '') + ')' : '') + '</div>' +
        '<div style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:16px;">' + rows7 +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">' + loggedDays + '/7 days logged' + (kcalT ? ' \u00b7 green = within 10% of target' : ' \u00b7 no coach targets set \u2014 assign a nutrition plan to track against') + '</div></div>';
    }

    // ── Activity log ──
    var events = [];
    if (c.created_at) events.push({ t: c.created_at, label: 'Client created' + (c.invite_sent_at ? ', invite email sent' : '') });
    if (c.invite_count > 1 && c.invite_sent_at) events.push({ t: c.invite_sent_at, label: 'Invite re-sent (' + c.invite_count + ' total)' });
    if (c.coach_terms_accepted_at) events.push({ t: c.coach_terms_accepted_at, label: 'Accepted your terms' });
    if (c.consent_accepted_at) events.push({ t: c.consent_accepted_at, label: 'Accepted data sharing \u2014 coaching active' });
    if (c.archived_at && c.status === 'archived') events.push({ t: c.archived_at, label: 'Archived' });
    (res[1]||[]).slice(0,5).forEach(function(x){ events.push({ t: x.completed_at, label: 'Completed a workout' }); });
    (res[0]||[]).forEach(function(x){ events.push({ t: x.logged_at, label: 'Logged weight: ' + x.weight_kg + ' kg' }); });
    // PM-956: workout completions with the member's post-session feedback (difficulty 1-5 + note).
    var DIFF = { 1:'Easy', 2:'Fine', 3:'Solid', 4:'Hard', 5:'Brutal' };
    wkRows.slice(0, 10).forEach(function(x){
      var label = 'Completed ' + (x.workout_name || 'workout') + (x.duration_minutes ? ' (' + x.duration_minutes + ' min)' : '');
      if (x.difficulty_rating) label += ' \u2014 felt ' + (DIFF[x.difficulty_rating] || x.difficulty_rating) + ' (' + x.difficulty_rating + '/5)';
      if (x.member_note) label += ' \u2014 \u201c' + x.member_note + '\u201d';
      events.push({ t: x.logged_at, label: label });
    });
    cis.forEach(function(x){ events.push({ t: x.submitted_at, label: 'Submitted check-in' + (x.week_start ? ' (w/c ' + x.week_start + ')' : '') }); });
    events = events.filter(function(e){ return e.t; }).sort(function(a,b){ return new Date(b.t) - new Date(a.t); }).slice(0, 12);
    var logHtml = '<div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px;">Activity log</div>' +
      (events.length ? '<div style="border-left:2px solid var(--border);padding-left:14px;">' + events.map(function(e){
        var d = new Date(e.t);
        return '<div style="margin-bottom:10px;"><div style="font-size:13px;">' + esc(e.label) + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) + '</div></div>';
      }).join('') + '</div>' : '<p style="font-size:12.5px;color:var(--text-muted);">No activity yet.</p>');

    // ── Check-ins: full review timeline rendered async into this host (PM-958e) ──
    var ciHtml = '<div id="cd-checkins" style="margin-top:14px;"></div>';

    var waitNote = !consented ? '<div style="padding:10px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font-size:12.5px;color:var(--text-muted);margin-bottom:14px;">Training data unlocks when ' + esc(c.invited_first_name || 'they') + ' logs in and accepts your terms and data sharing. You can adjust their assigned plans in the meantime.</div>' : '';

    // \u2500\u2500 Habits 7-day grid (PM-961) \u2500\u2500
    var habHtml = '';
    if (consented && mhRows.length){
      var dhByKey = {};
      (res[2] || []).forEach(function(r){ dhByKey[r.habit_id + '|' + r.activity_date] = r; });
      var days7 = [];
      for (var hi = 6; hi >= 0; hi--){
        var hd = new Date(Date.now() - hi * 864e5);
        days7.push({ ds: hd.getFullYear() + '-' + String(hd.getMonth()+1).padStart(2,'0') + '-' + String(hd.getDate()).padStart(2,'0'), lbl: hd.toLocaleDateString('en-GB', { weekday: 'short' }) });
      }
      var gridRows = mhRows.map(function(mh){
        var hl = hlMap[mh.habit_id] || {};
        var ir = hl.input_rule || null;
        var cells = days7.map(function(dy){
          var r = dhByKey[mh.habit_id + '|' + dy.ds];
          if (!r) return '<td style="padding:5px 6px;border-top:1px solid var(--border);color:var(--text-muted);">\u2014</td>';
          var v = r.value;
          var done = r.habit_completed !== false;
          if (v != null && typeof v === 'object' && 'n' in v){
            var n = parseFloat(v.n) || 0;
            var disp = n >= 1000 ? (Math.round(n/100)/10) + 'k' : String(n);
            var tgt = ir && ir.type === 'number' && ir.target != null ? parseFloat(ir.target) : null;
            var hitCol = tgt != null ? (n >= tgt ? '#3DB89F' : '#E8834A') : 'var(--text)';
            return '<td style="padding:5px 6px;border-top:1px solid var(--border);font-weight:700;color:' + hitCol + ';">' + disp + '</td>';
          }
          if (v != null && typeof v === 'object' && 's' in v) return '<td style="padding:5px 6px;border-top:1px solid var(--border);font-weight:700;">' + parseInt(v.s) + '</td>';
          if (v != null && typeof v === 'object' && 't' in v){
            var tt = String(v.t || '').slice(0, 18);
            return '<td style="padding:5px 6px;border-top:1px solid var(--border);font-size:10.5px;color:var(--text-muted);" title="' + esc(String(v.t||'')) + '">\u201c' + esc(tt) + (String(v.t||'').length > 18 ? '\u2026' : '') + '\u201d</td>';
          }
          return done ? '<td style="padding:5px 6px;border-top:1px solid var(--border);color:#3DB89F;font-weight:700;">\u2713</td>' : '<td style="padding:5px 6px;border-top:1px solid var(--border);color:var(--text-muted);">\u2014</td>';
        }).join('');
        var typeTag = ir ? (ir.type === 'number' ? (ir.unit || 'number') : ir.type) : (hl.health_rule ? 'auto' : '');
        return '<tr><td style="padding:5px 6px;border-top:1px solid var(--border);font-weight:600;">' + esc(hl.habit_title || 'Habit') + (typeTag ? ' <span style="font-size:9.5px;color:var(--text-muted);">' + esc(typeTag) + '</span>' : '') + '</td>' + cells + '</tr>';
      }).join('');
      habHtml = '<div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px;">Habits \u2014 last 7 days</div>' +
        '<div style="border:1px solid var(--border);border-radius:10px;padding:6px 10px;margin-bottom:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11.5px;min-width:430px;"><tr><th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;"></th>' +
        days7.map(function(dy){ return '<th style="text-align:left;color:var(--text-muted);font-weight:600;padding:5px 6px;">' + dy.lbl + '</th>'; }).join('') + '</tr>' +
        gridRows + '</table></div>';
    }
    body.innerHTML = stats + waitNote + asgHtml + nutHtml + habHtml + logHtml + ciHtml;
    renderClientCheckins(c);
    $c('cd-asg-save').addEventListener('click', async function(){
      var na = {};
      body.querySelectorAll('.cd-asg').forEach(function(sel){ if (sel.value) na[sel.dataset.key] = sel.value; });
      var msg = $c('cd-asg-msg'); this.disabled = true; msg.textContent = 'Saving\u2026';
      try {
        // PM-956: saves route through the EF so an active + consented client gets the
        // new plans materialised into their app immediately (auto-apply on save).
        var r = await ef({ action: 'update_assignments', email: c.member_email, assignments: na });
        c.assignments = r.assignments || na;
        if (r.applied && !r.applied.error) {
          var a = r.applied, bits = [];
          if (a.workout) bits.push('programme');
          if (a.habits) bits.push(a.habits + ' habits');
          if (a.nutrition) bits.push('nutrition');
          if (a.supplements) bits.push(a.supplements + ' supplements');
          var autoBit = (r.automations && r.automations.length) ? ' Update email sent to your client.' : '';
          msg.textContent = (bits.length ? 'Saved — pushed to their app (' + bits.join(', ') + ').' : 'Saved.') + autoBit;
        } else if (r.applied && r.applied.error) {
          msg.textContent = 'Saved, but apply failed: ' + r.applied.error;
        } else {
          msg.textContent = 'Saved — applies when they accept your terms.';
        }
      } catch(e){ msg.textContent = 'Save failed: ' + e.message; }
      this.disabled = false;
    });
  }
  async function addClient(){
    var fn = $c('clf-first').value.trim(), ln = $c('clf-last').value.trim(), em = $c('clf-email').value.trim().toLowerCase();
    var msg = $c('clf-msg');
    if (!fn || !em || em.indexOf('@') < 0){ msg.textContent = 'First name and a valid email are required.'; return; }
    var btn = $c('clf-save'); btn.disabled = true; msg.textContent = 'Creating account\u2026';
    try {
      var r = await ef({ action: 'create', firstName: fn, lastName: ln, email: em, dob: $c('clf-dob').value || null, gender: $c('clf-gender').value || null, assignments: readAssignSelects() });
      msg.textContent = r.email_sent ? 'Invite sent to ' + em + '.' : 'Account created \u2014 email failed, use Copy link.';
      if (r.invite_link){ $c('cl-link-row').style.display = ''; $c('cl-link-input').value = r.invite_link; }
      $c('clf-first').value = ''; $c('clf-last').value = ''; $c('clf-email').value = ''; $c('clf-dob').value = ''; $c('clf-gender').value = '';
      await loadClients();
      setTimeout(function(){ $c('cl-editor').style.display = 'none'; msg.textContent = ''; }, 2500);
    } catch(e){ msg.textContent = 'That didn\u2019t work: ' + e.message; }
    btn.disabled = false;
  }
