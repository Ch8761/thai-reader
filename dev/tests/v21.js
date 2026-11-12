const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(800);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.fill('#textTitle', 'ทดสอบ'); await p.fill('#input', 'วันนี้ไปประชุมที่ร้านอาหาร อร่อยมาก แต่เหนื่อยนิดหน่อย ตอนนี้กำลังเดินทางกลับบ้าน'); await p.click('#addText'); await p.waitForTimeout(800);
  // popup
  await E("(function(){ showPop(segAt(state.text.indexOf('ประชุม') + 1)); return 1; })()"); await p.waitForTimeout(200);
  let bb = await p.locator('#pop').boundingBox(); await p.screenshot({ path: 'tests/z-pop.png', clip: { x: bb.x - 4, y: bb.y - 4, width: bb.width + 8, height: Math.min(700, bb.height + 8) } });
  // add 3 cards
  for (const w of ['ประชุม', 'อร่อย', 'เหนื่อย']) { await E(`(function(){ var sg = segAt(state.text.indexOf('${w}') + 1); addCard(sg); return 1; })()`); }
  await E('updateCardButton(); 1');
  console.log('badge', await p.evaluate(() => [document.getElementById('cardBadge').hidden, document.getElementById('cardBadge').textContent].join()));
  // hl GoodNotes colors
  await p.click('.tool[data-mode="hl"]'); await p.waitForTimeout(100);
  await p.click('#fav-hl-1'); console.log('hl select', await E('toolPrefs.hlColor'), await p.evaluate(() => document.getElementById('cpop').hidden));
  await p.click('#fav-hl-1'); console.log('hl reopen ->cpop hidden?', await p.evaluate(() => document.getElementById('cpop').hidden));
  await p.screenshot({ path: 'tests/z-cpop.png', clip: { x: 0, y: 0, width: 1024, height: 560 } });
  await p.dispatchEvent('#cpGrid .cp-sw >> nth=2', 'pointerup'); await p.waitForTimeout(100);
  console.log('hl after pick', await E("toolPrefs.hlColor + ' fav=' + toolPrefs.hlFav.join(' ') + ' list=' + toolPrefs.hlColors.join(' ')"), await p.evaluate(() => document.getElementById('cpop').hidden));
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(100);
  await p.dispatchEvent('#fav-box-2', 'pointerup'); await p.waitForTimeout(80); console.log('box sel', await E('currentStyle().color'), await p.evaluate(() => document.getElementById('cpop').hidden));
  await p.dispatchEvent('#fav-box-2', 'pointerup'); await p.waitForTimeout(80); console.log('box reopen hidden?', await p.evaluate(() => document.getElementById('cpop').hidden));
  await p.dispatchEvent('#cpGrid .cp-sw >> nth=0', 'pointerup'); await p.waitForTimeout(80);
  console.log('box after', await E("currentStyle().color + ' fav=' + toolPrefs.boxFav.join(' ')"));
  await p.click('.tool[data-mode="tap"]');
  // read-along with stub speech
  await p.evaluate(() => {
    const q = []; let cur = null;
    window.speechSynthesis.speak = (u) => { q.push(u); if (!cur) next(); };
    function next() { cur = q.shift(); if (!cur) return; const u0 = cur; setTimeout(() => { if (cur !== u0) return; u0.onstart && u0.onstart(); setTimeout(() => { if (cur !== u0) return; cur = null; u0.onend && u0.onend(); next(); }, 500); }, 20); }
    window.speechSynthesis.cancel = () => { q.length = 0; if (cur) { const u = cur; cur = null; u.onerror && u.onerror({ error: 'interrupted' }); } };
    Object.defineProperty(window.speechSynthesis, 'speaking', { get: () => !!cur, configurable: true });
    Object.defineProperty(window.speechSynthesis, 'pending', { get: () => q.length > 0, configurable: true });
  });
  await p.click('#readAll'); await p.waitForTimeout(800);
  console.log('reading marks', await p.evaluate(() => [...document.querySelectorAll('#text mark.reading')].map(m => m.textContent).join('|')));
  await p.screenshot({ path: 'tests/z-read.png', clip: { x: 0, y: 0, width: 1024, height: 560 } });
  await p.click('#stopRead'); await p.waitForTimeout(100);
  console.log('after stop marks', await p.evaluate(() => document.querySelectorAll('#text mark.reading').length));
  // cards tab
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(300);
  console.log('badge after visit', await p.evaluate(() => document.getElementById('cardBadge').hidden));
  await p.click('#cardTabs button >> nth=0'); await p.click('#cardbody button:has-text("開始複習")'); await p.click('#cardbody button:has-text("看答案")');
  await p.screenshot({ path: 'tests/z-review.png' });
  await p.click('#cardbody .grade.g2'); console.log('after grade', await E("cards.map(c => c.w + ':' + c.ivl + ':' + c.box).join(' ')"));
  await p.click('#cardTabs button:has-text("測驗")'); await p.click('#cardbody button:has-text("開始測驗")');
  await p.click('#cardbody .qopt >> nth=0'); await p.screenshot({ path: 'tests/z-quiz.png' });
  await p.click('#cardTabs button:has-text("清單")'); await p.waitForTimeout(100);
  await p.screenshot({ path: 'tests/z-list.png' });
  await p.click('#cardbody .crow >> nth=0'); await p.waitForTimeout(800);
  console.log('detail', await p.evaluate(() => document.getElementById('cdBody').innerText.replace(/\s+/g, ' ').slice(0, 300)));
  await p.screenshot({ path: 'tests/z-detail.png' });
  await p.click('#cdClose');
  // home grid
  await p.click('.tabbar [data-tab="home"]'); await p.click('.viewtoggle [data-hv="grid"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/z-grid.png', clip: { x: 0, y: 0, width: 1024, height: 700 } });
  await p.click('#docList .dmore >> nth=0'); await p.screenshot({ path: 'tests/z-grid-menu.png', clip: { x: 0, y: 0, width: 1024, height: 700 } });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
