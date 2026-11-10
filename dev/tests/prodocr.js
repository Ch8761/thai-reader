const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1500);
  console.log('ver:', await p.$eval('p.appver', e => e.textContent), '| sw:', await p.evaluate(() => !!navigator.serviceWorker.controller));
  await p.setInputFiles('#pdffile', [process.env.S + '/ocrtest/scan1.pdf']);
  await p.waitForFunction(() => /scan1\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  console.log('btn:', await p.innerText('#ocrGo'));
  await p.click('#ocrGo');
  await p.waitForFunction(() => /完成|出錯|失敗/.test(document.getElementById('ocrmsg').textContent), null, { timeout: 240000 });
  console.log(await p.innerText('#ocrmsg'));
  console.log('caches:', await p.evaluate(async () => { const k = await caches.keys(); const out = []; for (const n of k) { const c = await caches.open(n); out.push(n + ':' + (await c.keys()).length); } return out.join(', '); }));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
