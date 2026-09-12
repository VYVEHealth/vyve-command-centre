

  /* ═══════════════════════════════════════════════════════════════════════
     PM-1103 — TRAINERIZE W6 PART 2 (gap-map #88): bulk video attach.

     Lives under the VYVE library at null scope (vyveScope) — a coach never
     sees the door. Writes go straight through PostgREST under `cex_admin_all`
     (is_admin_or_team, ALL), so there is NO migration and NO Edge Function
     behind this; the tool is the UI over a permission that already existed.

     §23.252: nothing here redeclares an earlier function. exRender/exLoad
     keep their W3 declarations — the filter clause and the count line were
     edited IN PLACE up there rather than shadowed a third time. Everything
     in this zone is a new name (w6b*).

     Design decisions worth keeping:
       - "filmed" tests video_url OR media_url, because coach_resolve_video
         COALESCEs them; 17 rows carry media_url only and already play.
       - a name matching more than one exercise is a HARD ERROR, never
         first-match-wins.
       - an existing video is never overwritten unless the box is ticked, so
         re-pasting the same list is safe.
       - one PATCH per row with return=representation, so a row that matched
         nothing is reported as a failure instead of a silent 204.
     ═══════════════════════════════════════════════════════════════════════ */

  var w6bLastBatch = null;   // [{id, name, field, prior, priorLabel}] for undo
  var w6bChecked = null;     // parsed + validated rows awaiting Attach

  function w6bTotals(){
    var filmed = 0, alt = 0;
    cexRows.forEach(function(r){
      if (r.video_url || r.media_url) filmed++;
      if (r.video_url_alt) alt++;
    });
    return filmed + ' of ' + cexRows.length + ' filmed \u00b7 ' + alt + ' with an alt';
  }

  function w6bStyles(){
    if ($c('w6b-style')) return;
    var st = document.createElement('style');
    st.id = 'w6b-style';
    st.textContent =
      '#w6b-panel textarea{width:100%;font-family:var(--font-mono, monospace);font-size:12px;line-height:1.7;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);resize:vertical;outline:none;}' +
      '#w6b-panel table{width:100%;border-collapse:collapse;font-size:12.5px;}' +
      '#w6b-panel th{text-align:left;font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--text-muted);font-weight:700;padding:7px 8px;border-bottom:1px solid var(--border-strong);}' +
      '#w6b-panel td{padding:8px;border-bottom:1px solid var(--border);vertical-align:top;}' +
      '#w6b-panel td.mono{font-family:var(--font-mono, monospace);font-size:11.5px;color:var(--text-muted);word-break:break-all;}' +
      '#w6b-panel tr.bad td{background:var(--danger-pale);}' +
      '#w6b-panel tr.warn td{background:var(--warning-pale);}' +
      '.w6b-chip{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;border:1px solid;white-space:nowrap;}' +
      '.w6b-ok{color:var(--success);border-color:var(--success);background:var(--success-pale);}' +
      '.w6b-warn{color:var(--warning);border-color:var(--warning);background:var(--warning-pale);}' +
      '.w6b-bad{color:var(--danger);border-color:var(--danger);background:var(--danger-pale);}' +
      '.w6b-dim{color:var(--text-dim);border-color:var(--border-strong);}' +
      '.w6b-gold{color:var(--gold);border-color:var(--gold);background:var(--gold-pale);}' +
      '.w6b-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:11px 13px;border-radius:9px;font-size:12.5px;margin-bottom:12px;border:1px solid var(--border-strong);}' +
      '#w6b-panel ul.w6b-why{margin:5px 0 0;padding-left:17px;font-size:11.5px;color:var(--text-muted);line-height:1.65;}';
    document.head.appendChild(st);
  }

  function w6bEnsure(){
    if ($c('w6b-panel')) return;
    w6bStyles();
    var host = document.createElement('div');
    host.className = 'card';
    host.id = 'w6b-panel';
    host.style.display = 'none';
    host.innerHTML =
      '<div class="card-title">Bulk attach videos' +
        '<button class="btn" id="w6b-close" type="button" style="margin-left:auto;font-size:12px;">Close</button></div>' +
      '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">One row per line. Nothing is written until you have seen the check.</p>' +
      '<div class="w6b-bar" style="background:var(--accent-pale);color:var(--text-muted);">' +
        '<span><strong style="color:var(--text);">Format</strong> &nbsp;exercise, url, slot, label</span>' +
        '<span style="color:var(--text-dim);">exercise = exact name or id &middot; slot = primary (default) or alt &middot; label only used on alt</span>' +
      '</div>' +
      '<textarea id="w6b-paste" rows="9" spellcheck="false" placeholder="Bulgarian Split Squat, https://\u2026/bulgarian-split-squat.mp4&#10;Bulgarian Split Squat, https://\u2026/bss-female.mp4, alt, Female&#10;Chest-Supported Row, https://youtu.be/\u2026"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center;">' +
        '<button class="btn btn-primary" id="w6b-check" type="button" style="font-size:12.5px;">Check rows</button>' +
        '<button class="btn" id="w6b-apply" type="button" style="font-size:12.5px;" disabled>Attach 0 rows</button>' +
        '<span id="w6b-lines" style="font-size:12px;color:var(--text-dim);margin-left:auto;"></span>' +
      '</div>' +
      '<div id="w6b-out" style="margin-top:14px;"></div>';
    var lib = $c('ex-list') ? $c('ex-list').closest('.card') : null;
    if (lib && lib.parentNode) lib.parentNode.insertBefore(host, lib.nextSibling);
    else $c('view-exercises').appendChild(host);

    $c('w6b-close').addEventListener('click', function(){ host.style.display = 'none'; });
    $c('w6b-check').addEventListener('click', w6bCheck);
    $c('w6b-apply').addEventListener('click', w6bApply);
    $c('w6b-paste').addEventListener('input', function(){
      var n = w6bLines($c('w6b-paste').value).length;
      $c('w6b-lines').textContent = n ? (n + ' line' + (n === 1 ? '' : 's') + ' pasted') : '';
      // Any edit invalidates the previous check — never let a stale verdict
      // authorise a write.
      w6bChecked = null;
      $c('w6b-apply').disabled = true;
      $c('w6b-apply').textContent = 'Attach 0 rows';
    });
  }

  function w6bLines(txt){
    return String(txt || '').split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l && l.charAt(0) !== '#'; });
  }

  var W6B_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function w6bParse(line){
    // Split on commas, but a URL never contains one in practice and the label
    // is the last field, so a simple split with a rejoin of the tail is safe.
    var p = line.split(',').map(function(x){ return x.trim(); });
    return {
      raw: line,
      ident: p[0] || '',
      url: p[1] || '',
      slot: (p[2] || 'primary').toLowerCase(),
      label: p.slice(3).join(', ').trim()
    };
  }

  function w6bResolve(ident){
    if (W6B_UUID.test(ident)){
      var byId = cexRows.filter(function(r){ return r.id === ident; });
      return { hits: byId };
    }
    var n = ident.toLowerCase();
    return { hits: cexRows.filter(function(r){ return String(r.name || '').toLowerCase() === n; }) };
  }

  function w6bCheck(){
    var over = $c('w6b-over') && $c('w6b-over').checked;
    var rows = w6bLines($c('w6b-paste').value).map(w6bParse);
    var seen = {};
    rows.forEach(function(row){
      row.errors = [];
      row.warn = null;

      if (row.slot !== 'primary' && row.slot !== 'alt') row.errors.push('slot must be "primary" or "alt" \u2014 got "' + row.slot + '"');
      if (!row.url) row.errors.push('no video url on this line');
      else if (!/^https:\/\//i.test(row.url)) row.errors.push('url must start with https://');
      if (row.slot === 'alt' && !row.label) row.errors.push('an alt needs a label \u2014 it is what the member sees on the toggle');

      var res = w6bResolve(row.ident);
      if (!res.hits.length) row.errors.push('no such exercise');
      else if (res.hits.length > 1) row.errors.push('name matches ' + res.hits.length + ' exercises \u2014 use the id, or the full name');
      else {
        row.ex = res.hits[0];
        // Staff scope only ever writes the stock library.
        if (row.ex.partner_id) row.errors.push('that is a coach\u2019s own exercise \u2014 not writable from the VYVE library');
      }

      if (row.ex){
        var key = row.ex.id + '|' + row.slot;
        if (seen[key]) row.errors.push('same exercise and slot appears earlier in this paste');
        seen[key] = 1;
        // `prior` is the value UNDO writes back, so it is strictly the field
        // this row will overwrite. `priorShown` is what actually plays today
        // and is what decides the overwrite warning: coach_resolve_video
        // COALESCEs video_url over media_url, so a media_url-only row (17 of
        // them) is already playing something and attaching a video_url would
        // silently change it. Warn on the COALESCE, undo on the field.
        row.prior = row.slot === 'alt' ? (row.ex.video_url_alt || null) : (row.ex.video_url || null);
        row.priorShown = row.slot === 'alt' ? row.prior : (row.ex.video_url || row.ex.media_url || null);
        row.priorLabel = row.ex.alt_label || null;
        if (row.priorShown && !over){
          row.warn = 'already has a ' + (row.slot === 'alt' ? 'video in this slot'
            : (row.ex.video_url ? 'video' : 'VYVE video (media_url) that this would override'));
        }
      }
      row.ready = !row.errors.length && !row.warn;
    });

    w6bChecked = rows;
    w6bRenderCheck(rows, over);
  }

  function w6bRenderCheck(rows, over){
    var ready = rows.filter(function(r){ return r.ready; }).length;
    var blocked = rows.filter(function(r){ return r.errors.length; }).length;
    var skipped = rows.filter(function(r){ return r.warn; }).length;

    var bar = '<div class="w6b-bar" style="background:' + (blocked ? 'var(--warning-pale)' : 'var(--success-pale)') + ';border-color:' + (blocked ? 'var(--warning)' : 'var(--success)') + ';">' +
      '<span><strong style="color:var(--text);">' + ready + ' ready</strong>' +
      (skipped ? ' \u00b7 ' + skipped + ' would overwrite' : '') +
      (blocked ? ' \u00b7 ' + blocked + ' cannot be attached' : '') + '</span>' +
      '<label style="margin-left:auto;font-size:12px;display:flex;gap:6px;align-items:center;cursor:pointer;">' +
        '<input type="checkbox" id="w6b-over"' + (over ? ' checked' : '') + ' style="accent-color:var(--gold);"/> Allow overwrite of an existing video</label>' +
    '</div>';

    var body = rows.map(function(r, i){
      var cls = r.errors.length ? 'bad' : (r.warn ? 'warn' : '');
      var verdict = r.errors.length
        ? '<span class="w6b-chip w6b-bad">cannot attach</span><ul class="w6b-why">' + r.errors.map(function(e){ return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>'
        : (r.warn
            ? '<span class="w6b-chip w6b-warn">' + esc(r.warn) + '</span><ul class="w6b-why"><li>Tick allow-overwrite above, then check again</li></ul>'
            : '<span class="w6b-chip w6b-ok">ready</span>' + (/youtu\.?be/i.test(r.url) ? ' <span style="font-size:11px;color:var(--text-muted);">YouTube</span>' : ''));
      var slot = r.slot === 'alt'
        ? '<span class="w6b-chip w6b-gold">alt' + (r.label ? ' \u00b7 ' + esc(r.label) : '') + '</span>'
        : '<span class="w6b-chip w6b-dim">primary</span>';
      return '<tr class="' + cls + '"><td>' + (i + 1) + '</td>' +
        '<td>' + esc(r.ex ? r.ex.name : r.ident) + '</td>' +
        '<td>' + slot + '</td>' +
        '<td class="mono">' + esc(r.url) + '</td>' +
        '<td>' + verdict + '</td></tr>';
    }).join('');

    $c('w6b-out').innerHTML = bar +
      '<table><thead><tr><th style="width:22px;"></th><th>Exercise</th><th>Slot</th><th>Video</th><th>Verdict</th></tr></thead><tbody>' + body + '</tbody></table>';

    $c('w6b-over').addEventListener('change', w6bCheck);
    $c('w6b-apply').disabled = !ready;
    $c('w6b-apply').textContent = 'Attach ' + ready + ' row' + (ready === 1 ? '' : 's');
  }

  // One PATCH per row. return=representation so a filter that matched nothing
  // is a failure, not a silent 204.
  async function w6bPatch(id, body){
    var t = await jwt();
    var r = await fetch(REST + '/coach_exercises?id=eq.' + id, {
      method: 'PATCH',
      headers: { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    });
    var txt = await r.text();
    if (!r.ok) throw new Error('HTTP ' + r.status + (txt ? ' \u2014 ' + txt.slice(0, 160) : ''));
    var out = txt ? JSON.parse(txt) : [];
    if (!out.length) throw new Error('no row was updated');
    return out[0];
  }

  async function w6bApply(){
    if (!w6bChecked) return;
    var todo = w6bChecked.filter(function(r){ return r.ready; });
    if (!todo.length) return;
    $c('w6b-apply').disabled = true;
    $c('w6b-apply').textContent = 'Attaching\u2026';

    var undo = [], done = 0, failed = 0;
    for (var i = 0; i < todo.length; i++){
      var r = todo[i];
      var body = r.slot === 'alt' ? { video_url_alt: r.url, alt_label: r.label } : { video_url: r.url };
      try {
        var updated = await w6bPatch(r.ex.id, body);
        r.result = 'ok'; done++;
        undo.push({ id: r.ex.id, name: r.ex.name, slot: r.slot, prior: r.prior, priorLabel: r.priorLabel });
        // Keep the in-memory library truthful so the grid and the totals move
        // without a refetch.
        if (r.slot === 'alt'){ r.ex.video_url_alt = updated.video_url_alt; r.ex.alt_label = updated.alt_label; }
        else { r.ex.video_url = updated.video_url; }
      } catch(e){
        r.result = 'fail'; r.failMsg = e.message; failed++;
      }
    }
    w6bLastBatch = undo.length ? undo : null;
    w6bRenderResult(todo, done, failed);
    exRender();
  }

  function w6bRenderResult(rows, done, failed){
    var when = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    var bar = '<div class="w6b-bar" style="background:' + (failed ? 'var(--warning-pale)' : 'var(--success-pale)') + ';border-color:' + (failed ? 'var(--warning)' : 'var(--success)') + ';">' +
      '<span><strong style="color:var(--text);">' + done + ' attached</strong>' + (failed ? ' \u00b7 ' + failed + ' failed' : '') + ' \u00b7 ' + when + '</span>' +
      (w6bLastBatch ? '<button class="btn" id="w6b-undo" type="button" style="margin-left:auto;font-size:11.5px;border-color:var(--warning);color:var(--warning);">Undo this batch</button>' : '') +
    '</div>';
    var body = rows.map(function(r, i){
      var res = r.result === 'ok'
        ? '<span class="w6b-chip w6b-ok">attached</span>'
        : '<span class="w6b-chip w6b-bad">failed</span><ul class="w6b-why"><li>' + esc(r.failMsg || '') + '</li>' +
          (done ? '<li>The ' + done + ' that succeeded are already saved \u2014 re-run only the failures.</li>' : '') + '</ul>';
      var slot = r.slot === 'alt'
        ? '<span class="w6b-chip w6b-gold">alt' + (r.label ? ' \u00b7 ' + esc(r.label) : '') + '</span>'
        : '<span class="w6b-chip w6b-dim">primary</span>';
      return '<tr class="' + (r.result === 'ok' ? '' : 'bad') + '"><td>' + (i + 1) + '</td>' +
        '<td>' + esc(r.ex.name) + '</td><td>' + slot + '</td>' +
        '<td class="mono">' + esc(r.priorShown || 'empty') + '</td><td>' + res + '</td></tr>';
    }).join('');
    $c('w6b-out').innerHTML = bar +
      '<table><thead><tr><th style="width:22px;"></th><th>Exercise</th><th>Slot</th><th>Was</th><th>Result</th></tr></thead><tbody>' + body + '</tbody></table>';
    if ($c('w6b-undo')) $c('w6b-undo').addEventListener('click', w6bUndo);
    $c('w6b-apply').disabled = true;
    $c('w6b-apply').textContent = 'Attach 0 rows';
    w6bChecked = null;
  }

  async function w6bUndo(){
    if (!w6bLastBatch || !w6bLastBatch.length) return;
    if (!confirm('Put ' + w6bLastBatch.length + ' exercise' + (w6bLastBatch.length === 1 ? '' : 's') + ' back to what they were before this batch?')) return;
    var btn = $c('w6b-undo'); if (btn){ btn.disabled = true; btn.textContent = 'Undoing\u2026'; }
    var ok = 0, bad = [];
    for (var i = 0; i < w6bLastBatch.length; i++){
      var u = w6bLastBatch[i];
      var body = u.slot === 'alt' ? { video_url_alt: u.prior, alt_label: u.priorLabel } : { video_url: u.prior };
      try {
        await w6bPatch(u.id, body);
        var row = w6bById(u.id);
        if (row){
          if (u.slot === 'alt'){ row.video_url_alt = u.prior; row.alt_label = u.priorLabel; }
          else { row.video_url = u.prior; }
        }
        ok++;
      } catch(e){ bad.push(u.name + ': ' + e.message); }
    }
    w6bLastBatch = null;
    exRender();
    $c('w6b-out').innerHTML = '<div class="w6b-bar" style="background:' + (bad.length ? 'var(--danger-pale)' : 'var(--success-pale)') + ';border-color:' + (bad.length ? 'var(--danger)' : 'var(--success)') + ';">' +
      '<span><strong style="color:var(--text);">' + ok + ' put back</strong>' + (bad.length ? ' \u00b7 ' + bad.length + ' could not be undone' : '') + '</span></div>' +
      (bad.length ? '<ul class="w6b-why">' + bad.map(function(b){ return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '');
  }

  function w6bById(id){ for (var i = 0; i < cexRows.length; i++){ if (cexRows[i].id === id) return cexRows[i]; } return null; }

  if ($c('ex-f-vidsel')) $c('ex-f-vidsel').addEventListener('change', function(){ exRender(); });
  if ($c('ex-bulk-btn')) $c('ex-bulk-btn').addEventListener('click', function(){
    w6bEnsure();
    var p = $c('w6b-panel');
    p.style.display = p.style.display === 'none' ? '' : 'none';
    if (p.style.display === '') p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ========================== end PM-1103 W6 part 2 ========================== */


