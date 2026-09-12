#!/usr/bin/env node
/* PM-1208: assembles the portal pages from src/portal/ slices.
   Each page = head.html + body.html + "<script>\n" + ordered js slices + "</script>\n" + tail.html,
   so every page is still ONE classic-script IIFE in ONE scope (function hoisting + last-declaration-wins
   shadowing behave exactly as they did in the monolith). Run from the repo root:
     node tools/build-portals.js            # build all pages, print md5 of each
     node tools/build-portals.js --check    # exit 1 if any generated file differs from what is on disk
   Sources are the truth. Edit the generated .html directly and the next build reverts you. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'portal');
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const check = process.argv.includes('--check');
const read = (p) => fs.readFileSync(path.join(SRC, p));
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
let failed = 0;
for (const [page, spec] of Object.entries(manifest.pages)) {
  const parts = [read(spec.head), read(spec.body), Buffer.from('<script>\n')];
  for (const s of spec.js) parts.push(read(path.join('js', s)));
  parts.push(Buffer.from('</script>\n'), read(spec.tail));
  const out = Buffer.concat(parts);
  const dest = path.join(ROOT, page);
  const onDisk = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
  const same = onDisk && onDisk.equals(out);
  if (check) {
    console.log((same ? 'OK   ' : 'DIFF ') + page + ' ' + md5(out).slice(0, 8));
    if (!same) failed++;
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + page + ' ' + out.length + ' bytes md5 ' + md5(out).slice(0, 8) + (onDisk ? (same ? ' (unchanged)' : ' (changed)') : ' (new)'));
  }
}
if (check && failed) process.exit(1);
