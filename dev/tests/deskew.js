const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  for (const f of ['b300-1.png', 'photo.jpg']) {
    const r = await p.evaluate(async (f) => {
      const im = new Image(); im.src = f; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0);
      const out = [];
      for (const deg of [0, 3, -5, 8, -11]) {
        const rc = deg ? window.__ev('rotateCanvas')(c, deg) : c;
        const t0 = performance.now(); const a = window.__ev('skewAngle')(rc); out.push(deg + '→' + a + ' (' + Math.round(performance.now() - t0) + 'ms)');
      }
      return out.join('  ');
    }, f);
    console.log(f, r);
  }
  await b.close();
})();
