const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const CJK = /[㐀-鿿]/;
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async () => {
      await p.evaluate(l => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
      await p.reload(); await p.waitForTimeout(1400);
    };
    await fresh();
    const E = c => p.evaluate(c => window.__ev(c), c);
    const left = async sel => { const t = await p.evaluate(s => Array.from(document.querySelectorAll(s)).filter(e => e.offsetParent !== null || e.getClientRects().length).map(e => e.innerText + ' ' + (e.getAttribute('aria-label') || '')).join('\n'), sel); return (t.match(/[㐀-鿿]+/g) || []); };
    const leftovers = [];
    const scan = async (tag, sel) => { if (lang !== 'en') return; const l = await left(sel); if (l.length) leftovers.push(tag + ': ' + l.slice(0, 5).join('|')); };

    // ===== A. 歡迎流程 =====
    await E("openWelcome(); 1"); await p.waitForTimeout(250);
    ok(lang + ' 歡迎：6 個進度點', (await p.locator('#wzDots .wzdot').count()) === 6);
    ok(lang + ' 歡迎：上一步藏著、略過看得到', !(await p.locator('#wBack').isVisible()) && (await p.locator('#wSkip').isVisible()));
    await scan('hi', '#welcome');
    await p.screenshot({ path: 'shots/v29-hi-' + lang + '.png' });
    await p.click('#wNext'); await p.waitForTimeout(150); await scan('how', '#welcome');
    ok(lang + ' 怎麼學：三項', (await p.locator('#wzBody .wzstep').count()) === 3);
    await p.click('#wNext'); await p.waitForTimeout(150); await scan('level', '#welcome');
    ok(lang + ' 程度：4 個選項、預選初級', (await p.locator('#wzBody .wzopt').count()) === 4 && (await p.locator('#wzBody .wzopt').nth(1).getAttribute('aria-checked')) === 'true');
    await p.locator('#wzBody .wzopt').nth(0).click(); await p.waitForTimeout(150);
    ok(lang + ' 選入門：程度存起來', (await E("localStorage.getItem('thai-level')")) === 'a');
    await p.click('#wNext'); await p.waitForTimeout(150); await scan('goal', '#welcome');
    ok(lang + ' 目標：入門有 4 個選項（3 個目標＋先不設）、第一個預選並標推薦', (await p.locator('#wzBody .wzopt').count()) === 4 && (await p.locator('#wzBody .wzopt').first().getAttribute('aria-checked')) === 'true' && (await p.locator('#wzBody .wztag').count()) === 1);
    ok(lang + ' 目標：入門的目標是「打好基礎／看懂菜單／升到初級」', (await p.locator('#wzBody .wzopt b').allTextContents()).slice(0, 3).join('|') === ['打好基礎：聲調與日常短句', '看懂菜單和點餐', '升到「初級」'].map(x => T(x, ({ '打好基礎：聲調與日常短句': 'Build the basics: tones and everyday sentences', '看懂菜單和點餐': 'Read menus and order food', '升到「初級」': 'Move up to “Beginner”' })[x])).join('|'), (await p.locator('#wzBody .wzopt b').allTextContents()).join('|'));
    await p.locator('#wzBody .wzopt').nth(2).click(); await p.waitForTimeout(100);
    await p.click('#wNext'); await p.waitForTimeout(150); await scan('time', '#welcome');
    ok(lang + ' 時間：3 個選項、預選 10 分鐘', (await p.locator('#wzBody .wzopt').count()) === 3 && (await p.locator('#wzBody .wzopt').nth(1).getAttribute('aria-checked')) === 'true');
    await p.locator('#wzBody .wzopt').nth(2).click(); await p.waitForTimeout(100);
    await p.click('#wNext'); await p.waitForTimeout(200); await scan('map', '#welcome');
    ok(lang + ' 地圖：入門有 7 關', (await p.locator('#wzBody .lqpath li').count()) === 7, await p.locator('#wzBody .lqpath li').count());
    ok(lang + ' 地圖：有預計到達日期、按鈕是開始第一關', (await p.locator('#wzBody .mapeta').count()) === 1 && (await p.locator('#wDone').isVisible()) && !(await p.locator('#wNext').isVisible()));
    await p.screenshot({ path: 'shots/v29-map-' + lang + '.png' });
    await p.click('#wBack'); await p.waitForTimeout(150);
    ok(lang + ' 上一步：回到時間，20 分鐘還選著', (await p.locator('#wzBody .wzopt').nth(2).getAttribute('aria-checked')) === 'true');
    await p.click('#wNext'); await p.waitForTimeout(150);
    await p.click('#wDone'); await p.waitForTimeout(700);
    ok(lang + ' 開始第一關：視窗關掉', !(await p.locator('#welcome').isVisible()));
    const goal = JSON.parse(await E("localStorage.getItem('thai-goal')"));
    ok(lang + ' 目標存起來', goal.g === 'up' && goal.m === 20, JSON.stringify({ g: goal.g, m: goal.m }));
    ok(lang + ' 入門自動打開聲調學習', (await E("localStorage.getItem('thai-tone-mode')")) === '1');
    ok(lang + ' 第一關：到生字卡的聲調分頁', (await p.locator('#view-cards').isVisible()) && (await E("cardTab")) === 'tone');

    // ===== B. 主頁小列 + 「地圖」分頁 =====
    await E("showTab('home'); 1"); await p.waitForTimeout(500);
    const qc = (await p.locator('#questCard').innerText()).replace(/\s+/g, ' ');
    ok(lang + ' 主頁小列顯示地圖第 1 關', qc.includes(T('完成一次聲調練習', 'Finish one tone practice')), qc);
    ok(lang + ' 主頁小列很矮（≤ 56px）', (await p.locator('#questCard').boundingBox()).height <= 56, (await p.locator('#questCard').boundingBox()).height);
    ok(lang + ' 地圖分頁有紅點（還沒進去過）', await p.locator('#mapDot').isVisible());
    await p.screenshot({ path: 'shots/v29-home-' + lang + '.png' });
    await p.click('#questCard'); await p.waitForTimeout(500);
    ok(lang + ' 點小列：到地圖分頁', (await p.locator('#view-map').isVisible()) && (await p.locator('.tabbar [data-tab="map"]').getAttribute('aria-current')) === 'page');
    ok(lang + ' 地圖分頁：我的地圖 7 關', (await p.locator('#mapBody .mapsec .lqpath li').count()) === 7);
    ok(lang + ' 地圖分頁：沒有「一般關卡」、沒有 30 關', (await p.locator('#mapBody details.lqmore').count()) === 0 && !/30 ?(關|stages)/i.test(await p.locator('#view-map').innerText()));
    ok(lang + ' 地圖分頁：有學習紀錄（4 格、每週目標）', (await p.locator('#mapBody .recsec .lqstat').count()) === 4 && (await p.locator('#mapBody .recsec .lqgoal button').count()) === 4);
    ok(lang + ' 進去過：紅點消失', !(await p.locator('#mapDot').isVisible()));
    await scan('map', '#view-map');
    await p.screenshot({ path: 'shots/v29-map-' + lang + '.png' });

    // ===== C. 進度、魔王關 =====
    await E(`(function(){ statBump('tone'); return 1; })()`);
    let m = JSON.parse(await E("JSON.stringify({cur: mapState().cur, n: mapState().nDone})"));
    ok(lang + ' 做完聲調練習：換到第 2 關', m.cur === 1, JSON.stringify(m));
    await E(`(function(){ var t = Date.now() + 5; ['a1','a2','a3'].forEach(function(id, i){ lib.docs.push({id:'text:t'+i, name:'t'+i, type:'text', size:1, added:1, opened:t, folder:'', lib:id}); }); saveLib();
      for (var i = 0; i < 10; i++) { cards.push({id:'w'+i, w:'ก'+i+'ข', rom:'', pos:'', zh:'x', en:'x', sent:'', src:'', page:0, added:t, box:1, due:today0()+9*86400000, seen:0, right:0, folder:''}); }
      for (var j = 0; j < 30; j++) { statBump('rev'); }
      ['b1','b2','b3'].forEach(function(id, i){ lib.docs.push({id:'text:u'+i, name:'u'+i, type:'text', size:1, added:1, opened:t, folder:'', lib:id}); }); saveLib();
      for (var k = 0; k < 6; k++) { cards.push({id:'k'+k, w:'ค'+k+'ง', rom:'', pos:'', zh:'x', en:'x', sent:'', src:'', page:0, added:t, box:5, due:today0()+90*86400000, seen:9, right:9, last:Date.now(), ivl:40, ease:2.5, lapses:0, fs:{s:40,d:3,t:Date.now()}, folder:''}); }
      saveCards(); rrMemo = {}; rrMemoN = 0; return 1; })()`);
    m = JSON.parse(await E("JSON.stringify({cur: mapState().cur, bi: mapState().bi, allPrev: mapState().allPrev, rate: mapState().rate, unlocked: mapState().unlocked, boss: mapState().stg[mapState().bi].boss})"));
    ok(lang + ' 前面都做完：輪到魔王關', m.cur === m.bi && m.allPrev, JSON.stringify(m));
    ok(lang + ' 認得率不夠：魔王關還沒解鎖', m.unlocked === false && m.rate < 85, m.rate);
    await E("showTab('home'); 1"); await p.waitForTimeout(400);
    const qc2 = (await p.locator('#questCard').innerText()).replace(/\s+/g, ' ');
    ok(lang + ' 主頁小列顯示認得率 / 85%', /85%/.test(qc2) && /%/.test(qc2), qc2);
    await p.click('#questCard'); await p.waitForTimeout(500);
    ok(lang + ' 魔王關：列出還不熟的詞', (await p.locator('#mapBody .mapunk .mapw').count()) >= 3);
    await scan('boss-locked', '#view-map');
    await p.screenshot({ path: 'shots/v29-boss-locked-' + lang + '.png' });
    const before = +(await E("cards.length"));
    await p.locator('#mapBody .mapbtns button').first().click(); await p.waitForTimeout(300);
    ok(lang + ' 全部存成生字卡', +(await E("cards.length")) > before, before + ' → ' + (await E("cards.length")));
    // 解鎖：把那些字都變成記熟；一次只列 10 個詞，不夠就再存一輪（最多 4 輪）
    for (let rd = 0; rd < 4; rd++) {
      await E("(function(){ cards.forEach(function (c) { c.fs = { s: 40, d: 3, t: Date.now() }; c.last = Date.now(); c.due = today0() + 90 * 86400000; }); saveCards(); rrMemo = {}; rrMemoN = 0; return 1; })()");
      if (JSON.parse(await E("JSON.stringify(mapState().unlocked)"))) { break; }
      await E("renderMapTab(); 1"); await p.waitForTimeout(150);
      await p.locator('#mapBody .mapbtns button').first().click(); await p.waitForTimeout(200);
    }
    m = JSON.parse(await E("JSON.stringify({rate: mapState().rate, unlocked: mapState().unlocked})"));
    ok(lang + ' 記熟後解鎖', m.unlocked === true && m.rate >= 85, JSON.stringify(m));
    // 文章上方的魔王關條
    await E("bossRead(mapState().stg[mapState().bi].boss); 1"); await p.waitForTimeout(1500);
    ok(lang + ' 魔王關文章：上方有提示條、答題鈕可按', (await p.locator('#bossBar').isVisible()) && !(await p.locator('#bossGo').isDisabled()));
    await scan('boss-bar', '#bossBar');
    await p.screenshot({ path: 'shots/v29-boss-doc-' + lang + '.png' });
    await E("showTab('home'); 1"); await p.waitForTimeout(300);
    await p.click('#questCard'); await p.waitForTimeout(500);
    ok(lang + ' 已解鎖：有「讀這篇」「答 3 題」', (await p.locator('#mapBody .mapbtns button').count()) === 2);
    await scan('boss-unlocked', '#view-map');
    await p.locator('#mapBody .mapbtns button').nth(1).click(); await p.waitForTimeout(400);
    ok(lang + ' 答題視窗打開、有 4 個選項', (await p.locator('#bossQ').isVisible()) && (await p.locator('#bossQ .qopt').count()) === 4);
    await scan('boss-q', '#bossQ');
    await p.screenshot({ path: 'shots/v29-quiz-' + lang + '.png' });
    // 先故意答錯 3 題
    const answer = async right => {
      for (let i = 0; i < 3; i++) {
        const info = JSON.parse(await E("JSON.stringify({ a: bqs.b.qs[bqs.k].a, order: bqs.opts[bqs.k] })"));
        const pos = right ? info.order.indexOf(info.a) : (info.order.indexOf(info.a) + 1) % 4;
        await p.locator('#bossQ .qopt').nth(pos).click(); await p.waitForTimeout(150);
        if (i === 0) await scan('boss-feedback', '#bossQ');
        await p.locator('#bossQ button.primary').click(); await p.waitForTimeout(150);
      }
    };
    await answer(false);
    ok(lang + ' 全錯：沒過關', (await p.locator('#bossQ .bqres.bad').count()) === 1 && !JSON.parse(await E("JSON.stringify(!!(lsGetJ('thai-goal', {}).bt && Object.keys(lsGetJ('thai-goal', {}).bt).length))")));
    await scan('boss-fail', '#bossQ');
    await p.screenshot({ path: 'shots/v29-quiz-fail-' + lang + '.png' });
    await p.locator('#bossQ button.primary').click(); await p.waitForTimeout(300);
    await answer(true);
    ok(lang + ' 全對：過關並記下來', (await p.locator('#bossQ .bqres.ok').count()) === 1 && JSON.parse(await E("JSON.stringify(Object.keys(lsGetJ('thai-goal', {}).bt || {}).length)")) === 1);
    await scan('boss-pass', '#bossQ');
    await p.locator('#bossQ button.primary').click(); await p.waitForTimeout(500);
    ok(lang + ' 回到地圖分頁：全部完成、有「挑下一個目標」', (await p.locator('#view-map').isVisible()) && (await p.locator('#mapBody .mapsec .lqdone').count()) === 7 && JSON.parse(await E("JSON.stringify(mapState().cur === mapState().stg.length)")) && (await p.locator('#mapBody .mapnote2 button.primary').count()) === 1);
    ok(lang + ' 走完的目標記進「完成過」', JSON.parse(await E("JSON.stringify(!!lsGetJ('thai-goal-done', {})['up:a'])")));
    await E("showTab('home'); 1"); await p.waitForTimeout(400);
    ok(lang + ' 主頁：地圖完成', (await p.locator('#questCard').innerText()).replace(/\s+/g, ' ').includes(T('地圖完成', 'Map complete')));

    // ===== D. 改程度：地圖換成新程度，已過的關保留 =====
    await E("level = 'b'; localStorage.setItem('thai-level','b'); rrMemo = {}; rrMemoN = 0; 1");
    m = JSON.parse(await E("JSON.stringify({n: mapState().stg.length, hasTone: mapState().stg.some(function(s){return s.k==='tone'}), done: mapState().nDone})"));
    ok(lang + ' 改成初級：這張地圖照原本的入門排，不會亂掉（共 7 關、還有聲調關）', m.n === 7 && m.hasTone, JSON.stringify(m));

    // ===== E. 沒有目標：主頁不放東西，地圖分頁有「設定我的目標」 =====
    await E("localStorage.removeItem('thai-goal'); localStorage.removeItem('thai-goal-skip'); showTab('home'); 1"); await p.waitForTimeout(400);
    ok(lang + ' 沒有目標：主頁沒有關卡條（也沒有 30 關）', (await p.locator('#questCard').count()) === 0);
    await E("showTab('map'); 1"); await p.waitForTimeout(400);
    ok(lang + ' 地圖分頁有「設定我的目標」小卡', (await p.locator('#mapBody .mapnew').count()) === 1 && (await p.locator('#mapBody .recsec').count()) === 1);
    await scan('map-new', '#view-map');
    await p.screenshot({ path: 'shots/v29-map-new-' + lang + '.png' });
    await p.locator('#mapBody .mapnew button.primary').click(); await p.waitForTimeout(400);
    ok(lang + ' 開始設定：只有 4 步（程度、目標、時間、地圖）', (await p.locator('#welcome').isVisible()) && (await p.locator('#wzDots .wzdot').count()) === 4);
    await p.click('#wNext'); await p.waitForTimeout(100); await p.click('#wNext'); await p.waitForTimeout(100); await p.click('#wNext'); await p.waitForTimeout(150);
    ok(lang + ' 初級：預選第一個「升到中級」，地圖 6 關', (await p.locator('#wzBody .lqpath li').count()) === 6);
    await p.click('#wDone'); await p.waitForTimeout(700);
    ok(lang + ' 從地圖分頁設定完：回到地圖分頁、顯示新地圖', !(await p.locator('#welcome').isVisible()) && (await p.locator('#view-map').isVisible()) && (await p.locator('#mapBody .mapsec .lqpath li').count()) === 6);

    // ===== F. 略過、先不設目標 =====
    await E("localStorage.removeItem('thai-goal'); localStorage.removeItem('thai-welcome-v1'); openWelcome(); 1"); await p.waitForTimeout(200);
    await p.click('#wSkip'); await p.waitForTimeout(200);
    ok(lang + ' 略過：視窗關掉、沒有存目標、視為看過', !(await p.locator('#welcome').isVisible()) && (await E("localStorage.getItem('thai-goal')")) === null && (await E("localStorage.getItem('thai-welcome-v1')")) === '1');
    await E("openWelcome(); 1"); await p.waitForTimeout(150);
    await p.click('#wNext'); await p.click('#wNext'); await p.click('#wNext'); await p.waitForTimeout(100);
    await p.locator('#wzBody .wzopt').last().click(); await p.waitForTimeout(100);
    await p.click('#wNext'); await p.waitForTimeout(150);
    ok(lang + ' 選「先不設目標」：下一頁就是設定完成（共 5 步）', (await p.locator('#wzDots .wzdot').count()) === 5 && (await p.locator('#wDone').isVisible()));
    await scan('done', '#welcome');
    await p.click('#wDone'); await p.waitForTimeout(300);
    ok(lang + ' 先不設目標：不會產生地圖', JSON.parse(await E("JSON.stringify(goalGet() === null)")) && (await p.locator('#welcome').isVisible()) === false);

    // ===== G. 1 分鐘小測驗 =====
    const runQuiz = async mode => {
      await E("openWelcome(); wz.i = 2; wizRender(); 1"); await p.waitForTimeout(150);
      await p.locator('#wzBody .wzquiz').click(); await p.waitForTimeout(200);
      if (mode === 'right') { await scan('quiz', '#welcome'); await p.screenshot({ path: 'shots/v29-lq-' + lang + '.png' }); }
      for (let i = 0; i < 10; i++) {
        await p.waitForSelector('#wzBody .qopt:not([disabled])'); await p.waitForTimeout(60);
        if (mode === 'right') {
          const idx = +(await E("wz.quiz.opts.findIndex(function (o) { return o[1]; })"));
          await p.locator('#wzBody .qopt').nth(idx).click();
        } else { await p.locator('#wzBody .wzdk').click(); }
        await p.waitForTimeout(800);
      }
      await p.waitForTimeout(200);
      return (await p.locator('#wzBody .wzbig').innerText()).trim();
    };
    const hi = await runQuiz('right');
    ok(lang + ' 小測驗全對：建議高級', hi === T('高級', 'Advanced'), hi);
    await scan('quiz-result', '#welcome');
    await p.locator('#wzBody .btns button.primary').click(); await p.waitForTimeout(200);
    ok(lang + ' 用這個程度：程度存成 d、回到程度頁', (await E("localStorage.getItem('thai-level')")) === 'd' && (await p.locator('#wzBody .wzopt').nth(3).getAttribute('aria-checked')) === 'true');
    const lo = await runQuiz('unknown');
    ok(lang + ' 小測驗全部不知道：建議入門', lo === T('入門', 'Starter'), lo);
    await p.locator('#wzBody .btns button').nth(1).click(); await p.waitForTimeout(150);
    ok(lang + ' 回去自己選：程度不變（高級）', (await E("localStorage.getItem('thai-level')")) === 'd');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);

    if (lang === 'en') { ok('en 新畫面沒有中文殘留', leftovers.length === 0, leftovers.join(' ; ')); }
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? '失敗 ' + fails : '全部通過');
})();
