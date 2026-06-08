
// ── Config ──────────────────────────────────────────────────────────────────
const SB_URL = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
const EF_BASE = SB_URL + '/functions/v1';

// ── Theme ───────────────────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-icon-dark').style.display = t === 'dark' ? '' : 'none';
  document.getElementById('theme-icon-light').style.display = t === 'light' ? '' : 'none';
  localStorage.setItem('vyve_cc_theme', t);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
(function initTheme() {
  const saved = localStorage.getItem('vyve_cc_theme') || 'dark';
  applyTheme(saved);
})();

// ── Toast ───────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Auth: get JWT from Supabase session ─────────────────────────────────────
async function getJwt() {
  // CC uses storageKey 'vyve-cc-supabase-auth'
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
  // Fallback: use VYVE_SUPABASE client if available
  if (window.VYVE_SUPABASE) {
    try {
      const { data } = await window.VYVE_SUPABASE.client().auth.getSession();
      if (data?.session?.access_token) return data.session.access_token;
    } catch (_) {}
  }
  return null;
}

// ── Supabase REST helper ────────────────────────────────────────────────────
async function sbGet(path, params) {
  const jwt = await getJwt();
  const url = new URL(SB_URL + '/rest/v1/' + path);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'apikey': SB_ANON,
      'Authorization': 'Bearer ' + (jwt || SB_ANON),
      'Accept': 'application/json',
    }
  });
  if (!res.ok) throw new Error('Supabase error ' + res.status);
  return res.json();
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Render functions ────────────────────────────────────────────────────────
function renderErrors(rows, containerId, isLive) {
  const el = document.getElementById(containerId);
  if (!rows || !rows.length) {
    el.innerHTML = '<div class="empty-state"><div class="ok-icon">✓</div>No ' + 
      (isLive ? 'active problems right now' : 'settled errors to show') + '</div>';
    return;
  }

  el.innerHTML = rows.map(r => {
    const sev = r.severity || 'high';
    const rowClass = isLive ? (sev === 'critical' ? 'live' : 'warning') : 'settled';
    const icon = sev === 'critical' ? '🔴' : sev === 'high' ? '🟡' : '⚪';
    const lastSeen = r.last_seen ? timeAgo(r.last_seen) : '—';
    const members = Number(r.members_hit) || 0;
    const occ = Number(r.occurrences) || 0;
    const memberLabel = members === 1 ? '1 member' : members + ' members';
    const occLabel = occ === 1 ? '1 time' : occ + ' times';
    const fp = escHtml(r.fingerprint);

    return `
      <div class="error-row ${escHtml(rowClass)}" data-fingerprint="${fp}" style="cursor:pointer" onclick="openDetail('${fp}','${escHtml(r.type)}','${escHtml(sev)}')">
        <div class="error-icon">${icon}</div>
        <div class="error-body">
          <div class="error-type">${escHtml(r.type)}</div>
          <div class="error-stats">
            <span>Hit <strong>${escHtml(memberLabel)}</strong></span>
            <span>Fired <strong>${escHtml(occLabel)}</strong></span>
            <span>First seen <strong>${r.first_seen ? timeAgo(r.first_seen) : '—'}</strong></span>
            <span>Last seen <strong>${escHtml(lastSeen)}</strong></span>
            ${r.page ? '<span>Page: <strong>' + escHtml(r.page) + '</strong></span>' : ''}
          </div>
        </div>
        <div class="error-actions" onclick="event.stopPropagation()">
          ${!r.resolved ? `<button class="btn-danger-sm" onclick="resolveGroup('${fp}',this)">Mark resolved</button>` : '<span class="pill pill-grey" style="font-size:10px">Resolved</span>'}
        </div>
      </div>`;
  }).join('');
}

function renderUsage(data) {
  const el = document.getElementById('usage-body');
  const pages = data?.top_pages || [];
  if (!pages.length) {
    el.innerHTML = '<div class="empty-state">No page view data yet — PostHog key may not be set</div>';
    return;
  }
  _allPages = pages;
  _usagePage = 0;
  renderUsagePage();
  // dead pages handled below — skip old table render
  if (false) {

  } // end if(false)
  const dead = data?.dead_pages || [];
  const dp = document.getElementById('dead-pages-body');
  if (!dead.length) {
    dp.innerHTML = '<div class="empty-state" style="padding:16px 0">All known pages have been opened this week.</div>';
  } else {
    dp.innerHTML = '<div class="dead-page-list">' + 
      dead.map(p => `<span class="dead-page-chip">${escHtml(p)}</span>`).join('') + 
      '</div>';
  }
}

function renderPerf(data) {
  const el = document.getElementById('perf-body');
  const rows = data?.load_times || [];
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No load time data yet — perf.js may not be collecting data from members</div>';
    return;
  }
  const maxMs = Math.max(...rows.map(r => r.avg_ms), 1);
  el.innerHTML = '<table class="data-table"><thead><tr>' +
    '<th>Page</th><th class="num">Avg load (ms)</th><th class="num">Samples</th><th style="min-width:120px">Speed</th>' +
    '</tr></thead><tbody>' +
    rows.map(r => {
      const pct = Math.round((r.avg_ms / maxMs) * 100);
      const cls = r.avg_ms > 3000 ? 'very-slow' : r.avg_ms > 1500 ? 'slow' : '';
      return `<tr>
        <td class="page-name">${escHtml(r.page || '—')}</td>
        <td class="num" style="color:${r.avg_ms > 3000 ? 'var(--danger)' : r.avg_ms > 1500 ? 'var(--warning)' : 'var(--success)'}">${r.avg_ms}</td>
        <td class="num">${r.samples}</td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill ${escHtml(cls)}" style="width:${pct}%"></div></div></div></td>
      </tr>`;
    }).join('') + '</tbody></table>';
}

// ── Resolve error group ─────────────────────────────────────────────────────
async function resolveGroup(fingerprint, btn) {
  if (!fingerprint) return;
  btn.disabled = true;
  btn.textContent = 'Resolving…';
  try {
    const jwt = await getJwt();
    const res = await fetch(SB_URL + '/rest/v1/platform_alerts?fingerprint=eq.' + encodeURIComponent(fingerprint), {
      method: 'PATCH',
      headers: {
        'apikey': SB_ANON,
        'Authorization': 'Bearer ' + (jwt || SB_ANON),
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ resolved: true }),
    });
    if (!res.ok) throw new Error('PATCH failed ' + res.status);
    showToast('Marked resolved — refreshing errors…');
    // Remove the row visually
    const row = btn.closest('.error-row');
    if (row) { row.style.transition = 'opacity .3s'; row.style.opacity = '0'; setTimeout(() => row.remove(), 350); }
    // Refresh the live count
    setTimeout(loadErrors, 600);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Mark resolved';
    showToast('Error resolving: ' + e.message);
  }
}

// ── Settled toggle ──────────────────────────────────────────────────────────
function toggleSettled() {
  const toggle = document.getElementById('settled-toggle');
  const body = document.getElementById('settled-body');
  toggle.classList.toggle('open');
  body.classList.toggle('open');
}

// ── Data loaders ────────────────────────────────────────────────────────────
async function loadErrors() {
  try {
    // Live: high/critical, unresolved, last 24h — grouped by fingerprint
    const live = await sbGet('platform_alerts', {
      'select': 'fingerprint,type,severity,page,resolved,created_at,member_email',
      'resolved': 'eq.false',
      'severity': 'in.(high,critical)',
      'created_at': 'gte.' + new Date(Date.now() - 86400000).toISOString(),
      'order': 'created_at.desc',
      'limit': '500',
    });

    // Aggregate by fingerprint client-side
    const groups = {};
    (live || []).forEach(r => {
      const fp = r.fingerprint || r.type;
      if (!groups[fp]) groups[fp] = { fingerprint: fp, type: r.type, severity: r.severity, page: r.page, resolved: r.resolved, occurrences: 0, members: new Set(), last_seen: r.created_at, first_seen: r.created_at };
      groups[fp].occurrences++;
      if (r.member_email) groups[fp].members.add(r.member_email);
      if (new Date(r.created_at) > new Date(groups[fp].last_seen)) groups[fp].last_seen = r.created_at;
      if (new Date(r.created_at) < new Date(groups[fp].first_seen)) groups[fp].first_seen = r.created_at;
    });
    const liveRows = Object.values(groups)
      .map(g => ({ ...g, members_hit: g.members.size }))
      .sort((a, b) => b.members_hit - a.members_hit || b.occurrences - a.occurrences);

    setEl('live-count', liveRows.length);
    if (liveRows.length === 0) {
      document.getElementById('live-count-pill').className = 'pill pill-ok';
      document.getElementById('live-count-pill').innerHTML = '<span class="pill-dot"></span> 0 active';
    } else {
      document.getElementById('live-count-pill').className = 'pill pill-live';
      document.getElementById('live-count-pill').innerHTML = '<span class="pill-dot"></span> ' + liveRows.length + ' active';
    }
    renderErrors(liveRows, 'live-errors-list', true);

    // Settled: either resolved=true OR older than 24h (unresolved high/critical)
    const settled = await sbGet('platform_alerts', {
      'select': 'fingerprint,type,severity,page,resolved,created_at,member_email',
      'or': '(resolved.eq.true,and(severity.in.(high,critical),created_at.lt.' + new Date(Date.now() - 86400000).toISOString() + '))',
      'order': 'created_at.desc',
      'limit': '500',
    });

    const sg = {};
    (settled || []).forEach(r => {
      const fp = r.fingerprint || r.type;
      if (!sg[fp]) sg[fp] = { fingerprint: fp, type: r.type, severity: r.severity, page: r.page, resolved: r.resolved, occurrences: 0, members: new Set(), last_seen: r.created_at, first_seen: r.created_at };
      sg[fp].occurrences++;
      if (r.member_email) sg[fp].members.add(r.member_email);
      if (new Date(r.created_at) > new Date(sg[fp].last_seen)) sg[fp].last_seen = r.created_at;
      if (new Date(r.created_at) < new Date(sg[fp].first_seen)) sg[fp].first_seen = r.created_at;
    });
    const settledRows = Object.values(sg)
      .map(g => ({ ...g, members_hit: g.members.size }))
      .sort((a, b) => b.occurrences - a.occurrences);

    setEl('settled-count-pill', settledRows.length + ' items');
    document.getElementById('settled-count-pill').textContent = settledRows.length + ' items';
    renderErrors(settledRows, 'settled-errors-list', false);

    // Update errors-today headline
    const today = new Date(); today.setHours(0,0,0,0);
    const todayCount = (live || []).filter(r => new Date(r.created_at) >= today).length;
    setEl('hl-errors', String(todayCount));

  } catch (e) {
    console.error('loadErrors:', e);
    document.getElementById('live-errors-list').innerHTML = '<div class="empty-state">Error loading — ' + escHtml(e.message) + '</div>';
  }
}

async function loadCache() {
  try {
    const rows = await sbGet('cc_app_health', { 'select': '*', 'id': 'eq.1' });
    const row = rows && rows[0];
    if (!row) {
      document.getElementById('usage-body').innerHTML = '<div class="empty-state">Cache not yet populated — click Refresh now</div>';
      document.getElementById('perf-body').innerHTML = '<div class="empty-state">Cache not yet populated — click Refresh now</div>';
      document.getElementById('dead-pages-body').innerHTML = '<div class="empty-state">—</div>';
      return;
    }

    // Headline
    const hl = row.headline_json || {};
    setEl('hl-active', hl.active_users_7d ?? '—');
    setEl('hl-active30', hl.active_users_30d ?? '—');
    setEl('hl-activities', hl.total_activities ?? '—');
    setEl('hl-alerts', hl.unresolved_alerts ?? '—');

    // Usage
    const refreshed = row.refreshed_at ? timeAgo(row.refreshed_at) : '—';
    setEl('usage-refreshed', 'PostHog data from ' + refreshed);
    renderUsage(row.usage_json);
    renderPerf(row.perf_json);

    setEl('refresh-text', 'Cache refreshed ' + refreshed);

  } catch (e) {
    console.error('loadCache:', e);
    setEl('refresh-text', 'Error loading cache');
  }
}

// ── Trigger refresh (invoke EF on-demand) ───────────────────────────────────
async function triggerRefresh() {
  const btn = document.getElementById('btn-refresh');
  const statusEl = document.getElementById('refresh-text');
  btn.disabled = true;
  statusEl.innerHTML = '<span class="spinning">↻</span> Refreshing…';
  try {
    const jwt = await getJwt();
    const res = await fetch(EF_BASE + '/cc-app-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (jwt || SB_ANON) },
      body: '{}',
    });
    if (!res.ok) throw new Error('EF returned ' + res.status);
    showToast('Cache refreshed');
    await loadCache();
    await loadErrors();
  } catch (e) {
    showToast('Refresh failed: ' + e.message);
    statusEl.textContent = 'Refresh failed';
  } finally {
    btn.disabled = false;
  }
}



// ── Usage pagination ────────────────────────────────────────────────────────
let _allPages = [];
let _usagePage = 0;
const PAGE_SIZE = 10;

function usagePage(dir) {
  _usagePage = Math.max(0, Math.min(_usagePage + dir, Math.ceil(_allPages.length / PAGE_SIZE) - 1));
  renderUsagePage();
}

function renderUsagePage() {
  const start = _usagePage * PAGE_SIZE;
  const slice = _allPages.slice(start, start + PAGE_SIZE);
  const total = _allPages.length;
  const maxViews = Math.max(..._allPages.map(p => p.views), 1);
  const el = document.getElementById('usage-body');
  const pag = document.getElementById('usage-pagination');
  const info = document.getElementById('usage-page-info');
  const prev = document.getElementById('usage-prev');
  const next = document.getElementById('usage-next');

  el.innerHTML = '<table class="data-table"><thead><tr>' +
    '<th>Page</th><th>Opens this week</th><th>Members</th><th style="min-width:120px">Volume</th>' +
    '</tr></thead><tbody>' +
    slice.map(p => {
      const pct = Math.round((p.views / maxViews) * 100);
      return `<tr>
        <td class="page-name">${escHtml(p.page || '—')}</td>
        <td class="num">${p.views}</td>
        <td class="num">${p.people}</td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span style="font-size:10px;color:var(--text-dim);min-width:28px;text-align:right">${pct}%</span></div></td>
      </tr>`;
    }).join('') + '</tbody></table>';

  if (total > PAGE_SIZE) {
    pag.style.display = 'flex';
    info.textContent = (start + 1) + '–' + Math.min(start + PAGE_SIZE, total) + ' of ' + total + ' pages';
    prev.disabled = _usagePage === 0;
    next.disabled = _usagePage >= Math.ceil(total / PAGE_SIZE) - 1;
  } else {
    pag.style.display = 'none';
  }
}

// ── System health checks ────────────────────────────────────────────────────
const SYSTEM_CHECKS = [
  {
    name: 'cc-app-health EF',
    check: async (sb) => {
      const { data } = await sb.from('cc_app_health').select('refreshed_at').eq('id', 1).single();
      if (!data) return { status: 'dead', sub: 'Cache row missing' };
      const age = Date.now() - new Date(data.refreshed_at).getTime();
      if (age > 7200000) return { status: 'warn', sub: 'Last refresh ' + timeAgo(data.refreshed_at) };
      return { status: 'ok', sub: 'Refreshed ' + timeAgo(data.refreshed_at) };
    }
  {
    name: 'daily-report cron',
    check: async (sb) => {
      // Runs at 08:05 UTC daily — check platform_metrics_daily last row
      const { data } = await sb.from('platform_metrics_daily').select('metric_date').order('metric_date', { ascending: false }).limit(1).single();
      if (!data) return { status: 'dead', sub: 'No data' };
      const age = Date.now() - new Date(data.metric_date).getTime();
      if (age > 86400000 * 2) return { status: 'warn', sub: 'Last run ' + timeAgo(data.metric_date) };
      return { status: 'ok', sub: 'Last run ' + new Date(data.metric_date).toLocaleDateString('en-GB') };
    }
  },
  {
    name: 're-engagement cron',
    check: async (sb) => {
      const { data } = await sb.from('engagement_emails').select('created_at').order('created_at', { ascending: false }).limit(1).single();
      if (!data) return { status: 'warn', sub: 'No emails sent yet' };
      const age = Date.now() - new Date(data.created_at).getTime();
      if (age > 86400000 * 3) return { status: 'warn', sub: 'Last email ' + timeAgo(data.created_at) };
      return { status: 'ok', sub: 'Last email ' + timeAgo(data.created_at) };
    }
  },
  {
    name: 'certificate-checker cron',
    check: async (sb) => {
      const { data } = await sb.from('certificates').select('created_at').order('created_at', { ascending: false }).limit(1).single();
      if (!data) return { status: 'warn', sub: 'No certificates issued' };
      return { status: 'ok', sub: 'Last cert ' + timeAgo(data.created_at) };
    }
  },
];

async function sbGetSingle(path, params) {
  // Same as sbGet but returns first row or null
  const rows = await sbGet(path, params);
  return rows && rows.length ? rows[0] : null;
}

async function loadSystemHealth() {
  const grid = document.getElementById('health-grid');
  const meta = document.getElementById('health-meta');
  try {
    // Run all checks in parallel using direct REST calls (no VYVE_SUPABASE dependency)
    const checks = await Promise.all([
      // cc-app-health cache freshness
      (async () => {
        try {
          const row = await sbGetSingle('cc_app_health', { 'id': 'eq.1', 'select': 'refreshed_at' });
          if (!row) return { name: 'cc-app-health EF', status: 'dead', sub: 'Cache row missing' };
          const age = Date.now() - new Date(row.refreshed_at).getTime();
          if (age > 7200000) return { name: 'cc-app-health EF', status: 'warn', sub: 'Last refresh ' + timeAgo(row.refreshed_at) };
          return { name: 'cc-app-health EF', status: 'ok', sub: 'Refreshed ' + timeAgo(row.refreshed_at) };
        } catch(e) { return { name: 'cc-app-health EF', status: 'warn', sub: e.message }; }
      })(),
      // daily-report cron
      (async () => {
        try {
          const row = await sbGetSingle('platform_metrics_daily', { 'select': 'metric_date', 'order': 'metric_date.desc', 'limit': '1' });
          if (!row) return { name: 'daily-report cron', status: 'warn', sub: 'No data — may need admin RLS' };
          const age = Date.now() - new Date(row.metric_date).getTime();
          if (age > 86400000 * 2) return { name: 'daily-report cron', status: 'warn', sub: 'Last run ' + timeAgo(row.metric_date) };
          return { name: 'daily-report cron', status: 'ok', sub: 'Last run ' + new Date(row.metric_date).toLocaleDateString('en-GB') };
        } catch(e) { return { name: 'daily-report cron', status: 'warn', sub: 'Check RLS on platform_metrics_daily' }; }
      })(),
      // re-engagement cron
      (async () => {
        try {
          const row = await sbGetSingle('engagement_emails', { 'select': 'created_at', 'order': 'created_at.desc', 'limit': '1' });
          if (!row) return { name: 're-engagement cron', status: 'warn', sub: 'No emails sent yet' };
          return { name: 're-engagement cron', status: 'ok', sub: 'Last email ' + timeAgo(row.created_at) };
        } catch(e) { return { name: 're-engagement cron', status: 'warn', sub: e.message }; }
      })(),
      // certificate-checker cron
      (async () => {
        try {
          const rows = await sbGet('certificates', { 'select': 'count', 'head': 'true' });
          const row = await sbGetSingle('certificates', { 'select': 'earned_at', 'order': 'earned_at.desc', 'limit': '1' });
          if (!row) return { name: 'certificate-checker', status: 'warn', sub: 'No certificates issued yet' };
          const ts = row.earned_at;
          return { name: 'certificate-checker', status: 'ok', sub: ts ? 'Last cert ' + timeAgo(ts) : 'Certs exist' };
        } catch(e) { return { name: 'certificate-checker', status: 'warn', sub: 'No certs issued yet' }; }
      })(),
    ]);

    const deadCount = checks.filter(r => r.status === 'dead').length;
    const warnCount = checks.filter(r => r.status === 'warn').length;
    meta.textContent = deadCount > 0 ? deadCount + ' down' : warnCount > 0 ? warnCount + ' warnings' : 'All systems ok';

    grid.innerHTML = checks.map(r => `
      <div class="health-check ${escHtml(r.status)}">
        <div class="hc-dot"></div>
        <div class="hc-body">
          <div class="hc-name">${escHtml(r.name)}</div>
          <div class="hc-sub">${escHtml(r.sub)}</div>
        </div>
      </div>`).join('');
  } catch(e) {
    grid.innerHTML = '<div class="empty-state">Error: ' + escHtml(e.message) + '</div>';
  }
}

// ── Detail modal ────────────────────────────────────────────────────────────
let _modalFingerprint = null;

async function openDetail(fingerprint, type, severity) {
  _modalFingerprint = fingerprint;
  document.getElementById('modal-title').textContent = type;
  document.getElementById('modal-sub').textContent = 'fingerprint: ' + fingerprint;
  document.getElementById('modal-body').innerHTML = '<div class="loading-row"></div><div class="loading-row" style="opacity:.6"></div>';
  document.getElementById('modal-count').textContent = 'Loading…';
  document.getElementById('detail-modal').classList.remove('hidden');

  try {
    const rows = await sbGet('platform_alerts', {
      'fingerprint': 'eq.' + fingerprint,
      'select': 'id,member_email,page,details,user_agent,created_at,resolved,severity',
      'order': 'created_at.desc',
      'limit': '100',
    });

    const total = rows.length;
    const resolved = rows.filter(r => r.resolved).length;
    document.getElementById('modal-count').textContent = total + ' instances, ' + resolved + ' resolved';

    const btn = document.getElementById('modal-resolve-btn');
    const allResolved = resolved === total;
    btn.textContent = allResolved ? 'All resolved' : 'Mark all resolved';
    btn.disabled = allResolved;

    if (!rows.length) {
      document.getElementById('modal-body').innerHTML = '<div class="empty-state">No instances found</div>';
      return;
    }

    document.getElementById('modal-body').innerHTML = rows.map(r => {
      const detail = r.details ? ('<div class="instance-detail">' + escHtml(r.details).substring(0, 400) + '</div>') : '';
      return `<div class="instance-row">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--text);font-weight:500">${escHtml(r.member_email || 'unknown member')}</span>
          <span style="display:flex;gap:8px;align-items:center">
            ${r.resolved ? '<span class="pill pill-grey" style="font-size:10px">Resolved</span>' : ''}
            <span style="font-size:11px;color:var(--text-dim)">${timeAgo(r.created_at)}</span>
          </span>
        </div>
        <div class="instance-meta">
          ${r.page ? '<span>Page: <strong style="color:var(--text)">' + escHtml(r.page) + '</strong></span>' : ''}
          <span>${new Date(r.created_at).toLocaleString('en-GB')}</span>
        </div>
        ${detail}
      </div>`;
    }).join('');

  } catch (e) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Error loading: ' + escHtml(e.message) + '</div>';
  }
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
  _modalFingerprint = null;
}

function closeModal(e) {
  if (e.target === document.getElementById('detail-modal')) closeDetailModal();
}

async function resolveModalGroup() {
  if (!_modalFingerprint) return;
  const btn = document.getElementById('modal-resolve-btn');
  btn.disabled = true; btn.textContent = 'Resolving…';
  try {
    const jwt = await getJwt();
    const res = await fetch(SB_URL + '/rest/v1/platform_alerts?fingerprint=eq.' + encodeURIComponent(_modalFingerprint), {
      method: 'PATCH',
      headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + (jwt || SB_ANON), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ resolved: true }),
    });
    if (!res.ok) throw new Error('PATCH failed ' + res.status);
    showToast('All instances resolved');
    closeDetailModal();
    await loadErrors();
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Mark all resolved';
    showToast('Error: ' + e.message);
  }
}

// ── Bulk resolve all settled ─────────────────────────────────────────────────
async function bulkResolveSettled() {
  const btn = document.getElementById('bulk-resolve-btn');
  const count = document.getElementById('settled-count-pill').textContent;
  if (!confirm('Mark all settled errors as resolved? (' + count + ')')) return;
  btn.disabled = true; btn.textContent = 'Resolving…';
  try {
    const jwt = await getJwt();
    const cutoff = new Date(Date.now() - 86400000).toISOString();
    const res = await fetch(SB_URL + '/rest/v1/platform_alerts?resolved=eq.false&severity=in.(high,critical)&created_at=lt.' + encodeURIComponent(cutoff), {
      method: 'PATCH',
      headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + (jwt || SB_ANON), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ resolved: true }),
    });
    if (!res.ok) throw new Error('PATCH failed ' + res.status);
    showToast('All settled errors resolved');
    await loadErrors();
  } catch (e) {
    showToast('Error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Resolve all settled';
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
(async function boot() {
  setEl('refresh-text', 'Loading…');
  await Promise.all([loadErrors(), loadCache(), loadSystemHealth()]);
})();
