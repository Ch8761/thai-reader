const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 612, height: 1100 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]);
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const pt = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 25); rg.setEnd(n, 26); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(pt.x, pt.y);
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#pop a.ai:nth-of-type(3)')]);
  await pop.close().catch(() => {});
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  console.log('clipboard after Gemini click starts:', clip.slice(0, 40), '| contains sentence:', clip.includes('ฉันอยากไป'));
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none'); await b.close();
})();
