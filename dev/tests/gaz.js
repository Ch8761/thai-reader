const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(1000);
  for (const f of ['/mnt/user-data/uploads/B.pdf', '/mnt/user-data/uploads/C.pdf']) {
    await p.click('.tabbar [data-tab="home"]');
    const t0 = Date.now();
    await p.setInputFiles('#pdffile', [f]);
    await p.waitForFunction((n) => document.getElementById('h-docv').textContent.indexOf(n) >= 0 && /共 \d+ 頁/.test(document.getElementById('docpages').textContent), f.split('/').pop(), { timeout: 60000 }); await p.waitForTimeout(6000);
    await p.waitForTimeout(500);
    const r = (await p.inputValue('#report')).split('\n').filter(l => /^專有名詞/.test(l)).join('\n');
    console.log(f.split('/').pop(), (Date.now() - t0) / 1000 + 's\n' + r.slice(0, 900));
    const listed = await p.$$eval('#text mark.ent', els => els.length);
    console.log('marks', listed);
  }
  require('fs').writeFileSync('tests/c_text.txt', await p.$eval('#text', e => e.textContent));
  { const el = await p.$('#text mark.ent:has-text("ฟรีน")'); await el.scrollIntoViewIfNeeded(); const bb = await el.boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(400); console.log('POP:', (await p.innerText('#pop')).replace(/\n/g, ' / ').slice(0, 220)); await p.screenshot({ path: 'tests/gaz-pop.png' }); }
  console.log('tap:', await p.evaluate(() => { const el = document.getElementById('text'); const m = [...el.querySelectorAll('mark.ent')].map(x => x.textContent); return m.filter(x => /ฟรีน|สโรชา|เบ็ค|รีเบค/.test(x)).slice(0,10).join(' , '); }));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
