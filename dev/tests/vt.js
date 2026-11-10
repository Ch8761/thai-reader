const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2] || 'vidtest2/hard.mp4';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  const t0 = Date.now();
  await p.setInputFiles('#imgfile', [file]);
  if (process.argv[3] === 'region') { await p.waitForSelector('#vidPick:not([hidden])', { timeout: 30000 }); await p.screenshot({ path: 'tests/vt-pick.png' }); await p.click('#vpGo'); }
  await p.waitForFunction(() => /影片字幕/.test(document.getElementById('h-docv').textContent) || /失敗|沒有讀到/.test((document.getElementById('vidMsg') || {}).textContent || ''), null, { timeout: 400000 });
  console.log('secs', Math.round((Date.now() - t0) / 1000));
  console.log(await E('state.text'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
