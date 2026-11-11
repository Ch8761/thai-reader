const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(800);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'tests/y-tap.png', clip: { x: 0, y: 0, width: 1024, height: 420 } });
  await p.click('.tool[data-mode="hl"]'); await p.click('#hlCustom'); await p.waitForTimeout(150);
  await p.dispatchEvent('#cpFavs .cp-slot >> nth=2', 'pointerup'); await p.waitForTimeout(100);
  await p.screenshot({ path: 'tests/y-slot.png', clip: { x: 0, y: 0, width: 1024, height: 640 } });
  await p.dispatchEvent('#cpGrid .cp-sw >> nth=0', 'pointerup'); await p.waitForTimeout(100);
  console.log('hlFav', await E("toolPrefs.hlFav.join(' ') + ' | list ' + toolPrefs.hlColors.join(' ')"), await p.evaluate(() => [...document.querySelectorAll('#toolopts .sw2:not(.custom)')].map(x => x.style.getPropertyValue('--sw')).join(' ')));
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(100);
  await p.dispatchEvent('#boxCustom', 'pointerup'); await p.waitForTimeout(100);
  await p.dispatchEvent('#cpFavs .cp-slot >> nth=0', 'pointerup'); await p.dispatchEvent('#cpGrid .cp-sw >> nth=1', 'pointerup'); await p.waitForTimeout(100);
  console.log('boxFav', await E("toolPrefs.boxFav.join(' ') + ' | list ' + toolPrefs.boxColors.join(' ')"), await p.evaluate(() => [...document.querySelectorAll('#stylebar .sw[data-color]')].map(x => x.dataset.color).join(' ')));
  await p.screenshot({ path: 'tests/y-box.png', clip: { x: 0, y: 0, width: 1024, height: 640 } });
  await p.mouse.click(5, 1100);
  // entity meaning
  await p.click('.tabbar [data-tab="home"]'); await p.click('#openPaste'); await p.fill('#input', 'วันนี้ไปประชุมที่กรมส่งเสริมการค้า แล้วก็เดินทางกลับประเทศไทย สินค้าส่งออก'); await p.click('#addText'); await p.waitForTimeout(800);
  for (const w of ['กรมส่งเสริมการค้า', 'ประเทศไทย', 'ส่งออก']) {
    await E(`(function(){ var i = state.text.indexOf('${w}'); showPop(segAt(i + 1)); return 1; })()`); await p.waitForTimeout(200);
    console.log(w, await p.evaluate(() => (document.querySelector('#pop .ent-sec') ? document.querySelector('#pop .ent-sec').innerText : document.querySelector('#pop .pd').innerText).replace(/\s+/g, ' ').slice(0, 200)));
    await p.screenshot({ path: 'tests/y-ent-' + w.length + '.png', clip: { x: 0, y: 0, width: 1024, height: 900 } });
  }
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
