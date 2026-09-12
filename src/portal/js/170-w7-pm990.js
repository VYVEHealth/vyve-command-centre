  /* ============================ PM-990 Wave 7 ============================
     Settings + compliance (gap-map #45, #48, #49; #47 ships member-side).
     - renderProfile SHADOWED: #view-profile becomes the tabbed Account area.
       Overview  = coach public profile editor + completion bar (#48) — saved
                   via coach-provision-client v11 save_profile; media uploads
                   to coach-content p-<pid>/profile/ (member read via the new
                   ccontent_member_read_profile policy + get_my_coach_profile).
       Settings  = the two legacy #view-settings cards REPARENTED here (nodes
                   moved, listeners survive; parked back before each re-render
                   so innerHTML never destroys them) + notification prefs (#45,
                   save_notify_prefs → consulted by coach-notify v1 / cron 66).
       Data Consent (#49) = built in full, HIDDEN behind W7_DC_VISIBLE until
                   Lewis's wording is approved. Preview: localStorage
                   vyve_w7dc = '1'. Ship = flip the const, one-line commit.
     - go SHADOWED (byte-replicates the Wave 6 body; settings/terms now route
       into the Account area's Settings tab). #view-settings stays in the DOM
       (soft-kill rule) as the permanent parking spot for the legacy cards. */
  (function(){
    var st = document.createElement('style');
    st.textContent = '.w7-tabs{display:flex;gap:6px;border-bottom:1px solid var(--border);margin:0 0 16px;}' +
      '.w7-tabs button{background:none;border:none;border-bottom:2px solid transparent;padding:8px 12px;font:inherit;font-size:13px;color:var(--text-muted);cursor:pointer;}' +
      '.w7-tabs button.on{color:var(--text);border-bottom-color:#C9A84C;font-weight:700;}' +
      '.w7-field{margin-bottom:12px;}.w7-field label{display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;}' +
      '.w7-field input,.w7-field textarea{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font:inherit;font-size:13px;box-sizing:border-box;}' +
      '.w7-bar{height:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:99px;overflow:hidden;margin:6px 0 2px;}.w7-bar>div{height:100%;background:#C9A84C;}' +
      '.w7-nrow{display:flex;align-items:center;gap:14px;padding:9px 2px;border-bottom:1px solid var(--border);font-size:13px;}.w7-nrow .lbl{flex:1;}' +
      '.w7-nrow label{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-muted);cursor:pointer;}' +
      '.w7-grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;}@media(max-width:640px){.w7-grid2{grid-template-columns:1fr;}}' +
      '.w7-med{display:flex;align-items:center;gap:10px;}.w7-med img{width:52px;height:52px;border-radius:10px;object-fit:cover;border:1px solid var(--border);}';
    document.head.appendChild(st);
  })();

  var W7_DC_VISIBLE = false; /* Lewis-GATING (#49): flip to true when the Data Consent wording is approved */
  function w7DcOn(){ try { return W7_DC_VISIBLE || localStorage.getItem('vyve_w7dc') === '1'; } catch(_){ return W7_DC_VISIBLE; } }
  var W7_NOTIFY_DEFAULTS = { checkin: { email: true, push: true }, message: { email: true, push: true }, workout: { email: false, push: false }, cardio: { email: false, push: false }, habits: { email: false, push: false }, phase_ending: { email: true, push: false }, inactive5: { email: true, push: false } };
  var W7_EVENT_LABELS = [
    ['checkin', 'A client submits their check-in'],
    ['message', 'A client sends you a message'],
    ['workout', 'A client completes a workout'],
    ['cardio', 'A client logs cardio'],
    ['habits', 'Daily habits summary (arrives at your chosen time)'],
    ['phase_ending', 'A client\u2019s programme is ending (5 days and 1 day before)'],
    ['inactive5', 'A client goes quiet for 5 days']
  ];
  var w7Tab = 'overview', w7Acct = null, w7LegacyCards = null, w7Pend = {};

  function w7ParkLegacy(){
    var vs = $c('view-settings'); if (!vs) return;
    if (!w7LegacyCards) w7LegacyCards = Array.prototype.slice.call(vs.children);
    w7LegacyCards.forEach(function(n){ vs.appendChild(n); });
  }
  function w7MergedPrefs(){
    var raw = (w7Acct && w7Acct.coach_notification_prefs) || {};
    var se = (raw.events && typeof raw.events === 'object') ? raw.events : {};
    var ev = {};
    W7_EVENT_LABELS.forEach(function(pair){
      var k = pair[0], d = W7_NOTIFY_DEFAULTS[k], o = se[k] || {};
      ev[k] = { email: typeof o.email === 'boolean' ? o.email : d.email, push: typeof o.push === 'boolean' ? o.push : d.push };
    });
    var dt = /^\d{2}:\d{2}$/.test(String(raw.digest_time || '')) ? raw.digest_time : '18:00';
    return { events: ev, digest_time: dt };
  }
  function w7Completion(a){
    var pr = (a && a.coach_profile) || {};
    var checks = [pr.photo_path, a && a.name, a && a.slug, pr.phone, pr.website, (pr.facebook || pr.instagram), a && a.bio, pr.services, pr.target_customer, pr.welcome_video_url];
    var done = checks.filter(function(x){ return !!String(x || '').trim(); }).length;
    return Math.round(done / checks.length * 100);
  }
  function w7Field(id, label, val, ph, help){
    return '<div class="w7-field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" type="text" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '"/>' +
      (help ? '<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">' + esc(help) + '</div>' : '') + '</div>';
  }
  function w7Area(id, label, val, ph){
    return '<div class="w7-field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<textarea id="' + id + '" rows="3" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea></div>';
  }
  async function w7SignedInto(imgId, path){
    if (!path) return;
    try {
      var r = await sb().storage.from('coach-content').createSignedUrl(path, 3600);
      var el = $c(imgId);
      if (el && r.data && r.data.signedUrl){ el.src = r.data.signedUrl; el.style.display = ''; }
    } catch(_){}
  }
  function w7WireUpload(inputId, statusId, kind){
    var inp = $c(inputId); if (!inp) return;
    inp.addEventListener('change', async function(){
      var f = this.files && this.files[0];
      if (!f) return;
      var stEl = $c(statusId);
      if (!/^image\//.test(f.type)){ stEl.textContent = 'Image files only.'; return; }
      if (f.size > 5 * 1024 * 1024){ stEl.textContent = 'Too big \u2014 5MB max.'; return; }
      stEl.textContent = 'Uploading\u2026';
      try {
        var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
        var path = pprefix() + '/profile/' + kind + '-' + Date.now() + '-' + safe;
        var up = await sb().storage.from('coach-content').upload(path, f, { contentType: f.type, upsert: true });
        if (up.error) throw up.error;
        w7Pend[kind + '_path'] = path;
        stEl.textContent = 'Uploaded \u2014 hit Save profile to publish it.';
        w7SignedInto('w7-' + kind + '-img', path);
      } catch(e){ stEl.textContent = 'Upload failed: ' + (e.message || e); }
    });
  }

  function w7OverviewPane(){
    var a = w7Acct || {}, pr = a.coach_profile || {};
    var pct = w7Completion(a);
    return '<div style="margin-bottom:18px;"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);"><span>Profile completion</span><span>' + pct + '%</span></div>' +
      '<div class="w7-bar"><div style="width:' + pct + '%;"></div></div>' +
      '<div style="font-size:11.5px;color:var(--text-muted);">What you add here is what your clients see on your coach card in the VYVE app.</div></div>' +
      '<div class="w7-grid2">' +
      '<div class="w7-field"><label>Profile photo</label><div class="w7-med"><img id="w7-photo-img" style="display:none;" alt=""/><div><input id="w7-photo" type="file" accept="image/*" style="font-size:12px;"/><div id="w7-photo-st" style="font-size:11px;color:var(--text-muted);margin-top:3px;"></div></div></div></div>' +
      '<div class="w7-field"><label>Business logo (optional)</label><div class="w7-med"><img id="w7-logo-img" style="display:none;" alt=""/><div><input id="w7-logo" type="file" accept="image/*" style="font-size:12px;"/><div id="w7-logo-st" style="font-size:11px;color:var(--text-muted);margin-top:3px;"></div></div></div></div>' +
      '</div>' +
      '<div class="w7-grid2">' +
      w7Field('w7-name', 'Display name', a.name, 'Your coaching name', '') +
      '<div class="w7-field"><label>Username</label><input type="text" value="' + esc(a.slug || '') + '" disabled/><div style="font-size:11px;color:var(--text-muted);margin-top:3px;">Sets your public links (lead form, invites). Contact the VYVE team to change it.</div></div>' +
      w7Field('w7-phone', 'Phone (optional)', pr.phone, '+44\u2026', '') +
      w7Field('w7-website', 'Website (optional)', pr.website, 'https://\u2026', '') +
      w7Field('w7-fb', 'Facebook (optional)', pr.facebook, 'facebook.com/\u2026', '') +
      w7Field('w7-ig', 'Instagram (optional)', pr.instagram, '@yourhandle', '') +
      '</div>' +
      w7Area('w7-bio', 'About you', a.bio, 'A few lines about who you are and how you coach.') +
      w7Area('w7-services', 'Services offered', pr.services, 'e.g. 1:1 online coaching, programming, nutrition support\u2026') +
      w7Field('w7-target', 'Who you coach', pr.target_customer, 'e.g. busy professionals getting back into training', '') +
      w7Field('w7-video', 'Welcome video (optional)', pr.welcome_video_url, 'YouTube or Vimeo link', 'A short intro your clients can watch.') +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:6px;"><button class="btn btn-primary" id="w7-prof-save" type="button" style="font-size:12.5px;">Save profile</button><span id="w7-prof-msg" style="font-size:12px;color:var(--text-muted);"></span></div>';
  }
  function w7SettingsPane(){
    var p = w7MergedPrefs();
    var rows = W7_EVENT_LABELS.map(function(pair){
      var k = pair[0], v = p.events[k];
      return '<div class="w7-nrow"><span class="lbl">' + esc(pair[1]) + '</span>' +
        '<label><input type="checkbox" data-w7ev="' + k + '" data-w7ch="email"' + (v.email ? ' checked' : '') + '/> Email</label>' +
        '<label><input type="checkbox" data-w7ev="' + k + '" data-w7ch="push"' + (v.push ? ' checked' : '') + '/> Push</label></div>';
    }).join('');
    return '<div class="card" style="margin:0 0 18px;"><h3 style="margin:0 0 6px;font-size:14px;">Notifications</h3>' +
      '<p style="font-size:12px;color:var(--text-muted);margin:0 0 8px;">Choose how you hear about client activity. Email goes to your coach email; push arrives on your phone through the VYVE app.</p>' +
      rows +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap;"><label style="font-size:12.5px;color:var(--text-muted);">Daily habits summary time</label><input id="w7-digest" type="time" value="' + esc(p.digest_time) + '" style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font:inherit;font-size:12.5px;"/>' +
      '<button class="btn btn-primary" id="w7-np-save" type="button" style="font-size:12.5px;">Save notification settings</button><span id="w7-np-msg" style="font-size:12px;color:var(--text-muted);"></span></div></div>' +
      '<div id="w7-set-legacy"></div>';
  }
  function w7ConsentPane(){
    return '<div style="max-width:720px;font-size:13.5px;line-height:1.7;color:var(--text);">' +
      '<h3 style="margin:0 0 6px;font-size:14px;">What your clients share with you</h3>' +
      '<p style="color:var(--text-muted);margin:0 0 14px;">When a client accepts your coaching terms on their first login, they give explicit consent for you to see: their profile basics (name, age, weight unit), workouts and exercise logs, daily habits, nutrition logs and weight entries, cardio, the plans you assign them, their onboarding and check-in answers (including any photos they choose to submit), and the messages between you.</p>' +
      '<h3 style="margin:0 0 6px;font-size:14px;">What you can never see</h3>' +
      '<p style="color:var(--text-muted);margin:0 0 14px;">Wellbeing check-ins, mood and wellbeing scores, AI conversations, and anything in the Mind pillar are never visible to coaches. This boundary is enforced in the database itself \u2014 it is not a setting and cannot be switched on.</p>' +
      '<h3 style="margin:0 0 6px;font-size:14px;">How consent works</h3>' +
      '<p style="color:var(--text-muted);margin:0 0 14px;">Consent starts the moment your client accepts your terms \u2014 the date and the terms version they accepted are recorded. It ends when the client is archived or withdraws. Scheduled content release also anchors to that acceptance date.</p>' +
      '<h3 style="margin:0 0 6px;font-size:14px;">Your responsibilities</h3>' +
      '<p style="color:var(--text-muted);margin:0;">Under your partner agreement you must keep client data confidential, use it only to deliver coaching, never export or share it, and follow UK GDPR. For any data question or a client data request, contact team@vyvehealth.co.uk.</p></div>';
  }

  async function renderProfile(tab){
    if (typeof tab === 'string') w7Tab = tab;
    if (w7Tab === 'consent' && !w7DcOn()) w7Tab = 'overview';
    var body = $c('prof-body'); if (!body) return;
    var card = body.parentElement;
    if (card){
      var h = card.querySelector('h2'); if (h) h.textContent = 'Your account';
      var stale = card.querySelector(':scope > p'); if (stale) stale.style.display = 'none'; /* soft-kill: the pre-W7 "profile editing lands later" footnote */
    }
    w7ParkLegacy();
    if (!w7Acct){
      try { var p = await rest('/partner_partners?id=eq.' + partnerId + '&select=name,slug,bio,contact_email,coach_profile,coach_notification_prefs&limit=1'); w7Acct = (p && p[0]) || {}; } catch(_){ w7Acct = {}; }
    }
    var tabs = [['overview', 'Overview'], ['settings', 'Settings']];
    if (w7DcOn()) tabs.push(['consent', 'Data Consent']);
    var tabsHtml = '<div class="w7-tabs">' + tabs.map(function(t){
      return '<button type="button" data-w7tab="' + t[0] + '" class="' + (w7Tab === t[0] ? 'on' : '') + '">' + esc(t[1]) + '</button>';
    }).join('') + '</div>';
    var pane = w7Tab === 'settings' ? w7SettingsPane() : (w7Tab === 'consent' ? w7ConsentPane() : w7OverviewPane());
    body.innerHTML = tabsHtml + pane;
    body.querySelectorAll('[data-w7tab]').forEach(function(b){
      b.addEventListener('click', function(){ renderProfile(b.dataset.w7tab); });
    });
    if (w7Tab === 'overview'){
      var pr = w7Acct.coach_profile || {};
      w7Pend = {};
      w7SignedInto('w7-photo-img', pr.photo_path);
      w7SignedInto('w7-logo-img', pr.logo_path);
      w7WireUpload('w7-photo', 'w7-photo-st', 'photo');
      w7WireUpload('w7-logo', 'w7-logo-st', 'logo');
      $c('w7-prof-save').addEventListener('click', async function(){
        var msg = $c('w7-prof-msg');
        msg.textContent = 'Saving\u2026';
        try {
          var profile = {
            phone: $c('w7-phone').value, website: $c('w7-website').value,
            facebook: $c('w7-fb').value, instagram: $c('w7-ig').value,
            services: $c('w7-services').value, target_customer: $c('w7-target').value,
            welcome_video_url: $c('w7-video').value
          };
          if (w7Pend.photo_path) profile.photo_path = w7Pend.photo_path;
          if (w7Pend.logo_path) profile.logo_path = w7Pend.logo_path;
          var r = await ef({ action: 'save_profile', name: $c('w7-name').value, bio: $c('w7-bio').value, profile: profile });
          w7Acct.coach_profile = r.profile || w7Acct.coach_profile;
          if (r.name) w7Acct.name = r.name;
          w7Acct.bio = $c('w7-bio').value.trim() || null;
          msg.textContent = 'Saved \u2014 your clients see this in their app.';
          setTimeout(function(){ if (w7Tab === 'overview') renderProfile('overview'); }, 900);
        } catch(e){ msg.textContent = 'Save failed: ' + (e.message || e); }
      });
    } else if (w7Tab === 'settings'){
      var holder = $c('w7-set-legacy');
      if (holder && w7LegacyCards) w7LegacyCards.forEach(function(n){ holder.appendChild(n); });
      loadCoachTerms();
      $c('w7-np-save').addEventListener('click', async function(){
        var msg = $c('w7-np-msg');
        msg.textContent = 'Saving\u2026';
        try {
          var ev = {};
          body.querySelectorAll('[data-w7ev]').forEach(function(cb){
            var k = cb.dataset.w7ev; ev[k] = ev[k] || {}; ev[k][cb.dataset.w7ch] = cb.checked;
          });
          var r = await ef({ action: 'save_notify_prefs', prefs: { events: ev, digest_time: $c('w7-digest').value || '18:00' } });
          w7Acct.coach_notification_prefs = r.prefs;
          msg.textContent = 'Saved.';
        } catch(e){ msg.textContent = 'Save failed: ' + (e.message || e); }
      });
    }
  }

  /* -- go SHADOW (byte-replicates the Wave 6 version; settings/terms -> Account Settings tab) -- */
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
    else if (view === 'settings' || view === 'terms') show = 'view-profile';
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
    if (view === 'profile') renderProfile('overview');
    if (view === 'settings') renderProfile('settings');
    if (view === 'terms'){ renderProfile('settings'); setTimeout(function(){ var x = $c('ct-editor'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400); }
    if (view === 'clients_checkins') ciLoad();
    if (view === 'clients_daily') dgLoad();
    if (SOON_COPY[view]){ $c('soon-title').textContent = SOON_COPY[view][0]; $c('soon-desc').textContent = SOON_COPY[view][1]; }
    var side = $c('cp-side'); if (side) side.classList.remove('open');
    var ov = $c('cp-overlay'); if (ov) ov.classList.remove('show');
  }
  /* ============================ end PM-990 Wave 7 ============================ */

