  async function init(){
    if (inited) return; inited = true;
    try {
      var t = await jwt();
      var r = await fetch(REST + '/rpc/get_my_partner_id', { method: 'POST', headers: { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: '{}' });
      partnerId = await r.json();
      if (!partnerId){
        var st = false;
        try { st = await rest('/rpc/is_admin_or_team', { method: 'POST', body: {} }); } catch(_){ st = false; }
        if (st !== true){ $c('cl-list').innerHTML = '<div class="empty-state"><h3>Not linked</h3><p>Your login isn\u2019t linked to a partner record \u2014 contact the VYVE team.</p></div>'; return; }
        vyveScope = true; exScope = 'vyve';
        applyVyveScopeChrome();
        loadLibraries();
        go('kindsel:program');
        return;
      }
      await loadClients();
      renderDashboard();
      loadLibraries();
      notifLoad(false).catch(function(){});
      msgBadgeRefresh().catch(function(){});
    } catch(e){ inited = false; }
  }
  $c('cl-add-btn').addEventListener('click', function(){ $c('cl-editor').style.display = ''; $c('clf-first').focus(); });
  $c('clf-cancel').addEventListener('click', function(){ $c('cl-editor').style.display = 'none'; });
  $c('clf-save').addEventListener('click', addClient);
  $c('cl-detail-close').addEventListener('click', function(){ $c('cl-detail-card').style.display = 'none'; });
  /* ── Assignments + bulk upload (PM-954d) ── */
  var lib = { forms: [], tpls: [] };
  var SLOTS = [
    { slot:'onboarding',  col:'Onboarding questionnaire', sel:'asg-onboarding',  pool:function(){ return lib.forms.filter(function(f){return f.kind==='onboarding';}).map(function(f){return f.title;}); } },
    { slot:'checkin',     col:'Check-in form',            sel:'asg-checkin',     pool:function(){ return lib.forms.filter(function(f){return f.kind==='checkin';}).map(function(f){return f.title;}); } },
    { slot:'habits',      col:'Habits plan',              sel:'asg-habits',      pool:function(){ return lib.tpls.filter(function(t){return t.kind==='habits';}).map(function(t){return t.name;}); } },
    { slot:'workout',     col:'Workout plan',             sel:'asg-workout',     pool:function(){ return lib.tpls.filter(function(t){return wkKindMatch('workout', t.kind);}).map(function(t){return t.name;}); } },
    { slot:'nutrition',   col:'Nutrition plan',           sel:'asg-nutrition',   pool:function(){ return lib.tpls.filter(function(t){return t.kind==='nutrition';}).map(function(t){return t.name;}); } },
    { slot:'supplements', col:'Supplement plan',          sel:'asg-supplements', pool:function(){ return lib.tpls.filter(function(t){return t.kind==='supplements';}).map(function(t){return t.name;}); } }
  ];
