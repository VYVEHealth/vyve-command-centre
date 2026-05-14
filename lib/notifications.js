// =====================================================================
// VYVE Command Centre — Notifications
// Push notifications for @mentions, audit events, system messages.
// Powers the topnav bell badge and the Inbox notifications strip.
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.store.notifications';
  var MAX = 500;

  function load(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function save(arr){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; }
    catch(e){ return false; }
  }
  function genId(){
    return 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  // Resolve "current user" handle (e.g. 'lewis' from lewis@vyvehealth.co.uk)
  function currentHandle(){
    var u = (window.VYVE_CURRENT_USER || '').toLowerCase();
    if (!u) return 'lewis';
    if (u.indexOf('@') >= 0) u = u.split('@')[0];
    return u || 'lewis';
  }

  // Push a new notification. Auto-fills created_at and id.
  function push(notif){
    if (!notif || !notif.kind) return null;
    var all = load();
    var entry = {
      id: genId(),
      kind: notif.kind,                       // 'mention' | 'audit' | 'system'
      to: (notif.to || 'all').toLowerCase(),  // 'lewis' | 'all'
      from: notif.from || '',
      entity_type: notif.entity_type || null,
      entity_id: notif.entity_id || null,
      body_excerpt: notif.body_excerpt || '',
      title: notif.title || '',
      created_at: new Date().toISOString(),
      read: false
    };
    all.unshift(entry);
    if (all.length > MAX) all = all.slice(0, MAX);
    save(all);
    try { window.dispatchEvent(new CustomEvent('vyve:notif', { detail: entry })); } catch(e){}
    return entry;
  }

  // List notifications. By default returns those visible to current user
  // (kind=mention->to=me, kind=system->to=all, kind=audit->to=all).
  function list(opts){
    opts = opts || {};
    var me = currentHandle();
    var all = load();
    return all.filter(function(n){
      if (opts.unreadOnly && n.read) return false;
      if (opts.kind && n.kind !== opts.kind) return false;
      // Visibility: mentions for me, or broadcast (to: 'all')
      if (n.to === 'all' || n.to === me) return true;
      return false;
    });
  }

  function unread(){
    return list({ unreadOnly: true }).length;
  }

  function markRead(id){
    var all = load();
    var changed = false;
    all.forEach(function(n){ if (n.id === id && !n.read) { n.read = true; changed = true; } });
    if (changed) save(all);
    if (changed) try { window.dispatchEvent(new CustomEvent('vyve:notif:read', { detail: { id: id } })); } catch(e){}
    return changed;
  }

  function markAllRead(){
    var me = currentHandle();
    var all = load();
    var changed = false;
    all.forEach(function(n){
      if (!n.read && (n.to === 'all' || n.to === me)) { n.read = true; changed = true; }
    });
    if (changed) save(all);
    try { window.dispatchEvent(new CustomEvent('vyve:notif:read', { detail: { all: true } })); } catch(e){}
    return changed;
  }

  function clear(){
    save([]);
    try { window.dispatchEvent(new CustomEvent('vyve:notif:read', { detail: { cleared: true } })); } catch(e){}
  }

  window.VYVE_NOTIFS = {
    push: push,
    list: list,
    unread: unread,
    markRead: markRead,
    markAllRead: markAllRead,
    clear: clear,
    currentHandle: currentHandle
  };
})();
