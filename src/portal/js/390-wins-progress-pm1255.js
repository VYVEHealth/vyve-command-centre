  /* ── PM-1255 · Celebrate a win · Quick Share Progress (Calum's #31 and #32, no AI) ──────────
     Calum asked for AI here; neither needs it. `coach_recent_wins(days)` finds PBs, training
     streaks, a full week of nutrition logging, step runs and a best-in-six-weeks check-in from
     the tables the app already writes, and `coach_client_progress(email, days)` returns this
     week against last. Both are SECURITY DEFINER, gated on `is_coach_of` / `get_my_partner_id`,
     so a coach only ever sees their own clients. The drafts are templates with the numbers in —
     rotated per win id so two clients never get a word-for-word identical message — and they land
     in the composer for the coach to edit. Nothing is sent automatically; nothing costs a call. ── */
  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.cw-wrap{display:none;gap:8px;overflow-x:auto;padding:2px 2px 10px;margin-bottom:6px;scrollbar-width:thin;}' +
      '.cw-wrap.on{display:flex;}' +
      '.cw-card{flex:none;min-width:230px;max-width:280px;border:1px solid var(--border);border-radius:12px;padding:10px 12px;background:var(--surface-2);}' +
      '.cw-card .k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);}' +
      '.cw-card .h{font-size:13px;font-weight:600;margin:3px 0 2px;line-height:1.35;}' +
      '.cw-card .d{font-size:11.5px;color:var(--text-muted);margin-bottom:8px;}' +
      '.cw-card .btn{font-size:11.5px;padding:5px 10px;}' +
      '.cw-head{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted);margin:2px 2px 6px;}' +
      '.cw-head button{font-size:11.5px;}';
    document.head.appendChild(st);
  })();

  var CW_LABEL = { pb: 'Personal best', streak: 'Consistency', nutrition: 'Nutrition', steps: 'Steps', checkin: 'Check-in' };
  var CW_DRAFT = {
    pb: ['Just seen that PB on {what} \u2014 {detail}. Brilliant work.', 'That\u2019s a PB on {what}, {detail}. Strong session.', 'Saw the {what} go up \u2014 {detail}. Keep that going.'],
    streak: ['{weeks} weeks on the bounce now. That consistency is the whole game \u2014 nice one.', 'Three sessions a week, week after week. That\u2019s the bit most people don\u2019t manage. Well done.', 'Another full week in the bag. Really good to see.'],
    nutrition: ['Logged your food every day this week \u2014 that makes my job easy. Good work.', 'Full week of nutrition logging. That\u2019s the habit that moves everything else.', 'Seven days logged. Keep it up and we\u2019ll have plenty to work with.'],
    steps: ['Steps have been sharp this week \u2014 {detail}. That all adds up.', 'Nice work getting the steps in, {detail}. That\u2019s the easy win most people skip.', 'Seen the step count this week. Class.'],
    checkin: ['Good to see the check-in come back strong this week. Whatever you changed, keep doing it.', 'Best score you\u2019ve put in for a while. Let\u2019s build on that.', 'That\u2019s a proper week. Nice one.']
  };
  function cwDraft(w){
    var bank = CW_DRAFT[w.kind] || CW_DRAFT.streak;
    var seed = 0, key = (w.member_email || '') + w.kind + (w.happened_at || '');
    for (var i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) & 0x7fffffff;
    var t = bank[seed % bank.length];
    var what = (w.headline || '').replace(/^.*PB on /, '');
    var weeks = (/(\d+) weeks/.exec(w.headline || '') || [, '3'])[1];
    return t.replace('{what}', what).replace('{detail}', (w.detail || '').split(' \u00b7 ')[0]).replace('{weeks}', weeks);
  }
  var cw = { rows: null, loading: false, dismissed: {} };
  async function cwLoad(force){
    if (cw.loading || (cw.rows && !force)) return cw.rows;
    cw.loading = true;
    try { cw.rows = await rest('/rpc/coach_recent_wins', { method: 'POST', body: { p_days: 7 } }) || []; }
    catch(_){ cw.rows = []; }
    cw.loading = false;
    return cw.rows;
  }
  function cwRender(){
    var host = $c('cw-wrap'); if (!host) return;
    var rows = (cw.rows || []).filter(function(w){ return !cw.dismissed[w.member_email + w.kind]; });
    var head = $c('cw-head');
    if (!rows.length){ host.classList.remove('on'); if (head) head.style.display = 'none'; return; }
    if (head) head.style.display = '';
    host.classList.add('on');
    host.innerHTML = rows.slice(0, 12).map(function(w, i){
      return '<div class="cw-card"><div class="k">' + esc(CW_LABEL[w.kind] || 'Win') + '</div>' +
        '<div class="h">' + esc(w.headline) + '</div><div class="d">' + esc(w.detail || '') + '</div>' +
        '<div style="display:flex;gap:6px;"><button class="btn btn-primary" type="button" data-cw="' + i + '">Congratulate</button>' +
        '<button class="btn" type="button" data-cwx="' + i + '" title="Not now">\u00d7</button></div></div>';
    }).join('');
    host.querySelectorAll('[data-cw]').forEach(function(b){ b.addEventListener('click', function(){
      var w = rows[parseInt(b.dataset.cw, 10)]; if (!w) return;
      msgOpen(String(w.member_email).toLowerCase());
      setTimeout(function(){ var inp = $c('msg-input'); if (inp){ inp.value = cwDraft(w); inp.focus(); try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch(_){} } }, 350);
    }); });
    host.querySelectorAll('[data-cwx]').forEach(function(b){ b.addEventListener('click', function(){
      var w = rows[parseInt(b.dataset.cwx, 10)]; if (!w) return;
      cw.dismissed[w.member_email + w.kind] = 1; cwRender();
    }); });
  }
  function cwEnsure(){
    if ($c('cw-wrap')) return;
    var wrap = $c('msg-wrap'); if (!wrap) return;
    var head = document.createElement('div'); head.className = 'cw-head'; head.id = 'cw-head'; head.style.display = 'none';
    head.innerHTML = '<strong style="font-size:12.5px;color:var(--text);">Worth a message this week</strong>' +
      '<button class="btn" type="button" id="cw-refresh" style="margin-left:auto;">Refresh</button>';
    var strip = document.createElement('div'); strip.className = 'cw-wrap'; strip.id = 'cw-wrap';
    wrap.parentElement.insertBefore(head, wrap);
    wrap.parentElement.insertBefore(strip, wrap);
    $c('cw-refresh').addEventListener('click', function(){ cwLoad(true).then(cwRender); });
    cwLoad().then(cwRender);
  }
  (function(){
    var _rtl = renderThreadList;
    renderThreadList = function(){ _rtl.apply(this, arguments); cwEnsure(); };
  })();

  /* ── Quick Share Progress: a button in the composer, numbers from SQL ── */
  function qsNum(n){ return n == null ? null : Number(n); }
  function qsLines(p){
    var c = p.current || {}, q = p.previous || {}, out = [];
    function d(a, b){ a = qsNum(a); b = qsNum(b); if (a == null) return null; if (b == null) return { a: a, delta: null }; return { a: a, delta: a - b }; }
    var st = d(c.steps, q.steps);
    if (st && st.a) out.push('Steps ' + st.a.toLocaleString() + '/day' + (st.delta ? (st.delta > 0 ? ' \u2014 up ' + Math.round(st.delta).toLocaleString() : ' \u2014 down ' + Math.round(-st.delta).toLocaleString()) : ''));
    var w = qsNum(c.workouts) || 0, cd = qsNum(c.cardio) || 0;
    if (w || cd) out.push('Training ' + w + ' session' + (w === 1 ? '' : 's') + (cd ? ' + ' + cd + ' cardio' : ''));
    var nd = qsNum(c.nut_days);
    if (nd) out.push('Nutrition logged ' + nd + ' day' + (nd === 1 ? '' : 's') + (qsNum(q.nut_days) != null && nd > qsNum(q.nut_days) ? ' \u2014 ' + (nd - qsNum(q.nut_days)) + ' more than last week' : ''));
    var h = qsNum(c.habits); if (h) out.push('Habits ticked ' + h + ' times');
    var wt = qsNum(c.weight), pw = qsNum(q.weight);
    if (wt != null) out.push('Weight ' + wt.toFixed(1) + ' kg' + (pw != null && Math.abs(wt - pw) >= 0.1 ? (wt < pw ? ' \u2014 down ' + (pw - wt).toFixed(1) : ' \u2014 up ' + (wt - pw).toFixed(1)) : ''));
    var wb = qsNum(c.wellbeing); if (wb != null) out.push('Check-in ' + wb + '/10');
    return out;
  }
  async function qsShare(){
    var em = msgThread; if (!em || String(em).indexOf('g:') === 0) return;   /* direct threads only */
    var btn = $c('qs-btn'); if (btn){ btn.disabled = true; btn.textContent = '\u2026'; }
    try {
      var p = await rest('/rpc/coach_client_progress', { method: 'POST', body: { p_email: em, p_days: 7 } });
      var lines = qsLines(p || {});
      var inp = $c('msg-input');
      if (!lines.length){ alert('Nothing logged this week yet \u2014 nothing to share.'); return; }
      if (inp){
        inp.value = 'Quick look at your week:\n\n' + lines.map(function(l){ return '\u2022 ' + l; }).join('\n') + '\n\n';
        inp.focus();
        try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch(_){}
      }
    } catch(e){ alert('Couldn\u2019t build the update \u2014 ' + (e.message || e)); }
    finally { if (btn){ btn.disabled = false; btn.textContent = '\ud83d\udcc8 Progress'; } }
  }
  (function(){
    var t = setInterval(function(){
      var comp = $c('msg-compose'); if (!comp) return;
      clearInterval(t);
      if ($c('qs-btn')) return;
      var b = document.createElement('button');
      b.className = 'btn'; b.type = 'button'; b.id = 'qs-btn';
      b.style.cssText = 'font-size:12px;white-space:nowrap;';
      b.title = 'Drop this week\u2019s numbers into the message';
      b.textContent = '\ud83d\udcc8 Progress';
      b.addEventListener('click', qsShare);
      var send = $c('msg-send');
      if (send) comp.insertBefore(b, send); else comp.appendChild(b);
    }, 400);
    setTimeout(function(){ clearInterval(t); }, 30000);
  })();
