  /* ============================ PM-1075 Trainerize W1 ============================
     Roster + Insights over the W0 `coach_client_weekly` snapshot (#62 insights strip, #63 auto-tagged
     segments + #98 thresholds page, #65 widened activity feed, #78 lead Convert, #79 booking clients,
     #80 roster column views, #82 multi-select bulk actions, #84 programme Subscribers panel).
     One coach-JWT call to coach-weekly-snapshot {weeks:12} per dashboard open (10-min cache), REST
     fallback on the table. Thresholds live in partner_partners.coach_ui_prefs.auto_tags (§23.237 —
     never coach_notification_prefs, whose save_notify_prefs whitelist would strip them). Zero EF
     changes; one migration (coach_leads.converted_client_id + 'converted' status).
     Wraps by binding reassignment: renderDashboard / loadClients / w7SettingsPane / notifLoad.
     Shadows by same-scope redeclaration: clFiltered (W4b body + segment facet), leadsLoad, nfRender.
     Segment/selection sends ride the legacy broadcast panel via a document-capture intercept on
     #bc-send. Everything is hidden at VYVE null scope. */
  var w1 = { snap: null, snapAt: 0, byEmail: {}, weeks: [], loading: null, wpc: {}, wpcAt: 0, goals: {}, goalsAt: 0,
    bookings: null, view: 'summary', sel: {}, segFilter: [], bcTargets: null, bcLabel: '', convertLead: null, convertAt: 0, subs: null };
  var W1_DEFAULTS = { compliance_low: 50, compliance_high: 85, nutrition_low: 2, nutrition_high: 5, inactive_days: 7, not_messaged_days: 7, not_responded_days: 7, checkin_overdue_days: 2, soon_days: 7 };
  var W1_TAGS = [
    { k: 'low_compliance', label: 'Low compliance', cls: 'warn' },
    { k: 'inactive', label: 'Inactive', cls: 'warn' },
    { k: 'checkin_overdue', label: 'Check-in overdue', cls: 'warn' },
    { k: 'not_responded', label: 'Not responded', cls: 'warn' },
    { k: 'nutrition_low', label: 'Low nutrition', cls: 'warn' },
    { k: 'not_messaged', label: 'Not messaged', cls: '' },
    { k: 'trial_ending', label: 'Trial ending', cls: '' },
    { k: 'goal_due', label: 'Goal due', cls: '' },
    { k: 'new_this_week', label: 'New this week', cls: '' },
    { k: 'nutrition_good', label: 'Good nutrition', cls: 'good' },
    { k: 'high_compliance', label: 'High compliance', cls: 'good' }
  ];
  var W1_VIEWS = [['summary','Summary'],['exercise','Exercise'],['nutrition','Nutrition'],['weight','Weight'],['engagement','Engagement']];
  var W1_SLOTS = ['workout_template_id','habits_template_id','nutrition_template_id','supplements_template_id','onboarding_form_id','checkin_form_id'];
  (function w1css(){
    var s = document.createElement('style'); s.id = 'w1-css';
    s.textContent = [
      '.w1-ins{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:0 0 16px;}',
      '.w1-ins .c{border:1px solid var(--border);border-radius:10px;padding:11px 13px;background:var(--surface-2);}',
      '.w1-ins .k{font-size:12px;color:var(--text-muted);}',
      '.w1-ins .v{font-size:22px;font-weight:700;line-height:1.2;margin:2px 0 6px;color:var(--text);}',
      '.w1-ins .v small{font-size:12px;font-weight:600;margin-left:6px;}',
      '.w1-ins svg{width:100%;height:46px;display:block;}',
      '.w1-ins .d{font-size:11px;color:var(--text-muted);margin-top:4px;}',
      '.w1-up{color:#3DB89F;}.w1-dn{color:#E8834A;}',
      '.w1-sec{font-size:13px;color:var(--text-muted);font-weight:600;margin:4px 0 8px;}',
      '.w1-seg{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:16px;}',
      '.w1-stag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;border-radius:99px;padding:3px 10px;border:1px solid rgba(77,170,170,.5);color:var(--teal-lt);background:rgba(27,120,120,.10);white-space:nowrap;font-family:inherit;line-height:1.5;cursor:default;}',
      '.w1-stag b{font-weight:700;opacity:.75;}',
      '.w1-stag.warn{border-color:rgba(232,131,74,.5);color:#E8834A;background:rgba(232,131,74,.10);}',
      '.w1-stag.good{border-color:rgba(61,184,159,.5);color:#3DB89F;background:rgba(61,184,159,.10);}',
      '.w1-stag.f{cursor:pointer;}',
      '.w1-stag.f.on{background:var(--vyve-teal);color:#fff;border-color:var(--vyve-teal);}',
      '.w1-stag.warn.f.on{background:#E8834A;color:#0D2B2B;border-color:#E8834A;}',
      '.w1-stag.good.f.on{background:#3DB89F;color:#0D2B2B;border-color:#3DB89F;}',
      '.w1-stag.sm{font-size:10.5px;padding:1px 8px;}',
      '.w1-tagrow{display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-top:4px;}',
      '.w1-segbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:12px;padding:8px 10px;border:1px dashed var(--border);border-radius:10px;}',
      '.w1-lab{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-muted);margin-right:4px;}',
      '.w1-views{display:flex;gap:3px;border:1px solid var(--border);border-radius:9px;padding:3px;}',
      '.w1-views button{border:0;background:none;color:var(--text-muted);font:inherit;font-size:12px;padding:4px 10px;border-radius:7px;cursor:pointer;}',
      '.w1-views button.on{background:var(--surface-2);color:var(--text);font-weight:600;}',
      '.w1-strip{border:1px solid var(--border);border-radius:10px;padding:10px 14px;background:var(--surface-2);margin-bottom:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13px;}',
      '.w1-cb{accent-color:var(--vyve-teal);width:15px;height:15px;cursor:pointer;}',
      '.w1-gcb{position:absolute;top:10px;right:10px;}',
      '.cl-gcard{position:relative;}',
      'tr.w1-on td{background:rgba(27,120,120,.08);}',
      '.w1-bulk{position:sticky;bottom:12px;display:none;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--vyve-teal);border-radius:12px;padding:10px 14px;box-shadow:0 10px 30px rgba(0,0,0,.35);margin-top:12px;font-size:13px;z-index:5;}',
      '.w1-bulk.show{display:flex;flex-wrap:wrap;}',
      '.w1-pct{display:inline-block;min-width:38px;text-align:right;font-weight:600;}',
      '.w1-bar{display:inline-block;width:64px;height:6px;border-radius:99px;background:var(--border);vertical-align:middle;margin-left:6px;overflow:hidden;}',
      '.w1-bar i{display:block;height:100%;background:var(--vyve-teal);}',
      '.w1-bar.lo i{background:#E8834A;}.w1-bar.hi i{background:#3DB89F;}',
      '.w1-dots{display:inline-flex;gap:3px;vertical-align:middle;margin-right:5px;}.w1-dots i{width:8px;height:8px;border-radius:50%;background:var(--border);}.w1-dots i.y{background:#3DB89F;}',
      '.w1-mu{color:var(--text-muted);font-size:11.5px;}',
      '.w1-f{display:grid;grid-template-columns:1fr 110px;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px;}',
      '.w1-f .h{font-size:11.5px;color:var(--text-muted);}',
      '.w1-f input{padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font:inherit;font-size:13px;width:100%;}',
      '.w1-chips{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0;}',
      '.w1-chips label{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:2px 9px 2px 6px;cursor:pointer;}',
      '.w1-lead-cv{border-left:3px solid #3DB89F !important;}',
      '.w1-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:80;padding:16px;}',
      '.w1-modal.show{display:flex;}',
      '.w1-modal .in{width:min(600px,96vw);background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 20px;max-height:84vh;overflow:auto;}',
      '.w1-modal .hd{display:flex;align-items:center;gap:10px;margin-bottom:12px;}'
    ].join('');
    document.head.appendChild(s);
  })();

  /* ── week helpers ── */
  function w1monday(d){ var x = new Date(d.getTime()); var dow = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - dow); x.setUTCHours(0, 0, 0, 0); return x; }
  function w1iso(d){ return d.toISOString().slice(0, 10); }
  function w1thisMon(){ return w1iso(w1monday(new Date())); }
  function w1lastMon(){ var m = w1monday(new Date()); m.setUTCDate(m.getUTCDate() - 7); return w1iso(m); }
  function w1days(ts){ return ts ? (Date.now() - new Date(ts).getTime()) / 864e5 : null; }
  function w1thr(){ return Object.assign({}, W1_DEFAULTS, (w0 && w0.prefs && w0.prefs.auto_tags) || {}); }
  function w1lc(e){ return String(e || '').toLowerCase(); }

  /* ── snapshot: one coach-JWT call to the W0 EF (12 weeks), REST fallback, 10-min cache ── */
  async function w1snapLoad(force){
    if (!partnerId) return [];
    if (w1.snap && !force && Date.now() - w1.snapAt < 10 * 60e3) return w1.snap;
    if (w1.loading && !force) return w1.loading;
    w1.loading = (async function(){
      var rows = null;
      try {
        var t = await jwt();
        var r = await fetch(SUPA_URL + '/functions/v1/coach-weekly-snapshot', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ weeks: 12 }) });
        var j = await r.json().catch(function(){ return {}; });
        if (r.ok && Array.isArray(j.data)) rows = j.data;
        else if (r.ok && j.rows === 0) rows = [];
      } catch(_){}
      if (!rows){ try { rows = await rest('/coach_client_weekly?' + pscope() + '&order=week_start.asc&limit=5000') || []; } catch(_){ rows = []; } }
      rows.sort(function(a, b){ return String(a.week_start).localeCompare(String(b.week_start)); });
      var by = {}, wk = {};
      rows.forEach(function(r){ var em = w1lc(r.member_email); (by[em] = by[em] || []).push(r); wk[r.week_start] = 1; });
      var weeks = Object.keys(wk).sort();
      if (!weeks.length){ var m = w1monday(new Date()); for (var i = 11; i >= 0; i--){ var d = new Date(m.getTime()); d.setUTCDate(d.getUTCDate() - 7 * i); weeks.push(w1iso(d)); } }
      w1.snap = rows; w1.byEmail = by; w1.weeks = weeks.slice(-12); w1.snapAt = Date.now(); w1.loading = null;
      return rows;
    })();
    return w1.loading;
  }
  async function w1wpcLoad(force){
    if (!partnerId) return w1.wpc;
    if (!force && Date.now() - w1.wpcAt < 10 * 60e3) return w1.wpc;
    var emails = roster.filter(function(c){ return c.status === 'active'; }).map(function(c){ return c.member_email; });
    w1.wpc = {};
    if (emails.length){
      try {
        var rows = await rest('/workout_plan_cache?member_email=in.(' + encodeURIComponent(emails.join(',')) + ')&is_active=eq.true&select=member_email,current_week,plan_duration_weeks,source,paused_at,programme_json->>programme_name,programme_json->>surface&order=generated_at.desc') || [];
        rows.forEach(function(r){
          var em = w1lc(r.member_email);
          if (r.surface && r.surface !== 'workouts') return;
          if (!w1.wpc[em] || (r.source === 'coach' && w1.wpc[em].source !== 'coach')) w1.wpc[em] = r;
        });
      } catch(_){}
    }
    w1.wpcAt = roster.length ? Date.now() : 0;
    return w1.wpc;
  }
  async function w1goalsLoad(force){
    if (!partnerId) return w1.goals;
    if (!force && Date.now() - w1.goalsAt < 10 * 60e3) return w1.goals;
    w1.goals = {};
    try {
      var rows = await rest('/coach_client_goals?' + pscope() + '&active=eq.true&achieved_at=is.null&target_date=not.is.null&select=member_email,title,target_date&order=target_date.asc&limit=1000') || [];
      rows.forEach(function(g){ var em = w1lc(g.member_email); if (!w1.goals[em]) w1.goals[em] = g; });
    } catch(_){}
    w1.goalsAt = Date.now();
    return w1.goals;
  }
  async function w1ensure(force){
    await Promise.all([w1snapLoad(force), w1wpcLoad(force), w1goalsLoad(force)]);
  }

  /* ── per-client numbers off the snapshot ── */
  function w1stat(c){
    var em = w1lc(c.member_email), rows = w1.byEmail[em] || [];
    var tm = w1thisMon(), lm = w1lastMon();
    var cur = null, last = null, complete = [];
    rows.forEach(function(r){ if (r.week_start === tm) cur = r; else { complete.push(r); if (r.week_start === lm) last = r; } });
    var last4 = complete.slice(-4);
    var cAgg = last4.filter(function(r){ return r.scheduled_count > 0 && r.compliance_pct != null; });
    var comp4 = cAgg.length ? Math.round(cAgg.reduce(function(a, r){ return a + r.compliance_pct; }, 0) / cAgg.length) : null;
    var act4 = last4.length ? Math.round(last4.reduce(function(a, r){ return a + (r.active_days || 0); }, 0) / last4.length * 10) / 10 : null;
    var wts = rows.filter(function(r){ return r.weight_kg != null; });
    var wLatest = wts.length ? wts[wts.length - 1] : null;
    var wAgo4 = null;
    if (wts.length){ var cut = w1.weeks[Math.max(0, w1.weeks.length - 5)]; for (var i = wts.length - 1; i >= 0; i--){ if (wts[i].week_start <= cut){ wAgo4 = wts[i]; break; } } }
    var wFirst = wts.length ? wts[0] : null;
    var latest = rows.length ? rows[rows.length - 1] : null;
    var nStreak = 0; for (var j = complete.length - 1; j >= 0; j--){ if ((complete[j].nutrition_logged_days || 0) >= 1) nStreak++; else break; }
    return { rows: rows, cur: cur, last: last, complete: complete, comp4: comp4, act4: act4, wLatest: wLatest, wAgo4: wAgo4, wFirst: wFirst,
      lastOut: latest ? latest.last_msg_out : null, lastIn: latest ? latest.last_msg_in : null, nStreak: nStreak };
  }
  function w1tagsOf(c){
    var t = w1thr(), out = [], em = w1lc(c.member_email), m = memberMap[em] || {}, a = c.assignments || {};
    if (c.status === 'archived') return out;
    if (c.created_at && w1days(c.created_at) <= t.soon_days) out.push('new_this_week');
    if (m.subscription_status === 'trial' && m.trial_ends_at){ var d = (new Date(m.trial_ends_at) - Date.now()) / 864e5; if (d >= 0 && d <= t.soon_days) out.push('trial_ending'); }
    if (c.status !== 'active') return out;
    var s = w1stat(c);
    if (s.last && s.last.scheduled_count > 0 && s.last.compliance_pct != null){
      if (s.last.compliance_pct < t.compliance_low) out.push('low_compliance');
      else if (s.last.compliance_pct >= t.compliance_high) out.push('high_compliance');
    }
    if (a.nutrition_template_id && s.last){
      if ((s.last.nutrition_logged_days || 0) < t.nutrition_low) out.push('nutrition_low');
      else if ((s.last.nutrition_logged_days || 0) >= t.nutrition_high) out.push('nutrition_good');
    }
    var la = w1days(m.last_active_at || c.consent_accepted_at);
    if (la != null && la >= t.inactive_days) out.push('inactive');
    if (s.rows.length){
      var dOut = w1days(s.lastOut);
      if (dOut == null || dOut >= t.not_messaged_days) out.push('not_messaged');
      if (s.lastOut && dOut >= t.not_responded_days && (!s.lastIn || s.lastIn < s.lastOut)) out.push('not_responded');
    }
    if (a.checkin_form_id){
      var period = a.checkin_frequency === 'fortnightly' ? 14 : a.checkin_frequency === 'monthly' ? 30 : 7;
      var lastCi = clExtra.lastCi[em] || null;
      var ref = w1days(lastCi || c.consent_accepted_at);
      if (ref != null && ref >= period + t.checkin_overdue_days) out.push('checkin_overdue');
    }
    var g = w1.goals[em];
    if (g && g.target_date){ var gd = (new Date(g.target_date + 'T00:00:00Z') - Date.now()) / 864e5; if (gd >= -0.5 && gd <= t.soon_days) out.push('goal_due'); }
    return out;
  }
  function w1segCounts(){
    var n = {};
    roster.forEach(function(c){ w1tagsOf(c).forEach(function(k){ n[k] = (n[k] || 0) + 1; }); });
    return n;
  }
  function w1tagMeta(k){ for (var i = 0; i < W1_TAGS.length; i++) if (W1_TAGS[i].k === k) return W1_TAGS[i]; return { k: k, label: k, cls: '' }; }
  function w1chip(k, opts){
    opts = opts || {};
    var m = w1tagMeta(k);
    return '<' + (opts.filter ? 'button type="button"' : 'span') + ' class="w1-stag ' + m.cls + (opts.filter ? ' f' : '') + (opts.on ? ' on' : '') + (opts.sm ? ' sm' : '') + '" data-w1k="' + esc(k) + '">' + esc(m.label) + (opts.n != null ? ' <b>' + opts.n + '</b>' : '') + '</' + (opts.filter ? 'button' : 'span') + '>';
  }

  /* ── dashboard: 12-week insights strip + needs-attention segments ── */
  function w1svgBars(vals, cur){
    var max = Math.max.apply(null, vals.map(function(v){ return v || 0; }).concat([1]));
    var n = vals.length, w = 220 / n, bw = Math.max(6, w - 4);
    return '<svg viewBox="0 0 220 46" preserveAspectRatio="none" aria-hidden="true">' + vals.map(function(v, i){
      var h = v == null ? 0 : Math.max(1, Math.round((v / max) * 42));
      return '<rect x="' + (i * w + 2).toFixed(1) + '" y="' + (46 - h) + '" width="' + bw.toFixed(1) + '" height="' + h + '" fill="' + (i === n - 1 && cur ? '#4DAAAA' : '#1B7878') + '" rx="1"/>';
    }).join('') + '</svg>';
  }
  function w1svgLine(vals, max, ref){
    var n = vals.length, w = 220 / Math.max(1, n - 1), pts = [];
    vals.forEach(function(v, i){ if (v == null) return; pts.push((i * w).toFixed(1) + ',' + (44 - Math.round((v / max) * 40)).toFixed(1)); });
    return '<svg viewBox="0 0 220 46" preserveAspectRatio="none" aria-hidden="true">' + (ref != null ? '<line x1="0" y1="' + (44 - Math.round((ref / max) * 40)) + '" x2="220" y2="' + (44 - Math.round((ref / max) * 40)) + '" stroke="#E8834A" stroke-dasharray="3 3" stroke-width="1"/>' : '') +
      (pts.length > 1 ? '<polyline fill="none" stroke="#4DAAAA" stroke-width="2" points="' + pts.join(' ') + '"/>' : pts.length === 1 ? '<circle cx="' + pts[0].split(',')[0] + '" cy="' + pts[0].split(',')[1] + '" r="3" fill="#4DAAAA"/>' : '') + '</svg>';
  }
  function w1series(){
    var weeks = w1.weeks, tm = w1thisMon();
    var byWeek = {}; (w1.snap || []).forEach(function(r){ (byWeek[r.week_start] = byWeek[r.week_start] || []).push(r); });
    function avg(arr, f){ var xs = arr.map(f).filter(function(x){ return x != null; }); return xs.length ? xs.reduce(function(a, b){ return a + b; }, 0) / xs.length : null; }
    var clients = [], act = [], wo = [], comp = [];
    weeks.forEach(function(ws){
      var we = new Date(ws + 'T00:00:00Z'); we.setUTCDate(we.getUTCDate() + 7);
      clients.push(roster.filter(function(c){ return c.status !== 'invited' && c.created_at && new Date(c.created_at) < we && !(c.status === 'archived' && c.archived_at && new Date(c.archived_at) < we); }).length);
      var rows = byWeek[ws] || [];
      act.push(rows.length ? avg(rows, function(r){ return r.active_days || 0; }) : null);
      wo.push(rows.length ? avg(rows, function(r){ return r.completed_count || 0; }) : null);
      comp.push(avg(rows.filter(function(r){ return r.scheduled_count > 0; }), function(r){ return r.compliance_pct; }));
    });
    var isCur = weeks[weeks.length - 1] === tm;
    return { weeks: weeks, clients: clients, act: act, wo: wo, comp: comp, isCur: isCur };
  }
  function w1fmt(v, dp){ return v == null ? '\u2014' : (Math.round(v * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0)).toString(); }
  function w1delta(arr, dp, suffix){
    var idx = arr.length - 1; if (w1series._cur) idx--;
    var a = arr[idx], b = arr[idx - 4];
    if (a == null || b == null) return '';
    var d = Math.round((a - b) * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0);
    if (!d) return '<small class="w1-mu">no change</small>';
    return '<small class="' + (d > 0 ? 'w1-up' : 'w1-dn') + '">' + (d > 0 ? '+' : '') + d + (suffix || '') + '</small>';
  }
  function w1insHtml(){
    var S = w1series(); w1series._cur = S.isCur;
    var t = w1thr();
    function latest(arr){ var i = arr.length - 1; if (S.isCur) i--; return arr[i]; }
    var activeNow = roster.filter(function(c){ return c.status === 'active'; }).length;
    return '<div class="w1-sec">Last 12 weeks</div><div class="w1-ins" id="w1-ins">' +
      '<div class="c"><div class="k">Active clients</div><div class="v">' + activeNow + ' ' + w1delta(S.clients, 0) + '</div>' + w1svgLine(S.clients, Math.max.apply(null, S.clients.concat([1])), null) + '<div class="d">' + (S.clients[0] || 0) + ' \u2192 ' + activeNow + ' since ' + new Date(S.weeks[0] + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</div></div>' +
      '<div class="c"><div class="k">Active days per client per week</div><div class="v">' + w1fmt(latest(S.act), 1) + ' ' + w1delta(S.act, 1) + '</div>' + w1svgBars(S.act, S.isCur) + '<div class="d">Days with any app activity \u00b7 last full week</div></div>' +
      '<div class="c"><div class="k">Workouts completed per client per week</div><div class="v">' + w1fmt(latest(S.wo), 1) + ' ' + w1delta(S.wo, 1) + '</div>' + w1svgBars(S.wo, S.isCur) + '<div class="d">Strength sessions \u00b7 cardio counted separately</div></div>' +
      '<div class="c"><div class="k">Workout compliance</div><div class="v">' + (latest(S.comp) == null ? '\u2014' : w1fmt(latest(S.comp), 0) + '%') + ' ' + w1delta(S.comp, 0, '') + '</div>' + w1svgLine(S.comp, 100, t.compliance_low) + '<div class="d">Done \u00f7 scheduled across clients with a programme \u00b7 dashed = your ' + t.compliance_low + '% line</div></div>' +
      '</div>';
  }
  function w1segChips(counts){
    return W1_TAGS.filter(function(x){ return counts[x.k]; }).map(function(x){ return w1chip(x.k, { filter: true, n: counts[x.k], on: w1.segFilter.indexOf(x.k) >= 0 }); }).join('');
  }
  function w1segHtml(counts){
    var chips = w1segChips(counts);
    return '<div class="w1-sec">Needs attention this week</div><div class="w1-seg">' + (chips ? chips + '<span class="w1-mu" style="margin-left:auto;">Lines set in Settings \u203a Auto tags</span>' : '<span class="w1-mu">Nothing flagged \u2014 every client is inside your lines.</span>') + '</div>';
  }
  async function w1dashRender(){
    var host = document.querySelector('#view-dashboard .card'); if (!host || !partnerId) return;
    var old = $c('w1-dash'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'w1-dash';
    box.innerHTML = '<div class="w1-sec">Last 12 weeks</div><div class="w1-ins"><div class="c"><div class="k">Loading your last 12 weeks\u2026</div></div></div>';
    var tiles = $c('dash-tiles');
    if (tiles && tiles.parentElement === host) host.insertBefore(box, tiles); else host.appendChild(box);
    if (!w0.prefs) await w0loadPrefs();
    await w1ensure();
    if (!$c('w1-dash')) return;
    box.innerHTML = w1insHtml() + w1segHtml(w1segCounts());
    box.querySelectorAll('.w1-stag.f').forEach(function(b){ b.addEventListener('click', function(){ w1.segFilter = [b.dataset.w1k]; clStatus = 'all'; clShown = CL_PAGE; go('clients'); document.querySelectorAll('.cl-st').forEach(function(x){ var on = x.dataset.st === 'all'; x.classList.toggle('active', on); x.classList.toggle('btn-primary', on); }); renderRoster(); w1segBarRender(); }); });
  }
  (function(){
    var _rd = renderDashboard;
    renderDashboard = async function(){ var r = await _rd.apply(this, arguments); try { await w1dashRender(); } catch(e){ console.warn('[w1] dashboard', e && e.message); } return r; };
  })();

  /* ── roster: segment facet (clFiltered SHADOW = W4b body + segments) ── */
  function clFiltered(){
    var q = clQ.toLowerCase();
    return roster.filter(function(c){
      if (clStatus !== 'all' && c.status !== clStatus) return false;
      if (w4bTagFilter.length){
        var mine = w4bTagsOf(c.member_email).map(w4bTagKey);
        if (!w4bTagFilter.some(function(k){ return mine.indexOf(k) >= 0; })) return false;
      }
      if (w1.segFilter.length){
        var sys = w1tagsOf(c);
        if (!w1.segFilter.some(function(k){ return sys.indexOf(k) >= 0; })) return false;
      }
      if (!q) return true;
      return (nameOf(c) + ' ' + c.member_email).toLowerCase().indexOf(q) >= 0;
    });
  }
  function w1segEmails(){
    return roster.filter(function(c){ if (c.status === 'archived') return false; var sys = w1tagsOf(c); return w1.segFilter.some(function(k){ return sys.indexOf(k) >= 0; }); }).map(function(c){ return c.member_email; });
  }
  function w1segBarRender(){
    var tb = $c('cl-toolbar'); if (!tb || !partnerId) return;
    var bar = $c('w1-segbar');
    if (!bar){
      bar = document.createElement('div'); bar.id = 'w1-segbar'; bar.className = 'w1-segbar';
      var w4 = $c('w4b-tagbar');
      if (w4) w4.insertAdjacentElement('beforebegin', bar); else tb.insertAdjacentElement('afterend', bar);
      bar.addEventListener('click', function(ev){
        var b = ev.target.closest('.w1-stag.f');
        if (b){
          var k = b.dataset.w1k, i = w1.segFilter.indexOf(k);
          if (i >= 0) w1.segFilter.splice(i, 1); else w1.segFilter.push(k);
          clShown = CL_PAGE; renderRoster(); w1segBarRender(); return;
        }
        if (ev.target.id === 'w1-seg-msg'){
          var ems = w1segEmails();
          if (ems.length) w1bcOpen(ems, w1.segFilter.map(function(k){ return w1tagMeta(k).label; }).join(' / '));
        }
      });
    }
    var counts = w1segCounts();
    var chips = w1segChips(counts);
    if (!chips){ bar.style.display = 'none'; return; }
    bar.style.display = '';
    var n = w1.segFilter.length ? w1segEmails().length : 0;
    bar.innerHTML = '<span class="w1-lab">Needs attention</span>' + chips +
      (n ? '<button class="btn" type="button" id="w1-seg-msg" style="margin-left:auto;font-size:12px;">Message these ' + n + '</button>' : '<span class="w1-mu" style="margin-left:auto;">Computed from each client\u2019s week \u2014 lines in Settings \u203a Auto tags.</span>');
  }
  /* ── roster: view switcher ── */
  function w1viewsMount(){
    var tb = $c('cl-toolbar'); if (!tb || $c('w1-views') || !partnerId) return;
    var v = document.createElement('div'); v.className = 'w1-views'; v.id = 'w1-views';
    v.innerHTML = W1_VIEWS.map(function(x){ return '<button type="button" data-w1v="' + x[0] + '" class="' + (w1.view === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('');
    var mode = $c('cl-mode');
    if (mode) tb.insertBefore(v, mode); else tb.appendChild(v);
    if (mode) mode.style.marginLeft = '0';
    v.style.marginLeft = 'auto';
    v.querySelectorAll('[data-w1v]').forEach(function(b){ b.addEventListener('click', function(){
      w1.view = b.dataset.w1v;
      v.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
      if (w1.view !== 'summary' && clMode() !== 'list'){ clSetMode('list'); var m = $c('cl-mode'); if (m) m.textContent = 'Grid view'; }
      renderRoster();
    }); });
  }
  /* ── roster: columns per view (rebuilds the middle cells of the legacy list table; avatar/name/actions cells kept) ── */
  function w1pctHtml(p){ if (p == null) return '<span class="w1-mu">\u2014</span>'; var t = w1thr(); var cls = p < t.compliance_low ? 'lo' : p >= t.compliance_high ? 'hi' : ''; return '<span class="w1-pct">' + p + '%</span><span class="w1-bar ' + cls + '"><i style="width:' + p + '%;"></i></span>'; }
  function w1rel(ts){ if (!ts) return '\u2014'; var d = Math.floor(w1days(ts)); return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d + 'd ago'; }
  function w1dots(n, max){ var h = '<span class="w1-dots">'; for (var i = 0; i < max; i++) h += '<i class="' + (i < n ? 'y' : '') + '"></i>'; return h + '</span>'; }
  function w1colsBase(c){ /* W5: shadowed by w1cols at the tail (Phase + Next phase columns) */
    var em = w1lc(c.member_email), s = w1stat(c), a = c.assignments || {}, wp = w1.wpc[em], m = memberMap[em] || {};
    var invited = c.status !== 'active';
    var dash = '<span class="w1-mu">\u2014</span>';
    var prog = wp ? esc(wp.programme_name || 'Programme') + '<div class="w1-mu">week ' + (wp.current_week || 1) + (wp.plan_duration_weeks ? ' of ' + wp.plan_duration_weeks : '') + (wp.paused_at ? ' \u00b7 paused' : '') + '</div>' : (a.workout_template_id ? '<span class="w1-mu">assigned \u00b7 not yet built</span>' : dash);
    if (w1.view === 'summary') return { heads: ['Programme', 'This week', 'Last week'], cells: [prog,
      invited || !s.cur ? dash : (s.cur.completed_count + ' / ' + s.cur.scheduled_count + (s.cur.cardio_count ? '<div class="w1-mu">+' + s.cur.cardio_count + ' cardio</div>' : '')),
      invited || !s.last ? dash : (s.last.completed_count + ' / ' + s.last.scheduled_count + (s.last.compliance_pct != null ? ' \u00b7 ' + s.last.compliance_pct + '%' : ''))], replace: false };
    if (w1.view === 'exercise') return { heads: ['Programme', 'Week', 'Scheduled (wk)', 'Done (wk)', 'Compliance (4 wk)', 'Cardio (wk)'], cells: [prog,
      wp ? (wp.current_week || 1) + (wp.plan_duration_weeks ? ' <span class="w1-mu">of ' + wp.plan_duration_weeks + '</span>' : '') : dash,
      s.cur ? String(s.cur.scheduled_count) : dash, s.cur ? String(s.cur.completed_count) : dash, invited ? dash : w1pctHtml(s.comp4), s.cur ? String(s.cur.cardio_count || 0) : dash], replace: true };
    if (w1.view === 'nutrition') return { heads: ['Nutrition plan', 'Target kcal', 'Logged days (last wk)', 'On-target days', 'Weeks logging'], cells: [
      a.nutrition_template_id ? esc((typeof w4bTplName === 'function' && w4bTplName(a.nutrition_template_id)) || 'Assigned') : dash,
      m.tdee_target ? String(m.tdee_target) : dash,
      s.last ? w1dots(s.last.nutrition_logged_days || 0, 7) + (s.last.nutrition_logged_days || 0) : dash,
      s.last ? String(s.last.nutrition_goal_days || 0) : dash, invited ? dash : String(s.nStreak)], replace: true };
    if (w1.view === 'weight'){
      var d4 = (s.wLatest && s.wAgo4 && s.wAgo4 !== s.wLatest) ? Math.round((s.wLatest.weight_kg - s.wAgo4.weight_kg) * 10) / 10 : null;
      var dS = (s.wLatest && s.wFirst && s.wFirst !== s.wLatest) ? Math.round((s.wLatest.weight_kg - s.wFirst.weight_kg) * 10) / 10 : null;
      function sg(x){ return x == null ? dash : '<span style="color:' + (x < 0 ? '#3DB89F' : x > 0 ? '#E8834A' : 'inherit') + ';font-weight:600;">' + (x > 0 ? '+' : '') + x + ' kg</span>'; }
      return { heads: ['Latest', '4 weeks', '12 weeks', 'Trend', 'Week logged'], cells: [s.wLatest ? '<b>' + s.wLatest.weight_kg + ' kg</b>' : (m.weight_kg ? m.weight_kg + ' kg <span class="w1-mu">(profile)</span>' : dash), sg(d4), sg(dS),
        d4 == null ? dash : (d4 < 0 ? '\u2193' : d4 > 0 ? '\u2191' : '\u2192'), s.wLatest ? 'w/c ' + new Date(s.wLatest.week_start + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : dash], replace: true };
    }
    return { heads: ['Active days / wk (4 wk)', 'Last message out', 'Last reply', 'Last check-in', 'Unread'], cells: [invited ? dash : (s.act4 == null ? dash : String(s.act4)),
      w1rel(s.lastOut), w1rel(s.lastIn), clExtra.lastCi[em] ? w1rel(clExtra.lastCi[em]) : dash, clExtra.unread[em] ? '<b style="color:#E8834A;">' + clExtra.unread[em] + '</b>' : dash], replace: true };
  }
  function w1decorateRoster(){
    var el = $c('cl-list'); if (!el || !partnerId) return;
    var tbl = el.querySelector('table.cl-tbl');
    var byEm = {}; roster.forEach(function(c){ byEm[w1lc(c.member_email)] = c; });
    if (tbl && !tbl.dataset.w1){
      tbl.dataset.w1 = '1';
      var hdr = tbl.querySelector('tr');
      if (hdr){
        var th = document.createElement('th'); th.style.width = '30px'; th.innerHTML = '<input type="checkbox" class="w1-cb" id="w1-all" title="Select all shown"/>'; hdr.insertBefore(th, hdr.firstChild);
        var probe = w1cols(roster[0] || { member_email: '', assignments: {} });
        if (probe.replace){ while (hdr.children.length > 4) hdr.removeChild(hdr.children[3]); }
        var ref = hdr.children[3];
        probe.heads.forEach(function(h){ var t = document.createElement('th'); t.textContent = h; hdr.insertBefore(t, ref); });
        th.querySelector('input').addEventListener('change', function(){ var on = this.checked; tbl.querySelectorAll('tr .w1-cb[data-em]').forEach(function(cb){ cb.checked = on; w1.sel[cb.dataset.em] = on; if (!on) delete w1.sel[cb.dataset.em]; cb.closest('tr').classList.toggle('w1-on', on); }); w1bulkRender(); });
      }
    }
    el.querySelectorAll('.cl-dd-btn[data-em]').forEach(function(b){
      var host = b.closest('tr') || b.closest('.cl-gcard'); if (!host || host.dataset.w1) return;
      host.dataset.w1 = '1';
      var em = w1lc(b.dataset.em), c = byEm[em]; if (!c) return;
      var nameCell = host.tagName === 'TR' ? host.children[1] : host.querySelector('div[style*="flex:1"]');
      var sys = w1tagsOf(c);
      if (sys.length && nameCell){
        var row = document.createElement('div'); row.className = 'w1-tagrow';
        row.innerHTML = sys.map(function(k){ return w1chip(k, { sm: true }); }).join('');
        var w4row = nameCell.querySelector('.w4b-tagrow');
        if (w4row) nameCell.insertBefore(row, w4row); else nameCell.appendChild(row);
      }
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'w1-cb' + (host.tagName === 'TR' ? '' : ' w1-gcb'); cb.dataset.em = c.member_email; cb.checked = !!w1.sel[c.member_email];
      cb.addEventListener('click', function(ev){ ev.stopPropagation(); });
      cb.addEventListener('change', function(){ if (cb.checked) w1.sel[c.member_email] = true; else delete w1.sel[c.member_email]; host.classList.toggle('w1-on', cb.checked); w1bulkRender(); });
      if (host.tagName === 'TR'){
        var td = document.createElement('td'); td.style.width = '30px'; td.appendChild(cb); host.insertBefore(td, host.firstChild);
        if (cb.checked) host.classList.add('w1-on');
        var cols = w1cols(c);
        if (cols.replace){ while (host.children.length > 4) host.removeChild(host.children[3]); }
        var ref = host.children[3];
        cols.cells.forEach(function(h){ var t = document.createElement('td'); t.innerHTML = h; host.insertBefore(t, ref); });
      } else host.appendChild(cb);
    });
    w1bulkRender();
  }
  (function w1rosterObserver(){
    var el = $c('cl-list'); if (!el) return;
    new MutationObserver(function(){
      if (!partnerId) return;
      w1viewsMount();
      if (!w1.snap){ w1ensure().then(function(){ w1decorateRoster(); w1segBarRender(); }); return; }
      w1decorateRoster(); w1segBarRender();
    }).observe(el, { childList: true });
  })();
  /* ── roster: multi-select bulk bar ── */
  function w1bulkRender(){
    var card = document.querySelector('#view-clients .card'); if (!card) return;
    var bar = $c('w1-bulk');
    if (!bar){
      bar = document.createElement('div'); bar.id = 'w1-bulk'; bar.className = 'w1-bulk';
      bar.innerHTML = '<b><span id="w1-bn">0</span> selected</b><button class="btn btn-primary" type="button" data-w1b="msg" style="font-size:12px;">Message</button><button class="btn" type="button" data-w1b="tag" style="font-size:12px;">Add tag\u2026</button><button class="btn" type="button" data-w1b="archive" style="font-size:12px;">Archive</button><span class="w1-mu" id="w1-bmsg"></span><button class="btn" type="button" data-w1b="clear" style="margin-left:auto;font-size:12px;">Clear</button>';
      card.appendChild(bar);
      bar.addEventListener('click', async function(ev){
        var b = ev.target.closest('[data-w1b]'); if (!b) return;
        var ems = Object.keys(w1.sel), msg = $c('w1-bmsg');
        if (b.dataset.w1b === 'clear'){ w1.sel = {}; renderRoster(); return; }
        if (!ems.length) return;
        if (b.dataset.w1b === 'msg'){ w1bcOpen(ems, ems.length + ' selected'); return; }
        if (b.dataset.w1b === 'tag'){
          var t = prompt('Tag to add to ' + ems.length + ' client' + (ems.length === 1 ? '' : 's') + ':'); if (!t || !(t = t.trim())) return;
          b.disabled = true; msg.textContent = 'Tagging\u2026';
          var ok = 0;
          for (var i = 0; i < ems.length; i++){
            try { var cur = w4bTagsOf(ems[i]); if (cur.map(w4bTagKey).indexOf(w4bTagKey(t)) < 0 && cur.length < 20){ await ef({ action: 'set_client_tags', email: ems[i], tags: cur.concat([t]) }); } ok++; } catch(_){}
          }
          await w4bTagsLoad(true); b.disabled = false; msg.textContent = 'Tagged ' + ok + '/' + ems.length;
          w1.sel = {}; renderRoster(); w4bTagBarRender(); return;
        }
        if (b.dataset.w1b === 'archive'){
          var arch = ems.filter(function(e){ var c = roster.find(function(x){ return x.member_email === e; }); return c && c.status !== 'archived'; });
          if (!arch.length){ msg.textContent = 'Nothing to archive.'; return; }
          if (!confirm('Archive ' + arch.length + ' client' + (arch.length === 1 ? '' : 's') + '? They keep their VYVE membership (and your \u00a35/month continues) \u2014 you just stop managing their training.')) return;
          b.disabled = true; msg.textContent = 'Archiving\u2026';
          for (var j = 0; j < arch.length; j++){ try { await ef({ action: 'archive', email: arch[j] }); } catch(_){} }
          b.disabled = false; w1.sel = {}; await loadClients();
        }
      });
    }
    var n = Object.keys(w1.sel).length;
    $c('w1-bn').textContent = String(n);
    bar.classList.toggle('show', n > 0);
  }

  /* ── booking clients (#79): people who booked a session with you but aren't coaching clients ── */
  async function w1bookingStrip(){
    var card = document.querySelector('#view-clients .card'); var tb = $c('cl-toolbar'); if (!card || !tb || !partnerId) return;
    var old = $c('w1-bookstrip'); if (old) old.remove();
    var rows = [];
    try { rows = await rest('/bookings?partner_id=eq.' + partnerId + '&member_email=not.is.null&status=in.(confirmed,completed)&select=member_email,starts_at&order=starts_at.desc&limit=500') || []; } catch(_){ rows = []; }
    var have = {}; roster.forEach(function(c){ have[w1lc(c.member_email)] = 1; });
    var seen = {}, list = [];
    rows.forEach(function(r){ var em = w1lc(r.member_email); if (!em || have[em] || seen[em]) return; seen[em] = 1; list.push({ email: r.member_email, last: r.starts_at }); });
    if (!list.length) return;
    var strip = document.createElement('div'); strip.id = 'w1-bookstrip'; strip.className = 'w1-strip';
    var MAX = 6;
    function paint(all){
      var show = all ? list : list.slice(0, MAX);
      strip.innerHTML = '<b>Booking clients \u00b7 ' + list.length + '</b><span class="w1-mu">Booked a session with you but aren\u2019t coaching clients yet.</span>' +
        '<span style="display:flex;gap:6px;flex-wrap:wrap;margin-left:auto;align-items:center;">' + show.map(function(x){ return '<span class="w1-stag" style="cursor:default;">' + esc(x.email) + ' <button class="btn" type="button" data-w1inv="' + esc(x.email) + '" style="font-size:10.5px;padding:1px 7px;">Invite to coaching</button></span>'; }).join('') +
        (!all && list.length > MAX ? '<button class="btn" type="button" id="w1-book-more" style="font-size:11px;">+' + (list.length - MAX) + ' more</button>' : '') + '</span>';
      strip.querySelectorAll('[data-w1inv]').forEach(function(b){ b.addEventListener('click', function(){ wzOpen(null); $c('wzf-email').value = b.dataset.w1inv; $c('wzf-first').focus(); }); });
      var more = $c('w1-book-more'); if (more) more.addEventListener('click', function(){ paint(true); });
    }
    paint(false);
    tb.insertAdjacentElement('beforebegin', strip);
  }
  (function(){
    var _lc = loadClients;
    loadClients = async function(){
      var r = await _lc.apply(this, arguments);
      try { await w1wpcLoad(true); if (partnerId && $c('cl-list') && $c('cl-list').children.length) renderRoster(); } catch(_){}
      try { if (partnerId) w1bookingStrip(); } catch(_){}
      try { await w1convertStamp(); } catch(e){ console.warn('[w1] convert stamp', e && e.message); }
      return r;
    };
  })();

  /* ── segment / selection sends ride the legacy broadcast panel (document-capture intercept on #bc-send) ── */
  function w1bcReset(){
    if (!w1.bcTargets) return;
    w1.bcTargets = null; w1.bcLabel = '';
    var p = $c('bc-panel'); if (!p) return;
    var h = p.querySelector('div'); if (h) h.textContent = 'Broadcast to every active client';
    var chips = $c('w1-bc-chips'); if (chips) chips.remove();
    var s = $c('bc-send'); if (s) s.textContent = 'Send to all active clients';
  }
  function w1bcPaint(){
    var p = $c('bc-panel'); if (!p || !w1.bcTargets) return;
    var h = p.querySelector('div'); if (h) h.textContent = 'Message ' + w1.bcTargets.length + ' client' + (w1.bcTargets.length === 1 ? '' : 's') + (w1.bcLabel ? ' \u00b7 ' + w1.bcLabel : '');
    var chips = $c('w1-bc-chips');
    if (!chips){ chips = document.createElement('div'); chips.id = 'w1-bc-chips'; chips.className = 'w1-chips'; $c('bc-text').insertAdjacentElement('beforebegin', chips); }
    chips.innerHTML = w1.bcTargets.map(function(em){ var c = roster.find(function(x){ return x.member_email === em; }) || { member_email: em }; return '<label><input type="checkbox" class="w1-cb" checked data-w1bc="' + esc(em) + '"/>' + esc(nameOf(c)) + '</label>'; }).join('') +
      '<span class="w1-mu" style="align-self:center;">Untick a name to leave them out.</span>';
    var s = $c('bc-send'); if (s) s.textContent = 'Send to these ' + w1.bcTargets.length;
    chips.querySelectorAll('[data-w1bc]').forEach(function(cb){ cb.addEventListener('change', function(){ var n = chips.querySelectorAll('[data-w1bc]:checked').length; var b = $c('bc-send'); if (b) b.textContent = 'Send to these ' + n; }); });
  }
  function w1bcOpen(emails, label){
    w1.bcTargets = emails.slice(); w1.bcLabel = label || '';
    go('messages');
    setTimeout(function(){
      var p = $c('bc-panel'); if (!p) return;
      p.style.display = ''; var nm = $c('nm-panel'); if (nm) nm.style.display = 'none';
      w1bcPaint(); $c('bc-text').focus();
    }, 250);
  }
  document.addEventListener('click', function(ev){
    if (!w1.bcTargets) return;
    var t = ev.target;
    if (t && t.id === 'msg-bcast'){ w1bcReset(); return; } // legacy toggle takes over untouched
    if (t && t.id === 'bc-cancel'){ w1bcReset(); return; }
    if (!t || t.id !== 'bc-send') return;
    ev.stopPropagation(); ev.preventDefault();
    (async function(){
      var body = $c('bc-text').value.trim(), msg = $c('bc-msg'), btn = $c('bc-send');
      var chips = $c('w1-bc-chips');
      var ems = chips ? Array.prototype.map.call(chips.querySelectorAll('[data-w1bc]:checked'), function(cb){ return cb.dataset.w1bc; }) : w1.bcTargets;
      if (!body){ msg.textContent = 'Write the message first.'; return; }
      if (!ems.length){ msg.textContent = 'Nobody ticked.'; return; }
      var actives = ems.filter(function(em){ var c = roster.find(function(x){ return x.member_email === em; }); return c && c.status === 'active'; });
      if (!actives.length){ msg.textContent = 'None of these clients are active yet \u2014 messages reach clients after they accept the invite.'; return; }
      if (!confirm('Send this to ' + actives.length + ' client' + (actives.length === 1 ? '' : 's') + '? Each gets it as a message from you in their app.')) return;
      btn.disabled = true; msg.textContent = 'Sending\u2026';
      var sent = 0;
      for (var i = 0; i < actives.length; i++){
        try { await rest('/coach_messages', { method: 'POST', body: { partner_id: partnerId, member_email: actives[i], sender: 'coach', body: body } }); sent++; msg.textContent = 'Sending\u2026 ' + sent + '/' + actives.length; } catch(_){}
      }
      btn.disabled = false; $c('bc-text').value = '';
      msg.textContent = 'Sent to ' + sent + ' client' + (sent === 1 ? '' : 's') + (actives.length < ems.length ? ' (' + (ems.length - actives.length) + ' not active yet, skipped)' : '') + '.';
      w1bcReset(); try { renderThreadList(); } catch(_){}
    })();
  }, true);

  /* ── Settings › Auto tags (#98 thresholds) ── */
  var W1_FIELDS = [
    ['compliance_low', 'Low workout compliance', 'Last full week, done \u00f7 scheduled, below this %'],
    ['compliance_high', 'High workout compliance', 'At or above this %'],
    ['nutrition_low', 'Low nutrition', 'Days logged last week, fewer than this (clients with a nutrition plan)'],
    ['nutrition_high', 'Good nutrition', 'Days logged last week, at least this'],
    ['inactive_days', 'Inactive', 'No app activity for this many days'],
    ['not_messaged_days', 'Not messaged', 'You haven\u2019t written to them for this many days'],
    ['not_responded_days', 'Not responded', 'Your last message unanswered for this many days'],
    ['checkin_overdue_days', 'Check-in overdue', 'Days past their check-in rhythm with nothing submitted'],
    ['soon_days', 'Trial ending / goal due / new this week', 'Within this many days']
  ];
  (function(){
    var _sp = w7SettingsPane;
    w7SettingsPane = function(){
      var t = w1thr();
      return _sp.apply(this, arguments) +
        '<div class="card" id="w1-at" style="margin:0 0 18px;"><h3 style="margin:0 0 6px;font-size:14px;">Auto tags</h3>' +
        '<p style="font-size:12px;color:var(--text-muted);margin:0 0 6px;">System labels computed from each client\u2019s week \u2014 shown beside your own tags on the client list and on the dashboard. Change the lines here; nothing is stored on the client.</p>' +
        W1_FIELDS.map(function(f){ return '<div class="w1-f"><div>' + f[1] + '<div class="h">' + f[2] + '</div></div><div><input type="number" min="0" max="365" data-w1at="' + f[0] + '" value="' + t[f[0]] + '"/></div></div>'; }).join('') +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;"><button class="btn btn-primary" type="button" id="w1-at-save" style="font-size:12px;">Save</button><button class="btn" type="button" id="w1-at-reset" style="font-size:12px;">Reset to defaults</button><span id="w1-at-msg" style="font-size:12px;color:var(--text-muted);"></span></div></div>';
    };
    document.addEventListener('click', function(e){
      var t = e.target; if (!t) return;
      if (t.id === 'w1-at-save'){
        var o = {}, bad = null;
        document.querySelectorAll('[data-w1at]').forEach(function(i){ var v = Number(i.value); if (!isFinite(v) || v < 0) bad = i.dataset.w1at; o[i.dataset.w1at] = Math.round(v); });
        var m = $c('w1-at-msg');
        if (bad){ m.textContent = 'Check the numbers \u2014 every line needs a whole number.'; return; }
        if (o.compliance_low > o.compliance_high){ m.textContent = 'Low compliance must be below high compliance.'; return; }
        if (o.nutrition_low > o.nutrition_high){ m.textContent = 'Low nutrition must be below good nutrition.'; return; }
        m.textContent = 'Saving\u2026';
        w0savePrefs({ auto_tags: o }).then(function(){ m.textContent = 'Saved'; setTimeout(function(){ m.textContent = ''; }, 1800); try { w1segBarRender(); if ($c('w1-dash')) w1dashRender(); } catch(_){} });
      }
      if (t.id === 'w1-at-reset'){ document.querySelectorAll('[data-w1at]').forEach(function(i){ i.value = W1_DEFAULTS[i.dataset.w1at]; }); }
    });
  })();

  /* ── Leads (#78): Convert to client — leadsLoad SHADOW (legacy body + Convert / Converted) ── */
  async function leadsLoad(){
    var slug = await partnerSlugGet();
    var link = slug ? ('www.vyvehealth.co.uk/lead/' + slug) : 'Link available once your partner profile has a handle \u2014 contact the VYVE team.';
    $c('lead-link').textContent = link;
    $c('lead-copy').style.display = slug ? '' : 'none';
    var el = $c('lead-list');
    var res = [[],[]];
    try {
      res = await Promise.all([
        rest('/coach_leads?' + pscope() + '&order=created_at.desc&limit=100&select=id,name,email,answers,form_id,status,created_at,converted_client_id'),
        rest('/coach_forms?' + pscope() + '&kind=eq.lead&select=id,questions')
      ]);
    } catch(e){}
    var leads = res[0] || [];
    leadFormMap = {};
    (res[1] || []).forEach(function(f){ leadFormMap[f.id] = f.questions || []; });
    if (!leads.length){
      el.innerHTML = '<div class="empty-state"><h3>No leads yet</h3><p>Build a lead form under Forms, then share your link \u2014 submissions land here and you get an email each time.</p></div>';
      return;
    }
    var byId = {}; roster.forEach(function(c){ byId[c.id] = c; });
    el.innerHTML = leads.map(function(L){
      var qs = leadFormMap[L.form_id] || [];
      var extra = '';
      qs.forEach(function(q){
        var v = (L.answers || {})[q.id];
        if (v === undefined || v === null || v === '') return;
        extra += '<div style="font-size:12px;margin-top:3px;"><span style="color:var(--text-muted);">' + esc(q.label) + ':</span> ' + esc(String(v)) + '</div>';
      });
      var cv = L.status === 'converted' ? (byId[L.converted_client_id] || null) : null;
      var stBadge = L.status === 'new' ? '<span class="src-tag" style="background:rgba(232,131,74,.13);color:#E8834A;border:1px solid rgba(232,131,74,.45);">New</span>'
        : L.status === 'contacted' ? '<span class="src-tag src-vyve">Contacted</span>'
        : L.status === 'converted' ? '<span class="src-tag" style="background:rgba(61,184,159,.13);color:#3DB89F;border:1px solid rgba(61,184,159,.45);">Converted' + (cv && cv.created_at ? ' \u00b7 ' + new Date(cv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '') + '</span>'
        : '<span class="src-tag" style="opacity:.6;">Archived</span>';
      var acts = '';
      if (L.status !== 'converted' && L.status !== 'archived') acts += '<button class="btn btn-primary" data-w1cv="' + L.id + '" style="font-size:11.5px;">Convert to client</button> ';
      if (L.status === 'new') acts += '<button class="btn" data-ld-st="contacted" data-ld="' + L.id + '" style="font-size:11.5px;">Mark contacted</button> ';
      if (L.status === 'converted' && cv) acts += '<button class="btn" data-w1cvview="' + esc(cv.member_email) + '" style="font-size:11.5px;">View client</button> ';
      if (L.status !== 'archived' && L.status !== 'converted') acts += '<button class="btn" data-ld-st="archived" data-ld="' + L.id + '" style="font-size:11.5px;">Archive</button>';
      return '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px;' + (L.status === 'new' ? 'border-left:3px solid #E8834A;' : '') + '"' + (L.status === 'converted' ? ' class="w1-lead-cv"' : '') + '>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-size:13.5px;">' + esc(L.name || 'Someone') + '</strong>' + stBadge +
        '<span style="font-size:11.5px;color:var(--text-muted);margin-left:auto;">' + new Date(L.created_at).toLocaleDateString('en-GB') + '</span></div>' +
        '<div style="font-size:12.5px;color:var(--teal-lt);margin-top:2px;">' + esc(L.email || '') + '</div>' + extra +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">' + acts + '</div></div>';
    }).join('');
    el.querySelectorAll('[data-ld]').forEach(function(b){
      b.addEventListener('click', async function(){
        b.disabled = true;
        try { await rest('/coach_leads?id=eq.' + b.dataset.ld, { method: 'PATCH', body: { status: b.dataset.ldSt } }); leadsLoad(); }
        catch(e){ alert('That didn\u2019t save: ' + e.message); b.disabled = false; }
      });
    });
    el.querySelectorAll('[data-w1cv]').forEach(function(b){
      b.addEventListener('click', function(){
        var L = leads.find(function(x){ return x.id === b.dataset.w1cv; }); if (!L) return;
        var existing = roster.find(function(c){ return w1lc(c.member_email) === w1lc(L.email); });
        if (existing){
          if (!confirm(esc(L.email) + ' is already one of your clients. Link this lead to them?')) return;
          w1convertLink(L, existing).then(function(){ leadsLoad(); });
          return;
        }
        w1.convertLead = L; w1.convertAt = Date.now();
        go('clients'); wzOpen(null);
        var parts = String(L.name || '').trim().split(/\s+/);
        $c('wzf-first').value = parts[0] || ''; $c('wzf-last').value = parts.slice(1).join(' ');
        $c('wzf-email').value = String(L.email || '').trim().toLowerCase();
        $c('wz-msg').textContent = 'From your lead \u201c' + (L.name || L.email) + '\u201d \u2014 the lead flips to Converted when the invite sends.';
      });
    });
    el.querySelectorAll('[data-w1cvview]').forEach(function(b){ b.addEventListener('click', function(){ go('clients'); viewClient(b.dataset.w1cvview); }); });
  }
  async function w1convertLink(L, client){
    await rest('/coach_leads?id=eq.' + L.id, { method: 'PATCH', body: { status: 'converted', converted_client_id: client.id } });
  }
  async function w1convertStamp(){
    var L = w1.convertLead; if (!L || !partnerId) return;
    if (Date.now() - w1.convertAt > 60 * 60e3){ w1.convertLead = null; return; }
    var c = roster.find(function(x){ return w1lc(x.member_email) === w1lc(L.email) && x.created_at && new Date(x.created_at).getTime() >= w1.convertAt - 5000; });
    if (!c) return;
    w1.convertLead = null;
    await w1convertLink(L, c);
    var m = $c('wz-msg'); if (m && $c('wz-card').style.display !== 'none') m.textContent += ' Lead marked Converted.';
  }

  /* ── Subscribers panel (#84): the existing "N clients" count chip on a template row opens the roster of clients on it ── */
  function w1slotFor(id){
    for (var i = 0; i < roster.length; i++){ var a = roster[i].assignments || {}; for (var j = 0; j < W1_SLOTS.length; j++) if (a[W1_SLOTS[j]] === id) return W1_SLOTS[j]; }
    return null;
  }
  function w1subsOpen(id, name){
    if (!w1.subs){
      w1.subs = document.createElement('div'); w1.subs.className = 'w1-modal'; w1.subs.id = 'w1-subs';
      w1.subs.innerHTML = '<div class="in"><div class="hd"><strong id="w1-subs-title" style="flex:1;font-size:14px;"></strong><button class="btn" type="button" id="w1-subs-x" style="font-size:12px;">Close</button></div><div id="w1-subs-body"></div></div>';
      document.body.appendChild(w1.subs);
      $c('w1-subs-x').addEventListener('click', function(){ w1.subs.classList.remove('show'); });
      w1.subs.addEventListener('click', function(ev){ if (ev.target === w1.subs) w1.subs.classList.remove('show'); });
    }
    var slot = w1slotFor(id);
    var on = roster.filter(function(c){ return c.status !== 'archived' && slot && (c.assignments || {})[slot] === id; });
    $c('w1-subs-title').textContent = 'On \u201c' + name + '\u201d \u00b7 ' + on.length + ' client' + (on.length === 1 ? '' : 's');
    var body = $c('w1-subs-body');
    function paint(){
      if (!on.length){ body.innerHTML = '<p class="w1-mu">Nobody is on this right now.</p>'; return; }
      var isWo = slot === 'workout_template_id';
      body.innerHTML = '<table class="cl-tbl"><tr><th>Client</th>' + (isWo ? '<th>Week</th><th>Compliance (4 wk)</th>' : '<th>Status</th>') + '<th></th></tr>' + on.map(function(c){
        var em = w1lc(c.member_email), wp = w1.wpc[em], s = w1stat(c);
        return '<tr><td><div style="font-weight:600;">' + esc(nameOf(c)) + '</div><div class="w1-mu">' + esc(c.member_email) + '</div></td>' +
          (isWo ? '<td>' + (c.status !== 'active' ? '<span class="w1-mu">invited</span>' : wp ? (wp.current_week || 1) + (wp.plan_duration_weeks ? ' <span class="w1-mu">of ' + wp.plan_duration_weeks + '</span>' : '') : '<span class="w1-mu">\u2014</span>') + '</td><td>' + (c.status === 'active' ? w1pctHtml(s.comp4) : '<span class="w1-mu">\u2014</span>') + '</td>' : '<td>' + badge(c.status) + '</td>') +
          '<td style="text-align:right;white-space:nowrap;"><button class="btn" type="button" data-w1sv="' + esc(c.member_email) + '" style="font-size:11.5px;">View</button> <button class="btn" type="button" data-w1sr="' + esc(c.member_email) + '" style="font-size:11.5px;">Remove</button></td></tr>';
      }).join('') + '</table>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;"><button class="btn btn-primary" type="button" id="w1-subs-msg" style="font-size:12px;">Message all ' + on.length + '</button><span class="w1-mu">Remove clears this slot for them' + (isWo ? ' \u2014 their current programme stays until you assign something else' : '') + '.</span><span class="w1-mu" id="w1-subs-note"></span></div>';
      body.querySelectorAll('[data-w1sv]').forEach(function(b){ b.addEventListener('click', function(){ w1.subs.classList.remove('show'); go('clients'); viewClient(b.dataset.w1sv); }); });
      body.querySelectorAll('[data-w1sr]').forEach(function(b){ b.addEventListener('click', async function(){
        if (!confirm('Take ' + b.dataset.w1sr + ' off \u201c' + name + '\u201d?')) return;
        b.disabled = true; $c('w1-subs-note').textContent = 'Removing\u2026';
        try {
          var asg = {}; asg[slot] = null;
          await ef({ action: 'update_assignments', email: b.dataset.w1sr, merge_slots: true, assignments: asg });
          var c = roster.find(function(x){ return x.member_email === b.dataset.w1sr; }); if (c && c.assignments) c.assignments[slot] = null;
          on = on.filter(function(x){ return x.member_email !== b.dataset.w1sr; });
          $c('w1-subs-title').textContent = 'On \u201c' + name + '\u201d \u00b7 ' + on.length + ' client' + (on.length === 1 ? '' : 's');
          paint();
          if (typeof w3ClientsCache !== 'undefined') w3ClientsCache = null;
        } catch(e){ $c('w1-subs-note').textContent = 'That didn\u2019t save: ' + (e.message || e); b.disabled = false; }
      }); });
      var mb = $c('w1-subs-msg'); if (mb) mb.addEventListener('click', function(){ w1.subs.classList.remove('show'); w1bcOpen(on.map(function(c){ return c.member_email; }), 'on ' + name); });
    }
    paint();
    w1.subs.classList.add('show');
    w1ensure().then(function(){ if (w1.subs.classList.contains('show')) paint(); });
  }
  document.addEventListener('click', function(ev){
    var chip = ev.target.closest && ev.target.closest('.w3-chip.pri'); if (!chip || !partnerId) return;
    var row = chip.parentElement; if (!row) return;
    var asg = row.querySelector('[data-w3-asg],[data-w4as-open],[data-w4-asg]');
    var id = asg ? (asg.dataset.w3Asg || asg.dataset.w4asOpen || asg.dataset.w4Asg) : null;
    if (!id) return;
    ev.stopPropagation();
    var nm = row.querySelector('div[style*="font-weight:600"]');
    w1subsOpen(id, nm ? nm.textContent.trim() : 'this template');
  }, true);

  /* ── Recent activity feed (#65): widen notifLoad with cardio / meals / weight / messages / goals / client events; nfRender SHADOW with the wider icon map ── */
  var W1_NF_KINDS = [['cardio','Cardio'],['meal','Meals'],['weight','Weight'],['message','Messages'],['goal','Goals']];
  (function(){
    var f = $c('nf-filters');
    if (f && !$c('w1-nf-f')){
      var trial = f.querySelector('[data-f="trial"]');
      W1_NF_KINDS.forEach(function(k){
        var b = document.createElement('button'); b.className = 'btn nf-f'; b.type = 'button'; b.dataset.f = k[0]; b.style.fontSize = '12px'; b.textContent = k[1]; b.id = 'w1-nf-f' + (k[0] === 'cardio' ? '' : '-' + k[0]);
        if (trial) f.insertBefore(b, trial); else f.appendChild(b);
        b.addEventListener('click', function(){
          document.querySelectorAll('.nf-f').forEach(function(x){ x.classList.remove('active'); x.classList.remove('btn-primary'); });
          b.classList.add('active'); b.classList.add('btn-primary');
          nfFilter = b.dataset.f; nfRender();
        });
      });
    }
    var _nl = notifLoad;
    notifLoad = async function(interactive){
      var now = Date.now();
      var stale = interactive || now - nfLoadedAt >= 60000;
      var r = await _nl.apply(this, arguments);
      if (!partnerId || !stale) return r;
      try {
        var actives = roster.filter(function(c){ return c.status === 'active' && c.consent_accepted_at; });
        var emails = actives.map(function(c){ return c.member_email; });
        var inList = emails.map(function(e){ return '"' + e + '"'; }).join(',');
        var since = new Date(now - 30 * 864e5).toISOString();
        var qs = [
          emails.length ? rest('/cardio?member_email=in.(' + encodeURIComponent(inList) + ')&order=logged_at.desc&limit=40&select=member_email,cardio_type,duration_minutes,distance_km,logged_at').catch(function(){ return []; }) : Promise.resolve([]),
          emails.length ? rest('/nutrition_logs?member_email=in.(' + encodeURIComponent(inList) + ')&logged_at=gte.' + since + '&order=logged_at.desc&limit=400&select=member_email,activity_date,meal_type,calories_kcal,logged_at').catch(function(){ return []; }) : Promise.resolve([]),
          emails.length ? rest('/weight_logs?member_email=in.(' + encodeURIComponent(inList) + ')&order=logged_at.desc&limit=40&select=member_email,weight_kg,logged_at').catch(function(){ return []; }) : Promise.resolve([]),
          rest('/coach_messages?' + pscope() + '&sender=eq.member&order=created_at.desc&limit=40&select=member_email,body,created_at,read_at').catch(function(){ return []; }),
          rest('/coach_client_events?' + pscope() + '&order=created_at.desc&limit=40&select=member_email,kind,label,created_at').catch(function(){ return []; }),
          w1goalsLoad()
        ];
        var res = await Promise.all(qs);
        var ev = [];
        (res[0] || []).forEach(function(x){ ev.push({ t: x.logged_at, kind: 'cardio', email: x.member_email, title: 'Logged ' + (x.cardio_type || 'cardio') + (x.duration_minutes ? ' \u00b7 ' + x.duration_minutes + ' min' : '') + (x.distance_km ? ' \u00b7 ' + x.distance_km + ' km' : ''), note: '' }); });
        var days = {};
        (res[1] || []).forEach(function(x){ var k = x.member_email + '|' + String(x.activity_date).slice(0, 10); if (!days[k]) days[k] = { email: x.member_email, t: x.logged_at, n: 0, kcal: 0, meals: {} }; days[k].n++; days[k].kcal += Number(x.calories_kcal) || 0; if (x.meal_type) days[k].meals[x.meal_type] = 1; if (x.logged_at > days[k].t) days[k].t = x.logged_at; });
        Object.keys(days).forEach(function(k){ var d = days[k], m = memberMap[w1lc(d.email)] || {}; var nm = Object.keys(d.meals).length; ev.push({ t: d.t, kind: 'meal', email: d.email, title: 'Logged ' + (nm || 1) + ' meal' + (nm === 1 ? '' : 's') + ' \u00b7 ' + Math.round(d.kcal) + ' kcal' + (m.tdee_target ? ' (target ' + m.tdee_target + ')' : ''), note: '' }); });
        (res[2] || []).forEach(function(x){ ev.push({ t: x.logged_at, kind: 'weight', email: x.member_email, title: 'Logged weight ' + x.weight_kg + ' kg', note: '' }); });
        (res[3] || []).forEach(function(x){ ev.push({ t: x.created_at, kind: 'message', email: x.member_email, title: x.read_at ? 'Sent you a message' : 'Sent you a message \u2014 unread', note: String(x.body || '').slice(0, 120) }); });
        (res[4] || []).forEach(function(x){ ev.push({ t: x.created_at, kind: 'goal', email: x.member_email, title: x.label || x.kind, note: '' }); });
        var t = w1thr();
        Object.keys(w1.goals).forEach(function(em){ var g = w1.goals[em]; var gd = (new Date(g.target_date + 'T00:00:00Z') - now) / 864e5; if (gd >= -0.5 && gd <= t.soon_days) ev.push({ t: new Date().toISOString(), kind: 'goal', email: g.member_email, title: 'Goal due ' + (gd < 1 ? 'today' : 'in ' + Math.ceil(gd) + ' day' + (Math.ceil(gd) === 1 ? '' : 's')) + ': \u201c' + g.title + '\u201d', note: '' }); });
        nfEvents = nfEvents.concat(ev).filter(function(e){ return e.t; }).sort(function(a, b){ return (b.t || '').localeCompare(a.t || ''); }).slice(0, 120);
        nfBadge();
        if (interactive) nfRender();
      } catch(e){ console.warn('[w1] feed widen', e && e.message); }
      return r;
    };
  })();
  function nfRender(){
    var el = $c('nf-feed');
    var seen = nfSeen();
    var rows = nfEvents.filter(function(e){ return nfFilter === 'all' || e.kind === nfFilter; });
    if (!rows.length){ el.innerHTML = '<div class="empty-state"><h3>Nothing yet</h3><p>Client activity lands here \u2014 workouts, cardio, meals, weight, check-ins, messages, goals, activations and trial deadlines.</p></div>'; nfBadge(); return; }
    var ICON = { workout: '\ud83c\udfcb', checkin: '\ud83d\udcdd', client: '\u2705', trial: '\u23f3', cardio: '\ud83c\udfc3', meal: '\ud83e\udd57', weight: '\u2696\ufe0f', message: '\ud83d\udcac', goal: '\ud83c\udfaf' };
    function dayLabel(t){
      var d = new Date(t), today = new Date();
      var diff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
      return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    var html = '', lastDay = null;
    rows.forEach(function(e){
      var dl = dayLabel(e.t);
      if (dl !== lastDay){ html += '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 6px;">' + dl + '</div>'; lastDay = dl; }
      var who = nameOf(roster.find(function(c){ return c.member_email === e.email; }) || { member_email: e.email });
      var fresh = !seen || e.t > seen;
      html += '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 8px;border-bottom:1px solid var(--border);' + (fresh ? 'background:rgba(27,120,120,.06);border-radius:8px;' : '') + '">' +
        '<div style="font-size:17px;flex:none;">' + (ICON[e.kind] || '\u2022') + '</div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:13px;"><strong>' + esc(who) + '</strong> \u2014 ' + esc(e.title) + (e.unreviewed ? ' <span style="color:#E8834A;font-size:11px;font-weight:700;">\u25cf needs review</span>' : '') + '</div>' +
        (e.note ? '<div style="font-size:12.5px;color:var(--text-muted);font-style:italic;">\u201c' + esc(e.note) + '\u201d</div>' : '') +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + new Date(e.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</div></div>' +
        '<button class="btn" data-nf-view="' + esc(e.email) + '" data-nf-kind="' + esc(e.kind) + '" style="font-size:11.5px;flex:none;">' + (e.kind === 'checkin' ? 'Review' : e.kind === 'message' ? 'Open' : 'View') + '</button></div>';
    });
    el.innerHTML = html;
    el.querySelectorAll('[data-nf-view]').forEach(function(b){
      b.addEventListener('click', function(){
        if (b.dataset.nfKind === 'message'){ go('messages'); setTimeout(function(){ msgOpen(w1lc(b.dataset.nfView)); }, 250); return; }
        go('clients');
        viewClient(b.dataset.nfView);
        setTimeout(function(){ var t = $c('cd-checkins'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
      });
    });
    nfBadge();
  }

  /* ── boot hook: after partnerId resolves, mount the roster chrome (dashboard mounts via renderDashboard) ── */
  (function(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (tries < 90 && !(inited && (partnerId || vyveScope))) return;
      clearInterval(t);
      if (!partnerId) return;
      w1viewsMount();
      w1ensure().then(function(){ if ($c('cl-list') && $c('cl-list').children.length){ $c('cl-list').querySelectorAll('[data-w1]').forEach(function(x){ delete x.dataset.w1; }); renderRoster(); } w1segBarRender(); }).catch(function(){});
    }, 500);
  })();
  /* ============================ end PM-1075 W1 ============================ */





