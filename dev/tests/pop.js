const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 612, height: 1000 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const pt = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 9); rg.setEnd(n, 10); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(pt.x, pt.y);
  console.log('pop hidden:', await p.$eval('#pop', e => e.hidden), '| word:', await p.$eval('#pop .pw', e => e.textContent));
  console.log('links:', JSON.stringify(await p.$$eval('#pop a.ext', es => es.map(e => [e.textContent, decodeURIComponent(e.href), e.target]))));
  const geo = await p.evaluate(() => { const r = document.querySelector('#pop').getBoundingClientRect(); const m = document.querySelector('#text mark.tapsel').getBoundingClientRect(); return { popTop: Math.round(r.top), wordBottom: Math.round(m.bottom), popRight: Math.round(r.right), vw: innerWidth }; });
  console.log('geometry:', JSON.stringify(geo));
  await p.screenshot({ path: process.argv[3] + '/pop.png', clip: { x: 0, y: Math.max(0, pt.y - 80), width: 612, height: 360 } });
  await p.click('#pop .x'); console.log('after close hidden:', await p.$eval('#pop', e => e.hidden));
  await p.mouse.click(pt.x, pt.y); await p.click('[data-mode="hl"]'); console.log('mode change hides:', await p.$eval('#pop', e => e.hidden));
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none'); await b.close();
})();
