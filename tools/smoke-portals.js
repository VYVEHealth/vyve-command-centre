#!/usr/bin/env node
/* PM-1208: load-time smoke test for the generated portal pages. Runs each page in jsdom with a stubbed
   supabase-js (no network), fails on any uncaught error while the page's scripts execute and boot() runs
   to the login screen. Catches the class of bug a split introduces: a slice wired against an element id
   the page's body does not have, or a call into a name the page does not include.
     npm i jsdom   (dev only, not committed)
     node tools/smoke-portals.js */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const pages = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'src/portal/manifest.json'), 'utf8')).pages);
let bad = 0;
(async () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<script src="[^"]+"><\/script>\n/g, '');
    const errors = [];
    const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errors.push(String(e && (e.detail || e.message || e))));
    const dom = new JSDOM(html, { runScripts: 'outside-only', virtualConsole: vc, url: 'https://admin.vyvehealth.co.uk/' + page });
    const w = dom.window;
    w.supabase = { createClient: () => ({ auth: {
      getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}), signInWithPassword: async () => ({ error: null }),
      signOut: async () => ({}), resetPasswordForEmail: async () => ({ error: null }), updateUser: async () => ({ error: null }) } }) };
    w.fetch = async () => ({ ok: true, status: 200, json: async () => [], text: async () => '[]' });
    w.addEventListener('error', (e) => errors.push('window.error: ' + (e.message || e)));
    for (const m of html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)) {
      try { w.eval(m[1]); } catch (e) { errors.push('script threw: ' + (e && e.message)); }
    }
    await new Promise((r) => setTimeout(r, 400));
    const loginShown = w.document.getElementById('login-overlay').classList.contains('show');
    const ok = !errors.length && loginShown;
    console.log((ok ? 'OK   ' : 'FAIL ') + page + (loginShown ? ' (login screen reached)' : ' (login screen NOT reached)'));
    for (const e of errors) console.log('       ' + e.slice(0, 300));
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
})();
