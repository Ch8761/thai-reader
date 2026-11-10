const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  const txt = require('fs').readFileSync(process.argv[2], 'utf8');
  const r = await p.evaluate((t) => window.__ev(`(function(t){ var raw = segment.__raw; var s = new Intl.Segmenter('th', { granularity: 'word' }); var segsRaw = Array.from(s.segment(t)).map(function (x) { return { i: x.index, n: x.segment.length, w: !!x.isWordLike, t: x.segment }; }); var m = dictMerge(segsRaw); var cnt = {}; m.forEach(function (g) { if (!segsRaw.some(function (x) { return x.i === g.i && x.n === g.n; })) { cnt[g.t] = (cnt[g.t] || 0) + 1; } }); return Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).map(function (k) { return k + ':' + cnt[k] + '=' + zhOfEntry(k); }); })`)(t), txt);
  console.log(r.length, r.slice(0, 120).join('  '));
  await b.close();
})();
