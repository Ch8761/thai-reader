// 1.43：照片自動轉正
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const ev = window.__ev, out = {};
    for (const f of ['b300-1.png', 'photo.jpg']) {
      const im = new Image(); im.src = f; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0);
      out[f] = [0, 2, -4, 7, -10].map(d => { const a = ev('skewAngle')(d ? ev('rotateCanvas')(c, d) : c); return [d, a]; });
      const fixed = ev('deskewCanvas')(ev('rotateCanvas')(c, 6));
      out[f + ' after'] = ev('skewAngle')(fixed);
    }
    const n = document.createElement('canvas'); n.width = 600; n.height = 400; const g = n.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 600, 400); gr.addColorStop(0, '#3a7'); gr.addColorStop(1, '#fd5'); g.fillStyle = gr; g.fillRect(0, 0, 600, 400);
    out.noText = ev('skewAngle')(n);
    return out;
  });
  for (const f of ['b300-1.png', 'photo.jpg']) {
    ok(f + '：找到歪的角度（誤差 ≤ 0.5°）', r[f].every(([d, a]) => Math.abs(a + d) <= 0.5), JSON.stringify(r[f]));
    ok(f + '：轉正後再量是 0°', Math.abs(r[f + ' after']) <= 0.4, r[f + ' after']);
  }
  ok('沒有字的圖片不會亂轉', r.noText === 0, r.noText);
  await p.evaluate(() => window.__ev("showTab('settings')"));
  ok('設定裡可以關掉「照片自動轉正」', (await p.locator('#deskewGroup button').count()) === 2);
  await p.evaluate(() => localStorage.setItem('thai-deskew', '0'));
  ok('關掉後不轉', await p.evaluate(async () => { const ev = window.__ev; const im = new Image(); im.src = 'b300-1.png'; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); const r2 = ev('rotateCanvas')(c, 5); return ev('deskewCanvas')(r2) === r2; }));
  ok('沒有錯誤', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
