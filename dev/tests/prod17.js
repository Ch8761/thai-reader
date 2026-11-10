const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(800); await p.click('.tool[data-mode="hl"]');
  await p.screenshot({ path: 'tests/prod17.png' });
  await p.click('.tabbar [data-tab="settings"]'); await p.click('#openHelp'); await p.waitForTimeout(300);
  await p.click('#helpTabs button:has-text("閱讀")'); await p.waitForTimeout(200);
  await p.click('#helpBody button >> nth=0').catch(()=>{}); await p.waitForTimeout(800);
  await p.screenshot({ path: 'tests/prod17-help.png' });
  console.log('ver', await p.evaluate(() => document.body.innerText.match(/1\.12\.0/) ? 'has 1.12.0' : 'no ver text'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
