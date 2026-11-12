const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const lang = process.argv[2] || 'zh'; const tag = process.argv[3] || 'cur';
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(l => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-tone-mode', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
  await p.reload(); await p.waitForTimeout(1400);
  await p.evaluate(() => window.__ev("folders.push({id:'f1',name:'餐廳'},{id:'f2',name:'旅行'}); ['สวัสดี','ขอบคุณ','อร่อย','ราคา'].forEach(function(w,i){cards.push({id:'c'+i,w:w,m:'意思'+i,added:Date.now()-i*1000,folder:i<2?'f1':'',due:0})}); saveCards(); showTab('cards'); renderCards(); 1"));
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'shots/cards-' + tag + '-' + lang + '.png' });
  await b.close();
})();
