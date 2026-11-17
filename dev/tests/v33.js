// 1.33：回來後的修復、同步狀態燈、資料來源頁、斷詞修補、網址匯入重試
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async (ls) => {
      await p.evaluate(([l, ls]) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); Object.keys(ls || {}).forEach(k => localStorage.setItem(k, ls[k])); }, [lang, ls]);
      await p.reload(); await p.waitForTimeout(1300);
    };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const seg = async t => JSON.parse(await E("JSON.stringify(segment(" + JSON.stringify(t) + ").map(function(s){return s.t}))")).join('|');
    await fresh();
    ok(lang + ' 啟動完成的記號', (await p.evaluate(() => window.__thaiBoot)) === 1 && (await p.locator('#bootFail').count()) === 0);

    // ---- 斷詞 ----
    ok(lang + ' กระจาย 不再被切碎', (await seg('การกระจายอำนาจ')) === 'การ|กระจาย|อำนาจ', await seg('การกระจายอำนาจ'));
    ok(lang + ' การกระจายรายได้', (await seg('การกระจายรายได้สู่ชุมชน')) === 'การ|กระจาย|รายได้|สู่|ชุมชน');
    ok(lang + ' ตลาดวโรรส 是一個詞', (await seg('ไปเที่ยวตลาดวโรรสที่เชียงใหม่')).includes('|ตลาดวโรรส|'), await seg('ไปเที่ยวตลาดวโรรสที่เชียงใหม่'));
    ok(lang + ' 原本切對的不變', (await seg('ฝนกระจายทั่วประเทศ')) === 'ฝน|กระจาย|ทั่ว|ประเทศ' && (await seg('ผมชื่อสมชาย')) === 'ผม|ชื่อ|สมชาย' && (await seg('กินข้าวมันไก่อร่อยมากกกก')) === 'กิน|ข้าวมันไก่|อร่อย|มากกกก');
    ok(lang + ' 沒有泰文／混合文字不出錯', (await seg('Hello 123 ไทย')) .includes('ไทย') && (await seg('')) === '');
    // 專有名詞
    await E("$('input').value = 'เขาทำงานที่บริษัททัวร์แห่งหนึ่ง ไปเที่ยวตลาดวโรรสที่เชียงใหม่ ข่าวกระจายไปทั่ว'; 1");
    const ents = async t => { await E("state.text = " + JSON.stringify(t) + "; segs = segment(state.text); if (typeof entCache !== 'undefined') { entCache = null; } 1").catch(() => {}); return JSON.parse(await E("JSON.stringify(getEnts().map(function(e){return [state.text.slice(e.s,e.e), e.type]}))")); };
    let en1 = []; try { en1 = await ents('เขาทำงานที่บริษัททัวร์แห่งหนึ่ง ไปเที่ยวตลาดวโรรสที่เชียงใหม่ ข่าวกระจายไปทั่ว'); } catch (e) { en1 = [['ERR', String(e).slice(0, 80)]]; }
    ok(lang + ' บริษัททัวร์ 不標成機構', !en1.some(x => x[0].includes('บริษัททัวร์') && x[1] === 'org'), JSON.stringify(en1));
    ok(lang + ' ตลาดวโรรส 標成地名（整個）', en1.some(x => x[0] === 'ตลาดวโรรส' && x[1] === 'place'), JSON.stringify(en1));
    ok(lang + ' 沒有外來語誤判（ระจาย、ตลาดวโร）', !en1.some(x => x[0] === 'ระจาย' || x[0] === 'ตลาดวโร'));

    // ---- 資料來源 ----
    await fresh();
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(400);
    for (let i = 0; i < 20 && !(await E("!!DICT")); i++) { await p.waitForTimeout(300); }
    await E("showPop(segs.filter(function (g) { return g.w && /[ก-๎]/.test(g.t) && known(g.t); })[0]); 1"); await p.waitForTimeout(500);
    const cr = p.locator('.pop .credit');
    ok(lang + ' 查詞視窗：來源說明只剩一個小連結', (await cr.count()) === 1 && (await cr.innerText()).trim() === T('資料來源', 'Sources') && (await cr.boundingBox()).height <= 40, (await cr.count()) ? await cr.innerText() : 'none');
    ok(lang + ' 查詞視窗裡沒有長長的授權文字', !/CC BY-SA|kaikki|ECDICT/.test(await p.locator('.pop').innerText()));
    await cr.click(); await p.waitForTimeout(200);
    const sh = await p.locator('#shBody').innerText();
    ok(lang + ' 點連結：打開「資料來源與授權」，內容完整', (await p.locator('#shTitle').innerText()).trim() === T('資料來源與授權', 'Sources and licences') && /Wiktionary/.test(sh) && /CC BY-SA/.test(sh) && /PyThaiNLP/.test(sh) && /scb-mt/.test(sh) && /ECDICT/.test(sh));
    if (lang === 'en') { ok('en 資料來源頁沒有中文', !ZH.test(sh), sh.slice(0, 200)); }
    await p.click('#shClose');
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(250);
    await p.click('.setmi[data-grp="help"]'); await p.waitForTimeout(250);
    ok(lang + ' 設定 → 說明與回饋：有「查看資料來源」', await p.locator('#openCredits').isVisible());
    await p.click('#openCredits'); await p.waitForTimeout(150);
    ok(lang + ' 按了會打開同一頁', /Wiktionary/.test(await p.locator('#shBody').innerText()));
    await p.click('#shClose');

    // ---- 同步狀態燈 ----
    await fresh();
    ok(lang + ' 沒連結雲端：不顯示狀態燈', !(await p.locator('#syncDot').isVisible()));
    await fresh({ 'thai-sync-on': '1', 'thai-sync-rt': '1', 'thai-sync-last': String(Date.now() - 5000) });
    const son = await E("syncOn()");
    if (!son) { const keys = await E("[SYNC_ON, SYNC_RT].join()"); const [a1, a2] = keys.split(','); await fresh({ [a1]: '1', [a2]: '1', 'thai-sync-last': String(Date.now() - 5000) }); }
    await E("sync.busy = false; sync.err = ''; sync.last = Date.now() - 5000; syncDotDraw(); 1");
    const dot = p.locator('#syncDot');
    ok(lang + ' 已連結、上次成功：雲朵＋「已同步」（1.40 起不再是一個小圓點）', await dot.isVisible() && (await dot.getAttribute('class')).includes('ok') && (await dot.locator('.sdt').innerText()).trim() === T('已同步', 'Synced') && (await dot.locator('svg').count()) === 1, await dot.getAttribute('class'));
    ok(lang + ' 說明文字', (await dot.getAttribute('aria-label')).includes(T('已同步', 'synced')));
    const bb = await dot.boundingBox();
    ok(lang + ' 可點範圍至少 44px', bb.width >= 44 && bb.height >= 44);
    await E("sync.busy = true; renderSync(); 1");
    ok(lang + ' 同步中', (await dot.getAttribute('class')).includes('busy') && (await dot.locator('.sdt').innerText()).trim() === T('同步中', 'Syncing'));
    await E("sync.busy = false; sync.err = 'x'; renderSync(); 1");
    ok(lang + ' 出錯：紅色「同步有問題」', (await dot.getAttribute('class')).includes('err') && (await dot.locator('.sdt').innerText()).trim() === T('同步有問題', 'Sync issue') && (await dot.evaluate(e => getComputedStyle(e).color)) === 'rgb(179, 54, 44)');
    await E("sync.err = ''; renderSync(); 1");
    await p.context().setOffline(true); await p.waitForTimeout(200);
    ok(lang + ' 沒有網路：紅燈＋說明', (await dot.getAttribute('class')).includes('err') && (await dot.getAttribute('aria-label')).includes(T('沒有網路', 'offline')));
    await p.context().setOffline(false); await p.waitForTimeout(200);
    ok(lang + ' 網路回來：回到綠燈', (await dot.getAttribute('class')).includes('ok'));
    if (lang === 'en') { ok('en 狀態燈說明沒有中文', !ZH.test(await dot.getAttribute('aria-label')), await dot.getAttribute('aria-label')); }
    await dot.click(); await p.waitForTimeout(400);
    ok(lang + ' 點狀態燈：到設定的同步那一列', await p.locator('#view-settings').isVisible() && await p.locator('#syncBtns').isVisible());

    // ---- 同步改了設定：讀文件時不重新載入 ----
    await fresh();
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__mark = 1; });
    await E("syncRefresh({ settings: true, docs: [], lib: false, cards: false }); 1"); await p.waitForTimeout(1200);
    ok(lang + ' 正在文件頁：不會突然重新載入', (await p.evaluate(() => window.__mark)) === 1 && (await E('syncReloadPending')) === true);
    await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(1500);
    ok(lang + ' 回到主頁後才套用（重新載入一次）', (await p.evaluate(() => window.__mark)) === undefined);
    await p.evaluate(() => { window.__mark = 1; });
    await E("syncRefresh({ settings: true, docs: [], lib: false, cards: false }); 1"); await p.waitForTimeout(1500);
    ok(lang + ' 在主頁：照舊直接套用', (await p.evaluate(() => window.__mark)) === undefined);

    // ---- 錯誤紀錄 ----
    await fresh();
    await p.evaluate(() => { setTimeout(() => { throw new Error('test-boom'); }, 0); }); await p.waitForTimeout(200);
    const lg = JSON.parse(await p.evaluate(() => localStorage.getItem('thai-errlog') || '[]'));
    ok(lang + ' 程式錯誤會記下來（只存在本機，最多 10 筆）', lg.length === 1 && /test-boom/.test(lg[0].m), JSON.stringify(lg));
    ok(lang + ' 啟動後的錯誤不跳提示', (await p.locator('#bootFail').count()) === 0);
    ok(lang + ' 錯誤紀錄不在備份和同步清單裡', (await E("SETTING_KEYS.indexOf('thai-errlog') < 0 && SYNC_SET.indexOf('thai-errlog') < 0")) === true);

    // ---- 網址匯入：閱讀服務交回純文字 ----
    const md = 'Title: หัวข้อข่าวทดสอบ | The Site\n\nURL Source: https://x.example/a\n\nMarkdown Content:\n# หัวข้อข่าวทดสอบวันนี้\n\n![img](https://x/y.png)\n\n[หน้าแรก](https://x/) \n\nนี่คือย่อหน้าแรกของบทความภาษาไทยที่ยาวพอสมควร **ตัวหนา** และ[ลิงก์ในประโยค](https://x/z)ต่อท้าย\n\n* รายการที่หนึ่งของบทความนี้\n\nShare this\n';
    const a = JSON.parse(await E("JSON.stringify(urlFromMarkdown(" + JSON.stringify(md) + "))"));
    ok(lang + ' 純文字：標題拿掉網站名稱', a.title === 'หัวข้อข่าวทดสอบ', a.title);
    ok(lang + ' 純文字：拿掉圖片、連結網址、標記和沒有泰文的行', !/https?:|\*\*|!\[|Share this|^#/m.test(a.text) && a.text.includes('ตัวหนา และลิงก์ในประโยคต่อท้าย') && a.text.split('\n').length === 3, a.text);
    ok(lang + ' 沒有程式錯誤（除了測試丟的那一個）', errs.filter(e => !/test-boom/.test(e)).length === 0, errs.join('|'));
    await p.close();
  }
  // ---- 啟動失敗的提示 ----
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.route('**/index.html', async route => { const r = await route.fetch(); let t = await r.text(); t = t.replace('  window.__thaiBoot = 1;', '  throw new Error("boot-broke");'); route.fulfill({ response: r, body: t }); });
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(800);
    ok('啟動時出錯：跳出提示，有「重新載入」和「複製錯誤訊息」', await p.locator('#bootFail').isVisible() && (await p.locator('#bootFail button').allTextContents()).join() === '重新載入,複製錯誤訊息', await p.locator('#bootFail').count());
    const lg = JSON.parse(await p.evaluate(() => localStorage.getItem('thai-errlog') || '[]'));
    ok('錯誤內容有記下來', lg.some(x => /boot-broke/.test(x.m)), JSON.stringify(lg).slice(0, 200));
    await p.close();
  }
  // ---- 離開再回來：PDF 頁面卡住會重畫 ----
  {
    const fs = require('fs'), F = '/mnt/user-data/uploads/C.pdf';
    if (fs.existsSync(F)) {
      const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
      await p.goto('http://127.0.0.1:8765/index.html');
      await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
      await p.reload(); await p.waitForTimeout(1300);
      const E = c => p.evaluate(c => window.__ev(c), c);
      await p.setInputFiles('#anyfile', F); await p.waitForTimeout(7000);
      ok('PDF 開好了', (await E("pdf.pages.filter(function(g){return g.rendered}).length")) > 0);
      // 模擬：背景時畫圖工具被關掉 → 畫面是空的、而且卡在「正在畫」
      await E("pdf.pages.forEach(function (g) { if (g.visible) { g.canvas.width = 1; g.canvas.height = 1; } }); renderBusy = true; 1");
      await E("wakeUp(true); 1"); await p.waitForTimeout(2500);
      const st = JSON.parse(await E("JSON.stringify(pdf.pages.filter(function(g){return g.visible}).map(function(g){return [g.rendered > 0, g.canvas.width > 100]}))"));
      ok('回來後：看得到的頁面重新畫好', st.length > 0 && st.every(x => x[0] && x[1]), JSON.stringify(st));
      ok('沒有程式錯誤', errs.length === 0, errs.join('|'));
      await p.close();
    }
  }
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
