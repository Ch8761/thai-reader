const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1500);
  const [f, reg, mode] = process.argv.slice(2);
  const r = await p.evaluate(async ([f, reg, mode]) => {
    const im = new Image(); im.src = 'bugfr/' + f; await im.decode();
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0);
    const w = await window.__ev('ensureOcr()');
    const m = window.__ev('vidMask')(c, c.width, c.height, JSON.parse(reg), mode === 'inv', 1280, 18, null);
    await w.setParameters({ tessedit_pageseg_mode: '11' });
    const res = await w.recognize(m.canvas, {}, { blocks: true, text: false, hocr: false, tsv: false });
    const out = [];
    res.data.blocks.forEach(b => b.paragraphs.forEach(pp => pp.lines.forEach(ln => out.push(ln.text.trim() + ' | conf ' + Math.round(ln.confidence) + ' | words ' + ln.words.map(x => x.text + ':' + Math.round(x.confidence)).join(' ')))));
    const kept = window.__ev('vidLinesFrom')(res.data, 60).map(l => l.t);
    return { out, kept };
  }, [f, reg, mode]);
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
