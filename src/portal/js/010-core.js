  var SUPA_URL = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';
  var _client = null;
  function sb(){ if (!_client && window.supabase) _client = window.supabase.createClient(SUPA_URL, SUPA_ANON); return _client; }
  function $g(id){ return document.getElementById(id); }

  var REST = SUPA_URL + '/rest/v1';
  var EF = SUPA_URL + '/functions/v1/coach-provision-client';
  var inited = false, partnerId = null, roster = [], memberMap = {};
  /* PM-1029 W2: VYVE scope. Staff logins (admin_users admin|team) with no partner row resolve to partnerId=null
     and administer the VYVE library (partner_id IS NULL) instead of seeing "Not linked". Every REST filter goes
     through pscope(); for a coach (partnerId non-null) it resolves to the byte-identical string as before. */
  var vyveScope = false;
  function pscope(){ return partnerId ? ('partner_id=eq.' + partnerId) : 'partner_id=is.null'; }
  function pprefix(){ return partnerId ? ('p-' + partnerId) : 'vyve'; }
  /* PM-1155: questionnaires / check-in forms / lead forms are VYVE-library kinds too (coach_forms.partner_id IS NULL) — no longer hidden at null scope. */
  var VYVE_HIDE_GO = ['profile','messages','notifications','dashboard','clients','clients_checkins','clients_daily','clients_batch','leads','calendar','content','automations','terms'];
  var VYVE_HIDE_GRP = ['clients'];
  function applyVyveScopeChrome(){
    if (!vyveScope) return;
    VYVE_HIDE_GO.forEach(function(v){ document.querySelectorAll('.cp-item[data-go="' + v + '"]').forEach(function(b){ b.style.display = 'none'; }); });
    VYVE_HIDE_GRP.forEach(function(g){
      var h = document.querySelector('.cp-ghead[data-grp="' + g + '"]'); if (h) h.style.display = 'none';
      var s = document.querySelector('.cp-sub[data-sub="' + g + '"]'); if (s) s.style.display = 'none';
    });
    var lab = document.querySelector('.cp-label'); if (lab) lab.textContent = 'VYVE Library';
    var em = $c('cp-user-email'); if (em && em.textContent.indexOf('VYVE library') < 0) em.innerHTML = '<span style="display:inline-block;padding:2px 8px;border-radius:99px;background:var(--gold);color:#0D2B2B;font-weight:800;font-size:10.5px;margin-right:8px;">VYVE library</span>' + esc(em.textContent);
    var bell = $c('cp-bell'); if (bell && bell.parentNode) bell.parentNode.style.display = 'none';
    document.querySelectorAll('.ex-scope').forEach(function(b){
      if (b.dataset.scope === 'mine') b.style.display = 'none';
      var on = b.dataset.scope === 'vyve';
      b.classList.toggle('active', on); b.classList.toggle('btn-primary', on);
    });
  }
  function $c(id){ return document.getElementById(id); }
  function esc(x){ return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  async function jwt(){ var r = await sb().auth.getSession(); return (r.data.session && r.data.session.access_token) || ''; }
  async function rest(path, opts){
    opts = opts || {};
    var t = await jwt();
    var h = { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' };
    if (opts.prefer) h['Prefer'] = opts.prefer; /* PM-1211: e.g. 'return=representation' so a POST/PATCH hands back the row */
    var r = await fetch(REST + path, { method: opts.method || 'GET', headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }
  async function ef(payload){
    var t = await jwt();
    var r = await fetch(EF, { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    var j = await r.json().catch(function(){ return {}; });
    if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status));
    return j;
  }
  function badge(st){
    var map = { invited: ['Invited','#C9A84C'], active: ['Active','#22c55e'], archived: ['Archived','#94a3b8'] };
    var m = map[st] || [st,'#94a3b8'];
    return '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.5px;color:#fff;background:' + m[1] + ';">' + m[0] + '</span>';
  }
  function nameOf(c){
    var m = memberMap[(c.member_email||'').toLowerCase()];
    if (m && (m.first_name || m.last_name)) return ((m.first_name||'') + ' ' + (m.last_name||'')).trim();
    return ((c.invited_first_name||'') + ' ' + (c.invited_last_name||'')).trim() || c.member_email;
  }
