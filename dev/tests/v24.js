const { chromium, devices } = require('playwright');
const URL = 'http://127.0.0.1:8765/index.html';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) { fails++; } console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); };
(async () => {
  const b = await chromium.launch();
  const mk = async (opts, init) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, hasTouch: true }, opts || {})); if (init) { await ctx.addInitScript(init); } const p = await ctx.newPage(); p.setDefaultTimeout(5000); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.errs = errs; return p; };
  const fresh = async (p, extra) => { await p.goto(URL); await p.evaluate(a => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); Object.keys(a || {}).forEach(k => localStorage.setItem(k, a[k])); }, extra || {}); await p.reload(); await p.waitForTimeout(1200); };
  const E = (p, c) => p.evaluate(c => window.__ev(c), c);

  /* ---- 1. 資料夾 ---- */
  let p = await mk();
  await p.goto(URL);
  await p.evaluate(() => {
    localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1');
    const docs = [{ id: 'text:a', name: '讀物一', type: 'text', size: 10, added: 1, opened: 0, folder: '', lib: 'a1' }, { id: 'text:b', name: '我貼的', type: 'text', size: 10, added: 2, opened: 0, folder: '' }, { id: 'text:c', name: '放別處', type: 'text', size: 10, added: 3, opened: 0, folder: 'dx', lib: 'a2' }];
    localStorage.setItem('thai-docs-v1', JSON.stringify({ docs, folders: [{ id: 'dx', name: '我的' }], cur: 'none' }));
  });
  await p.reload(); await p.waitForTimeout(1200);
  const tabs = () => p.locator('#homeFolders > .seg > button').allTextContents();
  let t = (await tabs()).map(x => x.trim());
  ok('沒有「未分類」分頁', !t.some(x => x.includes('未分類')), t.join(' | '));
  ok('有「全部」「我的」「讀物庫」', t[0].startsWith('全部') && t.some(x => x.startsWith('我的')) && t.some(x => x.startsWith('讀物庫')));
  ok('舊的 cur=none 會回到全部', await E(p, "lib.cur") === 'all');
  ok('舊讀物搬進讀物庫、其他不動', await E(p, "JSON.stringify(lib.docs.map(function(d){return d.folder}))") === '["rdlib","","dx"]');
  ok('全部 = 3 份文件', (await p.locator('#docList > li').count()) >= 3);
  await E(p, "(function(){ docById('text:a').folder = ''; saveLib(); return 1; })()");
  await p.reload(); await p.waitForTimeout(1000);
  ok('搬過一次後，手動移出去不會被再搬回', await E(p, "docById('text:a').folder") === '');
  /* 從讀物庫打開 → 進「讀物庫」資料夾 */
  await E(p, "lib.docs = lib.docs.filter(function(d){return d.id!=='text:a'}); saveLib(); renderHome(); 1");
  await p.click('#readerOpen'); await p.waitForTimeout(900); await p.locator('.rditem').first().click(); await p.waitForTimeout(1200);
  ok('讀物庫打開的文章 folder = rdlib', await E(p, "lib.docs.filter(function(d){return d.lib}).slice(-1)[0].folder") === 'rdlib');
  await E(p, "showTab('home')"); await p.waitForTimeout(500);
  t = (await tabs()).map(x => x.trim());
  ok('讀物庫分頁有 1', t.some(x => /^讀物庫\s*1$/.test(x)), t.join(' | '));
  await p.locator('#homeFolders > .seg > button', { hasText: '讀物庫' }).click(); await p.waitForTimeout(300);
  ok('選讀物庫：提示新文件會放進讀物庫', (await p.textContent('#homeTarget')).includes('讀物庫'), await p.textContent('#homeTarget'));
  await p.screenshot({ path: 'shots/v24-home-folders.png' });
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(200);
  await p.click('.fmenu .cdel'); await p.waitForTimeout(200);
  const delTxt = await p.textContent('.fmenu .cdel');
  ok('刪資料夾說明文件不會被刪', delTxt.includes('不會刪') && !delTxt.includes('未分類'), delTxt);
  await p.click('.fmenu .cdel'); await p.waitForTimeout(300);
  ok('刪掉資料夾後文件還在「全部」', await E(p, "lib.docs.filter(function(d){return d.lib}).length") >= 1 && await E(p, "lib.cur") === 'all');
  await p.locator('#docList .cmove').first().selectOption({ index: 0 });
  ok('搬移選單第一項是「不放資料夾」', (await p.locator('#docList .cmove').first().locator('option').first().textContent()) === '不放資料夾');
  /* 生字卡頁 */
  await E(p, "addCard({t:'ตลาด',i:0}); showTab('cards'); 1"); await p.waitForTimeout(400);
  t = (await p.locator('#cardFolders > .seg > button').allTextContents()).map(x => x.trim());
  ok('生字卡頁沒有「未分類」', t.length >= 1 && !t.some(x => x.includes('未分類')), t.join(' | '));
  ok('生字卡頁在「全部」時不顯示「新加入會放進」', !(await p.textContent('#cardFolders')).includes('新加入的生字卡會放進'));
  ok('頁面沒有錯誤(1)', p.errs.length === 0, p.errs.join('|'));

  /* ---- 2. 週目標 ---- */
  p = await mk(); await fresh(p);
  await E(p, "(function(){ var a=[], t=new Date(); t.setHours(12,0,0,0); var back=(t.getDay()+6)%7; for (var i=0;i<=Math.min(back,1);i++){ var d=new Date(t.getTime()); d.setDate(d.getDate()-i); a.push(dayKey(d.getTime())); } localStorage.setItem('thai-days', JSON.stringify(a)); renderToday(); return a.length; })()");
  const wk = await E(p, "weekDays()");
  const q = (await p.textContent('#questCard')).replace(/\s+/g, ' ');
  ok('關卡卡片顯示本週天數', q.includes('本週') && q.includes('/4'), q + ' (week=' + wk + ')');
  ok('卡片上沒有「連續」', !q.includes('連續'));
  await p.screenshot({ path: 'shots/v24-home-week.png' });
  await p.click('#questCard'); await p.waitForTimeout(400);
  const sheet = (await p.textContent('#qsBody')).replace(/\s+/g, ' ');
  ok('學習紀錄有「本週學習」和「每週目標」', sheet.includes('本週學習') && sheet.includes('每週目標'), sheet.slice(0, 120));
  await p.locator('.lqgoal .seg button', { hasText: '3 天' }).click(); await p.waitForTimeout(200);
  ok('改成 3 天', await E(p, "weekGoal()") === 3 && (await p.textContent('.lqstat:nth-child(3) .lqsn')).includes('/ 3'));
  await p.screenshot({ path: 'shots/v24-record.png' });
  await p.click('#qsClose'); await p.waitForTimeout(200);
  ok('卡片同步成 /3', (await p.textContent('#questCard')).includes('/3'));
  await E(p, "(function(){ localStorage.setItem('thai-days', JSON.stringify(['2020-1-1','2020-1-2','2020-1-3'])); return 1; })()");
  ok('累計天數關卡（3 天過第 4 關的條件）', await E(p, "learnStats().days") === 3 && (await E(p, "questText(QUEST[3])")) === '累計學 3 天');
  ok('頁面沒有錯誤(2)', p.errs.length === 0, p.errs.join('|'));

  /* ---- 3. 快忘記的生字 ---- */
  p = await mk(); await fresh(p);
  await E(p, `(function(){ var id='text:s1'; lib.docs.push({id:id,name:'測試文',type:'text',size:20,added:1,opened:0,folder:''}); saveLib();
    localStorage.setItem(PDF_DOC_PREFIX+id, JSON.stringify({text:'วันนี้ผมไปตลาดกับเพื่อน', src:{type:'text',id:id,name:'測試文'}, hl:[],strokes:[],boxes:[],nextId:1}));
    ['ตลาด','เพื่อน','กิน'].forEach(function(w){ addCard({t:w,i:0}); });
    cards.forEach(function(c){ c.due = today0() - 86400000; c.last = Date.now() - 3*86400000; c.seen = 2; }); cards[0].last = 0; cards[0].seen = 0; saveCards(); return 1; })()`);
  await E(p, "openDoc('text:s1')"); await p.waitForTimeout(1200);
  const hint = await p.evaluate(() => { const h = document.getElementById('softHint'); return { vis: !h.hidden, tx: h.textContent.replace(/\s+/g, ' ').trim() }; });
  ok('文章裡有快忘記的生字就提示', hint.vis, hint.tx);
  const nsoft = await E(p, 'softList().length');
  ok('只算複習過、到期、而且在這篇裡的字（3 張卡裡有 2 張）', nsoft === 2, String(nsoft));
  await p.screenshot({ path: 'shots/v24-soft.png' });
  await p.click('#softMain'); await p.waitForTimeout(200);
  ok('點開看得到生字', (await p.locator('.softchip').count()) === 2);
  await p.screenshot({ path: 'shots/v24-soft-open.png' });
  await p.click('#softX'); await p.waitForTimeout(150);
  ok('可以關掉', await p.evaluate(() => document.getElementById('softHint').hidden));
  await E(p, "showTab('home'); openDoc('text:s1')"); await p.waitForTimeout(1200);
  ok('同一篇同一天不再提示', await p.evaluate(() => document.getElementById('softHint').hidden));
  ok('頁面沒有錯誤(3)', p.errs.length === 0, p.errs.join('|'));

  /* ---- 4. 安裝引導 ---- */
  const guide = async (name, ctxOpts, init, wantVisible) => {
    const g = await mk(ctxOpts, init); await g.goto(URL); await g.evaluate(() => { localStorage.clear(); }); await g.reload(); await g.waitForTimeout(1300);
    const vis = await g.evaluate(() => { const e = document.getElementById('installGuide'), w = document.getElementById('welcome'); return { guide: !!e && !e.hidden, welcome: !w.hidden, txt: e ? e.textContent.replace(/\s+/g, ' ') : '' }; });
    ok(name + ' 引導顯示=' + wantVisible, vis.guide === wantVisible && vis.welcome === !wantVisible, JSON.stringify(vis).slice(0, 200));
    return { g, vis };
  };
  const iphone = devices['iPhone 13'];
  let r = await guide('iPhone Safari 第一次', { userAgent: iphone.userAgent, viewport: iphone.viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true }, null, true);
  ok('iPhone：有「加入主畫面」步驟、沒有「先試用」', r.vis.txt.includes('加入主畫面') && !r.vis.txt.includes('先在網頁試用'));
  ok('iPhone：一開始看不到「先在這個瀏覽器使用」', !r.vis.txt.includes('先在這個瀏覽器使用'));
  await r.g.screenshot({ path: 'shots/v24-install-ios.png' });
  await r.g.click('.ighelp > button'); await r.g.waitForTimeout(200);
  ok('展開「安裝有問題？」才有出口', (await r.g.textContent('#installGuide')).includes('先在這個瀏覽器使用'));
  await r.g.screenshot({ path: 'shots/v24-install-ios-more.png' });
  await r.g.click('.igmore button'); await r.g.waitForTimeout(300);
  ok('按出口後進歡迎視窗，且之後重開不再出現引導', await r.g.evaluate(() => !document.getElementById('welcome').hidden && document.getElementById('installGuide').hidden));
  await r.g.reload(); await r.g.waitForTimeout(1000);
  ok('重開後直接是歡迎視窗', await r.g.evaluate(() => document.getElementById('installGuide').hidden && !document.getElementById('welcome').hidden));
  r = await guide('LINE 內建瀏覽器', { userAgent: iphone.userAgent + ' Line/13.0.0', viewport: iphone.viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true }, null, true);
  ok('LINE：提示改用 Safari 並有複製網址', r.vis.txt.includes('內建的瀏覽器') && r.vis.txt.includes('複製網址'));
  await r.g.screenshot({ path: 'shots/v24-install-line.png' });
  const andr = devices['Pixel 7'];
  r = await guide('Android Chrome（沒有安裝事件）', { userAgent: andr.userAgent, viewport: andr.viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true }, null, true);
  ok('Android：文字說明安裝', r.vis.txt.includes('安裝應用程式'));
  await r.g.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = 1; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await r.g.waitForTimeout(200);
  ok('Android：有安裝事件時出現「安裝到主畫面」按鈕', (await r.g.textContent('#installGuide')).includes('安裝到主畫面'));
  await r.g.click('#installGuide .primary'); await r.g.waitForTimeout(400);
  ok('按下去會叫出系統安裝視窗，成功後提示從主畫面打開', await r.g.evaluate(() => window.__prompted === 1) && (await r.g.textContent('#installGuide')).includes('從主畫面打開'));
  await guide('iPhone 從主畫面打開（standalone）', { userAgent: iphone.userAgent, viewport: iphone.viewport, hasTouch: true, isMobile: true }, () => { Object.defineProperty(navigator, 'standalone', { get: () => true }); }, false);
  await guide('電腦瀏覽器', { viewport: { width: 1200, height: 800 } }, null, false);
  /* 已經用過的人（有按過開始使用）不會看到 */
  const pg = await mk({ userAgent: iphone.userAgent, viewport: iphone.viewport, isMobile: true, hasTouch: true }); await pg.goto(URL); await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); }); await pg.reload(); await pg.waitForTimeout(1000);
  ok('用過的人（iPhone 瀏覽器）不顯示引導也不顯示歡迎', await pg.evaluate(() => document.getElementById('installGuide').hidden && document.getElementById('welcome').hidden));

  console.log(fails ? '\n失敗 ' + fails + ' 項' : '\n全部通過');
  await b.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
