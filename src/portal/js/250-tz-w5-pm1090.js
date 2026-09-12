  /* ============================ PM-1090 Trainerize W5 ============================
     Programme scheduling (#81 #85 #99 #104 + #89 est. minutes). Projection contract = the JS port
     below of scripts/ef/coach-weekly-snapshot/_shared/programme_projection.ts v2 (week_start
     anchor, session.day, phases[], schedule_overrides). Builder: phases over the week tabs + Import
     phase. Client › Calendar: month grid of projected sessions with the completion overlay
     (workouts rows), phase markers, look-ahead shading, drag-reschedule (schedule_overrides via
     update_assignments merge_slots), Programme starts, Add next phase inline. Client › Plans: next
     phase queue (assignments.workout_queue) + the full permission set (assignments.gates). Settings ›
     Client permissions = coach_ui_prefs.gate_defaults (own-row PATCH) + Apply to all clients (EF).
     Roster Summary view: Phase + Next phase columns. Shadows: renderProg, summarise, w5Plans,
     w6ClientCal, w1wpcLoad, w1cols (original renamed w1colsBase), w7SettingsPane (wrapped). */
  var W5S_GATES = [
    ['messaging', 'Messaging', 'Two-way lets them reply. One-way: they read only. Off hides the coach thread.', 'seg', [['two_way','Two-way'],['one_way','One-way'],['off','Off']], 'two_way'],
    ['look_ahead_weeks', 'Calendar look-ahead', 'How many weeks beyond this one they can see.', 'seg', [[0,'This week'],[1,'+1'],[2,'+2'],[4,'+4'],[99,'All']], 1],
    ['reschedule', 'Rescheduling', 'Strict: sessions stay on their day, a missed one stays missed. Loose: they can move a session within the week.', 'seg', [['strict','Strict'],['loose','Loose']], 'loose'],
    ['own_workouts', 'Own workouts', 'Can build and log their own custom workouts.', 'tog', null, true],
    ['water_tracker', 'Water tracker', 'Show the hydration tracker on Nutrition.', 'tog', null, true],
    ['vyve_library', 'VYVE library', 'Show VYVE\u2019s own programmes, exercise library and \u201cimport plan by code\u201d.', 'tog', null, true],
    ['load_calc', 'Estimated 1-rep max', 'Show an e1RM line on exercises (from their logged sets).', 'tog', null, false],
    ['exercise_library', 'Exercise swaps from the full library', 'Off = only the swaps you approved on the exercise.', 'tog', null, true]
  ];
  var W5S_DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  (function w5scss(){
    var s = document.createElement('style');
    s.textContent =
      '.w5s-phase{flex-basis:100%;border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:10px;background:var(--surface-2);}' +
      '.w5s-ph{display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;}' +
      '.w5s-ph input{background:none;border:none;border-bottom:1px dashed var(--border-strong);color:var(--text);font-family:inherit;font-size:13.5px;font-weight:700;padding:2px 0;min-width:160px;outline:none;}' +
      '.w5s-ph small{font-size:11px;color:var(--text-muted);}' +
      '.w5s-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}' +
      '.w5s-dow{font-size:10.5px;color:var(--text-dim);text-align:center;padding:4px 0;}' +
      '.w5s-day{background:var(--surface-2);border:1px solid var(--border);border-radius:8px;min-height:84px;padding:5px 6px;position:relative;}' +
      '.w5s-day .dn{font-size:11px;color:var(--text-dim);font-family:var(--font-mono);} .w5s-day.out{opacity:.35;} .w5s-day.today .dn{color:var(--gold,#C9A84C);font-weight:700;}' +
      '.w5s-day.shade{background:repeating-linear-gradient(135deg,var(--surface-2) 0 6px,var(--surface-sunken) 6px 12px);}' +
      '.w5s-day.over{outline:2px dashed var(--teal-lt);outline-offset:-2px;}' +
      '.w5s-ses{margin-top:4px;border-radius:6px;padding:3px 6px;font-size:11px;font-weight:600;border:1px solid var(--border);background:var(--surface);cursor:grab;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.w5s-ses.done{border-color:rgba(74,222,128,.45);color:#4ade80;} .w5s-ses.miss{border-color:rgba(248,113,113,.45);color:#f87171;} .w5s-ses.moved{border-style:dashed;} .w5s-ses.skip{text-decoration:line-through;opacity:.5;} .w5s-ses.extra{border-style:dotted;color:var(--text-muted);cursor:default;}' +
      '.w5s-ses.dragging{opacity:.4;}' +
      '.w5s-phm{position:absolute;left:-1px;top:-1px;right:-1px;height:3px;border-radius:8px 8px 0 0;background:var(--gold,#C9A84C);} .w5s-phl{font-size:10px;color:var(--gold,#C9A84C);font-weight:700;margin-top:2px;}' +
      '.w5s-ev{margin-top:4px;font-size:10.5px;color:var(--text-muted);display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;} .w5s-ev i{width:6px;height:6px;border-radius:50%;display:inline-block;flex:none;}' +
      '.w5s-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;}' +
      '.w5s-stats{display:flex;gap:14px;font-size:12px;color:var(--text-muted);} .w5s-stats b{color:var(--text);font-size:15px;font-family:var(--font-mono);margin-right:4px;}' +
      '.w5s-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);margin-top:10px;}' +
      '.w5s-next{display:flex;gap:10px;align-items:center;border:1px dashed var(--border-strong);border-radius:10px;padding:10px 12px;margin-top:12px;background:var(--surface-sunken);flex-wrap:wrap;}' +
      '.w5s-perm{display:grid;grid-template-columns:1fr auto;gap:8px 16px;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);} .w5s-perm:last-child{border-bottom:none;}' +
      '.w5s-perm .t{font-size:13px;font-weight:600;} .w5s-perm .s{font-size:11.5px;color:var(--text-muted);}' +
      '.w5s-seg{display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;} .w5s-seg button{border:0;background:none;padding:5px 10px;font-size:11.5px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:inherit;} .w5s-seg button.on{background:var(--surface-3);color:var(--text);}' +
      '.w5s-tog{width:36px;height:20px;border-radius:999px;background:var(--surface-3);position:relative;border:1px solid var(--border);cursor:pointer;} .w5s-tog::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--text-dim);transition:left .15s;} .w5s-tog.on{background:var(--vyve-teal);} .w5s-tog.on::after{left:18px;background:#fff;}' +
      '.w5s-qi{display:flex;align-items:center;gap:10px;border:1px solid var(--border);border-radius:10px;padding:8px 10px;background:var(--surface-2);margin-bottom:6px;flex-wrap:wrap;} .w5s-qi .k{font-family:var(--font-mono);font-size:11px;color:var(--text-dim);width:18px;} .w5s-qi .n{flex:1;font-size:13px;font-weight:600;min-width:120px;}' +
      '.w5s-pop{position:absolute;z-index:50;background:var(--surface);border:1px solid var(--border-strong);border-radius:10px;padding:8px;display:flex;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,.35);}' +
      '.w5s-mu{color:var(--text-muted);font-size:12px;}' +
      '.w5s-amber{color:#fbbf24;}';
    document.head.appendChild(s);
  })();

  /* ── JS port of _shared/programme_projection.ts v2 — keep in step with the TS ── */
  var w5proj = (function(){
    var DAY = 86400000;
    var DEFAULT_DAYS = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
    function mondayOf(d){ var u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); var dow = (u.getUTCDay() + 6) % 7; u.setUTCDate(u.getUTCDate() - dow); return u; }
    function isoDate(d){ return d.toISOString().slice(0, 10); }
    function fromIso(s){ return new Date(s + 'T00:00:00Z'); }
    function addDays(iso, n){ return isoDate(new Date(fromIso(iso).getTime() + n * DAY)); }
    function weeksBetween(a, b){ return Math.round((b.getTime() - a.getTime()) / (7 * DAY)); }
    function planWeeks(w){ return Math.max(1, Number(w.plan_duration_weeks || ((w.programme_json || {}).weeks || []).length || 1)); }
    function isCalendar(w){ return !!(w && w.week_start && /^\d{4}-\d{2}-\d{2}$/.test(String(w.week_start))); }
    function weekIndexFor(w, weekStart, now){
      now = now || new Date();
      if (!w || !w.programme_json || w.is_active === false) return { index: 0, paused: false };
      var total = planWeeks(w), target = fromIso(weekStart);
      if (isCalendar(w)){
        var anchor = mondayOf(fromIso(String(w.week_start)));
        if (w.paused_at && target.getTime() > mondayOf(new Date(w.paused_at)).getTime()) return { index: 0, paused: true };
        var idx = weeksBetween(anchor, target) + 1;
        if (idx < 1 || idx > total) return { index: 0, paused: false };
        return { index: idx, paused: false };
      }
      var cur = Math.max(1, Number(w.current_week || 1));
      var anchorNow = w.paused_at ? new Date(Math.min(now.getTime(), new Date(w.paused_at).getTime())) : now;
      var offset = weeksBetween(mondayOf(anchorNow), target);
      if (w.paused_at && offset > 0) return { index: 0, paused: true };
      if (w.generated_at && target.getTime() < mondayOf(new Date(w.generated_at)).getTime()) return { index: 0, paused: false };
      var i2 = Math.max(1, cur + offset);
      if (i2 > total) return { index: 0, paused: false };
      return { index: i2, paused: false };
    }
    function phaseFor(w, weekIndex){
      var phases = w && w.programme_json && w.programme_json.phases;
      if (!Array.isArray(phases) || !phases.length || !weekIndex) return null;
      for (var i = 0; i < phases.length; i++){
        var ws = (phases[i].weeks || []).map(Number).filter(function(n){ return n > 0; }).sort(function(a, b){ return a - b; });
        var pos = ws.indexOf(weekIndex);
        if (pos >= 0) return { name: String(phases[i].name || ('Phase ' + (i + 1))), index: i + 1, week_of_phase: pos + 1, phase_weeks: ws.length };
      }
      return null;
    }
    function weekSessions(w, index){
      var weeks = (w.programme_json && w.programme_json.weeks) || [];
      var wk = weeks.filter(function(x){ return Number(x.week) === index; })[0] || weeks[index - 1];
      var sessions = (wk && Array.isArray(wk.sessions)) ? wk.sessions : [];
      if (!sessions.length && w.programme_json && w.programme_json.sessions_per_week){
        var n = Math.max(0, Number(w.programme_json.sessions_per_week));
        sessions = Array.apply(null, Array(n)).map(function(_, i){ return { session_number: i + 1, session_name: 'Session ' + (i + 1) }; });
      }
      var spread = DEFAULT_DAYS[Math.min(7, Math.max(1, sessions.length))] || DEFAULT_DAYS[7];
      var used = {}, out = [];
      sessions.forEach(function(s, i){
        var day = (typeof s.day === 'number' && s.day >= 0 && s.day <= 6) ? s.day : -1;
        if (day < 0){ day = spread[i] != null ? spread[i] : i; while (used[day] && day < 6) day++; }
        used[day] = true;
        out.push({ session_number: Number(s.session_number || i + 1), session_name: String(s.session_name || ('Session ' + (i + 1))), day: day, estimated_duration_mins: s.estimated_duration_mins != null ? Number(s.estimated_duration_mins) : null });
      });
      return out;
    }
    function projectSessions(w, fromDate, toDate, overrides, now){
      if (!w || !w.programme_json) return [];
      var out = [], ws = isoDate(mondayOf(fromIso(fromDate))), end = fromIso(toDate).getTime();
      while (fromIso(ws).getTime() <= end){
        var wi = weekIndexFor(w, ws, now).index;
        if (wi){
          var phase = phaseFor(w, wi);
          weekSessions(w, wi).forEach(function(s){
            var orig = addDays(ws, s.day), ov = overrides ? overrides[orig] : null;
            var skipped = !!(ov && ov.skip);
            var date = (ov && ov.to && /^\d{4}-\d{2}-\d{2}$/.test(ov.to)) ? ov.to : orig;
            if (date < fromDate || date > toDate) return;
            out.push({ date: date, orig_date: orig, week_start: ws, week_index: wi, session_number: s.session_number, session_name: s.session_name, day: s.day, estimated_duration_mins: s.estimated_duration_mins, phase: phase, moved: date !== orig, skipped: skipped });
          });
        }
        ws = addDays(ws, 7);
      }
      out.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : a.session_number - b.session_number; });
      return out;
    }
    function programmeEnd(w){ if (!w || !isCalendar(w)) return null; return addDays(isoDate(mondayOf(fromIso(String(w.week_start)))), planWeeks(w) * 7 - 1); }
    function pick(rows){
      var c = (rows || []).filter(function(r){ return r.is_active !== false && r.programme_json && ((r.programme_json.surface || 'workouts') === 'workouts'); });
      c.sort(function(a, b){ var ca = a.source === 'coach' ? 0 : 1, cb = b.source === 'coach' ? 0 : 1; if (ca !== cb) return ca - cb; return String(b.generated_at || '').localeCompare(String(a.generated_at || '')); });
      return c[0] || null;
    }
    return { mondayOf: mondayOf, isoDate: isoDate, fromIso: fromIso, addDays: addDays, weekIndexFor: weekIndexFor, phaseFor: phaseFor, weekSessions: weekSessions, projectSessions: projectSessions, programmeEnd: programmeEnd, planWeeks: planWeeks, isCalendar: isCalendar, pick: pick };
  })();
  function w5sToday(){ return w5proj.isoDate(new Date()); }
  function w5sMon(){ return w5proj.isoDate(w5proj.mondayOf(new Date())); }
  function w5sFmt(iso){ var d = w5proj.fromIso(iso); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); }
  function w5sEst(n){ return 10 + (n || 0) * 7; }
  function w5sGate(gates, key){
    var g = gates || {}, def = W5S_GATES.filter(function(x){ return x[0] === key; })[0];
    var cd = (w0 && w0.prefs && w0.prefs.gate_defaults && w0.prefs.gate_defaults[key] !== undefined) ? w0.prefs.gate_defaults[key] : (def ? def[5] : undefined);
    return g[key] !== undefined ? g[key] : cd;
  }
  function w5sTplName(id){ var t = (lib.tpls || []).filter(function(x){ return x.id === id; })[0]; return t ? t.name : ''; }
  function w5sWorkoutPool(){ return (lib.tpls || []).filter(function(t){ return t.kind === 'workout' || t.kind === 'program'; }); }

  /* ── #89 list rows: est. minutes ── */
  function summarise(p){
    if (plKind === 'habits') return ((p.habits||[]).length) + ' habits';
    if (plKind === 'workout'){ var ss = p.sessions || []; var mins = ss.length ? Math.round(ss.reduce(function(a, s){ return a + w5sEst((s.exercises || []).length); }, 0) / ss.length) : 0; return ss.length + ' sessions / week' + (mins ? ' \u00b7 ~' + mins + ' min' : ''); }
    if (plKind === 'workout_day') return ((p.exercises||[]).length) + ' exercises' + (dayHasGroups(p) ? ' \u00b7 supersets' : '') + ' \u00b7 ~' + w5sEst((p.exercises||[]).length) + ' min';
    if (plKind === 'program'){ var ph = Array.isArray(p.phases) && p.phases.length ? ' \u00b7 ' + p.phases.length + ' phase' + (p.phases.length === 1 ? '' : 's') : ''; return ((p.weeks||[]).length) + ' weeks \u00b7 ' + progDayCount(p) + ' training days' + ph; }
    if (plKind === 'nutrition') return (p.calories ? p.calories + ' kcal' : (p.meals || p.pdf_path ? '' : 'targets')) + (p.protein_g ? ' \u00b7 ' + p.protein_g + 'g protein' : '') + (p.meals ? (p.calories ? ' \u00b7 ' : '') + p.meals.length + '-meal plan' : '') + (p.pdf_path ? (p.calories || p.meals ? ' \u00b7 ' : '') + 'PDF attached' : '');
    if (plKind === 'supplements') return ((p.items||[]).length) + ' supplements';
    return '';
  }

  /* ── #85 builder phases ── */
  function w5sPhases(){ if (!progState) return []; if (!Array.isArray(progState.phases)) progState.phases = []; return progState.phases; }
  function w5sPhaseOf(weekNo){ var ps = w5sPhases(); for (var i = 0; i < ps.length; i++) if ((ps[i].weeks || []).indexOf(weekNo) >= 0) return i; return -1; }
  function w5sShiftWeeks(from, delta){ // renumber every phase week >= from by delta (delta -1 drops week `from`)
    w5sPhases().forEach(function(p){ p.weeks = (p.weeks || []).filter(function(n){ return !(delta < 0 && n === from); }).map(function(n){ return n >= from ? n + delta : n; }).filter(function(n){ return n >= 1; }); });
    progState.phases = w5sPhases().filter(function(p){ return (p.weeks || []).length; });
  }
  function w5sInsertWeek(afterIdx, week, phaseIdx){ // afterIdx = 0-based index to insert after (-1 = start)
    progState.weeks.splice(afterIdx + 1, 0, week);
    var no = afterIdx + 2;
    w5sShiftWeeks(no, 1);
    if (phaseIdx >= 0 && w5sPhases()[phaseIdx]){ w5sPhases()[phaseIdx].weeks.push(no); w5sPhases()[phaseIdx].weeks.sort(function(a, b){ return a - b; }); }
  }
  function w5RenderProgBase(){
    if (!progState) return;
    var ps = w5sPhases(), hasPh = ps.length > 0;
    function wkBtn(i){ return '<button class="pg-tab' + (i === progWeekIdx ? ' on' : '') + '" data-pg-week="' + i + '" type="button">Week ' + (i + 1) + '</button>'; }
    var tabs = '';
    if (!hasPh){
      tabs = progState.weeks.map(function(w, i){ return wkBtn(i); }).join('');
    } else {
      var covered = {};
      tabs = ps.map(function(p, pi){
        var wks = (p.weeks || []).slice().sort(function(a, b){ return a - b; });
        wks.forEach(function(n){ covered[n] = true; });
        var range = wks.length ? (wks.length === 1 ? 'week ' + wks[0] : 'weeks ' + wks[0] + '\u2013' + wks[wks.length - 1]) : 'no weeks';
        return '<div class="w5s-phase"><div class="w5s-ph"><input data-w5s-pname="' + pi + '" value="' + esc(p.name || ('Phase ' + (pi + 1))) + '"/><small>' + range + '</small><span style="flex:1;"></span>' +
          '<button class="btn" type="button" data-w5s-padd="' + pi + '" style="font-size:11px;">+ Add week to phase</button>' +
          '<button class="btn" type="button" data-w5s-prm="' + pi + '" style="font-size:11px;">Remove phase</button></div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + wks.map(function(n){ return wkBtn(n - 1); }).join('') + '</div></div>';
      }).join('');
      var loose = progState.weeks.map(function(w, i){ return covered[i + 1] ? '' : wkBtn(i); }).join('');
      if (loose) tabs += '<div class="w5s-phase" style="border-style:dashed;"><div class="w5s-ph"><small>Not in a phase</small></div><div style="display:flex;gap:6px;flex-wrap:wrap;">' + loose + '</div></div>';
    }
    tabs += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:' + (hasPh ? '2px' : '8px') + ';">' +
      '<button class="pg-tab ghost" id="pg-dup" type="button">Duplicate week</button><button class="pg-tab ghost" id="pg-add" type="button">+ Add week</button>' +
      (progState.weeks.length > 1 ? '<button class="pg-tab ghost" id="pg-rmw" type="button">Remove week</button>' : '') +
      '<button class="pg-tab ghost" id="w5s-addph" type="button">+ Add phase</button><button class="pg-tab ghost" id="w5s-imp" type="button">Import phase from\u2026</button>' +
      '<span class="w5s-mu">Phases name a run of weeks \u2014 the client sees \u201cPhase 2 \u00b7 Week 3 of 4\u201d on their programme and the calendar marks the boundary.</span></div>' +
      '<div id="w5s-imp-box" style="display:none;margin-top:8px;"></div>';
    $c('pg-tabs').innerHTML = tabs;
    $c('pg-tabs').querySelectorAll('[data-pg-week]').forEach(function(b){ b.addEventListener('click', function(){ if (progEditingDay) progDayDone(); progWeekIdx = parseInt(b.dataset.pgWeek); renderProg(); }); });
    $c('pg-dup').addEventListener('click', function(){ if (progEditingDay) progDayDone(); w5sInsertWeek(progWeekIdx, deepCopy(progState.weeks[progWeekIdx]), w5sPhaseOf(progWeekIdx + 1)); progWeekIdx++; renderProg(); });
    $c('pg-add').addEventListener('click', function(){ if (progEditingDay) progDayDone(); var last = progState.weeks.length - 1; w5sInsertWeek(last, emptyWeek(), hasPh ? w5sPhaseOf(last + 1) : -1); progWeekIdx = progState.weeks.length - 1; renderProg(); });
    var rmw = $c('pg-rmw'); if (rmw) rmw.addEventListener('click', function(){
      if (!confirm('Remove week ' + (progWeekIdx + 1) + '?')) return;
      if (progEditingDay) progEditingDay = null;
      progState.weeks.splice(progWeekIdx, 1); w5sShiftWeeks(progWeekIdx + 1, -1); progWeekIdx = Math.max(0, progWeekIdx - 1); renderProg();
    });
    $c('w5s-addph').addEventListener('click', function(){
      if (progEditingDay) progDayDone();
      if (!hasPh){ progState.phases = [{ name: 'Phase 1', weeks: progState.weeks.map(function(_, i){ return i + 1; }) }]; renderProg(); return; }
      var last = progState.weeks.length - 1;
      progState.weeks.push(emptyWeek());
      progState.phases.push({ name: 'Phase ' + (ps.length + 1), weeks: [last + 2] });
      progWeekIdx = last + 1; renderProg();
    });
    $c('pg-tabs').querySelectorAll('[data-w5s-pname]').forEach(function(inp){ inp.addEventListener('change', function(){ var p = w5sPhases()[parseInt(inp.dataset.w5sPname)]; if (p) p.name = inp.value.trim() || p.name; }); });
    $c('pg-tabs').querySelectorAll('[data-w5s-padd]').forEach(function(b){ b.addEventListener('click', function(){
      if (progEditingDay) progDayDone();
      var pi = parseInt(b.dataset.w5sPadd), p = w5sPhases()[pi]; if (!p) return;
      var lastNo = Math.max.apply(null, p.weeks); w5sInsertWeek(lastNo - 1, emptyWeek(), pi); progWeekIdx = lastNo; renderProg();
    }); });
    $c('pg-tabs').querySelectorAll('[data-w5s-prm]').forEach(function(b){ b.addEventListener('click', function(){
      var pi = parseInt(b.dataset.w5sPrm), p = w5sPhases()[pi]; if (!p) return;
      var wks = (p.weeks || []).slice().sort(function(a, b2){ return b2 - a; });
      if (!confirm('Remove \u201c' + (p.name || 'this phase') + '\u201d and its ' + wks.length + ' week' + (wks.length === 1 ? '' : 's') + '? (Remove the phase but keep the weeks: Cancel, then clear the phase name.)')) return;
      if (progState.weeks.length - wks.length < 1){ alert('A programme needs at least one week.'); return; }
      if (progEditingDay) progEditingDay = null;
      wks.forEach(function(n){ progState.weeks.splice(n - 1, 1); w5sShiftWeeks(n, -1); });
      progWeekIdx = 0; renderProg();
    }); });
    $c('w5s-imp').addEventListener('click', function(){
      var box = $c('w5s-imp-box');
      if (box.style.display !== 'none'){ box.style.display = 'none'; return; }
      var srcs = (plItems || []).filter(function(it){ return it.kind === 'program' && (!plEditing || it.id !== plEditing.id) && it.payload && (it.payload.weeks || []).length; });
      if (!srcs.length){ box.style.display = ''; box.innerHTML = '<span class="w5s-mu">No other programmes to import from yet.</span>'; return; }
      box.style.display = '';
      box.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><select id="w5s-imp-src">' + srcs.map(function(s){ return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select><select id="w5s-imp-ph"></select><button class="btn btn-primary" type="button" id="w5s-imp-go" style="font-size:12px;">Import</button><span class="w5s-mu">Copies the weeks by value \u2014 edits here never touch the source.</span></div>';
      function fillPh(){
        var src = srcs.filter(function(s){ return s.id === $c('w5s-imp-src').value; })[0]; var phs = (src && Array.isArray(src.payload.phases)) ? src.payload.phases : [];
        $c('w5s-imp-ph').innerHTML = '<option value="all">Whole programme (' + ((src && src.payload.weeks) || []).length + ' weeks)</option>' + phs.map(function(p, i){ return '<option value="' + i + '">' + esc(p.name || ('Phase ' + (i + 1))) + ' (' + (p.weeks || []).length + ' wk)</option>'; }).join('');
      }
      fillPh(); $c('w5s-imp-src').addEventListener('change', fillPh);
      $c('w5s-imp-go').addEventListener('click', function(){
        if (progEditingDay) progDayDone();
        var src = srcs.filter(function(s){ return s.id === $c('w5s-imp-src').value; })[0]; if (!src) return;
        var sel = $c('w5s-imp-ph').value, weeks, name;
        if (sel === 'all'){ weeks = src.payload.weeks; name = src.name; }
        else { var p = src.payload.phases[parseInt(sel)]; weeks = (p.weeks || []).map(function(n){ return src.payload.weeks[n - 1]; }).filter(Boolean); name = p.name || 'Imported phase'; }
        if (!weeks.length) return;
        var startNo = progState.weeks.length + 1;
        weeks.forEach(function(w){ progState.weeks.push(deepCopy(w)); });
        if (!hasPh && progState.weeks.length > weeks.length) progState.phases = [{ name: 'Phase 1', weeks: progState.weeks.slice(0, startNo - 1).map(function(_, i){ return i + 1; }) }];
        w5sPhases().push({ name: name, weeks: weeks.map(function(_, i){ return startNo + i; }) });
        progWeekIdx = startNo - 1; renderProg();
      });
    });
    var wk = progState.weeks[progWeekIdx];
    var tplOpts = '<option value="">+ Add training day\u2026</option>' + dayTplChoices.map(function(t){ return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('');
    $c('pg-slots').innerHTML = wk.days.map(function(d, j){
      var inner;
      if (d && (d.exercises || []).length){
        inner = '<div class="pg-chip"><div>' + esc(d.name || 'Training day') + '</div><small>' + d.exercises.length + ' exercises' + (dayHasGroups(d) ? ' \u00b7 supersets' : '') + ' \u00b7 ~' + w5sEst(d.exercises.length) + ' min</small><div style="margin-top:5px;"><span class="lnk" data-pg-edit="' + j + '">Edit this week\u2019s copy</span><span class="lnk" data-pg-clear="' + j + '">Remove</span></div></div>';
      } else if (dayTplChoices.length){
        inner = '<select class="pg-pick" data-pg-slot="' + j + '" style="width:100%;padding:7px 8px;border:1px dashed var(--border);border-radius:8px;background:none;color:var(--text-muted);font-size:11.5px;font-family:inherit;">' + tplOpts + '</select>';
      } else {
        inner = '<div style="font-size:11.5px;color:var(--text-muted);">Rest \u2014 build a day template first to fill this slot.</div>';
      }
      return '<div class="pg-slot"><div class="d">' + W5S_DOW[j] + ' \u00b7 Day ' + (j + 1) + '</div>' + inner + '</div>';
    }).join('');
    $c('pg-slots').querySelectorAll('.pg-pick').forEach(function(s){ s.addEventListener('change', function(){
      var t = dayTplChoices.find(function(x){ return x.id === s.value; });
      if (!t) return;
      var snap = deepCopy(t.payload || {}); snap.name = t.name; snap.src_id = t.id;
      progState.weeks[progWeekIdx].days[parseInt(s.dataset.pgSlot)] = snap;
      renderProg();
    }); });
    $c('pg-slots').querySelectorAll('[data-pg-clear]').forEach(function(b){ b.addEventListener('click', function(){
      if (progEditingDay && progEditingDay.j === parseInt(b.dataset.pgClear)) progEditingDay = null;
      progState.weeks[progWeekIdx].days[parseInt(b.dataset.pgClear)] = null;
      renderProg();
    }); });
    $c('pg-slots').querySelectorAll('[data-pg-edit]').forEach(function(b){ b.addEventListener('click', function(){ progDayOpen(parseInt(b.dataset.pgEdit)); }); });
    if (!progEditingDay) $c('pg-dayedit').style.display = 'none';
  }

  /* ── Client › Plans: slots + water + Programme starts + next-phase queue + permissions ── */
  var w5sPlansQueue = [];
  function w5sPermHtml(gates, prefix, showBlank){
    return W5S_GATES.map(function(g){
      var key = g[0], cur = w5sGate(gates, key), explicit = gates && gates[key] !== undefined;
      var ctl;
      if (g[3] === 'seg') ctl = '<span class="w5s-seg" data-w5s-key="' + key + '">' + g[4].map(function(o){ return '<button type="button" data-v="' + o[0] + '" class="' + (String(o[0]) === String(cur) ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</span>';
      else ctl = '<span class="w5s-tog' + (cur ? ' on' : '') + '" data-w5s-key="' + key + '" data-v="' + (cur ? '1' : '0') + '" role="switch" aria-checked="' + (cur ? 'true' : 'false') + '"></span>';
      return '<div class="w5s-perm"><div><div class="t">' + g[1] + (showBlank && !explicit ? ' <span class="w5s-mu">\u00b7 your default</span>' : '') + '</div><div class="s">' + g[2] + '</div></div><div>' + ctl + '</div></div>';
    }).join('');
  }
  function w5sPermWire(host){
    host.querySelectorAll('.w5s-seg button').forEach(function(b){ b.addEventListener('click', function(){ b.parentNode.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); }); }); });
    host.querySelectorAll('.w5s-tog').forEach(function(t){ t.addEventListener('click', function(){ var on = t.dataset.v !== '1'; t.dataset.v = on ? '1' : '0'; t.classList.toggle('on', on); t.setAttribute('aria-checked', on ? 'true' : 'false'); }); });
  }
  function w5sPermRead(host){
    var g = {};
    host.querySelectorAll('.w5s-seg').forEach(function(s){ var on = s.querySelector('button.on'); if (!on) return; var v = on.dataset.v; g[s.dataset.w5sKey] = s.dataset.w5sKey === 'look_ahead_weeks' ? parseInt(v) : v; });
    host.querySelectorAll('.w5s-tog').forEach(function(t){ g[t.dataset.w5sKey] = t.dataset.v === '1'; });
    return g;
  }
  function w5sQueueHtml(q, wp){
    var pool = w5sWorkoutPool();
    var endTxt = wp && w5proj.programmeEnd(wp) ? 'ends ' + w5sFmt(w5proj.programmeEnd(wp)) : (wp ? 'ends when they finish week ' + w5proj.planWeeks(wp) : 'no programme running');
    return '<div id="w5s-q">' + (q.length ? q.map(function(it, i){
      var when = it.start_on === 'on_end' ? (i === 0 ? 'starts when the current programme ends (' + endTxt + ')' : 'starts when the one above ends') : 'starts ' + w5sFmt(it.start_on);
      return '<div class="w5s-qi"><span class="k">' + (i + 1) + '</span><span class="n">' + esc(w5sTplName(it.template_id) || 'Programme') + '</span><span class="w5s-mu">' + when + '</span><button class="btn" type="button" data-w5s-qrm="' + i + '" style="font-size:11px;">Remove</button></div>';
    }).join('') : '<div class="w5s-mu" style="margin-bottom:6px;">Nothing queued \u2014 the client will see \u201cprogramme complete\u201d and stay on the last week.</div>') +
      (q.length < 5 ? '<div class="w5s-qi" style="border-style:dashed;background:none;"><span class="k">+</span><select id="w5s-q-tpl" style="flex:1;min-width:160px;"><option value="">Add a programme\u2026</option>' + pool.map(function(t){ return '<option value="' + t.id + '">' + esc(t.name) + (t.kind === 'program' ? ' (programme)' : ' (weekly)') + '</option>'; }).join('') + '</select>' +
      '<select id="w5s-q-mode"><option value="on_end">when the previous one ends</option><option value="date">on a date\u2026</option></select><input type="date" id="w5s-q-date" style="display:none;"/><button class="btn" type="button" id="w5s-q-add" style="font-size:12px;">Add</button></div>' : '') + '</div>';
  }
  function w5sQueueWire(host, wp, onChange){
    host.querySelectorAll('[data-w5s-qrm]').forEach(function(b){ b.addEventListener('click', function(){ w5sPlansQueue.splice(parseInt(b.dataset.w5sQrm), 1); onChange(); }); });
    var mode = host.querySelector('#w5s-q-mode'); if (mode) mode.addEventListener('change', function(){ host.querySelector('#w5s-q-date').style.display = mode.value === 'date' ? '' : 'none'; });
    var add = host.querySelector('#w5s-q-add'); if (add) add.addEventListener('click', function(){
      var id = host.querySelector('#w5s-q-tpl').value; if (!id) return;
      var so = 'on_end';
      if (host.querySelector('#w5s-q-mode').value === 'date'){ so = host.querySelector('#w5s-q-date').value; if (!/^\d{4}-\d{2}-\d{2}$/.test(so)){ alert('Pick a start date.'); return; } if (so < w5sToday()){ alert('That date has passed.'); return; } }
      w5sPlansQueue.push({ template_id: id, start_on: so }); onChange();
    });
  }
  async function w5sLoadWpc(email){
    try {
      var rows = await rest('/workout_plan_cache?member_email=eq.' + encodeURIComponent(email) + '&is_active=eq.true&select=id,member_email,programme_json,plan_duration_weeks,current_week,current_session,is_active,paused_at,generated_at,source,source_id,week_start&order=generated_at.desc');
      return w5proj.pick(rows || []);
    } catch(_){ return null; }
  }
  function w5Plans(){
    var pane = $c('w5-pane'), c = w5.c, asg = c.assignments || {};
    w5sPlansQueue = Array.isArray(asg.workout_queue) ? deepCopy(asg.workout_queue) : [];
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
      '<div id="w5s-plan-pos" class="w5s-mu" style="margin:-4px 0 10px;"></div>' +
      '<div class="w5-sec" style="margin-top:14px;">Next phase queue</div><div id="w5s-qhost"></div>' +
      '<div class="w5-sec" style="margin-top:14px;">Daily water goal</div>' +
      '<div class="field" style="max-width:220px;"><label>Litres per day (blank = app default)</label><input id="w5-water" type="number" min="0.5" max="8" step="0.1" value="' + (asg.water_goal || '') + '"/></div>' +
      '<div class="w5-sec" style="margin-top:14px;">Client permissions <span class="w5s-mu" style="font-weight:400;text-transform:none;letter-spacing:0;">\u2014 blank = your defaults from Settings \u203a Client permissions</span></div>' +
      '<div class="w5-box" id="w5s-perms">' + w5sPermHtml(g, 'c', true) + '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap;"><button class="btn btn-primary" type="button" id="w5-plans-save" style="font-size:12px;">Save</button><button class="btn" type="button" id="w5s-perm-reset" style="font-size:12px;">Reset permissions to my defaults</button><span id="w5-plans-msg" style="font-size:12px;color:var(--text-muted);"></span></div>';
    w5sPermWire($c('w5s-perms'));
    $c('w5s-perm-reset').addEventListener('click', function(){ $c('w5s-perms').innerHTML = w5sPermHtml({}, 'c', false); w5sPermWire($c('w5s-perms')); });
    var wp = null;
    function paintQ(){ $c('w5s-qhost').innerHTML = w5sQueueHtml(w5sPlansQueue, wp); w5sQueueWire($c('w5s-qhost'), wp, paintQ); }
    paintQ();
    w5sLoadWpc(c.member_email).then(function(w){
      wp = w; if (w5.tab !== 'plans') return;
      var pos = $c('w5s-plan-pos'); if (!pos) return;
      if (!w){ pos.textContent = asg.workout_template_id ? 'Programme assigned \u2014 builds when they accept your terms.' : ''; paintQ(); return; }
      var wi = w5proj.weekIndexFor(w, w5sMon()).index, ph = w5proj.phaseFor(w, wi), end = w5proj.programmeEnd(w);
      pos.innerHTML = esc(w.programme_json.programme_name || 'Programme') + ' \u00b7 ' + (wi ? 'week ' + wi + ' of ' + w5proj.planWeeks(w) + (ph ? ' \u00b7 ' + esc(ph.name) + ' (week ' + ph.week_of_phase + ' of ' + ph.phase_weeks + ')' : '') : (end && end < w5sToday() ? '<span class="w5s-amber">finished ' + w5sFmt(end) + '</span>' : 'not started')) +
        (w5proj.isCalendar(w) ? ' \u00b7 started ' + w5sFmt(w.week_start) + (end ? ', ends ' + w5sFmt(end) : '') : ' \u00b7 sequential (no start date \u2014 set one on the Calendar tab)');
      paintQ();
    });
    $c('w5-plans-save').addEventListener('click', async function(){
      var na = {};
      pane.querySelectorAll('.w5-asg').forEach(function(sel){ if (sel.value) na[sel.dataset.key] = sel.value; });
      na.water_goal = $c('w5-water').value === '' ? null : parseFloat($c('w5-water').value);
      na.gates = w5sPermRead($c('w5s-perms'));
      na.workout_queue = w5sPlansQueue.slice();
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
        if (typeof w1wpcLoad === 'function') w1wpcLoad(true);
      } catch(e){ msg.textContent = 'Save failed: ' + e.message; }
      this.disabled = false;
    });
  }

  /* ── Client › Calendar (#104): month grid over the projection + Wave 6 rows ── */
  var w5cal = { month: null, drag: null };
  async function w6ClientCal(){
    var pane = $c('w5-pane'), c = w5.c, enc = encodeURIComponent(c.member_email);
    if (!w5cal.month) w5cal.month = w5sMon().slice(0, 7);
    var m = w5cal.month, first = m + '-01', fd = w5proj.fromIso(first);
    var lastDay = new Date(Date.UTC(fd.getUTCFullYear(), fd.getUTCMonth() + 1, 0)).getUTCDate(), last = m + '-' + (lastDay < 10 ? '0' : '') + lastDay;
    var gridStart = w5proj.isoDate(w5proj.mondayOf(fd)), gridEnd = w5proj.addDays(gridStart, 41);
    var asg = c.assignments || {}, ov = asg.schedule_overrides || {};
    var res = await Promise.all([
      w5sLoadWpc(c.member_email),
      w5consented() ? rest('/workouts?member_email=eq.' + enc + '&activity_date=gte.' + gridStart + '&activity_date=lte.' + gridEnd + '&select=activity_date,session_number,workout_name,plan_name,logged_at&order=logged_at.asc').catch(function(){ return []; }) : Promise.resolve([]),
      rest('/coach_events?' + pscope() + '&member_email=eq.' + enc + '&status=neq.cancelled&starts_at=gte.' + w6enc(gridStart) + '&starts_at=lte.' + w6enc(gridEnd + 'T23:59:59') + '&order=starts_at.asc&limit=100').catch(function(){ return []; }),
      rest('/coach_sessions?' + pscope() + '&member_email=eq.' + enc + '&status=eq.scheduled&starts_at=gte.' + w6enc(gridStart) + '&starts_at=lte.' + w6enc(gridEnd + 'T23:59:59') + '&order=starts_at.asc&limit=50&select=id,title,starts_at,duration_minutes,link_url').catch(function(){ return []; }),
      rest('/bookings?' + pscope() + '&member_email=eq.' + enc + '&status=in.(confirmed,pending_payment)&starts_at=gte.' + w6enc(gridStart) + '&starts_at=lte.' + w6enc(gridEnd + 'T23:59:59') + '&order=starts_at.asc&limit=50&select=id,starts_at,status').catch(function(){ return []; })
    ]);
    if (w5.tab !== 'calendar') return;
    var wp = res[0], wos = res[1] || [], today = w5sToday(), thisMon = w5sMon();
    var la = w5sGate(asg.gates, 'look_ahead_weeks'); var laEnd = la >= 99 ? null : w5proj.addDays(thisMon, la * 7 + 6);
    var sessions = wp ? w5proj.projectSessions(wp, gridStart, gridEnd, ov) : [];
    var byDate = {}; sessions.forEach(function(s){ (byDate[s.date] = byDate[s.date] || []).push(s); });
    var woByDate = {}; wos.forEach(function(w){ var d = String(w.activity_date).slice(0, 10); (woByDate[d] = woByDate[d] || []).push(w); });
    var used = {};
    function matchWo(s){
      var list = woByDate[s.date] || [];
      for (var i = 0; i < list.length; i++){ if (used[s.date + ':' + i]) continue; var w = list[i]; if (Number(w.session_number) === s.session_number || (w.workout_name && String(w.workout_name).toLowerCase() === s.session_name.toLowerCase())){ used[s.date + ':' + i] = true; return w; } }
      for (var k = 0; k < list.length; k++){ if (!used[s.date + ':' + k]){ used[s.date + ':' + k] = true; return list[k]; } }
      return null;
    }
    var done = 0, missed = 0, moved = 0;
    sessions.forEach(function(s){ if (s.skipped) return; s.wo = matchWo(s); if (s.date >= first && s.date <= last){ if (s.wo) done++; else if (s.date < today) missed++; if (s.moved) moved++; } });
    var monthTotal = sessions.filter(function(s){ return !s.skipped && s.date >= first && s.date <= last; }).length;
    var evRows = [];
    (res[2] || []).forEach(function(e){ evRows.push({ t: e.starts_at, label: e.title, sub: e.kind + (e.notify_client ? ' \u00b7 notifies them' : ''), color: e.color || W6_KIND_COLORS[e.kind], raw: e, isEvent: true }); });
    (res[3] || []).forEach(function(s){ evRows.push({ t: s.starts_at, label: s.title, sub: 'call \u00b7 ' + (s.duration_minutes || 30) + ' min', color: W6_KIND_COLORS.call, link: s.link_url }); });
    (res[4] || []).forEach(function(b){ evRows.push({ t: b.starts_at, label: 'Booked session', sub: b.status === 'confirmed' ? 'confirmed' : 'awaiting payment confirmation', color: W6_KIND_COLORS.appointment }); });
    evRows.sort(function(a, b){ return new Date(a.t) - new Date(b.t); });
    var evByDate = {}; evRows.forEach(function(r){ var d = new Date(r.t); var k = d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(); (evByDate[k] = evByDate[k] || []).push(r); });
    var wi = wp ? w5proj.weekIndexFor(wp, thisMon).index : 0, ph = wp ? w5proj.phaseFor(wp, wi) : null, end = wp ? w5proj.programmeEnd(wp) : null;
    var q = Array.isArray(asg.workout_queue) ? asg.workout_queue : [];
    var pool = w5sWorkoutPool();
    var mLabel = fd.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var seenPhase = {};
    var cells = '';
    for (var i = 0; i < 42; i++){
      var d = w5proj.addDays(gridStart, i), inM = d >= first && d <= last;
      var cls = 'w5s-day' + (inM ? '' : ' out') + (d === today ? ' today' : '') + (laEnd && d > laEnd ? ' shade' : '');
      var inner = '<div class="dn">' + parseInt(d.slice(8, 10), 10) + '</div>';
      var ss = byDate[d] || [];
      var phMark = '';
      if (wp && i % 7 === 0){ // a phase boundary always sits on a Monday
        var wix = w5proj.weekIndexFor(wp, d).index, p2 = w5proj.phaseFor(wp, wix);
        if (p2 && p2.week_of_phase === 1 && !seenPhase[p2.index]){ seenPhase[p2.index] = true; phMark = '<div class="w5s-phm"></div><div class="w5s-phl">' + esc(p2.name) + '</div>'; }
      }
      inner = phMark + inner;
      ss.forEach(function(s){
        var st = s.skipped ? 'skip' : s.wo ? 'done' : (s.date < today ? 'miss' : 'up');
        inner += '<div class="w5s-ses ' + st + (s.moved ? ' moved' : '') + '" draggable="' + (s.skipped ? 'false' : 'true') + '" data-orig="' + s.orig_date + '" data-date="' + s.date + '" data-sn="' + s.session_number + '" title="' + esc(s.session_name) + (s.moved ? ' \u00b7 moved from ' + w5sFmt(s.orig_date) : '') + (s.skipped ? ' \u00b7 skipped' : '') + (s.estimated_duration_mins ? ' \u00b7 ~' + s.estimated_duration_mins + ' min' : '') + '">' + esc(s.session_name) + (s.moved ? ' \u21a9' : '') + '</div>';
      });
      (woByDate[d] || []).forEach(function(w, k){ if (!used[d + ':' + k]) inner += '<div class="w5s-ses extra done" title="Logged outside the plan">\u2713 ' + esc(w.workout_name || 'Workout') + '</div>'; });
      (evByDate[d] || []).slice(0, 2).forEach(function(r){ inner += '<div class="w5s-ev"><i style="background:' + r.color + ';"></i>' + esc(r.label) + '</div>'; });
      cells += '<div class="' + cls + '" data-day="' + d + '">' + inner + '</div>';
    }
    pane.innerHTML =
      '<div class="w5s-top">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><button class="btn" type="button" id="w5s-prev" style="font-size:12px;">\u2039</button><b style="font-size:14px;">' + mLabel + '</b><button class="btn" type="button" id="w5s-next" style="font-size:12px;">\u203a</button><button class="btn" type="button" id="w5s-tod" style="font-size:11px;">Today</button></div>' +
        (wp ? '<div class="w5s-stats"><span><b>' + done + '</b>/ ' + monthTotal + ' done this month</span><span><b>' + missed + '</b>missed</span><span><b>' + moved + '</b>moved</span></div>' : '') +
        (wp ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;" class="w5s-mu">Programme starts <input type="date" id="w5s-ws" value="' + (wp.week_start || '') + '" style="font-size:11.5px;padding:3px 6px;"/><span style="font-family:var(--font-mono);">' + (wi ? (ph ? esc(ph.name) + ' \u00b7 ' : '') + 'Week ' + wi + ' of ' + w5proj.planWeeks(wp) : (end && end < today ? 'finished' : (wp.week_start ? 'starts ' + w5sFmt(wp.week_start) : 'no start date'))) + '</span></div>' : '<span class="w5s-mu">No workout programme running' + (asg.workout_template_id ? ' \u2014 builds when they accept your terms' : ' \u2014 assign one on the Plans tab') + '.</span>') +
      '</div>' +
      '<div class="w5s-cal">' + W5S_DOW.map(function(x){ return '<div class="w5s-dow">' + x + '</div>'; }).join('') + cells + '</div>' +
      '<div class="w5s-legend"><span style="color:#4ade80;">\u25a0 done</span><span style="color:#f87171;">\u25a0 missed</span><span>dashed = moved (drag to move, click for skip)</span><span style="color:var(--gold,#C9A84C);">\u2500 phase boundary</span>' + (laEnd ? '<span>hatched = beyond their look-ahead (' + (la === 0 ? 'this week only' : '+' + la + ' week' + (la === 1 ? '' : 's')) + ')</span>' : '') + '</div>' +
      (wp ? '<div class="w5s-next"><div style="flex:1;min-width:200px;"><div style="font-weight:700;font-size:13px;">After this programme ends' + (end ? ' (' + w5sFmt(end) + ')' : '') + '</div><div class="w5s-mu">' + (q.length ? 'Next: ' + esc(w5sTplName(q[0].template_id) || 'programme') + (q[0].start_on === 'on_end' ? ', starts when this ends' : ', starts ' + w5sFmt(q[0].start_on)) + (q.length > 1 ? ' \u00b7 +' + (q.length - 1) + ' more queued' : '') : 'Nothing queued \u2014 the client will see \u201cprogramme complete\u201d and stay on the last week.') + '</div></div>' +
        (q.length < 5 ? '<select id="w5s-nq-tpl"><option value="">Add next phase\u2026</option>' + pool.map(function(t){ return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select><select id="w5s-nq-mode"><option value="on_end">starts when this ends</option><option value="date">starts on a date\u2026</option></select><input type="date" id="w5s-nq-date" style="display:none;"/><button class="btn btn-primary" type="button" id="w5s-nq-go" style="font-size:12px;">Queue</button>' : '') + '<span id="w5s-nq-msg" class="w5s-mu"></span></div>' : '') +
      '<div style="display:flex;gap:8px;margin:16px 0 10px;flex-wrap:wrap;"><button class="btn btn-primary" id="w6cc-ev" type="button" style="font-size:12px;">+ Event for ' + esc(c.invited_first_name || 'them') + '</button><button class="btn" id="w6cc-call" type="button" style="font-size:12px;">+ Book a call</button></div>' +
      (evRows.map(function(r){
        return '<div class="w6-row"><span class="w6-dot" style="background:' + r.color + ';"></span>' +
          '<div style="font-weight:700;font-size:12px;min-width:110px;">' + new Date(r.t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + w6time(r.t) + '</div>' +
          '<div style="flex:1;min-width:140px;"><div style="font-size:13px;font-weight:600;">' + esc(r.label) + '</div><div style="font-size:11px;color:var(--text-muted);">' + esc(r.sub) + '</div></div>' +
          (r.link ? '<a class="btn" href="' + esc(r.link) + '" target="_blank" rel="noopener" style="font-size:11.5px;">Open link</a>' : '') +
          (r.isEvent ? '<button class="btn" data-w6cce="' + r.raw.id + '" style="font-size:11.5px;">Edit</button>' : '') + '</div>';
      }).join('') || '<p style="font-size:12.5px;color:var(--text-muted);">No events, calls or bookings this month.</p>');
    $c('w5s-prev').addEventListener('click', function(){ var y = fd.getUTCFullYear(), mo = fd.getUTCMonth() - 1; w5cal.month = w5proj.isoDate(new Date(Date.UTC(y, mo, 1))).slice(0, 7); w6ClientCal(); });
    $c('w5s-next').addEventListener('click', function(){ var y = fd.getUTCFullYear(), mo = fd.getUTCMonth() + 1; w5cal.month = w5proj.isoDate(new Date(Date.UTC(y, mo, 1))).slice(0, 7); w6ClientCal(); });
    $c('w5s-tod').addEventListener('click', function(){ w5cal.month = w5sMon().slice(0, 7); w6ClientCal(); });
    $c('w6cc-ev').addEventListener('click', function(){ w6eventModal(null, null, c.member_email); });
    $c('w6cc-call').addEventListener('click', function(){ w6callModal(c.member_email); });
    pane.querySelectorAll('[data-w6cce]').forEach(function(b){ b.addEventListener('click', function(){ var e = (res[2] || []).find(function(x){ return x.id === b.dataset.w6cce; }); if (e) w6eventModal(e); }); });
    async function saveOv(next, note){
      try {
        var r = await ef({ action: 'update_assignments', email: c.member_email, merge_slots: true, assignments: { schedule_overrides: next } });
        c.assignments = r.assignments || c.assignments; w6ClientCal();
      } catch(e){ alert('Couldn\u2019t save the schedule change: ' + e.message); }
    }
    var ws = $c('w5s-ws'); if (ws) ws.addEventListener('change', async function(){
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ws.value)) return;
      ws.disabled = true;
      try { var r = await ef({ action: 'update_assignments', email: c.member_email, merge_slots: true, assignments: { week_start: ws.value } }); c.assignments = r.assignments || c.assignments; if (typeof w1wpcLoad === 'function') w1wpcLoad(true); w6ClientCal(); }
      catch(e){ alert('Couldn\u2019t set the start: ' + e.message); ws.disabled = false; }
    });
    var nqm = $c('w5s-nq-mode'); if (nqm) nqm.addEventListener('change', function(){ $c('w5s-nq-date').style.display = nqm.value === 'date' ? '' : 'none'; });
    var nqg = $c('w5s-nq-go'); if (nqg) nqg.addEventListener('click', async function(){
      var id = $c('w5s-nq-tpl').value; if (!id){ $c('w5s-nq-msg').textContent = 'Pick a programme first.'; return; }
      var so = 'on_end'; if (nqm.value === 'date'){ so = $c('w5s-nq-date').value; if (!/^\d{4}-\d{2}-\d{2}$/.test(so) || so < today){ $c('w5s-nq-msg').textContent = 'Pick a date that hasn\u2019t passed.'; return; } }
      nqg.disabled = true; $c('w5s-nq-msg').textContent = 'Queuing\u2026';
      try { var r = await ef({ action: 'update_assignments', email: c.member_email, merge_slots: true, assignments: { workout_queue: q.concat([{ template_id: id, start_on: so }]) } }); c.assignments = r.assignments || c.assignments; w6ClientCal(); }
      catch(e){ $c('w5s-nq-msg').textContent = 'Failed: ' + e.message; nqg.disabled = false; }
    });
    // drag to move; click a session for skip / restore
    pane.querySelectorAll('.w5s-ses[draggable="true"]').forEach(function(el){
      el.addEventListener('dragstart', function(ev){ w5cal.drag = { orig: el.dataset.orig, date: el.dataset.date }; el.classList.add('dragging'); try { ev.dataTransfer.setData('text/plain', el.dataset.orig); ev.dataTransfer.effectAllowed = 'move'; } catch(_){} });
      el.addEventListener('dragend', function(){ el.classList.remove('dragging'); pane.querySelectorAll('.w5s-day.over').forEach(function(x){ x.classList.remove('over'); }); });
    });
    pane.querySelectorAll('.w5s-ses:not(.extra)').forEach(function(el){
      el.addEventListener('click', function(ev){
        ev.stopPropagation();
        var old = pane.querySelector('.w5s-pop'); if (old) old.remove();
        var orig = el.dataset.orig, cur = ov[orig] || null;
        var pop = document.createElement('div'); pop.className = 'w5s-pop';
        pop.innerHTML = (cur && cur.skip ? '<button class="btn" type="button" data-act="restore" style="font-size:11.5px;">Restore session</button>' : '<button class="btn" type="button" data-act="skip" style="font-size:11.5px;">Skip this session</button>') +
          (cur && cur.to ? '<button class="btn" type="button" data-act="back" style="font-size:11.5px;">Move back to ' + w5sFmt(orig) + '</button>' : '') + '<button class="btn" type="button" data-act="x" style="font-size:11.5px;">\u2715</button>';
        el.parentNode.appendChild(pop);
        pop.style.left = '4px'; pop.style.top = (el.offsetTop + el.offsetHeight + 2) + 'px';
        pop.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(e2){
          e2.stopPropagation(); var next = JSON.parse(JSON.stringify(ov)); var act = b.dataset.act;
          if (act === 'skip') next[orig] = { skip: true };
          else if (act === 'restore' || act === 'back') delete next[orig];
          pop.remove(); if (act !== 'x') saveOv(next);
        }); });
      });
    });
    pane.querySelectorAll('.w5s-day').forEach(function(cell){
      cell.addEventListener('dragover', function(ev){ if (!w5cal.drag) return; var d = cell.dataset.day; if (d < today) return; ev.preventDefault(); cell.classList.add('over'); });
      cell.addEventListener('dragleave', function(){ cell.classList.remove('over'); });
      cell.addEventListener('drop', function(ev){
        ev.preventDefault(); cell.classList.remove('over');
        var dr = w5cal.drag; w5cal.drag = null; if (!dr) return;
        var to = cell.dataset.day; if (to < today || to === dr.date) return;
        var next = JSON.parse(JSON.stringify(ov));
        var occupant = (byDate[to] || []).filter(function(s){ return !s.skipped; })[0];
        if (to === dr.orig) delete next[dr.orig]; else next[dr.orig] = { to: to };
        if (occupant){ if (dr.date === occupant.orig_date) delete next[occupant.orig_date]; else next[occupant.orig_date] = { to: dr.date }; }
        saveOv(next);
      });
    });
  }

  /* ── Settings › Client permissions (coach_ui_prefs.gate_defaults) ── */
  (function(){
    var _sp = w7SettingsPane;
    w7SettingsPane = function(){
      var d = (w0 && w0.prefs && w0.prefs.gate_defaults) || {};
      return _sp.apply(this, arguments) +
        '<div class="card" id="w5s-gd" style="margin:0 0 18px;"><h3 style="margin:0 0 6px;font-size:14px;">Client permissions</h3>' +
        '<p style="font-size:12px;color:var(--text-muted);margin:0 0 6px;">Applied to every new client you add or invite. Existing clients keep what they have \u2014 change one on their Plans tab, or push these to everyone below.</p>' +
        '<div id="w5s-gd-perms">' + w5sPermHtml(d, 's', false) + '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;"><button class="btn btn-primary" type="button" id="w5s-gd-save" style="font-size:12px;">Save defaults</button><button class="btn" type="button" id="w5s-gd-all" style="font-size:12px;">Apply to all current clients</button><span id="w5s-gd-msg" style="font-size:12px;color:var(--text-muted);"></span></div></div>';
    };
    document.addEventListener('click', async function(e){
      var t = e.target; if (!t) return;
      if (t.id === 'w5s-gd-save' || t.id === 'w5s-gd-all'){
        var host = $c('w5s-gd-perms'), m = $c('w5s-gd-msg'); if (!host) return;
        var g = w5sPermRead(host);
        if (t.id === 'w5s-gd-all' && !confirm('Overwrite the permissions on every current client with these defaults?')) return;
        m.textContent = 'Saving\u2026';
        try {
          await w0savePrefs({ gate_defaults: g });
          if (t.id === 'w5s-gd-all'){ var r = await ef({ action: 'apply_gate_defaults', gates: g }); m.textContent = 'Saved and applied to ' + (r.updated || 0) + ' client' + (r.updated === 1 ? '' : 's') + '.'; roster.forEach(function(c){ c.assignments = Object.assign({}, c.assignments || {}, { gates: Object.assign({}, (c.assignments || {}).gates || {}, g) }); }); }
          else m.textContent = 'Saved \u2014 new clients start with these.';
        } catch(err){ m.textContent = 'Save failed: ' + err.message; }
      }
    });
    var host = $c('w5s-gd-perms'); if (host) w5sPermWire(host);
    new MutationObserver(function(){ var h = $c('w5s-gd-perms'); if (h && !h.dataset.w5s){ h.dataset.w5s = '1'; w5sPermWire(h); } }).observe(document.body, { childList: true, subtree: true });
  })();

  /* ── Roster Summary view: Phase + Next phase (w1cols shadow over w1colsBase; w1wpcLoad widened) ── */
  async function w1wpcLoad(force){
    if (!partnerId) return w1.wpc;
    if (!force && Date.now() - w1.wpcAt < 10 * 60e3) return w1.wpc;
    var emails = roster.filter(function(c){ return c.status === 'active'; }).map(function(c){ return c.member_email; });
    w1.wpc = {};
    if (emails.length){
      try {
        var rows = await rest('/workout_plan_cache?member_email=in.(' + encodeURIComponent(emails.join(',')) + ')&is_active=eq.true&select=member_email,current_week,plan_duration_weeks,source,paused_at,generated_at,is_active,week_start,programme_name:programme_json->>programme_name,surface:programme_json->>surface,phases:programme_json->phases&order=generated_at.desc') || [];
        rows.forEach(function(r){
          var em = w1lc(r.member_email);
          if (r.surface && r.surface !== 'workouts') return;
          r.programme_json = { programme_name: r.programme_name, surface: r.surface || 'workouts', phases: r.phases || null };
          if (!w1.wpc[em] || (r.source === 'coach' && w1.wpc[em].source !== 'coach')) w1.wpc[em] = r;
        });
      } catch(_){}
    }
    w1.wpcAt = roster.length ? Date.now() : 0;
    return w1.wpc;
  }
  function w1cols(c){
    var base = w1colsBase(c);
    if (w1.view !== 'summary') return base;
    var em = w1lc(c.member_email), wp = w1.wpc[em], a = c.assignments || {}, dash = '<span class="w1-mu">\u2014</span>', today = w5sToday();
    var phase = dash, next = dash;
    if (wp){
      var wi = w5proj.weekIndexFor(wp, w5sMon()).index, ph = w5proj.phaseFor(wp, wi), end = w5proj.programmeEnd(wp);
      var endsSoon = end && end >= today && end <= w5proj.addDays(today, 7);
      phase = (ph ? esc(ph.name) + ' <span class="w1-mu">wk ' + ph.week_of_phase + '/' + ph.phase_weeks + '</span>' : (wi ? 'Week ' + wi + ' of ' + w5proj.planWeeks(wp) : (end && end < today ? '<span class="w5s-amber">finished</span>' : '<span class="w1-mu">not started</span>'))) + (endsSoon ? '<div class="w5s-amber" style="font-size:11px;">ends ' + w5sFmt(end).replace(/^\w+ /, '') + '</div>' : '');
      var q = Array.isArray(a.workout_queue) ? a.workout_queue : [];
      next = q.length ? esc(w5sTplName(q[0].template_id) || 'Programme') + '<div class="w1-mu">' + (q[0].start_on === 'on_end' ? (end ? w5sFmt(end).replace(/^\w+ /, '') : 'on end') : w5sFmt(q[0].start_on).replace(/^\w+ /, '')) + (q.length > 1 ? ' \u00b7 +' + (q.length - 1) : '') + '</div>' : (endsSoon || (end && end < today) ? '<span class="w5s-amber">nothing queued</span>' : dash);
    }
    base.heads = base.heads.slice(0, 1).concat(['Phase', 'Next phase'], base.heads.slice(1));
    base.cells = base.cells.slice(0, 1).concat([phase, next], base.cells.slice(1));
    return base;
  }
  /* ============================ end PM-1090 W5 ============================ */


