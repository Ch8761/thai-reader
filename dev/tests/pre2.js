const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.addScriptTag({ path: 'vidpre.js' });
  const rx = JSON.parse(process.argv[2] || '[0,0,1,1]'), dir = process.argv[3] || 'vt', frames = (process.argv[4] || '0,7,13,19,25').split(',').map(Number);
  for (const [sc, psm] of JSON.parse(process.argv[5] || '[[1,3]]')) for (const f of frames) {
    const r = await p.evaluate(a => window.__ocrCC(a[0], a[1], false, a[2], a[3]), [dir + '/f' + String(f).padStart(3, '0') + '.png', rx, sc, psm]);
    console.log(sc, psm, f, r.lines.filter(l => /[ก-ฮ]/.test(l)).join(' / '));
    if (r.png) fs.writeFileSync('tests/cc-' + f + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
  }
  await b.close();
})();
