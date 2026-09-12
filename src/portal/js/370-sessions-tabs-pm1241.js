  /* ── PM-1241 · Sessions across, not down · Create a day from a programme slot ───────────────
     Dean, 12 Sep (Kahunas side by side): weekly plan sessions should be tabs across the top —
     Session 1 | Session 2 | + (Create new · Import a day template) — not stacked panels; and a
     programme slot with nothing that fits should let you build the day right there, with the
     builder opening over the top. Both coach-side; no contract change.
     Weekly: #w-sessions panels stay exactly as 340/360 build them — this slice adds a tab bar,
     shows one panel at a time, mirrors the session name into the tab, and re-syncs on any
     childList mutation. Programme: every empty slot's select gets "Create a new day here…";
     choosing it seeds an empty day and opens progDayOpen; #pg-dayedit is moved into a sheet
     over the page while editing and moved back on Done (same move-the-DOM pattern as §23.340). ── */
  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.wt-bar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:6px;background:var(--surface-2);border-radius:10px;margin:0 0 12px;}' +
      '.wt-tab{padding:7px 13px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text-muted);background:none;border:0;cursor:pointer;font-family:inherit;}' +
      '.wt-tab.on{background:var(--surface);color:var(--teal-lt);box-shadow:0 1px 3px rgba(0,0,0,.18);}' +
      '.wt-plus{position:relative;}' +
      '.wt-menu{display:none;position:absolute;top:36px;left:0;background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.35);min-width:240px;padding:6px;z-index:60;}' +
      '.wt-menu.on{display:block;}' +
      '.wt-menu button,.wt-menu select{display:block;width:100%;padding:8px 10px;border-radius:7px;font-size:13px;text-align:left;background:none;border:0;color:var(--text);cursor:pointer;font-family:inherit;}' +
      '.wt-menu button:hover{background:var(--surface-2);}' +
      '.wt-menu select{border:1px solid var(--border);background:var(--surface-2);margin-top:4px;}' +
      '.pg-sheet{position:fixed;inset:0;z-index:965;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:24px;}' +
      '.pg-sheet.on{display:flex;}' +
      '.pg-sheet > .in{width:100%;max-width:1180px;max-height:92vh;overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;}' +
      '.pg-sheet #pg-dayedit{border:0 !important;padding:0 !important;margin:0 !important;}';
    document.head.appendChild(st);
  })();

  /* ── weekly plans: tabs ── */
  var wt = { active: 0, mute: false };
  function wtPanels(){ var h = $c('w-sessions'); return h ? Array.prototype.slice.call(h.querySelectorAll(':scope > .w-session')) : []; }
  function wtLabel(p, i){ var n = p.querySelector('.w-name'); var v = n && n.value.trim(); return v || ('Session ' + (i + 1)); }
  function wtEnsureBar(){
    var h = $c('w-sessions'); if (!h) return null;
    var bar = $c('wt-bar');
    if (!bar){
      bar = document.createElement('div'); bar.className = 'wt-bar'; bar.id = 'wt-bar';
      h.parentElement.insertBefore(bar, h);
      var add = $c('w-add-session'); if (add) add.style.display = 'none';
      new MutationObserver(function(){ if (!wt.mute) wtSync(); }).observe(h, { childList: true });
      document.addEventListener('input', function(ev){ if (ev.target && ev.target.classList && ev.target.classList.contains('w-name')) wtSync(true); });
      document.addEventListener('click', function(ev){ if (!ev.target.closest || !ev.target.closest('.wt-plus')) document.querySelectorAll('.wt-menu.on').forEach(function(m){ m.classList.remove('on'); }); });
    }
    return bar;
  }
  function wtSync(labelsOnly){
    var bar = wtEnsureBar(); if (!bar) return;
    var panels = wtPanels();
    if (!panels.length){ bar.innerHTML = ''; return; }
    if (wt.active >= panels.length) wt.active = panels.length - 1;
    if (wt.active < 0) wt.active = 0;
    wt.mute = true;
    try {
      panels.forEach(function(p, i){ p.style.display = i === wt.active ? '' : 'none'; });
      if (labelsOnly && bar.querySelectorAll('.wt-tab').length === panels.length){
        bar.querySelectorAll('.wt-tab').forEach(function(t, i){ t.textContent = wtLabel(panels[i], i); });
        return;
      }
      bar.innerHTML = panels.map(function(p, i){ return '<button type="button" class="wt-tab' + (i === wt.active ? ' on' : '') + '" data-wt="' + i + '">' + esc(wtLabel(p, i)) + '</button>'; }).join('') +
        '<div class="wt-plus"><button type="button" class="wt-tab" id="wt-plus" title="Add a session">+ Add</button>' +
        '<div class="wt-menu" id="wt-menu"><button type="button" id="wt-new">\u2795 Create new session</button>' +
        '<select id="wt-import"><option value="">\ud83d\udce5 Import a day template\u2026</option></select></div></div>';
      bar.querySelectorAll('.wt-tab[data-wt]').forEach(function(t){ t.addEventListener('click', function(){ wt.active = parseInt(t.dataset.wt, 10); wtSync(); }); });
      $c('wt-plus').addEventListener('click', function(ev){ ev.stopPropagation(); $c('wt-menu').classList.toggle('on'); var s = $c('wt-import'); if (s.options.length === 1 && typeof bpDays === 'function') bpDays().then(function(rows){ rows.forEach(function(r){ var o = document.createElement('option'); o.value = r.id; o.textContent = r.name; s.appendChild(o); }); }); });
      $c('wt-new').addEventListener('click', function(){ $c('wt-menu').classList.remove('on'); var add = $c('w-add-session'); if (add) add.click(); wt.active = wtPanels().length - 1; wtSync(); });
      $c('wt-import').addEventListener('change', function(){
        var id = this.value; if (!id) return; this.value = '';
        $c('wt-menu').classList.remove('on');
        var add = $c('w-add-session'); if (add) add.click();
        var panels2 = wtPanels(); var last = panels2[panels2.length - 1]; wt.active = panels2.length - 1;
        var sel = last && last.querySelector('.bp-import');
        var apply = function(){ if (!sel) return; if (!Array.prototype.some.call(sel.options, function(o){ return o.value === id; })){ setTimeout(apply, 150); return; } sel.value = id; sel.dispatchEvent(new Event('change')); wtSync(); };
        setTimeout(apply, 50);
      });
    } finally { setTimeout(function(){ wt.mute = false; }, 0); }
  }
  (function(){
    var _aws = addWSession;
    addWSession = function(){ _aws.apply(this, arguments); var n = wtPanels().length; if (n) wt.active = n - 1; wtSync(); };
    var _pl = plLoad;
    plLoad = async function(){ wt.active = 0; return _pl.apply(this, arguments); };
  })();

  /* ── programmes: create a new day in a slot, editor over the top ── */
  var pgSheet = null, pgHome = null;
  function pgSheetOpen(){
    var host = $c('pg-dayedit'); if (!host) return;
    if (!pgSheet){
      pgSheet = document.createElement('div'); pgSheet.className = 'pg-sheet';
      pgSheet.innerHTML = '<div class="in"></div>';
      document.body.appendChild(pgSheet);
      pgSheet.addEventListener('click', function(ev){ if (ev.target === pgSheet && typeof progDayDone === 'function') progDayDone(); });
    }
    if (host.parentElement !== pgSheet.firstElementChild){ pgHome = { parent: host.parentElement, next: host.nextSibling }; pgSheet.firstElementChild.appendChild(host); }
    pgSheet.classList.add('on');
  }
  function pgSheetClose(){
    if (!pgSheet) return;
    pgSheet.classList.remove('on');
    var host = $c('pg-dayedit');
    if (host && pgHome && host.parentElement === pgSheet.firstElementChild){ if (pgHome.next && pgHome.next.parentElement === pgHome.parent) pgHome.parent.insertBefore(host, pgHome.next); else pgHome.parent.appendChild(host); }
  }
  (function(){
    var _open = progDayOpen, _done = progDayDone, _render = renderProg;
    progDayOpen = function(j){ _open.apply(this, arguments); pgSheetOpen(); };
    progDayDone = function(){ _done.apply(this, arguments); pgSheetClose(); };
    renderProg = function(){
      _render.apply(this, arguments);
      var slots = $c('pg-slots'); if (!slots) return;
      slots.querySelectorAll('.pg-pick').forEach(function(s){
        if (s.dataset.pgNew) return; s.dataset.pgNew = '1';
        var o = document.createElement('option'); o.value = '__new__'; o.textContent = '\u270e Create a new day here\u2026';
        s.insertBefore(o, s.options[1] || null);
        s.addEventListener('change', function(){
          if (s.value !== '__new__') return;
          var j = parseInt(s.dataset.pgSlot, 10);
          progState.weeks[progWeekIdx].days[j] = { name: '', exercises: [], warmup: [], cooldown: [] };
          s.value = '';
          progDayOpen(j);
        }, true);
      });
      /* no templates at all: the slot still offers to build one */
      slots.querySelectorAll('.pg-slot').forEach(function(sl, j){
        if (sl.querySelector('.pg-pick, .pg-chip, .pg-new')) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn pg-new'; b.style.cssText = 'width:100%;font-size:11.5px;';
        b.textContent = '+ Create a day';
        b.addEventListener('click', function(){ progState.weeks[progWeekIdx].days[j] = { name: '', exercises: [], warmup: [], cooldown: [] }; progDayOpen(j); });
        var msg = sl.querySelector('div[style*="text-muted"]'); if (msg) msg.replaceWith(b); else sl.appendChild(b);
      });
    };
  })();
