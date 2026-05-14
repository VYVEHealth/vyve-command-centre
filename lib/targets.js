// =====================================================================
// VYVE Command Centre — KPI targets
// Stores target values for KPIs (mrr, arr, runway, sessions/month, content/week, etc.)
// Provides helpers for tiles to show "vs target" delta and for charts to draw
// horizontal target lines.
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.targets';

  // Default targets — sensible starting points the user can edit in Settings.
  var DEFAULTS = {
    mrr: { value: 20000, label: 'MRR', unit: 'currency', period: 'monthly' },
    arr: { value: 240000, label: 'ARR', unit: 'currency', period: 'annual' },
    runway: { value: 18, label: 'Runway', unit: 'months', period: null },
    sessions_per_month: { value: 40, label: 'Sessions delivered / month', unit: 'count', period: 'monthly' },
    content_per_week: { value: 5, label: 'Content pieces / week', unit: 'count', period: 'weekly' },
    deals_closed_per_month: { value: 2, label: 'Deals closed / month', unit: 'count', period: 'monthly' },
    pipeline_value: { value: 100000, label: 'Pipeline value', unit: 'currency', period: null },
    action_completion: { value: 70, label: 'Action plan completion', unit: 'percent', period: null }
  };

  function load(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var stored = raw ? JSON.parse(raw) : {};
      // Merge defaults with stored (stored wins)
      var merged = {};
      Object.keys(DEFAULTS).forEach(function(k){
        merged[k] = Object.assign({}, DEFAULTS[k], stored[k] || {});
      });
      // Allow custom keys too
      Object.keys(stored).forEach(function(k){ if (!merged[k]) merged[k] = stored[k]; });
      return merged;
    } catch(e){ return Object.assign({}, DEFAULTS); }
  }

  function save(targets){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(targets || {})); return true; }
    catch(e){ return false; }
  }

  function get(key){ return load()[key]; }

  function set(key, value){
    var t = load();
    if (typeof value === 'number') {
      t[key] = Object.assign({}, t[key] || DEFAULTS[key] || { label: key, unit: 'count' }, { value: value });
    } else {
      t[key] = Object.assign({}, t[key] || DEFAULTS[key] || { label: key, unit: 'count' }, value);
    }
    save(t);
    return t[key];
  }

  // ---- Format helpers ----
  function formatValue(val, unit){
    if (val == null || isNaN(val)) return '—';
    switch (unit) {
      case 'currency':
        return window.VYVE_DATA && window.VYVE_DATA.fmtGBP ? window.VYVE_DATA.fmtGBP(val) : '£' + Math.round(val).toLocaleString();
      case 'months':
        return val + ' mo';
      case 'percent':
        return Math.round(val) + '%';
      default:
        return val.toLocaleString();
    }
  }

  // Compute delta: current vs target.
  // Returns { current, target, delta (signed), pct (signed %), direction ('above'/'below'/'at'), good (boolean) }
  // `goodAbove` defaults to true (current > target = good). Set false for things like burn rate.
  function compare(key, current, opts){
    opts = opts || {};
    var t = get(key);
    if (!t) return null;
    var target = Number(t.value) || 0;
    var diff = (Number(current) || 0) - target;
    var pct = target ? (diff / target) * 100 : null;
    var direction = diff > 0 ? 'above' : (diff < 0 ? 'below' : 'at');
    var goodAbove = opts.goodAbove !== false;
    var good = direction === 'at' || (goodAbove ? direction === 'above' : direction === 'below');
    return {
      current: Number(current) || 0,
      target: target,
      delta: diff,
      pct: pct,
      direction: direction,
      good: good,
      unit: t.unit,
      label: t.label
    };
  }

  // Render a small "vs target" badge for a stat tile.
  // Example output: <span class="kpi-vs-target good">+15% vs target</span>
  function renderVsBadge(key, current, opts){
    var c = compare(key, current, opts);
    if (!c || !c.target) return '';
    var sign = c.pct > 0 ? '+' : '';
    var pctStr = c.pct == null ? '' : (sign + Math.round(c.pct) + '%');
    var cls = c.good ? 'good' : (c.direction === 'at' ? 'at' : 'below');
    return '<span class="kpi-vs-target ' + cls + '">' + pctStr + ' vs target</span>';
  }

  // Build SVG markup for a horizontal target line over a sparkline.
  // Caller passes width, height, padding, dataMax (top of value range).
  // Returns the SVG fragment to inject after the polyline.
  function targetLineSvg(key, opts){
    opts = opts || {};
    var t = get(key);
    if (!t || !t.value) return '';
    var w = opts.width || 380;
    var h = opts.height || 100;
    var pad = opts.padding || 8;
    var dataMax = opts.dataMax || 1;
    var target = Number(t.value) || 0;
    if (target > dataMax * 1.5) return '';  // off-chart, hide
    var y = h - pad - (target / dataMax) * (h - pad*2);
    return '<line x1="' + pad + '" y1="' + y.toFixed(1) + '" x2="' + (w-pad) + '" y2="' + y.toFixed(1) + '" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3,3" opacity="0.55"/>' +
           '<text x="' + (w - pad - 2) + '" y="' + (y - 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="var(--text-muted)" font-family="var(--font-mono, monospace)">target ' + formatValue(target, t.unit) + '</text>';
  }

  window.VYVE_TARGETS = {
    load: load,
    save: save,
    get: get,
    set: set,
    compare: compare,
    renderVsBadge: renderVsBadge,
    targetLineSvg: targetLineSvg,
    formatValue: formatValue,
    DEFAULTS: DEFAULTS
  };
})();
