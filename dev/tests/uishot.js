// 介面截圖（iPad 直向 820x1180、手機 390x844）：node tests/uishot.js <prefix>
const { chromium } = require('playwright');
const pre = process.argv[2] || 'ui';
const MIX = 'เคยมีคำกล่าวว่า ขอเป็นตัวเราที่ดีขึ้น เก่งขึ้นกว่าตัวเราในเมื่อวาน\n曾經有句話說：要成為更好的自己。\nในภาพรวม ถ้าเรามองว่าตัวเราอาจพัฒนาขึ้นครั้งละเล็กละน้อย โดยที่เราไม่ต้องกดดันในการฝึกฝนหรือปรับปรุงตัวเองให้ดีขึ้นอย่างมากมาย ในระดับที่เราไม่กดดันตัวเองมากนัก ก็เป็นเรื่องที่ดี\n'.repeat(4);
(async () => {
  const b = await chromium.launch();
  for (const [dev, vp] of [['ipad', { width: 820, height: 1180 }], ['phone', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-ocr-pre', 'no'); localStorage.setItem('thai-level', 'c'); localStorage.setItem('thai-tasks', JSON.stringify({ list: [{ id: 't1', t: '升到「高級」', n: 6, c: 0, done: false }] })); });
    await p.reload(); await p.waitForTimeout(1800);
    const E = c => p.evaluate(c => window.__ev(c), c);
    await E("showTab('home'); $('input').value = " + JSON.stringify(MIX) + "; $('textTitle').value = '【泰文長篇分享｜自我提升與自我破壞】｜泰國人聊什麼 คนไทยคุยอะไร - 方格子'; libAddText(); 1"); await p.waitForTimeout(1000);
    await E("var d = docById(state.src.id); d.url = 'https://vocus.cc/article/abc'; d.site = 'vocus'; saveLib(); syncDocView(); state.hl.push([16, 34, null, 'u']); renderText(); 1");
    await p.waitForTimeout(400);
    await p.screenshot({ path: 'tests/' + pre + '-' + dev + '-doc.png' });
    await E("syncDotState = function () { return ['ok', 'x']; }; syncDotDraw(); showTab('home'); 1"); await p.waitForTimeout(600);
    await p.screenshot({ path: 'tests/' + pre + '-' + dev + '-home.png' });
    await p.close();
  }
  await b.close();
})();
