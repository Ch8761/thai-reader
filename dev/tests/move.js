const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [nm, opt] of [['ipad', { viewport: { width: 820, height: 1180 } }], ['phone', devices['iPhone 13']]]) {
    const p = await (await b.newContext(opt)).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); 
    await p.goto('http://127.0.0.1:8765/index.html?movetest=1'); await p.waitForTimeout(1500);
    await p.screenshot({ path: `tests/move-${nm}.png` });
    console.log(nm, 'box', await p.isVisible('.movebox'), await p.textContent('.movebox .mvsync'));
    await p.click('.movebox .mvsync'); await p.waitForTimeout(300); console.log('-> settings sub', await p.textContent('#h-settingsv'));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1000); console.log('no box on other host', await p.locator('.movebox').count());
    console.log('ERRORS:', errs.join(' | ') || 'none');
  }
  await b.close(); })();
