  /* ============================ PM-1086 Trainerize W4 ============================
     Coach challenges (#72–#75): Leaderboard + Threshold types over coach_challenges /
     coach_challenge_participants, scored server-side by the challenge-score EF (cron 72 hourly,
     coach JWT for Recompute now / End). Go-live = coach_challenge_go_live RPC (creates the W3
     challenge thread); members opt in from challenges.html via challenge_opt_in (consent row +
     thread membership). Sidebar: Clients › Challenges. View: list → wizard (details / rules /
     theme / review) → live view (board, not-joined, thread, end/archive). */
  var W4C_EF = SUPA_URL + '/functions/v1/challenge-score';
  var W4C_ART_BASE = 'https://online.vyvehealth.co.uk/challenge-art/';
  var W4C_ART = ['strength','cardio','run','endurance','movement','habits','streak','water','sleep','weight','balance','breath','calm','checkin','connect','gratitude','journal','sunrise','live','replay','podcast','app','75'];
  var W4C_RULES = [['workout','Workout logged'],['cardio','Cardio logged'],['pb','Personal best (e1RM)'],['nutrition_goal','Daily calorie goal hit'],['habit','Daily habit done'],['fitness_goal','Fitness goal achieved']];
  var W4C_STOCK = { workout: 5, cardio: 2, pb: 20, nutrition_goal: 10, habit: 30, fitness_goal: 100 };
  var w4c = { list: [], filter: 'live', cur: null, board: [], busy: false, step: 1, d: null, editing: null, loadedOnce: false };
  (function w4ccss(){
    var s = document.createElement('style');
    s.textContent =
      '.w4c-mu{color:var(--text-muted);font-size:12px;}' +
      '.w4c-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}' +
      '.w4c-tab{border:1px solid var(--border);background:none;color:var(--text-muted);border-radius:99px;padding:6px 12px;font-size:12px;font-family:inherit;cursor:pointer;}' +
      '.w4c-tab.on{background:var(--vyve-teal);border-color:transparent;color:#fff;}' +
      '.w4c-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer;}' +
      '.w4c-row:last-child{border-bottom:0;} .w4c-row:hover{background:var(--surface-2);margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:8px;}' +
      '.w4c-th{width:46px;height:46px;border-radius:10px;background:var(--surface-2);flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;} .w4c-th img{width:100%;height:100%;object-fit:cover;}' +
      '.w4c-name{font-weight:600;font-size:14px;} .w4c-sub{font-size:12px;color:var(--text-muted);}' +
      '.w4c-pill{font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;margin-left:auto;flex:none;}' +
      '.w4c-pill.live{background:rgba(27,120,120,.25);color:var(--teal-lt);} .w4c-pill.draft{background:var(--surface-2);color:var(--text-muted);} .w4c-pill.ended{background:rgba(201,168,76,.2);color:var(--gold);} .w4c-pill.archived{background:var(--surface-2);color:var(--text-dim);}' +
      '.w4c-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0 16px;}' +
      '.w4c-stat{background:var(--surface-2);border-radius:10px;padding:10px 12px;} .w4c-stat b{display:block;font-size:20px;font-weight:700;} .w4c-stat span{font-size:11.5px;color:var(--text-muted);}' +
      '.w4c-board{width:100%;border-collapse:collapse;font-size:13px;} .w4c-board td,.w4c-board th{padding:8px 6px;border-bottom:1px solid var(--border);text-align:left;} .w4c-board th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;}' +
      '.w4c-board td.pts{text-align:right;font-weight:700;font-variant-numeric:tabular-nums;} .w4c-board tr.me td{color:var(--teal-lt);}' +
      '.w4c-board .medal{display:inline-block;width:22px;text-align:center;font-weight:800;} .w4c-board .medal.g{color:var(--gold);} .w4c-board .medal.s{color:#b8c0c8;} .w4c-board .medal.b{color:#c98a5a;}' +
      '.w4c-bd{font-size:11px;color:var(--text-dim);}' +
      '.w4c-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;}' +
      '.w4c-bar{height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden;margin:6px 0;} .w4c-bar i{display:block;height:100%;background:var(--vyve-teal);}' +
      '.w4c-steps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;} .w4c-stp{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:var(--text-muted);font-size:12.5px;font-family:inherit;cursor:pointer;padding:4px 8px;border-radius:8px;} .w4c-stp.on{color:var(--text);background:var(--surface-2);}' +
      '.w4c-rule{display:grid;grid-template-columns:1fr 90px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13.5px;} .w4c-rule:last-child{border-bottom:0;}' +
      '.w4c-rule input{width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font:inherit;font-size:14px;text-align:right;}' +
      '.w4c-seg{display:inline-flex;border:1px solid var(--border);border-radius:99px;overflow:hidden;} .w4c-seg button{border:0;background:none;color:var(--text-muted);padding:7px 14px;font-size:12.5px;font-family:inherit;cursor:pointer;} .w4c-seg button.on{background:var(--vyve-teal);color:#fff;}' +
      '.w4c-art{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px;} .w4c-art button{border:2px solid transparent;border-radius:12px;padding:0;background:var(--surface-2);overflow:hidden;cursor:pointer;aspect-ratio:1;} .w4c-art button.on{border-color:var(--vyve-teal);} .w4c-art img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.w4c-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:900;display:flex;align-items:center;justify-content:center;padding:16px;}' +
      '.w4c-modal{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;width:100%;max-width:560px;max-height:92vh;overflow:auto;}' +
      '.w4c-modal h3{font-size:16px;margin-bottom:4px;} .w4c-modal label{display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin:12px 0 5px;}' +
      '.w4c-modal input[type=text],.w4c-modal input[type=date],.w4c-modal textarea,.w4c-modal select{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font:inherit;font-size:14px;outline:none;}' +
      '.w4c-modal textarea{min-height:70px;resize:vertical;}' +
      '.w4c-err{font-size:12px;color:#e8834a;min-height:16px;margin-top:8px;}' +
      '.w4c-rev{font-size:13px;line-height:1.7;} .w4c-rev b{color:var(--text);}' +
      '@media (max-width:640px){.w4c-board .hide-sm{display:none;}}';
    document.head.appendChild(s);
  })();
  function w4cImg(c){
    if (!c) return '';
    if (c.image_path) return SUPA_URL + '/storage/v1/object/public/coach-challenge-art/' + c.image_path;
    if (c.theme) return W4C_ART_BASE + 'art-' + c.theme + '.svg';
    return '';
  }
  function w4cFmt(d){ if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0].slice(2) : d; }
  function w4cDay(c){
    var s = new Date(String(c.starts_at).slice(0, 10) + 'T00:00:00Z'), e = new Date(String(c.ends_at).slice(0, 10) + 'T00:00:00Z');
    var total = Math.round((e - s) / 86400000) + 1, day = Math.floor((Date.now() - s) / 86400000) + 1;
    return { total: total, day: Math.max(0, Math.min(total, day)) };
  }
  function w4cAgo(iso){ if (!iso) return 'not yet scored'; var m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'scored just now' : m < 60 ? 'scored ' + m + ' min ago' : m < 1440 ? 'scored ' + Math.round(m / 60) + ' h ago' : 'scored ' + w4cFmt(iso); }
  function w4cRules(c){ var r = (c && c.rules) || {}; var earn = Object.assign({}, W4C_STOCK, r.earn || {}); return { earn: earn, cap: Math.max(1, +r.daily_cap_per_rule || 1), threshold: r.threshold == null ? null : +r.threshold }; }
  function w4cActive(){ return roster.filter(function(c){ return c.status === 'active' && !c.lapsed_at && c.consent_accepted_at; }); }
  async function w4cScore(id, action){
    var t = await jwt();
    var r = await fetch(W4C_EF, { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge_id: id, action: action || 'score' }) });
    var j = await r.json().catch(function(){ return {}; });
    if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
    return j;
  }

  /* ── mount: sidebar sub-item + view ── */
  function w4cMount(){
    if ($c('view-challenges')) return;
    var sub = document.querySelector('.cp-sub[data-sub="clients"]');
    if (sub && !sub.querySelector('[data-go="challenges"]')){
      var b = document.createElement('button');
      b.className = 'cp-item cp-subitem'; b.type = 'button'; b.dataset.go = 'challenges'; b.innerHTML = '<span>Challenges</span>';
      sub.appendChild(b);
      b.addEventListener('click', function(){ go('challenges'); });
    }
    var anchor = $c('view-clients-batch') || $c('view-daily');
    if (!anchor) return;
    anchor.insertAdjacentHTML('afterend',
      '<div id="view-challenges" style="display:none;">' +
        '<div class="card" id="w4c-list-card"><div class="card-title">Challenges<button class="btn btn-primary" type="button" id="w4c-new" style="margin-left:auto;">+ New challenge</button></div>' +
        '<p class="w4c-mu" style="margin-bottom:12px;">Leaderboards and summits your clients opt into from their app. Points come from what they already log — workouts, cardio, PBs, calories, habits, goals — scored every hour.</p>' +
        '<div class="w4c-tabs" id="w4c-tabs"><button class="w4c-tab on" data-f="live" type="button">Live</button><button class="w4c-tab" data-f="draft" type="button">Drafts</button><button class="w4c-tab" data-f="ended" type="button">Ended</button><button class="w4c-tab" data-f="archived" type="button">Archived</button></div>' +
        '<div id="w4c-list"><p class="w4c-mu">Loading\u2026</p></div></div>' +
        '<div id="w4c-detail" style="display:none;"></div>' +
      '</div>');
    $c('w4c-new').addEventListener('click', function(){ w4cWizard(null); });
    $c('w4c-tabs').addEventListener('click', function(e){ var b = e.target.closest('.w4c-tab'); if (!b) return; w4c.filter = b.dataset.f; document.querySelectorAll('.w4c-tab').forEach(function(x){ x.classList.toggle('on', x === b); }); w4cRenderList(); });
    $c('w4c-list').addEventListener('click', function(e){ var r = e.target.closest('[data-w4cid]'); if (r) w4cOpen(r.dataset.w4cid); });
    $c('w4c-detail').addEventListener('click', w4cDetailClick);
  }
  async function w4cLoad(){
    w4cMount();
    if (!partnerId) return;
    try {
      if (!roster.length) await loadClients();
      w4c.list = await rest('/coach_challenges?' + pscope() + '&order=created_at.desc&select=*,coach_challenge_participants(member_email,points,rank,passed,opted_out_at)') || [];
    } catch(e){ $c('w4c-list').innerHTML = '<p class="w4c-mu">Could not load: ' + esc(e.message || e) + '</p>'; return; }
    w4c.loadedOnce = true;
    if (w4c.cur){ var c = w4c.list.filter(function(x){ return x.id === w4c.cur.id; })[0]; if (c) { w4c.cur = c; w4cRenderDetail(); return; } w4c.cur = null; }
    $c('w4c-detail').style.display = 'none'; $c('w4c-list-card').style.display = '';
    if (!w4c.list.some(function(c){ return c.status === 'live'; }) && w4c.list.some(function(c){ return c.status === 'draft'; }) && w4c.filter === 'live'){ w4c.filter = 'draft'; document.querySelectorAll('.w4c-tab').forEach(function(x){ x.classList.toggle('on', x.dataset.f === 'draft'); }); }
    w4cRenderList();
  }
  function w4cJoined(c){ return (c.coach_challenge_participants || []).filter(function(p){ return !p.opted_out_at; }); }
  function w4cRenderList(){
    var rows = w4c.list.filter(function(c){ return c.status === w4c.filter; });
    var el = $c('w4c-list'); if (!el) return;
    if (!rows.length){
      var msg = { live: 'No live challenges. Create one and take it live — every active client sees it in their app and chooses whether to join.', draft: 'No drafts.', ended: 'Nothing has ended yet.', archived: 'Nothing archived.' }[w4c.filter];
      el.innerHTML = '<p class="w4c-mu" style="padding:8px 0;">' + msg + '</p>'; return;
    }
    var nAct = w4cActive().length;
    el.innerHTML = rows.map(function(c){
      var d = w4cDay(c), j = w4cJoined(c).length, img = w4cImg(c);
      var sub = (c.type === 'threshold' ? 'Summit ' + (w4cRules(c).threshold || '?') + ' pts' : 'Leaderboard') + ' \u00b7 ' + w4cFmt(c.starts_at) + ' \u2013 ' + w4cFmt(c.ends_at) +
        (c.status === 'live' ? ' \u00b7 day ' + d.day + ' of ' + d.total + ' \u00b7 ' + j + ' of ' + nAct + ' joined' : c.status === 'ended' ? ' \u00b7 ' + j + ' took part' : '');
      return '<div class="w4c-row" data-w4cid="' + esc(c.id) + '"><div class="w4c-th">' + (img ? '<img src="' + esc(img) + '" alt="" onerror="this.remove()">' : '') + '</div><div style="min-width:0;"><div class="w4c-name">' + esc(c.name) + '</div><div class="w4c-sub">' + esc(sub) + '</div></div><span class="w4c-pill ' + esc(c.status) + '">' + esc(c.status) + '</span></div>';
    }).join('');
  }

  /* ── detail ── */
  async function w4cOpen(id){
    var c = w4c.list.filter(function(x){ return x.id === id; })[0]; if (!c) return;
    w4c.cur = c; w4c.board = [];
    $c('w4c-list-card').style.display = 'none'; $c('w4c-detail').style.display = '';
    w4cRenderDetail();
    try { w4c.board = await rest('/rpc/coach_challenge_board', { method: 'POST', body: { p_challenge: id } }) || []; } catch(_){ w4c.board = []; }
    w4cRenderDetail();
  }
  function w4cRenderDetail(){
    var c = w4c.cur, el = $c('w4c-detail'); if (!c || !el) return;
    var r = w4cRules(c), d = w4cDay(c), act = w4cActive(), joined = w4cJoined(c), img = w4cImg(c);
    var inMap = {}; joined.forEach(function(p){ inMap[(p.member_email || '').toLowerCase()] = 1; });
    var notIn = act.filter(function(x){ return !inMap[(x.member_email || '').toLowerCase()]; });
    var passed = w4c.board.filter(function(b){ return b.passed; }).length;
    var board = w4c.board.length ? '<table class="w4c-board"><thead><tr><th style="width:36px;">#</th><th>Client</th><th class="hide-sm">Breakdown</th><th style="text-align:right;">Points</th></tr></thead><tbody>' +
      w4c.board.map(function(b){
        var rk = b.rank || 0, medal = rk === 1 ? '<span class="medal g">1</span>' : rk === 2 ? '<span class="medal s">2</span>' : rk === 3 ? '<span class="medal b">3</span>' : '<span class="medal">' + rk + '</span>';
        var bd = b.breakdown || {}, parts = W4C_RULES.filter(function(x){ return bd[x[0]] > 0; }).map(function(x){ return x[1].split(' ')[0].toLowerCase() + ' ' + bd[x[0]]; }).join(' \u00b7 ');
        return '<tr><td>' + medal + '</td><td><a href="#" data-w4c="client" data-em="' + esc(b.member_email || '') + '" style="color:inherit;font-weight:600;">' + esc(b.first_name || b.member_email || '') + '</a>' + (b.passed ? ' <span class="w4c-pill live" style="margin-left:6px;">summit</span>' : '') + '</td><td class="hide-sm w4c-bd">' + esc(parts || '\u2014') + '</td><td class="pts">' + (b.points || 0) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="w4c-mu">' + (joined.length ? 'Loading board\u2026' : c.status === 'live' ? 'Nobody has joined yet. Clients join from Challenges in their app.' : 'No participants.') + '</p>';
    var acts = '';
    if (c.status === 'draft') acts = '<button class="btn btn-primary" type="button" data-w4c="golive">Go live</button><button class="btn" type="button" data-w4c="edit">Edit</button><button class="btn" type="button" data-w4c="delete">Delete draft</button>';
    else if (c.status === 'live') acts = '<button class="btn btn-primary" type="button" data-w4c="recompute">Recompute now</button>' + (c.thread_id ? '<button class="btn" type="button" data-w4c="thread">Open thread</button>' : '') + '<button class="btn" type="button" data-w4c="invite">Message clients</button><button class="btn" type="button" data-w4c="end">End challenge</button>';
    else if (c.status === 'ended') acts = (c.thread_id ? '<button class="btn" type="button" data-w4c="thread">Open thread</button>' : '') + '<button class="btn" type="button" data-w4c="archive">Archive</button>';
    else acts = '<button class="btn" type="button" data-w4c="unarchive">Restore to ended</button>';
    el.innerHTML =
      '<div class="card"><div style="display:flex;align-items:flex-start;gap:14px;">' +
        '<button class="btn" type="button" data-w4c="back" style="padding:6px 10px;">\u2190</button>' +
        '<div class="w4c-th" style="width:60px;height:60px;">' + (img ? '<img src="' + esc(img) + '" alt="" onerror="this.remove()">' : '') + '</div>' +
        '<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:18px;font-weight:700;">' + esc(c.name) + '</span><span class="w4c-pill ' + esc(c.status) + '" style="margin-left:0;">' + esc(c.status) + '</span></div>' +
        '<div class="w4c-sub">' + (c.type === 'threshold' ? 'Summit \u00b7 ' + (r.threshold || '?') + ' points to pass' : 'Leaderboard') + ' \u00b7 ' + w4cFmt(c.starts_at) + ' \u2013 ' + w4cFmt(c.ends_at) + (c.status === 'live' ? ' \u00b7 day ' + d.day + ' of ' + d.total : '') + ' \u00b7 ' + w4cAgo(c.last_scored_at) + '</div>' +
        (c.description ? '<p style="font-size:13px;margin-top:6px;">' + esc(c.description) + '</p>' : '') + '</div></div>' +
        '<div class="w4c-stats"><div class="w4c-stat"><b>' + joined.length + ' / ' + act.length + '</b><span>joined</span></div>' +
        (c.type === 'threshold' ? '<div class="w4c-stat"><b>' + passed + '</b><span>reached the summit</span></div>' : '<div class="w4c-stat"><b>' + (w4c.board[0] ? w4c.board[0].points : 0) + '</b><span>leading score</span></div>') +
        '<div class="w4c-stat"><b>' + W4C_RULES.filter(function(x){ return r.earn[x[0]] > 0; }).length + '</b><span>rules \u00b7 ' + (r.cap === 1 ? 'once a day each' : 'up to ' + r.cap + ' a day each') + '</span></div></div>' +
        board +
        (notIn.length && c.status === 'live' ? '<p class="w4c-mu" style="margin-top:12px;">Not joined: ' + esc(notIn.map(function(x){ return nameOf(x); }).join(', ')) + '</p>' : '') +
        '<div class="w4c-acts">' + acts + '</div><div class="w4c-err" id="w4c-derr"></div>' +
      '</div>';
  }
  async function w4cDetailClick(e){
    var b = e.target.closest('[data-w4c]'); if (!b) return;
    e.preventDefault();
    var c = w4c.cur, act = b.dataset.w4c, err = $c('w4c-derr');
    if (!c) return;
    if (act === 'back'){ w4c.cur = null; $c('w4c-detail').style.display = 'none'; $c('w4c-list-card').style.display = ''; w4cRenderList(); return; }
    if (act === 'client'){ if (b.dataset.em) viewClient(b.dataset.em); return; }
    if (act === 'edit'){ w4cWizard(c); return; }
    if (act === 'thread'){ go('messages'); setTimeout(async function(){ try { await w3loadThreads(); renderThreadList(); await msgOpen('g:' + c.thread_id); } catch(_){} }, 350); return; }
    if (act === 'invite'){ try { w3modal(null); } catch(_){ go('messages'); } return; }
    if (w4c.busy) return;
    w4c.busy = true; if (err) err.textContent = '';
    try {
      if (act === 'golive'){
        if (!confirm('Take "' + c.name + '" live? Every active client will see it in their app and can join. A group thread is created for everyone who joins.')) { w4c.busy = false; return; }
        var live = await rest('/rpc/coach_challenge_go_live', { method: 'POST', body: { p_challenge: c.id } });
        w5toast('Live. Clients can join from Challenges in their app.');
        w4c.filter = 'live'; document.querySelectorAll('.w4c-tab').forEach(function(x){ x.classList.toggle('on', x.dataset.f === 'live'); });
        await w4cLoad(); if (live && live.id) w4cOpen(live.id);
      } else if (act === 'recompute'){
        b.disabled = true; b.textContent = 'Scoring\u2026';
        await w4cScore(c.id, 'score');
        await w4cLoad(); w4cOpen(c.id); w5toast('Scores updated.');
      } else if (act === 'end'){
        if (!confirm('End "' + c.name + '" now? Final scores are computed and the board freezes. This cannot be undone.')) { w4c.busy = false; return; }
        await w4cScore(c.id, 'end');
        w4c.filter = 'ended'; document.querySelectorAll('.w4c-tab').forEach(function(x){ x.classList.toggle('on', x.dataset.f === 'ended'); });
        await w4cLoad(); w4cOpen(c.id); w5toast('Challenge ended. Results kept.');
      } else if (act === 'archive' || act === 'unarchive'){
        await rest('/coach_challenges?id=eq.' + c.id + '&' + pscope(), { method: 'PATCH', body: { status: act === 'archive' ? 'archived' : 'ended' } });
        w4c.cur = null; w4c.filter = act === 'archive' ? 'archived' : 'ended'; document.querySelectorAll('.w4c-tab').forEach(function(x){ x.classList.toggle('on', x.dataset.f === w4c.filter); });
        await w4cLoad();
      } else if (act === 'delete'){
        if (!confirm('Delete this draft?')) { w4c.busy = false; return; }
        await rest('/coach_challenges?id=eq.' + c.id + '&' + pscope() + '&status=eq.draft', { method: 'DELETE' });
        w4c.cur = null; await w4cLoad();
      }
    } catch(ex){ if (err) err.textContent = 'Could not do that: ' + (ex.message || ex); w4cRenderDetail(); }
    w4c.busy = false;
  }

  /* ── wizard: details → rules → theme → review ── */
  function w4cWizard(existing){
    if ($c('w4c-wiz')) return;
    var today = new Date(), in28 = new Date(Date.now() + 27 * 86400000);
    var iso = function(dt){ return dt.toISOString().slice(0, 10); };
    var r = existing ? w4cRules(existing) : { earn: Object.assign({}, W4C_STOCK), cap: 1, threshold: null };
    w4c.editing = existing || null; w4c.step = 1;
    w4c.d = { name: existing ? existing.name : '', description: existing ? (existing.description || '') : '', type: existing ? existing.type : 'leaderboard',
      starts_at: existing ? String(existing.starts_at).slice(0, 10) : iso(today), ends_at: existing ? String(existing.ends_at).slice(0, 10) : iso(in28),
      earn: r.earn, cap: r.cap, threshold: r.threshold || 500, theme: existing ? existing.theme : 'strength', image_path: existing ? existing.image_path : null, file: null };
    var bg = document.createElement('div'); bg.className = 'w4c-modal-bg'; bg.id = 'w4c-wiz';
    bg.innerHTML = '<div class="w4c-modal"><h3>' + (existing ? 'Edit challenge' : 'New challenge') + '</h3>' +
      '<div class="w4c-steps"><button class="w4c-stp on" data-s="1" type="button"><span class="wz-dot on">1</span>Details</button><button class="w4c-stp" data-s="2" type="button"><span class="wz-dot">2</span>Rules</button><button class="w4c-stp" data-s="3" type="button"><span class="wz-dot">3</span>Theme</button><button class="w4c-stp" data-s="4" type="button"><span class="wz-dot">4</span>Review</button></div>' +
      '<div id="w4c-stage"></div><div class="w4c-err" id="w4c-werr"></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;"><button class="btn" type="button" id="w4c-back">Back</button><button class="btn btn-primary" type="button" id="w4c-next">Next</button><button class="btn" type="button" id="w4c-cancel" style="margin-left:auto;">Cancel</button></div></div>';
    document.body.appendChild(bg);
    bg.querySelector('#w4c-cancel').addEventListener('click', function(){ bg.remove(); });
    bg.addEventListener('click', function(e){ if (e.target === bg) bg.remove(); });
    bg.querySelectorAll('.w4c-stp').forEach(function(b){ b.addEventListener('click', function(){ var n = +b.dataset.s; if (n < w4c.step || w4cCollect(true)) w4cStep(n); }); });
    bg.querySelector('#w4c-back').addEventListener('click', function(){ if (w4c.step > 1) { w4cCollect(false); w4cStep(w4c.step - 1); } });
    bg.querySelector('#w4c-next').addEventListener('click', function(){ if (!w4cCollect(true)) return; if (w4c.step < 4) w4cStep(w4c.step + 1); else w4cSave(); });
    w4cStep(1);
  }
  function w4cStep(n){
    var bg = $c('w4c-wiz'); if (!bg) return;
    w4c.step = n; var d = w4c.d, st = bg.querySelector('#w4c-stage');
    bg.querySelectorAll('.w4c-stp').forEach(function(b){ var k = +b.dataset.s; b.classList.toggle('on', k === n); var dot = b.querySelector('.wz-dot'); dot.classList.toggle('on', k === n); dot.classList.toggle('done', k < n); });
    bg.querySelector('#w4c-werr').textContent = '';
    bg.querySelector('#w4c-back').style.visibility = n === 1 ? 'hidden' : '';
    bg.querySelector('#w4c-next').textContent = n === 4 ? (w4c.editing ? 'Save changes' : 'Save draft') : 'Next';
    if (n === 1){
      st.innerHTML = '<label>Name</label><input type="text" id="w4c-name" maxlength="120" placeholder="e.g. September strength push" value="' + esc(d.name) + '">' +
        '<label>Description (optional)</label><textarea id="w4c-desc" maxlength="600" placeholder="What it is, why it matters, what the prize is">' + esc(d.description) + '</textarea>' +
        '<label>Type</label><div class="w4c-seg" id="w4c-type"><button type="button" data-t="leaderboard" class="' + (d.type === 'leaderboard' ? 'on' : '') + '">Leaderboard</button><button type="button" data-t="threshold" class="' + (d.type === 'threshold' ? 'on' : '') + '">Summit (points target)</button></div>' +
        '<p class="w4c-mu" style="margin-top:6px;">Leaderboard ranks everyone who joins. Summit sets a points target everyone can reach \u2014 no losers.</p>' +
        '<div class="field-row" style="margin-top:12px;"><div class="field"><label style="margin:0 0 5px;">Starts</label><input type="date" id="w4c-start" value="' + esc(d.starts_at) + '"></div><div class="field"><label style="margin:0 0 5px;">Ends</label><input type="date" id="w4c-end" value="' + esc(d.ends_at) + '"></div></div>';
      st.querySelector('#w4c-type').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; d.type = b.dataset.t; st.querySelectorAll('#w4c-type button').forEach(function(x){ x.classList.toggle('on', x === b); }); });
    } else if (n === 2){
      st.innerHTML = '<p class="w4c-mu" style="margin-bottom:8px;">Points per event. Set a rule to 0 to switch it off. Everything is read from what clients already log \u2014 nothing extra for them to do.</p>' +
        W4C_RULES.map(function(x){ return '<div class="w4c-rule"><span>' + x[1] + (x[0] === 'pb' ? '<br><span class="w4c-mu">Any set whose e1RM beats their history on that exercise</span>' : x[0] === 'nutrition_goal' ? '<br><span class="w4c-mu">Logged within 10% of their calorie target for the day</span>' : x[0] === 'fitness_goal' ? '<br><span class="w4c-mu">A goal you set for them, marked achieved</span>' : '') + '</span><input type="number" min="0" max="1000" step="1" data-rule="' + x[0] + '" value="' + (+d.earn[x[0]] || 0) + '"></div>'; }).join('') +
        '<label>Daily cap</label><div class="w4c-seg" id="w4c-cap"><button type="button" data-c="1" class="' + (d.cap === 1 ? 'on' : '') + '">Each rule once a day</button><button type="button" data-c="2" class="' + (d.cap === 2 ? 'on' : '') + '">Twice</button><button type="button" data-c="3" class="' + (d.cap === 3 ? 'on' : '') + '">Three times</button></div>' +
        (d.type === 'threshold' ? '<label>Summit \u2014 points to pass</label><input type="number" id="w4c-th" min="1" max="100000" step="1" value="' + (+d.threshold || 500) + '" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font:inherit;font-size:14px;">' : '');
      st.querySelector('#w4c-cap').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; d.cap = +b.dataset.c; st.querySelectorAll('#w4c-cap button').forEach(function(x){ x.classList.toggle('on', x === b); }); });
    } else if (n === 3){
      st.innerHTML = '<p class="w4c-mu" style="margin-bottom:8px;">Pick a VYVE tile or upload your own image (JPG, PNG or WebP, up to 5 MB). Clients see it on the challenge card.</p>' +
        '<div class="w4c-art" id="w4c-art">' + W4C_ART.map(function(a){ return '<button type="button" data-a="' + a + '" class="' + (!d.image_path && d.theme === a ? 'on' : '') + '" title="' + a + '"><img src="' + W4C_ART_BASE + 'art-' + a + '.svg" alt="' + a + '" loading="lazy"></button>'; }).join('') + '</div>' +
        '<label>Or upload your own</label><input type="file" id="w4c-file" accept="image/jpeg,image/png,image/webp"><div class="w4c-mu" id="w4c-filemsg" style="margin-top:6px;">' + (d.image_path ? 'Using your uploaded image.' : d.file ? 'Selected: ' + esc(d.file.name) : '') + '</div>';
      st.querySelector('#w4c-art').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; d.theme = b.dataset.a; d.file = null; d.image_path = null; st.querySelectorAll('#w4c-art button').forEach(function(x){ x.classList.toggle('on', x === b); }); st.querySelector('#w4c-filemsg').textContent = ''; try { st.querySelector('#w4c-file').value = ''; } catch(_){} });
      st.querySelector('#w4c-file').addEventListener('change', function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; if (f.size > 5242880){ st.querySelector('#w4c-filemsg').textContent = 'That file is over 5 MB.'; e.target.value = ''; return; } d.file = f; st.querySelectorAll('#w4c-art button').forEach(function(x){ x.classList.remove('on'); }); st.querySelector('#w4c-filemsg').textContent = 'Selected: ' + f.name; });
    } else {
      var on = W4C_RULES.filter(function(x){ return +d.earn[x[0]] > 0; });
      st.innerHTML = '<div class="w4c-rev"><b>' + esc(d.name) + '</b> \u00b7 ' + (d.type === 'threshold' ? 'Summit, ' + d.threshold + ' points to pass' : 'Leaderboard') + '<br>' + w4cFmt(d.starts_at) + ' \u2013 ' + w4cFmt(d.ends_at) + '<br>' +
        on.map(function(x){ return x[1] + ' <b>+' + d.earn[x[0]] + '</b>'; }).join(' \u00b7 ') + '<br>' + (d.cap === 1 ? 'Each rule scores once a day.' : 'Each rule scores up to ' + d.cap + ' times a day.') + '<br>Theme: ' + (d.file ? 'your upload' : d.image_path ? 'your uploaded image' : d.theme) + '</div>' +
        '<p class="w4c-mu" style="margin-top:12px;">Saving keeps it as a draft only you can see. Take it live from the challenge page \u2014 every active client then sees it and chooses whether to join. Names and points are visible to everyone who joins; the app tells them that before they do.</p>';
    }
  }
  function w4cCollect(validate){
    var bg = $c('w4c-wiz'); if (!bg) return false;
    var d = w4c.d, st = bg.querySelector('#w4c-stage'), err = bg.querySelector('#w4c-werr');
    if (w4c.step === 1){
      d.name = (st.querySelector('#w4c-name').value || '').trim(); d.description = (st.querySelector('#w4c-desc').value || '').trim();
      d.starts_at = st.querySelector('#w4c-start').value; d.ends_at = st.querySelector('#w4c-end').value;
      if (validate){ if (!d.name){ err.textContent = 'Give the challenge a name.'; return false; } if (!d.starts_at || !d.ends_at || d.ends_at < d.starts_at){ err.textContent = 'The end date must be on or after the start.'; return false; } }
    } else if (w4c.step === 2){
      st.querySelectorAll('input[data-rule]').forEach(function(i){ d.earn[i.dataset.rule] = Math.max(0, Math.min(1000, Math.round(+i.value || 0))); });
      var th = st.querySelector('#w4c-th'); if (th) d.threshold = Math.max(1, Math.round(+th.value || 0));
      if (validate && !W4C_RULES.some(function(x){ return d.earn[x[0]] > 0; })){ err.textContent = 'Switch on at least one rule.'; return false; }
    }
    err.textContent = ''; return true;
  }
  async function w4cSave(){
    var bg = $c('w4c-wiz'), d = w4c.d, err = bg.querySelector('#w4c-werr'), btn = bg.querySelector('#w4c-next');
    btn.disabled = true; btn.textContent = 'Saving\u2026';
    try {
      var imagePath = d.image_path || null;
      if (d.file){
        var ext = /png$/i.test(d.file.type) ? 'png' : /webp$/i.test(d.file.type) ? 'webp' : 'jpg';
        var path = pprefix() + '/challenges/' + (w4c.editing ? w4c.editing.id : (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))) + '.' + ext;
        var up = await sb().storage.from('coach-challenge-art').upload(path, d.file, { upsert: true, contentType: d.file.type });
        if (up.error) throw new Error(up.error.message || 'upload failed');
        imagePath = path;
      }
      var row = { name: d.name, description: d.description || null, type: d.type, starts_at: d.starts_at, ends_at: d.ends_at,
        rules: { earn: d.earn, daily_cap_per_rule: d.cap, threshold: d.type === 'threshold' ? d.threshold : null }, theme: imagePath ? null : d.theme, image_path: imagePath };
      if (w4c.editing) await rest('/coach_challenges?id=eq.' + w4c.editing.id + '&' + pscope(), { method: 'PATCH', body: row });
      else { row.partner_id = partnerId; await rest('/coach_challenges', { method: 'POST', body: row }); }
      bg.remove(); w4c.cur = null;
      w4c.filter = 'draft'; document.querySelectorAll('.w4c-tab').forEach(function(x){ x.classList.toggle('on', x.dataset.f === 'draft'); });
      await w4cLoad(); w5toast(w4c.editing ? 'Saved.' : 'Draft saved. Open it and press Go live when you are ready.');
    } catch(ex){ err.textContent = 'Could not save: ' + (ex.message || ex); btn.disabled = false; btn.textContent = w4c.editing ? 'Save changes' : 'Save draft'; }
  }

  /* -- go SHADOW (byte-replicates the W4b version + the challenges route) -- */
  function go(view){
    if (!goFromHash){ try { history.replaceState(null, '', '#' + view); } catch(_){} }
    document.querySelectorAll('.cp-item').forEach(function(x){ x.classList.toggle('active', x.dataset.go === view); });
    // auto-open the group that owns the active sub-item
    var activeSub = document.querySelector('.cp-subitem[data-go="' + String(view).replace(/"/g, '') + '"]');
    if (activeSub){
      var sub = activeSub.closest('.cp-sub');
      if (sub && !sub.classList.contains('open')){
        sub.classList.add('open');
        var h = document.querySelector('.cp-ghead[data-grp="' + sub.dataset.sub + '"]');
        if (h) h.classList.add('open');
      }
    }
    var V = ['view-dashboard','view-clients','view-leads','view-msgs','view-cal','view-plans','view-exercises','view-notifs','view-autos','view-profile','view-soon','view-settings','view-ci','view-daily','view-content','view-clients-batch','view-challenges'];
    var kindSel = null;
    var show = 'view-soon';
    if (view === 'dashboard') show = 'view-dashboard';
    else if (view === 'clients') show = 'view-clients';
    else if (view === 'clients_checkins') show = 'view-ci';
    else if (view === 'clients_daily') show = 'view-daily';
    else if (view === 'clients_batch') show = 'view-clients-batch';
    else if (view === 'challenges') show = 'view-challenges';
    else if (view === 'profile') show = 'view-profile';
    else if (view === 'settings' || view === 'terms') show = 'view-profile';
    else if (view === 'exercises') show = 'view-exercises';
    else if (view === 'notifications') show = 'view-notifs';
    else if (view === 'automations') show = 'view-autos';
    else if (view === 'leads') show = 'view-leads';
    else if (view === 'messages') show = 'view-msgs';
    else if (view === 'calendar') show = 'view-cal';
    else if (view === 'content') show = 'view-content';
    else if (String(view).indexOf('kindsel:') === 0){ show = 'view-plans'; kindSel = String(view).slice(8); }
    else if (SECTION_KINDS[view]) show = 'view-plans';
    V.forEach(function(id){ var e = $c(id); if (e) e.style.display = id === show ? '' : 'none'; });
    if (kindSel){
      var target = null;
      document.querySelectorAll('.pl-kind').forEach(function(b){
        var on = b.dataset.kind === kindSel;
        b.style.display = on ? '' : 'none';
        if (on) target = b;
      });
      if (target) target.click();
      loadExerciseNames(); exLoad();
    } else if (SECTION_KINDS[view]){
      var kinds = SECTION_KINDS[view];
      var first = null;
      document.querySelectorAll('.pl-kind').forEach(function(b){
        var inSec = kinds.indexOf(b.dataset.kind) >= 0;
        b.style.display = inSec ? '' : 'none';
        if (inSec && !first) first = b;
      });
      if (kinds.indexOf(plKind) < 0 && first) first.click();
      else { plLoad(); }
      loadExerciseNames(); exLoad();
    }
    if (view === 'exercises') exInit();
    if (view === 'notifications') notifLoad(true);
    if (view === 'automations') autoLoad();
    if (view === 'leads') leadsLoad();
    if (view === 'messages') msgInit();
    if (view === 'calendar') calLoad();
    if (view === 'content') w6ContentLoad();
    if (view === 'dashboard') renderDashboard();
    if (view === 'profile') renderProfile('overview');
    if (view === 'settings') renderProfile('settings');
    if (view === 'terms'){ renderProfile('settings'); setTimeout(function(){ var x = $c('ct-editor'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400); }
    if (view === 'clients_checkins') ciLoad();
    if (view === 'clients_daily') dgLoad();
    if (view === 'clients_batch') w4bBatchInit();
    if (view === 'challenges') w4cLoad();
    if (view === 'clients'){ w4bTagsLoad().then(function(){ w4bTagBarRender(); w4bDecorateRoster(); }); }
    if (SOON_COPY[view]){ $c('soon-title').textContent = SOON_COPY[view][0]; $c('soon-desc').textContent = SOON_COPY[view][1]; }
    var side = $c('cp-side'); if (side) side.classList.remove('open');
    var ov = $c('cp-overlay'); if (ov) ov.classList.remove('show');
  }
  /* ── boot hook: mount once partnerId resolves (coach only; staff/VYVE-library logins have no challenges) ── */
  (function w4cBoot(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (!partnerId && !vyveScope && tries < 200) return;
      clearInterval(t);
      if (vyveScope || !partnerId) return;
      w4cMount();
      if ((location.hash || '').replace('#', '') === 'challenges'){ goFromHash = true; try { go('challenges'); } finally { goFromHash = false; } }
    }, 250);
  })();
  /* ============================ end PM-1086 W4 ============================ */

