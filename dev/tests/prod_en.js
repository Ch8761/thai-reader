const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(6000); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ui-lang', 'en'); }); await p.reload(); await p.waitForTimeout(2000);
  console.log('home:', (await p.textContent('#view-home .importbar')).replace(/\s+/g, ' ').trim());
  console.log('tabs:', (await p.textContent('.tabbar')).replace(/\s+/g, ' ').trim());
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  console.log('settings:', (await p.textContent('#view-settings')).replace(/\s+/g, ' ').trim().slice(0, 200));
  await p.locator('.smt', { hasText: 'Appearance' }).click(); await p.waitForTimeout(300);
  await p.locator('#uiLangGroup button', { hasText: '中文' }).click(); await p.waitForTimeout(2500);
  console.log('after switch lang:', await p.evaluate(() => localStorage.getItem('thai-ui-lang')), (await p.textContent('#view-home .importbar')).replace(/\s+/g, ' ').trim());
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
