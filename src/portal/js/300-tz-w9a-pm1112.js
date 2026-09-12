  /* ══════════════════════════════════════════════════════════════════════
     Trainerize W9 part 1 (PM-1112, RE-APPLIED PM-1122).
     The original landed in CC 33746395 and was overwritten by PM-1115, which
     wrote coach-portal.html from a base fetched before that commit. Re-applied
     here onto live HEAD rather than reverting the W7 work that clobbered it.
     ══════════════════════════════════════════════════════════════════════ */
(function(){

    /* #106 steps / sleep / active energy stay dark until Lewis signs off the
       consent card wording and the version bumps.  The read exists; the tiles
       do not render. */
    var W9_HEALTH_VISIBLE = false;

    /* Loggable kinds, in the order the member sees them.  bmi / lean_mass /
       fat_mass are DERIVED at read time and refused by mb_no_derived — they
       are listed here only so the coach's chart picker can offer them. */
    var W9_KINDS = [
      { k: 'weight',         label: 'Weight',         unit: 'kg',   src: 'weight' },
      { k: 'body_fat',       label: 'Body fat',       unit: '%',    src: 'bio', method: true },
      { k: 'waist',          label: 'Waist',          unit: 'cm',   src: 'bio' },
      { k: 'chest',          label: 'Chest',          unit: 'cm',   src: 'bio' },
      { k: 'hips',           label: 'Hips',           unit: 'cm',   src: 'bio' },
      { k: 'thigh',          label: 'Thigh',          unit: 'cm',   src: 'bio' },
      { k: 'arm',            label: 'Arm',            unit: 'cm',   src: 'bio' },
      { k: 'neck',           label: 'Neck',           unit: 'cm',   src: 'bio' },
      { k: 'calf',           label: 'Calf',           unit: 'cm',   src: 'bio' },
      { k: 'resting_hr',     label: 'Resting HR',     unit: 'bpm',  src: 'bio' },
      { k: 'blood_pressure', label: 'Blood pressure', unit: 'mmHg', src: 'bio', pair: true },
      { k: 'bmi',            label: 'BMI',            unit: '',     src: 'derived' },
      { k: 'lean_mass',      label: 'Lean mass',      unit: 'kg',   src: 'derived' },
      { k: 'fat_mass',       label: 'Fat mass',       unit: 'kg',   src: 'derived' }
    ];
    var W9_KIND = {}; W9_KINDS.forEach(function(x){ W9_KIND[x.k] = x; });

    var W9_METHOD = {
      calipers: 'Calipers', bioimpedance: 'Smart scale', dexa: 'DEXA',
      tape: 'Tape / estimate', unknown: 'Not sure'
    };

    var W9_GOAL_KINDS = [
      ['custom',      'Custom',      'No target number — a title and a date.'],
      ['body_weight', 'Body weight', 'Progress fills itself from their weight log.'],
      ['nutrition',   'Nutrition',   'Reads their logged macros against the plan target.'],
      ['water',       'Water',       'Reads their daily water against the coach water goal.']
    ];
    var W9_GOAL_UNIT = { body_weight: 'kg', nutrition: 'g protein', water: 'L' };

    var w9 = { strip: null, kind: 'weight', range: 365, bio: null, forEmail: null };

    /* ── styles ──────────────────────────────────────────────────────── */
    var st = document.createElement('style');
    st.textContent =
      '.w9-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin:0 0 12px}' +
      '.w9-s{border:1px solid var(--border);border-radius:10px;padding:9px 11px}' +
      '.w9-s b{display:block;font-size:14.5px;font-weight:700}' +
      '.w9-s span{font-size:9.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}' +
      '.w9-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}' +
      '.w9-badge{font-size:10.5px;font-weight:700;border-radius:8px;padding:4px 8px;' +
        'background:rgba(201,168,76,.14);border:1px solid #C9A84C;color:#C9A84C}' +
      '.w9-dim{opacity:.5}' +
      '.w9-pill{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;' +
        'border-radius:99px;padding:3px 9px;border:1px solid;white-space:nowrap}' +
      '.w9-k-custom{color:#C9A84C;border-color:#C9A84C;background:rgba(201,168,76,.14)}' +
      '.w9-k-body_weight{color:#4DAAAA;border-color:#4DAAAA;background:rgba(27,120,120,.16)}' +
      '.w9-k-nutrition{color:#E8834A;border-color:#E8834A;background:rgba(232,131,74,.14)}' +
      '.w9-k-water{color:#3DB89F;border-color:#3DB89F;background:rgba(61,184,159,.14)}' +
      '.w9-bar{height:8px;border-radius:99px;background:var(--surface-2,rgba(127,127,127,.15));overflow:hidden;margin:9px 0 6px}' +
      '.w9-bar i{display:block;height:100%;background:linear-gradient(90deg,#1B7878,#3DB89F)}' +
      '.w9-chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}' +
      '.w9-chip{background:var(--surface-2,rgba(127,127,127,.12));border:1px solid var(--border);' +
        'color:var(--text-muted);border-radius:99px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer}' +
      '.w9-chip.on{background:rgba(27,120,120,.28);border-color:#4DAAAA;color:#4DAAAA}' +
      '.w9-chart{width:100%;height:120px;display:block}' +
      '.w9-tbl{width:100%;border-collapse:collapse;font-size:12.5px}' +
      '.w9-tbl th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;' +
        'color:var(--text-muted);padding:6px 8px;border-bottom:1px solid var(--border)}' +
      '.w9-tbl td{padding:7px 8px;border-bottom:1px solid var(--border)}' +
      '.w9-dn{color:#3DB89F;font-weight:700}.w9-up{color:#E8834A;font-weight:700}';
    document.head.appendChild(st);

    function w9enc(x){ return encodeURIComponent(x); }
    function w9ago(t){
      if (!t) return null;
      var d = Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
      if (d < 0) return 'today';
      if (d === 0) return 'today';
      if (d === 1) return 'yesterday';
      if (d < 31) return d + ' days ago';
      if (d < 365) return Math.round(d / 30) + ' months ago';
      return Math.round(d / 365) + 'y ago';
    }
    function w9num(n, dp){ return (Math.round(n * Math.pow(10, dp||1)) / Math.pow(10, dp||1)); }

    /* ── #101 · Overview header strip ────────────────────────────────── */
    async function w9StripRender(){
      var pane = $c('w5-pane');
      if (!pane || w5.tab !== 'overview' || $c('w9-strip')) return;
      var c = w5.c; if (!c) return;

      var host = document.createElement('div');
      host.id = 'w9-strip';
      pane.insertBefore(host, pane.firstChild);

      if (!w5consented()){
        host.innerHTML = '<div class="w5-box w9-dim" style="margin-bottom:12px;">' +
          esc(c.invited_first_name || 'This client') + ' hasn\u2019t accepted data sharing yet \u2014 nothing to show here.</div>';
        return;
      }

      host.innerHTML = '<div class="w9-strip"><div class="w9-s"><span>Loading</span><b>\u2026</b></div></div>';

      var j = null;
      try {
        j = await rest('/rpc/coach_client_badges', { method: 'POST', body: { p_member_email: c.member_email } });
      } catch(e){
        host.innerHTML = '<div class="w5-box w9-dim" style="margin-bottom:12px;">Couldn\u2019t load their summary just now.</div>';
        return;
      }
      if (!j) { host.innerHTML = ''; return; }

      function tile(lab, val, warn){
        return '<div class="w9-s"><span>' + esc(lab) + '</span><b' +
          (warn ? ' style="color:#E8834A;"' : '') + '>' + esc(val) + '</b></div>';
      }
      var outAgo = w9ago(j.last_msg_out), inAgo = w9ago(j.last_msg_in);
      var quiet  = j.last_msg_in && (Date.now() - new Date(j.last_msg_in).getTime()) > 5 * 86400000;

      /* "Last activity", never "last signed in": no sign-in history exists on
         this platform and members.last_active_at is populated for 1 of 97
         (W0/PM-1072). member_activity_log is the same source active_days uses. */
      var h = '<div class="w9-strip">' +
        tile('Last activity', j.last_activity ? w9ago(j.last_activity) : 'None yet') +
        tile('Active days · 30', String(j.active_days_30 || 0)) +
        tile('Last message out', outAgo || 'Never') +
        tile('Last message in', inAgo || 'Never', quiet) +
        tile('Workouts', String(j.workouts || 0)) +
        tile('Cardio', String(j.cardio || 0)) +
        tile('Check-ins', String(j.checkins || 0)) +
      '</div>';

      var b = j.badges || [];
      if (b.length){
        h += '<div class="w5-sec">Recent badges</div><div class="w5-box" style="margin-bottom:14px;">' +
          '<div class="w9-badges">' + b.map(function(x){
            return '<span class="w9-badge">' + esc(x.title || x.display_name || x.metric_slug) +
              (x.tier_index ? ' \u00b7 tier ' + x.tier_index : '') + '</span>';
          }).join('') + '</div></div>';
      }
      host.innerHTML = h;
    }

    /* The Overview pane is rendered by w5Overview (already wrapped by W2) and
       decorated by W4b's tag box.  One more observer is cheaper and safer than
       a third wrapper. */
    (function w9watchOverview(){
      var body = $c('cl-detail-body');
      function attach(){
        var pane = $c('w5-pane');
        if (!pane || pane.dataset.w9obs) return;
        pane.dataset.w9obs = '1';
        new MutationObserver(function(){
          if (w5.tab === 'overview' && !$c('w9-strip')) w9StripRender();
        }).observe(pane, { childList: true });
      }
      if (body) new MutationObserver(attach).observe(body, { childList: true });
      attach();
    })();

    /* ── #105 · typed goals ──────────────────────────────────────────── */
    function w9GoalBucket(g, today){
      if (g.achieved_at) return 'past';
      if (g.starts_at && g.starts_at > today) return 'upcoming';
      if (g.target_date && g.target_date < today) return 'past';
      return 'current';
    }

    /* Body-weight progress reads w5.weights, which the workspace already
       loaded — no second fetch, and it is the member's own log, so the coach
       never types a current value that could go stale. */
    function w9WeightProgress(g){
      var ws = (w5.weights || []).filter(function(w){ return w.weight_kg != null; });
      if (!ws.length || g.target_value == null) return null;
      var cur   = Number(ws[0].weight_kg);
      var start = g.start_value != null ? Number(g.start_value) : Number(ws[ws.length - 1].weight_kg);
      var tgt   = Number(g.target_value);
      var span  = start - tgt;
      var done  = start - cur;
      var pct   = span === 0 ? 0 : Math.max(0, Math.min(100, Math.round((done / span) * 100)));
      return { cur: cur, start: start, target: tgt, pct: pct, done: w9num(done), left: w9num(cur - tgt),
               at: ws[0].logged_at || ws[0].logged_date };
    }

    function w9GoalCard(g){
      var kind = g.kind || 'custom';
      var pill = '<span class="w9-pill w9-k-' + kind + '">' +
        esc((W9_GOAL_KINDS.filter(function(x){ return x[0] === kind; })[0] || ['','Custom'])[1]) + '</span>';
      var when = g.achieved_at ? '\u2713 Achieved ' + w5day(g.achieved_at)
               : g.target_date ? w5day(g.target_date) : 'No date';

      var h = '<div class="w5-box"' + (g.achieved_at ? ' style="opacity:.65;"' : '') + '>' +
        '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' + pill +
          '<div style="font-weight:700;font-size:14px;flex:1;min-width:140px;' +
            (g.achieved_at ? 'text-decoration:line-through;' : '') + '">' + esc(g.title) + '</div>' +
          '<span style="font-size:11px;color:' + (g.achieved_at ? '#3DB89F' : 'var(--text-muted)') + ';font-weight:600;">' +
            esc(when) + '</span></div>';

      if (kind === 'body_weight'){
        var p = w9WeightProgress(g);
        if (p){
          h += '<div class="w9-bar"><i style="width:' + p.pct + '%"></i></div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + p.start + ' \u2192 <b style="color:var(--text);">' +
            p.cur + '</b> \u2192 ' + p.target + ' kg \u00b7 auto-tracked from their weight log \u00b7 last entry ' +
            esc(w9ago(p.at) || '\u2014') + '</div>' +
            '<div style="font-size:12px;margin-top:5px;" class="' + (p.done > 0 ? 'w9-dn' : 'w9-up') + '">' +
            (p.done > 0 ? '\u2212' : '+') + Math.abs(p.done) + ' kg so far \u00b7 ' +
            Math.abs(p.left) + ' kg to go</div>';
        } else {
          h += '<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Target ' +
            esc(String(g.target_value)) + ' kg \u00b7 no weight logged yet, so there is nothing to chart.</div>';
        }
      } else if (kind !== 'custom' && g.target_value != null){
        h += '<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Target ' +
          esc(String(g.target_value)) + ' ' + esc(g.target_unit || W9_GOAL_UNIT[kind] || '') + '</div>';
      }

      if (g.notes) h += '<div style="font-size:12px;color:var(--text-muted);margin-top:7px;">' + esc(g.notes) + '</div>';

      h += '<div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap;">' +
        '<button type="button" class="btn" style="font-size:11px;" data-w9edit="' + g.id + '">Edit</button>' +
        (g.achieved_at ? '' : '<button type="button" class="btn" style="font-size:11px;" data-w9ach="' + g.id + '">Mark achieved</button>') +
        '<button type="button" class="btn" style="font-size:11px;" data-w9del="' + g.id + '">Remove</button>' +
        '<label style="margin-left:auto;font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">' +
          '<input type="checkbox" data-w9cd="' + g.id + '"' + (g.countdown_enabled ? ' checked' : '') + '/> Show countdown in their app</label>' +
      '</div></div>';
      return h;
    }

    var w9legacyGoals = typeof w5Goals === 'function' ? w5Goals : null;

    w5Goals = async function(){
      var pane = $c('w5-pane'), c = w5.c, enc = w9enc(c.member_email);
      var today = new Date().toISOString().slice(0, 10);
      var goals = await rest('/coach_client_goals?' + pscope() + '&member_email=eq.' + enc +
        '&active=eq.true&order=created_at.desc&select=*').catch(function(){ return []; }) || [];
      if (w5.tab !== 'goals') return;

      var buckets = { current: [], upcoming: [], past: [] };
      goals.forEach(function(g){ buckets[w9GoalBucket(g, today)].push(g); });

      function section(key, label){
        if (!buckets[key].length) return key === 'current'
          ? '<div class="w5-box" style="color:var(--text-muted);font-size:12.5px;">No goals running right now.</div>' : '';
        return '<div class="w5-sec" style="margin-top:16px;">' + label + ' \u00b7 ' + buckets[key].length + '</div>' +
          buckets[key].map(w9GoalCard).join('');
      }

      pane.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">' +
          '<div class="w5-sec" style="margin:0;flex:1;">Goals</div>' +
          '<button type="button" class="btn btn-primary" style="font-size:12px;" id="w9-newgoal">+ New goal</button></div>' +
        '<div class="w5-sec" style="margin-top:12px;">Current \u00b7 ' + buckets.current.length + '</div>' +
        (buckets.current.length ? buckets.current.map(w9GoalCard).join('')
          : '<div class="w5-box" style="color:var(--text-muted);font-size:12.5px;">No goals running right now.</div>') +
        section('upcoming', 'Upcoming') +
        section('past', 'Past') +
        '<div id="w9-goal-editor"></div>';

      $c('w9-newgoal').addEventListener('click', function(){ w9GoalEditor(null); });
      pane.querySelectorAll('[data-w9edit]').forEach(function(b){
        b.addEventListener('click', function(){
          w9GoalEditor(goals.filter(function(g){ return g.id === b.dataset.w9edit; })[0]);
        });
      });
      pane.querySelectorAll('[data-w9ach]').forEach(function(b){
        b.addEventListener('click', async function(){
          b.disabled = true;
          try {
            await rest('/coach_client_goals?id=eq.' + b.dataset.w9ach, {
              method: 'PATCH', body: { achieved_at: new Date().toISOString() } });
            try { await rest('/coach_client_events', { method: 'POST', body: { partner_id: partnerId,
              member_email: c.member_email, kind: 'goal_achieved', label: 'Goal achieved' } }); } catch(_){}
            w5Goals();
          } catch(e){ b.disabled = false; w5toast('Couldn\u2019t save that.'); }
        });
      });
      pane.querySelectorAll('[data-w9del]').forEach(function(b){
        b.addEventListener('click', async function(){
          if (!confirm('Remove this goal?')) return;
          try { await rest('/coach_client_goals?id=eq.' + b.dataset.w9del, { method: 'PATCH', body: { active: false } }); w5Goals(); }
          catch(e){ w5toast('Couldn\u2019t remove that.'); }
        });
      });
      pane.querySelectorAll('[data-w9cd]').forEach(function(cb){
        cb.addEventListener('change', async function(){
          try {
            await rest('/coach_client_goals?id=eq.' + cb.dataset.w9cd, {
              method: 'PATCH', body: { countdown_enabled: cb.checked } });
          } catch(e){ cb.checked = !cb.checked; w5toast('Couldn\u2019t save that.'); }
        });
      });
    };

    function w9GoalEditor(g){
      var host = $c('w9-goal-editor'); if (!host) return;
      g = g || {};
      var kind = g.kind || 'custom';
      host.innerHTML =
        '<div class="w5-box" id="w9-ge" style="margin-top:16px;border-color:#4DAAAA;">' +
          '<div class="w5-sec">' + (g.id ? 'Edit goal' : 'New goal') + '</div>' +
          '<label class="w9-l">Type</label><select id="w9-g-kind" class="w9-i">' +
            W9_GOAL_KINDS.map(function(k){
              return '<option value="' + k[0] + '"' + (kind === k[0] ? ' selected' : '') + '>' + k[1] + '</option>';
            }).join('') + '</select>' +
          '<div id="w9-g-kindnote" style="font-size:11.5px;color:var(--text-muted);margin:5px 0 2px;"></div>' +
          '<label class="w9-l">Goal</label>' +
          '<input id="w9-g-title" class="w9-i" type="text" value="' + esc(g.title || '') + '" placeholder="Down to 78 kg for the wedding"/>' +
          '<div id="w9-g-targetwrap" style="display:none;">' +
            '<label class="w9-l">Target</label>' +
            '<div style="display:flex;gap:8px;">' +
              '<input id="w9-g-target" class="w9-i" type="number" step="0.1" style="flex:1;" value="' + (g.target_value != null ? g.target_value : '') + '"/>' +
              '<input id="w9-g-unit" class="w9-i" type="text" style="width:110px;" value="' + esc(g.target_unit || '') + '"/>' +
            '</div>' +
            '<div id="w9-g-startnote" style="font-size:11.5px;color:var(--text-muted);margin-top:5px;"></div>' +
          '</div>' +
          '<label class="w9-l">Target date</label>' +
          '<input id="w9-g-date" class="w9-i" type="date" value="' + esc(g.target_date || '') + '"/>' +
          '<label class="w9-l">Starts (optional \u2014 leave blank to start now)</label>' +
          '<input id="w9-g-starts" class="w9-i" type="date" value="' + esc(g.starts_at || '') + '"/>' +
          '<label class="w9-l">Notes</label>' +
          '<textarea id="w9-g-notes" class="w9-i" rows="2">' + esc(g.notes || '') + '</textarea>' +
          '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-top:10px;">' +
            '<input type="checkbox" id="w9-g-cd"' + (g.countdown_enabled !== false ? ' checked' : '') + '/> Show the countdown in their app</label>' +
          '<div style="display:flex;gap:8px;margin-top:12px;">' +
            '<button type="button" class="btn btn-primary" style="font-size:12px;" id="w9-g-save">Save</button>' +
            '<button type="button" class="btn" style="font-size:12px;" id="w9-g-cancel">Cancel</button>' +
          '</div>' +
        '</div>';

      function syncKind(){
        var k = $c('w9-g-kind').value;
        var meta = W9_GOAL_KINDS.filter(function(x){ return x[0] === k; })[0];
        $c('w9-g-kindnote').textContent = meta ? meta[2] : '';
        $c('w9-g-targetwrap').style.display = k === 'custom' ? 'none' : '';
        if (k !== 'custom' && !$c('w9-g-unit').value) $c('w9-g-unit').value = W9_GOAL_UNIT[k] || '';
        var ws = w5.weights || [];
        $c('w9-g-startnote').textContent = (k === 'body_weight')
          ? (ws.length ? 'Starting from their latest logged weight, ' + ws[0].weight_kg + ' kg. Progress updates itself every time they log.'
                       : 'They haven\u2019t logged a weight yet \u2014 the bar appears once they do.')
          : '';
      }
      $c('w9-g-kind').addEventListener('change', syncKind); syncKind();
      $c('w9-g-cancel').addEventListener('click', function(){ host.innerHTML = ''; });
      var ge = $c('w9-ge'); if (ge && ge.scrollIntoView) ge.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      $c('w9-g-save').addEventListener('click', async function(){
        var k = $c('w9-g-kind').value;
        var title = $c('w9-g-title').value.trim();
        if (!title) { w5toast('Give the goal a name.'); return; }
        var tv = $c('w9-g-target').value;
        if (k !== 'custom' && tv === ''){ w5toast('A ' + k.replace('_',' ') + ' goal needs a target number.'); return; }

        var body = {
          title: title,
          kind: k,
          target_value: k === 'custom' ? null : Number(tv),
          target_unit:  k === 'custom' ? null : ($c('w9-g-unit').value.trim() || W9_GOAL_UNIT[k] || null),
          target_date:  $c('w9-g-date').value || null,
          starts_at:    $c('w9-g-starts').value || null,
          notes:        $c('w9-g-notes').value.trim() || null,
          countdown_enabled: $c('w9-g-cd').checked
        };
        /* Stamp the start value once, at creation, off their own log — so the
           bar keeps its origin even if they log a heavier week later. */
        if (k === 'body_weight' && !g.id){
          var ws = w5.weights || [];
          if (ws.length) body.start_value = Number(ws[0].weight_kg);
        }
        this.disabled = true;
        try {
          if (g.id) await rest('/coach_client_goals?id=eq.' + g.id, { method: 'PATCH', body: body });
          else {
            body.partner_id = partnerId;
            body.member_email = w5.c.member_email;
            await rest('/coach_client_goals', { method: 'POST', body: body });
            try { await rest('/coach_client_events', { method: 'POST', body: { partner_id: partnerId,
              member_email: w5.c.member_email, kind: 'goal_added', label: 'Added goal: ' + title.slice(0, 80) } }); } catch(_){}
          }
          host.innerHTML = '';
          w5Goals();
        } catch(e){ this.disabled = false; w5toast('Couldn\u2019t save that goal.'); }
      });
    }

    /* ── #108 · Progress tab (coach side) ────────────────────────────── */
    async function w9LoadSeries(email){
      if (w9.bio && w9.forEmail === email) return w9.bio;
      var enc = w9enc(email);
      var res = await Promise.all([
        rest('/member_biometrics?member_email=eq.' + enc +
             '&order=logged_date.asc&select=kind,value,value2,unit,method,logged_date').catch(function(){ return []; }),
        rest('/weight_logs?member_email=eq.' + enc +
             '&order=logged_date.asc&select=weight_kg,logged_date').catch(function(){ return []; })
      ]);
      var bio = res[0] || [], wl = res[1] || [];
      var byKind = {};
      bio.forEach(function(r){
        (byKind[r.kind] = byKind[r.kind] || []).push({
          d: r.logged_date, v: Number(r.value), v2: r.value2 != null ? Number(r.value2) : null,
          unit: r.unit, method: r.method
        });
      });
      byKind.weight = wl.map(function(r){ return { d: r.logged_date, v: Number(r.weight_kg), unit: 'kg' }; });
      w9.bio = byKind; w9.forEmail = email;
      return byKind;
    }

    /* BMI / lean / fat are computed, never stored (mb_no_derived). */
    function w9Derive(byKind, member){
      var w = (byKind.weight || []).slice(-1)[0];
      var bf = (byKind.body_fat || []).slice(-1)[0];
      var h = member && member.height_cm ? Number(member.height_cm) : null;
      var out = {};
      if (w && h) out.bmi = { v: w9num(w.v / Math.pow(h / 100, 2), 1), unit: '', from: w.v + ' kg \u00b7 ' + h + ' cm' };
      if (w && bf){
        out.fat_mass  = { v: w9num(w.v * bf.v / 100, 1), unit: 'kg', from: 'weight + body fat' };
        out.lean_mass = { v: w9num(w.v - (w.v * bf.v / 100), 1), unit: 'kg', from: 'weight + body fat' };
      }
      return out;
    }

    function w9Chart(pts){
      if (pts.length < 2) return '<div style="font-size:12.5px;color:var(--text-muted);padding:10px 0;">' +
        (pts.length ? 'One entry so far \u2014 a second one draws the line.' : 'Nothing logged in this range.') + '</div>';
      var vs = pts.map(function(p){ return p.v; });
      var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
      if (hi === lo) { hi = lo + 1; lo = lo - 1; }
      var W = 600, H = 90, pad = 8;
      var d = pts.map(function(p, i){
        var x = pad + (i / (pts.length - 1)) * (W - pad * 2);
        var y = pad + (1 - (p.v - lo) / (hi - lo)) * (H - pad * 2);
        return w9num(x, 1) + ',' + w9num(y, 1);
      }).join(' ');
      var last = d.split(' ').slice(-1)[0].split(',');
      return '<svg class="w9-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
        '<polyline fill="none" stroke="#4DAAAA" stroke-width="2" stroke-linejoin="round" points="' + d + '"/>' +
        '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" fill="#C9A84C"/></svg>';
    }

    window.w9Progress = async function(){
      var pane = $c('w5-pane'), c = w5.c;
      if (!w5consented()){
        pane.innerHTML = '<div class="w5-box" style="font-size:12.5px;color:var(--text-muted);">' +
          esc(c.invited_first_name || 'This client') + ' hasn\u2019t accepted data sharing yet, so there are no measurements to show.</div>';
        return;
      }
      pane.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
      var byKind = await w9LoadSeries(c.member_email);
      var derived = w9Derive(byKind, w5.member || {});

      /* Only kinds with rows render.  A client who only weighs herself gets one
         chart, not fourteen empty ones. */
      var live = W9_KINDS.filter(function(k){
        return (byKind[k.k] && byKind[k.k].length) || (k.src === 'derived' && derived[k.k]);
      });
      if (!live.length){
        pane.innerHTML = '<div class="w5-box" style="font-size:12.5px;color:var(--text-muted);">' +
          'Nothing logged yet. Measurements appear here as soon as ' +
          esc(c.invited_first_name || 'they') + ' logs one in the app.</div>';
        return;
      }
      if (!live.filter(function(k){ return k.k === w9.kind; }).length) w9.kind = live[0].k;

      var meta = W9_KIND[w9.kind];
      var rows = (byKind[w9.kind] || []).slice();
      if (w9.range){
        var cut = new Date(Date.now() - w9.range * 86400000).toISOString().slice(0, 10);
        rows = rows.filter(function(r){ return r.d >= cut; });
      }

      var h = '<div class="w9-chips">' + live.map(function(k){
          return '<span class="w9-chip' + (k.k === w9.kind ? ' on' : '') + '" data-w9k="' + k.k + '">' + esc(k.label) + '</span>';
        }).join('') + '</div>' +
        '<div class="w9-chips" style="margin-bottom:10px;">' +
          [[30,'30d'],[90,'90d'],[365,'1y'],[0,'All']].map(function(r){
            return '<span class="w9-chip' + (w9.range === r[0] ? ' on' : '') + '" data-w9r="' + r[0] + '">' + r[1] + '</span>';
          }).join('') + '</div>';

      if (meta.src === 'derived'){
        var dv = derived[w9.kind];
        h += '<div class="w5-box"><div style="font-size:26px;font-weight:700;">' + dv.v +
          (dv.unit ? ' <span style="font-size:13px;font-weight:600;color:var(--text-muted);">' + dv.unit + '</span>' : '') + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">Calculated from ' + esc(dv.from) +
          ' \u2014 never entered by hand.</div></div>';
        if (w9.kind === 'bmi' && !(w5.member && w5.member.height_cm)) h +=
          '<div class="w5-box" style="font-size:12px;color:var(--text-muted);">BMI needs their height. It fills in as soon as they add it in the app.</div>';
      } else {
        h += '<div class="w5-box">' + w9Chart(rows) +
          (rows.length ? '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:2px;">' +
            '<span>' + w5day(rows[0].d) + ' \u00b7 ' + rows[0].v + ' ' + esc(meta.unit) + '</span>' +
            '<span>' + w5day(rows[rows.length-1].d) + ' \u00b7 ' + rows[rows.length-1].v + ' ' + esc(meta.unit) + '</span></div>' : '') +
          '</div>';

        if (rows.length){
          var cur = rows[rows.length-1], first = rows[0], ch = w9num(cur.v - first.v);
          h += '<div class="w9-strip">' +
            '<div class="w9-s"><span>Current</span><b>' + cur.v + ' ' + esc(meta.unit) + '</b></div>' +
            '<div class="w9-s"><span>Change</span><b class="' + (ch <= 0 ? 'w9-dn' : 'w9-up') + '">' +
              (ch > 0 ? '+' : '') + ch + '</b></div>' +
            '<div class="w9-s"><span>Entries</span><b>' + rows.length + '</b></div>' +
            '<div class="w9-s"><span>Last logged</span><b>' + esc(w9ago(cur.d) || '\u2014') + '</b></div></div>';

          /* A run of caliper readings followed by one DEXA is a different
             measurement, not a cliff — say so rather than draw it. */
          var methods = {}; rows.forEach(function(r){ if (r.method) methods[r.method] = 1; });
          if (Object.keys(methods).length > 1) h +=
            '<div class="w5-box" style="font-size:12px;color:#E8834A;border-color:#E8834A;">Measured more than one way in this range (' +
            Object.keys(methods).map(function(m){ return W9_METHOD[m] || m; }).join(', ') +
            ') \u2014 the step between methods isn\u2019t a real change.</div>';

          h += '<div class="w5-sec" style="margin-top:14px;">Entries</div><table class="w9-tbl">' +
            '<tr><th>Date</th><th>Value</th><th>Change</th>' + (meta.method ? '<th>Method</th>' : '') + '</tr>' +
            rows.slice().reverse().slice(0, 40).map(function(r, i, arr){
              var prev = arr[i+1], dch = prev ? w9num(r.v - prev.v) : null;
              return '<tr><td>' + w5day(r.d) + '</td><td>' +
                (meta.pair ? r.v + '/' + r.v2 : r.v) + ' ' + esc(meta.unit) + '</td><td' +
                (dch == null ? '>\u2014' : ' class="' + (dch <= 0 ? 'w9-dn' : 'w9-up') + '">' + (dch > 0 ? '+' : '') + dch) +
                '</td>' + (meta.method ? '<td style="color:var(--text-muted);">' + esc(W9_METHOD[r.method] || '\u2014') + '</td>' : '') + '</tr>';
            }).join('') + '</table>';
        }
      }

      if (W9_HEALTH_VISIBLE) h += '<div id="w9-health"></div>';

      pane.innerHTML = h;
      pane.querySelectorAll('[data-w9k]').forEach(function(b){
        b.addEventListener('click', function(){ w9.kind = b.dataset.w9k; window.w9Progress(); });
      });
      pane.querySelectorAll('[data-w9r]').forEach(function(b){
        b.addEventListener('click', function(){ w9.range = Number(b.dataset.w9r); window.w9Progress(); });
      });
    };

    /* the workspace caches per client — drop the series when the client changes */
    (function(){
      var legacyView = typeof viewClient === 'function' ? viewClient : null;
      if (!legacyView) return;
      viewClient = function(){
        w9.bio = null; w9.forEmail = null; w9.kind = 'weight'; w9.range = 365;
        return legacyView.apply(this, arguments);
      };
    })();

    var st2 = document.createElement('style');
    st2.textContent =
      '.w9-l{display:block;font-size:12px;font-weight:600;margin:11px 0 5px}' +
      '.w9-i{width:100%;background:var(--surface-2,rgba(127,127,127,.1));border:1px solid var(--border);' +
        'border-radius:8px;color:var(--text);font-size:13.5px;font-family:inherit;padding:9px 11px;outline:none}';
    document.head.appendChild(st2);

  })();

