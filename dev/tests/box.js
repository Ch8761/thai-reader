const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 612, height: 1000 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]);
  const charPt = (i) => p.evaluate((i) => { const w = document.createTreeWalker(document.getElementById('text'), NodeFilter.SHOW_TEXT); let n, acc = 0; while ((n = w.nextNode())) { const l = n.nodeValue.length; if (i < acc + l) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += l; } }, i);
  const count = async () => (await p.inputValue('#report')).split('\n').find(l => l.startsWith('筆記數量'));
  await p.click('[data-mode="box"]'); await p.locator('#wrap').scrollIntoViewIfNeeded();
  // anchored note on word containing char 9 (อากาศ)
  let pt = await charPt(9); await p.mouse.click(pt.x, pt.y);
  await p.keyboard.type('天氣');
  console.log('ANCHORED:', await count(), '| underline on:', await p.$$eval('#text mark.anno', es => es.map(e => e.textContent).join('/')), '| focused:', await p.evaluate(() => document.activeElement.className));
  const pos = await p.evaluate(() => { const n = document.querySelector('.note-text').getBoundingClientRect(); const m = document.querySelector('#text mark.anno').getBoundingClientRect(); return { noteBottom: Math.round(n.bottom), wordTop: Math.round(m.top), noteLeft: Math.round(n.left), wordLeft: Math.round(m.left) }; });
  console.log('POSITION (note sits just above word):', JSON.stringify(pos));
  // free note on blank area
  const w = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p.mouse.click(w.l + w.w * 0.5, w.t + w.h * 0.8); await p.keyboard.type('自由筆記');
  // empty note auto-deletes on blur
  await p.mouse.click(w.l + w.w * 0.2, w.t + w.h * 0.9);
  console.log('after empty note created:', await count());
  await p.mouse.click(w.l + w.w * 0.8, w.t + w.h * 0.92);  // creates another empty, previous empty blurs -> deleted
  await p.evaluate(() => document.activeElement.blur());
  console.log('after blurring empties:', await count());
  // drag grip: focus the note first, then its grip shows
  await p.click('.note:nth-child(1) .note-text');
  console.log('grip visible after focus:', await p.$eval('.note:nth-child(1) .grip', e => getComputedStyle(e).display));
  const g = await p.$eval('.note:nth-child(1) .grip', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const before = await p.$eval('.note:nth-child(1)', e => e.getBoundingClientRect().left);
  await p.mouse.move(g.x, g.y); await p.mouse.down(); await p.mouse.move(g.x + 60, g.y + 10, { steps: 6 }); await p.mouse.up();
  const after = await p.$eval('.note:nth-child(1)', e => e.getBoundingClientRect().left);
  console.log('DRAG moved px:', Math.round(after - before));
  await p.screenshot({ path: process.argv[3] + '/box-edit.png', clip: { x: w.l - 4, y: w.t - 4, width: w.w + 8, height: Math.min(w.h + 8, 600) } });
  // switch to tap mode: clean view, tapping word under note works
  await p.click('[data-mode="tap"]'); await p.locator('#wrap').scrollIntoViewIfNeeded();
  console.log('TAP mode grips:', await p.$$eval('.grip', es => es.length), '| editable:', await p.$eval('.note-text', e => e.isContentEditable));
  pt = await charPt(9); await p.mouse.click(pt.x, pt.y);
  console.log('TAP info:', (await p.innerText('#info')).replace(/\n/g, ' '));
  const w2 = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p.screenshot({ path: process.argv[3] + '/box-clean.png', clip: { x: w2.l - 4, y: w2.t - 4, width: w2.w + 8, height: Math.min(w2.h + 8, 600) } });
  // delete
  await p.click('[data-mode="box"]');
  await p.click('.note:nth-child(2) .note-text');
  await p.click('.note:nth-child(2) .del');
  console.log('after delete:', await count());
  await p.reload();
  console.log('after reload:', await count(), '| underline:', await p.$$eval('#text mark.anno', es => es.map(e => e.textContent).join('/')));
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
