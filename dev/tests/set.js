const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [nm, opt] of [['ipad', { viewport: { width: 820, height: 1180 } }], ['phone', devices['iPhone 13']]]) {
    const p = await (await b.newContext(opt)).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); localStorage.setItem('thai-my-words', JSON.stringify([{ t: 'ตืน', at: 1 }])); }); await p.reload(); await p.waitForTimeout(1500);
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(400);
    await p.screenshot({ path: `tests/set-${nm}.png`, fullPage: true });
    console.log(nm, 'groups', await p.evaluate(() => [...document.querySelectorAll('.setgrph')].map(h => h.textContent + ':' + h.parentNode.querySelectorAll('.setrow').length).join(' ')), 'qbtns', await p.locator('.qhelp').count(), 'leftover help', await p.locator('#settings .sethelp').count());
    await p.locator('.qhelp').nth(4).click(); await p.waitForTimeout(200);
    console.log('popup', await p.textContent('#shTitle'), '|', (await p.textContent('#shBody')).slice(0, 60));
    await p.screenshot({ path: `tests/set-${nm}-pop.png` });
    await p.click('#shClose');
    console.log('seg details open?', await p.evaluate(() => { const d = document.getElementById('mySegList').closest('details'); return d && d.open + ' visible=' + (d.offsetHeight > 0); }), 'count', await p.textContent('#mySegCount'));
    console.log('ERRORS:', errs.join(' | ') || 'none');
  }
  await b.close();
})();
