const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(800);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'tests/x-tap.png', clip: { x: 0, y: 0, width: 820, height: 420 } });
  await p.click('.tool[data-mode="ink"]'); await p.waitForTimeout(150);
  await p.click('#inkCustom'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'tests/x-ink.png', clip: { x: 0, y: 0, width: 820, height: 560 } });
  console.log('ink list', await p.evaluate(() => document.getElementById('cpCount').textContent));
  await p.dispatchEvent('#cpGrid .cp-sw >> nth=0', 'pointerup'); await p.waitForTimeout(100);
  console.log('ink color', await E('toolPrefs.inkColor'));
  // iPad-like: only input event from picker, no change
  await p.evaluate(() => { const i = document.querySelector('#cpGrid .cp-add input'); i.value = '#aa00ff'; i.dispatchEvent(new Event('input')); });
  console.log('after input', await E("toolPrefs.inkColor + ' list=' + toolPrefs.inkColors.join(' ')"));
  await p.mouse.click(10, 1100); await p.waitForTimeout(100);
  console.log('after close', await E("document.getElementById('cpop').hidden + ' list=' + toolPrefs.inkColors.join(' ')"));
  // draw by touch (CDP)
  const cdp = await ctx.newCDPSession(p);
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
  const w = await p.locator('#wrap').boundingBox();
  await T('touchStart', [[w.x + 100, w.y + 200]]); for (let k = 1; k < 10; k++) await T('touchMove', [[w.x + 100 + k * 20, w.y + 200 + k * 5]]); await T('touchEnd', []);
  await p.waitForTimeout(200);
  console.log('stroke', await E("JSON.stringify(state.strokes.map(s => [s.c, s.w, s.p.length]))"));
  const px = await p.evaluate(([x, y]) => { const c = document.querySelector('#pdfpages canvas.ink, canvas.ink'); return c ? 'canvas' : 'none'; }, [0, 0]);
  await p.screenshot({ path: 'tests/x-stroke.png', clip: { x: w.x, y: w.y + 150, width: 400, height: 120 } });
  await p.click('.tool[data-mode="hl"]'); await p.click('#hlCustom'); await p.waitForTimeout(150);
  console.log('hl list', await p.evaluate(() => [document.getElementById('cpCount').textContent, document.getElementById('cpop').hidden].join()));
  await p.dispatchEvent('#cpGrid .cp-sw >> nth=0', 'pointerup');
  console.log('hl color', await E('toolPrefs.hlColor'));
  await p.screenshot({ path: 'tests/x-hl.png', clip: { x: 0, y: 0, width: 820, height: 560 } });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
