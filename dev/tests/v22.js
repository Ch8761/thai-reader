const { chromium } = require('playwright');
(async () => {
  const W = +(process.argv[2] || 390), TH = process.argv[3] || 'light', L = process.argv[4] || 'zh';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: 844 }, hasTouch: true }); const p = await ctx.newPage(); p.setDefaultTimeout(5000); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(a => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', a[0]); localStorage.setItem('thai-ui-lang', a[1]); }, [TH, L]); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  const tag = `${W}-${TH}-${L}`;
  await p.screenshot({ path: `shots/v22-home0-${tag}.png` });
  // seed: cards, days, two docs
  await E(`(function(){ ['ตลาด','วันนี้','อากาศ','เพื่อน','กิน','ร้าน'].forEach(function(w){ addCard({t:w,w:true}); }); cards.forEach(function(c,i){ c.due = today0() - 1; if (i<2) c.fav = 1; }); saveCards();
    var d = new Date(); var a=[]; for (var i=3;i>=1;i--){ var x=new Date(); x.setDate(x.getDate()-i); a.push(dayKey(x.getTime())); } localStorage.setItem('thai-days', JSON.stringify(a)); return 1; })()`);
  await p.click('#readerOpen'); await p.waitForTimeout(800); await p.locator('#rdList button, .rditem').first().click().catch(e => console.log('rd click', e.message.slice(0, 80))); await p.waitForTimeout(1200);
  await E("showTab('home')"); await p.waitForTimeout(600);
  console.log('celebrate shown:', await p.evaluate(() => !document.querySelector('.lqclayer').hidden), (await p.textContent('.lqcbox')).replace(/\s+/g, ' '));
  await p.screenshot({ path: `shots/v22-celebrate-${tag}.png` });
  await p.click('#qcOk'); await p.waitForTimeout(200);
  console.log('quest:', (await p.textContent('#questCard')).replace(/\s+/g, ' '), '| rows:', (await p.textContent('#homeList')).replace(/\s+/g, ' '));
  await p.screenshot({ path: `shots/v22-home-${tag}.png` });
  await p.click('#openPaste'); await p.waitForTimeout(200); await p.screenshot({ path: `shots/v22-paste-${tag}.png` }); await p.click('#openPaste');
  await p.click('#questCard'); await p.waitForTimeout(400); await p.screenshot({ path: `shots/v22-quest-${tag}.png` });
  await p.click('#qsClose');
  await E("showTab('cards'); cardTab='all'; renderCards()"); await p.waitForTimeout(400);
  await p.screenshot({ path: `shots/v22-list-${tag}.png` });
  // swipe right on first row -> fav toggle; swipe left on second -> delete
  const swipe = async (i, dx) => { const r = await p.locator('.swli .swfg').nth(i).boundingBox(); const y = r.y + r.height / 2, x = r.x + r.width / 2;
    await p.evaluate(([x, y, dx]) => { const t = document.elementFromPoint(x, y).closest('.swfg'); const ev = (type, cx) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', clientX: cx, clientY: y, button: 0 }));
      ev('pointerdown', x); for (let k = 1; k <= 8; k++) ev('pointermove', x + dx * k / 8); ev('pointerup', x + dx); }, [x, y, dx]); await p.waitForTimeout(400); };
  const n0 = await E('cards.length'); const w2 = await p.locator('.swli .cw').nth(2).textContent();
  await swipe(2, -200); console.log('after left swipe cards', n0, '->', await E('cards.length'), 'snack', await p.textContent('.snack'));
  await p.screenshot({ path: `shots/v22-snack-${tag}.png` });
  await p.click('#snackU'); await p.waitForTimeout(300); console.log('undo ->', await E('cards.length'), 'word back', (await p.locator('.swli .cw').allTextContents()).includes(w2));
  const f0 = await E('cards.filter(function(c){return c.fav}).length'); await swipe(3, 200); console.log('fav after right swipe', f0, '->', await E('cards.filter(function(c){return c.fav}).length'));
  await p.locator('.clfilt button').nth(1).click(); await p.waitForTimeout(200); console.log('fav filter rows', await p.locator('.swli').count());
  await p.locator('.clfilt button').nth(0).click();
  await p.locator('.clbar .viewtoggle button').nth(1).click(); await p.waitForTimeout(300); await p.screenshot({ path: `shots/v22-grid-${tag}.png` });
  // tap opens detail (no swipe)
  await p.locator('.ctile').first().click(); await p.waitForTimeout(400); console.log('detail open', await p.evaluate(() => !document.getElementById('cardDetail').hidden));
  console.log('hscroll', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
