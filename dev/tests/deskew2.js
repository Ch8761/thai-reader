const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const ev = window.__ev; await ev('otLoad')();
    const im = new Image(); im.src = 'b300-1.png'; await im.decode();
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0);
    const base = (await ThaiOCR.read(c)).text.replace(/\s+/g, '');
    function sim(a, b2) { const m = a.length, n = b2.length; let prev = new Array(n + 1).fill(0).map((_, j) => j); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b2[j - 1] ? 0 : 1)); prev = cur; } return 1 - prev[n] / Math.max(m, n); }
    const out = ['base chars ' + base.length];
    for (const deg of [4, -8]) {
      const rc = ev('rotateCanvas')(c, deg);
      const sk = (await ThaiOCR.read(rc)).text.replace(/\s+/g, '');
      const fixed = ev('deskewCanvas')(ev('rotateCanvas')(c, deg));
      const fx = (await ThaiOCR.read(fixed)).text.replace(/\s+/g, '');
      out.push(deg + '°: skewed ' + sim(base, sk).toFixed(3) + ' → straightened ' + sim(base, fx).toFixed(3) + ' (angle ' + ev('deskewLast') + ')');
    }
    return out.join('\n');
  });
  console.log(r); await b.close();
})();
