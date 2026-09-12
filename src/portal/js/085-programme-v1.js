
  /* ── Day editor: shared by the day-template builder and per-week programme copies ── */
  var GRP_OPTS = ['', 'A', 'B', 'C', 'D'];
  function addDayRow(wrap, ex){
    ex = ex || {};
    var d = document.createElement('div');
    d.className = 'de-row' + (ex.group ? ' grpd' : '');
    d.innerHTML = '<div class="de-grid">' +
      '<div class="field"><label>Exercise</label><input class="de-name" list="cex-names" type="text" value="' + esc(ex.name || '') + '"/></div>' +
      '<div class="field"><label>Sets</label><input class="de-sets" type="text" value="' + esc(ex.sets != null ? ex.sets : '3') + '"/></div>' +
      '<div class="field"><label>Reps</label><input class="de-reps" type="text" value="' + esc(ex.reps || '8-12') + '"/></div>' +
      '<div class="field"><label>Tempo</label><input class="de-tempo" type="text" maxlength="8" placeholder="3010" value="' + esc(ex.tempo || '') + '"/></div>' +
      '<div class="field"><label>Rest s</label><input class="de-rest" type="number" min="0" value="' + (ex.rest_seconds != null ? ex.rest_seconds : 90) + '"/></div>' +
      '<div class="field"><label>RIR</label><input class="de-rir" type="text" maxlength="4" placeholder="2" value="' + esc(ex.rir != null ? ex.rir : '') + '"/></div>' +
      '<div class="field"><label title="Give two or more exercises the same letter to run them back-to-back as a superset or circuit">Superset</label><select class="de-grp">' + GRP_OPTS.map(function(g){ return '<option value="' + g + '"' + ((ex.group || '') === g ? ' selected' : '') + '>' + (g || '\u2014') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Cue / note</label><input class="de-notes" type="text" value="' + esc(ex.notes || '') + '"/></div>' +
      '<button class="btn de-del" type="button" style="font-size:11px;padding:6px 8px;">&times;</button></div>';
    d.querySelector('.de-del').addEventListener('click', function(){ d.remove(); });
    d.querySelector('.de-grp').addEventListener('change', function(){ d.classList.toggle('grpd', !!this.value); });
    wrap.appendChild(d);
  }
  function renderDayEditor(container, day){
    day = day || {};
    container.innerHTML = '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Warm up (optional)</div><div class="de-warm"></div><div style="margin-bottom:8px;">' + rowBtn('+ Warm up exercise', 'de-add-warm') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Workout</div><div class="de-main"></div><div style="margin-bottom:8px;">' + rowBtn('+ Exercise', 'de-add-main') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Cool down (optional)</div><div class="de-cool"></div>' + rowBtn('+ Cool down exercise', 'de-add-cool');
    var wm = container.querySelector('.de-warm'), mm = container.querySelector('.de-main'), cm = container.querySelector('.de-cool');
    (day.warmup || []).forEach(function(x){ addDayRow(wm, x); });
    ((day.exercises && day.exercises.length) ? day.exercises : [{}]).forEach(function(x){ addDayRow(mm, x); });
    (day.cooldown || []).forEach(function(x){ addDayRow(cm, x); });
    container.querySelector('.de-add-warm').addEventListener('click', function(){ addDayRow(wm, { sets: '1', reps: '', rest_seconds: 0 }); });
    container.querySelector('.de-add-main').addEventListener('click', function(){ addDayRow(mm, {}); });
    container.querySelector('.de-add-cool').addEventListener('click', function(){ addDayRow(cm, { sets: '1', reps: '', rest_seconds: 0 }); });
  }
  function collectDay(container){
    function grab(sel){
      var out = [];
      container.querySelectorAll(sel + ' > .de-row').forEach(function(e){
        var nm = e.querySelector('.de-name').value.trim();
        if (!nm) return;
        var hit = cexByName(nm);
        var row = { name: nm, sets: e.querySelector('.de-sets').value.trim() || '3', reps: e.querySelector('.de-reps').value.trim() || '8-12', rest_seconds: parseInt(e.querySelector('.de-rest').value) || 0, notes: e.querySelector('.de-notes').value.trim() };
        var tempo = e.querySelector('.de-tempo').value.trim(); if (tempo) row.tempo = tempo;
        var rir = e.querySelector('.de-rir').value.trim(); if (rir !== '') row.rir = rir;
        var grp = e.querySelector('.de-grp').value; if (grp) row.group = grp;
        if (hit) row.exercise_id = hit.id;
        out.push(row);
      });
      return out;
    }
    return { warmup: grab('.de-warm'), exercises: grab('.de-main'), cooldown: grab('.de-cool') };
  }

  /* ── Programme builder ── */
  async function loadDayTplChoices(){
    try { dayTplChoices = await rest('/coach_templates?' + pscope() + '&kind=eq.workout_day&active=eq.true&select=id,name,payload&order=name.asc') || []; }
    catch(e){ dayTplChoices = []; }
  }
  function renderProg(){
    if (!progState) return;
    var tabs = progState.weeks.map(function(w, i){
      return '<button class="pg-tab' + (i === progWeekIdx ? ' on' : '') + '" data-pg-week="' + i + '" type="button">Week ' + (i + 1) + '</button>';
    }).join('');
    tabs += '<button class="pg-tab ghost" id="pg-dup" type="button">Duplicate week</button><button class="pg-tab ghost" id="pg-add" type="button">+ Add week</button>';
    if (progState.weeks.length > 1) tabs += '<button class="pg-tab ghost" id="pg-rmw" type="button">Remove week</button>';
    $c('pg-tabs').innerHTML = tabs;
    $c('pg-tabs').querySelectorAll('[data-pg-week]').forEach(function(b){ b.addEventListener('click', function(){ if (progEditingDay) progDayDone(); progWeekIdx = parseInt(b.dataset.pgWeek); renderProg(); }); });
    $c('pg-dup').addEventListener('click', function(){ if (progEditingDay) progDayDone(); progState.weeks.splice(progWeekIdx + 1, 0, deepCopy(progState.weeks[progWeekIdx])); progWeekIdx++; renderProg(); });
    $c('pg-add').addEventListener('click', function(){ if (progEditingDay) progDayDone(); progState.weeks.push(emptyWeek()); progWeekIdx = progState.weeks.length - 1; renderProg(); });
    var rmw = $c('pg-rmw'); if (rmw) rmw.addEventListener('click', function(){
      if (!confirm('Remove week ' + (progWeekIdx + 1) + '?')) return;
      if (progEditingDay) progEditingDay = null;
      progState.weeks.splice(progWeekIdx, 1); progWeekIdx = Math.max(0, progWeekIdx - 1); renderProg();
    });
    var wk = progState.weeks[progWeekIdx];
    var tplOpts = '<option value="">+ Add training day\u2026</option>' + dayTplChoices.map(function(t){ return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('');
    $c('pg-slots').innerHTML = wk.days.map(function(d, j){
      var inner;
      if (d && (d.exercises || []).length){
        inner = '<div class="pg-chip"><div>' + esc(d.name || 'Training day') + '</div><small>' + d.exercises.length + ' exercises' + (dayHasGroups(d) ? ' \u00b7 supersets' : '') + '</small><div style="margin-top:5px;"><span class="lnk" data-pg-edit="' + j + '">Edit this week\u2019s copy</span><span class="lnk" data-pg-clear="' + j + '">Remove</span></div></div>';
      } else if (dayTplChoices.length){
        inner = '<select class="pg-pick" data-pg-slot="' + j + '" style="width:100%;padding:7px 8px;border:1px dashed var(--border);border-radius:8px;background:none;color:var(--text-muted);font-size:11.5px;font-family:inherit;">' + tplOpts + '</select>';
      } else {
        inner = '<div style="font-size:11.5px;color:var(--text-muted);">Rest \u2014 build a day template first to fill this slot.</div>';
      }
      return '<div class="pg-slot"><div class="d">Day ' + (j + 1) + '</div>' + inner + '</div>';
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
  function progDayOpen(j){
    if (progEditingDay) progDayDone();
    progEditingDay = { i: progWeekIdx, j: j };
    var d = progState.weeks[progWeekIdx].days[j];
    var host = $c('pg-dayedit');
    host.style.display = '';
    host.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><strong style="font-size:13.5px;">Week ' + (progWeekIdx + 1) + ' \u00b7 Day ' + (j + 1) + '</strong><input id="pg-day-name" type="text" maxlength="80" value="' + esc(d.name || '') + '" style="flex:1;padding:8px 11px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;"/><button class="btn btn-primary" id="pg-day-done" type="button" style="font-size:12px;">Done</button></div><div id="pg-day-rows"></div><p style="font-size:11.5px;color:var(--text-muted);margin-top:8px;">Edits here change this week\u2019s copy only \u2014 the original template and every other week stay as they are.</p>';
    renderDayEditor($c('pg-day-rows'), d);
    $c('pg-day-done').addEventListener('click', progDayDone);
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function progDayDone(){
    if (!progEditingDay) return;
    var day = collectDay($c('pg-day-rows'));
    var prev = progState.weeks[progEditingDay.i].days[progEditingDay.j] || {};
    day.name = ($c('pg-day-name') && $c('pg-day-name').value.trim()) || prev.name || 'Training day';
    if (prev.src_id) day.src_id = prev.src_id;
    progState.weeks[progEditingDay.i].days[progEditingDay.j] = day;
    progEditingDay = null;
    renderProg();
  }
  function progQuick(mode){
    if (progEditingDay) progDayDone();
    (progState.weeks[progWeekIdx].days || []).forEach(function(d){
      if (!d) return;
      (d.exercises || []).forEach(function(e){
        if (mode === 'set'){ var s = parseInt(e.sets); if (!isNaN(s)) e.sets = String(s + 1); }
        if (mode === 'rir'){ var r = parseInt(e.rir); if (!isNaN(r) && r > 0) e.rir = String(r - 1); }
      });
    });
    renderProg();
  }

  /* == Messages (PM-960): coach<->client threads over coach_messages, RLS-direct == */
  var msgThread = null, msgRows = [], msgLastId = null, msgTimer = null, msgUnread = {};
