const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  let ygReq = 0;
  await ctx.route('https://youglish.com/**', r => { ygReq++; r.abort(); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.waitForTimeout(200); await p.fill('#input', 'เราไปกินข้าวที่ร้านอาหารไทย'); await p.click('#addText'); await p.waitForTimeout(800);
  await E("(function(){ showPop(segAt(state.text.indexOf('อาหาร'))); return 1; })()"); await p.waitForTimeout(300);
  const ext = await p.textContent('#pop .extlinks'); console.log('extlinks:', ext);
  console.log('requests before tap:', ygReq);
  await p.screenshot({ path: 'tests/yg-pop.png' });
  await p.click('#pop .ygbtn'); await p.waitForTimeout(300);
  console.log('sheet open:', !(await p.locator('#ygSheet').isHidden()), 'consent shown:', await p.locator('#ygConsent').isVisible(), 'requests:', ygReq);
  console.log('title:', await p.textContent('#ygTitle'), '| credit:', await p.textContent('.ygcredit'));
  await p.screenshot({ path: 'tests/yg-consent.png' });
  await p.click('#ygOk'); await p.waitForTimeout(800);
  console.log('after ok msg:', await p.textContent('#ygMsg'), 'requests:', ygReq);
  // fake YouGlish API: check fetch gets Thai + word
  await p.evaluate(() => {
    window.__ygCalls = [];
    window.YG = { Widget: function (id, opt) { window.__ygCalls.push(['new', id, opt.width, opt.components]); this.fetch = function (q, l) { window.__ygCalls.push(['fetch', q, l]); setTimeout(function () { opt.events.onFetchDone({ totalResult: q === 'อาหาร' ? 12 : 0 }); }, 10); }; this.pause = function () { window.__ygCalls.push(['pause']); }; } };
  });
  await p.click('#ygClose'); await p.waitForTimeout(100);
  await p.click('#pop .ygbtn'); await p.waitForTimeout(300);
  console.log('consent again?', await p.locator('#ygConsent').isVisible(), 'msg:', JSON.stringify(await p.textContent('#ygMsg')));
  await p.click('#ygClose'); await p.waitForTimeout(100);
  await E("(function(){ showPop(segAt(state.text.indexOf('ร้าน'))); return 1; })()"); await p.waitForTimeout(300);
  await p.click('#pop .ygbtn'); await p.waitForTimeout(300);
  console.log('no result msg:', await p.textContent('#ygMsg'));
  console.log('calls:', JSON.stringify(await p.evaluate(() => window.__ygCalls)));
  await p.screenshot({ path: 'tests/yg-sheet.png' });
  // phone width
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/yg-phone.png' });
  console.log('errors:', errs);
  await b.close();
})();
