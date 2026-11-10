const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [nm, opt] of [['ipad', { viewport: { width: 820, height: 1180 } }], ['phone', devices['iPhone 13']]]) {
    const p = await (await b.newContext(opt)).newPage();
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
    await p.screenshot({ path: `tests/vh-${nm}-0.png` });
    await p.setInputFiles('#imgfile', ['vidtest2/hard.mp4']); await p.waitForTimeout(400);
    await p.screenshot({ path: `tests/vh-${nm}-1.png` });
    await p.waitForSelector('#vidPick:not([hidden])', { timeout: 60000 }); await p.click('#vpGo'); await p.waitForTimeout(2500);
    await p.screenshot({ path: `tests/vh-${nm}-2.png` });
  }
  await b.close();
})();
