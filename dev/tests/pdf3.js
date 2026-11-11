const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', 'pdfin/C.pdf'); await p.waitForFunction(() => document.getElementById('docstatus').textContent.includes('C.pdf（'), null, { timeout: 60000 });
  const t = await p.evaluate(() => JSON.parse(localStorage.getItem('thai-notes-test-v1')).text);
  console.log(t.slice(0, 600));
  console.log('len', t.length);
  await p.locator('#wrap').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const pt = await p.evaluate(() => { const r = document.querySelectorAll('#text .tl')[30].getBoundingClientRect(); return { x: r.left + 5, y: r.top + r.height / 2 }; });
  const t0 = Date.now(); for (let i = 0; i < 5; i++) { await p.mouse.click(pt.x, pt.y); } console.log('5 taps ms', Date.now() - t0);
  await b.close();
})();
