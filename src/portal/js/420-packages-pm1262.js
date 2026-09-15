  /* ── PM-1262 · Packages Wave 1 (coach side) ─────────────────────────────────────────────────
     Calum, 15 Sep: nineteen package types, then "I don't think we should force coaches into these
     exact packages — let them name it, price it and toggle what's included." So: a package is a
     name, an optional price, a check-in frequency and ten switches, with five templates that just
     pre-set the switches.
     **Price is informational** (Dean, spec §Money option A): the coach still collects however they
     do now. The schema carries `collected_by` pinned to 'coach' so Stripe Connect can land later.
     Wave 1 is the coach's side only — nothing is enforced yet, and the page says so plainly rather
     than implying a switch already does something (PM-1260 rule: a switch nothing enforces is a
     promise we haven't kept).                                                                  ── */
  var PKG_FEATURES = [
    ['workouts',  'Workouts',            'Their programme, sessions and logging'],
    ['nutrition', 'Nutrition',           'Macros or meal plan, food logging'],
    ['habits',    'Habits',              'Daily habits and streaks'],
    ['checkins',  'Check-ins',           'The check-in form you assign'],
    ['messaging', 'Messaging',           'Chat with you, voice notes included'],
    ['content',   'Content & education',  'Library, guides, videos, PDFs'],
    ['live',      'Live sessions',       'Live classes and events'],
    ['community', 'Community',           'Group chat, challenges, leaderboards'],
    ['calls',     'Calls with you',      'They can request a call'],
    ['progress',  'Progress photos',     'Photos and measurements']
  ];
  var PKG_TEMPLATES = [
    { name: '1:1 Coaching',     freq: 'weekly',     on: ['workouts','nutrition','habits','checkins','messaging','content','live','community','calls','progress'], desc: 'Everything, weekly check-ins and calls.' },
    { name: 'Training Only',    freq: 'weekly',     on: ['workouts','habits','checkins','messaging','content','progress'], desc: 'Programming and support, no nutrition coaching.' },
    { name: 'Nutrition Only',   freq: 'fortnightly',on: ['nutrition','habits','checkins','messaging','content','progress'], desc: 'Macros or meal plan and accountability, no training programme.' },
    { name: 'Group Coaching',   freq: 'monthly',    on: ['workouts','nutrition','habits','checkins','content','community','live'], desc: 'One programme, many clients, group chat and challenges.' },
    { name: 'Self-Guided',      freq: 'none',       on: ['workouts','content','live'], desc: 'Pre-built plan, minimal contact.' }
  ];
  var pkg = { rows: [], editing: null, loaded: false };

  (function(){
    var st = document.createElement('style');
    st.textContent =
      '.pk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;}' +
      '.pk-card{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface-2);display:flex;flex-direction:column;gap:8px;}' +
      '.pk-card .nm{font-size:14px;font-weight:700;}' +
      '.pk-card .pr{font-size:12.5px;color:var(--teal-lt);font-weight:600;}' +
      '.pk-card .ds{font-size:12px;color:var(--text-muted);}' +
      '.pk-chips{display:flex;gap:4px;flex-wrap:wrap;}' +
      '.pk-chip{font-size:10.5px;padding:2px 7px;border-radius:999px;border:1px solid var(--border);color:var(--text-muted);}' +
      '.pk-chip.on{border-color:var(--teal);color:var(--teal-lt);background:rgba(27,120,120,.12);}' +
      '.pk-sw{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);}' +
      '.pk-sw input{margin-top:2px;accent-color:var(--teal);width:16px;height:16px;flex:none;}' +
      '.pk-sw .t{font-size:13px;font-weight:600;}' +
      '.pk-sw .s{font-size:11.5px;color:var(--text-muted);}' +
      '.pk-swgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin:10px 0 14px;}' +
      '.pk-tpl{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}';
    document.head.appendChild(st);
  })();

  function pkgFeat(p, k){ var v = (p.features || {})[k]; return v === undefined ? true : !!v; }
  function pkgPrice(p){
    if (p.price_pence == null) return '';
    var sym = p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '\u20ac' : '\u00a3';
    var amt = (p.price_pence / 100).toFixed(p.price_pence % 100 ? 2 : 0);
    var per = p.billing_period === 'one_off' ? ' one-off' : ' / ' + p.billing_period;
    return sym + amt + per;
  }
  async function pkgLoad(force){
    if (pkg.loaded && !force) return pkg.rows;
    try { pkg.rows = await rest('/coach_packages?' + pscope() + '&active=eq.true&select=*&order=is_default.desc,name.asc') || []; }
    catch(_){ pkg.rows = []; }
    pkg.loaded = true;
    return pkg.rows;
  }
  function pkgRenderList(){
    var host = $c('pk-list'); if (!host) return;
    if (!pkg.rows.length){ host.innerHTML = '<div class="empty-state"><h3>No packages yet</h3><p>Start from a template above, or build your own.</p></div>'; return; }
    host.innerHTML = '<div class="pk-grid">' + pkg.rows.map(function(p, i){
      var counts = PKG_FEATURES.filter(function(f){ return pkgFeat(p, f[0]); }).length;
      return '<div class="pk-card"><div class="nm">' + esc(p.name) + (p.is_default ? ' <span class="pk-chip on">default</span>' : '') + '</div>' +
        (pkgPrice(p) ? '<div class="pr">' + esc(pkgPrice(p)) + '</div>' : '') +
        (p.description ? '<div class="ds">' + esc(p.description) + '</div>' : '') +
        '<div class="pk-chips">' + PKG_FEATURES.filter(function(f){ return pkgFeat(p, f[0]); }).slice(0, 6).map(function(f){ return '<span class="pk-chip on">' + esc(f[1]) + '</span>'; }).join('') +
          (counts > 6 ? '<span class="pk-chip">+' + (counts - 6) + '</span>' : '') + '</div>' +
        '<div class="ds">Check-ins: ' + esc(p.checkin_frequency === 'none' ? 'none' : p.checkin_frequency) + ' \u00b7 ' + (pkgClientCount(p.id)) + ' client' + (pkgClientCount(p.id) === 1 ? '' : 's') + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:auto;padding-top:4px;">' +
          '<button class="btn" type="button" data-pke="' + i + '" style="font-size:11.5px;flex:1;">Edit</button>' +
          '<button class="btn" type="button" data-pkd="' + i + '" style="font-size:11.5px;">Duplicate</button>' +
          (p.is_default ? '' : '<button class="btn" type="button" data-pkx="' + i + '" style="font-size:11.5px;color:var(--danger);">Archive</button>') +
        '</div></div>';
    }).join('') + '</div>';
    host.querySelectorAll('[data-pke]').forEach(function(b){ b.addEventListener('click', function(){ pkgEdit(pkg.rows[+b.dataset.pke]); }); });
    host.querySelectorAll('[data-pkd]').forEach(function(b){ b.addEventListener('click', function(){ var p = Object.assign({}, pkg.rows[+b.dataset.pkd]); delete p.id; p.is_default = false; p.name = p.name + ' (copy)'; pkgEdit(p); }); });
    host.querySelectorAll('[data-pkx]').forEach(function(b){ b.addEventListener('click', async function(){
      var p = pkg.rows[+b.dataset.pkx];
      if (!confirm('Archive \u201c' + p.name + '\u201d? Clients on it keep everything they have \u2014 they just move to your default package.')) return;
      try {
        var def = pkg.rows.filter(function(x){ return x.is_default; })[0];
        if (def) await rest('/coach_clients?package_id=eq.' + p.id, { method: 'PATCH', body: { package_id: def.id } });
        await rest('/coach_packages?id=eq.' + p.id, { method: 'PATCH', body: { active: false } });
        await pkgLoad(true); pkgRenderList();
      } catch(e){ alert('Couldn\u2019t archive that \u2014 ' + (e.message || e)); }
    }); });
  }
  function pkgClientCount(id){ return roster.filter(function(c){ return c.package_id === id; }).length; }

  function pkgEdit(p){
    p = p || { name: '', description: '', currency: 'GBP', billing_period: 'month', checkin_frequency: 'weekly', features: {} };
    pkg.editing = p;
    var box = $c('pk-editor'); if (!box) return;
    box.style.display = '';
    box.innerHTML =
      '<div class="card-title" style="margin-bottom:10px;"><button class="btn" id="pk-back" type="button" style="font-size:12px;margin-right:10px;">\u2190 Back</button>' + (p.id ? 'Edit package' : 'New package') + '</div>' +
      (p.id ? '' : '<div class="pk-tpl"><span style="font-size:12px;color:var(--text-muted);align-self:center;margin-right:2px;">Start from:</span>' +
        PKG_TEMPLATES.map(function(t, i){ return '<button class="btn" type="button" data-pkt="' + i + '" style="font-size:11.5px;">' + esc(t.name) + '</button>'; }).join('') + '</div>') +
      '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;">' +
        '<div class="field"><label>Package name</label><input id="pk-name" type="text" maxlength="60" value="' + esc(p.name || '') + '" placeholder="e.g. All Access Coaching"/></div>' +
        '<div class="field"><label>Price <span style="font-weight:400;color:var(--text-dim);">optional</span></label><input id="pk-price" type="text" value="' + (p.price_pence != null ? (p.price_pence / 100) : '') + '" placeholder="200"/></div>' +
        '<div class="field"><label>Per</label><select id="pk-period">' + ['one_off','week','month','quarter','year'].map(function(k){ return '<option value="' + k + '"' + (k === (p.billing_period || 'month') ? ' selected' : '') + '>' + (k === 'one_off' ? 'one-off' : k) + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div class="field"><label>Description <span style="font-weight:400;color:var(--text-dim);">shown to you, not the client</span></label><input id="pk-desc" type="text" maxlength="160" value="' + esc(p.description || '') + '"/></div>' +
      '<p style="font-size:12px;color:var(--text-muted);margin:2px 0 12px;">You still take payment however you do now \u2014 the price is here so you can keep track.</p>' +
      '<div class="field" style="max-width:260px;"><label>Check-ins</label><select id="pk-freq">' + [['weekly','Weekly'],['fortnightly','Every two weeks'],['monthly','Monthly'],['none','No formal check-in']].map(function(f){ return '<option value="' + f[0] + '"' + (f[0] === (p.checkin_frequency || 'weekly') ? ' selected' : '') + '>' + f[1] + '</option>'; }).join('') + '</select></div>' +
      '<div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 2px;">What\u2019s included</div>' +
      '<div class="pk-swgrid" id="pk-sws">' + PKG_FEATURES.map(function(f){
        return '<label class="pk-sw"><input type="checkbox" data-pkf="' + f[0] + '"' + (pkgFeat(p, f[0]) ? ' checked' : '') + '/><span><span class="t">' + esc(f[1]) + '</span><br/><span class="s">' + esc(f[2]) + '</span></span></label>';
      }).join('') + '</div>' +
      '<p style="font-size:12px;color:var(--text-muted);background:var(--gold-pale,rgba(201,168,76,.12));border:1px solid var(--gold);border-radius:10px;padding:10px 12px;margin-bottom:14px;">Switches are saved now but not yet switching anything off in the client\u2019s app \u2014 that lands next. Set them up how you want them and they\u2019ll take effect when it does.</p>' +
      '<div style="display:flex;gap:8px;"><button class="btn btn-primary" id="pk-save" type="button">Save package</button>' +
      (p.id ? '<button class="btn" id="pk-default" type="button">Make this my default</button>' : '') + '</div>';
    $c('pk-card').style.display = 'none';
    $c('pk-back').addEventListener('click', function(){ box.style.display = 'none'; $c('pk-card').style.display = ''; });
    box.querySelectorAll('[data-pkt]').forEach(function(b){ b.addEventListener('click', function(){
      var t = PKG_TEMPLATES[+b.dataset.pkt];
      $c('pk-name').value = t.name; $c('pk-desc').value = t.desc; $c('pk-freq').value = t.freq;
      box.querySelectorAll('[data-pkf]').forEach(function(cb){ cb.checked = t.on.indexOf(cb.dataset.pkf) >= 0; });
    }); });
    $c('pk-save').addEventListener('click', async function(){
      var name = $c('pk-name').value.trim();
      if (!name){ alert('Give the package a name first.'); return; }
      var raw = $c('pk-price').value.trim().replace(/[^0-9.]/g, '');
      var feats = {};
      box.querySelectorAll('[data-pkf]').forEach(function(cb){ feats[cb.dataset.pkf] = cb.checked; });
      var body = {
        name: name, description: $c('pk-desc').value.trim() || null,
        price_pence: raw === '' ? null : Math.round(parseFloat(raw) * 100),
        billing_period: $c('pk-period').value, checkin_frequency: $c('pk-freq').value,
        features: feats, updated_at: new Date().toISOString()
      };
      try {
        if (p.id) await rest('/coach_packages?id=eq.' + p.id, { method: 'PATCH', body: body });
        else await rest('/coach_packages', { method: 'POST', body: Object.assign({ partner_id: partnerId }, body) });
        await pkgLoad(true); pkgRenderList();
        box.style.display = 'none'; $c('pk-card').style.display = '';
      } catch(e){ alert('Couldn\u2019t save that \u2014 ' + (e.message || e)); }
    });
    if ($c('pk-default')) $c('pk-default').addEventListener('click', async function(){
      try {
        await rest('/coach_packages?' + pscope() + '&is_default=eq.true', { method: 'PATCH', body: { is_default: false } });
        await rest('/coach_packages?id=eq.' + p.id, { method: 'PATCH', body: { is_default: true } });
        await pkgLoad(true); pkgRenderList();
        box.style.display = 'none'; $c('pk-card').style.display = '';
      } catch(e){ alert('Couldn\u2019t set the default \u2014 ' + (e.message || e)); }
    });
  }

  async function pkgView(){
    await pkgLoad();
    if (!$c('pk-card')) return;
    pkgRenderList();
  }
  (function(){
    /* the view, the sidebar entry and the route */
    var t = setInterval(function(){
      var side = $c('cp-side'), host = $c('view-settings'); if (!side || !host) return;
      clearInterval(t);
      if ($c('view-packages')) return;
      var v = document.createElement('div'); v.id = 'view-packages'; v.style.display = 'none';
      v.innerHTML = '<div class="card" id="pk-card"><div class="card-title">Packages' +
          '<button class="btn btn-primary" id="pk-new" type="button" style="margin-left:auto;font-size:12px;">+ New package</button></div>' +
          '<p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Name your own packages, set what each one includes, then put a client on one. You still take payment however you do now.</p>' +
          '<div id="pk-list"></div></div>' +
        '<div class="card" id="pk-editor" style="display:none;"></div>';
      host.parentElement.insertBefore(v, host);
      $c('pk-new').addEventListener('click', function(){ pkgEdit(null); });

      var nav = side.querySelector('[data-go="automations"]');
      if (nav && !side.querySelector('[data-go="packages"]')){
        var b = nav.cloneNode(true);
        b.dataset.go = 'packages';
        var lbl = b.querySelector('span'); if (lbl) lbl.textContent = 'Packages'; else b.textContent = 'Packages';
        b.addEventListener('click', function(){ go('packages'); });
        nav.parentElement.insertBefore(b, nav);
      }
      var _go = go;
      go = function(view){
        if (view === 'packages'){
          var V = ['view-dashboard','view-clients','view-leads','view-msgs','view-cal','view-plans','view-exercises','view-notifs','view-autos','view-profile','view-soon','view-settings','view-ci','view-daily','view-packages'];
          V.forEach(function(id){ var e = $c(id); if (e) e.style.display = id === 'view-packages' ? '' : 'none'; });
          document.querySelectorAll('.cp-item').forEach(function(x){ x.classList.toggle('active', x.dataset.go === 'packages'); });
          try { location.hash = 'packages'; } catch(_){}
          pkgView();
          return;
        }
        var pv = $c('view-packages'); if (pv) pv.style.display = 'none';
        return _go.apply(this, arguments);
      };
      if ((location.hash || '').replace('#', '') === 'packages') go('packages');
    }, 400);
    setTimeout(function(){ clearInterval(t); }, 25000);
  })();

  /* ── a client's package: a select in the workspace header, saved straight away ── */
  (function(){
    var _vc = w5RenderShell;
    w5RenderShell = function(){
      _vc.apply(this, arguments);
      var c = w5.c; if (!c) return;
      pkgLoad().then(function(rows){
        if (!rows.length) return;
        var tiles = document.querySelector('#cl-detail-body .w5-tiles'); if (!tiles || tiles.querySelector('#pk-pick')) return;
        var tile = document.createElement('div'); tile.className = 'w5-tile';
        tile.innerHTML = '<span>Package</span><select id="pk-pick" style="margin-top:2px;padding:4px 6px;border:1px solid var(--border);border-radius:7px;background:var(--surface-2);color:var(--text);font-size:12px;font-family:inherit;max-width:160px;">' +
          rows.map(function(p){ return '<option value="' + p.id + '"' + (p.id === c.package_id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>';
        tiles.appendChild(tile);
        $c('pk-pick').addEventListener('change', async function(){
          var id = this.value;
          try {
            await rest('/coach_clients?id=eq.' + c.id, { method: 'PATCH', body: { package_id: id } });
            c.package_id = id;
            var r = roster.find(function(x){ return x.id === c.id; }); if (r) r.package_id = id;
            if (typeof w5toast === 'function') w5toast('Package updated.');
          } catch(e){ alert('Couldn\u2019t change the package \u2014 ' + (e.message || e)); }
        });
      });
    };
  })();
