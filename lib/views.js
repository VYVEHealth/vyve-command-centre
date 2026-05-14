// =====================================================================
// VYVE Command Centre — Saved views
// Per-page named filter sets. Used by Tasks, Actions, CRM, Sessions, etc.
// Each view: { id, page, name, filters: {...}, created_at, pinned: bool }
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.store.views';
  var MAX = 200;

  function load(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function save(arr){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; }
    catch(e){ return false; }
  }
  function genId(){
    return 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function listForPage(page){
    return load().filter(function(v){ return v.page === page; });
  }

  function add(page, name, filters){
    if (!page || !name) return null;
    var all = load();
    var v = {
      id: genId(), page: page, name: name,
      filters: filters || {},
      created_at: new Date().toISOString(),
      pinned: false
    };
    all.unshift(v);
    if (all.length > MAX) all = all.slice(0, MAX);
    save(all);
    return v;
  }

  function remove(id){
    var all = load();
    var before = all.length;
    all = all.filter(function(v){ return v.id !== id; });
    if (all.length === before) return false;
    save(all);
    return true;
  }

  function pin(id, pinned){
    var all = load();
    var changed = false;
    all.forEach(function(v){
      if (v.id === id) { v.pinned = !!pinned; changed = true; }
    });
    if (changed) save(all);
    return changed;
  }

  function pinned(){
    return load().filter(function(v){ return v.pinned; });
  }

  window.VYVE_VIEWS = {
    listForPage: listForPage,
    add: add,
    remove: remove,
    pin: pin,
    pinned: pinned
  };
})();
