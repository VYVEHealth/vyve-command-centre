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
- `shared/` slices (from Wave 0 phase 2) must not reference coaching-only names; `tools/build-portals.js`
  will refuse to build a page whose slices reference a top-level name no included slice defines.
