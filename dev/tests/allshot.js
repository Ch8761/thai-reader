// 全部頁面截圖：node tests/allshot.js <prefix> [ipad|phone]
const { chromium } = require('playwright');
const pre = process.argv[2] || 'all', only = process.argv[3];
const TXT = 'วันนี้ฉันตื่นเช้ามาก แล้วไปตลาดกับแม่ ตลาดมีคนเยอะมาก แม่ซื้อผลไม้และผัก ฉันชอบกินมะม่วงกับข้าวเหนียว อากาศร้อนมากแต่สนุก กลับบ้านแล้วอาบน้ำ\n'.repeat(6);
(async () => {
  const b = await chromium.launch();
  for (const [dev, vp] of [['ipad', { width: 820, height: 1180 }], ['phone', { width: 390, height: 844 }]]) {
    if (only && only !== dev) continue;
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: dev === 'ipad' ? 1 : 2 });
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-ocr-pre', 'no'); localStorage.setItem('thai-level', 'b'); localStorage.setItem('thai-quest-quiet', '1'); });
    await p.reload(); await p.waitForTimeout(1800);
    const E = c => p.evaluate(c => window.__ev(c), c);
    await E("showTab('home'); $('input').value = " + JSON.stringify(TXT) + "; $('textTitle').value = '去市場'; libAddText(); 1"); await p.waitForTimeout(900);
    await E("(function(){ var ws=['ตื่น','เช้า','ตลาด','แม่','ซื้อ','ผลไม้','ผัก','ชอบ','มะม่วง','ข้าวเหนียว','อากาศ','ร้อน','สนุก','กลับ','บ้าน','อาบน้ำ']; ws.forEach(function(w,i){ var ix=state.text.indexOf(w); if(ix>=0){ var c=addCard(segAt(ix)); } }); folders.push({id:'f1',name:'食物'},{id:'f2',name:'日常動詞'},{id:'f3',name:'課本第三課'}); cards.forEach(function(c,i){ c.folder = i%3===0?'f1':i%3===1?'f2':''; if(i%4===0){c.due=today0()-86400000;} if(i%5===0) c.fav=true; }); saveCards(); })(); 1");
    const shot = async (name) => { await p.waitForTimeout(500); await p.screenshot({ path: 'tests/' + pre + '-' + dev + '-' + name + '.png', fullPage: false }); };
    await E("showTab('home'); 1"); await shot('home');
    await E("showTab('doc'); window.scrollTo(0,0); 1"); await shot('doc');
    await E("showTab('cards'); 1"); await shot('cards');
    const tabs = await p.$$eval('#cardTabs button', bs => bs.map(b => b.textContent));
    for (let i = 0; i < tabs.length; i++) { await p.evaluate(i => document.querySelectorAll('#cardTabs button')[i].click(), i); await shot('cards' + i); }
    await E("showTab('ach'); 1"); await shot('ach');
    await E("showTab('settings'); 1"); await shot('settings');
    console.log(dev, 'cardTabs', tabs.join('|'));
    await p.close();
  }
  await b.close();
})();
