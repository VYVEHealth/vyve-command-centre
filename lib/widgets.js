// =====================================================================
// VYVE Command Centre — Reusable widgets
// Comment panel, audit history pill, record-detail modal.
// Used by any page that needs to attach comments / @mentions / history
// to an entity.
// =====================================================================

(function(){
  'use strict';

  function escape(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Convert plain text -> HTML with @mentions highlighted
  function linkifyMentions(text){
    var safe = escape(text || '');
    return safe.replace(/@([\w\-]+)/g, '<span class="mention">@$1</span>');
  }

  function avatarHtml(name){
    var letter = (name || '?').toString().charAt(0).toUpperCase();
    return '<div class="comment-avatar">' + escape(letter) + '</div>';
  }

  function shortAuthor(s){
    if (!s) return 'someone';
    if (s.indexOf('@') >= 0) return s.split('@')[0];
    return s;
  }

  // ----- Comment thread mounted into a DOM element -----
  function commentsPanel(mountEl, type, id, opts){
    opts = opts || {};
    if (!mountEl || !type || !id) return;
    var C = window.VYVE_COMMENTS;
    if (!C) { mountEl.innerHTML = '<div class="empty">Comments unavailable.</div>'; return; }

    function render(){
      var comments = C.list(type, id);
      var threadHtml = comments.length
        ? '<div class="comments-thread">' +
            comments.map(function(c){
              return '<div class="comment-row">' +
                avatarHtml(shortAuthor(c.author)) +
                '<div class="comment-body">' +
                  '<div class="comment-meta">' +
                    '<span class="comment-author">' + escape(shortAuthor(c.author)) + '</span>' +
                    '<span class="comment-time">' + (window.VYVE_DATA ? window.VYVE_DATA.relTime(new Date(c.created_at)) : c.created_at) + '</span>' +
                  '</div>' +
                  '<div class="comment-text">' + linkifyMentions(c.body) + '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>'
        : '<div class="empty" style="padding:24px 0"><h3>No comments yet</h3><p>Add the first one to start a thread. Use @name to mention a teammate.</p></div>';

      var formHtml = '<form class="comment-form" data-role="comment-form">' +
        '<textarea placeholder="Add a comment… @mention anyone on the team" data-role="comment-input"></textarea>' +
        '<div class="comment-form-actions">' +
          '<div class="comment-form-hint">Use <kbd>@</kbd> to mention · <kbd>⌘</kbd>+<kbd>↵</kbd> to post</div>' +
          '<button type="submit" class="btn btn-primary btn-sm">Post comment</button>' +
        '</div>' +
      '</form>';

      mountEl.innerHTML = threadHtml + formHtml;

      var form = mountEl.querySelector('[data-role="comment-form"]');
      var input = mountEl.querySelector('[data-role="comment-input"]');
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var body = (input.value || '').trim();
        if (!body) return;
        C.add(type, id, body);
        input.value = '';
        render();
        if (window.VYVE_UI && window.VYVE_UI.toast) window.VYVE_UI.toast('Comment posted', 'success');
        if (opts.onChange) opts.onChange();
      });
      // Cmd+Enter / Ctrl+Enter to post
      input.addEventListener('keydown', function(e){
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });
    }

    render();
  }

  // ----- Audit history list mounted into a DOM element -----
  function historyPanel(mountEl, type, id){
    if (!mountEl || !type || !id) return;
    var S = window.VYVE_STORE;
    if (!S) { mountEl.innerHTML = '<div class="empty">History unavailable.</div>'; return; }
    var entries = S.history(type, id);
    if (!entries.length) {
      mountEl.innerHTML = '<div class="empty" style="padding:24px 0"><h3>No history yet</h3><p>Changes will be tracked here once edits start happening.</p></div>';
      return;
    }
    mountEl.innerHTML = '<div class="comments-thread">' + entries.map(function(e){
      var who = shortAuthor(e.who);
      var op = e.op;
      var when = window.VYVE_DATA ? window.VYVE_DATA.relTime(new Date(e.at)) : e.at;
      var diffSummary = '';
      if (e.diff && typeof e.diff === 'object') {
        var keys = Object.keys(e.diff);
        diffSummary = keys.length === 1
          ? 'Changed <strong>' + escape(keys[0]) + '</strong>'
          : 'Changed ' + keys.length + ' fields';
      }
      return '<div class="comment-row">' +
        avatarHtml(who) +
        '<div class="comment-body">' +
          '<div class="comment-meta">' +
            '<span class="comment-author">' + escape(who) + '</span>' +
            '<span class="comment-time">' + escape(op) + ' · ' + when + '</span>' +
          '</div>' +
          (diffSummary ? '<div class="comment-text" style="color:var(--text-muted)">' + diffSummary + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  // ----- Record-detail modal: tabs for Details, Comments, History -----
  function recordModal(type, id){
    var E = window.VYVE_ENTITIES;
    if (!E) return null;
    var def = E.get(type);
    if (!def) return null;
    var rec = def.get(id);
    if (!rec) {
      if (window.VYVE_UI && window.VYVE_UI.toast) window.VYVE_UI.toast('Record not found', 'error');
      return null;
    }

    var title = def.titleOf(rec);
    var sub = def.subOf(rec);

    var body = document.createElement('div');
    body.innerHTML =
      '<div style="margin-bottom:18px">' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">' + escape(def.label) + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)">' + escape(sub) + '</div>' +
      '</div>' +
      '<div class="tab-bar" role="tablist">' +
        '<button type="button" class="tab-btn active" data-tab="details">Details</button>' +
        '<button type="button" class="tab-btn" data-tab="comments">Comments <span class="tab-count" data-tab-count="comments">0</span></button>' +
        '<button type="button" class="tab-btn" data-tab="history">History</button>' +
      '</div>' +
      '<div class="tab-panel active" data-panel="details"></div>' +
      '<div class="tab-panel" data-panel="comments"></div>' +
      '<div class="tab-panel" data-panel="history"></div>' +
      '<div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:16px;border-top:1px solid var(--border)">' +
        '<a class="btn btn-ghost btn-sm" href="' + def.route + '">Open in ' + escape(def.label) + ' →</a>' +
        '<button class="btn btn-ghost btn-sm" data-role="delete-record" style="color:var(--danger)">Delete</button>' +
      '</div>';

    // Render details tab content
    var detailsPanel = body.querySelector('[data-panel="details"]');
    detailsPanel.innerHTML = renderDetails(rec, def);

    // Render comments count
    var commentsCount = (window.VYVE_COMMENTS ? window.VYVE_COMMENTS.count(type, id) : 0);
    var countEl = body.querySelector('[data-tab-count="comments"]');
    if (countEl) countEl.textContent = commentsCount;

    var m = window.VYVE_UI.modal({ title: title, body: body });

    // Mount comments + history panels (deferred until tab clicked, but render initially since cheap)
    var commentsPanelEl = body.querySelector('[data-panel="comments"]');
    var historyPanelEl  = body.querySelector('[data-panel="history"]');
    commentsPanel(commentsPanelEl, type, id, {
      onChange: function(){
        var n = window.VYVE_COMMENTS.count(type, id);
        if (countEl) countEl.textContent = n;
      }
    });
    historyPanel(historyPanelEl, type, id);

    // Wire tabs
    body.querySelectorAll('.tab-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        body.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
        body.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
        btn.classList.add('active');
        var tab = btn.getAttribute('data-tab');
        body.querySelector('[data-panel="' + tab + '"]').classList.add('active');
      });
    });

    // Wire delete
    body.querySelector('[data-role="delete-record"]').addEventListener('click', function(){
      if (!confirm('Move this record to Trash? You can restore it later.')) return;
      if (window.VYVE_STORE) {
        window.VYVE_STORE.softDelete(type, id, rec);
        if (window.VYVE_UI && window.VYVE_UI.toast) window.VYVE_UI.toast('Moved to trash. Open Trash to restore.', 'warning');
      }
      m.close();
    });

    return m;
  }

  function renderDetails(rec, def){
    // Show a compact key/value view of the record
    var keys = Object.keys(rec).filter(function(k){
      // Hide noise fields
      if (k === 'id') return false;
      if (k.indexOf('_') === 0) return false;
      var v = rec[k];
      if (v == null || v === '') return false;
      return true;
    });
    if (!keys.length) return '<div class="empty" style="padding:24px 0"><p>No additional fields on this record.</p></div>';
    return '<div style="display:grid;grid-template-columns:140px 1fr;gap:10px 16px;font-size:13px">' +
      keys.map(function(k){
        var v = rec[k];
        var disp = (typeof v === 'string' || typeof v === 'number') ? String(v) : JSON.stringify(v);
        return '<div style="color:var(--text-muted);font-weight:500;text-transform:capitalize">' + escape(k.replace(/_/g, ' ')) + '</div>' +
               '<div style="color:var(--text)">' + escape(disp) + '</div>';
      }).join('') +
    '</div>';
  }

  window.VYVE_WIDGETS = {
    commentsPanel: commentsPanel,
    historyPanel:  historyPanel,
    recordModal:   recordModal,
    linkifyMentions: linkifyMentions
  };
})();
