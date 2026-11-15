// 各種泰文字體的辨識率：新版（OpenThai）對舊版（Tesseract），字元錯誤率
const { chromium } = require('playwright'); const fs = require('fs');
const FONTS = fs.readdirSync('srv/fe').filter(f => /woff2$/.test(f)).map(f => f.replace('.woff2', ''));
const TEXT = ['ความสุขในตอนเช้าของแต่ละคนอาจแตกต่างกันไป', 'บางคนคือการได้นั่งจิบกาแฟหอมๆ ก่อนไปทำงาน', 'แค่ตื่นมาแล้วได้เจอหน้าเธอเป็นคนแรก', 'ร้านนี้ขายข้าวมันไก่ ก๋วยเตี๋ยว และน้ำผลไม้ปั่น ราคา 60 บาท', 'รัฐบาลประกาศมาตรการช่วยเหลือผู้ประกอบการรายย่อย'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('PE', String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__lev = function (a, b) { var m = a.length, n = b.length, d = []; for (var i = 0; i <= m; i++) { d[i] = [i]; } for (var j = 0; j <= n; j++) { d[0][j] = j; } for (i = 1; i <= m; i++) { for (j = 1; j <= n; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); } } return d[m][n]; }; });
  const rows = [];
  for (const font of FONTS) {
    const r = await p.evaluate(async ([font, TEXT, variant]) => {
      const ff = new FontFace('fe-' + font, 'url(fe/' + font + '.woff2)'); await ff.load(); document.fonts.add(ff);
      const out = {};
      for (const [vn, size, fg, bg] of [['28黑字', 28, '#111', '#fff'], ['44白字深底', 44, '#fff', '#2a3340']]) {
        const c = document.createElement('canvas'); c.width = 1400; c.height = 60 + TEXT.length * size * 2.1; const g = c.getContext('2d');
        g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.fillStyle = fg; g.font = size + 'px "fe-' + font + '"'; g.textBaseline = 'alphabetic';
        TEXT.forEach((t, i) => g.fillText(t, 40, 30 + size * 1.4 + i * size * 2.1));
        window.__c = c;
        const want = TEXT.join('').replace(/\s+/g, '');
        for (const eng of ['ot', 'ts']) {
          const txt = await window.__ev("(" + (eng === 'ot' ? "otLoad()" : "_ensureOcr42()") + ").then(function (w) { return w.recognize(window.__c, {}, { blocks: true, text: true }); }).then(function (r) { var t = ''; (r.data.blocks || []).forEach(function (b) { b.paragraphs.forEach(function (p) { p.lines.forEach(function (l) { t += l.text; }); }); }); return t; })");
          const got = String(txt).normalize('NFC').replace(/\s+/g, '');
          out[vn + '-' + eng] = Math.round(window.__lev(want, got) / want.length * 1000) / 10;
          if (eng === 'ot' && vn === '28黑字') { out.sample = got.slice(0, 40); }
        }
      }
      return out;
    }, [font, TEXT]);
    rows.push([font, r]); console.log(font.padEnd(24), JSON.stringify(r));
  }
  fs.writeFileSync('/tmp/fonteval.json', JSON.stringify(rows));
  await b.close();
})();
