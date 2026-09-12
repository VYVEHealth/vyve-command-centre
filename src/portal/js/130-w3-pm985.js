  /* ═══════════════════════════════════════════════════════════════════════
     PM-985 WAVE 3 — workout depth (gap-map #19-23, #25-31; #24 circuits
     PARKED by Dean product call — do not build here).
     Shadow rules as Waves 1-2: everything below redeclares over earlier
     versions by same-scope function declaration. exLoad/exRender/exOpen/
     exSave are now v3; addDayRow/renderDayEditor/collectDay v2; plLoad v5.
     All new DOM (cards CSS, quick-view, preview, assign picker, editor
     extras) is created at runtime — zero edits above this line.
     Data spine: coach_exercises.muscle_volumes jsonb (primary=1,
     secondary=0.5, enriched PM-985), exercise_type reps|duration,
     default_sets/reps/rest/duration, alternatives uuid[], image_url.
     ═══════════════════════════════════════════════════════════════════════ */

  var W3_SEL = 'id,partner_id,name,category,equipment,video_url,media_url,cues,muscle_volumes,image_url,exercise_type,default_sets,default_reps,default_rest_seconds,default_duration_seconds,alternatives,video_url_alt,alt_label';
  (function(){
    var st = document.createElement('style');
    st.textContent =
      '#ex-list.w3-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;}' +
      '.w3-card{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface-2);display:flex;flex-direction:column;}' +
      '.w3-card .im{height:120px;background:var(--surface);display:flex;align-items:center;justify-content:center;overflow:hidden;}' +
      '.w3-card .im img{width:100%;height:100%;object-fit:cover;}' +
      /* PM-1157: VYVE-filmed exercises play in the card — thumbnail is the play surface. */
      '.w3-card .im{position:relative;}' +
      '.w3-card .im[data-ex-play]{cursor:pointer;}' +
      '.w3-card .im .w3-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;background:rgba(13,43,43,.72);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;padding-left:3px;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;}' +
      '.w3-card .im[data-ex-play]:hover .w3-play{background:var(--teal);}' +
      '.w3-card .im.playing{height:auto;aspect-ratio:16/9;cursor:default;background:#000;}' +
      '.w3-card .im video{width:100%;height:100%;object-fit:contain;background:#000;display:block;}' +
      '.w3-card .bd{padding:9px 11px 11px;display:flex;flex-direction:column;gap:6px;flex:1;}' +
      '.w3-card .nm{font-weight:600;font-size:13px;line-height:1.25;}' +
      '.w3-chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.03em;border:1px solid var(--border);border-radius:6px;padding:2px 6px;color:var(--text-muted);margin:0 4px 4px 0;}' +
      '.w3-chip.pri{color:var(--teal-lt);border-color:var(--teal-lt);}' +
      '.w3-tvs{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 2px;}' +
      '.w3-tvs .t{font-size:10.5px;font-weight:700;border:1px solid var(--border);border-radius:7px;padding:3px 8px;color:var(--text);background:var(--surface);}' +
      '.w3-tvs .t small{font-weight:600;color:var(--text-muted);margin-left:3px;}' +
      '.w3-qv{position:fixed;top:0;right:-420px;width:min(400px,92vw);height:100%;background:var(--surface);border-left:1px solid var(--border);z-index:960;transition:right .22s ease;display:flex;flex-direction:column;box-shadow:-14px 0 34px rgba(0,0,0,.28);}' +
      '.w3-qv.on{right:0;}' +
      '.w3-qv .hd{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border);}' +
      '.w3-qv .sc{flex:1;overflow-y:auto;padding:14px 16px;}' +
      '.w3-qrow{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);}' +
      '.w3-qrow .th{width:52px;height:38px;border-radius:6px;object-fit:cover;flex:none;background:var(--surface-2);}' +
      '.w3-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:970;display:flex;align-items:center;justify-content:center;padding:18px;}' +
      '.w3-modal .in{background:var(--surface);border:1px solid var(--border);border-radius:14px;max-width:820px;width:100%;max-height:92vh;display:flex;flex-direction:column;}' +
      '.w3-modal .in .hd{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border);}' +
      '.w3-modal .in .sc{overflow-y:auto;padding:14px 18px;}' +
      '.de-row{display:flex;gap:8px;align-items:center;}' +
      '.de-row .de-grid{flex:1;min-width:0;}' +
      '.de-row .w3-drag{cursor:grab;color:var(--text-muted);font-size:14px;padding:6px 4px;user-select:none;flex:none;}' +
      '.de-row.w3-dragging{opacity:.45;}' +
      '.de-row .w3-exthumb{width:40px;height:30px;border-radius:5px;object-fit:cover;flex:none;align-self:center;}';
    document.head.appendChild(st);
  })();

  function w3Cap(m){ return m ? m.charAt(0).toUpperCase() + m.slice(1) : ''; }
  function w3ById(id){ for (var i = 0; i < cexRows.length; i++){ if (cexRows[i].id === id) return cexRows[i]; } return null; }
  function w3Resolve(e){
    if (e && e.exercise_id){ var h = w3ById(e.exercise_id); if (h) return h; }
    return cexByName(e && e.name);
  }
  function w3ThumbSrc(r){
    if (!r) return '';
    if (r.image_url) return r.image_url;
    var y = ytId(r.video_url);
    if (y) return 'https://img.youtube.com/vi/' + y + '/mqdefault.jpg';
    return '';
  }
  /* PM-1157: a direct video file (VYVE Storage mp4, or a coach's own hosted file) can play inline; YouTube can't. */
  function w3DirectVideo(r){
    var u = r && (r.video_url || r.media_url) || '';
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u) ? u : '';
  }
  function w3ThumbImg(r, cls){
    var s = w3ThumbSrc(r);
    return s ? '<img class="' + cls + '" src="' + esc(s) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"/>' : '<span class="' + cls + '" style="display:inline-flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:15px;">&#127947;</span>';
  }
  function w3MvChips(mv, max){
    if (!mv) return '';
    var ks = Object.keys(mv).sort(function(a, b){ return (mv[b] - mv[a]) || a.localeCompare(b); });
    var out = ks.slice(0, max || 3).map(function(k){ return '<span class="w3-chip' + (mv[k] >= 1 ? ' pri' : '') + '">' + esc(w3Cap(k)) + '</span>'; }).join('');
    if (ks.length > (max || 3)) out += '<span class="w3-chip">+' + (ks.length - (max || 3)) + '</span>';
    return out;
  }

  /* ── #22 Total Volume Sets: per-day muscle-group set volume.
        primary counts 1×sets, secondary 0.5×sets (fractions kept). ── */
  function w3Tvs(exs){
    var acc = {};
    (exs || []).forEach(function(e){
      var r = w3Resolve(e);
      if (!r || !r.muscle_volumes) return;
      var sets = parseInt(e.sets) || 0;
      if (!sets) return;
      Object.keys(r.muscle_volumes).forEach(function(m){
        acc[m] = (acc[m] || 0) + sets * r.muscle_volumes[m];
      });
    });
    return Object.keys(acc).sort(function(a, b){ return acc[b] - acc[a]; }).map(function(m){ return [m, Math.round(acc[m] * 10) / 10]; });
  }
  function w3TvsHtml(exs, label){
    var t = w3Tvs(exs);
    if (!t.length) return '';
    return '<div class="w3-tvs" title="Working sets per muscle group \u2014 primary movers count a full set, secondary half a set.">' +
      (label === false ? '' : '<span style="font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);align-self:center;">Volume</span>') +
      t.map(function(p){ return '<span class="t">' + esc(w3Cap(p[0])) + '<small>' + p[1] + '</small></span>'; }).join('') + '</div>';
  }

  /* ── exLoad v3: widened select (Wave 3 columns). Same cache vars. ── */
  async function exLoad(){
    if (cexLoaded) return;
    try {
      /* PM-1207: page the library — PostgREST caps a single call at 1,000 rows, so 977 stock + any real
         private library silently lost everything after ~C. Pull 1,000 at a time until a short page. */
      cexRows = [];
      for (var exOff = 0; ; exOff += 1000){
        var exPg = await rest('/coach_exercises?active=eq.true&select=' + W3_SEL + '&order=name.asc,id.asc&limit=1000&offset=' + exOff) || [];
        cexRows = cexRows.concat(exPg);
        if (exPg.length < 1000) break;
      }
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

  /* ── #26/#25 exRender v3: browsable card grid with thumbnails + tag chips. ── */
  function exRender(){
    var q = ($c('ex-f-q').value || '').trim().toLowerCase();
    var fc = $c('ex-f-cat').value, fe = $c('ex-f-eq').value;
    var rows = cexRows.filter(function(r){
      if (exScope === 'mine' && !r.partner_id) return false;
      if (exScope === 'vyve' && r.partner_id) return false;
      if (fc && r.category !== fc) return false;
      if (fe && r.equipment !== fe) return false;
      if (q && (r.name || '').toLowerCase().indexOf(q) < 0 && JSON.stringify(r.muscle_volumes || {}).toLowerCase().indexOf(q) < 0) return false;
      var vsel = $c('ex-f-vidsel') ? $c('ex-f-vidsel').value : '';
      var hasVid = !!(r.video_url || r.media_url), hasAlt = !!r.video_url_alt;
      if (vsel === 'has'   && !hasVid) return false;
      if (vsel === 'none'  &&  hasVid) return false;
      if (vsel === 'alt'   && !hasAlt) return false;
      if (vsel === 'noalt' &&  hasAlt) return false;
      return true;
    });
    if ($c('ex-bulk-btn')) $c('ex-bulk-btn').style.display = vyveScope ? '' : 'none';
    var CAP = 60, shown = rows.slice(0, CAP);
    $c('ex-count').textContent = (rows.length > CAP ? ('Showing ' + CAP + ' of ' + rows.length + ' \u2014 narrow with search or filters.') : (rows.length + ' exercise' + (rows.length === 1 ? '' : 's'))) + (vyveScope ? ('  \u00b7  ' + w6bTotals()) : '');
    var list = $c('ex-list');
    list.classList.add('w3-grid');
    if (!rows.length){ list.classList.remove('w3-grid'); list.innerHTML = '<div class="empty-state"><h3>Nothing matches</h3><p>Try a different search, or add your own exercise.</p></div>'; return; }
    list.innerHTML = shown.map(function(r){
      var mine = vyveScope ? !r.partner_id : !!r.partner_id;
      var vid = r.video_url ? '<span style="color:var(--gold);font-weight:700;font-size:10.5px;">\u25b6 your video</span>' : (r.media_url ? '<span style="color:var(--gold);font-weight:700;font-size:10.5px;">\u25b6 VYVE video</span>' : '<span style="color:var(--warning);font-weight:700;font-size:10.5px;">no video</span>');
      if (vyveScope) vid += r.video_url_alt
        ? ' <span style="color:var(--success);font-weight:700;font-size:10.5px;">\u29c9 ' + esc(r.alt_label || 'alt') + '</span>'
        : ' <span style="color:var(--text-dim);font-weight:700;font-size:10.5px;">\u29c9 no alt</span>';
      var dur = r.exercise_type === 'duration' ? '<span class="w3-chip" style="color:var(--gold);border-color:var(--gold);">\u23f1 timed</span>' : '';
      var presets = r.default_sets ? '<span style="font-size:10.5px;color:var(--text-muted);">' + esc(r.default_sets) + '\u00d7' + esc(r.exercise_type === 'duration' ? ((r.default_duration_seconds || 30) + 's') : (r.default_reps || '8-12')) + (r.default_rest_seconds ? ' \u00b7 rest ' + r.default_rest_seconds + 's' : '') + '</span>' : '';
      var acts = mine
        ? '<button class="btn" data-ex-edit="' + r.id + '" style="font-size:11px;">Edit</button> <button class="btn" data-ex-del="' + r.id + '" style="font-size:11px;">Remove</button>'
        : '<button class="btn" data-ex-edit="' + r.id + '" style="font-size:11px;">View</button> <button class="btn" data-ex-dup="' + r.id + '" style="font-size:11px;">Duplicate</button>';
      var dv = w3DirectVideo(r);
      return '<div class="w3-card"><div class="im"' + (dv ? ' data-ex-play="' + r.id + '" title="Play video"' : '') + '>' + w3ThumbImg(r, '') + (dv ? '<span class="w3-play">\u25b6</span>' : '') + '</div><div class="bd">' +
        '<div class="nm">' + esc(r.name) + ' <span class="src-tag ' + (mine ? 'src-mine' : 'src-vyve') + '">' + (mine ? 'Yours' : 'VYVE') + '</span></div>' +
        '<div>' + w3MvChips(r.muscle_volumes, 3) + dur + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + esc(r.category || '') + (r.equipment ? ' \u00b7 ' + esc(r.equipment) : '') + '</div>' +
        (vid || presets ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' + vid + presets + '</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:auto;padding-top:4px;">' + acts + '</div>' +
        '</div></div>';
    }).join('');
    list.querySelectorAll('[data-ex-edit]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(w3ById(b.dataset.exEdit), null); }); });
    /* PM-1157: tap the thumbnail → the video is in the card and playing. One card plays at a time. */
    list.querySelectorAll('.im[data-ex-play]').forEach(function(im){
      im.addEventListener('click', function(){
        if (im.classList.contains('playing')) return;
        var r = w3ById(im.dataset.exPlay), url = w3DirectVideo(r); if (!url) return;
        list.querySelectorAll('.im.playing video').forEach(function(v){ try { v.pause(); } catch(_){} });
        var poster = w3ThumbSrc(r);
        im.classList.add('playing');
        im.innerHTML = '<video controls autoplay playsinline preload="metadata"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' src="' + esc(url) + '"></video>';
        var v = im.querySelector('video'); if (v) v.play().catch(function(){});
      });
    });
    list.querySelectorAll('[data-ex-dup]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(null, w3ById(b.dataset.exDup)); }); });
    list.querySelectorAll('[data-ex-del]').forEach(function(b){ b.addEventListener('click', async function(){
      if (!confirm('Remove this exercise from your library? Programmes it\u2019s already in are unaffected.')) return;
      try { await rest('/coach_exercises?id=eq.' + b.dataset.exDel, { method: 'PATCH', body: { active: false } }); cexLoaded = false; await exLoad(); exRender(); }
      catch(e){ alert('Remove failed: ' + e.message); }
    }); });
  }

  /* ── #27/#28/#29/#30 editor extras: type toggle, default prescription,
        muscle-volume repeater ("Another body part"), alternatives picker.
        Injected once into #ex-editor before the save row — no markup edits. ── */
  var w3AltIds = [];
  function w3ExtrasEnsure(){
    if ($c('w3-ex-extras')) return;
    var host = document.createElement('div');
    host.id = 'w3-ex-extras';
    host.innerHTML =
      '<div class="field-row" style="margin-top:2px;">' +
        '<div class="field"><label>Exercise type</label><select id="w3f-type"><option value="reps">Sets &amp; reps</option><option value="duration">Time-based (hold / work interval)</option></select></div>' +
        '<div class="field" id="w3f-durwrap" style="display:none;"><label>Default seconds per set</label><input id="w3f-dur" type="number" min="5" step="5" placeholder="30"/></div>' +
      '</div>' +
      '<div class="field-row">' +
        '<div class="field"><label>Default sets</label><input id="w3f-dsets" type="text" maxlength="4" placeholder="3"/></div>' +
        '<div class="field" id="w3f-drepswrap"><label>Default reps</label><input id="w3f-dreps" type="text" maxlength="10" placeholder="8-12"/></div>' +
        '<div class="field"><label>Default rest (s)</label><input id="w3f-drest" type="number" min="0" step="5" placeholder="90"/></div>' +
      '</div>' +
      '<div class="field" style="margin-bottom:10px;"><label>Muscle groups worked (powers per-day volume totals)</label>' +
        '<div id="w3f-mv"></div><button class="btn" id="w3f-mv-add" type="button" style="font-size:11.5px;margin-top:4px;">+ Another body part</button>' +
      '</div>' +
      '<div class="field" style="margin-bottom:10px;"><label>Alternative exercises \u2014 swaps you\u2019re happy for the client to make</label>' +
        '<div id="w3f-alts" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;"></div>' +
        '<input id="w3f-alt-q" type="text" list="cex-alt-names" placeholder="Type to search the library, then pick\u2026" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;"/>' +
        '<datalist id="cex-alt-names"></datalist>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">These show as coach-approved swaps in your client\u2019s workout screen. First 4 are used.</div>' +
      '</div>';
    var saveRow = $c('ex-save').parentElement;
    saveRow.parentElement.insertBefore(host, saveRow);
    $c('w3f-type').addEventListener('change', function(){
      var d = this.value === 'duration';
      $c('w3f-durwrap').style.display = d ? '' : 'none';
      $c('w3f-drepswrap').style.display = d ? 'none' : '';
    });
    $c('w3f-mv-add').addEventListener('click', function(){ w3MvRow('', 0.5); });
    $c('w3f-alt-q').addEventListener('change', function(){
      var hit = cexByName(this.value);
      this.value = '';
      if (!hit || w3AltIds.indexOf(hit.id) >= 0 || (cexEditing && hit.id === cexEditing.id)) return;
      w3AltIds.push(hit.id); w3AltsPaint();
    });
  }
  var W3_MUSCLES = ['abdominals','abductors','adductors','biceps','calves','chest','forearms','glutes','hamstrings','lats','lower back','middle back','neck','quadriceps','shoulders','traps','triceps'];
  function w3MvRow(muscle, weight){
    var d = document.createElement('div');
    d.className = 'w3-mv-row';
    d.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;';
    d.innerHTML = '<select class="mv-m" style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;"><option value="">Body part\u2026</option>' +
      W3_MUSCLES.map(function(m){ return '<option value="' + m + '"' + (m === muscle ? ' selected' : '') + '>' + w3Cap(m) + '</option>'; }).join('') + '</select>' +
      '<select class="mv-w" style="width:130px;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;"><option value="1"' + (weight >= 1 ? ' selected' : '') + '>Primary (1)</option><option value="0.5"' + (weight < 1 ? ' selected' : '') + '>Secondary (\u00bd)</option></select>' +
      '<button class="btn mv-x" type="button" style="font-size:11px;padding:6px 8px;">&times;</button>';
    d.querySelector('.mv-x').addEventListener('click', function(){ d.remove(); });
    $c('w3f-mv').appendChild(d);
  }
  function w3AltsPaint(){
    var box = $c('w3f-alts');
    box.innerHTML = w3AltIds.map(function(id){
      var r = w3ById(id);
      return '<span class="w3-chip" style="font-size:11px;padding:4px 8px;">' + esc(r ? r.name : id) + ' <a data-alt-x="' + id + '" style="cursor:pointer;color:var(--text-muted);margin-left:3px;">&times;</a></span>';
    }).join('') || '<span style="font-size:11.5px;color:var(--text-muted);">None yet.</span>';
    box.querySelectorAll('[data-alt-x]').forEach(function(a){ a.addEventListener('click', function(){ w3AltIds = w3AltIds.filter(function(x){ return x !== a.dataset.altX; }); w3AltsPaint(); }); });
  }
  function exOpen(row, dupFrom){
    cexEditing = row || null; cexDupFrom = dupFrom || null;
    var seed = row || dupFrom || {};
    var mine = !row || !!row.partner_id;
    w3ExtrasEnsure();
    $c('ex-editor').style.display = '';
    $c('ex-editor-title').textContent = row ? (mine ? 'Edit exercise' : row.name) : (dupFrom ? 'Duplicate to my library' : 'New exercise');
    $c('exf-name').value = seed.name || '';
    $c('exf-cat').value = seed.category || '';
    $c('exf-eq').value = seed.equipment || '';
    $c('exf-video').value = (row && (row.video_url || (!row.partner_id ? row.media_url : ''))) || ''; /* PM-1157: stock rows show what a member actually plays (video_url ∥ media_url) */
    $c('exf-cues').value = seed.cues || '';
    $c('w3f-type').value = seed.exercise_type === 'duration' ? 'duration' : 'reps';
    $c('w3f-dur').value = seed.default_duration_seconds || '';
    $c('w3f-dsets').value = seed.default_sets || '';
    $c('w3f-dreps').value = seed.default_reps || '';
    $c('w3f-drest').value = seed.default_rest_seconds || '';
    $c('w3f-durwrap').style.display = seed.exercise_type === 'duration' ? '' : 'none';
    $c('w3f-drepswrap').style.display = seed.exercise_type === 'duration' ? 'none' : '';
    $c('w3f-mv').innerHTML = '';
    var mv = seed.muscle_volumes || {};
    Object.keys(mv).sort(function(a, b){ return mv[b] - mv[a]; }).forEach(function(m){ w3MvRow(m, mv[m]); });
    if (!Object.keys(mv).length) w3MvRow('', 1);
    w3AltIds = (row && row.alternatives ? row.alternatives.slice() : []);
    w3AltsPaint();
    $c('cex-alt-names').innerHTML = cexRows.slice(0, 900).map(function(r){ return '<option value="' + esc(r.name) + '">'; }).join('');
    var ro = row && !mine;
    ['exf-name','exf-cat','exf-eq','exf-video','exf-cues','w3f-type','w3f-dur','w3f-dsets','w3f-dreps','w3f-drest','w3f-alt-q'].forEach(function(id){ var el = $c(id); if (el) el.disabled = ro; });
    $c('w3-ex-extras').querySelectorAll('.mv-m,.mv-w,.mv-x').forEach(function(el){ el.disabled = ro; });
    $c('ex-save').style.display = ro ? 'none' : '';
    $c('ex-msg').textContent = ro ? 'VYVE library exercise \u2014 duplicate it to your library to change anything.' : (dupFrom ? 'Saving adds a copy you fully own \u2014 rename it or attach your own video.' : '');
    exVideoPreview();
    $c('ex-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function exSave(){
    var name = $c('exf-name').value.trim(), msg = $c('ex-msg');
    if (!name){ msg.textContent = 'Give it a name.'; return; }
    var vraw = $c('exf-video').value.trim();
    if (vraw && !ytId(vraw)){ msg.textContent = 'That video link doesn\u2019t look like YouTube \u2014 fix or clear it.'; return; }
    var mv = {};
    $c('w3f-mv').querySelectorAll('.w3-mv-row').forEach(function(d){
      var m = d.querySelector('.mv-m').value;
      if (m) mv[m] = parseFloat(d.querySelector('.mv-w').value) || 0.5;
    });
    var isDur = $c('w3f-type').value === 'duration';
    var body = {
      name: name,
      category: $c('exf-cat').value.trim() || null,
      equipment: $c('exf-eq').value.trim() || null,
      video_url: vraw || null,
      cues: $c('exf-cues').value.trim() || null,
      muscle_volumes: Object.keys(mv).length ? mv : null,
      exercise_type: isDur ? 'duration' : 'reps',
      default_sets: $c('w3f-dsets').value.trim() || null,
      default_reps: isDur ? null : ($c('w3f-dreps').value.trim() || null),
      default_rest_seconds: parseInt($c('w3f-drest').value) || null,
      default_duration_seconds: isDur ? (parseInt($c('w3f-dur').value) || 30) : null,
      alternatives: w3AltIds.slice(0, 8)
    };
    if (cexDupFrom && cexDupFrom.media_url) body.media_url = cexDupFrom.media_url;
    if (cexDupFrom && cexDupFrom.image_url) body.image_url = cexDupFrom.image_url;
    var btn = $c('ex-save'); btn.disabled = true; msg.textContent = 'Saving\u2026';
    try {
      if (cexEditing){ body.updated_at = new Date().toISOString(); await rest('/coach_exercises?id=eq.' + cexEditing.id, { method: 'PATCH', body: body }); }
      else { body.partner_id = partnerId; await rest('/coach_exercises', { method: 'POST', body: body }); }
      $c('ex-editor').style.display = 'none';
      cexLoaded = false; await exLoad(); exRender();
    } catch(e){ msg.textContent = 'Save failed: ' + (String(e.message).indexOf('409') >= 0 ? 'you already have an exercise with that name.' : e.message); }
    btn.disabled = false;
  }

  /* ── Day editor v2 (#21 drag-reorder, #22 live volume strip, #25 row
        thumbnails, #28 default prefill, #29 timed rows).
        Full reimplementations — the v1 declarations above are shadowed. ── */
  function w3RowResolve(d){
    var nm = d.querySelector('.de-name').value;
    return cexByName(nm);
  }
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
      '<div class="field"><label>Group</label><select class="de-grp">' + GRP_OPTS.map(function(g){ return '<option value="' + g + '"' + ((ex.group || '') === g ? ' selected' : '') + '>' + (g || '\u2014') + '</option>'; }).join('') + '</select></div>' +
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
    try { w3ClientsCache = await rest('/coach_clients?' + pscope() + '&select=member_email,first_name,last_name,status,assignments&order=first_name.asc&limit=500') || []; }
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
            '<button class="btn" data-w3-qv="' + it.id + '" title="Quick view" style="font-size:11.5px;">\ud83d\udc41</button>' +
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

