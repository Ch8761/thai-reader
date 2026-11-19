const { chromium, devices } = require('playwright');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const URL = process.env.URL || 'http://127.0.0.1:8765/index.html';
(async () => {
  const b = await chromium.launch();
  for (const [name, dev, how] of [['iphone-x', devices['iPhone 13'], 'x'], ['iphone-btn', devices['iPhone 13'], 'btn'], ['android-esc', devices['Pixel 7'], 'esc'], ['inapp-x', Object.assign({}, devices['iPhone 13'], { userAgent: devices['iPhone 13'].userAgent + ' Instagram 300.0' }), 'x']]) {
    const ctx = await b.newContext(dev); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2000);
    ok(await p.isVisible('#installGuide'), name + ': install guide shows');
    ok(await p.isVisible('#installGuide .igx'), name + ': close X visible');
    ok(await p.isVisible('#installGuide .igskipbtn'), name + ': browser button visible');
    if (name === 'iphone-x') { await p.screenshot({ path: 'tests/v46-ios.png' }); }
    if (name === 'inapp-x') { await p.screenshot({ path: 'tests/v46-inapp.png' }); }
    const box = await p.$eval('#installGuide .igx', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
    ok(box[0] >= 44 && box[1] >= 44, name + ': X tap target 44px');
    if (how === 'x') await p.click('#installGuide .igx');
    else if (how === 'btn') await p.click('#installGuide .igskipbtn');
    else await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
    ok(!(await p.isVisible('#installGuide')), name + ': guide closed');
    ok(await p.isVisible('#welcome'), name + ': welcome opens next');
    ok(await p.evaluate(() => localStorage.getItem('thai-install-skip')) === '1', name + ': remembered');
    await p.reload(); await p.waitForTimeout(1500);
    ok(!(await p.isVisible('#installGuide')), name + ': not shown again after reload');
    ok(errs.length === 0, name + ': no page errors ' + errs.join('|'));
    await ctx.close();
  }
  await b.close(); console.log(fail ? 'FAILED ' + fail : 'ALL PASS'); process.exit(fail ? 1 : 0);
})();
