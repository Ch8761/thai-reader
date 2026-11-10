const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/prodset.png' }); await b.close(); })();
