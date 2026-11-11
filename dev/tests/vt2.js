const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2] || 'vidtest2/hard.mp4';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 1180 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  await E('vid.debug = true'); const t0 = Date.now();
  await p.setInputFiles('#imgfile', [file]);
  let picked = false;
  for (let i = 0; i < 60; i++) {
    await p.waitForTimeout(3000);
    const st = await p.evaluate(() => ({ home: document.getElementById('homeMsg').textContent, vid: (document.getElementById('vidMsg') || {}).textContent, pick: !document.getElementById('vidPick').hidden, docv: !document.getElementById('view-doc').hidden }));
    console.log(Math.round((Date.now() - t0) / 1000), JSON.stringify(st));
    if (st.pick && !picked) { picked = true; await p.screenshot({ path: 'tests/vt-pick.png' }); console.log('guess region', await E("JSON.stringify(JSON.parse(localStorage.getItem('thai-vid-region')||'null'))")); await p.click('#vpGo'); }
    if (st.docv || /失敗|沒有讀到|取消/.test(st.home + st.vid)) break;
  }
  console.log(await E('state.text'), await E('JSON.stringify(vid.last)'));
  if (process.env.DBG) console.log(await E('JSON.stringify(vid.dbg)'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
