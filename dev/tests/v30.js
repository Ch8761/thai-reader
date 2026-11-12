// 1.30：歡迎頁第一頁列點、略過放右上角、中高級目標改字、地圖「自己想讀的東西」
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
    ok(lang + ' 列點內容有「點一個詞」「生字卡」「一分鐘」', lis.join('|').includes(T('點一個泰文詞', 'Tap a Thai word')) && lis.join('|').includes(T('生字卡', 'flashcards')) && lis.join('|').includes(T('一分鐘', 'a minute')), lis.join('|').slice(0, 120));
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
    for (let i = 0; i < 3; i++) {
      await p.click('#wNext'); await p.waitForTimeout(150);
      const s2 = await box('#wSkip'), bk = await box('#wBack'), nx = await box('#wNext'), cd = await p.locator('#welcome .mcard').boundingBox();
      steps.push({ skipTop: s2 && s2.y - cd.y < 60, right: s2 && Math.abs((cd.x + cd.width) - (s2.x + s2.width)) < 30, far: bk && s2 && bk.y - (s2.y + s2.height) > 200, backLeft: bk && bk.x < card.x + 80, nextRight: nx && nx.x > card.x + card.width / 2 });
    }
    ok(lang + ' 第 2～4 頁：略過仍在右上角，離「上一步」很遠（超過 200px）', steps.every(x => x.skipTop && x.right && x.far), JSON.stringify(steps));
    ok(lang + ' 上一步在左下、繼續在右下', steps.every(x => x.backLeft && x.nextRight));
    await p.screenshot({ path: 'shots/v30-level-' + lang + '.png' });
    // 小測驗裡也看得到略過
    await p.click('#wBack'); await p.waitForTimeout(150);
    await p.locator('#wzBody .wzquiz').click(); await p.waitForTimeout(200);
    ok(lang + ' 小測驗：略過也在右上角', await p.locator('#wSkip').isVisible());
    await p.click('#wBack'); await p.waitForTimeout(150);
    // 地圖那一頁（最後一頁）只有「開始第一關」
    await p.click('#wNext'); await p.waitForTimeout(150); await p.click('#wNext'); await p.waitForTimeout(150); await p.click('#wNext'); await p.waitForTimeout(150);
    ok(lang + ' 最後一頁：沒有略過，只有開始鈕', !(await p.locator('#wSkip').isVisible()) && await p.locator('#wDone').isVisible());
    await E("closeWelcome(); 1");

    // ===== 3. 程度說明與目標文字 =====
    await fresh(true);
    ok(lang + ' 高級的說明刪掉「像是…」', !(await E("LV4_DESC.d")).includes('像是') && !(await E("LV4_DESC.d")).includes('皇室'), await E("LV4_DESC.d"));
    const titles = async lv => J("goalsFor('" + lv + "').map(function(o){return goalTitle(o.id, '" + lv + "') + '|' + goalSub(o.id)})");
    const tc = await titles('c'), td = await titles('d');
    ok(lang + ' 中級：沒有「看懂社群和口語」，有「可以用泰文字幕看影集電影」', !tc.join().includes('社群和口語') && tc.some(x => x.startsWith('可以用泰文字幕看影集電影')), tc.join(' ; '));
    ok(lang + ' 高級：讀懂文學作品、能讀專業文章、看懂正式公文', td.slice(0, 3).map(x => x.split('|')[0]).join() === '讀懂文學作品,能讀專業文章,看懂正式公文', td.join(' ; '));
    ok(lang + ' 高級的說明沒有「像是」「這類」', !td.join().includes('像是') && !td.join().includes('這類'));
    // 精靈裡看得到
    await E("level='c'; localStorage.setItem('thai-level','c'); wizOpen('goal'); 1"); await p.waitForTimeout(300);
    await p.click('#wNext'); await p.waitForTimeout(200);
    const wc = (await p.locator('#wzBody .wzopt .wzot b').allTextContents());
    ok(lang + ' 精靈目標頁（中級）：' + T('有字幕目標', 'has the subtitles goal'), wc.length === 4 && wc[2] === T('可以用泰文字幕看影集電影', 'Watch series and films with Thai subtitles') && !wc.join().includes(T('社群', 'social')), wc.join(' | '));
    await p.screenshot({ path: 'shots/v30-goal-c-' + lang + '.png' });
    await E("closeWelcome(); level='d'; localStorage.setItem('thai-level','d'); wizOpen('goal'); 1"); await p.waitForTimeout(300);
    await p.click('#wNext'); await p.waitForTimeout(200);
    const wd = (await p.locator('#wzBody .wzopt .wzot b').allTextContents());
    ok(lang + ' 精靈目標頁（高級）：三個新目標', wd.length === 4 && wd[0] === T('讀懂文學作品', 'Read literary works') && wd[1] === T('能讀專業文章', 'Read professional articles') && wd[2] === T('看懂正式公文', 'Read formal documents'), wd.join(' | '));
    await p.screenshot({ path: 'shots/v30-goal-d-' + lang + '.png' });
    await E("closeWelcome(); 1");

    // ===== 4. 地圖：每個目標的關卡都不一樣，第一關是「自己想讀」 =====
    const maps = await J("(function(){ var o = {}; ['a','b','c','d'].forEach(function(lv){ goalIds(lv).forEach(function(g){ if (g==='free') return; o[lv+':'+g] = mapStages({g:g}, lv).map(function(s){ return s.k + (s.src ? '/' + s.src : '') + (s.boss ? '/' + s.boss : '') + '/' + s.n; }).join(' > '); }); }); return o; })()");
    const ids = Object.keys(maps); const uniq = new Set(Object.values(maps));
    ok(lang + ' 每個目標的關卡排法都不一樣', uniq.size === ids.length, ids.length + ' 個目標 / ' + uniq.size + ' 種排法');
    ok(lang + ' 沒有一個目標的第一個「讀」關是讀物庫（up 的下一級試讀排在後面）', ids.every(k => { const st = maps[k].split(' > '); const r = st.findIndex(x => x.startsWith('read/')); const o = st.findIndex(x => x.startsWith('own/')); return r < 0 || (o >= 0 && o < r); }), '');
    ok(lang + ' 每一個目標都有「自己想讀」的關', ids.every(k => maps[k].includes('own/')));
    const keysOk = await J("(function(){ var bad = []; ['a','b','c','d'].forEach(function(lv){ goalIds(lv).forEach(function(g){ if (g==='free') return; var ks = mapStages({g:g}, lv).map(function(s){return s.key}); if (new Set(ks).size !== ks.length) bad.push(lv+g); }); }); return bad; })()");
    ok(lang + ' 同一張地圖裡的關卡代號不重複（進度才不會混在一起）', keysOk.length === 0, keysOk.join());
    const gs = await J("Object.keys(GOAL_CATALOG.goals).filter(function(g){ return g!=='free'; }).every(function(g){ var G = GOAL_CATALOG.goals[g]; return G.title && G.sub && G.stages.every(function(sp){ return sp.k !== 'own' || (sp.txt && sp.hint && sp.src); }); })");
    ok(lang + ' 每個「自己想讀」的關都有說明字和來源', gs === true);

    // ===== 5. 計算：哪些文件算 =====
    await fresh(true);
    await E("level='c'; localStorage.setItem('thai-level','c'); goalSave('c_sub', 10); 1");
    const now = Date.now();
    await E("lib.docs.push({id:'t1',name:'a',type:'text',added:Date.now(),opened:Date.now(),url:'http://x.th'}); lib.docs.push({id:'t2',name:'b',type:'text',added:Date.now(),opened:Date.now()}); lib.docs.push({id:'t3',name:'c',type:'pdf',img:true,added:Date.now(),opened:Date.now()}); 1");
    ok(lang + ' 字幕關：網址、貼上文字、照片都不算', (await J("mapState().have[0]")) === 0);
    await E("lib.docs.push({id:'t4',name:'ep1',type:'text',added:Date.now(),opened:Date.now(),sub:true}); 1");
    ok(lang + ' 字幕檔算（sub）', (await J("mapState().have[0]")) === 1 && (await J("mapState().done[0]")) === true);
    await E("lib.docs.push({id:'t5',name:'vid',type:'text',added:Date.now(),opened:Date.now(),video:true}); 1");
    ok(lang + ' 影片辨識出來的字幕也算（video）', (await J("mapState().have[2]")) === 2);
    await E("lib.docs.push({id:'t6',name:'old',type:'text',added:Date.now()-99999999,opened:Date.now()-99999999,sub:true}); 1");
    ok(lang + ' 設定目標之前就讀過的不算', (await J("mapState().have[2]")) === 2);
    // 魔王關樣本文章不算「自己想讀」
    await E("level='a'; localStorage.setItem('thai-level','a'); localStorage.removeItem('thai-goal'); lib.docs.splice(0); goalSave('a_eat', 10); 1");
    await E("bossRead('menu'); 1"); await p.waitForTimeout(1200);
    ok(lang + ' 魔王關的樣本文章不算「自己想讀」', (await J("mapState().have[1]")) === 0, await J("lib.docs.map(function(d){return d.id+':'+(d.lib||'')})"));
    await E("(function(){ try { rdClose(); } catch (e) {} try { showTab('home'); } catch (e) {} return 1; })()");
    // 讀物庫的短文也算「都算」
    await E("lib.docs.push({id:'lib1',name:'m',type:'text',added:Date.now(),opened:Date.now(),lib:'a4'}); 1");
    ok(lang + ' 「都算」的關：讀物庫的短文也算', (await J("mapState().have[1]")) === 1);

    // ===== 6. 匯入字幕檔：自動標成字幕 =====
    await fresh(true);
    await E("level='c'; localStorage.setItem('thai-level','c'); goalSave('c_sub', 10); showTab('home'); 1"); await p.waitForTimeout(300);
    const srt = '1\n00:00:01,000 --> 00:00:03,000\nสวัสดีครับ วันนี้อากาศดีมาก\n\n2\n00:00:04,000 --> 00:00:06,000\nขอบคุณมากครับ\n';
    await p.setInputFiles('#anyfile', { name: 'ep1.srt', mimeType: 'text/plain', buffer: Buffer.from(srt, 'utf8') }); await p.waitForTimeout(1500);
    const d1 = await J("lib.docs.map(function(d){return {n:d.name, sub:!!d.sub, t:d.type}})");
    ok(lang + ' 匯入 .srt：字幕檔標記為字幕', d1.filter(x => x.n === 'ep1' && x.sub === true).length === 1 && d1.filter(x => x.sub).length === 1, JSON.stringify(d1));
    ok(lang + ' 字幕只留台詞（沒有時間軸）', !(await E("localStorage.getItem(PDF_DOC_PREFIX + lib.docs.filter(function(d){return d.name==='ep1'})[0].id)")).includes('-->'));
    await E("showTab('home'); 1"); await p.waitForTimeout(200);
    await p.setInputFiles('#anyfile', { name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('สวัสดีครับ', 'utf8') }); await p.waitForTimeout(1500);
    const d2 = await J("lib.docs.map(function(d){return {n:d.name, sub:!!d.sub}})");
    ok(lang + ' 匯入 .txt：不是字幕', d2.filter(x => x.n === 'note').length === 1 && d2.filter(x => x.sub).length === 1, JSON.stringify(d2));
    ok(lang + ' 字幕關：1 份字幕就過第 1 關', (await J("mapState().done[0]")) === true);

    // ===== 7. 地圖分頁：說明、按鈕、英文 =====
    await E("showTab('home'); 1");
    let zhLeft = [];
    for (const [lv, g] of [['a', 'a_base'], ['a', 'a_eat'], ['a', 'up'], ['b', 'b_travel'], ['b', 'b_life'], ['c', 'c_news'], ['c', 'c_sub'], ['d', 'd_lit'], ['d', 'd_pro'], ['d', 'd_formal']]) {
      await E("lib.docs.splice(0); localStorage.removeItem('thai-goal'); level='" + lv + "'; localStorage.setItem('thai-level','" + lv + "'); goalSave('" + g + "', 10); showTab('map'); renderMapTab(); 1"); await p.waitForTimeout(250);
      const st = await J("mapState().stg.map(function(s){return s.k})");
      // 一關一關往下看：把前面的標成完成，讓每一關都當一次「目前這一關」
      for (let i = 0; i < st.length; i++) {
        await p.waitForTimeout(100);
        const txt = await p.locator('#mapBody .mapsec').first().innerText();
        await E("showTab('home'); renderToday(true); 1"); await p.waitForTimeout(160);
        const home = await p.evaluate(() => { const t = document.getElementById('questCard'); return t ? t.innerText : ''; });
        await E("showTab('map'); renderMapTab(); 1"); await p.waitForTimeout(160);
        if (lang === 'en' && ZH.test(txt + home)) zhLeft.push(g + '#' + i + ': ' + (txt + home).split('\n').filter(l => ZH.test(l)).join(' / ').slice(0, 120));
        await E("(function(){ var g = lsGetJ('thai-goal',{}); var m = mapState(); g.p = g.p || {}; if (m.cur < m.stg.length) { g.p[m.stg[m.cur].key] = 1; } lsSetJ('thai-goal', g); renderMapTab(); return 1; })()"); await p.waitForTimeout(80);
      }
    }
    if (lang === 'en') { ok('en 每個目標的每一關：地圖和主頁小列都沒有中文殘留', zhLeft.length === 0, zhLeft.slice(0, 5).join(' || ')); }
    // 按鈕
    await E("lib.docs.splice(0); localStorage.removeItem('thai-goal'); level='b'; localStorage.setItem('thai-level','b'); goalSave('b_travel', 10); showTab('map'); renderMapTab(); 1"); await p.waitForTimeout(300);
    const fc = p.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    await p.locator('#mapBody .lqcur .mapown button').first().click();
    ok(lang + ' 「匯入」：跳到主頁並打開選檔視窗', !!(await fc) && (await E("curTab")) === 'home');
    await E("showTab('map'); renderMapTab(); 1"); await p.waitForTimeout(200);
    await p.locator('#mapBody .lqcur .mapown button').nth(1).click(); await p.waitForTimeout(250);
    ok(lang + ' 「貼上網址」：跳到主頁，游標在網址列', (await E("curTab")) === 'home' && (await p.evaluate(() => document.activeElement && document.activeElement.id)) === 'urlInput');
    await E("lib.docs.splice(0); localStorage.removeItem('thai-goal'); level='a'; localStorage.setItem('thai-level','a'); goalSave('a_base', 10); showTab('map'); renderMapTab(); 1");
    await E("(function(){ var g = lsGetJ('thai-goal',{}); var m = mapState(); g.p = {}; g.p[m.stg[0].key] = 1; lsSetJ('thai-goal', g); renderMapTab(); return 1; })()"); await p.waitForTimeout(300);
    await p.locator('#mapBody .lqcur .mapown button').nth(1).click(); await p.waitForTimeout(300);
    ok(lang + ' 「貼上文字或網址」：打開貼上框', (await E("curTab")) === 'home' && await p.locator('#pastebox').isVisible());
    await E("showTab('map'); renderMapTab(); 1"); await p.waitForTimeout(200);
    await p.screenshot({ path: 'shots/v30-map-' + lang + '.png' });
    // 主頁小列
    await E("showTab('home'); renderToday(true); 1"); await p.waitForTimeout(300);
    const bar = (await p.locator('#questCard').innerText()).replace(/\s+/g, ' ');
    ok(lang + ' 主頁小列顯示「自己想讀」這一關和進度', bar.includes('0 / 3') && bar.includes(T('你想讀的短句或短文', 'short texts you choose')), bar);
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? '失敗 ' + fails : '全部通過');
})();
