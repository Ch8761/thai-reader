// 1.35：泰文字體選擇、影片字幕多一種讀法、描邊字、辨識第二意見
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
const ZH = /[㐀-鿿]/;
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
    await p.reload(); await p.waitForTimeout(1300);
    const E = c => p.evaluate(c => window.__ev(c), c);
    const thaiVar = () => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--thai'));
    const fam = sel => p.evaluate(sel => getComputedStyle(document.querySelector(sel)).fontFamily, sel);
    ok(lang + ' 預設：系統字體', !(await thaiVar()).includes('TR ') && (await p.evaluate(() => localStorage.getItem('thai-thfont'))) === null);
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(250); await p.click('.setmi[data-grp="look"]'); await p.waitForTimeout(400);
    const labs = await p.$$eval('#thFontGroup button', a => a.map(x => x.firstChild.textContent.trim()));
    ok(lang + ' 設定 → 外觀與字體：泰文字體有五個選項', labs.join() === T('系統預設,有圈・書面體,有圈・報紙體,無圈・廣告體,手寫風', 'System default,Looped (textbook),Looped serif (newspaper),Loopless (ads, signs),Handwriting style'), labs.join());
    ok(lang + ' 每個選項下面有用那個字體寫的泰文樣本', (await p.$$eval('#thFontGroup .thfs', a => a.map(x => x.textContent + '|' + x.style.fontFamily.includes('TR ')).join())) === 'ภาษาไทย|false,ภาษาไทย|true,ภาษาไทย|true,ภาษาไทย|true,ภาษาไทย|true');
    await p.waitForTimeout(600);
    const loaded = await p.evaluate(async () => { await document.fonts.ready; return ['sarabun', 'serif', 'kanit', 'mali'].map(k => document.fonts.check('19px "TR ' + k + '"', 'ภาษาไทย')).join(); });
    ok(lang + ' 四種字型檔都載得到', loaded === 'true,true,true,true', loaded);
    const wds = await p.$$eval('#thFontGroup .thfs', a => a.map(x => Math.round(x.getBoundingClientRect().width)));
    ok(lang + ' 樣本看起來真的不一樣（寬度不同）', new Set(wds).size >= 3, wds.join());
    await p.screenshot({ path: 'shots/v35-thfont-' + lang + '.png' });
    await p.locator('#thFontGroup button').nth(3).click(); await p.waitForTimeout(300);
    ok(lang + ' 選「無圈・廣告體」：存起來、套用', (await p.evaluate(() => localStorage.getItem('thai-thfont'))) === 'kanit' && (await thaiVar()).includes('"TR kanit"') && (await p.locator('#thFontGroup button').nth(3).getAttribute('aria-checked')) === 'true');
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(400);
    ok(lang + ' 文章的泰文換成這個字體', (await fam('#text')).includes('TR kanit'), await fam('#text'));
    await p.screenshot({ path: 'shots/v35-doc-kanit-' + lang + '.png' });
    await p.reload(); await p.waitForTimeout(1300);
    ok(lang + ' 重新打開還在', (await thaiVar()).includes('"TR kanit"'));
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(250); await p.click('.setmi[data-grp="look"]'); await p.waitForTimeout(300);
    await p.locator('#thFontGroup button').nth(1).click(); await p.waitForTimeout(200);
    ok(lang + ' 換成「有圈・書面體」', (await thaiVar()).includes('"TR sarabun"'));
    await p.locator('#thFontGroup button').nth(0).click(); await p.waitForTimeout(200);
    ok(lang + ' 選回系統預設：還原', !(await thaiVar()).includes('TR ') && (await p.evaluate(() => localStorage.getItem('thai-thfont'))) === null);
    ok(lang + ' 會跟著備份和同步', (await E("SETTING_KEYS.indexOf('thai-thfont') >= 0 && SYNC_SET.indexOf('thai-thfont') >= 0")) === true);
    const row = p.locator('#thFontGroup').locator('xpath=ancestor::div[contains(@class,"setrow")]');
    await row.locator('.qhelp').click(); await p.waitForTimeout(150);
    const hb = await p.locator('#shBody').innerText();
    ok(lang + ' 「?」說明' + (lang === 'en' ? '沒有中文' : '有寫有圈／無圈的差別'), lang === 'en' ? !ZH.test(hb) : hb.includes('有圈') && hb.includes('無圈'), hb.slice(0, 80));
    await p.click('#shClose');
    if (lang === 'en') { ok('en 設定列沒有中文', !ZH.test(await row.innerText()), await row.innerText()); }
    ok(lang + ' 沒有程式錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  // ---- 辨識 ----
  {
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2500);
    const run = async (draw) => p.evaluate(async (draw) => {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 220; const g = c.getContext('2d'); new Function('g', 'c', draw)(g, c);
      window.__c = c;
      return window.__ev("ensureOcr().then(function (w) { return w.recognize(window.__c); }).then(function (r) { return r.data.blocks[0].paragraphs[0].lines.map(function (l) { return l.text.trim(); }).join('|'); })");
    }, draw);
    await p.evaluate(async () => { const ff = new FontFace('fk', 'url(fonts/kanit-700.woff2)'); await ff.load(); document.fonts.add(ff); const f2 = new FontFace('fs', 'url(fonts/sarabun-400.woff2)'); await f2.load(); document.fonts.add(f2); });
    const A = 'ความสุขในตอนเช้าของแต่ละคน', B = 'แค่ตื่นมาแล้วได้เจอหน้าเธอเป็นคนแรก';
    const outline = "var gr = g.createLinearGradient(0, 0, c.width, c.height); gr.addColorStop(0, '#6b7f5a'); gr.addColorStop(0.5, '#c9b28a'); gr.addColorStop(1, '#3d4d66'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); g.font = '40px fk'; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.lineWidth = 7; g.strokeText('" + A + "', 30, 80); g.strokeText('" + B + "', 30, 170); g.fillStyle = '#fff'; g.fillText('" + A + "', 30, 80); g.fillText('" + B + "', 30, 170);";
    let r = await run(outline);
    ok('白字黑邊、彩色背景（字幕常見）：讀得對', r === A + '|' + B, r);
    r = await run(outline.replace("g.strokeStyle = '#000'", "g.strokeStyle = '#fff'").replace("g.fillStyle = '#fff'; g.fillText", "g.fillStyle = '#111'; g.fillText"));
    ok('黑字白邊：讀得對', r === A + '|' + B, r);
    r = await run("g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#111'; g.font = '36px fs'; g.fillText('" + A + "', 30, 80); g.fillText('" + B + "', 30, 170);");
    ok('一般白底黑字（有圈書面體）：照樣讀得對', r === A + '|' + B, r);
    r = await run("g.fillStyle = '#1d2733'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#ffe14d'; g.font = '36px fk'; g.fillText('" + A + "', 30, 80); g.fillText('" + B + "', 30, 170);");
    ok('深色底黃字（無圈廣告體）：讀得對', r === A + '|' + B, r);
    // 造型特別的字體：新版讀錯時，請舊工具再讀
    const m0 = JSON.parse(await p.evaluate(() => window.__ev('JSON.stringify(otMix)')));
    const r2 = await p.evaluate(async () => { const img = new Image(); img.src = 'vframe.png'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); window.__c = c; return window.__ev("ensureOcr().then(function (w) { return w.recognize(window.__c); }).then(function (r) { return r.data.blocks[0].paragraphs[0].lines.map(function (l) { return l.text.trim(); }).join('|') + '##' + JSON.stringify(otMix); })"); });
    ok('很寬的無圈字體（新版會把 ร 認成 ธ）：拼不出詞的那一行改用舊工具的結果', r2.replace(/ /g, '').includes('เป็นคนแรกในทุกเช้า') && !r2.includes('แธก') && JSON.parse(r2.split('##')[1]).swaps > m0.swaps, r2.slice(-260));
    ok('影片有「ot」這種讀法（新版直接讀框裡的畫面）', (await p.evaluate(() => window.__ev("String(vidRecognize).indexOf(\"mode === 'ot'\") > 0 && typeof otWorker.recognizeOnly === 'function'"))) === true);
    ok('沒有程式錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? 'FAILS: ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
