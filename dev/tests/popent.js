const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', 'pdfin/B.pdf'); await p.waitForFunction(() => /\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  await p.locator('#wrap').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const q = await p.evaluate(() => { const sp = [...document.querySelectorAll('#text .tl')].find(s => s.textContent.includes('กระทรวงการต่างประเทศ')); const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); let n, acc = 0; const i = sp.textContent.indexOf('กระทรวงการต่างประเทศ') + 2; while ((n = w.nextNode())) { if (i < acc + n.nodeValue.length) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left, y: r.top }; } acc += n.nodeValue.length; } });
  await p.evaluate((y) => window.scrollBy(0, y - 250), q.y); await p.waitForTimeout(500);
  const q2 = await p.evaluate(() => { const sp = [...document.querySelectorAll('#text .tl')].find(s => s.textContent.includes('กระทรวงการต่างประเทศ')); const r = sp.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
  await p.screenshot({ path: 'tests/ent-B.png', clip: { x: 0, y: q2.y - 150, width: 820, height: 260 } });
  const xx = await p.evaluate(() => { const sp = [...document.querySelectorAll('#text .tl')].find(s => s.textContent.includes('กระทรวงการต่างประเทศ')); const t = sp.textContent; const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); let n, acc = 0; const i = t.indexOf('กระทรวงการต่างประเทศ') + 2; while ((n = w.nextNode())) { if (i < acc + n.nodeValue.length) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += n.nodeValue.length; } });
  await p.mouse.click(xx.x, xx.y); await p.waitForTimeout(400);
  const box = await p.$eval('#pop', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, h: r.height }; });
  await p.screenshot({ path: 'tests/pop-ent.png', clip: { x: Math.max(0, box.x - 10), y: box.y - 10, width: 380, height: Math.min(560, box.h + 20) } });
  await p.click('#translateAll');
  await p.locator('#trpanel').scrollIntoViewIfNeeded();
  await p.screenshot({ path: 'tests/trpanel.png', clip: await p.$eval('#trpanel', e => { const r = e.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 70, width: r.width + 8, height: r.height + 80 }; }) });
  await b.close();
})();
