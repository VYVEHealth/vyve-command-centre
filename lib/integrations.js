// =====================================================================
// VYVE Command Centre — Integrations
// Outbound channels: Slack webhook, Gmail compose (mailto), Google Calendar event.
// Plus a daily-digest builder that summarises today's hub state into a Slack-ready payload.
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.integrations';
  var DIGEST_KEY  = 'vyve.integrations.lastDigest';

  function load(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e){ return {}; }
  }
  function save(cfg){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg || {})); return true; }
    catch(e){ return false; }
  }
  function get(key){ return load()[key]; }
  function set(key, value){
    var cfg = load(); cfg[key] = value; save(cfg); return value;
  }

  // ---------- Slack ----------
  // Send a message to Slack via an incoming webhook URL.
  // Returns a Promise<{ok, status}> 
  function slackSend(text, blocks){
    var url = get('slackWebhookUrl');
    if (!url) return Promise.resolve({ ok: false, status: 0, reason: 'No Slack webhook URL configured' });

    var payload = blocks ? { text: text, blocks: blocks } : { text: text };
    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',                                   // Slack returns CORS-restricted responses
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(){
      // no-cors means we can't read the response; assume success if fetch didn't throw
      return { ok: true, status: 200 };
    }).catch(function(err){
      return { ok: false, status: 0, reason: err.message || 'Slack send failed' };
    });
  }

  // ---------- Daily digest builder ----------
  function buildDailyDigest(){
    if (!window.VYVE_DATA) return { text: 'Daily digest unavailable', blocks: null };
    var D = window.VYVE_DATA;
    var today = D.startOfDay();

    // Top priorities (overdue + due today)
    var actionsOverdue = D.actions.overdue ? D.actions.overdue() : [];
    var actionsToday   = D.actions.todayOrOverdue ? D.actions.todayOrOverdue() : [];
    var tasksOpen      = D.tasks.all().filter(function(t){ return (t.status||'') !== 'done' && (t.status||'') !== 'complete'; });
    var tasksOverdue   = tasksOpen.filter(function(t){ var d = D.parseDate(t.due); return d && d < today; });
    var tasksToday     = tasksOpen.filter(function(t){ var d = D.parseDate(t.due); return d && d.toDateString() === new Date().toDateString(); });
    var compDueSoon    = D.compliance.dueSoon ? D.compliance.dueSoon(7) : [];
    var closingThisMonth = D.deals.closingSoon ? D.deals.closingSoon() : [];
    var sessionsToday  = (D.sessions.todayAndTomorrow ? D.sessions.todayAndTomorrow() : []).filter(function(s){
      var d = D.parseDate(s.date);
      return d && d.toDateString() === new Date().toDateString();
    });

    var lines = [];
    lines.push('*VYVE morning digest \u2014 ' + new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }) + '*');
    lines.push('');

    if (actionsOverdue.length) {
      lines.push(':rotating_light: *' + actionsOverdue.length + ' action plan' + (actionsOverdue.length === 1 ? '' : 's') + ' overdue*');
    }
    if (tasksOverdue.length) {
      lines.push(':warning: *' + tasksOverdue.length + ' task' + (tasksOverdue.length === 1 ? '' : 's') + ' overdue*');
    }
    if (actionsToday.length || tasksToday.length) {
      lines.push(':dart: Today: ' + actionsToday.length + ' action plans, ' + tasksToday.length + ' tasks due');
    }
    if (sessionsToday.length) {
      lines.push(':calendar: ' + sessionsToday.length + ' session' + (sessionsToday.length === 1 ? '' : 's') + ' scheduled today');
    }
    if (compDueSoon.length) {
      lines.push(':shield: ' + compDueSoon.length + ' compliance item' + (compDueSoon.length === 1 ? '' : 's') + ' due in the next 7 days');
    }
    if (closingThisMonth.length) {
      var total = closingThisMonth.reduce(function(s, d){ return s + (Number(d.value)||0); }, 0);
      lines.push(':moneybag: ' + closingThisMonth.length + ' deal' + (closingThisMonth.length === 1 ? '' : 's') + ' closing this month (\u00a3' + total.toLocaleString() + ')');
    }

    if (lines.length <= 2) {
      lines.push(':white_check_mark: Inbox zero \u2014 nothing pending. Have a great day.');
    }

    lines.push('');
    lines.push('Open the hub: <https://admin.vyvehealth.co.uk/#/inbox|Inbox> \u00b7 <https://admin.vyvehealth.co.uk/#/brief|Brief>');

    return { text: lines.join('\n'), blocks: null };
  }

  function sendDailyDigest(){
    var digest = buildDailyDigest();
    return slackSend(digest.text).then(function(res){
      if (res.ok) {
        set('lastDigestSentAt', new Date().toISOString());
        try { localStorage.setItem(DIGEST_KEY, JSON.stringify({ at: new Date().toISOString(), digest: digest })); } catch(e){}
      }
      return res;
    });
  }

  // ---------- Auto-send check ----------
  // Called on page load. If today's digest hasn't been sent yet and the user
  // has opted in, send it.
  function maybeSendDigestNow(){
    if (!get('slackWebhookUrl')) return;
    if (!get('digestAutoSend'))  return;
    var lastIso = get('lastDigestSentAt');
    if (lastIso) {
      var last = new Date(lastIso);
      var now = new Date();
      // Already sent today? skip
      if (last.toDateString() === now.toDateString()) return;
    }
    // Only fire after 6am local time
    if (new Date().getHours() < 6) return;
    sendDailyDigest().then(function(res){
      if (res.ok && window.VYVE_UI && window.VYVE_UI.toast) {
        window.VYVE_UI.toast('Daily digest posted to Slack', 'success');
      }
    });
  }

  // ---------- Gmail compose (mailto) ----------
  function gmailCompose(opts){
    opts = opts || {};
    var params = [];
    if (opts.subject) params.push('subject=' + encodeURIComponent(opts.subject));
    if (opts.body)    params.push('body=' + encodeURIComponent(opts.body));
    if (opts.cc)      params.push('cc=' + encodeURIComponent(opts.cc));
    if (opts.bcc)     params.push('bcc=' + encodeURIComponent(opts.bcc));

    // Use Gmail web compose URL if user prefers, else mailto
    if (get('useGmailWeb')) {
      var url = 'https://mail.google.com/mail/?view=cm&fs=1';
      if (opts.to) url += '&to=' + encodeURIComponent(opts.to);
      if (opts.subject) url += '&su=' + encodeURIComponent(opts.subject);
      if (opts.body) url += '&body=' + encodeURIComponent(opts.body);
      if (opts.cc) url += '&cc=' + encodeURIComponent(opts.cc);
      if (opts.bcc) url += '&bcc=' + encodeURIComponent(opts.bcc);
      window.open(url, '_blank', 'noopener');
    } else {
      var to = encodeURIComponent(opts.to || '');
      var mailto = 'mailto:' + to + (params.length ? '?' + params.join('&') : '');
      window.location.href = mailto;
    }
  }

  // Format a CRM deal into a draft email
  function emailForDeal(deal){
    var lines = [];
    lines.push('Hi,');
    lines.push('');
    lines.push('Following up on our conversation regarding ' + (deal.name || 'this opportunity') + '.');
    if (deal.value) lines.push('');
    if (deal.notes) {
      lines.push('A few notes on where we left things:');
      lines.push(deal.notes);
      lines.push('');
    }
    lines.push('Happy to jump on a call to discuss next steps.');
    lines.push('');
    lines.push('Best,');
    lines.push('Lewis');
    lines.push('');
    lines.push('--');
    lines.push('Lewis Vines \u00b7 CEO & Founder');
    lines.push('VYVE Health CIC');
    lines.push('Build health before it breaks.');
    return {
      to: deal.contact_email || '',
      subject: 'Re: ' + (deal.name || 'VYVE Health partnership'),
      body: lines.join('\n')
    };
  }

  // ---------- Google Calendar event ----------
  function googleCalendarUrl(opts){
    opts = opts || {};
    var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    if (opts.title) url += '&text=' + encodeURIComponent(opts.title);
    if (opts.start || opts.end) {
      var fmt = function(d){
        // Format: YYYYMMDDTHHMMSSZ
        var iso = (d instanceof Date ? d : new Date(d)).toISOString();
        return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };
      var dates = (opts.start ? fmt(opts.start) : '') + '/' + (opts.end ? fmt(opts.end) : '');
      url += '&dates=' + dates;
    }
    if (opts.location) url += '&location=' + encodeURIComponent(opts.location);
    if (opts.details)  url += '&details=' + encodeURIComponent(opts.details);
    if (opts.attendees && opts.attendees.length) {
      url += '&add=' + encodeURIComponent(opts.attendees.join(','));
    }
    return url;
  }

  function calendarForSession(session){
    var start = window.VYVE_DATA ? window.VYVE_DATA.parseDate(session.date) : new Date(session.date);
    var end = start ? new Date(start.getTime() + (Number(session.duration_minutes) || 60) * 60000) : null;
    return googleCalendarUrl({
      title: session.title || 'VYVE session',
      start: start,
      end: end,
      location: session.location || '',
      details: session.notes || ''
    });
  }

  // ---------- Calendar sync (Make.com bridge to Google Calendar) ----------
  // POSTs hub calendar events to a Make webhook which forwards to GCal.
  // The webhook URL is configurable via Settings → Outbound → Calendar sync.
  // Default URL is hard-coded from the Make-MCP scenario build, but can be overridden.
  var CALENDAR_SYNC_DEFAULT_URL = 'https://hook.eu1.make.com/978wly6dap3aur9tg96ir44gzjgoqpgm';

  function getCalendarSyncUrl(){
    return get('calendarSyncUrl') || CALENDAR_SYNC_DEFAULT_URL;
  }

  function isCalendarSyncEnabled(){
    return !!get('calendarSyncEnabled');
  }

  // Push an event to Google Calendar via the Make webhook.
  // action: 'create' | 'update' | 'delete'
  // event: { id, gcal_event_id?, title, description, start_at, end_at, location, attendees, visibility }
  // Returns Promise<{ ok, gcal_event_id?, meet_url? }>
  function syncCalendarEvent(action, event){
    if (!isCalendarSyncEnabled()){
      return Promise.resolve({ ok: false, skipped: true, reason: 'Calendar sync disabled in Settings' });
    }
    var url = getCalendarSyncUrl();
    if (!url){
      return Promise.resolve({ ok: false, reason: 'No calendar sync webhook URL configured' });
    }
    var payload = { action: action, event: event };
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res){
      return res.json().then(function(body){ return { ok: res.ok, status: res.status, body: body }; }).catch(function(){
        return { ok: res.ok, status: res.status, body: null };
      });
    }).catch(function(err){
      return { ok: false, reason: err.message || 'Network error' };
    });
  }

  // ---------- Public API ----------
  window.VYVE_INTEGRATIONS = {
    get: get,
    set: set,
    load: load,
    save: save,

    slackSend: slackSend,
    buildDailyDigest: buildDailyDigest,
    sendDailyDigest: sendDailyDigest,
    maybeSendDigestNow: maybeSendDigestNow,

    gmailCompose: gmailCompose,
    emailForDeal: emailForDeal,

    googleCalendarUrl: googleCalendarUrl,
    calendarForSession: calendarForSession,

    getCalendarSyncUrl: getCalendarSyncUrl,
    isCalendarSyncEnabled: isCalendarSyncEnabled,
    syncCalendarEvent: syncCalendarEvent,
    CALENDAR_SYNC_DEFAULT_URL: CALENDAR_SYNC_DEFAULT_URL
  };

  // Auto-fire on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(maybeSendDigestNow, 2000); });
  } else {
    setTimeout(maybeSendDigestNow, 2000);
  }
})();
