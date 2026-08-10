// =====================================================================
// VYVE Command Centre — Notifications (PM-913)
// Real per-person notifications on cc_notifications (RLS own-rows).
// - VYVE_NOTIFS.unread() -> count (bell dot, already wired in shell)
// - Bell click opens a dropdown panel: latest 30, mark read, mark all,
//   click-through to the route.
// - VYVE_NOTIFS.notify(recipients, {type,title,body,route,dedupeKey})
//   inserts rows (used by calendar invites, task assignment, RSVPs).
// Polls every 60s; refreshes on page changes.
// =====================================================================
(function(){
  'use strict';
  var items = [];
  var booted = false;
  var me = null;
  var myRsvps = {}; // event_id -> {response, comment}

  function S(){ return window.VYVE_SUPABASE; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function ago(iso){
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  }

  async function refresh(){
    var s = S();
    if (!s || !s.client) return;
    if (!me){
      try { me = (await s.getUserEmail() || '').toLowerCase(); } catch(e){ return; }
      if (!me) return;
    }
    var res = await s.client.from('cc_notifications')
      .select('id,type,title,body,route,data,read_at,created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    if (!res.error) items = res.data || [];

    // PM-914: pull my current responses for any invites in the list
    var evIds = items.filter(function(n){ return n.type === 'event' && n.data && n.data.event_id; })
      .map(function(n){ return n.data.event_id; });
    if (evIds.length){
      var rr = await s.client.from('cc_event_rsvps').select('event_id,response,comment').eq('email', me).in('event_id', evIds);
      myRsvps = {};
      (rr.error ? [] : (rr.data || [])).forEach(function(r){ myRsvps[r.event_id] = r; });
    }
    paintDot();
    var panel = document.getElementById('notif-panel');
    if (panel && panel.style.display !== 'none') renderPanel();
    window.dispatchEvent(new CustomEvent('vyve:notif'));
  }

  function unread(){
    return items.filter(function(n){ return !n.read_at; }).length;
  }

  function paintDot(){
    var dot = document.getElementById('topnav-bell-dot');
    if (!dot) return;
    var n = unread();
    dot.textContent = n > 9 ? '9+' : (n || '');
    dot.style.display = n > 0 ? 'inline-flex' : 'none';
  }

  async function markRead(id){
    var n = items.find(function(x){ return x.id === id; });
    if (n && !n.read_at){
      n.read_at = new Date().toISOString();
      paintDot();
      await S().client.from('cc_notifications').update({ read_at: n.read_at }).eq('id', id);
    }
  }

  async function markAll(){
    var now = new Date().toISOString();
    var ids = items.filter(function(n){ return !n.read_at; }).map(function(n){ return n.id; });
    items.forEach(function(n){ if (!n.read_at) n.read_at = now; });
    paintDot();
    renderPanel();
    if (ids.length) await S().client.from('cc_notifications').update({ read_at: now }).in('id', ids);
  }

  // recipients: array of emails (lowercased by caller or here). Skips self.
  async function notify(recipients, opts){
    var s = S();
    if (!s || !s.client || !recipients || !recipients.length) return;
    var meL = me || '';
    var seen = {};
    var rows = [];
    recipients.forEach(function(r){
      r = (r || '').toLowerCase().trim();
      if (!r || r === meL || seen[r]) return;
      seen[r] = true;
      rows.push({
        recipient_email: r,
        type: opts.type || 'info',
        title: opts.title,
        body: opts.body || null,
        route: opts.route || null,
        data: opts.data || {},
        dedupe_key: opts.dedupeKey ? opts.dedupeKey + ':' + r : null
      });
    });
    if (!rows.length) return;
    var res = await s.client.from('cc_notifications').insert(rows);
    if (res.error) console.warn('[notifs] insert failed', res.error.message);
  }

  // PM-914: Spond-style respond straight from a notification.
  async function respond(notif, response, comment){
    var evId = notif.data.event_id;
    var up = await S().client.from('cc_event_rsvps').upsert({
      event_id: evId, email: me, response: response,
      comment: (comment || '').trim() || null,
      updated_at: new Date().toISOString()
    });
    if (up.error) throw new Error(up.error.message);
    myRsvps[evId] = { event_id: evId, response: response, comment: (comment || '').trim() || null };
    markRead(notif.id);
    var owner = notif.data.owner_email;
    if (owner && owner !== me){
      var word = { going: 'is going to', maybe: 'might make', no: 'can\u2019t make' }[response];
      await notify([owner], {
        type: 'rsvp',
        title: me + ' ' + word + ' ' + (notif.data.title || 'your event'),
        body: (comment || '').trim() || null,
        route: '#/calendar',
        dedupeKey: 'rsvp:' + evId + ':' + me + ':' + response + ':' + Date.now()
      });
    }
  }

  // Expand team@ to every active non-partner person.
  async function expandTeam(list){
    list = list || [];
    if (list.map(function(x){ return (x||'').toLowerCase(); }).indexOf('team@vyvehealth.co.uk') < 0) return list;
    var res = await S().client.from('admin_users').select('email,role').eq('active', true);
    var all = (res.data || []).filter(function(a){ return a.role !== 'partner' && a.email !== 'team@vyvehealth.co.uk'; }).map(function(a){ return a.email; });
    var merged = {};
    list.concat(all).forEach(function(e){ e = (e||'').toLowerCase(); if (e && e !== 'team@vyvehealth.co.uk') merged[e] = true; });
    return Object.keys(merged);
  }

  var ICONS = {
    task: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    event: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    rsvp: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    message: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  function ensurePanel(){
    var p = document.getElementById('notif-panel');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'notif-panel';
    p.style.cssText = 'display:none;position:absolute;top:54px;right:60px;z-index:95;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-lg,0 12px 32px rgba(0,0,0,.2));width:360px;max-width:calc(100vw - 20px);max-height:70vh;overflow:hidden;display:none;flex-direction:column';
    document.body.appendChild(p);
    document.addEventListener('click', function(e){
      if (p.style.display !== 'none' && !p.contains(e.target) && e.target.id !== 'topnav-bell' && !e.target.closest('#topnav-bell')) hide();
    });
    window.addEventListener('vyve:page', hide);
    return p;
  }

  function renderPanel(){
    var p = ensurePanel();
    var html = '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border)">' +
      '<b style="font-size:13.5px">Notifications</b>' +
      '<button id="notif-markall" style="background:none;border:0;color:var(--accent);font-size:12px;font-weight:600;cursor:pointer">Mark all read</button></div>' +
      '<div style="overflow-y:auto;flex:1">';
    if (!items.length){
      html += '<div style="padding:26px 16px;text-align:center;color:var(--text-muted);font-size:13px">Nothing yet. Task assignments, meeting invites and replies land here.</div>';
    } else {
      items.forEach(function(n){
        var icon = ICONS[n.type] || ICONS.info;
        var isInvite = n.type === 'event' && n.data && n.data.event_id;
        var mine = isInvite ? myRsvps[n.data.event_id] : null;
        html += '<div class="notif-item" data-id="' + n.id + '" data-route="' + esc(n.route || '') + '" style="display:flex;gap:10px;padding:11px 14px;border-bottom:1px solid var(--border);cursor:pointer;' + (n.read_at && !isInvite ? 'opacity:.62' : '') + '">' +
          '<span style="color:var(--accent);flex-shrink:0;margin-top:2px">' + icon + '</span>' +
          '<span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:' + (n.read_at ? '500' : '700') + '">' + esc(n.title) + '</span>' +
          (n.body ? '<span style="display:block;font-size:12px;color:var(--text-muted)">' + esc(n.body) + '</span>' : '') +
          '<span style="display:block;font-size:10.5px;color:var(--text-dim);font-family:var(--font-mono);margin-top:2px">' + ago(n.created_at) + '</span>';
        if (isInvite){
          if (mine){
            var lbl = { going: 'Going', maybe: 'Maybe', no: 'Can\u2019t make it' }[mine.response] || mine.response;
            html += '<span class="notif-rsvp-done" style="display:block;margin-top:7px;font-size:12px;color:var(--success,#3a9c3a);font-weight:600">You responded: ' + lbl +
              (mine.comment ? ' <span style="color:var(--text-muted);font-weight:400">\u2014 \u201c' + esc(mine.comment) + '\u201d</span>' : '') +
              ' <a href="#" class="notif-rsvp-change" data-ev="' + esc(n.data.event_id) + '" style="color:var(--accent);font-size:11.5px">Change</a></span>';
          } else {
            html += buildRsvpControls(n, '');
          }
        }
        html += '</span>' +
          (!n.read_at ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:6px"></span>' : '') +
          '</div>';
      });
    }
    html += '</div>';
    p.innerHTML = html;
    p.querySelector('#notif-markall').addEventListener('click', markAll);
    p.querySelectorAll('.notif-item').forEach(function(el){
      el.addEventListener('click', function(e){
        if (e.target.closest('.notif-rsvp')) return; // RSVP controls handle themselves
        if (e.target.classList.contains('notif-rsvp-change')){
          e.preventDefault(); e.stopPropagation();
          var evId = e.target.getAttribute('data-ev');
          delete myRsvps[evId];
          renderPanel();
          return;
        }
        var id = parseInt(el.getAttribute('data-id'), 10);
        markRead(id);
        var route = el.getAttribute('data-route');
        hide();
        if (route) window.location.hash = route;
      });
    });
    wireRsvpControls(p);
  }

  function buildRsvpControls(n, preComment){
    var b = function(val, label){
      return '<button type="button" class="rsvp-pick" data-r="' + val + '" style="flex:1;padding:6px 4px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:12px;font-weight:600;cursor:pointer">' + label + '</button>';
    };
    return '<span class="notif-rsvp" data-nid="' + n.id + '" style="display:block;margin-top:8px" onclick="event.stopPropagation()">' +
      '<span style="display:flex;gap:6px">' + b('going','Going') + b('maybe','Maybe') + b('no','Can\u2019t') + '</span>' +
      '<span class="rsvp-more" style="display:none;margin-top:6px"><input class="rsvp-comment" placeholder="Add a note (optional) \u2014 e.g. at work until 8" value="' + esc(preComment || '') + '" style="width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:12px;margin-bottom:6px"/>' +
      '<button type="button" class="rsvp-send btn btn-primary btn-sm" style="width:100%">Send response</button></span></span>';
  }

  function wireRsvpControls(p){
    p.querySelectorAll('.notif-rsvp').forEach(function(box){
      var nid = parseInt(box.getAttribute('data-nid'), 10);
      var n = items.find(function(x){ return x.id === nid; });
      var chosen = '';
      box.querySelectorAll('.rsvp-pick').forEach(function(btn){
        btn.addEventListener('click', function(){
          chosen = btn.getAttribute('data-r');
          box.querySelectorAll('.rsvp-pick').forEach(function(x){
            var on = x === btn;
            x.style.background = on ? 'var(--accent)' : 'var(--surface)';
            x.style.color = on ? '#fff' : 'var(--text)';
            x.style.borderColor = on ? 'var(--accent)' : 'var(--border)';
          });
          box.querySelector('.rsvp-more').style.display = 'block';
          box.querySelector('.rsvp-comment').focus();
        });
      });
      var send = box.querySelector('.rsvp-send');
      send.addEventListener('click', async function(){
        if (!chosen || !n) return;
        send.disabled = true; send.textContent = 'Sending\u2026';
        try {
          await respond(n, chosen, box.querySelector('.rsvp-comment').value);
          renderPanel();
        } catch(e){
          alert('Response failed: ' + (e.message || 'unknown'));
          send.disabled = false; send.textContent = 'Send response';
        }
      });
    });
  }

  function show(){ var p = ensurePanel(); renderPanel(); p.style.display = 'flex'; }
  function hide(){ var p = document.getElementById('notif-panel'); if (p) p.style.display = 'none'; }
  function toggle(){ var p = ensurePanel(); if (p.style.display === 'none') show(); else hide(); }

  function boot(){
    if (booted) return;
    booted = true;
    refresh();
    setInterval(function(){ if (!document.hidden) refresh(); }, 60000);
    // bell click — the shell's bell button
    var bell = document.getElementById('topnav-bell');
    if (bell) bell.addEventListener('click', function(e){ e.stopPropagation(); toggle(); });
  }

  window.VYVE_NOTIFS = {
    unread: unread,
    refresh: refresh,
    notify: notify,
    expandTeam: expandTeam,
    toggle: toggle
  };

  window.addEventListener('vyve:user', function(){ setTimeout(boot, 300); });
  setTimeout(boot, 800);
})();
