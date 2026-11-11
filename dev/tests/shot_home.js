const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1', '1'); }); await p.reload(); await p.waitForTimeout(1500);
  const tab = process.argv[2] || 'home'; if (tab !== 'home') await p.evaluate(t => window.__ev("showTab('" + t + "')"), tab);
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'shots/' + (process.argv[3] || tab) + '.png', fullPage: true }); await b.close();
})();
