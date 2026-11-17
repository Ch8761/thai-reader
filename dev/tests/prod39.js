// 正式版 1.39：不在測試網址載入 Umami、背景先存例句/讀物庫、按下載把辨識工具存起來、์ 斷詞
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  const reqs = []; ctx.on('request', r => reqs.push(r.url()));
  await p.goto('http://127.0.0.1:8766/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(2500);
  ok('有 Service Worker 控制頁面', await p.evaluate(() => !!navigator.serviceWorker.controller));
  await p.click('#openPaste').catch(() => {}); await p.fill('#input', 'ไปห้างเทอร์มินอลกับจอห์นสัน'); await p.click('#addText');
  await p.waitForTimeout(1500);
  const marks = await p.evaluate(() => document.getElementById('text').textContent);
  ok('文件打開', /เทอร์มินอล/.test(marks));
  await p.waitForTimeout(6000);
  ok('背景存好例句、聲調表、讀物庫', ['examples.json', 'tones.json', 'reader.json'].every(f => reqs.some(u => u.endsWith('/' + f))), reqs.filter(u => /json/.test(u)).join(' '));
  await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(400);
  ok('主頁問要不要下載辨識工具', await p.locator('#ocrAsk').isVisible());
  await p.click('#ocrAskYes');
  for (let i = 0; i < 60 && (await p.evaluate(() => localStorage.getItem('thai-ocr-pre'))) !== 'done'; i++) { await p.waitForTimeout(500); }
  ok('下載完成', (await p.evaluate(() => localStorage.getItem('thai-ocr-pre'))) === 'done');
  const cached = await p.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks.find(k => /ocr/.test(k))); return (await c.keys()).map(r => r.url.replace(/^.*\/ocr\//, '')); });
  ok('辨識工具存進快取', ['ot2/det.onnx', 'ot2/rec.onnx', 'ot2/ort-wasm-simd-threaded.wasm', 'lang2/tha.traineddata.gz', 'tesseract.min.js'].every(f => cached.includes(f)), cached.join(' '));
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  ok('設定頁顯示已下載', (await p.evaluate(() => document.getElementById('ocrPreMsg').textContent)).includes('已下載') && await p.evaluate(() => document.getElementById('ocrPreBtn').hidden));
  ok('測試網址不載入 Umami', !reqs.some(u => /umami/.test(u)));
  ok('沒有錯誤', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
