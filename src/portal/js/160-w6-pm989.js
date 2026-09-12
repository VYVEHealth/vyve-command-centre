  /* ============================ PM-989 Wave 6 ============================
     Gap-map #32-36: month/week/list calendar over coach_events (new) +
     coach_sessions (calls, unchanged contract) + the booking engine;
     requests inbox = pending bookings for this partner (confirm via
     booking-paid-confirm EF, decline via bk_partner_update policy);
     content library (coach_content_items, coach-content p-<pid>/content/*)
     with all/selected audience + delay-from-start drip. Shadows: go
     (adds view-content), calLoad (grid). Legacy #view-cal children are
     soft-hidden in place, never deleted. w6ClientCal = the client-detail
     Calendar tab deferred from Wave 5. */

  var W6_KIND_COLORS = { appointment: '#3DB89F', event: '#1B7878', goal: '#C9A84C', task: '#8B7BD8', reminder: '#E8834A', call: '#4DAAAA', other: '#9AA5B1' };
  var W6_KINDS = ['appointment','event','goal','task','reminder','call','other'];
  var w6 = { mode: localStorage.getItem('w6cal_mode') || 'month', cursor: new Date(), items: [], reqs: [], hideKinds: {}, showReqs: false, editing: null };

  (function(){
    var css = document.createElement('style');
    css.textContent = [
      '.w6-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}',
      '.w6-pill{border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:999px;padding:5px 12px;font-size:12px;cursor:pointer;}',
      '.w6-pill.on{background:#1B7878;color:#fff;border-color:transparent;}',
      '.w6-kchip{display:inline-flex;gap:5px;align-items:center;border:1px solid var(--border);border-radius:999px;padding:3px 9px;font-size:11px;cursor:pointer;color:var(--text-muted);}',
      '.w6-kchip.off{opacity:.35;}',
      '.w6-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}',
      '.w6-dow{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);padding:4px 6px;}',
      '.w6-cell{min-height:86px;border:1px solid var(--border);border-radius:8px;padding:4px 5px;font-size:11px;cursor:pointer;overflow:hidden;background:var(--surface-2);}',
      '.w6-cell.dim{opacity:.45;}',
      '.w6-cell.today{outline:2px solid #1B7878;outline-offset:-2px;}',
      '.w6-cell .dn{font-size:10.5px;font-weight:700;color:var(--text-muted);margin-bottom:2px;}',
      '.w6-ev{display:flex;gap:4px;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.55;}',
      '.w6-dot{width:7px;height:7px;border-radius:50%;flex:none;}',
      '.w6-wkcol{border:1px solid var(--border);border-radius:8px;padding:6px;min-height:120px;background:var(--surface-2);}',
      '.w6-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:600;padding:16px;}',
      '.w6-box{background:var(--surface);border:1px solid var(--border);border-radius:12px;max-width:560px;width:100%;max-height:90vh;overflow:auto;padding:18px;}',
      '.w6-chip{display:inline-block;font-size:10px;padding:2px 7px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border);color:var(--text-muted);margin-left:6px;white-space:nowrap;}',
      '.w6badge{background:#E8834A;color:#fff;border-radius:999px;font-size:10px;font-weight:700;padding:1px 8px;}',
      '.w6-row{display:flex;gap:12px;align-items:center;padding:9px 6px;border-bottom:1px solid var(--border);flex-wrap:wrap;}',
      '@media (max-width:720px){.w6-cell{min-height:56px;} .w6-cell .w6-ev span.t{display:none;}}'
    ].join('');
    document.head.appendChild(css);
    $c('view-cal').insertAdjacentHTML('afterend',
      '<div id="view-content" style="display:none;"><div class="card">' +
      '<div class="card-title">Content Library</div>' +
      '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Share files, pages and videos with your clients \u2014 with everyone or hand-picked people, released straight away or on a schedule from each client\u2019s start date.</p>' +
      '<div class="w6-bar"><button class="btn btn-primary" id="w6c-add-file" type="button" style="font-size:12px;">Upload a file</button>' +
      '<button class="btn" id="w6c-add-editor" type="button" style="font-size:12px;">Write a page</button>' +
      '<button class="btn" id="w6c-add-link" type="button" style="font-size:12px;">Add a video link</button></div>' +
      '<div class="w6-bar" id="w6c-folders"></div><div id="w6c-list"><p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p></div></div></div>');
    var vc = $c('view-cal');
    Array.prototype.slice.call(vc.children).forEach(function(ch){ if (ch.id !== 'w6cal-card') ch.style.display = 'none'; });
    vc.insertAdjacentHTML('beforeend',
      '<div class="card" id="w6cal-card"><div class="card-title" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">Calendar' +
      ' <span class="w6badge" id="w6-req-badge" style="display:none;cursor:pointer;"></span></div>' +
      '<div class="w6-bar">' +
        '<button class="btn" id="w6-prev" type="button" style="font-size:12px;">\u2039</button>' +
        '<button class="btn" id="w6-today" type="button" style="font-size:12px;">Today</button>' +
        '<button class="btn" id="w6-next" type="button" style="font-size:12px;">\u203a</button>' +
        '<strong id="w6-label" style="font-size:14px;margin:0 6px;"></strong>' +
        '<span style="flex:1;"></span>' +
        '<button class="w6-pill" data-w6mode="month" type="button">Month</button>' +
        '<button class="w6-pill" data-w6mode="week" type="button">Week</button>' +
        '<button class="w6-pill" data-w6mode="list" type="button">List</button>' +
      '</div>' +
      '<div class="w6-bar">' +
        '<button class="btn btn-primary" id="w6-new-event" type="button" style="font-size:12px;">+ New event</button>' +
        '<button class="btn" id="w6-new-call" type="button" style="font-size:12px;">+ Book a call</button>' +
        '<span style="flex:1;"></span><span id="w6-kinds"></span>' +
      '</div>' +
      '<div id="w6-reqs" style="display:none;"></div>' +
      '<div id="w6-body"></div><div id="w6-daypanel"></div></div>');
    delete SOON_COPY.content;
    var calBtn = document.querySelector('.cp-item[data-go="calendar"]');
    if (calBtn) calBtn.insertAdjacentHTML('beforeend', '<span class="w6badge" id="w6-nav-badge" style="display:none;margin-left:auto;"></span>');
  })();

  /* ── data ── */
  function w6enc(x){ return encodeURIComponent(x); }
  function w6monday(d){ var x = new Date(d); var day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; }
  function w6range(){
    var c = w6.cursor, from, to;
    if (w6.mode === 'month'){
      var first = new Date(c.getFullYear(), c.getMonth(), 1);
      from = w6monday(first);
      to = new Date(from); to.setDate(to.getDate() + 42);
    } else if (w6.mode === 'week'){
      from = w6monday(c); to = new Date(from); to.setDate(to.getDate() + 7);
    } else {
      from = new Date(); from.setHours(0,0,0,0); to = new Date(from); to.setDate(to.getDate() + 60);
    }
    return { from: from, to: to };
  }
  async function w6load(){
    var r = w6range(), fi = r.from.toISOString(), ti = r.to.toISOString();
    var res = await Promise.all([
      rest('/coach_events?' + pscope() + '&status=neq.cancelled&starts_at=gte.' + w6enc(fi) + '&starts_at=lt.' + w6enc(ti) + '&order=starts_at.asc&limit=400').catch(function(){ return []; }),
      rest('/coach_sessions?' + pscope() + '&status=eq.scheduled&starts_at=gte.' + w6enc(fi) + '&starts_at=lt.' + w6enc(ti) + '&order=starts_at.asc&limit=200&select=id,member_email,title,starts_at,duration_minutes,link_url,notes').catch(function(){ return []; }),
      rest('/bookings?' + pscope() + '&status=eq.confirmed&starts_at=gte.' + w6enc(fi) + '&starts_at=lt.' + w6enc(ti) + '&order=starts_at.asc&limit=200&select=id,member_email,employer_name,starts_at,ends_at,service_id,meeting_link,delivery_mode').catch(function(){ return []; }),
      rest('/bookings?' + pscope() + '&status=in.(pending_payment,requested)&starts_at=gte.' + w6enc(new Date(Date.now() - 864e5).toISOString()) + '&order=starts_at.asc&limit=100&select=id,member_email,employer_name,starts_at,ends_at,service_id,status,created_at').catch(function(){ return []; }),
      rest('/booking_services?' + pscope() + '&select=id,title,duration_min').catch(function(){ return []; })
    ]);
    var svc = {}; (res[4] || []).forEach(function(s){ svc[s.id] = s; });
    var items = [];
    (res[0] || []).forEach(function(e){
      items.push({ src: 'event', id: e.id, kind: e.kind, title: e.title, who: e.member_email, t: e.starts_at, end: e.ends_at,
        allDay: e.all_day, color: e.color || W6_KIND_COLORS[e.kind] || W6_KIND_COLORS.other, raw: e, done: e.status === 'done' });
    });
    (res[1] || []).forEach(function(s){
      items.push({ src: 'call', id: s.id, kind: 'call', title: s.title, who: s.member_email, t: s.starts_at,
        end: new Date(new Date(s.starts_at).getTime() + (s.duration_minutes || 30) * 60000).toISOString(),
        allDay: false, color: W6_KIND_COLORS.call, link: s.link_url, raw: s });
    });
    (res[2] || []).forEach(function(b){
      var sv = svc[b.service_id] || {};
      items.push({ src: 'booking', id: b.id, kind: 'appointment', title: (sv.title || 'Booked session'), who: b.member_email || b.employer_name,
        t: b.starts_at, end: b.ends_at, allDay: false, color: W6_KIND_COLORS.appointment, link: b.meeting_link, raw: b });
    });
    items.sort(function(a, b){ return new Date(a.t) - new Date(b.t); });
    w6.items = items;
    w6.reqs = (res[3] || []).map(function(b){ var sv = svc[b.service_id] || {}; b._service = sv.title || 'Session'; return b; });
    w6badge();
  }
  function w6badge(){
    var n = w6.reqs.length;
    ['w6-req-badge','w6-nav-badge'].forEach(function(id){
      var el = $c(id); if (!el) return;
      el.style.display = n ? '' : 'none';
      el.textContent = n + (id === 'w6-req-badge' ? ' request' + (n === 1 ? '' : 's') : '');
    });
  }
  async function w6badgeBoot(){
    try {
      var rows = await rest('/bookings?' + pscope() + '&status=in.(pending_payment,requested)&starts_at=gte.' + w6enc(new Date(Date.now() - 864e5).toISOString()) + '&limit=100&select=id') || [];
      w6.reqs = w6.reqs.length ? w6.reqs : rows;
      var el = $c('w6-nav-badge');
      if (el){ el.style.display = rows.length ? '' : 'none'; el.textContent = rows.length; }
    } catch (_){}
  }
  setTimeout(function(){ var t = setInterval(function(){ if (!partnerId) return; clearInterval(t); w6badgeBoot(); }, 800); }, 1200);

  function w6who(email){
    if (!email) return '';
    var c = roster.find(function(x){ return x.member_email === email; });
    return c ? nameOf(c) : email;
  }
  function w6time(t){ return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function w6visible(){ return w6.items.filter(function(it){ return !w6.hideKinds[it.kind]; }); }

  /* ── calLoad SHADOW: month/week/list grid (both go() versions route here) ── */
  async function calLoad(){
    var body = $c('w6-body');
    if (!body) return;
    body.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    await w6load();
    document.querySelectorAll('[data-w6mode]').forEach(function(b){ b.classList.toggle('on', b.dataset.w6mode === w6.mode); });
    $c('w6-kinds').innerHTML = W6_KINDS.map(function(k){
      return '<span class="w6-kchip' + (w6.hideKinds[k] ? ' off' : '') + '" data-w6kind="' + k + '"><span class="w6-dot" style="background:' + W6_KIND_COLORS[k] + ';"></span>' + k + '</span>';
    }).join(' ');
    document.querySelectorAll('[data-w6kind]').forEach(function(ch){
      ch.addEventListener('click', function(){ w6.hideKinds[ch.dataset.w6kind] = !w6.hideKinds[ch.dataset.w6kind]; w6render(); });
    });
    w6renderReqs();
    w6render();
  }
  function w6render(){
    var body = $c('w6-body'); $c('w6-daypanel').innerHTML = '';
    var items = w6visible();
    if (w6.mode === 'month'){
      var c = w6.cursor;
      $c('w6-label').textContent = c.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      var start = w6monday(new Date(c.getFullYear(), c.getMonth(), 1));
      var today = new Date(); today.setHours(0,0,0,0);
      var html = '<div class="w6-grid">' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(d){ return '<div class="w6-dow">' + d + '</div>'; }).join('');
      for (var i = 0; i < 42; i++){
        var d = new Date(start); d.setDate(d.getDate() + i);
        var dayItems = items.filter(function(it){ var t = new Date(it.t); return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate(); });
        var cls = 'w6-cell' + (d.getMonth() !== c.getMonth() ? ' dim' : '') + (d.getTime() === today.getTime() ? ' today' : '');
        html += '<div class="' + cls + '" data-w6day="' + d.toISOString() + '"><div class="dn">' + d.getDate() + '</div>' +
          dayItems.slice(0, 3).map(function(it){
            return '<div class="w6-ev"' + (it.done ? ' style="opacity:.5;text-decoration:line-through;"' : '') + '><span class="w6-dot" style="background:' + it.color + ';"></span><span class="t">' + (it.allDay ? '' : w6time(it.t) + ' ') + '</span>' + esc(it.title) + '</div>';
          }).join('') +
          (dayItems.length > 3 ? '<div style="font-size:10px;color:var(--text-muted);">+' + (dayItems.length - 3) + ' more</div>' : '') + '</div>';
      }
      body.innerHTML = html + '</div>';
      body.querySelectorAll('[data-w6day]').forEach(function(cell){ cell.addEventListener('click', function(){ w6dayPanel(new Date(cell.dataset.w6day)); }); });
    } else if (w6.mode === 'week'){
      var mon = w6monday(w6.cursor), sun = new Date(mon); sun.setDate(sun.getDate() + 6);
      $c('w6-label').textContent = mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' \u2013 ' + sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      var html2 = '<div class="w6-grid">';
      for (var j = 0; j < 7; j++){
        var dd = new Date(mon); dd.setDate(dd.getDate() + j);
        var di = items.filter(function(it){ var t = new Date(it.t); return t.toDateString() === dd.toDateString(); });
        html2 += '<div class="w6-wkcol"><div class="w6-dow">' + dd.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) + '</div>' +
          (di.map(function(it){ return w6itemRow(it, true); }).join('') || '<div style="font-size:11px;color:var(--text-muted);padding:4px 2px;">\u2014</div>') + '</div>';
      }
      body.innerHTML = html2 + '</div>';
      w6wireRows(body);
    } else {
      $c('w6-label').textContent = 'Next 60 days';
      if (!items.length){ body.innerHTML = '<div class="empty-state"><h3>Nothing scheduled</h3><p>Add an event or book a call and it lands here and on the grid.</p></div>'; return; }
      var lastDay = null, html3 = '';
      items.forEach(function(it){
        var d = new Date(it.t), day = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
        if (day !== lastDay){ html3 += '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 4px;">' + day + '</div>'; lastDay = day; }
        html3 += w6itemRow(it, false);
      });
      body.innerHTML = html3;
      w6wireRows(body);
    }
  }
  function w6itemRow(it, compact){
    var who = w6who(it.who);
    return '<div class="w6-row" style="' + (compact ? 'padding:5px 2px;border:none;' : '') + (it.done ? 'opacity:.55;' : '') + '">' +
      '<span class="w6-dot" style="background:' + it.color + ';"></span>' +
      '<div style="font-weight:700;font-size:' + (compact ? '11px' : '13px') + ';min-width:' + (compact ? '0' : '46px') + ';">' + (it.allDay ? 'All day' : w6time(it.t)) + '</div>' +
      '<div style="flex:1;min-width:' + (compact ? '0' : '160px') + ';"><div style="font-size:' + (compact ? '11px' : '13px') + ';font-weight:600;' + (it.done ? 'text-decoration:line-through;' : '') + '">' + esc(it.title) + (who ? ' \u00b7 ' + esc(who) : '') + '</div>' +
      (!compact ? '<div style="font-size:11px;color:var(--text-muted);">' + it.kind + (it.src === 'booking' ? ' \u00b7 booked session' : '') + '</div>' : '') + '</div>' +
      (!compact && it.link ? '<a class="btn" href="' + esc(it.link) + '" target="_blank" rel="noopener" style="font-size:11.5px;">Open link</a>' : '') +
      (!compact ? '<button class="btn" data-w6open="' + it.src + ':' + it.id + '" style="font-size:11.5px;">' + (it.src === 'event' ? 'Edit' : 'Manage') + '</button>' : '') +
      '</div>';
  }
  function w6wireRows(scope){
    scope.querySelectorAll('[data-w6open]').forEach(function(b){
      b.addEventListener('click', function(){
        var p = b.dataset.w6open.split(':'), it = w6.items.find(function(x){ return x.src === p[0] && String(x.id) === p.slice(1).join(':'); });
        if (!it) return;
        if (it.src === 'event') w6eventModal(it.raw);
        else w6manageModal(it);
      });
    });
  }
  function w6dayPanel(d){
    var items = w6visible().filter(function(it){ return new Date(it.t).toDateString() === d.toDateString(); });
    var pane = $c('w6-daypanel');
    pane.innerHTML = '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;">' +
      '<div style="display:flex;align-items:center;gap:10px;"><strong style="font-size:13px;">' + d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '</strong>' +
      '<button class="btn" id="w6-day-add" style="font-size:11.5px;" type="button">+ Event this day</button></div>' +
      (items.map(function(it){ return w6itemRow(it, false); }).join('') || '<p style="font-size:12.5px;color:var(--text-muted);margin-top:6px;">Nothing on this day.</p>') + '</div>';
    w6wireRows(pane);
    $c('w6-day-add').addEventListener('click', function(){ w6eventModal(null, d); });
  }

  /* ── requests inbox (#34) ── */
  function w6renderReqs(){
    var box = $c('w6-reqs');
    if (!w6.reqs.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
    box.style.display = w6.showReqs ? '' : 'none';
    box.innerHTML = '<div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:12px;background:var(--surface-2);">' +
      '<div style="font-size:12.5px;font-weight:700;margin-bottom:6px;">Booking requests</div>' +
      w6.reqs.map(function(b){
        var who = b.member_email ? w6who(b.member_email) : (b.employer_name || 'Employer');
        return '<div class="w6-row"><div style="flex:1;min-width:180px;"><div style="font-size:13px;font-weight:600;">' + esc(b._service) + ' \u00b7 ' + esc(who) + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);">' + new Date(b.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + w6time(b.starts_at) + ' \u00b7 ' + (b.status === 'pending_payment' ? 'awaiting your payment confirmation' : 'requested') + '</div></div>' +
          (b.status === 'pending_payment' ? '<button class="btn btn-primary" data-w6conf="' + b.id + '" style="font-size:11.5px;">Confirm paid</button>' : '') +
          '<button class="btn" data-w6decl="' + b.id + '" style="font-size:11.5px;">Decline</button></div>';
      }).join('') +
      '<p style="font-size:11px;color:var(--text-muted);margin-top:6px;">Confirm once the payment has landed in your account \u2014 your client gets a confirmation email and a reminder an hour before.</p></div>';
    box.querySelectorAll('[data-w6conf]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        btn.disabled = true; btn.textContent = 'Confirming\u2026';
        try {
          var t = await jwt();
          var r = await fetch(SUPA_URL + '/functions/v1/booking-paid-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: SUPA_ANON, Authorization: 'Bearer ' + t },
            body: JSON.stringify({ id: btn.dataset.w6conf })
          });
          var j = await r.json();
          if (!j.ok) throw new Error(j.error || r.status);
          calLoad();
        } catch(e){ alert('Confirm failed: ' + e.message); btn.disabled = false; btn.textContent = 'Confirm paid'; }
      });
    });
    box.querySelectorAll('[data-w6decl]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        if (!confirm('Decline this request? The slot frees up straight away.')) return;
        btn.disabled = true;
        try {
          await rest('/bookings?id=eq.' + btn.dataset.w6decl + '&' + pscope(), { method: 'PATCH', body: { status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'coach_declined' } });
          calLoad();
        } catch(e){ alert('Decline failed: ' + e.message); btn.disabled = false; }
      });
    });
  }

  /* ── event editor (#33) ── */
  function w6modal(html){
    var m = document.createElement('div'); m.className = 'w6-modal'; m.innerHTML = '<div class="w6-box">' + html + '</div>';
    m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
    document.body.appendChild(m); return m;
  }
  function w6dtLocal(iso){
    var d = iso ? new Date(iso) : new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
  function w6eventModal(ev, presetDate, presetClient){
    var isNew = !ev;
    var clients = roster.filter(function(c){ return c.status !== 'archived'; });
    var start = ev ? ev.starts_at : (presetDate ? new Date(presetDate.getFullYear(), presetDate.getMonth(), presetDate.getDate(), 9, 0) : null);
    var m = w6modal(
      '<div class="card-title" style="margin-bottom:12px;">' + (isNew ? 'New event' : 'Edit event') + '</div>' +
      '<div class="field-row"><div class="field"><label>Type</label><select id="w6e-kind">' + W6_KINDS.map(function(k){ return '<option value="' + k + '"' + ((ev ? ev.kind : 'event') === k ? ' selected' : '') + '>' + k.charAt(0).toUpperCase() + k.slice(1) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Colour</label><div style="display:flex;gap:8px;align-items:center;"><input id="w6e-color" type="color" value="' + ((ev && ev.color) || W6_KIND_COLORS[(ev ? ev.kind : 'event')]) + '" style="width:44px;height:32px;padding:0;border:none;background:none;"/><label style="font-size:11px;color:var(--text-muted);display:flex;gap:5px;align-items:center;"><input type="checkbox" id="w6e-autocol"' + (ev && ev.color ? '' : ' checked') + '/> match type</label></div></div></div>' +
      '<div class="field"><label>Title</label><input id="w6e-title" type="text" maxlength="160" value="' + esc(ev ? ev.title : '') + '"/></div>' +
      '<div class="field-row"><div class="field"><label>Client (optional)</label><select id="w6e-client"><option value="">\u2014 none \u2014</option>' + clients.map(function(c){ return '<option value="' + esc(c.member_email) + '"' + ((ev ? ev.member_email : presetClient) === c.member_email ? ' selected' : '') + '>' + esc(nameOf(c)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label style="margin-bottom:8px;">&nbsp;</label><label style="font-size:12px;display:flex;gap:7px;align-items:center;"><input type="checkbox" id="w6e-notify"' + (ev && ev.notify_client ? ' checked' : '') + '/> Notify them (push, 1h before)</label></div></div>' +
      '<div class="field-row"><div class="field"><label>Starts</label><input id="w6e-start" type="datetime-local" value="' + w6dtLocal(start) + '"/></div>' +
      '<div class="field"><label>Ends (optional)</label><input id="w6e-end" type="datetime-local" value="' + (ev && ev.ends_at ? w6dtLocal(ev.ends_at) : '') + '"/></div></div>' +
      '<div class="field"><label style="font-size:12px;display:flex;gap:7px;align-items:center;"><input type="checkbox" id="w6e-allday"' + (ev && ev.all_day ? ' checked' : '') + '/> All-day</label></div>' +
      '<div class="field"><label>Notes (optional)</label><input id="w6e-notes" type="text" maxlength="1000" value="' + esc(ev ? (ev.notes || '') : '') + '"/></div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary" id="w6e-save" type="button" style="font-size:12px;">' + (isNew ? 'Add to calendar' : 'Save') + '</button>' +
        (!isNew && ev.status !== 'done' ? '<button class="btn" id="w6e-done" type="button" style="font-size:12px;">Mark done</button>' : '') +
        (!isNew ? '<button class="btn" id="w6e-del" type="button" style="font-size:12px;">Cancel event</button>' : '') +
        '<span id="w6e-msg" style="font-size:12px;color:var(--text-muted);"></span></div>'
    );
    m.querySelector('#w6e-color').addEventListener('input', function(){ m.querySelector('#w6e-autocol').checked = false; });
    m.querySelector('#w6e-save').addEventListener('click', async function(){
      var msg = m.querySelector('#w6e-msg');
      var title = m.querySelector('#w6e-title').value.trim();
      var when = m.querySelector('#w6e-start').value;
      if (!title){ msg.textContent = 'Give it a title.'; return; }
      if (!when){ msg.textContent = 'Pick a start.'; return; }
      var endv = m.querySelector('#w6e-end').value;
      var body = {
        partner_id: partnerId,
        kind: m.querySelector('#w6e-kind').value,
        title: title,
        notes: m.querySelector('#w6e-notes').value.trim() || null,
        color: m.querySelector('#w6e-autocol').checked ? null : m.querySelector('#w6e-color').value,
        member_email: m.querySelector('#w6e-client').value || null,
        starts_at: new Date(when).toISOString(),
        ends_at: endv ? new Date(endv).toISOString() : null,
        all_day: m.querySelector('#w6e-allday').checked,
        notify_client: m.querySelector('#w6e-notify').checked && !!m.querySelector('#w6e-client').value
      };
      this.disabled = true; msg.textContent = 'Saving\u2026';
      try {
        if (isNew) await rest('/coach_events', { method: 'POST', body: body });
        else await rest('/coach_events?id=eq.' + ev.id, { method: 'PATCH', body: body });
        m.remove(); calLoad();
      } catch(e){ msg.textContent = 'Save failed: ' + e.message; this.disabled = false; }
    });
    if (!isNew){
      var doneBtn = m.querySelector('#w6e-done');
      if (doneBtn) doneBtn.addEventListener('click', async function(){
        try { await rest('/coach_events?id=eq.' + ev.id, { method: 'PATCH', body: { status: 'done' } }); m.remove(); calLoad(); } catch(e){ alert(e.message); }
      });
      m.querySelector('#w6e-del').addEventListener('click', async function(){
        if (!confirm('Cancel this event?' + (ev.notify_client ? ' Any pending notification is withdrawn too.' : ''))) return;
        try { await rest('/coach_events?id=eq.' + ev.id, { method: 'PATCH', body: { status: 'cancelled' } }); m.remove(); calLoad(); } catch(e){ alert(e.message); }
      });
    }
  }

  /* ── call booking (coach_sessions contract unchanged — member Join card keeps working) ── */
  function w6callModal(presetClient){
    var clients = roster.filter(function(c){ return c.status !== 'archived'; });
    if (!clients.length){ alert('Add a client first.'); return; }
    var m = w6modal(
      '<div class="card-title" style="margin-bottom:12px;">Book a call</div>' +
      '<p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">The call runs wherever you run it \u2014 Zoom, Meet, FaceTime \u2014 paste the link and your client joins straight from their VYVE app.</p>' +
      '<div class="field-row"><div class="field"><label>Client</label><select id="w6s-client">' + clients.map(function(c){ return '<option value="' + esc(c.member_email) + '"' + (presetClient === c.member_email ? ' selected' : '') + '>' + esc(nameOf(c)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Title</label><input id="w6s-title" type="text" maxlength="120" placeholder="Monthly check-in call"/></div></div>' +
      '<div class="field-row"><div class="field"><label>Date &amp; time</label><input id="w6s-when" type="datetime-local"/></div>' +
      '<div class="field"><label>Length (mins)</label><input id="w6s-mins" type="number" min="5" step="5" value="30"/></div></div>' +
      '<div class="field"><label>Call link</label><input id="w6s-link" type="text" placeholder="https://zoom.us/j/\u2026"/></div>' +
      '<div class="field"><label>Notes for your client (optional)</label><input id="w6s-notes" type="text" maxlength="240"/></div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:12px;"><button class="btn btn-primary" id="w6s-save" type="button" style="font-size:12px;">Book it</button><span id="w6s-msg" style="font-size:12px;color:var(--text-muted);"></span></div>'
    );
    m.querySelector('#w6s-save').addEventListener('click', async function(){
      var msg = m.querySelector('#w6s-msg');
      var title = m.querySelector('#w6s-title').value.trim(), when = m.querySelector('#w6s-when').value;
      var link = m.querySelector('#w6s-link').value.trim();
      if (!title){ msg.textContent = 'Give the call a title.'; return; }
      if (!when){ msg.textContent = 'Pick a date and time.'; return; }
      if (link && !/^https?:\/\//i.test(link)){ msg.textContent = 'The call link should start with https://'; return; }
      this.disabled = true; msg.textContent = 'Booking\u2026';
      try {
        await rest('/coach_sessions', { method: 'POST', body: {
          partner_id: partnerId, member_email: m.querySelector('#w6s-client').value, title: title,
          starts_at: new Date(when).toISOString(), duration_minutes: parseInt(m.querySelector('#w6s-mins').value) || 30,
          link_url: link || null, notes: m.querySelector('#w6s-notes').value.trim() || null
        }});
        m.remove(); calLoad();
      } catch(e){ msg.textContent = 'Booking failed: ' + e.message; this.disabled = false; }
    });
  }
  function w6manageModal(it){
    var who = w6who(it.who);
    var m = w6modal(
      '<div class="card-title" style="margin-bottom:10px;">' + esc(it.title) + '</div>' +
      '<p style="font-size:13px;">' + (who ? esc(who) + ' \u00b7 ' : '') + new Date(it.t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + ' ' + w6time(it.t) + '</p>' +
      (it.link ? '<p style="font-size:12.5px;"><a href="' + esc(it.link) + '" target="_blank" rel="noopener">Open the call link \u2192</a></p>' : '') +
      '<div style="display:flex;gap:10px;margin-top:12px;"><button class="btn" id="w6m-cancel" type="button" style="font-size:12px;">Cancel this ' + (it.src === 'call' ? 'call' : 'booking') + '</button><button class="btn" id="w6m-close" type="button" style="font-size:12px;">Close</button></div>'
    );
    m.querySelector('#w6m-close').addEventListener('click', function(){ m.remove(); });
    m.querySelector('#w6m-cancel').addEventListener('click', async function(){
      if (!confirm(it.src === 'call' ? 'Cancel this call? Your client will stop seeing it in their app.' : 'Cancel this booked session?')) return;
      try {
        if (it.src === 'call') await rest('/coach_sessions?id=eq.' + it.id, { method: 'PATCH', body: { status: 'cancelled' } });
        else await rest('/bookings?id=eq.' + it.id + '&' + pscope(), { method: 'PATCH', body: { status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'coach_cancelled' } });
        m.remove(); calLoad();
      } catch(e){ alert('Cancel failed: ' + e.message); }
    });
  }

  /* calendar toolbar wiring */
  (function(){
    $c('w6-prev').addEventListener('click', function(){ var c = w6.cursor; if (w6.mode === 'week') c.setDate(c.getDate() - 7); else c.setMonth(c.getMonth() - 1); calLoad(); });
    $c('w6-next').addEventListener('click', function(){ var c = w6.cursor; if (w6.mode === 'week') c.setDate(c.getDate() + 7); else c.setMonth(c.getMonth() + 1); calLoad(); });
    $c('w6-today').addEventListener('click', function(){ w6.cursor = new Date(); calLoad(); });
    document.querySelectorAll('[data-w6mode]').forEach(function(b){
      b.addEventListener('click', function(){ w6.mode = b.dataset.w6mode; localStorage.setItem('w6cal_mode', w6.mode); calLoad(); });
    });
    $c('w6-new-event').addEventListener('click', function(){ w6eventModal(null); });
    $c('w6-new-call').addEventListener('click', function(){ w6callModal(); });
    $c('w6-req-badge').addEventListener('click', function(){ w6.showReqs = !w6.showReqs; w6renderReqs(); });
  })();

  /* ── content library (#35/#36) ── */
  var w6c = { items: [], folder: '__all', accessCache: {} };
  async function w6ContentLoad(){
    var list = $c('w6c-list');
    list.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);">Loading\u2026</p>';
    try { w6c.items = await rest('/coach_content_items?' + pscope() + '&active=eq.true&order=folder.asc.nullsfirst,sort.asc,created_at.desc&limit=300') || []; }
    catch(e){ list.innerHTML = '<p style="font-size:12.5px;color:#E8834A;">Load failed: ' + esc(e.message) + '</p>'; return; }
    var counts = {};
    try {
      var acc = await rest('/coach_content_access?' + pscope() + '&select=item_id') || [];
      acc.forEach(function(a){ counts[a.item_id] = (counts[a.item_id] || 0) + 1; });
    } catch(_){}
    w6c.counts = counts;
    var folders = {}; w6c.items.forEach(function(it){ if (it.folder) folders[it.folder] = 1; });
    $c('w6c-folders').innerHTML = ['__all'].concat(Object.keys(folders).sort()).map(function(f){
      return '<button type="button" class="w6-pill' + (w6c.folder === f ? ' on' : '') + '" data-w6f="' + esc(f) + '">' + (f === '__all' ? 'All' : esc(f)) + '</button>';
    }).join('');
    document.querySelectorAll('[data-w6f]').forEach(function(b){ b.addEventListener('click', function(){ w6c.folder = b.dataset.w6f; w6ContentRender(); document.querySelectorAll('[data-w6f]').forEach(function(x){ x.classList.toggle('on', x.dataset.w6f === w6c.folder); }); }); });
    w6ContentRender();
  }
  function w6ContentRender(){
    var list = $c('w6c-list');
    var items = w6c.items.filter(function(it){ return w6c.folder === '__all' || it.folder === w6c.folder; });
    if (!items.length){ list.innerHTML = '<div class="empty-state"><h3>Nothing here yet</h3><p>Upload a file, write a page or add a video link \u2014 then choose who sees it and when.</p></div>'; return; }
    var ICON = { file: '\ud83d\udcc4', editor: '\ud83d\udcdd', link: '\u25b6\ufe0e' };
    list.innerHTML = items.map(function(it){
      var aud = it.audience === 'all' ? 'All clients' : ((w6c.counts[it.id] || 0) + ' selected');
      return '<div class="w6-row"><span style="font-size:16px;">' + ICON[it.kind] + '</span>' +
        '<div style="flex:1;min-width:180px;"><div style="font-size:13px;font-weight:600;">' + esc(it.title) +
        (it.folder ? '<span class="w6-chip">' + esc(it.folder) + '</span>' : '') +
        '<span class="w6-chip">' + aud + '</span>' +
        (it.drip_days != null ? '<span class="w6-chip">day ' + it.drip_days + '</span>' : '') + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + (it.kind === 'file' ? esc(it.file_name || '') : it.kind === 'link' ? esc(it.url || '') : 'written page') + ' \u00b7 added ' + new Date(it.created_at).toLocaleDateString('en-GB') + '</div></div>' +
        (it.kind === 'file' ? '<button class="btn" data-w6cv="' + it.id + '" style="font-size:11.5px;">View</button>' : it.kind === 'link' ? '<a class="btn" href="' + esc(it.url) + '" target="_blank" rel="noopener" style="font-size:11.5px;">Open</a>' : '') +
        '<button class="btn" data-w6ce="' + it.id + '" style="font-size:11.5px;">Edit</button>' +
        '<button class="btn" data-w6cd="' + it.id + '" style="font-size:11.5px;">Remove</button></div>';
    }).join('');
    list.querySelectorAll('[data-w6cv]').forEach(function(b){
      b.addEventListener('click', async function(){
        var it = w6c.items.find(function(x){ return x.id === b.dataset.w6cv; });
        if (!it || !it.storage_path) return;
        b.disabled = true;
        try {
          var s = await sb().storage.from('coach-content').createSignedUrl(it.storage_path, 3600);
          if (s.error) throw s.error;
          window.open(s.data.signedUrl, '_blank', 'noopener');
        } catch(e){ alert('Could not open: ' + (e.message || e)); }
        b.disabled = false;
      });
    });
    list.querySelectorAll('[data-w6ce]').forEach(function(b){
      b.addEventListener('click', function(){ var it = w6c.items.find(function(x){ return x.id === b.dataset.w6ce; }); if (it) w6ContentModal(it.kind, it); });
    });
    list.querySelectorAll('[data-w6cd]').forEach(function(b){
      b.addEventListener('click', async function(){
        if (!confirm('Remove this from the library? Clients stop seeing it straight away. The file itself is kept.')) return;
        try { await rest('/coach_content_items?id=eq.' + b.dataset.w6cd, { method: 'PATCH', body: { active: false } }); w6ContentLoad(); } catch(e){ alert(e.message); }
      });
    });
  }
  async function w6ContentModal(kind, it){
    var isNew = !it;
    var clients = roster.filter(function(c){ return c.status !== 'archived'; });
    var selected = {};
    if (it && it.audience === 'selected'){
      try { (await rest('/coach_content_access?item_id=eq.' + it.id + '&select=member_email') || []).forEach(function(a){ selected[a.member_email] = 1; }); } catch(_){}
    }
    var folders = {}; w6c.items.forEach(function(x){ if (x.folder) folders[x.folder] = 1; });
    var kindTitle = { file: 'Upload a file', editor: 'Write a page', link: 'Add a video link' };
    var m = w6modal(
      '<div class="card-title" style="margin-bottom:12px;">' + (isNew ? kindTitle[kind] : 'Edit: ' + esc(it.title)) + '</div>' +
      '<div class="field"><label>Title</label><input id="w6cm-title" type="text" maxlength="160" value="' + esc(it ? it.title : '') + '"/></div>' +
      '<div class="field"><label>Folder (optional)</label><input id="w6cm-folder" type="text" maxlength="60" list="w6cm-fl" value="' + esc(it ? (it.folder || '') : '') + '" placeholder="e.g. Getting started"/><datalist id="w6cm-fl">' + Object.keys(folders).map(function(f){ return '<option value="' + esc(f) + '">'; }).join('') + '</datalist></div>' +
      (kind === 'file'
        ? '<div class="field"><label>' + (isNew ? 'File (PDF, Word, Excel, MP4, MOV, AVI or MP3)' : 'Replace file (optional)') + '</label><input id="w6cm-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi,.mp3"/><div id="w6cm-fst" style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">' + (it && it.file_name ? 'Currently: ' + esc(it.file_name) : '') + '</div></div>'
        : kind === 'link'
        ? '<div class="field"><label>YouTube or Vimeo link</label><input id="w6cm-url" type="text" value="' + esc(it ? (it.url || '') : '') + '" placeholder="https://youtu.be/\u2026"/></div>'
        : '<div class="field"><label>Page content</label><textarea id="w6cm-body" rows="8" maxlength="20000" style="width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;padding:8px 10px;resize:vertical;">' + esc(it ? (it.body || '') : '') + '</textarea><div style="font-size:11px;color:var(--text-muted);margin-top:3px;">Plain text \u2014 line breaks are kept exactly as you write them.</div></div>') +
      '<div class="field"><label>Who sees it</label>' +
        '<label style="font-size:12.5px;display:flex;gap:7px;align-items:center;margin-bottom:5px;"><input type="radio" name="w6cm-aud" value="all"' + (!it || it.audience === 'all' ? ' checked' : '') + '/> All my clients</label>' +
        '<label style="font-size:12.5px;display:flex;gap:7px;align-items:center;"><input type="radio" name="w6cm-aud" value="selected"' + (it && it.audience === 'selected' ? ' checked' : '') + '/> Only the clients I pick</label>' +
        '<div id="w6cm-picker" style="display:' + (it && it.audience === 'selected' ? 'block' : 'none') + ';max-height:160px;overflow:auto;border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-top:7px;">' +
        (clients.map(function(c){ return '<label style="font-size:12px;display:flex;gap:7px;align-items:center;padding:2px 0;"><input type="checkbox" class="w6cm-cl" value="' + esc(c.member_email) + '"' + (selected[c.member_email] ? ' checked' : '') + '/> ' + esc(nameOf(c)) + (c.status !== 'active' ? ' <span style="color:var(--text-muted);">(invited)</span>' : '') + '</label>'; }).join('') || '<p style="font-size:12px;color:var(--text-muted);">No clients yet.</p>') + '</div></div>' +
      '<div class="field"><label>Release</label>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12.5px;">Available' +
        '<select id="w6cm-drip-mode"><option value=""' + (!it || it.drip_days == null ? ' selected' : '') + '>straight away</option><option value="drip"' + (it && it.drip_days != null ? ' selected' : '') + '>on a schedule</option></select>' +
        '<span id="w6cm-drip-wrap" style="display:' + (it && it.drip_days != null ? 'inline-flex' : 'none') + ';gap:6px;align-items:center;">\u2014 <input id="w6cm-drip" type="number" min="0" max="730" value="' + (it && it.drip_days != null ? it.drip_days : 7) + '" style="width:70px;"/> days after each client starts</span></div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">The clock starts from the day each client accepts your terms \u2014 everyone gets it at the same point in their journey.</div></div>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:12px;"><button class="btn btn-primary" id="w6cm-save" type="button" style="font-size:12px;">' + (isNew ? 'Add to library' : 'Save') + '</button><span id="w6cm-msg" style="font-size:12px;color:var(--text-muted);"></span></div>'
    );
    m.querySelectorAll('[name="w6cm-aud"]').forEach(function(r){ r.addEventListener('change', function(){ m.querySelector('#w6cm-picker').style.display = r.value === 'selected' && r.checked ? 'block' : 'none'; }); });
    m.querySelector('#w6cm-drip-mode').addEventListener('change', function(){ m.querySelector('#w6cm-drip-wrap').style.display = this.value === 'drip' ? 'inline-flex' : 'none'; });
    m.querySelector('#w6cm-save').addEventListener('click', async function(){
      var msg = m.querySelector('#w6cm-msg');
      var title = m.querySelector('#w6cm-title').value.trim();
      if (!title){ msg.textContent = 'Give it a title.'; return; }
      var aud = m.querySelector('[name="w6cm-aud"]:checked').value;
      var picked = Array.prototype.map.call(m.querySelectorAll('.w6cm-cl:checked'), function(x){ return x.value; });
      if (aud === 'selected' && !picked.length){ msg.textContent = 'Pick at least one client, or choose all.'; return; }
      var drip = m.querySelector('#w6cm-drip-mode').value === 'drip' ? Math.max(0, parseInt(m.querySelector('#w6cm-drip').value) || 0) : null;
      var body = { partner_id: partnerId, kind: kind, title: title, folder: m.querySelector('#w6cm-folder').value.trim() || null, audience: aud, drip_days: drip, updated_at: new Date().toISOString() };
      this.disabled = true; msg.textContent = 'Saving\u2026';
      try {
        if (kind === 'link'){
          var u = m.querySelector('#w6cm-url').value.trim();
          if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//i.test(u)) throw new Error('That needs to be a YouTube or Vimeo link.');
          body.url = u;
        } else if (kind === 'editor'){
          body.body = m.querySelector('#w6cm-body').value;
          if (!body.body.trim()) throw new Error('Write something first.');
        } else {
          var f = m.querySelector('#w6cm-file').files[0];
          if (isNew && !f) throw new Error('Choose a file.');
          if (f){
            var isVideo = /^video\//.test(f.type);
            var cap = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
            if (f.size > cap) throw new Error('Too big \u2014 ' + (isVideo ? '200MB' : '20MB') + ' max.');
            m.querySelector('#w6cm-fst').textContent = 'Uploading\u2026';
            var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
            var path = pprefix() + '/content/' + Date.now() + '-' + safe;
            var up = await sb().storage.from('coach-content').upload(path, f, { contentType: f.type || 'application/octet-stream', upsert: true });
            if (up.error) throw up.error;
            body.storage_path = path; body.file_name = f.name; body.mime = f.type; body.size_bytes = f.size;
          }
        }
        var saved;
        if (isNew){
          await rest('/coach_content_items', { method: 'POST', body: body });
          // rest() has no Prefer support (PM-984 lesson) — re-fetch the new row
          var re = await rest('/coach_content_items?' + pscope() + '&title=eq.' + w6enc(title) + '&order=created_at.desc&limit=1');
          saved = (re || [])[0];
        } else {
          await rest('/coach_content_items?id=eq.' + it.id, { method: 'PATCH', body: body });
          saved = it;
        }
        var itemId = saved && saved.id ? saved.id : (it && it.id);
        if (itemId){
          await rest('/coach_content_access?item_id=eq.' + itemId, { method: 'DELETE' }).catch(function(){});
          if (aud === 'selected' && picked.length){
            await rest('/coach_content_access', { method: 'POST', body: picked.map(function(em){ return { item_id: itemId, partner_id: partnerId, member_email: em }; }) });
          }
        }
        m.remove(); w6ContentLoad();
      } catch(e){ msg.textContent = 'Save failed: ' + (e.message || e); this.disabled = false; }
    });
  }
  (function(){
    $c('w6c-add-file').addEventListener('click', function(){ w6ContentModal('file'); });
    $c('w6c-add-editor').addEventListener('click', function(){ w6ContentModal('editor'); });
    $c('w6c-add-link').addEventListener('click', function(){ w6ContentModal('link'); });
  })();

  /* ── client-detail Calendar tab (deferred from Wave 5) ── */
  async function w6ClientCal(){
    var pane = $c('w5-pane'), c = w5.c, enc = encodeURIComponent(c.member_email);
    var since = new Date(Date.now() - 30 * 864e5).toISOString();
    var res = await Promise.all([
      rest('/coach_events?' + pscope() + '&member_email=eq.' + enc + '&status=neq.cancelled&starts_at=gte.' + w6enc(since) + '&order=starts_at.asc&limit=100').catch(function(){ return []; }),
      rest('/coach_sessions?' + pscope() + '&member_email=eq.' + enc + '&status=eq.scheduled&starts_at=gte.' + w6enc(since) + '&order=starts_at.asc&limit=50&select=id,title,starts_at,duration_minutes,link_url').catch(function(){ return []; }),
      rest('/bookings?' + pscope() + '&member_email=eq.' + enc + '&status=in.(confirmed,pending_payment)&starts_at=gte.' + w6enc(since) + '&order=starts_at.asc&limit=50&select=id,starts_at,status').catch(function(){ return []; })
    ]);
    if (w5.tab !== 'calendar') return;
    var rows = [];
    (res[0] || []).forEach(function(e){ rows.push({ t: e.starts_at, label: e.title, sub: e.kind + (e.notify_client ? ' \u00b7 notifies them' : ''), color: e.color || W6_KIND_COLORS[e.kind], raw: e, isEvent: true }); });
    (res[1] || []).forEach(function(s){ rows.push({ t: s.starts_at, label: s.title, sub: 'call \u00b7 ' + (s.duration_minutes || 30) + ' min', color: W6_KIND_COLORS.call, link: s.link_url }); });
    (res[2] || []).forEach(function(b){ rows.push({ t: b.starts_at, label: 'Booked session', sub: b.status === 'confirmed' ? 'confirmed' : 'awaiting payment confirmation', color: W6_KIND_COLORS.appointment }); });
    rows.sort(function(a, b){ return new Date(a.t) - new Date(b.t); });
    pane.innerHTML =
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary" id="w6cc-ev" type="button" style="font-size:12px;">+ Event for ' + esc(c.invited_first_name || 'them') + '</button>' +
      '<button class="btn" id="w6cc-call" type="button" style="font-size:12px;">+ Book a call</button></div>' +
      (rows.map(function(r){
        return '<div class="w6-row"><span class="w6-dot" style="background:' + r.color + ';"></span>' +
          '<div style="font-weight:700;font-size:12px;min-width:110px;">' + new Date(r.t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + w6time(r.t) + '</div>' +
          '<div style="flex:1;min-width:140px;"><div style="font-size:13px;font-weight:600;">' + esc(r.label) + '</div><div style="font-size:11px;color:var(--text-muted);">' + esc(r.sub) + '</div></div>' +
          (r.link ? '<a class="btn" href="' + esc(r.link) + '" target="_blank" rel="noopener" style="font-size:11.5px;">Open link</a>' : '') +
          (r.isEvent ? '<button class="btn" data-w6cce="' + r.raw.id + '" style="font-size:11.5px;">Edit</button>' : '') + '</div>';
      }).join('') || '<p style="font-size:12.5px;color:var(--text-muted);">Nothing scheduled with this client in the last 30 days or ahead.</p>');
    $c('w6cc-ev').addEventListener('click', function(){ w6eventModal(null, null, c.member_email); });
    $c('w6cc-call').addEventListener('click', function(){ w6callModal(c.member_email); });
    pane.querySelectorAll('[data-w6cce]').forEach(function(b){
      b.addEventListener('click', function(){ var e = (res[0] || []).find(function(x){ return x.id === b.dataset.w6cce; }); if (e) w6eventModal(e); });
    });
  }

  /* ── go SHADOW (byte-replicates the PM-983c version + view-content) ── */
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
    var V = ['view-dashboard','view-clients','view-leads','view-msgs','view-cal','view-plans','view-exercises','view-notifs','view-autos','view-profile','view-soon','view-settings','view-ci','view-daily','view-content'];
    var kindSel = null;
    var show = 'view-soon';
    if (view === 'dashboard') show = 'view-dashboard';
    else if (view === 'clients') show = 'view-clients';
    else if (view === 'clients_checkins') show = 'view-ci';
    else if (view === 'clients_daily') show = 'view-daily';
    else if (view === 'profile') show = 'view-profile';
    else if (view === 'settings' || view === 'terms') show = 'view-settings';
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
    if (view === 'profile') renderProfile();
    if (view === 'settings') loadCoachTerms();
    if (view === 'terms'){ loadCoachTerms(); setTimeout(function(){ var x = $c('ct-editor'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); }
    if (view === 'clients_checkins') ciLoad();
    if (view === 'clients_daily') dgLoad();
    if (SOON_COPY[view]){ $c('soon-title').textContent = SOON_COPY[view][0]; $c('soon-desc').textContent = SOON_COPY[view][1]; }
    var side = $c('cp-side'); if (side) side.classList.remove('open');
    var ov = $c('cp-overlay'); if (ov) ov.classList.remove('show');
  }
  /* ============================ end PM-989 Wave 6 ============================ */

