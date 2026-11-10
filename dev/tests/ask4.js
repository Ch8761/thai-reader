const { chromium } = require('playwright');
async function run(b, ua) {
  const ctx = await b.newContext({ viewport: { width: 612, height: 1100 }, userAgent: ua });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.locator('#wrap').scrollIntoViewIfNeeded();
  const pt = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 25); rg.setEnd(n, 26); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(pt.x, pt.y);
  const first = await p.evaluate(() => { const e = document.querySelectorAll('#pop .sec .row2')[1].firstElementChild; return e.tagName + ' ' + e.textContent + ' ' + (e.href ? e.href.slice(0, 30) : ''); });
  await ctx.close(); return first + (errs.length ? ' ERR ' + errs.join('|') : '');
}
(async () => {
  const b = await chromium.launch();
  console.log('inside Claude app UA:', await run(b, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Claude/1.261026.20'));
  console.log('normal Safari UA   :', await run(b, 'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'));
  await b.close();
})();
