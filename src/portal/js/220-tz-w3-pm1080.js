  /* ============================ PM-1080 Trainerize W3 ============================
     Messaging depth: group threads (#68, fan-out rows tied by thread_id + group_key), attachments (#76,
     private bucket coach-message-media, signed URLs), voice notes (#77, MediaRecorder), Realtime (#71).
     Shadows the PM-960/W2 message functions by same-scope redeclaration; W0's archive wrapper still wraps
     renderThreadList (it captured this file's hoisted declaration). Direct threads = thread_id IS NULL. */
  var W3_BUCKET = 'coach-message-media', W3_MAX_ATT = 4, W3_IMG_MAX = 1600;
  var w3 = { threads: [], unread: {}, thread: null, members: [], sig: {}, sigPending: false, chan: null, att: [], rec: null, recChunks: [], recBlob: null, recMime: '', recTimer: null, recStart: 0, gk: null };
  (function w3css(){
    var s = document.createElement('style');
    s.textContent =
      '.w3-th{display:flex;width:100%;align-items:center;gap:10px;padding:12px 14px;border:0;border-bottom:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;text-align:left;font:inherit;}' +
      '.w3-th.sel{background:var(--surface-2);}' +
      '.w3-gava{width:34px;height:34px;border-radius:50%;background:rgba(201,168,76,.16);border:1px solid #C9A84C;color:#C9A84C;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}' +
      '.w3-sec{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);padding:10px 14px 4px;font-weight:700;}' +
      '.w3-who{font-size:10.5px;color:#C9A84C;font-weight:700;margin:0 4px 2px;}' +
      '.w3-seen{font-size:10.5px;color:var(--text-muted);margin:2px 4px 0;}' +
      '.w3-img{max-width:260px;max-height:220px;border-radius:10px;display:block;cursor:zoom-in;}' +
      '.w3-file{display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit;}' +
      '.w3-file .ic{width:34px;height:40px;border-radius:6px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex:none;}' +
      '.w3-aud{min-width:220px;max-width:100%;}' +
      '.w3-ic{width:34px;height:34px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;flex:none;color:var(--text);}' +
      '.w3-ic.rec{background:rgba(232,131,74,.2);border-color:#E8834A;color:#E8834A;animation:w3pulse 1s infinite;}@keyframes w3pulse{50%{opacity:.5}}' +
      '#w3-att{display:none;gap:8px;padding:8px 10px 0;flex-wrap:wrap;border-top:1px solid var(--border);}' +
      '.w3-chip{display:flex;gap:6px;align-items:center;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:5px 9px;font-size:11.5px;}.w3-chip b{color:var(--text-muted);cursor:pointer;font-weight:400;}' +
      '#w3-recbar{display:none;gap:10px;align-items:center;padding:10px;border-top:1px solid var(--border);}' +
      '#w3-recbar .bar{flex:1;height:22px;background:repeating-linear-gradient(90deg,rgba(232,131,74,.7) 0 2px,transparent 2px 5px);border-radius:3px;}' +
      '#w3-recbar .t{font-size:12px;color:#E8834A;font-weight:700;white-space:nowrap;}' +
      '.w3-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:900;display:flex;align-items:center;justify-content:center;padding:16px;}' +
      '.w3-modal{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;width:100%;max-width:460px;max-height:90vh;overflow:auto;}' +
      '.w3-modal h3{font-size:14px;margin:0 0 8px;}.w3-modal label{display:block;font-size:11.5px;color:var(--text-muted);margin:10px 0 4px;}' +
      '.w3-modal input[type=text]{width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font:inherit;}' +
      '.w3-cl{display:flex;flex-wrap:wrap;gap:6px;}.w3-cl span{border:1px solid var(--border);border-radius:99px;padding:4px 10px;font-size:12px;cursor:pointer;user-select:none;}.w3-cl span.on{background:#1B7878;border-color:#1B7878;color:#fff;}' +
      '.w3-note{font-size:11.5px;color:var(--text-muted);margin-top:8px;}' +
      '#msg-head .w3-hm{font-size:11.5px;color:var(--text-muted);font-weight:400;}#msg-head .w3-hm u{cursor:pointer;}' +
      '.w3-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:950;display:flex;align-items:center;justify-content:center;cursor:zoom-out;}.w3-lightbox img{max-width:96vw;max-height:92vh;border-radius:8px;}';
    document.head.appendChild(s);
  })();
  function w3isGroup(){ return !!(msgThread && msgThread.indexOf('g:') === 0); }
  function w3tid(){ return w3isGroup() ? msgThread.slice(2) : null; }
  function w3uuid(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  function w3sel(){ return 'select=id,sender,body,created_at,read_at,deliver_at,thread_id,group_key,attachment_path,attachment_kind,attachment_name,member_email'; }
  function w3fmtSize(n){ return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function w3clientName(em){ var c = roster.filter(function(x){ return (x.member_email || '').toLowerCase() === (em || '').toLowerCase(); })[0]; return c ? nameOf(c) : (em || ''); }
  function w3first(em){ return (w3clientName(em) || '').split(/\s+/)[0] || ''; }
  function w3activeEmails(){ return roster.filter(function(c){ return c.status === 'active' && !c.lapsed_at; }).map(function(c){ return (c.member_email || '').toLowerCase(); }); }

  /* ── threads + unread ── */
  async function w3loadThreads(){
    if (!partnerId) { w3.threads = []; return; }
    try { w3.threads = await rest('/coach_threads?' + pscope() + '&kind=neq.direct&order=last_message_at.desc.nullslast,created_at.desc&select=id,title,kind,archived,last_message_at,coach_thread_members(member_email)') || []; }
    catch(_){ w3.threads = w3.threads || []; }
  }
  async function msgBadgeRefresh(){ // W3 SHADOW — splits unread into direct (by email) and group (by thread)
    if (!partnerId) return;
    try {
      var rows = await rest('/coach_messages?' + pscope() + '&sender=eq.member&read_at=is.null&select=member_email,thread_id&limit=400') || [];
      msgUnread = {}; w3.unread = {};
      rows.forEach(function(r){
        if (r.thread_id){ w3.unread[r.thread_id] = (w3.unread[r.thread_id] || 0) + 1; }
        else { var k = (r.member_email || '').toLowerCase(); msgUnread[k] = (msgUnread[k] || 0) + 1; }
      });
      msgSetBadge(rows.length);
    } catch(_){}
  }
  function w3badgeTotal(){ var t = 0; Object.keys(msgUnread).forEach(function(k){ t += msgUnread[k]; }); Object.keys(w3.unread).forEach(function(k){ t += w3.unread[k]; }); msgSetBadge(t); }
  function renderThreadList(){ // W3 base — the legacy direct list, byte-equivalent in shape (W0 wraps it, the W3 post-wrapper adds groups)
    var el = $c('msg-threads');
    var actives = roster.filter(function(c){ return c.status === 'active'; });
    if (!actives.length){ el.innerHTML = '<div style="padding:18px;font-size:12.5px;color:var(--text-muted);">No active clients yet \u2014 conversations open when a client accepts your terms.</div>'; return; }
    el.innerHTML = actives.map(function(c){
      var em = (c.member_email||'').toLowerCase();
      var un = msgUnread[em] || 0;
      var sel = msgThread === em;
      return '<button type="button" class="msg-th" data-em="' + esc(em) + '" style="display:flex;width:100%;align-items:center;gap:10px;padding:12px 14px;border:0;border-bottom:1px solid var(--border);background:' + (sel ? 'var(--surface-2)' : 'transparent') + ';color:var(--text);cursor:pointer;text-align:left;">' +
        '<div style="width:34px;height:34px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">' + esc((nameOf(c)||'?').trim().slice(0,1).toUpperCase()) + '</div>' +
        '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nameOf(c)) + '</div></div>' +
        (un ? '<span style="background:#E8834A;color:#fff;border-radius:99px;font-size:10px;font-weight:800;padding:2px 8px;">' + un + '</span>' : '') +
        '</button>';
    }).join('');
    el.querySelectorAll('.msg-th').forEach(function(b){ b.addEventListener('click', function(){ msgOpen(b.dataset.em); }); });
  }
  (function w3wrapList(){
    var prev = renderThreadList; // = W0's archive wrapper around this file's base
    renderThreadList = function(){
      prev.apply(this, arguments);
      if (!partnerId) return;
      var el = $c('msg-threads'); if (!el) return;
      var arch = !!w0.arch;
      var groups = (w3.threads || []).filter(function(t){ return !!t.archived === arch; });
      var nArchG = (w3.threads || []).filter(function(t){ return t.archived; }).length;
      var f = el.querySelector('.w0-thf');
      if (f && nArchG){ var b = f.querySelector('[data-w0th="1"]'); if (b){ var m = /\((\d+)\)/.exec(b.textContent); var n = (m ? parseInt(m[1], 10) : 0) + nArchG; b.textContent = 'Archived (' + n + ')'; } }
      if (!groups.length) return;
      var html = '<div class="w3-sec">Groups</div>' + groups.map(function(t){
        var n = (t.coach_thread_members || []).length, un = w3.unread[t.id] || 0, sel = msgThread === 'g:' + t.id;
        return '<button type="button" class="w3-th' + (sel ? ' sel' : '') + '" data-tid="' + esc(t.id) + '"><div class="w3-gava">&#9673;</div>' +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(t.title) + '</div><div style="font-size:11px;color:var(--text-muted);">Group \u00b7 ' + n + ' client' + (n === 1 ? '' : 's') + '</div></div>' +
          (un ? '<span style="background:#E8834A;color:#fff;border-radius:99px;font-size:10px;font-weight:800;padding:2px 8px;">' + un + '</span>' : '') + '</button>';
      }).join('') + (el.querySelector('.msg-th') ? '<div class="w3-sec">Clients</div>' : '');
      var anchor = f ? f.nextSibling : el.firstChild;
      var wrap = document.createElement('div'); wrap.innerHTML = html;
      while (wrap.firstChild) el.insertBefore(wrap.firstChild, anchor);
      el.querySelectorAll('.w3-th').forEach(function(b){ b.addEventListener('click', function(){ msgOpen('g:' + b.dataset.tid); }); });
    };
  })();

  /* ── open / render / poll / read ── */
  async function msgInit(){ // W3 SHADOW — legacy body + threads + Realtime subscription
    await w3loadThreads();
    renderThreadList();
    msgShowPane(!!msgThread);
    await msgBadgeRefresh();
    renderThreadList();
    if (msgTimer) clearInterval(msgTimer);
    msgTimer = setInterval(function(){
      if ($c('view-msgs').style.display === 'none'){ clearInterval(msgTimer); msgTimer = null; return; }
      if (msgThread) msgPoll();
      else msgBadgeRefresh().then(renderThreadList).catch(function(){});
    }, 15000);
    w3subscribe();
  }
  function w3subscribe(){
    if (w3.chan || !partnerId || !sb() || !sb().channel) return;
    try {
      jwt().then(function(t){ try { if (t && sb().realtime && sb().realtime.setAuth) sb().realtime.setAuth(t); } catch(_){} });
      w3.chan = sb().channel('w3-cmsg-' + partnerId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coach_messages', filter: 'partner_id=eq.' + partnerId }, function(p){
          var n = p && p.new; if (!n) return;
          var mine = msgThread && ((n.thread_id && msgThread === 'g:' + n.thread_id) || (!n.thread_id && (n.member_email || '').toLowerCase() === msgThread));
          if (mine){ msgPoll(); return; }
          if (n.sender === 'member'){
            if (n.thread_id) w3.unread[n.thread_id] = (w3.unread[n.thread_id] || 0) + 1;
            else { var k = (n.member_email || '').toLowerCase(); msgUnread[k] = (msgUnread[k] || 0) + 1; }
            w3badgeTotal();
            if ($c('view-msgs') && $c('view-msgs').style.display !== 'none') renderThreadList();
          }
        })
        .subscribe();
    } catch(_){ w3.chan = null; }
  }
  function w3head(){
    var h = $c('msg-head-name');
    if (w3isGroup() && w3.thread){
      var ms = (w3.thread.coach_thread_members || []).map(function(m){ return w3first(m.member_email); }).filter(Boolean);
      h.innerHTML = '<div>' + esc(w3.thread.title) + '</div><div class="w3-hm">' + esc(ms.join(', ') || 'No clients yet') + ' \u00b7 <u data-w3="manage">Manage</u> \u00b7 <u data-w3="arch">' + (w3.thread.archived ? 'Restore' : 'Archive') + '</u></div>';
      h.querySelector('[data-w3="manage"]').addEventListener('click', function(){ w3modal(w3.thread); });
      h.querySelector('[data-w3="arch"]').addEventListener('click', async function(){
        try { await rest('/coach_threads?id=eq.' + w3.thread.id + '&' + pscope(), { method: 'PATCH', body: { archived: !w3.thread.archived } }); w3.thread.archived = !w3.thread.archived; await w3loadThreads(); renderThreadList(); w3head(); }
        catch(e){ alert('Couldn\u2019t update \u2014 ' + e.message); }
      });
    }
    var sch = $c('w2-sched-btn'); if (sch) sch.style.display = w3isGroup() ? 'none' : '';
  }
  async function msgOpen(key){ // W3 SHADOW — direct (thread_id IS NULL) or group ('g:<thread_id>')
    msgThread = key;
    w3.thread = w3isGroup() ? (w3.threads.filter(function(t){ return t.id === w3tid(); })[0] || null) : null;
    w3.gk = null; w3clearAtt();
    var c = !w3isGroup() ? roster.filter(function(x){ return (x.member_email||'').toLowerCase() === key; })[0] : null;
    $c('msg-head-name').textContent = w3isGroup() ? (w3.thread ? w3.thread.title : 'Group') : (c ? nameOf(c) : key);
    $c('msg-head').style.display = 'flex';
    $c('msg-compose').style.display = 'flex';
    $c('msg-empty').style.display = 'none';
    $c('msg-input').placeholder = w3isGroup() ? 'Message the group\u2026' : 'Message\u2026';
    msgShowPane(true);
    renderThreadList();
    w3head();
    msgRows = []; msgLastId = null; msgRender();
    try {
      var q = w3isGroup() ? ('&thread_id=eq.' + w3tid() + '&limit=400') : ('&member_email=eq.' + encodeURIComponent(key) + '&thread_id=is.null&limit=200');
      var rows = await rest('/coach_messages?' + pscope() + q + '&order=created_at.asc&' + w3sel()) || [];
      msgRows = w3fold(rows);
      if (msgRows.length) msgLastId = rows[rows.length - 1].created_at;
      msgRender();
      msgMarkRead(key);
    } catch(e){ $c('msg-list').innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;margin:auto;">Couldn\u2019t load messages \u2014 ' + esc(e.message) + '</div>'; }
  }
  function w3fold(rows){ // group fan-out: one bubble per coach group_key with seen n/N; member rows as-is
    if (!w3isGroup()) return rows;
    var out = [], byKey = {};
    rows.forEach(function(m){
      if (m.sender === 'coach' && m.group_key){
        var g = byKey[m.group_key];
        if (!g){ g = Object.assign({}, m, { _copies: 0, _seen: 0 }); byKey[m.group_key] = g; out.push(g); }
        g._copies++; if (m.read_at) g._seen++;
      } else out.push(m);
    });
    return out;
  }
  function msgMarkRead(key){ // W3 SHADOW
    if (w3isGroup()){
      var tid = w3tid(); if (!w3.unread[tid]) return;
      rest('/coach_messages?' + pscope() + '&thread_id=eq.' + tid + '&sender=eq.member&read_at=is.null', { method: 'PATCH', body: { read_at: new Date().toISOString() } }).then(function(){ delete w3.unread[tid]; w3badgeTotal(); renderThreadList(); }).catch(function(){});
      return;
    }
    var k = key.toLowerCase();
    if (!msgUnread[k]) return;
    rest('/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(key) + '&thread_id=is.null&sender=eq.member&read_at=is.null', { method: 'PATCH', body: { read_at: new Date().toISOString() } }).then(function(){ delete msgUnread[k]; w3badgeTotal(); renderThreadList(); }).catch(function(){});
  }
  async function msgPoll(){ // W3 SHADOW — group polls the thread; direct excludes group copies; delivered scheduled rows re-sort
    if (!msgThread) return;
    try {
      var q = w3isGroup() ? ('&thread_id=eq.' + w3tid() + '&limit=200') : ('&member_email=eq.' + encodeURIComponent(msgThread) + '&thread_id=is.null&limit=50');
      var fresh = await rest('/coach_messages?' + pscope() + q + '&order=created_at.asc&' + w3sel() + (msgLastId ? '&created_at=gt.' + encodeURIComponent(msgLastId) : '')) || [];
      if (!fresh.length) return;
      if (w3isGroup()){
        var ids = {}; msgRows.forEach(function(m){ ids[m.id] = 1; if (m.group_key) ids['gk:' + m.group_key] = m; });
        var add = [];
        fresh.forEach(function(m){
          if (ids[m.id]) return;
          if (m.sender === 'coach' && m.group_key && ids['gk:' + m.group_key]){ var g = ids['gk:' + m.group_key]; g._copies = (g._copies || 1) + 1; if (m.read_at) g._seen = (g._seen || 0) + 1; return; }
          add.push(m);
        });
        w3fold(add).forEach(function(m){ msgRows.push(m); });
      } else {
        var seen = {}; msgRows.forEach(function(m){ seen[m.id] = m; });
        fresh.forEach(function(m){ if (seen[m.id]) Object.assign(seen[m.id], m); else msgRows.push(m); });
      }
      msgRows.sort(function(a, b){ return a.created_at < b.created_at ? -1 : 1; });
      msgLastId = fresh[fresh.length - 1].created_at;
      msgRender(); msgMarkRead(msgThread);
    } catch(_){}
  }
  function w3attHtml(m){
    if (!m.attachment_path) return '';
    var url = w3.sig[m.attachment_path];
    var name = esc(m.attachment_name || m.attachment_path.split('/').pop());
    if (!url) return '<div style="font-size:12px;opacity:.7;">' + (m.attachment_kind === 'image' ? '\uD83D\uDDBC' : m.attachment_kind === 'audio' ? '\uD83C\uDFA4' : '\uD83D\uDCCE') + ' ' + name + ' \u2026</div>';
    if (m.attachment_kind === 'image') return '<img class="w3-img" src="' + esc(url) + '" alt="' + name + '" data-w3lb="' + esc(url) + '">';
    if (m.attachment_kind === 'audio') return '<audio class="w3-aud" controls preload="metadata" src="' + esc(url) + '"></audio>';
    if (m.attachment_kind === 'video') return '<video controls preload="metadata" style="max-width:280px;border-radius:10px;display:block;" src="' + esc(url) + '"></video>';
    return '<a class="w3-file" href="' + esc(url) + '" target="_blank" rel="noopener"><span class="ic">' + esc((m.attachment_name || '').split('.').pop().slice(0, 4).toUpperCase() || 'FILE') + '</span><span><span style="font-weight:600;font-size:12.5px;display:block;">' + name + '</span><span style="font-size:11px;opacity:.7;">Open</span></span></a>';
  }
  function msgBubble(m){ // W3 SHADOW — W2's scheduled chip + attachments + group names + seen
    var mine = m.sender === 'coach';
    var future = m.deliver_at && Date.parse(m.deliver_at) > Date.now();
    var when = future ? '' : new Date(m.created_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    var meta = future
      ? '<span class="w2-clock">\u23F1 Scheduled ' + new Date(m.deliver_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '<a data-w2cancel="' + m.id + '">Cancel</a></span>'
      : when;
    var who = (!mine && w3isGroup()) ? '<div class="w3-who">' + esc(w3first(m.member_email) || m.member_email) + '</div>' : '';
    var seen = (mine && w3isGroup() && m._copies) ? '<div class="w3-seen">Seen by ' + m._seen + '/' + m._copies + '</div>' : '';
    var att = w3attHtml(m);
    var body = m.body ? esc(m.body) : '';
    return '<div style="display:flex;flex-direction:column;align-items:' + (mine ? 'flex-end' : 'flex-start') + ';">' + who +
      '<div style="max-width:78%;padding:' + (att && m.attachment_kind === 'image' && !body ? '4px' : '9px 13px') + ';border-radius:14px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;' +
      (future ? 'border:1px dashed #C9A84C;color:var(--text);border-bottom-right-radius:4px;' : mine ? 'background:#1B7878;color:#fff;border-bottom-right-radius:4px;' : 'background:var(--surface-2);border:1px solid var(--border);border-bottom-left-radius:4px;') + '">' + att + (att && body ? '<div style="margin-top:6px;">' + body + '</div>' : body) + '</div>' +
      '<div style="font-size:10.5px;color:var(--text-muted);margin:3px 4px 0;">' + meta + '</div>' + seen + '</div>';
  }
  function msgRender(){ // W3 SHADOW — signs attachment URLs lazily then re-renders once
    var el = $c('msg-list');
    el.innerHTML = msgRows.length ? msgRows.map(msgBubble).join('') : '<div style="color:var(--text-muted);font-size:13px;text-align:center;margin:auto;">' + (w3isGroup() ? 'No messages yet \u2014 say hello to the group.' : 'No messages yet \u2014 say hello.') + '</div>';
    el.scrollTop = el.scrollHeight;
    var need = msgRows.filter(function(m){ return m.attachment_path && !w3.sig[m.attachment_path]; }).map(function(m){ return m.attachment_path; });
    if (need.length && !w3.sigPending && sb() && sb().storage){
      w3.sigPending = true;
      sb().storage.from(W3_BUCKET).createSignedUrls(need, 3600).then(function(r){
        (r && r.data || []).forEach(function(x){ if (x && x.signedUrl && x.path) w3.sig[x.path] = x.signedUrl; });
        need.forEach(function(p){ if (!w3.sig[p]) w3.sig[p] = ''; });
        w3.sigPending = false; if (r && r.data && r.data.length) msgRender();
      }).catch(function(){ w3.sigPending = false; });
    }
  }
  document.addEventListener('click', function(ev){
    var im = ev.target.closest && ev.target.closest('[data-w3lb]');
    if (!im) return;
    var lb = document.createElement('div'); lb.className = 'w3-lightbox'; lb.innerHTML = '<img src="' + esc(im.dataset.w3lb) + '">';
    lb.addEventListener('click', function(){ lb.remove(); }); document.body.appendChild(lb);
  });

  /* ── send: text, attachments, fan-out ── */
  function w3recipients(){
    if (!w3isGroup()) return [msgThread];
    var act = w3activeEmails();
    return (w3.thread && w3.thread.coach_thread_members || []).map(function(m){ return (m.member_email || '').toLowerCase(); }).filter(function(e){ return act.indexOf(e) >= 0; });
  }
  function w3rows(fields){
    var to = w3recipients(), tid = w3tid(), gk = tid ? w3uuid() : null;
    return to.map(function(em){ return Object.assign({ partner_id: partnerId, member_email: em, sender: 'coach', thread_id: tid, group_key: gk }, fields); });
  }
  async function w3post(fields){
    var rows = w3rows(fields);
    if (!rows.length) throw new Error('nobody active in this group');
    var out = await rest('/coach_messages?' + w3sel(), { method: 'POST', body: rows });
    var first = (out && out[0]) || Object.assign({ id: 'tmp-' + Date.now(), created_at: new Date().toISOString() }, rows[0]);
    if (w3isGroup()){ first._copies = rows.length; first._seen = 0; }
    msgRows.push(first); msgLastId = first.created_at; msgRender();
  }
  async function w3upload(file, kind, ext){
    var path = 'p-' + partnerId + '/' + kind + '/' + w3uuid() + '.' + ext;
    var up = await sb().storage.from(W3_BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (up.error) throw new Error(up.error.message || 'upload failed');
    return path;
  }
  function w3shrink(file){
    return new Promise(function(res){
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size < 400 * 1024) return res(file);
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function(){
        var s = Math.min(1, W3_IMG_MAX / Math.max(img.width, img.height));
        if (s >= 1){ URL.revokeObjectURL(u); return res(file); }
        var cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function(b){ URL.revokeObjectURL(u); res(b ? new File([b], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', 0.85);
      };
      img.onerror = function(){ URL.revokeObjectURL(u); res(file); };
      img.src = u;
    });
  }
  function w3kindOf(f){ return /^image\//.test(f.type) ? 'image' : /^video\//.test(f.type) ? 'video' : /^audio\//.test(f.type) ? 'audio' : 'file'; }
  function w3extOf(f){ var m = /\.([a-z0-9]{1,5})$/i.exec(f.name || ''); if (m) return m[1].toLowerCase(); var t = (f.type || '').split('/')[1] || 'bin'; return t === 'jpeg' ? 'jpg' : t.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'; }
  function w3clearAtt(){ w3.att = []; w3renderAtt(); }
  function w3renderAtt(){
    var el = $c('w3-att'); if (!el) return;
    el.style.display = w3.att.length ? 'flex' : 'none';
    el.innerHTML = w3.att.map(function(f, i){ return '<span class="w3-chip">' + (w3kindOf(f) === 'image' ? '\uD83D\uDDBC' : '\uD83D\uDCC4') + ' ' + esc(f.name) + ' \u00b7 ' + w3fmtSize(f.size) + ' <b data-w3rm="' + i + '">\u2715</b></span>'; }).join('');
    el.querySelectorAll('[data-w3rm]').forEach(function(b){ b.addEventListener('click', function(){ w3.att.splice(parseInt(b.dataset.w3rm, 10), 1); w3renderAtt(); }); });
    var inp = $c('msg-input'); if (inp) inp.placeholder = w3.att.length ? 'Add a caption (optional)' : (w3isGroup() ? 'Message the group\u2026' : 'Message\u2026');
  }
  async function msgSend(){ // W3 SHADOW — text and/or attachments; group fans out
    var inp = $c('msg-input');
    var body = inp.value.trim();
    if ((!body && !w3.att.length) || !msgThread) return;
    var btn = $c('msg-send'); btn.disabled = true;
    try {
      if (!w3.att.length){ await w3post({ body: body }); }
      else {
        var files = w3.att.slice(0, W3_MAX_ATT); w3.att = []; w3renderAtt();
        for (var i = 0; i < files.length; i++){
          var f = await w3shrink(files[i]);
          var path = await w3upload(f, w3kindOf(f), w3extOf(f));
          await w3post({ body: i === 0 ? body : '', attachment_path: path, attachment_kind: w3kindOf(f), attachment_name: files[i].name });
        }
      }
      inp.value = ''; inp.style.height = ''; inp.placeholder = w3isGroup() ? 'Message the group\u2026' : 'Message\u2026';
    } catch(e){ alert('Message didn\u2019t send \u2014 ' + e.message + '. Your client keeps everything already sent.'); }
    btn.disabled = false; inp.focus();
  }

  /* ── composer chrome: attach + voice ── */
  (function w3composer(){
    var comp = $c('msg-compose'), pane = $c('msg-pane'); if (!comp || !pane) return;
    var att = document.createElement('div'); att.id = 'w3-att'; pane.insertBefore(att, comp);
    var recbar = document.createElement('div'); recbar.id = 'w3-recbar';
    recbar.innerHTML = '<div class="w3-ic rec">\u25CF</div><div class="bar"></div><span class="t" id="w3-rect">Recording 0:00</span><button class="btn" type="button" id="w3-rec-cancel" style="font-size:12px;">Cancel</button><button class="btn btn-primary" type="button" id="w3-rec-stop" style="font-size:12px;">Stop &amp; send</button>' +
      '<audio id="w3-rec-prev" controls style="display:none;flex:1;min-width:160px;"></audio><button class="btn" type="button" id="w3-rec-discard" style="display:none;font-size:12px;">Discard</button><button class="btn btn-primary" type="button" id="w3-rec-send" style="display:none;font-size:12px;">Send voice note</button>';
    pane.insertBefore(recbar, comp);
    var fi = document.createElement('input'); fi.type = 'file'; fi.multiple = true; fi.accept = 'image/*,application/pdf,video/mp4,video/quicktime'; fi.style.display = 'none'; fi.id = 'w3-file';
    var bAtt = document.createElement('button'); bAtt.type = 'button'; bAtt.className = 'w3-ic'; bAtt.title = 'Attach a photo, PDF or video'; bAtt.textContent = '\uD83D\uDCCE';
    var bMic = document.createElement('button'); bMic.type = 'button'; bMic.className = 'w3-ic'; bMic.title = 'Record a voice note'; bMic.textContent = '\uD83C\uDFA4'; bMic.id = 'w3-mic';
    comp.insertBefore(bMic, comp.firstChild); comp.insertBefore(bAtt, comp.firstChild); comp.appendChild(fi);
    bAtt.addEventListener('click', function(){ fi.click(); });
    fi.addEventListener('change', function(){
      Array.prototype.forEach.call(fi.files || [], function(f){
        if (f.size > 50 * 1048576){ alert(f.name + ' is over 50 MB.'); return; }
        if (w3.att.length >= W3_MAX_ATT){ alert('Up to ' + W3_MAX_ATT + ' attachments per message.'); return; }
        w3.att.push(f);
      });
      fi.value = ''; w3renderAtt();
    });
    function recMime(){ var c = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']; for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i]; return ''; }
    function recReset(){
      if (w3.recTimer) clearInterval(w3.recTimer); w3.recTimer = null;
      try { if (w3.rec && w3.rec.state !== 'inactive') w3.rec.stop(); } catch(_){}
      try { if (w3.rec && w3.rec.stream) w3.rec.stream.getTracks().forEach(function(t){ t.stop(); }); } catch(_){}
      w3.rec = null; w3.recChunks = []; w3.recBlob = null;
      recbar.style.display = 'none'; comp.style.display = 'flex';
      ['w3-rec-prev', 'w3-rec-discard', 'w3-rec-send'].forEach(function(id){ $c(id).style.display = 'none'; });
      ['w3-rec-cancel', 'w3-rec-stop', 'w3-rect'].forEach(function(id){ $c(id).style.display = ''; });
      recbar.querySelector('.bar').style.display = ''; recbar.querySelector('.rec').style.display = '';
      var a = $c('w3-rec-prev'); if (a.src){ try { URL.revokeObjectURL(a.src); } catch(_){} a.removeAttribute('src'); }
    }
    bMic.addEventListener('click', async function(){
      if (!window.MediaRecorder || !navigator.mediaDevices){ alert('Voice notes need a browser with microphone recording (Chrome, Edge or Safari).'); return; }
      var mime = recMime();
      try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        w3.rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); w3.recMime = w3.rec.mimeType || mime || 'audio/webm';
        w3.recChunks = []; w3.rec.ondataavailable = function(e){ if (e.data && e.data.size) w3.recChunks.push(e.data); };
        w3.rec.onstop = function(){
          try { stream.getTracks().forEach(function(t){ t.stop(); }); } catch(_){}
          if (w3.recTimer) clearInterval(w3.recTimer); w3.recTimer = null;
          if (!w3.recChunks.length){ recReset(); return; }
          w3.recBlob = new Blob(w3.recChunks, { type: w3.recMime });
          var a = $c('w3-rec-prev'); a.src = URL.createObjectURL(w3.recBlob); a.style.display = '';
          $c('w3-rec-discard').style.display = ''; $c('w3-rec-send').style.display = '';
          $c('w3-rec-cancel').style.display = 'none'; $c('w3-rec-stop').style.display = 'none'; $c('w3-rect').style.display = 'none';
          recbar.querySelector('.bar').style.display = 'none'; recbar.querySelector('.rec').style.display = 'none';
        };
        w3.rec.start(250); w3.recStart = Date.now();
        comp.style.display = 'none'; recbar.style.display = 'flex';
        w3.recTimer = setInterval(function(){ var s = Math.round((Date.now() - w3.recStart) / 1000); $c('w3-rect').textContent = 'Recording ' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); if (s >= 300) $c('w3-rec-stop').click(); }, 500);
      } catch(e){ alert('Couldn\u2019t start the microphone \u2014 ' + (e && e.message || 'permission denied')); recReset(); }
    });
    $c('w3-rec-cancel').addEventListener('click', function(){ w3.recChunks = []; recReset(); });
    $c('w3-rec-stop').addEventListener('click', function(){ try { w3.rec && w3.rec.state !== 'inactive' && w3.rec.stop(); } catch(_){ recReset(); } });
    $c('w3-rec-discard').addEventListener('click', recReset);
    $c('w3-rec-send').addEventListener('click', async function(){
      if (!w3.recBlob || !msgThread) return;
      var b = $c('w3-rec-send'); b.disabled = true;
      try {
        var ext = /mp4/.test(w3.recMime) ? 'm4a' : /ogg/.test(w3.recMime) ? 'ogg' : 'webm';
        var f = new File([w3.recBlob], 'voice-note.' + ext, { type: w3.recMime.split(';')[0] });
        var path = await w3upload(f, 'audio', ext);
        var secs = Math.round((Date.now() - w3.recStart) / 1000);
        await w3post({ body: '', attachment_path: path, attachment_kind: 'audio', attachment_name: 'Voice note ' + Math.floor(secs / 60) + ':' + (secs % 60 < 10 ? '0' : '') + (secs % 60) });
        recReset();
      } catch(e){ alert('Voice note didn\u2019t send \u2014 ' + e.message); }
      b.disabled = false;
    });
  })();

  /* ── New message → group / direct / broadcast; Manage group (§23.239 capture over #msg-new) ── */
  function w3modal(thread){
    var act = roster.filter(function(c){ return c.status === 'active' && !c.lapsed_at; });
    var have = {}; (thread && thread.coach_thread_members || []).forEach(function(m){ have[(m.member_email || '').toLowerCase()] = 1; });
    var bg = document.createElement('div'); bg.className = 'w3-modal-bg';
    bg.innerHTML = '<div class="w3-modal"><h3>' + (thread ? 'Manage group' : 'New message') + '</h3>' +
      '<label>' + (thread ? 'Clients in this group' : 'To') + '</label><div class="w3-cl" id="w3-cl">' + (act.length ? act.map(function(c){ var em = (c.member_email || '').toLowerCase(); return '<span data-em="' + esc(em) + '" class="' + (have[em] ? 'on' : '') + '">' + esc(nameOf(c)) + '</span>'; }).join('') : '<span style="border:0;color:var(--text-muted);">No active clients</span>') + '</div>' +
      (thread ? '' : '<label>Send as</label><div class="w3-cl" id="w3-mode"><span data-m="group" class="on">One group conversation</span><span data-m="sep">Separate messages</span></div>') +
      '<div id="w3-namewrap"><label>Group name</label><input type="text" id="w3-name" maxlength="80" placeholder="e.g. Monday 6am crew" value="' + esc(thread ? thread.title : '') + '"></div>' +
      '<p class="w3-note" id="w3-mnote">' + (thread ? 'Clients you remove stop seeing new messages; what they already have stays in their app.' : 'Pick one client to open their conversation. Pick several for a group everyone in it can read and reply to \u2014 or send the same message to each separately.') + '</p>' +
      '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn btn-primary" type="button" id="w3-go">' + (thread ? 'Save' : 'Continue') + '</button><button class="btn" type="button" id="w3-x">Cancel</button><span id="w3-mmsg" style="font-size:12px;color:var(--text-muted);align-self:center;"></span></div></div>';
    document.body.appendChild(bg);
    var mode = 'group';
    function refresh(){
      var n = bg.querySelectorAll('#w3-cl span.on').length;
      var nw = bg.querySelector('#w3-namewrap');
      if (thread) return;
      nw.style.display = (n > 1 && mode === 'group') ? '' : 'none';
      bg.querySelector('#w3-go').textContent = n <= 1 ? 'Open conversation' : mode === 'group' ? 'Create group' : 'Write broadcast';
    }
    bg.querySelectorAll('#w3-cl span[data-em]').forEach(function(s){ s.addEventListener('click', function(){ s.classList.toggle('on'); refresh(); }); });
    bg.querySelectorAll('#w3-mode span').forEach(function(s){ s.addEventListener('click', function(){ bg.querySelectorAll('#w3-mode span').forEach(function(x){ x.classList.remove('on'); }); s.classList.add('on'); mode = s.dataset.m; refresh(); }); });
    bg.querySelector('#w3-x').addEventListener('click', function(){ bg.remove(); });
    bg.addEventListener('click', function(e){ if (e.target === bg) bg.remove(); });
    refresh();
    bg.querySelector('#w3-go').addEventListener('click', async function(){
      var sel = Array.prototype.map.call(bg.querySelectorAll('#w3-cl span.on'), function(s){ return s.dataset.em; });
      var msg = bg.querySelector('#w3-mmsg'), title = (bg.querySelector('#w3-name').value || '').trim();
      if (thread){
        if (!title){ msg.textContent = 'Give the group a name.'; return; }
        if (!sel.length){ msg.textContent = 'A group needs at least one client.'; return; }
        msg.textContent = 'Saving\u2026';
        try {
          var cur = (thread.coach_thread_members || []).map(function(m){ return (m.member_email || '').toLowerCase(); });
          var add = sel.filter(function(e){ return cur.indexOf(e) < 0; }), rm = cur.filter(function(e){ return sel.indexOf(e) < 0; });
          if (title !== thread.title) await rest('/coach_threads?id=eq.' + thread.id + '&' + pscope(), { method: 'PATCH', body: { title: title } });
          if (add.length) await rest('/coach_thread_members', { method: 'POST', body: add.map(function(e){ return { thread_id: thread.id, member_email: e }; }) });
          for (var i = 0; i < rm.length; i++) await rest('/coach_thread_members?thread_id=eq.' + thread.id + '&member_email=eq.' + encodeURIComponent(rm[i]), { method: 'DELETE' });
          await w3loadThreads(); w3.thread = w3.threads.filter(function(t){ return t.id === thread.id; })[0] || w3.thread; renderThreadList(); w3head(); bg.remove();
        } catch(e){ msg.textContent = 'Couldn\u2019t save \u2014 ' + e.message; }
        return;
      }
      if (!sel.length){ msg.textContent = 'Pick at least one client.'; return; }
      if (sel.length === 1){ bg.remove(); msgOpen(sel[0]); return; }
      if (mode === 'sep'){ bg.remove(); var bc = $c('msg-bcast'); if (bc && $c('bc-panel').style.display === 'none') bc.click(); return; }
      if (!title){ msg.textContent = 'Give the group a name.'; return; }
      msg.textContent = 'Creating\u2026';
      try {
        var t = await rest('/coach_threads?select=id', { method: 'POST', body: { partner_id: partnerId, kind: 'group', title: title } });
        var tid = t && t[0] && t[0].id; if (!tid) throw new Error('no thread id');
        await rest('/coach_thread_members', { method: 'POST', body: sel.map(function(e){ return { thread_id: tid, member_email: e }; }) });
        await w3loadThreads(); renderThreadList(); bg.remove(); msgOpen('g:' + tid);
      } catch(e){ msg.textContent = 'Couldn\u2019t create the group \u2014 ' + e.message; }
    });
  }
  document.addEventListener('click', function(ev){
    var t = ev.target.closest && ev.target.closest('#msg-new');
    if (!t || !partnerId) return;
    ev.stopPropagation(); ev.preventDefault();
    var p = $c('nm-panel'); if (p) p.style.display = 'none';
    w3modal(null);
  }, true);
  /* ============================ end PM-1080 W3 ============================ */

