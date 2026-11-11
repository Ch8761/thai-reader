const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(800);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/C.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 90000 });
  await p.waitForTimeout(3000);
  const words = (process.env.W || 'ประเทศไทย,กรมส่ง,ส่งออก,บันเทิงไทย,เกาหลี').split(',');
  for (const w of words) {
    console.log(w, await E(`(function(){ var i = state.text.indexOf(${JSON.stringify(w)}); if (i < 0) return 'not found'; var en = entityAt(i); var sg = segs.filter(g => g.i >= i - 2 && g.i < i + ${w.length} + 4).map(g => g.t + (g.gz ? '[gz]' : '') + (DICT[g.t] ? '=' + JSON.stringify(DICT[g.t][0]).slice(0, 50) : '')); return JSON.stringify({ en: en && { t: en.t, type: en.type, info: en.info && en.info.zh }, segs: sg }); })()`));
  }
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
