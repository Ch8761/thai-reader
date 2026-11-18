const { chromium } = require('playwright');
const pre = process.argv[2] || 'set', devs = (process.argv[3] || 'ipad,phone').split(',');
(async () => {
  const b = await chromium.launch();
  for (const [dev, vp] of [['ipad', { width: 820, height: 1180 }], ['phone', { width: 390, height: 844 }]]) {
    if (devs.indexOf(dev) < 0) continue;
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
    await p.reload(); await p.waitForTimeout(1500);
    await p.evaluate(() => window.__ev("showTab('settings')")); await p.waitForTimeout(300);
    await p.screenshot({ path: 'tests/' + pre + '-' + dev + '-0.png', fullPage: true });
    const rows = ['look', 'read', 'cards', 'ocr', 'words', 'data', 'help'];
    for (let i = 0; i < rows.length; i++) {
      await p.evaluate(k => window.settingsOpen(k), rows[i]); await p.waitForTimeout(400);
      await p.screenshot({ path: 'tests/' + pre + '-' + dev + '-' + rows[i] + '.png', fullPage: true });
    }
    await p.evaluate(() => window.settingsOpen(null));
    console.log(dev, rows.join('|'));
    await p.close();
  }
  await b.close();
})();
