const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 612, height: 1100 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  console.log((await p.inputValue('#report')).split('\n').find(l => l.startsWith('內建字典')));
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const tap = async (i) => { const pt = await p.evaluate((i) => { const w = document.createTreeWalker(document.getElementById('text'), NodeFilter.SHOW_TEXT); let n, acc = 0; while ((n = w.nextNode())) { const l = n.nodeValue.length; if (i < acc + l) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += l; } }, i); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150); return (await p.innerText('#pop .pd')).replace(/\n/g, ' / '); };
  console.log('ไป :', await tap(24));
  console.log('สวน:', await tap(37));
  console.log('เดิน (missing):', await tap(29));
  await tap(24);
  const box = await p.$eval('#pop', e => { const r = e.getBoundingClientRect(); return { y: r.top, h: r.height }; });
  await p.screenshot({ path: process.argv[2] + '/dict.png', clip: { x: 0, y: Math.max(0, box.y - 70), width: 612, height: Math.min(box.h + 90, 1000) } });
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none'); await b.close();
})();
