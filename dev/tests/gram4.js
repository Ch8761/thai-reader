const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:'+(process.env.PORT||8765)+'/index.html'); await p.evaluate(() => { localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(2000);
  const r = await p.evaluate(() => window.__grammarSelfTest());
  console.log('total', r.total, 'dups', r.duplicates.join(','), 'fails', r.fails.length); r.fails.forEach(f => console.log('  ', f));
  const lv = await p.evaluate(() => { var c = {}; window.GRAMMAR.forEach(function (g) { c[g.lv] = (c[g.lv] || 0) + 1; }); return JSON.stringify(c); }); console.log('levels', lv);
  // unknown words in new examples
  const unk = await p.evaluate(() => { var out = []; window.GRAMMAR.slice(-41).forEach(function (g) { g.ex.forEach(function (e) { window.__ev('segment')(e[0]).forEach(function (s) { if (s.w && /[ก-ฮ]/.test(s.t) && !window.__ev('DICT')[s.t] && !s.gz) { out.push(g.id + ':' + s.t); } }); }); }); return out.join(' '); });
  console.log('unknown', unk || 'none');
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
