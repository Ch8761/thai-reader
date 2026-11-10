const { chromium } = require('playwright');
const file = 'file://' + process.argv[2];
const out = process.argv[3];

async function charTargets(p, frac) {
  return p.evaluate((frac) => {
    const text = document.getElementById('input').value;
    const reader = document.getElementById('reader');
    const res = [];
    const w = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
    let node, acc = 0;
    while ((node = w.nextNode())) {
      for (let k = 0; k < node.nodeValue.length; k++) {
        const ch = text[acc + k];
        if (/[ัิ-ฺ็-๎]/.test(ch)) continue;
        const rg = document.createRange(); rg.setStart(node, k); rg.setEnd(node, k + 1);
        const r = rg.getBoundingClientRect();
        if (r.width < 4) continue;
        res.push({ i: acc + k, x: r.left + r.width * frac, y: r.top + r.height / 2 });
      }
      acc += node.nodeValue.length;
    }
    return res;
  }, frac);
}
async function markRange(p) {
  return p.evaluate(() => {
    const m = document.querySelector('#reader mark'); if (!m) return null;
    const rg = document.createRange(); rg.selectNodeContents(document.getElementById('reader')); rg.setEndBefore(m);
    const s = rg.toString().length; return { s, e: s + m.textContent.length };
  });
}
async function accuracy(p, label, tap) {
  let ok = 0, n = 0, miss = [];
  for (const frac of [0.5, 0.8, 0.2]) {
    // tap targets are recomputed after each tap because mark splits text nodes
    const count = (await charTargets(p, frac)).length;
    for (let idx = 0; idx < count; idx++) {
      const t = (await charTargets(p, frac))[idx];
      if (!t) continue;
      await tap(t.x, t.y);
      await p.waitForTimeout(650); // beat the 600 ms de-dupe window
      const mr = await markRange(p);
      n++; if (mr && t.i >= mr.s && t.i < mr.e) ok++; else miss.push({ i: t.i, frac, mr });
    }
  }
  console.log(label, ok + '/' + n, miss.length ? JSON.stringify(miss.slice(0, 5)) : '');
}

(async () => {
  const b = await chromium.launch();

  // 1. mouse, sample 3
  let ctx = await b.newContext({ viewport: { width: 820, height: 1100 } });
  let p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(file); await p.click('[data-sample="2"]');
  await p.locator('#reader').scrollIntoViewIfNeeded();
  await accuracy(p, 'MOUSE sample3 (centre/80%/20% of each base char):', (x, y) => p.mouse.click(x, y));
  console.log('REPORT TAIL (mouse):\n' + (await p.inputValue('#report')).split('\n').slice(4, 11).join('\n'));

  // 2. touch
  ctx = await b.newContext({ viewport: { width: 820, height: 1100 }, hasTouch: true });
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(file); await p.click('[data-sample="1"]');
  await p.locator('#reader').scrollIntoViewIfNeeded();
  await accuracy(p, 'TOUCH sample2:', (x, y) => p.touchscreen.tap(x, y));
  console.log('REPORT TAIL (touch):\n' + (await p.inputValue('#report')).split('\n').slice(4, 8).join('\n'));

  // 3. caret API returns null
  ctx = await b.newContext({ viewport: { width: 820, height: 1100 } });
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { document.caretRangeFromPoint = () => null; Object.defineProperty(document, 'caretPositionFromPoint', { value: undefined, configurable: true }); });
  await p.goto(file); await p.click('[data-sample="2"]');
  await p.locator('#reader').scrollIntoViewIfNeeded();
  await accuracy(p, 'CARET-NULL sample3:', (x, y) => p.mouse.click(x, y));
  console.log('REPORT TAIL (caret null):\n' + (await p.inputValue('#report')).split('\n').slice(5, 8).join('\n'));

  // 4. caret API missing entirely
  ctx = await b.newContext({ viewport: { width: 820, height: 1100 } });
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { Object.defineProperty(document, 'caretRangeFromPoint', { value: undefined, configurable: true }); Object.defineProperty(document, 'caretPositionFromPoint', { value: undefined, configurable: true }); });
  await p.goto(file); await p.click('[data-sample="1"]');
  console.log('NO-CARET status:', (await p.innerText('#status')).replace(/\n/g, ' / '));
  await p.locator('#reader').scrollIntoViewIfNeeded();
  const t = (await charTargets(p, 0.5))[3];
  await p.mouse.click(t.x, t.y);
  console.log('NO-CARET log:', (await p.inputValue('#report')).split('\n').filter(l => /^  1\./.test(l)).join(''));
  console.log('NO-CARET mark:', await p.$eval('#reader mark', e => e.textContent));

  // 5. wrapped text (phone width): gap between lines, and far outside
  ctx = await b.newContext({ viewport: { width: 400, height: 900 }, hasTouch: true });
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(file);
  await p.fill('#input', 'ฉันอยากไปกินข้าวที่ร้านอาหารไทยกับเพื่อนและอยากไปเดินเล่นที่สวนสาธารณะในตอนเย็นวันนี้');
  await p.click('#go');
  await p.locator('#reader').scrollIntoViewIfNeeded();
  const box = await p.evaluate(() => { const r = document.getElementById('reader'); const rr = r.getBoundingClientRect(); return { l: rr.left, t: rr.top, w: rr.width, h: rr.height }; });
  const lines = await p.evaluate(() => { const rg = document.createRange(); rg.selectNodeContents(document.getElementById('reader')); return Array.from(rg.getClientRects()).map(r => Math.round(r.top)).filter((v, i, a) => a.indexOf(v) === i); });
  console.log('WRAP reader box', JSON.stringify(box), 'line tops', JSON.stringify(lines));
  if (lines.length >= 2) {
    const gapY = (lines[0] + lines[1]) / 2 + 12; // between the first two lines
    await p.touchscreen.tap(box.l + box.w / 2, gapY);
    await p.waitForTimeout(700);
    console.log('GAP tap -> mark:', await p.evaluate(() => (document.querySelector('#reader mark') || {}).textContent || 'none'), '| info:', (await p.innerText('#info')).replace(/\n/g, ' '));
  }
  await p.touchscreen.tap(box.l + 2, box.t + box.h + 60);   // below the reader, in the buttons' area gap
  await p.waitForTimeout(100);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: out + '/phone-after.png', fullPage: true });
  console.log('ERRORS:', errs.length ? errs.join(' || ') : 'none');
  await b.close();
})();
