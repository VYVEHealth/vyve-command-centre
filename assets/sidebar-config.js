// =====================================================================
// VYVE Command Centre — Sidebar configuration
// Single source for nav structure. Update here, sidebar re-renders.
// PM-753: 5-domain IA (PM-752 CC overhaul) — Run the Business / Members /
// Partners / Employers / Analytics + System. Legacy section removed PM-754
// (Dean call) — pages remain in repo + reachable via #/slug; restore = re-add nav items.
// =====================================================================


// PM-764: domain registry — drives the #/domain-{key} landing pages.
// Each landing renders its section's items as a tile grid, so nav and
// landings can never drift. Item `desc` (below) supplies tile copy.
window.VYVE_DOMAINS = {
  "rtb":       { section: "Run the Business", label: "Run the Business", desc: "Pipeline, finance, investors, content, tasks and the operating calendar." },
  "members":   { section: "Members",          label: "Members",          desc: "Member admin, broadcast push and who's active right now." },
  "partners":  { section: "Partners",         label: "Partners",         desc: "Pipeline, go-live gates, content moderation, payouts and the partner portal." },
  "employers": { section: "Employers",        label: "Employers",        desc: "Employer accounts, benchmarks, the live portal and the sales demo." },
  "analytics": { section: "Analytics",        label: "Analytics",        desc: "App health, usage, retention, wellbeing, platform, revenue and AI." }
};

window.VYVE_NAV = [
  // ---------- Home ----------
  {
    section: "VYVE",
    items: [
      { slug: "home", label: "Home", icon: "grid", status: "live" },
      { slug: "inbox", area: "partners", label: "Inbox", icon: "mail", status: "live", desc: "Partner messages, answered like a conversation." }
    ]
  },
  // ---------- Run the Business ----------
  {
    section: "Run the Business",
    items: [
      { slug: "crm", area: "sales",       label: "Sales Pipeline",      icon: "users",        status: "live", desc: "Stage-grouped leads on cc_leads. Won leads auto-create clients." },
      { slug: "finance", area: "finance",   label: "Finance",             icon: "trending-up",  status: "live", desc: "Live billed MRR, the \u00a36K target bar, snapshots and runway." },
      { slug: "invoicing", area: "invoicing", label: "Invoicing",           icon: "file-text",    status: "live", desc: "Raise, track and mark invoices paid." },
      { slug: "investor", area: "investors",  label: "Investors & Grants",  icon: "target",       status: "live", desc: "Funding pipeline and the grant calendar." },
      { slug: "content", area: "content",   label: "Content",             icon: "edit",         status: "live", desc: "Plan and approve posts before Metricool publishes." },
      { slug: "podcast", area: "podcast",   label: "Podcast",             icon: "mic",          status: "live", desc: "Episode tracker \u2014 planned, recorded, published." },
      { slug: "tasks", area: "tasks",     label: "Tasks",               icon: "check-square", status: "live", desc: "The shared team task board." },
      { slug: "documents", area: "documents", label: "Documents",           icon: "folder",       status: "skeleton", desc: "Internal docs and files." },
      { slug: "calendar", area: "calendar",  label: "Calendar",            icon: "calendar",     status: "live", desc: "The operating calendar \u2014 sessions, deadlines, events." },
      { slug: "meetings", label: "Meetings",            icon: "video",        status: "live", desc: "Video meetings with automatic transcripts \u2014 internal and client calls." },
      { href: "https://app.metricool.com/evolution/instagram?blogId=5565297&userId=4317867", area: "social", label: "Social Media", icon: "share", external: true },
      { href: "https://riverside.fm/dashboard/home", area: "content", label: "Riverside", icon: "video", external: true },
      { href: "https://drive.google.com/drive/u/1/home", area: "documents", label: "Shared Documents", icon: "drive", external: true }
    ]
  },
  // ---------- Members ----------
  {
    section: "Members",
    items: [
      { href: "/admin-console.html", area: "members", label: "Member Admin", icon: "users", external: false, desc: "Member list, detail and edit \u2014 the members admin surface." },
      { slug: "broadcast", area: "members",    label: "Broadcast",    icon: "share", status: "live", desc: "Push notifications to member devices." },
      { slug: "active-users", area: "members", label: "Active Users", icon: "users", status: "live", desc: "Who\u2019s in the app right now." },
      { slug: "complaints", area: "complaints",   label: "Complaints",   icon: "shield", status: "live", desc: "Member reports from Help & Support \u2014 triage and resolve." }
    ]
  },
  // ---------- Partners ----------
  {
    section: "Partners",
    items: [
      { href: "/partners.html", area: "partners",       label: "Partner Management", icon: "link",  external: false, desc: "Pipeline, go-live gates, moderation and payouts." },
      { href: "/partner-portal.html", area: "partners", label: "Partner Portal",     icon: "video", external: false, desc: "What partners see \u2014 content, publishing, notify." },
      { slug: "bookings", area: "partners",             label: "Bookings",           icon: "calendar", status: "live", desc: "Employer expert requests to confirm + the booking ledger." }
    ]
  },
  // ---------- Employers ----------
  {
    section: "Employers",
    items: [
      { slug: "employers", area: "employers", label: "Employer Accounts", icon: "briefcase", status: "live", desc: "Provision logins, seat counts and benchmark figures." },
      { href: "https://www.vyvehealth.co.uk/employer-portal.html", area: "employers", label: "Employer Portal (live)", icon: "briefcase", external: true, desc: "The live employer dashboard \u2014 aggregate only, no PII." },
      { href: "https://www.vyvehealth.co.uk/employer-portal.html?demo=1", area: "employers", label: "Sales Demo", icon: "eye", external: true, desc: "The demo employer dashboard for prospect calls." }
    ]
  },
  // ---------- Analytics ----------
  {
    section: "Analytics",
    items: [
      { slug: "app-health", area: "analytics",     label: "App Health",         icon: "activity",    status: "live" },
      { slug: "usage", area: "analytics",          label: "Overview & Members", icon: "grid",        status: "live" },
      { slug: "retention", area: "analytics",      label: "Retention",          icon: "trending-up", status: "live" },
      { slug: "activity-depth", area: "analytics", label: "Activity Depth",     icon: "bar-chart",   status: "live" },
      { slug: "wellbeing", area: "analytics",      label: "Wellbeing",          icon: "heart",       status: "live" },
      { slug: "platform", area: "analytics",       label: "Platform & UX",      icon: "monitor",     status: "live" },
      { slug: "revenue", area: "analytics",        label: "Revenue",            icon: "trending-up", status: "live" },
      { slug: "ai-usage", area: "analytics",       label: "AI Usage",           icon: "cpu",         status: "live" }
    ]
  },
  // ---------- System ----------
  {
    section: "System",
    items: [
      { slug: "settings", area: "system", label: "Settings", icon: "settings", status: "live" }
    ]
  }
];

// Minimal SVG icon set (stroke-based, 24x24 viewBox).
window.VYVE_ICONS = {
  "activity":     '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  "heart":        '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  "monitor":      '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  "cpu":          '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  "layers":       '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  "search":       '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  "radar":        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 12 L12 4"/><path d="M12 12 L18.5 8"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  "eye":          '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  "mail":         '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  "grid":         '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
  "trending-up":  '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  "briefcase":    '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  "users":        '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  "target":       '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  "link":         '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  "file-text":    '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  "calendar":     '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  "check-square": '<svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  "shield":       '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  "drive":        '<svg viewBox="0 0 24 24"><polygon points="7.71 2.86 16.29 2.86 22 12.71 13.43 12.71"/><polygon points="2 17.14 6.29 9.71 14.86 9.71 10.57 17.14"/><polygon points="13.43 12.71 22 12.71 17.71 20.14 9.14 20.14"/></svg>',
  "video":        '<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  "edit":         '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  "share":        '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="11.49"/></svg>',
  "bar-chart":    '<svg viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  "mic":          '<svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
  "droplet":      '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  "compass":      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  "folder":       '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  "book":         '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  "user":         '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  "settings":     '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};

// Top-level domains — 4-domain IA per PM-639. 'sectionName' groups the
// sidebar sections that belong to each domain (informational).
window.VYVE_NAV_TOP = [
  // PM-912: Morning Brief soft-killed (Lewis-era, stale data) — tab now lands
  // on the Run the Business domain landing. brief.html stays in repo, #/brief restores.
  { slug: 'domain-rtb', label: 'Run the Business', icon: 'layers', sectionName: 'Daily',
    description: 'Pipeline, finance, content, tasks, documents, calendar.' },
  { slug: 'usage', label: 'Analytics', icon: 'bar-chart', sectionName: 'Analytics',
    description: 'App health, usage, retention, wellbeing, platform, revenue, AI.' },
  { slug: 'active-users', label: 'Members', icon: 'users', sectionName: 'Members',
    description: 'Member admin, broadcast, active users.' },
  { href: '/partners.html', label: 'Partners', icon: 'link', sectionName: 'Partners',
    description: 'Partner management, moderation, payouts, portal.' }
];

// Route -> top-nav tab slug mapping (used by router to highlight the right tab)
window.VYVE_ROUTE_TO_TOP = (function(){
  var m = {};
  (window.VYVE_NAV || []).forEach(function(section){
    var topSlug = ({
      'Daily':      'domain-rtb',
      'Commercial': 'domain-rtb',
      'Marketing':  'domain-rtb',
      'Delivery':   'domain-rtb',
      'Knowledge':  'domain-rtb',
      'Org':        'domain-rtb',
      'Analytics':  'usage',
      'Members':    'active-users',
      'Partners':   'domain-rtb'
    })[section.section] || 'domain-rtb';
    section.items.forEach(function(item){
      if (item.slug) m[item.slug] = topSlug;
    });
  });
  m['brief'] = 'domain-rtb';
  m['domain-rtb'] = 'domain-rtb';
  m['usage'] = 'usage';
  m['active-users'] = 'active-users';
  return m;
})();
