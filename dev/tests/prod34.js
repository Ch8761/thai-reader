// 正式版煙霧測試：匯入照片 → 新版辨識 → 讀得出泰文
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  const reqs = []; p.on('request', r => { if (/\/ocr\//.test(r.url())) reqs.push(r.url().split('/ocr/')[1]); });
  await p.goto('http://127.0.0.1:8766/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(1500);
  await p.setInputFiles('#imgfile', ['ocrtest/photo.jpg']); await p.waitForTimeout(1200); await p.click('#phOk');
  let txt = '';
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); txt = await p.evaluate(() => document.getElementById('view-doc').textContent); if (/ไต้หวัน/.test(txt)) break; }
  const ok = /ปธน.ไต้หวันเตือนให้ระวัง/.test(txt) && reqs.some(r => /^ot1\/det\.onnx/.test(r)) && !reqs.some(r => /tesseract/.test(r));
  console.log(ok ? 'PASS' : 'FAIL', '正式版：照片用新版辨識讀出泰文，沒有下載舊工具', reqs.join(','), errs.join('|'));
  await b.close(); process.exit(ok ? 0 : 1);
})();
