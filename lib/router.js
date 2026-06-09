// =====================================================================
// VYVE Command Centre — Router
// Hash-based router. Loads pages/{slug}.html partials into #page-slot.
// Updates top-nav active tab, sidebar drawer active item, and breadcrumbs.
// No framework dependencies.
// =====================================================================

(function(){
  'use strict';

  var SLOT       = '#page-slot';
  var NAV        = '#sidebar-nav';
  var TOPNAV     = '#topnav-tabs';
  var CRUMBS     = '#topnav-crumbs';
  var DEFAULT    = 'brief';
  var pageCache  = {};
  var current    = null;

  // ---------- Helpers ----------
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // Look up an item from VYVE_NAV by slug.
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

  // Look up a top-nav entry by slug (e.g. 'commercial' -> { label: 'Commercial', ... })
  function lookupTop(slug) {
    if (!window.VYVE_NAV_TOP) return null;
    for (var i=0;i<window.VYVE_NAV_TOP.length;i++) {
      if (window.VYVE_NAV_TOP[i].slug === slug) return window.VYVE_NAV_TOP[i];
    }
    return null;
  }

  // Find the section name for a given item slug (e.g. 'crm' -> 'Commercial')
  function sectionForSlug(slug) {
    if (!window.VYVE_NAV) return null;
    for (var i=0;i<window.VYVE_NAV.length;i++) {
      var sec = window.VYVE_NAV[i];
      for (var j=0;j<sec.items.length;j++) {
        if (sec.items[j].slug === slug) return sec.section;
      }
    }
    return null;
  }

  // Resolve any slug into a page route. Hub slugs ('commercial', 'marketing', etc)
  // are valid pages even though they don't appear in VYVE_NAV.
  function resolvePage(slug) {
    var hub = lookupTop(slug);
    if (hub && slug !== 'brief') return { slug: slug, label: hub.label, isHub: true };
    var item = lookupItem(slug);
    if (item) return { slug: slug, label: item.label, isHub: false };
    return null;
  }

  function readHash() {
    var h = (location.hash || '').replace(/^#\/?/, '').trim();
    if (!h) return DEFAULT;
    return h.split('/')[0];
  }

  // ---------- Top-nav render ----------
  function renderTopNav() {
    var host = $(TOPNAV);
    if (!host || !window.VYVE_NAV_TOP) return;
    var visible = window.VYVE_NAV_TOP.filter(function(tab){
      if (!window.VYVE_ACL) return true;
      return window.VYVE_ACL.canSeePage(tab.slug);
    });
    var html = visible.map(function(tab){
      var icon = (window.VYVE_ICONS && window.VYVE_ICONS[tab.icon]) || '';
      return '<a class="topnav-tab" href="#/' + tab.slug + '" data-top="' + tab.slug + '">' +
        icon +
        '<span class="topnav-tab-label">' + tab.label + '</span>' +
      '</a>';
    }).join('');
    host.innerHTML = html;
  }

  function setActiveTop(slug) {
    var topSlug = (window.VYVE_ROUTE_TO_TOP && window.VYVE_ROUTE_TO_TOP[slug]) || 'brief';
    $$('.topnav-tab').forEach(function(el){
      if (el.getAttribute('data-top') === topSlug) el.classList.add('active');
      else el.classList.remove('active');
    });
  }

  // ---------- Breadcrumbs ----------
  function renderCrumbs(slug) {
    var host = $(CRUMBS);
    if (!host) return;
    var topSlug = (window.VYVE_ROUTE_TO_TOP && window.VYVE_ROUTE_TO_TOP[slug]) || null;
    var topEntry = topSlug ? lookupTop(topSlug) : null;
    var pageEntry = resolvePage(slug);

    // Don't render crumbs on the Brief (home) page — keeps the launchpad clean
    if (slug === 'brief' || !pageEntry) {
      host.innerHTML = '';
      return;
    }

    var parts = [];
    parts.push('<a class="crumb" href="#/brief">VYVE</a>');
    if (topEntry && topEntry.slug !== slug) {
      parts.push('<span class="crumb-sep">/</span>');
      parts.push('<a class="crumb" href="#/' + topEntry.slug + '">' + topEntry.label + '</a>');
    }
    parts.push('<span class="crumb-sep">/</span>');
    parts.push('<span class="crumb crumb-current">' + pageEntry.label + '</span>');
    host.innerHTML = parts.join(' ');
  }

  // ---------- Sidebar drawer render ----------
  function renderSidebar() {
    var nav = $(NAV);
    if (!nav || !window.VYVE_NAV) return;
    var html = '';
    window.VYVE_NAV.forEach(function(section){
      // Filter items first
      var items = section.items.filter(function(item){
        if (item.href) return true; // external links always shown
        if (!window.VYVE_ACL) return true;
        return window.VYVE_ACL.canSeePage(item.slug);
      });
      if (!items.length) return; // drop empty sections
      html += '<div class="nav-section">';
      html += '<div class="nav-section-label">' + section.section + '</div>';
      items.forEach(function(item){
        var icon = (window.VYVE_ICONS && window.VYVE_ICONS[item.icon]) || '';
        var dot  = (item.status === 'stub') ? '<span class="badge-dot" title="Not yet built"></span>' : '';
        if (item.href) {
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

  function setActiveSidebar(slug) {
    $$('.nav-item').forEach(function(el){
      if (el.getAttribute('data-page') === slug) el.classList.add('active');
      else el.classList.remove('active');
    });
  }

  function setActive(slug) {
    setActiveTop(slug);
    setActiveSidebar(slug);
    renderCrumbs(slug);
    var entry = resolvePage(slug);
    document.title = (entry ? entry.label + ' \u00b7 ' : '') + 'VYVE Command Centre';
  }

  // ---------- Page load ----------
  function loadPage(slug) {
    var entry = resolvePage(slug);
    if (!entry) {
      renderNotFound(slug);
      return;
    }
    // ACL gate
    if (window.VYVE_ACL && !window.VYVE_ACL.canSeePage(slug)) {
      renderForbidden(slug);
      return;
    }
    current = slug;
    setActive(slug);

    // Never cache app-health or usage — they run live data checks on every load
    if (slug !== 'app-health' && slug !== 'usage' && slug !== 'retention' && slug !== 'activity' && slug !== 'activity-depth' && slug !== 'wellbeing' && slug !== 'platform' && pageCache[slug]) {
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
    var scripts = slot.querySelectorAll('script');
    scripts.forEach(function(old){
      var s = document.createElement('script');
      for (var i=0;i<old.attributes.length;i++) {
        var a = old.attributes[i];
        s.setAttribute(a.name, a.value);
      }
      // Don't set text content for external scripts (src attr) — causes replaceChild errors
      if (!old.src) {
        s.text = old.textContent || '';
      }
      old.parentNode.replaceChild(s, old);
    });
    window.dispatchEvent(new CustomEvent('vyve:page', { detail: { slug: slug } }));
    // Scroll to top on page change
    window.scrollTo(0, 0);
  }

  function renderForbidden(slug) {
    var slot = $(SLOT);
    if (!slot) return;
    var role = window.VYVE_ACL ? window.VYVE_ACL.role() : 'unknown';
    setActive(slug);
    slot.innerHTML =
      '<div class="page-hero">' +
        '<div class="eyebrow" style="color:var(--warning)">Restricted</div>' +
        '<h1 class="page-title">This page is lead-only</h1>' +
        '<p class="page-sub">Your role (<strong>' + role + '</strong>) doesn\u2019t have access to <code>' + slug + '</code>. If you need access, ask Lewis to update your permissions in Settings.</p>' +
        '<div style="margin-top:18px;display:flex;gap:10px"><a class="btn btn-primary" href="#/brief">Back to Brief</a><a class="btn btn-ghost" href="#/inbox">Open Inbox</a></div>' +
      '</div>';
  }

  function renderNotFound(slug) {
    var slot = $(SLOT);
    if (!slot) return;
    slot.innerHTML =
      '<div class="page-hero"><div class="eyebrow">Not found</div><h1 class="page-title">Page not found</h1><p class="page-sub">No route is configured for <code>' + slug + '</code>. Try the top navigation or press \u2318K to search.</p></div>';
    var crumbsHost = $(CRUMBS);
    if (crumbsHost) crumbsHost.innerHTML = '<a class="crumb" href="#/brief">VYVE</a> <span class="crumb-sep">/</span> <span class="crumb crumb-current">Not found</span>';
    document.title = 'Not found \u00b7 VYVE Command Centre';
  }

  // ---------- Bootstrap ----------
  function rerenderChrome() {
    renderTopNav();
    renderSidebar();
    if (current) setActive(current);
  }

  function boot() {
    renderTopNav();
    renderSidebar();
    var app = document.getElementById('app');
    var login = document.getElementById('login');
    if (app) app.classList.add('ready');
    if (login) login.style.display = 'none';

    loadPage(readHash());
    window.addEventListener('hashchange', function(){ loadPage(readHash()); });
  }

  window.VYVE_ROUTER = {
    go: function(slug){ location.hash = '#/' + slug; },
    reload: function(){ delete pageCache[current]; loadPage(current); },
    current: function(){ return current; },
    sectionForSlug: sectionForSlug,
    lookupItem: lookupItem,
    lookupTop: lookupTop,
    rerenderChrome: rerenderChrome
  };

  // Re-render chrome when ACL role changes (login, role update, etc.)
  window.addEventListener('vyve:acl:role', rerenderChrome);
  window.addEventListener('vyve:acl:change', rerenderChrome);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
