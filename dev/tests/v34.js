// 1.34：新的泰文辨識（圖片、掃描 PDF），舊工具當備援；設定可切換
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
(async () => {
  const b = await chromium.launch();
  const open = async (opts) => {
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); p.setDefaultTimeout(8000); p.errs = [];
    p.on('pageerror', e => p.errs.push(String(e).slice(0, 200)));
    if (opts.block) { await p.route('**/ocr/ot1/**', r => r.abort()); }
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate((o) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (o.en) localStorage.setItem('thai-ui-lang', 'en'); if (o.old) localStorage.setItem('thai-ocr-engine', 'old'); if (o.zhoff) localStorage.setItem('thai-ocr-zh', 'off'); }, opts);
    await p.reload(); await p.waitForTimeout(1300);
    p.E = c => p.evaluate(c => window.__ev(c), c);
    return p;
  };
  const importImg = async (p, f) => {
    const t0 = Date.now();
    await p.setInputFiles('#imgfile', [f]); await p.waitForTimeout(1200); await p.click('#phOk');
    for (let i = 0; i < 160; i++) { await p.waitForTimeout(500); const o = JSON.parse(await p.E("JSON.stringify({ busy: ocr.busy, done: ocr.done, pdf: !!pdf })")); if (o.pdf && !o.busy && o.done > 0) break; }
    for (let i = 0; i < 30 && (await p.E("(state.text || '').length")) < 30; i++) { await p.waitForTimeout(400); }
    return (Date.now() - t0) / 1000;
  };
  // 1. 預設用新版
  {
    const p = await open({});
    const secs = await importImg(p, 'ocrtest/photo.jpg');
    const txt = await p.E('state.text'), eng = await p.E('ocr.engine');
    ok('預設用新版辨識', /新版/.test(eng), eng + ' | ' + (await p.E('ot.err')));
    ok('讀出文章（關鍵句都對）', txt.includes('ปธน.ไต้หวันเตือนให้ระวัง') && txt.includes('ประธานาธิบดีไล่ ชิง-เต๋อ') && txt.includes('กรุงปักกิ่ง') && txt.includes('แห่งนี้'), txt.slice(0, 120));
    ok('舊工具會認錯的字，新版是對的（ไต้หวัน、แห่งนี้、ตำรวจ）', !txt.includes('ใต้หวัน') && !txt.includes('แห่งนี่') && txt.includes('ตำรวจ'));
    ok('不到 15 秒（含下載）', secs < 15, secs);
    // 點字查詞：位置對得上
    const hit = JSON.parse(await p.E("(function(){ var i = state.text.indexOf('ไต้หวัน'); var g = segAt(i); return JSON.stringify({ t: g && g.t }); })()"));
    ok('辨識出來的字可以查詞（斷詞正常）', hit.t === 'ไต้หวัน', JSON.stringify(hit));
    ok('沒有程式錯誤', p.errs.length === 0, p.errs.join('|'));
    // 設定列
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(250); await p.click('.setmi[data-grp="read"]'); await p.waitForTimeout(250);
    ok('設定 → 閱讀與查詞：有「文字辨識方式」，預設新版', await p.locator('#ocrEngGroup').isVisible() && (await p.locator('#ocrEngGroup button').allTextContents()).join() === '新版,舊版' && (await p.locator('#ocrEngGroup button').nth(0).getAttribute('aria-checked')) === 'true');
    await p.locator('#ocrEngGroup button').nth(1).click(); await p.waitForTimeout(100);
    ok('選舊版：存起來', (await p.evaluate(() => localStorage.getItem('thai-ocr-engine'))) === 'old' && (await p.E('otOn()')) === false);
    await p.locator('#ocrEngGroup button').nth(0).click(); await p.waitForTimeout(100);
    ok('選回新版', (await p.evaluate(() => localStorage.getItem('thai-ocr-engine'))) === null && (await p.E('otOn()')) === true);
    ok('這個設定會跟著備份', (await p.E("SETTING_KEYS.indexOf('thai-ocr-engine') >= 0")) === true);
    await p.close();
  }
  // 2. 選舊版：用舊工具
  {
    const p = await open({ old: true });
    await importImg(p, 'ocrtest/becky.png');
    const eng = await p.E('ocr.engine'), txt = await p.E('state.text');
    ok('設定成舊版：用舊工具，照樣讀得出來', !/新版/.test(eng) && txt.includes('เบคกี้'), eng + ' | ' + txt.slice(0, 60));
    await p.close();
  }
  // 3. 新版下載不到：自動改用舊工具
  {
    const p = await open({ block: true });
    await importImg(p, 'ocrtest/becky.png');
    const eng = await p.E('ocr.engine'), txt = await p.E('state.text');
    ok('新版載入失敗：自動改用舊工具，不會卡住', !/新版/.test(eng) && txt.includes('เบคกี้') && (await p.E('ot.failed')) === true, eng + ' | ' + txt.slice(0, 60));
    await p.close();
  }
  // 4. 英文介面
  {
    const p = await open({ en: true });
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(250); await p.click('.setmi[data-grp="read"]'); await p.waitForTimeout(250);
    const row = await p.locator('#ocrEngGroup').locator('xpath=ancestor::div[contains(@class,"setrow")]').innerText();
    ok('en 設定列沒有中文', !ZH.test(row), row);
    await p.locator('#ocrEngGroup').locator('xpath=ancestor::div[contains(@class,"setrow")]').locator('.qhelp').click(); await p.waitForTimeout(150);
    ok('en 「?」說明沒有中文', !ZH.test(await p.locator('#shBody').innerText()), await p.locator('#shBody').innerText());
    await p.close();
  }
  // 5. Pantip 的說明
  {
    const p = await open({});
    await p.route('**/api/fetch**', r => r.fulfill({ status: 200, headers: { 'content-type': 'application/octet-stream', 'x-final-url': 'https://pantip.com/topic/1', 'x-source-type': 'text/html', 'x-via': 'direct' }, body: '<html><body>Sorry, You Are Not Allowed to Access This Page</body></html>' }));
    let msg = ''; try { await p.E("urlFetchArticle('https://pantip.com/topic/1').then(function(){ window.__m = 'ok'; }, function (e) { window.__m = e.message; })"); await p.waitForTimeout(4500); msg = await p.evaluate(() => window.__m); } catch (e) { msg = String(e); }
    ok('Pantip：直接說明是網站不開放、請複製貼上', /Pantip 不開放/.test(msg || ''), msg);
    await p.close();
  }
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
