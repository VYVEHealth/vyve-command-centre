// =====================================================================
// VYVE Command Centre — Comments & @mentions
// Threaded comments on any entity. Local-first; ready to swap to Supabase
// when needed without changing the API.
//
// API:
//   VYVE_COMMENTS.list(type, id)   -> array of comments (newest first)
//   VYVE_COMMENTS.add(type, id, body, who, mentions)
//   VYVE_COMMENTS.remove(type, id, commentId)
//   VYVE_COMMENTS.count(type, id)  -> number
//   VYVE_COMMENTS.recent(limit)    -> recent comments across all entities
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.store.comments';
  var MAX_COMMENTS = 5000;

  function load(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function save(arr){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; }
    catch(e){ return false; }
  }

  function genId(){
    return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // Find @mentions in body: @name -> ['name', ...]
  function parseMentions(body){
    if (!body) return [];
    var out = [];
    var re = /@([\w\-]+)/g;
    var m;
    while ((m = re.exec(body)) !== null) out.push(m[1].toLowerCase());
    return Array.from(new Set(out));
  }

  function list(type, id){
    if (!type || !id) return [];
    var all = load();
    return all.filter(function(c){
      return c.type === type && String(c.entity_id) === String(id);
    }).sort(function(a, b){ return new Date(b.created_at) - new Date(a.created_at); });
  }

  function add(type, id, body, who, mentions){
    if (!type || !id || !body) return null;
    var all = load();
    var nowIso = new Date().toISOString();
    var actualWho = who || (window.VYVE_CURRENT_USER || 'unknown');
    var parsedMentions = mentions || parseMentions(body);
    var comment = {
      id: genId(),
      type: type,
      entity_id: String(id),
      body: body,
      author: actualWho,
      mentions: parsedMentions,
      created_at: nowIso
    };
    all.unshift(comment);
    if (all.length > MAX_COMMENTS) all = all.slice(0, MAX_COMMENTS);
    save(all);

    // Fire notifications for each mention
    if (window.VYVE_NOTIFS && parsedMentions.length) {
      parsedMentions.forEach(function(handle){
        window.VYVE_NOTIFS.push({
          kind: 'mention',
          to: handle,
          from: actualWho,
          entity_type: type,
          entity_id: String(id),
          body_excerpt: body.length > 120 ? body.slice(0, 118) + '\u2026' : body
        });
      });
    }

    try {
      window.dispatchEvent(new CustomEvent('vyve:comment', {
        detail: { type: type, id: id, comment: comment }
      }));
    } catch(e){}
    return comment;
  }

  function remove(type, id, commentId){
    var all = load();
    var before = all.length;
    all = all.filter(function(c){
      return !(c.type === type && String(c.entity_id) === String(id) && c.id === commentId);
    });
    if (all.length === before) return false;
    save(all);
    return true;
  }

  function count(type, id){
    return list(type, id).length;
  }

  function recent(limit){
    var all = load();
    return (limit ? all.slice(0, limit) : all);
  }

  window.VYVE_COMMENTS = {
    list: list,
    add: add,
    remove: remove,
    count: count,
    recent: recent,
    parseMentions: parseMentions
  };
})();
