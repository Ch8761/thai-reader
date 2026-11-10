const { chromium, devices } = require('playwright');
const C = ['ไทย Reader 是一款讓讀泰文變輕鬆的 App。'];
(async () => { const b = await chromium.launch();
  for (const d of ['iPhone SE', 'iPhone 13']) {
    const p = await (await b.newContext(devices[d])).newPage();
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(1200);
    const r = await p.evaluate(C => { const w = document.querySelector('#welcome .wnote'); const lh = parseFloat(getComputedStyle(w).lineHeight) || 24; return C.map(c => { w.innerHTML = c.replace('ไทย', '<span lang="th">ไทย</span>'); return Math.round(w.offsetHeight / lh) + ' ' + c; }); }, C);
    console.log(d, '\n ' + r.join('\n '));
  }
  await b.close(); })();
