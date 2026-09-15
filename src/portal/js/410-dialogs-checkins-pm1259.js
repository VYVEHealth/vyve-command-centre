  /* ── PM-1259 · Calum batch 3, part 2 ────────────────────────────────────────────────────────
     (a) Native confirm()/alert() everywhere — "a white browser-style pop-up… looks almost like a
         website error/crash box". ~80 call sites across every slice, so this replaces the window
         functions themselves rather than editing each one. confirm() must stay synchronous for
         the existing `if (!confirm(...)) return;` shape, so the VYVE dialog can't replace it
         outright — instead every button that runs a confirm is intercepted, the question is asked
         in a VYVE dialog, and the original handler is replayed with confirm stubbed true. §23.358
     (b) Add Client and Bulk upload open where they sit in the page (top / bottom). Both now
         centre in a sheet — the panel itself is moved, so every id and handler survives.
     (c) Outstanding check-ins: who's in, who hasn't, who's late, from each client's own
         check-in day. Calum's "I want to scan it on a Tuesday".                              ── */
  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.vd-veil{position:fixed;inset:0;z-index:990;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:20px;}' +
      '.vd-veil.on{display:flex;}' +
      '.vd-box{width:100%;max-width:460px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.45);padding:20px 22px;}' +
      '.vd-box h3{font-size:15px;font-weight:700;margin:0 0 8px;}' +
      '.vd-box p{font-size:13px;color:var(--text-muted);line-height:1.5;margin:0 0 16px;white-space:pre-wrap;}' +
      '.vd-box .row{display:flex;gap:8px;justify-content:flex-end;}' +
      '.vs-veil{position:fixed;inset:0;z-index:970;display:none;align-items:flex-start;justify-content:center;background:rgba(0,0,0,.55);padding:28px 20px;overflow-y:auto;}' +
      '.vs-veil.on{display:flex;}' +
      '.vs-in{width:100%;max-width:820px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:6px 18px 18px;position:relative;}' +
      '.vs-x{position:absolute;top:12px;right:14px;width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text-muted);font-size:16px;cursor:pointer;z-index:2;}' +
      '.oc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;}' +
      '.oc-card{border:1px solid var(--border);border-radius:11px;padding:10px 12px;background:var(--surface-2);display:flex;align-items:center;gap:10px;}' +
      '.oc-card .dot{width:9px;height:9px;border-radius:50%;flex:none;}' +
      '.oc-in .dot{background:var(--success,#4ADE80);}.oc-due .dot{background:var(--warning,#E8A855);}.oc-late .dot{background:var(--danger,#F87171);}' +
      '.oc-card .nm{font-size:13px;font-weight:600;}' +
      '.oc-card .sub{font-size:11.5px;color:var(--text-muted);}' +
      '.oc-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px;}';
    document.head.appendChild(st);
  })();

  /* ── (a) VYVE dialogs ── */
  var vdVeil = null;
  function vdEnsure(){
    if (vdVeil) return vdVeil;
    vdVeil = document.createElement('div'); vdVeil.className = 'vd-veil';
    vdVeil.innerHTML = '<div class="vd-box"><h3 id="vd-t"></h3><p id="vd-m"></p><div class="row" id="vd-r"></div></div>';
    document.body.appendChild(vdVeil);
    return vdVeil;
  }
  function vdShow(msg, opts){
    opts = opts || {};
    var v = vdEnsure();
    $c('vd-t').textContent = opts.title || (opts.confirm ? 'Are you sure?' : 'VYVE');
    $c('vd-m').textContent = String(msg == null ? '' : msg);
    var row = $c('vd-r'); row.innerHTML = '';
    return new Promise(function(resolve){
      function done(val){ v.classList.remove('on'); resolve(val); }
      if (opts.confirm){
        var no = document.createElement('button'); no.className = 'btn'; no.type = 'button'; no.textContent = opts.cancelText || 'Cancel';
        no.addEventListener('click', function(){ done(false); });
        row.appendChild(no);
      }
      var yes = document.createElement('button');
      yes.className = 'btn btn-primary'; yes.type = 'button';
      yes.textContent = opts.okText || (opts.confirm ? 'Yes, do it' : 'OK');
      yes.addEventListener('click', function(){ done(true); });
      row.appendChild(yes);
      v.classList.add('on');
      setTimeout(function(){ yes.focus(); }, 30);
      v.onclick = function(ev){ if (ev.target === v) done(false); };
      document.addEventListener('keydown', function esc(ev){ if (ev.key === 'Escape' && v.classList.contains('on')){ done(false); document.removeEventListener('keydown', esc); } });
    });
  }
  (function(){
    /* alert is fire-and-forget — swap it outright */
    window.alert = function(msg){ vdShow(msg, { title: 'VYVE' }); };

    /* confirm is used as `if (!confirm(q)) return;` inside click handlers, so it cannot become a
       promise without rewriting eighty call sites. Intercept the click, ask in a VYVE dialog,
       then replay the same click with confirm stubbed to true. §23.358 */
    var native = window.confirm.bind(window);
    var replaying = false, stub = false, lastQ = null;
    window.confirm = function(q){
      if (stub) return true;
      lastQ = String(q == null ? '' : q);
      return false;                                   /* first pass: cancel, then re-run properly */
    };
    document.addEventListener('click', function(ev){
      if (replaying) return;
      var el = ev.target && ev.target.closest ? ev.target.closest('button, a, [role="button"]') : null;
      if (!el || el.closest('.vd-veil')) return;
      lastQ = null;
      setTimeout(function(){
        if (!lastQ) return;                            /* no confirm was asked — nothing to do */
        var q = lastQ; lastQ = null;
        vdShow(q, { confirm: true }).then(function(ok){
          if (!ok) return;
          replaying = true; stub = true;
          try { el.click(); } finally { stub = false; setTimeout(function(){ replaying = false; }, 0); }
        });
      }, 0);
    }, true);
    window.vdShow = vdShow; window.vdNativeConfirm = native;
  })();

  /* ── (b) Add Client and Bulk upload centre on the page ── */
  (function(){
    var veil = null, home = null, current = null;
    function ensure(){
      if (veil) return veil;
      veil = document.createElement('div'); veil.className = 'vs-veil';
      veil.innerHTML = '<div class="vs-in"><button type="button" class="vs-x" title="Close">\u00d7</button></div>';
      document.body.appendChild(veil);
      veil.querySelector('.vs-x').addEventListener('click', close);
      veil.addEventListener('click', function(ev){ if (ev.target === veil) close(); });
      document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape' && veil.classList.contains('on')) close(); });
      return veil;
    }
    function open(el){
      if (!el || el === current) return;
      ensure();
      home = { parent: el.parentElement, next: el.nextSibling };
      veil.firstElementChild.appendChild(el);
      current = el;
      veil.classList.add('on');
    }
    function close(){
      if (!current) return;
      if (home && home.parent){ if (home.next && home.next.parentElement === home.parent) home.parent.insertBefore(current, home.next); else home.parent.appendChild(current); }
      current.style.display = 'none';
      current = null; veil.classList.remove('on');
    }
    function watch(id){
      var el = $c(id); if (!el) return;
      new MutationObserver(function(){
        var shown = el.style.display !== 'none';
        if (shown && el !== current) open(el);
        else if (!shown && el === current) close();
      }).observe(el, { attributes: true, attributeFilter: ['style'] });
    }
    var t = setInterval(function(){
      if (!$c('wz-card') && !$c('cl-bulk-card')) return;
      clearInterval(t);
      ['wz-card', 'cl-bulk-card'].forEach(watch);
    }, 400);
    setTimeout(function(){ clearInterval(t); }, 25000);
  })();

  /* ── (c) Outstanding check-ins ── */
  var OC_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function ocMondayIdx(){ return (new Date().getDay() + 6) % 7; }
  function ocWeekStart(){
    var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ocMondayIdx()); return d;
  }
  async function ocLoad(){
    var host = $c('oc-body'); if (!host) return;
    host.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    var ws = ocWeekStart(), wsISO = ws.toISOString().slice(0, 10);
    var resp = [];
    try { resp = await rest('/coach_form_responses?' + pscope() + '&submitted_at=gte.' + ws.toISOString() + '&select=member_email,submitted_at,week_start') || []; }
    catch(_){ resp = []; }
    var got = {};
    resp.forEach(function(r){ got[String(r.member_email).toLowerCase()] = r.submitted_at; });
    var today = ocMondayIdx();
    var rows = roster.filter(function(c){ return c.status === 'active'; }).map(function(c){
      var em = String(c.member_email).toLowerCase();
      var day = (c.assignments || {}).checkin_day;
      var has = !!got[em];
      var state, sub;
      if (has){ state = 'in'; sub = 'Checked in ' + new Date(got[em]).toLocaleDateString('en-GB', { weekday: 'short' }); }
      else if (day == null || day === ''){ state = 'due'; sub = 'No check-in day set'; }
      else if (day < today){ state = 'late'; sub = 'Due ' + OC_DAYS[day] + ' \u2014 ' + (today - day) + ' day' + (today - day === 1 ? '' : 's') + ' late'; }
      else if (day === today){ state = 'due'; sub = 'Due today'; }
      else { state = 'due'; sub = 'Due ' + OC_DAYS[day]; }
      return { c: c, state: state, sub: sub };
    });
    var order = { late: 0, due: 1, in: 2 };
    rows.sort(function(a, b){ return order[a.state] - order[b.state] || nameOf(a.c).localeCompare(nameOf(b.c)); });
    var n = { in: 0, due: 0, late: 0 }; rows.forEach(function(r){ n[r.state]++; });
    function paint(f){
      var show = rows.filter(function(r){ return f === 'all' || r.state === f; });
      host.innerHTML =
        '<div class="oc-tabs">' +
          ['all', 'late', 'due', 'in'].map(function(k){
            var lbl = k === 'all' ? 'Everyone ' + rows.length : k === 'late' ? 'Late ' + n.late : k === 'due' ? 'Still to come ' + n.due : 'Checked in ' + n.in;
            return '<button class="btn' + (k === f ? ' btn-primary' : '') + '" type="button" data-oc="' + k + '" style="font-size:12px;">' + lbl + '</button>';
          }).join('') +
        '</div>' +
        (show.length ? '<div class="oc-grid">' + show.map(function(r){
          return '<div class="oc-card oc-' + r.state + '" data-em="' + esc(r.c.member_email) + '"><span class="dot"></span>' +
            '<div style="flex:1;min-width:0;"><div class="nm">' + esc(nameOf(r.c)) + '</div><div class="sub">' + esc(r.sub) + '</div></div>' +
            (r.state === 'in' ? '<button class="btn" type="button" data-ocv="' + esc(r.c.member_email) + '" style="font-size:11px;">Review</button>'
                              : '<button class="btn" type="button" data-ocm="' + esc(r.c.member_email) + '" style="font-size:11px;">Nudge</button>') +
            '</div>';
        }).join('') + '</div>' : '<div class="empty-state"><h3>Nothing here</h3><p>No clients in this group right now.</p></div>');
      host.querySelectorAll('[data-oc]').forEach(function(b){ b.addEventListener('click', function(){ paint(b.dataset.oc); }); });
      host.querySelectorAll('[data-ocv]').forEach(function(b){ b.addEventListener('click', function(){ go('clients'); viewClient(b.dataset.ocv); }); });
      host.querySelectorAll('[data-ocm]').forEach(function(b){ b.addEventListener('click', function(){
        var em = b.dataset.ocm.toLowerCase();
        var c = roster.find(function(x){ return String(x.member_email).toLowerCase() === em; }) || {};
        var first = (c.invited_first_name || '').trim();
        go('messages');
        setTimeout(function(){
          msgOpen(em);
          setTimeout(function(){
            var inp = $c('msg-input'); if (!inp) return;
            inp.value = (first ? first + ', ' : '') + 'quick nudge \u2014 your check-in\u2019s still open. Two minutes when you get a sec and I\u2019ll take a look tonight.';
            inp.focus(); try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch(_){}
          }, 350);
        }, 250);
      }); });
    }
    paint('all');
  }
  (function(){
    var t = setInterval(function(){
      var view = $c('view-ci'); if (!view) return;
      clearInterval(t);
      if ($c('oc-card')) return;
      var card = document.createElement('div');
      card.className = 'card'; card.id = 'oc-card'; card.style.marginBottom = '14px';
      card.innerHTML = '<div class="card-title">Outstanding check-ins' +
        '<button class="btn" id="oc-refresh" type="button" style="margin-left:auto;font-size:11.5px;font-weight:400;">Refresh</button></div>' +
        '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">This week against each client\u2019s own check-in day. Late first.</p>' +
        '<div id="oc-body"></div>';
      view.insertBefore(card, view.firstChild);
      $c('oc-refresh').addEventListener('click', ocLoad);
      var _go = go;
      go = function(v){ _go.apply(this, arguments); if (v === 'clients_checkins') setTimeout(ocLoad, 100); };
      if (($c('view-ci').style.display || '') !== 'none') ocLoad();
    }, 400);
    setTimeout(function(){ clearInterval(t); }, 25000);
  })();
