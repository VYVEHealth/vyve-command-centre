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
