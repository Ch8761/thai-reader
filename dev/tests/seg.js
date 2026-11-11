const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.waitForTimeout(200); await p.fill('#textTitle', 'ig264（影片字幕）'); await p.fill('#input', 'แค่ตืนมาแล้วได้เจอ\nเราไปกินข้าวที่ร้านอาหารไทย'); await p.click('#addText'); await p.waitForTimeout(800);
  const segsS = () => E("segs.filter(function(x){return x.w;}).map(function(x){return x.t;}).join('|')");
  console.log('before', await segsS());
  await p.screenshot({ path: 'tests/sg-head.png', clip: { x: 0, y: 0, width: 820, height: 120 } });
  // merge: tap ตื
  await E("(function(){ showPop(segAt(state.text.indexOf('ตื'))); return 1; })()"); await p.waitForTimeout(300);
  await p.click('#pop .adjbtn:has-text("斷詞不對？")'); await p.waitForTimeout(200);
  await p.click('#pop .segedit .nmadj[aria-label="加入後面一個詞"]');
  console.log('preview', await p.textContent('#pop .segedit .segnew'));
  await p.click('#pop .segedit .nmadj[aria-label="後面少一個字"]');
  console.log('preview2', await p.textContent('#pop .segedit .segnew'));
  await p.screenshot({ path: 'tests/sg-merge.png' });
  await p.click('#pop .segedit button:has-text("存成一個詞")'); await p.waitForTimeout(300);
  console.log('after merge', await segsS(), '|', await p.textContent('#info'));
  // split: find a seg containing ร้านอาหาร or อาหารไทย
  const big = await E("(function(){ var x = segs.filter(function(s){ return s.w && s.t.length >= 6 && s.t.indexOf('อาหาร') >= 0; })[0]; return x ? x.t : ''; })()");
  console.log('big', big);
  const target = big || 'ร้าน';
  await E(`(function(){ showPop(segAt(state.text.indexOf(${JSON.stringify(target)}))); return 1; })()`); await p.waitForTimeout(300);
  await p.click('#pop .adjbtn:has-text("斷詞不對？")'); await p.click('#pop .segtabs button:has-text("拆開")'); await p.waitForTimeout(200);
  const gaps = await p.locator('#pop .seggap').count(); console.log('gaps', gaps);
  // cut before อาหาร
  const idx = await E(`(function(){ var w=${JSON.stringify(target)}; var c = cutPoints(w); return c.indexOf(w.indexOf('อาหาร') > 0 ? w.indexOf('อาหาร') : c[0]); })()`);
  await p.locator('#pop .seggap').nth(Math.max(0, idx)).click();
  await p.screenshot({ path: 'tests/sg-split.png' });
  await p.click('#pop .segedit button:has-text("存成拆開")'); await p.waitForTimeout(300);
  console.log('after split', await segsS());
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  console.log('settings', await p.textContent('#mySegCount'), await p.evaluate(() => document.getElementById('mySegList').innerText.replace(/\n/g, ' ')));
  await p.locator('#mySegList .nmdel').first().click(); await p.waitForTimeout(200);
  console.log('after delete', await segsS(), await p.textContent('#mySegCount'));
  // reload persists
  await p.reload(); await p.waitForTimeout(1500); console.log('after reload', await segsS());
  // undo via popup on ตืน
  await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(300);
  await E("(function(){ showPop(segAt(state.text.indexOf('ตืน'))); return 1; })()"); await p.click('#pop .adjbtn:has-text("斷詞不對？")');
  console.log('undo btn', await p.textContent('#pop .segundo')); await p.click('#pop .segundo'); await p.waitForTimeout(200); console.log('after undo', await segsS());
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
  const b2 = await chromium.launch(); const q = await (await b2.newContext(devices['iPhone 13'])).newPage();
  await q.goto('http://127.0.0.1:8765/index.html'); await q.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await q.reload(); await q.waitForTimeout(1500);
  await q.click('#openPaste'); await q.waitForTimeout(200); await q.fill('#textTitle', 'ScreenRecording_11-10（影片字幕）'); await q.fill('#input', 'แค่ตืนมาแล้วได้เจอ'); await q.click('#addText'); await q.waitForTimeout(800);
  await q.evaluate(() => { document.getElementById('ocrRedo').hidden = false; });
  await q.screenshot({ path: 'tests/sg-head-phone.png', clip: { x: 0, y: 0, width: 390, height: 130 } }); await b2.close();
})();
