// 1.36：補充詞彙、辨識自動校正、查不到的字虛線、手動修改文字
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); p.setDefaultTimeout(8000); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async (ls) => { await p.evaluate(([l, ls]) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); Object.keys(ls || {}).forEach(k => localStorage.setItem(k, ls[k])); }, [lang, ls]); await p.reload(); await p.waitForTimeout(1300); for (let i = 0; i < 30 && !(await p.evaluate(() => window.__ev('dict2.ready'))); i++) { await p.waitForTimeout(200); } };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));
    const seg = async t => (await J("segment(" + JSON.stringify(t) + ").filter(function(s){return s.w}).map(function(s){return s.t})")).join('|');
    await fresh();
    // ---- 補充詞彙 ----
    ok(lang + ' 補充詞彙載入（另一個檔案，不在主程式裡）', (await E('dict2.ready')) === true && (await E('dict2.n')) > 300, await E('dict2.n'));
    const z = async w => (await J("DICT[" + JSON.stringify(w) + "] ? DICT[" + JSON.stringify(w) + "][0] : null"));
    const f1 = await z('โฟกัส'), f2 = await z('ไลฟ์'), f3 = await z('คอนเทนต์'), f4 = await z('ช็อปปิ้ง');
    ok(lang + ' 音譯外來語查得到（โฟกัส、ไลฟ์、คอนเทนต์、ช็อปปิ้ง）', f1 && f1[4][0].includes('專注') && f1[3][0] === 'focus' && f2 && f2[4][0].includes('直播') && f3 && f3[4][0].includes('內容') && f4 && f4[4][0].includes('購物'), JSON.stringify(f1));
    ok(lang + ' 菜名查得到（กะเพราหมูสับ、ข้าวขาหมู、ผักบุ้งไฟแดง）', !!(await z('กะเพราหมูสับ')) && (await z('ข้าวขาหมู'))[4][0].includes('豬腳') && !!(await z('ผักบุ้งไฟแดง')));
    ok(lang + ' 字典本來有、但沒有中文的，補上中文（ต้มยำกุ้ง、ส้มตำ、เชียงใหม่）', (await z('ต้มยำกุ้ง'))[4][0].includes('酸辣蝦湯') && (await z('ส้มตำ'))[4][0].includes('青木瓜') && (await z('เชียงใหม่'))[4][0].includes('清邁'));
    ok(lang + ' 字典原有的中文不會被蓋掉（คอมพิวเตอร์）', (await z('คอมพิวเตอร์'))[4][0].includes('電腦'));
    ok(lang + ' 地名查得到（บุรีรัมย์、เกาะหลีเป๊ะ、เยาวราช）', !!(await z('บุรีรัมย์')) && !!(await z('เกาะหลีเป๊ะ')) && !!(await z('เยาวราช')));
    ok(lang + ' 斷詞：新加的詞是一個詞', (await seg('ช่วยโฟกัสกับคอนเทนต์หน่อย')).includes('|โฟกัส|') && (await seg('ช่วยโฟกัสกับคอนเทนต์หน่อย')).includes('|คอนเทนต์|') && (await seg('สั่งกะเพราหมูสับไข่ดาว')).includes('กะเพราหมูสับ'), await seg('ช่วยโฟกัสกับคอนเทนต์หน่อย') + ' / ' + await seg('สั่งกะเพราหมูสับไข่ดาว'));

    // ---- 辨識自動校正 ----
    const g = async t => (await J("ocrGuess(" + JSON.stringify(t) + ")"));
    const cases = [['เป็นคนแธกในทุกเช้า', 'เป็นคนแรกในทุกเช้า'], ['คอามสุขในตอนเช้า', 'ความสุขในตอนเช้า'], ['ขอจแต่ละคน', 'ของแต่ละคน'], ['ผมชอบอ่านหมังสือมาก', 'ผมชอบอ่านหนังสือมาก']];
    for (const [bad, good] of cases) { const r = await g(bad); ok(lang + ' 校正：' + bad + ' → ' + good, r.t === good && r.n >= 1, JSON.stringify(r)); }
    const keep = ['แค่ตืนมาแล้วได้เจอ', 'วันนี้อากาศดีมาก ฉันอยากไปเดินเล่นที่สวนสาธารณะกับเพื่อน', 'ฟรีน สโรชา และเบคกี้ รีเบคก้า เปิดตัวซีรีส์เรื่องใหม่', 'ปธน.ไต้หวันเตือนให้ระวัง ความพยายามแทรกซึมจากจีน', 'ประธานาธิบดีไล่ ชิง-เต๋อ ออกมาเตือนในวันพฤหัสบดีว่า', 'กินข้าวมันไก่อร่อยมากกกก 555', 'Hello 123 สวัสดีครับ'];
    for (const t of keep) { const r = await g(t); ok(lang + ' 本來就對的不亂改：' + t.slice(0, 22) + '…', r.t === t && r.n === 0, JSON.stringify(r)); }
    ok(lang + ' 辨識結果整理時會套用校正', (await J("ocrFixText('เป็นคนแธกในทุกเช้า')")).t === 'เป็นคนแรกในทุกเช้า');

    // ---- 查不到的字：虛線 ----
    const addText = async (t) => { await E("showTab('home'); $('input').value = " + JSON.stringify(t) + "; $('textTitle').value = 'ทดสอบ'; libAddText(); 1"); await p.waitForTimeout(500); };
    await addText('วันนี้ฉันไปจุ๊บุจุ๊บุที่ตลาดกับสมชาย แล้วโฟกัสที่เชียงใหม่');
    await p.waitForTimeout(300);
    let unk = await p.$$eval('#text mark.unk', a => a.map(x => x.textContent));
    ok(lang + ' 查不到的字有虛線（只標查不到的那個）', unk.join('').includes('จุ๊') && !unk.join('').includes('โฟกัส') && !unk.join('').includes('ตลาด') && !unk.join('').includes('สมชาย'), JSON.stringify(unk));
    ok(lang + ' 是虛線、不是底色', (await p.locator('#text mark.unk').first().evaluate(e => { const c = getComputedStyle(e); return c.borderBottomStyle + '|' + c.backgroundColor; })) === 'dotted|rgba(0, 0, 0, 0)');
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(250); await p.click('.setmi[data-grp="read"]'); await p.waitForTimeout(250);
    ok(lang + ' 設定 → 閱讀與查詞：有「標示查不到的字」，預設標示', (await p.locator('#unkGroup button').allTextContents()).join() === T('標示,不標示', 'Show,Hide') && (await p.locator('#unkGroup button').nth(0).getAttribute('aria-checked')) === 'true');
    if (lang === 'en') { const row = await p.locator('#unkGroup').locator('xpath=ancestor::div[contains(@class,"setrow")]').innerText(); ok('en 設定列沒有中文', !ZH.test(row), row); }
    await p.locator('#unkGroup button').nth(1).click(); await p.waitForTimeout(150);
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(300);
    ok(lang + ' 關掉：虛線消失、存起來', (await p.locator('#text mark.unk').count()) === 0 && (await p.evaluate(() => localStorage.getItem('thai-show-unk'))) === '0');
    await E("localStorage.removeItem('thai-show-unk'); renderText(); 1");
    ok(lang + ' 設定會跟著備份和同步', (await E("SETTING_KEYS.indexOf('thai-show-unk') >= 0 && SYNC_SET.indexOf('thai-show-unk') >= 0")) === true);

    // ---- 修改文字（文字文件）----
    ok(lang + ' 文字文件：有「修改文字」按鈕', await p.locator('#editText').isVisible() && (await p.locator('#editText').innerText()).trim() === T('修改文字', 'Edit text'));
    const t0 = await E('state.text'), iM = t0.indexOf('ตลาด'), iC = t0.indexOf('เชียงใหม่');
    await E("state.hl = [[" + iM + "," + (iM + 4) + "], [" + iC + "," + (iC + 9) + "]]; save(); renderText(); 1");
    await p.click('#editText'); await p.waitForTimeout(250);
    ok(lang + ' 打開編輯：整篇文字在大格子裡', (await p.locator('#shBody textarea.edbox').inputValue()) === t0 && (await p.locator('#shTitle').innerText()).trim() === T('修改文字', 'Edit text'));
    if (lang === 'en') { ok('en 編輯視窗沒有中文', !ZH.test(await p.locator('#setHelp').innerText()), await p.locator('#setHelp').innerText()); }
    const t1 = t0.replace('จุ๊บุจุ๊บุ', 'โรงเรียน');
    await p.locator('#shBody textarea.edbox').fill(t1); await p.locator('#shBody .edbtns .primary').click(); await p.waitForTimeout(700);
    ok(lang + ' 儲存：文字改了、虛線沒了', (await E('state.text')) === t1 && (await p.locator('#text mark.unk').count()) === 0, (await E('state.text')) + ' | ' + (await p.$$eval('#text mark.unk', a => a.map(x => x.textContent).join())));
    const hl = await J('state.hl');
    ok(lang + ' 螢光筆跟著移到新位置（還是標在同樣的字上）', hl.length === 2 && t1.slice(hl[0][0], hl[0][1]) === 'ตลาด' && t1.slice(hl[1][0], hl[1][1]) === 'เชียงใหม่', JSON.stringify(hl.map(h => t1.slice(h[0], h[1]))));
    await p.reload(); await p.waitForTimeout(1300);
    ok(lang + ' 重新打開：改過的文字還在', (await E('state.text')) === t1);
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(300);
    await p.click('#editText'); await p.waitForTimeout(200); await p.locator('#shBody textarea.edbox').fill(t1 + ' xx'); await p.locator('#shBody .edbtns button').nth(1).click(); await p.waitForTimeout(300);
    ok(lang + ' 按取消：不改', (await E('state.text')) === t1);

    // ---- 修正辨識的字（照片）----
    await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
    await p.setInputFiles('#imgfile', ['ocrtest/becky.png']); await p.waitForTimeout(1200); await p.click('#phOk');
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); const o = await J("{ busy: ocr.busy, done: ocr.done, pdf: !!pdf }"); if (o.pdf && !o.busy && o.done > 0) break; }
    for (let i = 0; i < 30 && (await E("(state.text || '').length")) < 30; i++) { await p.waitForTimeout(400); }
    ok(lang + ' 照片文件：沒有「修改文字」按鈕（改用點字修正）', !(await p.locator('#editText').isVisible()));
    const sp = await J("(function(){ var s = pdf.tl.filter(function (x) { return x.ocr && /เบคกี้/.test(x.t); })[0]; return s ? { o: s.o, t: s.t, oi: s.oi, page: s.page } : null; })()");
    ok(lang + ' 辨識出來的每一段都記得來源', sp && typeof sp.oi === 'number', JSON.stringify(sp));
    await E("showPop(segAt(" + (sp.o + sp.t.indexOf('เบคกี้')) + ")); 1"); await p.waitForTimeout(400);
    const lk = p.locator('.pop .ocrfixlink');
    ok(lang + ' 點字查詞的視窗裡有「修正辨識的字」', (await lk.count()) === 1 && (await lk.innerText()).trim() === T('修正辨識的字', 'Fix recognised text'));
    await lk.click(); await p.waitForTimeout(250);
    ok(lang + ' 打開：這一段的字在輸入格裡', (await p.locator('#shBody input.edbox').inputValue()) === sp.t);
    const nt = sp.t.replace('เบคกี้', 'เบคกี้ทดสอบ');
    await p.locator('#shBody input.edbox').fill(nt); await p.locator('#shBody .edbtns .primary').click();
    for (let i = 0; i < 30; i++) { await p.waitForTimeout(400); if ((await E("pdf && pdf.tl ? state.text.indexOf('เบคกี้ทดสอบ') : -1")) >= 0) break; }
    ok(lang + ' 儲存：文章裡的字改了', (await E("state.text.indexOf('เบคกี้ทดสอบ')")) >= 0);
    const st = await p.evaluate(async () => { const o = await window.__ev("ocrLoad(pdf.id)"); return JSON.stringify(o.pages); });
    ok(lang + ' 辨識結果存檔也改了（下次打開還在）', st.includes('เบคกี้ทดสอบ'));
    await p.reload(); await p.waitForTimeout(2500);
    for (let i = 0; i < 30 && (await E("(state.text || '').length")) < 30; i++) { await p.waitForTimeout(400); }
    ok(lang + ' 重新打開：改過的字還在', (await E("state.text.indexOf('เบคกี้ทดสอบ')")) >= 0);
    ok(lang + ' 沒有程式錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
