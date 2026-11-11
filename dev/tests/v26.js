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
    await E("(function(){ lib.docs.push({id:'text:a1',name:'a1',type:'text',size:1,added:1,opened:0,folder:''}); localStorage.setItem(PDF_DOC_PREFIX+'text:a1', JSON.stringify({text:" + JSON.stringify(R[0].text) + ",src:{type:'text',id:'text:a1',name:'a1'},hl:[],strokes:[],boxes:[],nextId:1})); return 1; })()");
    await E("openDoc('text:a1')"); await p.waitForTimeout(800);
    const marks = () => p.evaluate(() => Array.from(document.querySelectorAll('#text mark.ent')).map(m => m.textContent + ':' + m.className.replace(/.*ent-/, '')).join(', '));
    let m = await marks();
    ok(lang + ' 冬蔭功標成菜名', /ต้มยำกุ้ง:food/.test(m), m);
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
    for (const sec of ['look', 'read', 'words', 'reading', 'display', 'help', 'data']) { const vis = await p.locator('#entTypes').isVisible().catch(() => false); if (vis) break; await p.evaluate(s => window.settingsOpen && window.settingsOpen(s), sec).catch(() => {}); await p.waitForTimeout(150); }
    const chips = (await p.locator('#entTypes button').allTextContents()).join('|');
    ok(lang + ' 類別開關 8 個', (await p.locator('#entTypes button').count()) === 8, chips);
    await p.screenshot({ path: 'shots/v26-set-' + lang + '.png' });
    await p.locator('#entTypes button.ent-place').click(); await p.waitForTimeout(200);
    ok(lang + ' 地名關掉：aria-pressed=false', (await p.getAttribute('#entTypes button.ent-place', 'aria-pressed')) === 'false');
    await p.locator('#entTypes button.ent-place').scrollIntoViewIfNeeded(); await p.screenshot({ path: 'shots/v26-set-off-' + lang + '.png' });
    await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(500); m = await marks();
    ok(lang + ' 文章裡地名不標、菜名照標', !/place/.test(m) && /food/.test(m), m);
    await p.reload(); await p.waitForTimeout(1300); await E("openDoc('text:a1')"); await p.waitForTimeout(800); m = await marks();
    ok(lang + ' 重開還記得', !/place/.test(m) && /food/.test(m), m);
    await E("(function(){ var g = getEnts().filter(function(e){return e.type==='food'})[0]; showPop({t:state.text.slice(g.s,g.e), i:g.s, n:g.e-g.s, w:true}); return 1; })()").catch(e => console.log('pop', e.message));
    await p.waitForTimeout(400);
    console.log(lang, 'pop:', (await p.locator('.ent-sec').first().textContent().catch(() => '(none)')).replace(/\s+/g, ' ').slice(0, 160));
    ok(lang + ' 沒有錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(fails ? '失敗 ' + fails : '全部通過');
})();
