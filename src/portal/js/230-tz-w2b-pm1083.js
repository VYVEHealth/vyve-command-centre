  /* ============================ PM-1083 Trainerize W2b ============================
     Coach help assistant (#112): "?" in the topbar opens a right-hand drawer over the coach-help EF
     (coach JWT, corpus-backed, refuses off-topic). History in localStorage per partner; replies carry
     an optional route rendered as a button that calls the tail-zone go(). One idle nudge per session. */
  var W2B_EF = SUPA_URL + '/functions/v1/coach-help', W2B_MAX = 500, W2B_GAP = 3000, W2B_IDLE = 180000, W2B_KEEP = 40;
  var W2B_CHIPS = ['Build a programme', 'Add a client', 'Set up a check-in', 'Send a message to a group', 'See what my client sees'];
  var w2b = { open: false, busy: false, hist: [], lastSent: 0, lastQ: '', idle: null, nudged: false, remaining: null };
  (function w2bcss(){
    var s = document.createElement('style');
    s.textContent =
      '#cp-help{position:relative;font-weight:800;min-width:32px;}' +
      '#cp-help .w2b-dot{position:absolute;top:-4px;right:-4px;width:8px;height:8px;border-radius:99px;background:#C9A84C;}' +
      '#w2b-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:140;}' +
      '#w2b-ov.show{display:block;}' +
      '#w2b{position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);background:var(--surface);border-left:1px solid var(--border);box-shadow:-12px 0 34px rgba(0,0,0,.35);z-index:141;display:flex;flex-direction:column;transform:translateX(105%);transition:transform .22s ease;}' +
      '#w2b.open{transform:none;}' +
      '.w2b-h{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border);}' +
      '.w2b-h b{font-size:14px;} .w2b-h span{display:block;font-size:11.5px;color:var(--text-muted);}' +
      '.w2b-x{background:none;border:0;color:var(--text-muted);font-size:20px;cursor:pointer;padding:4px 8px;font-family:inherit;}' +
      '.w2b-body{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px;-webkit-overflow-scrolling:touch;}' +
      '.w2b-m{max-width:88%;padding:10px 12px;border-radius:12px;font-size:13.5px;line-height:1.5;word-wrap:break-word;}' +
      '.w2b-me{align-self:flex-end;background:var(--vyve-teal);color:#fff;border-bottom-right-radius:4px;}' +
      '.w2b-bot{align-self:flex-start;background:var(--surface-2);border:1px solid var(--border);border-bottom-left-radius:4px;}' +
      '.w2b-bot.ref{border-style:dashed;}' +
      '.w2b-bot ol{padding-left:20px;margin:6px 0 4px;} .w2b-bot ol li{margin-bottom:5px;}' +
      '.w2b-bot ul{padding-left:18px;margin:6px 0 4px;color:var(--text-muted);font-size:12.5px;}' +
      '.w2b-rel{font-size:12.5px;color:var(--text-muted);margin-top:6px;}' +
      '.w2b-clar{margin-top:6px;font-weight:600;}' +
      '.w2b-route{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:7px 12px;border-radius:8px;background:var(--accent);color:var(--on-accent);font-weight:700;font-size:12.5px;border:0;cursor:pointer;font-family:inherit;}' +
      '.w2b-fb{display:flex;gap:6px;margin-top:8px;align-items:center;font-size:11.5px;color:var(--text-dim);}' +
      '.w2b-fb button{background:none;border:1px solid var(--border);border-radius:99px;color:var(--text-muted);padding:2px 9px;font-size:12px;cursor:pointer;font-family:inherit;}' +
      '.w2b-fb button.on{border-color:var(--accent);color:var(--accent);}' +
      '.w2b-hello{color:var(--text-muted);font-size:13px;} .w2b-hello b{color:var(--text);display:block;margin-bottom:4px;font-size:14px;}' +
      '.w2b-chips{display:flex;flex-wrap:wrap;gap:7px;}' +
      '.w2b-chip{border:1px solid var(--border-strong);background:var(--surface-2);color:var(--text);border-radius:99px;padding:7px 12px;font-size:12.5px;font-family:inherit;cursor:pointer;}' +
      '.w2b-nudge{align-self:center;font-size:11.5px;color:var(--text-dim);background:var(--surface-2);padding:5px 10px;border-radius:99px;border:1px solid var(--border);}' +
      '.w2b-typing{align-self:flex-start;color:var(--text-dim);font-size:12px;padding:4px 12px;}' +
      '.w2b-c{border-top:1px solid var(--border);padding:10px 12px;display:flex;gap:8px;align-items:flex-end;}' +
      '.w2b-c textarea{flex:1;resize:none;height:42px;max-height:110px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);color:var(--text);padding:10px 12px;font-family:inherit;font-size:16px;line-height:1.35;}' +
      '.w2b-c button{background:var(--accent);color:var(--on-accent);border:0;border-radius:10px;padding:0 14px;height:42px;font-weight:700;font-family:inherit;cursor:pointer;}' +
      '.w2b-c button:disabled{opacity:.5;cursor:default;}' +
      '.w2b-f{font-size:10.5px;color:var(--text-dim);padding:0 12px 10px;text-align:center;}' +
      '@media (max-width:640px){#w2b{width:100vw;}}';
    document.head.appendChild(s);
  })();
  function w2bKey(){ return 'vyve_coach_help_' + (partnerId || 'x'); }
  function w2bLoad(){ try { var h = JSON.parse(localStorage.getItem(w2bKey()) || '[]'); w2b.hist = Array.isArray(h) ? h : []; } catch(_){ w2b.hist = []; } }
  function w2bSave(){ try { localStorage.setItem(w2bKey(), JSON.stringify(w2b.hist.slice(-W2B_KEEP))); } catch(_){} }
  function w2bMd(t){ return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function w2bFlat(a){ return [a.ack, a.clarify].concat(a.steps || []).filter(Boolean).join(' ').slice(0, 1200); }
  function w2bMount(){
    if ($c('w2b')) return;
    var right = document.querySelector('.cp-right'); if (!right) return;
    var seen = false; try { seen = localStorage.getItem('vyve_coach_help_seen') === '1'; } catch(_){}
    var b = document.createElement('button');
    b.className = 'cp-theme'; b.id = 'cp-help'; b.type = 'button'; b.title = 'Help'; b.setAttribute('aria-label', 'Help');
    b.innerHTML = '?' + (seen ? '' : '<span class="w2b-dot"></span>');
    right.insertBefore(b, right.children[1] || null);
    var ov = document.createElement('div'); ov.id = 'w2b-ov'; document.body.appendChild(ov);
    var d = document.createElement('div'); d.id = 'w2b'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Help');
    d.innerHTML =
      '<div class="w2b-h"><div><b>Help</b><span>How-to for this portal. Answers in seconds, links straight to the page.</span></div><button class="w2b-x" type="button" id="w2b-close" aria-label="Close">&times;</button></div>' +
      '<div class="w2b-body" id="w2b-body"></div>' +
      '<div class="w2b-c"><textarea id="w2b-in" placeholder="Ask a question\u2026" maxlength="' + W2B_MAX + '" rows="1"></textarea><button type="button" id="w2b-send">Ask</button></div>' +
      '<div class="w2b-f" id="w2b-foot">Portal help only \u00b7 40 questions a day</div>';
    document.body.appendChild(d);
    b.addEventListener('click', function(){ w2bToggle(!w2b.open); });
    ov.addEventListener('click', function(){ w2bToggle(false); });
    $c('w2b-close').addEventListener('click', function(){ w2bToggle(false); });
    $c('w2b-send').addEventListener('click', function(){ w2bSend($c('w2b-in').value); });
    $c('w2b-in').addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); w2bSend(e.target.value); } });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && w2b.open) w2bToggle(false); });
    $c('w2b-body').addEventListener('click', function(ev){
      var t = ev.target.closest && ev.target.closest('[data-w2b]'); if (!t) return;
      var act = t.dataset.w2b;
      if (act === 'chip') w2bSend(t.textContent);
      else if (act === 'route') w2bGo(t.dataset.route);
      else if (act === 'fb') w2bFeedback(t.dataset.id, t.dataset.val === '1', t);
    });
  }
  function w2bToggle(on){
    w2b.open = !!on;
    var d = $c('w2b'), ov = $c('w2b-ov'); if (!d) return;
    d.classList.toggle('open', w2b.open); ov.classList.toggle('show', w2b.open);
    if (w2b.open){
      try { localStorage.setItem('vyve_coach_help_seen', '1'); } catch(_){}
      var dot = document.querySelector('#cp-help .w2b-dot'); if (dot) dot.remove();
      w2bLoad(); w2bRender(); setTimeout(function(){ var i = $c('w2b-in'); if (i && window.innerWidth > 640) i.focus(); }, 240);
    } else { w2bIdle(false); }
  }
  function w2bGo(route){ if (!route) return; w2bToggle(false); try { go(route); } catch(_){ location.hash = '#' + route; } }
  function w2bRender(){
    var body = $c('w2b-body'); if (!body) return;
    var nm = ''; try { nm = (($c('cp-user-email') || {}).textContent || '').split('@')[0]; } catch(_){}
    var h = '';
    if (!w2b.hist.length){
      h += '<div class="w2b-hello"><b>What do you want to do?</b>Ask in your own words. I only know the coach portal, so I\u2019ll say so if it\u2019s not about VYVE.</div>' +
           '<div class="w2b-chips">' + W2B_CHIPS.map(function(c){ return '<button type="button" class="w2b-chip" data-w2b="chip">' + esc(c) + '</button>'; }).join('') + '</div>';
    }
    w2b.hist.forEach(function(m){
      if (m.role === 'user'){ h += '<div class="w2b-m w2b-me">' + esc(m.content) + '</div>'; return; }
      if (m.role === 'nudge'){ h += '<div class="w2b-nudge">' + esc(m.content) + '</div>'; return; }
      var a = m.answer || {};
      var refused = !!m.refused;
      h += '<div class="w2b-m w2b-bot' + (refused ? ' ref' : '') + '">' + w2bMd(a.ack || m.content || '');
      if (a.clarify) h += '<div class="w2b-clar">' + w2bMd(a.clarify) + '</div>';
      if (a.steps && a.steps.length) h += '<ol>' + a.steps.map(function(s){ return '<li>' + w2bMd(s) + '</li>'; }).join('') + '</ol>';
      if (a.constraints && a.constraints.length) h += '<ul>' + a.constraints.map(function(s){ return '<li>' + w2bMd(s) + '</li>'; }).join('') + '</ul>';
      if (a.related) h += '<div class="w2b-rel">' + w2bMd(a.related) + '</div>';
      if (a.route) h += '<button type="button" class="w2b-route" data-w2b="route" data-route="' + esc(a.route) + '">' + esc(a.route_label || 'Open') + ' \u2192</button>';
      if (m.id && !refused) h += '<div class="w2b-fb">Did that help? <button type="button" data-w2b="fb" data-id="' + esc(m.id) + '" data-val="1"' + (m.helpful === true ? ' class="on"' : '') + '>\ud83d\udc4d</button><button type="button" data-w2b="fb" data-id="' + esc(m.id) + '" data-val="0"' + (m.helpful === false ? ' class="on"' : '') + '>\ud83d\udc4e</button></div>';
      h += '</div>';
    });
    if (w2b.busy) h += '<div class="w2b-typing">Thinking\u2026</div>';
    body.innerHTML = h;
    body.scrollTop = body.scrollHeight;
    var f = $c('w2b-foot'); if (f) f.textContent = 'Portal help only \u00b7 ' + (w2b.remaining == null ? '40 questions a day' : (w2b.remaining + ' question' + (w2b.remaining === 1 ? '' : 's') + ' left today'));
  }
  function w2bIdle(arm){
    if (w2b.idle){ clearTimeout(w2b.idle); w2b.idle = null; }
    if (!arm || w2b.nudged) return;
    w2b.idle = setTimeout(function(){
      if (!w2b.open || w2b.busy || w2b.nudged) return;
      w2b.nudged = true;
      w2b.hist.push({ role: 'nudge', content: 'Still stuck? Ask a follow-up, or tell me what you were trying to do.' });
      w2bRender();
    }, W2B_IDLE);
  }
  async function w2bSend(text){
    var q = String(text || '').replace(/\s+/g, ' ').trim();
    var inp = $c('w2b-in');
    if (!q || w2b.busy) return;
    if (!partnerId){ w2b.hist.push({ role: 'bot', refused: true, answer: { ack: 'Help is only available on a coach login.' } }); w2bRender(); return; }
    if (q.length > W2B_MAX){ q = q.slice(0, W2B_MAX); }
    var now = Date.now();
    if (now - w2b.lastSent < W2B_GAP) return;
    if (q.toLowerCase() === w2b.lastQ.toLowerCase() && now - w2b.lastSent < 120000){ if (inp) inp.value = ''; return; }
    w2b.lastSent = now; w2b.lastQ = q; w2b.nudged = false; w2bIdle(false);
    var turns = w2b.hist.filter(function(m){ return m.role === 'user' || m.role === 'bot'; }).slice(-4).map(function(m){
      return { role: m.role === 'user' ? 'user' : 'assistant', content: m.role === 'user' ? m.content : (m.answer ? w2bFlat(m.answer) : String(m.content || '')) };
    });
    w2b.hist.push({ role: 'user', content: q }); if (inp) inp.value = '';
    w2b.busy = true; w2bRender(); var sb = $c('w2b-send'); if (sb) sb.disabled = true;
    try {
      var t = await jwt();
      var r = await fetch(W2B_EF, { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, history: turns }) });
      var j = await r.json().catch(function(){ return {}; });
      if (typeof j.remaining === 'number') w2b.remaining = j.remaining;
      if (!r.ok || !j.answer){
        w2b.hist.push({ role: 'bot', refused: true, answer: { ack: j.error || 'Help is unavailable right now \u2014 try again in a minute.' } });
      } else {
        w2b.hist.push({ role: 'bot', id: j.id || null, refused: !!j.refused, answer: j.answer, cached: !!j.cached });
        if (!j.refused) w2bIdle(true);
      }
    } catch(e){
      w2b.hist.push({ role: 'bot', refused: true, answer: { ack: 'Help is unavailable right now \u2014 try again in a minute.' } });
    }
    w2b.busy = false; if (sb) sb.disabled = false;
    w2bSave(); w2bRender();
  }
  async function w2bFeedback(id, helpful, btn){
    if (!id) return;
    var m = w2b.hist.filter(function(x){ return x.id === id; })[0];
    if (m && m.helpful === helpful) return;
    if (m) m.helpful = helpful;
    w2bSave(); w2bRender();
    try {
      var t = await jwt();
      await fetch(W2B_EF, { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'feedback', id: id, helpful: helpful }) });
    } catch(_){}
  }
  (function w2bBoot(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (!partnerId && !vyveScope && tries < 200) return;
      clearInterval(t);
      if (vyveScope || !partnerId) return; // staff/VYVE-library logins have no coach partner: the EF would 403
      w2bMount();
    }, 250);
  })();
  /* ============================ end PM-1083 W2b ============================ */

