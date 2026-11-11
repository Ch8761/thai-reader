const { chromium } = require('playwright');
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(6000); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate(l => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
    await p.reload(); await p.waitForTimeout(1300);
    const E = c => p.evaluate(c => window.__ev(c), c);
    const R = JSON.parse(fs.readFileSync('reader.json', 'utf8'));
    const pillRe = lang === 'zh' ? /^約 \d+%$/ : /^About \d+%$/;

    // 1. 讀物庫
    await p.click('#readerOpen'); await p.waitForTimeout(700);
    const pills = await p.locator('#rdList .rrpill').allTextContents();
    const nItems = await p.locator('#rdList .rditem').count();
    ok(lang + ' 讀物庫每篇都有標籤', nItems >= 6 && pills.length === nItems && pills.every(t => pillRe.test(t.trim())), nItems + ' 篇 / ' + pills.length + ' 個標籤 ' + pills.slice(0, 3).join('/'));
    ok(lang + ' 讀物庫有說明句', await p.locator('#rdNote').isVisible());
    await p.screenshot({ path: 'shots/v27-lib-' + lang + '.png' });
    const rates = await E("(function(){ return ['a','b','c','d'].map(function(l){ level = l; return rrCompute(" + JSON.stringify(R.find(r => r.lv === 'b').text) + ").rate; }).join(','); })()");
    const rr = rates.split(',').map(Number);
    ok(lang + ' 程度越高，同一篇認得率越高', rr[0] <= rr[1] && rr[1] <= rr[2] && rr[2] <= rr[3], rates);
    await E("(function(){ level='b'; return 1; })()");
    await p.keyboard.press('Escape');

    // 2. 打開文章
    const doc = R.find(r => r.lv === 'b');
    await E("(function(){ lib.docs.push({id:'text:b1',name:'b1',type:'text',size:1,added:1,opened:0,folder:''}); localStorage.setItem(PDF_DOC_PREFIX+'text:b1', JSON.stringify({text:" + JSON.stringify(doc.text) + ",src:{type:'text',id:'text:b1',name:'b1'},hl:[],strokes:[],boxes:[],nextId:1})); return 1; })()");
    await E("showTab('home'); openDoc('text:b1')"); await p.waitForTimeout(2200);
    ok(lang + ' 文章上方有認得率條', await p.locator('#rrHint').isVisible());
    const hintTx = (await p.locator('#rrHint').textContent()).replace(/\s+/g, ' ');
    ok(lang + ' 條內有標籤和幾種詞', pillRe.test((await p.locator('#rrPillHost').textContent()).trim()) && /\d+/.test(await p.locator('#rrTx').textContent()), hintTx.slice(0, 80));
    ok(lang + ' 說明預設收合', !(await p.locator('#rrMore').isVisible()));
    await p.locator('#rrMain').click(); await p.waitForTimeout(150);
    ok(lang + ' 點條會展開說明', await p.locator('#rrMore').isVisible());
    await p.screenshot({ path: 'shots/v27-doc-' + lang + '.png' });
    await p.locator('#rrX').click(); await p.waitForTimeout(150);
    ok(lang + ' ×關掉', !(await p.locator('#rrHint').isVisible()));

    // 3. 查字會降低認得率
    const before = +(await E("rrCompute(state.text).rate"));
    const picked = await E("(function(){ var N = RR_N[level], seen = {}, out = []; rrTokens(state.text).forEach(function (t) { if (rrRank[t] && rrRank[t] <= N && !seen[t] && out.length < 8) { seen[t] = 1; out.push(t); } }); return out.join(','); })()");
    for (const w of picked.split(',')) { await E("showPop({t:" + JSON.stringify(w) + ", i:0, n:" + w.length + ", w:true}); hidePop(); 1"); }
    const after = +(await E("rrCompute(state.text).rate"));
    ok(lang + ' 查了常用字之後認得率變低', after < before, before + ' → ' + after + ' (' + picked + ')');

    // 4. 記熟的生字卡讓認得率上升
    const unkWords = await E("(function(){ var N = RR_N[level], seen = {}, out = []; rrTokens(state.text).forEach(function (t) { if (!(rrRank[t] && rrRank[t] <= N) && !rrIsName(t) && !seen[t]) { seen[t] = 1; out.push(t); } }); return out.join(','); })()");
    const uw = unkWords.split(',').filter(Boolean);
    await E("(function(){ var ws = " + JSON.stringify(uw) + "; ws.forEach(function (w, i) { cards.push({id:'m' + i, w:w, rom:'', pos:'', zh:'x', en:'x', sent:'', src:'', page:0, added:1, box:5, due: Date.now() + 99 * 86400000, seen:9, right:9, last:Date.now() - 86400000, ivl:40, ease:2.5, lapses:0, fs:{s:40,d:3,t:Date.now()}, folder:''}); }); saveCards(); rrMemo = {}; rrMemoN = 0; return 1; })()");
    const up = +(await E("rrCompute(state.text).rate"));
    ok(lang + ' 記熟的生字卡讓認得率上升', up > after, after + ' → ' + up + ' (不認得的詞 ' + uw.length + ' 種)');
    await E("cards.length = 0; saveCards(); rrMemo = {}; rrMemoN = 0; 1");

    // 5. 每天複習上限
    await E("(function(){ for (var i = 0; i < 30; i++) { cards.push({id:'q' + i, w:'ก' + i, rom:'', pos:'', zh:'x', en:'x', sent:'', src:'', page:0, added:1, box:2, due:0, seen:2, right:1, last:Date.now() - 5 * 86400000, folder:''}); } saveCards(); return 1; })()");
    const n20 = +(await E("dueCards(true).length"));
    ok(lang + ' 預設上限 20', n20 === 20, n20);
    await E("localStorage.setItem('thai-rev-cap','10'); 1");
    ok(lang + ' 上限 10', +(await E("dueCards(true).length")) === 10);
    await E("localStorage.setItem('thai-rev-cap','0'); 1");
    ok(lang + ' 不限制', +(await E("dueCards(true).length")) === 30);
    await E("localStorage.setItem('thai-rev-cap','10'); 1");
    ok(lang + ' 剩下的算「明天再出現」', +(await E("revHeld()")) === 20);
    await E("showTab('cards'); cardTab='review'; renderCards(); 1"); await p.waitForTimeout(300);
    let ct = (await p.locator('#view-cards').innerText()).replace(/\s+/g, ' ');
    ok(lang + ' 複習頁顯示 10 張', /(開始複習（10 張）|Start review \(10 cards\))/.test(ct), ct.slice(0, 200));
    // 複習完 10 張
    await E("(function(){ cards.slice(0, 10).forEach(function(c){ c.last = Date.now(); c.due = today0() + 7 * 86400000; }); saveCards(); renderCards(); return 1; })()"); await p.waitForTimeout(300);
    ct = (await p.locator('#view-cards').innerText()).replace(/\s+/g, ' ');
    ok(lang + ' 完成後顯示今天份量完成', /(今天的份量完成了，還有 20 張明天再出現|Today’s batch is done; 20 cards come back tomorrow)/.test(ct), ct.slice(0, 220));
    const moreBtn = p.locator('#view-cards button', { hasText: lang === 'zh' ? '再多複習 10 張' : 'Review 10 more' });
    ok(lang + ' 有「再多複習 10 張」', (await moreBtn.count()) === 1);
    await p.screenshot({ path: 'shots/v27-held-' + lang + '.png' });
    await moreBtn.click(); await p.waitForTimeout(300);
    ok(lang + ' 按了之後多 10 張', +(await E("dueCards().length")) === 10);
    ct = (await p.locator('#view-cards').innerText()).replace(/\s+/g, ' ');
    ok(lang + ' 按鈕變成開始複習（10 張）', /(開始複習（10 張）|Start review \(10 cards\))/.test(ct), ct.slice(0, 160));
    await E("localStorage.removeItem('thai-rev-cap'); localStorage.removeItem('thai-rev-extra'); cards.length = 0; saveCards(); 1");

    // 6. 設定
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
    await E("settingsOpen('read'); 1"); await p.waitForTimeout(300);
    const capBtns = (await p.locator('#revCapGroup button').allTextContents()).join('|');
    ok(lang + ' 上限有 5 個選項', (await p.locator('#revCapGroup button').count()) === 5, capBtns);
    ok(lang + ' 預設選 20', (await p.locator('#revCapGroup button[aria-pressed="true"], #revCapGroup button[aria-checked="true"]').first().textContent()).trim() === (lang === 'zh' ? '20 張' : '20 cards'));
    await p.locator('#revCapGroup button').nth(1).scrollIntoViewIfNeeded(); await p.screenshot({ path: 'shots/v27-set-' + lang + '.png' });
    await p.locator('#revCapGroup button').nth(2).click(); await p.waitForTimeout(150);
    ok(lang + ' 選 30 會記住', (await E("localStorage.getItem('thai-rev-cap')")) === '30');
    await p.locator('#rrShowGroup button').nth(1).click(); await p.waitForTimeout(150);
    ok(lang + ' 認得率關掉會記住', (await E("localStorage.getItem('thai-rr-show')")) === '0');
    await E("showTab('home'); 1"); await p.click('#readerOpen'); await p.waitForTimeout(600);
    ok(lang + ' 關掉後讀物庫沒有標籤', (await p.locator('#rdList .rrpill').count()) === 0 && !(await p.locator('#rdNote').isVisible()));
    await p.keyboard.press('Escape');
    await E("openDoc('text:b1')"); await p.waitForTimeout(2200);
    ok(lang + ' 關掉後文章上方沒有條', !(await p.locator('#rrHint').isVisible()));
    await E("localStorage.removeItem('thai-rr-show'); 1");

    // 7. 找殘留的另一種語言
    if (lang === 'en') {
      await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(200); await E("settingsOpen('read'); 1"); await p.waitForTimeout(300);
      const txt = await p.evaluate(() => Array.from(document.querySelectorAll('#revCapGroup, #rrShowGroup, #revCapGroup ~ *, .setrow')).filter(e => e.offsetParent).map(e => e.innerText).join('\n'));
      const cjk = (txt.match(/[一-鿿]+/g) || []).filter(x => !/(泰|中文)/.test(x));
      ok('en 設定頁沒有中文殘留', cjk.length === 0, cjk.slice(0, 8).join('|'));
    }
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? '失敗 ' + fails : '全部通過');
})();
