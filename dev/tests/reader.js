const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', 'light'); localStorage.setItem('thai-level', 'a'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await p.screenshot({ path: 'tests/rd-home.png' });
  await p.click('#readerOpen'); await p.waitForTimeout(600);
  console.log('tab selected:', await p.getAttribute('#rdTabs [aria-selected="true"]', 'data-lv'), 'items:', await p.locator('#rdList .rditem').count());
  await p.screenshot({ path: 'tests/rd-sheet.png' });
  await p.click('#rdTabs [data-lv="c"]'); await p.waitForTimeout(200);
  console.log('c items:', await p.locator('#rdList .rditem').count());
  await p.click('#rdTabs [data-lv="a"]'); await p.waitForTimeout(200);
  await p.locator('#rdList .rditem').first().click(); await p.waitForTimeout(1200);
  console.log('doc title:', await p.textContent('#h-docv'), '| docs:', await E('lib.docs.length'), '| lib field:', await E("lib.docs.filter(function(d){return d.lib;}).map(function(d){return d.lib;}).join(',')"));
  await p.screenshot({ path: 'tests/rd-doc.png' });
  // open again: no duplicate
  await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
  await p.click('#readerOpen'); await p.waitForTimeout(400);
  console.log('badge:', await p.locator('#rdList .rdbadge').count());
  await p.locator('#rdList .rditem').first().click(); await p.waitForTimeout(800);
  console.log('docs after reopen:', await E('lib.docs.length'));
  // every text: words the app cannot explain
  const items = await p.evaluate(() => fetch('reader.json').then(r => r.json()));
  for (const it of items) {
    await E(`(function(){ state.text = ${JSON.stringify(it.text)}; segs = segment(state.text); return 1; })()`);
    const unk = await E(`(function(){ var out = []; segs.forEach(function(s){ if (!s.w || !/[\\u0E01-\\u0E2E]/.test(s.t)) { return; } var e = DICT[s.t] || (typeof dictBase === 'function' && DICT[dictBase(s.t)]); var g = typeof gazAt === 'function' ? null : null; if (!e && !s.gz && !(typeof entityAt === 'function' && entityAt(s.i))) { out.push(s.t); } }); return out.filter(function(x, i, a){ return a.indexOf(x) === i; }).join(' '); })()`);
    console.log(it.id, unk ? 'NO MEANING: ' + unk : 'all words found');
  }
  await p.setViewportSize({ width: 390, height: 844 }); await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'tests/rd-phone-home.png' });
  await p.click('#readerOpen'); await p.waitForTimeout(400); await p.screenshot({ path: 'tests/rd-phone-sheet.png' });
  console.log('errors:', errs);
  await b.close();
})();
