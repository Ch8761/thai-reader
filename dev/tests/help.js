const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1200);
await p.click('.tabbar [data-tab="settings"]'); await p.click('#openHelp'); await p.waitForTimeout(300); await p.screenshot({ path: 'tests/h-1.png' });
await p.click('#helpTabs button:nth-child(2)'); await p.waitForTimeout(800); await p.screenshot({ path: 'tests/h-2.png' });
await p.click('#helpBody details summary'); await p.waitForTimeout(300); await p.screenshot({ path: 'tests/h-2open.png' });
await p.evaluate(() => { localStorage.setItem('thai-theme','dark'); document.documentElement.setAttribute('data-theme','dark'); }); await p.waitForTimeout(200); await p.screenshot({ path: 'tests/h-dark.png' });
console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close(); })();
