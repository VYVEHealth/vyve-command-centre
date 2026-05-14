# VYVE Command Centre

> The internal operating hub for VYVE Health CIC. Pre-revenue, MVP-stage. Built as a static single-page app on GitHub Pages.

**Live:** [admin.vyvehealth.co.uk](https://admin.vyvehealth.co.uk)
**Repo:** VYVEHealth/vyve-command-centre

---

## What this is

A daily operating dashboard for the VYVE team. Surfaces what matters every morning: priorities, deadlines, pipeline, performance, action plans.

Built around three things:

1. **Morning Brief** — the first page Lewis opens every day. Live KPIs + today's priorities + action plans overdue + closing deals + sessions + compliance + fresh intel + recent activity. Everything synthesised from every other page.
2. **Action Plans** — the 150 priority actions across 10 team members that drive VYVE forward. Each tracked with status, deadline, progress %, and notes.
3. **Dashboard** — full-business KPI roll-up across Commercial, Marketing, Delivery & Ops. Includes a per-member action-plans health stripe.

Everything else (Strategy, Tasks, Sessions, CRM, Clients, Content, Podcast, Performance, Compliance, Knowledge, Team, Partners, Investors, Finance, Invoicing, Brand) feeds into these three views.

## Architecture (in one paragraph)

Static SPA. Hash router pulls in HTML page partials from `/pages/*.html`. Each page reads/writes its own localStorage key (`vyve_<thing>`). A shared data registry (`lib/data.js`) reads across keys and exposes typed accessors that the Brief and Dashboard use. Optional Make.com data-store integration (`lib/make.js`) for live data refresh. Supabase auth (`lib/auth.js`) gates access via magic-link + admin allowlist (currently permissive fallback until Dean's `admin_users` table is live — toggle to strict in Settings).

## Stack

- **Frontend:** vanilla JS + HTML + CSS (no framework, no build step)
- **Routing:** hash-based, custom router in `lib/router.js`
- **State:** browser localStorage, keyed by `vyve_*`
- **Auth:** Supabase magic link + RPC-based admin allowlist
- **Data sources:** Make.com data stores (Analytics, Podcast Episodes, Post Log), plus seed data in `assets/seed-data.js`
- **Hosting:** GitHub Pages on `admin.vyvehealth.co.uk` (CNAME + .nojekyll)
- **Brand:** Dark #0D2B2B, Teal #1B7878, Teal Light #4DAAAA, Gold #C9A84C, Playfair Display + Inter

## File layout

```
.
├── index.html                  # App shell: login overlay, sidebar, topbar, page slot
├── CNAME                       # admin.vyvehealth.co.uk
├── .nojekyll                   # disable Jekyll
├── README.md                   # this file
├── CHANGELOG.md                # commit-by-commit history
├── Dashboard.html              # legacy (preserved)
├── admin-console.html          # Dean's legacy console (preserved)
├── assets/
│   ├── tokens.css              # CSS variables (colours, fonts, radii, spacing)
│   ├── shell.css               # layout (sidebar, topbar, login overlay, mobile drawer)
│   ├── components.css          # widgets (.card, .stat, .list-row, .kanban, modals)
│   ├── sidebar-config.js       # nav structure (sections + items + icons)
│   └── seed-data.js            # one-time real data snapshot from Make
├── lib/
│   ├── router.js               # hash router + page loader
│   ├── make.js                 # Make.com data-store wrapper + refresh helpers
│   ├── supabase.js             # Supabase client init (anon key)
│   ├── auth.js                 # magic-link + admin allowlist
│   ├── ui.js                   # toast, modal, escape, fmt helpers
│   └── data.js                 # shared read API across all pages
└── pages/                      # one HTML partial per route
    ├── brief.html              # Morning Brief — daily synthesis
    ├── intel.html
    ├── competitors.html
    ├── intel-hub.html          # iframes vyvehealth.github.io/vyve-intel-hub
    ├── dashboard.html          # all-up KPIs + chart + team health stripe
    ├── finance.html
    ├── clients.html
    ├── crm.html                # deals pipeline
    ├── investor.html
    ├── partners.html
    ├── invoicing.html
    ├── sessions.html
    ├── tasks.html              # kanban
    ├── compliance.html
    ├── content.html
    ├── social-blueprint.html   # native render of Lewis's social blueprint
    ├── social.html             # external link → Metricool
    ├── performance.html        # social analytics
    ├── podcast.html
    ├── brand.html
    ├── strategy.html           # north star, OKRs, decisions, SWOT
    ├── documents.html
    ├── shared-documents.html   # external link → Google Drive
    ├── knowledge.html          # SOPs, playbooks, templates, reference
    ├── team.html
    ├── action-plans.html       # 150 priority actions × 10 members
    └── settings.html           # config + diagnostics + reset
```

## Setup (for a fresh user)

1. Open https://admin.vyvehealth.co.uk
2. Sign in via magic link (Supabase). On first sign-in, any signed-in user is admitted (permissive mode); flip Settings → Auth & Access → Strict admin gate once Dean's `is_admin()` RPC is live.
3. Optionally enter Make API token in Settings → Integrations → Make.com to enable Refresh-from-Make buttons on Performance / Podcast / Content.
4. Browse — every page already has seed data from `assets/seed-data.js`.

## Refreshing data from Make

Performance, Podcast, and Content pages have **↻ Refresh from Make** buttons that pull the latest records from Make data stores and overwrite local data. Requires Make API token (Settings → Integrations) and the store IDs (pre-filled in Settings → Data Stores).

| Logical key | Store ID | Make data store name |
|---|---|---|
| `performance` | 107716 | VYVE Analytics |
| `podcast` | 113609 | VYVE Podcast Episodes |
| `posts` | 106900 | VYVE Post Log |

## Repo conventions

- **Single source of truth:** Every commit goes via `GITHUB_COMMIT_MULTIPLE_FILES` (Composio) — atomic, handles SHAs.
- **Never touch:** `VYVEHealth/vyve-site` (member portal — Dean), `VYVEHealth/VYVEBrain` (knowledge — Dean), `VYVEHealth/vyve-capacitor` (mobile wrapper). Only the `vyve-command-centre` repo lives here.
- **Seeds versioned via `SEED_VERSION`** in `assets/seed-data.js`. Bumping the version re-enters the seed block on next load; per-key `seedKey()` guards prevent overwriting user edits.

## Roadmap

- **Auth strict-deny** — flip toggle in Settings once Dean's `admin_users` table + `is_admin()` RPC are live in Supabase.
- **Supabase migration** — replace localStorage-per-browser with shared Supabase tables so the whole team sees the same state.
- **Mobile polish** — already responsive; remaining work is gesture-driven drawer animation, larger tap targets on Action Plans.
- **More Make wirings** — Tasks, Compliance, Sessions could also pull from Make stores once Lewis sets those up.

## Built with Claude

This repo is built end-to-end by Claude (Anthropic), driven by Lewis Vines (CEO/founder). See `CHANGELOG.md` for the commit-by-commit history. Architecture and decisions documented in commit messages.

---

**Last updated:** 2026-05-14
