const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const img = new Image(); img.src = 'vt4/f162.png'; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
    window.__fc = c;
    const w = await window.__ev('ensureOcr()');
    const m = window.__ev("vidMask(__fc, __fc.width, __fc.height, [0,0.262,1,0.1], false, 1280, 18)");
    await w.setParameters({ tessedit_pageseg_mode: '11' });
    const res = await w.recognize(m.canvas, {}, { blocks: true });
    const raw = []; res.data.blocks.forEach(b => b.paragraphs.forEach(pp => pp.lines.forEach(l => raw.push(Math.round(l.confidence) + ' ' + JSON.stringify(l.text)))));
    window.__d = res.data;
    return { raw, acc: window.__ev("vidLinesFrom(__d, 60)") };
  });
  console.log(JSON.stringify(r)); await b.close(); })();
