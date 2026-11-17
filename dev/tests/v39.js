// 1.39：์ 不單獨成詞、兩下改斷詞、沉浸式閱讀、匿名統計、預先下載
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const SRV = path.join(__dirname, '..', 'srv');
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    const ext = []; p.on('request', r => { if (/umami/.test(r.url())) ext.push(r.url()); });
    await p.goto('http://127.0.0.1:8765/index.html');
    const fresh = async () => { await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang); await p.reload(); await p.waitForTimeout(1300); for (let i = 0; i < 30 && !(await p.evaluate(() => window.__ev('dict2.ready'))); i++) { await p.waitForTimeout(200); } };
    const E = c => p.evaluate(c => window.__ev(c), c);
    const J = async c => JSON.parse(await E('JSON.stringify(' + c + ')'));
    const addText = async (t) => { await E("showTab('home'); $('input').value = " + JSON.stringify(t) + "; libAddText(); 1"); await p.waitForTimeout(900); };
    await fresh();
    // ---- ์ ----
    if (lang === 'zh') {
      const cases = { 'ไปห้างเทอร์มินอล': 'เทอร์มินอล', 'จอห์นสันมาแล้ว': 'จอห์นสัน', 'วงดนตรีร็อกแอนด์โรล': 'ร็อกแอนด์โรล', 'โรงเรียนนานาชาติเซนต์จอห์น': 'จอห์น', 'ดาวน์ทาวน์กริลล์แพง': 'กริลล์', 'อิทธิพลของโซเชียลมีเดีย': 'โซเชียลมีเดีย' };
      const segOf = async t => J("segment(" + JSON.stringify(t) + ").filter(function(s){return s.w}).map(function(s){return s.t})");
      for (const [t, want] of Object.entries(cases)) { const s = await segOf(t); ok('์ 跟前面的字一起：' + t, s.some(x => x.includes(want)) && !s.some(x => /^[ก-ฮ]{1,2}[ิุ]?์/.test(x)), s.join('|')); }
      const keep = { 'วันจันทร์นี้': 'วัน|จันทร์|นี้', 'อาจารย์สอนวิทยาศาสตร์': 'อาจารย์|สอน|วิทยาศาสตร์', 'ผมกินข้าวแล้ว': 'ผม|กิน|ข้าว|แล้ว', 'ร้านเรียบๆ': 'ร้าน|เรียบ' };
      for (const [t, want] of Object.entries(keep)) { const s = (await segOf(t)).join('|'); ok('原本對的不變：' + t, s === want, s); }
    }
    // ---- 兩下改斷詞 ----
    await addText('ผมชอบไปทะเลและกินข้าวมันไก่');
    const txt = await E('state.text');
    const segs = await J('segs.filter(function(s){return s.w}).map(function(s){return s.t})');
    ok(lang + ' 測試句子斷成 ชอบ|ไป|ทะเล', segs.includes('ไป') && segs.includes('ทะเล'), segs.join('|'));
    await E("showPop(segAt(" + txt.indexOf('ไปทะเล') + ")); 1"); await p.waitForTimeout(300);
    await p.click('.adjlinks .adjbtn:last-child'); await p.waitForTimeout(200);
    const qs = await p.locator('.segq').allInnerTexts();
    ok(lang + ' 第 1 下（斷詞不對？）就看到建議：跟前面、跟後面合起來', qs.length >= 2 && qs.some(x => x.includes('ชอบไป')) && qs.some(x => x.includes('ไปทะเล')), JSON.stringify(qs));
    ok(lang + ' 建議文字', (await p.locator('.segq-next .segql').innerText()).trim() === T('跟後面合起來', 'Join with next'));
    await p.click('.segq-next'); await p.waitForTimeout(300);
    const segs2 = await J('segs.filter(function(s){return s.w}).map(function(s){return s.t})');
    ok(lang + ' 第 2 下就改好：ไปทะเล 變成一個詞，視窗關掉', segs2.includes('ไปทะเล') && !(await p.locator('#pop').isVisible()), segs2.join('|'));
    ok(lang + ' 存進我的斷詞，所有文件都適用', (await J('myWords.map(function(x){return x.t})')).includes('ไปทะเล'));
    ok(lang + ' 有說明怎麼改回來', (await p.locator('#info').innerText()).includes(T('改回來', 'undo')));
    const i2 = txt.indexOf('ข้าวมันไก่');
    const sg = await J('segAt(' + i2 + ').t');
    if (sg === 'ข้าวมันไก่') {
      await E("showPop(segAt(" + i2 + ")); 1"); await p.waitForTimeout(300);
      await p.click('.adjlinks .adjbtn:last-child'); await p.waitForTimeout(200);
      ok(lang + ' 長的詞有「拆開」建議', (await p.locator('.segq-split').count()) === 1 && /｜/.test(await p.locator('.segq-split .segqw').innerText()), await p.locator('.segq-split .segqw').innerText());
      await p.click('.segq-split'); await p.waitForTimeout(300);
      const segs3 = await J('segs.filter(function(s){return s.w}).map(function(s){return s.t})');
      ok(lang + ' 拆開也是兩下', !segs3.includes('ข้าวมันไก่') && segs3.some(x => x.startsWith('ข้าว')), segs3.join('|'));
    } else { ok(lang + ' ข้าวมันไก่ 是一個詞（測拆開用）', false, sg); }
    // 舊的細調還在
    await E("showPop(segAt(" + txt.indexOf('ชอบ') + ")); 1"); await p.waitForTimeout(300);
    await p.click('.adjlinks .adjbtn:last-child'); await p.waitForTimeout(200);
    ok(lang + ' 原本的細調（‹＋ ＋›）還在下面', (await p.locator('.segedit .nmadj').count()) >= 4);
    await E('hidePop(); 1');
    // ---- 沉浸式閱讀 ----
    await addText('วันนี้ฉันตื่นเช้ามาก แล้วไปตลาดกับแม่ '.repeat(400));
    const wheel = async (dy, n) => { for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(60); } await p.waitForTimeout(350); };
    await p.mouse.move(200, 600);
    await wheel(300, 6);
    const imm = () => p.evaluate(() => document.body.classList.contains('immersive'));
    ok(lang + ' 往下讀：工具列和分頁列收起來', await imm());
    const tbBox = await p.locator('.tabbar').boundingBox();
    ok(lang + ' 分頁列真的移到畫面外', tbBox.y >= 840, tbBox.y);
    await wheel(-80, 1);
    ok(lang + ' 往上捲一點：回來', !(await imm()));
    await wheel(300, 3);
    ok(lang + ' 再往下又收起來', await imm());
    await E("showTab('home'); 1"); await p.waitForTimeout(200);
    ok(lang + ' 離開文件：一定顯示分頁列', !(await imm()));
    await E("localStorage.setItem('thai-immersive','0'); showTab('doc'); 1"); await p.waitForTimeout(400);
    await wheel(300, 5);
    ok(lang + ' 設定成「一直顯示」：不會收起', !(await imm()));
    await E("localStorage.removeItem('thai-immersive'); showTab('settings'); 1"); await p.waitForTimeout(300);
    ok(lang + ' 設定頁有「閱讀時收起工具列」', (await p.locator('#immGroup button').count()) === 2 && (await p.locator('#immGroup').innerText()).includes(T('自動收起', 'Auto-hide')));
    ok(lang + ' 設定頁有「匿名使用統計」', (await p.locator('#statsGroup button').count()) === 2);
    ok(lang + ' 設定頁有「離線使用文字辨識」', (await E("$('ocrPreMsg').textContent")) === T('還沒下載：第一次辨識照片或影片時會自動下載。', 'Not downloaded yet: it downloads the first time you recognise a photo or video.') && !(await E("$('ocrPreBtn').hidden")));
    // ---- 預先下載：主頁問一次 ----
    await E("showTab('home'); 1"); await p.waitForTimeout(300);
    ok(lang + ' 有文件以後，主頁問要不要先下載辨識工具', await p.locator('#ocrAsk').isVisible());
    await p.click('#ocrAskNo'); await p.waitForTimeout(200);
    ok(lang + ' 按「之後再說」：收起來，不再問', !(await p.locator('#ocrAsk').isVisible()) && (await E("localStorage.getItem('thai-ocr-pre')")) === 'no');
    await p.reload(); await p.waitForTimeout(1200);
    ok(lang + ' 重開也不再問', !(await p.locator('#ocrAsk').isVisible()));
    ok(lang + ' 測試網址不載入 Umami', ext.length === 0, ext.join(','));
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join(' / '));
    await p.close();
  }
  // ---- 匿名統計：假裝在正式網址，Umami 換成假的 ----
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**/*', async (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === 'cloud.umami.is') { return route.fulfill({ contentType: 'application/javascript', body: 'window.__trk=[];window.umami={track:function(a,b){window.__trk.push(typeof a==="function"?{view:a({website:"w",hostname:location.hostname,screen:"1x1",language:"zh",referrer:"",url:location.pathname+location.search,title:document.title}).url}:{ev:a,data:b||null});}};' }); }
      if (u.hostname === 'thai-reader-enn.pages.dev') {
        let f = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname.slice(1));
        const fp = path.join(SRV, f);
        if (fs.existsSync(fp) && fs.statSync(fp).isFile()) { return route.fulfill({ body: fs.readFileSync(fp), contentType: f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : f.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' }); }
        return route.fulfill({ status: 404, body: '' });
      }
      return route.continue();
    });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto('https://thai-reader-enn.pages.dev/?code=SECRET123');
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-level', 'c'); });
    await p.goto('https://thai-reader-enn.pages.dev/?code=SECRET123'); await p.waitForTimeout(2500);
    const trk = () => p.evaluate(() => window.__trk || []);
    let t = await trk();
    ok('統計：正式網址會載入 Umami', await p.evaluate(() => !!document.getElementById('umamiJs')) && await p.evaluate(() => document.getElementById('umamiJs').getAttribute('data-website-id')) === '535cb22e-a432-4ceb-969a-35850702ff42');
    ok('統計：打開 App 記一次瀏覽（網址只有 /home，不帶 ?code=）', t.filter(x => x.view === '/home').length === 1 && !JSON.stringify(t).includes('SECRET'), JSON.stringify(t));
    const open = t.find(x => x.ev === 'open');
    ok('統計：記下程度、介面語言、使用方式', open && open.data.level === 'c' && open.data.lang === 'zh' && open.data.mode === 'browser' && /^(0|1-5)$/.test(open.data.docs), JSON.stringify(open));
    await p.evaluate(() => { window.__ev("$('input').value = 'ผมชอบกินข้าวมันไก่ ชื่อเรื่องลับ'; $('textTitle').value = '我的私人日記'; libAddText(); 1"); }); await p.waitForTimeout(900);
    t = await trk();
    ok('統計：匯入只記種類', t.some(x => x.ev === 'import' && x.data.kind === 'text'));
    ok('統計：切到文件分頁記一次', t.some(x => x.view === '/doc'), JSON.stringify(t.map(x => x.view || x.ev)));
    ok('統計：不會送出文件內容或標題', !/ผม|私人|日記|ลับ/.test(JSON.stringify(t)));
    const n0 = t.length;
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#statsGroup button:nth-child(2)').click()); await p.waitForTimeout(200);
    ok('統計：關掉以後存起來（也告訴 Umami 停止）', await p.evaluate(() => localStorage.getItem('thai-stats-off') === '1' && localStorage.getItem('umami.disabled') === '1'));
    const n1 = (await trk()).length;
    await p.click('.tabbar [data-tab="cards"]'); await p.click('.tabbar [data-tab="home"]'); await p.waitForTimeout(300);
    ok('統計：關掉以後完全不送', (await trk()).length === n1, n1 + ' → ' + (await trk()).length);
    await p.reload(); await p.waitForTimeout(1500);
    ok('統計：關掉以後重開也不載入 Umami', !(await p.evaluate(() => !!document.getElementById('umamiJs'))));
    ok('統計：沒有錯誤', errs.length === 0, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
