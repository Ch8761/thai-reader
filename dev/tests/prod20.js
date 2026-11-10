const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [name, opt] of [['ipad', { viewport: { width: 1024, height: 1180 } }], ['phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 }]]) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(2500);
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
    await p.click('#checkUpd'); await p.waitForTimeout(2500);
    console.log(name, 'upd:', await p.evaluate(() => document.getElementById('updMsg').textContent));
    await p.locator('#checkUpd').scrollIntoViewIfNeeded();
    await p.screenshot({ path: `tests/pr-${name}-set.png` });
    await p.click('.tabbar [data-tab="home"]');
    await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
    await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
    await p.waitForTimeout(800); await p.click('.tool[data-mode="ink"]'); await p.waitForTimeout(200);
    await p.screenshot({ path: `tests/pr-${name}-doc.png` });
    console.log(name, 'ERRORS:', errs.join(' | ') || 'none'); await ctx.close();
  }
  await b.close();
})();
