# Portal sources (PM-1208)

`coach-portal.html` (and, from Wave 0 of the physio product, `physio-portal.html`) are **generated**.
The sources are the slices in this folder; `manifest.json` lists, per page, which slices go in and in what order.

    node tools/build-portals.js          # rebuild every page
    node tools/build-portals.js --check  # non-zero exit if a generated page on disk differs from its sources

Each page is assembled as `head.html + body.html + <script> + js slices + </script> + tail.html`, so the result
is still one classic-script IIFE in one scope: function hoisting and the "last declaration wins" shadowing the
portal has relied on since PM-983 behave exactly as they did in the monolith. The first build reproduced the
PM-1207 `coach-portal.html` byte-for-byte (md5 `b9cd64b0`).

Rules:

- **Edit the slices, never the generated `.html`.** A direct edit is reverted by the next build.
- Commit the sources **and** the rebuilt output in the same commit. Cloudflare serves the output as a static file;
  there is no build step on their side.
- Slice order is the monolith's order. `js/` names are numbered for that reason; the manifest is the authority.
- Moving a top-level `function` declaration between slices is semantically neutral (hoisting). Moving a top-level
  `var`, a nested IIFE, or any other executable statement is NOT — it changes execution order.
- `tools/build-portals.js` refuses to build a page whose slices reference a top-level name no included slice
  defines (the physio page must never pull in a coaching name). It scans every `.js` under `src/portal/`.
- `node tools/smoke-portals.js` (needs `npm i jsdom`, dev only) executes each generated page in jsdom with a
  stubbed supabase-js and fails on any load-time error or if the login screen is not reached. Run it before
  every commit that touches a slice.

## Pages

| Page | Sources | Notes |
|---|---|---|
| `coach-portal.html` | `shared/head-*`, `coach/*`, every `js/*` slice in manifest order | Calum's portal. Slice order = the PM-1207 monolith's order. |
| `physio-portal.html` | `shared/head-*`, `physio/*`, plus `js/010-core`, `080-library-v1`, `105-shared-auth`, `132-shared-library` | The physio face. `physio/app.js` declares the state the shared slices expect and its own init (capability-gated on `partner_partners.capabilities.rehab`)/nav/Patients; `physio/plans.js` (PM-1211) is the rehab plan builder — plans list, prescription editor, library picker, templates (`coach_templates` kind `rehab_plan`), add-patient, Send → `rpc/rehab_apply_plan`; W5 (PM-1216) adds the sub-category chips + "By condition" mode to the picker, condition/phase tagging on templates, and `physio/print.js` (print sheet / PDF fallback); per-page copy is set by reassigning `CP_LOGIN_LEAD`, `CP_RESET_LEAD`, `EX_SHELVES`, `EX_HOME_SHELF`, `EX_CAT_LABEL` before `boot()`. |

Shared slices today: `010-core.js` (Supabase client, `rest()`, `ef()`, scope helpers), `105-shared-auth.js`
(login, forgot-password, recovery, boot), `080-library-v1.js` + `132-shared-library.js` (exercise library:
load/page, card grid, preview sheet, editor, save). Everything else under `js/` is coaching-only. Carving
more shared modules out of the wave zones follows the same rule: move `function` declarations only.

`physio/tail.html` is `coach/tail.html` with the error-reporter `surface` changed — keep them in step.
