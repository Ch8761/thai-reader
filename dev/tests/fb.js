const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.click('#openSettings'); await p.click('#fbCat button:has-text("問題回報")'); await p.fill('#fbText', '測試回饋'); await p.click('#fbSend'); await p.waitForTimeout(300);
  console.log('status:', await p.innerText('#fbStatus')); console.log('list:', (await p.innerText('#fbList')).replace(/\n/g, ' / '));
  console.log((await p.inputValue('#report')).split('\n').filter(l => l.startsWith('意見')).join());
  await p.locator('.fbrow').scrollIntoViewIfNeeded();
  await p.screenshot({ path: 'tests/fb.png', clip: await p.$eval('.fbrow', e => { const r = e.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }; }) });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
