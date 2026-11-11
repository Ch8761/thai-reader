const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage(); const req = [];
  ctx.on('request', r => { if (/traineddata/.test(r.url())) req.push(r.url().replace(/^.*\/ocr\//, '')); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1000);
  console.log('langs', await p.evaluate(() => JSON.stringify(window.__ev('ocrLangs()'))));
  await p.evaluate(() => window.__ev('ensureOcr()')); await p.waitForTimeout(500); console.log(req); await b.close();
})();
