const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1024, height: 1100 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(2000);
  await p.click('#openPaste'); await p.fill('#input', 'วันนี้เหนื่อยมาก'); await p.click('#addText'); await p.waitForTimeout(800);
  await p.click('#text', { position: { x: 120, y: 30 } }).catch(() => {}); await p.waitForTimeout(400);
  const has = await p.locator('#pop .cardbtn').count();
  if (has) { await p.click('#pop .cardbtn'); }
  console.log('badge', await p.evaluate(() => document.getElementById('cardBadge').textContent + ' hidden=' + document.getElementById('cardBadge').hidden));
  await p.click('.tabbar [data-tab="cards"]'); await p.click('#cardTabs button:has-text("全部")'); await p.click('#cardbody .crow >> nth=0'); await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => document.querySelector('.cdlife').innerText.replace(/\s+/g, ' ').slice(0, 160)));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
