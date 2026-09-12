  /* ============================ PM-1077 Trainerize W2 ============================
     Automations (#64/#97 auto-message sequences with the stock set, #69 scheduled messages,
     #83 membership lapse, #102 health-connection status + Ask to connect, #103 per-client
     threshold alerts). Backend: migration tz_w2_auto_messages (+ tz_w2_seed_partner_arg,
     tz_w2_scheduled_cancel), coach-automations EF v1 on cron 71, coach-provision-client v14
     (alerts META_KEY, _meta.welcome_attachments[], notify prefs +lapsed/+alert).
     The old plan-change cards (coach_automations, PM-958g) are NOT migrated — they render
     unchanged inside the second tab of the new Automations view; the plan-change rail in
     coach-provision-client is untouched.
     Wraps by binding reassignment: autoLoad / loadClients / w5Overview / wzOpen / wzPaint.
     Shadows by same-scope redeclaration: msgBubble, msgOpen, msgPoll, wzAssignSpec, initials,
     badge (Lapsed pill via the initials→badge row context). Everything is hidden at VYVE null
     scope. */
  var w2 = { rules: null, rulesAt: 0, log: null, edit: null, drawer: null, sched: null, badgeCtx: null, wzAtt: [], wzAttStart: '', tab: 'journey', health: {} };
  var W2_TRIGGERS = [
    ['activation', 'They accept your coaching invite', 'event'],
    ['days_since_start', 'A number of days after they start', 'timed'],
    ['first_workout', 'Their first workout lands', 'event'],
    ['first_cardio', 'Their first cardio session lands', 'event'],
    ['first_meal', 'Their first meal is logged', 'event'],
    ['n_workouts', 'Their Nth workout lands', 'event'],
    ['inactive', 'No activity for N days (once per lull)', 'timed'],
    ['checkin_submitted', 'A weekly check-in comes in', 'event'],
    ['health_not_connected', 'No health app connected after N days', 'timed'],
    ['birthday', 'Their birthday', 'timed']
  ];
  var W2_GROUPS = [['journey', 'First two weeks', ['activation', 'days_since_start', 'health_not_connected']], ['firsts', 'Firsts', ['first_workout', 'first_cardio', 'first_meal', 'n_workouts']], ['keep', 'Keeping them going', ['inactive', 'checkin_submitted', 'birthday']]];
  var W2_STOCK = {
    welcome: { subject: 'Welcome to coaching with {{coach_name}}', body: 'Hi {{first_name}}, welcome aboard. Your first plan is already in the VYVE app \u2014 open Workouts to see it. Message me here any time, I read everything.\n\n{{coach_name}}' },
    day3: { subject: 'How are the first few days going?', body: 'Hi {{first_name}}, three days in \u2014 how is it feeling so far? If anything in the plan is not sitting right, tell me and I will adjust it. Small wins count this week.\n\n{{coach_name}}' },
    day7: { subject: 'One week down', body: 'Hi {{first_name}}, that is one full week \u2014 nicely done. Your weekly check-in is the most useful thing you can do for me right now: it is how I keep the plan honest. Keep logging, keep messaging.\n\n{{coach_name}}' },
    day14: { subject: 'Two weeks in', body: 'Hi {{first_name}}, two weeks in. This is usually when the routine either sticks or slips \u2014 if it is slipping, say so and we will make it easier, not harder. Proud of the consistency so far.\n\n{{coach_name}}' },
    health: { subject: 'Connect your health app', body: 'Hi {{first_name}}, one quick thing: connect Apple Health or Health Connect in the VYVE app (Settings) and your steps, sleep and workouts will log themselves. It takes about ten seconds and means I can see the real picture.\n\n{{coach_name}}' },
    first_workout: { subject: 'First workout done', body: '{{first_name}} \u2014 first workout logged. That is the hardest one. How did it feel?\n\n{{coach_name}}' },
    first_cardio: { subject: 'First cardio done', body: 'Nice, {{first_name}} \u2014 first cardio session in the book. Keep it easy enough to repeat this week.\n\n{{coach_name}}' },
    first_meal: { subject: 'First meal logged', body: '{{first_name}}, I can see your first food log \u2014 brilliant. You do not need to be perfect with it, just consistent, and I will use it to tune your targets.\n\n{{coach_name}}' },
    inactive5: { subject: 'Checking in', body: 'Hi {{first_name}}, I have not seen anything logged for {{days}} days \u2014 no judgement, life happens. Is there something getting in the way I can help with? Even one short session gets you back on track.\n\n{{coach_name}}' },
    checkin: { subject: 'Got your check-in', body: 'Thanks {{first_name}}, got your check-in \u2014 I will go through it and come back to you with any changes.\n\n{{coach_name}}' },
    birthday: { subject: 'Happy birthday', body: 'Happy birthday, {{first_name}}! Enjoy the day \u2014 the plan will still be there tomorrow.\n\n{{coach_name}}' }
  };
  (function w2css(){
    var s = document.createElement('style'); s.id = 'w2-css';
    s.textContent = [
      '.w2-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:14px;}',
      '.w2-tabs button{background:none;border:none;border-bottom:2px solid transparent;color:var(--text-muted);padding:8px 12px;font:inherit;font-size:13px;cursor:pointer;}',
      '.w2-tabs button.on{color:var(--text);border-bottom-color:var(--vyve-teal);}',
      '.w2-grp{margin-bottom:20px;} .w2-grp h4{font-size:12.5px;color:var(--text-muted);font-weight:500;margin:0 0 8px;}',
      '.w2-rule{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);margin-bottom:8px;}',
      '.w2-rule.off{opacity:.55;} .w2-rule .t{font-weight:600;font-size:13.5px;} .w2-rule .m{color:var(--text-muted);font-size:12px;margin-top:2px;}',
      '.w2-rule .ch{display:inline-block;padding:1px 7px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border);font-size:11px;margin-left:6px;color:var(--text);}',
      '.w2-rule .stock{color:#C9A84C;margin-left:6px;} .w2-rule .r{display:flex;gap:6px;align-items:center;color:var(--text-muted);font-size:12px;}',
      '.w2-sent{font-family:DM Mono,monospace;font-size:11.5px;color:var(--text-dim,var(--text-muted));}',
      '.w2-tog{width:36px;height:20px;border-radius:12px;background:var(--surface-3,var(--surface-2));position:relative;cursor:pointer;border:1px solid var(--border);flex:none;}',
      '.w2-tog::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--text-muted);transition:left .12s;}',
      '.w2-tog.on{background:#1B7878;border-color:#1B7878;} .w2-tog.on::after{left:18px;background:#fff;}',
      '.w2-drawer{position:fixed;top:0;right:0;bottom:0;width:min(460px,100vw);background:var(--surface);border-left:1px solid var(--border);padding:20px 22px;overflow:auto;z-index:90;box-shadow:-20px 0 40px rgba(0,0,0,.35);display:none;}',
      '.w2-drawer.show{display:block;} .w2-drawer h2{font-size:16px;font-weight:600;margin:0 0 14px;}',
      '.w2-drawer .field{margin-bottom:11px;} .w2-drawer label{display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;}',
      '.w2-drawer input,.w2-drawer select,.w2-drawer textarea{width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px 10px;font:inherit;font-size:13px;}',
      '.w2-drawer textarea{min-height:130px;resize:vertical;} .w2-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.w2-chips{display:flex;gap:6px;flex-wrap:wrap;} .w2-chip{padding:4px 10px;border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--text-muted);cursor:pointer;background:none;font-family:inherit;}',
      '.w2-chip.on{border-color:var(--vyve-teal);color:var(--text);background:rgba(77,170,170,.12);}',
      '.w2-prev{background:var(--surface-2);border:1px dashed var(--border-strong,var(--border));border-radius:8px;padding:10px 12px;font-size:12.5px;white-space:pre-wrap;color:var(--text-muted);}',
      '.w2-mu{font-size:12px;color:var(--text-muted);} .w2-note{font-size:12px;color:var(--text-dim,var(--text-muted));margin-top:8px;}',
      '.w2-sched-pop{position:absolute;right:10px;bottom:56px;background:var(--surface);border:1px solid var(--border-strong,var(--border));border-radius:10px;padding:12px;width:270px;box-shadow:0 12px 32px rgba(0,0,0,.4);z-index:20;display:none;}',
      '.w2-sched-pop.show{display:block;} .w2-sched-pop input{width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 9px;font:inherit;font-size:13px;}',
      '.w2-clock{display:inline-flex;gap:6px;align-items:center;font-size:11px;color:#C9A84C;} .w2-clock a{color:var(--text-muted);cursor:pointer;margin-left:6px;}',
      '.w2-log{font-size:12.5px;display:grid;grid-template-columns:130px 1fr auto;gap:10px;padding:7px 0;border-top:1px solid var(--border);color:var(--text-muted);} .w2-log:first-child{border-top:0;} .w2-log b{color:var(--text);font-weight:500;}',
      '.w2-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;} @media(max-width:820px){.w2-two{grid-template-columns:1fr;}}',
      '.w2-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px;} .w2-card h3{font-size:13.5px;font-weight:600;margin:0 0 10px;}',
      '.w2-dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:8px;} .w2-dot.ok{background:#4ADE80;} .w2-dot.no{background:var(--text-dim,var(--text-muted));} .w2-dot.rv{background:#F5B84B;}',
      '.w2-al{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border);font-size:13px;flex-wrap:wrap;} .w2-al:first-of-type{border-top:0;}',
      '.w2-al input[type=number]{width:64px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:4px 6px;font:inherit;font-size:12.5px;text-align:right;}',
      '.w2-att{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;font-size:13px;background:var(--surface-2);} .w2-att .x{margin-left:auto;color:var(--text-muted);cursor:pointer;background:none;border:none;font:inherit;}',
      '.w2-pill-lapsed{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.5px;color:#fff;background:#C64545;}'
    ].join('\n');
    document.head.appendChild(s);
  })();
  function w2fill(t, vars){ return String(t || '').replace(/{{\s*(first_name|coach_name|days)\s*}}/g, function(_, k){ return vars[k] || ''; }); }
  function w2trigLabel(r){
    var t = W2_TRIGGERS.filter(function(x){ return x[0] === r.trigger; })[0];
    var base = t ? t[1] : r.trigger;
    if (r.trigger === 'days_since_start') base = (r.offset_days || 0) + ' day' + (r.offset_days === 1 ? '' : 's') + ' after they start';
    if (r.trigger === 'inactive') base = 'No activity for ' + (r.offset_days || 5) + ' days \u2014 once per lull';
    if (r.trigger === 'health_not_connected') base = (r.offset_days || 2) + ' days after they start, if no health app is connected';
    if (r.trigger === 'n_workouts') base = 'When their ' + (r.n || 10) + 'th workout lands';
    var timed = t && t[2] === 'timed';
    return base + (timed ? ', ' + (r.fire_at_local || '09:00') : ' \u2014 straight away');
  }
  function w2chan(c){ return c === 'both' ? 'In-app + email' : c === 'email' ? 'Email' : 'In-app message'; }
  async function w2seed(){ try { await rest('/rpc/seed_coach_auto_messages', { method: 'POST', body: {} }); } catch(_){} }
  async function w2rulesLoad(force){
    if (!partnerId) return [];
    if (w2.rules && !force && Date.now() - w2.rulesAt < 60e3) return w2.rules;
    var rows = await rest('/coach_auto_messages?' + pscope() + '&order=sort.asc,created_at.asc&select=*') || [];
    if (!rows.length){ await w2seed(); rows = await rest('/coach_auto_messages?' + pscope() + '&order=sort.asc,created_at.asc&select=*') || []; }
    w2.rules = rows; w2.rulesAt = Date.now();
    return rows;
  }
  async function w2logLoad(email){
    var q = '/coach_auto_message_log?' + pscope() + '&order=sent_at.desc&limit=120&select=id,member_email,rule_name,channel,sent_at,message_id' + (email ? '&member_email=eq.' + encodeURIComponent(email) : '');
    return await rest(q) || [];
  }
  function w2sentCounts(){
    var m = {};
    (w2.log || []).forEach(function(l){ if (l.rule_name) m[l.rule_name] = (m[l.rule_name] || 0) + 1; });
    return m;
  }
  /* ── Automations view: three tabs over the legacy #view-autos card ── */
  function w2autosShell(){
    var view = $c('view-autos'); if (!view || view.dataset.w2) return;
    view.dataset.w2 = '1';
    view.innerHTML = '<div class="card">' +
      '<div class="card-title">Automations</div>' +
      '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Messages that send themselves. Every active client gets these unless you switch one off \u2014 edit the wording, change when it goes, or add your own. Stock messages are marked; VYVE wrote them, you can rewrite them.</p>' +
      '<div class="w2-tabs"><button type="button" data-w2tab="journey" class="on">Client journey</button><button type="button" data-w2tab="plans">When you change a plan</button><button type="button" data-w2tab="sent">Sent log</button></div>' +
      '<div id="w2-tab-journey"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;"><span class="w2-mu">Timed messages send between 08:00 and 20:00 London \u00b7 event messages go within 15 minutes</span><button class="btn btn-primary" type="button" id="w2-new" style="font-size:12px;">+ New automation</button></div><div id="w2-rules"><p class="w2-mu">Loading\u2026</p></div>' +
      '<p class="w2-note">Variables for any message: {{first_name}} {{coach_name}} {{days}}. Automations skip archived clients and anyone whose VYVE membership has lapsed.</p></div>' +
      '<div id="w2-tab-plans" style="display:none;"><p style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">Automatic emails to a client the moment you change their plans. On by default with a ready-made message \u2014 switch any off, or make the wording yours.</p>' +
      '<p style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Variables: <code style="background:var(--surface-2);padding:1px 6px;border-radius:5px;">{{first_name}}</code> <code style="background:var(--surface-2);padding:1px 6px;border-radius:5px;">{{coach_name}}</code> <code style="background:var(--surface-2);padding:1px 6px;border-radius:5px;">{{plan_name}}</code></p>' +
      '<div id="auto-list"><p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p></div></div>' +
      '<div id="w2-tab-sent" style="display:none;"><div id="w2-sent"><p class="w2-mu">Loading\u2026</p></div></div>' +
      '</div>';
    view.querySelectorAll('[data-w2tab]').forEach(function(b){ b.addEventListener('click', function(){ w2tab(b.dataset.w2tab); }); });
    $c('w2-new').addEventListener('click', function(){ w2editOpen(null); });
  }
  function w2tab(name){
    w2.tab = name;
    ['journey', 'plans', 'sent'].forEach(function(t){ var el = $c('w2-tab-' + t); if (el) el.style.display = t === name ? '' : 'none'; });
    document.querySelectorAll('[data-w2tab]').forEach(function(b){ b.classList.toggle('on', b.dataset.w2tab === name); });
    if (name === 'sent') w2sentRender();
  }
  function w2rulesRender(){
    var el = $c('w2-rules'); if (!el) return;
    var rules = w2.rules || [];
    var counts = w2sentCounts();
    var used = {};
    var html = W2_GROUPS.map(function(g){
      var mine = rules.filter(function(r){ return g[2].indexOf(r.trigger) >= 0; });
      mine.forEach(function(r){ used[r.id] = 1; });
      if (!mine.length) return '';
      return '<div class="w2-grp"><h4>' + g[1] + '</h4>' + mine.map(w2ruleCard).join('') + '</div>';
    }).join('');
    var rest2 = rules.filter(function(r){ return !used[r.id]; });
    if (rest2.length) html += '<div class="w2-grp"><h4>Other</h4>' + rest2.map(w2ruleCard).join('') + '</div>';
    el.innerHTML = html || '<p class="w2-mu">No automations yet \u2014 add one above.</p>';
    el.querySelectorAll('.w2-tog').forEach(function(t){ t.addEventListener('click', function(){ w2toggle(t.dataset.id, !t.classList.contains('on')); }); });
    el.querySelectorAll('[data-w2edit]').forEach(function(b){ b.addEventListener('click', function(){ var r = rules.filter(function(x){ return x.id === b.dataset.w2edit; })[0]; if (r) w2editOpen(r); }); });
    function w2ruleCard(r){
      var n = counts[r.name] || 0;
      return '<div class="w2-rule' + (r.enabled ? '' : ' off') + '" data-id="' + r.id + '"><div class="w2-tog' + (r.enabled ? ' on' : '') + '" data-id="' + r.id + '" role="switch" aria-checked="' + (r.enabled ? 'true' : 'false') + '"></div>' +
        '<div><div class="t">' + esc(r.name) + '</div><div class="m">' + esc(w2trigLabel(r)) + ' <span class="ch">' + w2chan(r.channel) + '</span>' + (r.is_stock ? '<span class="stock">stock</span>' : '') + '</div></div>' +
        '<div class="r"><span class="w2-sent">sent ' + n + '</span><button class="btn" type="button" data-w2edit="' + r.id + '" style="font-size:12px;">Edit</button></div></div>';
    }
  }
  async function w2toggle(id, on){
    var r = (w2.rules || []).filter(function(x){ return x.id === id; })[0]; if (!r) return;
    r.enabled = on; w2rulesRender();
    try { await rest('/coach_auto_messages?id=eq.' + id + '&' + pscope(), { method: 'PATCH', body: { enabled: on, updated_at: new Date().toISOString() } }); }
    catch(e){ r.enabled = !on; w2rulesRender(); alert('Couldn\u2019t save that \u2014 ' + e.message); }
  }
  function w2editOpen(rule){
    w2.edit = rule ? JSON.parse(JSON.stringify(rule)) : { name: '', trigger: 'days_since_start', offset_days: 3, n: null, fire_at_local: '09:00', channel: 'message', subject: '', body: '', enabled: true, is_stock: false };
    if (!w2.drawer){
      w2.drawer = document.createElement('div'); w2.drawer.className = 'w2-drawer'; w2.drawer.id = 'w2-drawer';
      document.body.appendChild(w2.drawer);
    }
    var e = w2.edit, d = w2.drawer;
    var coachFirst = (roster.length && partnerId) ? '' : '';
    d.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><h2 style="flex:1;margin:0;">' + (rule ? 'Edit automation' : 'New automation') + '</h2><button class="btn" type="button" id="w2-x" style="font-size:12px;">Close</button></div>' +
      '<div class="field"><label>Name</label><input id="w2-f-name" maxlength="80" value="' + esc(e.name) + '"/></div>' +
      '<div class="field"><label>When</label><select id="w2-f-trig"' + (e.is_stock ? ' disabled' : '') + '>' + W2_TRIGGERS.map(function(t){ return '<option value="' + t[0] + '"' + (t[0] === e.trigger ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' + (e.is_stock ? '<div class="w2-note">Stock automations keep their trigger \u2014 duplicate it as a new one if you want a different moment.</div>' : '') + '</div>' +
      '<div class="w2-row"><div class="field" id="w2-f-days-w"><label id="w2-f-days-l">Days after they start</label><input id="w2-f-days" type="number" min="0" max="365" value="' + (e.offset_days || 0) + '"/></div>' +
      '<div class="field" id="w2-f-time-w"><label>Send at (London)</label><input id="w2-f-time" type="time" value="' + esc(e.fire_at_local || '09:00') + '"/></div></div>' +
      '<div class="field" id="w2-f-n-w" style="display:none;"><label>Which workout (N)</label><input id="w2-f-n" type="number" min="1" max="1000" value="' + (e.n || 10) + '"/></div>' +
      '<div class="field"><label>Send as</label><div class="w2-chips">' + [['message', 'In-app message'], ['email', 'Email'], ['both', 'Both']].map(function(c){ return '<button type="button" class="w2-chip' + (c[0] === e.channel ? ' on' : '') + '" data-ch="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field" id="w2-f-subj-w"><label>Subject (email only)</label><input id="w2-f-subj" maxlength="160" value="' + esc(e.subject || '') + '"/></div>' +
      '<div class="field"><label>Message</label><textarea id="w2-f-body" maxlength="2000">' + esc(e.body || '') + '</textarea></div>' +
      '<div class="field"><label>Variables</label><span class="w2-mu"><code>{{first_name}}</code> <code>{{coach_name}}</code> <code>{{days}}</code></span></div>' +
      '<div class="field"><label>Preview</label><div class="w2-prev" id="w2-prev"></div></div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;"><button class="btn btn-primary" type="button" id="w2-save">Save</button><button class="btn" type="button" id="w2-test">Send me a test</button>' +
      (e.is_stock && W2_STOCK[e.key] ? '<button class="btn" type="button" id="w2-reset" style="margin-left:auto;">Reset to stock</button>' : (rule ? '<button class="btn" type="button" id="w2-del" style="margin-left:auto;color:#F87171;">Delete</button>' : '')) + '</div>' +
      '<p class="w2-mu" id="w2-msg" style="margin-top:8px;"></p>' +
      '<p class="w2-note">' + (e.is_stock ? 'Stock automations can be switched off but not deleted.' : 'Your own automations can be deleted at any time.') + '</p>';
    d.classList.add('show');
    function trigUi(){
      var t = $c('w2-f-trig').value;
      var timed = ['days_since_start', 'inactive', 'health_not_connected', 'birthday'].indexOf(t) >= 0;
      $c('w2-f-days-w').style.display = ['days_since_start', 'inactive', 'health_not_connected'].indexOf(t) >= 0 ? '' : 'none';
      $c('w2-f-days-l').textContent = t === 'inactive' ? 'Quiet for (days)' : t === 'health_not_connected' ? 'Days after they start' : 'Days after they start';
      $c('w2-f-time-w').style.display = timed ? '' : 'none';
      $c('w2-f-n-w').style.display = t === 'n_workouts' ? '' : 'none';
      prev();
    }
    function chan(){ var b = d.querySelector('.w2-chip.on'); return b ? b.dataset.ch : 'message'; }
    function prev(){
      var me = roster.filter(function(c){ return c.status === 'active'; })[0];
      var vars = { first_name: me ? (nameOf(me) || '').split(' ')[0] : 'Sam', coach_name: (typeof w7Acct !== 'undefined' && w7Acct && w7Acct.name) || 'Your coach', days: String(parseInt($c('w2-f-days').value) || 5) };
      $c('w2-prev').textContent = w2fill($c('w2-f-body').value, vars) || '\u2014';
      $c('w2-f-subj-w').style.display = chan() === 'message' ? 'none' : '';
    }
    d.querySelectorAll('.w2-chip').forEach(function(b){ b.addEventListener('click', function(){ d.querySelectorAll('.w2-chip').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); prev(); }); });
    $c('w2-f-trig').addEventListener('change', trigUi);
    $c('w2-f-body').addEventListener('input', prev);
    $c('w2-f-days').addEventListener('input', prev);
    $c('w2-x').addEventListener('click', function(){ d.classList.remove('show'); });
    function collect(){
      var t = $c('w2-f-trig').value;
      return {
        name: $c('w2-f-name').value.trim().slice(0, 80) || 'Untitled automation',
        trigger: t,
        offset_days: Math.max(0, Math.min(365, parseInt($c('w2-f-days').value) || 0)),
        n: t === 'n_workouts' ? Math.max(1, Math.min(1000, parseInt($c('w2-f-n').value) || 10)) : null,
        fire_at_local: /^\d{2}:\d{2}$/.test($c('w2-f-time').value) ? $c('w2-f-time').value : '09:00',
        channel: chan(),
        subject: $c('w2-f-subj').value.trim().slice(0, 160) || null,
        body: $c('w2-f-body').value.trim().slice(0, 2000),
        updated_at: new Date().toISOString()
      };
    }
    $c('w2-save').addEventListener('click', async function(){
      var msg = $c('w2-msg'); var p = collect();
      if (!p.body){ msg.textContent = 'Write the message first.'; return; }
      msg.textContent = 'Saving\u2026';
      try {
        if (e.id) await rest('/coach_auto_messages?id=eq.' + e.id + '&' + pscope(), { method: 'PATCH', body: p });
        else await rest('/coach_auto_messages', { method: 'POST', body: Object.assign({ partner_id: partnerId, enabled: true, is_stock: false, sort: 500 }, p) });
        await w2rulesLoad(true); w2rulesRender();
        msg.textContent = 'Saved.';
        setTimeout(function(){ d.classList.remove('show'); }, 500);
      } catch(err){ msg.textContent = 'Save failed: ' + err.message; }
    });
    $c('w2-test').addEventListener('click', async function(){
      var msg = $c('w2-msg'); var p = collect(); msg.textContent = 'Sending a test to your email\u2026';
      try {
        var t = await jwt();
        var r = await fetch(SUPA_URL + '/functions/v1/coach-automations', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', rule: p }) });
        var jj = await r.json().catch(function(){ return {}; });
        msg.textContent = (r.ok && jj.success) ? ('Test sent to ' + jj.to + ' (email, whatever the channel).') : ('Test failed: ' + (jj.error || r.status));
      } catch(err){ msg.textContent = 'Test failed: ' + err.message; }
    });
    var rs = $c('w2-reset'); if (rs) rs.addEventListener('click', function(){ $c('w2-f-subj').value = W2_STOCK[e.key].subject; $c('w2-f-body').value = W2_STOCK[e.key].body; prev(); });
    var dl = $c('w2-del'); if (dl) dl.addEventListener('click', async function(){
      if (!confirm('Delete \u201c' + e.name + '\u201d? Messages it already sent stay in the threads.')) return;
      try { await rest('/coach_auto_messages?id=eq.' + e.id + '&' + pscope(), { method: 'DELETE' }); await w2rulesLoad(true); w2rulesRender(); d.classList.remove('show'); }
      catch(err){ $c('w2-msg').textContent = 'Delete failed: ' + err.message; }
    });
    trigUi();
  }
  async function w2sentRender(){
    var el = $c('w2-sent'); if (!el) return;
    try { w2.log = await w2logLoad(); } catch(_){ w2.log = []; }
    w2rulesRender();
    if (!w2.log.length){ el.innerHTML = '<p class="w2-mu">Nothing sent yet. Automations send within 15 minutes of their moment, so this fills in as your clients get going.</p>'; return; }
    el.innerHTML = w2.log.map(function(l){
      var c = roster.filter(function(x){ return (x.member_email || '').toLowerCase() === (l.member_email || '').toLowerCase(); })[0];
      var who = c ? nameOf(c) : l.member_email;
      var lbl = l.rule_name === 'alert' ? 'Alert to you' : (l.rule_name || 'Automation');
      return '<div class="w2-log"><span>' + new Date(l.sent_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</span><span><b>' + esc(lbl) + '</b> \u2014 ' + esc(who) + '</span><span class="w2-sent">' + esc(l.channel === 'message' ? 'in-app' : l.channel === 'both' ? 'in-app + email' : l.channel === 'coach' ? 'to you' : l.channel || '') + '</span></div>';
    }).join('');
  }
  (function w2wrapAutoLoad(){
    var legacy = autoLoad;
    autoLoad = async function(){
      if (!partnerId) return legacy();
      w2autosShell();
      w2tab(w2.tab || 'journey');
      try { await w2rulesLoad(); } catch(e){ var el = $c('w2-rules'); if (el) el.innerHTML = '<p class="w2-mu">Couldn\u2019t load automations \u2014 ' + esc(e.message) + '</p>'; }
      w2rulesRender();
      try { w2.log = await w2logLoad(); w2rulesRender(); } catch(_){}
      return legacy();
    };
  })();

  /* ── Messages: schedule for later (#69) ── */
  function msgBubble(m){ // W2 SHADOW — adds the scheduled chip + cancel on future rows
    var mine = m.sender === 'coach';
    var future = m.deliver_at && Date.parse(m.deliver_at) > Date.now();
    var when = future ? '' : new Date(m.created_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    var meta = future
      ? '<span class="w2-clock">\u23F1 Scheduled ' + new Date(m.deliver_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '<a data-w2cancel="' + m.id + '">Cancel</a></span>'
      : when;
    return '<div style="display:flex;flex-direction:column;align-items:' + (mine ? 'flex-end' : 'flex-start') + ';">' +
      '<div style="max-width:78%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;' +
      (future ? 'border:1px dashed #C9A84C;color:var(--text);border-bottom-right-radius:4px;' : mine ? 'background:#1B7878;color:#fff;border-bottom-right-radius:4px;' : 'background:var(--surface-2);border:1px solid var(--border);border-bottom-left-radius:4px;') + '">' + esc(m.body) + '</div>' +
      '<div style="font-size:10.5px;color:var(--text-muted);margin:3px 4px 0;">' + meta + '</div></div>';
  }
  async function msgOpen(email){ // W2 SHADOW — selects deliver_at
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
      msgRows = await rest('/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(email) + '&order=created_at.asc&limit=200&select=id,sender,body,created_at,read_at,deliver_at') || [];
      if (msgRows.length) msgLastId = msgRows[msgRows.length - 1].created_at;
      msgRender();
      msgMarkRead(email);
    } catch(e){ $c('msg-list').innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;margin:auto;">Couldn\u2019t load messages \u2014 ' + esc(e.message) + '</div>'; }
  }
  async function msgPoll(){ // W2 SHADOW — selects deliver_at; delivered scheduled rows re-sort by their new created_at
    if (!msgThread) return;
    try {
      var q = '/coach_messages?' + pscope() + '&member_email=eq.' + encodeURIComponent(msgThread) + '&order=created_at.asc&limit=50&select=id,sender,body,created_at,read_at,deliver_at' + (msgLastId ? '&created_at=gt.' + encodeURIComponent(msgLastId) : '');
      var fresh = await rest(q) || [];
      if (fresh.length){
        var seen = {}; msgRows.forEach(function(m){ seen[m.id] = m; });
        fresh.forEach(function(m){ if (seen[m.id]) Object.assign(seen[m.id], m); else msgRows.push(m); });
        msgRows.sort(function(a, b){ return a.created_at < b.created_at ? -1 : 1; });
        msgLastId = msgRows[msgRows.length - 1].created_at;
        msgRender(); msgMarkRead(msgThread);
      }
    } catch(_){}
  }
  (function w2schedUi(){
    var comp = $c('msg-compose'); if (!comp) return;
    comp.style.position = 'relative';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.id = 'w2-sched-btn'; btn.title = 'Send later'; btn.textContent = '\u23F1'; btn.style.cssText = 'font-size:13px;padding:7px 10px;';
    comp.appendChild(btn);
    var pop = document.createElement('div'); pop.className = 'w2-sched-pop'; pop.id = 'w2-sched-pop';
    pop.innerHTML = '<div style="font-size:12.5px;font-weight:600;margin-bottom:8px;">Send later</div><div class="w2-chips" style="margin-bottom:8px;"><button type="button" class="w2-chip" data-q="tomorrow9">Tomorrow 09:00</button><button type="button" class="w2-chip" data-q="sun8">Sunday 08:00</button><button type="button" class="w2-chip" data-q="mon7">Monday 07:00</button></div>' +
      '<div class="w2-row"><div><label class="w2-mu">Date</label><input type="date" id="w2-sd"/></div><div><label class="w2-mu">Time</label><input type="time" id="w2-st" value="09:00"/></div></div>' +
      '<button class="btn btn-primary" type="button" id="w2-sched-go" style="width:100%;margin-top:10px;font-size:12.5px;">Schedule</button><p class="w2-note" id="w2-sched-msg"></p>';
    comp.appendChild(pop);
    function pad(n){ return (n < 10 ? '0' : '') + n; }
    function setDT(d){ $c('w2-sd').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); $c('w2-st').value = pad(d.getHours()) + ':' + pad(d.getMinutes()); }
    btn.addEventListener('click', function(){ var on = pop.classList.toggle('show'); if (on && !$c('w2-sd').value){ var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); setDT(d); } });
    pop.querySelectorAll('.w2-chip').forEach(function(ch){ ch.addEventListener('click', function(){
      var d = new Date(); d.setSeconds(0, 0);
      if (ch.dataset.q === 'tomorrow9'){ d.setDate(d.getDate() + 1); d.setHours(9, 0); }
      else { var want = ch.dataset.q === 'sun8' ? 0 : 1; var add = (want - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + add); d.setHours(ch.dataset.q === 'sun8' ? 8 : 7, 0); }
      setDT(d);
    }); });
    $c('w2-sched-go').addEventListener('click', async function(){
      var inp = $c('msg-input'), body = inp.value.trim(), msg = $c('w2-sched-msg');
      if (!body || !msgThread){ msg.textContent = 'Write the message first.'; return; }
      var when = new Date($c('w2-sd').value + 'T' + ($c('w2-st').value || '09:00'));
      if (isNaN(when.getTime()) || when.getTime() < Date.now() + 5 * 60e3){ msg.textContent = 'Pick a time at least 5 minutes from now.'; return; }
      msg.textContent = 'Scheduling\u2026';
      try {
        var rows = await rest('/coach_messages?select=id,sender,body,created_at,deliver_at', { method: 'POST', body: { partner_id: partnerId, member_email: msgThread, sender: 'coach', body: body, deliver_at: when.toISOString() } });
        var row = (rows && rows[0]) || { id: 'tmp-' + Date.now(), sender: 'coach', body: body, created_at: new Date().toISOString(), deliver_at: when.toISOString() };
        msgRows.push(row); msgLastId = msgRows[msgRows.length - 1].created_at; msgRender();
        inp.value = ''; inp.style.height = ''; msg.textContent = ''; pop.classList.remove('show');
      } catch(e){ msg.textContent = 'Couldn\u2019t schedule \u2014 ' + e.message; }
    });
    document.addEventListener('click', async function(ev){
      var a = ev.target.closest && ev.target.closest('[data-w2cancel]');
      if (!a) return;
      var id = a.dataset.w2cancel;
      if (!confirm('Cancel this scheduled message?')) return;
      try { await rest('/coach_messages?id=eq.' + id + '&' + pscope(), { method: 'DELETE' }); msgRows = msgRows.filter(function(m){ return m.id !== id; }); msgRender(); }
      catch(e){ alert('Couldn\u2019t cancel \u2014 ' + e.message); }
    });
  })();

  /* ── Client Overview: health app, alerts, automations sent (#102/#103) ── */
  (function w2wrapOverview(){
    var legacy = w5Overview;
    w5Overview = async function(){
      await legacy();
      if (w5.tab !== 'overview' || !partnerId || !w5.c || w5.c.status !== 'active') return;
      var pane = $c('w5-pane'); if (!pane) return;
      var c = w5.c, em = c.member_email;
      var wrap = document.createElement('div'); wrap.id = 'w2-ov';
      wrap.innerHTML = '<div class="w2-two"><div class="w2-card" id="w2-ov-health"><h3>Health app</h3><p class="w2-mu">Checking\u2026</p></div><div class="w2-card" id="w2-ov-alerts"><h3>Alerts for this client</h3></div></div><div class="w2-card" id="w2-ov-sent"><h3>Automations sent</h3><p class="w2-mu">Loading\u2026</p></div>';
      pane.appendChild(wrap);
      // alerts editor
      var al = (c.assignments && c.assignments.alerts) || {};
      var alEl = $c('w2-ov-alerts');
      alEl.innerHTML = '<h3>Alerts for this client</h3>' +
        '<div class="w2-al"><div class="w2-tog' + (al.calorie_pct ? ' on' : '') + '" id="w2-al-cal"></div><span>Tell me when a day\u2019s calories pass</span><input type="number" id="w2-al-pct" min="50" max="300" value="' + (al.calorie_pct || 120) + '"/><span class="w2-mu">% of their target</span></div>' +
        '<div class="w2-al"><div class="w2-tog' + (al.every_meal ? ' on' : '') + '" id="w2-al-meal"></div><span>Tell me every time they log a meal</span><span class="w2-mu" style="margin-left:auto;">grouped, at most one every 15 min</span></div>' +
        '<p class="w2-note" id="w2-al-msg">Alerts follow your notification preferences (Settings) \u2014 email, push or both.</p>';
      async function saveAlerts(){
        var msg = $c('w2-al-msg'); msg.textContent = 'Saving\u2026';
        var calOn = $c('w2-al-cal').classList.contains('on'), mealOn = $c('w2-al-meal').classList.contains('on');
        var pct = Math.max(50, Math.min(300, parseInt($c('w2-al-pct').value) || 120));
        var payload = (calOn || mealOn) ? { calorie_pct: calOn ? pct : null, every_meal: mealOn } : null;
        try {
          await ef({ action: 'update_assignments', email: em, merge_slots: true, assignments: { alerts: payload } });
          c.assignments = c.assignments || {}; if (payload) c.assignments.alerts = { calorie_pct: calOn ? pct : undefined, every_meal: mealOn || undefined }; else delete c.assignments.alerts;
          msg.textContent = 'Saved.';
        } catch(e){ msg.textContent = 'Save failed: ' + e.message; }
      }
      $c('w2-al-cal').addEventListener('click', function(){ this.classList.toggle('on'); saveAlerts(); });
      $c('w2-al-meal').addEventListener('click', function(){ this.classList.toggle('on'); saveAlerts(); });
      $c('w2-al-pct').addEventListener('change', function(){ if ($c('w2-al-cal').classList.contains('on')) saveAlerts(); });
      // health status
      try {
        var hs = await rest('/rpc/coach_client_health_status', { method: 'POST', body: { p_email: em } }) || { status: 'never' };
        var hEl = $c('w2-ov-health'); if (!hEl) return;
        var first = (nameOf(c) || 'They').split(' ')[0];
        var plat = hs.platform === 'apple_health' || hs.platform === 'healthkit' ? 'Apple Health' : hs.platform === 'health_connect' ? 'Health Connect' : (hs.platform || 'a health app');
        var line = hs.status === 'connected' ? '<span class="w2-dot ok"></span>Connected \u2014 ' + esc(plat) + (hs.last_sync_at ? ', last sync ' + new Date(hs.last_sync_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')
          : hs.status === 'revoked' ? '<span class="w2-dot rv"></span>Disconnected' + (hs.revoked_at ? ' on ' + new Date(hs.revoked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '') + ' \u2014 was ' + esc(plat)
          : '<span class="w2-dot no"></span>Not connected';
        var sub = hs.status === 'connected' ? 'Steps, sleep and workouts arrive on their own.' : first + ' hasn\u2019t linked Apple Health or Health Connect, so steps, sleep and workouts only arrive when logged by hand.';
        hEl.innerHTML = '<h3>Health app</h3><div style="font-size:13px;margin-bottom:8px;">' + line + '</div><p class="w2-mu" style="margin-bottom:10px;">' + sub + '</p>' +
          (hs.status !== 'connected' ? '<button class="btn btn-primary" type="button" id="w2-ask-health" style="font-size:12px;">Ask them to ' + (hs.status === 'revoked' ? 'reconnect' : 'connect') + '</button><p class="w2-note">Sends your \u201cConnect Apple Health / Health Connect\u201d message now, as an in-app message.</p>' : '');
        var ask = $c('w2-ask-health');
        if (ask) ask.addEventListener('click', async function(){
          ask.disabled = true; ask.textContent = 'Sending\u2026';
          try {
            var rules = await w2rulesLoad();
            var r = rules.filter(function(x){ return x.key === 'health'; })[0] || { body: W2_STOCK.health.body, name: 'Connect Apple Health / Health Connect' };
            var vars = { first_name: first, coach_name: (typeof w7Acct !== 'undefined' && w7Acct && w7Acct.name) || 'Your coach', days: '' };
            var rows = await rest('/coach_messages?select=id', { method: 'POST', body: { partner_id: partnerId, member_email: em, sender: 'coach', body: w2fill(r.body, vars) } });
            try { await rest('/coach_auto_message_log', { method: 'POST', body: { partner_id: partnerId, member_email: em, rule_id: r.id || null, rule_name: r.name, channel: 'message', dedupe_key: 'auto:' + (r.id || 'health') + ':' + em + ':manual:' + Date.now(), message_id: rows && rows[0] ? rows[0].id : null } }); } catch(_){}
            ask.textContent = 'Sent \u2014 see Messages';
          } catch(e){ ask.disabled = false; ask.textContent = 'Ask them to connect'; alert('Couldn\u2019t send \u2014 ' + e.message); }
        });
      } catch(e){ var hEl2 = $c('w2-ov-health'); if (hEl2) hEl2.innerHTML = '<h3>Health app</h3><p class="w2-mu">Not available \u2014 ' + esc(e.message) + '</p>'; }
      // automations sent to this client
      try {
        var log = await w2logLoad(em);
        var sEl = $c('w2-ov-sent'); if (!sEl) return;
        sEl.innerHTML = '<h3>Automations sent</h3>' + (log.length ? log.slice(0, 20).map(function(l){
          return '<div class="w2-log"><span>' + new Date(l.sent_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</span><span><b>' + esc(l.rule_name === 'alert' ? 'Alert to you' : (l.rule_name || 'Automation')) + '</b></span><span class="w2-sent">' + esc(l.channel === 'message' ? 'in-app' : l.channel === 'both' ? 'in-app + email' : l.channel === 'coach' ? 'to you' : l.channel || '') + '</span></div>';
        }).join('') : '<p class="w2-mu">Nothing yet \u2014 automations land here as they send. Manual and scheduled messages live in the thread.</p>');
      } catch(_){}
    };
  })();

  /* ── Add-client wizard: up to four welcome attachments (#97) ── */
  function wzAssignSpec(){ // W2 SHADOW — legacy body + welcome_attachments[]
    var spec = {};
    function pick(id, slot){ var el = $c(id); if (el && el.value) spec[slot] = el.value; }
    pick('wza-workout', 'workout'); pick('wza-habits', 'habits'); pick('wza-nutrition', 'nutrition');
    pick('wza-supplements', 'supplements'); pick('wza-onboarding', 'onboarding'); pick('wza-checkin', 'checkin');
    if ($c('wzf-ciday').value !== '') spec.checkin_day = parseInt($c('wzf-ciday').value);
    spec.checkin_frequency = $c('wzf-cifreq').value;
    if ($c('wzf-phone').value.trim()) spec.phone = $c('wzf-phone').value.trim();
    spec.weight_unit = $c('wzf-wu').value;
    if (wzPackPath) spec.welcome_pack_path = wzPackPath;
    spec.welcome_attachments = w2.wzAtt.slice(0, 4);
    return spec;
  }
  (function w2wizard(){
    var old = $c('wzf-pack'); if (!old) return;
    var inp = old.cloneNode(false); // drops the legacy single-PDF listener
    inp.multiple = true; inp.accept = 'application/pdf,image/*'; inp.id = 'wzf-pack';
    old.parentNode.replaceChild(inp, old);
    var list = document.createElement('div'); list.id = 'w2-wz-att'; list.style.marginTop = '8px';
    inp.parentNode.insertBefore(list, inp.nextSibling);
    var status = $c('wzf-pack-status');
    function paint(){
      list.innerHTML = w2.wzAtt.map(function(p, i){ return '<div class="w2-att">\uD83D\uDCC4 <span>' + esc(p.split('/').pop().replace(/^att-\d+-/, '').replace(/^pack-\d+-/, '')) + '</span><button type="button" class="x" data-i="' + i + '" title="Remove">\u2715</button></div>'; }).join('') +
        '<p class="w2-note">' + w2.wzAtt.length + ' of 4 attached \u00b7 PDF or image, 15 MB each. Links in the welcome email work for 7 days.</p>';
      list.querySelectorAll('[data-i]').forEach(function(b){ b.addEventListener('click', function(){ w2.wzAtt.splice(parseInt(b.dataset.i), 1); paint(); }); });
    }
    inp.addEventListener('change', async function(){
      var files = Array.prototype.slice.call(this.files || []);
      if (!files.length) return;
      for (var i = 0; i < files.length; i++){
        var f = files[i];
        if (w2.wzAtt.length >= 4){ status.textContent = 'Four attachments is the limit.'; break; }
        if (!(f.type === 'application/pdf' || /^image\//.test(f.type))){ status.textContent = f.name + ': PDF or image only.'; continue; }
        if (f.size > 15 * 1024 * 1024){ status.textContent = f.name + ': too big \u2014 15MB max.'; continue; }
        status.textContent = 'Uploading ' + f.name + '\u2026';
        try {
          var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
          var path = pprefix() + '/att-' + Date.now() + '-' + safe;
          var up = await sb().storage.from('coach-content').upload(path, f, { contentType: f.type, upsert: true });
          if (up.error) throw up.error;
          w2.wzAtt.push(path); status.textContent = f.name + ' \u00b7 uploaded.';
        } catch(e){ status.textContent = 'Upload failed: ' + (e.message || e); }
      }
      this.value = ''; paint();
    });
    var legacyOpen = wzOpen;
    wzOpen = function(editRow){
      legacyOpen(editRow);
      var meta = (editRow && editRow.assignments && editRow.assignments._meta) || {};
      w2.wzAtt = Array.isArray(meta.welcome_attachments) ? meta.welcome_attachments.slice(0, 4) : [];
      w2.wzAttStart = JSON.stringify(w2.wzAtt);
      paint();
    };
    var legacyPaint = wzPaint;
    wzPaint = function(){
      legacyPaint();
      var rv = $c('wz-review'); if (rv && wzStep === 4 && w2.wzAtt.length) rv.insertAdjacentHTML('beforeend', '<div class="w2-mu" style="margin-top:6px;">Attachments: ' + w2.wzAtt.length + ' file' + (w2.wzAtt.length === 1 ? '' : 's') + '</div>');
    };
    // edit path: the legacy submit handler only forwards a fixed key list, so attachments ride their own merge-safe call
    var sub = $c('wz-submit');
    if (sub) sub.addEventListener('click', function(){
      if (!wzEditing || JSON.stringify(w2.wzAtt) === w2.wzAttStart) return;
      var em = $c('wzf-email').value.trim().toLowerCase();
      ef({ action: 'update_assignments', email: em, merge_slots: true, assignments: { welcome_attachments: w2.wzAtt.slice(0, 4) } }).catch(function(){});
    }, true);
  })();

  /* ── Roster: Lapsed pill (#83) via the initials→badge row context ── */
  function initials(c){ // W2 SHADOW — legacy body + row context for badge()
    w2.badgeCtx = c;
    var n = nameOf(c) || c.member_email || '?';
    var p = n.trim().split(/\s+/);
    return ((p[0] ? p[0][0] : '') + (p[1] ? p[1][0] : '')).toUpperCase() || '?';
  }
  function badge(st){ // W2 SHADOW — Lapsed for active clients whose VYVE membership has lapsed
    var ctx = w2.badgeCtx;
    if (st === 'active' && ctx && ctx.lapsed_at) return '<span class="w2-pill-lapsed" title="VYVE membership lapsed ' + new Date(ctx.lapsed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' \u2014 coaching paused until they rejoin">Lapsed</span>';
    var map = { invited: ['Invited','#C9A84C'], active: ['Active','#22c55e'], archived: ['Archived','#94a3b8'] };
    var m = map[st] || [st,'#94a3b8'];
    return '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.5px;color:#fff;background:' + m[1] + ';">' + m[0] + '</span>';
  }

  /* ── Settings › Notifications: two new rows the sweep consults ── */
  (function w2notifyRows(){
    if (typeof W7_EVENT_LABELS !== 'undefined'){
      W7_EVENT_LABELS.push(['lapsed', 'A client\u2019s VYVE membership lapses (coaching pauses)']);
      W7_EVENT_LABELS.push(['alert', 'A client trips one of your per-client alerts (calories / meals)']);
    }
    if (typeof W7_NOTIFY_DEFAULTS !== 'undefined'){ W7_NOTIFY_DEFAULTS.lapsed = { email: true, push: true }; W7_NOTIFY_DEFAULTS.alert = { email: true, push: true }; }
  })();


