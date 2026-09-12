  function wkKindMatch(slot, kind){ return slot === 'workout' ? (kind === 'workout' || kind === 'program') : kind === slot; }
  function deepCopy(o){ return JSON.parse(JSON.stringify(o)); }
  function ytId(u){ var m = String(u||'').match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  function dayHasGroups(p){ return (p.exercises||[]).some(function(e){ return e.group; }); }
  function progDayCount(p){ var n = 0; (p.weeks||[]).forEach(function(w){ (w.days||[]).forEach(function(d){ if (d && (d.exercises||[]).length) n++; }); }); return n; }
  function emptyWeek(){ return { days: [null, null, null, null, null, null, null] }; }
  function cexDatalist(){ return '<datalist id="cex-names">' + cexRows.map(function(r){ return '<option value="' + esc(r.name) + '">'; }).join('') + '</datalist>'; }
  function cexByName(n){ n = (n||'').trim().toLowerCase(); if (!n) return null; for (var i = 0; i < cexRows.length; i++){ if ((cexRows[i].name||'').toLowerCase() === n) return cexRows[i]; } return null; }
  async function exLoad(){
    if (cexLoaded) return;
    try {
      cexRows = await rest('/coach_exercises?active=eq.true&select=id,partner_id,name,category,equipment,video_url,media_url,cues&order=name.asc&limit=2000') || [];
      cexLoaded = true;
      var cats = {}, eqs = {};
      cexRows.forEach(function(r){ if (r.category) cats[r.category] = 1; if (r.equipment) eqs[r.equipment] = 1; });
      var co = Object.keys(cats).sort(), eo = Object.keys(eqs).sort();
      if ($c('ex-f-cat')) $c('ex-f-cat').innerHTML = '<option value="">All muscle groups</option>' + co.map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('');
      if ($c('ex-f-eq')) $c('ex-f-eq').innerHTML = '<option value="">Any equipment</option>' + eo.map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('');
      if ($c('ex-cat-names')) $c('ex-cat-names').innerHTML = co.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('');
      if ($c('ex-eq-names')) $c('ex-eq-names').innerHTML = eo.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('');
    } catch(e){ cexRows = []; }
  }
  async function exInit(){ await exLoad(); exRender(); }
  function exRender(){
    var q = ($c('ex-f-q').value || '').trim().toLowerCase();
    var fc = $c('ex-f-cat').value, fe = $c('ex-f-eq').value;
    var rows = cexRows.filter(function(r){
      if (exScope === 'mine' && !r.partner_id) return false;
      if (exScope === 'vyve' && r.partner_id) return false;
      if (fc && r.category !== fc) return false;
      if (fe && r.equipment !== fe) return false;
      if (q && (r.name||'').toLowerCase().indexOf(q) < 0) return false;
      if ($c('ex-f-vid') && $c('ex-f-vid').checked && !r.video_url && !r.media_url) return false;
      return true;
    });
    var CAP = 80, shown = rows.slice(0, CAP);
    $c('ex-count').textContent = rows.length > CAP ? ('Showing ' + CAP + ' of ' + rows.length + ' — narrow with search or filters.') : (rows.length + ' exercise' + (rows.length === 1 ? '' : 's'));
    if (!rows.length){ $c('ex-list').innerHTML = '<div class="empty-state"><h3>Nothing matches</h3><p>Try a different search, or add your own exercise.</p></div>'; return; }
    $c('ex-list').innerHTML = shown.map(function(r){
      var mine = vyveScope ? !r.partner_id : !!r.partner_id;
      var tag = mine ? '<span class="src-tag src-mine">Yours</span>' : '<span class="src-tag src-vyve">VYVE</span>';
      var vid = r.video_url ? ' \u00b7 <span style="color:var(--gold);font-weight:700;">\u25b6 your video</span>' : (r.media_url ? ' \u00b7 <span style="color:var(--gold);font-weight:700;">\u25b6 VYVE video</span>' : '');
      var acts = mine
        ? '<button class="btn" data-ex-edit="' + r.id + '" style="font-size:11.5px;">Edit</button> <button class="btn" data-ex-del="' + r.id + '" style="font-size:11.5px;">Remove</button>'
        : '<button class="btn" data-ex-dup="' + r.id + '" style="font-size:11.5px;">Duplicate to my library</button>';
      return '<div class="ex-item"><div style="flex:1;min-width:200px;"><div class="nm">' + esc(r.name) + tag + '</div><div class="mt">' + esc(r.category || '') + (r.equipment ? ' \u00b7 ' + esc(r.equipment) : '') + vid + '</div></div><div style="display:flex;gap:6px;">' + acts + '</div></div>';
    }).join('');
    $c('ex-list').querySelectorAll('[data-ex-edit]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(cexRows.find(function(x){ return x.id === b.dataset.exEdit; }), null); }); });
    $c('ex-list').querySelectorAll('[data-ex-dup]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(null, cexRows.find(function(x){ return x.id === b.dataset.exDup; })); }); });
    $c('ex-list').querySelectorAll('[data-ex-del]').forEach(function(b){ b.addEventListener('click', async function(){
      if (!confirm('Remove this exercise from your library? Programmes it\u2019s already in are unaffected.')) return;
      try { await rest('/coach_exercises?id=eq.' + b.dataset.exDel, { method: 'PATCH', body: { active: false } }); cexLoaded = false; await exLoad(); exRender(); }
      catch(e){ alert('Remove failed: ' + e.message); }
    }); });
  }
  function exVideoPreview(){
    var raw = $c('exf-video').value.trim();
    /* PM-1157: VYVE Storage mp4s (and any direct file link) preview as a playable <video>, not a "not a YouTube link" warning. */
    var direct = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(raw) ? raw : '';
    var vp = $c('exf-vprev');
    if (direct){
      var prev = $c('exf-prev');
      if (!vp){ vp = document.createElement('video'); vp.id = 'exf-vprev'; vp.controls = true; vp.playsInline = true; vp.preload = 'metadata'; vp.style.cssText = 'width:220px;max-width:45%;border-radius:8px;background:#000;flex:none;'; prev.insertBefore(vp, prev.firstChild); }
      if (vp.getAttribute('src') !== direct){ vp.src = direct; var row = cexEditing || cexDupFrom; var po = row ? w3ThumbSrc(row) : ''; if (po) vp.poster = po; else vp.removeAttribute('poster'); }
      vp.style.display = ''; $c('exf-thumb').style.display = 'none';
      prev.style.display = 'flex'; $c('exf-vmsg').style.display = 'none';
      return;
    }
    if (vp){ try { vp.pause(); } catch(_){} vp.style.display = 'none'; }
    $c('exf-thumb').style.display = '';
    var id = ytId(raw);
    if (id){ $c('exf-thumb').src = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'; $c('exf-prev').style.display = 'flex'; $c('exf-vmsg').style.display = 'none'; }
    else {
      $c('exf-prev').style.display = 'none'; $c('exf-vmsg').style.display = '';
      $c('exf-vmsg').textContent = $c('exf-video').value.trim() ? 'That doesn\u2019t look like a YouTube link \u2014 paste the full video URL.' : 'Leave blank to use the VYVE demo or library visual instead.';
    }
  }
  function exOpen(row, dupFrom){
    cexEditing = row || null; cexDupFrom = dupFrom || null;
    var seed = row || dupFrom || {};
    $c('ex-editor').style.display = '';
    $c('ex-editor-title').textContent = row ? 'Edit exercise' : (dupFrom ? 'Duplicate to my library' : 'New exercise');
    $c('exf-name').value = seed.name || '';
    $c('exf-cat').value = seed.category || '';
    $c('exf-eq').value = seed.equipment || '';
    $c('exf-video').value = (row && row.video_url) || '';
    $c('exf-cues').value = seed.cues || '';
    $c('ex-msg').textContent = dupFrom ? 'Saving adds a copy you fully own \u2014 rename it or attach your own video.' : '';
    exVideoPreview();
    $c('ex-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function exSave(){
    var name = $c('exf-name').value.trim(), msg = $c('ex-msg');
    if (!name){ msg.textContent = 'Give it a name.'; return; }
    var vraw = $c('exf-video').value.trim();
    if (vraw && !ytId(vraw)){ msg.textContent = 'That video link doesn\u2019t look like YouTube \u2014 fix or clear it.'; return; }
    var body = { name: name, category: $c('exf-cat').value.trim() || null, equipment: $c('exf-eq').value.trim() || null, video_url: vraw || null, cues: $c('exf-cues').value.trim() || null };
    if (cexDupFrom && cexDupFrom.media_url) body.media_url = cexDupFrom.media_url;
    var btn = $c('ex-save'); btn.disabled = true; msg.textContent = 'Saving\u2026';
    try {
      if (cexEditing){ body.updated_at = new Date().toISOString(); await rest('/coach_exercises?id=eq.' + cexEditing.id, { method: 'PATCH', body: body }); }
      else { body.partner_id = partnerId; await rest('/coach_exercises', { method: 'POST', body: body }); }
      $c('ex-editor').style.display = 'none';
      cexLoaded = false; await exLoad(); exRender();
    } catch(e){ msg.textContent = 'Save failed: ' + (String(e.message).indexOf('409') >= 0 ? 'you already have an exercise with that name.' : e.message); }
    btn.disabled = false;
  }
  document.querySelectorAll('.ex-scope').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.ex-scope').forEach(function(x){ x.classList.remove('active'); x.classList.remove('btn-primary'); });
      b.classList.add('active'); b.classList.add('btn-primary');
      exScope = b.dataset.scope; exRender();
    });
  });
  ['ex-f-q','ex-f-cat','ex-f-eq'].forEach(function(id){ $c(id).addEventListener('input', exRender); });
  if ($c('ex-f-vid')) $c('ex-f-vid').addEventListener('change', exRender);
  $c('ex-new').addEventListener('click', function(){ exOpen(null, null); });
  $c('ex-cancel').addEventListener('click', function(){ $c('ex-editor').style.display = 'none'; });
  $c('ex-save').addEventListener('click', exSave);
  $c('exf-video').addEventListener('input', exVideoPreview);

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
      '<div class="field"><label>Group</label><select class="de-grp">' + GRP_OPTS.map(function(g){ return '<option value="' + g + '"' + ((ex.group || '') === g ? ' selected' : '') + '>' + (g || '\u2014') + '</option>'; }).join('') + '</select></div>' +
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
