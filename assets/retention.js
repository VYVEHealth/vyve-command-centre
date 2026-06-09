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

// ── Boot ───────────────────────────────────────────────────────────────────────
retLoadData();
