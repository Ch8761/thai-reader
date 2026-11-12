// 1.29：目標清單（依程度）、舊目標對應、程度改了的提示、指定短文、生字卡分頁
const { chromium } = require('playwright');
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const READER = JSON.parse(fs.readFileSync(__dirname + '/../reader.json', 'utf8'));
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async (extra) => {
      await p.evaluate(([l, ex]) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); Object.keys(ex || {}).forEach(k => localStorage.setItem(k, ex[k])); }, [lang, extra]);
      await p.reload(); await p.waitForTimeout(1300);
    };
    await fresh();
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));

    // ===== H. 依程度給目標 =====
    const lists = {}; for (const lv of ['a', 'b', 'c', 'd']) { lists[lv] = await J("goalsFor('" + lv + "').map(function(o){return o.id})"); }
    ok(lang + ' 入門：打好基礎／看懂菜單／升級／先不設', lists.a.join() === 'a_base,a_eat,up,free', lists.a.join());
    ok(lang + ' 初級：升級／旅行／生活資訊／先不設', lists.b.join() === 'up,b_travel,b_life,free', lists.b.join());
    ok(lang + ' 中級：升級／新聞／社群口語／先不設', lists.c.join() === 'up,c_news,c_social,free', lists.c.join());
    ok(lang + ' 高級：新聞評論／公告公文／文學歷史／先不設（沒有「升級」）', lists.d.join() === 'd_news,d_formal,d_lit,free', lists.d.join());
    const all = [].concat(...['a', 'b', 'c', 'd'].map(l => lists[l].filter(x => x !== 'free' && x !== 'up')));
    ok(lang + ' 每一級各自的目標都不重複', new Set(all).size === all.length);
    ok(lang + ' 「全部」程度當高級、不認得的程度當初級', (await J("(function(){ level='all'; var a = goalsFor(lv4()).map(function(o){return o.id}).join(); level='zzz'; var b = goalsFor(lv4()).map(function(o){return o.id}).join(); level='b'; return [a,b]; })()")).join('|') === lists.d.join() + '|' + lists.b.join());
    ok(lang + ' 第一個推薦、其餘不推薦', (await J("goalsFor('c').map(function(o){return o.rec})")).join() === 'true,false,false,false');
    // 資料完整：讀物庫編號都存在、魔王關存在、每個目標排得出關卡
    const cat = await J("GOAL_CATALOG");
    const rid = new Set(READER.map(x => x.id)); let bad = [];
    Object.keys(cat.goals).forEach(g => (cat.goals[g].stages || []).forEach(sp => { (sp.ids || []).forEach(i => { if (!rid.has(i)) bad.push(g + ':' + i); }); }));
    ok(lang + ' 指定短文的編號在讀物庫裡都找得到', bad.length === 0, bad.join());
    const bossKeys = await J("Object.keys(BOSS)"); let badBoss = [];
    Object.keys(cat.goals).forEach(g => (cat.goals[g].stages || []).forEach(sp => { if (sp.k === 'boss') { (typeof sp.boss === 'string' ? [sp.boss] : Object.values(sp.boss)).forEach(k => { if (!bossKeys.includes(k)) badBoss.push(g + ':' + k); }); } }));
    ok(lang + ' 魔王關的代號都存在', badBoss.length === 0, badBoss.join());
    const sizes = await J("(function(){ var o = {}; ['a','b','c','d'].forEach(function(lv){ goalIds(lv).forEach(function(g){ if (g==='free') return; o[lv+':'+g] = mapStages({g:g}, lv).length; }); }); return o; })()");
    ok(lang + ' 每個目標每個程度都排得出 4～7 關', Object.values(sizes).every(n => n >= 4 && n <= 7), JSON.stringify(sizes));
    ok(lang + ' 只有入門有聲調關', (await J("['a','b','c','d'].map(function(lv){ return mapStages({g:'up'}, lv).some(function(s){return s.k==='tone'}) })")).join() === 'true,false,false,false');
    ok(lang + ' 高級沒有「升級」：就算硬排也不會多一個下一級的關', (await J("mapStages({g:'up'}, 'd').filter(function(s){return s.k==='read'}).length")) === 1);
    ok(lang + ' 沒有魔王關的目標（打好基礎、文學歷史）不會硬塞一個', (await J("[mapStages({g:'a_base'},'a'), mapStages({g:'d_lit'},'d')].map(function(x){return x.some(function(s){return s.k==='boss'})})")).join() === 'false,false');
    // 完成過的排後面
    await E("lsSetJ('thai-goal-done', {'a_base:a': 1}); 1");
    ok(lang + ' 完成過的目標往後排並標記，推薦換下一個', (await J("goalsFor('a').map(function(o){return o.id + (o.rec?'*':'') + (o.finished?'!':'')}).join()")) === 'a_eat*,up,a_base!,free');

    // ===== I. 1.28 的舊目標代號自動對應 =====
    const mig = async (g, l0) => { await E("lsSetJ('thai-goal', {g:'" + g + "', m:10, l0:'" + l0 + "', t0:" + Date.now() + ", b:{}, p:{}, bt:{}}); level='" + l0 + "'; goalGet().g"); return await E("goalGet().g"); };
    ok(lang + ' 舊目標對應：入門「看懂菜單」→ a_eat', (await mig('menu', 'a')) === 'a_eat');
    ok(lang + ' 舊目標對應：初級「社群貼文」→ b_travel', (await mig('social', 'b')) === 'b_travel');
    ok(lang + ' 舊目標對應：中級「新聞」→ c_news', (await mig('news', 'c')) === 'c_news');
    ok(lang + ' 舊目標對應：高級「新聞」→ d_news', (await mig('news', 'd')) === 'd_news');
    ok(lang + ' 舊目標對應：初級「菜單」沒有對應 → 第一個（升級）', (await mig('menu', 'b')) === 'up');
    ok(lang + ' 舊目標「升到下一級」不變', (await mig('up', 'c')) === 'up');

    // ===== J. 地圖分頁：指定短文、程度改了 =====
    await fresh();
    await E("level='b'; goalSave('b_travel', 10); showTab('map'); 1"); await p.waitForTimeout(500);
    ok(lang + ' 地圖第 1 關：讀 2 篇「旅行」短文，下面有 3 個短文按鈕', (await p.locator('#mapBody .lqcur .mapchip').count()) === 3 && (await p.locator('#mapBody .lqcur .lqpt').innerText()).includes(T('旅行', 'Travel')));
    await p.waitForTimeout(600);
    ok(lang + ' 短文按鈕顯示篇名（讀物庫載入後）', (await p.locator('#mapBody .lqcur .mapchip').allTextContents()).join('|').includes(T('搭捷運', 'นั่งรถไฟฟ้า')));
    await p.screenshot({ path: 'shots/v29-chips-' + lang + '.png' });
    await p.locator('#mapBody .lqcur .mapchip').first().click(); await p.waitForTimeout(1500);
    ok(lang + ' 點短文按鈕：打開那一篇（b1 搭捷運）', (await J("lib.docs.filter(function(d){return d.lib==='b1'}).length")) === 1 && (await E("curTab")) === 'doc');
    await E("showTab('map'); 1"); await p.waitForTimeout(500);
    ok(lang + ' 讀過的那篇打勾、進度 1 / 2', (await p.locator('#mapBody .lqcur .mapchip.on').count()) === 1 && (await p.locator('#mapBody .lqcur .lqnum').innerText()).includes('1 / 2'));
    await p.locator('#mapBody .lqcur .mapgo').click(); await p.waitForTimeout(1500);
    ok(lang + ' 「讀下一篇」會開還沒讀的（b3），不會重複開 b1', (await J("lib.docs.filter(function(d){return d.lib==='b3'}).length")) === 1);
    // 程度改了：提示換目標，地圖不變
    await E("showTab('map'); level='c'; localStorage.setItem('thai-level','c'); renderMapTab(); 1"); await p.waitForTimeout(300);
    ok(lang + ' 程度改成中級：這張地圖照初級不變，並提示換目標', (await J("mapState().lv")) === 'b' && (await p.locator('#mapBody .mapnote2').count()) === 1 && (await p.locator('#mapBody .mapnote2 button').count()) === 1);
    await p.screenshot({ path: 'shots/v29-stale-' + lang + '.png' });
    await p.locator('#mapBody .mapnote2 button').click(); await p.waitForTimeout(300);
    ok(lang + ' 按「換目標」：精靈打開，列出中級的目標', (await p.locator('#welcome').isVisible()) && lists.c.length === 4);
    await p.click('#wNext'); await p.waitForTimeout(150);
    ok(lang + ' 目標頁：中級的 3 個目標＋先不設，預選推薦', (await p.locator('#wzBody .wzopt').count()) === 4 && (await p.locator('#wzBody .wzopt').first().getAttribute('aria-checked')) === 'true');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    // 走完後換新目標：起點重算、完成過
    await E("(function(){ var g = lsGetJ('thai-goal',{}); var m = mapState(); g.p = g.p||{}; m.stg.forEach(function(s){ g.p[s.key] = 1; }); lsSetJ('thai-goal', g); return 1; })()");
    await E("mapState(); 1");
    ok(lang + ' 走完：記進完成過', (await J("!!lsGetJ('thai-goal-done',{})['b_travel:b']")));
    const t0 = await J("lsGetJ('thai-goal',{}).t0"); await p.waitForTimeout(30);
    await E("level='c'; goalSave('c_news', 10); 1");
    const g2 = await J("lsGetJ('thai-goal',{})");
    ok(lang + ' 走完後選新目標：起點重算、舊的過關記錄清掉', g2.t0 > t0 && Object.keys(g2.p).length === 0 && g2.g === 'c_news' && g2.l0 === 'c', JSON.stringify({ t0: g2.t0 - t0, p: g2.p, g: g2.g }));
    await E("level='c'; goalSave('c_social', 15); 1");
    const g3 = await J("lsGetJ('thai-goal',{})");
    ok(lang + ' 中途換目標：起點不變（做過的不白費）', g3.t0 === g2.t0 && g3.g === 'c_social');

    // ===== K. 主頁小列 =====
    await E("showTab('home'); 1"); await p.waitForTimeout(400);
    ok(lang + ' 主頁：有目標才有一小列、高度很小', (await p.locator('#questCard').count()) === 1 && (await p.locator('#questCard').boundingBox()).height <= 56);
    await E("localStorage.removeItem('thai-goal'); renderToday(); 1"); await p.waitForTimeout(200);
    ok(lang + ' 主頁：沒有目標就什麼都不放', (await p.locator('#questCard').count()) === 0 && (await p.locator('#questHost').evaluate(e => e.getBoundingClientRect().height)) === 0);

    // ===== L. 底部分頁 =====
    ok(lang + ' 底部分頁：主頁、文件、生字卡、地圖、設定', (await p.locator('.tabbar [data-tab]').evaluateAll(a => a.map(x => x.getAttribute('data-tab')).join())) === 'home,doc,cards,map,settings');
    await E("showTab('map'); 1"); await p.waitForTimeout(200); await E("location.reload()"); await p.waitForTimeout(1500);
    ok(lang + ' 重新開啟：回到上次的「地圖」分頁', (await E("curTab")) === 'map');

    // ===== M. 生字卡頁：分頁在上、資料夾在下 =====
    await fresh({ 'thai-tone-mode': '1' });
    await E("folders.push({id:'f1',name:'餐廳'}); cards.push({id:'c1',w:'สวัสดี',m:'x',added:Date.now(),folder:'f1',due:0}); saveCards(); showTab('cards'); renderCards(); 1"); await p.waitForTimeout(500);
    const order = await p.evaluate(() => { const a = document.getElementById('cardTabs'), f = document.getElementById('cardFolders'); return { tabsFirst: !!(a.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING), ty: a.getBoundingClientRect().top, fy: f.getBoundingClientRect().top }; });
    ok(lang + ' 生字卡：分頁在資料夾上面', order.tabsFirst && order.ty < order.fy, JSON.stringify(order));
    const tabs = (await p.locator('#cardTabs button').allTextContents()).map(x => x.replace(/\s+/g, ' ').trim());
    ok(lang + ' 生字卡：分頁＝複習、測驗、清單、聲調（沒有「全部」）', tabs.length === 4 && tabs[0].startsWith(T('複習', 'Review')) && tabs[1] === T('測驗', 'Quiz') && tabs[2].startsWith(T('清單', 'List')) && tabs[3] === T('聲調', 'Tones') && !tabs.some(x => /^(全部|All)/.test(x)), tabs.join(' | '));
    const widths = await p.locator('#cardTabs button').evaluateAll(a => a.map(x => Math.round(x.getBoundingClientRect().width)));
    ok(lang + ' 生字卡：四個分頁等寬排滿一列', Math.max(...widths) - Math.min(...widths) <= 2 && widths.every(w => w > 60), widths.join());
    ok(lang + ' 資料夾列有「資料夾」標籤、是篩選用的小標籤', (await p.locator('#cardFolders .cflab').count()) === 1);
    ok(lang + ' 三個分頁都看得到資料夾列', await p.locator('#cardFolders').isVisible());
    await p.locator('#cardTabs button').nth(1).click(); await p.waitForTimeout(150);
    ok(lang + ' 測驗頁：資料夾列還在', await p.locator('#cardFolders').isVisible());
    await p.locator('#cardTabs button').nth(2).click(); await p.waitForTimeout(150);
    ok(lang + ' 清單頁：資料夾列還在', await p.locator('#cardFolders').isVisible());
    await p.locator('#cardTabs button').nth(3).click(); await p.waitForTimeout(500);
    ok(lang + ' 聲調頁：資料夾列收起來', !(await p.locator('#cardFolders').isVisible()));
    await p.locator('#cardTabs button').nth(0).click(); await p.waitForTimeout(150);
    ok(lang + ' 回到複習：資料夾列回來', await p.locator('#cardFolders').isVisible());
    await p.locator('#cardFolders .seg button').nth(1).click(); await p.waitForTimeout(150);
    ok(lang + ' 點資料夾：只篩選，分頁不變', (await p.locator('#cardTabs [aria-checked="true"]').innerText()).startsWith(T('複習', 'Review')));
    await p.screenshot({ path: 'shots/v29-cards-' + lang + '.png' });

    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? '失敗 ' + fails : '全部通過');
})();
