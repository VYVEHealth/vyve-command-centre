// =====================================================================
// VYVE Command Centre — Quick Search (Cmd+K) v2
// Fuzzy match across pages AND records (deals, actions, tasks, sessions,
// compliance, clients, intel, competitors, content, podcast).
// Keyboard nav. Recents in localStorage.
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.qs.recent';
  var MAX_RESULTS = 12;
  var MAX_RECENT = 6;

  function $(sel){ return document.querySelector(sel); }
  function $$(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function escapeHtml(s){
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- Index ----------
  // Pages (hubs + nav items)
  function pageIndex(){
    var out = [];
    if (window.VYVE_NAV_TOP) {
      window.VYVE_NAV_TOP.forEach(function(tab){
        if (!tab.slug || tab.slug === 'brief') return;
        out.push({
          kind: 'page',
          slug: tab.slug,
          label: tab.label,
          section: 'Hubs',
          icon: tab.icon,
          isHub: true,
          target: '#/' + tab.slug
        });
      });
    }
    if (window.VYVE_NAV) {
      window.VYVE_NAV.forEach(function(section){
        section.items.forEach(function(item){
          if (!item.slug) return;
          out.push({
            kind: 'page',
            slug: item.slug,
            label: item.label,
            section: section.section,
            icon: item.icon,
            isHub: false,
            target: '#/' + item.slug
          });
        });
      });
    }
    return out;
  }

  // Records — pulled from the entity registry
  function recordIndex(){
    if (!window.VYVE_ENTITIES) return [];
    var out = [];
    var E = window.VYVE_ENTITIES;
    E.types().forEach(function(type){
      var def = E.get(type);
      (def.list() || []).forEach(function(r){
        var rid = r.id || r._id;
        if (!rid) return;
        out.push({
          kind: 'record',
          type: type,
          id: rid,
          label: def.titleOf(r),
          section: def.label,
          icon: def.icon,
          subLine: def.subOf(r),
          target: '__open_record__'
        });
      });
    });
    return out;
  }

  // ---------- Fuzzy match ----------
  function fuzzyScore(query, label){
    if (!query) return 0;
    var q = query.toLowerCase();
    var l = (label || '').toLowerCase();
    if (l === q) return 1000;
    if (l.indexOf(q) === 0) return 500 - l.length;
    if (l.indexOf(q) > 0) return 300 - l.indexOf(q);
    var qi = 0;
    for (var i = 0; i < l.length && qi < q.length; i++) {
      if (l[i] === q[qi]) qi++;
    }
    if (qi === q.length) return 100 - (l.length - q.length);
    return -1;
  }

  function scoreItem(query, item){
    if (!query) return 0;
    var labelScore = fuzzyScore(query, item.label);
    var subScore   = item.subLine ? fuzzyScore(query, item.subLine) * 0.5 : 0;
    var sectScore  = fuzzyScore(query, item.section) * 0.3;
    return Math.max(labelScore, subScore, sectScore);
  }

  function search(query){
    var allItems = pageIndex().concat(recordIndex());
    if (!query || !query.trim()) {
      var recents = getRecents();
      if (recents.length) {
        return recents
          .map(function(key){
            return allItems.find(function(i){ return itemKey(i) === key; });
          })
          .filter(Boolean)
          .slice(0, MAX_RESULTS);
      }
      // Default: hub pages + a few recent records
      var hubs = allItems.filter(function(i){ return i.kind === 'page' && i.isHub; });
      return hubs.slice(0, MAX_RESULTS);
    }
    var scored = allItems
      .map(function(i){ return { item: i, score: scoreItem(query, i) }; })
      .filter(function(r){ return r.score > 0; })
      .sort(function(a, b){
        if (a.score !== b.score) return b.score - a.score;
        // Tie-break: pages before records
        if (a.item.kind !== b.item.kind) return a.item.kind === 'page' ? -1 : 1;
        return 0;
      })
      .slice(0, MAX_RESULTS);
    return scored.map(function(r){ return r.item; });
  }

  function itemKey(item){
    return item.kind + ':' + (item.type || '') + ':' + (item.id || item.slug);
  }

  // ---------- Recents ----------
  function getRecents(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function pushRecent(key){
    try {
      var list = getRecents().filter(function(k){ return k !== key; });
      list.unshift(key);
      list = list.slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch(e){}
  }

  // ---------- Render ----------
  var activeIndex = 0;

  function render(query){
    var host = $('#quick-search-results');
    if (!host) return;
    var results = search(query);
    activeIndex = 0;

    if (!results.length) {
      host.innerHTML = '<div class="quick-search-empty">No matches for &ldquo;' + escapeHtml(query) + '&rdquo;</div>';
      return;
    }

    var icons = window.VYVE_ICONS || {};
    var isEmpty = !query || !query.trim();

    // Group: pages first, then records
    var pages = results.filter(function(r){ return r.kind === 'page'; });
    var records = results.filter(function(r){ return r.kind === 'record'; });

    var html = '';
    if (pages.length) {
      html += '<div class="qs-section">' + (isEmpty ? (getRecents().length ? 'Recent' : 'Jump to') : 'Pages') + '</div>';
      html += pages.map(function(r, i){
        var icon = icons[r.icon] || '';
        var isActive = (i === 0 && !records.length) || (results.indexOf(r) === activeIndex);
        return '<div class="qs-result' + (isActive ? ' active' : '') + '" data-idx="' + results.indexOf(r) + '">' +
          '<div class="qs-result-icon">' + icon + '</div>' +
          '<div class="qs-result-text">' +
            '<div class="qs-result-title">' + escapeHtml(r.label) + '</div>' +
            '<div class="qs-result-sub">' + escapeHtml(r.section) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    if (records.length) {
      html += '<div class="qs-section">Records</div>';
      html += records.map(function(r){
        var icon = icons[r.icon] || '';
        var isActive = results.indexOf(r) === activeIndex;
        return '<div class="qs-result' + (isActive ? ' active' : '') + '" data-idx="' + results.indexOf(r) + '">' +
          '<div class="qs-result-icon">' + icon + '</div>' +
          '<div class="qs-result-text">' +
            '<div class="qs-result-title">' + escapeHtml(r.label) + '</div>' +
            '<div class="qs-result-sub">' + escapeHtml(r.section) + (r.subLine ? ' \u00b7 ' + escapeHtml(r.subLine) : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    host.innerHTML = html;
    bindResultHandlers(results);
  }

  function bindResultHandlers(results){
    $$('.qs-result').forEach(function(el){
      el.addEventListener('click', function(){
        var idx = Number(el.getAttribute('data-idx'));
        var r = results[idx];
        if (r) selectResult(r);
      });
      el.addEventListener('mouseenter', function(){
        var idx = Number(el.getAttribute('data-idx'));
        activeIndex = idx;
        updateActive(results);
      });
    });
  }

  function updateActive(results){
    $$('.qs-result').forEach(function(el){
      var idx = Number(el.getAttribute('data-idx'));
      if (idx === activeIndex) {
        el.classList.add('active');
        var host = $('#quick-search-results');
        if (host) {
          var r = el.getBoundingClientRect();
          var hr = host.getBoundingClientRect();
          if (r.bottom > hr.bottom) host.scrollTop += (r.bottom - hr.bottom + 8);
          else if (r.top < hr.top) host.scrollTop -= (hr.top - r.top + 8);
        }
      } else {
        el.classList.remove('active');
      }
    });
  }

  function selectResult(r){
    pushRecent(itemKey(r));
    close();
    if (r.kind === 'page') {
      location.hash = r.target;
    } else if (r.kind === 'record') {
      // Open record modal directly
      if (window.VYVE_WIDGETS && window.VYVE_WIDGETS.recordModal) {
        // Small delay to let overlay close animation finish
        setTimeout(function(){
          window.VYVE_WIDGETS.recordModal(r.type, r.id);
        }, 60);
      } else {
        // Fallback: navigate to the page that hosts this entity type
        var def = window.VYVE_ENTITIES && window.VYVE_ENTITIES.get(r.type);
        if (def) location.hash = def.route;
      }
    }
  }

  // ---------- Open / close ----------
  function isOpen(){
    var ov = $('#quick-search');
    return ov && ov.classList.contains('open');
  }

  function open(){
    var ov = $('#quick-search');
    if (!ov) return;
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    var input = $('#quick-search-input');
    if (input) {
      input.value = '';
      setTimeout(function(){ input.focus(); }, 30);
    }
    render('');
  }

  function close(){
    var ov = $('#quick-search');
    if (!ov) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
  }

  function toggle(){ isOpen() ? close() : open(); }

  // ---------- Wire up ----------
  document.addEventListener('keydown', function(e){
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      toggle();
      return;
    }
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      var nodes = $$('.qs-result');
      activeIndex = Math.min(nodes.length - 1, activeIndex + 1);
      // Build results from current state to update
      var query = ($('#quick-search-input') || {}).value || '';
      updateActive(search(query));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
      var q2 = ($('#quick-search-input') || {}).value || '';
      updateActive(search(q2));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      var q3 = ($('#quick-search-input') || {}).value || '';
      var results = search(q3);
      var r = results[activeIndex];
      if (r) selectResult(r);
    }
  });

  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('#topnav-search-btn');
    if (btn) { e.preventDefault(); open(); return; }
    if (e.target && e.target.classList && e.target.classList.contains('quick-search-backdrop')) {
      close();
    }
  });

  document.addEventListener('input', function(e){
    if (e.target && e.target.id === 'quick-search-input') {
      render(e.target.value);
    }
  });

  // Track navigation to push to recents for pages
  window.addEventListener('vyve:page', function(e){
    var slug = e.detail && e.detail.slug;
    if (slug && slug !== 'brief') pushRecent('page::' + slug);
  });

  window.VYVE_QUICK_SEARCH = { open: open, close: close, toggle: toggle };
})();
