const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext(devices['iPhone 13'])).newPage(); p.on('pageerror', e => console.log('ERR', String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.setInputFiles('#imgfile', ['phototest/sign.jpg', 'phototest/sign.jpg']); await p.waitForSelector('#photoEdit:not([hidden])'); await p.waitForTimeout(600);
  await p.screenshot({ path: 'tests/photo-phone.png' }); console.log(await p.textContent('#phTitle'), await p.isVisible('#phSkipAll'), await p.textContent('#phOk'));
  await p.click('#phRotR'); await p.waitForTimeout(300); await p.screenshot({ path: 'tests/photo-phone-rot.png' });
  await p.click('#phSkipAll'); await p.waitForFunction(() => !document.getElementById('view-doc').hidden, null, { timeout: 60000 }); console.log('pages', await p.evaluate(() => window.__ev('pdf && pdf.pages.length')));
  await b.close(); })();
