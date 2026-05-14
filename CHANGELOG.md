# Changelog — VYVE Command Centre

All notable changes documented commit-by-commit. Each entry links to the GitHub commit.

## 2026-05-14 (continued)

### Commit 55 - Real content on hub pages
*Commit: [`09e132`](https://github.com/VYVEHealth/vyve-command-centre/commit/09e132123ebf3557fc288a3a20c77f0a706a3df5)*

Five hub pages went from skeleton tile grids to fully usable surfaces. The biggest rebuild was **Investors**: full KPI strip (pipeline count, round target, committed, runway with ACL redaction for non-leads), pipeline kanban with proper edit modal, MRR trend sparkline (also ACL-gated), active conversations panel (surfaces investors with a "next step" set), and a board updates log (add monthly updates, history persists in localStorage). Investors now has a real add-investor modal that previously didn't exist — the button on the old page was a dead end.

Four hub pages got "below the tiles" body sections with live data:
- **Marketing** — "This week's content" list (pulls scheduled content for the next 7 days, sorted by publish date) + "Channel reach (30d)" horizontal bar chart with growth deltas per platform
- **Delivery** — "Sessions this week" with pillar-colour stripes (Physical/Mental/Social) + "Active clients" list pulling from clients in "live" stage
- **Org** — Team roster with action-plan health stripes: per-member done/total counts, blocked badge, completion % bar coloured by threshold (green ≥60%, amber ≥30%, red below)
- **Knowledge** — Recently updated entries (combined docs + knowledge base, sorted by updated_at) + categories grid showing entry counts per category

All five pages also now register `VYVE_PAGE_SHORTCUTS.onNew` so the global `n` shortcut adds a new record on the right page.

### Commit 54 - Keyboard shortcuts + bulk select
*Commit: [`c96213`](https://github.com/VYVEHealth/vyve-command-centre/commit/c96213de7e42ad2b59a57070ae791bd0410a8217)*

Global shortcut layer: `?` opens a help overlay listing every shortcut, `/` focuses Cmd+K, `g` followed by another key navigates (`g b` Brief, `g i` Inbox, `g d` Dashboard, `g c` CRM, `g t` Tasks, `g a` Action Plans, `g s` Sessions, `g f` Finance, `g x` Activity, `g r` reload). Page-scoped shortcuts: `n` calls `window.VYVE_PAGE_SHORTCUTS.onNew()` (wired on 10 list pages: tasks, crm, sessions, compliance, content, clients, partners, invoicing, podcast, intel, competitors). `e` calls `onEdit()` (wired on Tasks). `x` toggles bulk selection on the focused row. Shortcuts ignored when typing in inputs or when a modal/Cmd+K is open.

**Bulk select primitive** (`VYVE_BULK`): pages opt in via `VYVE_BULK.enable({selector, idAttr, actions, onAction})`. Selected rows get a 2px teal outline; a black floating action bar appears at the bottom of the viewport showing "N selected" + action buttons. Tasks is the first page wired up: shift-click toggles selection on a kanban card, and the action bar exposes **Mark done** (bulk-updates all selected tasks to `done` status with timestamps) and **Delete** (bulk-removes through `softDelete` so they land in Trash). Esc clears selection.

Topbar got a small question-mark icon next to the bell that opens the shortcut help overlay. The keyboard kbd CSS uses a real keycap look with bottom-shadow.

### Commit 53 - Outbound integrations
*Commit: [`4e97a5`](https://github.com/VYVEHealth/vyve-command-centre/commit/4e97a52ba319a67b6ee60c0015b25659984da38c)*

New `lib/integrations.js` module: Slack incoming webhooks, Gmail compose (mailto or Gmail-web), Google Calendar event URLs. All client-side, no backend required.

**Slack daily digest**: builder pulls today's hub state into a Slack-formatted message — overdue actions, overdue tasks, due-today counts, sessions today, compliance due in 7d, deals closing this month with weighted value. Auto-send mode (off by default) checks once per page-load after 6am local: if today's digest hasn't been sent yet and the webhook is configured, it fires. Manual "Send now" + "Preview" buttons in Settings.

**Settings → Outbound** tab (new, between People & Roles and Integrations): paste your Slack webhook URL, toggle auto-send, preview the digest text, send now, see "last sent" timestamp. Sub-card for Gmail web vs default mail client preference.

**CRM "Email contact" button** on each deal modal: pre-fills a draft email using the deal name, value, notes, and signs off as Lewis. Opens in Gmail web or default mail client based on user preference.

**Sessions "Add to calendar" button** on each upcoming session card: builds a Google Calendar event URL with title, start/end times (uses session duration_minutes or defaults to 60min), location, and notes. Opens in new tab.

The Slack send uses `mode: 'no-cors'` because Slack webhooks don't return CORS headers — we can't read the response but we can detect transport failure. Suitable for a daily fire-and-forget pattern.

## 2026-05-14 (continued)

### Commit 51 - Permissions & role gates
*Commit: [`20c69e`](https://github.com/VYVEHealth/vyve-command-centre/commit/20c69e60f16da4a53ea6e1e7c2cc5a9f19b94f6d)*

Three roles control what each person sees: **Owner** (Lewis, Dean), **Lead** (anyone with leadership/budget remit), **Member** (default for the team). Plus an **External** flag for advisors who get read-only on a whitelisted set of pages.

Pages have a policy — anything not listed defaults to member. Owner-only: Settings, Trash. Lead+: Finance, Invoicing, Investor, Strategy, Org, Team. Everything else (CRM, Tasks, Action Plans, Content, Sessions, Compliance, Intel, etc.) is member-accessible. The router enforces this: a member trying to load `/#/finance` sees a friendly "Restricted" page instead.

Sensitive **fields** are redacted inline for non-leads — Brief's MRR tile and Dashboard's Cash/Burn/Runway cards now show a small "🔒 Lead only" pill for members. They can still navigate the page; they just don't see the numbers.

A **role pill** in the topbar makes the current role visible (gold for Owner, teal for Lead, grey for External, hidden for Member as the default). The sidebar drawer + top nav both auto-hide gated items so the UI doesn't show things the user can't reach.

**Settings → People & Roles** is the admin panel. Owners see a table of every person with role dropdowns, an External checkbox, an "Add person" form, and a "Reset to defaults" escape hatch. New team members get auto-added as Members on first login; Owners promote when needed. Removing someone deletes their role assignment (they default back to Member on next login). Lewis and the current user can't remove themselves (anti-footgun).

**Important caveat:** This is client-side enforcement only. It eliminates accidental exposure (a member won't stumble onto cash figures) but is NOT a security boundary against a determined attacker — anyone can read the source and bypass it. Real enforcement comes when Dean mirrors this model in Supabase Row Level Security. The data model here is designed to map 1:1 onto RLS policies when that happens.

Internally:
- `lib/acl.js` (NEW) — role storage, page policy, field redaction, people admin API
- `lib/router.js` — `loadPage()` checks `canSeePage()` before injecting; `renderTopNav()` and `renderSidebar()` filter gated items; new `renderForbidden(slug)` shows the restricted state; chrome re-renders on `vyve:acl:role` and `vyve:acl:change` events
- `index.html` — loads `lib/acl.js` (after views.js, before entities.js), adds `#topnav-role` pill, wires `setCurrentEmail` to the `vyve:user` event
- `assets/shell.css` — `.topnav-role` + `.role-owner` / `.role-lead` / `.role-external` styles, `.acl-redacted` pill, `.acl-people-table` styles
- `pages/settings.html` — new "People & Roles" tab between General and Integrations, with the full admin table
- `pages/brief.html` — MRR tile checks `VYVE_ACL.shouldRedact('mrr')`; KPI stat clicks check `canSeePage()` before navigating (shows a toast if blocked)
- `pages/dashboard.html` — Cash on hand / Monthly burn / Runway / MRR cards all check ACL redaction per field

This unlocks putting real numbers in the hub. Cash position, runway, payroll details, valuation work — all can go in without leaking to the broader team.

## 2026-05-14 (continued)

### Commit 49 - Saved views & filters
*Commit: [`f82b36`](https://github.com/VYVEHealth/vyve-command-centre/commit/f82b3647c6dd7cf7abaa97f7c378427b42da7754)*

The big list pages now have a mountable filter chip bar with a saved-views row above it. Tasks and CRM are the first two pages wired up; the underlying `VYVE_VIEWS_UI` helper is generic and can be dropped onto any page that has a list.

Each filter is one of: select (status, owner, priority, source), select with dynamic options (e.g. owner list pulled live from current data), or date-range (today / this week / overdue / no due). Click "+ Add filter" to add one, click the × on a chip to remove it. Once any filters are active, the bar exposes a "★ Save view" button — name the view and it persists in `localStorage` keyed by page. Saved views appear as tabs at the top of the bar; click one to activate, click "Pin" to surface it on the Brief, click "Delete view" to remove it.

The Brief now renders a "Pinned views" card listing all pinned views as clickable shortcut cards — the user builds their own operational dashboard.

Internally:
- `lib/views-ui.js` — generic mountable chip bar + saved views row, exposes `VYVE_VIEWS_UI.mount(el, opts)` and `applyFilters(items, filters, fieldMap)`
- `pages/tasks.html` — refactored to mount the views bar, includes filter fields for status / priority / owner / area / due
- `pages/crm.html` — refactored to mount the views bar, includes filter fields for stage / owner / source / close_date
- `pages/brief.html` — new "Pinned views" section that reads `VYVE_VIEWS.pinned()` and renders as a card grid
- Tasks page also gained: audit logging on save, soft delete on remove, comment+history Discuss button on each kanban card — matching what Action Plans and CRM already had

Filter state is per-browser for now. When Supabase comes online, the same API switches backend and views become shared/per-user.

### Commit 48 - Audit trail wired into save/delete flows
*Commit: [`2050a7`](https://github.com/VYVEHealth/vyve-command-centre/commit/2050a7a71097b0339d8ab1f2fb2c6a79d91f9ba6)*

Every save and delete on Action Plans and CRM now logs to `VYVE_STORE`. The record modal's History tab shows a real audit trail: who, when, what changed (computed via `VYVE_STORE.diff(before, after)`). Soft deletes also flow through `VYVE_STORE.softDelete(type, id, record)` so deleted records can be restored from the Trash page rather than disappearing forever.

Internally:
- `pages/action-plans.html` — `saveOverride()` now calls `VYVE_STORE.logChange('action', id, who, op, diff)` after persistence; op is `'create'` for new actions and `'update'` for edits
- `pages/crm.html` — `save()` captures existing record, computes diff, calls `logChange('deal', ...)`; `remove()` calls `softDelete('deal', id, record)` before the Make/local delete

This is what unlocks the hub being trustworthy. People can't accidentally lose a record, and "who changed this?" has a real answer.

### Commit 47 - Cross-record global search in Cmd+K
*Commit: [`8dd651`](https://github.com/VYVEHealth/vyve-command-centre/commit/8dd651793769cde8c56c0e2ceb20fb78a4c92cd9)*

Cmd+K used to jump between pages. Now it jumps to records too — any deal, action, task, session, compliance item, client, intel signal, competitor signal, content piece, or podcast episode by title. Results are grouped (Pages / Records) and selecting a record opens the record modal directly (Details + Comments + History tabs).

Fuzzy match scoring: exact match > starts-with > contains > subsequence. Records also score against their sub-line (so "Acme £50k" matches a deal even if the company name is just "Acme Industries"). Recents persist per browser as itemKey strings.

Internally:
- `lib/quick-search.js` — rewritten to v2; `pageIndex()` + `recordIndex()` merged into one searchable set
- Recents now stored as `'kind::type::id_or_slug'` strings so they survive across sessions
- Keyboard nav (↑/↓/Enter/Esc) unchanged

### Commit 46 - Universal comments + @mentions
*Commit: [`07fe2c`](https://github.com/VYVEHealth/vyve-command-centre/commit/07fe2c7cdf923c8e69c94e714447aa22a922d84e)*

Any record can now have a comment thread. Every Action Plan row and every CRM kanban card has a "Discuss" affordance that shows the comment count when there are comments. Click it to open the record modal with three tabs:

- **Details** — compact key/value view of the record
- **Comments** — full thread, `@name` to mention a teammate (mentions get notifications and surface in their Inbox), Cmd+Enter to post
- **History** — audit trail (powered by commit 48)

There's also a Delete button in the modal that goes through `VYVE_STORE.softDelete`, so anything deleted from any record-detail modal is recoverable from Trash.

Internally:
- `lib/widgets.js` (NEW) — `commentsPanel(el, type, id, opts)`, `historyPanel(el, type, id)`, `recordModal(type, id)`. Mountable into any DOM element.
- `lib/entities.js` — patched so deal lookups match both `id` and `_id` (CRM stores deals as `_id`); deal `titleOf` and `subOf` also updated to read the CRM's field shape
- `pages/action-plans.html` — every action row gets a Discuss button + counter pill
- `pages/crm.html` — every kanban card gets a Discuss button + counter pill in the top-right corner; click on the discuss button opens the record modal instead of the edit modal
- `index.html` — loads `lib/widgets.js`; added `tab-count` CSS for the comment count badge

This is the single feature that converts "we should put it in the Command Centre" from a discipline problem into a default behaviour — conversations happen inside the records, not over them in Slack.

### Commit 45 - Foundation primitives + Inbox + Activity + Trash
*Commit: [`d0a577`](https://github.com/VYVEHealth/vyve-command-centre/commit/d0a577cab52a9cd83b59598db82ec7b74cf222af)*

Five new primitives in `lib/` and three new pages. The primitives are designed so any page can hook into them without knowing about the others:

- **`lib/entities.js`** — Central registry mapping each entity type (action, task, deal, session, compliance, client, intel, competitor, content, podcast) to `{label, icon, route, list(), get(id), titleOf(r), subOf(r), ownerOf(r), statusOf(r), dueOf(r)}`. Lets Inbox/Search/Comments/Audit/Notifications enumerate the same surface.
- **`lib/store.js`** — Storage abstraction: `logChange(type, id, who, op, diff)`, `history(type, id)`, `softDelete(type, id, record, who)`, `restore`, `purge`, `trash`, `isDeleted`, `diff(before, after)`. Local-first now; same API will swap to Supabase backend later.
- **`lib/comments.js`** — Threaded comments keyed by `type:entity_id`. Auto-parses `@mentions` and fires notifications via `VYVE_NOTIFS.push`.
- **`lib/notifications.js`** — Per-user notification queue powering the topnav bell + the Inbox mentions strip. `push/list/unread/markRead/markAllRead`.
- **`lib/views.js`** — Per-page saved-view storage: `listForPage(page)`, `add(page, name, filters)`, `remove(id)`, `pin(id, bool)`, `pinned()`.

Pages:

- **`pages/inbox.html`** — Aggregates everything that needs Lewis today: overdue actions, overdue tasks, today/this-week items, blocked actions, compliance due in 7d, sessions today/tomorrow, stalled deals (no update in 14d), and unread @-mentions. 7-count filter bar (All / Overdue / Today / This week / Mentions / Blocked / Stalled). Groups by kind. Click an item → navigates to the source page AND marks the underlying notification as read.
- **`pages/activity.html`** — Cross-record activity feed merging the audit log + comments, sorted by time. Anyone on the team can see what changed across the hub since they last opened it.
- **`pages/trash.html`** — Soft-deleted records with Restore / Purge buttons. Each entry shows what was deleted, by whom, when.

Chrome:

- Notification bell in the topnav (`#topnav-bell`) with red unread-count dot (`#topnav-bell-dot`) that updates on `vyve:notif` and `vyve:notif:read` events
- `window.VYVE_CURRENT_USER` set from the logged-in email so audit/comments/notifications all know who's acting
- Sidebar drawer: Inbox + Activity added to "Daily" section; Trash added to "Org" section
- CSS additions: bell, comment thread, mention chip, comment form, audit pill, filter chips, view tabs

These five pieces are what every subsequent commit (46-49) hooks into. They were built first so the rest could compose cleanly.

## 2026-05-14

### Commits 41-43 - Enterprise top-nav architecture

The Command Centre now feels like an enterprise SaaS (Linear / Stripe / Notion) rather than a sidebar-heavy admin tool. Primary navigation moved to a horizontal top bar of 6 departments; the long sidebar list became a secondary slide-in drawer for power users. Each department has its own hub page of clickable tiles showing live KPIs, and Cmd+K opens a fuzzy quick-search overlay for instant jumps to any page.

**Commit 41 - New chrome (top-nav primary, sidebar drawer secondary)**
- Top navigation bar with 6 dept tabs: Daily, Commercial, Marketing, Delivery, Knowledge, Org (sourced from new `window.VYVE_NAV_TOP` config)
- Each tab is a route to that department's hub page (`#/commercial`, `#/marketing`, etc) -- except Daily which still routes to Brief
- Active tab gets teal pale background + bottom underline accent
- Sidebar repositioned as fixed slide-in drawer (transform: translateX(-100%) by default); the hamburger button in the top nav opens it
- Search button in top right shows the search icon + "Search" label + visible `Cmd+K` kbd shortcut hint
- User avatar moves to the top right (next to the search button); same avatar still appears in the drawer footer
- Breadcrumbs row below the main top nav shows path: `VYVE / Commercial / CRM` (clickable, hidden on Brief)
- Router rewritten to render top-nav tabs from `VYVE_NAV_TOP`, set active tab from `VYVE_ROUTE_TO_TOP[slug]`, paint breadcrumbs based on hub + page entry, and resolve hub slugs as valid pages
- Cmd+K quick-search overlay scaffolded (full impl in commit 43)
- Mobile: <1100px hides tab labels (icons only), <900px hides tabs entirely (use hamburger to open drawer for nav)

**Commit 42 - 5 hub pages with tile grids + live KPIs**
- New `pages/commercial.html`, `pages/marketing.html`, `pages/delivery.html`, `pages/knowledge.html`, `pages/org.html`
- Each hub uses the standard page-hero pattern (eyebrow + Playfair title + intro paragraph)
- Below the hero: grid of clickable tiles, 3-up on desktop / 2-up on tablet / 1-up on mobile
- Each tile shows: rounded icon block (teal pale tint), tile label (Playfair), live primary KPI (large), live secondary metric (small right-aligned), animated right-arrow on hover, optional status badge (e.g. "3 overdue" red, "live" teal)
- All KPIs read from `VYVE_DATA` (the shared cross-page intelligence layer):
  - **Commercial**: Finance (cash + runway months), Sales Pipeline (open £ + open deal count), Clients (live + total), Investors (count), Partners (count), Invoicing (unpaid count)
  - **Marketing**: Content (in-flight + 30d published), Social Blueprint, Performance (30d reach + LinkedIn growth %), Podcast (published + in-production), Brand
  - **Delivery**: Sessions (this week + 48h), Tasks (active + overdue badge), Compliance (due 30d + soon badge)
  - **Knowledge**: Strategy, Documents (count), Knowledge Base (count)
  - **Org**: Action Plans (completion % + overdue/due-soon badge), Team (members), Settings
- Tiles smooth-hover with translateY(-2px) + shadow lift + accent border colour
- Tile primary number uses the Playfair display face at 24px; large enough to scan instantly

**Commit 43 - Full Cmd+K quick search**
- Fuzzy match across all pages (hubs + flat nav items) with weighted scoring: exact-match > starts-with > contains > subsequence
- Keyboard nav: Up/Down to move, Enter to open, Esc to close, Cmd+K (or Ctrl+K) to toggle
- Click on the search button in the top nav also opens the overlay
- Results show: square rounded icon, label (Playfair-style weight), section name (muted sub)
- Active result gets teal-pale background; mouse hover updates active index in sync with keyboard
- Empty state on no query: shows last 5 recently-visited pages (stored in `localStorage` under `vyve.qs.recent`), or top hub pages if no history
- "No matches for X" empty state for failed searches
- Recents auto-update on every page navigation (excluding the Brief launchpad)
- Smooth backdrop blur, slide-in animation, esc-key kbd hint visible in footer

### Commits 32-39 — Authentic VYVE design system

Major redesign pass to make the Command Centre feel like an enterprise platform and authentic to VYVE rather than a generic admin UI. Aligned to the vyvehealth.co.uk brand voice ("Build health before it breaks.") and visual language.

**Commit 32 — Design tokens v2**
- Three-pillar accent system: Physical (gold), Mental (teal), Social (coral) used throughout
- Warmer cream-white neutrals (#F7F5F0) matching the marketing site, not cold mint
- Full typographic scale (--fs-xxs through --fs-hero at 56px) for proper hierarchy
- Real elevation shadows (--shadow-xs through --shadow-xl + --shadow-focus for keyboard nav)
- Italic Playfair Display variant loaded for the brand motto
- Letter-spacing scale, z-index scale, motion scale

**Commit 33 — Chrome rebuild**
- Sidebar: VYVE wordmark + "Command Centre" eyebrow + italic tagline "Build health before it breaks."
- Sidebar nav: left-edge accent on active items, refined hover states, subtle gradient background
- Sidebar footer: user avatar circle (gradient teal) + email + sign-out + version stamp
- Topbar: time-aware greeting (Good morning / afternoon / evening / Working late) with real-time clock-style date, page context on right
- Login screen: full-bleed two-pane experience with brand-side (radial gradients + "Build health before it breaks." hero) and form-side (refined inputs with proper focus rings)
- Modal overlay: backdrop blur, modal entry animation
- Toast: pill shape with subtle elevation

**Commit 34 — Components rebuild**
- Three stat sizes by importance: stat-hero (56px num), stat (medium, 30px), stat-mini (inline)
- Pillar accent classes: .pillar-tag.physical|mental|social, .pillar-heading, pillar-tinted stat top-borders
- Cards now have real elevation (--shadow-xs default, --shadow-sm on hover, --shadow-md for elevated variant)
- Buttons: refined focus rings via --shadow-focus, btn-sm and btn-lg variants, btn:active scale animation
- Form inputs: uppercase eyebrow-style labels, larger padding, focus shadow ring (not just border colour)
- Tabs: cleaner pill design with proper depth
- List rows: gentle hover background, proper truncation
- Action Plans member cards: refined with gradient avatars, smoother transitions
- Pillar-tinted avatars (.ap-avatar.physical|mental|social)
- Section divider component with optional centred label
- Page hero pattern (.page-hero + eyebrow + page-title + page-sub)

**Commit 35 — Brief redesign**
- Greeting hero block with eyebrow ("Morning Brief"), large Playfair greeting ("Morning, Lewis."), italic motto, real-time clock + day label, refresh button
- KPI hierarchy: dark hero stat showing Action Plans completion (the metric that drives everything) + 3 supporting stats (reach, MRR, pipeline)
- Hero stat sits on a dark gradient with a glowing teal pulse dot
- Pillar tags now appear on Sessions items where pillar is set
- Action Plans card uses pillar-aware mini avatars
- Real-time clock updates every 30 seconds, greeting transitions phase by hour

**Commit 36 — Dashboard redesign**
- Page-hero intro block with eyebrow + Playfair headline + intro paragraph
- Top KPI row: hero stat (Open pipeline — most important number for a pre-revenue company) + 3 supporting (MRR, reach, posts)
- Section dividers use the new .section-divider pattern (subtle horizontal line with centred uppercase label)
- LinkedIn chart: refined SVG with smoother curve, larger latest-point indicator, teal brand colour, cream tick lines
- Channel breakdown: tabular-style metrics with uppercase eyebrow labels
- Team health stripe: pillar-tinted member avatars, hierarchy of badges (overdue red, blocked red, active teal)
- All section dividers reskinned uniformly

**Commit 37 — Action Plans page hero + pillar avatars**
- Page hero with "Team Operating System" eyebrow
- Each member's avatar coloured by department:
  - Physical (Calum): gold gradient
  - Mental (Lewis, Dean, Alan, Phil, Ryan): teal gradient
  - Social (Vicki, Cole, Azuza): coral gradient

**Commit 38 — Action Plans avatar fix**
- Patched inline CSS specificity so pillar classes win
- Larger avatar (38px), gradient backgrounds, white text, subtle elevation

**Commit 39 — Page hero applied consistently**
- All 20 pages now use the consistent VYVE page hero pattern: uppercase eyebrow accent, Playfair page-title, muted intro paragraph
- Pages: Intel, Competitors, Tasks, Strategy, Team, Performance, Podcast, Content, Compliance, Finance, CRM, Clients, Sessions, Partners, Knowledge, Invoicing, Investor, Brand, Documents, Settings

The Brief and Dashboard remain the "showcase" pages with the hero stat treatment. Every other page gets the consistent intro pattern so the hub feels like one product, not a collection of templates.

### Commit 30 — Mobile polish (swipe + tap targets)
- Sidebar swipe-to-close gesture: swipe right from left edge to open, swipe left on drawer to close.
- Larger tap targets on Action Plans (member-head min 56px tall, status pill 5px×11px padding).
- Action Plans avatar grown to 40×40 on mobile.
- Settings tabs scroll horizontally on narrow screens so all 5 tabs are reachable.
- Topbar doesn't wrap on mobile; current crumb truncates with ellipsis instead.
- Brief subtitle font/line-height tuned for tiny mobile screens.

### Commit 29 — Intel + Competitors full CRUD
- `pages/intel.html` rewritten — Grants / Legislation / Research tabs, KPI row (Total / Grants / Legislation / Research), full add/edit/delete modal with title, type, source, summary, link, deadline.
- `pages/competitors.html` rewritten — KPI row (Total / Pricing moves / Product launches / Positioning), search filter, full add/edit/delete modal with competitor, type, title, summary, link.
- Both pages read from Make if token configured, fall back to localStorage.
- Seeded 10 intel signals (Innovate UK / Nesta / Sport England grants; HSE psychosocial guidance, ICO AI health-data guidance, Employment Rights Bill 2025; HSE 2025 stats, Deloitte £56bn report, CIPD survey, WHO mental health at work).
- Seeded 6 competitor signals (Headspace Health, Calm Health, Unmind, Oliva, Perci pricing, Big Health funding).
- SEED_VERSION bumped to `2026-05-14.4`.

### Commit 28 — Auto-pull from Make + freshness indicator
- `lib/make.js` extended with `lastRefreshedAt(key)`, `autoPullPerformance/Podcast/Content(thresholdMs)`.
- Performance/Podcast/Content auto-trigger a Make refresh on page load if token configured and last refresh > 1h ago.
- Tiny "refreshed Nm ago" indicator next to the manual Refresh button.
- No-op gracefully if no token / no store ID / threshold not crossed.

### Commit 27 — Pre-seed Action Plans flat cache
- 150 actions seeded into `vyve_action_plans_full` on first load so Brief/Dashboard surface them without Lewis needing to visit the Action Plans page first.
- All seeded as not-started, no deadlines, 0% progress.
- Page itself rewrites this cache on every render, so user edits via the Action Plans page always overwrite the seed.
- SEED_VERSION bumped to `2026-05-14.3`.

### Commit 26 — README & Changelog
- Added this README documenting architecture, file layout, conventions, roadmap.
- Added CHANGELOG.md with full commit-by-commit history.

### Commit 25 — Settings Diagnostics tab
- Live data inspector: every `vyve_*` localStorage key with record count + size + status.
- Click any row → jumps to the source page.
- **Export all** — download all VYVE local data as JSON.
- **Re-seed** — replays seed (preserves user-edited data).
- **Force re-seed** — wipes all VYVE keys first, then re-seeds.
- **Wipe all** — nuclear option with double confirmation.

### Commit 24 — Phase 3 content seed (Compliance, Sessions, CRM, Clients, Investors)
- **16 compliance items** across CIC governance, GDPR, clinical safety, security, legal, employment, HSE.
- **7 sessions** placeholders (Connect Challenge launch, pilot intros, team offsite, clinical reviews, etc).
- **6 deals** placeholder pipeline (lead → contacted → discovery → demo → proposal stages).
- **1 clients** template row (replace when first client signs).
- **6 investors** in pipeline (angels, grants, seed lead).
- `pages/investor.html` patched to fall back to localStorage when Make isn't configured.
- SEED_VERSION bumped to `2026-05-14.2`.

### Commit 23 — Configurable strict-deny auth
- `window.VYVE_CONFIG.auth.strict` toggle, defaults `false` (permissive — current behaviour).
- New **Auth & Access** tab in Settings with a clear warning: "Only flip on once Dean confirms `admin_users` table and `is_admin()` RPC are live, otherwise you will be locked out."
- `lib/auth.js` reads the flag and denies (vs. permissive fallback) when RPC missing/errored.

### Commit 22 — Refresh-from-Make buttons + pre-filled store IDs
- ↻ Refresh from Make button on Performance / Podcast / Content pages.
- `lib/make.js` extended with `refreshPerformance()` / `refreshPodcast()` / `refreshContent()` helpers.
- Transform fns map Make record shape → local VYVE shape.
- Settings now has `performance` / `podcast` / `posts` store-key inputs pre-filled with the known IDs (107716 / 113609 / 106900).
- Graceful error messaging when token or store ID missing.

### Commit 21 — Mobile responsive pass
- Hamburger button in topbar (only visible <900px) toggles slide-in sidebar drawer.
- Dim overlay behind drawer, closes on route change, overlay click, or Esc.
- KPI grids stack: 4-col → 2-col under 900px → 1-col under 480px.
- Action Plans member headers wrap, progress bar hides on tight screens, action rows stack pill + text.
- Modal shrinks to 96% width with adjusted padding on tiny screens.

### Commit 20 — Phase 2 content seed (Strategy, Team, Knowledge, Tasks, Partners)
- **Strategy:** North Star, Mission/Vision, 3 OKR sets (Q2/Q3/Q4 2026 with 12 KRs), 4 foundational decisions, full SWOT.
- **Team:** 11 members with role, dept, responsibility, OKRs.
- **Knowledge:** 8 LewisBrain playbooks (Morning Brief, Brain Sync, Agent Sync, Content Creation, Grant Application, Investor Comms, Partnerships, Sales Pipeline).
- **Tasks:** 15 priority tasks across owners, with deadlines/statuses/priorities.
- **Partners:** 8 partners across Corporate, Tech, Research, Social Impact, Channel categories.
- SEED_VERSION bumped to `2026-05-14.1`.

### Commit 19 — Dashboard wires Action Plans
- Action Plans KPI card added to Delivery & Ops row.
- New **team health stripe**: per-member completion % + in-progress/blocked/overdue badges, sorted overdue-first.

## 2026-05-13

### Commit 18 — Brief surfaces Action Plans
- "Active tasks" KPI → "Action plans" (completion %, overdue count in red).
- New **Action plans** card in right column: overdue + due-soon items with member initial avatars, sorted overdue-first.
- Click-through to Action Plans page.

### Commit 17 — Action Plans page
- 150 priority actions × 10 team members from Lewis's individual action plans document.
- KPI row (Complete %, In progress, Blocked, Overdue).
- Filter pills (all / not-started / in-progress / blocked / done / overdue / due-soon).
- Expandable member cards with progress bars.
- Click action → edit modal (status / deadline / progress % / notes).
- Auto-progress (Done→100%, Not started→0%).
- Export JSON.
- Writes flat cache (`vyve_action_plans_full`) so `lib/data.js` can read actions for Brief/Dashboard.
- `VYVE_DATA.actions.overdue() / dueSoon() / byMember() / completionPct()` exposed.

### Commit 16 — Riverside external link
- New sidebar item under Podcast → opens riverside.fm/dashboard/home in new tab.

### Commit 15 — Shared Documents external link
- New sidebar item under Knowledge → opens Google Drive in new tab.

### Commit 14 — Cross-page intelligence layer
- New `lib/data.js` — shared read API (`VYVE_DATA.tasks/sessions/deals/clients/finance/compliance/intel/competitors/performance/podcast/content`).
- **Brief rewrite** — 4 live KPIs + Today's priorities + Closing this month + Sessions + Compliance + Fresh intel + Recent activity.
- **Dashboard rewrite** — top KPIs + Commercial/Marketing/Delivery sections + LinkedIn SVG chart + channel breakdown + recent activity.
- All stat cards clickable → jump to source page.
- New `.list-row` family in components.css.

### Commit 13 — Social Content Machine Blueprint
- Lewis's master blueprint converted to a native page (48KB).
- 9 sections (Audit, Architecture, Rhythm, Categories, Platforms, Fix Plan, Tasks, Quality, KPIs).
- Sticky section nav, clickable Fix Plan steps + Activation Tasks tracked in localStorage.

### Commit 12 — Seed real Make.com data
- 93 performance records (31 days × 3 platforms) — real LinkedIn growth from 1707→1993 impressions.
- 53 podcast episodes from full Everyman library (2023-2025).
- 6 content items (W16/W17 posts).
- Skip-if-existing + SEED_VERSION versioning.

### Commit 11 — Social Media external link pattern
- Sidebar pattern: `href + external:true` opens in new tab.
- Social Media → Metricool (blocked from iframing).

### Commit 10 — Social Media iframe attempt
- Tried iframing Metricool — blocked by X-Frame-Options. Reverted in commit 11.

### Commit 9 — Auth wiring
- Magic-link sign-in + admin allowlist gating.
- Permissive fallback until Dean's `admin_users` table is live.

### Commit 8 — Intel Hub iframe
- Embeds vyvehealth.github.io/vyve-intel-hub as a hosted page within the sidebar.

### Commit 7 — CSS cleanup
- `.modal-body` rule for modal padding.

### Commit 6 — 9 skeleton → real pages
- Clients, CRM, Partners, Tasks, Invoicing, Sessions, Documents, Knowledge, Team — built from skeletons to functional pages.

### Commit 5 — Podcast + Brand + Finance + Compliance built
- Each page with KPIs, lists/kanbans, modals, localStorage CRUD.

### Commit 4 — Strategy + Content + Performance built
- Strategy: tabs for North Star / OKRs / Decisions / SWOT.
- Content: unified content pipeline (LinkedIn / podcast / blog / newsletter).
- Performance: reach + engagement + conversion across channels.

### Commit 3 — 22 page partials
- All `pages/*.html` files scaffolded — most as skeletons.

### Commit 2 — Lib layer
- router.js, make.js, supabase.js, auth.js stub, ui.js helpers.

### Commit 1 — Chrome layer
- tokens.css, shell.css, components.css, sidebar-config.js.

---

**Last updated:** 2026-05-14
