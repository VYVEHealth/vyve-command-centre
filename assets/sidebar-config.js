// =====================================================================
// VYVE Command Centre — Sidebar configuration
// Single source for nav structure. Update here, sidebar re-renders.
// 'status' is informational only (used by router for empty-state hints).
// =====================================================================

window.VYVE_NAV = [
  {
    section: "Daily",
    items: [
      { slug: "brief",       label: "Morning Brief",   icon: "layers",   status: "live" },
      { slug: "intel",       label: "Research & Grants", icon: "search", status: "live" },
      { slug: "competitors", label: "Competitor Watch", icon: "eye",     status: "live" },
      { slug: "intel-hub",   label: "Intel Hub",       icon: "radar",    status: "live" },
      { slug: "dashboard",   label: "Dashboard",       icon: "grid",     status: "live" }
    ]
  },
  {
    section: "Commercial",
    items: [
      { slug: "finance",   label: "Finance",      icon: "trending-up",  status: "stub" },
      { slug: "clients",   label: "Clients",      icon: "briefcase",    status: "skeleton" },
      { slug: "crm",       label: "Sales Pipeline", icon: "users",      status: "skeleton" },
      { slug: "investor",  label: "Investors",    icon: "target",       status: "live" },
      { slug: "partners",  label: "Partners",     icon: "link",         status: "skeleton" },
      { slug: "invoicing", label: "Invoicing",    icon: "file-text",    status: "skeleton" }
    ]
  },
  {
    section: "Delivery",
    items: [
      { slug: "sessions",   label: "Sessions",   icon: "calendar",    status: "skeleton" },
      { slug: "tasks",      label: "Tasks",      icon: "check-square", status: "skeleton" },
      { slug: "compliance", label: "Compliance", icon: "shield",      status: "stub" }
    ]
  },
  {
    section: "Marketing",
    items: [
      { slug: "content",     label: "Content",     icon: "edit",        status: "stub" },
      { slug: "social-blueprint", label: "Social Blueprint", icon: "compass",  status: "live" },
      { href: "https://app.metricool.com/evolution/instagram?blogId=5565297&userId=4317867", label: "Social Media", icon: "share", external: true },
      { slug: "performance", label: "Performance", icon: "bar-chart",   status: "stub" },
      { slug: "podcast",     label: "Podcast",     icon: "mic",         status: "stub" },
      { slug: "brand",       label: "Brand",       icon: "droplet",     status: "stub" }
    ]
  },
  {
    section: "Knowledge",
    items: [
      { slug: "strategy",  label: "Strategy",       icon: "compass", status: "stub" },
      { slug: "documents", label: "Documents",      icon: "folder",  status: "skeleton" },
      { slug: "knowledge", label: "Knowledge Base", icon: "book",    status: "skeleton" }
    ]
  },
  {
    section: "Org",
    items: [
      { slug: "team",     label: "Team",     icon: "user",     status: "skeleton" },
      { slug: "settings", label: "Settings", icon: "settings", status: "live" }
    ]
  }
];

// Minimal SVG icon set (stroke-based, 24x24 viewBox).
window.VYVE_ICONS = {
  "layers":       '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  "search":       '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  "radar":        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 12 L12 4"/><path d="M12 12 L18.5 8"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  "eye":          '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
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
