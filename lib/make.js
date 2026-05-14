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


  // ===== Refresh-from-Make helpers =====
  // Each helper pulls from a logical store key, transforms records to local shape,
  // and writes to the local localStorage key the page reads from.

  // Transforms
  function transformPerformance(r){
    // Make record: {platform, post_id, content_preview, like_count, comment_count, share_count, impression_count, collected_at, posted_at, permalink, media_type}
    var d = r.data || r;
    var date = (d.posted_at || d.collected_at || '').slice(0,10);
    var likes = Number(d.like_count) || 0;
    var comments = Number(d.comment_count) || 0;
    var shares = Number(d.share_count) || 0;
    return {
      _id: r.key || ('perf_' + (d.platform || 'x') + '_' + date + '_' + (d.post_id || 'na')),
      channel: (d.platform || '').toLowerCase(),
      date: date,
      title: d.content_preview || ((d.platform || '') + ' post'),
      reach: Number(d.impression_count) || 0,
      engagements: likes + comments + shares,
      conversions: 0,
      permalink: d.permalink || '',
      media_type: d.media_type || '',
      created_at: d.posted_at || d.collected_at || new Date().toISOString()
    };
  }

  function transformPodcast(r){
    // Make record: typically {title, status, guest, scheduled_date, published_at, downloads, episode_number, notes, ...}
    var d = r.data || r;
    return Object.assign({ _id: r.key }, d);
  }

  function transformContent(r){
    // Make record: typically {title, channel, status, owner, pillar, due, notes, hook, published_at, ...}
    var d = r.data || r;
    return Object.assign({ _id: r.key }, d);
  }

  // Pull full store with pagination, transform each, return array.
  async function pullStore(key, transform){
    var all = [];
    var offset = 0;
    var pageSize = 200;
    for (var i = 0; i < 50; i++) { // hard cap to avoid runaway
      var rows = await list(key, { limit: pageSize, offset: offset });
      if (!rows || !rows.length) break;
      rows.forEach(function(r){
        // list() already strips key+data and merges _id+data — but we need the raw record for transformPerformance.
        // Reconstruct minimal { key, data } shape for the transform.
        all.push(transform({ key: r._id, data: r }));
      });
      if (rows.length < pageSize) break;
      offset += pageSize;
    }
    return all;
  }

  // Public refresh helpers — page code calls these directly.
  async function refreshPerformance(){
    var rows = await pullStore('performance', transformPerformance);
    if (rows && rows.length) {
      try { localStorage.setItem('vyve_performance_log', JSON.stringify(rows)); } catch(e){}
    }
    return rows.length;
  }
  async function refreshPodcast(){
    var rows = await pullStore('podcast', transformPodcast);
    if (rows && rows.length) {
      try { localStorage.setItem('vyve_podcast_eps', JSON.stringify(rows)); } catch(e){}
    }
    return rows.length;
  }
  async function refreshContent(){
    var rows = await pullStore('posts', transformContent);
    if (rows && rows.length) {
      try { localStorage.setItem('vyve_content_items', JSON.stringify(rows)); } catch(e){}
    }
    return rows.length;
  }



  // ===== Auto-refresh tracking =====
  // Tracks last successful refresh timestamp per logical key.
  function lastRefreshKey(logicalKey){ return 'vyve_make_last_refresh_' + logicalKey; }

  function lastRefreshedAt(logicalKey){
    try {
      var v = localStorage.getItem(lastRefreshKey(logicalKey));
      if (!v) return null;
      var n = Number(v);
      return isNaN(n) ? null : n;
    } catch(e){ return null; }
  }

  function markRefreshed(logicalKey){
    try { localStorage.setItem(lastRefreshKey(logicalKey), String(Date.now())); } catch(e){}
  }

  // Decorate refreshPerformance/Podcast/Content so they auto-record timestamps on success.
  var _refreshPerformance = refreshPerformance;
  refreshPerformance = async function(){ var n = await _refreshPerformance(); if (n > 0) markRefreshed('performance'); return n; };
  var _refreshPodcast = refreshPodcast;
  refreshPodcast = async function(){ var n = await _refreshPodcast(); if (n > 0) markRefreshed('podcast'); return n; };
  var _refreshContent = refreshContent;
  refreshContent = async function(){ var n = await _refreshContent(); if (n > 0) markRefreshed('posts'); return n; };

  // Auto-pull: if token + store mapped AND last refresh > threshold (default 1h), pull in background.
  // Returns a promise that resolves to the record count (or 0 if skipped).
  async function autoPull(logicalKey, thresholdMs, refreshFn){
    if (!token()) return 0;
    if (!storeId(logicalKey)) return 0;
    var last = lastRefreshedAt(logicalKey);
    if (last && (Date.now() - last) < (thresholdMs || 3600000)) return 0;
    try { return await refreshFn(); } catch(e){ return 0; }
  }

  async function autoPullPerformance(thresholdMs){ return autoPull('performance', thresholdMs, refreshPerformance); }
  async function autoPullPodcast(thresholdMs){     return autoPull('podcast',     thresholdMs, refreshPodcast); }
  async function autoPullContent(thresholdMs){     return autoPull('posts',       thresholdMs, refreshContent); }


  window.VYVE_MAKE = {
    list: list, get: get, upsert: upsert, remove: remove,
    triggerWebhook: triggerWebhook,
    refreshPerformance: refreshPerformance,
    refreshPodcast: refreshPodcast,
    refreshContent: refreshContent,
    autoPullPerformance: autoPullPerformance,
    autoPullPodcast: autoPullPodcast,
    autoPullContent: autoPullContent,
    lastRefreshedAt: lastRefreshedAt,
    storeId: storeId,
    hasToken: function(){ return !!token(); }
  };
})();
