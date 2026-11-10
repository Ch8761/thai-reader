const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: 'dark' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(process.env.URL); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.click('.tabbar [data-tab="settings"]'); await p.click('#themeGroup button:has-text("淺色")'); await p.waitForTimeout(300);
  const st = async () => p.evaluate(() => [document.documentElement.getAttribute('data-theme'), localStorage.getItem('thai-theme'), getComputedStyle(document.body).backgroundColor].join(' | '));
  console.log('after set:', await st());
  await p.reload(); await p.waitForTimeout(2000);
  console.log('after reload:', await st());
  await p.reload(); await p.waitForTimeout(2000);
  console.log('after reload2:', await st());
  await p.evaluate(() => localStorage.removeItem('thai-theme')); await p.reload(); await p.waitForTimeout(2500);
  console.log('after localStorage wiped:', await st());
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
