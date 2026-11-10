const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await p.setInputFiles('#imgfile', [process.argv[2] || 'bug3/menu.png']);
  await p.waitForSelector('#photoEdit:not([hidden])', { timeout: 20000 }); await p.waitForTimeout(400);
  await p.click('#phOk');
  await p.waitForFunction(() => { try { return !document.getElementById('view-doc').hidden && window.__ev('ocr.total') > 0 && window.__ev('ocr.done') >= window.__ev('ocr.total') && !window.__ev('ocr.busy'); } catch (e) { return false; } }, null, { timeout: 240000 });
  await p.waitForTimeout(800);
  console.log('ocr msg:', await E('ocr.msg'), '| err:', await E('ocr.lastError'));
  console.log('text:', JSON.stringify(await E('state.text')).slice(0, 600));
  console.log('pages:', await E('JSON.stringify((pdf && pdf.pages || []).map(function(g){return (g.text||"").length;}))'));
  await p.screenshot({ path: 'bug3/menu-doc.png' });
  for (const [x, y, name] of [[110, 462, 'ก๋วยจั๊บ'], [115, 520, 'เกาเหลา'], [115, 580, 'หมูกรอบ'], [245, 580, 'จานละ'], [490, 465, 'น้ำส้ม'], [620, 470, 'ขวดละ'], [120, 695, 'ซาลาเปา'], [500, 820, 'น้ำเปล่า']]) {
    await E('hidePop()'); await p.mouse.click(x, y); await p.waitForTimeout(500);
    const vis = await p.locator('#pop').isVisible().catch(() => false);
    console.log('tap', name, '->', vis ? await p.textContent('#pop .pw').catch(() => '?') : '(沒有反應)');
  }
  const i = await E("state.text.indexOf('หมูกรอบ')"); console.log('index of หมูกรอบ', i);
  if (i >= 0) { await E("(function(){ var s = segAt(state.text.indexOf('หมูกรอบ') + 1); showPop(s); return 1; })()"); await p.waitForTimeout(400); console.log('popup word:', await p.textContent('#pop .pw').catch(() => 'none')); await p.screenshot({ path: 'bug3/menu-pop.png' }); }
  console.log('errors:', errs); await b.close();
})();
