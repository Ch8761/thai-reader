const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html');
  const D = 864e5, now = Date.now();
  // one new card, one old (Leitner-era) card due today, one old card not due
  await p.evaluate(([now, D]) => {
    localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', 'light');
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const cards = [
      { id: 'c1', w: 'อาหาร', zh: '食物', added: now - 1000, box: 1, due: t0.getTime() },
      { id: 'c2', w: 'ร้าน', zh: '店', added: now - 9 * D, box: 3, ivl: 6, ease: 2.5, lapses: 0, seen: 3, right: 3, last: now - 6 * D, due: t0.getTime() },
      { id: 'c3', w: 'กิน', zh: '吃', added: now - 9 * D, box: 4, ivl: 14, ease: 2.7, lapses: 0, seen: 4, right: 4, last: now - 2 * D, due: t0.getTime() + 12 * D }
    ];
    localStorage.setItem('thai-cards-v1', JSON.stringify({ cards: cards, folders: [], cur: 'all' }));
  }, [now, D]);
  await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  console.log('keys', await E("Object.keys(localStorage).filter(function(k){return /card/.test(k);}).join(',')"));
  console.log('intervals new card:', await E("JSON.stringify(fsIvls(cards.filter(function(c){return c.id==='c1';})[0]))"));
  console.log('intervals old card (ivl 6, 6 days ago):', await E("JSON.stringify(fsIvls(cards.filter(function(c){return c.id==='c2';})[0]))"));
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(400);
  const startBtn = p.locator('button:has-text("開始複習")'); console.log('start button:', await startBtn.textContent());
  await startBtn.click(); await p.waitForTimeout(300);
  await p.click('button:has-text("看答案")'); await p.waitForTimeout(200);
  const labels = await p.$$eval('.grades button, button.g0, button.g1, button.g2, button.g3', bs => bs.map(b => b.getAttribute('aria-label')));
  console.log('buttons:', JSON.stringify(labels));
  await p.screenshot({ path: 'tests/fsrs-review.png' });
  // answer 記得 for first, 忘了 for second
  await p.click('button[aria-label^="記得"]'); await p.waitForTimeout(200);
  await p.click('button:has-text("看答案")'); await p.waitForTimeout(200);
  console.log('second card buttons:', JSON.stringify(await p.$$eval('button[aria-label*="下次"]', bs => bs.map(b => b.getAttribute('aria-label')))));
  await p.click('button[aria-label^="忘了"]'); await p.waitForTimeout(200);
  await p.click('button:has-text("看答案")'); await p.waitForTimeout(200);
  console.log('same-day again buttons:', JSON.stringify(await p.$$eval('button[aria-label*="下次"]', bs => bs.map(b => b.getAttribute('aria-label')))));
  await p.click('button[aria-label^="記得"]'); await p.waitForTimeout(300);
  const st = await E("JSON.stringify(cards.map(function(c){return [c.w, c.fs && [+c.fs.s.toFixed(2), +c.fs.d.toFixed(2)], c.ivl, c.box, c.lapses];}))");
  console.log('state:', st);
  // persisted?
  await p.reload(); await p.waitForTimeout(1200);
  console.log('after reload:', await E("JSON.stringify(cards.map(function(c){return [c.w, !!c.fs, c.ivl];}))"));
  // detail shows recall
  await E("openCardDetail('c2')"); await p.waitForTimeout(400);
  console.log('detail:', await p.evaluate(() => { const m = document.body.innerText.match(/熟悉度[^\n]*/); return m ? m[0] : 'none'; }));
  console.log('errors:', errs);
  await b.close();
})();
