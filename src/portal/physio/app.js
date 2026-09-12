  /* ============================ PM-1208: physio portal app ============================
     State the shared slices expect (in coach-portal these vars live in the coaching slices), the page's own
     init/nav, the Patients list, and the per-page copy the shared auth + library slices read. */
  var roster = [], memberMap = {};
  var cexRows = [], cexLoaded = false, exScope = 'all', cexEditing = null, cexDupFrom = null;
  CP_LOGIN_LEAD = 'Sign in with your VYVE physio login.';
  CP_RESET_LEAD = 'Choose a new password for your VYVE login \u2014 it works for the physio portal and the app.';
  EX_SHELVES = ['rehab']; EX_HOME_SHELF = 'rehab'; EX_CAT_LABEL = 'All body regions';
  /* Bulk-attach totals are a VYVE-scope (staff) tool on the coach portal; the library's count line calls it only at vyveScope. */
  function w6bTotals(){ return ''; }

  var PH_VIEWS = { patients: 'view-patients', plans: 'view-plans', exercises: 'view-exercises', templates: 'view-templates', messages: 'view-msgs', settings: 'view-settings' };
  function go(view){
    if (!PH_VIEWS[view]) view = 'patients';
    Object.keys(PH_VIEWS).forEach(function(k){ var el = $c(PH_VIEWS[k]); if (el) el.style.display = k === view ? '' : 'none'; });
    document.querySelectorAll('.cp-item').forEach(function(b){ b.classList.toggle('active', b.dataset.go === view); });
    $c('cp-side').classList.remove('open'); $c('cp-overlay').classList.remove('show');
    if (view === 'exercises'){ exInit().catch(function(){}); }
    try { history.replaceState(null, '', '#' + view); } catch(_){}
  }
  document.querySelectorAll('.cp-item').forEach(function(b){ b.addEventListener('click', function(){ go(b.dataset.go); }); });
  $c('cp-burger').addEventListener('click', function(){ $c('cp-side').classList.toggle('open'); $c('cp-overlay').classList.toggle('show'); });
  $c('cp-overlay').addEventListener('click', function(){ $c('cp-side').classList.remove('open'); $c('cp-overlay').classList.remove('show'); });
  $c('set-theme').addEventListener('click', function(){ $c('cp-theme-toggle').click(); });
  $c('set-signout').addEventListener('click', function(){ $c('cp-signout').click(); });

  async function loadPatients(){
    roster = await rest('/coach_clients?' + pscope() + '&order=created_at.desc&select=*') || [];
    memberMap = {};
    if (roster.length){
      try {
        var emails = roster.map(function(c){ return c.member_email; }).join(',');
        var ms = await rest('/members?email=in.(' + encodeURIComponent(emails) + ')&select=email,first_name,last_name,last_active_at') || [];
        ms.forEach(function(m){ memberMap[(m.email || '').toLowerCase()] = m; });
      } catch(_){ /* unconsented rows are simply not visible */ }
    }
    renderPatients();
  }
  function ptName(c){
    var m = memberMap[(c.member_email || '').toLowerCase()];
    var n = m ? ((m.first_name || '') + ' ' + (m.last_name || '')).trim() : '';
    return n || ((c.invited_first_name || '') + ' ' + (c.invited_last_name || '')).trim() || c.member_email;
  }
  function ptWhen(iso){
    if (!iso) return '\u2014';
    var d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago';
  }
  function renderPatients(){
    var list = $c('pt-list'), n = roster.length;
    $c('pt-count').textContent = n ? (n + ' patient' + (n === 1 ? '' : 's')) : '';
    if (!n){ list.innerHTML = '<div class="empty-state"><h3>No patients yet</h3><p>Your patients appear here once you prescribe their first plan.</p></div>'; return; }
    list.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;"><th style="padding:6px 8px;">Patient</th><th style="padding:6px 8px;">Status</th><th style="padding:6px 8px;">Last active</th><th style="padding:6px 8px;">Plans</th></tr></thead><tbody>' +
      roster.map(function(c){
        var m = memberMap[(c.member_email || '').toLowerCase()];
        return '<tr style="border-top:1px solid var(--border);"><td style="padding:9px 8px;"><div style="font-weight:600;">' + esc(ptName(c)) + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + esc(c.member_email) + '</div></td>' +
          '<td style="padding:9px 8px;">' + esc(c.status || '') + '</td><td style="padding:9px 8px;">' + esc(ptWhen(m && m.last_active_at)) + '</td><td style="padding:9px 8px;color:var(--text-muted);">\u2014</td></tr>';
      }).join('') + '</tbody></table>';
  }

  async function init(){
    if (inited) return; inited = true;
    try {
      var t = await jwt();
      var r = await fetch(REST + '/rpc/get_my_partner_id', { method: 'POST', headers: { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: '{}' });
      partnerId = await r.json();
      if (!partnerId){
        $c('pt-list').innerHTML = '<div class="empty-state"><h3>Not linked</h3><p>Your login isn\u2019t linked to a partner record \u2014 contact the VYVE team.</p></div>';
        return;
      }
      await loadPatients();
      var h = (window.location.hash || '').replace('#', '');
      go(PH_VIEWS[h] ? h : 'patients');
    } catch(e){ inited = false; }
  }
  /* ============================ end PM-1208 physio app ============================ */
