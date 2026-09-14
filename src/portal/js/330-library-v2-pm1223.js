  /* ── PM-1223 · Calum Batch 2 · Exercise library v2 (coach page only) ─────────────────
     One library, two contexts (Dean's PM-1222 decision):
       • the Exercise Library page — left rail with live counts (scope · muscle group ·
         equipment · stretching by region), search, video + sort chips, card grid, ★ favourites;
       • the same DOM moved into a sheet over the day builder ("Choose from library" beside every
         block button) — multi-add, Done drops rows into that block via addDayRow.
     Mechanics: the rail drives the existing hidden #ex-f-cat / #ex-f-eq selects and exScope, so
     every existing filter path (sub chips, video select, staff bulk tools) keeps working.
     exRender is SHADOWED here (v4 = v3 + favourites + sort + pick mode + star), see §23.252/270.
     Row tracking: the Reps/Secs label on a builder row is now a toggle (Calum #13, reps ⇄ time;
     distance/kcal wait on the programme_json contract — Batch 3).                              ── */
  W3_SEL += ',created_at';
  var exv2 = { built: false, sort: 'az', cap: 60, favs: {}, favLoaded: false, pick: null, rail: { key: 'scope', val: 'all' } };

  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.exv2-wrap{display:grid;grid-template-columns:232px minmax(0,1fr);gap:14px;align-items:start;}' +
      '@media(max-width:900px){.exv2-wrap{grid-template-columns:1fr;}}' +
      '.exv2-rail{border:1px solid var(--border);border-radius:12px;background:var(--surface-2);padding:8px 6px;max-height:72vh;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}' +
      '.exv2-ri{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border-radius:8px;font-size:12.5px;color:var(--text-muted);text-align:left;background:none;border:0;cursor:pointer;font-family:inherit;}' +
      '.exv2-ri:hover{background:var(--surface);color:var(--text);}' +
      '.exv2-ri.on{background:rgba(27,120,120,.14);color:var(--teal-lt);font-weight:600;}' +
      '.exv2-ri .n{margin-left:auto;font-size:11px;color:var(--text-dim);font-variant-numeric:tabular-nums;}' +
      '.exv2-ri.on .n{color:var(--teal-lt);}' +
      '.exv2-gh{display:flex;align-items:center;gap:6px;width:100%;padding:9px 10px 5px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);background:none;border:0;border-top:1px solid var(--border);margin-top:6px;cursor:pointer;text-align:left;font-family:inherit;}' +
      '.exv2-gh .car{margin-left:auto;transition:transform .15s;}.exv2-gh.open .car{transform:rotate(90deg);}' +
      '.exv2-gl{display:none;}.exv2-gh.open+.exv2-gl{display:block;}' +
      '.exv2-chip{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 10px;border-radius:999px;border:1px solid var(--border);background:var(--surface);font-size:12px;color:var(--text-muted);cursor:pointer;font-family:inherit;}' +
      '.exv2-chip.on{border-color:var(--teal);color:var(--teal-lt);background:rgba(27,120,120,.12);font-weight:600;}' +
      '.w3-card .exv2-star{position:absolute;top:6px;left:6px;width:26px;height:26px;border-radius:50%;background:rgba(13,43,43,.55);color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;border:0;cursor:pointer;z-index:2;}' +
      '.w3-card .exv2-star.on{color:var(--gold);}' +
      '.exv2-modal{position:fixed;inset:0;z-index:960;display:flex;justify-content:flex-end;align-items:stretch;padding:0;background:rgba(0,0,0,.55);max-width:none;max-height:none;overflow:visible;border:0;border-radius:0;}' +
      '.exv2-modal .in{background:var(--surface);border:1px solid var(--border);display:flex;flex-direction:column;max-width:min(1180px,88vw);width:100%;height:100vh;max-height:100vh;border-radius:14px 0 0 14px;transform:translateX(100%);transition:transform .22s ease;}' +
      '.exv2-modal.open .in{transform:none;}' +
      '.exv2-modal .in .sc{flex:1;}' +
      '.exv2-modal .exv2-rail{max-height:calc(100vh - 150px);}' +
      '.exv2-modal .in .hd{flex-wrap:wrap;}' +
      '.exv2-picks{display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:30px;}' +
      '.exv2-pk{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 8px;border-radius:999px;background:rgba(27,120,120,.14);color:var(--teal-lt);font-size:11.5px;font-weight:600;}' +
      '.exv2-pk button{background:none;border:0;color:inherit;cursor:pointer;font-size:13px;padding:0;line-height:1;}' +
      '.de-row .field label.exv2-tog{cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px;}' +
      /* PM-1229: blocks as separate panels, Kahunas-style — a heading, the rows, one wide add bar */
      '.exv2-blk{border:1px solid var(--border);border-radius:12px;padding:12px 14px 12px;margin:12px 0 0;background:var(--surface-2);}' +
      '.exv2-blk > .exv2-bh{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text);margin:0 0 8px;display:flex;align-items:center;gap:8px;}' +
      '.exv2-blk > .exv2-bh .opt{font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--text-dim);}' +
      '.exv2-blk .de-row{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px 10px;margin:0 0 6px;}' +
      '.exv2-addbar{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:12px;border:1px dashed var(--border-strong);border-radius:10px;margin-top:6px;background:var(--surface);}' +
      '.exv2-addbar .btn{font-size:13px !important;padding:9px 18px !important;}' +
      '.exv2-addbar .btn.btn-primary{min-width:220px;justify-content:center;}' +
      '.w6-cfg .field{display:flex;flex-direction:column;justify-content:flex-end;max-width:170px !important;}' +
      '.w6-cfg .field label{min-height:2.6em;display:flex;align-items:flex-end;}';
    document.head.appendChild(st);
  })();

  /* ── favourites (coach_ui_prefs.fav_exercises — §23.237 home for coach UI prefs) ── */
  async function exv2FavsLoad(){
    if (exv2.favLoaded || !partnerId) return;
    try {
      var p = await rest('/partner_partners?id=eq.' + partnerId + '&select=coach_ui_prefs&limit=1');
      var arr = (p && p[0] && p[0].coach_ui_prefs && p[0].coach_ui_prefs.fav_exercises) || [];
      exv2.favs = {}; arr.forEach(function(id){ exv2.favs[id] = 1; });
    } catch(_){}
    exv2.favLoaded = true;
  }
  function exv2FavToggle(id){
    if (exv2.favs[id]) delete exv2.favs[id]; else exv2.favs[id] = 1;
    if (typeof w0savePrefs === 'function') w0savePrefs({ fav_exercises: Object.keys(exv2.favs) });
    exv2RailPaint(); exRender();
  }

  /* ── rail ── */
  function exv2RowOk(r){
    /* the scope the rail is NOT currently controlling still applies — mirrors exRender */
    if (exScope === 'mine' && !r.partner_id) return false;
    if (exScope === 'vyve' && r.partner_id) return false;
    if (exScope === 'fav' && !exv2.favs[r.id]) return false;
    return true;
  }
  function exv2Counts(){
    var c = { all: 0, mine: 0, vyve: 0, fav: 0, cat: {}, eq: {}, str: {} };
    cexRows.forEach(function(r){
      c.all++;
      if (vyveScope ? !r.partner_id : !!r.partner_id) c.mine++; else c.vyve++;
      if (exv2.favs[r.id]) c.fav++;
      if (r.category === 'Stretching'){ var k = r.subcategory || 'General'; c.str[k] = (c.str[k] || 0) + 1; }
      else if (r.category) c.cat[r.category] = (c.cat[r.category] || 0) + 1;
      if (r.equipment) c.eq[r.equipment] = (c.eq[r.equipment] || 0) + 1;
    });
    return c;
  }
  function exv2RailPaint(){
    var rail = $c('exv2-rail'); if (!rail) return;
    var c = exv2Counts(), R = exv2.rail;
    function ri(key, val, label, n){
      var on = R.key === key && R.val === val;
      return '<button type="button" class="exv2-ri' + (on ? ' on' : '') + '" data-rk="' + esc(key) + '" data-rv="' + esc(val) + '">' + label + '<span class="n">' + n.toLocaleString() + '</span></button>';
    }
    function grp(title, id, items, open){
      if (!items.length) return '';
      return '<button type="button" class="exv2-gh' + (open ? ' open' : '') + '" data-grp="' + id + '">' + title + '<span class="car">\u203a</span></button><div class="exv2-gl">' + items.join('') + '</div>';
    }
    var cats = Object.keys(c.cat).sort(function(a, b){ return c.cat[b] - c.cat[a] || a.localeCompare(b); });
    var eqs = Object.keys(c.eq).sort(function(a, b){ return c.eq[b] - c.eq[a] || a.localeCompare(b); });
    var strs = Object.keys(c.str).sort(function(a, b){ return c.str[b] - c.str[a] || a.localeCompare(b); });
    var strTotal = 0; strs.forEach(function(k){ strTotal += c.str[k]; });
    var openM = R.key === 'cat', openE = R.key === 'eq', openS = R.key === 'str';
    rail.innerHTML =
      ri('scope', 'all', 'All exercises', c.all) +
      ri('scope', 'mine', vyveScope ? 'VYVE stock' : 'My exercises', c.mine) +
      (vyveScope ? '' : ri('scope', 'vyve', 'VYVE library', c.vyve)) +
      (partnerId ? ri('scope', 'fav', '\u2605 Favourites', c.fav) : '') +
      grp('Muscle group', 'm', cats.map(function(k){ return ri('cat', k, esc(k), c.cat[k]); }), openM || (!openE && !openS)) +
      grp('Equipment', 'e', eqs.map(function(k){ return ri('eq', k, esc(k), c.eq[k]); }), openE) +
      grp('Stretching & mobility', 's', (strTotal ? [ri('str', '', 'All stretches', strTotal)] : []).concat(strs.map(function(k){ return ri('str', k, esc(k), c.str[k]); })), openS);
    rail.querySelectorAll('[data-rk]').forEach(function(b){ b.addEventListener('click', function(){ exv2RailPick(b.dataset.rk, b.dataset.rv); }); });
    rail.querySelectorAll('.exv2-gh').forEach(function(h){ h.addEventListener('click', function(){ h.classList.toggle('open'); }); });
  }
  function exv2SetSel(sel, val){
    /* the hidden selects are populated by exLoad; a rail pick must never depend on that having run */
    if (val && !Array.prototype.some.call(sel.options, function(o){ return o.value === val; })){ var o = document.createElement('option'); o.value = val; o.textContent = val; sel.appendChild(o); }
    sel.value = val || '';
  }
  function exv2RailPick(key, val){
    exv2.rail = { key: key, val: val };
    var cat = $c('ex-f-cat'), eq = $c('ex-f-eq');
    if (key === 'scope'){ exScope = val; exv2SetSel(cat, ''); exv2SetSel(eq, ''); exSubSel = ''; }
    else if (key === 'cat'){ if (exScope === 'fav') exScope = 'all'; exv2SetSel(cat, val); exv2SetSel(eq, ''); exSubSel = ''; }
    else if (key === 'eq'){ if (exScope === 'fav') exScope = 'all'; exv2SetSel(cat, ''); exv2SetSel(eq, val); exSubSel = ''; }
    else if (key === 'str'){ if (exScope === 'fav') exScope = 'all'; exv2SetSel(cat, 'Stretching'); exv2SetSel(eq, ''); exSubSel = val; }
    /* keep the (hidden) legacy scope buttons truthful for any code that reads them */
    document.querySelectorAll('.ex-scope').forEach(function(x){ var on = x.dataset.scope === exScope; x.classList.toggle('active', on); x.classList.toggle('btn-primary', on); });
    exv2.cap = 60;
    var t = $c('exv2-title'); if (t) t.textContent = key === 'scope' ? (val === 'all' ? 'All exercises' : val === 'mine' ? (vyveScope ? 'VYVE stock' : 'My exercises') : val === 'vyve' ? 'VYVE library' : 'Favourites') : key === 'str' ? ('Stretching' + (val ? ' \u203a ' + val : '')) : val;
    exv2RailPaint(); exRender();
  }

  /* ── build the two-column shell once, moving the existing toolbar + list into the right column ── */
  function exv2Ensure(){
    if (exv2.built) return;
    var view = $c('view-exercises'); if (!view) return;
    var card = view.querySelector('.card'); if (!card) return;
    var list = $c('ex-list'), count = $c('ex-count'), q = $c('ex-f-q');
    if (!list || !q) return;
    var toolbar = q.parentElement;                      /* scope buttons + search + selects + new */
    var hint = count.nextElementSibling;                /* the ▶ line */
    var wrap = document.createElement('div'); wrap.className = 'exv2-wrap'; wrap.id = 'exv2-wrap';
    var rail = document.createElement('div'); rail.className = 'exv2-rail'; rail.id = 'exv2-rail';
    var main = document.createElement('div'); main.id = 'exv2-main'; main.style.minWidth = '0';
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;';
    head.innerHTML = '<div id="exv2-title" style="font-size:15px;font-weight:700;margin-right:4px;">All exercises</div>' +
      '<div class="exv2-chip" id="exv2-sort" title="Sort">Sort: A\u2013Z</div>' +
      '<div class="exv2-chip" id="exv2-vid" title="Video filter">Video: any</div>';
    card.insertBefore(wrap, toolbar);
    wrap.appendChild(rail); wrap.appendChild(main);
    main.appendChild(toolbar); main.appendChild(head); main.appendChild(count);
    if (hint && hint.id !== 'ex-list') main.appendChild(hint);
    main.appendChild(list);
    /* the rail now owns scope + muscle + equipment; keep the elements (state), hide the controls */
    toolbar.querySelectorAll('.ex-scope').forEach(function(b){ b.style.display = 'none'; });
    $c('ex-f-cat').style.display = 'none'; $c('ex-f-eq').style.display = 'none';
    var vs = $c('ex-f-vidsel'); if (vs) vs.style.display = 'none';
    q.style.flex = '1'; q.style.minWidth = '200px'; q.placeholder = 'Search by name or muscle \u2014 \u201csquat\u201d, \u201chamstring\u201d, \u201cband\u201d';
    $c('exv2-sort').addEventListener('click', function(){
      exv2.sort = exv2.sort === 'az' ? 'new' : 'az';
      this.textContent = exv2.sort === 'az' ? 'Sort: A\u2013Z' : 'Sort: newest';
      this.classList.toggle('on', exv2.sort !== 'az');
      exRender();
    });
    $c('exv2-vid').addEventListener('click', function(){
      var order = ['', 'has', 'none'], lab = { '': 'Video: any', has: 'Has a video', none: 'Missing a video' };
      var cur = vs ? vs.value : '';
      var nx = order[(order.indexOf(cur) + 1) % order.length];
      if (vs) vs.value = nx;
      this.textContent = lab[nx]; this.classList.toggle('on', !!nx);
      exRender();
    });
    exv2.built = true;
    exv2RailPaint();
  }

  /* ── exRender v4 — v3 (132-shared-library.js) + favourites scope, sort, star, pick mode, show-more ── */
  function exRender(){
    exv2Ensure();
    var q = ($c('ex-f-q').value || '').trim().toLowerCase();
    var fc = $c('ex-f-cat').value, fe = $c('ex-f-eq').value;
    if (exSubChips(fc, 'ex-f-sub', $c('ex-f-cat'), exSubSel, function(v){ exSubSel = v; exv2.rail = fc === 'Stretching' ? { key: 'str', val: v } : exv2.rail; exv2RailPaint(); exRender(); }, function(r){ return exv2RowOk(r); })) return;
    var rows = cexRows.filter(function(r){
      if (!exv2RowOk(r)) return false;
      if (fc && r.category !== fc) return false;
      if (exSubSel && r.subcategory !== exSubSel) return false;
      if (fe && r.equipment !== fe) return false;
      if (q && (r.name || '').toLowerCase().indexOf(q) < 0 && (r.category || '').toLowerCase().indexOf(q) < 0 && (r.equipment || '').toLowerCase().indexOf(q) < 0 && JSON.stringify(r.muscle_volumes || {}).toLowerCase().indexOf(q) < 0) return false;
      var vsel = $c('ex-f-vidsel') ? $c('ex-f-vidsel').value : '';
      var hasVid = !!(r.video_url || r.media_url), hasAlt = !!r.video_url_alt;
      if (vsel === 'has'   && !hasVid) return false;
      if (vsel === 'none'  &&  hasVid) return false;
      if (vsel === 'alt'   && !hasAlt) return false;
      if (vsel === 'noalt' &&  hasAlt) return false;
      return true;
    });
    if (exv2.sort === 'new') rows.sort(function(a, b){ return String(b.created_at || '').localeCompare(String(a.created_at || '')) || String(a.name).localeCompare(String(b.name)); });
    if ($c('ex-bulk-btn')) $c('ex-bulk-btn').style.display = vyveScope ? '' : 'none';
    var CAP = exv2.cap, shown = rows.slice(0, CAP);
    $c('ex-count').textContent = (rows.length > CAP ? ('Showing ' + CAP + ' of ' + rows.length) : (rows.length + ' exercise' + (rows.length === 1 ? '' : 's'))) + (vyveScope && typeof w6bTotals === 'function' ? ('  \u00b7  ' + w6bTotals()) : '');
    var list = $c('ex-list');
    list.classList.add('w3-grid');
    if (!rows.length){ list.classList.remove('w3-grid'); list.innerHTML = '<div class="empty-state"><h3>Nothing matches</h3><p>Try a different search or group, or add your own exercise.</p></div>'; return; }
    var pick = exv2.pick;
    list.innerHTML = shown.map(function(r){
      var mine = vyveScope ? !r.partner_id : !!r.partner_id;
      var vid = r.video_url ? '<span style="color:var(--gold);font-weight:700;font-size:10.5px;">\u25b6 your video</span>' : (r.media_url ? '<span style="color:var(--gold);font-weight:700;font-size:10.5px;">\u25b6 VYVE video</span>' : '<span style="color:var(--warning);font-weight:700;font-size:10.5px;">no video</span>');
      if (vyveScope) vid += r.video_url_alt
        ? ' <span style="color:var(--success);font-weight:700;font-size:10.5px;">\u29c9 ' + esc(r.alt_label || 'alt') + '</span>'
        : ' <span style="color:var(--text-dim);font-weight:700;font-size:10.5px;">\u29c9 no alt</span>';
      var dur = r.exercise_type === 'duration' ? '<span class="w3-chip" style="color:var(--gold);border-color:var(--gold);">\u23f1 timed</span>' : '';
      var presets = r.default_sets ? '<span style="font-size:10.5px;color:var(--text-muted);">' + esc(r.default_sets) + '\u00d7' + esc(r.exercise_type === 'duration' ? ((r.default_duration_seconds || 30) + 's') : (r.default_reps || '8-12')) + (r.default_rest_seconds ? ' \u00b7 rest ' + r.default_rest_seconds + 's' : '') + '</span>' : '';
      var acts;
      if (pick){
        var picked = pick.ids.indexOf(r.id) >= 0;
        acts = '<button class="btn' + (picked ? '' : ' btn-primary') + '" data-ex-pick="' + r.id + '" style="font-size:11px;flex:1;">' + (picked ? '\u2713 Added' : '+ Add') + '</button>';
      } else {
        acts = mine
          ? '<button class="btn" data-ex-edit="' + r.id + '" style="font-size:11px;">Edit</button> <button class="btn" data-ex-del="' + r.id + '" style="font-size:11px;">Remove</button>'
          : '<button class="btn" data-ex-edit="' + r.id + '" style="font-size:11px;">View</button> <button class="btn" data-ex-dup="' + r.id + '" style="font-size:11px;">Duplicate</button>';
      }
      var dv = w3DirectVideo(r) || ytId(r.video_url) || ytId(r.media_url);
      var star = partnerId ? '<button type="button" class="exv2-star' + (exv2.favs[r.id] ? ' on' : '') + '" data-ex-fav="' + r.id + '" title="Favourite">\u2605</button>' : '';
      return '<div class="w3-card"><div class="im"' + (dv ? ' data-ex-play="' + r.id + '" title="Play video"' : '') + '>' + star + w3ThumbImg(r, '') + (dv ? '<span class="w3-play">\u25b6</span>' : '') + '</div><div class="bd">' +
        '<div class="nm">' + esc(r.name) + ' <span class="src-tag ' + (mine ? 'src-mine' : 'src-vyve') + '">' + (mine ? 'Yours' : 'VYVE') + '</span></div>' +
        '<div>' + w3MvChips(r.muscle_volumes, 3) + dur + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + esc(r.category || '') + (r.subcategory ? ' \u203a ' + esc(r.subcategory) : '') + (r.equipment ? ' \u00b7 ' + esc(r.equipment) : '') + '</div>' +
        (vid || presets ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' + vid + presets + '</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:auto;padding-top:4px;">' + acts + '</div>' +
        '</div></div>';
    }).join('') + (rows.length > CAP ? '<div style="grid-column:1/-1;text-align:center;padding:6px;"><button class="btn" id="exv2-more" type="button" style="font-size:12px;">Show ' + Math.min(60, rows.length - CAP) + ' more (' + (rows.length - CAP) + ' left)</button></div>' : '');
    list.querySelectorAll('[data-ex-edit]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(w3ById(b.dataset.exEdit), null); }); });
    list.querySelectorAll('.im[data-ex-play]').forEach(function(im){
      im.addEventListener('click', function(ev){ if (ev.target && ev.target.closest && ev.target.closest('.exv2-star')) return; exPlaySheet(w3ById(im.dataset.exPlay)); });
    });
    list.querySelectorAll('[data-ex-fav]').forEach(function(b){ b.addEventListener('click', function(ev){ ev.stopPropagation(); exv2FavToggle(b.dataset.exFav); }); });
    list.querySelectorAll('[data-ex-dup]').forEach(function(b){ b.addEventListener('click', function(){ exOpen(null, w3ById(b.dataset.exDup)); }); });
    list.querySelectorAll('[data-ex-del]').forEach(function(b){ b.addEventListener('click', async function(){
      if (!confirm('Remove this exercise from your library? Programmes it\u2019s already in are unaffected.')) return;
      try { await rest('/coach_exercises?id=eq.' + b.dataset.exDel, { method: 'PATCH', body: { active: false } }); cexLoaded = false; await exLoad(); exv2RailPaint(); exRender(); }
      catch(e){ alert('Remove failed: ' + e.message); }
    }); });
    list.querySelectorAll('[data-ex-pick]').forEach(function(b){ b.addEventListener('click', function(){ exv2PickToggle(b.dataset.exPick); }); });
    var more = $c('exv2-more'); if (more) more.addEventListener('click', function(){ exv2.cap += 60; exRender(); });
  }

  /* exInit: load favourites alongside the rows, then paint the rail */
  var _exv2Init = exInit;
  exInit = async function(){ await Promise.all([exLoad(), exv2FavsLoad()]); exv2Ensure(); exv2RailPaint(); exRender(); };
  /* exLoad is also called from go() for the workout sections — keep the rail's counts in step */
  var _exv2Load = exLoad;
  exLoad = async function(){
    /* PM-1225: single-flight. Two callers (exInit and go()'s section preload) could both pass the
       cexLoaded=false guard and both concat their pages — every row twice, "2,956 exercises". */
    if (cexLoaded) return;
    if (exv2.loading) return exv2.loading;
    var self = this, args = arguments;
    exv2.loading = (async function(){
      try {
        var r = await _exv2Load.apply(self, args);
        var seen = {}; cexRows = cexRows.filter(function(x){ if (!x || seen[x.id]) return false; seen[x.id] = 1; return true; });
        if (exv2.built) exv2RailPaint();
        return r;
      } finally { exv2.loading = null; }
    })();
    return exv2.loading;
  };

  /* ── the picker: the library moves into a sheet over the builder, Done drops rows into the block ── */
  var exv2Modal = null;
  function exv2PickToggle(id){
    var p = exv2.pick; if (!p) return;
    var i = p.ids.indexOf(id);
    if (i >= 0) p.ids.splice(i, 1); else p.ids.push(id);
    exv2PicksPaint(); exRender();
  }
  function exv2PicksPaint(){
    var p = exv2.pick, el = $c('exv2-picks'); if (!p || !el) return;
    el.innerHTML = p.ids.length ? p.ids.map(function(id){ var r = w3ById(id); return '<span class="exv2-pk">' + esc(r ? r.name : id) + '<button type="button" data-unpick="' + id + '" title="Remove">\u00d7</button></span>'; }).join('') : '<span style="font-size:12px;color:var(--text-dim);">Nothing picked yet \u2014 tap + Add on any card.</span>';
    el.querySelectorAll('[data-unpick]').forEach(function(b){ b.addEventListener('click', function(){ exv2PickToggle(b.dataset.unpick); }); });
    var d = $c('exv2-done'); if (d) d.textContent = 'Done' + (p.ids.length ? ' \u00b7 add ' + p.ids.length : '');
  }
  async function exv2PickerOpen(wrap, blockLabel, defaults){
    await Promise.all([exLoad(), exv2FavsLoad()]);
    exv2Ensure();
    var w = $c('exv2-wrap'); if (!w) return;
    if (!exv2Modal){
      exv2Modal = document.createElement('div');
      exv2Modal.className = 'w3-modal exv2-modal';
      exv2Modal.style.display = 'none';
      exv2Modal.innerHTML = '<div class="in"><div class="hd"><strong id="exv2-mtitle" style="font-size:14px;"></strong><div id="exv2-picks" class="exv2-picks" style="flex:1;margin:0 10px;"></div><button class="btn" id="exv2-cancel" type="button" style="font-size:12px;">Cancel</button><button class="btn btn-primary" id="exv2-done" type="button" style="font-size:12px;">Done</button></div><div class="sc" id="exv2-mbody"></div></div>';
      document.body.appendChild(exv2Modal);
      $c('exv2-cancel').addEventListener('click', function(){ exv2PickerClose(false); });
      $c('exv2-done').addEventListener('click', function(){ exv2PickerClose(true); });
      exv2Modal.addEventListener('click', function(ev){ if (ev.target === exv2Modal) exv2PickerClose(false); });
    }
    exv2.pick = { wrap: wrap, ids: [], defaults: defaults || {}, home: w.parentElement, next: w.nextSibling };
    $c('exv2-mtitle').textContent = 'Choose exercises \u2014 ' + blockLabel;
    $c('exv2-mbody').appendChild(w);
    exv2Modal.style.display = 'flex';
    setTimeout(function(){ exv2Modal.classList.add('open'); }, 10);
    exv2PicksPaint(); exRender();
    var q = $c('ex-f-q'); if (q){ q.value = ''; try { q.focus(); } catch(_){} }
  }
  function exv2PickerClose(commit){
    var p = exv2.pick; if (!p) return;
    if (commit && p.ids.length){
      p.ids.forEach(function(id){
        var r = w3ById(id); if (!r) return;
        var ex = Object.assign({}, p.defaults, { name: r.name });
        if (r.exercise_type === 'duration'){ ex.type = 'duration'; ex.duration_seconds = r.default_duration_seconds || 30; }
        addDayRow(p.wrap, ex);
        var row = p.wrap.lastElementChild, nm = row && row.querySelector('.de-name');
        if (nm){ try { nm.dispatchEvent(new Event('change', { bubbles: true })); } catch(_){} }
        if (row) exv2UnitAuto(row);
      });
      var host = p.wrap.closest('[data-w3-tvs-host]'); if (host && typeof w3TvsRefresh === 'function') w3TvsRefresh(host);
    }
    /* put the library back where it lives */
    var w = $c('exv2-wrap');
    if (w && p.home){ if (p.next && p.next.parentElement === p.home) p.home.insertBefore(w, p.next); else p.home.appendChild(w); }
    exv2.pick = null;
    exv2Modal.classList.remove('open');
    exv2Modal.style.display = 'none';
    exRender();
  }

  /* "Choose from library" beside every block's add button — hooks the live renderDayEditor (260) */
  var _exv2RDE = renderDayEditor;
  renderDayEditor = function(container, day){
    _exv2RDE.apply(this, arguments);
    /* PM-1240: Dean — no Rest block button on the builder (rest lives on each row) */
    var rb = container.querySelector('.de-add-rest'); if (rb) rb.remove();
    /* PM-1226: a new day no longer opens with one blank typed row — the drawer button is the path.
       The base editor renders [{}] when there are no exercises; drop that row if it is empty. */
    var named = day && (day.exercises || []).some(function(x){ return x && x.name; });
    if (!named){
      var mm = container.querySelector('.de-main');
      if (mm) Array.prototype.slice.call(mm.querySelectorAll(':scope > .de-row')).forEach(function(r){ var nm = r.querySelector('.de-name'); if (nm && !nm.value) r.remove(); });
      if (typeof w3TvsRefresh === 'function') w3TvsRefresh(container);
    }
    /* PM-1228: rows that came in with a long duration show minutes */
    container.querySelectorAll('.de-row').forEach(function(r){ exv2UnitAuto(r); });
    /* PM-1225 (Dean): "+ Exercise" itself opens the library drawer — that is the add path. The
       blank typed row survives as a quiet secondary link for coaches who know the name. */
    [['de-add-warm', 'de-warm', 'Warm up', { sets: '1', reps: '', rest_seconds: 0 }], ['de-add-main', 'de-main', 'Workout', {}], ['de-add-cool', 'de-cool', 'Cool down', { sets: '1', reps: '', rest_seconds: 0 }]].forEach(function(spec){
      var btn = container.querySelector('.' + spec[0]); if (!btn || btn.dataset.exv2) return;
      var fresh = btn.cloneNode(true);          /* drops the original "add a blank row" listener */
      fresh.dataset.exv2 = '1';
      fresh.classList.add('btn-primary');
      fresh.textContent = '+ ' + (spec[2] === 'Workout' ? 'Add exercises' : spec[2] + ' exercises');
      fresh.addEventListener('click', function(){ exv2PickerOpen(container.querySelector('.' + spec[1]), spec[2], spec[3]); });
      btn.parentElement.replaceChild(fresh, btn);
      /* wrap heading + rows + add bar into one panel */
      var rowsEl = container.querySelector('.' + spec[1]);
      var heading = rowsEl && rowsEl.previousElementSibling;
      var addWrap = fresh.parentElement;
      if (rowsEl && heading && addWrap && !rowsEl.closest('.exv2-blk')){
        var panel = document.createElement('div'); panel.className = 'exv2-blk';
        heading.parentElement.insertBefore(panel, heading);
        var h = document.createElement('div'); h.className = 'exv2-bh';
        h.innerHTML = esc(spec[2]) + (spec[2] === 'Workout' ? '' : ' <span class="opt">optional</span>');
        heading.remove();
        panel.appendChild(h); panel.appendChild(rowsEl);
        if (addWrap === container || addWrap.classList.contains('exv2-blk')){ /* cool-down button has no wrapper div */
          var bar = document.createElement('div'); bar.className = 'exv2-addbar'; fresh.parentElement.insertBefore(bar, fresh); bar.appendChild(fresh); panel.appendChild(bar);
        } else { addWrap.className = 'exv2-addbar'; addWrap.style.cssText = ''; panel.appendChild(addWrap); }
      }
    });
  };

  /* ── Calum #13: the Reps / Secs label on a builder row toggles the row's tracking ── */
  /* unit on a duration row: 'sec' (default) or 'min' — the input shows the unit, the label names it,
     collectDay always receives seconds (wrapper below). A cardio pick with ≥ 2 minutes opens in minutes. */
  function exv2UnitSet(d, unit){
    var f = d.querySelector('.de-reps'); if (!f) return;
    var lbl = f.parentElement.querySelector('label');
    var cur = d.dataset.w3unit || 'sec', v = parseFloat(f.value);
    if (unit === 'min' && cur !== 'min' && isFinite(v)) f.value = String(Math.round(v / 60 * 10) / 10).replace(/\.0$/, '');
    if (unit === 'sec' && cur === 'min' && isFinite(v)) f.value = String(Math.round(v * 60));
    d.dataset.w3unit = unit;
    if (lbl && d.dataset.w3type === 'duration') lbl.textContent = unit === 'min' ? 'Mins' : 'Secs';
  }
  function exv2UnitAuto(d){
    if (!d || d.dataset.w3type !== 'duration' || d.dataset.w3unit) return;
    var f = d.querySelector('.de-reps'); var v = f ? parseInt(f.value, 10) : NaN;
    if (isFinite(v) && v >= 120 && v % 30 === 0) exv2UnitSet(d, 'min'); else d.dataset.w3unit = 'sec';
  }
  document.addEventListener('click', function(ev){
    var lbl = ev.target && ev.target.closest ? ev.target.closest('.de-row .field label') : null;
    if (!lbl) return;
    var f = lbl.parentElement; if (!f || !f.querySelector('.de-reps')) return;
    var d = lbl.closest('.de-row'); if (!d) return;
    var inp = f.querySelector('.de-reps');
    var isDur = d.dataset.w3type === 'duration', unit = d.dataset.w3unit || 'sec';
    if (!isDur){ w3RowSetMode(d, true); d.dataset.w3unit = 'sec'; if (!/^\d+$/.test(inp.value)) inp.value = '30'; lbl.textContent = 'Secs'; }
    else if (unit === 'sec'){ var secs = parseFloat(inp.value); if (!isFinite(secs) || secs < 120) inp.value = '600'; exv2UnitSet(d, 'min'); }
    else { exv2UnitSet(d, 'sec'); w3RowSetMode(d, false); d.dataset.w3unit = ''; inp.value = '8-12'; }
    var host = d.closest('[data-w3-tvs-host]'); if (host && typeof w3TvsRefresh === 'function') w3TvsRefresh(host);
  });
  /* collectDay reads .de-reps as seconds for a duration row — hand it seconds, then put the minutes back */
  (function(){
    var _cd = collectDay;
    collectDay = function(container){
      var swapped = [];
      container.querySelectorAll('.de-row').forEach(function(d){
        if (d.dataset.w3type === 'duration' && d.dataset.w3unit === 'min'){
          var f = d.querySelector('.de-reps'); if (!f) return;
          var m = parseFloat(f.value); if (!isFinite(m)) return;
          swapped.push([f, f.value]); f.value = String(Math.round(m * 60));
        }
      });
      try { return _cd.apply(this, arguments); }
      finally { swapped.forEach(function(p){ p[0].value = p[1]; }); }
    };
  })();
  (function(){
    var mo = new MutationObserver(function(){
      document.querySelectorAll('.de-row .field .de-reps').forEach(function(inp){
        var l = inp.parentElement.querySelector('label'); if (l && !l.classList.contains('exv2-tog')){ l.classList.add('exv2-tog'); l.title = 'Click to switch this row between reps and seconds'; }
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  })();
