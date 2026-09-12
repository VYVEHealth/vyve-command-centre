  /* ============================ PM-1214: physio Wave 4 — the loop, physio side ============================
     Patient view for a sent plan: Plan (read-only prescription + Monitor set) · Tracking (dot grid per exercise,
     to-date adherence ring, liked/disliked) · Monitor (one line per ticked metric over rehab_monitor_logs, plus
     every question the patient typed on the post-session sheet). Alerts (rehab_alerts, raised nightly by
     rehab_alert_scan on cron) render as a banner here, a pill on the Patients/Plans lists and a card at the top
     of the patient's thread. Thresholds live in the SQL function and are PLACEHOLDERS for Phil; every string
     a physio reads here is a PLACEHOLDER for Lewis. Draft plans still open the builder — this view is for
     active/completed/archived ones, with Edit plan handing back to the builder. */
  var rhAlerts = [], rhAlertsLoaded = false;
  var pvPlan = null, pvItems = [], pvLogs = [], pvMon = [], pvTab = 'plan', pvCssDone = false;
  var PV_ALERT_COPY = {
    pain_rising:   { t: 'Pain is rising',       d: 'Their pain score has gone up on each of the last few check-ins. Worth a check-in?' },
    adherence_low: { t: 'Adherence is dropping', d: 'They have done under half of the prescribed sessions for two weeks running. Worth reaching out or booking a review?' }
  };
  var PV_COLORS = { pain: '#ef4444', mobility: 'var(--vyve-teal)', difficulty: '#E8A855', strength: '#8b5cf6', everyday: '#3b82f6' };
  function pvCss(){
    if (pvCssDone) return; pvCssDone = true;
    var s = document.createElement('style');
    s.textContent =
      '.pv-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin:6px 0 14px;}' +
      '.pv-tabs button{background:none;border:0;border-bottom:2px solid transparent;padding:8px 12px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:inherit;margin-bottom:-1px;}' +
      '.pv-tabs button.on{color:var(--vyve-teal);border-bottom-color:var(--vyve-teal);}' +
      '.pv-grid{display:grid;grid-template-columns:1fr 260px;gap:14px;}@media (max-width:820px){.pv-grid{grid-template-columns:1fr;}}' +
      '.pv-box{border:1px solid var(--border);border-radius:12px;background:var(--surface-2);padding:12px 14px;}' +
      '.pv-box h4{margin:0 0 8px;font-size:13px;font-weight:700;}' +
      '.pv-alert{border:1px solid #E8A855;background:rgba(232,168,85,.09);border-radius:10px;padding:10px 12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px;font-size:13px;}' +
      '.pv-alert b{color:#E8A855;}.pv-alert .act{margin-left:auto;display:flex;gap:6px;}' +
      '.pv-pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.03em;border:1px solid #E8A855;color:#E8A855;margin-left:6px;vertical-align:middle;}' +
      '.pv-rx{width:100%;border-collapse:collapse;font-size:12.5px;}.pv-rx th{text-align:left;color:var(--text-muted);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;padding:5px 6px;font-weight:600;}.pv-rx td{padding:7px 6px;border-top:1px solid var(--border);vertical-align:top;}' +
      '.pv-trk{overflow-x:auto;}.pv-trk table{border-collapse:separate;border-spacing:0 6px;font-size:12px;}' +
      '.pv-trk th{text-align:left;font-weight:600;padding:0 10px 0 0;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;}' +
      '.pv-trk td{padding:0 1px;}.pv-trk .d{width:16px;height:16px;border-radius:4px;background:var(--surface);border:1px solid var(--border);display:block;}' +
      '.pv-trk .d.full{background:var(--vyve-teal);border-color:var(--vyve-teal);}.pv-trk .d.part{background:rgba(27,120,120,.4);border-color:var(--vyve-teal);}.pv-trk .d.skip{background:rgba(232,168,85,.55);border-color:#E8A855;}.pv-trk .d.today{outline:2px solid var(--text-muted);outline-offset:-2px;}' +
      '.pv-trk .dh{font-size:9.5px;color:var(--text-muted);text-align:center;width:18px;font-weight:500;}' +
      '.pv-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--text-muted);margin-top:8px;}.pv-leg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px;border:1px solid var(--border);}' +
      '.pv-ring{position:relative;width:104px;height:104px;flex:none;}.pv-ring .n{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:22px;line-height:1;}.pv-ring .n small{font-size:10px;font-weight:600;color:var(--text-muted);margin-top:3px;}' +
      '.pv-chart{width:100%;height:150px;display:block;}' +
      '.pv-q{border-left:3px solid #C9A84C;padding:8px 10px;background:var(--surface);border-radius:0 8px 8px 0;margin-bottom:8px;font-size:13px;}.pv-q small{display:block;color:var(--text-muted);font-size:11px;margin-top:3px;}' +
      '.pv-muted{font-size:12px;color:var(--text-muted);}';
    document.head.appendChild(s);
  }
  function pvDay(iso){ var d = new Date(iso + 'T00:00:00'); return d; }
  function pvIso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pvAddDays(iso, n){ var d = pvDay(iso); d.setDate(d.getDate() + n); return pvIso(d); }
  function pvDaysBetween(a, b){ return Math.round((pvDay(b) - pvDay(a)) / 86400000); }
  function pvShort(iso){ var d = pvDay(iso); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  /* ── alerts ── */
  async function rhAlertsLoad(force){
    if (rhAlertsLoaded && !force) return;
    try { rhAlerts = await rest('/rehab_alerts?partner_id=eq.' + partnerId + '&dismissed_at=is.null&select=id,plan_id,member_email,kind,details,period_key,created_at&order=created_at.desc') || []; } catch(_){ rhAlerts = []; }
    rhAlertsLoaded = true;
  }
  function rhAlertsFor(email, planId){
    var e = (email || '').toLowerCase();
    return rhAlerts.filter(function(a){ return (!planId || a.plan_id === planId) && (!e || (a.member_email || '').toLowerCase() === e); });
  }
  function rhAlertPill(email, planId){ var n = rhAlertsFor(email, planId).length; return n ? '<span class="pv-pill">' + n + ' alert' + (n === 1 ? '' : 's') + '</span>' : ''; }
  function rhAlertCard(a, onChange){
    var c = PV_ALERT_COPY[a.kind] || { t: a.kind, d: '' };
    var det = a.details || {}, extra = '';
    if (a.kind === 'pain_rising' && Array.isArray(det.last)) extra = ' Last scores: ' + det.last.join(' \u2192 ') + '.';
    if (a.kind === 'adherence_low' && det.weeks) extra = ' Last two weeks: ' + det.weeks.map(function(w){ return Math.round((w.adherence || 0) * 100) + '%'; }).join(', ') + '.';
    var el = document.createElement('div'); el.className = 'pv-alert';
    el.innerHTML = '<div><b>' + esc(c.t) + '</b> \u00b7 ' + esc(rhPtLabel(a.member_email)) + '<div class="pv-muted">' + esc(c.d + extra) + ' <span style="color:#C9A84C;">[thresholds: Phil placeholder]</span></div></div>' +
      '<div class="act"><button class="btn btn-primary" type="button" data-pv-msg style="font-size:12px;">Message patient</button><button class="btn" type="button" data-pv-dismiss style="font-size:12px;">Dismiss</button></div>';
    el.querySelector('[data-pv-msg]').addEventListener('click', function(){ rhMsgOpen(a.member_email); });
    el.querySelector('[data-pv-dismiss]').addEventListener('click', async function(){
      try {
        await rest('/rehab_alerts?id=eq.' + a.id, { method: 'PATCH', body: { dismissed_at: new Date().toISOString() } });
        rhAlerts = rhAlerts.filter(function(x){ return x.id !== a.id; });
        el.remove(); if (onChange) onChange();
      } catch(e){ el.querySelector('.pv-muted').textContent = 'Could not dismiss (' + (e.message || e) + ').'; }
    });
    return el;
  }
  function pvPaintAlerts(){
    var box = $c('pv-alerts'); box.innerHTML = '';
    rhAlertsFor(pvPlan.member_email, pvPlan.id).forEach(function(a){ box.appendChild(rhAlertCard(a, function(){ renderPatients(); })); });
  }

  /* ── open / load ── */
  async function rhPvOpen(id){
    pvCss(); rhCss();
    var p = null; for (var i = 0; i < rhPlans.length; i++){ if (rhPlans[i].id === id) p = rhPlans[i]; }
    if (!p) return;
    pvPlan = p; pvItems = []; pvLogs = []; pvMon = [];
    $c('rh-list-card').style.display = 'none'; $c('rh-editor').style.display = 'none'; $c('rh-pv').style.display = '';
    $c('pv-name').textContent = rhPtLabel(p.member_email);
    var wk = pvWeek(p);
    $c('pv-sub').textContent = p.name + ' \u00b7 started ' + rhFmt(p.start_date) + ' \u00b7 ' + (wk.n > p.duration_weeks ? 'plan finished' : 'week ' + wk.n + ' of ' + p.duration_weeks);
    $c('pv-status').innerHTML = '<span class="rh-pill ' + esc(p.status) + '">' + esc(p.status) + '</span>';
    $c('pv-plan').innerHTML = $c('pv-track').innerHTML = $c('pv-mon').innerHTML = '<div class="pv-muted">Loading\u2026</div>';
    await rhAlertsLoad(false);
    pvPaintAlerts();
    var mine = p.id;
    try {
      var r = await Promise.all([
        rest('/rehab_plan_items?plan_id=eq.' + p.id + '&select=' + RH_ITEM_SEL + '&order=position.asc,created_at.asc'),
        rest('/rehab_item_logs?plan_id=eq.' + p.id + '&select=item_id,logged_date,slot,status,liked&order=logged_date.asc&limit=5000'),
        rest('/rehab_monitor_logs?plan_id=eq.' + p.id + '&select=logged_date,scores,question,created_at&order=logged_date.asc&limit=1000')
      ]);
      if (!pvPlan || pvPlan.id !== mine) return;
      pvItems = r[0] || []; pvLogs = r[1] || []; pvMon = r[2] || [];
    } catch(e){ $c('pv-plan').innerHTML = '<div class="pv-muted">Could not load this patient\u2019s activity (' + esc(e.message || e) + ').</div>'; return; }
    pvSetTab(pvTab || 'plan');
  }
  function pvWeek(p){
    var days = pvDaysBetween(p.start_date, rhToday());
    return { days: days, n: days < 0 ? 0 : Math.floor(days / 7) + 1 };
  }
  function pvSetTab(t){
    pvTab = t;
    document.querySelectorAll('#pv-tabs button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-pv-tab') === t); });
    ['plan', 'track', 'mon'].forEach(function(k){ $c('pv-' + k).style.display = k === t ? '' : 'none'; });
    if (t === 'plan') pvPaintPlan(); if (t === 'track') pvPaintTrack(); if (t === 'mon') pvPaintMon();
  }

  /* ── Plan tab ── */
  function pvPaintPlan(){
    var p = pvPlan, live = pvItems.filter(function(i){ return !i.removed_at; }), gone = pvItems.filter(function(i){ return i.removed_at; });
    var qs = RH_MONITOR.filter(function(m){ return (p.monitor || []).indexOf(m.key) >= 0; });
    $c('pv-plan').innerHTML = '<div class="pv-grid"><div class="pv-box"><h4>Prescription</h4>' +
      (live.length ? '<table class="pv-rx"><thead><tr><th>Exercise</th><th>Hold</th><th>Reps</th><th>Daily</th><th>Rest</th><th>Days/wk</th><th>Sides</th></tr></thead><tbody>' +
        live.map(function(it){ return '<tr><td><div style="font-weight:600;">' + esc(it.name) + '</div>' + (it.note ? '<div class="pv-muted">' + esc(it.note) + '</div>' : '') + '</td><td>' + esc(it.hold_s) + 's</td><td>' + esc(it.reps) + '</td><td>' + esc(it.times_daily) + '\u00d7</td><td>' + esc(it.rest_s) + 's</td><td>' + esc(it.days_per_week) + '</td><td>' + (it.both_sides ? 'both' : '\u2014') + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="pv-muted">No exercises in this plan.</div>') +
      (gone.length ? '<div class="pv-muted" style="margin-top:8px;">Removed since sending: ' + esc(gone.map(function(i){ return i.name; }).join(', ')) + '</div>' : '') +
      (p.note ? '<div style="margin-top:10px;font-size:12.5px;"><span class="pv-muted">Note to patient:</span> ' + esc(p.note) + '</div>' : '') +
      '</div><div><div class="pv-box" style="margin-bottom:12px;"><h4>Monitoring</h4>' + (qs.length ? qs.map(function(m){ return '<div class="rh-q">' + esc(m.q) + '<div class="a">0 = ' + esc(m.lo) + ' \u00b7 10 = ' + esc(m.hi) + '</div></div>'; }).join('') : '<div class="pv-muted">No Monitor questions \u2014 done / skipped only.</div>') + '</div>' +
      '<div class="pv-box"><h4>Safety netting</h4><div class="pv-muted" style="white-space:pre-wrap;">' + esc(p.safety_netting || '\u2014') + '</div>' + (p.red_flags ? '<h4 style="margin-top:10px;">Red flags</h4><div class="pv-muted" style="white-space:pre-wrap;">' + esc(p.red_flags) + '</div>' : '') + '</div></div></div>';
  }

  /* ── Tracking tab ── */
  function pvExpected(it, days){
    /* sessions this exercise asks for in the first `days` days of the plan: times_daily × days_per_week per full week, then times_daily × min(remainder, days_per_week) */
    if (days <= 0) return 0;
    var full = Math.floor(days / 7), rem = days % 7;
    return (it.times_daily || 1) * ((it.days_per_week || 7) * full + Math.min(rem, it.days_per_week || 7));
  }
  function pvStats(){
    var p = pvPlan, live = pvItems.filter(function(i){ return !i.removed_at; });
    var elapsed = Math.max(0, Math.min(pvDaysBetween(p.start_date, rhToday()) + 1, (p.duration_weeks || 0) * 7));
    var done = 0, expToDate = 0, expTotal = 0, byItem = {};
    live.forEach(function(it){ byItem[it.id] = { done: 0, skip: 0, up: 0, down: 0 }; expToDate += pvExpected(it, elapsed); expTotal += (it.times_daily || 1) * (it.days_per_week || 7) * (p.duration_weeks || 0); });
    pvLogs.forEach(function(l){
      var b = byItem[l.item_id]; if (!b) return;
      if (l.status === 'done'){ b.done++; done++; } else if (l.status === 'skipped') b.skip++;
      if (l.liked === true) b.up++; if (l.liked === false) b.down++;
    });
    /* streak = consecutive days with at least one done session, counted back from today (or yesterday if today isn't logged yet) */
    var best = 0, cur = 0, byDate = {}, today = rhToday();
    pvLogs.forEach(function(l){ if (l.status === 'done') byDate[l.logged_date] = 1; });
    for (var d = 0; d < elapsed; d++){ var iso = pvAddDays(p.start_date, d); if (byDate[iso]){ cur++; best = Math.max(best, cur); } else cur = 0; }
    var streak = 0, back = byDate[today] ? today : pvAddDays(today, -1);
    while (byDate[back] && pvDaysBetween(p.start_date, back) >= 0){ streak++; back = pvAddDays(back, -1); }
    return { elapsed: elapsed, done: done, expToDate: expToDate, expTotal: expTotal, adherence: expToDate ? Math.min(1, done / expToDate) : 0, byItem: byItem, streak: streak, best: best };
  }
  function pvPaintTrack(){
    var p = pvPlan, live = pvItems.filter(function(i){ return !i.removed_at; }), s = pvStats();
    if (!live.length || s.elapsed <= 0){ $c('pv-track').innerHTML = '<div class="pv-muted">' + (s.elapsed <= 0 ? 'The plan starts ' + esc(rhFmt(p.start_date)) + ' \u2014 nothing to track yet.' : 'No exercises in this plan.') + '</div>'; return; }
    /* dot grid: one cell per plan day so far, newest 28 days at most */
    var last = pvAddDays(p.start_date, s.elapsed - 1), span = Math.min(s.elapsed, 28), first = pvAddDays(last, -(span - 1));
    var cell = {}; pvLogs.forEach(function(l){ var k = l.item_id + '|' + l.logged_date; var c = cell[k] || (cell[k] = { done: 0, skip: 0 }); if (l.status === 'done') c.done++; else if (l.status === 'skipped') c.skip++; });
    var dates = []; for (var d = 0; d < span; d++) dates.push(pvAddDays(first, d));
    var today = rhToday();
    var grid = '<table><thead><tr><th></th>' + dates.map(function(iso){ var dd = pvDay(iso); return '<th class="dh" title="' + esc(pvShort(iso)) + '">' + (dd.getDate() === 1 || iso === first ? dd.toLocaleDateString('en-GB', { month: 'short' }) : dd.getDate()) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      live.map(function(it){
        return '<tr><th title="' + esc(it.name) + '">' + esc(it.name) + '</th>' + dates.map(function(iso){
          var c = cell[it.id + '|' + iso] || { done: 0, skip: 0 }, cls = '';
          if (c.done >= (it.times_daily || 1)) cls = 'full'; else if (c.done > 0) cls = 'part'; else if (c.skip > 0) cls = 'skip';
          return '<td><span class="d ' + cls + (iso === today ? ' today' : '') + '" title="' + esc(pvShort(iso) + ': ' + c.done + ' done, ' + c.skip + ' skipped') + '"></span></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
    var pct = Math.round(s.adherence * 100), dash = 2 * Math.PI * 44, off = dash * (1 - s.adherence);
    var likes = live.map(function(it){ var b = s.byItem[it.id]; var bad = b.down > b.up || (b.skip > b.done && b.skip >= 3); return '<span>' + esc(it.name) + '</span><span style="white-space:nowrap;' + (bad ? 'color:#E8A855;' : '') + '">\u25b2 ' + b.up + ' \u00b7 \u25bc ' + b.down + ' \u00b7 skipped ' + b.skip + '</span>'; }).join('');
    $c('pv-track').innerHTML = '<div class="pv-grid"><div class="pv-box"><h4>' + (span < s.elapsed ? 'Last ' + span + ' days' : 'Day 1 to today') + '</h4><div class="pv-trk">' + grid + '</div>' +
      '<div class="pv-leg"><span><i style="background:var(--vyve-teal);"></i>all sessions done</span><span><i style="background:rgba(27,120,120,.4);"></i>some done</span><span><i style="background:rgba(232,168,85,.55);"></i>skipped</span><span><i></i>nothing logged</span></div></div>' +
      '<div><div class="pv-box" style="display:flex;gap:14px;align-items:center;margin-bottom:12px;"><div class="pv-ring"><svg width="104" height="104" viewBox="0 0 104 104"><circle cx="52" cy="52" r="44" fill="none" stroke="var(--border)" stroke-width="9"/><circle cx="52" cy="52" r="44" fill="none" stroke="' + (pct < 50 ? '#E8A855' : 'var(--vyve-teal)') + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 52 52)"/></svg><div class="n">' + pct + '%<small>adherence</small></div></div>' +
      '<div class="pv-muted">' + s.done + ' of ' + s.expToDate + ' sessions due so far<br/>' + s.done + ' of ' + s.expTotal + ' for the whole plan<br/>' + s.streak + '-day streak \u00b7 best ' + s.best + '</div></div>' +
      '<div class="pv-box"><h4>Liked / disliked</h4><div style="display:grid;grid-template-columns:1fr auto;gap:6px 10px;font-size:12.5px;">' + likes + '</div></div></div></div>';
  }

  /* ── Monitor tab ── */
  function pvChart(key, rows){
    var pts = rows.filter(function(r){ return r.scores && r.scores[key] != null && !isNaN(+r.scores[key]); }).map(function(r){ return { d: r.logged_date, v: Math.max(0, Math.min(10, +r.scores[key])) }; });
    var W = 700, H = 150, L = 26, R = 10, T = 10, B = 24, w = W - L - R, h = H - T - B;
    var m = RH_MONITOR.filter(function(x){ return x.key === key; })[0] || { label: key, lo: '0', hi: '10' };
    var col = PV_COLORS[key] || 'var(--vyve-teal)';
    if (pts.length < 1) return '<div class="pv-box" style="margin-bottom:12px;"><h4>' + esc(m.label) + '</h4><div class="pv-muted">No entries yet.</div></div>';
    var x = function(i){ return pts.length === 1 ? L + w / 2 : L + (i / (pts.length - 1)) * w; }, y = function(v){ return T + h - (v / 10) * h; };
    var path = pts.map(function(p, i){ return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join(' ');
    var grid = [0, 5, 10].map(function(v){ return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--border)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" font-size="10" text-anchor="end" fill="var(--text-muted)">' + v + '</text>'; }).join('');
    var labelEvery = Math.max(1, Math.ceil(pts.length / 8));
    var xl = pts.map(function(p, i){ return (i % labelEvery === 0 || i === pts.length - 1) ? '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" font-size="10" text-anchor="middle" fill="var(--text-muted)">' + esc(pvShort(p.d)) + '</text>' : ''; }).join('');
    var dots = pts.map(function(p, i){ return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="3.5" fill="' + col + '"><title>' + esc(pvShort(p.d) + ': ' + p.v) + '</title></circle>'; }).join('');
    var lastV = pts[pts.length - 1].v, firstV = pts[0].v, trend = lastV > firstV ? '\u2191 ' + firstV + ' \u2192 ' + lastV : lastV < firstV ? '\u2193 ' + firstV + ' \u2192 ' + lastV : 'steady at ' + lastV;
    return '<div class="pv-box" style="margin-bottom:12px;"><h4>' + esc(m.label) + ' <span class="pv-muted" style="font-weight:500;">\u00b7 ' + esc(trend) + ' \u00b7 0 = ' + esc(m.lo) + ', 10 = ' + esc(m.hi) + '</span></h4>' +
      '<svg class="pv-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + grid + '<path d="' + path + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + dots + xl + '</svg></div>';
  }
  function pvPaintMon(){
    var p = pvPlan, keys = (p.monitor || []).slice();
    var qs = pvMon.filter(function(r){ return r.question && String(r.question).trim(); }).slice().reverse();
    $c('pv-mon').innerHTML = '<div class="pv-grid"><div>' +
      (keys.length ? keys.map(function(k){ return pvChart(k, pvMon); }).join('') : '<div class="pv-box"><div class="pv-muted">This plan has no Monitor questions \u2014 edit the plan to add some.</div></div>') +
      (pvMon.length ? '<div class="pv-muted">' + pvMon.length + ' check-in' + (pvMon.length === 1 ? '' : 's') + ' \u00b7 once a day, after a session</div>' : '') + '</div>' +
      '<div class="pv-box"><h4>Questions from ' + esc(rhPtLabel(p.member_email).split(' ')[0]) + '</h4>' +
      (qs.length ? qs.map(function(r){ return '<div class="pv-q">\u201c' + esc(r.question) + '\u201d<small>' + esc(pvShort(r.logged_date)) + ' \u00b7 from the post-session sheet</small></div>'; }).join('') + '<button class="btn btn-primary" type="button" id="pv-reply" style="font-size:12px;margin-top:4px;">Reply in Messages</button>' : '<div class="pv-muted">Nothing asked yet. Questions typed on the post-session sheet land here and in Messages.</div>') + '</div></div>';
    if ($c('pv-reply')) $c('pv-reply').addEventListener('click', function(){ rhMsgOpen(p.member_email); });
  }

  /* wiring — elements exist in physio/body.html */
  $c('pv-back').addEventListener('click', function(){ pvPlan = null; rhInit(true); });
  $c('pv-edit').addEventListener('click', function(){ if (pvPlan) rhOpen(pvPlan.id); });
  $c('pv-msg').addEventListener('click', function(){ if (pvPlan) rhMsgOpen(pvPlan.member_email); });
  $c('pv-tabs').querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){ pvSetTab(b.getAttribute('data-pv-tab')); }); });
  /* ============================ end PM-1214 patient view ============================ */
