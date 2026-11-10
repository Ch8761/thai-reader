const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','dark'); }); await p.reload(); await p.waitForTimeout(800);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(1000);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  const cdp = await ctx.newCDPSession(p);
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
  await p.click('.tool[data-mode="ink"]');
  const box = await p.locator('#wrap').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + 300;
  const W = async (l) => console.log(l, await p.evaluate(() => { var d = document.documentElement, wide = []; document.querySelectorAll('body *').forEach(el => { var r = el.getBoundingClientRect(); if (r.right > d.clientWidth + 2 && r.width > 0 && !el.closest('#wrap')) wide.push((el.id || el.className || el.tagName) + ':' + Math.round(r.right)); }); return d.scrollWidth + '/' + d.clientWidth + ' vv=' + (window.visualViewport ? visualViewport.scale.toFixed(2) : '') + ' ' + wide.slice(0, 6).join(','); }));
  await W('w-before');
  console.log('before', await E("scale.toFixed(3) + ' ' + state.strokes.length + ' ' + getComputedStyle(document.getElementById('wrap')).touchAction"));
  // one finger lands first (would start a stroke), then the second
  await T('touchStart', [[cx - 50, cy]]);
  await T('touchMove', [[cx - 52, cy + 2]]);
  await T('touchStart', [[cx - 50, cy], [cx + 50, cy]]);
  for (let k = 1; k <= 10; k++) { await T('touchMove', [[cx - 50 - k * 12, cy], [cx + 50 + k * 12, cy]]); }
  await p.screenshot({ path: 'tests/p-mid.png' });
  await T('touchEnd', []);
  await p.waitForTimeout(600);
  console.log('after', await E("scale.toFixed(3) + ' zoom=' + viewPrefs.zoom + ' strokes=' + state.strokes.length + ' sl=' + document.getElementById('wrap').scrollLeft"));
  await p.screenshot({ path: 'tests/p-after.png' }); await W('w-after');
  // tap mode long-press select by touch
  await p.click('#vbZoom'); await p.click('#vbMenu button:has-text("符合螢幕")');
  await p.click('.tool[data-mode="tap"]');
  const r = await E("(function(){ var sp = pdf.tl.find(x => !x.sep && x.page === 1 && x.t.length > 20); var q = sp.el.getBoundingClientRect(); return { x: q.left + 3, y: q.top + q.height / 2, w: q.width }; })()");
  await T('touchStart', [[r.x, r.y]]); await p.waitForTimeout(600);
  for (let k = 1; k <= 8; k++) { await T('touchMove', [[r.x + k * r.w / 12, r.y]]); }
  await T('touchEnd', []); await p.waitForTimeout(400);
  console.log('touch-select', await p.evaluate(() => [document.getElementById('selpop').hidden, document.getElementById('spTh').textContent].join(' | ')));
  await p.screenshot({ path: 'tests/p-sel.png' });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
