const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', String(e))); p.on('console', m => { if (m.type() === 'error') console.log('CE', m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:8765/index.html?movetest=1'); await p.waitForTimeout(2000); console.log(await p.locator('.movebox').count(), await p.evaluate(() => location.search)); await b.close(); })();
