const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.fill('#textTitle', 'ทดสอบ'); await p.fill('#input', 'เมื่อวานฉันไปตลาดกับแม่เพราะว่าต้องซื้อผักและผลไม้ที่สดมาก ถ้าฝนไม่ตกเราจะไปเที่ยวทะเลด้วยกัน'); await p.click('#addText'); await p.waitForTimeout(800);
  await E("(function(){ showPop(segAt(state.text.indexOf('ตลาด') + 1)); return 1; })()"); await p.waitForTimeout(500);
  console.log(await p.evaluate(() => [...document.querySelectorAll('#pop details')].map(d => d.className + ':' + d.open).join(' ')));
  console.log(await p.evaluate(() => [...document.querySelectorAll('#pop details.fold')].map(d => d.outerHTML.slice(0,300) + ' VIS=' + d.offsetHeight).join('\n---\n')));
  await p.screenshot({path:'tests/g13a.png'});
  await p.locator('#pop details.fold > summary:visible').first().click(); await p.waitForTimeout(200);
  const n = await p.locator('#pop .glist .gcard > summary').count(); console.log('cards', n);
  await p.locator('#pop .glist .gcard > summary').first().tap(); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => [...document.querySelectorAll('#pop details')].map(d => d.className + ':' + d.open).join(' ')), await p.evaluate(() => !document.getElementById('pop').hidden));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
