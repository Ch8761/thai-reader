const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate((r) => { localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('dbgreg', r); }, process.env.REG || '[0,0,1,1]'); await p.reload(); await p.waitForTimeout(1500);
  for (const f of process.argv.slice(2)) {
    const r = await p.evaluate(async (f) => {
      const REG = JSON.parse(localStorage.getItem('dbgreg') || '[0,0,1,1]'); const im = new Image(); im.src = 'bugfr/' + f; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0);
      const w = await window.__ev('ensureOcr()'); const out = {};
      for (const mode of ['out', 'inv']) {
        const m = window.__ev('vidMask')(c, c.width, c.height, REG, mode === 'inv', 1280, 18, null);
        out[mode + '_n'] = m.n; out[mode + '_png'] = m.canvas ? m.canvas.toDataURL() : null;
        const ls = await window.__ev('vidRecognize')(w, c, REG, mode, m, null);
        out[mode] = ls.map(l => l.t + ' [' + Math.round(l.c) + ',' + l.kn.toFixed(2) + ']');
      }
      const raw = await window.__ev('vidRecognize')(w, c, REG, 'raw', null, null); out.raw = raw.map(l => l.t + ' [' + Math.round(l.c) + ',' + l.kn.toFixed(2) + ']');
      return out;
    }, f);
    for (const mode of ['out', 'inv']) { if (r[mode + '_png']) { fs.writeFileSync('bug3/mask_' + mode + '_' + f, Buffer.from(r[mode + '_png'].split(',')[1], 'base64')); } }
    console.log('==', f, 'out n', r.out_n, JSON.stringify(r.out), '| inv n', r.inv_n, JSON.stringify(r.inv), '| raw', JSON.stringify(r.raw));
  }
  await b.close();
})();
