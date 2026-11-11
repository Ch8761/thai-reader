const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.route('**/api/fetch**', r => r.fulfill({ status: 502, json: { error: 'x' } }));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(1200);
  console.log('go hidden at start', await p.isHidden('#addUrl'));
  await p.evaluate(() => { const u = document.getElementById('urlInput'); u.value = 'https://www.bbc.com/thai/articles/x'; u.dispatchEvent(new Event('paste')); });
  await p.waitForTimeout(800); console.log('after url paste: msg=', await p.textContent('#homeMsg'), '| go visible', await p.isVisible('#addUrl'));
  await p.evaluate(() => { const u = document.getElementById('urlInput'); u.value = 'สวัสดีครับ วันนี้อากาศดี'; u.dispatchEvent(new Event('paste')); });
  await p.waitForTimeout(300); console.log('thai paste -> textarea:', await p.inputValue('#input'), '| pastebox open', await p.isVisible('#pastebox'), '| url empty', (await p.inputValue('#urlInput')) === '');
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
