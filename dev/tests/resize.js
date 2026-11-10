const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1100 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]);
  await p.click('[data-mode="hl"]'); await p.locator('#wrap').scrollIntoViewIfNeeded();
  const pt = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 30); rg.setEnd(n, 31); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(pt.x, pt.y);
  await p.click('[data-mode="box"]'); await p.locator('#wrap').scrollIntoViewIfNeeded();
  const w = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  await p.mouse.click(w.l + w.w * 0.3, w.t + w.h * 0.6);
  const rel = () => p.evaluate(() => { const pg = document.getElementById('page').getBoundingClientRect(), W = pg.width; const m = document.querySelector('#text mark.hl').getBoundingClientRect(), n = document.querySelector('.note').getBoundingClientRect(); return [(m.left - pg.left) / W, (m.top - pg.top) / W, (n.left - pg.left) / W, (n.top - pg.top) / W].map(v => v.toFixed(3)).join(','); });
  const s1 = await rel(), sc1 = (await p.inputValue('#report')).split('\n')[1];
  await p.setViewportSize({ width: 480, height: 1000 }); await p.waitForTimeout(300);
  const s2 = await rel(), sc2 = (await p.inputValue('#report')).split('\n')[1];
  console.log('820:', s1, sc1, '\n480:', s2, sc2, '\nERRORS:', errs.length ? errs.join('|') : 'none');
  await b.close();
})();
