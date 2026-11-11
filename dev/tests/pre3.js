const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.addScriptTag({ content: fs.readFileSync('vidmask.js', 'utf8') + `
  window.__m = async function (url, rx, inv, target) {
    var img = new Image(); img.src = url; await img.decode();
    var t0 = performance.now(); var r = vidMask(img, img.width, img.height, rx, inv, window.__maxW || 1280, target); var ms = performance.now() - t0;
    if (!r.canvas) { return { lines: [], ms: Math.round(ms) }; }
    var w = await window.__ev('ensureOcr()');
    await w.setParameters({ tessedit_pageseg_mode: '11' });
    var res = await w.recognize(r.canvas, {}, { blocks: true, text: true });
    var lines = []; (res.data.blocks || []).forEach(function (b) { b.paragraphs.forEach(function (p) { p.lines.forEach(function (l) { lines.push(Math.round(l.confidence) + ' ' + l.text.trim()); }); }); });
    return { lines: lines, ms: Math.round(ms), medH: r.medH, n: r.n, png: r.canvas.toDataURL(), box: r.box };
  };` });
  const rx = JSON.parse(process.argv[2] || '[0,0,1,1]'), dir = process.argv[3] || 'vt', frames = (process.argv[4] || '0,7,13,19,25').split(',').map(Number), targets = JSON.parse(process.argv[5] || '[20]');
  for (const tg of targets) for (const f of frames) {
    const r = await p.evaluate(a => { window.__maxW = a[4]; return window.__m(a[0], a[1], a[3], a[2]); }, [dir + '/f' + String(f).padStart(3, '0') + '.png', rx, tg, !!process.env.INV, +(process.env.MAXW || 1280)]);
    console.log(tg, f, r.ms + 'ms', 'medH', r.medH, r.n, r.lines.join(' / '));
    if (r.png) fs.writeFileSync('tests/m-' + f + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
  }
  await b.close();
})();
