// 1.31：成就頁（任務、學習紀錄進度條、成長圖、貼紙）、小火苗、舊目標轉任務、精靈只剩三步
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
const PHR = ['เก่งมาก', 'สุดยอด', 'เยี่ยมเลย', 'เจ๋งมาก', 'ไปต่อเลย', 'สู้ ๆ', 'ทำได้แล้ว', 'ว้าว'];
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async (o = {}) => {
      await p.evaluate(([l, o]) => {
        localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1');
        if (!o.loud) { localStorage.setItem('thai-quest-quiet', '1'); }
        if (l === 'en') { localStorage.setItem('thai-ui-lang', 'en'); }
        if (o.level) { localStorage.setItem('thai-level', o.level); }
        Object.keys(o.ls || {}).forEach(k => localStorage.setItem(k, typeof o.ls[k] === 'string' ? o.ls[k] : JSON.stringify(o.ls[k])));
      }, [lang, o]);
      await p.reload(); await p.waitForTimeout(o.wait || 1600);
    };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));
    const LS = async k => p.evaluate(k => { const v = localStorage.getItem(k); try { return JSON.parse(v); } catch (e) { return v; } }, k);
    const goAch = async () => { await p.click('.tabbar [data-tab="ach"]'); await p.waitForTimeout(350); };
    const vis = sel => p.locator(sel).first().isVisible();
    const addCards = async (n, known) => E("(function(){var t=Date.now();for(var i=0;i<" + n + ";i++){var c={id:'t'+t+i,w:'ทดสอบ'+i+'x'+t,rom:'',pos:'',zh:'測'+i,en:'t'+i,sent:'',src:'',page:0,added:Date.now(),box:1,due:today0()+864e5,seen:0,right:0,folder:''};srsInit(c);" + (known ? "c.seen=3;c.fs={s:30,d:5,t:Date.now()};" : "") + "cards.push(c);}saveCards();return cards.length;})()");

    // ===== 1. 分頁：地圖換成成就 =====
    await fresh({ level: 'c' });
    const tabs = await p.$$eval('.tabbar [data-tab]', a => a.map(x => x.getAttribute('data-tab')));
    ok(lang + ' 底部分頁：主頁、文件、生字卡、成就、設定（沒有地圖）', tabs.join() === 'home,doc,cards,ach,settings', tabs.join());
    ok(lang + ' 分頁名稱', (await p.locator('.tabbar [data-tab="ach"] span').first().innerText()).trim() === T('成就', 'Achievements'));
    await goAch();
    ok(lang + ' 成就頁顯示、標題', await vis('#view-ach') && (await p.locator('#h-achv').innerText()).trim() === T('成就', 'Achievements'));
    const secs = await p.$$eval('#achBody h2', a => a.map(x => x.textContent.trim()));
    ok(lang + ' 三個區塊：任務、學習紀錄、成長（沒有貼紙）', secs.length === 3 && (await p.locator('#achBody .achalbum, #rwdPop').count()) === 0, secs.join('|'));
    await E("localStorage.setItem('thai-tab','map'); 1"); await p.reload(); await p.waitForTimeout(1300);
    ok(lang + ' 以前停在「地圖」分頁的人，打開會到成就頁', await vis('#view-ach'));

    // ===== 2. 任務：建議、新增、超過 3 個折起來 =====
    await fresh({ level: 'c' });
    await goAch();
    ok(lang + ' 沒有任務：顯示空狀態', (await p.locator('.achempty').innerText()).includes(T('還沒有任務', 'No tasks yet')));
    const chips = await p.locator('.achchip').allTextContents();
    ok(lang + ' 中級的建議小任務（4 個）', chips.length === 4 && chips[0].includes(T('新聞', 'news')), chips.join('|'));
    await p.locator('.achchip').nth(2).click(); await p.waitForTimeout(200);
    let list = await J("tasksGet().list");
    ok(lang + ' 點建議：加進任務（存 10 個、要做 10 次）', list.length === 1 && list[0].n === 10 && list[0].t === T('存 10 個生字', 'Save 10 new words'), JSON.stringify(list));
    ok(lang + ' 加進去的建議不再重複出現', !(await p.locator('.achchip').allTextContents()).some(x => x.includes(T('存 10', 'Save 10'))));
    await p.fill('.achadd .achin', T('自己的任務', 'My own task')); await p.click('.achadd button');
    await p.waitForTimeout(200);
    ok(lang + ' 自己輸入：加進任務、輸入框清空並保留焦點', (await J("tasksGet().list")).length === 2 && (await p.inputValue('.achadd .achin')) === '' && await p.evaluate(() => document.activeElement.classList.contains('achin')));
    for (let i = 0; i < 3; i++) { await p.fill('.achadd .achin', 'T' + i); await p.press('.achadd .achin', 'Enter'); await p.waitForTimeout(120); }
    const rows = await p.locator('#achBody .achtask').count(), mre = await p.locator('.achmore:not(.achset) > summary').first().innerText();
    ok(lang + ' 5 個任務：外面只放 3 個，其餘折起來', (await p.locator('#achBody > section').first().locator('> .achlist > .achtask').count()) === 3 && /2/.test(mre), rows + ' / ' + mre);
    await p.screenshot({ path: 'shots/v31-tasks-' + lang + '.png' });

    // ===== 3. 任務完成：進度條、+1、小火苗、取消 =====
    await fresh({ level: 'b', loud: true });
    await E("taskAdd('" + T('讀三次', 'Read three times') + "', 3); taskAdd('" + T('讀一次', 'Read once') + "', 1); 1");
    await goAch();
    const r0 = p.locator('#achBody .achtask').nth(0);
    ok(lang + ' 多次任務：按鈕是 +1、有進度條 0 / 3', (await r0.locator('.achchk').innerText()).trim() === '+1' && (await r0.locator('.lqnum').innerText()).trim() === '0 / 3');
    await r0.locator('.achchk').click(); await p.waitForTimeout(150);
    ok(lang + ' 按一次：1 / 3、進度條 33%、沒有火苗', (await p.locator('#achBody .achtask').nth(0).locator('.lqnum').innerText()).trim() === '1 / 3' && (await p.locator('#achBody .achtask').nth(0).locator('.lqbar > span').evaluate(e => e.style.width)) === '33%' && !(await vis('#flame')));
    await p.locator('#achBody .achtask').nth(0).locator('.achchk').click(); await p.waitForTimeout(100);
    await p.locator('#achBody .achtask').nth(0).locator('.achchk').click(); await p.waitForTimeout(400);
    const ftx = await p.locator('#flame').innerText();
    ok(lang + ' 做滿：冒出大一點的小火苗（只有圖示，沒有泰文、沒有貼紙）', await vis('#flame') && (await p.locator('#flame').getAttribute('class')).includes('big') && (await p.locator('#flame .flic svg').count()) === 1 && !/[\u0E00-\u0E7F]/.test(ftx) && (await p.locator('#rwdPop').count()) === 0, JSON.stringify(ftx));
    ok(lang + ' 小火苗是狀態提示、不搶焦點、不蓋住操作（點得到下面的按鈕）', (await p.locator('#flame').getAttribute('role')) === 'status' && await p.evaluate(() => document.activeElement.id !== 'flame'));
    await p.screenshot({ path: 'shots/v31-flame-big-' + lang + '.png' });
    if (lang === 'en') { ok('en 小火苗沒有中文', !ZH.test(await p.locator('#flame').innerText()), await p.locator('#flame').innerText()); }
    await p.waitForTimeout(3300);
    ok(lang + ' 約 3 秒後自己消失', !(await vis('#flame')));
    ok(lang + ' 完成的任務收進摺疊區', (await p.locator('.achmore:not(.achset) > summary').last().innerText()).includes('1'));
    await p.locator('#achBody .achtask').nth(0).locator('.achchk').click(); await p.waitForTimeout(400);
    ok(lang + ' 完成第二個：又冒一朵', await vis('#flame'));
    await p.click('#flame'); await p.waitForTimeout(150);
    ok(lang + ' 點一下火苗就收起', !(await vis('#flame')));
    await p.locator('.achmore:not(.achset) > summary').last().click(); await p.waitForTimeout(150);
    await p.locator('.achmore .achtask.done .achchk').first().click(); await p.waitForTimeout(400);
    const lst = await J("tasksGet().list");
    ok(lang + ' 已完成的任務按圓圈：取消完成（不冒火苗）', lst.filter(t => !t.done).length === 1 && !(await vis('#flame')));
    ok(lang + ' 沒有貼紙的資料', (await LS('thai-stk')) === null);

    // ===== 4. 編輯、刪除 =====
    await fresh({ level: 'b' });
    await E("taskAdd('" + T('舊名字', 'Old name') + "', 1); 1"); await goAch();
    await p.locator('#achBody .achname').first().click(); await p.waitForTimeout(150);
    ok(lang + ' 點任務名稱：出現編輯表單（內容、次數、已做）', await vis('.achedit') && (await p.locator('.achedit input').count()) === 3);
    await p.fill('.achedit .achin', T('新名字', 'New name')); await p.locator('.achedit input[type=number]').nth(0).fill('4'); await p.locator('.achedit input[type=number]').nth(1).fill('2');
    await p.click('.achedit button[type=submit]'); await p.waitForTimeout(200);
    let t1 = (await J("tasksGet().list"))[0];
    ok(lang + ' 儲存：名稱、次數、進度都更新', t1.t === T('新名字', 'New name') && t1.n === 4 && t1.c === 2 && !t1.done, JSON.stringify(t1));
    ok(lang + ' 進度條 2 / 4', (await p.locator('#achBody .achtask .lqnum').first().innerText()).trim() === '2 / 4');
    await p.locator('#achBody .achname').first().click(); await p.waitForTimeout(100);
    await p.click('.achedit .achdel'); await p.waitForTimeout(100);
    ok(lang + ' 刪除要按兩次（第一次只改成確認字樣）', (await J("tasksGet().list")).length === 1 && (await p.locator('.achedit .achdel').innerText()).includes(T('再按一次', 'again')));
    await p.click('.achedit .achdel'); await p.waitForTimeout(200);
    ok(lang + ' 第二次：刪掉了', (await J("tasksGet().list")).length === 0);
    await p.locator('#achBody .achchip').first().click(); await p.waitForTimeout(100);
    await p.locator('#achBody .achname').first().click(); await p.waitForTimeout(100);
    await p.locator('.achedit input[type=number]').nth(0).fill('2'); await p.locator('.achedit input[type=number]').nth(1).fill('2'); await p.click('.achedit button[type=submit]'); await p.waitForTimeout(200);
    ok(lang + ' 在編輯裡把進度改到滿：算完成（沒有跳獎勵）', (await J("tasksGet().list"))[0].done > 0 && !(await vis('#rwdPop')));

    // ===== 5. 主頁上的一小列 =====
    await fresh({ level: 'b' });
    await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
    ok(lang + ' 沒有任務：主頁上方什麼都沒有', (await p.locator('#questHost').innerText()).trim() === '' && (await p.locator('#questCard').count()) === 0);
    await E("taskAdd('" + T('主頁小列', 'Home bar') + "', 2); renderToday(); 1"); await p.waitForTimeout(200);
    ok(lang + ' 有任務：主頁顯示第一個未完成的任務和 0 / 2', await vis('#questCard') && (await p.locator('#questCard').innerText()).includes(T('主頁小列', 'Home bar')) && (await p.locator('#questCard').innerText()).includes('0 / 2'));
    await p.click('#questCard'); await p.waitForTimeout(300);
    ok(lang + ' 點下去到成就頁', await vis('#view-ach'));
    await p.locator('#achBody .achchk').first().click(); await p.waitForTimeout(200);
    await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
    ok(lang + ' 做了一次：主頁小列跟著變成 1 / 2', (await p.locator('#questCard').innerText()).includes('1 / 2'));

    // ===== 6. 學習紀錄：往下一個里程碑的進度條 =====
    await fresh({ level: 'b', ls: { 'thai-read': { a: 1, b: 2, c: 3, d: 4 }, 'thai-days': ['2026-11-11', '2026-11-12', '2026-11-13'] } });
    await addCards(7, false); await addCards(3, true); await E("renderAchTab(); 1");
    await goAch();
    const bars = await p.$$eval('.recsec .achrec', a => a.map(r => [r.querySelector('.achrl').textContent.trim(), r.querySelector('.achrv').textContent.trim(), r.querySelector('.lqnum').textContent.trim(), r.querySelector('[role=progressbar]').getAttribute('aria-valuenow')]));
    ok(lang + ' 讀過 4 篇 → 下一個 5', bars[0][1] === '4' && bars[0][2] === '4 / 5', JSON.stringify(bars[0]));
    ok(lang + ' 存下 10 個 → 下一個 20；記熟 3 個 → 下一個 5', bars[1][1] === '10' && bars[1][2] === '10 / 20' && bars[2][1] === '3' && bars[2][2] === '3 / 5', JSON.stringify(bars.slice(1, 3)));
    ok(lang + ' 六條進度條（文章、生字、記熟、複習、天數、本週）', bars.length === 6, bars.map(x => x[0]).join('|'));
    ok(lang + ' 進度條有無障礙數值', bars.every(x => x[3] !== null));
    const w4 = await p.$eval('.recsec .achrec .lqbar > span', e => e.style.width);
    ok(lang + ' 4/5 的進度條寬 80%', w4 === '80%', w4);
    await p.locator('.recsec .lqgoal .seg button').nth(3).click(); await p.waitForTimeout(150);
    ok(lang + ' 每週目標改 6 天：本週進度條跟著變', (await p.locator('.recsec .achrec').last().locator('.lqnum').innerText()).includes('/ 6'));

    // ===== 7. 成長圖 =====
    const days = []; for (let i = 20; i >= 1; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()); }
    const hist = { d: {}, c: {} }; days.forEach((k, i) => { hist.d[k] = { k: Math.floor(i / 2), s: i % 3 === 0 ? 0 : 600 + i * 30, w: 100 }; });
    await fresh({ level: 'b', ls: { 'thai-hist': hist } });
    await addCards(12, true);
    await goAch();
    const k0 = await J("histSeries('k')");
    ok(lang + ' 記熟序列：30 天', k0.vals.length === 30);
    ok(lang + ' 序列最後一天 = 目前記熟數', k0.vals[29] === (await E('knownCount()')), JSON.stringify(k0.vals.slice(-3)));
    ok(lang + ' 預設畫折線：有線、有最後一個點', (await p.locator('.achplot .achline').count()) === 1 && (await p.locator('.achplot .achdot').count()) === 1);
    ok(lang + ' 有變化：大數字旁寫「最近一個月 +N」', (await J("histSeries('k').vals.filter(function(v){return v!=null})")).length < 2 || (await p.locator('.achdelta').count()) === 1);
    await p.locator('.achmet button').nth(1).click(); await p.waitForTimeout(150);
    const nb = await p.locator('.achplot .achbar').count();
    ok(lang + ' 切到「學習分鐘」：畫長條（只畫有學的天）', nb >= 10 && nb <= 20, nb);
    await p.locator('.achmet button').nth(2).click(); await p.waitForTimeout(150);
    const wv = await J("histSeries('w').vals");
    ok(lang + ' 切到「讀過的字數」：累計（單調增加）', wv.every((v, i) => i === 0 || v >= wv[i - 1]) && wv[29] >= 2000, JSON.stringify(wv.slice(-2)));
    await p.screenshot({ path: 'shots/v31-growth-' + lang + '.png', fullPage: true });
    await fresh({ level: 'b' }); await goAch();
    ok(lang + ' 沒有紀錄：圖是空的，有一句提示（不是壞掉）', (await p.locator('.achhint').count()) === 1);

    // ===== 8. 學習時間、讀過的字數 =====
    await fresh({ level: 'b' });
    await E("act.acc = 130; flushTime(); 1");
    let h = await LS('thai-hist'); const tk = await E('dayKey()');
    ok(lang + ' 累積 130 秒：寫進今天的紀錄', h.d[tk] && h.d[tk].s === 130, JSON.stringify(h.d[tk]));
    ok(lang + ' 計時：畫面開著＋最近一分鐘有操作才算（閒置不算）', await p.evaluate(() => window.__ev("(function(){var a=act.acc;act.last=Date.now()-120000;timeTick();var b=act.acc;act.last=Date.now();timeTick();return b===a && act.acc===a+5})()")));
    await E("var d=lib.docs.filter(function(x){return x.type==='text'})[0]; openDoc(d.id); 1"); await p.waitForTimeout(500);
    h = await LS('thai-hist');
    const ids = Object.keys(h.c);
    ok(lang + ' 打開文字文件：算一次字數，今天的 w 增加', ids.length === 1 && h.c[ids[0]] > 3 && h.d[tk].w === h.c[ids[0]], JSON.stringify([h.c, h.d[tk].w]));
    await E("openDoc(lib.docs.filter(function(x){return x.type==='text'})[0].id); 1"); await p.waitForTimeout(300);
    ok(lang + ' 同一份再開：不重複算', (await LS('thai-hist')).d[tk].w === h.d[tk].w);

    // ===== 9. 小火苗 =====
    await fresh({ level: 'b', loud: true });
    await addCards(4, false); await p.waitForTimeout(700);
    ok(lang + ' 存 4 張：沒有火苗', !(await vis('#flame')));
    await addCards(1, false); await p.waitForTimeout(900);
    ok(lang + ' 存滿 5 張：出現小火苗（小的、只有圖示）', await vis('#flame') && !(await p.locator('#flame').getAttribute('class')).includes('big') && (await p.locator('#flame .flic svg').count()) === 1);
    ok(lang + ' 小火苗畫面上沒有寫條件（不提到 5 張）', !/5/.test(await p.locator('#flame').innerText()));
    await p.screenshot({ path: 'shots/v31-flame-' + lang + '.png' });
    if (lang === 'en') { ok('en 小火苗沒有中文', !ZH.test(await p.locator('#flame').innerText())); }
    await p.click('#flame'); await p.waitForTimeout(150);
    ok(lang + ' 點一下就收起', !(await vis('#flame')));
    await addCards(1, false); await p.waitForTimeout(900);
    ok(lang + ' 同一天不會再為「存 5 張」冒火苗', !(await vis('#flame')));
    let fl = await LS('thai-flame');
    ok(lang + ' 記下今天已經給過', fl.done.includes('s5'), JSON.stringify(fl.done));
    await p.reload(); await p.waitForTimeout(2000);
    ok(lang + ' 重新打開：不會補冒火苗', !(await vis('#flame')));
    // 記憶保衛戰：今天到期的卡都複習完
    await fresh({ level: 'b', loud: true });
    await E("(function(){var c={id:'rv1',w:'ทบทวน',rom:'',pos:'',zh:'複習',en:'rev',sent:'',src:'',page:0,added:Date.now()-9e8,box:1,due:today0()-864e5,seen:0,right:0,folder:''};srsInit(c);cards.push(c);saveCards();})()");
    await p.waitForTimeout(900);
    ok(lang + ' 有一張到期還沒複習：沒有火苗', !(await vis('#flame')));
    await E("(function(){var c=cards.filter(function(x){return x.id==='rv1'})[0];c.last=Date.now();c.due=today0()+864e5;saveCards();})()"); await p.waitForTimeout(900);
    ok(lang + ' 到期的卡複習完：小火苗（記憶保衛戰）', await vis('#flame') && (await LS('thai-flame')).done.includes('rv'));
    await p.click('#flame');
    // 學習 10 分鐘
    await E("act.acc = 650; flameCheck(false); 1"); await p.waitForTimeout(500);
    ok(lang + ' 學滿 10 分鐘：小火苗', await vis('#flame') && (await LS('thai-flame')).done.includes('m10'));
    await p.click('#flame');
    // 關掉小火苗
    await p.evaluate(() => localStorage.setItem('thai-rwd', JSON.stringify({ flame: 0 })));
    await E("act.acc = 1300; flameCheck(false); 1"); await p.waitForTimeout(500);
    ok(lang + ' 設定關掉小火苗：不冒（但記下已達成）', !(await vis('#flame')) && (await LS('thai-flame')).done.includes('m30'));

    // ===== 10. 記熟里程碑、連續學習：大一點的小火苗 =====
    await fresh({ level: 'b', loud: true });
    await addCards(5, true); await p.waitForTimeout(1000);
    ok(lang + ' 記熟 5 個：大一點的小火苗', await vis('#flame') && (await p.locator('#flame').getAttribute('class')).includes('big'));
    await p.waitForTimeout(3300);
    ok(lang + ' 記下已經給過（k5），之後不會重複', !(await vis('#flame')) && (await LS('thai-flame')).once.includes('k5'));
    await E("flameCheck(false); 1"); await p.waitForTimeout(600);
    ok(lang + ' 再檢查一次：不重複冒', !(await vis('#flame')));
    await p.reload(); await p.waitForTimeout(2000);
    ok(lang + ' 重新打開：不會補發', !(await vis('#flame')));
    const d3 = []; for (let i = 2; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); d3.push(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()); }
    await E("localStorage.setItem('thai-days', '" + JSON.stringify(d3) + "'); flameCheck(false); 1"); await p.waitForTimeout(700);
    ok(lang + ' 連續學習 3 天：大一點的小火苗', await vis('#flame') && (await p.locator('#flame').getAttribute('class')).includes('big') && (await LS('thai-flame')).once.includes('d3'));
    await p.click('#flame');
    // 第一次（升級後）不補發：已經有的里程碑靜靜記下
    await fresh({ level: 'b', loud: true });
    await addCards(12, true); await p.waitForTimeout(800); await p.click('#flame').catch(() => {}); await p.waitForTimeout(300);
    await p.evaluate(() => { localStorage.removeItem('thai-flame'); });
    await p.reload(); await p.waitForTimeout(2200);
    ok(lang + ' 沒有紀錄的舊使用者：已經達成的里程碑不會一次噴出來', !(await vis('#flame')) && (await LS('thai-flame')).once.includes('k10'));

    // ===== 11. 減少動態效果、設定 =====
    await fresh({ level: 'b', loud: true });
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await E("taskAdd('x', 1); 1"); await goAch();
    await p.locator('#achBody .achchk').first().click(); await p.waitForTimeout(400);
    ok(lang + ' 手機開了「減少動態效果」：小火苗是靜態的（還是會出現）', await vis('#flame') && (await p.locator('#flame').getAttribute('class')).includes('still') && (await p.locator('#flame .flic svg').evaluate(e => getComputedStyle(e).animationName)) === 'none');
    await p.click('#flame'); await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.locator('.achset > summary').click(); await p.waitForTimeout(150);
    const sets = await p.locator('.achset .lqgoal').count();
    await p.locator('.achset .lqgoal').nth(1).locator('button').nth(1).click(); await p.waitForTimeout(100);
    ok(lang + ' 小火苗設定兩項：小火苗、動畫；改了會存起來', sets === 2 && (await LS('thai-rwd')).anim === 0, JSON.stringify(await LS('thai-rwd')));
    await E("taskAdd('y', 1); renderAchTab(); 1");
    await p.locator('#achBody .achchk').first().click(); await p.waitForTimeout(400);
    ok(lang + ' 動畫關掉：小火苗靜態', (await p.locator('#flame').getAttribute('class')).includes('still'));
    await p.click('#flame');
    await p.locator('.achset > summary').click().catch(() => {});
    await p.evaluate(() => localStorage.setItem('thai-rwd', JSON.stringify({ flame: 0 })));
    await E("taskAdd('z', 1); renderAchTab(); 1");
    await p.locator('#achBody .achchk').first().click(); await p.waitForTimeout(500);
    ok(lang + ' 關掉小火苗：任務完成也不冒', !(await vis('#flame')));

    // ===== 12. 舊的目標變成一個任務 =====
    await fresh({ level: 'c', ls: { 'thai-goal': { g: 'c_news', m: 10, l0: 'c', t0: Date.now() - 5e8, b: { rev: 0 }, p: { a: 1, b: 2 }, bt: {} }, 'thai-map-seen': 2, 'thai-goal-done': { x: 1 }, 'thai-map-visit': 1, 'thai-goal-skip': 1 } });
    let tk2 = await J("tasksGet().list");
    ok(lang + ' 舊目標「看懂新聞」→ 一個任務，進度 2 / 6 保留', tk2.length === 1 && tk2[0].t === '看懂新聞' && tk2[0].n === 6 && tk2[0].c === 2 && !tk2[0].done, JSON.stringify(tk2));
    const old = await p.evaluate(() => ['thai-goal', 'thai-map-seen', 'thai-goal-skip', 'thai-goal-done', 'thai-map-visit'].map(k => localStorage.getItem(k)));
    ok(lang + ' 舊的地圖資料清掉了', old.every(x => x === null), JSON.stringify(old));
    await p.reload(); await p.waitForTimeout(1300);
    ok(lang + ' 再重新載入：不會再轉一次', (await J("tasksGet().list")).length === 1);
    await fresh({ level: 'b', ls: { 'thai-goal': { g: 'up', m: 10, l0: 'b', t0: Date.now() - 5e8, p: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 } } } });
    tk2 = await J("tasksGet().list");
    ok(lang + ' 「升到下一級」全部做完 → 轉成已完成的任務', tk2.length === 1 && tk2[0].t === '升到「中級」' && tk2[0].done > 0, JSON.stringify(tk2));
    await fresh({ level: 'b', ls: { 'thai-goal': { g: 'free', m: 10, l0: 'b', t0: 1 } } });
    ok(lang + ' 「先不設目標」：不產生任務', (await J("tasksGet().list")).length === 0);

    // ===== 13. 備份與同步清單 =====
    ok(lang + ' 備份清單、同步清單、安靜清單都有新的四個項目', await E("['thai-tasks','thai-flame','thai-hist','thai-rwd'].every(function(k){return SETTING_KEYS.indexOf(k)>=0 && SYNC_SET.indexOf(k)>=0 && SYNC_QUIET.indexOf(k)>=0})"));

    // ===== 14. 歡迎精靈：只剩三步 =====
    await fresh({ level: 'a' });
    await E("openWelcome(); 1"); await p.waitForTimeout(250);
    ok(lang + ' 歡迎：三個圓點', (await p.locator('#wzDots .wzdot').count()) === 3);
    ok(lang + ' 第一頁第四點不再說「排學習路線」', !(await p.locator('#wzBody').innerText()).includes(T('學習路線', 'learning route')));
    await p.click('#wNext'); await p.waitForTimeout(120); await p.click('#wNext'); await p.waitForTimeout(150);
    ok(lang + ' 第三頁是選程度，也是最後一頁（只有開始使用）', (await p.locator('#wzBody .wzopt').count()) === 4 && await vis('#wDone') && !(await vis('#wNext')) && !(await vis('#wSkip')));
    await p.click('#wzBody .wzopt >> nth=0'); await p.waitForTimeout(100);
    await p.click('#wDone'); await p.waitForTimeout(400);
    ok(lang + ' 按開始使用：關掉歡迎；入門第一次會打開聲調模式', !(await vis('#welcome')) && (await E("toneMode")) === true);
    if (lang === 'en') { await E("openWelcome(); 1"); await p.waitForTimeout(200); ok('en 歡迎第一頁沒有中文', !ZH.test(await p.locator('#welcome').innerText()), await p.locator('#welcome').innerText()); await E("closeWelcome(); 1"); }

    // ===== 15. 英文：成就頁沒有中文殘留 =====
    if (lang === 'en') {
      await fresh({ level: 'c' });
      await E("taskAdd('Read news', 3); taskAdd('Done one', 1); var o=tasksGet(); o.list[1].done=Date.now(); o.list[1].c=1; tasksSave(o); 1");
      await goAch(); await p.locator('.achset > summary').click();
      const txt = await p.locator('#view-ach').innerText();
      ok('en 成就頁：沒有中文殘留', !ZH.test(txt), (txt.match(/.*[㐀-鿿].*/g) || []).join(' | '));
      const aria = await p.$$eval('#view-ach [aria-label], #view-ach [placeholder]', a => a.map(x => (x.getAttribute('aria-label') || '') + (x.getAttribute('placeholder') || '')));
      ok('en 成就頁的 aria-label／提示文字沒有中文', aria.every(x => !ZH.test(x)), aria.filter(x => ZH.test(x)).join('|'));
      ok('en 分頁列沒有中文', !ZH.test(await p.locator('.tabbar').innerText()));
    }
    ok(lang + ' 沒有程式錯誤', errs.length === 0, errs.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(fails ? 'FAILS: ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
