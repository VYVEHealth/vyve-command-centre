  /* PM-1208: shelves. EX_SHELVES = the stock shelves this portal reads (coach: strength, + rehab on opt-in;
     physio: rehab); EX_HOME_SHELF = the shelf a new exercise saved here lands on. Own rows always show. */
  var EX_SHELVES = ['strength'], EX_HOME_SHELF = 'strength', EX_CAT_LABEL = 'All muscle groups';
  var W3_SEL = 'id,partner_id,library,name,category,equipment,video_url,media_url,cues,muscle_volumes,image_url,exercise_type,default_sets,default_reps,default_rest_seconds,default_duration_seconds,alternatives,video_url_alt,alt_label';
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
      /* PM-1208: staff at VYVE scope see every shelf; a partner sees its shelves plus its own rows. */
      var exShelf = vyveScope ? '' : ('&or=(library.in.(' + EX_SHELVES.join(',') + ')' + (partnerId ? ',partner_id.eq.' + partnerId : '') + ')');
      for (var exOff = 0; ; exOff += 1000){
        var exPg = await rest('/coach_exercises?active=eq.true' + exShelf + '&select=' + W3_SEL + '&order=name.asc,id.asc&limit=1000&offset=' + exOff) || [];
        cexRows = cexRows.concat(exPg);
        if (exPg.length < 1000) break;
      }
      cexLoaded = true;
      var cats = {}, eqs = {};
      cexRows.forEach(function(r){ if (r.category) cats[r.category] = 1; if (r.equipment) eqs[r.equipment] = 1; });
      var co = Object.keys(cats).sort(), eo = Object.keys(eqs).sort();
      if ($c('ex-f-cat')) $c('ex-f-cat').innerHTML = '<option value="">' + esc(EX_CAT_LABEL) + '</option>' + co.map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('');
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
      var dv = w3DirectVideo(r) || ytId(r.video_url) || ytId(r.media_url); /* PM-1208: YouTube links play too, in the preview sheet */
      return '<div class="w3-card"><div class="im"' + (dv ? ' data-ex-play="' + r.id + '" title="Play video"' : '') + '>' + w3ThumbImg(r, '') + (dv ? '<span class="w3-play">\u25b6</span>' : '') + '</div><div class="bd">' +
        '<div class="nm">' + esc(r.name) + ' <span class="src-tag ' + (mine ? 'src-mine' : 'src-vyve') + '">' + (mine ? 'Yours' : 'VYVE') + '</span></div>' +
        '<div>' + w3MvChips(r.muscle_volumes, 3) + dur + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + esc(r.category || '') + (r.equipment ? ' \u00b7 ' + esc(r.equipment) : '') + '</div>' +
        (vid || presets ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' + vid + presets + '</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:auto;padding-top:4px;">' + acts + '</div>' +
        '</div></div>';
    }).join('');
    list.querySelectorAll('[data-ex-edit]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(w3ById(b.dataset.exEdit), null); }); });
    /* PM-1208: tap the thumbnail → preview sheet (native <video> for a file, YouTube embed for a link), name + cues beside it.
       Replaces PM-1157's in-card play, which only worked for direct files. */
    list.querySelectorAll('.im[data-ex-play]').forEach(function(im){
      im.addEventListener('click', function(){ exPlaySheet(w3ById(im.dataset.exPlay)); });
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
  /* \u2500\u2500 PM-1208 preview sheet: one modal, rebuilt per open, torn down on close so playback stops. \u2500\u2500 */
  function exPlaySheet(r){
    if (!r) return;
    exPlayClose();
    var url = w3DirectVideo(r), yid = url ? '' : (ytId(r.video_url) || ytId(r.media_url));
    if (!url && !yid) return;
    var poster = w3ThumbSrc(r);
    var player = url
      ? '<video controls autoplay playsinline preload="metadata" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;display:block;"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' src="' + esc(url) + '"></video>'
      : '<div style="position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;overflow:hidden;"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(yid) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + esc(r.name) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>';
    var meta = [r.category, r.equipment].filter(Boolean).map(esc).join(' \u00b7 ');
    var m = document.createElement('div');
    m.className = 'w3-modal'; m.id = 'ex-play-sheet';
    m.innerHTML = '<div class="in" style="width:min(760px,96vw);max-height:92vh;display:flex;flex-direction:column;">' +
      '<div class="hd"><div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:15px;line-height:1.25;">' + esc(r.name) + '</div>' + (meta ? '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">' + meta + '</div>' : '') + '</div>' +
      '<button class="btn" type="button" data-ex-play-close style="font-size:12px;">Close</button></div>' +
      '<div class="sc">' + player + (r.cues ? '<div style="margin-top:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;">' + esc(r.cues) + '</div>' : '') + '</div></div>';
    m.addEventListener('click', function(e){ if (e.target === m || e.target.hasAttribute('data-ex-play-close')) exPlayClose(); });
    document.body.appendChild(m);
    document.addEventListener('keydown', exPlayEsc);
    var v = m.querySelector('video'); if (v) v.play().catch(function(){});
  }
  function exPlayClose(){
    var m = $c('ex-play-sheet'); if (!m) return;
    var v = m.querySelector('video'); if (v){ try { v.pause(); } catch(_){} }
    m.remove();
    document.removeEventListener('keydown', exPlayEsc);
  }
  function exPlayEsc(e){ if (e.key === 'Escape') exPlayClose(); }

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
      else { body.partner_id = partnerId; body.library = EX_HOME_SHELF; await rest('/coach_exercises', { method: 'POST', body: body }); }
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
