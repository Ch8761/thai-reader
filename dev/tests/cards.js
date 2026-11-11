const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', 'pdfin/B.pdf'); await p.waitForFunction(() => /\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  const pt = (word) => p.evaluate((word) => { for (const sp of document.querySelectorAll('#text .tl')) { const t = sp.textContent, i = t.indexOf(word); if (i < 0) continue; const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); let n, acc = 0; while ((n = w.nextNode())) { if (i + 1 < acc + n.nodeValue.length) { const rg = document.createRange(); rg.setStart(n, i + 1 - acc); rg.setEnd(n, i + 2 - acc); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += n.nodeValue.length; } } return null; }, word);
  for (const w of ['เตือน', 'อิทธิพล', 'แทรกซึม']) {
    await p.keyboard.press('Escape');
    let q = await pt(w); await p.evaluate((y) => window.scrollBy(0, y - 400), q.y); await p.waitForTimeout(200); q = await pt(w);
    await p.mouse.click(q.x, q.y); await p.waitForTimeout(250);
    await p.click('#pop .cardbtn'); console.log(w, '→', await p.innerText('#pop .cardbtn'), '|', await p.innerText('#info'));
  }
  await p.screenshot({ path: 'tests/pop-card.png', clip: await p.$eval('#pop', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: 220 }; }) });
  await p.keyboard.press('Escape');
  console.log('button:', await p.innerText('#openCards'));
  await p.click('#openCards'); await p.waitForTimeout(200);
  console.log('panel:', (await p.innerText('#cards')).replace(/\n/g, ' / ').slice(0, 200));
  await p.click('#cardbody button.primary');
  await p.locator('#cards').scrollIntoViewIfNeeded();
  await p.screenshot({ path: 'tests/card-front.png', clip: await p.$eval('#cards', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: Math.max(0, r.top), width: r.width, height: Math.min(700, r.height) }; }) });
  await p.click('.cans .primary'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'tests/card-back.png', clip: await p.$eval('#cards', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: Math.max(0, r.top), width: r.width, height: Math.min(800, r.height) }; }) });
  await p.click('.cans .cno'); // 不會
  for (let i = 0; i < 4; i++) { const t = await p.innerText('#cardbody'); if (!(await p.$('.cans'))) break; console.log('step', i, t.split('\n')[0]); await p.click('.cans .primary'); await p.waitForTimeout(80); if (await p.$('.cans .primary') && (await p.innerText('.cans .primary')) === '會了') await p.click('.cans .primary'); await p.waitForTimeout(80); }
  console.log('after review:', (await p.innerText('#cardbody')).replace(/\n/g, ' / '));
  await p.click('#cardTabs button:nth-child(2)');
  console.log('list:', (await p.innerText('#cardbody')).replace(/\n/g, ' / ').slice(0, 300));
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.click('#cardbody button:has-text("複製成 Anki")'); await p.waitForTimeout(300);
  console.log('msg:', await p.innerText('#cardmsg'));
  console.log('report:', (await p.inputValue('#report')).split('\n').filter(l => l.startsWith('生字卡')).join());
  await p.reload(); await p.waitForTimeout(1500); console.log('after reload button:', await p.innerText('#openCards'));
  console.log('ERRORS:', errs.join(' | ') || 'none');
  await b.close();
})();
