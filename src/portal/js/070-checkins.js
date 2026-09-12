  async function renderClientCheckins(c){
    var host = $c('cd-checkins');
    if (!host) return;
    host.innerHTML = '<div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px;">Check-ins</div><p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    var enc = encodeURIComponent(c.member_email);
    var resp = [];
    try { resp = await rest('/coach_form_responses?member_email=eq.' + enc + '&' + pscope() + '&order=submitted_at.desc&limit=26&select=id,form_id,answers,week_start,submitted_at,reviewed_at') || []; } catch(_){}
    if (!resp.length){ host.innerHTML = '<div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin:4px 0 8px;">Check-ins</div><p style="font-size:12.5px;color:var(--text-muted);">Nothing submitted yet.</p>'; return; }
    var formIds = []; resp.forEach(function(r){ if (r.form_id && formIds.indexOf(r.form_id) < 0) formIds.push(r.form_id); });
    var formMap = {};
    if (formIds.length){
      try {
        var fs = await rest('/coach_forms?id=in.(' + formIds.map(function(i){ return '"' + i + '"'; }).join(',') + ')&select=id,kind,title,questions') || [];
        fs.forEach(function(f){ formMap[f.id] = f; });
      } catch(_){}
    }
    // collect photo answers for signed URLs (batch)
    var photoPaths = [];
    resp.forEach(function(r){
      var a = r.answers || {};
      Object.keys(a).forEach(function(k){ var v = a[k]; if (v && typeof v === 'object' && v.path) photoPaths.push(v.path); });
    });
    var urlMap = {};
    if (photoPaths.length){
      try {
        var su = await sb().storage.from('coach-checkins').createSignedUrls(photoPaths, 3600);
        (su.data || []).forEach(function(u, i){ if (u && u.signedUrl) urlMap[photoPaths[i]] = u.signedUrl; });
      } catch(_){}
    }
    function answerHtml(q, v){
      var label = q ? q.label : 'Answer';
      var body;
      if (v == null || v === '') body = '<span style="color:var(--text-muted);">\u2014</span>';
      else if (typeof v === 'object' && v.path){
        var u = urlMap[v.path];
        body = u ? '<a href="' + u + '" target="_blank" rel="noopener"><img src="' + u + '" loading="lazy" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:1px solid var(--border);"/></a>' : '<span style="color:var(--text-muted);">photo unavailable</span>';
      }
      else if (q && q.type === 'scale') body = '<strong>' + esc(String(v)) + '</strong>/10';
      else if (q && q.type === 'stars'){ var sv = parseInt(v) || 0; body = '<span style="color:var(--vyve-gold, #C9A84C);font-size:15px;">' + '\u2605'.repeat(Math.min(sv,5)) + '\u2606'.repeat(Math.max(0, 5 - sv)) + '</span>'; }
      else if (q && q.type === 'yesno') body = '<strong>' + (String(v).toLowerCase() === 'yes' || v === true ? 'Yes' : 'No') + '</strong>';
      else body = esc(String(v));
      return '<div style="margin-bottom:8px;"><div style="font-size:11.5px;color:var(--text-muted);">' + esc(label) + '</div><div style="font-size:13px;">' + body + '</div></div>';
    }
    function cardHtml(r){
      var f = formMap[r.form_id] || {};
      var qs = (f.questions || []);
      var a = r.answers || {};
      var parts = '';
      var doneKeys = {};
      var lastSec = null; // PM-984: #40 section grouping (Progress tracking)
      qs.forEach(function(q){ if (q.id in a){
        var sec = q.section || null;
        if (sec !== lastSec){
          lastSec = sec;
          if (sec) parts += '<div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--teal-lt,var(--vyve-teal));margin:10px 0 6px;">' + (sec === 'progress' ? 'Progress tracking' : esc(sec)) + '</div>';
        }
        parts += answerHtml(q, a[q.id]); doneKeys[q.id] = 1;
      } });
      Object.keys(a).forEach(function(k){ if (!doneKeys[k]) parts += answerHtml(null, a[k]); });
      var head = (f.title || (f.kind === 'onboarding' ? 'Onboarding questionnaire' : 'Check-in')) +
        (r.week_start ? ' \u00b7 w/c ' + r.week_start : '') +
        ' \u00b7 ' + new Date(r.submitted_at).toLocaleDateString('en-GB');
      var rev = r.reviewed_at
        ? '<span class="src-tag src-mine">Reviewed</span>'
        : '<button class="btn" data-ci-rev="' + r.id + '" style="font-size:11.5px;">Mark reviewed</button>';
      return '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px;' + (r.reviewed_at ? '' : 'border-left:3px solid #E8834A;') + '">' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;"><strong style="font-size:13px;flex:1;">' + esc(head) + '</strong>' + rev + '</div>' + parts + '</div>';
    }
    function photoTimelineHtml(){
      var groups = {};
      resp.forEach(function(r){
        var a = r.answers || {};
        Object.keys(a).forEach(function(k){
          var v = a[k];
          if (v && typeof v === 'object' && v.path && urlMap[v.path]){
            var key = r.week_start || r.submitted_at.slice(0, 10);
            (groups[key] = groups[key] || []).push(urlMap[v.path]);
          }
        });
      });
      var keys = Object.keys(groups).sort().reverse();
      if (!keys.length) return '<p style="font-size:12.5px;color:var(--text-muted);">No photos submitted yet.</p>';
      var cmpBar = '<div id="ci-cmp-bar" style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Tap two photos to compare side by side.</div><div id="ci-cmp-panel" style="display:none;gap:10px;margin-bottom:14px;"></div>';
      return cmpBar + keys.map(function(k){
        return '<div style="margin-bottom:14px;"><div style="font-size:11.5px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">w/c ' + esc(k) + '</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          groups[k].map(function(u){ return '<img src="' + u + '" loading="lazy" class="ci-cmp-img" data-url="' + u + '" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:2px solid var(--border);cursor:pointer;"/>'; }).join('') +
          '</div></div>';
      }).join('');
    }
    function paint(tab){
      host.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin:4px 0 10px;"><div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);flex:1;">Check-ins (' + resp.length + ')</div>' +
        '<button class="btn ci-tab' + (tab === 'list' ? ' btn-primary' : '') + '" data-ci-tab="list" type="button" style="font-size:11.5px;">Submissions</button>' +
        '<button class="btn ci-tab' + (tab === 'photos' ? ' btn-primary' : '') + '" data-ci-tab="photos" type="button" style="font-size:11.5px;">Photo timeline</button></div>' +
        (tab === 'list' ? resp.map(cardHtml).join('') : photoTimelineHtml());
      host.querySelectorAll('[data-ci-tab]').forEach(function(b){ b.addEventListener('click', function(){ paint(b.dataset.ciTab); }); });
      if (tab === 'photos'){
        var picked = [];
        function renderCmp(){
          var panel = host.querySelector('#ci-cmp-panel'), bar = host.querySelector('#ci-cmp-bar');
          host.querySelectorAll('.ci-cmp-img').forEach(function(im){ im.style.borderColor = picked.indexOf(im.dataset.url) >= 0 ? '#C9A84C' : 'var(--border)'; });
          if (!panel || !bar) return;
          if (picked.length === 2){
            panel.style.display = 'flex';
            panel.innerHTML = picked.map(function(u){ return '<a href="' + u + '" target="_blank" rel="noopener" style="flex:1;min-width:0;"><img src="' + u + '" style="width:100%;max-height:420px;object-fit:contain;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);"/></a>'; }).join('') +
              '<button class="btn" id="ci-cmp-clear" type="button" style="font-size:11.5px;align-self:flex-start;">Clear</button>';
            bar.textContent = 'Comparing \u2014 tap Clear to pick again.';
            var cb = panel.querySelector('#ci-cmp-clear');
            if (cb) cb.addEventListener('click', function(){ picked = []; renderCmp(); });
          } else {
            panel.style.display = 'none'; panel.innerHTML = '';
            bar.textContent = picked.length === 1 ? 'One picked \u2014 tap a second photo to compare.' : 'Tap two photos to compare side by side.';
          }
        }
        host.querySelectorAll('.ci-cmp-img').forEach(function(im){
          im.addEventListener('click', function(){
            var u = im.dataset.url, i = picked.indexOf(u);
            if (i >= 0) picked.splice(i, 1);
            else { picked.push(u); if (picked.length > 2) picked.shift(); }
            renderCmp();
          });
        });
      }
      host.querySelectorAll('[data-ci-rev]').forEach(function(b){
        b.addEventListener('click', async function(){
          b.disabled = true;
          try {
            await rest('/coach_form_responses?id=eq.' + b.dataset.ciRev, { method: 'PATCH', body: { reviewed_at: new Date().toISOString() } });
            var row = resp.find(function(x){ return x.id === b.dataset.ciRev; });
            if (row) row.reviewed_at = new Date().toISOString();
            nfEvents.forEach(function(e){ if (e.kind === 'checkin' && e.email === c.member_email) e.unreviewed = false; });
            paint('list');
          } catch(e2){ alert('Couldn\u2019t mark reviewed: ' + e2.message); b.disabled = false; }
        });
      });
    }
    paint('list');
  }

  /* ── Builder v2: exercise library + day templates + programmes ── */
  var cexRows = [], cexLoaded = false, cexEditing = null, cexDupFrom = null, exScope = 'all';
  var dayTplChoices = [];
  var progState = null, progWeekIdx = 0, progEditingDay = null;
