// 1.37：字母與拼讀練習、方言、流行語、句型庫第五批、讀物庫新增
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async (lv) => { await p.evaluate(([l, lv]) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-level', lv); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, [lang, lv]); await p.reload(); await p.waitForTimeout(1300); for (let i = 0; i < 30 && !(await p.evaluate(() => window.__ev('dict2.ready'))); i++) { await p.waitForTimeout(200); } };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));
    const quizTab = async () => { await E("showTab('cards'); cardTab = 'quiz'; renderCards(); 1"); await p.waitForTimeout(250); };
    // ---- 字母與拼讀練習 ----
    await fresh('b'); await quizTab();
    ok(lang + ' 程度是初級：沒有字母練習', (await p.locator('.abcsec').count()) === 0);
    await fresh('a'); await quizTab();
    ok(lang + ' 程度是入門：測驗分頁最上面有「字母與拼讀練習」', (await p.locator('.abcsec').count()) === 1 && (await p.locator('.abcsec .abch').innerText()).trim() === T('字母與拼讀練習', 'Alphabet and reading practice'));
    ok(lang + ' 沒有生字卡也能練', (await E('cards.length')) === 0 && await p.locator('.abcsec .primary').isVisible());
    const types = await p.locator('.abcsec .qtypes button').allTextContents();
    ok(lang + ' 四種練習：子音、母音、拼讀、聽音選字', types.join() === T('子音,母音,拼讀,聽音選字', 'Consonants,Vowels,Blending,Listen and choose'), types.join());
    if (lang === 'en') { ok('en 練習入口沒有中文', !ZH.test(await p.locator('.abcsec').innerText()), await p.locator('.abcsec').innerText()); }
    await p.screenshot({ path: 'shots/v37-abc-' + lang + '.png' });
    for (const [ti, name] of [[0, '子音'], [1, '母音'], [2, '拼讀'], [3, '聽音選字']]) {
      await p.locator('.abcsec .qtypes button').nth(ti).click(); await p.waitForTimeout(120);
      await p.locator('.abcsec .btns .primary').click(); await p.waitForTimeout(200);
      const Q = await J('abc.q.qs.map(function (q) { return { show: q.show, ans: q.ans, opts: q.opts, listen: !!q.listen }; })');
      ok(lang + ' ' + name + '：10 題，每題 4 個選項、答案在裡面、選項不重複', Q.length === 10 && Q.every(q => q.opts.length === 4 && q.opts.includes(q.ans) && new Set(q.opts).size === 4), JSON.stringify(Q[0]));
      if (ti === 0) { ok(lang + ' 子音預設只出常用的（不出 ฃ ฅ ฆ ฌ 等）', Q.every(q => !'ฃฅฆฌฎฏฐฑฒษฬ'.includes(q.show)), Q.map(q => q.show).join('')); await p.screenshot({ path: 'shots/v37-abcq-' + lang + '.png' }); }
      if (ti === 2) { ok(lang + ' 拼讀：題目是音節、選項是拼音', Q.every(q => /^[ก-๎]{2}$/.test(q.show) && /^[a-z]+$/.test(q.ans)), Q[0].show + '=' + Q[0].ans); }
      if (ti === 3) { ok(lang + ' 聽音選字：不顯示題目文字，選項是泰文音節', Q.every(q => q.listen && /^[ก-๎]{2}$/.test(q.ans)) && (await p.locator('.abccard .qlisten').count()) === 1); }
      // 第一題故意答錯，其餘答對
      for (let k = 0; k < 10; k++) {
        const q = Q[k], pick = k === 0 ? q.opts.find(o => o !== q.ans) : q.ans;
        await p.locator('.abcsec .qopt', { hasText: new RegExp('^' + pick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click(); await p.waitForTimeout(60);
        if (k === 0) {
          ok(lang + ' ' + name + '：答錯會標出正確答案和說明', (await p.locator('.abcsec .qopt.ok').count()) === 1 && (await p.locator('.abcsec .qopt.bad').count()) === 1 && (await p.locator('.abcafter').innerText()).length > 3, await p.locator('.abcafter').innerText());
          if (lang === 'en') { ok('en ' + name + ' 題目畫面沒有中文', !ZH.test(await p.locator('.abcsec').innerText()), await p.locator('.abcsec').innerText()); }
          ok(lang + ' ' + name + '：做題時下面不顯示生字卡測驗', (await p.locator('#cardsBody .qtypes').count()) === 0);
        }
        await p.locator('.abcsec .btns .primary').click(); await p.waitForTimeout(60);
      }
      ok(lang + ' ' + name + '：結果 9 / 10，列出答錯的那一個', (await p.locator('.abcsec .qscore').innerText()).trim() === '9 / 10' && (await p.locator('.abcsec .qwrong li').count()) === 1);
      await p.locator('.abcsec .btns button').nth(1).click(); await p.waitForTimeout(150);
    }
    const st = await J("lsGetJ('thai-abc', {})");
    ok(lang + ' 答題紀錄有存（之後答錯的比較常出）', Object.keys(st).length >= 30 && Object.values(st).some(a => a[0] === 0 && a[1] === 1), Object.keys(st).length);
    ok(lang + ' 紀錄會備份、同步，而且同步時不重新載入', (await E("SETTING_KEYS.indexOf('thai-abc') >= 0 && SYNC_SET.indexOf('thai-abc') >= 0 && SYNC_QUIET.indexOf('thai-abc') >= 0")) === true);
    await p.locator('.abcsec .qtypes button').nth(0).click(); await p.waitForTimeout(100);
    await p.locator('.abcall input').check(); await p.locator('.abcsec .btns .primary').click(); await p.waitForTimeout(150);
    ok(lang + ' 勾「包含少用的字母」：44 個都可能出', (await E('abc.all')) === true && (await J('abc.q.qs')).length === 10);
    await E("abc.q = null; renderCards(); 1");
    ok(lang + ' 44 個子音、資料完整', (await E("ABC_C.length")) === 44 && (await E("ABC_C.every(function (c) { return c[0] && c[1] && c[2] && c[3] && c[6]; })")) === true && (await E("ABC_V.length")) >= 20);

    // ---- 方言、流行語 ----
    const ent = async w => await J("DICT[" + JSON.stringify(w) + "] || null");
    const zhs = e => (e || []).map(x => (x[4] || [])[0] || '').join(' / ');
    ok(lang + ' 東北話查得到（เว้า、อีหลี、คึดฮอด、ม่วน）', zhs(await ent('เว้า')).includes('東北話') && zhs(await ent('อีหลี')).includes('真的') && zhs(await ent('คึดฮอด')).includes('想念') && zhs(await ent('ม่วน')).includes('好玩'), zhs(await ent('เว้า')));
    ok(lang + ' 北部話查得到（อู้、ลำแต๊ๆ、ละอ่อน）', zhs(await ent('อู้')).includes('北部話') && zhs(await ent('ลำแต๊ๆ')).includes('好吃') && zhs(await ent('ละอ่อน')).includes('小孩'));
    ok(lang + ' 南部話查得到（หรอย、แหลง、พรือ）', zhs(await ent('หรอย')).includes('南部話') && zhs(await ent('แหลง')).includes('說') && zhs(await ent('พรือ')).includes('怎麼'));
    const bo = await ent('บ่'), lai = await ent('หลาย');
    ok(lang + ' 字典原本就有的字：方言的意思是另外加上去的，原本的還在', bo.length >= 2 && zhs(bo).includes('東北話') && lai.length >= 2 && zhs(lai).includes('東北話') && zhs(lai) !== zhs([lai[lai.length - 1]]), zhs(lai).slice(0, 80));
    ok(lang + ' 流行語查得到（จึ้ง、ป้ายยา、เกินต้าน、โป๊ะแตก、ตัวตึง）', zhs(await ent('จึ้ง')).length > 1 && zhs(await ent('ป้ายยา')).length > 1 && zhs(await ent('เกินต้าน')).includes('擋不住') && zhs(await ent('โป๊ะแตก')).includes('穿幫') && zhs(await ent('ตัวตึง')).includes('狠角色'), zhs(await ent('จึ้ง')) + ' | ' + zhs(await ent('ป้ายยา')));
    ok(lang + ' 英文解釋也有（(Isan)、(slang)）', (await ent('เว้า')).some(e => (e[3][0] || '').includes('(Isan)')) && (await ent('เกินต้าน')).some(e => (e[3][0] || '').includes('(slang)')));
    const sg = async t => (await J("segment(" + JSON.stringify(t) + ").filter(function(s){return s.w}).map(function(s){return s.t})")).join('|');
    ok(lang + ' 斷詞：方言句子切得出詞', (await sg('เจ้าไปไสมา กินเข่าแล้วบ่')).includes('ไปไส') && (await sg('เจ้าไปไสมา กินเข่าแล้วบ่')).includes('กินเข่า'), await sg('เจ้าไปไสมา กินเข่าแล้วบ่'));

    // ---- 句型庫、讀物庫 ----
    const g = await J("window.GRAMMAR.map(function (x) { return [x.id, x.lv]; })");
    ok(lang + ' 句型庫：289 個（多 28 個：中級 14、高級 14），代號不重複', g.length === 289 && new Set(g.map(x => x[0])).size === 289 && g.filter(x => x[1] === 'c').length === 126 && g.filter(x => x[1] === 'd').length === 61, g.length);
    ok(lang + ' 新句型資料完整（名稱、說明、兩個例句）', (await E("['haak','thanthi-thi','mii-naeonom','nai-korani-thi','taam-maa-duai'].every(function (id) { var x = window.GRAMMAR.filter(function (y) { return y.id === id; })[0]; return x && x.name && x.use && x.ex.length === 2 && x.m.words.length; })")) === true);
    const rd = await p.evaluate(async () => (await (await fetch('reader.json')).json()).map(x => [x.id, x.lv, x.n]));
    ok(lang + ' 讀物庫：36 篇（多 10 篇：入門 2、初級 3、中級 3、高級 2）', rd.length === 36 && ['a7', 'a8', 'b9', 'b10', 'b11', 'c7', 'c8', 'c9', 'd7', 'd8'].every(id => rd.some(x => x[0] === id)), rd.length);
    ok(lang + ' 沒有程式錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
