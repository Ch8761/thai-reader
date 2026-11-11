const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type()==='error') errs.push('console:'+m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(800);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(1200);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  const info = async (l) => console.log(l, JSON.stringify(await E("({ scale: scale.toFixed(3), zoom: viewPrefs.zoom, paged: viewPrefs.paged, label: document.getElementById('vbZoom').textContent, page: document.getElementById('vbPage').textContent, wrapH: document.getElementById('wrap').style.height, tr: document.getElementById('page').style.transform, sy: scrollY })")));
  await info('open');
  await p.screenshot({ path: 'tests/v-fit.png' });
  await p.click('#vbZoom'); await p.screenshot({ path: 'tests/v-menu.png' });
  await p.click('#vbMenu button:has-text("符合寬度")'); await info('width');
  await p.click('#vbZoom'); await p.click('#vbMenu button:has-text("150%")'); await info('150');
  await p.screenshot({ path: 'tests/v-150.png' });
  await p.click('#vbZoom'); await p.click('#vbMenu button:has-text("符合螢幕")');
  await p.click('#vbZoom'); await p.click('#vbMenu button:has-text("左右翻頁")'); await p.waitForTimeout(500); await info('paged');
  await p.click('#vbNext'); await p.waitForTimeout(800); await info('next');
  await p.screenshot({ path: 'tests/v-paged.png' });
  await p.click('#vbPage'); await p.fill("#vbInput", "2"); await p.press('#vbInput', 'Enter'); await p.waitForTimeout(800); await info('jump3');
  // tools
  await p.click('.tool[data-mode="hl"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/v-hl.png', clip: { x: 0, y: 0, width: 820, height: 400 } });
  await p.click('#toolopts .sw2[aria-label="綠"]');
  await p.click('#toolopts .ob-under');
  // draw highlight drag over text on current page
  const r = await E("(function(){ var sp = pdf.tl.find(x => !x.sep && x.page === 2 && x.t.length > 10); var q = sp.el.getBoundingClientRect(); return { x: q.left + 3, y: q.top + q.height / 2, w: q.width }; })()");
  await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * 0.6, r.y, { steps: 8 }); await p.mouse.up();
  console.log('hl', JSON.stringify(await E('state.hl')));
  await p.click('.tool[data-mode="ink"]'); await p.click('#toolopts .sw2[aria-label="紅"]'); await p.click('#toolopts .ow:nth-last-child(1)');
  await p.mouse.move(r.x, r.y + 40); await p.mouse.down(); await p.mouse.move(r.x + 200, r.y + 70, { steps: 10 }); await p.mouse.up();
  console.log('stroke', JSON.stringify(await E("(function(){ var s = state.strokes[state.strokes.length-1]; return { c: s.c, w: s.w, n: s.p.length }; })()")));
  console.log('undo state', await E("[document.getElementById('undo').disabled, document.getElementById('redo').disabled, history.length, redoStack.length].join()"));
  await p.click('#undo'); console.log('after undo', await E("[state.strokes.length, history.length, redoStack.length, document.getElementById('redo').disabled].join()"));
  await p.click('#redo'); console.log('after redo', await E("[state.strokes.length, history.length, redoStack.length].join()"));
  await p.screenshot({ path: 'tests/v-ink.png' });
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/v-box.png', clip: { x: 0, y: 0, width: 820, height: 400 } });
  // progress
  await p.click('.tool[data-mode="tap"]');
  await p.waitForTimeout(900);
  console.log('prog', await p.evaluate(() => localStorage.getItem('thai-progress')));
  await p.reload(); await p.waitForTimeout(3000);
  await info('reload');
  // selection drag in tap mode (mouse = drag)
  const r2 = await E("(function(){ var sp = pdf.tl.find(x => !x.sep && x.page === viewCur + 1 && x.t.length > 10); var q = sp.el.getBoundingClientRect(); return { x: q.left + 3, y: q.top + q.height / 2, w: q.width }; })()");
  await p.mouse.move(r2.x, r2.y); await p.mouse.down(); await p.mouse.move(r2.x + r2.w * 0.7, r2.y, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(1500);
  console.log('selpop', await p.evaluate(() => [document.getElementById('selpop').hidden, document.getElementById('spTh').textContent.slice(0,30), document.getElementById('spTr').textContent, document.getElementById('pop').hidden].join(' | ')));
  await p.screenshot({ path: 'tests/v-sel.png' });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
