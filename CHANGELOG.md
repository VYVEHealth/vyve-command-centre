# Changelog — VYVE Command Centre

All notable changes documented commit-by-commit. Each entry links to the GitHub commit.

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
