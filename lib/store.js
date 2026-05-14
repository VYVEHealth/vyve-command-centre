// =====================================================================
// VYVE Command Centre — Storage abstraction
// Audit trail + soft delete + restore layer over localStorage (MVP).
// Same API will back onto Supabase tables once Dean ships the schema.
// =====================================================================

(function(){
  'use strict';

  var STORAGE_PREFIX = 'vyve.store.';
  var AUDIT_KEY      = STORAGE_PREFIX + 'audit';
  var TRASH_KEY      = STORAGE_PREFIX + 'trash';
  var MAX_AUDIT_ENTRIES = 5000;
  var MAX_TRASH_ENTRIES = 500;

  function load(key){
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  function save(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e){ return false; }
  }

  // ----- Audit log -----
  // Entry: { at: ISO, who: 'lewis@vyvehealth.co.uk', type: 'deal', id: '42', op: 'create'|'update'|'delete'|'restore', diff: {field: [from, to]} }
  function logChange(type, id, who, op, diff){
    var log = load(AUDIT_KEY);
    log.unshift({
      at: new Date().toISOString(),
      who: who || (window.VYVE_CURRENT_USER || 'unknown'),
      type: type, id: String(id),
      op: op, diff: diff || null
    });
    if (log.length > MAX_AUDIT_ENTRIES) log = log.slice(0, MAX_AUDIT_ENTRIES);
    save(AUDIT_KEY, log);
    try { window.dispatchEvent(new CustomEvent('vyve:audit', { detail: { type: type, id: id, op: op } })); } catch(e){}
  }
  function history(type, id){
    if (!type || !id) return [];
    var log = load(AUDIT_KEY);
    return log.filter(function(e){ return e.type === type && String(e.id) === String(id); });
  }
  function allChanges(limit){
    var log = load(AUDIT_KEY);
    return limit ? log.slice(0, limit) : log;
  }

  // ----- Soft delete / trash -----
  function softDelete(type, id, record, who){
    var trash = load(TRASH_KEY);
    trash.unshift({
      type: type, id: String(id),
      record: record || null,
      deleted_at: new Date().toISOString(),
      deleted_by: who || (window.VYVE_CURRENT_USER || 'unknown')
    });
    if (trash.length > MAX_TRASH_ENTRIES) trash = trash.slice(0, MAX_TRASH_ENTRIES);
    save(TRASH_KEY, trash);
    logChange(type, id, who, 'delete', null);
  }
  function restore(type, id){
    var trash = load(TRASH_KEY);
    var idx = -1;
    for (var i = 0; i < trash.length; i++) {
      if (trash[i].type === type && String(trash[i].id) === String(id)) { idx = i; break; }
    }
    if (idx < 0) return null;
    var entry = trash[idx];
    trash.splice(idx, 1);
    save(TRASH_KEY, trash);
    logChange(type, id, null, 'restore', null);
    return entry.record;
  }
  function purge(type, id){
    var trash = load(TRASH_KEY);
    var idx = -1;
    for (var i = 0; i < trash.length; i++) {
      if (trash[i].type === type && String(trash[i].id) === String(id)) { idx = i; break; }
    }
    if (idx < 0) return false;
    trash.splice(idx, 1);
    save(TRASH_KEY, trash);
    return true;
  }
  function trash(){ return load(TRASH_KEY); }
  function isDeleted(type, id){
    var t = load(TRASH_KEY);
    for (var i = 0; i < t.length; i++) {
      if (t[i].type === type && String(t[i].id) === String(id)) return true;
    }
    return false;
  }

  // ----- Diff helper for callers -----
  function diff(before, after){
    if (!before || !after) return null;
    var d = {};
    var keys = Object.keys(after);
    keys.forEach(function(k){
      if (before[k] !== after[k]) d[k] = [before[k], after[k]];
    });
    return Object.keys(d).length ? d : null;
  }

  window.VYVE_STORE = {
    logChange: logChange,
    history: history,
    allChanges: allChanges,
    softDelete: softDelete,
    restore: restore,
    purge: purge,
    trash: trash,
    isDeleted: isDeleted,
    diff: diff
  };
})();
