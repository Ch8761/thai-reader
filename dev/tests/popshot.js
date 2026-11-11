const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 1024), height: 1300 } }); const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(800);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.fill('#input', 'วันนี้ไปประชุมที่กรมส่งเสริมการค้า แล้วก็เดินทางกลับประเทศไทย สินค้าส่งออก'); await p.click('#addText'); await p.waitForTimeout(800);
  await E(`(function(){ var i = state.text.indexOf('${process.env.WORD || 'ประชุม'}'); showPop(segAt(i + 1)); return 1; })()`); await p.waitForTimeout(300);
  const bb = await p.locator('#pop').boundingBox();
  await p.screenshot({ path: 'tests/' + (process.env.OUT || 'pop') + '.png', clip: { x: bb.x - 5, y: bb.y - 5, width: bb.width + 10, height: Math.min(bb.height + 10, 1200) } });
  await b.close();
})();
