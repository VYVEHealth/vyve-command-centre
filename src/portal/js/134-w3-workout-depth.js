  function w3RowSetMode(d, isDur){
    var lbl = d.querySelector('.de-reps').closest('.field').querySelector('label');
    lbl.textContent = isDur ? 'Secs' : 'Reps';
    d.dataset.w3type = isDur ? 'duration' : 'reps';
  }
  function w3RowDecorate(d){
    var hit = w3RowResolve(d);
    var old = d.querySelector('.w3-exthumb'); if (old) old.remove();
    if (hit){
      var s = w3ThumbSrc(hit);
      if (s){
        var img = document.createElement('img');
        img.className = 'w3-exthumb'; img.src = s; img.loading = 'lazy';
        img.onerror = function(){ this.style.visibility = 'hidden'; };
        d.insertBefore(img, d.querySelector('.de-grid'));
      }
    }
    w3RowSetMode(d, !!(hit && hit.exercise_type === 'duration') || d.dataset.w3type === 'duration');
  }
  function addDayRow(wrap, ex){
    ex = ex || {};
    var d = document.createElement('div');
    d.className = 'de-row' + (ex.group ? ' grpd' : '');
    var isDur = ex.type === 'duration';
    var repsVal = isDur ? (ex.duration_seconds != null ? ex.duration_seconds : 30) : (ex.reps || '8-12');
    d.innerHTML = '<span class="w3-drag" title="Drag to reorder" draggable="true">\u2261</span>' +
      '<div class="de-grid">' +
      '<div class="field"><label>Exercise</label><input class="de-name" list="cex-names" type="text" value="' + esc(ex.name || '') + '"/></div>' +
      '<div class="field"><label>Sets</label><input class="de-sets" type="text" value="' + esc(ex.sets != null ? ex.sets : '3') + '"/></div>' +
      '<div class="field"><label>' + (isDur ? 'Secs' : 'Reps') + '</label><input class="de-reps" type="text" value="' + esc(repsVal) + '"/></div>' +
      '<div class="field"><label>Tempo</label><input class="de-tempo" type="text" maxlength="8" placeholder="3010" value="' + esc(ex.tempo || '') + '"/></div>' +
      '<div class="field"><label>Rest s</label><input class="de-rest" type="number" min="0" value="' + (ex.rest_seconds != null ? ex.rest_seconds : 90) + '"/></div>' +
      '<div class="field"><label>RIR</label><input class="de-rir" type="text" maxlength="4" placeholder="2" value="' + esc(ex.rir != null ? ex.rir : '') + '"/></div>' +
      '<div class="field"><label title="Give two or more exercises the same letter to run them back-to-back as a superset or circuit">Superset</label><select class="de-grp">' + GRP_OPTS.map(function(g){ return '<option value="' + g + '"' + ((ex.group || '') === g ? ' selected' : '') + '>' + (g || '\u2014') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Cue / note</label><input class="de-notes" type="text" value="' + esc(ex.notes || '') + '"/></div>' +
      '<button class="btn de-del" type="button" style="font-size:11px;padding:6px 8px;">&times;</button></div>';
    if (isDur) d.dataset.w3type = 'duration';
    d.querySelector('.de-del').addEventListener('click', function(){ d.remove(); w3TvsRefresh(wrap); });
    d.querySelector('.de-grp').addEventListener('change', function(){ d.classList.toggle('grpd', !!this.value); });
    d.querySelector('.de-name').addEventListener('change', function(){
      var hit = cexByName(this.value);
      if (hit){
        // #28: prefill library defaults over untouched values only.
        var sets = d.querySelector('.de-sets'), reps = d.querySelector('.de-reps'), rest0 = d.querySelector('.de-rest');
        if (hit.default_sets && (sets.value === '3' || !sets.value)) sets.value = hit.default_sets;
        if (hit.exercise_type === 'duration'){ reps.value = hit.default_duration_seconds || 30; }
        else if (hit.default_reps && (reps.value === '8-12' || !reps.value)) reps.value = hit.default_reps;
        if (hit.default_rest_seconds && (rest0.value === '90' || !rest0.value)) rest0.value = hit.default_rest_seconds;
        d.dataset.w3type = hit.exercise_type === 'duration' ? 'duration' : 'reps';
      }
      w3RowDecorate(d);
      w3TvsRefresh(wrap);
    });
    // #21 drag-reorder within the same list
    var h = d.querySelector('.w3-drag');
    h.addEventListener('dragstart', function(ev){ d.classList.add('w3-dragging'); wrap._w3drag = d; if (ev.dataTransfer) ev.dataTransfer.setData('text/plain', ''); });
    h.addEventListener('dragend', function(){ d.classList.remove('w3-dragging'); wrap._w3drag = null; w3TvsRefresh(wrap); });
    d.addEventListener('dragover', function(ev){
      if (!wrap._w3drag || wrap._w3drag === d || wrap._w3drag.parentElement !== d.parentElement) return;
      ev.preventDefault();
      var rct = d.getBoundingClientRect();
      var before = ev.clientY < rct.top + rct.height / 2;
      d.parentElement.insertBefore(wrap._w3drag, before ? d : d.nextSibling);
    });
    wrap.appendChild(d);
    if (ex.name) w3RowDecorate(d);
  }
  function w3TvsRefresh(anyEl){
    var container = anyEl && anyEl.closest ? anyEl.closest('[data-w3-tvs-host]') : null;
    if (!container){ container = document.querySelector('[data-w3-tvs-host]'); if (!container) return; }
    var strip = container.querySelector('.w3-tvs-strip');
    if (!strip) return;
    var exs = [];
    container.querySelectorAll('.de-main > .de-row').forEach(function(e){
      var nm = e.querySelector('.de-name').value.trim();
      if (nm) exs.push({ name: nm, sets: e.querySelector('.de-sets').value.trim() || '3' });
    });
    strip.innerHTML = w3TvsHtml(exs) || '<div style="font-size:11px;color:var(--text-muted);">Volume totals appear as you add library exercises.</div>';
  }
  function renderDayEditor(container, day){
    day = day || {};
    container.setAttribute('data-w3-tvs-host', '1');
    container.innerHTML = '<div class="w3-tvs-strip" style="margin-bottom:6px;"></div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Warm up (optional)</div><div class="de-warm"></div><div style="margin-bottom:8px;">' + rowBtn('+ Warm up exercise', 'de-add-warm') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Workout</div><div class="de-main"></div><div style="margin-bottom:8px;">' + rowBtn('+ Exercise', 'de-add-main') + '</div>' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:6px 0 4px;">Cool down (optional)</div><div class="de-cool"></div>' + rowBtn('+ Cool down exercise', 'de-add-cool');
    var wm = container.querySelector('.de-warm'), mm = container.querySelector('.de-main'), cm = container.querySelector('.de-cool');
    (day.warmup || []).forEach(function(x){ addDayRow(wm, x); });
    ((day.exercises && day.exercises.length) ? day.exercises : [{}]).forEach(function(x){ addDayRow(mm, x); });
    (day.cooldown || []).forEach(function(x){ addDayRow(cm, x); });
    container.querySelector('.de-add-warm').addEventListener('click', function(){ addDayRow(wm, { sets: '1', reps: '', rest_seconds: 0 }); });
    container.querySelector('.de-add-main').addEventListener('click', function(){ addDayRow(mm, {}); });
    container.querySelector('.de-add-cool').addEventListener('click', function(){ addDayRow(cm, { sets: '1', reps: '', rest_seconds: 0 }); });
    container.addEventListener('input', function(ev){
      if (ev.target && (ev.target.classList.contains('de-sets') || ev.target.classList.contains('de-name'))) w3TvsRefresh(container);
    });
    w3TvsRefresh(container);
  }
  function collectDay(container){
    function grab(sel){
      var out = [];
      container.querySelectorAll(sel + ' > .de-row').forEach(function(e){
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
    return { warmup: grab('.de-warm'), exercises: grab('.de-main'), cooldown: grab('.de-cool') };
  }

  /* ── #20 quick-view side panel + #21 full preview modal ── */
  var w3QvEl = null, w3PvEl = null;
  function w3Days(item){
    var p = item.payload || {};
    if (item.kind === 'workout_day') return [{ label: item.name, day: p }];
    if (item.kind === 'workout') return (p.sessions || []).map(function(s, i){ return { label: s.name || ('Session ' + (i + 1)), day: s }; });
    var out = [];
    (p.weeks || []).forEach(function(w, wi){
      (w.days || []).forEach(function(d, di){
        if (d && (d.exercises || []).length) out.push({ label: 'W' + (wi + 1) + ' \u00b7 ' + (d.name || ('Day ' + (di + 1))), day: d });
      });
    });
    return out;
  }
  function w3DayRowsHtml(day){
    return (day.exercises || []).map(function(e, i){
      var hit = w3Resolve(e);
      var meta = (e.sets || '3') + ' \u00d7 ' + (e.type === 'duration' ? ((e.duration_seconds || 30) + 's') : (e.reps || '8-12')) + (e.rest_seconds ? ' \u00b7 rest ' + e.rest_seconds + 's' : '') + (e.group ? ' \u00b7 superset ' + e.group : '');
      return '<div class="w3-qrow"><div style="font-size:11px;font-weight:800;color:var(--text-muted);width:16px;flex:none;">' + String.fromCharCode(65 + Math.min(i, 25)) + '</div>' +
        w3ThumbImg(hit, 'th') +
        '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:12.5px;">' + esc(e.name) + '</div><div style="font-size:11px;color:var(--text-muted);">' + esc(meta) + (e.notes ? ' \u00b7 ' + esc(e.notes) : '') + '</div></div></div>';
    }).join('') || '<p style="font-size:12px;color:var(--text-muted);">No exercises.</p>';
  }
  function w3QvOpen(item){
    if (!w3QvEl){
      w3QvEl = document.createElement('div');
      w3QvEl.className = 'w3-qv';
      w3QvEl.innerHTML = '<div class="hd"><strong id="w3qv-title" style="flex:1;font-size:14px;"></strong><button class="btn" id="w3qv-full" type="button" style="font-size:11.5px;">Full preview</button><button class="btn" id="w3qv-x" type="button" style="font-size:12px;">&times;</button></div>' +
        '<div style="padding:10px 16px 0;"><select id="w3qv-day" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;"></select></div>' +
        '<div class="sc"><div id="w3qv-tvs"></div><div id="w3qv-rows"></div></div>';
      document.body.appendChild(w3QvEl);
      $c('w3qv-x').addEventListener('click', function(){ w3QvEl.classList.remove('on'); });
      $c('w3qv-day').addEventListener('change', w3QvPaint);
      $c('w3qv-full').addEventListener('click', function(){ if (w3QvEl._item){ w3QvEl.classList.remove('on'); w3PreviewOpen(w3QvEl._item); } });
    }
    w3QvEl._item = item;
    w3QvEl._days = w3Days(item);
    $c('w3qv-title').textContent = item.name;
    $c('w3qv-day').innerHTML = w3QvEl._days.map(function(d, i){ return '<option value="' + i + '">' + esc(d.label) + '</option>'; }).join('');
    w3QvPaint();
    exLoad().then(w3QvPaint);
    w3QvEl.classList.add('on');
  }
  function w3QvPaint(){
    if (!w3QvEl || !w3QvEl._days) return;
    var d = w3QvEl._days[parseInt($c('w3qv-day').value) || 0];
    if (!d){ $c('w3qv-rows').innerHTML = '<p style="font-size:12px;color:var(--text-muted);">Nothing here.</p>'; $c('w3qv-tvs').innerHTML = ''; return; }
    $c('w3qv-tvs').innerHTML = w3TvsHtml(d.day.exercises);
    $c('w3qv-rows').innerHTML = w3DayRowsHtml(d.day);
  }
  function w3PreviewOpen(item){
    if (!w3PvEl){
      w3PvEl = document.createElement('div');
      w3PvEl.className = 'w3-modal';
      w3PvEl.style.display = 'none';
      w3PvEl.innerHTML = '<div class="in"><div class="hd"><strong id="w3pv-title" style="flex:1;font-size:15px;"></strong><button class="btn" id="w3pv-x" type="button" style="font-size:12px;">Close</button></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 18px 0;" id="w3pv-tabs"></div><div class="sc" id="w3pv-body"></div></div>';
      document.body.appendChild(w3PvEl);
      $c('w3pv-x').addEventListener('click', function(){ w3PvEl.style.display = 'none'; });
      w3PvEl.addEventListener('click', function(ev){ if (ev.target === w3PvEl) w3PvEl.style.display = 'none'; });
    }
    var days = w3Days(item);
    $c('w3pv-title').textContent = item.name;
    function paint(idx){
      $c('w3pv-tabs').innerHTML = days.map(function(d, i){ return '<button class="btn' + (i === idx ? ' btn-primary' : '') + '" data-pv-tab="' + i + '" type="button" style="font-size:11.5px;">' + esc(d.label) + '</button>'; }).join('');
      $c('w3pv-tabs').querySelectorAll('[data-pv-tab]').forEach(function(b){ b.addEventListener('click', function(){ paint(parseInt(b.dataset.pvTab)); }); });
      var d = days[idx];
      $c('w3pv-body').innerHTML = d ? (w3TvsHtml(d.day.exercises) + w3DayRowsHtml(d.day)) : '';
    }
    exLoad().then(function(){ paint(0); });
    paint(0);
    w3PvEl.style.display = 'flex';
  }

  /* ── #19 assign-to from the list: client picker → EF update_assignments
        (auto-apply on consented actives, PM-956 model). ── */
  var w3AsgEl = null, w3ClientsCache = null;
  async function w3Clients(){
    if (w3ClientsCache) return w3ClientsCache;
    try {
      /* PM-1217: coach_clients carries invited_first_name/invited_last_name — the old
         select asked for first_name/last_name, PostgREST 400'd, the catch swallowed it
         and every coach saw "No clients yet" on Assign to… (Calum, 12 Sep). */
      w3ClientsCache = (await rest('/coach_clients?' + pscope() + '&select=member_email,invited_first_name,invited_last_name,status,assignments&order=invited_first_name.asc&limit=500') || [])
        .map(function(c){ c.first_name = c.invited_first_name || ''; c.last_name = c.invited_last_name || ''; return c; });
    }
    catch(e){ w3ClientsCache = []; }
    return w3ClientsCache;
  }
  function w3AssignOpen(item){
    if (!w3AsgEl){
      w3AsgEl = document.createElement('div');
      w3AsgEl.className = 'w3-modal';
      w3AsgEl.style.display = 'none';
      w3AsgEl.innerHTML = '<div class="in" style="max-width:480px;"><div class="hd"><strong id="w3as-title" style="flex:1;font-size:14px;"></strong><button class="btn" id="w3as-x" type="button" style="font-size:12px;">Close</button></div><div class="sc" id="w3as-body"></div></div>';
      document.body.appendChild(w3AsgEl);
      $c('w3as-x').addEventListener('click', function(){ w3AsgEl.style.display = 'none'; });
      w3AsgEl.addEventListener('click', function(ev){ if (ev.target === w3AsgEl) w3AsgEl.style.display = 'none'; });
    }
    $c('w3as-title').textContent = 'Assign \u201c' + item.name + '\u201d';
    $c('w3as-body').innerHTML = '<p style="font-size:12px;color:var(--text-muted);">Loading clients\u2026</p>';
    w3AsgEl.style.display = 'flex';
    w3Clients().then(function(cs){
      if (!cs.length){ $c('w3as-body').innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No clients yet \u2014 add one from the Clients page first.</p>'; return; }
      $c('w3as-body').innerHTML = cs.map(function(c){
        var has = JSON.stringify(c.assignments || {}).indexOf(item.id) >= 0;
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">' +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13px;">' + esc(((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.member_email) + '</div><div style="font-size:11px;color:var(--text-muted);">' + esc(c.member_email) + ' \u00b7 ' + esc(c.status || '') + '</div></div>' +
          (has ? '<span style="font-size:11px;color:#3DB89F;font-weight:700;">Assigned \u2713</span>' : '<button class="btn btn-primary" data-w3as="' + esc(c.member_email) + '" style="font-size:11.5px;">Assign</button>') +
          '</div>';
      }).join('') + '<p style="font-size:11px;color:var(--text-muted);margin-top:10px;">Assigning replaces the client\u2019s workout slot and, for active consented clients, pushes straight to their app.</p>';
      $c('w3as-body').querySelectorAll('[data-w3as]').forEach(function(b){
        b.addEventListener('click', async function(){
          b.disabled = true; b.textContent = 'Assigning\u2026';
          try {
            await ef({ action: 'update_assignments', email: b.dataset.w3as, merge_slots: true, assignments: { workout_template_id: item.id } });
            b.outerHTML = '<span style="font-size:11px;color:#3DB89F;font-weight:700;">Assigned \u2713</span>';
            w3ClientsCache = null;
          } catch(e){ b.disabled = false; b.textContent = 'Assign'; alert('Assign failed: ' + e.message); }
        });
      });
    });
  }

  /* ── plLoad v5 (#19/#23/#25): workout kinds get the upgraded table —
        assigned-count, quick-view eye, Preview, Duplicate, Assign to,
        relative last-edit, meta columns. Other kinds keep v3 behaviour
        (Wave 2 default pill + habits note tag), reproduced below. ── */
  function w3Rel(ts){
    if (!ts) return '';
    var s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    if (s < 86400 * 28) return Math.round(s / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  var W3_WK_KINDS = { workout: 1, workout_day: 1, program: 1 };
  async function plLoad(){
    var el = $c('pl-list');
    el.innerHTML = '<p style="color:var(--text-muted);font-size:12.5px;">Loading\u2026</p>';
    try {
      if (IS_FORM(plKind)) plItems = await rest('/coach_forms?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
      else plItems = await rest('/coach_templates?' + pscope() + '&kind=eq.' + plKind + '&active=eq.true&order=created_at.desc&select=*') || [];
    } catch(e){ plItems = []; }
    if (!plItems.length){ el.innerHTML = '<div class="empty-state"><h3>Nothing here yet</h3><p>Create your first ' + KIND_LABEL[plKind] + ' and it becomes assignable to clients.</p></div>'; return; }

    if (W3_WK_KINDS[plKind]){
      var kindNow = plKind;
      var counts = {};
      Promise.all([w3Clients(), exLoad()]).then(function(res){
        if (plKind !== kindNow) return;
        (res[0] || []).forEach(function(c){
          var s = JSON.stringify(c.assignments || {});
          plItems.forEach(function(it){ if (s.indexOf(it.id) >= 0) counts[it.id] = (counts[it.id] || 0) + 1; });
        });
        paintWk();
      });
      function wkMeta(it){
        var p = it.payload || {};
        if (it.kind === 'program') return ((p.weeks || []).length) + ' wk \u00b7 ' + progDayCount(p) + ' days';
        if (it.kind === 'workout') return ((p.sessions || []).length) + ' sessions/wk';
        return ((p.exercises || []).length) + ' exercises' + (dayHasGroups(p) ? ' \u00b7 supersets' : '');
      }
      function wkThumb(it){
        var days = w3Days(it);
        var first = days.length && (days[0].day.exercises || [])[0];
        return w3ThumbImg(first ? w3Resolve(first) : null, 'w3-exthumb');
      }
      function paintWk(){
        el.innerHTML = plItems.map(function(it){
          var n = counts[it.id];
          var cBadge = n ? '<span class="w3-chip pri" title="Clients currently assigned">' + n + ' client' + (n === 1 ? '' : 's') + '</span>' : '<span class="w3-chip">unassigned</span>';
          return '<div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--border);flex-wrap:wrap;">' +
            wkThumb(it) +
            '<div style="flex:1;min-width:170px;"><div style="font-weight:600;">' + esc(it.name) + '</div>' +
            '<div style="font-size:11.5px;color:var(--text-muted);">' + esc(wkMeta(it)) + ' \u00b7 edited ' + w3Rel(it.updated_at || it.created_at) + '</div></div>' +
            cBadge +
            '<button class="btn" data-w3-pv="' + it.id + '" style="font-size:11.5px;">Preview</button>' +
            '<button class="btn" data-w3-asg="' + it.id + '" style="font-size:11.5px;">Assign to\u2026</button>' +
            '<button class="btn" data-w3-dup="' + it.id + '" style="font-size:11.5px;">Duplicate</button>' +
            '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
            '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11.5px;">Delete</button></div>';
        }).join('');
        function byId(id){ return plItems.find(function(x){ return x.id === id; }); }
        el.querySelectorAll('[data-pl-edit]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(byId(b.dataset.plEdit)); }); });
        el.querySelectorAll('[data-pl-del]').forEach(function(b){ b.addEventListener('click', function(){ plDelete(b.dataset.plDel); }); });
        el.querySelectorAll('[data-w3-qv]').forEach(function(b){ b.addEventListener('click', function(){ w3QvOpen(byId(b.dataset.w3Qv)); }); });
        el.querySelectorAll('[data-w3-pv]').forEach(function(b){ b.addEventListener('click', function(){ w3PreviewOpen(byId(b.dataset.w3Pv)); }); });
        el.querySelectorAll('[data-w3-asg]').forEach(function(b){ b.addEventListener('click', function(){ w3AssignOpen(byId(b.dataset.w3Asg)); }); });
        el.querySelectorAll('[data-w3-dup]').forEach(function(b){ b.addEventListener('click', async function(){
          var it = byId(b.dataset.w3Dup);
          b.disabled = true;
          try {
            await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: it.kind, name: (it.name + ' (copy)').slice(0, 120), payload: it.payload } });
            await plLoad(); loadLibraries();
          } catch(e){ b.disabled = false; alert('Duplicate failed: ' + e.message); }
        }); });
      }
      paintWk();
      return;
    }

    var defable = plKind === 'onboarding' || plKind === 'checkin';
    el.innerHTML = plItems.map(function(it){
      var name = it.title || it.name;
      var sub = IS_FORM(plKind) ? ((it.questions || []).length + ' questions') : summarise(it.payload || {});
      if (plKind === 'habits' && it.payload && it.payload.allow_note) sub += ' \u00b7 daily notes on';
      var defBit = '';
      if (defable){
        defBit = it.is_default
          ? '<span style="font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--vyve-gold,#C9A84C);border:1px solid var(--vyve-gold,#C9A84C);border-radius:6px;padding:3px 8px;flex:none;">DEFAULT</span>'
          : '<button class="btn" data-pl-def="' + it.id + '" style="font-size:11px;padding:5px 9px;">Set default</button>';
      }
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);">' +
        '<div style="flex:1;min-width:0;"><div style="font-weight:600;">' + esc(name) + '</div><div style="font-size:12px;color:var(--text-muted);">' + esc(sub) + '</div></div>' + defBit +
        '<button class="btn" data-pl-edit="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
        '<button class="btn" data-pl-del="' + it.id + '" style="font-size:11.5px;">Delete</button></div>';
    }).join('');
    el.querySelectorAll('[data-pl-edit]').forEach(function(b){ b.addEventListener('click', function(){ plOpen(plItems.find(function(x){ return x.id === b.dataset.plEdit; })); }); });
    el.querySelectorAll('[data-pl-del]').forEach(function(b){ b.addEventListener('click', function(){ plDelete(b.dataset.plDel); }); });
    el.querySelectorAll('[data-pl-def]').forEach(function(b){ b.addEventListener('click', async function(){
      b.disabled = true;
      try { await w2SetDefault(b.dataset.plDef); } catch(e){ alert('Couldn\u2019t set default: ' + e.message); }
      plLoad(); loadLibraries();
    }); });
  }
  /* ============================ end PM-985 Wave 3 ============================ */

