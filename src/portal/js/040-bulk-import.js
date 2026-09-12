  async function loadLibraries(){
    try {
      var res = await Promise.all([
        rest('/coach_forms?' + pscope() + '&active=eq.true&select=id,kind,title'),
        rest('/coach_templates?' + pscope() + '&active=eq.true&select=id,kind,name')
      ]);
      lib.forms = res[0] || []; lib.tpls = res[1] || [];
    } catch(e){ lib = { forms: [], tpls: [] }; }
    SLOTS.forEach(function(sl){
      var el = $c(sl.sel); if (!el) return;
      el.innerHTML = '<option value="">None</option>' + sl.pool().map(function(n){ return '<option>' + esc(n) + '</option>'; }).join('');
    });
  }
  function readAssignSelects(){
    var a = {};
    SLOTS.forEach(function(sl){ var el = $c(sl.sel); if (el && el.value) a[sl.slot] = el.value; });
    return a;
  }
  var BASE_COLS = ['First name','Last name','Email','Date of birth (YYYY-MM-DD)','Gender'];
  async function downloadTemplate(){
    var wb = new ExcelJS.Workbook();
    var ws = wb.addWorksheet('Clients');
    var ls = wb.addWorksheet('Lists'); ls.state = 'veryHidden';
    var cols = BASE_COLS.concat(SLOTS.map(function(s){ return s.col; }));
    ws.addRow(cols);
    ws.getRow(1).font = { bold: true };
    cols.forEach(function(c, i){ ws.getColumn(i+1).width = Math.max(18, c.length + 4); });
    // Lists sheet: col A gender, then one column per slot
    var genders = ['Male','Female','Non-binary'];
    genders.forEach(function(g, i){ ls.getCell(i+1, 1).value = g; });
    SLOTS.forEach(function(sl, si){
      sl.pool().forEach(function(n, i){ ls.getCell(i+1, si+2).value = n; });
    });
    function colLetter(n){ var sTr=''; while(n>0){ var m=(n-1)%26; sTr=String.fromCharCode(65+m)+sTr; n=Math.floor((n-1)/26); } return sTr; }
    for (var r = 2; r <= 201; r++){
      ws.getCell(r, 5).dataValidation = { type:'list', allowBlank:true, formulae:['Lists!$A$1:$A$' + genders.length] };
      SLOTS.forEach(function(sl, si){
        var count = sl.pool().length;
        if (!count) return;
        var L = colLetter(si+2);
        ws.getCell(r, 6+si).dataValidation = { type:'list', allowBlank:true, formulae:['Lists!$' + L + '$1:$' + L + '$' + count] };
      });
    }
    var buf = await wb.xlsx.writeBuffer();
    var blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vyve-clients-template.xlsx';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
  }
  var pendingRows = [];
  function parseCSV(text){
    var rows = [], row = [], cur = '', inQ = false;
    for (var i = 0; i < text.length; i++){
      var ch = text[i];
      if (inQ){ if (ch === '"'){ if (text[i+1] === '"'){ cur += '"'; i++; } else inQ = false; } else cur += ch; }
      else if (ch === '"') inQ = true;
      else if (ch === ','){ row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r'){ if (ch === '\r' && text[i+1] === '\n') i++; row.push(cur); cur = ''; if (row.some(function(c){return c !== '';})) rows.push(row); row = []; }
      else cur += ch;
    }
    if (cur !== '' || row.length){ row.push(cur); if (row.some(function(c){return c !== '';})) rows.push(row); }
    return rows;
  }
  function rowsToClients(grid){
    if (!grid.length) return [];
    var hdr = grid[0].map(function(h){ return String(h||'').trim().toLowerCase(); });
    function idx(name){ return hdr.findIndex(function(h){ return h.indexOf(name) === 0; }); }
    var iF = idx('first name'), iL = idx('last name'), iE = idx('email'), iD = idx('date of birth'), iG = idx('gender');
    var slotIdx = {};
    SLOTS.forEach(function(sl){ slotIdx[sl.slot] = idx(sl.col.toLowerCase()); });
    return grid.slice(1).map(function(r){
      var asg = {};
      SLOTS.forEach(function(sl){ var v = slotIdx[sl.slot] >= 0 ? String(r[slotIdx[sl.slot]]||'').trim() : ''; if (v) asg[sl.slot] = v; });
      var dobRaw = iD >= 0 ? r[iD] : '';
      var dob = '';
      if (dobRaw instanceof Date) dob = dobRaw.toISOString().slice(0,10);
      else if (dobRaw) dob = String(dobRaw).trim().slice(0,10);
      return {
        firstName: iF >= 0 ? String(r[iF]||'').trim() : '',
        lastName:  iL >= 0 ? String(r[iL]||'').trim() : '',
        email:     iE >= 0 ? String(r[iE]||'').trim().toLowerCase() : '',
        dob: dob || null,
        gender: iG >= 0 ? String(r[iG]||'').trim() || null : null,
        assignments: asg
      };
    }).filter(function(c){ return c.firstName || c.email; });
  }
  async function handleFile(file){
    var name = (file.name || '').toLowerCase();
    var grid = [];
    if (name.slice(-4) === '.csv'){
      grid = parseCSV(await file.text());
    } else {
      var wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      var ws = wb.getWorksheet('Clients') || wb.worksheets[0];
      ws.eachRow({ includeEmpty: false }, function(row){
        var vals = [];
        for (var c = 1; c <= row.cellCount; c++){
          var v = row.getCell(c).value;
          if (v && typeof v === 'object' && v.text) v = v.text;
          if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
          vals.push(v == null ? '' : v);
        }
        grid.push(vals);
      });
    }
    pendingRows = rowsToClients(grid);
    var pv = $c('bu-preview');
    if (!pendingRows.length){ pv.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No client rows found in that file.</p>'; $c('bu-actions').style.display = 'none'; return; }
    if (pendingRows.length > 100){ pv.innerHTML = '<p style="color:#e8834a;font-size:13px;">' + pendingRows.length + ' rows found \u2014 maximum is 100 per upload. Split the file.</p>'; $c('bu-actions').style.display = 'none'; return; }
    pv.innerHTML = '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">' + pendingRows.length + ' client' + (pendingRows.length===1?'':'s') + ' ready:</div>' +
      '<div style="max-height:260px;overflow:auto;border:1px solid var(--border);border-radius:8px;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">' +
      '<tr style="text-align:left;"><th style="padding:8px;">Name</th><th style="padding:8px;">Email</th><th style="padding:8px;">Assigned</th></tr>' +
      pendingRows.map(function(c){
        var asg = Object.keys(c.assignments).map(function(k){ return esc(c.assignments[k]); }).join(', ') || '\u2014';
        return '<tr style="border-top:1px solid var(--border);"><td style="padding:8px;">' + esc((c.firstName + ' ' + (c.lastName||'')).trim()) + '</td><td style="padding:8px;">' + esc(c.email) + '</td><td style="padding:8px;color:var(--text-muted);">' + asg + '</td></tr>';
      }).join('') + '</table></div>';
    $c('bu-results').innerHTML = '';
    $c('bu-actions').style.display = '';
  }
  async function confirmBulk(){
    var btn = $c('bu-confirm'), msg = $c('bu-msg');
    btn.disabled = true; msg.textContent = 'Creating ' + pendingRows.length + ' accounts and sending invites\u2026 this can take a minute.';
    try {
      var r = await ef({ action: 'bulk', rows: pendingRows, send_emails: true });
      msg.textContent = '';
      var out = '<div style="font-size:13px;margin-bottom:8px;"><strong>' + r.created + '</strong> created' + (r.failed ? ', <strong style="color:#e8834a;">' + r.failed + '</strong> failed:' : '.') + '</div>';
      if (r.failed) out += (r.results||[]).filter(function(x){ return !x.ok; }).map(function(x){ return '<div style="font-size:12.5px;color:#e8834a;">' + esc(x.email) + ' \u2014 ' + esc(x.error||'') + '</div>'; }).join('');
      $c('bu-results').innerHTML = out;
      $c('bu-preview').innerHTML = ''; $c('bu-actions').style.display = 'none'; pendingRows = [];
      await loadClients();
    } catch(e){ msg.textContent = 'Upload failed: ' + e.message; }
    btn.disabled = false;
  }
  $c('cl-bulk-btn').addEventListener('click', function(){ $c('cl-bulk-card').style.display = ''; $c('cl-editor').style.display = 'none'; });
  $c('bu-close').addEventListener('click', function(){ $c('cl-bulk-card').style.display = 'none'; });
  $c('bu-template').addEventListener('click', downloadTemplate);
  $c('bu-file').addEventListener('change', function(){ if (this.files && this.files[0]) handleFile(this.files[0]); this.value = ''; });
  $c('bu-confirm').addEventListener('click', confirmBulk);

  /* ── My Plans: template + form builders (PM-954e) ── */
  var plKind = 'onboarding', plEditing = null, plItems = [], exerciseNames = [];
  var IS_FORM = function(k){ return k === 'onboarding' || k === 'checkin' || k === 'lead'; };
  var KIND_LABEL = { onboarding:'questionnaire', checkin:'check-in form', lead:'lead form', habits:'habits plan', workout:'workout plan', workout_day:'day template', program:'programme', nutrition:'nutrition plan', supplements:'supplement plan' };
  /* Trainerize W9 part 2 (#91). 'longtext' is a legacy type authored outside the
     builder — the one live coach_forms row uses it and neither renderer knew it,
     so it fell through to a single-line input. Aliased on READ so the stored
     question is never rewritten. */
