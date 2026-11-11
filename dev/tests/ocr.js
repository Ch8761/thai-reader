const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(800);
  const rep = async (k) => (await p.inputValue('#report')).split('\n').filter(l => k.some(x => l.startsWith(x))).join('\n');
  await p.setInputFiles('#pdffile', ['ocrtest/mixed.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent) && /mixed/.test(document.getElementById('h-docv').textContent), null, { timeout: 60000 });
  console.log('docpages:', (await p.innerText('#docpages')).replace(/\n/g, ' / '));
  console.log('ocrbox visible:', await p.isVisible('#ocrbox'), '|', await p.innerText('#ocrmsg'), '| btn:', await p.innerText('#ocrGo'));
  // highlight something on page 2 (text page)
  const pg2 = await p.$eval('.pdfpage[data-i="1"]', e => { e.scrollIntoView(); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.waitForTimeout(300);
  const pg2b = await p.$eval('.pdfpage[data-i="1"]', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.click('.tool[data-mode="hl"]');
  await p.mouse.move(pg2b.x + pg2b.w * 0.15, pg2b.y + pg2b.h * 0.2); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(pg2b.x + pg2b.w * (0.15 + i * 0.03), pg2b.y + pg2b.h * 0.2); await p.mouse.up();
  await p.click('.tool[data-mode="tap"]');
  console.log('before:', await rep(['筆記數量']));
  const hlText = await p.$$eval('#text .hl', els => els.map(e => e.textContent).join('|'));
  console.log('hl text before:', hlText.slice(0, 80));
  const t0 = Date.now();
  await p.click('#ocrGo');
  await p.waitForFunction(() => /由文字辨識讀出|出錯/.test(document.getElementById('ocrmsg').textContent), null, { timeout: 240000 });
  console.log('after', (Date.now() - t0) / 1000, 's:', await p.innerText('#ocrmsg'));
  console.log('docpages:', (await p.innerText('#docpages')).replace(/\n/g, ' / '));
  console.log('after:', await rep(['筆記數量', '文字辨識']));
  console.log('hl text after:', (await p.$$eval('#text .hl', els => els.map(e => e.textContent).join('|'))).slice(0, 80));
  console.log('page1 text:', (await p.$$eval('#text span.tl', els => els.slice(0, 40).map(e => e.textContent).join(''))).slice(0, 300));
  // tap a word on page 1
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
  const pg1 = await p.$eval('.pdfpage[data-i="0"]', e => { e.scrollIntoView(); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.waitForTimeout(400);
  const sp = await p.$$eval('#text span.tl', els => { const e = els.find(x => x.textContent.length > 8 && /[ก-๙]/.test(x.textContent)); const r = e.getBoundingClientRect(); return { x: r.left + r.width * 0.3, y: r.top + r.height / 2, t: e.textContent }; });
  await p.mouse.click(sp.x, sp.y); await p.waitForTimeout(500);
  console.log('tapped span:', sp.t, '| pop:', (await p.isVisible('#pop')) ? (await p.innerText('#pop')).replace(/\n/g, ' / ').slice(0, 160) : 'hidden');
  await p.screenshot({ path: 'tests/ocr-mixed.png' });
  await p.evaluate(() => { const b = document.getElementById('ocrbox'); b.scrollIntoView(); }); await p.screenshot({ path: 'tests/ocr-box.png' });
  // reload persistence
  await p.reload(); await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent) && /mixed/.test(document.getElementById('h-docv').textContent), null, { timeout: 60000 }).catch(() => {});
  console.log('reload docpages:', (await p.innerText('#docpages')).replace(/\n/g, ' / '), '|', await rep(['筆記數量']));
  // image import
  await p.click('.tabbar [data-tab="home"]');
  const t1 = Date.now();
  await p.setInputFiles('#imgfile', ['ocrtest/photo.jpg']);
  await p.waitForFunction(() => /由文字辨識讀出|出錯/.test(document.getElementById('ocrmsg').textContent) && /圖片/.test(document.getElementById("h-docv").textContent) && /由文字辨識讀出/.test(document.getElementById("ocrmsg").textContent), null, { timeout: 240000 });
  console.log('image', (Date.now() - t1) / 1000, 's:', await p.innerText('#h-docv'), '|', await p.innerText('#ocrmsg'));
  console.log('home list:', (await p.innerText('#docList')).replace(/\n/g, ' / ').slice(0, 200));
  await p.screenshot({ path: 'tests/ocr-image.png' });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
