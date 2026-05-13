// =====================================================================
// VYVE Command Centre — Make.com data-store client
// Centralised wrapper for Make.com data-stores. Replaces the inlined
// ${MAKE_BASE} pattern from the old index.html.
//
// CONFIGURATION:
//   Tokens and store IDs are read from window.VYVE_CONFIG (settings page
//   writes here). If empty, calls return [] and log a warning - never throw,
//   so unconfigured pages still render their empty-states cleanly.
// =====================================================================

(function(){
  'use strict';

  var DEFAULT_BASE = 'https://eu1.make.com/api/v2';

  function cfg() {
    return (window.VYVE_CONFIG && window.VYVE_CONFIG.make) || {};
  }

  function base() {
    var c = cfg();
    return (c.base || DEFAULT_BASE).replace(/\/+$/, '');
  }

  function token() {
    return (cfg().token || '').trim();
  }

  function storeId(key) {
    var stores = cfg().stores || {};
    return stores[key] || null;
  }

  function headers() {
    var t = token();
    var h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Token ' + t;
    return h;
  }

  function warn(msg, extra) {
    if (window.console) console.warn('[VYVE/make]', msg, extra || '');
  }

  // List records from a data-store.
  // key  = logical name (e.g. 'intel', 'competitors', 'tasks') mapped via settings
  // opts = { limit, offset }
  async function list(key, opts) {
    opts = opts || {};
    var id = storeId(key);
    if (!id) { warn('No store id mapped for key: ' + key); return []; }
    if (!token()) { warn('No Make token configured.'); return []; }
    var limit = opts.limit || 100;
    var url = base() + '/data-stores/' + encodeURIComponent(id) + '/data?pg%5Blimit%5D=' + limit;
    if (opts.offset) url += '&pg%5Boffset%5D=' + opts.offset;
    try {
      var res = await fetch(url, { headers: headers() });
      if (!res.ok) { warn('list failed: HTTP ' + res.status); return []; }
      var json = await res.json();
      // Make returns { records: [{ key, data }, ...] }
      return (json.records || []).map(function(r){
        return Object.assign({ _id: r.key }, r.data || {});
      });
    } catch (e) {
      warn('list error', e);
      return [];
    }
  }

  // Get one record by id.
  async function get(key, id) {
    var sid = storeId(key);
    if (!sid || !token() || !id) return null;
    var url = base() + '/data-stores/' + encodeURIComponent(sid) + '/data/' + encodeURIComponent(id);
    try {
      var res = await fetch(url, { headers: headers() });
      if (!res.ok) return null;
      var json = await res.json();
      return Object.assign({ _id: id }, json.data || json);
    } catch (e) {
      warn('get error', e);
      return null;
    }
  }

  // Create or replace.
  async function upsert(key, id, data) {
    var sid = storeId(key);
    if (!sid || !token()) return null;
    var url = base() + '/data-stores/' + encodeURIComponent(sid) + '/data';
    var body = { key: id, data: data, overwrite: true };
    try {
      var res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) { warn('upsert failed: HTTP ' + res.status); return null; }
      return await res.json();
    } catch (e) {
      warn('upsert error', e);
      return null;
    }
  }

  // Delete a record.
  async function remove(key, id) {
    var sid = storeId(key);
    if (!sid || !token()) return false;
    var url = base() + '/data-stores/' + encodeURIComponent(sid) + '/data/' + encodeURIComponent(id);
    try {
      var res = await fetch(url, { method: 'DELETE', headers: headers() });
      return res.ok;
    } catch (e) {
      warn('delete error', e);
      return false;
    }
  }

  // Trigger a scenario via webhook URL (configured per-feature in settings).
  async function triggerWebhook(webhookUrl, payload) {
    if (!webhookUrl) return null;
    try {
      var res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      if (!res.ok) return null;
      var text = await res.text();
      try { return JSON.parse(text); } catch(e) { return text; }
    } catch (e) {
      warn('webhook error', e);
      return null;
    }
  }

  window.VYVE_MAKE = { list: list, get: get, upsert: upsert, remove: remove, triggerWebhook: triggerWebhook };
})();
