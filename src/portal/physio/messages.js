  /* ============================ PM-1214: physio Wave 4 — Messages ============================
     Per-patient thread over coach_messages (sender 'coach' = the physio, same rows the app reads). Physio-owned
     and small on purpose: the coach portal's messaging slice closes over the client workspace (§23.333). Open
     alerts for the patient sit at the top of their thread with Message / Dismiss. RLS only opens a thread for
     a patient who has accepted the VYVE invite — an invited-only patient gets a plain explanation, not an error.
     Strings are PLACEHOLDERS for Lewis. */
  var msThread = '', msRows = [], msUnread = {}, msTimer = null, msCssDone = false;
  function msCss(){
    if (msCssDone) return; msCssDone = true;
    var s = document.createElement('style');
    s.textContent =
      '.ms-wrap{display:grid;grid-template-columns:250px 1fr;gap:14px;min-height:420px;}@media (max-width:760px){.ms-wrap{grid-template-columns:1fr;}.ms-wrap.open .ms-list{display:none;}.ms-wrap:not(.open) .ms-pane{display:none;}}' +
      '.ms-list{border:1px solid var(--border);border-radius:12px;background:var(--surface-2);overflow:hidden;align-self:start;}' +
      '.ms-list button{display:flex;width:100%;align-items:center;gap:10px;padding:10px 12px;background:none;border:0;border-bottom:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;text-align:left;cursor:pointer;}' +
      '.ms-list button:last-child{border-bottom:0;}.ms-list button.on{background:var(--surface);}.ms-list .who{flex:1;min-width:0;}.ms-list .who b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.ms-list .who small{color:var(--text-muted);font-size:11px;}' +
      '.ms-badge{background:var(--vyve-teal);color:#fff;border-radius:999px;font-size:10.5px;font-weight:700;padding:1px 7px;}' +
      '.ms-pane{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);min-height:420px;}' +
      '.ms-hd{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border);font-weight:600;font-size:13.5px;}' +
      '.ms-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;max-height:60vh;}' +
      '.ms-m{max-width:78%;padding:8px 11px;border-radius:12px;font-size:13px;line-height:1.4;white-space:pre-wrap;word-break:break-word;background:var(--surface);border:1px solid var(--border);align-self:flex-start;}' +
      '.ms-m.me{align-self:flex-end;background:var(--vyve-teal);color:#fff;border-color:var(--vyve-teal);}.ms-m small{display:block;font-size:10.5px;opacity:.7;margin-top:3px;}' +
      '.ms-in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--border);}.ms-in textarea{flex:1;resize:none;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px;font-family:inherit;min-height:40px;}';
    document.head.appendChild(s);
  }
  function msWhen(iso){ var d = new Date(iso); return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  async function msUnreadLoad(){
    msUnread = {};
    try { var rows = await rest('/coach_messages?partner_id=eq.' + partnerId + '&sender=eq.member&read_at=is.null&select=member_email&limit=500') || []; rows.forEach(function(r){ var e = (r.member_email || '').toLowerCase(); msUnread[e] = (msUnread[e] || 0) + 1; }); } catch(_){}
    var total = 0; Object.keys(msUnread).forEach(function(k){ total += msUnread[k]; });
    var b = document.querySelector('.cp-item[data-go="messages"] .ms-badge');
    if (total && !b){ var el = document.createElement('span'); el.className = 'ms-badge'; el.style.marginLeft = 'auto'; el.textContent = total; var btn = document.querySelector('.cp-item[data-go="messages"]'); if (btn) btn.appendChild(el); }
    else if (b){ if (total) b.textContent = total; else b.remove(); }
  }
  async function msInit(){
    msCss(); rhCss(); pvCss();
    await Promise.all([msUnreadLoad(), rhAlertsLoad(false)]);
    msPaintList();
    if (msThread) msOpen(msThread); else msPaintPane();
    if (msTimer) clearInterval(msTimer);
    msTimer = setInterval(function(){ if ($c('view-msgs').style.display === 'none'){ clearInterval(msTimer); msTimer = null; return; } if (msThread) msPoll(); }, 25000);
  }
  function msPaintList(){
    var list = $c('ms-list');
    var rows = roster.filter(function(c){ return c.status !== 'archived'; });
    if (!rows.length){ list.innerHTML = '<div class="empty-state" style="padding:18px;"><h3>No patients yet</h3><p>Add a patient and their thread appears here once they open the VYVE app.</p></div>'; return; }
    list.innerHTML = rows.map(function(c){
      var e = (c.member_email || '').toLowerCase(), n = msUnread[e] || 0, al = rhAlertsFor(e).length;
      return '<button type="button" data-ms-open="' + esc(e) + '" class="' + (e === msThread ? 'on' : '') + '"><span class="who"><b>' + esc(ptName(c)) + '</b><small>' + (c.status === 'invited' ? 'invite not opened yet' : al ? al + ' open alert' + (al === 1 ? '' : 's') : n ? 'new message' : '') + '</small></span>' + (n ? '<span class="ms-badge">' + n + '</span>' : al ? '<span class="pv-pill" style="margin:0;">!</span>' : '') + '</button>';
    }).join('');
    list.querySelectorAll('[data-ms-open]').forEach(function(b){ b.addEventListener('click', function(){ msOpen(b.getAttribute('data-ms-open')); }); });
  }
  function msPaintPane(){
    var pane = $c('ms-pane');
    if (!msThread){ $c('ms-wrap').classList.remove('open'); pane.innerHTML = '<div class="empty-state" style="margin:auto;"><h3>Pick a patient</h3><p>Questions from the post-session sheet and anything you send land in the same thread \u2014 the patient reads it in the app.</p></div>'; return; }
    $c('ms-wrap').classList.add('open');
    var c = roster.filter(function(x){ return (x.member_email || '').toLowerCase() === msThread; })[0];
    pane.innerHTML = '<div class="ms-hd"><button class="btn" type="button" id="ms-back" style="font-size:12px;">&larr;</button><span style="flex:1;">' + esc(rhPtLabel(msThread)) + '</span><button class="btn" type="button" id="ms-plans" style="font-size:12px;">Plans</button></div>' +
      '<div id="ms-alerts" style="padding:10px 12px 0;"></div><div class="ms-body" id="ms-body"></div>' +
      '<div class="ms-in"><textarea id="ms-text" rows="1" maxlength="2000" placeholder="Message ' + esc(rhPtLabel(msThread).split(' ')[0]) + '\u2026"></textarea><button class="btn btn-primary" type="button" id="ms-send" style="font-size:12.5px;">Send</button></div>' +
      '<div id="ms-msg" class="pv-muted" style="padding:0 12px 10px;min-height:16px;"></div>';
    $c('ms-back').addEventListener('click', function(){ msThread = ''; msPaintList(); msPaintPane(); });
    $c('ms-plans').addEventListener('click', function(){ rhFilterEmail = msThread; go('plans'); });
    $c('ms-send').addEventListener('click', msSend);
    $c('ms-text').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); msSend(); } });
    var ab = $c('ms-alerts'); ab.innerHTML = '';
    rhAlertsFor(msThread).forEach(function(a){ ab.appendChild(rhAlertCard(a, function(){ msPaintList(); renderPatients(); })); });
    if (c && c.status === 'invited') $c('ms-msg').textContent = 'This patient hasn\u2019t opened their VYVE invite yet. The thread opens the moment they do; anything they typed on a post-session sheet still shows on their plan\u2019s Monitor tab.';
    msPaintBody();
  }
  function msPaintBody(){
    var body = $c('ms-body'); if (!body) return;
    body.innerHTML = msRows.length ? msRows.map(function(m){ var me = m.sender !== 'member'; return '<div class="ms-m' + (me ? ' me' : '') + '">' + esc(m.body) + '<small>' + (me ? 'You' : rhPtLabel(msThread).split(' ')[0]) + ' \u00b7 ' + esc(msWhen(m.created_at)) + '</small></div>'; }).join('') : '<div class="pv-muted" style="margin:auto;">No messages yet.</div>';
    body.scrollTop = body.scrollHeight;
  }
  async function msOpen(email){
    msThread = (email || '').toLowerCase(); msRows = [];
    msPaintList(); msPaintPane();
    try {
      msRows = await rest('/coach_messages?partner_id=eq.' + partnerId + '&member_email=eq.' + encodeURIComponent(msThread) + '&order=created_at.asc&limit=300&select=id,sender,body,created_at,read_at') || [];
    } catch(_){ msRows = []; }
    msPaintBody();
    if (msUnread[msThread]){
      rest('/coach_messages?partner_id=eq.' + partnerId + '&member_email=eq.' + encodeURIComponent(msThread) + '&sender=eq.member&read_at=is.null', { method: 'PATCH', body: { read_at: new Date().toISOString() } }).then(function(){ delete msUnread[msThread]; msUnreadLoad(); msPaintList(); }).catch(function(){});
    }
  }
  async function msPoll(){
    if (!msThread) return;
    var last = msRows.length ? msRows[msRows.length - 1].created_at : null;
    try {
      var q = '/coach_messages?partner_id=eq.' + partnerId + '&member_email=eq.' + encodeURIComponent(msThread) + '&order=created_at.asc&limit=100&select=id,sender,body,created_at,read_at' + (last ? '&created_at=gt.' + encodeURIComponent(last) : '');
      var rows = await rest(q) || [];
      if (rows.length){ rows.forEach(function(r){ if (!msRows.some(function(m){ return m.id === r.id; })) msRows.push(r); }); msPaintBody(); if (rows.some(function(r){ return r.sender === 'member'; })) msOpen(msThread); }
    } catch(_){}
  }
  async function msSend(){
    var ta = $c('ms-text'), body = (ta.value || '').trim(); if (!body || !msThread) return;
    $c('ms-msg').textContent = 'Sending\u2026'; ta.disabled = true;
    try {
      var r = await rest('/coach_messages?select=id,sender,body,created_at,read_at', { method: 'POST', body: { partner_id: partnerId, member_email: msThread, sender: 'coach', body: body }, prefer: 'return=representation' });
      msRows.push((r && r[0]) || { id: 'tmp-' + Date.now(), sender: 'coach', body: body, created_at: new Date().toISOString() });
      ta.value = ''; $c('ms-msg').textContent = ''; msPaintBody();
    } catch(e){
      var c = roster.filter(function(x){ return (x.member_email || '').toLowerCase() === msThread; })[0];
      $c('ms-msg').textContent = c && c.status === 'invited' ? 'Not sent \u2014 the thread opens once this patient accepts the VYVE invite.' : 'Could not send (' + (e.message || e) + ').';
    }
    ta.disabled = false; ta.focus();
  }
  function rhMsgOpen(email){ msThread = (email || '').toLowerCase(); go('messages'); }
  /* ============================ end PM-1214 Messages ============================ */
