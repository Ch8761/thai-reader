// 1.30（1.31 改）：歡迎頁第一頁列點、略過放右上角、高級說明、字幕檔標記
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
    const fresh = async (seen) => {
      await p.evaluate(([l, w]) => { localStorage.clear(); if (w) localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, [lang, seen]);
      await p.reload(); await p.waitForTimeout(1300);
    };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));

    // ===== 1. 歡迎頁第一頁：列點 =====
    await fresh(true);
    await E("openWelcome(); 1"); await p.waitForTimeout(300);
    ok(lang + ' 歡迎頁出現', await p.locator('#welcome').isVisible());
    const lis = await p.locator('#wzBody .wzbul li').allTextContents();
    ok(lang + ' 第一頁用列點：5 點、沒有一大段文字', lis.length === 5 && (await p.locator('#wzBody p').count()) === 0, lis.length);
    ok(lang + ' 列點內容有「點一個詞」「生字卡」「一分鐘」', lis.join('|').includes(T('點一個泰文詞', 'Tap a Thai word')) && lis.join('|').includes(T('生字卡', 'flashcards')) && lis.join('|').includes(T('泰文程度', 'Thai level')), lis.join('|').slice(0, 120));
    if (lang === 'en') { ok('en 第一頁沒有中文殘留', !ZH.test(await p.locator('#welcome').innerText()), await p.locator('#welcome').innerText()); }
    await p.screenshot({ path: 'shots/v30-hi-' + lang + '.png' });

    // ===== 2. 略過：固定在右上角，和「上一步」分開 =====
    const box = async (sel) => p.locator(sel).boundingBox();
    const card = await p.locator('#welcome .mcard').boundingBox();
    const sk = await box('#wSkip');
    ok(lang + ' 第一頁：略過在卡片右上角', sk && Math.abs((card.x + card.width) - (sk.x + sk.width)) < 30 && sk.y - card.y < 60, JSON.stringify({ sk, card: { x: card.x, y: card.y, w: card.width } }));
    ok(lang + ' 略過的字很短（只有「略過」）', (await p.locator('#wSkip').innerText()).trim() === T('略過', 'Skip'));
    ok(lang + ' 底部沒有略過（只剩上一步／繼續）', (await p.locator('.wzfoot #wSkip').count()) === 0);
    const steps = [];
    for (let i = 0; i < 1; i++) {
      await p.click('#wNext'); await p.waitForTimeout(150);
      const s2 = await box('#wSkip'), bk = await box('#wBack'), nx = await box('#wNext'), cd = await p.locator('#welcome .mcard').boundingBox();
      steps.push({ skipTop: s2 && s2.y - cd.y < 60, right: s2 && Math.abs((cd.x + cd.width) - (s2.x + s2.width)) < 30, far: bk && s2 && bk.y - (s2.y + s2.height) > 200, backLeft: bk && bk.x < card.x + 80, nextRight: nx && nx.x > card.x + card.width / 2 });
    }
    ok(lang + ' 第 2 頁：略過仍在右上角，離「上一步」很遠（超過 200px）', steps.every(x => x.skipTop && x.right && x.far), JSON.stringify(steps));
    ok(lang + ' 上一步在左下、繼續在右下', steps.every(x => x.backLeft && x.nextRight));
    await p.screenshot({ path: 'shots/v30-level-' + lang + '.png' });
    await p.click('#wNext'); await p.waitForTimeout(150);
    // 第 3 頁（程度）是最後一頁：沒有略過，只有開始使用
    ok(lang + ' 最後一頁：沒有略過，只有開始鈕', !(await p.locator('#wSkip').isVisible()) && await p.locator('#wDone').isVisible());
    // 小測驗裡也看得到略過
    await p.locator('#wzBody .wzquiz').click(); await p.waitForTimeout(200);
    ok(lang + ' 小測驗：略過也在右上角', await p.locator('#wSkip').isVisible());
    await p.click('#wBack'); await p.waitForTimeout(150);
    await E("closeWelcome(); 1");


    // ===== 3. 高級的說明 =====
    await fresh(true);
    ok(lang + ' 高級的說明刪掉「像是…」', !(await E("LV4_DESC.d")).includes('像是') && !(await E("LV4_DESC.d")).includes('皇室'), await E("LV4_DESC.d"));

    // ===== 4. 匯入字幕檔：自動標成字幕（之後做 YouTube／字幕同步用）=====
    await fresh(true);
    await E("showTab('home'); 1"); await p.waitForTimeout(300);
    const srt = '1\n00:00:01,000 --> 00:00:03,000\nสวัสดีครับ วันนี้อากาศดีมาก\n\n2\n00:00:04,000 --> 00:00:06,000\nขอบคุณมากครับ\n';
    await p.setInputFiles('#anyfile', { name: 'ep1.srt', mimeType: 'text/plain', buffer: Buffer.from(srt, 'utf8') }); await p.waitForTimeout(1500);
    const d1 = await J("lib.docs.map(function(d){return {n:d.name, sub:!!d.sub, t:d.type}})");
    ok(lang + ' 匯入 .srt：字幕檔標記為字幕', d1.filter(x => x.n === 'ep1' && x.sub === true).length === 1 && d1.filter(x => x.sub).length === 1, JSON.stringify(d1));
    ok(lang + ' 字幕只留台詞（沒有時間軸）', !(await E("localStorage.getItem(PDF_DOC_PREFIX + lib.docs.filter(function(d){return d.name==='ep1'})[0].id)")).includes('-->'));
    await E("showTab('home'); 1"); await p.waitForTimeout(200);
    await p.setInputFiles('#anyfile', { name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('สวัสดีครับ', 'utf8') }); await p.waitForTimeout(1500);
    const d2 = await J("lib.docs.map(function(d){return {n:d.name, sub:!!d.sub}})");
    ok(lang + ' 匯入 .txt：不是字幕', d2.filter(x => x.n === 'note').length === 1 && d2.filter(x => x.sub).length === 1, JSON.stringify(d2));
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? '失敗 ' + fails : '全部通過');
})();
