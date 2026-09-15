  /* ── PM-1258 · Calum feedback batch 3 (general, messages, notifications, clients) ───────────
     Calum, 15 Sep, with screenshots from an HP laptop. Small usability tweaks plus one real bug
     (that one is PM-1257, a data fix). Everything here is coach-side chrome.                 ── */

  /* 1 · the VYVE word goes home */
  (function(){
    ['.side-brand', '.cp-logo'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.style.cursor = 'pointer'; el.title = 'Home';
        el.addEventListener('click', function(){ go('dashboard'); });
      });
    });
  })();

  /* 2 · "Quick add" → "Quick actions", and the grey sub-labels go (Calum: not everything in
        there adds something, and "Client wizard" reads oddly) */
  (function(){
    var t = setInterval(function(){
      var btn = $c('w0-qa-btn'); if (!btn) return;
      clearInterval(t);
      btn.innerHTML = '<span style="font-size:16px;line-height:1;">+</span> Quick actions';
      var menu = $c('w0-qa-menu'); if (!menu) return;
      menu.querySelectorAll('.k').forEach(function(k){ k.remove(); });
      var add = menu.querySelector('[data-w0qa="client"]'); if (add) add.textContent = 'Add a client';
      var msg = menu.querySelector('[data-w0qa="message"]'); if (msg) msg.textContent = 'Send a message';
      var ev = menu.querySelector('[data-w0qa="event"]'); if (ev) ev.textContent = 'Add a calendar event';
      var an = menu.querySelector('[data-w0qa="announce"]'); if (an) an.textContent = 'Broadcast to all clients';
    }, 250);
    setTimeout(function(){ clearInterval(t); }, 20000);
  })();

  /* 3 · the coach's own email out of the top bar */
  (function(){ var e = $c('cp-user-email'); if (e) e.style.display = 'none'; })();

  /* 4 · the HP side-scroll: a wide table must scroll inside its own card, never move the page.
        Calum's screenshot shows the roster table (Programme · Phase · Next phase · This week ·
        Last week · Check-in day · Last check-in) pushing the whole page sideways. §23.356 */
  (function(){
    var st = document.createElement('style');
    st.textContent =
      'html,body{max-width:100%;overflow-x:hidden;}' +
      '.cp-content{overflow-x:clip;}' +
      '.card{max-width:100%;}' +
      '.cl-tbl,.w5-tbl,.w6-tbl,table{max-width:100%;}' +
      '.cx-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}' +
      '.cx-scroll::-webkit-scrollbar{height:8px;}' +
      '.cx-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}';
    document.head.appendChild(st);
    function wrapWide(){
      document.querySelectorAll('.card table').forEach(function(t){
        var p = t.parentElement;
        if (p && (p.classList.contains('cx-scroll') || (p.style.overflowX || '').indexOf('auto') >= 0)) return;
        var w = document.createElement('div'); w.className = 'cx-scroll';
        p.insertBefore(w, t); w.appendChild(t);
      });
    }
    new MutationObserver(function(){ wrapWide(); }).observe(document.body, { childList: true, subtree: true });
    setTimeout(wrapWide, 600);
  })();

  /* 5 · Messages: the search bar belongs on the top row with New message / Broadcast */
  (function(){
    var t = setInterval(function(){
      var q = $c('mx-q'), head = $c('msg-new') && $c('msg-new').parentElement;
      if (!q || !head) return;
      clearInterval(t);
      var bar = q.parentElement;
      if (bar.parentElement === head) return;
      q.style.cssText = 'flex:1;min-width:160px;max-width:320px;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;outline:none;';
      var grp = $c('mx-group');
      head.insertBefore(q, head.firstChild);
      if (grp) head.insertBefore(grp, $c('msg-new'));
      bar.remove();
    }, 300);
    setTimeout(function(){ clearInterval(t); }, 20000);
  })();

  /* 6 · Notifications: search, "Meals" → "Nutrition", the dead Clients filter out, a row opens
        the client, and the name itself is clickable (Calum: clicking a name should take me in) */
  (function(){
    var f = $c('nf-filters');
    if (f){
      var c = f.querySelector('[data-f="client"]'); if (c) c.style.display = 'none';
      f.querySelectorAll('.nf-f').forEach(function(b){ if ((b.textContent || '').trim() === 'Meals') b.textContent = 'Nutrition'; });
    }
    if (typeof W1_NF_KINDS !== 'undefined'){
      W1_NF_KINDS.forEach(function(k){ if (k[0] === 'meal') k[1] = 'Nutrition'; });
    }
    var feed = $c('nf-feed');
    if (feed && !$c('nx-q')){
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:0 0 10px;';
      row.innerHTML = '<input id="nx-q" type="search" placeholder="Search clients\u2026" style="flex:1;min-width:0;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;outline:none;"/>';
      feed.parentElement.insertBefore(row, feed);
      $c('nx-q').addEventListener('input', function(){
        var q = this.value.trim().toLowerCase();
        Array.prototype.forEach.call(feed.children, function(r){
          if (!r.querySelector || !r.querySelector('[data-nf-view]')) return;   /* keep the day headers */
          r.style.display = (!q || (r.textContent || '').toLowerCase().indexOf(q) >= 0) ? '' : 'none';
        });
      });
    }
    function rowsClickable(){
      if (!feed) return;
      feed.querySelectorAll('[data-nf-view]').forEach(function(b){
        var r = b.parentElement; if (!r || r.dataset.nx) return; r.dataset.nx = '1';
        r.style.cursor = 'pointer';
        r.addEventListener('click', function(ev){ if (ev.target.closest('button, a, input')) return; b.click(); });
      });
    }
    if (feed) new MutationObserver(rowsClickable).observe(feed, { childList: true });
    setTimeout(rowsClickable, 600);
  })();

  /* 7 · Clients: the Mon–Sun chips only show when some client actually has a check-in day
        (Calum clicked them and nothing happened — PM-1257 is why; they stay useful once set) */
  (function(){
    var _rr = renderRoster;
    renderRoster = function(){
      _rr.apply(this, arguments);
      var days = $c('clx-days'); if (!days) return;
      var any = roster.some(function(c){ var d = (c.assignments || {}).checkin_day; return d !== undefined && d !== null && d !== ''; });
      days.style.display = any ? '' : 'none';
    };
  })();
