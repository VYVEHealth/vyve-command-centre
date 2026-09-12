  /* ============================ PM-1211: physio Wave 2 — rehab plan builder ============================
     Plans list → builder (prescription per exercise, library picker, note, safety netting, red flags, Monitor)
     → Save draft / Send to patient (rpc/rehab_apply_plan) / Save as template. Templates view (own + VYVE stock,
     coach_templates kind='rehab_plan'). Add patient → coach-provision-client create (the invite carries the
     partner slug as its trial code, so partner_partners.trial_days is the free rehab month — Lewis owns the number).
     Every patient-facing string below is a PLACEHOLDER for Lewis; safety netting, red flags and Monitor wording
     are PLACEHOLDERS for Phil. Nothing here reads the RMP demo rows specially — they are library rows like any other. */
  var RH_MONITOR = [
    { key: 'pain',       label: 'Pain',           q: 'How is your pain today?',                       lo: 'No pain',                        hi: 'Worst pain possible' },
    { key: 'mobility',   label: 'Mobility',       q: 'How is your mobility today?',                   lo: 'I can\u2019t move at all',        hi: 'I have full mobility' },
    { key: 'difficulty', label: 'Difficulty',     q: 'How difficult was your session today?',         lo: 'Easy',                           hi: 'Very difficult' },
    { key: 'strength',   label: 'Strength',       q: 'How were your strength levels today?',          lo: 'Low strength',                   hi: 'High strength' },
    { key: 'everyday',   label: 'Everyday tasks', q: 'How was your ability to do everyday tasks?',    lo: 'Unable to do normal activities', hi: 'Fully able to do all activities' }
  ];
  /* PLACEHOLDER — Phil replaces before any patient sees it. Kept verbatim-free of RMP's paragraph on purpose. */
  var RH_SAFETY_PLACEHOLDER = '[Safety netting — placeholder pending Phil\u2019s clinical copy. Tells the patient which symptoms mean stop and seek urgent care.]';
  var RH_SEL = 'id,partner_id,member_email,name,status,start_date,duration_weeks,note,safety_netting,red_flags,monitor,template_id,sent_at,wpc_id,created_at,updated_at';
  var RH_ITEM_SEL = 'id,plan_id,position,exercise_id,name,cues,video_url,image_url,hold_s,reps,times_daily,rest_s,days_per_week,both_sides,note,removed_at';
  var rhPlans = [], rhPlansLoaded = false, rhFilterEmail = '', rhTpls = [], rhTplsLoaded = false;
  var rhCur = null;        /* the plan being edited: { id, name, member_email, start_date, duration_weeks, note, safety_netting, red_flags, monitor[], template_id, status, items[] } */
  var rhCssDone = false;
  function rhCss(){
    if (rhCssDone) return; rhCssDone = true;
    var s = document.createElement('style');
    s.textContent =
      '.rh-pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.02em;border:1px solid var(--border);color:var(--text-muted);}' +
      '.rh-pill.active{border-color:var(--vyve-teal);color:var(--vyve-teal);}.rh-pill.completed{border-color:var(--gold);color:var(--gold);}' +
      '.rh-row{display:flex;gap:12px;align-items:flex-start;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);margin-bottom:10px;}' +
      '.rh-row .th{width:88px;height:56px;border-radius:8px;object-fit:cover;background:#000;flex:none;cursor:pointer;}' +
      '.rh-row .th.ph{display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;cursor:default;}' +
      '.rh-rx{display:grid;grid-template-columns:repeat(6,minmax(78px,1fr));gap:8px;margin-top:8px;}' +
      '.rh-rx label{display:block;font-size:10.5px;font-weight:600;color:var(--text-muted);margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em;}' +
      '.rh-rx input,.rh-rx select{width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text);font-size:12.5px;font-family:inherit;}' +
      '@media (max-width:760px){.rh-rx{grid-template-columns:repeat(3,1fr);}}' +
      '.rh-ib{background:none;border:1px solid var(--border);border-radius:7px;color:var(--text-muted);font-size:12px;padding:4px 8px;cursor:pointer;font-family:inherit;}.rh-ib:hover{color:var(--text);border-color:var(--text-muted);}' +
      '.rh-mon{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px;}.rh-mon label{display:flex;align-items:center;gap:6px;padding:7px 11px;border:1px solid var(--border);border-radius:9px;font-size:12.5px;cursor:pointer;background:var(--surface-2);}' +
      '.rh-mon label.on{border-color:var(--vyve-teal);color:var(--vyve-teal);}' +
      '.rh-q{font-size:12.5px;padding:8px 10px;border-left:3px solid var(--vyve-teal);background:var(--surface-2);border-radius:0 8px 8px 0;margin-bottom:6px;}.rh-q .a{font-size:11px;color:var(--text-muted);}' +
      '.rh-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;}' +
      '.rh-pick .c{border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--surface-2);cursor:pointer;}.rh-pick .c:hover{border-color:var(--vyve-teal);}' +
      '.rh-pick .c img,.rh-pick .c .noimg{width:100%;aspect-ratio:16/9;object-fit:cover;background:#000;display:block;}.rh-pick .c .noimg{display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;}' +
      '.rh-pick .c .n{padding:8px 10px;font-size:12.5px;font-weight:600;line-height:1.3;}.rh-pick .c .m{padding:0 10px 8px;font-size:11px;color:var(--text-muted);}' +
      '.rh-ph{font-size:11px;color:var(--gold);margin-top:4px;}' +
      '.rh-ta{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;resize:vertical;}';
    document.head.appendChild(s);
  }
  function rhToday(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function rhFmt(iso){ if (!iso) return '\u2014'; var d = new Date(iso); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function rhPtOptions(sel){
    var opts = roster.filter(function(c){ return c.status !== 'archived'; }).map(function(c){
      var e = (c.member_email || '').toLowerCase();
      return '<option value="' + esc(e) + '"' + (sel === e ? ' selected' : '') + '>' + esc(ptName(c)) + (c.status === 'invited' ? ' (invited)' : '') + '</option>';
    });
    return '<option value="">Choose a patient\u2026</option>' + opts.join('');
  }
  function rhPtLabel(email){
    var e = (email || '').toLowerCase();
    for (var i = 0; i < roster.length; i++){ if ((roster[i].member_email || '').toLowerCase() === e) return ptName(roster[i]); }
    return email || '\u2014';
  }
  function rhSessions(p){
    /* sessions the patient is asked to do = the busiest exercise's schedule × weeks (adherence denominator, spec §5) */
    var per = 0; (p.items || []).forEach(function(i){ per = Math.max(per, (i.times_daily || 1) * (i.days_per_week || 7)); });
    return per * (p.duration_weeks || 0);
  }

  /* ── Plans list ── */
  async function rhInit(force){
    rhCss();
    if (!rhPlansLoaded || force){
      try { rhPlans = await rest('/rehab_plans?partner_id=eq.' + partnerId + '&select=' + RH_SEL + '&order=updated_at.desc') || []; } catch(_){ rhPlans = []; }
      rhPlansLoaded = true;
    }
    rhRenderList();
  }
  function rhRenderList(){
    $c('rh-editor').style.display = 'none'; $c('rh-pv').style.display = 'none'; $c('rh-list-card').style.display = '';
    var rows = rhFilterEmail ? rhPlans.filter(function(p){ return (p.member_email || '').toLowerCase() === rhFilterEmail; }) : rhPlans;
    $c('rh-filter').innerHTML = rhFilterEmail ? ('Showing plans for <b>' + esc(rhPtLabel(rhFilterEmail)) + '</b> \u00b7 <a href="#" id="rh-filter-clear" style="color:var(--vyve-teal);">show all</a>') : '';
    if ($c('rh-filter-clear')) $c('rh-filter-clear').addEventListener('click', function(e){ e.preventDefault(); rhFilterEmail = ''; rhRenderList(); });
    var list = $c('rh-list');
    if (!rows.length){ list.innerHTML = '<div class="empty-state"><h3>No plans yet</h3><p>Build a rehab plan, then send it \u2014 it lands in your patient\u2019s VYVE app as their Rehab tab.</p></div>'; return; }
    list.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;"><th style="padding:6px 8px;">Plan</th><th style="padding:6px 8px;">Patient</th><th style="padding:6px 8px;">Status</th><th style="padding:6px 8px;">Starts</th><th style="padding:6px 8px;">Weeks</th><th style="padding:6px 8px;">Updated</th></tr></thead><tbody>' +
      rows.map(function(p){
        return '<tr data-rh-open="' + esc(p.id) + '" style="border-top:1px solid var(--border);cursor:pointer;"><td style="padding:9px 8px;font-weight:600;">' + esc(p.name) + rhAlertPill(p.member_email, p.id) + '</td><td style="padding:9px 8px;">' + esc(rhPtLabel(p.member_email)) + '</td>' +
          '<td style="padding:9px 8px;"><span class="rh-pill ' + esc(p.status) + '">' + esc(p.status) + '</span></td><td style="padding:9px 8px;">' + esc(rhFmt(p.start_date)) + '</td><td style="padding:9px 8px;">' + esc(p.duration_weeks) + '</td><td style="padding:9px 8px;color:var(--text-muted);">' + esc(rhFmt(p.updated_at)) + '</td></tr>';
      }).join('') + '</tbody></table>';
    /* PM-1214: a sent plan opens the patient view (Plan · Tracking · Monitor); only drafts go straight to the builder */
    list.querySelectorAll('[data-rh-open]').forEach(function(tr){ tr.addEventListener('click', function(){ var id = tr.getAttribute('data-rh-open'), p = rhPlans.filter(function(x){ return x.id === id; })[0]; if (p && p.status !== 'draft') rhPvOpen(id); else rhOpen(id); }); });
  }

  /* ── Builder ── */
  function rhBlank(){
    return { id: null, name: '', member_email: rhFilterEmail || '', start_date: rhToday(), duration_weeks: 4, note: '', safety_netting: RH_SAFETY_PLACEHOLDER, red_flags: '', monitor: ['pain'], template_id: null, status: 'draft', items: [], origIds: [] };
  }
  async function rhOpen(id){
    rhCss();
    if (!id){ rhCur = rhBlank(); rhPaint(); return; }
    var p = null; for (var i = 0; i < rhPlans.length; i++){ if (rhPlans[i].id === id) p = rhPlans[i]; }
    if (!p) return;
    var items = [];
    try { items = await rest('/rehab_plan_items?plan_id=eq.' + id + '&removed_at=is.null&select=' + RH_ITEM_SEL + '&order=position.asc,created_at.asc') || []; } catch(_){}
    rhCur = { id: p.id, name: p.name, member_email: (p.member_email || '').toLowerCase(), start_date: p.start_date, duration_weeks: p.duration_weeks, note: p.note || '', safety_netting: p.safety_netting || RH_SAFETY_PLACEHOLDER, red_flags: p.red_flags || '', monitor: Array.isArray(p.monitor) ? p.monitor.slice() : [], template_id: p.template_id, status: p.status, sent_at: p.sent_at, items: items, origIds: items.map(function(x){ return x.id; }) };
    rhPaint();
  }
  function rhFromTemplate(t){
    /* a template is the plan shape minus the patient/dates — payload {duration_weeks, note, safety_netting, red_flags, monitor, items[]} */
    var pl = t.payload || {};
    rhCur = rhBlank();
    rhCur.name = t.name; rhCur.template_id = t.id;
    rhCur.duration_weeks = pl.duration_weeks || 4; rhCur.note = pl.note || ''; rhCur.safety_netting = pl.safety_netting || RH_SAFETY_PLACEHOLDER; rhCur.red_flags = pl.red_flags || '';
    rhCur.monitor = Array.isArray(pl.monitor) ? pl.monitor.slice() : ['pain'];
    rhCur.items = (pl.items || []).map(function(i){ return Object.assign({}, i, { id: null }); });
    go('plans'); rhPaint();
  }
  function rhPaint(){
    $c('rh-list-card').style.display = 'none'; $c('rh-pv').style.display = 'none'; $c('rh-editor').style.display = '';
    var p = rhCur;
    $c('rh-title').textContent = p.id ? 'Edit plan' : 'New rehab plan';
    $c('rh-status').innerHTML = p.id ? ('<span class="rh-pill ' + esc(p.status) + '">' + esc(p.status) + '</span>' + (p.sent_at ? ' <span style="font-size:11.5px;color:var(--text-muted);">sent ' + esc(rhFmt(p.sent_at)) + '</span>' : '')) : '';
    $c('rhf-name').value = p.name || '';
    $c('rhf-patient').innerHTML = rhPtOptions(p.member_email);
    $c('rhf-start').value = p.start_date || rhToday();
    $c('rhf-weeks').value = p.duration_weeks || 4;
    $c('rhf-note').value = p.note || '';
    $c('rhf-safety').value = p.safety_netting || RH_SAFETY_PLACEHOLDER;
    $c('rhf-redflags').value = p.red_flags || '';
    rhPaintItems(); rhPaintMonitor(); rhTotals();
    $c('rh-msg').textContent = '';
  }
  function rhPaintItems(){
    var box = $c('rh-items'), items = rhCur.items;
    if (!items.length){ box.innerHTML = '<div style="padding:18px;border:1px dashed var(--border);border-radius:12px;text-align:center;font-size:13px;color:var(--text-muted);">No exercises yet \u2014 add from the rehab library.</div>'; return; }
    box.innerHTML = items.map(function(it, idx){
      var th = it.image_url ? '<img class="th" data-rh-play="' + idx + '" src="' + esc(it.image_url) + '" alt=""/>' : '<div class="th ph">no video</div>';
      function num(k, lab, min, max){ return '<div><label>' + lab + '</label><input type="number" data-rh-rx="' + k + '" data-rh-i="' + idx + '" min="' + min + '" max="' + max + '" value="' + esc(it[k]) + '"/></div>'; }
      return '<div class="rh-row">' + th + '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;gap:8px;align-items:flex-start;"><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13.5px;">' + esc(idx + 1) + '. ' + esc(it.name) + '</div>' + (it.cues ? '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;white-space:pre-wrap;">' + esc(it.cues) + '</div>' : '') + '</div>' +
        '<button class="rh-ib" type="button" data-rh-up="' + idx + '" title="Move up">\u2191</button><button class="rh-ib" type="button" data-rh-down="' + idx + '" title="Move down">\u2193</button><button class="rh-ib" type="button" data-rh-del="' + idx + '" title="Remove">\u2715</button></div>' +
        '<div class="rh-rx">' + num('hold_s', 'Hold (s)', 0, 600) + num('reps', 'Repeat', 1, 200) + num('times_daily', 'Times daily', 1, 10) + num('rest_s', 'Rest (s)', 0, 600) + num('days_per_week', 'Days / week', 1, 7) +
        '<div><label>Both sides</label><select data-rh-rx="both_sides" data-rh-i="' + idx + '"><option value="0"' + (it.both_sides ? '' : ' selected') + '>No</option><option value="1"' + (it.both_sides ? ' selected' : '') + '>Yes</option></select></div></div>' +
        '<input type="text" data-rh-rx="note" data-rh-i="' + idx + '" maxlength="200" placeholder="Note for this exercise (optional)" value="' + esc(it.note || '') + '" style="width:100%;margin-top:8px;padding:6px 9px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text);font-size:12.5px;font-family:inherit;"/>' +
        '</div></div>';
    }).join('');
    box.querySelectorAll('[data-rh-rx]').forEach(function(el){
      el.addEventListener('change', function(){
        var it = rhCur.items[+el.getAttribute('data-rh-i')], k = el.getAttribute('data-rh-rx');
        if (k === 'both_sides') it[k] = el.value === '1'; else if (k === 'note') it[k] = el.value.trim(); else { var v = parseInt(el.value, 10); if (isNaN(v)) v = +el.min; it[k] = Math.max(+el.min, Math.min(+el.max, v)); el.value = it[k]; }
        rhTotals();
      });
    });
    box.querySelectorAll('[data-rh-up]').forEach(function(b){ b.addEventListener('click', function(){ var i = +b.getAttribute('data-rh-up'); if (i > 0){ var t = rhCur.items[i]; rhCur.items[i] = rhCur.items[i - 1]; rhCur.items[i - 1] = t; rhPaintItems(); } }); });
    box.querySelectorAll('[data-rh-down]').forEach(function(b){ b.addEventListener('click', function(){ var i = +b.getAttribute('data-rh-down'); if (i < rhCur.items.length - 1){ var t = rhCur.items[i]; rhCur.items[i] = rhCur.items[i + 1]; rhCur.items[i + 1] = t; rhPaintItems(); } }); });
    box.querySelectorAll('[data-rh-del]').forEach(function(b){ b.addEventListener('click', function(){ rhCur.items.splice(+b.getAttribute('data-rh-del'), 1); rhPaintItems(); rhTotals(); }); });
    box.querySelectorAll('[data-rh-play]').forEach(function(im){ im.addEventListener('click', function(){ var it = rhCur.items[+im.getAttribute('data-rh-play')]; var r = it.exercise_id ? w3ById(it.exercise_id) : null; exPlaySheet(r || { name: it.name, video_url: it.video_url, image_url: it.image_url, cues: it.cues }); }); });
  }
  function rhPaintMonitor(){
    var box = $c('rh-monitor');
    box.innerHTML = RH_MONITOR.map(function(m){ var on = rhCur.monitor.indexOf(m.key) >= 0; return '<label class="' + (on ? 'on' : '') + '"><input type="checkbox" data-rh-mon="' + m.key + '"' + (on ? ' checked' : '') + '/>' + esc(m.label) + '</label>'; }).join('');
    box.querySelectorAll('[data-rh-mon]').forEach(function(cb){ cb.addEventListener('change', function(){ var k = cb.getAttribute('data-rh-mon'); var i = rhCur.monitor.indexOf(k); if (cb.checked && i < 0) rhCur.monitor.push(k); if (!cb.checked && i >= 0) rhCur.monitor.splice(i, 1); rhPaintMonitor(); }); });
    var who = rhCur.member_email ? rhPtLabel(rhCur.member_email).split(' ')[0] : 'your patient';
    var qs = RH_MONITOR.filter(function(m){ return rhCur.monitor.indexOf(m.key) >= 0; });
    $c('rh-preview').innerHTML = (qs.length ? qs.map(function(m){ return '<div class="rh-q">' + esc(m.q) + '<div class="a">0 = ' + esc(m.lo) + ' \u00b7 10 = ' + esc(m.hi) + '</div></div>'; }).join('') : '<div style="font-size:12.5px;color:var(--text-muted);">No Monitor questions \u2014 ' + esc(who) + ' will only mark exercises done or skipped.</div>') +
      '<div class="rh-q" style="border-left-color:var(--gold);">Anything you want to ask your physio? <div class="a">free text \u2014 lands in your Messages</div></div>';
  }
  function rhTotals(){
    var n = rhSessions(Object.assign({}, rhCur, { duration_weeks: parseInt($c('rhf-weeks').value, 10) || 0 }));
    $c('rh-total').textContent = rhCur.items.length ? (rhCur.items.length + ' exercise' + (rhCur.items.length === 1 ? '' : 's') + ' \u00b7 up to ' + n + ' session' + (n === 1 ? '' : 's') + ' over the plan') : '';
  }
  function rhCollect(){
    rhCur.name = ($c('rhf-name').value || '').trim();
    rhCur.member_email = ($c('rhf-patient').value || '').toLowerCase();
    rhCur.start_date = $c('rhf-start').value || rhToday();
    rhCur.duration_weeks = Math.max(1, Math.min(52, parseInt($c('rhf-weeks').value, 10) || 4));
    rhCur.note = ($c('rhf-note').value || '').trim();
    rhCur.safety_netting = ($c('rhf-safety').value || '').trim() || RH_SAFETY_PLACEHOLDER;
    rhCur.red_flags = ($c('rhf-redflags').value || '').trim();
  }
  function rhValid(forSend){
    if (!rhCur.name) return 'Give the plan a name.';
    if (!rhCur.member_email) return 'Choose a patient.';
    if (forSend && !rhCur.items.length) return 'Add at least one exercise before sending.';
    return '';
  }
  async function rhSave(silent){
    rhCollect();
    var err = rhValid(false); if (err){ $c('rh-msg').textContent = err; return null; }
    var body = { partner_id: partnerId, member_email: rhCur.member_email, name: rhCur.name, start_date: rhCur.start_date, duration_weeks: rhCur.duration_weeks, note: rhCur.note || null, safety_netting: rhCur.safety_netting, red_flags: rhCur.red_flags || null, monitor: rhCur.monitor, template_id: rhCur.template_id || null };
    try {
      var saved;
      if (rhCur.id){
        saved = await rest('/rehab_plans?id=eq.' + rhCur.id + '&select=' + RH_SEL, { method: 'PATCH', body: body, prefer: 'return=representation' });
        saved = (saved && saved[0]) || { id: rhCur.id, status: rhCur.status, sent_at: rhCur.sent_at };
      } else {
        saved = await rest('/rehab_plans?select=' + RH_SEL, { method: 'POST', body: body, prefer: 'return=representation' });
        saved = (saved && saved[0]) || null;
      }
      if (!saved) throw new Error('save failed');
      rhCur.id = saved.id; rhCur.status = saved.status; rhCur.sent_at = saved.sent_at;
      /* items: existing rows are upserted by id (a sent plan's done/skipped history hangs off item ids — never delete-and-reinsert),
         new rows are inserted, rows the physio removed are soft-removed so their history survives. */
      var keep = {}, upd = [], ins = [];
      rhCur.items.forEach(function(it, i){
        var row = { plan_id: saved.id, position: i, exercise_id: it.exercise_id || null, name: it.name, cues: it.cues || null, video_url: it.video_url || null, image_url: it.image_url || null, hold_s: it.hold_s || 0, reps: it.reps || 10, times_daily: it.times_daily || 1, rest_s: it.rest_s || 0, days_per_week: it.days_per_week || 7, both_sides: !!it.both_sides, note: it.note || null };
        if (it.id){ keep[it.id] = 1; row.id = it.id; upd.push(row); } else ins.push(row);
      });
      var gone = (rhCur.origIds || []).filter(function(id){ return !keep[id]; });
      if (upd.length) await rest('/rehab_plan_items?on_conflict=id', { method: 'POST', body: upd, prefer: 'resolution=merge-duplicates' });
      if (ins.length) await rest('/rehab_plan_items', { method: 'POST', body: ins });
      if (gone.length) await rest('/rehab_plan_items?id=in.(' + gone.join(',') + ')', { method: 'PATCH', body: { removed_at: new Date().toISOString() } });
      var fresh = await rest('/rehab_plan_items?plan_id=eq.' + saved.id + '&removed_at=is.null&select=' + RH_ITEM_SEL + '&order=position.asc,created_at.asc') || [];
      rhCur.items = fresh; rhCur.origIds = fresh.map(function(x){ return x.id; });
      rhPlansLoaded = false;
      if (!silent){ $c('rh-msg').textContent = 'Saved.'; $c('rh-status').innerHTML = '<span class="rh-pill ' + esc(rhCur.status) + '">' + esc(rhCur.status) + '</span>'; rhPaintItems(); }
      return saved;
    } catch(e){ $c('rh-msg').textContent = 'Could not save (' + (e.message || e) + ').'; return null; }
  }
  async function rhSend(){
    rhCollect();
    var err = rhValid(true); if (err){ $c('rh-msg').textContent = err; return; }
    var c = roster.filter(function(x){ return (x.member_email || '').toLowerCase() === rhCur.member_email; })[0];
    var note = c && c.status === 'invited' ? ' They haven\u2019t opened their VYVE invite yet \u2014 the plan is waiting for them the moment they do.' : '';
    if (!confirm('Send "' + rhCur.name + '" to ' + rhPtLabel(rhCur.member_email) + '? It replaces any rehab plan they already have.' + note)) return;
    $c('rh-msg').textContent = 'Sending\u2026';
    var saved = await rhSave(true); if (!saved) return;
    try {
      var r = await rest('/rpc/rehab_apply_plan', { method: 'POST', body: { p_plan_id: saved.id } });
      rhCur.status = 'active'; rhCur.sent_at = new Date().toISOString();
      $c('rh-msg').textContent = 'Sent \u2014 ' + (r && r.items) + ' exercise' + (r && r.items === 1 ? '' : 's') + ' in the plan.' + note;
      $c('rh-status').innerHTML = '<span class="rh-pill active">active</span> <span style="font-size:11.5px;color:var(--text-muted);">sent just now</span>';
      rhPlansLoaded = false;
    } catch(e){ $c('rh-msg').textContent = 'Saved, but sending failed (' + (e.message || e) + ').'; }
  }
  async function rhSaveTemplate(){
    rhCollect();
    if (!rhCur.name){ $c('rh-msg').textContent = 'Give the plan a name first.'; return; }
    if (!rhCur.items.length){ $c('rh-msg').textContent = 'Add exercises before saving a template.'; return; }
    var name = prompt('Template name (e.g. "ACL — Phase 1", "Lower back pain — weeks 1–2")', rhCur.name); if (!name) return;
    var payload = { duration_weeks: rhCur.duration_weeks, note: rhCur.note, safety_netting: rhCur.safety_netting, red_flags: rhCur.red_flags, monitor: rhCur.monitor, items: rhCur.items.map(function(it){ return { exercise_id: it.exercise_id || null, name: it.name, cues: it.cues || null, video_url: it.video_url || null, image_url: it.image_url || null, hold_s: it.hold_s || 0, reps: it.reps || 10, times_daily: it.times_daily || 1, rest_s: it.rest_s || 0, days_per_week: it.days_per_week || 7, both_sides: !!it.both_sides, note: it.note || null }; }) };
    try {
      await rest('/coach_templates', { method: 'POST', body: { partner_id: partnerId, kind: 'rehab_plan', name: name.trim(), payload: payload, active: true } });
      rhTplsLoaded = false; $c('rh-msg').textContent = 'Template saved.';
    } catch(e){ $c('rh-msg').textContent = 'Could not save the template (' + (e.message || e) + ').'; }
  }
  async function rhArchive(){
    if (!rhCur.id) return;
    if (!confirm('Archive this plan? The patient\u2019s app keeps what was already sent until you send a new plan.')) return;
    try { await rest('/rehab_plans?id=eq.' + rhCur.id, { method: 'PATCH', body: { status: 'archived' } }); rhPlansLoaded = false; rhInit(true); } catch(e){ $c('rh-msg').textContent = 'Could not archive (' + (e.message || e) + ').'; }
  }

  /* ── Library picker ── */
  async function rhPickOpen(){
    rhPickClose();
    var m = document.createElement('div'); m.className = 'w3-modal'; m.id = 'rh-pick';
    m.innerHTML = '<div class="in" style="width:min(980px,96vw);max-height:92vh;display:flex;flex-direction:column;"><div class="hd"><div style="flex:1;font-weight:700;font-size:15px;">Add exercises</div>' +
      '<input id="rh-pick-q" type="search" placeholder="Search" style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;min-width:140px;"/>' +
      '<select id="rh-pick-cat" style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-family:inherit;"></select>' +
      '<button class="btn" type="button" data-rh-pick-close style="font-size:12px;">Done</button></div><div class="sc"><div id="rh-pick-count" style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Loading the library\u2026</div><div class="rh-pick" id="rh-pick-grid"></div></div></div>';
    m.addEventListener('click', function(e){ if (e.target === m || e.target.hasAttribute('data-rh-pick-close')) rhPickClose(); });
    document.body.appendChild(m);
    document.addEventListener('keydown', rhPickEsc);
    await exLoad();
    var cats = {}; cexRows.forEach(function(r){ if (r.category) cats[r.category] = 1; });
    $c('rh-pick-cat').innerHTML = '<option value="">All body regions</option>' + Object.keys(cats).sort().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('');
    $c('rh-pick-q').addEventListener('input', rhPickPaint); $c('rh-pick-cat').addEventListener('change', rhPickPaint);
    rhPickPaint(); $c('rh-pick-q').focus();
  }
  function rhPickPaint(){
    var q = ($c('rh-pick-q').value || '').trim().toLowerCase(), fc = $c('rh-pick-cat').value;
    var rows = cexRows.filter(function(r){ if (fc && r.category !== fc) return false; if (q && (r.name || '').toLowerCase().indexOf(q) < 0) return false; return true; });
    var shown = rows.slice(0, 120);
    $c('rh-pick-count').textContent = rows.length + ' exercise' + (rows.length === 1 ? '' : 's') + (rows.length > shown.length ? ' \u2014 showing the first ' + shown.length + ', narrow the search to see more' : '') + ' \u00b7 tap to add';
    $c('rh-pick-grid').innerHTML = shown.map(function(r){
      var th = w3ThumbSrc(r);
      var inPlan = rhCur.items.some(function(i){ return i.exercise_id === r.id; });
      return '<div class="c" data-rh-add="' + esc(r.id) + '"' + (inPlan ? ' style="opacity:.55;"' : '') + '>' + (th ? '<img src="' + esc(th) + '" alt="" loading="lazy"/>' : '<div class="noimg">no video</div>') + '<div class="n">' + esc(r.name) + (inPlan ? ' \u2713' : '') + '</div><div class="m">' + esc([r.category, r.equipment].filter(Boolean).join(' \u00b7 ')) + '</div></div>';
    }).join('');
    $c('rh-pick-grid').querySelectorAll('[data-rh-add]').forEach(function(c){ c.addEventListener('click', function(){ rhAdd(c.getAttribute('data-rh-add')); }); });
  }
  function rhAdd(id){
    var r = w3ById(id); if (!r) return;
    rhCur.items.push({ id: null, exercise_id: r.id, name: r.name, cues: r.cues || '', video_url: r.video_url || r.media_url || null, image_url: w3ThumbSrc(r) || null, hold_s: r.default_duration_seconds || 0, reps: r.default_reps ? parseInt(r.default_reps, 10) || 10 : 10, times_daily: 1, rest_s: r.default_rest_seconds || 0, days_per_week: 7, both_sides: false, note: '' });
    rhPaintItems(); rhTotals(); rhPickPaint();
  }
  function rhPickClose(){ var m = $c('rh-pick'); if (m) m.remove(); document.removeEventListener('keydown', rhPickEsc); }
  function rhPickEsc(e){ if (e.key === 'Escape') rhPickClose(); }

  /* ── Templates ── */
  async function rhTplInit(force){
    rhCss();
    if (!rhTplsLoaded || force){
      try { rhTpls = await rest('/coach_templates?kind=eq.rehab_plan&active=eq.true&or=(partner_id.eq.' + partnerId + ',partner_id.is.null)&select=id,partner_id,name,payload,updated_at&order=name.asc') || []; } catch(_){ rhTpls = []; }
      rhTplsLoaded = true;
    }
    var box = $c('rh-tpl-list');
    if (!rhTpls.length){ box.innerHTML = '<div class="empty-state"><h3>No templates yet</h3><p>Build a plan, then choose \u201cSave as template\u201d. Name them by condition and phase \u2014 \u201cACL \u2014 Phase 1\u201d, \u201cLower back pain \u2014 weeks 1\u20132\u201d.</p></div>'; return; }
    box.innerHTML = rhTpls.map(function(t){
      var pl = t.payload || {}, n = (pl.items || []).length;
      return '<div class="rh-row" style="align-items:center;"><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13.5px;">' + esc(t.name) + (t.partner_id ? '' : ' <span class="rh-pill">VYVE</span>') + '</div><div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">' + n + ' exercise' + (n === 1 ? '' : 's') + ' \u00b7 ' + esc(pl.duration_weeks || '?') + ' weeks \u00b7 Monitor: ' + esc((pl.monitor || []).join(', ') || 'none') + '</div></div>' +
        '<button class="btn btn-primary" type="button" data-rh-tpl-use="' + esc(t.id) + '" style="font-size:12px;">Use</button>' + (t.partner_id ? '<button class="rh-ib" type="button" data-rh-tpl-del="' + esc(t.id) + '">Delete</button>' : '') + '</div>';
    }).join('');
    box.querySelectorAll('[data-rh-tpl-use]').forEach(function(b){ b.addEventListener('click', function(){ var t = rhTpls.filter(function(x){ return x.id === b.getAttribute('data-rh-tpl-use'); })[0]; if (t) rhFromTemplate(t); }); });
    box.querySelectorAll('[data-rh-tpl-del]').forEach(function(b){ b.addEventListener('click', async function(){ if (!confirm('Delete this template?')) return; try { await rest('/coach_templates?id=eq.' + b.getAttribute('data-rh-tpl-del'), { method: 'PATCH', body: { active: false } }); rhTplInit(true); } catch(_){} }); });
  }

  /* ── Add patient (Patients view) ── */
  async function rhAddPatient(){
    var fn = ($c('ptf-first').value || '').trim(), ln = ($c('ptf-last').value || '').trim(), em = ($c('ptf-email').value || '').trim().toLowerCase();
    var msg = $c('ptf-msg');
    if (!fn || !em || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ msg.textContent = 'First name and a valid email are needed.'; return; }
    msg.textContent = 'Sending the invite\u2026';
    try {
      await ef({ action: 'create', firstName: fn, lastName: ln, email: em, assignments: {} });
      msg.textContent = 'Invited \u2014 ' + fn + ' gets the VYVE app invite with their free rehab period applied.';
      $c('ptf-first').value = ''; $c('ptf-last').value = ''; $c('ptf-email').value = '';
      await loadPatients();
    } catch(e){ msg.textContent = 'Could not invite (' + (e.message || e) + ').'; }
  }
  function rhPlanCounts(){
    /* Plans column on the Patients table, from the plans list if it has loaded */
    var by = {}; rhPlans.forEach(function(p){ var e = (p.member_email || '').toLowerCase(); if (p.status !== 'archived') by[e] = (by[e] || 0) + 1; });
    return by;
  }

  /* wiring — elements exist in physio/body.html */
  $c('rh-new').addEventListener('click', function(){ rhOpen(null); });
  $c('rh-back').addEventListener('click', function(){ rhInit(true); });
  $c('rh-add-ex').addEventListener('click', rhPickOpen);
  $c('rh-save').addEventListener('click', function(){ rhSave(false); });
  $c('rh-send').addEventListener('click', rhSend);
  $c('rh-tpl-save').addEventListener('click', rhSaveTemplate);
  $c('rh-archive').addEventListener('click', rhArchive);
  $c('rhf-weeks').addEventListener('input', rhTotals);
  $c('rhf-patient').addEventListener('change', function(){ rhCur.member_email = ($c('rhf-patient').value || '').toLowerCase(); rhPaintMonitor(); });
  $c('pt-add-toggle').addEventListener('click', function(){ var f = $c('pt-add-form'); f.style.display = f.style.display === 'none' ? '' : 'none'; });
  $c('ptf-go').addEventListener('click', rhAddPatient);
  /* ============================ end PM-1211 physio Wave 2 ============================ */
