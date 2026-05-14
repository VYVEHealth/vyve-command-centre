# Supabase migration — Hub data layer

**Status:** Commit C — adapter built, no live switchover. Hub still uses localStorage as primary data source for entities. Active Users and Documents pages are live on Supabase already (read-only and storage-only, respectively).

## What’s live on Supabase today

| Surface | Tables/buckets | Mode |
|---|---|---|
| `/active-users` | `members`, `member_activity_log`, `weekly_scores`, `admin_users` | **Read-only** |
| `/documents` | `cc_documents` + bucket `cc-documents` | **Read + write** (uploads, downloads, deletes) |
| Auth gate | `auth.users`, `admin_users` | Magic link + allowlist check |

## What’s NOT live

Every other entity in the hub (tasks, deals, clients, sessions, investors, finance, intel, partners, content, invoices) still persists to localStorage + Make.com. The cc_* tables exist in Dean’s Supabase project but the hub does not write to them yet.

## How the adapter works

`lib/cc-adapter.js` is a translation layer between the hub’s localStorage shape and Dean’s `cc_*` table schema. It exposes:

- `VYVE_CC_ADAPTER.ENTITIES` — the full mapping table per entity
- `VYVE_CC_ADAPTER.toCcRow(entity, hubObject)` — forward conversion (write path)
- `VYVE_CC_ADAPTER.fromCcRow(entity, ccRow)` — reverse conversion (read path)
- `VYVE_CC_ADAPTER.isEnabled(entity)` / `setEnabled(entity, bool)` — per-entity feature flag

Flags are stored in `localStorage["vyve.cc.adapter"]`. **All flags default to OFF.** Pages do not yet check these flags — they will when we flip the live switch in a future commit.

## Per-entity mapping

Each row of each mapping table is `hub_field → cc_field`. “Missing on cc side” means the hub has a field that has no destination column in Dean’s schema. Those entities will lose data on migration unless Dean adds the columns.

### Tasks (cc_tasks)

| Hub field | cc field |
|---|---|
| title | title |
| owner | assignee |
| status | stage |
| priority | priority |
| due | due_date |
| notes | notes |

**Missing on cc side:** `area`, `pillar`, `completed_at`

### Deals (cc_clients) — ambiguous: see note

| Hub field | cc field |
|---|---|
| name | company |
| contact | contact |
| contact_email | email |
| value | value |
| stage | stage |
| notes | notes |

**Missing on cc side:** `pillar`, `phone`, `next_step`, `last_contact`

**Note:** Dean’s `cc_clients` table mixes what the hub treats as two distinct entities: prospect deals (in the sales pipeline) and active clients (post-signing). Suggest a Dean conversation about whether to (a) split into `cc_deals` + `cc_clients`, or (b) use a `stage` column to discriminate.

### Clients (cc_clients)

| Hub field | cc field |
|---|---|
| name | company |
| contact | contact |
| email | email |
| phone | phone |
| value | value |
| stage | stage |
| notes | notes |

**Missing on cc side:** `programme`

### Sessions (cc_sessions)

| Hub field | cc field |
|---|---|
| title | title |
| client | client |
| date | session_date |
| facilitator | facilitator |
| notes | notes |

**Missing on cc side:** `pillar`, `time`, `format`, `attendees`, `duration_minutes`

The pillar field is the biggest gap here. The three-pillar attention bar on the Brief depends on tagging sessions with a pillar. **Recommend Dean add `pillar text` column to `cc_sessions`.**

### Investors (cc_investors)

| Hub field | cc field |
|---|---|
| name | name |
| contact | contact |
| contact_email | email |
| type | type |
| stage | stage |
| amount | amount |
| next_step | next_action |
| notes | notes |

**Missing on cc side:** `round`, `last_contact`

### Finance (cc_finance)

| Hub field | cc field |
|---|---|
| mrr | mrr |
| burn | burn |
| cash | cash |
| date | recorded_date |
| notes | notes |

**Missing on cc side:** `arr`, `runway_months`, `payroll`

`runway_months` is computed by the hub from cash ÷ burn — not strictly needed on the cc side. ARR is `mrr * 12` and same story. Payroll would need a new column if tracked separately.

### Intel (cc_intel)

| Hub field | cc field |
|---|---|
| type | type |
| title | title |
| body | body |
| source | source |
| relevance | relevance |

**Missing on cc side:** `url`, `tags`, `pillar`

### Partners (cc_partners)

| Hub field | cc field |
|---|---|
| name | name |
| contact | contact |
| email | email |
| type | type |
| stage | stage |
| value | value |
| notes | notes |

**Missing on cc side:** `phone`, `next_step`

### Content (cc_posts)

| Hub field | cc field |
|---|---|
| channel | platform |
| body | copy |
| pillar | pillar |
| status | status |
| publish_date | scheduled_date |

**Missing on cc side:** `title`, `owner`, `hook`, `tags`, `due`

Title is a critical loss — the hub’s content list shows titles, not just copy. **Recommend Dean add `title text` column to `cc_posts`.**

### Invoices (cc_invoices)

| Hub field | cc field |
|---|---|
| client | client |
| amount | amount |
| due | due_date |
| status | status |
| notes | notes |

**Missing on cc side:** `invoice_number`, `date_issued`, `date_paid`

## Recommended schema additions on Dean’s side

Before flipping any flags, the following columns would smooth migration. None of these break existing rows because all cc_* tables are empty.

```sql
ALTER TABLE cc_tasks ADD COLUMN area text, ADD COLUMN pillar text, ADD COLUMN completed_at timestamp with time zone;
ALTER TABLE cc_sessions ADD COLUMN pillar text, ADD COLUMN session_time text, ADD COLUMN format text, ADD COLUMN attendees integer, ADD COLUMN duration_minutes integer;
ALTER TABLE cc_investors ADD COLUMN round text, ADD COLUMN last_contact date;
ALTER TABLE cc_intel ADD COLUMN url text, ADD COLUMN tags text, ADD COLUMN pillar text;
ALTER TABLE cc_partners ADD COLUMN phone text, ADD COLUMN next_step text;
ALTER TABLE cc_posts ADD COLUMN title text, ADD COLUMN owner text, ADD COLUMN hook text, ADD COLUMN tags text, ADD COLUMN due date;
ALTER TABLE cc_clients ADD COLUMN pillar text, ADD COLUMN phone text, ADD COLUMN next_step text, ADD COLUMN last_contact date;
ALTER TABLE cc_invoices ADD COLUMN invoice_number text, ADD COLUMN date_issued date, ADD COLUMN date_paid date;
```

These are non-destructive: adding nullable columns to empty tables is a no-op for existing data and only adds optionality.

## Recommended migration order

Lowest risk first. Each step:
1. Backfill localStorage → cc_* with the adapter
2. Toggle the entity flag on
3. Use the hub for a day
4. Watch for issues
5. If clean, leave on. If not, toggle off (data stays in cc_*)

1. **Tasks** — small data volume, simple schema, well-understood
2. **Content** — add `title` column first, then migrate
3. **Sessions** — add `pillar` column first
4. **Intel** — mostly write-only audit log
5. **Partners**
6. **Clients** (post-Dean split decision)
7. **Investors**
8. **Finance** — highest-impact data, leave for last when confident

## Auth and access

All `cc_*` tables have RLS enabled with policy `cc_team_only`, which checks `admin_users` for the current session’s email. So:

- A user with no Supabase session: cannot read or write any cc_* table.
- A user with a Supabase session but not on `admin_users`: cannot read or write.
- A user on `admin_users` with `active = true`: full access.

The hub also performs a client-side `admin_users` lookup after `getSession()` to render a clean "access denied" page rather than failing tool calls.

## Buckets

- `cc-documents` (private, 50MB limit, mime-restricted to common doc/image types) — in use by the Documents page.
- Other buckets (`certificates`, `exercise-videos`, `exercise-thumbnails`, `gdpr-exports`) belong to the portal. Hub does not touch them.

## Anon key location

`lib/supabase-client.js` line 11. The anon JWT is safe to commit because RLS gates everything. The service role key is **never** to be put in client code.

## Open questions for Dean

1. `cc_clients` mixes deals and active clients — split or discriminate?
2. Schema additions above OK to apply?
3. What’s the source of truth for finance numbers — the hub’s `cc_finance` table or some upstream system?
4. Should the hub auth share session with the portal (i.e. one login covers both), or require a separate sign-in?
