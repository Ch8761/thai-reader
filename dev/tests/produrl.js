const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1100 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.click('#openPaste'); await p.fill('#urlInput', 'https://www.bbc.com/thai/articles/x'); await p.click('#addUrl'); await p.waitForTimeout(1500);
  console.log('no function here ->', await p.textContent('#homeMsg'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close(); })();
