const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, n] of [[820, 1180, 'ipad'], [390, 844, 'phone']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500);
    await p.screenshot({ path: `tests/home-${n}.png` });
  }
  await b.close();
})();
