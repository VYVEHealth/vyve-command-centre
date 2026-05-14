// =====================================================================
// VYVE Command Centre — Quick Search (Cmd+K)
// Stub: opens/closes the overlay and listens for Cmd+K. Full fuzzy
// match + result rendering lands in commit 43.
// =====================================================================

(function(){
  'use strict';

  function $(sel){ return document.querySelector(sel); }

  function isMac(){
    return /Mac|iPhone|iPad/.test(navigator.platform);
  }

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

  // Minimal placeholder result rendering — full impl in commit 43.
  function render(query){
    var host = $('#quick-search-results');
    if (!host) return;
    host.innerHTML = '<div class="quick-search-empty">Quick search is being upgraded. Use the top tabs to navigate \u2014 full search lands shortly.</div>';
  }

  // Wire up triggers
  document.addEventListener('keydown', function(e){
    // Cmd+K (mac) / Ctrl+K (windows)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      toggle();
      return;
    }
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      close();
    }
  });

  document.addEventListener('click', function(e){
    // Click on the search button in topnav
    var btn = e.target.closest && e.target.closest('#topnav-search-btn');
    if (btn) { e.preventDefault(); open(); return; }
    // Click on backdrop closes
    if (e.target && e.target.classList && e.target.classList.contains('quick-search-backdrop')) {
      close();
    }
  });

  // Input typing — re-render results
  document.addEventListener('input', function(e){
    if (e.target && e.target.id === 'quick-search-input') {
      render(e.target.value);
    }
  });

  // Expose for other libs
  window.VYVE_QUICK_SEARCH = { open: open, close: close, toggle: toggle };
})();
