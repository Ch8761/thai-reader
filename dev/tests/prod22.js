const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1024, height: 1100 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-tone-mode','1'); }); await p.reload(); await p.waitForTimeout(2500);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  const spans = await p.locator('#text span').count();
  console.log('pdf text spans', spans);
  await p.evaluate(() => window.scrollTo(0, 0)); { const bx = await p.locator('#text span').nth(2).boundingBox(); await p.mouse.click(bx.x + 150, bx.y + bx.height / 2); } await p.waitForTimeout(1200);
  console.log('pop word', await p.evaluate(() => document.getElementById('pop').hidden + ' ' + (document.querySelector('#pop .pw') || {}).textContent));
  console.log('pop tone', await p.evaluate(() => { const t = document.querySelector('#pop .tonesec'); return t ? t.innerText.slice(0, 80).replace(/\s+/g, ' ') : 'none'; }));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
