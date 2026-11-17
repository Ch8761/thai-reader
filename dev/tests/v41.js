// 1.41：生字卡匯出 CSV／Markdown／JSON、從 CSV 加入、文件匯出 Markdown
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 820, height: 1180 }, acceptDownloads: true }); p.setDefaultTimeout(8000); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ocr-pre', 'no'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
    await p.reload(); await p.waitForTimeout(1800);
    const E = c => p.evaluate(c => window.__ev(c), c);
    await E("showTab('home'); $('input').value = 'ผมชอบกินข้าวมันไก่, \"อร่อย\" มาก\\nวันนี้อากาศดี'; $('textTitle').value = 'ทดสอบ'; libAddText(); 1"); await p.waitForTimeout(900);
    await E("addCard(segAt(state.text.indexOf('ชอบ'))); addCard(segAt(state.text.indexOf('อากาศ'))); state.hl.push([0, 10]); state.boxes.push({ id: 99, x: 0, y: 0, t: '筆記測試', a: [2, 6], s: {} }); 1");
    // 匯出 CSV
    const csv = await E("cxCsv(cards)");
    ok(lang + ' CSV 有 BOM、標題列、兩張卡', csv.charCodeAt(0) === 0xfeff && csv.split('\r\n').filter(Boolean).length === 3 && csv.includes(T('單字', 'Word')), csv.slice(0, 80));
    ok(lang + ' CSV 每一行解析回來都是 11 欄（逗號、引號有包好）', await E("(function(){ var q = String.fromCharCode(34), s = 'ก, ' + q + 'ข' + q + ' ค'; cards[0].sent = s; var r = parseCsv(cxCsv(cards)); return r.length === 3 && r.every(function(x){return x.length === 11}) && r[1][6] === s; })()"));
    const md = await E("cxMd(cards)");
    ok(lang + ' Markdown 是表格', /\| --- \| --- \| --- \| --- \| --- \|/.test(md) && md.includes('ชอบ'));
    const js = JSON.parse(await E("cxJson(cards)"));
    ok(lang + ' JSON 含完整卡片', js.cards.length === 2 && js.cards[0].w && 'box' in js.cards[0]);
    // 畫面
    await E("showTab('cards'); 1"); await p.waitForTimeout(300);
    await E("cxScope = 'all'; cxWrap.hidden = false; cxRender(); 1"); await p.waitForTimeout(200);
    ok(lang + ' 匯出視窗多了 CSV、Markdown、JSON', (await p.locator('#cxBody .exfmt').count()) === 6 && await p.locator('[data-fmt="csv"]').isVisible());
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-fmt="csv"]')]);
    ok(lang + ' 按 CSV 會下載 .csv 檔', /\.csv$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    // 從 CSV 加入
    const f = path.join(os.tmpdir(), 'cards-' + lang + '.csv');
    fs.writeFileSync(f, '﻿單字,意思,拼音,例句\nแมว,貓,maeo,"แมวนอน, บนโซฟา"\nหมา,狗,,\nชอบ,喜歡,,\nhello,hi,,\n');
    await p.setInputFiles('#cxImpFile', f); await p.waitForTimeout(500);
    const msg = await E("$('cxMsg').textContent");
    ok(lang + ' 從 CSV 加入 2 張（已有的和不是泰文的略過）', /2/.test(msg) && (await E("cardOf('แมว') && cardOf('แมว').zh")) === '貓' && (await E("cardOf('แมว').sent")) === 'แมวนอน, บนโซฟา' && !!(await E("!!cardOf('หมา')")), msg);
    ok(lang + ' 沒有標題列也行（第一欄單字、第二欄意思）', await E("cardsFromRows(parseCsv('ปลา\\t魚\\nนก\\t鳥')).added") === 2 && (await E("cardOf('ปลา').zh")) === '魚');
    ok(lang + ' Anki 匯出的檔可以再匯回來（略過已有的）', await E("cardsFromRows(parseCsv(cxAnki(cards))).added") === 0);
    await E("closeCx(); showTab('doc'); 1"); await p.waitForTimeout(300);
    // 文件 Markdown
    const dm = await E("docMarkdown()");
    ok(lang + ' 文件 Markdown：標題、筆記、生字、全文', dm.startsWith('# ทดสอบ') && dm.includes('> ผมชอบกินข้') && dm.includes('筆記測試') && dm.includes('ชอบ') && dm.includes('วันนี้อากาศดี'), dm.slice(0, 200));
    await E("$('openExport').click(); 1"); await p.waitForTimeout(300);
    ok(lang + ' 匯出面板有「匯出 Markdown」，上面按鈕改叫「匯出」', await p.locator('#exMd').isVisible() && (await p.locator('#openExport').innerText()).trim() === T('匯出', 'Export'));
    const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#exMd')]);
    const mdTxt = fs.readFileSync(await dl2.path(), 'utf8');
    ok(lang + ' 下載的 Markdown 內容正確', mdTxt.startsWith('# ทดสอบ'), mdTxt.slice(0, 30));
    ok(lang + ' 查詞視窗：ผม 先顯示「我」，กับ 先顯示「和」', (await E("entryBlock('ผม', DICT['ผม']).querySelector('.ent').textContent")).includes('我') && (await E("entryBlock('กับ', DICT['กับ']).querySelector('.ent').textContent")).includes('和'));
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join(' | '));
    await p.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
