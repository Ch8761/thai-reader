const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const lang = process.argv[2] || 'zh';
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(l => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-level', 'b'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
  await p.reload(); await p.waitForTimeout(1400);
  const E = c => p.evaluate(c => window.__ev(c), c);
  // 沒有目標：地圖分頁
  await E("showTab('map'); 1"); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/map-none-' + lang + '.png' });
  // 設定目標 b_travel
  await E("wz = {from:'goal', i:0, quiz:null, goal:'b_travel', mins:10}; goalSave('b_travel', 10); showTab('home'); renderHome(); 1"); await p.waitForTimeout(600);
  await p.screenshot({ path: 'shots/map-home-' + lang + '.png' });
  await E("showTab('map'); 1"); await p.waitForTimeout(900); await p.screenshot({ path: 'shots/map-goal-' + lang + '.png', fullPage: false });
  await p.screenshot({ path: 'shots/map-goal-full-' + lang + '.png', fullPage: true });
  console.log('errs', errs.join('|') || 'none');
  await b.close();
})();
