// =====================================================================
// VYVE Command Centre — Modal autosave
// Drafts persist to localStorage under "vyve.draft.<key>".
// Cleared explicitly by callers on successful save.
// =====================================================================

(function(){
  'use strict';

  var PREFIX = 'vyve.draft.';
  var DEBOUNCE = 400;
  var MAX_AGE_DAYS = 7;

  function keyFor(name){ return PREFIX + name; }

  function load(name){
    try { var raw = localStorage.getItem(keyFor(name)); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  }
  function save(name, data){
    try { localStorage.setItem(keyFor(name), JSON.stringify({ at: Date.now(), data: data })); }
    catch(e){}
  }
  function clear(name){
    try { localStorage.removeItem(keyFor(name)); } catch(e){}
  }
  function list(){
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
      }
    } catch(e){}
    return out;
  }

  // Clean drafts older than MAX_AGE_DAYS
  function gc(){
    var cutoff = Date.now() - MAX_AGE_DAYS*86400000;
    list().forEach(function(name){
      var d = load(name);
      if (!d || !d.at || d.at < cutoff) clear(name);
    });
  }

  // Collect input values inside an element into {fieldId: value} map
  function snapshot(rootEl){
    var data = {};
    rootEl.querySelectorAll('input[id], textarea[id], select[id]').forEach(function(el){
      if (el.type === 'password') return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        data[el.id] = el.checked;
      } else {
        data[el.id] = el.value;
      }
    });
    return data;
  }

  // Restore values from a snapshot
  function restore(rootEl, data){
    if (!data) return;
    Object.keys(data).forEach(function(id){
      var el = rootEl.querySelector('#' + CSS.escape(id));
      if (!el) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = !!data[id];
      } else {
        el.value = data[id] == null ? '' : data[id];
      }
    });
  }

  // Attach autosave to a modal. Returns a controller.
  function attach(rootEl, name){
    if (!rootEl || !name) return null;
    var key = name;
    var timer = null;
    var bannerEl = null;

    // Restore on attach if a draft exists and isn't empty
    var existing = load(key);
    var hasNonEmpty = existing && existing.data && Object.values(existing.data).some(function(v){ return v !== '' && v !== false && v != null; });
    if (hasNonEmpty) {
      restore(rootEl, existing.data);
      showBanner(rootEl, existing.at);
    }

    function onInput(){
      clearTimeout(timer);
      timer = setTimeout(function(){
        var data = snapshot(rootEl);
        // Skip save if everything is empty / false
        var hasContent = Object.values(data).some(function(v){ return v !== '' && v !== false && v != null; });
        if (hasContent) save(key, data);
      }, DEBOUNCE);
    }

    rootEl.addEventListener('input', onInput);
    rootEl.addEventListener('change', onInput);

    function showBanner(root, at){
      // Insert a small "Draft restored" pill at the top of the modal body
      var body = root.querySelector('.modal-body') || root;
      if (root.querySelector('.draft-banner')) return;
      var minutes = Math.round((Date.now() - at) / 60000);
      var when = minutes < 1 ? 'just now' : (minutes < 60 ? minutes + ' min ago' : Math.round(minutes/60) + 'h ago');
      bannerEl = document.createElement('div');
      bannerEl.className = 'draft-banner';
      bannerEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
        '<span>Draft restored from ' + when + '</span>' +
        '<button type="button" class="draft-discard" aria-label="Discard draft">Discard</button>';
      bannerEl.querySelector('.draft-discard').addEventListener('click', function(){
        clear(key);
        // Clear all inputs
        rootEl.querySelectorAll('input[id], textarea[id], select[id]').forEach(function(el){
          if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
          else el.value = '';
        });
        if (bannerEl) bannerEl.remove();
      });
      body.insertBefore(bannerEl, body.firstChild);
    }

    return {
      key: key,
      clear: function(){ clear(key); if (bannerEl) bannerEl.remove(); },
      detach: function(){
        clearTimeout(timer);
        rootEl.removeEventListener('input', onInput);
        rootEl.removeEventListener('change', onInput);
      }
    };
  }

  window.VYVE_DRAFTS = { attach: attach, load: load, save: save, clear: clear, list: list, gc: gc };

  // GC on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gc);
  } else {
    setTimeout(gc, 100);
  }
})();
