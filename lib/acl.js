// =====================================================================
// VYVE Command Centre — Access Control Layer (ACL)
// 
// Three roles:
//   owner    - Lewis, Dean. Sees everything, manages roles.
//   lead     - Anyone with leadership/budget remit. Sees Finance, Strategy,
//              Investor, sensitive fields.
//   member   - Default. Sees the operating hub (CRM, Tasks, Action Plans,
//              Content, Sessions, etc.) but with sensitive fields redacted.
//
// Plus a flag:
//   external - Advisor/contractor. Read-only on whitelisted pages.
//
// IMPORTANT: This is client-side enforcement only. It eliminates accidental
// exposure but is NOT a security boundary. Real enforcement comes when this
// model is mirrored in Supabase Row Level Security (Dean to wire).
//
// API:
//   VYVE_ACL.role()                   -> 'owner' | 'lead' | 'member' | 'external'
//   VYVE_ACL.is(role)                 -> bool ('is at least this role')
//   VYVE_ACL.can(action, target?)     -> bool
//   VYVE_ACL.canSeePage(slug)         -> bool
//   VYVE_ACL.canEdit()                -> bool (not read-only)
//   VYVE_ACL.shouldRedact(fieldKey)   -> bool
//   VYVE_ACL.redactedValue(label?)    -> safe HTML for placeholder
//   VYVE_ACL.people()                 -> [{email, name, role, external, addedAt}]
//   VYVE_ACL.setRole(email, role, external?)
//   VYVE_ACL.removePerson(email)
//   VYVE_ACL.setCurrentEmail(email)   -> called by auth on login
// =====================================================================

(function(){
  'use strict';

  var STORAGE_KEY = 'vyve.acl.people';
  var ROLES = ['member', 'lead', 'owner'];
  var ROLE_RANK = { member: 1, lead: 2, owner: 3, external: 0 };

  // -- Seed: Lewis + Dean as owners. Everyone else defaults to member on
  //    first login. Lewis can promote/demote in Settings > People.
  var DEFAULT_PEOPLE = [
    { email: 'lewisvines@hotmail.com',   name: 'Lewis Vines', role: 'owner', external: false, addedAt: new Date('2026-01-01').toISOString() },
    { email: 'deanonbrown@hotmail.com',  name: 'Dean Brown',  role: 'owner', external: false, addedAt: new Date('2026-01-01').toISOString() },
    { email: 'deanonbrown2@gmail.com',   name: 'Dean Brown',  role: 'owner', external: false, addedAt: new Date('2026-07-12').toISOString() },
    { email: 'alanbird1@gmail.com',      name: 'Alan Bird',   role: 'owner', external: false, addedAt: new Date('2026-07-13').toISOString() }
  ];

  function loadPeople() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PEOPLE.slice();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_PEOPLE.slice();
      return parsed;
    } catch(e) {
      return DEFAULT_PEOPLE.slice();
    }
  }
  function savePeople(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; }
    catch(e){ return false; }
  }

  function normEmail(s) {
    return String(s || '').toLowerCase().trim();
  }

  // ---------- PM-795: server-backed people (cc_acl_people) ----------
  // The people list now lives in Supabase (cc_acl_people, is_admin_or_team read /
  // is_admin write). localStorage remains a fast-boot cache; the server hydrates
  // over it after login and every write goes through. Server admin_users 'admin'
  // still hard-wins as owner (PM-792) regardless of this table.
  var SB_URL  = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amZrbHBja2d4cndqbGZzYWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY0OTUsImV4cCI6MjA5MDY0MjQ5NX0.to0pwmP-F1g93hb-Fbbq4BZUPkJ4KAGEIFwDtn4whCg';

  function aclJwt() {
    try {
      var raw = localStorage.getItem('vyve-cc-supabase-auth');
      if (raw) {
        var p = JSON.parse(raw);
        return (p && (p.access_token || (p.data && p.data.session && p.data.session.access_token) || (p.session && p.session.access_token))) || null;
      }
    } catch(_) {}
    return null;
  }

  function aclFetch(method, qs, body, prefer) {
    var jwt = aclJwt();
    var headers = { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + (jwt || SB_ANON), 'Content-Type': 'application/json' };
    if (prefer) headers['Prefer'] = prefer;
    return fetch(SB_URL + '/rest/v1/cc_acl_people' + (qs || ''), {
      method: method, headers: headers, body: body ? JSON.stringify(body) : undefined
    });
  }

  var _hydrated = false;
  function hydrateFromServer() {
    aclFetch('GET', '?select=email,name,role,external,added_at').then(function(res){
      if (!res.ok) throw new Error('cc_acl_people ' + res.status);
      return res.json();
    }).then(function(rows){
      if (!Array.isArray(rows) || !rows.length) return; // empty server = keep local (fill-gaps below)
      var people = rows.map(function(r){
        return { email: normEmail(r.email), name: r.name || r.email.split('@')[0], role: r.role || 'member', external: !!r.external, addedAt: r.added_at };
      });
      var before = JSON.stringify(loadPeople());
      savePeople(people);
      _hydrated = true;
      if (JSON.stringify(people) !== before) {
        try { window.dispatchEvent(new CustomEvent('vyve:acl:change', { detail: { hydrated: true } })); } catch(e){}
      }
    }).catch(function(e){
      console.warn('[VYVE/acl] server hydrate failed — using local cache:', e && e.message ? e.message : e);
    });
  }

  function serverUpsert(person) {
    aclFetch('POST', '?on_conflict=email',
      { email: normEmail(person.email), name: person.name || null, role: person.role || 'member', external: !!person.external },
      'resolution=merge-duplicates,return=minimal'
    ).then(function(res){
      if (!res.ok) console.error('[VYVE/acl] server upsert failed:', res.status);
    }).catch(function(e){ console.error('[VYVE/acl] server upsert error:', e); });
  }

  function serverDelete(email) {
    aclFetch('DELETE', '?email=eq.' + encodeURIComponent(normEmail(email)), null, 'return=minimal')
      .then(function(res){ if (!res.ok) console.error('[VYVE/acl] server delete failed:', res.status); })
      .catch(function(e){ console.error('[VYVE/acl] server delete error:', e); });
  }

  // ---------- Page policy ----------
  // Each page slug -> minimum role needed. Anything not listed defaults to 'member'.
  // Hub tabs ('commercial', etc.) gate the whole hub.
  var PAGE_POLICY = {
    // Owner-only (org admin)
    'settings':       'owner',
    'trash':          'owner',

    // Lead+ (leadership / financial / investor / strategic)
    'finance':        'lead',
    'invoicing':      'lead',
    'investor':       'lead',
    'strategy':       'lead',
    'org':            'lead',
    'team':           'lead',

    // Member+ (everything else — operating hub)
    // (omitted = defaults to member)
  };

  // ---------- Field redaction policy ----------
  // Field keys that should be redacted from non-leads (case-insensitive).
  // Used by pages that show roll-up KPIs to call VYVE_ACL.shouldRedact('cash').
  var REDACT_FIELDS = new Set([
    'cash', 'cash_balance', 'runway', 'runway_months', 'burn', 'monthly_burn',
    'payroll', 'salary', 'salaries', 'mrr', 'arr', 'revenue',
    'valuation', 'investor_terms', 'cap_table', 'equity', 'options',
    'bank_balance', 'bank', 'profit', 'loss', 'p_and_l'
  ]);

  // ---------- Current user resolution ----------
  var _currentEmail = null;
  // PM-792: role from the server allowlist (admin_users via auth.js is_admin RPC)
  // is authoritative. localStorage people list is a per-device convenience layer
  // for team-role users only; it can never demote a server admin.
  var _serverRole = null;

  function serverRole() {
    if (_serverRole) return _serverRole;
    try { return (window.VYVE_USER && window.VYVE_USER.role) || null; } catch(e){ return null; }
  }

  function currentEmail() {
    if (_currentEmail) return _currentEmail;
    return normEmail(window.VYVE_CURRENT_USER || '');
  }

  function setCurrentEmail(email) {
    _currentEmail = normEmail(email);
    // Auto-add new people as member on first login (unless they're a seed owner)
    var p = personFor(_currentEmail);
    if (!p && _currentEmail) {
      var ppl = loadPeople();
      var newcomer = {
        email: _currentEmail,
        name: _currentEmail.split('@')[0],
        role: 'member',
        external: false,
        addedAt: new Date().toISOString()
      };
      ppl.push(newcomer);
      savePeople(ppl);
      serverUpsert(newcomer); // PM-795
    }
    try { window.dispatchEvent(new CustomEvent('vyve:acl:role', { detail: { email: _currentEmail, role: role() } })); } catch(e){}
  }

  function personFor(email) {
    if (!email) return null;
    var ppl = loadPeople();
    for (var i = 0; i < ppl.length; i++) {
      if (normEmail(ppl[i].email) === normEmail(email)) return ppl[i];
    }
    return null;
  }

  // ---------- Role accessors ----------
  function role() {
    // PM-792: anyone the server says is 'admin' (admin_users) is an owner —
    // every device, regardless of the local people list.
    if (serverRole() === 'admin') return 'owner';
    var p = personFor(currentEmail());
    if (!p) {
      // No identified user — fall back to owner ONLY when on a dev/localhost,
      // member everywhere else. Safer default.
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'owner';
      return 'member';
    }
    if (p.external) return 'external';
    return p.role || 'member';
  }

  function isExternal() {
    if (serverRole() === 'admin') return false;
    var p = personFor(currentEmail());
    return !!(p && p.external);
  }

  // 'is(role)' means "has at least this role"
  function is(requiredRole) {
    if (requiredRole === 'external') return isExternal();
    var r = role();
    if (r === 'external') return false; // external is its own track
    return (ROLE_RANK[r] || 0) >= (ROLE_RANK[requiredRole] || 0);
  }

  // ---------- Page gates ----------
  function canSeePage(slug) {
    if (!slug) return true;
    var required = PAGE_POLICY[slug] || 'member';
    // External users only see specific pages
    if (isExternal()) {
      var externalAllowed = ['brief', 'dashboard', 'strategy', 'investor', 'documents'];
      return externalAllowed.indexOf(slug) >= 0;
    }
    return is(required);
  }

  function canEdit() {
    return !isExternal();
  }

  function can(action /*, target */) {
    // Coarse-grained action checks — most callers will use canSeePage / shouldRedact
    if (action === 'manage_people') return is('owner');
    if (action === 'delete_record') return is('lead');
    if (action === 'edit') return canEdit();
    return true;
  }

  // ---------- Field redaction ----------
  function shouldRedact(fieldKey) {
    if (!fieldKey) return false;
    if (is('lead')) return false; // leads & owners see everything
    return REDACT_FIELDS.has(String(fieldKey).toLowerCase());
  }

  function redactedValue(label) {
    return '<span class="acl-redacted" title="Lead-only — speak to Lewis for access">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
      ' ' + (label || 'Lead only') +
      '</span>';
  }

  // ---------- People admin ----------
  function people() {
    return loadPeople();
  }

  function setRole(email, newRole, external) {
    if (!is('owner')) return false;
    if (!email) return false;
    if (ROLES.indexOf(newRole) < 0 && newRole !== 'external') return false;
    var ppl = loadPeople();
    var e = normEmail(email);
    var found = false;
    ppl.forEach(function(p){
      if (normEmail(p.email) === e) {
        p.role = (newRole === 'external') ? 'member' : newRole;
        p.external = !!external || newRole === 'external';
        found = true;
      }
    });
    if (!found) {
      ppl.push({
        email: e,
        name: e.split('@')[0],
        role: (newRole === 'external') ? 'member' : newRole,
        external: !!external || newRole === 'external',
        addedAt: new Date().toISOString()
      });
    }
    savePeople(ppl);
    // PM-795: write-through to cc_acl_people
    var updated = null;
    ppl.forEach(function(p){ if (normEmail(p.email) === e) updated = p; });
    if (updated) serverUpsert(updated);
    try { window.dispatchEvent(new CustomEvent('vyve:acl:change', { detail: { email: e, role: newRole } })); } catch(e){}
    return true;
  }

  function removePerson(email) {
    if (!is('owner')) return false;
    var e = normEmail(email);
    // Never remove yourself or Lewis (anti-footgun)
    if (e === currentEmail()) return false;
    if (e === 'lewisvines@hotmail.com') return false;
    var ppl = loadPeople().filter(function(p){ return normEmail(p.email) !== e; });
    savePeople(ppl);
    serverDelete(e); // PM-795
    try { window.dispatchEvent(new CustomEvent('vyve:acl:change', { detail: { email: e, removed: true } })); } catch(e){}
    return true;
  }

  function resetToDefaults() {
    if (!is('owner')) return false;
    savePeople(DEFAULT_PEOPLE.slice());
    try { window.dispatchEvent(new CustomEvent('vyve:acl:change', { detail: { reset: true } })); } catch(e){}
    return true;
  }

  // ---------- Bootstrap: sync with current logged-in user ----------
  window.addEventListener('vyve:user', function(e){
    _serverRole = (e.detail && e.detail.role) || _serverRole;
    var em = (e.detail && e.detail.email) || '';
    if (em) setCurrentEmail(em);
    if (em) hydrateFromServer(); // PM-795: server list wins over the local cache
  });

  // ---------- Public API ----------
  window.VYVE_ACL = {
    role: role,
    is: is,
    isExternal: isExternal,
    can: can,
    canSeePage: canSeePage,
    canEdit: canEdit,
    shouldRedact: shouldRedact,
    redactedValue: redactedValue,
    people: people,
    setRole: setRole,
    removePerson: removePerson,
    resetToDefaults: resetToDefaults,
    setCurrentEmail: setCurrentEmail,
    currentEmail: currentEmail,
    PAGE_POLICY: PAGE_POLICY,
    REDACT_FIELDS: Array.from(REDACT_FIELDS),
    ROLES: ROLES
  };
})();
