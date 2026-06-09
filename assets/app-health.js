// app-health.js — world-class monitoring dashboard v2 (PM-XXX)
const SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
const EF_BASE = SB_URL + '/functions/v1';

// ── Theme ─────────────────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('ti-dark').style.display  = t==='dark'  ? '' : 'none';
  document.getElementById('ti-light').style.display = t==='light' ? '' : 'none';
  localStorage.setItem('vyve_cc_theme', t);
}
function toggleTheme() {
  applyTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark');
}
(function(){ applyTheme(localStorage.getItem('vyve_cc_theme') || 'dark'); })();

// ── Tabs ──────────────────────────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab===name));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('hidden', p.dataset.tab!==name));
  localStorage.setItem('vyve_ah_tab', name);
}
(function(){ const saved = localStorage.getItem('vyve_ah_tab'); if(saved) showTab(saved); })();

// ── Toast ─────────────────────────────────────────────────────────────────
let _toast;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_toast); _toast = setTimeout(()=>t.classList.remove('show'), 3200);
}

// ── Auth ──────────────────────────────────────────────────────────────────
async function getJwt() {
  try {
    const raw = localStorage.getItem('vyve-cc-supabase-auth');
    if (raw) {
      const p = JSON.parse(raw);
      const at = p?.access_token || p?.data?.session?.access_token || p?.session?.access_token;
      if (at) return at;
    }
  } catch(_) {}
  if (window.VYVE_SUPABASE) {
    try {
      const { data } = await window.VYVE_SUPABASE.client().auth.getSession();
      if (data?.session?.access_token) return data.session.access_token;
    } catch(_) {}
  }
  return null;
}

// ── REST helper ───────────────────────────────────────────────────────────
async function sbGet(path, params) {
  const jwt = await getJwt();
  const url = new URL(SB_URL + '/rest/v1/' + path);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer '+(jwt||SB_ANON), 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error('Supabase '+res.status);
  return res.json();
}
async function sbPatch(path, params, body) {
  const jwt = await getJwt();
  const url = new URL(SB_URL + '/rest/v1/' + path);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer '+(jwt||SB_ANON), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Supabase PATCH '+res.status);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000)+'m ago';
  if (d < 86400000) return Math.floor(d/3600000)+'h ago';
  return Math.floor(d/86400000)+'d ago';
}
function fmtMs(ms) {
  if (ms == null) return '—';
  if (ms < 100) return ms.toFixed(0)+'ms';
  return (ms/1000).toFixed(2)+'s';
}
function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

// ── Cron schedule → expected max interval ────────────────────────────────
function scheduleThresholdMs(schedule) {
  const s = (schedule||'').trim();
  if (/\*\/5/.test(s))  return 10  * 60000;
  if (/\*\/15/.test(s)) return 30  * 60000;
  if (/\*\/30/.test(s)) return 60  * 60000;
  if (/^\d+ \* \* \* \*$/.test(s)) return 3  * 3600000;   // hourly
  if (/\d+ \* \* \* \*/.test(s))   return 3  * 3600000;   // hourly (at X past)
  if (/^\d+ \d+ \* \* [0-6*]$/.test(s)) {                 // weekly
    return 8 * 24 * 3600000;
  }
  if (/^\d+ \d+ \d+ \* \*$/.test(s)) return 35 * 24 * 3600000; // monthly
  return 26 * 3600000;                                     // daily default
}

function cronJobStatus(job) {
  if (!job.active) return { cls: 'off', label: 'Disabled', sub: 'Not active' };
  if (!job.last_run_at) return { cls: 'warn', label: 'Never run', sub: 'No history' };
  if (job.last_status === 'failed') return { cls: 'dead', label: 'Failed', sub: timeAgo(job.last_run_at) };
  const age = Date.now() - new Date(job.last_run_at).getTime();
  const thresh = scheduleThresholdMs(job.schedule);
  if (age > thresh * 2.5) return { cls: 'dead', label: 'Overdue', sub: timeAgo(job.last_run_at) };
  if (age > thresh * 1.4) return { cls: 'warn', label: 'Late',    sub: timeAgo(job.last_run_at) };
  return { cls: 'ok', label: 'Running', sub: timeAgo(job.last_run_at) };
}

// ── Render: error trend chart (inline SVG) ─────────────────────────────
function renderTrendChart(trend) {
  if (!trend || !trend.length) {
    document.getElementById('trend-chart').innerHTML = '<div class="empty-state">No trend data cached yet</div>';
    return;
  }
  const W = 600, H = 90, PAD = 6;
  const barW = (W - PAD * (trend.length + 1)) / trend.length;
  const maxTotal = Math.max(...trend.map(d => d.total), 1);

  const bars = trend.map((d, i) => {
    const x = PAD + i * (barW + PAD);
    const totalH = (d.total / maxTotal) * H;
    const critH  = (d.critical / maxTotal) * H;
    const highH  = (d.high    / maxTotal) * H;
    const otherH = totalH - critH - highH;
    const day = new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', {day:'numeric',month:'short'});
    const tooltip = `${d.date}: ${d.total} total, ${d.critical} critical, ${d.high} high, ${d.members} members`;
    return [
      otherH > 0.5 ? `<rect x="${x}" y="${H-totalH}" width="${barW}" height="${otherH}" fill="var(--settled)" rx="2" opacity=".7"><title>${esc(tooltip)}</title></rect>` : '',
      highH  > 0.5 ? `<rect x="${x}" y="${H-critH-highH}" width="${barW}" height="${highH}"  fill="var(--warning)" rx="2"><title>${esc(tooltip)}</title></rect>` : '',
      critH  > 0.5 ? `<rect x="${x}" y="${H-critH}"        width="${barW}" height="${critH}"  fill="var(--danger)"  rx="2"><title>${esc(tooltip)}</title></rect>` : '',
      d.total > 0 ? `<text x="${x+barW/2}" y="${H-totalH-4}" text-anchor="middle" font-size="9" fill="var(--text-muted)">${d.total}</text>` : '',
      `<text x="${x+barW/2}" y="${H+16}" text-anchor="middle" font-size="9.5" fill="var(--text-dim)">${esc(day)}</text>`,
    ].join('');
  }).join('');

  const todayTotal = trend[trend.length-1]?.total ?? 0;
  const yesterdayTotal = trend[trend.length-2]?.total ?? 0;
  const delta = todayTotal - yesterdayTotal;
  const deltaStr = delta > 0 ? `▲${delta} vs yesterday` : delta < 0 ? `▼${Math.abs(delta)} vs yesterday` : 'same as yesterday';
  const totalWeek = trend.reduce((s,d) => s+d.total, 0);
  setEl('trend-meta', `${totalWeek} total this week · ${deltaStr}`);

  document.getElementById('trend-chart').innerHTML =
    `<svg viewBox="0 0 ${W} ${H+24}" style="width:100%;height:90px;overflow:visible" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

// ── Render: EF error breakdown ─────────────────────────────────────────
function renderEfErrors(rows) {
  const el = document.getElementById('ef-errors-body');
  if (!rows || !rows.length) {
    el.innerHTML = '<div class="empty-state"><div class="ok-icon">✓</div>No unresolved errors in last 24h</div>';
    return;
  }
  const maxTotal = Math.max(...rows.map(r => r.total), 1);
  el.innerHTML = '<div class="source-grid">' + rows.map(r => {
    const pct = Math.round((r.total / maxTotal) * 100);
    return `<div class="source-row">
      <span class="source-name">${esc(r.source)}</span>
      <div class="source-bar-wrap"><div class="source-bar-fill" style="width:${pct}%"></div></div>
      <div class="source-meta">
        <span><strong>${r.total}</strong> errors</span>
        <span><strong>${r.members}</strong> members</span>
        <span><strong>${r.unique_errors}</strong> unique</span>
      </div>
    </div>`;
  }).join('') + '</div>';
}

// ── Render: live / settled errors ─────────────────────────────────────
function renderErrors(rows, containerId, isLive) {
  const el = document.getElementById(containerId);
  if (!rows || !rows.length) {
    el.innerHTML = `<div class="empty-state"><div class="ok-icon">✓</div>No ${isLive?'active problems':'settled errors'} to show</div>`;
    return;
  }
  el.innerHTML = rows.map(r => {
    const sev = r.severity||'high';
    const rowCls = isLive ? (sev==='critical'?'live':'warn') : 'settled';
    const icon = sev==='critical' ? '🔴' : sev==='high' ? '🟡' : '⚪';
    const fp = esc(r.fingerprint);
    return `<div class="error-row ${rowCls}" onclick="openDetail('${fp}','${esc(r.type)}','${esc(sev)}')">
      <div class="error-icon">${icon}</div>
      <div class="error-body">
        <div class="error-type">${esc(r.type)}</div>
        <div class="error-stats">
          <span>Hit <strong>${r.members_hit} member${r.members_hit===1?'':'s'}</strong></span>
          <span>Fired <strong>${r.occurrences}×</strong></span>
          <span>First <strong>${r.first_seen?timeAgo(r.first_seen):'—'}</strong></span>
          <span>Last <strong>${r.last_seen?timeAgo(r.last_seen):'—'}</strong></span>
          ${r.page ? `<span>Page: <strong>${esc(r.page)}</strong></span>` : ''}
          ${r.source ? `<span>Source: <strong>${esc(r.source)}</strong></span>` : ''}
        </div>
      </div>
      <div class="error-actions" onclick="event.stopPropagation()">
        ${!r.resolved ? `<button class="btn-danger-sm" onclick="resolveGroup('${fp}',this)">Resolve</button>` : '<span class="pill pill-grey" style="font-size:10px">Resolved</span>'}
      </div>
    </div>`;
  }).join('');
}

// ── Render: cron quick summary (overview tab) ─────────────────────────
function renderCronQuick(jobs) {
  if (!jobs || !jobs.length) {
    document.getElementById('cron-quick').innerHTML = '<span style="color:var(--text-dim);font-size:12px">No cron data cached yet</span>';
    return;
  }
  const statuses = jobs.map(j => ({ ...j, _s: cronJobStatus(j) }));
  const ok   = statuses.filter(j => j._s.cls==='ok').length;
  const warn = statuses.filter(j => j._s.cls==='warn').length;
  const dead = statuses.filter(j => j._s.cls==='dead').length;
  const off  = statuses.filter(j => j._s.cls==='off').length;

  document.getElementById('cron-quick').innerHTML = [
    `<div class="cron-badge ok"><span class="cron-dot"></span>${ok} running</div>`,
    warn ? `<div class="cron-badge warn"><span class="cron-dot"></span>${warn} late/warn</div>` : '',
    dead ? `<div class="cron-badge dead"><span class="cron-dot"></span>${dead} overdue/failed</div>` : '',
    off  ? `<div class="cron-badge off"><span class="cron-dot"></span>${off} disabled</div>` : '',
  ].join('');

  // Update tab count
  const tc = document.getElementById('tc-cron');
  if (dead > 0) { tc.textContent = dead; tc.className = 'tab-count'; }
  else if (warn > 0) { tc.textContent = warn; tc.className = 'tab-count warn'; }
  else { tc.textContent = ok; tc.className = 'tab-count ok'; }

  // Show problem jobs inline
  const problems = statuses.filter(j => j._s.cls==='dead' || j._s.cls==='warn');
  const probEl = document.getElementById('cron-problems');
  if (problems.length) {
    probEl.style.display = 'flex';
    probEl.innerHTML = problems.map(j =>
      `<div class="source-row">
        <span class="status-dot"><span class="dot dot-${j._s.cls}"></span></span>
        <span class="source-name">${esc(j.jobname)}</span>
        <span style="font-size:11px;color:var(--text-dim);font-family:monospace">${esc(j.schedule)}</span>
        <div class="source-meta"><span style="color:${j._s.cls==='dead'?'var(--danger)':'var(--warning)'}">${esc(j._s.label)}</span><span>${esc(j._s.sub)}</span></div>
      </div>`
    ).join('');
  }
}

// ── Render: cron jobs table (cron tab) ────────────────────────────────
function renderCronTable(jobs) {
  const el = document.getElementById('cron-table-body');
  const sum = document.getElementById('cron-summary-tab');
  if (!jobs || !jobs.length) {
    el.innerHTML = '<div class="empty-state">No cron data — click Refresh cache</div>';
    return;
  }
  const withStatus = jobs.map(j => ({ ...j, _s: cronJobStatus(j) }));
  const ok   = withStatus.filter(j => j._s.cls==='ok').length;
  const warn = withStatus.filter(j => j._s.cls==='warn').length;
  const dead = withStatus.filter(j => j._s.cls==='dead').length;
  const off  = withStatus.filter(j => j._s.cls==='off').length;

  sum.innerHTML = [
    `<div class="cron-badge ok"><span class="cron-dot"></span>${ok} running</div>`,
    warn ? `<div class="cron-badge warn"><span class="cron-dot"></span>${warn} late</div>` : '',
    dead ? `<div class="cron-badge dead"><span class="cron-dot"></span>${dead} overdue/failed</div>` : '',
    off  ? `<div class="cron-badge off"><span class="cron-dot"></span>${off} disabled</div>` : '',
  ].join('');

  // Sort: dead → warn → off → ok
  const order = { dead:0, warn:1, off:2, ok:3 };
  withStatus.sort((a,b) => (order[a._s.cls]||3) - (order[b._s.cls]||3));

  el.innerHTML = '<table class="data-table"><thead><tr>' +
    '<th>Job</th><th>Schedule</th><th>Last run</th><th>Duration</th><th>Status</th>' +
    '</tr></thead><tbody>' +
    withStatus.map(j => {
      const s = j._s;
      const dotCls = `dot dot-${s.cls}`;
      const durMs = j.duration_ms != null ? j.duration_ms : null;
      const durStr = durMs != null ? (durMs < 1000 ? durMs.toFixed(0)+'ms' : (durMs/1000).toFixed(1)+'s') : '—';
      return `<tr>
        <td style="font-weight:500;color:var(--text);font-family:monospace;font-size:11px">${esc(j.jobname)}</td>
        <td class="mono">${esc(j.schedule)}</td>
        <td style="color:var(--text-muted)">${j.last_run_at ? timeAgo(j.last_run_at) : '<span style="color:var(--text-dim)">Never</span>'}</td>
        <td class="num" style="font-variant-numeric:tabular-nums">${durStr}</td>
        <td><span class="status-dot"><span class="${dotCls}"></span>${esc(s.label)}</span></td>
      </tr>`;
    }).join('') +
    '</tbody></table>';
}

// ── Render: pipelines tab ─────────────────────────────────────────────
function renderPipelines(pipeline, headline) {
  const el = document.getElementById('pipeline-grid');
  if (!pipeline) {
    el.innerHTML = '<div class="empty-state">No pipeline data — click Refresh cache</div>';
    return;
  }

  const p = pipeline;
  const now = Date.now();

  // Push
  const pushOk = p.push.total > 0;
  const pushCard = `<div class="pipeline-card ${pushOk?'ok':'warn'}">
    <div class="pipeline-card-header">
      <span class="pipeline-icon">📲</span>
      <span class="pipeline-title">Push Notifications</span>
      <span class="pill ${pushOk?'pill-ok':'pill-warn'}">${pushOk?'Active':'No subs'}</span>
    </div>
    <div class="pipeline-rows">
      <div class="pipeline-row"><span class="pipeline-row-label">Total registered</span><span class="pipeline-row-value">${p.push.total}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">iOS (APNs)</span><span class="pipeline-row-value">${p.push.ios}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Android (FCM)</span><span class="pipeline-row-value ${p.push.android?'':'warn'}">${p.push.android || '0 — FCM pending'}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Sandbox tokens</span><span class="pipeline-row-value ${p.push.sandbox>0?'warn':'ok'}">${p.push.sandbox}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Production tokens</span><span class="pipeline-row-value">${p.push.production}</span></div>
      ${p.push.latest_reg ? `<div class="pipeline-row"><span class="pipeline-row-label">Latest registration</span><span class="pipeline-row-value dim">${timeAgo(p.push.latest_reg)}</span></div>` : ''}
    </div>
  </div>`;

  // HealthKit
  const hkSynced = p.healthkit.synced_24h;
  const hkConnected = p.healthkit.connected;
  const hkStatus = hkSynced === 0 && hkConnected > 0 ? 'dead' : hkSynced < hkConnected * 0.5 ? 'warn' : 'ok';
  const hkLastSync = p.healthkit.last_sync ? timeAgo(p.healthkit.last_sync) : 'Never';
  const hkCard = `<div class="pipeline-card ${hkStatus}">
    <div class="pipeline-card-header">
      <span class="pipeline-icon">❤️</span>
      <span class="pipeline-title">HealthKit Sync</span>
      <span class="pill ${hkStatus==='ok'?'pill-ok':hkStatus==='dead'?'pill-live':'pill-warn'}">${hkStatus==='dead'?'Stale':hkStatus==='warn'?'Partial':'Active'}</span>
    </div>
    <div class="pipeline-rows">
      <div class="pipeline-row"><span class="pipeline-row-label">Members connected</span><span class="pipeline-row-value">${p.healthkit.connected}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Synced last 24h</span><span class="pipeline-row-value ${hkSynced===0&&hkConnected>0?'dead':hkSynced<hkConnected?'warn':'ok'}">${hkSynced} / ${hkConnected}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Stale (>48h)</span><span class="pipeline-row-value ${p.healthkit.stale>0?'warn':''}">${p.healthkit.stale}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">iOS / Android</span><span class="pipeline-row-value">${p.healthkit.ios} / ${p.healthkit.android}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Last sync</span><span class="pipeline-row-value dim">${hkLastSync}</span></div>
    </div>
  </div>`;

  // Email
  const emailAge = p.email.last_sent ? (now - new Date(p.email.last_sent).getTime()) : Infinity;
  const emailStatus = emailAge > 3 * 86400000 ? 'warn' : 'ok';
  const emailCard = `<div class="pipeline-card ${emailStatus}">
    <div class="pipeline-card-header">
      <span class="pipeline-icon">📧</span>
      <span class="pipeline-title">Email (Brevo)</span>
      <span class="pill ${emailStatus==='ok'?'pill-ok':'pill-warn'}">${emailStatus==='ok'?'Active':'Check'}</span>
    </div>
    <div class="pipeline-rows">
      <div class="pipeline-row"><span class="pipeline-row-label">Last sent</span><span class="pipeline-row-value ${emailStatus==='warn'?'warn':''}">${p.email.last_sent ? timeAgo(p.email.last_sent) : 'Never'}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Stream</span><span class="pipeline-row-value dim">${esc(p.email.last_stream || '—')}</span></div>
      ${(p.email.recent_streams||[]).slice(1,4).map(e => `<div class="pipeline-row"><span class="pipeline-row-label dim">↳ ${esc(e.stream)}</span><span class="pipeline-row-value dim">${timeAgo(e.at)}</span></div>`).join('')}
    </div>
  </div>`;

  // AI usage
  const aiStatus = p.ai.calls_24h > 0 ? 'ok' : 'warn';
  const aiByTrigger = p.ai.by_trigger || {};
  const topTriggers = Object.entries(aiByTrigger).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const aiCard = `<div class="pipeline-card ${aiStatus}">
    <div class="pipeline-card-header">
      <span class="pipeline-icon">🤖</span>
      <span class="pipeline-title">AI Usage (Anthropic)</span>
      <span class="pill ${aiStatus==='ok'?'pill-ok':'pill-warn'}">${p.ai.calls_24h} calls/24h</span>
    </div>
    <div class="pipeline-rows">
      <div class="pipeline-row"><span class="pipeline-row-label">Calls last 24h</span><span class="pipeline-row-value">${p.ai.calls_24h}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Calls last 7d</span><span class="pipeline-row-value">${p.ai.calls_7d}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Last call</span><span class="pipeline-row-value dim">${p.ai.last_call ? timeAgo(p.ai.last_call) : 'None'}</span></div>
      ${topTriggers.map(([t,n]) => `<div class="pipeline-row"><span class="pipeline-row-label dim">↳ ${esc(t)}</span><span class="pipeline-row-value dim">${n}×</span></div>`).join('')}
    </div>
  </div>`;

  // Members / subscriptions
  const trialsExpiring = p.members.trials_expiring_7d;
  const membersCard = `<div class="pipeline-card ${trialsExpiring>0?'warn':'ok'}">
    <div class="pipeline-card-header">
      <span class="pipeline-icon">👥</span>
      <span class="pipeline-title">Members</span>
      <span class="pill ${trialsExpiring>0?'pill-warn':'pill-ok'}">${p.members.active_total} active</span>
    </div>
    <div class="pipeline-rows">
      <div class="pipeline-row"><span class="pipeline-row-label">Paid active</span><span class="pipeline-row-value ok">${p.members.active_paid}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Trial active</span><span class="pipeline-row-value">${p.members.active_trials}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Trials expiring 7d</span><span class="pipeline-row-value ${trialsExpiring>0?'warn':''}">${trialsExpiring}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Trials expired</span><span class="pipeline-row-value dim">${p.members.trials_expired}</span></div>
    </div>
  </div>`;

  // GDPR
  const gdprAlert = (p.gdpr.export_pending + p.gdpr.erase_pending) > 0;
  const gdprCard = `<div class="pipeline-card ${gdprAlert?'warn':'ok'}">
    <div class="pipeline-card-header">
      <span class="pipeline-icon">🔒</span>
      <span class="pipeline-title">GDPR Queue</span>
      <span class="pill ${gdprAlert?'pill-warn':'pill-ok'}">${gdprAlert?'Pending':'Clear'}</span>
    </div>
    <div class="pipeline-rows">
      <div class="pipeline-row"><span class="pipeline-row-label">Export requests pending</span><span class="pipeline-row-value ${p.gdpr.export_pending>0?'warn':''}">${p.gdpr.export_pending}</span></div>
      <div class="pipeline-row"><span class="pipeline-row-label">Erasure requests overdue</span><span class="pipeline-row-value ${p.gdpr.erase_pending>0?'dead':''}">${p.gdpr.erase_pending}</span></div>
    </div>
  </div>`;

  el.innerHTML = pushCard + hkCard + emailCard + aiCard + membersCard + gdprCard;
}

// ── Render: perf table ────────────────────────────────────────────────
function renderPerf(data, metaStr) {
  const el = document.getElementById('perf-body');
  const rows = data?.load_times || [];
  if (metaStr) setEl('perf-meta', metaStr);
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No load time data yet — perf.js collecting from members over time</div>';
    return;
  }
  const maxMs = Math.max(...rows.map(r => r.lcp_p75 || r.lcp_p50 || 0), 1);
  el.innerHTML = '<table class="data-table"><thead><tr><th>Page</th><th class="num">p50</th><th class="num">p75</th><th class="num">p95</th><th class="num">Samples</th><th style="min-width:100px">Speed</th></tr></thead><tbody>' +
    rows.map(r => {
      const ms = r.lcp_p75 || r.lcp_p50 || 0;
      const pct = Math.round((ms / maxMs) * 100);
      const cls = ms > 3000 ? 'very-slow' : ms > 1500 ? 'slow' : '';
      const col = ms > 3000 ? 'var(--danger)' : ms > 1500 ? 'var(--warning)' : 'var(--success)';
      return `<tr>
        <td class="mono">${esc(r.page||'—')}</td>
        <td class="num" style="color:${col}">${fmtMs(r.lcp_p50)}</td>
        <td class="num" style="color:${col};font-weight:600">${fmtMs(r.lcp_p75)}</td>
        <td class="num" style="color:${col}">${fmtMs(r.lcp_p95)}</td>
        <td class="num">${r.samples}</td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div></div></td>
      </tr>`;
    }).join('') + '</tbody></table>';
}

// ── Render: dead pages ────────────────────────────────────────────────
function renderDeadPages(dead) {
  const el = document.getElementById('dead-pages-body');
  if (!dead || !dead.length) {
    el.innerHTML = '<div class="empty-state" style="padding:16px 0">All known pages opened this week ✓</div>';
    return;
  }
  el.innerHTML = '<div class="dead-page-list">' + dead.map(p => `<span class="dead-page-chip">${esc(p)}</span>`).join('') + '</div>';
}

// ── Render: page usage ────────────────────────────────────────────────
let _allPages = [], _usagePage = 0;
const PAGE_SIZE = 12;

function renderUsage(data, metaStr) {
  const pages = data?.top_pages || [];
  if (metaStr) setEl('usage-meta', metaStr);
  if (!pages.length) {
    document.getElementById('usage-body').innerHTML = '<div class="empty-state">No page view data — PostHog key may not be set</div>';
    return;
  }
  _allPages = pages; _usagePage = 0;
  renderUsagePage();
  renderDeadPages(data?.dead_pages || []);
}

function usagePage(dir) {
  _usagePage = Math.max(0, Math.min(_usagePage+dir, Math.ceil(_allPages.length/PAGE_SIZE)-1));
  renderUsagePage();
}

function renderUsagePage() {
  const start = _usagePage * PAGE_SIZE;
  const slice = _allPages.slice(start, start+PAGE_SIZE);
  const total = _allPages.length;
  const maxV  = Math.max(..._allPages.map(p => p.views), 1);
  const pag   = document.getElementById('usage-pagination');
  const el    = document.getElementById('usage-body');
  el.innerHTML = '<table class="data-table"><thead><tr><th>Page</th><th class="num">Views</th><th class="num">Members</th><th style="min-width:120px">Volume</th></tr></thead><tbody>' +
    slice.map(p => {
      const pct = Math.round((p.views/maxV)*100);
      return `<tr>
        <td class="mono">${esc(p.page||'—')}</td>
        <td class="num">${p.views}</td>
        <td class="num">${p.people}</td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span style="font-size:10px;color:var(--text-dim);min-width:28px;text-align:right">${pct}%</span></div></td>
      </tr>`;
    }).join('') + '</tbody></table>';
  if (total > PAGE_SIZE) {
    pag.style.display = 'flex';
    setEl('usage-page-info', (start+1)+'–'+Math.min(start+PAGE_SIZE,total)+' of '+total+' pages');
    document.getElementById('usage-prev').disabled = _usagePage===0;
    document.getElementById('usage-next').disabled = _usagePage>=Math.ceil(total/PAGE_SIZE)-1;
  } else { pag.style.display = 'none'; }
}

// ── Load errors (always live) ─────────────────────────────────────────
async function loadErrors() {
  try {
    const cutoff = new Date(Date.now()-86400000).toISOString();
    // Live: high/critical, unresolved, last 24h
    const live = await sbGet('platform_alerts', {
      'select': 'fingerprint,type,severity,page,source,resolved,created_at,member_email',
      'resolved': 'eq.false',
      'severity': 'in.(high,critical)',
      'created_at': 'gte.'+cutoff,
      'order': 'created_at.desc',
      'limit': '600',
    });
    const groups = {};
    (live||[]).forEach(r => {
      const fp = r.fingerprint||r.type;
      if (!groups[fp]) groups[fp] = {fingerprint:fp,type:r.type,severity:r.severity,page:r.page,source:r.source,resolved:r.resolved,occurrences:0,members:new Set(),last_seen:r.created_at,first_seen:r.created_at};
      groups[fp].occurrences++;
      if (r.member_email) groups[fp].members.add(r.member_email);
      if (new Date(r.created_at) > new Date(groups[fp].last_seen)) groups[fp].last_seen=r.created_at;
      if (new Date(r.created_at) < new Date(groups[fp].first_seen)) groups[fp].first_seen=r.created_at;
    });
    const liveRows = Object.values(groups)
      .map(g => ({...g, members_hit:g.members.size}))
      .sort((a,b) => b.members_hit-a.members_hit || b.occurrences-a.occurrences);

    setEl('live-count', liveRows.length);
    const lp = document.getElementById('live-count-pill');
    lp.className = liveRows.length ? 'pill pill-live' : 'pill pill-ok';
    lp.innerHTML = '<span class="pill-dot"></span> '+(liveRows.length||'0')+' active';

    renderErrors(liveRows, 'live-errors-list', true);

    // Update overview tab count
    const tc = document.getElementById('tc-overview');
    if (liveRows.length > 0) { tc.textContent=liveRows.length; tc.className='tab-count'; }
    else { tc.textContent='✓'; tc.className='tab-count ok'; }

    // Headline errors cell
    const errCell = document.getElementById('hl-errors-cell');
    errCell.className = 'stat-cell'+(liveRows.length>0?' alert':'');
    setEl('hl-errors', liveRows.length.toString());
    setEl('hl-errors-sub', liveRows.length>0 ? 'high+critical unresolved' : 'All clear');

    // Settled
    const settled = await sbGet('platform_alerts', {
      'select': 'fingerprint,type,severity,page,source,resolved,created_at,member_email',
      'or': '(resolved.eq.true,and(severity.in.(high,critical),created_at.lt.'+cutoff+'))',
      'order': 'created_at.desc', 'limit': '400',
    });
    const sg = {};
    (settled||[]).forEach(r => {
      const fp = r.fingerprint||r.type;
      if (!sg[fp]) sg[fp]={fingerprint:fp,type:r.type,severity:r.severity,page:r.page,source:r.source,resolved:r.resolved,occurrences:0,members:new Set(),last_seen:r.created_at,first_seen:r.created_at};
      sg[fp].occurrences++;
      if (r.member_email) sg[fp].members.add(r.member_email);
      if (new Date(r.created_at) > new Date(sg[fp].last_seen)) sg[fp].last_seen=r.created_at;
      if (new Date(r.created_at) < new Date(sg[fp].first_seen)) sg[fp].first_seen=r.created_at;
    });
    const settledRows = Object.values(sg)
      .map(g=>({...g,members_hit:g.members.size}))
      .sort((a,b)=>b.occurrences-a.occurrences);
    setEl('settled-count-pill', settledRows.length+' items');
    renderErrors(settledRows, 'settled-errors-list', false);

  } catch(e) {
    console.error('loadErrors:', e);
    document.getElementById('live-errors-list').innerHTML = '<div class="empty-state">Error loading: '+esc(e.message)+'</div>';
  }
}

// ── Load cache ────────────────────────────────────────────────────────
async function loadCache() {
  try {
    const rows = await sbGet('cc_app_health', {'select':'*','id':'eq.1'});
    const row = rows && rows[0];
    if (!row) {
      setEl('refresh-text', 'Cache empty — click Refresh cache');
      return;
    }
    const refreshed = row.refreshed_at ? timeAgo(row.refreshed_at) : '—';
    setEl('refresh-text', 'Cache refreshed '+refreshed);

    // Headline stats from cache
    const hl = row.headline_json || {};
    setEl('hl-active', hl.active_users_7d ?? hl.active_subs ?? '—');
    setEl('hl-active-sub', 'of '+(hl.active_subs||'?')+' active subs');
    setEl('hl-subs', hl.active_subs ?? '—');
    setEl('hl-subs-sub', (hl.active_paid??0)+' paid · '+(hl.active_trials??0)+' trial');
    setEl('hl-push', hl.push_registered ?? '—');
    setEl('hl-hk', hl.hk_connected ?? '—');
    const hkStale = hl.hk_stale || 0;
    setEl('hl-hk-sub', hkStale > 0 ? hkStale+' stale (>48h)' : 'All synced recently');
    const hkCell = document.getElementById('hl-hk-cell');
    hkCell.className = 'stat-cell' + (hkStale > (hl.hk_connected||0)*0.5 ? ' warn' : '');
    setEl('hl-ai', hl.ai_calls_24h ?? '—');

    // Trend chart
    renderTrendChart(row.error_trend_json || []);

    // EF error breakdown (24h)
    renderEfErrors(row.ef_errors_json || []);

    // Cron
    const cronJobs = row.cron_json || [];
    renderCronQuick(cronJobs);
    renderCronTable(cronJobs);

    // Pipelines
    renderPipelines(row.pipeline_json, hl);

    // Performance
    const perfMeta = row.perf_json?.metric
      ? 'LCP '+row.perf_json.metric+' · '+refreshed
      : 'from perf_telemetry · '+refreshed;
    renderPerf(row.perf_json, perfMeta);

    // Usage
    renderUsage(row.usage_json, 'PostHog data · '+refreshed);

  } catch(e) {
    console.error('loadCache:', e);
    setEl('refresh-text', 'Error loading cache: '+e.message);
  }
}

// ── Trigger EF refresh ────────────────────────────────────────────────
async function triggerRefresh() {
  const btn = document.getElementById('btn-refresh');
  setEl('refresh-text', 'Refreshing…');
  document.getElementById('refresh-text').innerHTML = '<span class="spinning">↻</span> Refreshing…';
  btn.disabled = true;
  try {
    const jwt = await getJwt();
    const res = await fetch(EF_BASE+'/cc-app-health', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(jwt||SB_ANON)},
      body:'{}'
    });
    if (!res.ok) throw new Error('EF '+res.status);
    showToast('Cache refreshed ✓');
    await Promise.all([loadCache(), loadErrors()]);
  } catch(e) {
    showToast('Refresh failed: '+e.message);
    setEl('refresh-text', 'Refresh failed');
  } finally { btn.disabled = false; }
}

// ── Bulk resolve ──────────────────────────────────────────────────────
async function bulkResolveOld(btn) {
  if (!confirm('Mark all alerts older than 7 days as resolved? This clears historical noise.')) return;
  btn.disabled = true; btn.textContent = 'Resolving…';
  try {
    const cutoff = new Date(Date.now() - 7*86400000).toISOString();
    await sbPatch('platform_alerts', {'resolved':'eq.false','created_at':'lt.'+cutoff}, {resolved:true});
    showToast('Old alerts resolved ✓');
    await loadErrors();
  } catch(e) { showToast('Error: '+e.message); }
  finally { btn.disabled=false; btn.textContent='Bulk resolve old'; }
}

async function bulkResolveSettled(btn) {
  if (!confirm('Mark all settled (>24h old) errors as resolved?')) return;
  btn.disabled=true; btn.textContent='Resolving…';
  try {
    const cutoff = new Date(Date.now()-86400000).toISOString();
    await sbPatch('platform_alerts', {'resolved':'eq.false','severity':'in.(high,critical)','created_at':'lt.'+cutoff}, {resolved:true});
    showToast('Settled errors resolved ✓');
    await loadErrors();
  } catch(e) { showToast('Error: '+e.message); }
  finally { btn.disabled=false; btn.textContent='Resolve all settled'; }
}

async function resolveGroup(fingerprint, btn) {
  btn.disabled=true; btn.textContent='…';
  try {
    await sbPatch('platform_alerts', {'fingerprint':'eq.'+encodeURIComponent(fingerprint)}, {resolved:true});
    showToast('Resolved ✓');
    const row = btn.closest('.error-row');
    if (row) { row.style.transition='opacity .3s'; row.style.opacity='0'; setTimeout(()=>row.remove(),350); }
    setTimeout(loadErrors, 700);
  } catch(e) {
    btn.disabled=false; btn.textContent='Resolve';
    showToast('Error: '+e.message);
  }
}

// ── Settled toggle ────────────────────────────────────────────────────
function toggleSettled() {
  document.getElementById('settled-toggle').classList.toggle('open');
  document.getElementById('settled-body').classList.toggle('open');
}

// ── Error drill-down modal ────────────────────────────────────────────
let _modalFp = null;

async function openDetail(fp, type, sev) {
  _modalFp = fp;
  setEl('modal-title', type);
  setEl('modal-sub', 'fingerprint: '+fp);
  document.getElementById('modal-body').innerHTML = '<div class="loading-row"></div><div class="loading-row" style="opacity:.6"></div>';
  document.getElementById('modal-count').textContent = 'Loading…';
  document.getElementById('detail-modal').classList.remove('hidden');
  try {
    const rows = await sbGet('platform_alerts', {
      'fingerprint':'eq.'+fp,
      'select':'id,member_email,page,details,source,user_agent,created_at,resolved,severity',
      'order':'created_at.desc','limit':'100'
    });
    const total = rows.length;
    const resolved = rows.filter(r=>r.resolved).length;
    setEl('modal-count', total+' instances, '+resolved+' resolved');
    const btn = document.getElementById('modal-resolve-btn');
    btn.textContent = resolved===total ? 'All resolved' : 'Mark all resolved';
    btn.disabled = resolved===total;

    document.getElementById('modal-body').innerHTML = rows.map(r => {
      const detail = r.details ? '<div class="instance-detail">'+esc(r.details).substring(0,500)+'</div>' : '';
      return `<div class="instance-row">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--text);font-weight:500">${esc(r.member_email||'unknown')}</span>
          <span style="display:flex;gap:8px;align-items:center">
            ${r.resolved?'<span class="pill pill-grey" style="font-size:10px">Resolved</span>':''}
            <span style="font-size:11px;color:var(--text-dim)">${timeAgo(r.created_at)}</span>
          </span>
        </div>
        <div class="instance-meta">
          ${r.page?'<span>Page: <strong>'+esc(r.page)+'</strong></span>':''}
          ${r.source?'<span>Source: <strong>'+esc(r.source)+'</strong></span>':''}
          <span>${new Date(r.created_at).toLocaleString('en-GB')}</span>
        </div>
        ${detail}
      </div>`;
    }).join('');
  } catch(e) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Error: '+esc(e.message)+'</div>';
  }
}

function closeDetailModal() { document.getElementById('detail-modal').classList.add('hidden'); _modalFp=null; }
function closeModal(e) { if (e.target===document.getElementById('detail-modal')) closeDetailModal(); }

async function resolveModalGroup() {
  if (!_modalFp) return;
  const btn = document.getElementById('modal-resolve-btn');
  btn.disabled=true; btn.textContent='Resolving…';
  try {
    await sbPatch('platform_alerts', {'fingerprint':'eq.'+encodeURIComponent(_modalFp)}, {resolved:true});
    showToast('All instances resolved ✓');
    closeDetailModal();
    await loadErrors();
  } catch(e) {
    btn.disabled=false; btn.textContent='Mark all resolved';
    showToast('Error: '+e.message);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────
(async function boot() {
  setEl('refresh-text', 'Loading…');
  await Promise.all([loadErrors(), loadCache()]);
})();
