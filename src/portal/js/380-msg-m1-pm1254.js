  /* ── PM-1254 · Calum messaging batch 1 (coach-side; no member app change, no contract change) ──
     Calum, 13 Sep (message + voice note): read receipts ("they say they never read it"), a search
     bar on the messaging list, a Group chat button on the main screen, the New message pop-up is
     cramped with a hard-to-see Cancel, and a traffic-light + last-seen column so a coach can scan
     down on a Tuesday and see who needs them.
     Everything here reads signals that already exist: `coach_messages.read_at` (the member app has
     always stamped it — we simply never showed it), `members.last_active_at`, and W1's `w1tagsOf`
     segment engine (PM-1075) for the amber/red reasons. Nothing new is written.               ── */
  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.mx-tools{display:flex;gap:8px;align-items:center;padding:10px 10px 8px;border-bottom:1px solid var(--border);}' +
      '.mx-tools input{flex:1;min-width:0;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;outline:none;}' +
      '.mx-dot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 0 2px var(--surface);}' +
      '.mx-dot.g{background:var(--success,#4ADE80);}.mx-dot.a{background:var(--warning,#E8A855);}.mx-dot.r{background:var(--danger,#F87171);}.mx-dot.n{background:var(--border-strong);}' +
      '.mx-seen{font-size:10.5px;color:var(--text-muted);margin:1px 4px 0;}' +
      '.mx-seen.on{color:var(--teal-lt);}' +
      '.mx-sub{font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.w3-mdlg{max-width:620px !important;padding:20px 22px !important;position:relative;}' +
      '.w3-mdlg h3{font-size:16px !important;margin:0 0 14px !important;padding-right:30px;}' +
      '.w3-mdlg label{margin:14px 0 6px !important;font-size:12px !important;font-weight:600;}' +
      '.w3-mdlg .w3-cl{display:flex;flex-wrap:wrap;gap:6px;max-height:190px;overflow-y:auto;padding:2px;}' +
      '.w3-mdlg .w3-cl span{padding:6px 11px;border-radius:999px;border:1px solid var(--border-strong);font-size:12.5px;cursor:pointer;line-height:1.3;}' +
      '.w3-mdlg .w3-cl span.on{border-color:var(--teal);background:rgba(27,120,120,.16);color:var(--teal-lt);font-weight:600;}' +
      '.w3-mdlg .w3-note{margin-top:12px !important;font-size:12px;color:var(--text-muted);line-height:1.5;}' +
      '.mx-x{position:absolute;top:12px;right:14px;width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text-muted);font-size:16px;line-height:1;cursor:pointer;}' +
      '.mx-x:hover{color:var(--text);}';
    document.head.appendChild(st);
  })();

  /* ── traffic light + last seen, from signals the portal already computes ── */
  var MX_RED = ['inactive', 'low_compliance', 'checkin_overdue', 'not_responded'];
  var MX_AMBER = ['nutrition_low', 'not_messaged', 'trial_ending', 'goal_due'];
  function mxAgo(iso){
    if (!iso) return null;
    var d = (Date.now() - Date.parse(iso)) / 6e4;
    if (!isFinite(d) || d < 0) return null;
    if (d < 60) return Math.max(1, Math.round(d)) + 'm ago';
    if (d < 1440) return Math.round(d / 60) + 'h ago';
    var days = Math.round(d / 1440);
    return days === 1 ? 'yesterday' : days + 'd ago';
  }
  function mxLight(c){
    if (!c || c.status !== 'active') return { k: 'n', why: '' };
    var sys = (typeof w1tagsOf === 'function') ? w1tagsOf(c) : [];
    var red = sys.filter(function(k){ return MX_RED.indexOf(k) >= 0; });
    var amb = sys.filter(function(k){ return MX_AMBER.indexOf(k) >= 0; });
    var label = { inactive: 'not opened the app', low_compliance: 'training dropped off', checkin_overdue: 'check-in overdue', not_responded: "hasn't replied", nutrition_low: 'nutrition logging low', not_messaged: 'not messaged lately', trial_ending: 'trial ending', goal_due: 'goal due' };
    if (red.length) return { k: 'r', why: red.map(function(k){ return label[k] || k; }).join(' \u00b7 ') };
    if (amb.length) return { k: 'a', why: amb.map(function(k){ return label[k] || k; }).join(' \u00b7 ') };
    return { k: 'g', why: 'engaging well' };
  }
  function mxSeenText(c){
    var m = memberMap[String(c.member_email || '').toLowerCase()] || {};
    var a = mxAgo(m.last_active_at);
    return a ? 'In the app ' + a : 'Not opened the app yet';
  }

  /* ── thread list: search + light + last seen ── */
  var mx = { q: '' };
  function mxEnsureSearch(){
    var el = $c('msg-threads'); if (!el || $c('mx-q')) return;
    var bar = document.createElement('div'); bar.className = 'mx-tools';
    bar.innerHTML = '<input id="mx-q" type="search" placeholder="Search clients\u2026"/>' +
      '<button class="btn" id="mx-group" type="button" style="font-size:11.5px;padding:6px 10px;white-space:nowrap;" title="Start a group chat">\u25c9 Group</button>';
    el.parentElement.insertBefore(bar, el);
    $c('mx-q').addEventListener('input', function(){ mx.q = this.value.trim().toLowerCase(); mxFilter(); });
    $c('mx-group').addEventListener('click', function(){ if (typeof w3modal === 'function') w3modal(null, { group: true }); });
  }
  function mxFilter(){
    var el = $c('msg-threads'); if (!el) return;
    var any = false;
    el.querySelectorAll('.msg-th, .w3-th').forEach(function(b){
      var hit = !mx.q || (b.textContent || '').toLowerCase().indexOf(mx.q) >= 0;
      b.style.display = hit ? '' : 'none';
      if (hit) any = true;
    });
    el.querySelectorAll('.w3-sec').forEach(function(s){
      var n = s.nextElementSibling, vis = false;
      while (n && !n.classList.contains('w3-sec')){ if (n.style.display !== 'none' && (n.classList.contains('msg-th') || n.classList.contains('w3-th'))) vis = true; n = n.nextElementSibling; }
      s.style.display = vis ? '' : 'none';
    });
    var none = $c('mx-none');
    if (!any && mx.q){
      if (!none){ none = document.createElement('div'); none.id = 'mx-none'; none.style.cssText = 'padding:18px;font-size:12.5px;color:var(--text-muted);'; none.textContent = 'No client matches that.'; el.appendChild(none); }
      none.style.display = '';
    } else if (none) none.style.display = 'none';
  }
  function mxDecorate(){
    var el = $c('msg-threads'); if (!el) return;
    el.querySelectorAll('.msg-th').forEach(function(b){
      if (b.dataset.mx) return; b.dataset.mx = '1';
      var em = String(b.dataset.em || '').toLowerCase();
      var c = roster.filter(function(x){ return String(x.member_email || '').toLowerCase() === em; })[0];
      if (!c) return;
      var L = mxLight(c);
      var ava = b.firstElementChild;
      if (ava){ var d = document.createElement('span'); d.className = 'mx-dot ' + L.k; d.title = L.why; d.style.cssText += 'margin-right:-14px;align-self:flex-end;position:relative;left:-6px;'; b.insertBefore(d, ava.nextSibling); }
      var mid = b.querySelector('div[style*="flex:1"]');
      if (mid && !mid.querySelector('.mx-sub')){
        var s = document.createElement('div'); s.className = 'mx-sub';
        s.textContent = mxSeenText(c) + (L.k === 'r' || L.k === 'a' ? ' \u00b7 ' + L.why : '');
        mid.appendChild(s);
      }
    });
    mxFilter();
  }
  (function(){
    var _rtl = renderThreadList;
    renderThreadList = function(){ _rtl.apply(this, arguments); mxEnsureSearch(); mxDecorate(); };
  })();

  /* ── read receipts on coach bubbles ── */
  (function(){
    var _bub = msgBubble;
    msgBubble = function(m){
      var html = _bub.apply(this, arguments);
      if (m.sender !== 'coach') return html;
      if (m.deliver_at && Date.parse(m.deliver_at) > Date.now()) return html;         /* still scheduled */
      if (typeof w3isGroup === 'function' && w3isGroup() && m._copies) return html;   /* groups already show Seen by n/N */
      var seen = m.read_at
        ? '<div class="mx-seen on">\u2713\u2713 Seen ' + new Date(m.read_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + '</div>'
        : '<div class="mx-seen">\u2713 Delivered</div>';
      var i = html.lastIndexOf('</div>');
      return i < 0 ? html : html.slice(0, i) + seen + html.slice(i);
    };
  })();

  /* ── New message dialog: X to close, group preselected when asked, roomier (CSS above) ── */
  (function(){
    if (typeof w3modal !== 'function') return;
    var _m = w3modal;
    w3modal = function(thread, opts){
      _m.call(this, thread);
      var bg = document.body.lastElementChild;
      if (!bg || !bg.classList || !bg.classList.contains('w3-modal-bg')) return;
      var dlg = bg.querySelector('.w3-mdlg'); if (!dlg) return;
      if (!dlg.querySelector('.mx-x')){
        var x = document.createElement('button'); x.type = 'button'; x.className = 'mx-x'; x.innerHTML = '\u00d7'; x.title = 'Close';
        x.addEventListener('click', function(){ bg.remove(); });
        dlg.appendChild(x);
      }
      var cancel = dlg.querySelector('#w3-x'); if (cancel) cancel.style.display = 'none';
      document.addEventListener('keydown', function esc(ev){ if (ev.key === 'Escape'){ bg.remove(); document.removeEventListener('keydown', esc); } });
      if (opts && opts.group && !thread){
        var h = dlg.querySelector('h3'); if (h) h.textContent = 'New group chat';
        var note = dlg.querySelector('#w3-mnote');
        if (note) note.textContent = 'Pick the clients for this group \u2014 everyone in it can read and reply. Good for challenges, events and group programmes.';
      }
    };
  })();
