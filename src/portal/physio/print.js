  /* ============================ PM-1216: physio W5 — printable plan (the paper fallback) ============================
     RMP delivers plans as a PDF; ours is the app. This is the fallback for a patient who wants paper: a print
     sheet built in-page and shown only under @media print, so the browser's Print → Save as PDF does the export
     with no library and no popup. Works for a draft (from the builder) and a sent plan (from the patient view). */
  var rhPrintCssDone = false, rhPartnerName = '';
  function rhPrintCss(){
    if (rhPrintCssDone) return; rhPrintCssDone = true;
    var s = document.createElement('style');
    s.textContent =
      '#rh-print{display:none;}' +
      '@media print{' +
        'body *{visibility:hidden !important;}' +
        '#rh-print,#rh-print *{visibility:visible !important;}' +
        '#rh-print{display:block !important;position:absolute;left:0;top:0;width:100%;background:#fff;color:#111;font-family:Inter,"DM Sans",system-ui,sans-serif;font-size:11.5pt;line-height:1.4;padding:0;margin:0;}' +
        '#rh-print h1{font-size:19pt;margin:0 0 2pt;}#rh-print h2{font-size:13pt;margin:16pt 0 6pt;border-bottom:1px solid #999;padding-bottom:3pt;}' +
        '#rh-print .meta{color:#444;font-size:10.5pt;margin-bottom:8pt;}' +
        '#rh-print .ex{display:flex;gap:10pt;align-items:flex-start;padding:8pt 0;border-bottom:1px solid #ddd;break-inside:avoid;page-break-inside:avoid;}' +
        '#rh-print .ex img{width:96pt;height:60pt;object-fit:cover;border:1px solid #ccc;flex:none;}#rh-print .ex .noimg{width:96pt;height:60pt;border:1px solid #ccc;flex:none;display:flex;align-items:center;justify-content:center;font-size:9pt;color:#888;}' +
        '#rh-print .ex .nm{font-weight:700;font-size:12pt;}#rh-print .ex .rx{font-weight:600;color:#155;margin:2pt 0;}#rh-print .ex .cu{white-space:pre-wrap;color:#333;font-size:10.5pt;}#rh-print .ex .nt{color:#555;font-size:10.5pt;font-style:italic;margin-top:2pt;}' +
        '#rh-print .box{border:1px solid #999;padding:8pt 10pt;margin:8pt 0;break-inside:avoid;}#rh-print .box.warn{border-color:#a33;}' +
        '#rh-print table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-top:6pt;break-inside:avoid;page-break-inside:avoid;}#rh-print th,#rh-print td{border:1px solid #bbb;padding:3pt 4pt;text-align:left;vertical-align:middle;}#rh-print th{background:#eee;font-weight:600;}' +
        '#rh-print .tick{display:inline-block;width:9pt;height:9pt;border:1px solid #666;margin-right:2pt;vertical-align:middle;}' +
        '#rh-print .q{margin:3pt 0;}#rh-print .q small{color:#555;}' +
        '#rh-print .foot{margin-top:14pt;font-size:9pt;color:#666;border-top:1px solid #999;padding-top:4pt;}' +
        '#rh-print .pb{page-break-before:always;}' +
      '}';
    document.head.appendChild(s);
  }
  function rhPrintPlan(p, items){
    rhPrintCss();
    var host = $c('rh-print'); if (!host){ host = document.createElement('div'); host.id = 'rh-print'; document.body.appendChild(host); }
    var live = (items || []).filter(function(i){ return !i.removed_at; });
    var patient = rhPtLabel(p.member_email) || '\u2014', pemail = (p.member_email || '').toLowerCase();
    var weeks = Math.max(1, Math.min(52, +p.duration_weeks || 4)), start = p.start_date ? new Date(p.start_date + 'T00:00:00') : new Date();
    var mons = Array.isArray(p.monitor) ? p.monitor : [];
    var dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    function ticks(n){ var o = ''; for (var i = 0; i < n; i++) o += '<span class="tick"></span>'; return o; }
    /* one diary table per week: a row per exercise (N tick boxes per day = times daily), plus one row for the monitor check-in */
    var diary = '';
    for (var w = 0; w < weeks; w++){
      var ws = new Date(start.getTime() + w * 7 * 86400000);
      diary += '<table' + (w % 4 === 0 && w ? ' class="pb"' : '') + '><thead><tr><th style="width:34%;">Week ' + (w + 1) + ' \u2014 from ' + ws.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</th>' + dayNames.map(function(d){ return '<th>' + d + '</th>'; }).join('') + '</tr></thead><tbody>' +
        live.map(function(i){ return '<tr><td>' + esc(i.name) + '<br><small>' + esc((i.times_daily || 1) + '\u00d7 daily' + ((i.days_per_week || 7) < 7 ? ', ' + i.days_per_week + ' days/wk' : '')) + '</small></td>' + dayNames.map(function(){ return '<td>' + ticks(Math.min(4, i.times_daily || 1)) + '</td>'; }).join('') + '</tr>'; }).join('') +
        (mons.length ? '<tr><td>Check-in (0\u201310): ' + esc(mons.map(function(k){ var m = RH_MONITOR.filter(function(x){ return x.key === k; })[0]; return m ? m.label : k; }).join(' / ')) + '</td>' + dayNames.map(function(){ return '<td style="height:18pt;"></td>'; }).join('') + '</tr>' : '') +
        '</tbody></table>';
    }
    host.innerHTML =
      '<h1>' + esc(p.name || 'Rehab plan') + '</h1>' +
      '<div class="meta">For <b>' + esc(patient) + '</b>' + (pemail && pemail !== patient ? ' (' + esc(pemail) + ')' : '') + ' \u00b7 from ' + esc(rhFmt(p.start_date)) + ' \u00b7 ' + weeks + ' week' + (weeks === 1 ? '' : 's') + (rhPartnerName ? ' \u00b7 ' + esc(rhPartnerName) : '') + (p.status ? ' \u00b7 ' + esc(p.status) : '') + '</div>' +
      (p.note ? '<div class="box"><b>From your physio</b><br>' + esc(p.note).replace(/\n/g, '<br>') + '</div>' : '') +
      '<h2>Your exercises</h2>' +
      (live.length ? live.map(function(i, n){ return '<div class="ex">' + (i.image_url ? '<img src="' + esc(i.image_url) + '" alt=""/>' : '<div class="noimg">no picture</div>') + '<div><div class="nm">' + (n + 1) + '. ' + esc(i.name) + '</div><div class="rx">' + esc(rhRxLine(i)) + '</div>' + (i.cues ? '<div class="cu">' + esc(i.cues) + '</div>' : '') + (i.note ? '<div class="nt">' + esc(i.note) + '</div>' : '') + '</div></div>'; }).join('') : '<div class="meta">No exercises on this plan yet.</div>') +
      (mons.length ? '<h2>After each session</h2><div class="meta">Rate these 0\u201310 once a day, after your exercises:</div>' + mons.map(function(k){ var m = RH_MONITOR.filter(function(x){ return x.key === k; })[0]; return m ? '<div class="q">' + esc(m.q) + ' <small>0 = ' + esc(m.lo) + ' \u00b7 10 = ' + esc(m.hi) + '</small></div>' : ''; }).join('') : '') +
      (p.safety_netting ? '<div class="box warn"><b>Important</b><br>' + esc(p.safety_netting).replace(/\n/g, '<br>') + '</div>' : '') +
      (p.red_flags ? '<div class="box warn"><b>Watch for</b><br>' + esc(p.red_flags).replace(/\n/g, '<br>') + '</div>' : '') +
      '<h2 class="pb">Exercise diary</h2><div class="meta">Tick a box each time you do the exercise. Bring this to your next appointment \u2014 or use the VYVE app and your physio sees it as you go.</div>' + diary +
      '<div class="foot">VYVE Health CIC \u00b7 vyvehealth.co.uk \u00b7 printed ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</div>';
    /* let images start loading before the dialog opens; the dialog itself waits for none of them, so a short beat helps */
    setTimeout(function(){ try { window.print(); } catch(_){} }, 250);
  }
  function rhPrintCurrent(){ if (!rhCur) return; rhCollect(); rhPrintPlan(rhCur, rhCur.items); }
  function rhPrintPv(){ if (pvPlan) rhPrintPlan(pvPlan, pvItems); }
  if ($c('rh-print-btn')) $c('rh-print-btn').addEventListener('click', rhPrintCurrent);
  if ($c('pv-print')) $c('pv-print').addEventListener('click', rhPrintPv);
  /* ============================ end PM-1216 print ============================ */
