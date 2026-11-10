const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  for (const f of ['f000.png', 'f004.png', 'f008.png']) {
    const data = require('fs').readFileSync('vidtest/' + f).toString('base64');
    const r = await p.evaluate(async ([d]) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + d; await im.decode();
      const out = {};
      const w = await window.__ev('ensureOcr()');
      for (const [name, sc, inv] of [['raw', 1, 0], ['inv', 1, 1], ['x2', 2, 0], ['x2inv', 2, 1]]) {
        const c = document.createElement('canvas'); c.width = im.width * sc; c.height = im.height * sc; const g = c.getContext('2d');
        g.drawImage(im, 0, 0, c.width, c.height);
        if (inv) { const id = g.getImageData(0, 0, c.width, c.height), px = id.data; for (let i = 0; i < px.length; i += 4) { const y = 255 - (px[i] * 3 + px[i + 1] * 6 + px[i + 2]) / 10; px[i] = px[i + 1] = px[i + 2] = y; } g.putImageData(id, 0, 0); }
        const t0 = performance.now(); const res = await w.recognize(c, {}, { blocks: true, text: false, hocr: false, tsv: false });
        out[name] = window.__ev('linesOf')(window.__ev('ocrItems')(res.data, c.width).items).join(' / ') + ' (' + Math.round(performance.now() - t0) + 'ms)';
      }
      return out;
    }, [data]);
    console.log(f, JSON.stringify(r, null, 1));
  }
  await b.close();
})();
