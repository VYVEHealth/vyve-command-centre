// =====================================================================
// VYVE Command Centre — Views & Filters UI
// Generic mountable filter chip bar + saved views row.
//
// Usage:
//   var bar = VYVE_VIEWS_UI.mount(containerEl, {
//     page: 'tasks',                           // localStorage key namespace
//     fields: [                                // available filter fields
//       { key: 'status', label: 'Status', type: 'select', options: ['todo','doing','blocked','done'] },
//       { key: 'owner',  label: 'Owner',  type: 'select', dynamicOptions: function(){ return uniqueOwners(items); } },
//       { key: 'due',    label: 'Due',    type: 'date-range' }
//     ],
//     defaultFilters: {},                      // optional initial filters
//     onChange: function(filters){ ... }       // called whenever filters change
//   });
//   bar.setOptions(...);                       // update dynamic options
//   bar.getFilters();                          // current filter state
//
// =====================================================================

(function(){
  'use strict';

  function escape(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isFilterEmpty(filters){
    if (!filters) return true;
    var keys = Object.keys(filters);
    for (var i = 0; i < keys.length; i++) {
      var v = filters[keys[i]];
      if (v == null) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'object' && Object.keys(v).length === 0) continue;
      if (v === '') continue;
      return false;
    }
    return true;
  }

  function describeChip(field, value){
    if (field.type === 'select') return field.label + ': ' + value;
    if (field.type === 'date-range') {
      if (value === 'today') return 'Due today';
      if (value === 'this-week') return 'Due this week';
      if (value === 'overdue') return 'Overdue';
      if (value === 'no-due') return 'No due date';
      return field.label + ': ' + value;
    }
    return field.label + ': ' + value;
  }

  function mount(container, opts){
    if (!container) return null;
    opts = opts || {};
    var page = opts.page || 'list';
    var fields = opts.fields || [];
    var filters = Object.assign({}, opts.defaultFilters || {});
    var activeViewId = null;

    function renderViews(){
      var V = window.VYVE_VIEWS;
      var viewsForPage = V ? V.listForPage(page) : [];
      if (!viewsForPage.length) return '';
      return '<div class="views-row">' +
        viewsForPage.map(function(v){
          var isActive = activeViewId === v.id;
          return '<button type="button" class="view-tab' + (isActive ? ' active' : '') + '" data-view-id="' + v.id + '">' +
            escape(v.name) +
            (v.pinned ? '<span class="view-pin" title="Pinned">★</span>' : '') +
          '</button>';
        }).join('') +
        (activeViewId ? '<button type="button" class="view-tab" data-view-action="pin" title="Pin to Brief">' + (currentViewIsPinned() ? 'Unpin' : 'Pin') + '</button>' : '') +
        (activeViewId ? '<button type="button" class="view-tab" data-view-action="delete" style="color:var(--danger)">Delete view</button>' : '') +
      '</div>';
    }

    function currentViewIsPinned(){
      if (!window.VYVE_VIEWS || !activeViewId) return false;
      var v = window.VYVE_VIEWS.listForPage(page).find(function(v){ return v.id === activeViewId; });
      return !!(v && v.pinned);
    }

    function renderChips(){
      var chips = '';
      Object.keys(filters).forEach(function(key){
        var val = filters[key];
        if (val == null || val === '') return;
        var field = fields.find(function(f){ return f.key === key; });
        if (!field) return;
        chips += '<span class="filter-chip" data-chip="' + key + '">' +
          escape(describeChip(field, val)) +
          '<button type="button" class="chip-x" data-chip-remove="' + key + '" aria-label="Remove">×</button>' +
        '</span>';
      });
      // Add filter dropdown
      chips += '<button type="button" class="filter-add" data-role="add-filter">+ Add filter</button>';
      // Save view button
      if (!isFilterEmpty(filters) && !activeViewId) {
        chips += '<button type="button" class="filter-add" data-role="save-view" style="border-style:solid;color:var(--accent);border-color:var(--accent)">☆ Save view</button>';
      }
      // Clear all button
      if (!isFilterEmpty(filters)) {
        chips += '<button type="button" class="filter-add" data-role="clear-all" style="border-color:transparent;color:var(--text-muted)">Clear all</button>';
      }
      return '<div class="filter-chip-bar">' + chips + '</div>';
    }

    function refresh(){
      container.innerHTML = renderViews() + renderChips();
      bind();
    }

    function bind(){
      // Chip remove buttons
      container.querySelectorAll('[data-chip-remove]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          var k = btn.getAttribute('data-chip-remove');
          delete filters[k];
          activeViewId = null;
          refresh();
          notify();
        });
      });
      // Add filter
      var addBtn = container.querySelector('[data-role="add-filter"]');
      if (addBtn) addBtn.addEventListener('click', function(e){
        showAddDropdown(addBtn);
      });
      // Save view
      var saveBtn = container.querySelector('[data-role="save-view"]');
      if (saveBtn) saveBtn.addEventListener('click', function(){
        var name = prompt('Name this view:');
        if (!name) return;
        var V = window.VYVE_VIEWS;
        if (V) {
          var v = V.add(page, name, filters);
          if (v) {
            activeViewId = v.id;
            refresh();
            if (window.VYVE_UI && window.VYVE_UI.toast) window.VYVE_UI.toast('View "' + name + '" saved', 'success');
          }
        }
      });
      // Clear all
      var clearBtn = container.querySelector('[data-role="clear-all"]');
      if (clearBtn) clearBtn.addEventListener('click', function(){
        filters = {};
        activeViewId = null;
        refresh();
        notify();
      });
      // View tabs
      container.querySelectorAll('[data-view-id]').forEach(function(tab){
        tab.addEventListener('click', function(){
          var id = tab.getAttribute('data-view-id');
          var V = window.VYVE_VIEWS;
          if (!V) return;
          var v = V.listForPage(page).find(function(v){ return v.id === id; });
          if (!v) return;
          filters = Object.assign({}, v.filters || {});
          activeViewId = id;
          refresh();
          notify();
        });
      });
      // View actions
      var pinBtn = container.querySelector('[data-view-action="pin"]');
      if (pinBtn) pinBtn.addEventListener('click', function(){
        if (!window.VYVE_VIEWS) return;
        window.VYVE_VIEWS.pin(activeViewId, !currentViewIsPinned());
        refresh();
      });
      var delBtn = container.querySelector('[data-view-action="delete"]');
      if (delBtn) delBtn.addEventListener('click', function(){
        if (!window.VYVE_VIEWS || !activeViewId) return;
        if (!confirm('Delete this saved view?')) return;
        window.VYVE_VIEWS.remove(activeViewId);
        activeViewId = null;
        filters = {};
        refresh();
        notify();
      });
    }

    function showAddDropdown(anchorBtn){
      // Remove any existing dropdown
      var existing = document.querySelector('.filter-add-menu');
      if (existing) existing.remove();

      var avail = fields.filter(function(f){ return !(f.key in filters); });
      if (!avail.length) {
        if (window.VYVE_UI && window.VYVE_UI.toast) window.VYVE_UI.toast('All filters in use', 'info');
        return;
      }
      var menu = document.createElement('div');
      menu.className = 'filter-add-menu';
      menu.style.cssText = 'position:absolute;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:6px;box-shadow:var(--shadow-lg);z-index:1000;min-width:200px;max-height:340px;overflow-y:auto';
      menu.innerHTML = avail.map(function(f){
        return '<button type="button" data-field-key="' + f.key + '" style="display:block;width:100%;text-align:left;padding:7px 10px;background:transparent;border:0;border-radius:var(--r-sm);font-size:13px;color:var(--text);cursor:pointer;font-family:inherit">' + escape(f.label) + '</button>';
      }).join('');
      menu.querySelectorAll('button[data-field-key]').forEach(function(opt){
        opt.addEventListener('mouseenter', function(){ opt.style.background = 'var(--surface-2)'; });
        opt.addEventListener('mouseleave', function(){ opt.style.background = 'transparent'; });
        opt.addEventListener('click', function(){
          var key = opt.getAttribute('data-field-key');
          var field = fields.find(function(f){ return f.key === key; });
          menu.remove();
          if (field) chooseValueFor(field);
        });
      });
      var rect = anchorBtn.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      document.body.appendChild(menu);
      setTimeout(function(){
        document.addEventListener('click', function dismiss(e){
          if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', dismiss); }
        });
      }, 50);
    }

    function chooseValueFor(field){
      var existing = document.querySelector('.filter-value-menu');
      if (existing) existing.remove();

      var menu = document.createElement('div');
      menu.className = 'filter-value-menu';
      menu.style.cssText = 'position:fixed;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px;box-shadow:var(--shadow-lg);z-index:1000;min-width:240px;left:50%;top:30%;transform:translateX(-50%)';

      var options = [];
      if (field.type === 'select') {
        options = field.dynamicOptions ? field.dynamicOptions() : (field.options || []);
        menu.innerHTML = '<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">' + escape(field.label) + '</div>' +
          options.map(function(opt){
            return '<button type="button" data-val="' + escape(opt) + '" style="display:block;width:100%;text-align:left;padding:6px 10px;background:transparent;border:0;border-radius:var(--r-sm);font-size:13px;color:var(--text);cursor:pointer;font-family:inherit">' + escape(opt) + '</button>';
          }).join('');
      } else if (field.type === 'date-range') {
        options = ['today', 'this-week', 'overdue', 'no-due'];
        menu.innerHTML = '<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">' + escape(field.label) + '</div>' +
          options.map(function(opt){
            return '<button type="button" data-val="' + escape(opt) + '" style="display:block;width:100%;text-align:left;padding:6px 10px;background:transparent;border:0;border-radius:var(--r-sm);font-size:13px;color:var(--text);cursor:pointer;font-family:inherit">' + describeChip(field, opt) + '</button>';
          }).join('');
      }

      menu.querySelectorAll('button[data-val]').forEach(function(opt){
        opt.addEventListener('mouseenter', function(){ opt.style.background = 'var(--surface-2)'; });
        opt.addEventListener('mouseleave', function(){ opt.style.background = 'transparent'; });
        opt.addEventListener('click', function(){
          filters[field.key] = opt.getAttribute('data-val');
          activeViewId = null;
          menu.remove();
          refresh();
          notify();
        });
      });
      document.body.appendChild(menu);
      setTimeout(function(){
        document.addEventListener('click', function dismiss(e){
          if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', dismiss); }
        });
      }, 50);
    }

    function notify(){
      if (opts.onChange) opts.onChange(filters);
    }

    // Public API on the returned bar instance
    var api = {
      getFilters: function(){ return Object.assign({}, filters); },
      setOptions: function(){ refresh(); }, // re-render (dynamic options recomputed)
      refresh: refresh
    };

    refresh();
    return api;
  }

  // Apply a filter set to a list of items. Returns a filtered array.
  // Generic implementations for common field types.
  function applyFilters(items, filters, fieldMap){
    if (!filters || !Object.keys(filters).length) return items;
    fieldMap = fieldMap || {};
    return items.filter(function(item){
      for (var k in filters) {
        var v = filters[k];
        if (v == null || v === '') continue;
        var getter = fieldMap[k] || function(it){ return it[k]; };
        var itemVal = getter(item);
        if (k === 'due' || (fieldMap[k] && fieldMap[k]._dateRange)) {
          // Date range special filter
          var today = new Date(); today.setHours(0,0,0,0);
          var d = itemVal ? new Date(itemVal) : null;
          if (v === 'today') {
            if (!d) return false;
            if (d < today || d.getTime() >= today.getTime() + 86400000) return false;
          } else if (v === 'this-week') {
            if (!d) return false;
            if (d < today || d > new Date(today.getTime() + 7 * 86400000)) return false;
          } else if (v === 'overdue') {
            if (!d || d >= today) return false;
          } else if (v === 'no-due') {
            if (d) return false;
          }
        } else {
          // Exact-match (case-insensitive)
          var s1 = String(itemVal || '').toLowerCase();
          var s2 = String(v).toLowerCase();
          if (s1 !== s2) return false;
        }
      }
      return true;
    });
  }

  window.VYVE_VIEWS_UI = {
    mount: mount,
    applyFilters: applyFilters
  };
})();
