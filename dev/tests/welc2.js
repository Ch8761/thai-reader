const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext(devices['iPhone 13'])).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'tests/welc2.png' }); await b.close(); })();
