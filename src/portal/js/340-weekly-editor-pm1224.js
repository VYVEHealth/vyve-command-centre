  /* ── PM-1224 · Weekly workouts get the real builder ─────────────────────────────────────
     The Weekly workouts editor was still the PM-955 original (050-plans.js addWSession): a bare
     name / sets / reps / rest / notes row with a datalist of member-library names — no library
     picker, no tempo / RIR / superset, no timed exercises, no volume strip. Day templates had all
     of that via renderDayEditor since PM-985, and PM-1223's "Choose from library" + Reps/Secs
     toggle landed there only. Dean, 12 Sep: "if I click Exercise it just gives me a dropdown…
     there's only sets and reps". Each session is now a renderDayEditor day (same rows, same
     picker, same toggle); plCollect for kind 'workout' uses collectDay per session.
     Contract: session rows gain the optional day-row fields (type, duration_seconds, tempo, rir,
     group, exercise_id) that coach_build_program_json already reads for sessions.        ── */
  function addWSession(sess){
    sess = sess || {};
    var host = $c('w-sessions'); if (!host) return;
    var d = document.createElement('div');
    d.className = 'w-session';
    d.style.cssText = 'border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;';
    d.innerHTML = '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:8px;flex-wrap:wrap;">' +
        '<div class="field" style="flex:1;min-width:220px;margin:0;"><label>Session name</label><input class="w-name" type="text" maxlength="80" value="' + esc(sess.name || '') + '" placeholder="e.g. Push A"/></div>' +
        rowBtn('Remove session', 'w-del') + '</div>' +
      '<div class="w-day"></div>';
    renderDayEditor(d.querySelector('.w-day'), sess);
    d.querySelector('.w-del').addEventListener('click', function(){ d.remove(); });
    host.appendChild(d);
    /* the day rows complete against the coach library (cex-names); make sure the list exists and is filled */
    if (!$c('cex-names')) host.insertAdjacentHTML('afterend', cexDatalist());
    var dl = $c('cex-names');
    if (dl && !dl.children.length) exLoad().then(function(){ var dl2 = $c('cex-names'); if (dl2 && !dl2.children.length) dl2.outerHTML = cexDatalist(); });
  }
  (function(){
    var _pc = plCollect;
    plCollect = function(){
      if (plKind !== 'workout') return _pc.apply(this, arguments);
      var ss = [];
      document.querySelectorAll('#w-sessions .w-session').forEach(function(d){
        var nm = (d.querySelector('.w-name') && d.querySelector('.w-name').value.trim()) || 'Session';
        var dayEl = d.querySelector('.w-day'); if (!dayEl) return;
        var day = collectDay(dayEl);
        if (day && day.exercises && day.exercises.length) ss.push(Object.assign({}, day, { name: nm }));
      });
      var instr = ($c('w-instructions') && $c('w-instructions').value.trim()) || '';
      return { payload: { sessions: ss, instructions: instr }, valid: ss.length > 0, err: 'Add at least one session with an exercise.' };
    };
  })();
