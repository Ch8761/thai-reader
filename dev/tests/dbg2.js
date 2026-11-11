const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(1500);
await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(3000);
console.log(await p.evaluate(() => { const s = document.getElementById('docsec'); return JSON.stringify([s.getBoundingClientRect().height, getComputedStyle(s).display, getComputedStyle(s).minHeight, ...[...s.children].map(c => [c.id || c.className, c.tagName, c.hidden, getComputedStyle(c).display, Math.round(c.getBoundingClientRect().height)])]); }));
await b.close(); })();
