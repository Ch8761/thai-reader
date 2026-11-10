const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(800);
  const out = {};
  for (const f of (process.env.ONLY ? [process.env.ONLY] : ['freen', 'becky', 'love'])) {
    await p.click('.tabbar [data-tab="home"]');
    await p.setInputFiles('#imgfile', ['ocrtest/ig/' + f + '.png']);
    await p.waitForFunction((ff) => /由文字辨識讀出|出錯/.test(document.getElementById('ocrmsg').textContent) && document.getElementById('h-docv').textContent.indexOf(ff) >= 0, f, { timeout: 120000 });
    await p.waitForTimeout(800);
    out[f] = { text: await p.$eval('#text', e => e.textContent), unk: await p.evaluate(() => window.__unk()), segs: await p.evaluate(() => window.__segs()) };
    await p.evaluate(() => { const a = [...document.querySelectorAll('#homeList button, #docList button')]; });
    // delete doc to avoid stale ocrmsg detection
    await p.click('.tabbar [data-tab="home"]');
    const del = await p.$('#docList button:has-text("刪除")'); if (del) { await del.click(); const c = await p.$('#docList button:has-text("確定")'); if (c) await c.click(); }
  }
  fs.writeFileSync('tests/ig_out.json', JSON.stringify(out, null, 1));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
