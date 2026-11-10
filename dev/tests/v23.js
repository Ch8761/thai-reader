const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); localStorage.setItem('thai-tone-mode','1'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.fill('#textTitle', 'ทดสอบ'); await p.fill('#input', 'เมื่อวานฉันไปตลาดกับแม่เพราะว่าต้องซื้อผักและผลไม้ที่สดมาก ถ้าฝนไม่ตกเราจะไปเที่ยวทะเลด้วยกัน'); await p.click('#addText'); await p.waitForTimeout(800);
  // 3 grammar focus
  await E("(function(){ showPop(segAt(state.text.indexOf('ตลาด') + 1)); return 1; })()"); await p.waitForTimeout(400);
  await p.locator('#pop details.fold > summary:visible').first().click(); await p.waitForTimeout(200);
  const nm = await p.locator('#pop .glist .gcard .gname').nth(1).textContent();
  await p.locator('#pop .glist .gcard > summary').nth(1).tap(); await p.waitForTimeout(500);
  console.log('focused', nm, '->', await p.evaluate(() => { const s = document.querySelector('#pop .gfocus'); return s && s.querySelector('.gcard[open] .gname').textContent; }), 'pw', await p.evaluate(() => document.querySelector('#pop .pw').textContent), 'gsel', await E('JSON.stringify(gramSel)'), 'marks', await p.locator('#text mark.gsel').count());
  await p.screenshot({ path: 'tests/n-gram.png' });
  await p.click('#pop .x'); console.log('after close gsel', await E('JSON.stringify(gramSel)'), await p.locator('#text mark.gsel').count());
  // 5 box mode tap -> lookup
  await p.click('.tool[data-mode="box"]');
  const r = await E("(function(){ var x = clientRectOf(state.text.indexOf('ทะเล'), state.text.indexOf('ทะเล') + 4); return { x: x.left + 8, y: x.top + x.height / 2 }; })()");
  await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(300);
  console.log('box tap pop', await p.evaluate(() => !document.getElementById('pop').hidden && document.querySelector('#pop .pw').textContent), 'boxes', await E('state.boxes.length'));
  await p.click('#pop .pn-box'); await p.waitForTimeout(200); console.log('after 加註解 boxes', await E('state.boxes.length'), 'mode', await E('mode'));
  await p.keyboard.type('sea'); await p.mouse.click(1000, 1150);
  // 4 ink: pen tap makes a dot; touch tap opens lookup
  await p.click('.tool[data-mode="ink"]');
  await p.click('#pop .x').catch(() => {});
  const r2 = await E("(function(){ var x = clientRectOf(state.text.indexOf('ผัก'), state.text.indexOf('ผัก') + 3); return { x: x.left + 6, y: x.top + x.height / 2 }; })()");
  const n0 = await E('state.strokes.length');
  await p.mouse.click(r2.x, r2.y); await p.waitForTimeout(200);
  console.log('mouse/pen tap -> strokes', n0, '->', await E('state.strokes.length'), 'pop', await p.evaluate(() => !document.getElementById('pop').hidden));
  await p.touchscreen.tap(r2.x + 20, r2.y); await p.waitForTimeout(300);
  console.log('touch tap -> pop', await p.evaluate(() => !document.getElementById('pop').hidden), 'strokes', await E('state.strokes.length'));
  await p.click('#pop .x').catch(() => {});
  // write a little "i"
  await p.mouse.move(r2.x + 60, r2.y + 40); await p.mouse.down(); for (let k = 0; k < 6; k++) await p.mouse.move(r2.x + 60 + Math.sin(k) * 3, r2.y + 40 + k * 4); await p.mouse.up();
  await p.mouse.click(r2.x + 60, r2.y + 28);
  await p.screenshot({ path: 'tests/n-ink.png', clip: { x: r2.x - 40, y: r2.y - 40, width: 200, height: 120 } });
  // 2 zoom menu
  await p.click('#vbZoom'); await p.waitForTimeout(200); console.log('zoom items', await p.evaluate(() => [...document.querySelectorAll('#vbMenu button')].map(x => x.textContent).join(',')));
  await p.click('#vbMenu button:has-text("100%")'); await p.waitForTimeout(300); console.log('scale at 100%', await E('scale.toFixed(3)'), await p.textContent('#vbZoom'));
  // 6 tone tab
  for (const w of ['ตลาด', 'ผัก', 'ทะเล']) { await E(`(function(){ addCard(segAt(state.text.indexOf('${w}') + 1)); return 1; })()`); }
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(200);
  console.log('tabs', await p.evaluate(() => document.getElementById('cardTabs').textContent));
  await p.click('#cardTabs button:has-text("聲調")'); await p.waitForTimeout(800);
  await p.click('.tcellbtn[data-cell="l2"]'); await p.waitForTimeout(200);
  console.log('ex', await p.evaluate(() => document.querySelector('.texhost').innerText.replace(/\n/g, ' ')));
  await p.screenshot({ path: 'tests/n-tone.png', fullPage: true });
  await p.click('.tgo'); await p.waitForTimeout(200);
  for (let k = 0; k < 4; k++) { const b2 = p.locator('#cardbody .qopt:not([disabled])').first(); if (await b2.count()) await b2.click(); await p.waitForTimeout(100); const c = p.locator('#cardbody button.primary'); if (await c.count()) { await p.screenshot({ path: 'tests/n-tq.png' }); await c.first().click(); } }
  console.log('practice', await p.evaluate(() => document.getElementById('cardbody').innerText.slice(0, 200).replace(/\n/g, ' | ')));
  // popup table no wrap
  await p.click('.tabbar [data-tab="doc"]').catch(() => {});
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
