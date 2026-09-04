// =====================================================================
// VYVE Command Centre — Keyboard shortcuts
// Global + page-scoped shortcuts. Help overlay on "?".
// =====================================================================

(function(){
  'use strict';

  var GLOBAL = [
    { keys: '?',       label: 'Show keyboard shortcuts',     scope: 'global', action: function(){ openHelp(); } },
    { keys: '/',       label: 'Focus search (Cmd+K)',         scope: 'global', action: function(){ if (window.VYVE_QUICK_SEARCH) window.VYVE_QUICK_SEARCH.open(); } },
    { keys: 'g h',     label: 'Go to Home',                  scope: 'global', action: function(){ location.hash = '#/home'; } },
    { keys: 'g d',     label: 'Go to Documents',             scope: 'global', action: function(){ location.hash = '#/documents'; } },
    { keys: 'g c',     label: 'Go to CRM',                   scope: 'global', action: function(){ location.hash = '#/crm'; } },
    { keys: 'g t',     label: 'Go to Tasks',                 scope: 'global', action: function(){ location.hash = '#/tasks'; } },
    { keys: 'g a',     label: 'Go to Analytics',             scope: 'global', action: function(){ location.hash = '#/usage'; } },
    { keys: 'g s',     label: 'Go to Settings',              scope: 'global', action: function(){ location.hash = '#/settings'; } },
    { keys: 'g f',     label: 'Go to Finance',               scope: 'global', action: function(){ location.hash = '#/finance'; } },
    { keys: 'g x',     label: 'Go to Active Users',          scope: 'global', action: function(){ location.hash = '#/active-users'; } },
    { keys: 'g r',     label: 'Refresh current page',        scope: 'global', action: function(){ if (window.VYVE_ROUTER) window.VYVE_ROUTER.reload(); } },
    { keys: 'n',       label: 'New (on list pages)',         scope: 'page'   },
    { keys: 'e',       label: 'Edit selected (on list pages)', scope: 'page' },
    { keys: 'x',       label: 'Toggle select on focused row', scope: 'page'  },
    { keys: 'Esc',     label: 'Clear selection / close',     scope: 'page'   }
  ];

  // ---------- State ----------
  var bufferedKey = null;     // for two-key sequences like "g i"
  var bufferedAt = 0;
  var BUFFER_MS = 1000;

  function isTypingTarget(target){
    if (!target) return false;
    var t = target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  function clearBuffer(){ bufferedKey = null; bufferedAt = 0; }

  // ---------- Handler ----------
  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    // Don't capture if any overlay is open
    if (document.querySelector('.modal-overlay.open') || document.querySelector('#quick-search.open')) return;

    var key = e.key;

    // "?" 
    if (key === '?') { e.preventDefault(); openHelp(); return; }
    // "/"
    if (key === '/') { e.preventDefault(); if (window.VYVE_QUICK_SEARCH) window.VYVE_QUICK_SEARCH.open(); return; }
    // Esc
    if (key === 'Escape') {
      if (window.VYVE_HELP_OPEN) { closeHelp(); return; }
      if (window.VYVE_BULK && window.VYVE_BULK.active()) { window.VYVE_BULK.clear(); return; }
    }

    // Two-key sequences: "g b", "g i", etc.
    var now = Date.now();
    if (bufferedKey && (now - bufferedAt) < BUFFER_MS) {
      var combo = bufferedKey + ' ' + key.toLowerCase();
      clearBuffer();
      var match = GLOBAL.find(function(s){ return s.keys === combo; });
      if (match && match.action) { e.preventDefault(); match.action(); return; }
      return;
    }

    if (key === 'g') {
      bufferedKey = 'g';
      bufferedAt = now;
      // Don't preventDefault — let the user still type "g" in a future input
      return;
    }

    // Single-key page-scoped shortcuts
    if (key === 'n' && window.VYVE_PAGE_SHORTCUTS && window.VYVE_PAGE_SHORTCUTS.onNew) {
      e.preventDefault(); window.VYVE_PAGE_SHORTCUTS.onNew(); return;
    }
    if (key === 'e' && window.VYVE_PAGE_SHORTCUTS && window.VYVE_PAGE_SHORTCUTS.onEdit) {
      e.preventDefault(); window.VYVE_PAGE_SHORTCUTS.onEdit(); return;
    }
    if ((key === 'x' || key === 'X') && window.VYVE_BULK) {
      e.preventDefault(); window.VYVE_BULK.toggleFocused(); return;
    }
  });

  // ---------- Help overlay ----------
  function openHelp(){
    if (window.VYVE_HELP_OPEN) return;
    window.VYVE_HELP_OPEN = true;
    var ov = document.createElement('div');
    ov.className = 'modal-overlay open';
    ov.id = 'shortcut-help';
    ov.innerHTML = '<div class="modal" style="max-width:560px">' +
      '<div class="modal-header">' +
        '<div class="modal-title">Keyboard shortcuts</div>' +
        '<button class="modal-close" type="button">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
        renderShortcuts() +
        '<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted)">Press <kbd>?</kbd> any time to see this list. Page-scoped shortcuts only work on list pages.</div>' +
      '</div>' +
    '</div>';
    ov.querySelector('.modal-close').addEventListener('click', closeHelp);
    ov.addEventListener('click', function(e){ if (e.target === ov) closeHelp(); });
    document.body.appendChild(ov);
  }

  function closeHelp(){
    var ov = document.getElementById('shortcut-help');
    if (ov) ov.remove();
    window.VYVE_HELP_OPEN = false;
  }

  function renderShortcuts(){
    function group(scope, label){
      var items = GLOBAL.filter(function(s){ return s.scope === scope; });
      if (!items.length) return '';
      return '<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 8px">' + label + '</div>' +
        '<div style="display:grid;grid-template-columns:140px 1fr;gap:8px 16px;font-size:13px">' +
          items.map(function(s){
            var parts = s.keys.split(' ').map(function(k){ return '<kbd>' + k + '</kbd>'; }).join(' then ');
            return '<div>' + parts + '</div><div style="color:var(--text)">' + s.label + '</div>';
          }).join('') +
        '</div>';
    }
    return group('global', 'Global navigation') + group('page', 'On list pages');
  }

  // ---------- Bulk select primitive ----------
  // Pages opt in via:
  //   VYVE_BULK.enable({
  //     selector: '.kanban-card',      // CSS selector for selectable rows
  //     idAttr: 'data-id',              // attribute holding the row's id
  //     onAction: function(action, ids){...}  // handle bulk actions
  //   });

  var BULK = {
    cfg: null,
    selected: new Set(),
    focused: null,

    enable: function(cfg){
      this.disable();                                    // clear any previous binding
      this.cfg = cfg;
      this.selected = new Set();
      this.focused = null;
      this.paint();
    },
    disable: function(){
      this.cfg = null;
      this.selected.clear();
      this.focused = null;
      var bar = document.getElementById('bulk-action-bar');
      if (bar) bar.remove();
    },
    active: function(){ return !!this.cfg; },
    isSelected: function(id){ return this.selected.has(id); },
    toggleFocused: function(){
      if (!this.cfg || !this.focused) return;
      this.toggle(this.focused);
    },
    toggle: function(id){
      if (this.selected.has(id)) this.selected.delete(id);
      else this.selected.add(id);
      this.paint();
    },
    clear: function(){
      this.selected.clear();
      this.paint();
    },
    paint: function(){
      // Visual selection state
      if (!this.cfg) return;
      var sel = this.cfg.selector;
      var idAttr = this.cfg.idAttr || 'data-id';
      var rows = document.querySelectorAll(sel);
      var self = this;
      rows.forEach(function(r){
        var id = r.getAttribute(idAttr);
        if (self.selected.has(id)) r.classList.add('bulk-selected');
        else r.classList.remove('bulk-selected');
      });
      // Action bar
      var bar = document.getElementById('bulk-action-bar');
      if (this.selected.size === 0) {
        if (bar) bar.remove();
        return;
      }
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'bulk-action-bar';
        bar.className = 'bulk-action-bar';
        document.body.appendChild(bar);
      }
      var actions = (this.cfg.actions || ['delete']).map(function(a){
        var color = a === 'delete' ? 'color:var(--danger)' : '';
        return '<button class="btn btn-ghost btn-sm" data-bulk-action="' + a + '" style="' + color + '">' + a.charAt(0).toUpperCase() + a.slice(1) + '</button>';
      }).join('');
      bar.innerHTML = '<span style="font-weight:600">' + this.selected.size + ' selected</span>' +
        '<span style="color:var(--text-muted);font-size:12px">Press <kbd>esc</kbd> to clear</span>' +
        actions +
        '<button class="btn btn-ghost btn-sm" data-bulk-clear>Clear</button>';
      var cfg = this.cfg;
      var selSet = this.selected;
      bar.querySelectorAll('[data-bulk-action]').forEach(function(b){
        b.addEventListener('click', function(){
          var action = b.getAttribute('data-bulk-action');
          if (cfg.onAction) cfg.onAction(action, Array.from(selSet));
        });
      });
      bar.querySelector('[data-bulk-clear]').addEventListener('click', function(){
        BULK.clear();
      });
    }
  };

  window.VYVE_BULK = BULK;

  // Clear bulk when navigating
  window.addEventListener('vyve:page', function(){ BULK.disable(); });

  // Clear page-scoped shortcuts when navigating
  window.addEventListener('vyve:page', function(){ window.VYVE_PAGE_SHORTCUTS = null; });

  // Help available on the topbar
  window.VYVE_SHORTCUTS = { open: openHelp, list: GLOBAL };
})();
