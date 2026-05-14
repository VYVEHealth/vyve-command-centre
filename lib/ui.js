// =====================================================================
// VYVE Command Centre — UI helpers
// Toast, modal, empty-state factory, format helpers.
// =====================================================================

(function(){
  'use strict';

  // ---------- Toast ----------
  function toast(message, kind, ms) {
    kind = kind || 'success';
    ms = ms || 3200;
    var t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(function(){
      t.style.transition = 'opacity .25s';
      t.style.opacity = '0';
      setTimeout(function(){ t.remove(); }, 280);
    }, ms);
  }

  // ---------- Modal ----------
  // Lightweight modal: pass a title + HTML body. Returns { close, el, draft }.
  // Pass opts.draftKey to enable autosave: any input/textarea/select with an id
  // inside the modal gets its value persisted to localStorage under
  // "vyve.draft.<draftKey>" while the user types. On reopen, values are restored.
  // Callers should call result.draft.clear() after a successful save.
  function modal(opts) {
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header">' +
          '<div class="modal-title">' + (opts.title || '') + '</div>' +
          '<button class="modal-close" type="button">&times;</button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
      '</div>';
    var body = overlay.querySelector('.modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body instanceof Node) body.appendChild(opts.body);

    function close() {
      if (draftCtrl) draftCtrl.detach();
      overlay.classList.remove('open');
      setTimeout(function(){ overlay.remove(); }, 150);
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) close();
    });
    document.body.appendChild(overlay);

    // Wire autosave if requested
    var draftCtrl = null;
    if (opts.draftKey && window.VYVE_DRAFTS) {
      // Defer to next tick so any setTimeout-based field initialisation has run
      setTimeout(function(){
        draftCtrl = window.VYVE_DRAFTS.attach(overlay.querySelector('.modal'), opts.draftKey);
      }, 60);
    }

    return {
      close: close,
      el: overlay,
      draft: {
        clear: function(){ if (opts.draftKey && window.VYVE_DRAFTS) window.VYVE_DRAFTS.clear(opts.draftKey); }
      }
    };
  }

  // ---------- Empty state ----------
  function emptyState(opts) {
    opts = opts || {};
    return '<div class="empty">' +
      '<span class="icon">' + (opts.icon || '\u00b7\u00b7\u00b7') + '</span>' +
      '<h3>' + (opts.title || 'Nothing here yet') + '</h3>' +
      (opts.body ? '<p>' + opts.body + '</p>' : '') +
      '</div>';
  }

  // ---------- Formatters ----------
  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
    } catch(e){ return iso; }
  }
  function fmtMoney(n, currency) {
    currency = currency || 'GBP';
    if (n == null || isNaN(n)) return '—';
    try {
      return new Intl.NumberFormat('en-GB', { style:'currency', currency: currency, maximumFractionDigits: 0 }).format(n);
    } catch(e){ return String(n); }
  }
  function fmtRelative(iso) {
    if (!iso) return '';
    var then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    var diff = Math.round((Date.now() - then) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.round(diff/60) + 'm ago';
    if (diff < 86400) return Math.round(diff/3600) + 'h ago';
    if (diff < 604800) return Math.round(diff/86400) + 'd ago';
    return fmtDate(iso);
  }

  // ---------- Sanitise (very light, for user-provided strings in HTML) ----------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.VYVE_UI = {
    toast: toast,
    modal: modal,
    emptyState: emptyState,
    fmtDate: fmtDate,
    fmtMoney: fmtMoney,
    fmtRelative: fmtRelative,
    escape: escapeHtml
  };
})();
