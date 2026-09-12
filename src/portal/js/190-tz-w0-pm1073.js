  /* ============================ PM-1073 Trainerize W0 ============================
     Backbone wave, portal side: quick-add (+) in the sidebar, dismissable Get-Started card on the
     cockpit, coach-owned UI prefs in partner_partners.coach_ui_prefs (own-row PATCH — NOT coach_profile,
     whose save_profile whitelist would strip unknown keys), calendar tile "type vs client name",
     active/archived thread filter on Messages. Zero EF changes. Wraps existing functions by
     reassigning their bindings at the tail (renderDashboard / w6visible / w7SettingsPane /
     renderThreadList) so the originals stay intact. Everything is hidden at VYVE null scope.
     The snapshot EF (coach-weekly-snapshot) is cron-fed; W1 reads it. */
  var w0 = { prefs: null, arch: false };
  var W0_KEY_TILE = 'calendar_tile', W0_KEY_GS = 'get_started_dismissed', W0_KEY_ARCH = 'archived_threads';
  (function w0css(){
    var s = document.createElement('style');
    s.textContent = '.w0-qa{position:relative;margin:0 2px 8px;}' +
      '.w0-qa-btn{display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border-radius:8px;border:1px dashed var(--border);background:transparent;color:var(--teal-lt);font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:left;}' +
      '.w0-qa-btn:hover{background:var(--surface-2);}' +
      '.w0-qa-menu{display:none;position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:70;padding:6px;}' +
      '.w0-qa-menu.open{display:block;}' +
      '.w0-qa-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:7px;background:transparent;color:var(--text);font:inherit;font-size:13px;cursor:pointer;text-align:left;}' +
      '.w0-qa-menu button:hover{background:var(--surface-2);}' +
      '.w0-qa-menu .k{font-size:10.5px;color:var(--text-muted);margin-left:auto;}' +
      '.w0-gs{border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin:0 0 16px;background:var(--surface-2);}' +
      '.w0-gs h3{margin:0 0 2px;font-size:14px;}' +
      '.w0-gs .sub{font-size:12px;color:var(--text-muted);margin:0 0 10px;}' +
      '.w0-gs .bar{height:6px;border-radius:99px;background:var(--border);overflow:hidden;margin:0 0 12px;}' +
      '.w0-gs .bar i{display:block;height:100%;background:#1B7878;border-radius:99px;transition:width .3s;}' +
      '.w0-gs ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px 14px;}' +
      '.w0-gs li{display:flex;align-items:center;gap:9px;font-size:13px;}' +
      '.w0-gs li .d{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;}' +
      '.w0-gs li.done .d{background:#1B7878;border-color:#1B7878;color:#fff;}' +
      '.w0-gs li.done span{color:var(--text-muted);text-decoration:line-through;}' +
      '.w0-gs li button{border:0;background:none;color:var(--teal-lt);font:inherit;font-size:13px;cursor:pointer;padding:0;text-align:left;}' +
      '.w0-gs .foot{display:flex;justify-content:flex-end;margin-top:10px;}' +
      '.w0-gs .foot button{border:0;background:none;color:var(--text-muted);font:inherit;font-size:12px;cursor:pointer;}' +
      '.w0-thf{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid var(--border);}' +
      '.w0-thf button{flex:1;padding:5px 8px;border-radius:99px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;}' +
      '.w0-thf button.on{background:var(--surface-2);color:var(--text);}' +
      '.w0-arch{border:0;background:none;color:var(--text-muted);font-size:11px;cursor:pointer;padding:2px 4px;border-radius:5px;opacity:.7;}' +
      '.w0-arch:hover{opacity:1;background:var(--surface-2);}';
    document.head.appendChild(s);
  })();

  async function w0loadPrefs(){
    if (!partnerId){ w0.prefs = {}; return w0.prefs; }
    try {
      var p = await rest('/partner_partners?id=eq.' + partnerId + '&select=coach_ui_prefs,coach_notification_prefs&limit=1');
      w0.prefs = (p && p[0] && p[0].coach_ui_prefs) || {};
      exShelvesFromPrefs(); /* PM-1208 */
      w0.notifyPrefs = (p && p[0] && p[0].coach_notification_prefs) || null;
    } catch(_){ w0.prefs = w0.prefs || {}; }
    return w0.prefs;
  }
  async function w0savePrefs(patch){
    w0.prefs = Object.assign({}, w0.prefs || {}, patch);
    if (!partnerId) return;
    try { await rest('/partner_partners?id=eq.' + partnerId, { method: 'PATCH', body: { coach_ui_prefs: w0.prefs } }); }
    catch(e){ console.warn('[w0] prefs save failed', e && e.message); }
  }

  /* ── Quick add (+) ── */
  function w0quickAdd(){
    if (!partnerId) return;
    var side = $c('cp-side'); if (!side || $c('w0-qa')) return;
    var brand = side.querySelector('.side-brand');
    var wrap = document.createElement('div'); wrap.className = 'w0-qa'; wrap.id = 'w0-qa';
    wrap.innerHTML = '<button type="button" class="w0-qa-btn" id="w0-qa-btn" aria-haspopup="true" aria-expanded="false"><span style="font-size:16px;line-height:1;">+</span> Quick add</button>' +
      '<div class="w0-qa-menu" id="w0-qa-menu" role="menu">' +
        '<button type="button" data-w0qa="client">Client <span class="k">wizard</span></button>' +
        '<button type="button" data-w0qa="message">Message <span class="k">a client</span></button>' +
        '<button type="button" data-w0qa="event">Event <span class="k">calendar</span></button>' +
        '<button type="button" data-w0qa="announce">Announcement <span class="k">all clients</span></button>' +
      '</div>';
    if (brand && brand.nextSibling) side.insertBefore(wrap, brand.nextSibling); else side.appendChild(wrap);
    var btn = $c('w0-qa-btn'), menu = $c('w0-qa-menu');
    function close(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function(e){ e.stopPropagation(); var o = !menu.classList.contains('open'); menu.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', function(e){ if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
    menu.querySelectorAll('[data-w0qa]').forEach(function(b){
      b.addEventListener('click', function(){
        close();
        var k = b.dataset.w0qa;
        if (k === 'client'){ go('clients'); wzOpen(null); }
        else if (k === 'message'){ go('messages'); }
        else if (k === 'event'){ go('calendar'); setTimeout(function(){ var x = $c('w6-new-event'); if (x) x.click(); }, 350); }
        else if (k === 'announce'){ go('messages'); setTimeout(function(){ var x = $c('msg-bcast'); if (x) x.click(); }, 350); }
      });
    });
  }

  /* ── Get-Started checklist on the cockpit ── */
  async function w0gsChecks(){
    var hasClient = roster.length > 0;
    var hasCheckin = roster.some(function(c){ return c.assignments && c.assignments.checkin_form_id; });
    var hasProgramme = false;
    try { var t = await rest('/coach_templates?' + pscope() + '&kind=in.(workout,program)&active=eq.true&select=id&limit=1'); hasProgramme = !!(t && t.length); } catch(_){}
    var hasNotify = !!(w0.notifyPrefs && Object.keys(w0.notifyPrefs).length);
    return [
      { k: 'client', label: 'Add your first client', done: hasClient, go: function(){ go('clients'); wzOpen(null); } },
      { k: 'programme', label: 'Build a workout programme', done: hasProgramme, go: function(){ go('kindsel:program'); } },
      { k: 'checkin', label: 'Assign a weekly check-in form', done: hasCheckin, go: function(){ go(hasClient ? 'clients' : 'kindsel:checkin'); } },
      { k: 'notify', label: 'Choose your notifications', done: hasNotify, go: function(){ go('settings'); } }
    ];
  }
  async function w0gsRender(){
    var host = document.querySelector('#view-dashboard .card');
    var old = $c('w0-gs'); if (old) old.remove();
    if (!partnerId || !host) return;
    if (!w0.prefs) await w0loadPrefs();
    if (w0.prefs[W0_KEY_GS]) return;
    var items = await w0gsChecks();
    var done = items.filter(function(i){ return i.done; }).length;
    if (done === items.length) return; // all four met — the card retires itself
    var card = document.createElement('div'); card.className = 'w0-gs'; card.id = 'w0-gs';
    card.innerHTML = '<h3>Get started</h3><p class="sub">' + done + ' of ' + items.length + ' done \u2014 the four steps that make the portal work for you.</p>' +
      '<div class="bar"><i style="width:' + Math.round(done / items.length * 100) + '%;"></i></div>' +
      '<ul>' + items.map(function(i){
        return '<li class="' + (i.done ? 'done' : '') + '"><span class="d">' + (i.done ? '\u2713' : '') + '</span>' + (i.done ? '<span>' + esc(i.label) + '</span>' : '<button type="button" data-w0gs="' + i.k + '">' + esc(i.label) + ' \u2192</button>') + '</li>';
      }).join('') + '</ul>' +
      '<div class="foot"><button type="button" id="w0-gs-dismiss">Hide this</button></div>';
    var anchor = $c('dash-qa');
    if (anchor && anchor.parentElement === host) host.insertBefore(card, anchor); else host.appendChild(card);
    card.querySelectorAll('[data-w0gs]').forEach(function(b){ b.addEventListener('click', function(){ var it = items.find(function(i){ return i.k === b.dataset.w0gs; }); if (it) it.go(); }); });
    $c('w0-gs-dismiss').addEventListener('click', function(){ card.remove(); w0savePrefs((function(){ var o = {}; o[W0_KEY_GS] = true; return o; })()); });
  }
  (function(){
    var _rd = renderDashboard;
    renderDashboard = async function(){ var r = await _rd.apply(this, arguments); try { await w0gsRender(); } catch(e){ console.warn('[w0] get-started', e && e.message); } return r; };
  })();

  /* ── Calendar tile: event type vs client name (coach_ui_prefs.calendar_tile) ── */
  (function(){
    var _vis = w6visible;
    w6visible = function(){
      var items = _vis.apply(this, arguments);
      if (!w0.prefs || w0.prefs[W0_KEY_TILE] !== 'name') return items;
      return items.map(function(it){
        if (!it.who) return it;
        var nm = w6who(it.who);
        return nm ? Object.assign({}, it, { title: nm, _w0type: it.title }) : it;
      });
    };
    var _sp = w7SettingsPane;
    w7SettingsPane = function(){
      var cur = (w0.prefs && w0.prefs[W0_KEY_TILE]) === 'name' ? 'name' : 'type';
      return _sp.apply(this, arguments) +
        '<div class="card" style="margin:0 0 18px;"><h3 style="margin:0 0 6px;font-size:14px;">Calendar</h3>' +
        '<p style="font-size:12px;color:var(--text-muted);margin:0 0 8px;">What each tile shows on the calendar grid.</p>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><label style="font-size:12.5px;color:var(--text-muted);">Calendar tiles show</label>' +
        '<select id="w0-caltile" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:12.5px;">' +
        '<option value="type"' + (cur === 'type' ? ' selected' : '') + '>Event type / title</option>' +
        '<option value="name"' + (cur === 'name' ? ' selected' : '') + '>Client name</option></select>' +
        '<span id="w0-caltile-msg" style="font-size:12px;color:var(--text-muted);"></span></div></div>';
    };
    document.addEventListener('change', function(e){
      if (!e.target || e.target.id !== 'w0-caltile') return;
      var v = e.target.value === 'name' ? 'name' : 'type';
      var o = {}; o[W0_KEY_TILE] = v;
      w0savePrefs(o).then(function(){ var m = $c('w0-caltile-msg'); if (m){ m.textContent = 'Saved'; setTimeout(function(){ m.textContent = ''; }, 1800); } });
    });
  })();

  /* ── Messages: active / archived conversation filter (coach_ui_prefs.archived_threads[]) ── */
  (function(){
    var _rtl = renderThreadList;
    renderThreadList = function(){
      _rtl.apply(this, arguments);
      if (!partnerId) return;
      var el = $c('msg-threads'); if (!el) return;
      var archived = (w0.prefs && Array.isArray(w0.prefs[W0_KEY_ARCH])) ? w0.prefs[W0_KEY_ARCH] : [];
      var rows = el.querySelectorAll('.msg-th'); if (!rows.length) return;
      var nArch = 0;
      rows.forEach(function(r){
        var em = r.dataset.em, isArch = archived.indexOf(em) >= 0;
        if (isArch) nArch++;
        r.style.display = (isArch === w0.arch) ? '' : 'none';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'w0-arch'; b.title = isArch ? 'Restore to active' : 'Archive conversation';
        b.textContent = isArch ? '\u21a9' : '\u2913';
        b.addEventListener('click', function(e){
          e.stopPropagation();
          var next = archived.filter(function(x){ return x !== em; });
          if (!isArch) next.push(em);
          var o = {}; o[W0_KEY_ARCH] = next;
          w0savePrefs(o).then(function(){ renderThreadList(); });
        });
        r.appendChild(b);
      });
      var f = document.createElement('div'); f.className = 'w0-thf';
      f.innerHTML = '<button type="button" data-w0th="0" class="' + (!w0.arch ? 'on' : '') + '">Active</button><button type="button" data-w0th="1" class="' + (w0.arch ? 'on' : '') + '">Archived' + (nArch ? ' (' + nArch + ')' : '') + '</button>';
      f.querySelectorAll('[data-w0th]').forEach(function(b){ b.addEventListener('click', function(){ w0.arch = b.dataset.w0th === '1'; renderThreadList(); }); });
      el.insertBefore(f, el.firstChild);
      if (w0.arch && !nArch) el.insertAdjacentHTML('beforeend', '<div style="padding:18px;font-size:12.5px;color:var(--text-muted);">No archived conversations.</div>');
    };
  })();

  /* ── boot hook: prefs first, then the chrome; waits for partnerId like the W6 badge boot ── */
  (function(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (tries < 90 && !(inited && (partnerId || vyveScope))) return;
      clearInterval(t);
      if (!partnerId) return; // VYVE null scope: none of W0's chrome applies
      w0loadPrefs().then(function(){ w0quickAdd(); if ($c('view-dashboard') && $c('view-dashboard').style.display !== 'none') w0gsRender(); }).catch(function(){});
    }, 500);
  })();
  /* ============================ end PM-1073 W0 ============================ */

