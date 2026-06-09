// VYVE Command Centre — Activity Depth page (PM-587)
// Fetches from cc-activity EF, renders all sections.
(function () {
  'use strict';

  var EF_URL = 'https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/cc-activity';

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmt(n) { return n == null ? '—' : Number(n).toLocaleString(); }
  function pct(n) { return n == null ? '—' : Number(n).toFixed(1) + '%'; }
  function relTime(ts) {
    var s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  }

  function actGetJwt() {
    try {
      var raw = localStorage.getItem('sb-' + 'ixjfklpckgxrwjlfsaaz' + '-auth-token') ||
                localStorage.getItem('supabase.auth.token');
      if (!raw) return '';
      var parsed = JSON.parse(raw);
      return (parsed && (parsed.access_token || (parsed.currentSession && parsed.currentSession.access_token))) || '';
    } catch (e) { return ''; }
  }

  function actShowToast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }

  function actSetStatus(msg) {
    var el = $('act-refresh-text');
    if (el) el.textContent = msg;
  }

  // ── Theme ────────────────────────────────────────────────────────────────────
  window.actToggleTheme = function() {
    var html = document.documentElement;
    var theme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', theme);
    var d = $('act-theme-dark'), l = $('act-theme-light');
    if (d) d.style.display = theme === 'dark' ? '' : 'none';
    if (l) l.style.display = theme === 'light' ? '' : 'none';
    localStorage.setItem('vyve_cc_theme', theme);
  };

  function actApplyTheme() {
    var saved = localStorage.getItem('vyve_cc_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    var d = $('act-theme-dark'), l = $('act-theme-light');
    if (d) d.style.display = saved === 'dark' ? '' : 'none';
    if (l) l.style.display = saved === 'light' ? '' : 'none';
  }

  // ── Data fetch ───────────────────────────────────────────────────────────────
  function actFetch(action, cb) {
    var jwt = actGetJwt();
    var headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    fetch(EF_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ action: action })
    })
    .then(function(r) { return r.json(); })
    .then(function(r) { cb(null, r); })
    .catch(function(e) { cb(e, null); });
  }

  // ── Render: Headline ─────────────────────────────────────────────────────────
  function actRenderHeadline(hl) {
    var el = function(id, val) { var e = $(id); if (e) e.textContent = val; };
    el('act-total',     fmt(hl.total_activities));
    el('act-active7',   fmt(hl.active_members_7d));
    var apct = hl.real_members ? Math.round((hl.active_members_7d / hl.real_members) * 100) : 0;
    el('act-active7-pct', apct + '% of ' + hl.real_members + ' members');
    el('act-avg-sets',   hl.avg_sets_per_session != null ? hl.avg_sets_per_session : '—');
    el('act-watch',     hl.total_watch_minutes != null ? hl.total_watch_minutes : '—');
    el('act-top-cardio', hl.top_cardio_type || '—');
    el('act-running',   fmt(hl.running_plan_cache_count));
    el('act-running-sub', fmt(hl.running_plan_total_uses) + ' total uses');
  }

  // ── Render: Feature adoption ─────────────────────────────────────────────────
  function actRenderAdoption(rows, realMembers) {
    var el = $('act-adoption-body'), meta = $('act-adoption-meta');
    if (!el) return;
    if (!rows || !rows.length) { el.innerHTML = '<div class="empty-state">No adoption data yet.</div>'; return; }
    // Sort by pct desc
    rows = rows.slice().sort(function(a,b) { return (b.pct||0)-(a.pct||0); });
    var maxPct = rows.reduce(function(m,r) { return Math.max(m, r.pct||0); }, 0);
    var html = '';
    rows.forEach(function(r) {
      var barW = maxPct > 0 ? Math.round(((r.pct||0) / maxPct) * 100) : 0;
      var label = esc(r.label || r.feature);
      var users = r.users || 0;
      var p = r.pct != null ? r.pct.toFixed(1) : '0.0';
      html += '<div class="adoption-row">' +
        '<div class="adoption-label">' + label + '</div>' +
        '<div class="adoption-bar-bg"><div class="adoption-bar-fill" style="width:' + barW + '%">' +
          (barW > 15 ? '<span class="adoption-bar-text">' + users + ' members</span>' : '') +
        '</div></div>' +
        '<div class="adoption-pct">' + p + '%</div>' +
        '<div class="adoption-users">' + (barW <= 15 ? users + ' mbr' : '') + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
    if (meta) meta.textContent = realMembers + ' real members as denominator';
  }

  // ── Render: Exercise depth ───────────────────────────────────────────────────
  function actRenderDepth(d) {
    var el = $('act-depth-body');
    if (!el || !d) { if (el) el.innerHTML = '<div class="empty-state">No exercise data yet.</div>'; return; }
    var html = '<div class="depth-strip">' +
      '<div class="depth-cell"><div class="depth-label">Total sessions</div><div class="depth-val">' + fmt(d.total_sessions) + '</div></div>' +
      '<div class="depth-cell"><div class="depth-label">Total sets</div><div class="depth-val">' + fmt(d.total_sets) + '</div></div>' +
      '<div class="depth-cell"><div class="depth-label">Avg sets/session</div><div class="depth-val">' + (d.avg_sets||'—') + '</div></div>' +
      '<div class="depth-cell"><div class="depth-label">Median (P50)</div><div class="depth-val">' + (d.p50_sets||'—') + '</div></div>' +
      '<div class="depth-cell"><div class="depth-label">P75</div><div class="depth-val">' + (d.p75_sets||'—') + '</div></div>' +
      '<div class="depth-cell"><div class="depth-label">P95</div><div class="depth-val">' + (d.p95_sets||'—') + '</div></div>' +
    '</div>';
    el.innerHTML = html;
  }

  // ── Render: Cardio ───────────────────────────────────────────────────────────
  function actRenderCardio(types) {
    var el = $('act-cardio-body');
    if (!el) return;
    if (!types || !types.length) { el.innerHTML = '<div class="empty-state">No cardio data yet.</div>'; return; }
    var maxN = types.reduce(function(m,t) { return Math.max(m, t.n||0); }, 0);
    var html = '';
    types.forEach(function(t) {
      var w = maxN > 0 ? Math.round(((t.n||0) / maxN) * 100) : 0;
      var meta = [];
      if (t.avg_min) meta.push(t.avg_min + ' min avg');
      if (t.avg_km) meta.push(t.avg_km + ' km avg');
      html += '<div class="cardio-row">' +
        '<div class="cardio-label">' + esc(t.type||'unknown') + '</div>' +
        '<div class="cardio-bar-bg"><div class="cardio-bar-fill" style="width:' + w + '%">' +
          '<span class="cardio-bar-text">' + fmt(t.n) + '</span>' +
        '</div></div>' +
        '<div class="cardio-meta">' + esc(meta.join(' · ') || '') + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  }

  // ── Render: Watch time ───────────────────────────────────────────────────────
  function actRenderWatch(w) {
    var el = $('act-watch-body');
    if (!el || !w) { if (el) el.innerHTML = '<div class="empty-state">No watch data yet.</div>'; return; }
    var html = '<div class="watch-strip">' +
      '<div class="stat-cell"><div class="stat-label">Total minutes</div><div class="stat-value">' + (w.total_minutes||'0') + '</div><div class="stat-sub">across all views</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Unique watchers</div><div class="stat-value">' + fmt(w.unique_watchers) + '</div><div class="stat-sub">members</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Total views</div><div class="stat-value">' + fmt(w.total_views) + '</div><div class="stat-sub">live + replay</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Avg % watched</div><div class="stat-value">' + (w.avg_pct||'—') + '%</div><div class="stat-sub">completion proxy</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Completed</div><div class="stat-value">' + fmt(w.completed_count) + '</div><div class="stat-sub">100% watched</div></div>' +
    '</div>';
    if (w.by_category && w.by_category.length) {
      html += '<div class="table-wrap"><table class="data-table">' +
        '<thead><tr><th>Kind</th><th>Category</th><th class="num">Views</th><th class="num">Total mins</th><th class="num">Avg %</th><th class="num">Completed</th></tr></thead><tbody>';
      w.by_category.forEach(function(r) {
        html += '<tr><td><span class="pill ' + (r.kind==='live' ? 'pill-teal' : 'pill-grey') + '">' + esc(r.kind) + '</span></td>' +
          '<td>' + esc(r.category||'—') + '</td>' +
          '<td class="num">' + fmt(r.views) + '</td>' +
          '<td class="num">' + (r.total_secs ? Math.round(r.total_secs/60) : '—') + '</td>' +
          '<td class="num">' + (r.avg_pct||'—') + '%</td>' +
          '<td class="num">' + fmt(r.completed) + '</td>' +
        '</tr>';
      });
      html += '</tbody></table></div>' +
        '<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">Small sample — 2 live sessions, 6 replays. Watch-time data grows as members engage with session content.</div>';
    }
    el.innerHTML = html;
  }

  // ── Render: Pillar balance ───────────────────────────────────────────────────
  function actRenderPillar(p) {
    var el = $('act-pillar-body');
    if (!el || !p) { if (el) el.innerHTML = '<div class="empty-state">No pillar data yet.</div>'; return; }
    var active = p.active_members || 1;
    function pp(n) { return Math.round((n/active)*100); }
    var html = '<div class="pillar-grid">' +
      '<div class="pillar-cell"><div class="pillar-count" style="color:var(--teal-lt)">' + fmt(p.all_pillars) + '</div><div class="pillar-label">All 3 pillars</div><div class="pillar-pct">' + pp(p.all_pillars) + '% of active</div></div>' +
      '<div class="pillar-cell"><div class="pillar-count" style="color:var(--gold)">' + fmt(p.two_pillars) + '</div><div class="pillar-label">2 pillars</div><div class="pillar-pct">' + pp(p.two_pillars) + '% of active</div></div>' +
      '<div class="pillar-cell"><div class="pillar-count" style="color:var(--warning)">' + fmt(p.single_pillar) + '</div><div class="pillar-label">Single pillar</div><div class="pillar-pct">' + pp(p.single_pillar) + '% — retention risk</div></div>' +
      '<div class="pillar-cell"><div class="pillar-count" style="color:var(--text-dim)">' + fmt(p.habits_only) + '</div><div class="pillar-label">Habits only</div><div class="pillar-pct">' + pp(p.habits_only) + '% of active</div></div>' +
    '</div>';
    // Proportion bars
    var total = (p.total_body||0) + (p.total_mind||0) + (p.total_connect||0) + (p.total_habits||0);
    if (total > 0) {
      function bw(n) { return Math.round(((n||0)/total)*100); }
      html += '<div class="pillar-bar-wrap">' +
        '<div style="font-size:11px;color:var(--text-dim);margin-bottom:8px">Activity volume by pillar (' + fmt(total) + ' total logged)</div>' +
        '<div class="pillar-bar-row"><div class="pillar-bar-label">Body</div><div class="pillar-bar-bg"><div class="pillar-bar-fill pb-body" style="width:' + bw(p.total_body) + '%"></div></div><div class="pillar-bar-val">' + fmt(p.total_body) + ' (' + bw(p.total_body) + '%)</div></div>' +
        '<div class="pillar-bar-row"><div class="pillar-bar-label">Habits</div><div class="pillar-bar-bg"><div class="pillar-bar-fill pb-habits" style="width:' + bw(p.total_habits) + '%"></div></div><div class="pillar-bar-val">' + fmt(p.total_habits) + ' (' + bw(p.total_habits) + '%)</div></div>' +
        '<div class="pillar-bar-row"><div class="pillar-bar-label">Mind</div><div class="pillar-bar-bg"><div class="pillar-bar-fill pb-mind" style="width:' + bw(p.total_mind) + '%"></div></div><div class="pillar-bar-val">' + fmt(p.total_mind) + ' (' + bw(p.total_mind) + '%)</div></div>' +
        '<div class="pillar-bar-row"><div class="pillar-bar-label">Connect</div><div class="pillar-bar-bg"><div class="pillar-bar-fill pb-connect" style="width:' + bw(p.total_connect) + '%"></div></div><div class="pillar-bar-val">' + fmt(p.total_connect) + ' (' + bw(p.total_connect) + '%)</div></div>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  // ── Render: Time-of-day heatmap ──────────────────────────────────────────────
  function actRenderHeatmap(rows) {
    var el = $('act-heatmap-body');
    if (!el || !rows || !rows.length) { if (el) el.innerHTML = '<div class="empty-state">No time data yet.</div>'; return; }
    var maxN = rows.reduce(function(m,r) { return Math.max(m, r.count||0); }, 1);
    var bars = '';
    var axisLabels = '';
    rows.forEach(function(r) {
      var h = r.hour;
      var n = r.count || 0;
      var barH = Math.max(4, Math.round((n / maxN) * 72));
      var isPeak = n >= maxN * 0.7;
      var label = h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h-12) + 'p';
      var showLabel = h % 4 === 0;
      bars += '<div class="heatmap-bar-wrap" title="' + h + ':00 — ' + n + ' activities">' +
        '<div class="heatmap-bar' + (isPeak ? ' peak' : '') + '" style="height:' + barH + 'px"></div>' +
      '</div>';
      axisLabels += '<div class="heatmap-axis-label">' + (showLabel ? label : '') + '</div>';
    });
    el.innerHTML = '<div class="heatmap-wrap">' + bars + '</div>' +
      '<div class="heatmap-axis">' + axisLabels + '</div>' +
      '<div style="margin-top:6px;font-size:10px;color:var(--text-dim)">Hours shown in Europe/London timezone · brighter bars = peak activity · hover for count</div>';
  }

  // ── Main load / refresh ──────────────────────────────────────────────────────
  function actRender(r) {
    if (!r || !r.data) return;
    var d = r.data;
    if (d.headline_json)  actRenderHeadline(d.headline_json);
    if (d.adoption_json)  actRenderAdoption(d.adoption_json, d.headline_json && d.headline_json.real_members);
    if (d.depth_json) {
      actRenderDepth(d.depth_json);
      actRenderCardio(d.depth_json.cardio_types);
    }
    if (d.watch_json)     actRenderWatch(d.watch_json);
    if (d.pillar_json)    actRenderPillar(d.pillar_json);
    if (d.heatmap_json)   actRenderHeatmap(d.heatmap_json);
    var ts = r.refreshed_at ? relTime(r.refreshed_at) : '';
    actSetStatus(ts ? 'Updated ' + ts : 'Loaded');
    var sub = $('act-sub');
    if (sub && r.refreshed_at) sub.textContent = 'Last refreshed ' + new Date(r.refreshed_at).toLocaleString('en-GB', {dateStyle:'medium',timeStyle:'short'});
  }

  window.actRefresh = function() {
    actSetStatus('Refreshing…');
    var btn = $('act-btn-refresh');
    if (btn) btn.disabled = true;
    actFetch('refresh', function(err) {
      if (err) { actSetStatus('Refresh failed'); actShowToast('Refresh failed'); }
      else { actFetch('get', function(e2, r2) { if (!e2 && r2) actRender(r2); actSetStatus('Refreshed'); actShowToast('Data refreshed'); }); }
      if (btn) btn.disabled = false;
    });
  };

  function actLoad() {
    actApplyTheme();
    actSetStatus('Loading…');
    actFetch('get', function(err, r) {
      if (err || !r) {
        actSetStatus('Load failed');
        ['act-adoption-body','act-depth-body','act-cardio-body','act-watch-body','act-pillar-body','act-heatmap-body'].forEach(function(id) {
          var e = $(id); if (e) e.innerHTML = '<div class="empty-state">Could not load data. Try refreshing.</div>';
        });
        return;
      }
      actRender(r);
    });
  }

  // Bootstrap: run on injection (router re-executes scripts)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', actLoad);
  } else {
    actLoad();
  }
})();
