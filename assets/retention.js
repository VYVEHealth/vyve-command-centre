// PM-580 v1 — Retention & Activation page
const RET_SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const RET_SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
const RET_EF_BASE = RET_SB_URL + '/functions/v1';

// ── Theme ─────────────────────────────────────────────────────────────────────
function retApplyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  var dk = document.getElementById('theme-icon-dark');
  var lt = document.getElementById('theme-icon-light');
  if (dk) dk.style.display = t === 'dark' ? '' : 'none';
  if (lt) lt.style.display = t === 'light' ? '' : 'none';
  localStorage.setItem('vyve_cc_theme', t);
}
function retToggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme') || 'dark';
  retApplyTheme(cur === 'dark' ? 'light' : 'dark');
}
(function(){ retApplyTheme(localStorage.getItem('vyve_cc_theme') || 'dark'); })();

// ── Toast ──────────────────────────────────────────────────────────────────────
var _retToastTimer;
function retToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_retToastTimer);
  _retToastTimer = setTimeout(function(){ t.classList.remove('show'); }, 3200);
}

// ── Auth ───────────────────────────────────────────────────────────────────────
async function retGetJwt() {
  try {
    var raw = localStorage.getItem('vyve-cc-supabase-auth');
    if (raw) {
      var p = JSON.parse(raw);
      var at = p && (p.access_token || (p.data && p.data.session && p.data.session.access_token) || (p.session && p.session.access_token));
      if (at) return at;
    }
  } catch(_) {}
  if (window.VYVE_SUPABASE) {
    try {
      var d = await window.VYVE_SUPABASE.client().auth.getSession();
      if (d && d.data && d.data.session && d.data.session.access_token) return d.data.session.access_token;
    } catch(_) {}
  }
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function retEsc(s) {
  return String(s || '').replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
}
function retTimeAgo(ts) {
  if (!ts) return '—';
  var d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}
function retSetEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
function retPct(n, total) { return total ? Math.round(n / total * 100) : 0; }
function retCohortCell(pct, isNA) {
  if (isNA) return '<td class="cohort-cell c-na" style="text-align:center">—</td>';
  var cls = pct >= 60 ? 'c-green' : pct >= 30 ? 'c-amber' : 'c-red';
  return '<td class="cohort-cell ' + cls + '">' + pct + '%</td>';
}

// ── Load ───────────────────────────────────────────────────────────────────────
async function retLoadData() {
  try {
    var jwt = await retGetJwt();
    var url = new URL(RET_SB_URL + '/rest/v1/cc_retention');
    url.searchParams.set('select', '*');
    url.searchParams.set('id', 'eq.1');
    var res = await fetch(url.toString(), {
      headers: { 'apikey': RET_SB_ANON, 'Authorization': 'Bearer ' + (jwt || RET_SB_ANON), 'Accept': 'application/json' }
    });
    var rows = await res.json();
    var row = rows && rows[0];
    if (!row || !row.refreshed_at) {
      retSetEl('refresh-text', 'Cache empty — click Refresh');
      retShowEmpty();
      return;
    }
    retRenderAll(row);
  } catch(e) {
    retSetEl('refresh-text', 'Load failed');
    console.error('Retention load error:', e);
  }
}

function retShowEmpty() {
  ['funnel-body','cohort-body','atrisk-body'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<tr><td colspan="8"><div class="empty-state">Cache not yet built — click Refresh now</div></td></tr>';
  });
  var fb = document.getElementById('funnel-body');
  if (fb) fb.innerHTML = '<div class="empty-state">Click Refresh now to build</div>';
}

async function retRefresh() {
  var btn = document.getElementById('btn-refresh');
  if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }
  retSetEl('refresh-text', 'Refreshing…');
  try {
    var jwt = await retGetJwt();
    var res = await fetch(RET_EF_BASE + '/cc-retention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': RET_SB_ANON, 'Authorization': 'Bearer ' + (jwt || RET_SB_ANON) },
      body: JSON.stringify({})
    });
    var data = await res.json();
    if (data.ok) { retToast('Refreshed — reloading…'); await retLoadData(); }
    else retToast('Refresh failed: ' + (data.error || 'unknown'));
  } catch(e) { retToast('Error: ' + e.message); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Refresh'; } }
}

// ── Render ─────────────────────────────────────────────────────────────────────
function retRenderAll(row) {
  var ago = retTimeAgo(row.refreshed_at);
  retSetEl('refresh-text', 'Refreshed ' + ago);
  var f = row.funnel_json || {};
  var cohorts = row.cohorts_json || [];
  var dorm = row.dormancy_json || {};
  var atRisk = row.atrisk_json || [];
  retRenderHeadline(f, dorm);
  retRenderFunnel(f);
  retRenderDormancy(dorm);
  retRenderDayN(f.day_n_curves || []);
  retRenderStreaks(f.streak || {});
  retRenderCriticalEvents(f.critical_events || {});
  retRenderCohorts(cohorts);
  retRenderAtRisk(atRisk);
  retRenderReengage(row.reengage_json || null);
}

function retRenderHeadline(f, dorm) {
  var total = f.total || 0;
  retSetEl('hl-total', total);
  var ea = f.ever_active || 0;
  retSetEl('hl-ever-active', ea);
  retSetEl('hl-ever-pct', retPct(ea, total) + '% of members');
  var a7 = (dorm.active || 0);
  retSetEl('hl-active7', a7);
  retSetEl('hl-active7-pct', retPct(a7, total) + '% active this week');
  var med = f.median_hours_to_first;
  var ttfDisplay = med != null ? (med < 1 ? '<1h' : med < 24 ? Math.round(med) + 'h' : Math.round(med/24) + 'd') : '—';
  retSetEl('hl-ttf', ttfDisplay);
  // Update sub label to clarify it's median and show same-day count
  var subEl = document.querySelector('#hl-ttf')?.closest('.stat-cell')?.querySelector('.stat-sub');
  if (subEl) {
    var sdc = f.same_day_count || 0;
    var avg = f.avg_hours_to_first;
    var avgDisp = avg != null ? (avg < 24 ? Math.round(avg)+'h' : Math.round(avg/24)+'d') : '—';
    subEl.textContent = 'median · ' + sdc + ' same-day · mean ' + avgDisp;
  }
  retSetEl('hl-atrisk', dorm.at_risk || 0);
  retSetEl('hl-never', f.never_active || 0);
}

function retRenderFunnel(f) {
  var el = document.getElementById('funnel-body');
  if (!el) return;
  var meta = document.getElementById('funnel-meta');
  if (meta) meta.textContent = f.total ? f.total + ' members total' : '—';
  // Consent gate removed — signal unreliable (10-min timeout bug means many real users lack the flag)
  var stages = [
    { label: 'Signed up',             n: f.total || 0,               pct: 100 },
    { label: 'Onboarding complete',   n: f.onboarding_complete || 0, pct: retPct(f.onboarding_complete, f.total) },
    { label: 'Logged first habit',    n: f.habit_logged || 0,        pct: retPct(f.habit_logged, f.total) },
    { label: 'Active within day 1',   n: f.active_day1 || 0,         pct: retPct(f.active_day1, f.total) },
    { label: 'Active within 7 days',  n: f.active_first_7d || 0,     pct: retPct(f.active_first_7d, f.total) },
    { label: 'Active within 30 days', n: f.active_first_30d || 0,    pct: retPct(f.active_first_30d, f.total) },
  ];
  var html = '<div class="funnel-wrap">';
  stages.forEach(function(s, i) {
    var drop = i > 0 ? stages[i-1].pct - s.pct : 0;
    var dropHtml = drop > 0
      ? '<span class="funnel-drop">-' + drop + '%</span>'
      : '<span class="funnel-drop"></span>';
    var barColor = s.pct >= 60 ? 'var(--teal)' : s.pct >= 30 ? 'var(--warning)' : 'var(--danger)';
    html += '<div class="funnel-row">'
      + '<div class="funnel-label">' + retEsc(s.label) + '</div>'
      + '<div class="funnel-bar-bg">'
      + '<div class="funnel-bar-fill" style="width:' + s.pct + '%;background:' + barColor + '">'
      + '<span class="funnel-bar-text">' + s.n + '</span>'
      + '</div></div>'
      + '<div class="funnel-pct">' + s.pct + '%</div>'
      + dropHtml
      + '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function retRenderDormancy(dorm) {
  retSetEl('dorm-active',   dorm.active   || 0);
  retSetEl('dorm-quiet',    dorm.quiet    || 0);
  retSetEl('dorm-inactive', dorm.inactive || 0);
  retSetEl('dorm-never',    dorm.never    || 0);
}

function retRenderCohorts(cohorts) {
  var tbody = document.getElementById('cohort-body');
  if (!tbody) return;
  if (!cohorts.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state">No cohort data yet</div></td></tr>';
    return;
  }
  var now = Date.now();
  tbody.innerHTML = cohorts.map(function(c) {
    var joinedMs = new Date(c.period + '-01').getTime();
    var ageWeeks = (now - joinedMs) / (7 * 86400000);
    return '<tr>'
      + '<td><strong>' + retEsc(c.label) + '</strong></td>'
      + '<td class="num">' + (c.total || 0) + '</td>'
      + retCohortCell(c.ever_active_pct || 0, false)
      + retCohortCell(c.week1_pct || 0, ageWeeks < 1)
      + retCohortCell(c.week2_pct || 0, ageWeeks < 2)
      + retCohortCell(c.month1_pct || 0, ageWeeks < 4)
      + retCohortCell(c.month2_pct || 0, ageWeeks < 8)
      + retCohortCell(c.still_active_pct || 0, false)
      + '</tr>';
  }).join('');
}

function retRenderAtRisk(members) {
  var tbody = document.getElementById('atrisk-body');
  if (!tbody) return;
  if (!members.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:20px">No at-risk members — everyone is active</div></td></tr>';
    return;
  }
  tbody.innerHTML = members.map(function(m) {
    var name = ((m.first_name || '') + ' ' + (m.last_name || '')).trim();
    var trendIcon = m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '=';
    var trendCls  = m.trend === 'up' ? 'traj-up' : m.trend === 'down' ? 'traj-down' : 'traj-flat';
    var flagHtml = '';
    if (m.needs_support) flagHtml += '<span class="pill pill-danger" style="font-size:9px;margin-right:3px">support</span>';
    if (m.at_risk)       flagHtml += '<span class="pill pill-warn"   style="font-size:9px">at risk</span>';
    return '<tr>'
      + '<td><div style="font-size:12px;font-weight:600">' + retEsc(name || m.member_email) + '</div>'
      + (name ? '<div style="font-size:10px;color:var(--text-dim)">' + retEsc(m.member_email) + '</div>' : '') + '</td>'
      + '<td><span class="persona-badge persona-' + retEsc(m.persona||'') + '">' + retEsc(m.persona||'—') + '</span></td>'
      + '<td style="color:var(--text-muted);font-size:11px">' + (m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-GB') : '—') + '</td>'
      + '<td style="color:var(--text-muted);font-size:11px">' + retTimeAgo(m.last_activity_at) + '</td>'
      + '<td class="num">' + (m.total_activities || 0) + '</td>'
      + '<td class="num">' + (m.activities_7d || 0) + '</td>'
      + '<td class="' + trendCls + '" style="text-align:center;font-weight:600">' + trendIcon + '</td>'
      + '<td>' + flagHtml + '</td>'
      + '</tr>';
  }).join('');
}


// ── Day-N retention curve ─────────────────────────────────────────────────────
function retRenderDayN(curves) {
  var el = document.getElementById('dayn-body');
  if (!el || !curves.length) return;
  var valid = curves.filter(function(c){ return c.pct !== null; });
  if (!valid.length) { el.innerHTML = '<div class="empty-state">Not enough data — members need to reach each milestone day to generate this curve.</div>'; return; }

  // SVG line chart
  var W=560, H=180, PAD={t:16,r:16,b:36,l:44};
  var cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  var maxY=100, pts=valid.length;
  var xStep=pts>1?cW/(pts-1):cW;

  function xOf(i){ return PAD.l+(pts>1?i*xStep:cW/2); }
  function yOf(v){ return PAD.t+cH-(v/maxY*cH); }

  // Grid lines at 0, 25, 50, 75, 100
  var grid='';
  [0,25,50,75,100].forEach(function(v){
    var y=yOf(v);
    grid+='<line x1="'+PAD.l+'" x2="'+(W-PAD.r)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(77,170,170,.12)" stroke-width="1"/>';
    grid+='<text x="'+(PAD.l-4)+'" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="var(--text-dim)">'+v+'%</text>';
  });

  // Benchmark dashed line
  var benchLine='', benchPts=valid.filter(function(c){return c.benchmark!=null;});
  if(benchPts.length>1){
    var bPath='M';
    benchPts.forEach(function(c,i){
      var idx=valid.indexOf(c);
      bPath+=(i===0?'':' L')+xOf(idx).toFixed(1)+','+yOf(c.benchmark).toFixed(1);
    });
    benchLine='<path d="'+bPath+'" fill="none" stroke="rgba(234,245,245,.3)" stroke-width="1.5" stroke-dasharray="4 3"/>';
  }

  // VYVE line
  var linePath='', dots='', labels='';
  valid.forEach(function(c,i){
    var x=xOf(i).toFixed(1), y=yOf(c.pct).toFixed(1);
    linePath+=(i===0?'M':'L')+x+','+y+' ';
    var above=c.benchmark!=null&&c.pct>=c.benchmark;
    var clr=above?'var(--success)':'var(--warning)';
    dots+='<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+clr+'" stroke="var(--bg)" stroke-width="2"><title>'+c.label+': VYVE '+c.pct+'% vs benchmark '+(c.benchmark||'?')+'% ('+c.retained+'/'+c.eligible+' eligible)</title></circle>';
    labels+='<text x="'+x+'" y="'+(parseFloat(y)-10)+'" text-anchor="middle" font-size="10" font-weight="600" fill="'+clr+'">'+c.pct+'%</text>';
    labels+='<text x="'+x+'" y="'+(PAD.t+cH+18)+'" text-anchor="middle" font-size="9" fill="var(--text-dim)">'+retEsc(c.label)+'</text>';
  });

  var svg='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:'+W+'px;display:block">'
    +grid+benchLine
    +'<path d="'+linePath+'" fill="none" stroke="var(--teal-lt)" stroke-width="2"/>'
    +dots+labels
    +'</svg>';

  // Data table below chart
  var table='<div class="table-wrap" style="margin-top:12px"><table class="data-table"><thead><tr>'
    +'<th>Milestone</th><th class="num">VYVE</th><th class="num">Benchmark</th><th class="num">vs benchmark</th><th class="num">Eligible</th><th class="num">Retained</th>'
    +'</tr></thead><tbody>';
  valid.forEach(function(c){
    var diff=c.benchmark!=null?c.pct-c.benchmark:null;
    var diffStr=diff==null?'—':(diff>=0?'<span style="color:var(--success)">+'+diff+'pp</span>':'<span style="color:var(--danger)">'+diff+'pp</span>');
    var lowConf=c.eligible<10?'<span title="Low confidence: n='+c.eligible+'" style="color:var(--warning)"> ⚠</span>':'';
    table+='<tr>'
      +'<td style="font-weight:600">'+retEsc(c.label)+'</td>'
      +'<td class="num" style="font-weight:700;color:'+(c.pct>=(c.benchmark||0)?'var(--success)':'var(--warning)')+'">'+c.pct+'%</td>'
      +'<td class="num" style="color:var(--text-dim)">'+(c.benchmark!=null?c.benchmark+'%':'—')+'</td>'
      +'<td class="num">'+diffStr+'</td>'
      +'<td class="num" style="color:var(--text-dim)">'+c.eligible+lowConf+'</td>'
      +'<td class="num">'+c.retained+'</td>'
      +'</tr>';
  });
  table+='</tbody></table></div>';

  // Legend
  var legend='<div style="display:flex;gap:16px;margin-top:10px;font-size:10px;color:var(--text-dim)">'
    +'<span>&#9632; <span style="color:var(--teal-lt)">VYVE retention</span></span>'
    +'<span>- - - <span style="color:rgba(234,245,245,.5)">Health app benchmark</span></span>'
    +'<span>&#9679; <span style="color:var(--success)">above benchmark</span> &nbsp; &#9679; <span style="color:var(--warning)">below benchmark</span></span>'
    +'</div>'
    +'<div style="margin-top:4px;font-size:10px;color:var(--text-dim)">Window ±2 days either side of each milestone. ⚠ = low confidence (n&lt;10).</div>';

  el.innerHTML = svg + table + legend;
}

// ── Streak analytics ──────────────────────────────────────────────────────────
function retRenderStreaks(s) {
  var el = document.getElementById('streak-body');
  if (!el) return;
  if (!s.active_count) { el.innerHTML = '<div class="empty-state">No streak data yet</div>'; return; }
  var dist = s.distribution || [];
  var maxCount = Math.max.apply(null, dist.map(function(d){return d.count;}));
  if (maxCount < 1) maxCount = 1;
  var distBars = dist.map(function(d) {
    var h = d.count > 0 ? Math.max(Math.round(d.count/maxCount*56), 4) : 2;
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'
      + '<div style="font-size:10px;font-weight:600;color:var(--text)">' + (d.count||0) + '</div>'
      + '<div style="width:100%;height:' + h + 'px;background:' + (d.count>0?'var(--teal)':'var(--surface-2)') + ';border-radius:2px 2px 0 0"></div>'
      + '<div style="font-size:9px;color:var(--text-dim);white-space:nowrap">' + retEsc(d.label) + '</div>'
      + '</div>';
  }).join('');
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">'
    + '<div class="stat-cell"><div class="stat-label">Avg current streak</div><div class="stat-value">' + (s.avg_current||0) + 'd</div><div class="stat-sub">active members only</div></div>'
    + '<div class="stat-cell"><div class="stat-label">Avg best ever</div><div class="stat-value">' + (s.avg_best||0) + 'd</div><div class="stat-sub">all members</div></div>'
    + '<div class="stat-cell"><div class="stat-label">Longest current</div><div class="stat-value">' + (s.max_current||0) + 'd</div><div class="stat-sub">\ud83d\udd25 leading member</div></div>'
    + '<div class="stat-cell"><div class="stat-label">On 7+ day streak</div><div class="stat-value">' + (s.streak_7plus||0) + '</div><div class="stat-sub">members right now</div></div>'
    + '</div>'
    + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">Best-ever streak distribution (days)</div>'
    + '<div style="display:flex;align-items:flex-end;gap:6px;height:72px">' + distBars + '</div>';
}

// ── Critical events (aha moment) ──────────────────────────────────────────────
function retRenderCriticalEvents(ce) {
  var el = document.getElementById('critical-body');
  if (!el) return;
  var events = ce.events || [];
  var r = ce.retained_count || 0, c = ce.churned_count || 0;
  if (!r && !c) { el.innerHTML = '<div class="empty-state">Not enough data yet — need members in both retained and churned groups</div>'; return; }
  var note = c < 5 ? '<div style="padding:8px 12px;background:var(--warning-pale);border-radius:8px;font-size:11px;color:var(--warning);margin-bottom:12px">Low confidence — only ' + c + ' churned member' + (c!==1?'s':'') + ' in sample. Treat as directional only.</div>' : '';
  var rows = events.map(function(ev) {
    var diff = ev.retained - ev.churned;
    var diffColor = diff > 10 ? 'var(--success)' : diff < -10 ? 'var(--danger)' : 'var(--text-dim)';
    var diffStr = diff > 0 ? '+' + diff + 'pp' : diff < 0 ? diff + 'pp' : '=';
    return '<tr>'
      + '<td style="font-size:12px">' + retEsc(ev.event) + '</td>'
      + '<td style="text-align:center"><span style="background:var(--success-pale);color:var(--success);border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600">' + ev.retained + '%</span></td>'
      + '<td style="text-align:center"><span style="background:var(--danger-pale);color:var(--danger);border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600">' + ev.churned + '%</span></td>'
      + '<td style="text-align:center;font-size:12px;font-weight:700;color:' + diffColor + '">' + diffStr + '</td>'
      + '</tr>';
  }).join('');
  el.innerHTML = note
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Retained: ' + r + ' members (active last 7d) &nbsp;·&nbsp; Churned: ' + c + ' (had activity, silent 30d+)</div>'
    + '<div class="table-wrap"><table class="data-table"><thead><tr><th>Week-1 behaviour</th><th style="text-align:center">Retained</th><th style="text-align:center">Churned</th><th style="text-align:center">Diff</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">pp = percentage points. Higher positive diff = stronger predictor of retention.</div>';
}

// ── Boot ───────────────────────────────────────────────────────────────────────
retLoadData();


// ── Re-engagement effectiveness ────────────────────────────────────────────────
function retRenderReengage(data) {
  var el = document.getElementById('reengage-body');
  if (!el || !data) return;
  if (!data.total_sent) { el.innerHTML = '<div class="empty-state">No re-engagement emails sent yet.</div>'; return; }
  var streams = data.by_stream || [];
  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">'
    + '<div class="stat-cell"><div class="stat-label">Emails sent (all time)</div><div class="stat-value">' + retFmt(data.total_sent) + '</div><div class="stat-sub">re-engagement streams</div></div>'
    + '<div class="stat-cell"><div class="stat-label">Returned within 7 days</div><div class="stat-value ok">' + retFmt(data.total_returned) + '</div><div class="stat-sub">logged at least 1 activity</div></div>'
    + '<div class="stat-cell"><div class="stat-label">Overall return rate</div><div class="stat-value ' + (data.overall_return_pct>=40?'ok':data.overall_return_pct>=20?'warn':'danger') + '">' + data.overall_return_pct + '%</div><div class="stat-sub">of all contacted members</div></div>'
    + '</div>';
  if (streams.length) {
    html += '<table class="data-table"><thead><tr><th>Stream</th><th class="num">Sent</th><th class="num">Returned (7d)</th><th class="num">Return rate</th><th>Reading</th></tr></thead><tbody>';
    streams.forEach(function(s) {
      var reading = s.return_pct >= 50 ? '<span class="pill pill-ok">Effective</span>'
        : s.return_pct >= 25 ? '<span class="pill pill-warn">Moderate</span>'
        : '<span class="pill pill-danger">Low</span>';
      html += '<tr>'
        + '<td style="font-weight:500">' + retEsc(s.label) + '</td>'
        + '<td class="num">' + s.sent + '</td>'
        + '<td class="num ok">' + s.returned + '</td>'
        + '<td class="num"><strong>' + s.return_pct + '%</strong></td>'
        + '<td>' + reading + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">Return = member had activity in the 7 days following the email. Stream A = inactive 7+ days. Stream B = inactive 30+ days.</div>';
  el.innerHTML = html;
}
function retFmt(n) { return n == null ? '—' : Number(n).toLocaleString(); }
