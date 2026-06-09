// PM-569 v1 — Usage Analytics: cc-usage cache reader
// External file — required by §23.101 (router injectPage re-executes scripts;
// inline JS with template literals breaks on replaceChild)

// ── Config ──────────────────────────────────────────────────────────────────
const USAGE_SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const USAGE_SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
const USAGE_EF_BASE = USAGE_SB_URL + '/functions/v1';

// ── State ────────────────────────────────────────────────────────────────────
let _usageData       = null;   // full cache payload
let _membersAll      = [];     // full member_stats list
let _membersFiltered = [];     // after search/filter
// Sort persisted to localStorage
let _membersSort = (function() {
  try {
    var s = localStorage.getItem('vyve_cc_usage_sort');
    if (s) return JSON.parse(s);
  } catch(_) {}
  return { col: 'engagement_score', dir: -1 };
})();
let _membersPage     = 0;
const MEMBERS_PER_PAGE = 25;
let _todayMap        = {};     // email -> today_acts (live, not from cache)

// ── Theme ────────────────────────────────────────────────────────────────────
function usageApplyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const dk = document.getElementById('theme-icon-dark');
  const lt = document.getElementById('theme-icon-light');
  if (dk) dk.style.display = t === 'dark' ? '' : 'none';
  if (lt) lt.style.display = t === 'light' ? '' : 'none';
  localStorage.setItem('vyve_cc_theme', t);
}
function usageToggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  usageApplyTheme(cur === 'dark' ? 'light' : 'dark');
}
(function() {
  const saved = localStorage.getItem('vyve_cc_theme') || 'dark';
  usageApplyTheme(saved);
})();

// ── Toast ────────────────────────────────────────────────────────────────────
let _toastTimer;
function usageToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function usageGetJwt() {
  try {
    const raw = localStorage.getItem('vyve-cc-supabase-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const at = parsed?.access_token
        || parsed?.data?.session?.access_token
        || parsed?.session?.access_token;
      if (at) return at;
    }
  } catch (_) {}
  if (window.VYVE_SUPABASE) {
    try {
      const { data } = await window.VYVE_SUPABASE.client().auth.getSession();
      if (data?.session?.access_token) return data.session.access_token;
    } catch (_) {}
  }
  return null;
}

// ── Supabase REST ────────────────────────────────────────────────────────────
async function usageSbGet(path, params) {
  const jwt = await usageGetJwt();
  const url = new URL(USAGE_SB_URL + '/rest/v1/' + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'apikey': USAGE_SB_ANON,
      'Authorization': 'Bearer ' + (jwt || USAGE_SB_ANON),
      'Accept': 'application/json',
    }
  });
  if (!res.ok) throw new Error('Supabase ' + res.status);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function usageEsc(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function usageTimeAgo(ts) {
  if (!ts) return '—';
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000)    return 'just now';
  if (d < 3600000)  return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
  return Math.floor(d / 86400000) + 'd ago';
}
function usageSetEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function usageScoreClass(s) {
  if (s >= 60) return 'score-high';
  if (s >= 35) return 'score-mid';
  return 'score-low';
}
function usageDormancyStatus(lastAt) {
  if (!lastAt) return '<span class="pill pill-danger">Never active</span>';
  const days = (Date.now() - new Date(lastAt).getTime()) / 86400000;
  if (days <= 7)  return '<span class="pill pill-ok">Active</span>';
  if (days <= 30) return '<span class="pill pill-warn">Quiet</span>';
  return '<span class="pill pill-danger">Inactive</span>';
}
function usagePct(val, total) {
  if (!total) return 0;
  return Math.round((val / total) * 100);
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function usageTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById('tab-' + name);
  if (pane) pane.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Load from cache ───────────────────────────────────────────────────────────
async function usageLoadData() {
  try {
    const rows = await usageSbGet('cc_usage', {
      'select': '*',
      'id': 'eq.1',
    });
    const row = rows && rows[0];
    if (!row) {
      usageShowNoCacheState();
      return;
    }
    _usageData = row;
    usageRenderAll(row);
  } catch (e) {
    console.error('Usage load error:', e);
    usageSetEl('refresh-text', 'Load failed — check console');
  }
}

function usageShowNoCacheState() {
  usageSetEl('refresh-text', 'Cache empty — click Refresh now');
  const ids = ['daily-chart-wrap','wow-body','company-body','members-tbody'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="empty-state">Cache not yet populated — click Refresh now to build it.</div>';
  });
}

// ── Trigger EF refresh ────────────────────────────────────────────────────────
async function usageRefresh() {
  const btn = document.getElementById('btn-refresh');
  if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }
  usageSetEl('refresh-text', 'Refreshing…');
  try {
    const jwt = await usageGetJwt();
    const res = await fetch(USAGE_EF_BASE + '/cc-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': USAGE_SB_ANON,
        'Authorization': 'Bearer ' + (jwt || USAGE_SB_ANON),
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.ok) {
      usageToast('Refreshed — reloading data…');
      await usageLoadData();
    } else {
      usageToast('Refresh failed: ' + (data.error || 'unknown'));
    }
  } catch (e) {
    usageToast('Refresh error: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Refresh now'; }
  }
}

// ── Render all ────────────────────────────────────────────────────────────────
function usageRenderAll(row) {
  const ts = row.refreshed_at;
  const ago = usageTimeAgo(ts);
  usageSetEl('refresh-text', 'Refreshed ' + ago);
  usageSetEl('overview-refreshed', ts ? new Date(ts).toLocaleString('en-GB') : '—');

  const hl  = row.headline_json || {};
  const ov  = row.overview_json || {};
  const mem = row.members_json  || [];
  const co  = row.company_json  || [];

  usageRenderHeadline(hl, ov, mem);
  usageRenderOverviewChart(ov);
  usageRenderBreakdown(ov);
  usageRenderWoW(ov);
  usageRenderCompany(co);
  usageRenderMembers(mem);
}

// ── Headline ─────────────────────────────────────────────────────────────────
function usageRenderHeadline(hl, ov, mem) {
  const total = hl.total_members || 0;
  usageSetEl('hl-total', total);
  usageSetEl('hl-total-sub', 'as of ' + (hl.metric_date || '—'));
  usageSetEl('hl-active7',  hl.active_users_7d  || '—');
  usageSetEl('hl-active30', hl.active_users_30d || '—');

  // Stickiness: DAU/MAU — compute from last 30d daily series if available
  const series = ov.daily_series || [];
  if (series.length >= 7) {
    const last7 = series.slice(-7);
    const avgDau = last7.reduce((s, r) => s + (r.dau || 0), 0) / last7.length;
    const mau = hl.active_users_30d || 1;
    usageSetEl('hl-stickiness', mau ? (avgDau / mau * 100).toFixed(0) + '%' : '—');
  } else {
    usageSetEl('hl-stickiness', '—');
  }

  // Activities 7d — sum from last 7 rows of daily series
  if (series.length) {
    const last7 = series.slice(-7);
    const acts7 = last7.reduce((s, r) => s + (r.total || 0), 0);
    usageSetEl('hl-acts7', acts7);
  } else if (hl.total_activities) {
    usageSetEl('hl-acts7', '—');
  }

  // At risk count from member_stats
  const atRisk = mem.filter(m => m.at_risk).length;
  usageSetEl('hl-atrisk', atRisk);
}

// ── Overview chart (30-day bar chart) ────────────────────────────────────────
function usageRenderOverviewChart(ov) {
  const wrap = document.getElementById('daily-chart-wrap');
  if (!wrap) return;
  const series = ov.daily_series || [];
  if (!series.length) {
    wrap.innerHTML = '<div class="empty-state">No daily activity data yet</div>';
    return;
  }
  const maxVal = Math.max(...series.map(r => r.total || 0), 1);
  const bars   = series.map(r => {
    const h = Math.max(Math.round(((r.total || 0) / maxVal) * 64), 2);
    const d = r.date ? r.date.slice(5) : '';  // MM-DD
    return '<div class="chart-bar" style="height:' + h + 'px" title="' + usageEsc(r.date) + ': ' + (r.total || 0) + ' activities"></div>';
  }).join('');
  // Label every ~7 bars
  const labels = series.map((r, i) => {
    const d = r.date ? r.date.slice(5) : '';
    const show = i === 0 || i === series.length - 1 || i % 7 === 0;
    return '<div class="chart-label">' + (show ? usageEsc(d) : '') + '</div>';
  }).join('');
  wrap.innerHTML = '<div class="chart-bars">' + bars + '</div><div class="chart-labels">' + labels + '</div>';
}

// ── Activity breakdown (7d sums) ─────────────────────────────────────────────
function usageRenderBreakdown(ov) {
  const series = ov.daily_series || [];
  const last7  = series.slice(-7);
  const sum    = (key) => last7.reduce((s, r) => s + (r[key] || 0), 0);
  usageSetEl('bk-habits',   sum('habits'));
  usageSetEl('bk-workouts', sum('workouts'));
  usageSetEl('bk-cardio',   sum('cardio'));
  usageSetEl('bk-sessions', sum('sessions'));
  usageSetEl('bk-checkins', sum('checkins'));
  usageSetEl('bk-replays',  sum('replays'));
}

// ── Week-on-week ──────────────────────────────────────────────────────────────
function usageRenderWoW(ov) {
  const el = document.getElementById('wow-body');
  if (!el) return;
  const series = ov.daily_series || [];
  if (series.length < 14) {
    el.innerHTML = '<div class="empty-state">Need at least 14 days of data for week comparison</div>';
    return;
  }
  const thisWeek = series.slice(-7).reduce((s, r) => s + (r.total || 0), 0);
  const prevWeek = series.slice(-14, -7).reduce((s, r) => s + (r.total || 0), 0);
  const delta    = thisWeek - prevWeek;
  const pct      = prevWeek ? Math.round((delta / prevWeek) * 100) : 0;
  const arrow    = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
  const cls      = delta > 0 ? 'success' : delta < 0 ? 'danger' : 'text-dim';

  // By type
  const types = ['habits', 'workouts', 'cardio', 'sessions', 'checkins', 'replays'];
  const typeRows = types.map(t => {
    const tw = series.slice(-7).reduce((s, r) => s + (r[t] || 0), 0);
    const pw = series.slice(-14, -7).reduce((s, r) => s + (r[t] || 0), 0);
    const d  = tw - pw;
    const p  = pw ? Math.round((d / pw) * 100) : 0;
    const a  = d > 0 ? '▲' : d < 0 ? '▼' : '=';
    const c  = d > 0 ? 'var(--success)' : d < 0 ? 'var(--danger)' : 'var(--text-dim)';
    return '<tr><td>' + usageEsc(t.charAt(0).toUpperCase() + t.slice(1)) + '</td>'
      + '<td class="num">' + pw + '</td>'
      + '<td class="num">' + tw + '</td>'
      + '<td class="num" style="color:' + c + '">' + a + ' ' + Math.abs(p) + '%</td></tr>';
  }).join('');

  el.innerHTML = '<div style="margin-bottom:12px;font-size:13px">'
    + 'This week: <strong>' + thisWeek + '</strong> activities &nbsp;'
    + '<span style="color:var(--' + cls + ')">' + arrow + ' ' + Math.abs(pct) + '% vs last week</span>'
    + '</div>'
    + '<div class="table-wrap"><table class="data-table"><thead><tr>'
    + '<th>Type</th><th>Last 7d</th><th>This 7d</th><th>Change</th>'
    + '</tr></thead><tbody>' + typeRows + '</tbody></table></div>';
}

// ── Company breakdown ─────────────────────────────────────────────────────────
function usageRenderCompany(companies) {
  const el = document.getElementById('company-body');
  if (!el) return;
  if (!companies || !companies.length) {
    el.innerHTML = '<div class="empty-state">No company data yet — company_summary populates when employer members are set up.</div>';
    return;
  }
  const rows = companies.map(c => {
    const actRate = c.member_count ? Math.round((c.active_30d / c.member_count) * 100) : 0;
    return '<tr>'
      + '<td><strong>' + usageEsc(c.company || '—') + '</strong></td>'
      + '<td class="num">' + (c.member_count || 0) + '</td>'
      + '<td class="num">' + (c.active_7d || 0) + '</td>'
      + '<td class="num">' + (c.active_30d || 0) + '</td>'
      + '<td class="num">'
        + '<div class="act-bar-wrap">'
        + '<div class="act-bar-bg"><div class="act-bar-fill" style="width:' + actRate + '%"></div></div>'
        + '<span style="width:30px;text-align:right">' + actRate + '%</span>'
        + '</div></td>'
      + '<td class="num">' + (c.avg_engagement_score ? Math.round(c.avg_engagement_score) : '—') + '</td>'
      + '<td class="num">' + (c.at_risk_count || 0) + (c.at_risk_count > 0 ? ' <span class="pill pill-warn">' + c.at_risk_count + '</span>' : '') + '</td>'
      + '</tr>';
  }).join('');
  el.innerHTML = '<div class="table-wrap"><table class="data-table">'
    + '<thead><tr><th>Company</th><th>Members</th><th>Active 7d</th><th>Active 30d</th><th>30d rate</th><th>Avg score</th><th>At risk</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

// ── Members table ─────────────────────────────────────────────────────────────
function usageRenderMembers(mem) {
  _membersAll  = mem || [];
  _membersPage = 0;
  // Apply filter immediately (respects exclude-test default)
  usageFilterMembers();
}

function usageFilterMembers() {
  const q          = (document.getElementById('member-search')?.value || '').toLowerCase();
  const filter     = document.getElementById('member-filter-risk')?.value || '';
  const excTest    = document.getElementById('member-excl-test')?.checked !== false; // default true
  _membersFiltered = _membersAll.filter(m => {
    if (excTest && m.is_test) return false;
    const matchText = !q || (m.member_email || '').toLowerCase().includes(q);
    const matchFilter = !filter
      || (filter === 'at_risk' && m.at_risk)
      || (filter === 'needs_support' && m.needs_support)
      || (filter === 'active' && m.activities_7d > 0)
      || (filter === 'inactive' && (!m.last_activity_at || (Date.now() - new Date(m.last_activity_at).getTime()) > 30 * 86400000));
    return matchText && matchFilter;
  });
  _membersPage = 0;
  usageApplySortMembers();
  usageRenderMembersPage();
}

function usageSortMembers(col) {
  if (_membersSort.col === col) {
    _membersSort.dir *= -1;
  } else {
    _membersSort.col = col;
    _membersSort.dir = col === 'email' ? 1 : -1;
  }
  // Update header highlight
  document.querySelectorAll('#members-table th').forEach(th => th.classList.remove('sorted'));
  const cols = ['email','engagement_score','activities_7d','activities_30d','active_days_30d','last_activity_at','current_programme'];
  const idx = cols.indexOf(col);
  const ths = document.querySelectorAll('#members-table th');
  if (ths[idx]) ths[idx].classList.add('sorted');
  _membersPage = 0;
  try { localStorage.setItem('vyve_cc_usage_sort', JSON.stringify(_membersSort)); } catch(_) {}
  usageApplySortMembers();
  usageRenderMembersPage();
}

function usageApplySortMembers() {
  const { col, dir } = _membersSort;
  _membersFiltered.sort((a, b) => {
    let va = a[col], vb = b[col];
    if (va == null) va = col === 'email' ? 'zzz' : -1;
    if (vb == null) vb = col === 'email' ? 'zzz' : -1;
    if (typeof va === 'string') return va.localeCompare(vb) * dir;
    return (va - vb) * dir;
  });
}

function usageMembersPage(delta) {
  const maxPage = Math.ceil(_membersFiltered.length / MEMBERS_PER_PAGE) - 1;
  _membersPage = Math.max(0, Math.min(_membersPage + delta, maxPage));
  usageRenderMembersPage();
}

function usageRenderMembersPage() {
  const tbody    = document.getElementById('members-tbody');
  const countLbl = document.getElementById('member-count-label');
  const pgInfo   = document.getElementById('members-page-info');
  const prev     = document.getElementById('members-prev');
  const next     = document.getElementById('members-next');
  const pg       = document.getElementById('members-pagination');

  if (!tbody) return;

  const total  = _membersFiltered.length;
  const pages  = Math.ceil(total / MEMBERS_PER_PAGE);
  const start  = _membersPage * MEMBERS_PER_PAGE;
  const slice  = _membersFiltered.slice(start, start + MEMBERS_PER_PAGE);

  if (countLbl) countLbl.textContent = total + ' member' + (total !== 1 ? 's' : '');

  if (!total) {
    tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state">No members match this filter</div></td></tr>';
    if (pg) pg.style.display = 'none';
    return;
  }

  tbody.innerHTML = slice.map(m => {
    const score    = m.engagement_score || 0;
    const persona  = m.persona || '—';
    const prog     = m.current_programme ? m.current_programme.replace(/\s*\(.*\)/, '') : '—';
    const email    = m.member_email || '—';
    const fullName = ((m.first_name || '') + ' ' + (m.last_name || '')).trim();
    const initials = fullName ? (fullName.split(' ').map(function(n){return n[0]||'';}).join('').toUpperCase().slice(0,2)) : email.slice(0,2).toUpperCase();
    const maxActs  = Math.max(..._membersAll.map(x => x.activities_30d || 0), 1);
    const barW     = usagePct(m.activities_30d || 0, maxActs);

    return '<tr style="cursor:pointer" onclick="usageOpen360(\'' + usageEsc(email) + '\')">'
      + '<td><div style="display:flex;align-items:center;gap:8px">'
      + '<div style="width:32px;height:32px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">' + usageEsc(initials) + '</div>'
      + '<div><div style="font-size:12px;font-weight:600;color:var(--text)">' + (fullName ? usageEsc(fullName) : '<span style=\'color:var(--text-muted)\'>' + usageEsc(email) + '</span>') + (m.at_risk ? ' <span class=\'pill pill-warn\' style=\'font-size:9px\'>risk</span>' : '') + (m.needs_support ? ' <span class=\'pill pill-danger\' style=\'font-size:9px\'>support</span>' : '') + '</div>'
      + (fullName ? '<div style="font-size:10px;color:var(--text-dim)">' + usageEsc(email) + '</div>' : '')
      + '</div></div></td>'
      + '<td class="num"><div class="score-ring ' + usageScoreClass(score) + '">' + score + '</div></td>'
      + '<td class="num">' + ((_todayMap[m.member_email] || 0) > 0 ? '<strong style="color:var(--success)">' + _todayMap[m.member_email] + '</strong>' : '<span style="color:var(--text-dim)">0</span>') + '</td>'
      + '<td class="num">' + (m.activities_7d || 0) + '</td>'
      + '<td class="num"><div class="act-bar-wrap"><div class="act-bar-bg"><div class="act-bar-fill" style="width:' + barW + '%"></div></div>' + (m.activities_30d || 0) + '</div></td>'
      + '<td class="num">' + (m.active_days_30d || 0) + '</td>'
      + '<td class="muted">' + usageTimeAgo(m.last_activity_at) + '</td>'
      + '<td class="dim">' + usageEsc(prog) + '</td>'
      + '<td><span class="persona-badge persona-' + usageEsc(persona) + '">' + usageEsc(persona) + '</span></td>'
      + '<td>' + usageDormancyStatus(m.last_activity_at) + '</td>'
      + '</tr>';
  }).join('');

  // Pagination
  if (pages > 1) {
    if (pg) pg.style.display = 'flex';
    if (pgInfo) pgInfo.textContent = 'Page ' + (_membersPage + 1) + ' of ' + pages + ' (' + total + ' members)';
    if (prev) prev.disabled = _membersPage === 0;
    if (next) next.disabled = _membersPage >= pages - 1;
  } else {
    if (pg) pg.style.display = 'none';
  }
}

// ── Member 360 ────────────────────────────────────────────────────────────────
function usageOpen360(email) {
  const modal = document.getElementById('m360-modal');
  const title = document.getElementById('m360-title');
  const sub   = document.getElementById('m360-sub');
  const body  = document.getElementById('m360-body');
  if (!modal) return;

  const m = _membersAll.find(x => x.member_email === email);
  if (!m) return;

  title.textContent = email;
  sub.textContent   = (m.current_programme || 'No programme') + ' · joined ' + (m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-GB') : '—');
  modal.classList.remove('hidden');

  const score    = m.engagement_score || 0;
  const scoreCls = usageScoreClass(score);

  // Show summary tab immediately from cache, load activity log async
  body.innerHTML = usageBuild360Summary(m) + '<div id="m360-log-section"><div class="loading-row" style="margin-top:16px"></div></div>';

  // Fetch activity log async
  usageLoadMemberLog(email);
}

async function usageLoadMemberLog(email) {
  // Inline to avoid const hoisting/scope issues with router replaceChild
  var ACT_ICONS  = { habit:'🟢', workout:'💪', cardio:'🏃', session:'📺', replay:'▶️', checkin:'📋', monthly_checkin:'📋', mind:'🧠', default:'·' };
  var ACT_LABELS = { habit:'Habit', workout:'Workout', cardio:'Cardio', session:'Live session', replay:'Replay', checkin:'Check-in', monthly_checkin:'Monthly check-in', mind:'Mind' };
  var logSection = document.getElementById('m360-log-section');
  if (!logSection) return;
  try {
    const jwt = await usageGetJwt();
    const res = await fetch(USAGE_EF_BASE + '/cc-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': USAGE_SB_ANON, 'Authorization': 'Bearer ' + (jwt || USAGE_SB_ANON) },
      body: JSON.stringify({ action: 'member_detail', email: email })
    });
    const data = await res.json();
    if (!data.ok) { logSection.innerHTML = '<div class="empty-state">Could not load activity log</div>'; return; }
    const log = data.log || [];
    if (!log.length) { logSection.innerHTML = '<div class="empty-state" style="margin-top:16px">No activity logged yet</div>'; return; }
    // Group by date
    const byDate = {};
    log.forEach(function(r) {
      var d = r.activity_date || r.logged_at?.slice(0,10) || '—';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(r);
    });
    var html = '<div class="modal-section" style="margin-top:16px"><div class="modal-section-title">Activity log — last 60</div>';
    Object.keys(byDate).sort().reverse().forEach(function(date) {
      html += '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">' + usageEsc(date) + '</div>';
      byDate[date].forEach(function(r) {
        var icon  = ACT_ICONS[r.activity_type] || ACT_ICONS.default;
        var label = ACT_LABELS[r.activity_type] || r.activity_type;
        var detail = r.activity_label && r.activity_label !== 'Daily habit' ? ' — ' + usageEsc(r.activity_label) : '';
        var meta  = (function(type, m) {
          if (!m) return '';
          var parts = [];
          if (m.cardio_type) parts.push(m.cardio_type);
          if (m.duration_minutes) parts.push(m.duration_minutes + ' min');
          if (m.distance_km) parts.push(m.distance_km + ' km');
          if (m.watch_seconds) parts.push(Math.round(m.watch_seconds/60) + ' min watched');
          if (m.pct_watched) parts.push(Math.round(m.pct_watched) + '%');
          if (m.avg_score) parts.push('score ' + parseFloat(m.avg_score).toFixed(1));
          return parts.join(' · ');
        })(r.activity_type, r.metadata);
        var time  = r.logged_at ? new Date(r.logged_at).toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}) : '';
        html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">'
          + '<span style="font-size:13px;flex-shrink:0">' + icon + '</span>'
          + '<div style="flex:1;min-width:0"><span style="font-size:12px;font-weight:500;color:var(--text)">' + usageEsc(label) + usageEsc(detail) + '</span>'
          + (meta ? '<span style="font-size:11px;color:var(--text-dim);margin-left:6px">' + usageEsc(meta) + '</span>' : '')
          + '</div>'
          + '<span style="font-size:10px;color:var(--text-dim);flex-shrink:0">' + usageEsc(time) + '</span>'
          + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
    logSection.innerHTML = html;
  } catch(e) {
    if (logSection) logSection.innerHTML = '<div class="empty-state">Error loading log: ' + usageEsc(e.message) + '</div>';
  }
}

function usageBuild360Summary(m) {
  var score    = m.engagement_score || 0;
  var scoreCls = usageScoreClass(score);
  return '<div class="modal-section">'
    + '<div class="modal-section-title">Profile</div>'
    + '<div class="meta-grid">'
    + '<div class="meta-row"><div class="meta-label">Persona</div><div class="meta-value"><span class="persona-badge persona-' + usageEsc(m.persona || '') + '">' + usageEsc(m.persona || '—') + '</span></div></div>'
    + '<div class="meta-row"><div class="meta-label">Programme</div><div class="meta-value">' + usageEsc(m.current_programme || '—') + '</div></div>'
    + '<div class="meta-row"><div class="meta-label">Programme week</div><div class="meta-value">' + (m.programme_week || '—') + (m.programme_active ? '' : ' <span class="pill pill-grey">paused</span>') + '</div></div>'
    + '<div class="meta-row"><div class="meta-label">At risk</div><div class="meta-value">' + (m.at_risk ? '<span class="pill pill-warn">Yes</span>' : '<span class="pill pill-ok">No</span>') + '</div></div>'
    + '<div class="meta-row"><div class="meta-label">Needs support</div><div class="meta-value">' + (m.needs_support ? '<span class="pill pill-danger">Yes</span>' : '<span class="pill pill-ok">No</span>') + '</div></div>'
    + '<div class="meta-row"><div class="meta-label">Certs earned</div><div class="meta-value">' + (m.cert_count || 0) + '</div></div>'
    + '</div></div>'

    + '<div class="modal-section">'
    + '<div class="modal-section-title">Engagement score</div>'
    + '<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">'
    + '<div class="score-ring ' + scoreCls + '" style="width:48px;height:48px;font-size:16px">' + score + '</div>'
    + '<div style="flex:1">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Component breakdown (max 25 each)</div>'
    + usageScoreBar('Activity', m.activity_score)
    + usageScoreBar('Consistency', m.consistency_score)
    + usageScoreBar('Variety', m.variety_score)
    + usageScoreBar('Wellbeing', m.wellbeing_score_component)
    + '</div></div></div>'

    + '<div class="modal-section">'
    + '<div class="modal-section-title">Activity totals</div>'
    + '<div class="act-type-grid">'
    + usageActCell('Total', m.total_activities)
    + usageActCell('7 days', m.activities_7d)
    + usageActCell('30 days', m.activities_30d)
    + usageActCell('90 days', m.activities_90d)
    + usageActCell('Active days (30d)', m.active_days_30d)
    + usageActCell('Distinct types (7d)', m.distinct_types_7d)
    + '</div></div>'

    + '<div class="modal-section">'
    + '<div class="modal-section-title">Latest signals</div>'
    + '<div class="meta-grid">'
    + '<div class="meta-row"><div class="meta-label">Last activity</div><div class="meta-value">' + usageTimeAgo(m.last_activity_at) + '</div></div>'
    + '<div class="meta-row"><div class="meta-label">Last type</div><div class="meta-value">' + usageEsc(m.last_activity_type || '—') + '</div></div>'
    + '<div class="meta-row"><div class="meta-label">Wellbeing score</div><div class="meta-value">' + (m.latest_wellbeing_score || '—') + '/10</div></div>'
    + '<div class="meta-row"><div class="meta-label">Stress score</div><div class="meta-value">' + (m.latest_stress_score || '—') + '/10</div></div>'
    + '<div class="meta-row"><div class="meta-label">Energy score</div><div class="meta-value">' + (m.latest_energy_score || '—') + '/10</div></div>'
    + '<div class="meta-row"><div class="meta-label">Weight</div><div class="meta-value">' + (m.latest_weight_kg ? m.latest_weight_kg + ' kg' : '—') + '</div></div>'
    + '</div></div>';
}

function usageScoreBar(label, val) {
  const v = Math.min(Math.round(Number(val) || 0), 25);
  const w = Math.round((v / 25) * 100);
  return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
    + '<div style="width:80px;font-size:10px;color:var(--text-dim)">' + usageEsc(label) + '</div>'
    + '<div style="flex:1;height:4px;background:var(--surface-2);border-radius:2px">'
    + '<div style="width:' + w + '%;height:4px;background:var(--teal-lt);border-radius:2px"></div></div>'
    + '<div style="width:24px;text-align:right;font-size:11px;font-weight:600;color:var(--text)">' + v + '</div>'
    + '</div>';
}

function usageActCell(label, val) {
  return '<div class="act-type-cell">'
    + '<div class="act-type-num">' + (val || 0) + '</div>'
    + '<div class="act-type-label">' + usageEsc(label) + '</div>'
    + '</div>';
}

function usageCloseModal(e) {
  if (!e || e.target === document.getElementById('m360-modal')) {
    const modal = document.getElementById('m360-modal');
    if (modal) modal.classList.add('hidden');
  }
}

// ── Never-active email modal ──────────────────────────────────────────────────────────
function usageShowNeverActive() {
  const neverActive = _membersAll.filter(m => {
    const excTest = document.getElementById('member-excl-test')?.checked !== false;
    if (excTest && m.is_test) return false;
    return !m.last_activity_at && m.total_activities === 0;
  });

  const modal   = document.getElementById('never-active-modal');
  const list    = document.getElementById('na-list');
  const sendBtn = document.getElementById('na-send-btn');
  const status  = document.getElementById('na-status');
  if (!modal) return;

  status.textContent = '';
  sendBtn.disabled = false;
  sendBtn.textContent = 'Send re-engagement email to all (' + neverActive.length + ')';

  list.innerHTML = neverActive.length
    ? neverActive.map(m => {
        const daysSince = m.joined_at
          ? Math.floor((Date.now() - new Date(m.joined_at).getTime()) / 86400000)
          : '?';
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">'
          + '<span style="font-size:12px">' + usageEsc(m.member_email) + '</span>'
          + '<span style="font-size:11px;color:var(--text-dim)">joined ' + daysSince + 'd ago</span>'
          + '</div>';
      }).join('')
    : '<div class="empty-state">No never-active members matching current filter</div>';

  modal.classList.remove('hidden');
  window._neverActiveList = neverActive;
}

function usageCloseNeverActive(e) {
  if (!e || e.target === document.getElementById('never-active-modal')) {
    document.getElementById('never-active-modal')?.classList.add('hidden');
  }
}

async function usageSendNeverActive() {
  const list    = window._neverActiveList || [];
  const sendBtn = document.getElementById('na-send-btn');
  const status  = document.getElementById('na-status');
  if (!list.length) return;

  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending…';
  status.textContent = '';

  try {
    const jwt = await usageGetJwt();
    const res = await fetch(USAGE_EF_BASE + '/cc-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': USAGE_SB_ANON,
        'Authorization': 'Bearer ' + (jwt || USAGE_SB_ANON),
      },
      body: JSON.stringify({ action: 'send_never_active', emails: list.map(m => m.member_email) }),
    });
    const data = await res.json();
    if (data.ok) {
      status.textContent = '✓ Sent to ' + (data.sent || list.length) + ' members';
      status.style.color = 'var(--success)';
      sendBtn.textContent = 'Done';
    } else {
      status.textContent = 'Error: ' + (data.error || 'unknown');
      status.style.color = 'var(--danger)';
      sendBtn.disabled = false;
      sendBtn.textContent = 'Retry';
    }
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
    status.style.color = 'var(--danger)';
    sendBtn.disabled = false;
    sendBtn.textContent = 'Retry';
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(function usageBoot() {
  usageLoadData();
  usageLoadToday();
})();
