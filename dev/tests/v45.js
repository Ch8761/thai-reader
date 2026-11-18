// 1.45：瀏覽器沒有泰文斷詞時，也用字典切開（不會整串當成查不到）
const { chromium } = require('playwright');
const T = JSON.parse(require('fs').readFileSync(__dirname + '/../sample.json', 'utf8'));
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { const S = Intl.Segmenter; Intl.Segmenter = function (l, o) { return { segment: (t) => { const out = []; const re = /[฀-๿]+|[^฀-๿]+/g; let m; while ((m = re.exec(t))) { out.push({ segment: m[0], index: m.index, isWordLike: /\S/.test(m[0]) }); } return out; } }; }; });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-quest-quiet','1'); }); await p.reload(); await p.waitForTimeout(2500);
  await p.evaluate((t) => window.__ev("showTab('home'); $('input').value = " + JSON.stringify(t) + "; libAddText(); 1"), T); await p.waitForTimeout(2500);
  const unk = await p.evaluate(() => document.querySelectorAll('#text mark.unk').length);
  const foreign = await p.evaluate(() => document.querySelectorAll('#text mark.ent-foreign').length);
  const longest = await p.evaluate(() => window.__ev("Math.max.apply(null, segs.filter(function(s){return s.w}).map(function(s){return s.t.length}))"));
  ok('一整串泰文也會切成詞（最長的詞 ≤ 12 字）', longest <= 12, longest);
  ok('不會整篇標成查不到或外來語', unk <= 2 && foreign === 0, unk + ' / ' + foreign);
  ok('沒有錯誤', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
