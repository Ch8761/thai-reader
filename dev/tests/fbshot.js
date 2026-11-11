const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: Number(process.argv[2]) ? { width: Number(process.argv[2]), height: 1100 } : { width: 820, height: 1180 }, deviceScaleFactor: 1 })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.click('#openSettings'); await p.locator('.fbrow').scrollIntoViewIfNeeded();
  const r = await p.$eval('.fbrow', e => { const r = e.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }; });
  await p.screenshot({ path: 'tests/fbrow.png', clip: r });
  console.log(await p.$eval('.fbrow .setlabel', e => JSON.stringify(e.getBoundingClientRect())));
  await b.close();
})();
