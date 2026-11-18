// 1.42：生字卡範圍列、測驗複選、主頁讀物庫與連續天數
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const TXT = 'วันนี้ฉันตื่นเช้ามาก แล้วไปตลาดกับแม่ แม่ซื้อผลไม้และผัก ฉันชอบกินมะม่วง อากาศร้อนมากแต่สนุก กลับบ้านแล้วอาบน้ำ\n';
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    for (const vp of [{ width: 820, height: 1180 }, { width: 390, height: 844 }]) {
      const tag = lang + (vp.width < 500 ? ' 手機' : ' iPad');
      const p = await b.newPage({ viewport: vp }); p.setDefaultTimeout(6000); const errs = [];
      p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      await p.goto('http://127.0.0.1:8765/index.html');
      await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ocr-pre', 'no'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
      await p.reload(); await p.waitForTimeout(1600);
      const E = c => p.evaluate(c => window.__ev(c), c);
      await E("showTab('home'); $('input').value = " + JSON.stringify(TXT) + "; libAddText(); 1"); await p.waitForTimeout(800);
      await E("['ตื่น','ตลาด','แม่','ซื้อ','ผลไม้','ผัก','ชอบ','มะม่วง','อากาศ','ร้อน'].forEach(function(w){ var i=state.text.indexOf(w); if(i>=0) addCard(segAt(i)); }); folders.push({id:'f1',name:'食物'},{id:'f2',name:'動詞'}); cards.forEach(function(c,i){ c.folder = i%2 ? 'f1' : 'f2'; if (i<2) c.fav = true; }); saveCards(); showTab('cards'); 1");
      await p.waitForTimeout(300);
      // 範圍列
      const chips = await p.$$eval('#cardScope .cschip', bs => bs.map(b => b.querySelector('.csn').textContent + ':' + b.querySelector('.csc').textContent));
      ok(tag + ' 範圍列：全部、收藏、這篇文件、資料夾在同一排', chips.length === 5 && chips[0] === T('全部', 'All') + ':' + chips[0].split(':')[1] && chips.some(c => c.startsWith(T('收藏', 'Starred') + ':2')) && chips.some(c => c.startsWith('食物:')), chips.join(' | '));
      ok(tag + ' 舊的資料夾列和「全部／收藏」重複切換不見了', await E("$('cardFolders').hidden") && (await p.locator('.clfilt').count()) === 0);
      await p.click('#cardScope .cschip.csfav');
      ok(tag + ' 點「收藏」只顯示收藏的', (await E("cards.filter(inFolder).length")) === 2);
      await E("cardTab = 'list'; renderCards(); 1");
      ok(tag + ' 卡片分頁顯示張數，沒有「只看目前文件」', (await p.locator('.clcount').innerText()).includes('2') && (await p.locator('.clbar2').count()) === 0);
      ok(tag + ' 分頁叫「卡片」不再叫「清單」', (await p.$$eval('#cardTabs button', bs => bs[2].textContent)).startsWith(T('卡片', 'Cards')));
      await p.click('#cardScope .cschip.csfold >> nth=0'); await p.waitForTimeout(100);
      ok(tag + ' 選資料夾後提示新卡會放進這裡', (await p.locator('.cstarget').innerText()).includes('動詞') || (await p.locator('.cstarget').innerText()).includes('食物'));
      await p.click('#cardScope .cschip[aria-checked="true"]'); await p.waitForTimeout(100);
      ok(tag + ' 再點一下選中的資料夾：改名／刪除', await p.locator('.fmenu').isVisible());
      await p.click('.fmenu button >> nth=0'); await p.fill('.cseditor .fname', '水果'); await p.click('.cseditor .primary');
      ok(tag + ' 改名成功', await E("folders.some(function(f){return f.name==='水果'})"));
      await p.click('#cardScope .csadd'); await p.fill('.cseditor .fname', '新的'); await p.press('.cseditor .fname', 'Enter');
      ok(tag + ' 新資料夾（按 Enter 也可以）', await E("folders.some(function(f){return f.name==='新的'}) && cardFolder !== 'all'"));
      // 測驗
      await E("cardFolder = 'all'; cardTab = 'quiz'; quiz = null; renderCards(); 1"); await p.waitForTimeout(100);
      ok(tag + ' 測驗時上面的範圍列收起來，改在設定裡選', await E("$('cardScope').hidden") && await p.locator('.qsetup').isVisible());
      await p.click('.qsgroup >> nth=0 >> .qschip >> nth=2'); // 第一個資料夾
      await p.click('.qsgroup >> nth=0 >> .qschip >> nth=3'); // 第二個資料夾
      const sc = await E("JSON.stringify(qsGet().scopes)");
      ok(tag + ' 出題範圍可以複選', JSON.parse(sc).length === 2 && !JSON.parse(sc).includes('all'), sc);
      await p.click('.qsgroup >> nth=1 >> .qschip >> nth=1'); // 看意思選泰文
      const ty = JSON.parse(await E("JSON.stringify(qsGet().types)"));
      ok(tag + ' 題型可以複選', ty.length === 2 && ty.includes('th2zh') && ty.includes('zh2th'), ty.join(','));
      await p.click('.qsgroup >> nth=1 >> .qschip >> nth=0'); await p.click('.qsgroup >> nth=1 >> .qschip >> nth=1');
      ok(tag + ' 題型至少留一種', JSON.parse(await E("JSON.stringify(qsGet().types)")).length === 1);
      await p.click('.qsgroup >> nth=1 >> .qschip >> nth=0');
      await p.click('.qsgroup >> nth=2 >> .qschip >> nth=2'); // 全部
      await p.click('.qsetup ~ .btns .primary'); await p.waitForTimeout(200);
      const qinfo = JSON.parse(await E("JSON.stringify({n: quiz.qs.length, types: quiz.qs.map(function(q){return q.qt}), inScope: quiz.qs.every(function(q){ return ['f1','f2'].indexOf(q.c.folder) >= 0; })})"));
      ok(tag + ' 開始測驗：題數＝範圍內全部、兩種題型都有出現（混在一起）', qinfo.n === 10 && qinfo.inScope && new Set(qinfo.types).size === 2, JSON.stringify(qinfo));
      const first = await E("quiz.qs[0].qt");
      ok(tag + ' 每題照自己的題型顯示', first === 'th2zh' ? (await p.locator('.qcard .cword').count()) === 1 : (await p.locator('.qcard .qprompt').count()) === 1, first);
      await p.click('.qopt >> nth=0'); await p.waitForTimeout(100);
      ok(tag + ' 作答後照常顯示對錯', (await p.locator('.qopt.ok').count()) === 1);
      // 複習
      await E("quiz = null; cardTab = 'review'; review = null; renderCards(); 1"); await p.waitForTimeout(100);
      ok(tag + ' 複習頁：大大的今天要複習幾張', (await p.locator('.revhero .rvnum').innerText()) === '10' && await p.locator('.revhero .btns .primary').isVisible());
      // 主頁
      await E("showTab('home'); 1"); await p.waitForTimeout(300);
      const ib = await E("(function(){ var ib=document.querySelector('#view-home .importbar'); return ib.contains($('readerOpen')) && ib.contains($('anyfile')); })()");
      ok(tag + ' 讀物庫和匯入在同一排', ib);
      ok(tag + ' 讀物庫照常打開', await E("$('readerOpen').click(); !rdWrap.hidden"));
      await E("rdClose(); 1");
      const sb = await p.locator('#homeStreak').boundingBox();
      ok(tag + ' 右上角有連續天數＋小火苗', sb && sb.x + sb.width > vp.width - 60 && (await p.locator('#homeStreak svg').count()) === 1 && /\d/.test(await p.locator('#homeStreak b').innerText()), sb && Math.round(sb.x));
      await p.click('#homeStreak'); await p.waitForTimeout(200);
      ok(tag + ' 點連續天數到成就頁', await E("curTab") === 'ach');
      await E("showTab('home'); 1");
      ok(tag + ' 文件清單每列不再攤開資料夾下拉和刪除', !(await p.locator('#docList .doccard .dside >> nth=0').isVisible()) && await p.locator('#docList .doccard .dmore >> nth=0').isVisible());
      await p.click('#docList .doccard .dmore >> nth=0');
      ok(tag + ' 點 ⋯ 才出現資料夾和刪除', await p.locator('#docList .doccard.menu .dside').isVisible());
      const urlW = (await p.locator('#urlInput').boundingBox()).width;
      ok(tag + ' 網址列夠寬可以打字', urlW > 180, Math.round(urlW));
      ok(tag + ' 沒有錯誤', errs.length === 0, errs.join(' | '));
      await p.close();
    }
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
