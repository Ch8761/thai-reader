const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  const ctx = await b.newContext({ ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('https://thai-reader-enn.pages.dev/', { timeout: 60000 }); await p.waitForTimeout(6000);
  console.log('boot', await p.evaluate(() => window.__thaiBoot), 'errs', errs.join('|').slice(0, 300));
  await b.close();
})();
