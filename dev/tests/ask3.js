const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 612, height: 1100 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.locator('#wrap').scrollIntoViewIfNeeded();
  const pt = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 25); rg.setEnd(n, 26); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(pt.x, pt.y);
  console.log('buttons:', JSON.stringify(await p.$$eval('#pop .row2:last-of-type > *', es => es.map(e => e.textContent))));
  await p.click('#pop button.aibtn');
  await p.waitForTimeout(200);
  console.log('note:', await p.$eval('#pop .sec .sl2:last-child', e => e.textContent), '| clip ok:', (await p.evaluate(() => navigator.clipboard.readText())).includes('ฉันอยากไป'));
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none'); await b.close();
})();
