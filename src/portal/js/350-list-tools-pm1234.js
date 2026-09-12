  /* ── PM-1234 · List tools (Dean, 12 Sep — Kahunas parity on every list page) ────────────────
     Template lists (#pl-list: programmes, weekly workouts, day templates, forms, habits, nutrition,
     meals, foods, supplements): a toolbar above the list — search, sort, list / grid, per page
     (12 · 24 · 36 · 48 · 100) with a pager. DOM-level: every renderer paints one direct child per
     item into #pl-list, so the tools filter / order / page those children and re-apply after any
     re-render (MutationObserver). No renderer touched.
     Clients: per-page select (replaces the fixed 25 behind "Show more"), sort (name · newest ·
     last active · last check-in), check-in-day chips (Mon–Sun from assignments.checkin_day).
     clFiltered SHADOWED = 200's body + day filter + sort.                                        ── */
  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.lt-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:2px 0 10px;}' +
      '.lt-bar .lt-q{flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;outline:none;}' +
      '.lt-bar select{padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;}' +
      '.lt-seg{display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;}' +
      '.lt-seg button{padding:6px 10px;font-size:12px;background:none;border:0;color:var(--text-muted);cursor:pointer;font-family:inherit;}' +
      '.lt-seg button.on{background:rgba(27,120,120,.14);color:var(--teal-lt);font-weight:600;}' +
      '.lt-pager{display:flex;align-items:center;gap:6px;justify-content:center;margin:12px 0 2px;font-size:12.5px;color:var(--text-muted);}' +
      '.lt-pager button{min-width:30px;height:30px;padding:0 8px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:12px;cursor:pointer;font-family:inherit;}' +
      '.lt-pager button.on{background:rgba(27,120,120,.14);border-color:var(--teal);color:var(--teal-lt);font-weight:700;}' +
      '.lt-pager button:disabled{opacity:.4;cursor:default;}' +
      '#pl-list.lt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px;}' +
      '#pl-list.lt-grid > *{flex-direction:column !important;align-items:stretch !important;border:1px solid var(--border) !important;border-radius:12px;padding:12px !important;background:var(--surface-2);}' +
      '#pl-list.lt-grid > * .w3-exthumb{width:100%;height:120px;border-radius:8px;}' +
      '#pl-list.lt-grid > * > div[style*="flex:1"]{min-width:0 !important;}' +
      '#pl-list.lt-grid > * .btn{flex:1;justify-content:center;}' +
      '.lt-days{display:flex;gap:4px;flex-wrap:wrap;}' +
      '.lt-days .btn{font-size:11.5px;padding:5px 9px;}' +
      '.lt-days .btn.on{background:rgba(27,120,120,.14);border-color:var(--teal);color:var(--teal-lt);}';
    document.head.appendChild(st);
  })();

  var LT_SIZES = [12, 24, 36, 48, 100];
  var lt = { q: '', sort: 'default', view: 'list', per: 12, page: 1, kind: null, mute: false, built: false };

  function ltItems(list){
    /* item children only — skip empty states, "show more" rows and the pager we add */
    return Array.prototype.filter.call(list.children, function(c){
      return !(c.classList.contains('empty-state') || c.classList.contains('lt-pager') || c.tagName === 'P');
    });
  }
  function ltName(el){
    var n = el.querySelector('div[style*="font-weight:600"], strong, .nm, .w4-name');
    return ((n && n.textContent) || el.textContent || '').trim().toLowerCase();
  }
  function ltEnsure(){
    if (lt.built) return true;
    var list = $c('pl-list'), nb = $c('pl-new'); if (!list || !nb) return false;
    var host = nb.parentElement;
    var bar = document.createElement('div'); bar.className = 'lt-bar'; bar.id = 'lt-bar';
    bar.innerHTML =
      '<input class="lt-q" id="lt-q" type="search" placeholder="Search by name\u2026"/>' +
      '<select id="lt-sort" title="Sort"><option value="default">Newest first</option><option value="az">Name A\u2013Z</option><option value="za">Name Z\u2013A</option></select>' +
      '<div class="lt-seg" id="lt-view"><button type="button" data-v="list" class="on" title="List">\u2630 List</button><button type="button" data-v="grid" title="Grid">\u25a6 Grid</button></div>' +
      '<select id="lt-per" title="Per page">' + LT_SIZES.map(function(n){ return '<option value="' + n + '"' + (n === lt.per ? ' selected' : '') + '>' + n + ' per page</option>'; }).join('') + '</select>' +
      '<span id="lt-count" style="font-size:12px;color:var(--text-muted);margin-left:auto;"></span>';
    /* the + New button moves into the bar so the row reads: search · sort · view · per page · New */
    host.parentElement.insertBefore(bar, host);
    host.style.display = 'none';
    nb.style.marginLeft = '0';
    bar.appendChild(nb);
    var pager = document.createElement('div'); pager.className = 'lt-pager'; pager.id = 'lt-pager';
    list.parentElement.insertBefore(pager, list.nextSibling);
    $c('lt-q').addEventListener('input', function(){ lt.q = this.value.trim().toLowerCase(); lt.page = 1; ltApply(); });
    $c('lt-sort').addEventListener('change', function(){ lt.sort = this.value; lt.page = 1; ltApply(); });
    $c('lt-per').addEventListener('change', function(){ lt.per = parseInt(this.value, 10) || 12; lt.page = 1; ltApply(); });
    $c('lt-view').querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){
      lt.view = b.dataset.v;
      $c('lt-view').querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
      $c('pl-list').classList.toggle('lt-grid', lt.view === 'grid');
    }); });
    new MutationObserver(function(){ if (!lt.mute) ltApply(); }).observe(list, { childList: true });
    lt.built = true;
    return true;
  }
  var LT_SKIP = { food: 1, meal: 1 };   /* foods (W4) and meals (W7/W9b) already carry their own search + filters */
  function ltApply(){
    if (!ltEnsure()) return;
    var list = $c('pl-list');
    if (lt.kind !== plKind){ lt.kind = plKind; lt.q = ''; lt.page = 1; var qi = $c('lt-q'); if (qi) qi.value = ''; }
    var skip = !!LT_SKIP[plKind];
    ['lt-q', 'lt-sort', 'lt-view', 'lt-per', 'lt-count'].forEach(function(id){ var e = $c(id); if (e) e.style.display = skip ? 'none' : ''; });
    if (skip){ list.classList.remove('lt-grid'); Array.prototype.forEach.call(list.children, function(c){ c.style.display = ''; }); var pg0 = $c('lt-pager'); if (pg0) pg0.innerHTML = ''; return; }
    list.classList.toggle('lt-grid', lt.view === 'grid');
    var items = ltItems(list);
    lt.mute = true;
    try {
      /* remember the render order once, so "Newest first" survives an A–Z sort */
      items.forEach(function(el, i){ if (!el.dataset.ltIdx) el.dataset.ltIdx = String(i); if (!el.dataset.ltName) el.dataset.ltName = ltName(el); });
      var vis = items.filter(function(el){ return !lt.q || el.dataset.ltName.indexOf(lt.q) >= 0 || (el.textContent || '').toLowerCase().indexOf(lt.q) >= 0; });
      var ordered = items.slice().sort(function(a, b){
        if (lt.sort === 'az') return a.dataset.ltName.localeCompare(b.dataset.ltName);
        if (lt.sort === 'za') return b.dataset.ltName.localeCompare(a.dataset.ltName);
        return parseInt(a.dataset.ltIdx, 10) - parseInt(b.dataset.ltIdx, 10);
      });
      var same = ordered.every(function(el, i){ return list.children[i] === el; });
      if (!same) ordered.forEach(function(el){ list.appendChild(el); });
      var total = vis.length, pages = Math.max(1, Math.ceil(total / lt.per));
      if (lt.page > pages) lt.page = pages;
      var from = (lt.page - 1) * lt.per, to = from + lt.per, shown = 0;
      ordered.forEach(function(el){
        var ok = vis.indexOf(el) >= 0;
        var inPage = ok && shown >= from && shown < to;
        if (ok) shown++;
        el.style.display = inPage ? '' : 'none';
      });
      var cnt = $c('lt-count');
      if (cnt) cnt.textContent = items.length ? (total === items.length ? items.length + ' item' + (items.length === 1 ? '' : 's') : total + ' of ' + items.length) : '';
      var pg = $c('lt-pager');
      if (pg){
        if (pages <= 1){ pg.innerHTML = ''; }
        else {
          var btns = '<button type="button" data-p="' + (lt.page - 1) + '"' + (lt.page <= 1 ? ' disabled' : '') + '>\u2039</button>';
          for (var p = 1; p <= pages; p++){
            if (pages > 9 && Math.abs(p - lt.page) > 2 && p !== 1 && p !== pages){ if (p === 2 || p === pages - 1) btns += '<span>\u2026</span>'; continue; }
            btns += '<button type="button" data-p="' + p + '"' + (p === lt.page ? ' class="on"' : '') + '>' + p + '</button>';
          }
          btns += '<button type="button" data-p="' + (lt.page + 1) + '"' + (lt.page >= pages ? ' disabled' : '') + '>\u203a</button>';
          btns += '<span style="margin-left:8px;">' + (from + 1) + '\u2013' + Math.min(to, total) + ' of ' + total + '</span>';
          pg.innerHTML = btns;
          pg.querySelectorAll('button[data-p]').forEach(function(b){ b.addEventListener('click', function(){ lt.page = parseInt(b.dataset.p, 10); ltApply(); }); });
        }
      }
    } finally { setTimeout(function(){ lt.mute = false; }, 0); }   /* observer callbacks are microtasks — they see mute=true and skip our own reorder */
  }
  /* first paint after the plans view shows, and after every plLoad */
  (function(){
    var _pl = plLoad;
    plLoad = async function(){ var r = await _pl.apply(this, arguments); setTimeout(ltApply, 0); return r; };
  })();

  /* ── Clients: per page · sort · check-in day ── */
  var clx = { per: 25, sort: 'default', day: null, lastCheckin: null, loadingCi: false };
  var CL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function clxEnsure(){
    var tb = $c('cl-toolbar'); if (!tb || $c('clx-per')) return;
    var mode = $c('cl-mode');
    var per = document.createElement('select'); per.id = 'clx-per'; per.style.cssText = 'padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;';
    per.innerHTML = LT_SIZES.map(function(n){ return '<option value="' + n + '">' + n + ' per page</option>'; }).join('');
    per.value = '24'; clx.per = 24; CL_PAGE = 24; clShown = 24;
    per.addEventListener('change', function(){ clx.per = parseInt(this.value, 10) || 24; CL_PAGE = clx.per; clShown = clx.per; renderRoster(); });
    var sort = document.createElement('select'); sort.id = 'clx-sort'; sort.style.cssText = per.style.cssText;
    sort.innerHTML = '<option value="default">Newest first</option><option value="az">Name A\u2013Z</option><option value="active">Last active</option><option value="checkin">Latest check-in</option>';
    sort.addEventListener('change', function(){
      clx.sort = this.value; clShown = CL_PAGE;
      if (clx.sort === 'checkin' && !clx.lastCheckin) clxLoadCheckins().then(renderRoster); else renderRoster();
    });
    var days = document.createElement('div'); days.className = 'lt-days'; days.id = 'clx-days'; days.title = 'Check-in day';
    days.innerHTML = CL_DAYS.map(function(d, i){ return '<button type="button" class="btn" data-d="' + i + '">' + d + '</button>'; }).join('');
    days.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){
      var d = parseInt(b.dataset.d, 10);
      clx.day = clx.day === d ? null : d;
      days.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', clx.day !== null && parseInt(x.dataset.d, 10) === clx.day); });
      clShown = CL_PAGE; renderRoster();
    }); });
    if (mode){ tb.insertBefore(days, mode); tb.insertBefore(sort, mode); tb.insertBefore(per, mode); }
    else { tb.appendChild(days); tb.appendChild(sort); tb.appendChild(per); }
  }
  async function clxLoadCheckins(){
    if (clx.loadingCi) return; clx.loadingCi = true;
    try {
      var rows = await rest('/coach_form_responses?' + pscope() + '&order=submitted_at.desc&limit=500&select=member_email,submitted_at') || [];
      var m = {}; rows.forEach(function(r){ var e = String(r.member_email || '').toLowerCase(); if (!m[e]) m[e] = r.submitted_at; });
      clx.lastCheckin = m;
    } catch(_){ clx.lastCheckin = {}; }
    clx.loadingCi = false;
  }
  function clxDayOf(c){
    var a = c.assignments || {}; var d = a.checkin_day;
    if (d === undefined || d === null || d === '') return null;
    return parseInt(d, 10);
  }
  /* clFiltered SHADOW: 200-tz-w1's body (status · tags · segments · search) + check-in day + sort */
  function clFiltered(){
    var q = clQ.toLowerCase();
    var rows = roster.filter(function(c){
      if (clStatus !== 'all' && c.status !== clStatus) return false;
      if (typeof w4bTagFilter !== 'undefined' && w4bTagFilter.length){
        var mine = w4bTagsOf(c.member_email).map(w4bTagKey);
        if (!w4bTagFilter.some(function(k){ return mine.indexOf(k) >= 0; })) return false;
      }
      if (typeof w1 !== 'undefined' && w1.segFilter && w1.segFilter.length){
        var sys = w1tagsOf(c);
        if (!w1.segFilter.some(function(k){ return sys.indexOf(k) >= 0; })) return false;
      }
      if (clx.day !== null && clxDayOf(c) !== clx.day) return false;
      if (!q) return true;
      return (nameOf(c) + ' ' + c.member_email).toLowerCase().indexOf(q) >= 0;
    });
    if (clx.sort === 'az') rows.sort(function(a, b){ return nameOf(a).localeCompare(nameOf(b)); });
    else if (clx.sort === 'active') rows.sort(function(a, b){ var ma = memberMap[String(a.member_email).toLowerCase()] || {}, mb = memberMap[String(b.member_email).toLowerCase()] || {}; return String(mb.last_active_at || '').localeCompare(String(ma.last_active_at || '')); });
    else if (clx.sort === 'checkin' && clx.lastCheckin) rows.sort(function(a, b){ var la = clx.lastCheckin[String(a.member_email).toLowerCase()] || '', lb = clx.lastCheckin[String(b.member_email).toLowerCase()] || ''; return lb.localeCompare(la); });
    return rows;
  }
  (function(){
    var t = setInterval(function(){ if ($c('cl-toolbar')){ clxEnsure(); clearInterval(t); } }, 300);
    setTimeout(function(){ clearInterval(t); }, 20000);
  })();
