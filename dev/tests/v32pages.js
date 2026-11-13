// 1.32：讀過的頁數（多頁 PDF）
const { chromium } = require('playwright');
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(1300);
  const E = c => p.evaluate(c => window.__ev(c), c);
  let f = null; for (const n of ['C.pdf']) { if (fs.existsSync('/mnt/user-data/uploads/' + n)) { f = '/mnt/user-data/uploads/' + n; const np = fs.statSync(f).size; break; } }
  await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
  await p.setInputFiles('#anyfile', f); await p.waitForTimeout(4500);
  const np = await E("pdf ? pdf.pages.length : 0");
  ok('多頁 PDF 載入：' + f.split('/').pop() + '（' + np + ' 頁）', np > 2, np);
  await E("pagesTick(); 1"); ok('第 1 頁：1', (await E("pagesRead()")) === 1);
  await E("goPage(1, true); 1"); await p.waitForTimeout(500); await E("pagesTick(); 1");
  ok('翻到第 2 頁：2', (await E("pagesRead()")) === 2, await E("pagesRead()"));
  await E("goPage(1, true); 1"); await E("pagesTick(); 1"); ok('回到第 2 頁再抽樣：還是 2', (await E("pagesRead()")) === 2);
  await E("goPage(2, true); 1"); await p.waitForTimeout(400);
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(250);
  await E("pagesTick(); 1"); ok('在別的分頁：第 3 頁不算', (await E("pagesRead()")) === 2, await E("pagesRead()"));
  await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(300); await E("goPage(2, true); 1"); await p.waitForTimeout(400); await E("pagesTick(); 1");
  ok('回到文件頁：第 3 頁才算 → 3', (await E("pagesRead()")) === 3, await E("pagesRead()"));
  const h = JSON.parse(await p.evaluate(() => localStorage.getItem('thai-hist')));
  ok('存成 {文件id: [頁碼…]}', Object.keys(h.p).length === 1 && h.p[Object.keys(h.p)[0]].join() === '0,1,2', JSON.stringify(h.p));
  ok('沒有程式錯誤', errs.length === 0, errs.join('|'));
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
