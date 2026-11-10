const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForTimeout(2000);
  console.log('ver:', await p.evaluate(() => (document.body.innerText.match(/正式版 v[\d.]+/) || [''])[0]), 'ygOpen:', await p.evaluate(() => typeof window.ygOpen), 'sheet:', await p.locator('#ygSheet').count());
  console.log('errors:', errs); await b.close();
})();
