const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 700 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.click('#openPaste'); await p.fill('#textTitle', 't'); await p.fill('#input', 'สวัสดีครับ'); await p.click('#addText'); await p.waitForTimeout(500);
  console.log('docsec hidden for text doc:', await p.$eval('#docsec', e => e.hidden));
  await p.screenshot({ path: 'tests/textdoc.png' }); await b.close();
})();
