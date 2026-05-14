// =====================================================================
// VYVE Command Centre — Entity Registry
// Central registry mapping entity_type -> { list, get, label, route, icon,
// pillar }. This lets Inbox, Search, Comments, Audit, and Notifications
// enumerate over every record type uniformly.
// =====================================================================

(function(){
  'use strict';

  function safe(fn){ try { return fn(); } catch(e){ return []; } }
  function safeOne(fn){ try { return fn(); } catch(e){ return null; } }

  // Each entity type definition
  var ENTITIES = {
    action: {
      label: 'Action plan',
      labelPlural: 'Action plans',
      icon: 'target',
      route: '#/action-plans',
      list: function(){ return safe(function(){ return window.VYVE_DATA.actions.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.actions.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){
        var t = (r.text || '').toString();
        return t.length > 60 ? t.slice(0, 58) + '\u2026' : t || 'Untitled action';
      },
      subOf: function(r){ return (r.member_name || '') + (r.due ? ' \u00b7 ' + r.due : ''); },
      ownerOf: function(r){ return r.member_id || r.member_name || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.due || null; }
    },
    task: {
      label: 'Task',
      labelPlural: 'Tasks',
      icon: 'check-square',
      route: '#/tasks',
      list: function(){ return safe(function(){ return window.VYVE_DATA.tasks.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.tasks.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || 'Untitled task'; },
      subOf: function(r){ return (r.owner || '') + (r.due ? ' \u00b7 ' + r.due : ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.due || null; }
    },
    deal: {
      label: 'Deal',
      labelPlural: 'Deals',
      icon: 'users',
      route: '#/crm',
      list: function(){ return safe(function(){ return window.VYVE_DATA.deals.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.deals.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.company || r.title || 'Untitled deal'; },
      subOf: function(r){
        var v = Number(r.value) || 0;
        var stage = r.stage || '';
        var close = r.expected_close || '';
        return stage + (v ? ' \u00b7 \u00a3' + v.toLocaleString() : '') + (close ? ' \u00b7 ' + close : '');
      },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.stage || ''; },
      dueOf: function(r){ return r.expected_close || null; }
    },
    session: {
      label: 'Session',
      labelPlural: 'Sessions',
      icon: 'calendar',
      route: '#/sessions',
      list: function(){ return safe(function(){ return window.VYVE_DATA.sessions.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.sessions.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || 'Session'; },
      subOf: function(r){ return (r.client || r.attendees || '') + (r.date ? ' \u00b7 ' + r.date : ''); },
      ownerOf: function(r){ return r.facilitator || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.date || null; }
    },
    compliance: {
      label: 'Compliance item',
      labelPlural: 'Compliance',
      icon: 'shield',
      route: '#/compliance',
      list: function(){ return safe(function(){ return window.VYVE_DATA.compliance.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.compliance.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || r.area || 'Compliance item'; },
      subOf: function(r){ return (r.area || '') + (r.due ? ' \u00b7 ' + r.due : ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.due || null; }
    },
    client: {
      label: 'Client',
      labelPlural: 'Clients',
      icon: 'briefcase',
      route: '#/clients',
      list: function(){ return safe(function(){ return window.VYVE_DATA.clients.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.clients.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.name || r.company || 'Client'; },
      subOf: function(r){ return (r.stage || '') + (r.contact ? ' \u00b7 ' + r.contact : ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.stage || ''; },
      dueOf: function(){ return null; }
    },
    intel: {
      label: 'Intel signal',
      labelPlural: 'Intel',
      icon: 'search',
      route: '#/intel',
      list: function(){ return safe(function(){ return window.VYVE_DATA.intel.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.intel.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || 'Signal'; },
      subOf: function(r){ return (r.type || r.source || ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.deadline || null; }
    },
    competitor: {
      label: 'Competitor signal',
      labelPlural: 'Competitors',
      icon: 'eye',
      route: '#/competitors',
      list: function(){ return safe(function(){ return window.VYVE_DATA.competitors.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.competitors.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || r.company || 'Competitor signal'; },
      subOf: function(r){ return (r.company || '') + (r.type ? ' \u00b7 ' + r.type : ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(){ return null; }
    },
    content: {
      label: 'Content piece',
      labelPlural: 'Content',
      icon: 'edit',
      route: '#/content',
      list: function(){ return safe(function(){ return window.VYVE_DATA.content.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.content.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || 'Content piece'; },
      subOf: function(r){ return (r.channel || '') + (r.status ? ' \u00b7 ' + r.status : ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.publish_date || null; }
    },
    podcast: {
      label: 'Podcast episode',
      labelPlural: 'Podcast',
      icon: 'mic',
      route: '#/podcast',
      list: function(){ return safe(function(){ return window.VYVE_DATA.podcast.all(); }); },
      get: function(id){
        return safeOne(function(){
          var arr = window.VYVE_DATA.podcast.all();
          for (var i=0;i<arr.length;i++) if (String(arr[i].id) === String(id)) return arr[i];
          return null;
        });
      },
      titleOf: function(r){ return r.title || 'Episode'; },
      subOf: function(r){ return (r.guest || '') + (r.status ? ' \u00b7 ' + r.status : ''); },
      ownerOf: function(r){ return r.owner || ''; },
      statusOf: function(r){ return r.status || ''; },
      dueOf: function(r){ return r.publish_date || null; }
    }
  };

  // Resolve a route to entity row for a specific id: "#/crm/deal:42"
  function deeplink(type, id){
    var def = ENTITIES[type];
    if (!def) return '#/brief';
    return def.route + (id ? '?id=' + encodeURIComponent(id) : '');
  }

  // Iterate all entity types
  function types(){ return Object.keys(ENTITIES); }

  window.VYVE_ENTITIES = {
    types: types,
    get: function(type){ return ENTITIES[type] || null; },
    deeplink: deeplink,
    // Convenience: list all records across all types, decorated with type metadata
    listAll: function(){
      var out = [];
      Object.keys(ENTITIES).forEach(function(type){
        var def = ENTITIES[type];
        (def.list() || []).forEach(function(r){
          out.push({
            type: type, def: def, record: r,
            id: r.id, title: def.titleOf(r), sub: def.subOf(r),
            status: def.statusOf(r), due: def.dueOf(r), owner: def.ownerOf(r)
          });
        });
      });
      return out;
    }
  };
})();
