// =====================================================================
// VYVE Command Centre — PDF export via window.print()
// Adds a header (logo + page title + date) + sets up the print stylesheet,
// then triggers the browser's print dialog. User picks "Save as PDF".
// =====================================================================

(function(){
  'use strict';

  // Insert a print-only header element with VYVE branding + page name + date.
  function insertPrintHeader(title, subtitle){
    var existing = document.getElementById('vyve-print-header');
    if (existing) existing.remove();
    var hdr = document.createElement('div');
    hdr.id = 'vyve-print-header';
    hdr.innerHTML =
      '<div class="vph-row">' +
        '<div class="vph-brand">' +
          '<div class="vph-logo">VYVE</div>' +
          '<div class="vph-strapline">Build health before it breaks.</div>' +
        '</div>' +
        '<div class="vph-meta">' +
          '<div class="vph-title">' + (title || '') + '</div>' +
          '<div class="vph-date">' + new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) + '</div>' +
          (subtitle ? '<div class="vph-sub">' + subtitle + '</div>' : '') +
        '</div>' +
      '</div>';
    document.body.insertBefore(hdr, document.body.firstChild);
  }

  function removePrintHeader(){
    var h = document.getElementById('vyve-print-header');
    if (h) h.remove();
  }

  // Generic per-page export. Triggers from any "Print as PDF" button.
  // opts.title overrides the auto-detected page title.
  // opts.subtitle adds a small line under the date.
  function printPage(opts){
    opts = opts || {};
    var title = opts.title || document.querySelector('.page.active .page-title');
    if (title && title.textContent) title = title.textContent.trim();
    if (typeof title !== 'string') title = 'Page';

    insertPrintHeader(title, opts.subtitle);
    document.body.classList.add('print-mode');

    // Give CSS one tick to apply
    setTimeout(function(){
      window.print();
      // Cleanup after print dialog
      setTimeout(function(){
        document.body.classList.remove('print-mode');
        removePrintHeader();
      }, 500);
    }, 50);
  }

  // ---- Board pack: compose multi-section print of investor data ----
  // Hidden DOM written under a separate container, only visible during print.
  function buildBoardPack(){
    if (!window.VYVE_DATA) return null;
    var D = window.VYVE_DATA;

    // Section 1: snapshot KPIs
    var pipeline = (function(){
      try { var v = localStorage.getItem('vyve_investors'); return v ? JSON.parse(v) : []; } catch(e){ return []; }
    })();
    var closed = pipeline.filter(function(i){ return (i.stage||'').toLowerCase() === 'closed'; });
    var committed = closed.reduce(function(s, i){ return s + (Number(i.amount)||0); }, 0);
    var cfg = (function(){
      try { var v = localStorage.getItem('vyve.investor.round'); return v ? JSON.parse(v) : { name: 'Pre-seed', target: 500000 }; } catch(e){ return { name: 'Pre-seed', target: 500000 }; }
    })();
    var runway = D.finance.runwayMonths();
    var latestFin = D.finance.all()[0] || {};
    var mrr = Number(latestFin.mrr) || 0;
    var cash = Number(latestFin.cash) || 0;

    // Section 2: pipeline by stage
    var stageGroups = { approach: [], meeting: [], dd: [], termsheet: [], closed: [] };
    pipeline.forEach(function(i){ var s = (i.stage||'approach').toLowerCase(); if (stageGroups[s]) stageGroups[s].push(i); });

    // Section 3: latest board update
    var updates = (function(){
      try { var v = localStorage.getItem('vyve.investor.updates'); return v ? JSON.parse(v) : []; } catch(e){ return []; }
    })();

    // Section 4: KPI deltas — closing deals this month, sessions delivered 30d, content published 30d
    var dealsClosing = D.deals.closingSoon ? D.deals.closingSoon() : [];
    var sessionsDelivered30d = D.sessions.delivered30d ? D.sessions.delivered30d().length : 0;
    var contentPublished30d = D.content.publishedLast30 ? D.content.publishedLast30().length : 0;

    var html = '';
    html += '<section class="bp-section"><h2>Snapshot</h2>';
    html += '<div class="bp-kpis">';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">MRR</div><div class="bp-kpi-value">' + D.fmtGBP(mrr) + '</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Cash on hand</div><div class="bp-kpi-value">' + D.fmtGBP(cash) + '</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Runway</div><div class="bp-kpi-value">' + (runway != null ? runway + ' months' : '—') + '</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">' + cfg.name + ' target</div><div class="bp-kpi-value">' + (cfg.target ? D.fmtGBP(cfg.target) : '—') + '</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Committed</div><div class="bp-kpi-value">' + D.fmtGBP(committed) + ' (' + (cfg.target ? Math.round(committed/cfg.target*100) : 0) + '%)</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Pipeline</div><div class="bp-kpi-value">' + pipeline.length + ' investors</div></div>';
    html += '</div></section>';

    html += '<section class="bp-section"><h2>Operating signal (last 30 days)</h2>';
    html += '<div class="bp-kpis">';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Sessions delivered</div><div class="bp-kpi-value">' + sessionsDelivered30d + '</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Content published</div><div class="bp-kpi-value">' + contentPublished30d + '</div></div>';
    html += '  <div class="bp-kpi"><div class="bp-kpi-label">Deals closing this month</div><div class="bp-kpi-value">' + dealsClosing.length + '</div></div>';
    html += '</div></section>';

    var stageLabels = { approach: 'To approach', meeting: 'First meeting', dd: 'Due diligence', termsheet: 'Term sheet', closed: 'Closed' };
    html += '<section class="bp-section"><h2>Fundraise pipeline</h2>';
    Object.keys(stageGroups).forEach(function(stage){
      var rows = stageGroups[stage];
      if (!rows.length) return;
      html += '<h3>' + stageLabels[stage] + ' (' + rows.length + ')</h3>';
      html += '<table class="bp-table"><thead><tr><th>Name</th><th>Type</th><th>Round</th><th>Amount</th><th>Last contact</th><th>Next step</th></tr></thead><tbody>';
      rows.forEach(function(i){
        html += '<tr>' +
          '<td>' + (i.name || i.firm || '') + '</td>' +
          '<td>' + (i.type || '') + '</td>' +
          '<td>' + (i.round || '') + '</td>' +
          '<td>' + (i.amount ? D.fmtGBP(i.amount) : '') + '</td>' +
          '<td>' + (i.last_contact ? D.fmtDate(i.last_contact) : '') + '</td>' +
          '<td>' + (i.next_step || '') + '</td>' +
        '</tr>';
      });
      html += '</tbody></table>';
    });
    html += '</section>';

    if (updates.length){
      html += '<section class="bp-section bp-page-break"><h2>Latest board update</h2>';
      var u = updates[0];
      html += '<div class="bp-update">';
      html += '<div class="bp-update-meta"><strong>' + (u.title || '') + '</strong> · ' + D.fmtDate(u.at) + '</div>';
      html += '<div class="bp-update-body">' + (u.body || '').split('\n').map(function(l){ return '<p>' + l + '</p>'; }).join('') + '</div>';
      html += '</div>';
      html += '</section>';
    }

    return html;
  }

  function printBoardPack(){
    var html = buildBoardPack();
    if (!html) { alert('VYVE_DATA unavailable. Reload the page and try again.'); return; }

    var container = document.getElementById('vyve-board-pack');
    if (container) container.remove();
    container = document.createElement('div');
    container.id = 'vyve-board-pack';
    container.innerHTML = html;
    document.body.appendChild(container);

    insertPrintHeader('Board pack', 'Generated from VYVE Command Centre');
    document.body.classList.add('print-board-pack');

    setTimeout(function(){
      window.print();
      setTimeout(function(){
        document.body.classList.remove('print-board-pack');
        removePrintHeader();
        container.remove();
      }, 600);
    }, 80);
  }

  window.VYVE_PDF = {
    printPage: printPage,
    printBoardPack: printBoardPack
  };
})();
