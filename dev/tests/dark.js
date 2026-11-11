const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: 'dark' }); const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-font','wenkai'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(800); await p.click('.tool[data-mode="ink"]');
  await p.screenshot({ path: 'tests/d-doc.png' });
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300); await p.screenshot({ path: 'tests/d-set.png' });
  await b.close();
})();
