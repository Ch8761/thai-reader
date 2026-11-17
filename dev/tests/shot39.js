const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(2000);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await E("showTab('home'); $('input').value = 'ผมชอบไปทะเลและกินข้าวมันไก่ที่ห้างเทอร์มินอล'; libAddText(); 1"); await p.waitForTimeout(900);
  const t = await E('state.text');
  await E("showPop(segAt(" + t.indexOf('ไปทะเล') + ")); 1"); await p.waitForTimeout(300);
  await p.click('.adjlinks .adjbtn:last-child'); await p.waitForTimeout(300);
  await p.locator('#pop').screenshot({ path: 'tests/q39-pop.png' });
  await b.close();
})();
