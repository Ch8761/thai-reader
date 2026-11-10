const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); localStorage.setItem('thai-tone-mode','1'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.fill('#textTitle', 'ทดสอบ'); await p.fill('#input', 'วันนี้ไปประชุมที่ร้านอาหาร อร่อยมาก แต่เหนื่อยนิดหน่อย ตอนนี้กำลังเดินทางกลับบ้าน'); await p.click('#addText'); await p.waitForTimeout(800);
  await E("(function(){ showPop(segAt(state.text.indexOf('ร้านอาหาร') + 1)); return 1; })()"); await p.waitForTimeout(600);
  let bb = await p.locator('#pop').boundingBox(); await p.screenshot({ path: 'tests/t-pop.png', clip: { x: bb.x - 4, y: bb.y - 4, width: bb.width + 8, height: Math.min(1000, bb.height + 8) } });
  console.log('tone sec', await p.evaluate(() => (document.querySelector('#pop .tonesec') || {}).innerText));
  // popup note buttons
  await p.click('#pop .pn-hl'); console.log('hl from pop', await E('JSON.stringify(state.hl)'));
  await p.click('#pop .pn-box'); await p.waitForTimeout(200); console.log('box from pop', await E('state.boxes.length + " focused=" + focusedId'));
  await p.keyboard.type('note'); await p.mouse.click(10, 1100);
  // hl tap -> lookup
  await p.click('.tool[data-mode="hl"]');
  const r = await E("(function(){ var x = clientRectOf(state.text.indexOf('เหนื่อย'), state.text.indexOf('เหนื่อย') + 7); return { x: x.left + 10, y: x.top + x.height / 2 }; })()");
  await p.mouse.click(r.x, r.y); await p.waitForTimeout(300);
  console.log('hl tap pop', await p.evaluate(() => !document.getElementById('pop').hidden && document.querySelector('#pop .pw').textContent), await E('state.hl.length'));
  // ink: draw, tap lookup, erase
  await p.click('#pop .x').catch(() => {});
  await p.click('.tool[data-mode="ink"]');
  await p.mouse.move(r.x - 60, r.y + 30); await p.mouse.down(); await p.mouse.move(r.x + 100, r.y + 40, { steps: 8 }); await p.mouse.up();
  console.log('strokes', await E('state.strokes.length'));
  await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(300);
  console.log('ink tap pop', await p.evaluate(() => !document.getElementById('pop').hidden), await E('state.strokes.length'));
  await p.click('#pop .x').catch(() => {});
  await p.click('#toolopts .otool >> nth=1'); console.log('tool', await E('toolPrefs.inkTool'));
  await p.screenshot({ path: 'tests/t-erase.png', clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await p.mouse.move(r.x + 20, r.y + 60); await p.mouse.down(); await p.mouse.move(r.x + 20, r.y + 10, { steps: 6 }); await p.mouse.up();
  console.log('after erase', await E('state.strokes.length'), 'undo', await E('history.length'));
  await p.click('#undo'); console.log('after undo', await E('state.strokes.length'));
  // cards + tone quiz
  for (const w of ['ประชุม', 'อร่อย', 'เหนื่อย', 'ร้านอาหาร']) { await E(`(function(){ addCard(segAt(state.text.indexOf('${w}') + 1)); return 1; })()`); }
  await p.click('.tabbar [data-tab="cards"]'); await p.click('#cardTabs button:has-text("測驗")'); await p.waitForTimeout(200);
  await p.click('#cardbody .qtypes button:has-text("聲調")'); await p.click('#cardbody button:has-text("開始測驗")'); await p.waitForTimeout(400);
  await p.click('#cardbody .qopt >> nth=1'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/t-quiz.png' });
  await p.click('#cardTabs button:has-text("全部")'); await p.click('#cardbody .crow >> nth=0'); await p.waitForTimeout(800);
  await p.screenshot({ path: 'tests/t-detail.png' });
  await p.click('#cdClose');
  // video
  await p.click('.tabbar [data-tab="home"]');
  await p.setInputFiles('#imgfile', ['vidtest/subs.mp4']); await p.waitForSelector('#vidPick:not([hidden])', { timeout: 60000 }); await p.click('#vpGo');
  await p.waitForFunction(() => /影片字幕/.test(document.getElementById('h-docv').textContent) || /失敗|沒有讀到/.test((document.getElementById('vidMsg') || {}).textContent || ''), null, { timeout: 240000 });
  console.log('video doc', await p.evaluate(() => document.getElementById('h-docv').textContent + ' | ' + (document.getElementById('vidMsg') || {}).textContent), await E('JSON.stringify(state.text)'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
