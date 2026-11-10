const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext(devices['iPhone 13'])).newPage();
  await p.goto('http://127.0.0.1:8766/privacy.html'); await p.screenshot({ path: 'tests/priv.png' });
  const q = await (await b.newContext({ viewport: { width: 1024, height: 900 } })).newPage(); await q.goto('http://127.0.0.1:8766/'); await q.evaluate(() => localStorage.setItem('thai-welcome-v1', '1')); await q.reload(); await q.waitForTimeout(1500);
  await q.click('.tabbar [data-tab="settings"]'); console.log(await q.evaluate(() => document.querySelector('#syncRow a').getAttribute('href')), await q.evaluate(() => document.body.innerText.match(/v1\.\d+\.\d+/g)));
  await b.close(); })();
