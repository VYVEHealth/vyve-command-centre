  /* ══════════════════════════════════════════════════════════════════════
     Trainerize W9 part 2 (PM-1125).
       #107  Insights widget grid on Overview
       #109  Review by workout
       ---   Per-habit heatmap on the Habits tab

     #107 does NOT re-render Overview. It lets the existing chain paint —
     w5Overview, W2's wrapper appending #w2-ov, W4b's tag box, W9 part 1's
     strip — and then MOVES those nodes into a grid. Moving a node keeps its
     listeners, so the notes textarea, the alerts toggles and the activity
     search all keep working without being rebuilt. Re-rendering them would
     mean owning four features this wave never touched.
     ══════════════════════════════════════════════════════════════════════ */
  (function(){

    var w9b = { edit: false, prefs: null, review: null };

    var st = document.createElement('style');
    st.textContent =
      '.w9g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;}' +
      '@media (max-width:900px){.w9g{grid-template-columns:1fr;}}' +
      '.w9w{border:1px solid var(--border);border-radius:12px;padding:13px 14px;background:var(--surface);min-width:0;}' +
      '.w9w.wide{grid-column:1 / -1;}' +
      '.w9w h4{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;' +
        'color:var(--text-muted);margin:0 0 9px;display:flex;align-items:center;gap:7px;}' +
      '.w9w .big{font-size:24px;font-weight:700;line-height:1.1;}' +
      '.w9edit .w9w{border-style:dashed;}' +
      '.w9row{display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid var(--border);font-size:13px;}' +
      '.w9row:last-child{border-bottom:0;}' +
      '.w9drag{cursor:grab;opacity:.45;}' +
      '.w9tog{width:34px;height:19px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);position:relative;flex:0 0 auto;cursor:pointer;}' +
      '.w9tog i{position:absolute;top:1.5px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--text-muted);transition:left .12s;}' +
      '.w9tog.on{background:rgba(27,120,120,.4);border-color:#4DAAAA;}' +
      '.w9tog.on i{left:16px;background:#4DAAAA;}' +
      '.w9off{opacity:.42;}' +
      '.w9bar{height:7px;border-radius:99px;background:var(--surface-2);overflow:hidden;margin:7px 0 5px;}' +
      '.w9bar i{display:block;height:100%;background:linear-gradient(90deg,#1B7878,#3DB89F);}' +
      '.w9sp{width:100%;height:44px;display:block;}' +
      '.w9hm{display:grid;grid-template-columns:minmax(110px,150px) 1fr;gap:10px;align-items:center;margin-bottom:7px;}' +
      '.w9hmc{display:grid;gap:3px;}' +
      '.w9c{aspect-ratio:1;border-radius:2.5px;background:var(--surface-2);}' +
      '.w9c.d1{background:rgba(61,184,159,.30);}.w9c.d2{background:rgba(61,184,159,.58);}.w9c.d3{background:#3DB89F;}' +
      '.w9c.mi{background:rgba(232,131,74,.22);}' +
      '.w9c.na{background:transparent;border:1px dashed var(--border);}' +
      '.w9hn{font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '.w9lg{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted);margin-top:10px;flex-wrap:wrap;}' +
      '.w9lg .w9c{width:11px;height:11px;aspect-ratio:auto;}' +
      '.w9t{width:100%;border-collapse:collapse;font-size:12.5px;}' +
      '.w9t th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);padding:6px 8px;border-bottom:1px solid var(--border);}' +
      '.w9t td{padding:8px;border-bottom:1px solid var(--border);}' +
      '.w9hit{color:#3DB89F;font-weight:700;}.w9miss{color:#E8834A;font-weight:700;}' +
      '.w9strip2{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin-bottom:13px;}';
    document.head.appendChild(st);

    function enc(x){ return encodeURIComponent(x); }
    function r1(n){ return Math.round(n * 10) / 10; }
    function iso(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }

    /* ══ #107 · widget grid ══════════════════════════════════════════ */

    /* Order is the default order. Every widget defaults ON: coach_ui_prefs is
       {} on every partner row today, so the no-prefs path is the only one that
       runs in practice and it has to be the good layout, not an empty grid. */
    var W9_WIDGETS = [
      ['compliance', 'Compliance · 12 weeks', false],
      ['programme',  'Programme',             false],
      ['checkin',    'Latest check-in',       false],
      ['weight',     'Weight',                false],
      ['goals',      'Goals',                 false],
      ['habits',     'Habits · 7 days',       false],
      ['activity',   'Recent activity',       true ],
      ['notes',      'Your notes',            true ],
      ['coachtools', 'Health app & alerts',   true ]
    ];
    var W9_LABEL = {}; W9_WIDGETS.forEach(function(w){ W9_LABEL[w[0]] = w[1]; });

    function prefs(){
      if (w9b.prefs) return w9b.prefs;
      var p = null;
      try { p = (window.partnerRow && window.partnerRow.coach_ui_prefs) || null; } catch(_){}
      var saved = (p && p.widgets) || null;
      var order = [], off = {};
      if (saved && saved.order && saved.order.length){
        saved.order.forEach(function(k){ if (W9_LABEL[k]) order.push(k); });
        (saved.hidden || []).forEach(function(k){ off[k] = 1; });
      }
      W9_WIDGETS.forEach(function(w){ if (order.indexOf(w[0]) < 0) order.push(w[0]); });
      w9b.prefs = { order: order, hidden: off };
      return w9b.prefs;
    }

    async function savePrefs(){
      var p = prefs();
      var body = { coach_ui_prefs: Object.assign({},
        (window.partnerRow && window.partnerRow.coach_ui_prefs) || {},
        { widgets: { order: p.order, hidden: Object.keys(p.hidden) } }) };
      try {
        await rest('/partner_partners?id=eq.' + partnerId, { method: 'PATCH', body: body });
        if (window.partnerRow) window.partnerRow.coach_ui_prefs = body.coach_ui_prefs;
      } catch(e){ w5toast('Couldn\u2019t save your layout.'); }
    }

    function shell(key, inner, wide){
      var d = document.createElement('div');
      d.className = 'w9w' + (wide ? ' wide' : '');
      d.dataset.w9k = key;
      d.innerHTML = '<h4>' + esc(W9_LABEL[key]) + '</h4>';
      if (typeof inner === 'string') d.insertAdjacentHTML('beforeend', inner);
      else if (inner) d.appendChild(inner);
      return d;
    }

    /* Adopt a node the legacy chain already painted. Moving it keeps every
       listener attached to it — the notes textarea saves, the alert toggles
       toggle — which re-rendering would silently break. */
    function adopt(key, nodes, wide){
      var live = nodes.filter(Boolean);
      if (!live.length) return null;
      var d = shell(key, null, wide);
      live.forEach(function(n){ d.appendChild(n); });
      return d;
    }

    async function extraWidgets(c){
      var email = c.member_email, e = enc(email);
      var since = iso(new Date(Date.now() - 84 * 864e5));
      var res = await Promise.all([
        rest('/coach_client_weekly?member_email=eq.' + e + '&' + pscope() + '&order=week_start.desc&limit=12&select=week_start,sessions_done,sessions_target').catch(function(){ return []; }),
        rest('/coach_client_goals?' + pscope() + '&member_email=eq.' + e + '&active=eq.true&achieved_at=is.null&order=target_date.asc&select=title,kind,target_value,target_unit,start_value,target_date').catch(function(){ return []; }),
        rest('/daily_habits?member_email=eq.' + e + '&activity_date=gte.' + iso(new Date(Date.now() - 7 * 864e5)) + '&select=habit_id,activity_date,habit_completed').catch(function(){ return []; }),
        rest('/workout_plan_cache?member_email=eq.' + e + '&is_active=eq.true&limit=1&select=current_week,plan_duration_weeks,programme_json').catch(function(){ return []; })
      ]);
      var wk = res[0] || [], goals = res[1] || [], hb = res[2] || [], wpc = (res[3] || [])[0];
      var out = {};

      if (wk.length){
        var pts = wk.slice().reverse().map(function(r){
          var t = r.sessions_target || 0;
          return t ? Math.min(100, Math.round((r.sessions_done / t) * 100)) : 0;
        });
        var last = wk[0];
        out.compliance = spark(pts) +
          '<div style="font-size:12px;color:var(--text-muted);">' +
          (last.sessions_target ? last.sessions_done + ' of ' + last.sessions_target + ' sessions this week' : 'No target set this week') +
          '</div>';
      }

      if (wpc){
        var cw = wpc.current_week || 1, tot = wpc.plan_duration_weeks || 8;
        var pct = Math.max(0, Math.min(100, Math.round((cw / tot) * 100)));
        var pj = wpc.programme_json || {};
        out.programme = '<div class="big">Week ' + cw + ' <span style="font-size:13px;color:var(--text-muted);font-weight:600;">of ' + tot + '</span></div>' +
          '<div class="w9bar"><i style="width:' + pct + '%"></i></div>' +
          '<div style="font-size:12px;color:var(--text-muted);">' + esc(pj.programme_name || pj.plan_type || 'Programme') + '</div>';
      }

      if (goals.length){
        var g = goals[0];
        var body = '<div style="font-size:13px;font-weight:600;">' + esc(g.title) + '</div>';
        if (g.kind === 'body_weight' && g.target_value != null){
          var ws = w5.weights || [];
          if (ws.length){
            var cur = Number(ws[0].weight_kg), start = g.start_value != null ? Number(g.start_value) : cur, tgt = Number(g.target_value);
            var span = start - tgt, pc = span === 0 ? 0 : Math.max(0, Math.min(100, Math.round(((start - cur) / span) * 100)));
            body += '<div class="w9bar"><i style="width:' + pc + '%"></i></div>' +
              '<div style="font-size:12px;color:var(--text-muted);">' + r1(Math.abs(cur - tgt)) + ' ' + esc(g.target_unit || 'kg') + ' to go</div>';
          }
        }
        if (g.target_date){
          var dt = Math.ceil((new Date(g.target_date + 'T00:00:00').getTime() - Date.now()) / 864e5);
          body += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + (dt >= 0 ? dt + ' days to go' : Math.abs(dt) + ' days past') + '</div>';
        }
        if (goals.length > 1) body += '<div style="font-size:12px;color:var(--text-muted);margin-top:7px;">+' + (goals.length - 1) + ' more current goal' + (goals.length > 2 ? 's' : '') + '</div>';
        out.goals = body;
      }

      if (hb.length){
        var done = hb.filter(function(r){ return r.habit_completed; }).length;
        out.habits = '<div class="big">' + done + '<span style="font-size:13px;color:var(--text-muted);font-weight:600;">/' + hb.length + '</span></div>' +
          '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">logged in the last 7 days</div>';
      }
      return out;
    }

    function spark(pts){
      if (pts.length < 2) return '<div style="font-size:12px;color:var(--text-muted);padding:6px 0;">Not enough weeks yet.</div>';
      var lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts);
      if (hi === lo){ hi = lo + 1; lo = Math.max(0, lo - 1); }
      var W = 300, H = 44, p = 4;
      var d = pts.map(function(v, i){
        return r1(p + (i / (pts.length - 1)) * (W - p * 2)) + ',' + r1(p + (1 - (v - lo) / (hi - lo)) * (H - p * 2));
      }).join(' ');
      return '<svg class="w9sp" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
        '<polyline fill="none" stroke="#4DAAAA" stroke-width="2" stroke-linejoin="round" points="' + d + '"/></svg>';
    }

    async function w9Reflow(){
      var pane = $c('w5-pane');
      if (!pane || w5.tab !== 'overview' || pane.querySelector('.w9g')) return;
      var c = w5.c; if (!c) return;

      /* Pull the legacy blocks out by their landmarks. Anything we can't find
         is left exactly where it is rather than guessed at. */
      var kids = Array.prototype.slice.call(pane.children);
      var strip = $c('w9-strip');
      var notesBox = pane.querySelector('#w5-notes') ? pane.querySelector('#w5-notes').closest('.w5-box') : null;
      var notesSec = notesBox ? notesBox.previousElementSibling : null;
      var w2ov = $c('w2-ov');
      var tagbox = $c('w4b-tagbox');
      var twoCol = pane.querySelector('.w5-two') || null;

      var grid = document.createElement('div');
      grid.className = 'w9g';

      var built = {};
      built.notes = adopt('notes', [notesSec, notesBox], true);
      built.activity = adopt('activity', [twoCol], true);
      built.coachtools = adopt('coachtools', [w2ov], true);

      var extra = {};
      try { extra = await extraWidgets(c); } catch(_){ extra = {}; }
      ['compliance','programme','goals','habits'].forEach(function(k){
        if (extra[k]) built[k] = shell(k, extra[k], false);
      });

      var p = prefs();
      var any = false;
      p.order.forEach(function(k){
        var node = built[k];
        if (!node) return;
        if (p.hidden[k]) { node.style.display = 'none'; }
        grid.appendChild(node); any = true;
      });
      if (!any) return;

      var bar = document.createElement('div');
      bar.style.cssText = 'display:flex;align-items:center;gap:10px;margin:2px 0 11px;';
      bar.innerHTML = '<div class="w5-sec" style="margin:0;flex:1;">Insights</div>' +
        '<button type="button" class="btn" id="w9-edit" style="font-size:11px;">Edit layout</button>';

      /* keep the strip first, then the bar, then the grid, then whatever we
         did not adopt (tag box and anything a later wave adds) */
      if (strip && strip.parentNode === pane) pane.insertBefore(bar, strip.nextSibling);
      else pane.insertBefore(bar, pane.firstChild);
      pane.insertBefore(grid, bar.nextSibling);
      if (tagbox && tagbox.parentNode === pane) pane.appendChild(tagbox);

      $c('w9-edit').addEventListener('click', w9EditLayout);
    }

    function w9EditLayout(){
      var pane = $c('w5-pane'); if (!pane) return;
      if ($c('w9-editor')) return;
      var p = prefs();
      var grid0 = pane.querySelector('.w9g');
      var presentKeys = grid0
        ? Array.prototype.slice.call(grid0.querySelectorAll('[data-w9k]')).map(function(n){ return n.dataset.w9k; })
        : p.order.slice();
      var host = document.createElement('div');
      host.id = 'w9-editor';
      host.className = 'w5-box';
      host.style.marginBottom = '13px';
      /* Only widgets this client actually has. Offering a toggle for a widget
         that never renders is a switch wired to nothing. */
      host.innerHTML = '<div class="w5-sec">Editing layout</div>' +
        p.order.filter(function(k){ return presentKeys.indexOf(k) >= 0; }).map(function(k){
          return '<div class="w9row' + (p.hidden[k] ? ' w9off' : '') + '" draggable="true" data-k="' + k + '">' +
            '<span class="w9drag">\u283f</span><span style="flex:1;">' + esc(W9_LABEL[k]) + '</span>' +
            '<span class="w9tog' + (p.hidden[k] ? '' : ' on') + '"><i></i></span></div>';
        }).join('') +
        '<div style="display:flex;gap:8px;margin-top:11px;">' +
          '<button type="button" class="btn btn-primary" id="w9-done" style="font-size:12px;">Done</button>' +
          '<button type="button" class="btn" id="w9-reset" style="font-size:12px;">Reset to default</button>' +
          '<span style="font-size:11.5px;color:var(--text-muted);margin-left:auto;align-self:center;">Applies to every client</span>' +
        '</div>';
      pane.insertBefore(host, pane.querySelector('.w9g'));
      pane.querySelector('.w9g').classList.add('w9edit');

      host.querySelectorAll('.w9tog').forEach(function(t){
        t.addEventListener('click', function(){
          var row = t.closest('.w9row'), k = row.dataset.k;
          if (p.hidden[k]) delete p.hidden[k]; else p.hidden[k] = 1;
          t.classList.toggle('on'); row.classList.toggle('w9off');
          var w = pane.querySelector('.w9g [data-w9k="' + k + '"]');
          if (w) w.style.display = p.hidden[k] ? 'none' : '';
          savePrefs();
        });
      });

      var dragging = null;
      host.querySelectorAll('.w9row').forEach(function(row){
        row.addEventListener('dragstart', function(){ dragging = row; row.style.opacity = '.4'; });
        row.addEventListener('dragend', function(){
          row.style.opacity = '';
          var shown = Array.prototype.slice.call(host.querySelectorAll('.w9row')).map(function(r){ return r.dataset.k; });
          p.order = shown.concat(p.order.filter(function(k){ return shown.indexOf(k) < 0; }));
          var g = pane.querySelector('.w9g');
          p.order.forEach(function(k){
            var w = g.querySelector('[data-w9k="' + k + '"]');
            if (w) g.appendChild(w);
          });
          savePrefs();
        });
        row.addEventListener('dragover', function(ev){
          ev.preventDefault();
          if (!dragging || dragging === row) return;
          var r = row.getBoundingClientRect();
          host.insertBefore(dragging, (ev.clientY - r.top) / r.height > 0.5 ? row.nextSibling : row);
        });
      });

      $c('w9-done').addEventListener('click', function(){
        host.remove();
        var g = pane.querySelector('.w9g'); if (g) g.classList.remove('w9edit');
      });
      $c('w9-reset').addEventListener('click', function(){
        w9b.prefs = { order: W9_WIDGETS.map(function(w){ return w[0]; }), hidden: {} };
        savePrefs();
        host.remove();
        w5Tab('overview');
      });
    }

    /* The Overview chain is async and multi-stage (legacy → W2 → W4b → the
       part 1 strip). Rather than race it, reflow on the pane settling. */
    (function watch(){
      var body = $c('cl-detail-body');
      function attach(){
        var pane = $c('w5-pane');
        if (!pane || pane.dataset.w9b) return;
        pane.dataset.w9b = '1';
        var t = null;
        new MutationObserver(function(){
          if (w5.tab !== 'overview') return;
          clearTimeout(t);
          t = setTimeout(function(){ w9Reflow(); }, 120);
        }).observe(pane, { childList: true });
      }
      if (body) new MutationObserver(attach).observe(body, { childList: true });
      attach();
    })();

    /* ══ per-habit heatmap ═══════════════════════════════════════════ */
    var w9LegacyHabits = typeof w5Habits === 'function' ? w5Habits : null;
    var w9hmDays = 28;

    w5Habits = async function(){
      var pane = $c('w5-pane'), c = w5.c, e = enc(c.member_email);
      if (!w5consented()){
        pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Habit data unlocks once coaching is active.</p>';
        return;
      }
      var since = iso(new Date(Date.now() - (w9hmDays + 1) * 864e5));
      var res = await Promise.all([
        rest('/member_habits?member_email=eq.' + e + '&active=eq.true&select=habit_id,created_at').catch(function(){ return []; }),
        rest('/daily_habits?member_email=eq.' + e + '&activity_date=gte.' + since + '&select=habit_id,activity_date,habit_completed,value').catch(function(){ return []; })
      ]);
      if (w5.tab !== 'habits') return;
      var mh = res[0] || [], dh = res[1] || [];
      if (!mh.length){ pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">No habits assigned.</p>'; return; }

      var lib = {};
      try {
        var ids = mh.map(function(x){ return x.habit_id; }).filter(Boolean).join(',');
        if (ids) (await rest('/habit_library?id=in.(' + ids + ')&select=id,habit_title') || []).forEach(function(x){ lib[x.id] = x.habit_title; });
      } catch(_){}

      var days = [];
      for (var i = w9hmDays - 1; i >= 0; i--) days.push(iso(new Date(Date.now() - i * 864e5)));

      var byKey = {};
      dh.forEach(function(r){ byKey[r.habit_id + '|' + r.activity_date] = r; });

      var rows = mh.map(function(m){
        /* A habit assigned last Tuesday should not show a fortnight of failures
           before it existed — days before assignment render as not-applicable. */
        var from = m.created_at ? m.created_at.slice(0, 10) : null;
        var cells = days.map(function(d){
          if (from && d < from) return '<div class="w9c na"></div>';
          var r = byKey[m.habit_id + '|' + d];
          if (!r) return '<div class="w9c mi"></div>';
          if (r.habit_completed === false) return '<div class="w9c mi"></div>';
          var v = Number(r.value);
          var cls = (!isNaN(v) && v > 0) ? (v >= 3 ? 'd3' : v >= 2 ? 'd2' : 'd1') : 'd3';
          return '<div class="w9c ' + cls + '"></div>';
        }).join('');
        var done = days.filter(function(d){
          var r = byKey[m.habit_id + '|' + d]; return r && r.habit_completed !== false;
        }).length;
        var live = days.filter(function(d){ return !(from && d < from); }).length;
        return '<div class="w9hm"><div class="w9hn" title="' + esc(lib[m.habit_id] || 'Habit') + '">' +
          esc(lib[m.habit_id] || 'Habit') + '</div>' +
          '<div class="w9hmc" style="grid-template-columns:repeat(' + w9hmDays + ',1fr);">' + cells + '</div></div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin:-3px 0 9px 0;">' + done + ' of ' + live + ' days</div>';
      }).join('');

      pane.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
          '<div class="w5-sec" style="margin:0;flex:1;">Habits \u00b7 last ' + w9hmDays + ' days</div>' +
          '<button type="button" class="btn" data-w9hm="28" style="font-size:11px;">28 days</button>' +
          '<button type="button" class="btn" data-w9hm="84" style="font-size:11px;">12 weeks</button>' +
        '</div>' + rows +
        '<div class="w9lg"><span>Missed</span><span class="w9c mi"></span>' +
        '<span style="margin-left:8px;">Done</span><span class="w9c d2"></span><span class="w9c d3"></span>' +
        '<span style="margin-left:8px;">Not assigned yet</span><span class="w9c na"></span></div>';

      pane.querySelectorAll('[data-w9hm]').forEach(function(b){
        b.addEventListener('click', function(){ w9hmDays = Number(b.dataset.w9hm); w5Habits(); });
      });
    };

    /* ══ #109 · review by workout ════════════════════════════════════ */
    function norm(x){ return String(x || '').toLowerCase().trim(); }

    window.w9Review = async function(dateStr){
      var pane = $c('w5-pane'), c = w5.c, e = enc(c.member_email);
      pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
      var res = await Promise.all([
        rest('/workouts?member_email=eq.' + e + '&activity_date=eq.' + dateStr + '&select=workout_name,plan_name,session_number,duration_minutes,logged_at,difficulty_rating,member_note').catch(function(){ return []; }),
        rest('/exercise_logs?member_email=eq.' + e + '&activity_date=eq.' + dateStr + '&order=logged_at.asc&select=exercise_name,sets_completed,reps_completed,weight_kg,duration_secs,notes').catch(function(){ return []; }),
        rest('/workout_plan_cache?member_email=eq.' + e + '&is_active=eq.true&limit=1&select=current_week,programme_json').catch(function(){ return []; })
      ]);
      var w = (res[0] || [])[0], logs = res[1] || [], wpc = (res[2] || [])[0];

      /* Prescribed exercises live at programme_json.weeks[].sessions[].exercises[].
         Matching is by name, and 10 of the 42 logged names in production match
         nothing prescribed — so unmatched sets get their own group rather than
         being dropped or fuzzily forced onto the wrong row. */
      var pres = [], presIdx = {};
      try {
        var wks = (wpc && wpc.programme_json && wpc.programme_json.weeks) || [];
        var wk = wks.filter(function(x){ return Number(x.week) === Number(wpc.current_week || 1); })[0] || wks[0];
        var sessions = (wk && wk.sessions) || [];
        var sess = null;
        if (w && w.session_number != null) sess = sessions[Number(w.session_number) - 1] || null;
        if (!sess && w && w.workout_name) sess = sessions.filter(function(s){ return norm(s.session_name || s.name) === norm(w.workout_name); })[0] || null;
        (sess && sess.exercises || []).forEach(function(ex){
          var nm = ex.exercise_name || ex.name;
          pres.push({ name: nm, sets: ex.sets, reps: ex.reps });
          presIdx[norm(nm)] = 1;
        });
      } catch(_){}

      var byName = {};
      logs.forEach(function(l){ (byName[norm(l.exercise_name)] = byName[norm(l.exercise_name)] || []).push(l); });

      function fmt(rows){
        if (!rows || !rows.length) return '<span class="w9miss">not logged</span>';
        var sets = rows.reduce(function(a, r){ return a + (Number(r.sets_completed) || 1); }, 0);
        var reps = rows[0].reps_completed, kg = rows[0].weight_kg;
        return sets + ' \u00d7 ' + (reps != null ? reps : '\u2014') + (kg != null ? ' @ ' + kg + ' kg' : '');
      }

      var vol = logs.reduce(function(a, r){
        return a + ((Number(r.sets_completed) || 1) * (Number(r.reps_completed) || 0) * (Number(r.weight_kg) || 0));
      }, 0);
      var doneCount = pres.filter(function(p){ return byName[norm(p.name)]; }).length;
      var extras = Object.keys(byName).filter(function(k){ return !presIdx[k]; });

      var h = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
          '<button type="button" class="btn" id="w9-back" style="font-size:11px;">\u2039 Back to logs</button>' +
          '<div style="flex:1;"><div style="font-weight:700;font-size:15px;">' +
            esc((w && w.workout_name) || 'Session') + '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + w5day(dateStr + 'T00:00:00') +
            (w && w.duration_minutes ? ' \u00b7 ' + w.duration_minutes + ' minutes' : '') + '</div></div></div>';

      h += '<div class="w9strip2">' +
        '<div class="w9w" style="padding:9px 11px;"><h4 style="margin-bottom:4px;">Prescribed</h4><b>' + (pres.length || '\u2014') + '</b></div>' +
        '<div class="w9w" style="padding:9px 11px;"><h4 style="margin-bottom:4px;">Completed</h4><b>' + doneCount + (pres.length ? ' of ' + pres.length : '') + '</b></div>' +
        '<div class="w9w" style="padding:9px 11px;"><h4 style="margin-bottom:4px;">Volume</h4><b>' + (vol ? Math.round(vol).toLocaleString() + ' kg' : '\u2014') + '</b></div>' +
        '<div class="w9w" style="padding:9px 11px;"><h4 style="margin-bottom:4px;">Sets logged</h4><b>' + logs.length + '</b></div></div>';

      if (pres.length){
        h += '<table class="w9t"><tr><th>Exercise</th><th>Prescribed</th><th>Logged</th></tr>' +
          pres.map(function(p){
            var rows = byName[norm(p.name)];
            return '<tr><td><b>' + esc(p.name) + '</b></td>' +
              '<td style="color:var(--text-muted);">' + (p.sets || '\u2014') + ' \u00d7 ' + esc(String(p.reps || '\u2014')) + '</td>' +
              '<td' + (rows ? ' class="w9hit"' : '') + '>' + fmt(rows) + '</td></tr>';
          }).join('') + '</table>';
      } else {
        h += '<div class="w5-box" style="font-size:12.5px;color:var(--text-muted);">' +
          'No prescribed session matched this date, so everything below is shown as logged work.</div>';
      }

      if (extras.length){
        h += '<div class="w5-sec" style="margin-top:15px;">Also logged this session</div><table class="w9t">' +
          extras.map(function(k){
            var rows = byName[k];
            return '<tr><td><b>' + esc(rows[0].exercise_name) + '</b></td><td>' + fmt(rows) +
              '</td><td style="color:var(--text-muted);font-size:11.5px;">not in the programme</td></tr>';
          }).join('') + '</table>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:7px;">Sets that don\u2019t match a prescribed exercise by name are shown rather than dropped.</div>';
      }

      h += '<div class="w5-box" style="margin-top:15px;"><div class="w5-sec" style="margin-bottom:6px;">How it felt</div>' +
        (w && (w.difficulty_rating || w.member_note)
          ? '<div style="font-size:13px;">' + (w.difficulty_rating ? '<b>' + esc(W5_DIFF[w.difficulty_rating] || w.difficulty_rating) + '</b>' : '') +
            (w.member_note ? '<div style="color:var(--text-muted);margin-top:5px;">' + esc(w.member_note) + '</div>' : '') + '</div>'
          : '<div style="font-size:12.5px;color:var(--text-muted);">' + esc(c.invited_first_name || 'They') + ' hasn\u2019t rated a session yet.</div>') +
        '</div>';

      pane.innerHTML = h;
      $c('w9-back').addEventListener('click', function(){ w5Tab('logs'); });
    };

    /* Logs gains a per-session entry point rather than a new tab — the sets are
       already there, they were just never grouped into the session that produced
       them. */
    var w9LegacyLogs = typeof w5Logs === 'function' ? w5Logs : null;
    if (w9LegacyLogs){
      w5Logs = async function(){
        await w9LegacyLogs.apply(this, arguments);
        if (w5.tab !== 'logs') return;
        var pane = $c('w5-pane'); if (!pane || pane.querySelector('#w9-rev')) return;
        var e = enc(w5.c.member_email);
        var since = iso(new Date(Date.now() - 56 * 864e5));
        var ws = await rest('/workouts?member_email=eq.' + e + '&activity_date=gte.' + since +
          '&order=activity_date.desc&limit=20&select=workout_name,activity_date,duration_minutes').catch(function(){ return []; }) || [];
        if (!ws.length || w5.tab !== 'logs') return;
        var box = document.createElement('div');
        box.id = 'w9-rev';
        box.innerHTML = '<div class="w5-sec" style="margin-top:16px;">Review by workout</div>' +
          '<div class="w5-box">' + ws.map(function(x){
            return '<div class="w9row"><span style="flex:1;"><b>' + esc(x.workout_name || 'Session') + '</b>' +
              '<span style="color:var(--text-muted);"> \u00b7 ' + w5day(x.activity_date + 'T00:00:00') + '</span></span>' +
              '<button type="button" class="btn" data-w9rev="' + esc(x.activity_date) + '" style="font-size:11px;">Open</button></div>';
          }).join('') + '</div>';
        pane.appendChild(box);
        box.querySelectorAll('[data-w9rev]').forEach(function(b){
          b.addEventListener('click', function(){ window.w9Review(b.dataset.w9rev); });
        });
      };
    }

  })();

