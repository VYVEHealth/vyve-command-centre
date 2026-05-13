// =====================================================================
// VYVE Command Centre — Router
// Hash-based router. Loads pages/{slug}.html partials into #page-slot.
// Updates active nav item and topbar crumb. No framework dependencies.
// =====================================================================

(function(){
  'use strict';

  var SLOT      = '#page-slot';
  var NAV       = '#sidebar-nav';
  var CRUMB     = '#crumb-page';
  var DEFAULT   = 'brief';
  var pageCache = {};      // slug -> html string
  var current   = null;

  // ---------- Helpers ----------
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function validSlugs() {
    if (!window.VYVE_NAV) return [];
    var out = [];
    window.VYVE_NAV.forEach(function(s){ s.items.forEach(function(i){ out.push(i.slug); }); });
    return out;
  }

  function lookupItem(slug) {
    if (!window.VYVE_NAV) return null;
    for (var i=0;i<window.VYVE_NAV.length;i++) {
      var sec = window.VYVE_NAV[i];
      for (var j=0;j<sec.items.length;j++) {
        if (sec.items[j].slug === slug) return sec.items[j];
      }
    }
    return null;
  }

  function readHash() {
    var h = (location.hash || '').replace(/^#\/?/, '').trim();
    if (!h) return DEFAULT;
    return h.split('/')[0];
  }

  // ---------- Sidebar render ----------
  function renderSidebar() {
    var nav = $(NAV);
    if (!nav || !window.VYVE_NAV) return;
    var html = '';
    window.VYVE_NAV.forEach(function(section){
      html += '<div class="nav-section">';
      html += '<div class="nav-section-label">' + section.section + '</div>';
      section.items.forEach(function(item){
        var icon = (window.VYVE_ICONS && window.VYVE_ICONS[item.icon]) || '';
        var dot  = (item.status === 'stub') ? '<span class="badge-dot" title="Not yet built"></span>' : '';
        if (item.href) {
          // External link — opens in new tab, no hash routing
          var extMark = item.external ? '<span style="margin-left:auto;font-size:10px;opacity:.5">&#8599;</span>' : '';
          html += '<a class="nav-item" href="' + item.href + '" target="_blank" rel="noopener">' + icon + '<span>' + item.label + '</span>' + extMark + '</a>';
        } else {
          html += '<a class="nav-item" href="#/' + item.slug + '" data-page="' + item.slug + '">' + icon + '<span>' + item.label + '</span>' + dot + '</a>';
        }
      });
      html += '</div>';
    });
    nav.innerHTML = html;
  }

  function setActive(slug) {
    $$('.nav-item').forEach(function(el){
      if (el.getAttribute('data-page') === slug) el.classList.add('active');
      else el.classList.remove('active');
    });
    var item = lookupItem(slug);
    var crumb = $(CRUMB);
    if (crumb && item) crumb.textContent = item.label;
    document.title = (item ? item.label + ' · ' : '') + 'VYVE Command Centre';
  }

  // ---------- Page load ----------
  function loadPage(slug) {
    var item = lookupItem(slug);
    if (!item) {
      renderNotFound(slug);
      return;
    }
    current = slug;
    setActive(slug);

    if (pageCache[slug]) {
      injectPage(slug, pageCache[slug]);
      return;
    }

    var slot = $(SLOT);
    if (slot) slot.innerHTML = '<div class="empty"><span class="spinner"></span><h3>Loading</h3></div>';

    fetch('pages/' + slug + '.html', { cache: 'no-cache' })
      .then(function(res){
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function(html){
        pageCache[slug] = html;
        if (current === slug) injectPage(slug, html);
      })
      .catch(function(err){
        if (current !== slug) return;
        if (slot) {
          slot.innerHTML =
            '<div class="error-banner">Could not load page <strong>' + slug + '</strong> (' + err.message + ').</div>' +
            '<div class="empty"><span class="icon">!</span><h3>Page failed to load</h3><p>Check that <code>pages/' + slug + '.html</code> exists in the repo.</p></div>';
        }
      });
  }

  function injectPage(slug, html) {
    var slot = $(SLOT);
    if (!slot) return;
    slot.innerHTML = html;
    // Run any inline <script> tags inside the partial (browsers don't auto-execute them on innerHTML inject).
    var scripts = slot.querySelectorAll('script');
    scripts.forEach(function(old){
      var s = document.createElement('script');
      // copy attributes
      for (var i=0;i<old.attributes.length;i++) {
        var a = old.attributes[i];
        s.setAttribute(a.name, a.value);
      }
      s.text = old.textContent || '';
      old.parentNode.replaceChild(s, old);
    });
    // Fire a custom event so page-specific JS can hook in if needed.
    window.dispatchEvent(new CustomEvent('vyve:page', { detail: { slug: slug } }));
  }

  function renderNotFound(slug) {
    var slot = $(SLOT);
    if (!slot) return;
    slot.innerHTML =
      '<div class="page-header"><h1>Not found</h1><p>No route configured for <code>' + slug + '</code>.</p></div>' +
      '<div class="empty"><span class="icon">?</span><h3>Unknown page</h3><p>Pick something from the sidebar.</p></div>';
    var crumb = $(CRUMB);
    if (crumb) crumb.textContent = 'Not found';
  }

  // ---------- Topbar date ----------
  function paintDate() {
    var d = new Date();
    var fmt = d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    var el = document.getElementById('topbar-date');
    if (el) el.textContent = fmt;
  }

  // ---------- Bootstrap ----------
  function boot() {
    renderSidebar();
    paintDate();
    // Show the app shell. Auth gating will hide it later via lib/auth.js when wired.
    var app = document.getElementById('app');
    var login = document.getElementById('login');
    if (app) app.classList.add('ready');
    if (login) login.style.display = 'none';

    loadPage(readHash());
    window.addEventListener('hashchange', function(){ loadPage(readHash()); });
  }

  // Expose for other libs.
  window.VYVE_ROUTER = {
    go: function(slug){ location.hash = '#/' + slug; },
    reload: function(){ delete pageCache[current]; loadPage(current); },
    current: function(){ return current; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
