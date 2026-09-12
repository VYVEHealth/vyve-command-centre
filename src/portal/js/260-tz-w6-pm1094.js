  /* ============================ PM-1094 Trainerize W6 ============================
     #86 circuit + interval session types.

     The picker writes `workout_type` plus one typed config block onto the day
     payload; coach_build_program_json v3 carries both onto the session and
     computes an honest duration estimate from the shape. A day with no
     workout_type is regular and comes out of the builder byte-identical to W5,
     so every existing day template and every stock programme is untouched.

     A rest block is an exercise row with type 'rest' rather than a fourth
     session type — that is what lets it sit mid-circuit and keeps the member
     player's item loop uniform.

     Shadows: renderDayEditor, collectDay, w3TvsRefresh, summarise.
  ============================================================================= */
  var W6_TYPES = ['regular', 'circuit', 'interval'];
  var W6_META = {
    regular:  { label: 'Regular',  hint: 'Sets and reps, logged set by set.' },
    circuit:  { label: 'Circuit',  hint: 'Round trips through the whole list.' },
    interval: { label: 'Interval', hint: 'Work and rest on a timer.' }
  };
  function w6Type(day){ var t = (day && day.workout_type) || 'regular'; return W6_TYPES.indexOf(t) >= 0 ? t : 'regular'; }
  function w6Int(v, def, lo, hi){ var n = parseInt(v, 10); if (isNaN(n)) n = def; return Math.max(lo, Math.min(hi, n)); }
  function w6Circuit(day){ var c = (day && day.circuit) || {}; return { rounds: w6Int(c.rounds, 3, 1, 20), rest_between_rounds_s: w6Int(c.rest_between_rounds_s, 60, 0, 600) }; }
  function w6Interval(day){ var c = (day && day.interval) || {}; return { rounds: w6Int(c.rounds, 6, 1, 50), work_s: w6Int(c.work_s, 30, 5, 600), rest_s: w6Int(c.rest_s, 30, 0, 600) }; }
  function w6NumField(label, cls, val, min, max){
    return '<div class="field" style="max-width:120px;"><label>' + label + '</label><input class="' + cls + '" type="number" min="' + min + '" max="' + max + '" value="' + val + '"/></div>';
  }
  function w6TypePanel(day){
    var t = w6Type(day), c = w6Circuit(day), iv = w6Interval(day);
    return '<div class="w6-type" data-w6-type="' + t + '" style="border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:10px;background:var(--surface-2);">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Session type</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
      W6_TYPES.map(function(k){
        return '<button class="btn w6-t-btn' + (k === t ? ' btn-primary' : '') + '" type="button" data-w6t="' + k + '" style="font-size:12px;padding:6px 12px;">' + W6_META[k].label + '</button>';
      }).join('') +
      '</div>' +
      '<p class="w6-t-hint" style="font-size:11.5px;color:var(--text-muted);margin:6px 0 0;">' + W6_META[t].hint + '</p>' +
      '<div class="w6-cfg w6-cfg-circuit" style="display:' + (t === 'circuit' ? 'flex' : 'none') + ';gap:10px;flex-wrap:wrap;margin-top:8px;">' +
        w6NumField('Rounds', 'w6-c-rounds', c.rounds, 1, 20) +
        w6NumField('Rest between rounds (s)', 'w6-c-rbr', c.rest_between_rounds_s, 0, 600) +
      '</div>' +
      '<div class="w6-cfg w6-cfg-interval" style="display:' + (t === 'interval' ? 'flex' : 'none') + ';gap:10px;flex-wrap:wrap;margin-top:8px;">' +
        w6NumField('Rounds', 'w6-i-rounds', iv.rounds, 1, 50) +
        w6NumField('Work (s)', 'w6-i-work', iv.work_s, 5, 600) +
        w6NumField('Rest (s)', 'w6-i-rest', iv.rest_s, 0, 600) +
      '</div></div>';
  }
  function w6WireTypePanel(container){
    var panel = container.querySelector('.w6-type');
    if (!panel) return;
    panel.querySelectorAll('[data-w6t]').forEach(function(b){
      b.addEventListener('click', function(){
        var k = b.dataset.w6t;
        panel.dataset.w6Type = k;
        panel.querySelectorAll('[data-w6t]').forEach(function(x){ x.classList.toggle('btn-primary', x.dataset.w6t === k); });
        panel.querySelector('.w6-cfg-circuit').style.display = k === 'circuit' ? 'flex' : 'none';
        panel.querySelector('.w6-cfg-interval').style.display = k === 'interval' ? 'flex' : 'none';
        panel.querySelector('.w6-t-hint').textContent = W6_META[k].hint;
        w3TvsRefresh(container);
      });
    });
  }
  function w6AddRestRow(wrap, ex){
    ex = ex || {};
    var d = document.createElement('div');
    d.className = 'de-row w6-rest';
    d.dataset.w6rest = '1';
    d.innerHTML = '<span class="w3-drag" title="Drag to reorder" draggable="true">\u2261</span>' +
      '<div class="de-grid">' +
      '<div class="field"><label>Rest block</label><input class="de-name" type="text" maxlength="40" value="' + esc(ex.name || 'Rest') + '"/></div>' +
      '<div class="field"><label>Seconds</label><input class="de-secs" type="number" min="5" max="900" value="' + w6Int(ex.duration_seconds, 30, 5, 900) + '"/></div>' +
      '<button class="btn de-del" type="button" style="font-size:11px;padding:6px 8px;">&times;</button></div>';
    d.querySelector('.de-del').addEventListener('click', function(){ d.remove(); w3TvsRefresh(wrap); });
    var h = d.querySelector('.w3-drag');
    h.addEventListener('dragstart', function(ev){ d.classList.add('w3-dragging'); wrap._w3drag = d; if (ev.dataTransfer) ev.dataTransfer.setData('text/plain', ''); });
    h.addEventListener('dragend', function(){ d.classList.remove('w3-dragging'); wrap._w3drag = null; });
    d.addEventListener('dragover', function(ev){
      if (!wrap._w3drag || wrap._w3drag === d || wrap._w3drag.parentElement !== d.parentElement) return;
      ev.preventDefault();
      var rct = d.getBoundingClientRect();
      d.parentElement.insertBefore(wrap._w3drag, ev.clientY < rct.top + rct.height / 2 ? d : d.nextSibling);
    });
    wrap.appendChild(d);
  }
  /* Rest rows carry no sets, so the Total Volume Sets strip must skip them —
     reading .de-sets on one would throw and take the whole editor with it. */
  function w3TvsRefresh(anyEl){
    var container = anyEl && anyEl.closest ? anyEl.closest('[data-w3-tvs-host]') : null;
    if (!container){ container = document.querySelector('[data-w3-tvs-host]'); if (!container) return; }
    var strip = container.querySelector('.w3-tvs-strip');
    if (!strip) return;
    var exs = [];
    container.querySelectorAll('.de-main > .de-row').forEach(function(e){
      if (e.dataset.w6rest) return;
      var nm = e.querySelector('.de-name').value.trim();
      if (nm) exs.push({ name: nm, sets: e.querySelector('.de-sets').value.trim() || '3' });
    });
    var panel = container.querySelector('.w6-type');
    var t = panel ? (panel.dataset.w6Type || 'regular') : 'regular';
    if (t !== 'regular'){
      strip.innerHTML = '<div style="font-size:11px;color:var(--text-muted);">' +
        (t === 'circuit' ? 'Rounds replace sets on a circuit \u2014 volume totals are off.' : 'The timer sets the volume on an interval session.') + '</div>';
      return;
    }
    strip.innerHTML = w3TvsHtml(exs) || '<div style="font-size:11px;color:var(--text-muted);">Volume totals appear as you add library exercises.</div>';
  }
  function renderDayEditor(container, day){
    day = day || {};
    container.setAttribute('data-w3-tvs-host', '1');
    container.innerHTML = w6TypePanel(day) +
      '<div class="w3-tvs-strip" style="margin-bottom:6px;"></div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Warm up (optional)</div><div class="de-warm"></div><div style="margin-bottom:8px;">' + rowBtn('+ Warm up exercise', 'de-add-warm') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Workout</div><div class="de-main"></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">' + rowBtn('+ Exercise', 'de-add-main') + rowBtn('+ Rest block', 'de-add-rest') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Cool down (optional)</div><div class="de-cool"></div>' + rowBtn('+ Cool down exercise', 'de-add-cool');
    var wm = container.querySelector('.de-warm'), mm = container.querySelector('.de-main'), cm = container.querySelector('.de-cool');
    (day.warmup || []).forEach(function(x){ addDayRow(wm, x); });
    ((day.exercises && day.exercises.length) ? day.exercises : [{}]).forEach(function(x){
      if (x && x.type === 'rest') w6AddRestRow(mm, x); else addDayRow(mm, x);
    });
    (day.cooldown || []).forEach(function(x){ addDayRow(cm, x); });
    container.querySelector('.de-add-warm').addEventListener('click', function(){ addDayRow(wm, { sets: '1', reps: '', rest_seconds: 0 }); });
    container.querySelector('.de-add-main').addEventListener('click', function(){ addDayRow(mm, {}); });
    container.querySelector('.de-add-rest').addEventListener('click', function(){ w6AddRestRow(mm, {}); });
    container.querySelector('.de-add-cool').addEventListener('click', function(){ addDayRow(cm, { sets: '1', reps: '', rest_seconds: 0 }); });
    container.addEventListener('input', function(ev){
      if (ev.target && (ev.target.classList.contains('de-sets') || ev.target.classList.contains('de-name'))) w3TvsRefresh(container);
    });
    w6WireTypePanel(container);
    w3TvsRefresh(container);
  }
  function collectDay(container){
    function grab(sel){
      var out = [];
      container.querySelectorAll(sel + ' > .de-row').forEach(function(e){
        if (e.dataset.w6rest){
          out.push({ type: 'rest', name: e.querySelector('.de-name').value.trim() || 'Rest', duration_seconds: w6Int(e.querySelector('.de-secs').value, 30, 5, 900) });
          return;
        }
        var nm = e.querySelector('.de-name').value.trim();
        if (!nm) return;
        var hit = cexByName(nm);
        var isDur = e.dataset.w3type === 'duration';
        var row = { name: nm, sets: e.querySelector('.de-sets').value.trim() || '3', rest_seconds: parseInt(e.querySelector('.de-rest').value) || 0, notes: e.querySelector('.de-notes').value.trim() };
        if (isDur){
          row.type = 'duration';
          row.duration_seconds = parseInt(e.querySelector('.de-reps').value) || 30;
          row.reps = String(row.duration_seconds) + 's';
        } else {
          row.reps = e.querySelector('.de-reps').value.trim() || '8-12';
        }
        var tempo = e.querySelector('.de-tempo').value.trim(); if (tempo) row.tempo = tempo;
        var rir = e.querySelector('.de-rir').value.trim(); if (rir !== '') row.rir = rir;
        var grp = e.querySelector('.de-grp').value; if (grp) row.group = grp;
        if (hit) row.exercise_id = hit.id;
        out.push(row);
      });
      return out;
    }
    var day = { warmup: grab('.de-warm'), exercises: grab('.de-main'), cooldown: grab('.de-cool') };
    var panel = container.querySelector('.w6-type');
    var t = panel ? (W6_TYPES.indexOf(panel.dataset.w6Type) >= 0 ? panel.dataset.w6Type : 'regular') : 'regular';
    if (t === 'circuit'){
      day.workout_type = 'circuit';
      day.circuit = { rounds: w6Int(panel.querySelector('.w6-c-rounds').value, 3, 1, 20), rest_between_rounds_s: w6Int(panel.querySelector('.w6-c-rbr').value, 60, 0, 600) };
    } else if (t === 'interval'){
      day.workout_type = 'interval';
      day.interval = { rounds: w6Int(panel.querySelector('.w6-i-rounds').value, 6, 1, 50), work_s: w6Int(panel.querySelector('.w6-i-work').value, 30, 5, 600), rest_s: w6Int(panel.querySelector('.w6-i-rest').value, 30, 0, 600) };
    }
    return day;
  }
  /* Programme + day rows say what shape they are; a regular day reads exactly
     as it did on W5. */
  function w6DayChip(d){
    var t = w6Type(d);
    if (t === 'circuit'){ var c = w6Circuit(d); return 'Circuit \u00b7 ' + c.rounds + ' rounds'; }
    if (t === 'interval'){ var iv = w6Interval(d); return 'Interval \u00b7 ' + iv.rounds + '\u00d7' + iv.work_s + 's/' + iv.rest_s + 's'; }
    return '';
  }
  function w6ProgTypes(p){
    var seen = {};
    (p.weeks || []).forEach(function(w){ (w.days || []).forEach(function(d){ if (d && (d.exercises || []).length){ var t = w6Type(d); if (t !== 'regular') seen[t] = 1; } }); });
    return Object.keys(seen);
  }
  function summarise(p){
    if (plKind === 'habits') return ((p.habits||[]).length) + ' habits';
    if (plKind === 'workout'){ var ss = p.sessions || []; var mins = ss.length ? Math.round(ss.reduce(function(a, s){ return a + w5sEst((s.exercises || []).length); }, 0) / ss.length) : 0; return ss.length + ' sessions / week' + (mins ? ' \u00b7 ~' + mins + ' min' : ''); }
    if (plKind === 'workout_day'){
      var chip = w6DayChip(p);
      var nEx = (p.exercises || []).filter(function(e){ return !e || e.type !== 'rest'; }).length;
      return nEx + ' exercises' + (chip ? ' \u00b7 ' + chip : (dayHasGroups(p) ? ' \u00b7 supersets' : '')) + ' \u00b7 ~' + w5sEst(nEx) + ' min';
    }
    if (plKind === 'program'){
      var ph = Array.isArray(p.phases) && p.phases.length ? ' \u00b7 ' + p.phases.length + ' phase' + (p.phases.length === 1 ? '' : 's') : '';
      var ts = w6ProgTypes(p);
      return ((p.weeks||[]).length) + ' weeks \u00b7 ' + progDayCount(p) + ' training days' + ph + (ts.length ? ' \u00b7 ' + ts.map(function(t){ return W6_META[t].label.toLowerCase(); }).join(' + ') : '');
    }
    if (plKind === 'nutrition') return (p.calories ? p.calories + ' kcal' : (p.meals || p.pdf_path ? '' : 'targets')) + (p.protein_g ? ' \u00b7 ' + p.protein_g + 'g protein' : '') + (p.meals ? (p.calories ? ' \u00b7 ' : '') + p.meals.length + '-meal plan' : '') + (p.pdf_path ? (p.calories || p.meals ? ' \u00b7 ' : '') + 'PDF attached' : '');
    if (plKind === 'supplements') return ((p.items||[]).length) + ' supplements';
    return '';
  }
  /* The week grid stamps its own type chips. Deliberately an observer on
     #pg-slots rather than a second shadow of renderProg — copying 130 lines of
     W5 to add one chip is how two versions of a builder drift apart. */
  function w6StampSlots(){
    var host = document.getElementById('pg-slots');
    if (!host || !progState || !progState.weeks || !progState.weeks[progWeekIdx]) return;
    host.querySelectorAll('.pg-slot').forEach(function(slot){
      var link = slot.querySelector('[data-pg-edit]');
      if (!link || slot.querySelector('.w6-slot-chip')) return;
      var d = progState.weeks[progWeekIdx].days[parseInt(link.dataset.pgEdit)];
      var chip = w6DayChip(d);
      if (!chip) return;
      var small = slot.querySelector('small');
      if (!small) return;
      var span = document.createElement('span');
      span.className = 'w6-slot-chip';
      span.style.cssText = 'display:block;margin-top:2px;color:var(--text-accent);';
      span.textContent = chip;
      small.appendChild(span);
    });
  }
  function renderProg(){ w5RenderProgBase(); w6StampSlots(); }

  /* Previews: a rest block is not a 3 x 8-12 exercise. */
  function w3DayRowsHtml(day){
    var chip = w6DayChip(day);
    var head = chip ? '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-accent);margin-bottom:6px;">' + esc(chip) + '</div>' : '';
    var body = (day.exercises || []).map(function(e, i){
      if (e && e.type === 'rest'){
        return '<div class="w3-qrow"><div style="font-size:11px;font-weight:800;color:var(--text-muted);width:16px;flex:none;">\u2014</div>' +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:12.5px;color:var(--text-muted);">' + esc(e.name || 'Rest') + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">' + (e.duration_seconds || 30) + 's</div></div></div>';
      }
      var hit = w3Resolve(e);
      var meta = (e.sets || '3') + ' \u00d7 ' + (e.type === 'duration' ? ((e.duration_seconds || 30) + 's') : (e.reps || '8-12')) + (e.rest_seconds ? ' \u00b7 rest ' + e.rest_seconds + 's' : '') + (e.group ? ' \u00b7 superset ' + e.group : '');
      return '<div class="w3-qrow"><div style="font-size:11px;font-weight:800;color:var(--text-muted);width:16px;flex:none;">' + String.fromCharCode(65 + Math.min(i, 25)) + '</div>' +
        w3ThumbImg(hit, 'th') +
        '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:12.5px;">' + esc(e.name) + '</div><div style="font-size:11px;color:var(--text-muted);">' + esc(meta) + (e.notes ? ' \u00b7 ' + esc(e.notes) : '') + '</div></div></div>';
    }).join('');
    return head + (body || '<p style="font-size:12px;color:var(--text-muted);">No exercises.</p>');
  }

  /* ============================ end PM-1094 W6 ============================ */


