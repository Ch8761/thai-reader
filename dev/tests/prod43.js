// 正式版 1.43：大資料拆檔後照常運作、離線也能開、PDF 打開與匯出、照片轉正
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  let htmlBytes = 0; p.on('response', async r => { if (/index\.html$/.test(r.url())) { try { htmlBytes = (await r.body()).length; } catch (e) {} } });
  await p.goto('http://127.0.0.1:8766/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ocr-pre', 'no'); });
  await p.reload(); await p.waitForTimeout(3000);
  ok('頁面本身變小（< 2 MB）', htmlBytes > 0 && htmlBytes < 2e6, htmlBytes);
  ok('App 正常啟動', await p.evaluate(() => window.__thaiBoot === 1));
  for (let i = 0; i < 20 && !(await p.evaluate(() => !!navigator.serviceWorker.controller)); i++) { await p.waitForTimeout(500); }
  const cached = await p.evaluate(async () => { const c = await caches.open('thai-reader-data'); return (await c.keys()).length; });
  ok('8 個資料檔都存進離線快取', cached === 8, cached);
  await p.click('#openPaste').catch(() => {}); await p.fill('#input', 'ผมชอบกินข้าวมันไก่ที่ตลาด'); await p.click('#addText'); await p.waitForTimeout(1200);
  const look = async () => { await p.click('#text mark.ent'); await p.waitForTimeout(500); const t = await p.evaluate(() => { const e = document.getElementById('pop'); return e && !e.hidden ? e.textContent : ''; }); await p.keyboard.press('Escape'); return t; };
  const pop = await look();
  ok('查詞有字典內容（字典從外部檔載入）', /[\u4e00-\u9fff]{2}/.test(pop) && /ข้าวมันไก่/.test(pop), pop.slice(0, 60));
    await p.click('#text mark.ent'); await p.waitForTimeout(400); await p.click('#pop >> text=生字卡').catch(() => {}); await p.waitForTimeout(300); await p.keyboard.press('Escape');
  await p.click('#openExport'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), p.click('#exGo')]);
  const head = dl ? require('fs').readFileSync(await dl.path()).slice(0, 5).toString() : '';
  ok('匯出 PDF 照常（pdf-lib 從外部檔載入）', head === '%PDF-', head);
  await p.click('#closeExport').catch(() => {});
  // PDF 打開
  await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
  await p.setInputFiles('#anyfile', path.join(__dirname, '..', 'ocrtest', 'D.pdf')); await p.waitForTimeout(4000);
  ok('PDF 打開得了（pdf.js 從外部檔載入）', await p.evaluate(() => document.querySelectorAll('#view-doc canvas').length > 0 || /PDF/.test(document.getElementById('h-docv').textContent + document.title)), await p.evaluate(() => document.getElementById('h-docv').textContent.slice(0, 30)));
  // 離線重開
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(3500);
  ok('離線重開照常啟動', await p.evaluate(() => window.__thaiBoot === 1));
  await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
  await p.click('#docList .doccard .dopen >> text=ผมชอบ').catch(async () => { await p.click('#docList .dopen >> nth=1'); }); await p.waitForTimeout(1500);
  const pop2 = await look();
  ok('離線時查詞照常有字典內容', /[\u4e00-\u9fff]{2}/.test(pop2), pop2.slice(0, 40));
  await ctx.setOffline(false);
  ok('沒有錯誤', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
