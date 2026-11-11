const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const pre = process.argv[2] || 'a';
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  // open sample doc
  await p.locator('.libitem, .docitem, [data-docid]').first().click().catch(() => {}); await p.waitForTimeout(1200);
  await E("showTab('doc')"); await p.waitForTimeout(500); await p.screenshot({ path: `shots/${pre}-doc.png` });
  // tap a word
  const w = p.locator('#text .w, #reader .w, .seg.w, span.w').nth(3); if (await w.count()) { await w.click(); await p.waitForTimeout(700); await p.screenshot({ path: `shots/${pre}-pop.png` }); await p.keyboard.press('Escape'); }
  // add a few cards
  await E("showTab('cards')"); await p.waitForTimeout(500); await p.screenshot({ path: `shots/${pre}-cards.png`, fullPage: true });
  await E("showTab('settings')"); await p.waitForTimeout(500); await p.screenshot({ path: `shots/${pre}-settings.png`, fullPage: true });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
