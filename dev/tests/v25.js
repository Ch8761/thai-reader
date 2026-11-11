const { chromium } = require('playwright');
const fs = require('fs');
const URL = process.env.URL || 'http://127.0.0.1:8765/index.html';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) { fails++; } console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); };
const TEST = !!process.env.URL === false;
(async () => {
  const b = await chromium.launch();
  const mk = async (opts) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, hasTouch: true, acceptDownloads: true }, opts || {}));
    const p = await ctx.newPage(); p.setDefaultTimeout(5000); p.errs = [];
    p.on('pageerror', e => p.errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) { p.errs.push(m.text()); } });
    return p;
  };
  const E = (p, c) => p.evaluate(c => window.__ev(c), c);
  const seed = async (p, extra) => {
    await p.goto(URL);
    await p.evaluate(() => {
      localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1');
      const docs = ['A', 'B', 'C', 'D'].map((n, i) => ({ id: 'text:' + n, name: '文件' + n, type: 'text', size: 10 + i, added: 10 - i, opened: 0, folder: n === 'D' ? 'dx' : '' }));
      localStorage.setItem('thai-docs-v1', JSON.stringify({ docs, folders: [{ id: 'dx', name: '我的' }], cur: 'all' }));
      docs.forEach(d => localStorage.setItem('thai-notes-doc:' + d.id, JSON.stringify({ text: 'วันนี้ผมไปตลาด', src: { type: 'text', id: d.id, name: d.name }, hl: [], strokes: [], boxes: [], nextId: 1 })));
    });
    await p.reload(); await p.waitForTimeout(1200);
  };
  const tabs = p => p.locator('#homeFolders > .seg > button').allTextContents().then(a => a.map(x => x.trim()));
  const longPress = async (p, sel) => {
    const bb = await p.locator(sel).first().boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(200);
  };

  /* ---------- 1. 資料夾：再點一下 → 下拉改名／刪除 ---------- */
  let p = await mk(); await seed(p);
  ok('主頁沒有舊的資料夾名稱列', (await p.locator('#homeFolderBar').count()) === 0);
  let t = await tabs(p);
  ok('分頁：全部 4、我的 1', t[0].startsWith('全部 4') && t.some(x => /^我的\s*1$/.test(x)), t.join(' | '));
  ok('在「全部」沒有下拉箭頭', (await p.locator('#homeFolders .fchev').count()) === 0);
  await p.locator('#homeFolders > .seg > button', { hasText: '我的' }).click(); await p.waitForTimeout(250);
  ok('選了資料夾：該分頁有小箭頭，還沒有選單', (await p.locator('#homeFolders .hasmenu .fchev').count()) === 1 && (await p.locator('.fmenu').count()) === 0);
  ok('選了資料夾後沒有「資料夾名稱 + 改名／刪除」方框列', (await p.locator('.fbar').count()) === 0);
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(250);
  ok('再點一下：下拉出現「改名」「刪除資料夾」', (await p.locator('.fmenu button').allTextContents()).join('|') === '改名|刪除資料夾', (await p.locator('.fmenu button').allTextContents()).join('|'));
  ok('小箭頭展開狀態 aria-expanded', (await p.getAttribute('#homeFolders .hasmenu', 'aria-expanded')) === 'true');
  const fm = await p.locator('.fmenu').boundingBox(), tb = await p.locator('#homeFolders .hasmenu').boundingBox();
  ok('選單在分頁正下方且沒超出螢幕', fm.y >= tb.y + tb.height - 2 && fm.x >= 0 && fm.x + fm.width <= 390, JSON.stringify([Math.round(fm.x), Math.round(fm.y), Math.round(fm.width)]));
  await p.screenshot({ path: 'shots/v25-folder-menu.png' });
  await p.mouse.click(200, 700); await p.waitForTimeout(200);
  ok('點旁邊空白處：選單收起', (await p.locator('.fmenu').count()) === 0);
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('Esc：選單收起', (await p.locator('.fmenu').count()) === 0);
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(150);
  await p.click('.fmenu button:first-child'); await p.waitForTimeout(250);
  ok('按「改名」：出現輸入框，內容是原名字', (await p.inputValue('#homeFolders input.fname')) === '我的' && (await p.locator('.fmenu').count()) === 0);
  await p.fill('#homeFolders input.fname', '日常'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  t = await tabs(p);
  ok('改名成功', t.some(x => /^日常\s*1$/.test(x)) && !t.some(x => x.startsWith('我的')), t.join(' | '));
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(150);
  await p.click('.fmenu .cdel'); await p.waitForTimeout(150);
  const sure = await p.textContent('.fmenu .cdel');
  ok('刪除要按兩次，說明文件不會被刪', sure.includes('不會刪') && (await E(p, 'lib.folders.length')) === 1, sure);
  await p.click('.fmenu .cdel'); await p.waitForTimeout(250);
  ok('刪掉資料夾：回到全部、文件還在', (await E(p, 'lib.cur')) === 'all' && (await E(p, 'lib.docs.length')) === 4 && (await E(p, "lib.docs.filter(function(d){return d.folder}).length")) === 0);
  ok('頁面沒有錯誤(1)', p.errs.length === 0, p.errs.join('|'));

  /* 生字卡頁也一樣 */
  await E(p, "folders.push({id:'fa',name:'測試夾'}); cards.push({id:'c1',w:'ตลาด',rom:'dta-làat',pos:'n',zh:'市場',en:'market',sent:'วันนี้ผมไปตลาด',src:'文件A',page:0,added:1,box:2,due:0,seen:2,right:1,last:Date.now()-86400000*3,folder:'fa'}); saveCards(); showTab('cards'); 1");
  await p.waitForTimeout(400);
  await p.locator('#cardFolders > .seg > button', { hasText: '測試夾' }).click(); await p.waitForTimeout(200);
  ok('生字卡頁：選了資料夾沒有名稱列', (await p.locator('#cardFolders .fbar').count()) === 0 && (await p.locator('#cardFolders .hasmenu .fchev').count()) === 1);
  await p.locator('#cardFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(200);
  ok('生字卡頁：再點一下出現下拉', (await p.locator('#cardFolders .fmenu button').count()) === 2);
  await p.click('#cardFolders .fmenu .cdel'); await p.click('#cardFolders .fmenu .cdel'); await p.waitForTimeout(250);
  ok('生字卡頁：刪資料夾，卡片還在', (await E(p, 'cards.length')) === 1 && (await E(p, 'cardFolder')) === 'all' && (await E(p, 'cards[0].folder')) === '');

  /* ---------- 2. 長按多選 ---------- */
  p = await mk(); await seed(p);
  ok('有兩份以上文件：出現長按小提示', (await p.locator('#selTip:not([hidden])').count()) === 1, await p.textContent('#selTip').catch(() => ''));
  await p.click('#docList .doccard:nth-child(1) .dopen'); await p.waitForTimeout(600);
  ok('短按：正常打開文件', (await E(p, "curTab")) === 'doc');
  await E(p, "showTab('home')"); await p.waitForTimeout(400);
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  ok('長按：進入選取，這份被選起來', (await p.locator('#docList.selecting .doccard.picked').count()) === 1);
  ok('長按放開後沒有誤打開文件', (await E(p, "curTab")) === 'home');
  ok('下方出現選取列：已選 1 份', (await p.textContent('#selBar .selcount')).trim() === '已選 1 份' && !(await p.locator('#selBar').isHidden()));
  ok('選取中隱藏小提示', (await p.locator('#selTip:not([hidden])').count()) === 0);
  await p.click('#docList .doccard:nth-child(2) .dopen'); await p.waitForTimeout(200);
  ok('選取中點別份＝勾選，不會打開', (await p.locator('.doccard.picked').count()) === 2 && (await E(p, "curTab")) === 'home' && (await p.textContent('#selBar .selcount')).trim() === '已選 2 份');
  await p.screenshot({ path: 'shots/v25-select.png' });
  await p.click('#docList .doccard:nth-child(2) .dopen'); await p.waitForTimeout(150);
  ok('再點一次：取消勾選', (await p.locator('.doccard.picked').count()) === 1);
  await p.click('#selBar button:has-text("全選")'); await p.waitForTimeout(150);
  ok('全選：4 份', (await p.locator('.doccard.picked').count()) === 4 && (await p.textContent('#selBar .selcount')).includes('4'));
  await p.click('#selBar button.primary'); await p.waitForTimeout(200);
  const items = (await p.locator('.selmenu > button').allTextContents()).map(x => x.trim());
  ok('移到資料夾選單：不放資料夾、我的', items.join('|') === '不放資料夾|我的', items.join('|'));
  ok('選單有新資料夾輸入框', (await p.locator('.selmenu .selnew input').count()) === 1);
  await p.screenshot({ path: 'shots/v25-select-menu.png' });
  await p.click('.selmenu > button:has-text("我的")'); await p.waitForTimeout(300);
  ok('全部移進「我的」', (await E(p, "lib.docs.filter(function(d){return d.folder==='dx'}).length")) === 4);
  ok('離開選取、選取列收起', (await p.locator('#selBar').isHidden()) && (await p.locator('#docList.selecting').count()) === 0);
  ok('出現「已移動 4 份文件」與復原', (await p.textContent('#snackT')).includes('已移動 4 份') && (await p.locator('#snackU').isVisible()));
  await p.click('#snackU'); await p.waitForTimeout(300);
  ok('復原：只有 D 還在「我的」', (await E(p, "lib.docs.filter(function(d){return d.folder==='dx'}).map(function(d){return d.id}).join(',')")) === 'text:D');
  /* 新資料夾 */
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  await p.click('#docList .doccard:nth-child(2) .dopen');
  await p.click('#selBar button.primary'); await p.waitForTimeout(150);
  await p.fill('.selmenu .selnew input', '新夾子'); await p.click('.selmenu .selnew button'); await p.waitForTimeout(300);
  ok('建立並移入新資料夾', (await E(p, "lib.folders.map(function(f){return f.name}).join(',')")) === '我的,新夾子' && (await E(p, "lib.docs.filter(function(d){return d.folder===lib.folders[1].id}).length")) === 2);
  t = await tabs(p);
  ok('分頁數字更新', t.some(x => /^新夾子\s*2$/.test(x)), t.join(' | '));
  /* 取消、取消最後一個、換分頁 */
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  await p.click('#selBar .selx'); await p.waitForTimeout(150);
  ok('按「×」離開選取', (await p.locator('#selBar').isHidden()) && (await p.locator('.doccard.picked').count()) === 0);
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  await p.click('#docList .doccard:nth-child(1) .dopen'); await p.waitForTimeout(150);
  ok('取消勾選最後一份就自動離開選取', (await p.locator('#selBar').isHidden()));
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  await p.locator('#homeFolders > .seg > button', { hasText: '我的' }).click(); await p.waitForTimeout(200);
  ok('切換資料夾分頁：離開選取', (await p.locator('#selBar').isHidden()));
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('Esc：離開選取', (await p.locator('#selBar').isHidden()));
  await longPress(p, '#docList .doccard:nth-child(1) .dopen');
  await E(p, "showTab('cards')"); await p.waitForTimeout(250);
  ok('換到別的分頁：選取列不留著', (await p.locator('#selBar').isHidden()));
  await E(p, "showTab('home')"); await p.waitForTimeout(250);
  ok('回主頁沒有殘留選取', (await p.locator('#docList.selecting').count()) === 0);
  /* 方塊檢視 */
  await p.click('.viewtoggle [data-hv="grid"]'); await p.waitForTimeout(300);
  await p.locator('#homeFolders > .seg > button', { hasText: '全部' }).click(); await p.waitForTimeout(200);
  await longPress(p, '#docList .doccard:nth-child(1) .dicon');
  await p.click('#docList .doccard:nth-child(3) .dicon'); await p.waitForTimeout(200);
  ok('方塊檢視也能長按多選（2 份、不打開）', (await p.locator('.doccard.picked').count()) === 2 && (await E(p, "curTab")) === 'home');
  await p.screenshot({ path: 'shots/v25-select-grid.png' });
  await p.keyboard.press('Escape');
  ok('頁面沒有橫向捲動', (await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)));
  await p.reload(); await p.waitForTimeout(1000);
  ok('用過之後不再顯示長按小提示', (await p.locator('#selTip:not([hidden])').count()) === 0);
  ok('頁面沒有錯誤(2)', p.errs.length === 0, p.errs.join('|'));

  /* ---------- 3. 生字卡：篩選鈕、上次複習日 ---------- */
  p = await mk(); await seed(p);
  await E(p, `(function(){ var now=Date.now(), D=86400000, y=new Date().getFullYear();
    function c(id,w,src,last,seen){ return {id:id,w:w,rom:'r'+id,pos:'n',zh:'意思'+id,en:'mean'+id,sent:'ประโยค '+w,src:src,page:0,added:now,box:2,due:0,seen:seen,right:1,last:last}; }
    cards.length=0; cards.push(c('c1','ตลาด','文件A',now-3*D,2), c('c2','เพื่อน','文件B',new Date(y-1,2,4).getTime(),3), c('c3','ผม','文件A',0,0)); saveCards(); showTab('cards'); cardTab='list'; renderCards(); return 1; })()`);
  await p.waitForTimeout(400);
  const rows = await p.locator('.clast').allTextContents();
  ok('每張卡顯示上次複習日', rows.length === 3, rows.join(' | '));
  const d3 = new Date(Date.now() - 3 * 86400000), want = '上次複習 ' + (d3.getMonth() + 1) + '/' + d3.getDate();
  ok('同一年只寫 月/日', rows.includes(want), want);
  ok('去年的卡寫 年/月/日', rows.some(x => /^上次複習 \d{4}\/3\/4$/.test(x)));
  ok('沒複習過寫「還沒複習」', rows.includes('還沒複習'));
  ok('清單上不再有「複製成 Anki 格式」', !(await p.textContent('#cardbody')).includes('複製成 Anki'));
  ok('第二排只有一個篩選鈕', (await p.locator('.clbar2 button').count()) === 1 && (await p.locator('.clbar2 .clchip').count()) === 1);
  ok('沒開文件時篩選鈕是停用的', await p.locator('.clchip').isDisabled());
  await p.screenshot({ path: 'shots/v25-cards-list.png' });
  await E(p, "openDoc('text:A')"); await p.waitForTimeout(900); await E(p, "showTab('cards')"); await p.waitForTimeout(400);
  ok('開了文件：篩選鈕可以按、一開始是關的', !(await p.locator('.clchip').isDisabled()) && (await p.getAttribute('.clchip', 'aria-pressed')) === 'false');
  await p.click('.clchip'); await p.waitForTimeout(250);
  ok('按下去：aria-pressed、只剩 文件A 的 2 張', (await p.getAttribute('.clchip', 'aria-pressed')) === 'true' && (await p.locator('.crow').count()) === 2);
  ok('打開時晶片上顯示是哪份文件', (await p.textContent('.clchip .cldoc')) === '文件A');
  await p.screenshot({ path: 'shots/v25-cards-filter.png' });
  await p.click('.clchip'); await p.waitForTimeout(250);
  ok('再按一次：關掉、3 張', (await p.locator('.crow').count()) === 3);
  await p.click('.crow >> nth=0'); await p.waitForTimeout(400);
  const det = (await p.textContent('#cdBody')).replace(/\s+/g, ' ');
  ok('卡片詳解有「上次複習：」', det.includes('上次複習：') || det.includes('還沒複習過'), det.slice(0, 200));
  await p.click('#cdClose'); await p.waitForTimeout(200);

  /* ---------- 4. 匯出 ---------- */
  await E(p, "cards.push({id:'c4',w:'<ไป>',rom:'x&y',pos:'v',zh:'去 & 走',en:'go',sent:'a<b>&c\\td\\ne',src:'文件B',page:2,added:1,box:3,due:0,seen:1,right:1,last:Date.now()-86400000,folder:'dx',fav:1}); saveCards(); renderCards(); 1");
  ok('標題右邊有「匯出」鈕', (await p.locator('#view-cards .vhead #openCardExport').count()) === 1 && (await p.textContent('#openCardExport')).trim() === '匯出');
  await p.screenshot({ path: 'shots/v25-cards-head.png', clip: { x: 0, y: 0, width: 390, height: 220 } });
  await p.click('#openCardExport'); await p.waitForTimeout(300);
  ok('匯出視窗打開', !(await p.locator('#cardExport').isHidden()));
  ok('三種格式', (await p.locator('.exfmt').count()) === 3 && (await p.locator('.exfmt b').allTextContents()).join('|') === 'Word (.docx)|PDF|Anki (.txt)');
  ok('全部都顯示時只有一個「共 4 張」', (await p.textContent('#cxBody')).includes('共 4 張') && (await p.locator('#cxBody .seg').count()) === 0);
  await p.screenshot({ path: 'shots/v25-export.png' });
  fs.mkdirSync('shots/dl25', { recursive: true });
  const dl = async (fmt, ext) => {
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('.exfmt[data-fmt="' + fmt + '"]')]);
    const path = 'shots/dl25/cards.' + ext; await d.saveAs(path); return { name: d.suggestedFilename(), size: fs.statSync(path).size };
  };
  let r = await dl('anki', 'txt');
  ok('Anki：檔名 .txt', /^thai-flashcards-\d{8}\.txt$/.test(r.name), r.name + ' ' + r.size);
  const anki = fs.readFileSync('shots/dl25/cards.txt', 'utf8'), lines = anki.trim().split('\n');
  ok('Anki：檔頭三行', lines.slice(0, 3).join('|') === '#separator:tab|#html:true|#tags column:4', lines.slice(0, 3).join('|'));
  ok('Anki：4 張卡各一行、每行 4 欄（Tab）', lines.length === 7 && lines.slice(3).every(l => l.split('\t').length === 4), String(lines.length));
  ok('Anki：HTML 符號有跳脫、Tab 換行被換成空白', anki.includes('&lt;ไป&gt;') && anki.includes('a&lt;b&gt;&amp;c d e'));
  ok('Anki：標籤含資料夾', lines.slice(3).some(l => l.endsWith('\t泰文')) );
  ok('匯出完有提示', (await p.textContent('#cxMsg')).includes('已匯出 4 張'), await p.textContent('#cxMsg'));
  r = await dl('docx', 'docx');
  ok('Word：檔名 .docx 且有內容', /\.docx$/.test(r.name) && r.size > 1500, r.name + ' ' + r.size);
  r = await dl('pdf', 'pdf');
  ok('PDF：檔名 .pdf 且有內容', /\.pdf$/.test(r.name) && r.size > 5000, r.name + ' ' + r.size);
  /* 範圍：目前顯示 */
  await p.click('#cxClose'); await p.waitForTimeout(200);
  await p.click('#cardFolders > .seg > button:has-text("全部")'); await E(p, "cardFolder='dx'; renderCards(); 1"); await p.waitForTimeout(200);
  await p.click('#openCardExport'); await p.waitForTimeout(300);
  ok('篩選後有「目前顯示的 1 張 / 全部 4 張」', (await p.locator('#cxBody .seg button').allTextContents()).join('|') === '目前顯示的 1 張|全部 4 張', (await p.locator('#cxBody .seg button').allTextContents()).join('|'));
  await p.screenshot({ path: 'shots/v25-export-scope.png' });
  r = await dl('anki', 'txt');
  ok('範圍＝目前顯示：只有 1 張', fs.readFileSync('shots/dl25/cards.txt', 'utf8').trim().split('\n').length === 4);
  await p.click('#cxBody .seg button:has-text("全部")'); await p.waitForTimeout(150);
  r = await dl('anki', 'txt');
  ok('範圍＝全部：4 張', fs.readFileSync('shots/dl25/cards.txt', 'utf8').trim().split('\n').length === 7);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('Esc 關掉匯出視窗', await p.locator('#cardExport').isHidden());
  /* 沒有卡片 */
  await E(p, "cards.length=0; saveCards(); renderCards(); 1"); await p.click('#openCardExport'); await p.waitForTimeout(200);
  ok('沒有卡片：說明並且沒有格式按鈕', (await p.textContent('#cxBody')).includes('還沒有生字卡可以匯出') && (await p.locator('.exfmt').count()) === 0);
  ok('頁面沒有錯誤(3)', p.errs.length === 0, p.errs.join('|'));
  await b.close();
  console.log(fails ? '\n失敗 ' + fails + ' 項' : '\n全部通過');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
