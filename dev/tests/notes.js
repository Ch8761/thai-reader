const { chromium } = require('playwright');
const file = 'file://' + process.argv[2], out = process.argv[3];
async function charPt(p, i, frac = 0.5) {
  return p.evaluate(([i, frac]) => {
    const w = document.createTreeWalker(document.getElementById('text'), NodeFilter.SHOW_TEXT);
    let n, acc = 0;
    while ((n = w.nextNode())) { const l = n.nodeValue.length; if (i < acc + l) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width * frac, y: r.top + r.height / 2 }; } acc += l; }
    return null;
  }, [i, frac]);
}
const rep = p => p.inputValue('#report');
const line = (r, k) => r.split('\n').find(l => l.startsWith(k));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(file);
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  console.log(line(await rep(p), '畫面縮放比例'));

  // tap mode
  let pt = await charPt(p, 20); await p.mouse.click(pt.x, pt.y);
  console.log('TAP info:', (await p.innerText('#info')).replace(/\n/g, ' '), '| tapsel:', await p.$eval('#text mark.tapsel', e => e.textContent));

  // highlight drag from char 22 to char 35
  await p.click('[data-mode="hl"]');
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  let a = await charPt(p, 22), z = await charPt(p, 35);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + z.x) / 2, a.y, { steps: 5 }); await p.mouse.move(z.x, z.y, { steps: 5 }); await p.mouse.up();
  console.log('HL after drag:', line(await rep(p), '筆記數量'), '| marked:', await p.$$eval('#text mark.hl', es => es.map(e => e.textContent).join(' / ')));
  // tap on highlight to remove
  pt = await charPt(p, 25); await p.mouse.click(pt.x, pt.y);
  console.log('HL after tap-remove:', line(await rep(p), '筆記數量'));
  // highlight again (single word tap)
  pt = await charPt(p, 2); await p.mouse.click(pt.x, pt.y);
  console.log('HL single-word tap:', await p.$$eval('#text mark.hl', es => es.map(e => e.textContent).join(' / ')));

  // ink
  await p.click('[data-mode="ink"]');
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const wr = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  const sx = wr.l + wr.w * 0.2, sy = wr.t + wr.h * 0.75;
  await p.mouse.move(sx, sy); await p.mouse.down(); await p.mouse.move(sx + 200, sy + 30, { steps: 12 }); await p.mouse.up();
  const inkPix = await p.evaluate(() => { const c = document.getElementById('ink'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  console.log('INK:', line(await rep(p), '筆記數量'), '| painted pixels:', inkPix);

  // box
  await p.click('[data-mode="box"]');
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const wr2 = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p.mouse.click(wr2.l + wr2.w * 0.6, wr2.t + wr2.h * 0.55);
  await p.waitForTimeout(100);
  await p.keyboard.type('測試中文 abc');
  console.log('BOX:', line(await rep(p), '筆記數量'), '| text:', await p.$eval('.note textarea', e => e.value), '| storage:', line(await rep(p), '儲存'));

  // positions relative to page before resize
  const rel = () => p.evaluate(() => {
    const pg = document.getElementById('page').getBoundingClientRect(); const W = pg.width;
    const m = document.querySelector('#text mark.hl').getBoundingClientRect();
    const n = document.querySelector('.note').getBoundingClientRect();
    return { hl: [(m.left - pg.left) / W, (m.top - pg.top) / W].map(v => v.toFixed(3)), note: [(n.left - pg.left) / W, (n.top - pg.top) / W].map(v => v.toFixed(3)) };
  });
  const before = await rel();
  // ink point check: stroke start in page coords
  const s0 = await p.evaluate(() => JSON.parse(localStorage.getItem('thai-notes-test-v1')).strokes[0].p[0]);
  await p.setViewportSize({ width: 1180, height: 820 });
  await p.waitForTimeout(300);
  const after = await rel();
  const inkAt = await p.evaluate((s0) => { const c = document.getElementById('ink'); const k = c.width / 640; const x = Math.round(s0[0] * k), y = Math.round(s0[1] * k); const d = c.getContext('2d').getImageData(x - 3, y - 3, 7, 7).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }, s0);
  console.log('ROTATE rel before', JSON.stringify(before), 'after', JSON.stringify(after), '| ink present at stroke start after resize:', inkAt > 0, '|', line(await rep(p), '畫面縮放比例'));

  // reload
  await p.reload(); await p.waitForTimeout(200);
  console.log('RELOAD:', line(await rep(p), '筆記數量'), '|', line(await rep(p), '儲存'), '| box text:', await p.$eval('.note textarea', e => e.value));

  // undo + clear
  await p.click('[data-mode="hl"]');
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  pt = await charPt(p, 40); await p.mouse.click(pt.x, pt.y);
  console.log('before undo:', line(await rep(p), '筆記數量'));
  await p.click('#undo');
  console.log('after undo:', line(await rep(p), '筆記數量'));
  await p.click('#clear'); console.log('clear 1st press label:', await p.innerText('#clear'), '|', line(await rep(p), '筆記數量'));
  await p.click('#clear'); console.log('clear 2nd press:', line(await rep(p), '筆記數量'));
  // checks
  await p.click('.check:nth-child(2) button[data-v="成功"]');
  console.log('CHECK line:', (await rep(p)).split('\n').filter(l => /^  2 /.test(l)).join(''));
  console.log('ERRORS:', errs.length ? errs.join(' || ') : 'none');

  // phone screenshot with notes
  const p2 = await (await b.newContext({ viewport: { width: 400, height: 900 }, colorScheme: 'dark' })).newPage();
  await p2.goto(file);
  await p2.click('[data-mode="hl"]'); await p2.locator('#wrap').scrollIntoViewIfNeeded();
  let a2 = await charPt(p2, 5), z2 = await charPt(p2, 14);
  await p2.mouse.move(a2.x, a2.y); await p2.mouse.down(); await p2.mouse.move(z2.x, z2.y, { steps: 6 }); await p2.mouse.up();
  await p2.click('[data-mode="ink"]'); await p2.locator('#wrap').scrollIntoViewIfNeeded();
  const w3 = await p2.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p2.mouse.move(w3.l + 40, w3.t + w3.h * 0.8); await p2.mouse.down(); await p2.mouse.move(w3.l + 200, w3.t + w3.h * 0.7, { steps: 10 }); await p2.mouse.up();
  await p2.click('[data-mode="box"]'); await p2.locator('#wrap').scrollIntoViewIfNeeded();
  const w4 = await p2.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p2.mouse.click(w4.l + w4.w * 0.45, w4.t + w4.h * 0.62); await p2.keyboard.type('筆記');
  const overflow = await p2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('PHONE overflow:', overflow);
  await p2.evaluate(() => window.scrollTo(0, 0));
  await p2.screenshot({ path: out + '/notes-phone.png', fullPage: true });
  await b.close();
})();
