  /* ======================= PM-1036 W4b: coach-side tags + batch assign ======================= */
  /* Zone at the IIFE tail. Adds: coach_client_tags on the roster (chips + filter bar) and the client
     Overview (Tags box), a Batch assign view under Clients (pick who -> pick what -> preview -> applied,
     plus Recent batches with revert), and merge_slots on the two list Assign-to modals. go() is
     SHADOWED once more (byte-replicates the Wave 7 version + the clients_batch route). Staff/VYVE
     scope never sees any of it (clients_batch is in VYVE_HIDE_GO). */
  (function w4bCss(){
    var css = document.createElement('style');
    css.id = 'w4b-css';
    css.textContent = [
      '.w4b-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;border-radius:99px;padding:2px 9px;background:rgba(201,168,76,.13);color:#c9a84c;border:1px solid rgba(201,168,76,.45);font-family:inherit;line-height:1.5;cursor:default;white-space:nowrap;}',
      '.w4b-tag i{font-style:normal;opacity:.7;cursor:pointer;}',
      '.w4b-tag.f{cursor:pointer;}.w4b-tag.f b{font-weight:700;opacity:.7;}.w4b-tag.f.on{background:#c9a84c;color:#0D2B2B;}',
      '.w4b-tagrow{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:4px;}',
      '.w4b-tagbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:12px;padding:8px 10px;border:1px dashed var(--border);border-radius:10px;}',
      '.w4b-tb-l{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-muted);margin-right:4px;}',
      '.w4b-steps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;}',
      '.w4b-stp{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border-radius:99px;border:1px solid var(--border);background:none;color:var(--text-muted);font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;}',
      '.w4b-stp.on{border-color:var(--vyve-teal);color:var(--teal-lt);background:rgba(27,120,120,.12);}',
      '.w4b-stp:disabled{opacity:.5;cursor:not-allowed;}',
      '.w4b-two{display:grid;grid-template-columns:1fr 250px;gap:18px;align-items:start;}',
      '@media (max-width:900px){.w4b-two{grid-template-columns:1fr;}}',
      '.w4b-cohort{position:sticky;top:76px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);padding:14px;}',
      '.w4b-cohort .big{font-size:30px;font-weight:700;color:var(--teal-lt);line-height:1.1;margin-top:4px;}',
      '.w4b-cohort .big.over{color:#E8834A;}',
      '.w4b-k{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}',
      '.w4b-list{font-size:12.5px;display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto;}',
      '.w4b-picklist{border:1px solid var(--border);border-radius:10px;overflow:hidden;}',
      '.w4b-pick{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--border);cursor:pointer;}',
      '.w4b-pick:last-child{border-bottom:none;}.w4b-pick:hover{background:var(--surface-2);}',
      '.w4b-pick input{accent-color:var(--vyve-teal);width:15px;height:15px;flex:none;}',
      '.w4b-pick.hide{display:none;}',
      '.w4b-mu{color:var(--text-muted);font-size:12px;}',
      '.w4b-sum{border:1px solid var(--border);border-radius:10px;background:var(--surface-2);padding:10px 14px;font-size:13px;margin-bottom:12px;}',
      '.w4b-sum.ok{border-color:rgba(61,184,159,.5);}',
      '.w4b-pp{display:inline-block;font-size:10.5px;font-weight:700;border-radius:99px;padding:2px 9px;white-space:nowrap;}',
      '.w4b-pp.push{background:rgba(61,184,159,.15);color:#3DB89F;}',
      '.w4b-pp.wait{background:rgba(201,168,76,.13);color:#c9a84c;}',
      '.w4b-pp.same,.w4b-pp.skip{background:var(--surface-2);color:var(--text-muted);border:1px solid var(--border);}',
      '.w4b-pp.fail{background:rgba(232,131,74,.15);color:#E8834A;}',
      '.w4b-input{padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:13px;font-family:inherit;outline:none;}',
      '.w4b-input:focus{border-color:var(--vyve-teal);}',
      'code.w4b-code{font-size:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:5px;padding:1px 6px;}'
    ].join('');
    document.head.appendChild(css);
  })();

  /* ── tags: state + load + decorate ── */
  var w4bTags = { byEmail: {}, counts: {}, loaded: false, loading: null };
  var w4bTagFilter = [];
  function w4bTagKey(t){ return String(t || '').toLowerCase(); }
  async function w4bTagsLoad(force){
    if (w4bTags.loaded && !force) return w4bTags;
    if (w4bTags.loading && !force) return w4bTags.loading;
    w4bTags.loading = (async function(){
      var rows = [];
      try { rows = await rest('/coach_client_tags?' + pscope() + '&select=member_email,tag&order=tag.asc&limit=5000') || []; } catch(e){ rows = []; }
      var by = {}, counts = {};
      rows.forEach(function(r){
        var em = String(r.member_email || '').toLowerCase();
        (by[em] = by[em] || []).push(r.tag);
        var k = w4bTagKey(r.tag);
        counts[k] = counts[k] || { tag: r.tag, n: 0 }; counts[k].n++;
      });
      w4bTags.byEmail = by; w4bTags.counts = counts; w4bTags.loaded = true; w4bTags.loading = null;
      return w4bTags;
    })();
    return w4bTags.loading;
  }
  function w4bTagsOf(email){ return w4bTags.byEmail[String(email || '').toLowerCase()] || []; }
  function w4bChipHtml(t, removable){
    return '<span class="w4b-tag" data-w4btag="' + esc(t) + '">' + esc(t) + (removable ? ' <i title="Remove" data-w4brm="' + esc(t) + '">\u00d7</i>' : '') + '</span>';
  }
  function w4bDatalist(){
    var ks = Object.keys(w4bTags.counts).sort(function(a, b){ return w4bTags.counts[b].n - w4bTags.counts[a].n; });
    return '<datalist id="w4b-tag-dl">' + ks.map(function(k){ return '<option value="' + esc(w4bTags.counts[k].tag) + '"></option>'; }).join('') + '</datalist>';
  }
  /* filter bar above the roster: one chip per tag with its count; multi-select ORs */
  function w4bTagBarRender(){
    var tb = $c('cl-toolbar'); if (!tb) return;
    var bar = $c('w4b-tagbar');
    if (!bar){
      bar = document.createElement('div'); bar.id = 'w4b-tagbar'; bar.className = 'w4b-tagbar';
      tb.insertAdjacentElement('afterend', bar);
      bar.addEventListener('click', function(ev){
        var b = ev.target.closest('.w4b-tag.f'); if (!b) return;
        var k = b.dataset.w4bf;
        var i = w4bTagFilter.indexOf(k);
        if (i >= 0) w4bTagFilter.splice(i, 1); else w4bTagFilter.push(k);
        clShown = CL_PAGE; renderRoster(); w4bTagBarRender();
      });
    }
    var ks = Object.keys(w4bTags.counts).sort(function(a, b){ return w4bTags.counts[b].n - w4bTags.counts[a].n || a.localeCompare(b); });
    if (!ks.length){ bar.style.display = 'none'; return; }
    bar.style.display = '';
    bar.innerHTML = '<span class="w4b-tb-l">Tags</span>' + ks.map(function(k){
      return '<button type="button" class="w4b-tag f' + (w4bTagFilter.indexOf(k) >= 0 ? ' on' : '') + '" data-w4bf="' + esc(k) + '">' + esc(w4bTags.counts[k].tag) + ' <b>' + w4bTags.counts[k].n + '</b></button>';
    }).join('') + '<span class="w4b-mu" style="margin-left:auto;font-size:11px;">Your labels \u2014 only you see them. Add from a client\u2019s Overview.</span>';
  }
  /* clFiltered SHADOW: byte-replicates the roster filter + the tag facet (OR within tags, AND with status/search) */
  function clFiltered(){
    var q = clQ.toLowerCase();
    return roster.filter(function(c){
      if (clStatus !== 'all' && c.status !== clStatus) return false;
      if (w4bTagFilter.length){
        var mine = w4bTagsOf(c.member_email).map(w4bTagKey);
        if (!w4bTagFilter.some(function(k){ return mine.indexOf(k) >= 0; })) return false;
      }
      if (!q) return true;
      return (nameOf(c) + ' ' + c.member_email).toLowerCase().indexOf(q) >= 0;
    });
  }
  /* row chips: decorate after every roster render (list rows + grid cards both carry .cl-dd-btn[data-em]) */
  function w4bDecorateRoster(){
    var el = $c('cl-list'); if (!el) return;
    el.querySelectorAll('.cl-dd-btn[data-em]').forEach(function(b){
      var host = b.closest('tr') || b.closest('.cl-gcard'); if (!host || host.querySelector('.w4b-tagrow')) return;
      var tags = w4bTagsOf(b.dataset.em); if (!tags.length) return;
      var nameCell = host.tagName === 'TR' ? host.children[1] : host.querySelector('div[style*="flex:1"]');
      if (!nameCell) return;
      var row = document.createElement('div'); row.className = 'w4b-tagrow';
      row.innerHTML = tags.map(function(t){ return w4bChipHtml(t, false); }).join('');
      nameCell.appendChild(row);
    });
  }
  (function w4bRosterObserver(){
    var el = $c('cl-list'); if (!el) return;
    new MutationObserver(function(){
      if (!w4bTags.loaded){ w4bTagsLoad().then(function(){ w4bDecorateRoster(); w4bTagBarRender(); }); return; }
      w4bDecorateRoster();
    }).observe(el, { childList: true });
  })();
  /* Overview Tags box: decorate the w5 pane when the notes editor lands */
  async function w4bOverviewTags(){
    var pane = $c('w5-pane'), c = w5 && w5.c; if (!pane || !c || pane.querySelector('#w4b-tagbox')) return;
    var first = pane.querySelector('.w5-sec'); if (!first) return;
    await w4bTagsLoad();
    if (w5.tab !== 'overview' || pane.querySelector('#w4b-tagbox')) return;
    var box = document.createElement('div'); box.id = 'w4b-tagbox';
    function paint(){
      var tags = w4bTagsOf(c.member_email);
      box.innerHTML = '<div class="w5-sec">Tags (private to you)</div><div class="w5-box">' +
        '<div class="w4b-tagrow" id="w4b-ov-chips" style="margin:0 0 10px;">' + (tags.length ? tags.map(function(t){ return w4bChipHtml(t, true); }).join('') : '<span class="w4b-mu">No tags yet.</span>') + '</div>' +
        '<div style="display:flex;gap:8px;"><input id="w4b-ov-in" class="w4b-input" list="w4b-tag-dl" maxlength="40" placeholder="Add a tag\u2026 (Enter)" style="flex:1;"/>' + w4bDatalist() + '<button class="btn" type="button" id="w4b-ov-add" style="font-size:12px;">Add</button></div>' +
        '<div class="w4b-mu" style="font-size:11px;margin-top:8px;">Up to 20 per client. Filters the client list and picks batch cohorts. <span id="w4b-ov-msg"></span></div></div>';
      async function save(next){
        var msg = $c('w4b-ov-msg'); msg.textContent = 'Saving\u2026';
        try {
          var r = await ef({ action: 'set_client_tags', email: c.member_email, tags: next });
          w4bTags.byEmail[String(c.member_email).toLowerCase()] = r.tags || next;
          await w4bTagsLoad(true);
          paint(); w4bTagBarRender();
          if ($c('cl-list')){ $c('cl-list').querySelectorAll('.w4b-tagrow').forEach(function(x){ x.remove(); }); w4bDecorateRoster(); }
        } catch(e){ msg.textContent = 'Save failed: ' + (e.message || e); }
      }
      function add(){
        var v = $c('w4b-ov-in').value.trim(); if (!v) return;
        var cur = w4bTagsOf(c.member_email);
        if (cur.map(w4bTagKey).indexOf(w4bTagKey(v)) >= 0){ $c('w4b-ov-in').value = ''; return; }
        if (cur.length >= 20){ $c('w4b-ov-msg').textContent = 'That\u2019s the 20-tag limit.'; return; }
        save(cur.concat([v]));
      }
      $c('w4b-ov-add').addEventListener('click', add);
      $c('w4b-ov-in').addEventListener('keydown', function(ev){ if (ev.key === 'Enter'){ ev.preventDefault(); add(); } });
      box.querySelectorAll('[data-w4brm]').forEach(function(i){ i.addEventListener('click', function(){ var k = w4bTagKey(i.dataset.w4brm); save(w4bTagsOf(c.member_email).filter(function(t){ return w4bTagKey(t) !== k; })); }); });
    }
    first.insertAdjacentElement('beforebegin', box);
    paint();
  }
  (function w4bPaneObserver(){
    var pane = $c('w5-pane');
    function arm(){
      var p = $c('w5-pane'); if (!p || p.dataset.w4bObs) return;
      p.dataset.w4bObs = '1';
      new MutationObserver(function(){ if ($c('w5-notes') && !$c('w4b-tagbox')) w4bOverviewTags(); }).observe(p, { childList: true });
    }
    if (pane) arm();
    else new MutationObserver(function(){ if ($c('w5-pane')) arm(); }).observe(document.body, { childList: true, subtree: true });
  })();

  /* ── Batch assign view ── */
  $c('view-daily').insertAdjacentHTML('afterend',
    '<div id="view-clients-batch" style="display:none;">' +
      '<div class="card"><div class="card-title">Batch assign<span class="w4b-mu" style="margin-left:auto;font-size:11.5px;">Assign one plan to several clients at once. Every batch is reversible.</span></div>' +
      '<div class="w4b-steps"><button class="w4b-stp on" data-w4bs="1" type="button"><span class="wz-dot on">1</span>Pick who</button><button class="w4b-stp" data-w4bs="2" type="button"><span class="wz-dot">2</span>Pick what</button><button class="w4b-stp" data-w4bs="3" type="button" disabled><span class="wz-dot">3</span>Preview</button><button class="w4b-stp" data-w4bs="4" type="button" disabled><span class="wz-dot">4</span>Applied</button></div>' +
      '<div id="w4b-stage-1"></div><div id="w4b-stage-2" style="display:none;"></div><div id="w4b-stage-3" style="display:none;"></div><div id="w4b-stage-4" style="display:none;"></div>' +
      '</div>' +
      '<div class="card"><div class="card-title">Recent batches</div><div id="w4b-recent"><p class="w4b-mu">Loading\u2026</p></div></div>' +
    '</div>');
  var w4b = { step: 1, sel: {}, status: 'all', q: '', tagF: [], slot: 'workout_template_id', tpl: null, lib: null, preview: null, result: null, seq: 0, inited: false };
  var W4B_SLOTS = [['workout_template_id','Workout plan'],['habits_template_id','Daily habits'],['nutrition_template_id','Nutrition'],['supplements_template_id','Supplements'],['checkin_form_id','Check-in form'],['onboarding_form_id','Questionnaire']];
  function w4bSlotLabel(k){ var s = W4B_SLOTS.filter(function(x){ return x[0] === k; })[0]; return s ? s[1] : k; }
  function w4bPool(){
    var lib = w4b.lib || { templates: [], forms: [] }, k = w4b.slot;
    if (k === 'onboarding_form_id') return lib.forms.filter(function(f){ return f.kind === 'onboarding'; }).map(function(f){ return { id: f.id, name: f.title, meta: 'Questionnaire' }; });
    if (k === 'checkin_form_id') return lib.forms.filter(function(f){ return f.kind === 'checkin'; }).map(function(f){ return { id: f.id, name: f.title, meta: 'Check-in form' }; });
    var kinds = k === 'workout_template_id' ? ['workout','program'] : [k.replace('_template_id','')];
    return lib.templates.filter(function(t){ return kinds.indexOf(t.kind) >= 0; }).map(function(t){ return { id: t.id, name: t.name, meta: t.kind === 'program' ? 'Programme' : (t.kind === 'workout' ? 'Weekly workout' : w4bSlotLabel(k)) }; });
  }
  function w4bTplName(id){ var p = w4bPool().filter(function(x){ return x.id === id; })[0]; return p ? p.name : ''; }
  function w4bClients(){ return roster.filter(function(c){ return c.status !== 'archived'; }); }
  function w4bSelected(){ return w4bClients().filter(function(c){ return w4b.sel[String(c.member_email).toLowerCase()]; }); }
  function w4bStep(n){
    w4b.step = n;
    for (var i = 1; i <= 4; i++){ var s = $c('w4b-stage-' + i); if (s) s.style.display = i === n ? '' : 'none'; }
    document.querySelectorAll('.w4b-stp').forEach(function(b){ var k = +b.dataset.w4bs; b.classList.toggle('on', k === n); var d = b.querySelector('.wz-dot'); d.classList.toggle('on', k === n); d.classList.toggle('done', k < n); });
    var s3 = document.querySelector('.w4b-stp[data-w4bs="3"]'), s4 = document.querySelector('.w4b-stp[data-w4bs="4"]');
    if (s3) s3.disabled = !w4b.preview; if (s4) s4.disabled = !w4b.result;
    if (n === 1) w4bRender1(); if (n === 2) w4bRender2(); if (n === 3) w4bRender3(); if (n === 4) w4bRender4();
    window.scrollTo(0, 0);
  }
  function w4bCohortHtml(nextLabel, nextStep, backStep){
    var sel = w4bSelected(), n = sel.length;
    return '<aside class="w4b-cohort"><div class="w4b-k">Cohort</div><div class="big' + (n > 100 ? ' over' : '') + '">' + n + '</div><div class="w4b-mu" style="margin-bottom:10px;">' + (n === 1 ? 'client' : 'clients') + (n > 100 ? ' \u2014 over the 100 limit' : '') + '</div>' +
      '<div class="w4b-list">' + (n ? sel.map(function(c){ return '<div>' + esc(nameOf(c)) + '</div>'; }).join('') : '<span class="w4b-mu">Tick clients on the left, or use a tag.</span>') + '</div>' +
      (w4b.step >= 2 ? '<div class="w4b-k" style="margin-top:14px;">Assigning</div><div style="font-weight:600;margin-top:4px;">' + (w4b.tpl ? esc(w4bTplName(w4b.tpl)) : '<span class="w4b-mu">Nothing picked yet</span>') + '</div><div class="w4b-mu">to the ' + esc(w4bSlotLabel(w4b.slot)) + ' slot</div>' : '') +
      '<button type="button" class="btn btn-primary w4b-next" style="width:100%;margin-top:12px;font-size:12.5px;"' + ((!n || n > 100 || (nextStep === 3 && !w4b.tpl)) ? ' disabled' : '') + '>' + nextLabel + '</button>' +
      (backStep ? '<button type="button" class="btn w4b-back" style="width:100%;margin-top:8px;font-size:12px;">\u2190 Back</button>' : '') + '</aside>';
  }
  function w4bWireCohort(stage, nextStep, backStep){
    var nx = stage.querySelector('.w4b-next'); if (nx) nx.addEventListener('click', function(){ if (nextStep === 3) w4bDryRun(); else w4bStep(nextStep); });
    var bk = stage.querySelector('.w4b-back'); if (bk) bk.addEventListener('click', function(){ w4bStep(backStep); });
  }
  function w4bRender1(){
    var st = $c('w4b-stage-1');
    var ks = Object.keys(w4bTags.counts).sort(function(a, b){ return w4bTags.counts[b].n - w4bTags.counts[a].n || a.localeCompare(b); });
    var q = w4b.q.toLowerCase();
    var rows = w4bClients().filter(function(c){
      if (w4b.status !== 'all' && c.status !== w4b.status) return false;
      if (w4b.tagF.length){ var mine = w4bTagsOf(c.member_email).map(w4bTagKey); if (!w4b.tagF.some(function(k){ return mine.indexOf(k) >= 0; })) return false; }
      if (!q) return true;
      return (nameOf(c) + ' ' + c.member_email).toLowerCase().indexOf(q) >= 0;
    });
    st.innerHTML = '<div class="w4b-two"><div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;"><input id="w4b-q" class="w4b-input" type="search" placeholder="Search name or email" value="' + esc(w4b.q) + '" style="min-width:180px;"/>' +
        ['all','active','invited'].map(function(s){ return '<button class="btn w4b-st' + (w4b.status === s ? ' btn-primary' : '') + '" data-st="' + s + '" type="button" style="font-size:12px;">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>'; }).join('') +
        '<button class="btn" type="button" id="w4b-selall" style="font-size:12px;margin-left:auto;">Select all shown</button><button class="btn" type="button" id="w4b-selnone" style="font-size:12px;">Clear</button></div>' +
      (ks.length ? '<div class="w4b-tagbar"><span class="w4b-tb-l">Tags</span>' + ks.map(function(k){ return '<button type="button" class="w4b-tag f' + (w4b.tagF.indexOf(k) >= 0 ? ' on' : '') + '" data-w4bf="' + esc(k) + '">' + esc(w4bTags.counts[k].tag) + ' <b>' + w4bTags.counts[k].n + '</b></button>'; }).join('') + '</div>' : '') +
      '<div class="w4b-picklist">' + (rows.length ? rows.map(function(c){
        var em = String(c.member_email).toLowerCase(), a = c.assignments || {};
        var cur = a[w4b.slot] ? (w4bTplName(a[w4b.slot]) || 'assigned') : '\u2014';
        return '<label class="w4b-pick"><input type="checkbox" class="w4b-pk" data-em="' + esc(em) + '"' + (w4b.sel[em] ? ' checked' : '') + '/><span class="cl-av" style="width:28px;height:28px;font-size:10.5px;">' + esc(initials(c)) + '</span><span style="flex:1;min-width:0;"><span style="display:block;font-weight:600;font-size:13px;">' + esc(nameOf(c)) + '</span><span style="display:block;font-size:11px;color:var(--text-muted);">' + esc(c.member_email) + '</span></span>' + badge(c.status) + '<span class="w4b-tagrow" style="min-width:100px;margin:0;">' + w4bTagsOf(c.member_email).map(function(t){ return w4bChipHtml(t, false); }).join('') + '</span><span class="w4b-mu" style="min-width:140px;text-align:right;font-size:11.5px;">' + esc(cur) + '</span></label>';
      }).join('') : '<p class="w4b-mu" style="padding:14px;">' + (w4bClients().length ? 'Nothing fits that filter.' : 'No clients yet \u2014 add one from All clients first.') + '</p>') + '</div>' +
      '<div class="w4b-mu" style="font-size:11px;margin-top:8px;">Archived clients never appear here. Invited clients get the plan set now; it lands in their app when they accept your invite.</div>' +
      '</div>' + w4bCohortHtml('Choose what to assign \u2192', 2, null) + '</div>';
    $c('w4b-q').addEventListener('input', function(){ w4b.q = this.value.trim(); w4bRender1(); var qi = $c('w4b-q'); qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); });
    st.querySelectorAll('.w4b-st').forEach(function(b){ b.addEventListener('click', function(){ w4b.status = b.dataset.st; w4bRender1(); }); });
    st.querySelectorAll('.w4b-tag.f').forEach(function(b){ b.addEventListener('click', function(){ var k = b.dataset.w4bf, i = w4b.tagF.indexOf(k); if (i >= 0) w4b.tagF.splice(i, 1); else w4b.tagF.push(k); w4bRender1(); }); });
    st.querySelectorAll('.w4b-pk').forEach(function(cb){ cb.addEventListener('change', function(){ if (cb.checked) w4b.sel[cb.dataset.em] = true; else delete w4b.sel[cb.dataset.em]; w4bRender1(); }); });
    $c('w4b-selall').addEventListener('click', function(){ rows.forEach(function(c){ w4b.sel[String(c.member_email).toLowerCase()] = true; }); w4bRender1(); });
    $c('w4b-selnone').addEventListener('click', function(){ w4b.sel = {}; w4bRender1(); });
    w4bWireCohort(st, 2, null);
  }
  function w4bRender2(){
    var st = $c('w4b-stage-2');
    var pool = w4bPool(), q = (w4b.tq || '').toLowerCase();
    var shown = pool.filter(function(p){ return !q || p.name.toLowerCase().indexOf(q) >= 0; });
    st.innerHTML = '<div class="w4b-two"><div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + W4B_SLOTS.map(function(s){ return '<button class="pg-tab' + (w4b.slot === s[0] ? ' on' : '') + '" type="button" data-w4bslot="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>' +
      '<input id="w4b-tq" class="w4b-input" type="search" placeholder="Filter your plans" value="' + esc(w4b.tq || '') + '" style="width:100%;margin:10px 0;"/>' +
      '<div class="w4b-picklist">' + (shown.length ? shown.map(function(p){
        return '<label class="w4b-pick"><input type="radio" name="w4b-tpl" value="' + esc(p.id) + '"' + (w4b.tpl === p.id ? ' checked' : '') + '/><span style="flex:1;"><span style="display:block;font-weight:600;font-size:13px;">' + esc(p.name) + '</span><span style="display:block;font-size:11px;color:var(--text-muted);">' + esc(p.meta) + '</span></span><span class="src-tag src-mine">mine</span></label>';
      }).join('') : '<p class="w4b-mu" style="padding:14px;">' + (pool.length ? 'Nothing fits that filter.' : 'You have no saved ' + w4bSlotLabel(w4b.slot).toLowerCase() + ' items yet \u2014 build one first.') + '</p>') + '</div>' +
      '<div class="w4b-mu" style="font-size:11px;margin-top:8px;">Only your own items of this kind. Assigning replaces the client\u2019s ' + esc(w4bSlotLabel(w4b.slot).toLowerCase()) + ' slot \u2014 nothing else on the client changes.</div>' +
      '</div>' + w4bCohortHtml('Preview \u2192', 3, 1) + '</div>';
    st.querySelectorAll('[data-w4bslot]').forEach(function(b){ b.addEventListener('click', function(){ if (w4b.slot !== b.dataset.w4bslot){ w4b.slot = b.dataset.w4bslot; w4b.tpl = null; w4b.preview = null; } w4bRender2(); }); });
    $c('w4b-tq').addEventListener('input', function(){ w4b.tq = this.value.trim(); w4bRender2(); var qi = $c('w4b-tq'); qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); });
    st.querySelectorAll('input[name="w4b-tpl"]').forEach(function(r){ r.addEventListener('change', function(){ w4b.tpl = r.value; w4b.preview = null; w4bRender2(); }); });
    w4bWireCohort(st, 3, 1);
  }
  async function w4bDryRun(){
    var nx = document.querySelector('#w4b-stage-2 .w4b-next'); if (nx){ nx.disabled = true; nx.textContent = 'Checking\u2026'; }
    var seq = ++w4b.seq;
    try {
      var r = await ef({ action: 'batch_dry_run', slot_key: w4b.slot, template_id: w4b.tpl, emails: w4bSelected().map(function(c){ return c.member_email; }) });
      if (seq !== w4b.seq) return;
      w4b.preview = r; w4b.result = null; w4bStep(3);
    } catch(e){ if (nx){ nx.disabled = false; nx.textContent = 'Preview \u2192'; } alert('Preview failed: ' + (e.message || e)); }
  }
  function w4bRender3(){
    var st = $c('w4b-stage-3'), p = w4b.preview; if (!p){ st.innerHTML = ''; return; }
    var rows = p.rows || [], push = rows.filter(function(r){ return r.mode === 'push'; }).length, wait = rows.filter(function(r){ return r.mode === 'on_accept'; }).length, same = rows.filter(function(r){ return r.mode === 'already'; }).length;
    var todo = rows.length - same;
    var isW = w4b.slot === 'workout_template_id';
    st.innerHTML = '<div class="w4b-sum"><b>' + rows.length + ' client' + (rows.length === 1 ? '' : 's') + '</b>' +
      (push ? ' \u00b7 ' + push + ' pushed to their app now (each gets your \u201cplan updated\u201d email)' : '') + (wait ? ' \u00b7 ' + wait + ' land' + (wait === 1 ? 's' : '') + ' when they accept' : '') + (same ? ' \u00b7 ' + same + ' already on it (skipped)' : '') +
      ((p.unknown_emails || []).length ? ' \u00b7 <span style="color:#E8834A;">' + p.unknown_emails.length + ' not your client</span>' : '') + ' \u00b7 <span style="color:#3DB89F;font-weight:700;">reversible</span></div>' +
      '<div style="overflow-x:auto;"><table class="cl-tbl"><tr><th>Client</th><th>Status</th><th>Now</th><th>After</th><th>What happens</th></tr>' + rows.map(function(r){
        var now = isW ? (r.now_programme ? esc(r.now_programme) + (r.now_week ? ' <span class="w4b-mu">\u00b7 wk ' + r.now_week + '</span>' : '') : (r.now_name ? esc(r.now_name) : '<span class="w4b-mu">no ' + esc(w4bSlotLabel(w4b.slot).toLowerCase()) + '</span>')) : (r.now_name ? esc(r.now_name) : '<span class="w4b-mu">none</span>');
        var pp = r.mode === 'push' ? '<span class="w4b-pp push">pushes to app + email</span>' : r.mode === 'on_accept' ? '<span class="w4b-pp wait">applies when they accept</span>' : '<span class="w4b-pp same">already on it</span>';
        return '<tr' + (r.mode === 'already' ? ' style="opacity:.6;"' : '') + '><td><b>' + esc(r.name) + '</b><br><span class="w4b-mu">' + esc(r.email) + '</span></td><td>' + badge(r.status) + '</td><td>' + now + '</td><td>' + esc(r.after_name || '') + (isW && r.mode !== 'already' ? ' <span class="w4b-mu">\u00b7 wk 1</span>' : '') + '</td><td>' + pp + '</td></tr>';
      }).join('') + '</table></div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap;"><input id="w4b-reason" class="w4b-input" type="text" maxlength="300" placeholder="Reason (optional) \u2014 shows in each client\u2019s timeline" style="flex:1;min-width:240px;"/><button class="btn" type="button" id="w4b-back3">\u2190 Back</button><button class="btn btn-primary" type="button" id="w4b-apply"' + (todo ? '' : ' disabled') + '>Assign to ' + todo + ' client' + (todo === 1 ? '' : 's') + '</button></div>';
    $c('w4b-back3').addEventListener('click', function(){ w4bStep(2); });
    $c('w4b-apply').addEventListener('click', async function(){
      if (!confirm('Assign \u201c' + w4bTplName(w4b.tpl) + '\u201d to ' + todo + ' client' + (todo === 1 ? '' : 's') + '? ' + (push ? push + ' get it in their app straight away. ' : '') + 'You can revert this batch afterwards.')) return;
      this.disabled = true; this.textContent = 'Assigning\u2026';
      try {
        var r = await ef({ action: 'batch_apply', slot_key: w4b.slot, template_id: w4b.tpl, emails: rows.map(function(x){ return x.email; }), reason: $c('w4b-reason').value.trim() || undefined });
        w4b.result = r; w4b.preview = null;
        try { await loadClients(); } catch(_){}
        w4bStep(4); w4bRecentLoad();
      } catch(e){ this.disabled = false; this.textContent = 'Assign to ' + todo + ' client' + (todo === 1 ? '' : 's'); alert('Batch failed: ' + (e.message || e)); }
    });
  }
  function w4bRender4(){
    var st = $c('w4b-stage-4'), r = w4b.result; if (!r){ st.innerHTML = ''; return; }
    var isW = w4b.slot === 'workout_template_id';
    st.innerHTML = '<div class="w4b-sum ok"><b>Done.</b> ' + r.applied + ' assigned \u00b7 ' + r.failed + ' failed' + (r.skipped ? ' \u00b7 ' + r.skipped + ' skipped' : '') + ' \u00b7 batch <code class="w4b-code">' + esc(String(r.batch_id).slice(0, 8)) + '</code></div>' +
      '<div style="overflow-x:auto;"><table class="cl-tbl"><tr><th></th><th>Client</th><th>Result</th><th>Before</th><th></th></tr>' + (r.results || []).map(function(x){
        var c = roster.filter(function(k){ return String(k.member_email).toLowerCase() === String(x.email).toLowerCase(); })[0];
        var ok = x.status === 'applied';
        return '<tr><td>' + (ok ? '<span style="color:#3DB89F;font-weight:700;">\u2713</span>' : x.status === 'skipped' ? '<span class="w4b-pp skip">skipped</span>' : '<span class="w4b-pp fail">\u2717</span>') + '</td><td><b>' + esc(c ? nameOf(c) : x.email) + '</b></td>' +
          '<td>' + (ok ? (x.applied_now ? 'Now on <b>' + esc(r.template_name) + '</b>' + (isW ? ' \u00b7 wk 1' : '') : 'Slot set \u00b7 <b>' + esc(r.template_name) + '</b>') : '<span class="w4b-mu">' + esc(x.error || x.status) + '</span>') + '</td>' +
          '<td class="w4b-mu">' + (x.prior_name ? 'Was on ' + esc(x.prior_name) + (x.prior_week ? ' \u00b7 wk ' + x.prior_week : '') : 'Was empty') + '</td>' +
          '<td class="w4b-mu">' + (ok ? (x.applied_now ? ((x.automations || []).length ? 'email sent' : 'pushed') : 'applies on accept') : '') + '</td></tr>';
      }).join('') + '</table></div>' +
      ((r.unknown_emails || []).length ? '<p class="w4b-mu" style="margin-top:8px;">Not your clients, ignored: ' + r.unknown_emails.map(esc).join(', ') + '</p>' : '') +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap;"><button class="btn" type="button" id="w4b-revert-now"' + (r.applied ? '' : ' disabled') + '>Revert this batch</button><span class="w4b-mu">Puts each client back on what they had \u2014 including their week \u2014 unless you\u2019ve changed them since.</span><button class="btn" type="button" id="w4b-again" style="margin-left:auto;">New batch</button></div>';
    $c('w4b-revert-now').addEventListener('click', function(){ w4bRevert(r.batch_id, this); });
    $c('w4b-again').addEventListener('click', function(){ w4b.sel = {}; w4b.tpl = null; w4b.preview = null; w4b.result = null; w4bStep(1); });
  }
  async function w4bRevert(batchId, btn){
    if (!confirm('Revert this batch? Clients still on the batch plan go back to what they had before; anyone you have changed since is left alone.')) return;
    if (btn){ btn.disabled = true; btn.textContent = 'Reverting\u2026'; }
    try {
      var r = await ef({ action: 'batch_revert', batch_id: batchId });
      if (btn) btn.textContent = 'Reverted \u2014 ' + r.reverted + ' restored, ' + (r.results || []).filter(function(x){ return x.status !== 'reverted'; }).length + ' skipped';
      try { await loadClients(); } catch(_){}
      w4bRecentLoad();
    } catch(e){ if (btn){ btn.disabled = false; btn.textContent = 'Revert this batch'; } alert('Revert failed: ' + (e.message || e)); }
  }
  async function w4bRecentLoad(){
    var el = $c('w4b-recent'); if (!el) return;
    try {
      var r = await ef({ action: 'list_batches' });
      var bs = r.batches || [];
      if (!bs.length){ el.innerHTML = '<p class="w4b-mu">No batches yet.</p>'; return; }
      el.innerHTML = '<div style="overflow-x:auto;"><table class="cl-tbl"><tr><th>When</th><th>Assigned</th><th>Slot</th><th>Clients</th><th>Reason</th><th style="text-align:right;"></th></tr>' + bs.map(function(b){
        var live = b.applied, changed = (b.rows || []).filter(function(x){ return x.status === 'applied' && x.revert_note; }).length;
        var right = b.reverted_at ? '<span class="w4b-mu">Reverted</span>' : live ? ((changed ? '<span class="w4b-mu">' + changed + ' changed since \u00b7 </span>' : '') + '<button class="btn" type="button" data-w4brv="' + esc(b.id) + '" style="font-size:11.5px;padding:6px 12px;">' + (b.reverted ? 'Revert remaining' : 'Revert') + '</button>') : '<span class="w4b-mu">Nothing to revert</span>';
        return '<tr><td>' + esc(new Date(b.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</td><td><b>' + esc(b.template_name || '') + '</b></td><td>' + esc(w4bSlotLabel(b.slot_key)) + '</td><td>' + b.total + (b.failed ? ' <span class="w4b-pp fail">' + b.failed + ' failed</span>' : '') + (b.reverted && !b.reverted_at ? ' <span class="w4b-mu">\u00b7 ' + b.reverted + ' reverted</span>' : '') + '</td><td class="w4b-mu">' + esc(b.reason || '\u2014') + '</td><td style="text-align:right;">' + right + '</td></tr>';
      }).join('') + '</table></div>';
      el.querySelectorAll('[data-w4brv]').forEach(function(b){ b.addEventListener('click', function(){ w4bRevert(b.dataset.w4brv, b); }); });
    } catch(e){ el.innerHTML = '<p class="w4b-mu">Could not load batches: ' + esc(e.message || e) + '</p>'; }
  }
  async function w4bBatchInit(){
    if (!w4b.inited){
      w4b.inited = true;
      document.querySelectorAll('.w4b-stp').forEach(function(b){ b.addEventListener('click', function(){ if (!b.disabled) w4bStep(+b.dataset.w4bs); }); });
    }
    var st = $c('w4b-stage-1'); if (st && !st.innerHTML) st.innerHTML = '<p class="w4b-mu">Loading clients\u2026</p>';
    try {
      if (!roster.length) await loadClients();
      await w4bTagsLoad();
      if (!w4b.lib) w4b.lib = await ef({ action: 'libraries' });
    } catch(e){ if (st) st.innerHTML = '<p class="w4b-mu">Could not load: ' + esc(e.message || e) + '</p>'; return; }
    w4bStep(w4b.step || 1);
    w4bRecentLoad();
  }

  /* -- go SHADOW (byte-replicates the Wave 7 version + the clients_batch route) -- */
  function go(view){
    if (!goFromHash){ try { history.replaceState(null, '', '#' + view); } catch(_){} }
    document.querySelectorAll('.cp-item').forEach(function(x){ x.classList.toggle('active', x.dataset.go === view); });
    // auto-open the group that owns the active sub-item
    var activeSub = document.querySelector('.cp-subitem[data-go="' + String(view).replace(/"/g, '') + '"]');
    if (activeSub){
      var sub = activeSub.closest('.cp-sub');
      if (sub && !sub.classList.contains('open')){
        sub.classList.add('open');
        var h = document.querySelector('.cp-ghead[data-grp="' + sub.dataset.sub + '"]');
        if (h) h.classList.add('open');
      }
    }
    var V = ['view-dashboard','view-clients','view-leads','view-msgs','view-cal','view-plans','view-exercises','view-notifs','view-autos','view-profile','view-soon','view-settings','view-ci','view-daily','view-content','view-clients-batch'];
    var kindSel = null;
    var show = 'view-soon';
    if (view === 'dashboard') show = 'view-dashboard';
    else if (view === 'clients') show = 'view-clients';
    else if (view === 'clients_checkins') show = 'view-ci';
    else if (view === 'clients_daily') show = 'view-daily';
    else if (view === 'clients_batch') show = 'view-clients-batch';
    else if (view === 'profile') show = 'view-profile';
    else if (view === 'settings' || view === 'terms') show = 'view-profile';
    else if (view === 'exercises') show = 'view-exercises';
    else if (view === 'notifications') show = 'view-notifs';
    else if (view === 'automations') show = 'view-autos';
    else if (view === 'leads') show = 'view-leads';
    else if (view === 'messages') show = 'view-msgs';
    else if (view === 'calendar') show = 'view-cal';
    else if (view === 'content') show = 'view-content';
    else if (String(view).indexOf('kindsel:') === 0){ show = 'view-plans'; kindSel = String(view).slice(8); }
    else if (SECTION_KINDS[view]) show = 'view-plans';
    V.forEach(function(id){ var e = $c(id); if (e) e.style.display = id === show ? '' : 'none'; });
    if (kindSel){
      var target = null;
      document.querySelectorAll('.pl-kind').forEach(function(b){
        var on = b.dataset.kind === kindSel;
        b.style.display = on ? '' : 'none';
        if (on) target = b;
      });
      if (target) target.click();
      loadExerciseNames(); exLoad();
    } else if (SECTION_KINDS[view]){
      var kinds = SECTION_KINDS[view];
      var first = null;
      document.querySelectorAll('.pl-kind').forEach(function(b){
        var inSec = kinds.indexOf(b.dataset.kind) >= 0;
        b.style.display = inSec ? '' : 'none';
        if (inSec && !first) first = b;
      });
      if (kinds.indexOf(plKind) < 0 && first) first.click();
      else { plLoad(); }
      loadExerciseNames(); exLoad();
    }
    if (view === 'exercises') exInit();
    if (view === 'notifications') notifLoad(true);
    if (view === 'automations') autoLoad();
    if (view === 'leads') leadsLoad();
    if (view === 'messages') msgInit();
    if (view === 'calendar') calLoad();
    if (view === 'content') w6ContentLoad();
    if (view === 'dashboard') renderDashboard();
    if (view === 'profile') renderProfile('overview');
    if (view === 'settings') renderProfile('settings');
    if (view === 'terms'){ renderProfile('settings'); setTimeout(function(){ var x = $c('ct-editor'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400); }
    if (view === 'clients_checkins') ciLoad();
    if (view === 'clients_daily') dgLoad();
    if (view === 'clients_batch') w4bBatchInit();
    if (view === 'clients'){ w4bTagsLoad().then(function(){ w4bTagBarRender(); w4bDecorateRoster(); }); }
    if (SOON_COPY[view]){ $c('soon-title').textContent = SOON_COPY[view][0]; $c('soon-desc').textContent = SOON_COPY[view][1]; }
    var side = $c('cp-side'); if (side) side.classList.remove('open');
    var ov = $c('cp-overlay'); if (ov) ov.classList.remove('show');
  }
  /* ============================ end PM-1036 W4b ============================ */

