  /* ── PM-1236 · Builder as a page · Kahunas / Trainerize naming · import a day into a weekly plan ──
     Dean, 12 Sep: "+ New shouldn't go under the existing ones" (Calum #15). When #pl-editor shows, the
     list card hides and the editor carries a "← Back" — the page is the builder. Observed via a
     MutationObserver on #pl-editor's style, because nine call sites toggle that display directly.
     Naming (Dean: match Kahunas / Trainerize): Day templates → Workouts, Weekly workouts → Weekly
     plans, Programmes stays. Only labels change — kinds (workout_day / workout / program) do not.
     Weekly plan sessions gain "Import a day template ▾" (Dean: "when creating a programme or
     workout you should be able to import your day templates").                                 ── */
  KIND_LABEL.workout_day = 'workout';
  KIND_LABEL.workout = 'weekly plan';
  if (typeof PL_TITLES !== 'undefined'){ PL_TITLES.workout_day = 'Workouts'; PL_TITLES.workout = 'Weekly plans'; }
  (function(){
    document.querySelectorAll('[data-go="kindsel:workout_day"] span, .pl-kind[data-kind="workout_day"]').forEach(function(e){ e.textContent = 'Workouts'; });
    document.querySelectorAll('[data-go="kindsel:workout"] span, .pl-kind[data-kind="workout"]').forEach(function(e){ e.textContent = 'Weekly plans'; });
    var st = document.createElement('style');
    st.textContent = '.bp-back{font-size:12px;margin-right:10px;}' +
      '.bp-import{padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12px;font-family:inherit;max-width:260px;}';
    document.head.appendChild(st);
  })();

  function bpListCard(){ var l = $c('pl-list'); return l ? l.closest('.card') : null; }
  function bpSync(){
    var ed = $c('pl-editor'), card = bpListCard(); if (!ed || !card) return;
    var open = ed.style.display !== 'none';
    card.style.display = open ? 'none' : '';
    var pg = $c('lt-pager'); if (pg) pg.style.display = open ? 'none' : '';
    if (open && !$c('bp-back')){
      var t = $c('pl-editor-title');
      if (t){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn bp-back'; b.id = 'bp-back';
        b.innerHTML = '\u2190 Back';
        b.addEventListener('click', function(){ var c = $c('pl-cancel'); if (c) c.click(); });
        t.parentElement.insertBefore(b, t);
      }
    }
    if (open){ try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(_){ window.scrollTo(0, 0); } }
  }
  (function(){
    var ed = $c('pl-editor'); if (!ed) return;
    new MutationObserver(bpSync).observe(ed, { attributes: true, attributeFilter: ['style'] });
    bpSync();
  })();

  /* ── weekly plan sessions: import a day template ── */
  var bpDayCache = null;
  async function bpDays(){
    if (bpDayCache) return bpDayCache;
    try { bpDayCache = await rest('/coach_templates?' + pscope() + '&kind=eq.workout_day&active=eq.true&select=id,name,payload&order=name.asc&limit=200') || []; }
    catch(_){ bpDayCache = []; }
    return bpDayCache;
  }
  (function(){
    var _pl = plLoad;
    plLoad = async function(){ bpDayCache = null; return _pl.apply(this, arguments); };   /* a saved day template shows up in the next import list */
    var _aws = addWSession;
    addWSession = function(sess){
      _aws.apply(this, arguments);
      var host = $c('w-sessions'); var d = host && host.lastElementChild; if (!d || d.querySelector('.bp-import')) return;
      var nameRow = d.querySelector('.w-name') && d.querySelector('.w-name').closest('div[style*="display:flex"]'); if (!nameRow) return;
      var sel = document.createElement('select'); sel.className = 'bp-import'; sel.title = 'Replace this session with one of your saved workouts';
      sel.innerHTML = '<option value="">Import a day template\u2026</option>';
      bpDays().then(function(rows){ rows.forEach(function(r){ var o = document.createElement('option'); o.value = r.id; o.textContent = r.name; sel.appendChild(o); }); });
      sel.addEventListener('change', function(){
        var id = sel.value; if (!id) return;
        var row = (bpDayCache || []).find(function(r){ return r.id === id; }); if (!row) return;
        var dayEl = d.querySelector('.w-day'); if (!dayEl) return;
        var hasRows = dayEl.querySelectorAll('.de-row').length > 0;
        if (hasRows && !confirm('Replace this session\u2019s exercises with \u201c' + row.name + '\u201d?')){ sel.value = ''; return; }
        var nm = d.querySelector('.w-name'); if (nm && !nm.value.trim()) nm.value = row.name;
        renderDayEditor(dayEl, Object.assign({}, row.payload || {}, { name: row.name }));
        sel.value = '';
      });
      var del = nameRow.querySelector('.w-del');
      nameRow.insertBefore(sel, del || null);
    };
  })();
