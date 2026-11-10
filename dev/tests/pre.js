const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.addScriptTag({ path: 'vidpre.js' });
  const modes = (process.argv[2] || 'raw,gray,bright,outline').split(','), rx = JSON.parse(process.argv[3] || '[0,0,1,1]');
  for (const f of (process.env.FR || '0,7,13,19,25').split(',').map(Number)) {
    for (const m of modes) {
      const r = await p.evaluate(a => window.__ocrTest(a[0], a[1], a[2]), [(process.env.DIR || 'vt') + '/f' + String(f).padStart(3, '0') + '.png', rx, m]);
      console.log(f, m.padEnd(8), r.lines.filter(l => /[ก-ฮ]/.test(l)).join(' / '));
      if (f === +(process.argv[4]||7)) fs.writeFileSync('tests/pre-' + m + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
    }
  }
  await b.close();
})();
