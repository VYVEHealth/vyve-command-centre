// =====================================================================
// VYVE Command Centre — Quick Search (Cmd+K)
// Fuzzy match across all pages with keyboard nav and recent jumps.
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.qs.recent';
  var MAX_RESULTS = 8;
  var MAX_RECENT = 5;

  function $(sel){ return document.querySelector(sel); }
  function $$(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // ---------- Index ----------
  function buildIndex(){
    var items = [];
    // Hub pages (top-level departments)
    if (window.VYVE_NAV_TOP) {
      window.VYVE_NAV_TOP.forEach(function(tab){
        if (tab.slug === 'brief') return; // brief is the home / launchpad
        items.push({
          slug: tab.slug,
          label: tab.label,
          section: 'Hubs',
          icon: tab.icon,
          isHub: true
        });
      });
    }
    // All flat nav items
    if (window.VYVE_NAV) {
      window.VYVE_NAV.forEach(function(section){
        section.items.forEach(function(item){
          if (!item.slug) return;
          items.push({
            slug: item.slug,
            label: item.label,
            section: section.section,
            icon: item.icon,
            isHub: false
          });
        });
      });
    }
    return items;
  }

  // ---------- Fuzzy match ----------
  // Score a query against a label. Returns -1 for no match, higher = better.
  function fuzzyScore(query, label){
    if (!query) return 0;
    var q = query.toLowerCase();
    var l = label.toLowerCase();
    if (l === q) return 1000;
    if (l.indexOf(q) === 0) return 500 - l.length;     // starts-with: strong
    if (l.indexOf(q) > 0) return 300 - l.indexOf(q);    // contains: medium
    // Token match: does each query char appear in label in order?
    var qi = 0;
    for (var i = 0; i < l.length && qi < q.length; i++) {
      if (l[i] === q[qi]) qi++;
    }
    if (qi === q.length) return 100 - (l.length - q.length); // subseq: weak
    return -1;
  }

  function scoreItem(query, item){
    if (!query) return 0;
    var labelScore = fuzzyScore(query, item.label);
    var slugScore = fuzzyScore(query, item.slug);
    var sectionScore = fuzzyScore(query, item.section);
    var best = Math.max(labelScore, slugScore * 0.6, sectionScore * 0.4);
    return best;
  }

  function search(query){
    var index = buildIndex();
    if (!query || !query.trim()) {
      // No query — show recents (or top items if no recents)
      var recents = getRecents();
      if (recents.length) {
        return recents
          .map(function(slug){ return index.find(function(i){ return i.slug === slug; }); })
          .filter(Boolean);
      }
      // Default: first few items from each hub
      return index.filter(function(i){ return i.isHub; }).slice(0, MAX_RESULTS);
    }
    var scored = index
      .map(function(i){ return { item: i, score: scoreItem(query, i) }; })
      .filter(function(r){ return r.score > 0; })
      .sort(function(a, b){ return b.score - a.score; })
      .slice(0, MAX_RESULTS);
    return scored.map(function(r){ return r.item; });
  }

  // ---------- Recents ----------
  function getRecents(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  function pushRecent(slug){
    try {
      var list = getRecents().filter(function(s){ return s !== slug; });
      list.unshift(slug);
      list = list.slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch(e){}
  }

  // ---------- Render ----------
  var activeIndex = 0;
  var lastResults = [];

  function render(query){
    var host = $('#quick-search-results');
    if (!host) return;
    var results = search(query);
    lastResults = results;
    activeIndex = 0;

    if (!results.length) {
      host.innerHTML = '<div class="quick-search-empty">No matches for &ldquo;' + escapeHtml(query) + '&rdquo;</div>';
      return;
    }

    var icons = window.VYVE_ICONS || {};
    var isEmpty = !query || !query.trim();
    var heading = isEmpty
      ? (getRecents().length ? 'Recent' : 'Jump to')
      : 'Results';

    var html = '<div class="qs-section">' + heading + '</div>';
    html += results.map(function(r, i){
      var icon = icons[r.icon] || '';
      return '<div class="qs-result' + (i === 0 ? ' active' : '') + '" data-slug="' + r.slug + '">' +
        '<div class="qs-result-icon">' + icon + '</div>' +
        '<div class="qs-result-text">' +
          '<div class="qs-result-title">' + escapeHtml(r.label) + '</div>' +
          '<div class="qs-result-sub">' + escapeHtml(r.section) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    host.innerHTML = html;
    bindResultHandlers();
  }

  function escapeHtml(s){
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bindResultHandlers(){
    $$('.qs-result').forEach(function(el){
      el.addEventListener('click', function(){
        var slug = el.getAttribute('data-slug');
        navigateTo(slug);
      });
      el.addEventListener('mouseenter', function(){
        $$('.qs-result').forEach(function(r){ r.classList.remove('active'); });
        el.classList.add('active');
        var nodes = $$('.qs-result');
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i] === el) { activeIndex = i; break; }
        }
      });
    });
  }

  function updateActive(){
    var nodes = $$('.qs-result');
    if (!nodes.length) return;
    if (activeIndex < 0) activeIndex = 0;
    if (activeIndex >= nodes.length) activeIndex = nodes.length - 1;
    nodes.forEach(function(el, i){
      if (i === activeIndex) {
        el.classList.add('active');
        // Scroll into view if needed
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

  function navigateTo(slug){
    if (!slug) return;
    pushRecent(slug);
    close();
    location.hash = '#/' + slug;
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

  // ---------- Wire up triggers ----------
  document.addEventListener('keydown', function(e){
    // Cmd+K (mac) / Ctrl+K (win/linux)
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
      activeIndex++;
      updateActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex--;
      updateActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      var nodes = $$('.qs-result');
      var node = nodes[activeIndex];
      if (node) navigateTo(node.getAttribute('data-slug'));
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

  // Track navigation to push to recents
  window.addEventListener('vyve:page', function(e){
    var slug = e.detail && e.detail.slug;
    if (slug && slug !== 'brief') pushRecent(slug);
  });

  window.VYVE_QUICK_SEARCH = { open: open, close: close, toggle: toggle };
})();
