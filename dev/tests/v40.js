// 1.40：介面整理、切回 App 不卡
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    const p = await b.newPage({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(6000); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ocr-pre', 'no'); localStorage.setItem('thai-tasks', JSON.stringify({ list: [{ id: 't1', t: 'X', n: 6, c: 1, done: false }] })); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
    await p.reload(); await p.waitForTimeout(1800);
    const E = c => p.evaluate(c => window.__ev(c), c);
    // 主頁
    ok(lang + ' 任務和讀物庫在同一行小字', await E("$('homeQuiet').contains($('questCard')) && $('homeQuiet').contains($('readerOpen'))"));
    ok(lang + ' 任務不再是有框的大橫條', await E("getComputedStyle($('questCard')).borderTopWidth") === '0px');
    ok(lang + ' 讀物庫照常打開', await E("$('readerOpen').click(); !rdWrap.hidden"));
    await E("rdClose(); 1");
    await E("syncDotState = function () { return ['ok', 'x']; }; syncDotDraw(); 1");
    ok(lang + ' 同步狀態有字，緊跟在標題旁', (await E("$('syncDot').innerText")).trim() === T('已同步', 'Synced') && await E("$('syncDot').getBoundingClientRect().left - $('h-home').getBoundingClientRect().right < 40"));
    // 文件頁
    const T1 = 'วันนี้ฉันตื่นเช้ามาก แล้วไปตลาดกับแม่\n'.repeat(400);
    await E("showTab('home'); $('input').value = " + JSON.stringify(T1) + "; libAddText(); 1"); await p.waitForTimeout(1200);
    await E("var d = docById(state.src.id); d.url = 'https://vocus.cc/a'; d.site = 'vocus'; syncDocView(); 1");
    ok(lang + ' 原文連結在標題下面', await E("$('docSrc').parentNode.className === 'vhtitle' && !$('docSrc').hidden"));
    ok(lang + ' 認得率那條在標題列下面（不在標題列裡）', await E("$('rrHint').parentNode === $('view-doc') && $('rrHint').previousElementSibling && $('rrHint').compareDocumentPosition(document.querySelector('#view-doc .vhead')) === Node.DOCUMENT_POSITION_PRECEDING"));
    ok(lang + ' 「點一個詞…」說明不顯示', await E("$('hint').hidden"));
    ok(lang + ' 「目前顯示：…」不顯示', await E("$('docstatus').hidden"));
    await p.click('[data-mode="hl"]').catch(() => {}); await p.waitForTimeout(150);
    ok(lang + ' 換成螢光筆時，說明會出現', await E("!$('hint').hidden && $('hint').textContent.length > 0"), await E("$('hint').textContent"));
    await p.click('[data-mode="tap"]').catch(() => {}); await p.waitForTimeout(150);
    ok(lang + ' 換回點字，說明又收起來', await E("$('hint').hidden"));
    // 切回 App 不卡
    const mp = await E("$('ink').width * $('ink').height");
    ok(lang + ' 長文件的手寫畫布不超過 800 萬像素', mp <= 8e6, mp);
    await E("state.strokes.push({ c: 'red', w: 3, p: [[10, 10], [100, 100]] }); redrawInk(); 1");
    ok(lang + ' 手寫照常畫得出來', await E("(function(){ var c=$('ink'), g=c.getContext('2d'); var k=c.width/PAGE_W; var d=g.getImageData(Math.round(55*k), Math.round(55*k), 1, 1).data; return d[3] > 0; })()"));
    ok(lang + ' 回到前景時不讓整頁重新繪製（不改 body transform）', await E("var n=0, ob=new MutationObserver(function(){n++}); ob.observe(document.body,{attributes:true,attributeFilter:['style']}); wakeUp(true); setTimeout(function(){ob.disconnect()},200); new Promise(function(r){setTimeout(function(){r(n===0)},250)})"));
    ok(lang + ' 回到前景當下不馬上同步，2 秒後才做', await E("var called=0, real=_runSync48; _runSync48=function(){called++; return Promise.resolve();}; wakeAt48 = Date.now(); runSync(); var a=called; new Promise(function(r){setTimeout(function(){ _runSync48=real; r(a===0 && called===1); }, 2300)})"));
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join(' | '));
    await p.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
