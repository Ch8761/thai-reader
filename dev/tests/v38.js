// 1.38：中英泰混排開關、逐詞對照、認得率掃描與單詞清單、說明頁
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
const MIXED = 'สวัสดีครับ วันนี้อากาศดีมาก\n你好，今天天氣很好。\nHello, the weather is nice today.\nผมอยากไปเที่ยวทะเลกับเพื่อน\n我想和朋友去海邊玩。\nI want to go to the beach with friends.';
const LONG = 'วันนี้ฉันตื่นเช้ามาก แล้วไปตลาดกับแม่ เราซื้อผักและผลไม้หลายอย่าง แม่บอกว่ามะม่วงปีนี้หวานมาก ฉันชอบกินข้าวเหนียวมะม่วงที่สุด หลังจากนั้นเรากลับบ้านและทำอาหารกลางวันด้วยกัน พี่ชายช่วยล้างจาน ส่วนฉันช่วยหั่นผัก ตอนบ่ายฝนตกหนัก เราจึงนั่งดูหนังที่บ้าน กล่าวคือ ฉันรู้สึกว่าวันนี้เป็นวันที่ดีมาก แม้จะมีอุปสรรคบ้างก็ตาม';
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async (lv) => { await p.evaluate(([l, lv]) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-level', lv || 'b'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, [lang, lv]); await p.reload(); await p.waitForTimeout(1300); for (let i = 0; i < 30 && !(await p.evaluate(() => window.__ev('dict2.ready'))); i++) { await p.waitForTimeout(200); } };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));
    const addText = async (t) => { await E("showTab('home'); $('input').value = " + JSON.stringify(t) + "; libAddText(); 1"); await p.waitForTimeout(900); };
    const visText = () => p.evaluate(() => document.getElementById('text').innerText);
    await fresh('b');
    // ---- 混排 ----
    await addText(MIXED);
    ok(lang + ' 有中文行、英文行：文章上方出現兩個按鈕，預設都顯示', await p.locator('#mixBar').isVisible() && (await p.locator('#mixZh').getAttribute('aria-pressed')) === 'true' && (await p.locator('#mixEn').getAttribute('aria-pressed')) === 'true');
    ok(lang + ' 按鈕文字', (await p.locator('#mixZh').innerText()).trim() === T('中文行', 'Chinese lines') && (await p.locator('#mixEn').innerText()).trim() === T('英文行', 'English lines'));
    await p.click('#mixZh'); await p.waitForTimeout(200);
    let vt = await visText();
    ok(lang + ' 按「中文行」：中文行收起來，泰文和英文還在，也沒有留下空行', !ZH.test(vt) && vt.includes('สวัสดีครับ') && vt.includes('Hello') && !/\n\s*\n/.test(vt), JSON.stringify(vt));
    ok(lang + ' 按鈕變成「關」、存起來', (await p.locator('#mixZh').getAttribute('aria-pressed')) === 'false' && (await J("lsGetJ('thai-mix-hide', {})")).zh === 1);
    await p.click('#mixEn'); await p.waitForTimeout(200);
    vt = await visText();
    ok(lang + ' 再按「英文行」：只剩泰文', !ZH.test(vt) && !/Hello|beach/.test(vt) && vt.includes('ผมอยากไปเที่ยวทะเล'), JSON.stringify(vt));
    ok(lang + ' 原文沒有被改（只是收起來）', (await E('state.text')) === MIXED);
    const i0 = MIXED.indexOf('ผมอยาก');
    await E("showPop(segAt(" + i0 + ")); 1"); await p.waitForTimeout(300);
    ok(lang + ' 收起來之後點字查詞照常', await p.locator('#pop').isVisible() && (await p.locator('#pop').innerText()).includes('ผม'));
    await E("hidePop(); 1");
    await p.reload(); await p.waitForTimeout(1500);
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(400);
    ok(lang + ' 重新打開還記得', !/Hello/.test(await visText()) && !ZH.test(await visText()));
    await p.click('#mixZh'); await p.click('#mixEn'); await p.waitForTimeout(200);
    ok(lang + ' 再按一次：打開', ZH.test(await visText()) && /Hello/.test(await visText()));
    ok(lang + ' 設定會備份、同步（不重新載入）', (await E("SETTING_KEYS.indexOf('thai-mix-hide') >= 0 && SYNC_QUIET.indexOf('thai-mix-hide') >= 0 && SETTING_KEYS.indexOf('thai-known-w') >= 0 && SYNC_QUIET.indexOf('thai-known-w') >= 0")) === true);
    // ---- 逐詞對照 ----
    ok(lang + ' 工具列有「逐詞對照」', await p.locator('#glossAll').isVisible() && (await p.locator('#glossAll').innerText()).trim() === T('逐詞對照', 'Word by word'));
    await p.click('#glossAll'); await p.waitForTimeout(400);
    const blks = await p.$$eval('#gllist .glblk', a => a.map(x => ({ s: x.querySelector('.glsent').textContent, w: [...x.querySelectorAll('.glw')].map(c => c.querySelector('.glth').textContent + '=' + c.querySelector('.glz').textContent), tr: (x.querySelector('.gltr') || {}).textContent || '', link: !!x.querySelector('.gllink') })));
    ok(lang + ' 只列泰文行（兩行）', blks.length === 2 && blks[0].s.startsWith('สวัสดีครับ'), blks.length);
    ok(lang + ' 每個詞有意思（สวัสดี、อากาศ、ทะเล）', blks[0].w.some(x => x.startsWith('สวัสดี=') && !x.endsWith('=?')) && blks[0].w.some(x => x.startsWith('อากาศ=') && !x.endsWith('=?')) && blks[1].w.some(x => x.startsWith('ทะเล=') && !x.endsWith('=?')), JSON.stringify(blks[0].w));
    if (lang === 'zh') { ok('zh 意思是中文', blks[1].w.some(x => /ทะเล=.*海/.test(x)), JSON.stringify(blks[1].w)); }
    ok(lang + ' 下一行是中文翻譯（雙語字幕）：附在泰文下面', blks[0].tr.includes('今天天氣') && blks[1].tr.includes('海邊'), blks[0].tr);
    ok(lang + ' 每行有「整句翻譯」連結', blks.every(x => x.link) && /translate\.google/.test(await p.locator('#gllist .gllink').first().getAttribute('href')));
    await p.screenshot({ path: 'shots/v38-gloss-' + lang + '.png' });
    await p.locator('#gllist .glw').nth(1).click(); await p.waitForTimeout(300);
    ok(lang + ' 點一個詞：打開查詞視窗', await p.locator('#pop').isVisible());
    await E("hidePop(); 1");
    if (lang === 'en') { const pt = await p.locator('#glpanel > .label').innerText(); ok('en 逐詞對照說明沒有中文', !ZH.test(pt), pt); }
    await p.click('#glossAll'); await p.waitForTimeout(150);
    ok(lang + ' 再按一次：收起來', !(await p.locator('#glpanel').isVisible()));
    // ---- 認得率 ----
    await addText(LONG);
    for (let i = 0; i < 10 && !(await p.locator('#rrHint').isVisible()); i++) { await p.waitForTimeout(400); }
    const r0 = await J("(function () { var r = rrCompute(state.text); return { rate: r.rate, n: r.n, unk: r.unk, kn: Object.keys(r.knMap).length }; })()");
    ok(lang + ' 認得率用 App 自己的斷詞算（和畫面上的詞一致）', r0.n === (await E("segs.filter(function (g) { return g.w && g.t.length >= 2 && /[ก-ฮ]/.test(g.t) && !/^(.)\\1+$/.test(g.t); }).length")) && r0.unk > 0 && r0.kn > 0, JSON.stringify(r0));
    await p.click('#rrMain'); await p.waitForTimeout(200);
    ok(lang + ' 點認得率：有「看可能要查的詞」「看認得的詞」兩個按鈕，數字吻合', (await p.locator('#rrUnk').innerText()).includes('(' + r0.unk + ')') || (await p.locator('#rrUnk').innerText()).includes('（' + r0.unk + '）'), await p.locator('#rrUnk').innerText());
    await p.click('#rrUnk'); await p.waitForTimeout(250);
    const rows = await p.$$eval('#shBody .rkrow', a => a.map(x => [x.querySelector('.rkw').textContent, x.querySelector('.rkn').textContent]));
    ok(lang + ' 可能要查的詞清單：每個詞、出現次數', rows.length === r0.unk && rows.every(x => /^×\d+$/.test(x[1])), rows.slice(0, 3).join(' '));
    if (lang === 'en') { ok('en 清單畫面沒有中文（詞義以外）', !ZH.test(await p.locator('#shTitle').innerText()) && !ZH.test(await p.locator('#shBody .edhint').innerText()) && !ZH.test((await p.locator('#shBody .rkb').allTextContents()).join())); }
    await p.screenshot({ path: 'shots/v38-unk-' + lang + '.png' });
    const w1 = rows[0][0];
    await p.locator('#shBody .rkb').first().click(); await p.waitForTimeout(250);
    const r1 = await J("(function () { var r = rrCompute(state.text); return { rate: r.rate, unk: r.unk }; })()");
    ok(lang + ' 按「我認得」：那個詞變成認得、認得率上升、存起來', r1.unk === r0.unk - 1 && r1.rate >= r0.rate && (await J("lsGetJ('thai-known-w', {})"))[w1] === 1, JSON.stringify([w1, r0, r1]));
    await p.click('#shClose'); await p.waitForTimeout(100);
    await p.click('#rrKn'); await p.waitForTimeout(250);
    const kr = await p.$$eval('#shBody .rkrow', a => a.map(x => [x.querySelector('.rkw').textContent, (x.querySelector('.rkwhy') || {}).textContent]));
    ok(lang + ' 認得的詞清單：寫了為什麼算認得（常用字、你標了認得…）', kr.length > 3 && kr.some(x => x[0] === w1 && x[1] === T('你標了認得', 'you marked it')) && kr.some(x => x[1] === T('常用字', 'common word')), JSON.stringify(kr.slice(0, 4)));
    const ix = kr.findIndex(x => x[0] === w1);
    await p.locator('#shBody .rkb').nth(ix).click(); await p.waitForTimeout(200);
    const r2 = await J("(function () { var r = rrCompute(state.text); return { unk: r.unk }; })()");
    ok(lang + ' 按「不熟」：移回要查的詞', r2.unk === r0.unk && !(await J("lsGetJ('thai-known-w', {})"))[w1]);
    await p.click('#shClose');
    // ---- 說明頁 ----
    const helps = await E("HELP.map(function (g) { return g[1].map(function (x) { return x.t; }).join('|'); }).join('|')");
    ok(lang + ' 說明頁補上新功能（修改文字、逐詞對照、字母練習），沒有舊的地圖', (lang === 'zh' ? helps.includes('修改文字、修正辨識的字') && helps.includes('逐詞對照、中英文行') && helps.includes('字母與拼讀練習') : helps.includes('Editing text and fixing recognised text') && helps.includes('Word by word, Chinese and English lines') && helps.includes('Alphabet and reading practice') && helps.includes('Achievements')) && !/Goal and personal map|「Map」 tab|目標與專屬地圖/.test(helps), helps.slice(0, 120));
    ok(lang + ' 沒有程式錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
