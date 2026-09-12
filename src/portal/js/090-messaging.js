  function msgSetBadge(n){
    var b = $c('cp-msg-badge'); if (!b) return;
    if (n > 0){ b.textContent = n > 20 ? '20+' : String(n); b.style.display = ''; }
    else b.style.display = 'none';
  }
  async function msgBadgeRefresh(){
    if (!partnerId) return;
    try {
      var rows = await rest('/coach_messages?' + pscope() + '&sender=eq.member&read_at=is.null&select=member_email&limit=200') || [];
      msgUnread = {};
      rows.forEach(function(r){ var k = (r.member_email||'').toLowerCase(); msgUnread[k] = (msgUnread[k]||0) + 1; });
      msgSetBadge(rows.length);
    } catch(_){}
  }
  function msgMobile(){ return window.innerWidth <= 700; }
  function msgShowPane(showPane){
    if (!msgMobile()){ $c('msg-threads').style.display = ''; $c('msg-pane').style.display = 'flex'; $c('msg-back').style.display = 'none'; return; }
    $c('msg-threads').style.display = showPane ? 'none' : '';
    $c('msg-pane').style.display = showPane ? 'flex' : 'none';
    $c('msg-back').style.display = showPane ? '' : 'none';
  }
  async function msgInit(){
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
  }
  function renderThreadList(){
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
  function msgBubble(m){
    var mine = m.sender === 'coach';
    var t = new Date(m.created_at);
    var when = t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return '<div style="display:flex;flex-direction:column;align-items:' + (mine ? 'flex-end' : 'flex-start') + ';">' +
      '<div style="max-width:78%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;' +
      (mine ? 'background:#1B7878;color:#fff;border-bottom-right-radius:4px;' : 'background:var(--surface-2);border:1px solid var(--border);border-bottom-left-radius:4px;') + '">' + esc(m.body) + '</div>' +
      '<div style="font-size:10.5px;color:var(--text-muted);margin:3px 4px 0;">' + when + '</div></div>';
  }
  function msgRender(){
    var el = $c('msg-list');
    el.innerHTML = msgRows.length ? msgRows.map(msgBubble).join('') : '<div style="color:var(--text-muted);font-size:13px;text-align:center;margin:auto;">No messages yet \u2014 say hello.</div>';
    el.scrollTop = el.scrollHeight;
  }
  async function msgOpen(email){
    msgThread = email;
    var c = roster.filter(function(x){ return (x.member_email||'').toLowerCase() === email; })[0];
    $c('msg-head-name').textContent = c ? nameOf(c) : email;
    $c('msg-head').style.display = 'flex';
    $c('msg-compose').style.display = 'flex';
    $c('msg-empty').style.display = 'none';
    msgShowPane(true);
    renderThreadList();
    msgRows = []; msgLastId = null; msgRender();
    try {
      msgRows = await rest('/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(email) + '&order=created_at.asc&limit=200&select=id,sender,body,created_at,read_at') || [];
      if (msgRows.length) msgLastId = msgRows[msgRows.length - 1].created_at;
      msgRender();
      msgMarkRead(email);
    } catch(e){ $c('msg-list').innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;margin:auto;">Couldn\u2019t load messages \u2014 ' + esc(e.message) + '</div>'; }
  }
  function msgMarkRead(email){
    var k = email.toLowerCase();
    if (!msgUnread[k]) return;
    rest('/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(email) + '&sender=eq.member&read_at=is.null', { method: 'PATCH', body: { read_at: new Date().toISOString() } }).then(function(){
      delete msgUnread[k];
      var total = 0; Object.keys(msgUnread).forEach(function(x){ total += msgUnread[x]; });
      msgSetBadge(total); renderThreadList();
    }).catch(function(){});
  }
  async function msgPoll(){
    if (!msgThread) return;
    try {
      var q = '/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(msgThread) + '&order=created_at.asc&limit=50&select=id,sender,body,created_at,read_at' + (msgLastId ? '&created_at=gt.' + encodeURIComponent(msgLastId) : '');
      var fresh = await rest(q) || [];
      if (fresh.length){
        var seen = {}; msgRows.forEach(function(m){ seen[m.id] = 1; });
        fresh.forEach(function(m){ if (!seen[m.id]) msgRows.push(m); });
        msgLastId = msgRows[msgRows.length - 1].created_at;
        msgRender(); msgMarkRead(msgThread);
      }
    } catch(_){}
  }
  async function msgSend(){
    var inp = $c('msg-input');
    var body = inp.value.trim();
    if (!body || !msgThread) return;
    var btn = $c('msg-send'); btn.disabled = true;
    try {
      await rest('/coach_messages', { method: 'POST', body: { partner_id: partnerId, member_email: msgThread, sender: 'coach', body: body } });
      inp.value = ''; inp.style.height = '';
      msgRows.push({ id: 'tmp-' + Date.now(), sender: 'coach', body: body, created_at: new Date().toISOString() });
      msgLastId = msgRows[msgRows.length - 1].created_at;
      msgRender();
    } catch(e){ alert('Message didn\u2019t send \u2014 ' + e.message + '. Your client keeps everything already sent.'); }
    btn.disabled = false; inp.focus();
  }
  $c('msg-send').addEventListener('click', msgSend);
  $c('msg-input').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); msgSend(); } });
  $c('msg-input').addEventListener('input', function(){ this.style.height = ''; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; });
  $c('msg-back').addEventListener('click', function(){ msgThread = null; $c('msg-head').style.display = 'none'; $c('msg-compose').style.display = 'none'; $c('msg-empty').style.display = 'flex'; msgShowPane(false); renderThreadList(); });

  /* \u2500\u2500 Sidebar router (PM-955j Kahunas-style shell) \u2500\u2500 */
  var SECTION_KINDS = { forms: ['onboarding','checkin','lead','habits'], workouts: ['program','workout_day','workout'], nutrition: ['nutrition','supplements'] };
  var SOON_COPY = {
    content: ['Content Library', 'Upload and share your own videos and resources with clients \u2014 unlisted, coach-only content. Coming soon.'],
  };
  var VIEW_IDS = ['view-dashboard','view-clients','view-leads','view-msgs','view-cal','view-plans','view-exercises','view-notifs','view-autos','view-profile','view-soon','view-settings'];
