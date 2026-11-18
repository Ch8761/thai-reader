// 正式版 1.45：字典檔第一次沒載到時，App 會自己補載，文章不會整篇被標成查不到／外來語
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const T = 'วันนี้ฉันตื่นเช้ามาก แล้วไปตลาดกับแม่ แม่ซื้อผลไม้และผัก ฉันชอบกินมะม่วงกับข้าวเหนียว';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, serviceWorkers: 'block' });
  let blocked = 0;
  await ctx.route(/data\/(dictdata|namedata)\.[0-9a-f]+\.js$/, (route) => { if (!/\?r=|recover/.test(route.request().url()) && blocked < 2) { blocked++; return route.abort(); } return route.continue(); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8766/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ocr-pre', 'no'); });
  blocked = 0;
  await p.reload(); await p.waitForTimeout(4000);
  ok('第一次字典和人名檔都被擋掉', blocked === 2, blocked);
  ok('有記錄下來（方便查原因）', await p.evaluate(() => (window.__dataFail || []).join(',')) === 'dictdata,namedata' || /dictdata/.test(await p.evaluate(() => localStorage.getItem('thai-errlog') || '')));
  await p.click('#openPaste').catch(() => {}); await p.fill('#input', T); await p.click('#addText'); await p.waitForTimeout(2500);
  const marks = await p.evaluate(() => [...document.querySelectorAll('#text mark')].map(m => m.className).join(' '));
  ok('補載以後：沒有整篇被標成外來語或查不到', !/ent-foreign/.test(marks) && (marks.match(/unk/g) || []).length <= 1, marks.slice(0, 120));
  await p.click('#text mark.ent, #text').catch(() => {});
  ok('沒有錯誤', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
