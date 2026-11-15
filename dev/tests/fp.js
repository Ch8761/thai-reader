// 自動校正的誤改檢查：拿正確的文章（讀物庫＋例句）跑一遍，被改掉的都是誤改
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const rd = await (await fetch('reader.json')).json(), ex = await (await fetch('examples.json')).json();
    const texts = [];
    (function walk(o) { if (typeof o === 'string') { if (/[ก-ฮ]{4}/.test(o)) texts.push(o); } else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); })(rd);
    const nRead = texts.length;
    (function walk(o, d) { if (texts.length > nRead + 4000) return; if (typeof o === 'string') { if (/[ก-ฮ]{4}/.test(o)) texts.push(o); } else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); })(ex.s);
    window.__t = texts;
    return window.__ev("(function(){ var ch = [], chars = 0; window.__t.forEach(function (t) { chars += t.length; var g = ocrGuess(t); if (g.n) { var a = segment(t).map(function(x){return x.t}), b2 = g.t; ch.push(t.slice(0, 60) + ' => ' + g.t.slice(0, 60)); } }); return JSON.stringify({ texts: window.__t.length, chars: chars, changed: ch.length, sample: ch.slice(0, 25) }); })()");
  });
  const o = JSON.parse(r); console.log('texts', o.texts, 'chars', o.chars, 'changed', o.changed); o.sample.forEach(x => console.log('  ', x));
  await b.close();
})();
