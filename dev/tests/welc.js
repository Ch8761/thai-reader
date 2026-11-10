const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [nm, opt] of [['ipad', { viewport: { width: 820, height: 1180 } }], ['phone', devices['iPhone SE']]]) {
    const p = await (await b.newContext(opt)).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
    console.log(nm, 'welcome', await p.isVisible('#welcome'), await p.textContent('#h-welcome'));
    await p.click('#wTone button:has-text("開")'); await p.waitForTimeout(200);
    await p.screenshot({ path: `tests/welc-${nm}.png` });
    console.log('tone mode', await p.evaluate(() => localStorage.getItem('thai-tone-mode')), await p.evaluate(() => window.__ev('toneMode')));
    await p.click('#wDone'); await p.click('.tabbar [data-tab="settings"]'); await p.evaluate(() => window.settingsOpen('read'));
    console.log('settings tone', await p.evaluate(() => document.querySelector('#toneGroup [aria-checked="true"], #toneGroup [aria-pressed="true"]')?.textContent));
    console.log('ERRORS:', errs.join(' | ') || 'none');
  }
  await b.close(); })();
