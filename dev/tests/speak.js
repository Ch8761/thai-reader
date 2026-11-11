const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-tab','doc'); }); await p.reload(); await p.waitForTimeout(800);
  await p.evaluate(() => { const s = window.speechSynthesis; let on = true; Object.defineProperty(s, 'speaking', { get: () => on, configurable: true }); window.__stopFake = () => { on = false; }; });
  await p.click('#readAll'); await p.waitForTimeout(100);
  console.log('after click:', await p.$eval('#readAll', e => e.className + ' ' + getComputedStyle(e).backgroundColor));
  await p.waitForTimeout(1200); console.log('still speaking:', await p.$eval('#readAll', e => e.className));
  await p.click('#stopRead'); await p.waitForTimeout(100); console.log('after stop:', await p.$eval('#readAll', e => JSON.stringify(e.className)));
  await p.click('#readAll'); await p.evaluate(() => window.__stopFake()); await p.waitForTimeout(1500); console.log('after natural end:', await p.$eval('#readAll', e => JSON.stringify(e.className)));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
