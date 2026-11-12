// 產生使用說明的截圖：每張截一小塊畫面，並用橘色框標出要按的地方
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'helpimg/png';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme', 'light'); });
  await p.reload(); await p.waitForTimeout(1200);
  await p.addStyleTag({ content: '*{transition:none!important;animation:none!important;caret-color:transparent!important}' });

  async function shot(name, ctxSel, targets, opts = {}) {
    await p.evaluate(([ctxSel]) => { const e = window.__q(ctxSel)[0]; if (e) { e.scrollIntoView({ block: 'center' }); } }, [ctxSel]);
    await p.waitForTimeout(250);
    const r = await p.evaluate(([ctxSel, targets]) => {
      document.querySelectorAll('.hl-mark').forEach(e => e.remove());
      function rect(sel) {
        const els = window.__q(sel).filter(e => e.getClientRects().length);
        if (!els.length) { return null; }
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        els.forEach(e => { const b = e.getBoundingClientRect(); x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); });
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
      targets.forEach(sel => {
        const t = rect(sel); if (!t) { return; }
        const d = document.createElement('div'); d.className = 'hl-mark';
        Object.assign(d.style, { position: 'fixed', left: (t.x - 5) + 'px', top: (t.y - 5) + 'px', width: (t.w + 10) + 'px', height: (t.h + 10) + 'px', border: '2.5px solid #e07a2f', borderRadius: '11px', boxShadow: '0 0 0 5px rgba(224,122,47,.16), 0 4px 14px rgba(224,122,47,.25)', zIndex: 99999, pointerEvents: 'none', boxSizing: 'border-box' });
        document.body.appendChild(d);
      });
      return rect(ctxSel);
    }, [ctxSel, targets]);
    if (r && opts.union) { const u = await p.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, opts.union); const x0 = Math.min(r.x, u.x), y0 = Math.min(r.y, u.y), x1 = Math.max(r.x + r.w, u.x + u.w), y1 = Math.max(r.y + r.h, u.y + u.h); r.x = x0; r.y = y0; r.w = x1 - x0; r.h = y1 - y0; }
    if (!r) { console.log('MISSING', name, ctxSel); return; }
    const pad = opts.tight !== undefined ? opts.tight : Math.max(20, opts.pad ?? 20);
    const x = Math.max(0, r.x - pad), y = Math.max(0, r.y - pad);
    const clip = { x, y, width: Math.min(820 - x, r.w + pad * 2), height: Math.min(opts.maxH || 560, 1180 - y, r.h + pad * 2) };
    await p.screenshot({ path: `${OUT}/${name}.png`, clip });
    await p.evaluate(() => document.querySelectorAll('.hl-mark').forEach(e => e.remove()));
    console.log('ok', name, Math.round(clip.width), Math.round(clip.height));
  }
  await p.evaluate(() => {
    /* 'sel@@文字'＝含這段文字的元素；'sel^^祖先'＝往上找 */
    window.__q = function (sel) {
      let m;
      if ((m = sel.split('^^')).length === 2) { return window.__q(m[0]).map(e => e.closest(m[1])).filter(Boolean); }
      if ((m = sel.split('@@')).length === 2) { return [...document.querySelectorAll(m[0])].filter(e => e.textContent.indexOf(m[1]) >= 0); }
      return [...document.querySelectorAll(sel)];
    };
  });
  const tapText = async (needle, off = 1) => {
    const pt = await p.evaluate(([n, off]) => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf(n); if (i >= 0) { node.parentElement.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.setStart(node, i + off); r.setEnd(node, i + off + 1); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } } }, [needle, off]);
    await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(450);
  };

  // ---------- 準備資料 ----------
  await p.setInputFiles('#pdffile', ['ocrtest/scan1.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 });
  await p.click('.tabbar [data-tab="home"]');
  await p.click('#openPaste'); await p.fill('#textTitle', 'Podcast 逐字稿');
  await p.fill('#input', 'วันนี้ฟรีน สโรชา มาเล่าเรื่องการถ่ายละครเรื่องใหม่ เธอบอกว่าเหนื่อยมาก แต่สนุกมาก และอยากให้ทุกคนได้ดูเร็ว ๆ นี้ ขอบคุณแฟน ๆ ที่ติดตามมาตลอดนะคะ');
  await p.click('#addText'); await p.waitForTimeout(700);
  await p.click('.tabbar [data-tab="home"]');
  await p.click('#homeFolders button.fadd'); await p.fill('#homeFolders .fname', '新聞'); await p.click('#homeFolders button@@建立'.split('@@')[0] + ':has-text("建立")');
  await p.waitForTimeout(300);
  await p.click('#homeFolders button:has-text("全部")'); await p.waitForTimeout(2500);

  // ---------- 主頁 ----------
  await shot('home-add', '.homeadd', ['.homeadd'], { pad: 16 });
  await shot('reader', '#readerOpen', ['#readerOpen'], { pad: 16, union: '.homeadd' });
  await p.click('.viewtoggle [data-hv="grid"]'); await p.waitForTimeout(400);
  await shot('home-grid', '#view-home', ['.viewtoggle'], { pad: 10, maxH: 560 });
  await p.click('.viewtoggle [data-hv="list"]'); await p.waitForTimeout(200);
  await shot('home-img', '.homeadd', ['.homeadd label@@圖片／影片']);
  await shot('home-folders', '#homeFolders', ['#homeFolders'], { pad: 12 });
  await shot('home-move', '#docList li.doccard:first-child', ['#docList li.doccard:first-child select'], { maxH: 300 });
  await p.click('#homeFolders button:has-text("新聞")'); await p.waitForTimeout(300);
  await shot('home-folderbar', '#homeFolderBar', ['#homeFolderBar button'], { pad: 12 });
  await p.click('#homeFolders button:has-text("全部")'); await p.waitForTimeout(300);
  await p.click('#openPaste'); await p.waitForTimeout(200); await p.fill('#urlInput', 'https://www.bbc.com/thai/articles/example');
  await shot('url-panel', '#pastebox', ['#urlInput', '#addUrl'], { pad: 10, maxH: 600 });
  await p.fill('#urlInput', ''); await p.click('#openPaste'); await p.waitForTimeout(200);
  await p.setInputFiles('#imgfile', ['phototest/sign.jpg']); await p.waitForSelector('#photoEdit:not([hidden])', { timeout: 30000 }); await p.waitForTimeout(600);
  await p.evaluate(() => { const r = document.getElementById('phStage').getBoundingClientRect(); window.__phr = [r.left, r.top, r.width, r.height]; });
  { const r = await p.evaluate(() => window.__phr); const C = JSON.parse(require('fs').readFileSync('phototest/corners.json')); const S = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let i = 0; i < 4; i++) { await p.mouse.move(r[0] + S[i][0] * r[2] + (S[i][0] ? -2 : 2), r[1] + S[i][1] * r[3] + (S[i][1] ? -2 : 2)); await p.mouse.down(); await p.mouse.move(r[0] + C[i][0] * r[2], r[1] + C[i][1] * r[3], { steps: 4 }); await p.mouse.up(); } }
  await shot('photo-edit', '#photoEdit .phsheet', ['#phBox'], { tight: 0, maxH: 1000 });
  await p.click('#phCancel'); await p.waitForTimeout(300);
  await p.setInputFiles('#imgfile', ['vidtest2/hard.mp4']); await p.waitForSelector('#vidPick:not([hidden])', { timeout: 60000 }); await p.waitForTimeout(1500);
  await shot('vid-pick', '#vidPick .vpsheet', ['#vpRect'], { tight: 0, maxH: 1000 });
  await p.click('#vpCancel'); await p.waitForTimeout(300);

  // ---------- 查詞 ----------
  await p.click('#docList .dopen:has-text("Podcast")'); await p.waitForTimeout(900);
  await shot('tap-tool', '.workbox .toolbar', ['.tool[data-mode="tap"]'], { pad: 10 });
  await tapText('เหนื่อย', 2);
  await shot('pop-overview', '#pop', [], { tight: 0, maxH: 640 });
  await p.$eval('#pop', e => { e.scrollTop = e.scrollHeight; }); await p.waitForTimeout(200);
  await shot('pop-links', '#pop .links', ['#pop .links > *:nth-child(-n+2)'], { tight: 12 });
  await shot('yg-pop', '#pop .links', ['#pop .ygbtn'], { tight: 12, union: '#pop .extlinks' });
  await shot('card-add', '#pop .head', ['#pop .cardbtn'], { tight: 12 });
  await p.click('#pop .cardbtn'); await p.waitForTimeout(200);
  await p.click('#pop .x'); await tapText('สโรชา', 2);
  await shot('pop-name', '#pop', ['#pop .ent-sec'], { tight: 0, maxH: 640 });
  await p.click('#pop .x'); await tapText('ติดตาม', 2);
  await p.click('#pop .cardbtn'); await p.waitForTimeout(200);
  await p.$eval('#pop', e => { e.scrollTop = e.scrollHeight; });
  await p.click('#pop button:has-text("這是名字？")'); await p.waitForTimeout(300);
  await shot('name-edit', '#pop .nameedit', ['#pop .nmadj'], { tight: 10 });
  await p.click('#pop .x').catch(() => {});
  { const a = await p.evaluate(() => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf('เธอบอกว่า'); if (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 28); const rs = r.getClientRects(); const b = rs[0]; return { x0: b.left + 2, x1: b.right - 4, y: b.top + b.height / 2 }; } } });
    await p.mouse.move(a.x0, a.y); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(a.x0 + (a.x1 - a.x0) * i / 10, a.y); } await p.mouse.up(); await p.waitForTimeout(800); }
  await p.evaluate(() => { const t = document.getElementById('spTr'); t.className = 'sp-tr'; t.textContent = '她說很累，但是很好玩'; });
  await shot('sel-pop', '#selpop', ['#spTr'], { tight: 14 });
  await p.click('#spClose');
  await p.evaluate(() => window.__ev("(function(){ var i = state.text.indexOf('ใหม่'); if (i < 0) i = state.text.indexOf('ละคร'); showPop(segAt(i + 1)); return 1; })()")); await p.waitForTimeout(300);
  await shot('pop-notes', '#pop', ['#pop .popnotes'], { pad: 8, maxH: 700 });
  await p.evaluate(() => { localStorage.setItem('thai-tone-mode', '1'); window.__ev("toneMode = true; loadTones()"); }); await p.waitForTimeout(800);
  await p.evaluate(() => window.__ev("(function(){ var i = state.text.indexOf('ละคร'); showPop(segAt(i + 1)); return 1; })()")); await p.waitForTimeout(500);
  await shot('tone-pop', '#pop', ['#pop .tonesec'], { pad: 8, maxH: 900 });
  await p.evaluate(() => { localStorage.setItem('thai-tone-mode', '0'); window.__ev("toneMode = false; 1"); });
  await p.click('#pop .x').catch(() => {});
  await p.evaluate(() => window.__ev("(function(){ for (var k = 0; k < segs.length; k++) { var x = segs[k]; if (!x.w) continue; showPop(x); if (document.querySelector('#pop details.fold .glist .gcard')) return k; } return -1; })()"));
  await p.evaluate(() => { const d = document.querySelector('#pop details.fold'); if (d) d.open = true; });
  await p.click('#pop details.fold .glist .gcard >> nth=0 >> summary').catch(e => console.log('gram click fail', String(e).slice(0, 80))); await p.waitForTimeout(500);
  await shot('gram-focus', '#pop', ['#pop .gfocus', '#text mark.gsel'], { pad: 8, maxH: 900, union: '#text mark.gsel' });
  await p.click('#pop .x').catch(() => {});
  await p.evaluate(() => window.__ev("(function(){ var x = segs.filter(function(s){ return s.w && s.t.length >= 6 && /^[\u0E01-\u0E4E]+$/.test(s.t); })[0] || segs.filter(function(s){ return s.w; })[3]; showPop(x); return 1; })()")); await p.waitForTimeout(300);
  await p.click('#pop .adjbtn:has-text("斷詞不對？")'); await p.click('#pop .segtabs button:has-text("拆開")'); await p.locator('#pop .seggap').last().click(); await p.waitForTimeout(200);
  await shot('seg-edit', '#pop', ['#pop .segedit'], { pad: 8, maxH: 700 });
  await p.click('#pop .x').catch(() => {});
  await p.click('.tabbar [data-tab="home"]'); await p.click('#openPaste'); await p.fill('#textTitle', '示範'); await p.fill('#input', 'วันนี้ไปประชุมที่กรมส่งเสริมการค้า แล้วก็เดินทางกลับประเทศไทย'); await p.click('#addText');
  await p.waitForTimeout(800);
  { const ok = await p.evaluate(() => window.__ev("(function(){ var i = state.text.indexOf('กรมส่งเสริมการค้า'); if (i < 0) return false; var sg = segAt(i + 4); showPop(sg); return true; })()")).catch(e => 'err ' + e.message); console.log('ent pop', ok); }
  await p.waitForTimeout(300);
  await p.evaluate(() => { const r = document.querySelector('#pop .mtrow'); if (r) { r.hidden = false; r.classList.remove('loading'); r.querySelector('.mt-v').textContent = '國際貿易促進廳'; } });
  await shot('ent-mean', '#pop .ent-sec', ['#pop .compose', '#pop .mtrow'], { pad: 10 });
  await p.click('#pop .x').catch(() => {});
  await p.click('.tabbar [data-tab="home"]'); await p.click('#docList .dopen:has-text("Podcast")'); await p.waitForTimeout(900);

  // ---------- 筆記 ----------
  await p.click('.tool[data-mode="hl"]'); await p.waitForTimeout(200);
  { const a = await p.evaluate(() => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf('เหนื่อยมาก'); if (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 10); const b = r.getBoundingClientRect(); return { x0: b.left + 2, x1: b.right - 2, y: b.top + b.height / 2 }; } } });
    await p.mouse.move(a.x0, a.y); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(a.x0 + (a.x1 - a.x0) * i / 8, a.y); } await p.mouse.up(); await p.waitForTimeout(300); }
  await shot('note-hl', '.workbox', ['.tool[data-mode="hl"]', '#toolopts', '#text .hl'], { pad: 6, maxH: 360 });
  await p.click('.tool[data-mode="ink"]'); await p.waitForTimeout(200);
  { const wr = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
    await p.mouse.move(wr.x + 60, wr.y + 150); await p.mouse.down(); for (let i = 1; i <= 20; i++) { await p.mouse.move(wr.x + 60 + i * 12, wr.y + 150 + Math.sin(i / 2) * 14); } await p.mouse.up(); await p.waitForTimeout(300); }
  await shot('note-ink', '.workbox', ['.tool[data-mode="ink"]', '#toolopts'], { pad: 6, maxH: 360 });
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(200);
  await shot('note-box', '#toolhead', ['.tool[data-mode="box"]', '#stylebar'], { pad: 10 });
  await shot('note-undo', '#toolhead', ['#undo', '#redo', '#clear'], { pad: 10, maxH: 140 });
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(150);
  await p.dispatchEvent('#fav-box-1', 'pointerup'); await p.waitForTimeout(150);
  await p.dispatchEvent('#fav-box-1', 'pointerup'); await p.waitForTimeout(250);
  await shot('note-colors', '#toolhead', ['#fav-box-1', '#cpop'], { pad: 10, union: '#cpop', maxH: 700 });
  await p.dispatchEvent('#fav-box-1', 'pointerup'); await p.waitForTimeout(150);
  await p.dispatchEvent('#fav-box-0', 'pointerup'); await p.waitForTimeout(150);
  await p.click('.tool[data-mode="tap"]');
  await p.click('.tool[data-mode="tap"]');
  await shot('note-export', '#view-doc .vhead', ['#openExport'], { pad: 12 });
  await p.evaluate(() => {
    const q = []; let cur = null;
    window.speechSynthesis.speak = (u) => { q.push(u); if (!cur) next(); };
    function next() { cur = q.shift(); if (!cur) return; const u0 = cur; setTimeout(() => { if (cur !== u0) return; u0.onstart && u0.onstart(); setTimeout(() => { if (cur !== u0) return; cur = null; u0.onend && u0.onend(); next(); }, 900); }, 20); }
    window.speechSynthesis.cancel = () => { q.length = 0; if (cur) { const u = cur; cur = null; u.onerror && u.onerror({ error: 'interrupted' }); } };
    Object.defineProperty(window.speechSynthesis, 'speaking', { get: () => !!cur, configurable: true });
    Object.defineProperty(window.speechSynthesis, 'pending', { get: () => q.length > 0, configurable: true });
  });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('#readAll'); await p.waitForTimeout(1300);
  await p.evaluate(() => { const n = document.getElementById('ttsnote'); if (n) { n.textContent = ''; } });
  await shot('read-along', '.workbox', ['#readAll', '#text mark.reading'], { pad: 8, maxH: 520, union: '.ttsbar' });
  await p.click('#stopRead'); await p.waitForTimeout(200);

  // ---------- 掃描頁 ----------
  await p.click('.tabbar [data-tab="home"]'); await p.click('#docList .dopen:has-text("scan1")');
  await p.waitForFunction(() => /讀不到文字/.test(document.getElementById('ocrmsg').textContent), null, { timeout: 60000 });
  await shot('ocr-go', '#docsec', ['#ocrGo'], { pad: 12 });
  await p.click('#ocrGo');
  await p.waitForFunction(() => /由文字辨識讀出/.test(document.getElementById('ocrmsg').textContent), null, { timeout: 120000 });
  await p.waitForTimeout(500);
  await shot('ocr-redo', '#view-doc .vhead', ['#ocrRedo'], { pad: 12 });

  // ---------- 閱讀 ----------
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.evaluate(() => { const r = document.getElementById('ttsSeek'); r.value = 350; r.style.setProperty('--p', '35%'); });
  await shot('tts-bar', '.ttsbar', ['#player'], { pad: 10 });
  await shot('view-zoom', '#toolhead', ['#vbZoom'], { pad: 10 });
  await shot('view-page', '#toolhead', ['#vbPage'], { pad: 10 });
  await p.click('#vbZoom'); await p.waitForTimeout(200);
  await shot('view-menu', '#vbMenu', ['#vbMenu button@@左右翻頁'], { tight: 14 });
  await p.click('#vbZoom');

  // ---------- 生字卡 ----------
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(300);
  await p.click('#cardTabs button:has-text("複習")').catch(() => {}); await p.waitForTimeout(300);
  await shot('cards-review', '#cardbody', ['#cardbody button@@開始複習'], { pad: 12, maxH: 460 });
  await p.click('#cardbody button:has-text("開始複習")').catch(() => {}); await p.waitForTimeout(300);
  await shot('cards-flip', '#cardbody', ['#cardbody button@@看答案'], { pad: 12, maxH: 520 });
  await p.click('#cardbody button:has-text("看答案")').catch(() => {}); await p.waitForTimeout(300);
  await shot('cards-grade', '#cardbody', ['#cardbody .grades'], { pad: 12, maxH: 600 });
  await p.click('#cardTabs button:has-text("測驗")'); await p.waitForTimeout(200);
  await p.click('#cardbody button:has-text("開始測驗")'); await p.waitForTimeout(300);
  await p.click('#cardbody .qopt >> nth=0'); await p.waitForTimeout(300);
  await shot('cards-quiz', '#cardbody', ['#cardbody .qopts'], { pad: 12, maxH: 640 });
  await p.click('#cardTabs button:has-text("清單")'); await p.waitForTimeout(300);
  await p.click('#cardbody .crow >> nth=0'); await p.waitForTimeout(900);
  await shot('cards-detail', '.cdsheet', ['.cdsheet .cdlife'], { pad: 0, maxH: 1000 });
  await p.click('#cdClose'); await p.waitForTimeout(200);

  // ---------- 設定 ----------
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  await p.evaluate(() => window.settingsOpen('look')); await p.waitForTimeout(200);
  await shot('set-theme', '#themeGroup^^.setrow', ['#themeGroup'], { pad: 10 });
  await shot('set-font', '#fontGroup^^.setrow', ['#fontGroup'], { pad: 10 });
  await p.evaluate(() => window.settingsOpen('data')); await p.waitForTimeout(200);
  await shot('set-backup', '#bkSave^^.setrow', ['#bkSave'], { pad: 10, maxH: 420 });
  await p.evaluate(() => window.settingsOpen('help')); await p.waitForTimeout(200);
  await shot('set-feedback', '#fbText^^.setrow', ['#fbText'], { pad: 10, maxH: 420 });
  await p.evaluate(() => window.settingsOpen('words')); await p.waitForTimeout(200);
  await shot('set-names', '#myNamesCount^^.setrow', [], { pad: 10, maxH: 420 });
  console.log('ERRORS:', errs.join(' | ') || 'none');
  await b.close();
})();
