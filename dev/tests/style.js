const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 612, height: 1000 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]);
  console.log('stylebar hidden in tap mode:', await p.$eval('#stylebar', e => e.hidden));
  await p.click('[data-mode="box"]');
  console.log('stylebar hidden in box mode:', await p.$eval('#stylebar', e => e.hidden));
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const charPt = (i) => p.evaluate((i) => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, i);
  // word on 2nd line (index ~ 60)
  let pt = await charPt(62); await p.mouse.click(pt.x, pt.y);
  await p.keyboard.type('註解');
  for (const sel of ['[data-act="bigger"]', '[data-act="bigger"]', '[data-color="blue"]', '[data-weight="700"]', '[data-font="serif"]']) await p.click('#stylebar ' + sel);
  const st = await p.evaluate(() => { const e = document.querySelector('.note-text'); const c = getComputedStyle(e); return { focused: document.activeElement === e, size: c.fontSize, weight: c.fontWeight, font: c.fontFamily.slice(0, 20), color: c.color, text: e.textContent }; });
  console.log('STYLED (focus kept?):', JSON.stringify(st), '| sizeVal:', await p.innerText('#sizeVal'), '| underline class:', await p.$eval('#text mark.anno', e => e.className));
  await p.keyboard.type('OK');
  console.log('typing continues in box:', await p.$eval('.note-text', e => e.textContent));
  // blur: no frame
  const w = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p.mouse.click(w.l + w.w * 0.6, w.t + w.h * 0.85);   // new free note, inherits style
  const first = await p.$eval('.note:nth-child(1) .note-text', e => getComputedStyle(e).borderTopColor);
  const second = await p.$eval('.note:nth-child(2) .note-text', e => { const c = getComputedStyle(e); return { size: c.fontSize, color: c.color }; });
  console.log('unfocused border color (should be transparent):', first, '| new note inherits:', JSON.stringify(second));
  await p.keyboard.type('自由');
  await p.click('[data-mode="tap"]');
  await p.reload();
  console.log('after reload:', JSON.stringify(await p.$$eval('.note-text', es => es.map(e => ({ t: e.textContent, size: getComputedStyle(e).fontSize, w: getComputedStyle(e).fontWeight })))));
  await p.click('[data-mode="box"]'); await p.locator('#wrap').scrollIntoViewIfNeeded();
  const w2 = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width }; });
  await p.evaluate(() => window.scrollTo(0, document.querySelector('.toolbar').getBoundingClientRect().top + window.scrollY - 10));
  await p.click('.note:nth-child(1) .note-text');
  const tb = await p.$eval('.toolbar', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const wr = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return r.bottom; });
  await p.screenshot({ path: process.argv[3] + '/style.png', clip: { x: 0, y: tb.y - 4, width: 612, height: Math.min(wr - tb.y + 8, 900) } });
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
