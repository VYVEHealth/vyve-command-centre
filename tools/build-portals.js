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
const readAll = (x) => Buffer.concat((Array.isArray(x) ? x : [x]).map(read));
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
/* Reference check. Every top-level `function` / `var` name declared at 2-space indent in ANY slice is a known
   portal name; a page whose included slices reference a known name that none of its included slices declare
   would throw ReferenceError at the first call. Names inside strings/comments are ignored (crude but adequate). */
const jsPath = (s) => (s.includes('/') ? s : 'js/' + s);
const allSlices = [];
(function walk(d) { for (const e of fs.readdirSync(path.join(SRC, d), { withFileTypes: true })) { if (e.isDirectory()) walk(path.join(d, e.name)); else if (e.name.endsWith('.js')) allSlices.push(path.join(d, e.name)); } })('');
const declRe = /^  (?:async )?function ([A-Za-z_$][\w$]*)|^  var ([^;]*)/gm;
/* split a `var a = {x:1, y:2}, b = [1,2]` declarator list on the commas at bracket depth 0 only */
function splitTop(str) {
  const parts = []; let depth = 0, cur = '', q = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (q) { cur += c; if (c === '\\') { cur += str[++i] || ''; } else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    if (c === ')' || c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur); return parts;
}
function declared(text) {
  const out = new Set(); let m;
  while ((m = declRe.exec(text))) {
    if (m[1]) out.add(m[1]);
    else for (const part of splitTop(m[2])) { const n = /^\s*([A-Za-z_$][\w$]*)/.exec(part); if (n) out.add(n[1]); }
  }
  return out;
}
const sliceText = {}; const sliceDecl = {}; const known = new Set();
for (const f of allSlices) { sliceText[f] = fs.readFileSync(path.join(SRC, f), 'utf8'); sliceDecl[f] = declared(sliceText[f]); for (const n of sliceDecl[f]) known.add(n); }
function refs(text) {
  const t = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  /* names the slice declares locally at any depth (var/let/const, function names, parameters) are not references to the portal scope */
  const local = new Set(); let m;
  const lre = /\b(?:var|let|const)\s+([^;=]+)/g; while ((m = lre.exec(t))) for (const part of m[1].split(',')) { const n = /^\s*([A-Za-z_$][\w$]*)/.exec(part); if (n) local.add(n[1]); }
  const fre = /\bfunction\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g; while ((m = fre.exec(t))) { if (m[1]) local.add(m[1]); for (const p of m[2].split(',')) { const n = /^\s*([A-Za-z_$][\w$]*)/.exec(p); if (n) local.add(n[1]); } }
  const out = new Set(); const re = /(?<![\w$.])([A-Za-z_$][\w$]*)(?!\s*:)/g;
  while ((m = re.exec(t))) if (known.has(m[1]) && !local.has(m[1])) out.add(m[1]);
  return out;
}
function missingNames(list) {
  const files = list.map(jsPath);
  const have = new Set(); for (const f of files) for (const n of sliceDecl[f]) have.add(n);
  const miss = new Set(); for (const f of files) for (const n of refs(sliceText[f])) if (!have.has(n)) miss.add(n);
  return [...miss].sort();
}
let failed = 0;
for (const [page, spec] of Object.entries(manifest.pages)) {
  const parts = [readAll(spec.head), readAll(spec.body), Buffer.from('<script>\n')];
  for (const s of spec.js) parts.push(read(jsPath(s)));
  parts.push(Buffer.from('</script>\n'), readAll(spec.tail));
  const missing = missingNames(spec.js);
  if (missing.length) { console.error('REFUSED ' + page + ': slices reference top-level names no included slice defines: ' + missing.join(', ')); process.exit(2); }
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
