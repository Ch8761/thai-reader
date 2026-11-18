// 1.44：設定頁重新設計、開關、小火苗會動／不動／不顯示、資料修正
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const T = (zh, en) => lang === 'zh' ? zh : en;
    for (const vp of [{ width: 390, height: 844 }, { width: 820, height: 1180 }]) {
      const tag = lang + (vp.width < 500 ? ' 手機' : ' iPad');
      const p = await b.newPage({ viewport: vp }); p.setDefaultTimeout(6000); const errs = [];
      p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      await p.goto('http://127.0.0.1:8765/index.html');
      await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ocr-pre', 'no'); if (l === 'en') localStorage.setItem('thai-ui-lang', 'en'); }, lang);
      await p.reload(); await p.waitForTimeout(1500);
      const E = c => p.evaluate(c => window.__ev(c), c);
      await E("showTab('settings'); 1"); await p.waitForTimeout(200);
      const n = await p.locator('#view-settings .setmi').count();
      ok(tag + ' 7 個分類，每個都有圖示', n === 7 && (await p.locator('#view-settings .setmi .smico').count()) === 7, n);
      ok(tag + ' 上方有程度／連續天數卡片', (await p.locator('#setSummary').innerText()).includes(T('程度', 'Level')));
      ok(tag + ' 一開始是分類清單（iPad 也一樣，1.45 起）', await E("document.querySelector('.setgrp[data-grp=look]').hidden") && await p.locator('#view-settings .setmenu').isVisible());
      await p.click('.setmi[data-grp="look"]'); await p.waitForTimeout(150);
      ok(tag + ' 點分類進到那一頁：分類清單和程度卡片收起來、有返回鍵', !(await p.locator('#setSummary').isVisible()) && !(await p.locator('#view-settings .setmenu').isVisible()) && await p.locator('#view-settings .vhead .back').isVisible());
      // 泰文字體：卡片不擠
      const boxes = await p.$$eval('#thFontGroup button', bs => bs.map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
      ok(tag + ' 泰文字體是整齊的卡片（同寬、高度 ≥ 80）', boxes.length === 5 && boxes.every(x => x[1] >= 80 && Math.abs(x[0] - boxes[0][0]) <= 2), JSON.stringify(boxes));
      await p.click('#thFontGroup button >> nth=3'); await p.waitForTimeout(150);
      ok(tag + ' 點泰文字體會切換', (await E("localStorage.getItem('thai-thfont')")) === 'kanit');
      ok(tag + ' 說明只在「?」裡（名稱下面不再重複）', (await p.locator('.setgrp[data-grp=look] .setdesc').count()) === 0 && (await p.locator('.setgrp[data-grp=look] .qhelp:visible').count()) === 5);
      // 開關
      await E("settingsOpen('read'); 1"); await p.waitForTimeout(150);
      const sw = p.locator('.setrow:has(#romGroup) .swt');
      ok(tag + ' 「顯示拼音」是開關，預設開', (await sw.getAttribute('aria-checked')) === 'true');
      await sw.click(); await p.waitForTimeout(100);
      ok(tag + ' 按開關會關掉拼音', (await sw.getAttribute('aria-checked')) === 'false' && (await E("localStorage.getItem('thai-show-rom')")) === '0');
      await sw.click(); await p.waitForTimeout(100);
      ok(tag + ' 再按一次打開', (await sw.getAttribute('aria-checked')) === 'true' && (await E("localStorage.getItem('thai-show-rom')")) !== '0');
      await E("settingsOpen('cards'); 1"); await p.waitForTimeout(100);
      const tsw = p.locator('.setrow:has(#toneGroup) .swt');
      ok(tag + ' 聲調學習模式：預設關', (await tsw.getAttribute('aria-checked')) === 'false');
      await tsw.click(); await p.waitForTimeout(100);
      ok(tag + ' 打開聲調學習模式', (await tsw.getAttribute('aria-checked')) === 'true' && await E("toneMode") === true);
      await tsw.click();
      ok(tag + ' 「照片與影片辨識」有自動轉正開關', (await E("settingsOpen('ocr'); document.querySelectorAll('.setgrp[data-grp=ocr] .swt').length")) === 1);
      // 小火苗
      await E("settingsOpen('look'); 1");
      const flame = async () => p.evaluate(() => { const s = document.querySelector('#homeStreak svg.achfl'); return s ? s.getAttribute('class') : 'none'; });
      await E("localStorage.setItem('thai-days', '[]'); drawHomeStreak(); 1");
      ok(tag + ' 今天還沒讀：主頁火苗是灰的', /fl-dim/.test(await flame()), await flame());
      await E("localStorage.setItem('thai-days', JSON.stringify([dayKey(Date.now())])); drawHomeStreak(); 1");
      const done = await E("todayDone()");
      if (done) {
        ok(tag + ' 今天讀過＋會動：火苗在晃動', /fl-anim/.test(await flame()) && (await p.evaluate(() => getComputedStyle(document.querySelector('#homeStreak svg.achfl')).animationName)) === 'flick52');
        await p.click('#flameGroup button >> nth=1');
        ok(tag + ' 改成不動：火苗不晃', !/fl-anim/.test(await flame()) && (await p.evaluate(() => getComputedStyle(document.querySelector('#homeStreak svg.achfl')).animationName)) === 'none');
      } else { ok(tag + ' （測試用：標記今天讀過）', false, 'todayDone false'); }
      await p.click('#flameGroup button >> nth=2');
      ok(tag + ' 改成不顯示：主頁的火苗收起來', await E("$('homeStreak').hidden"));
      await p.click('#flameGroup button >> nth=0');
      ok(tag + ' 改回會動：火苗回來', !(await E("$('homeStreak').hidden")));
      ok(tag + ' 設定裡的三個選項各有預覽圖示', (await p.locator('#flameGroup .flpv').count()) === 3);
      ok(tag + ' 沒有錯誤', errs.length === 0, errs.join(' | '));
      await p.close();
    }
  }
  // 資料修正
  const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => window.__ev("JSON.stringify([DICT['กลับบ้าน'][0][4][0], document.documentElement.innerHTML.indexOf('毕晓普') < 0])"));
  ok('กลับบ้าน 的意思是「回家」；名人清單沒有簡體字', r === JSON.stringify(['回家', true]), r);
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
