const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); }); await p.reload(); await p.waitForTimeout(2000);
  await p.click('#readerOpen'); await p.waitForTimeout(800);
  console.log('items:', await p.locator('#rdList .rditem').count());
  await p.locator('#rdList .rditem').first().click(); await p.waitForTimeout(1200);
  console.log('doc:', await p.textContent('#h-docv'));
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  console.log('ver:', await p.evaluate(() => (document.body.innerText.match(/v1\.\d+\.\d+/) || [''])[0]), 'ygOpen:', await p.evaluate(() => typeof window.ygOpen));
  console.log('errors:', errs); await b.close();
})();
