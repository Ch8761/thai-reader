const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1024, height: 1100 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-tone-mode','1'); }); await p.reload(); await p.waitForTimeout(2500);
  await p.setInputFiles('#pdffile', ['pdfin/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  console.log('pdf text spans', await p.locator('#text span').count());
  await p.click('#vbZoom'); console.log('zoom', await p.evaluate(() => [...document.querySelectorAll('#vbMenu button')].map(x => x.textContent).slice(0, 6).join(',')));
  await p.click('#vbMenu button:has-text("100%")'); await p.waitForTimeout(500); console.log('label', await p.textContent('#vbZoom'));
  { const bx = await p.locator('#text span').nth(2).boundingBox(); await p.mouse.click(bx.x + 40, bx.y + bx.height / 2); } await p.waitForTimeout(1500);
  console.log('pop', await p.evaluate(() => (document.querySelector('#pop .pw') || {}).textContent), await p.evaluate(() => { const t = document.querySelector('#pop .ttable'); return t ? t.querySelectorAll('.tcell').length : 'no table'; }));
  await p.click('.tabbar [data-tab="cards"]'); console.log('tabs', await p.textContent('#cardTabs'));
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(500);
  await p.waitForTimeout(500); console.log('sync btn', await p.textContent('#syncBtns'), await p.textContent('#syncState')); console.log('sync row hidden', await p.evaluate(() => document.getElementById('syncRow').hidden), 'ver', await p.evaluate(() => document.body.innerText.match(/v1\.\d+\.\d+/g)));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
