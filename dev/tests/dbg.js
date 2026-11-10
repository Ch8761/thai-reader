const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.setInputFiles('#pdffile', ['/mnt/user-data/uploads/B.pdf']);
  await p.waitForFunction(() => /共 \d+ 頁/.test(document.getElementById('docpages').textContent), null, { timeout: 60000 }).catch(e => console.log('wait fail'));
  await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => window.__ev("JSON.stringify({ n: pdf && pdf.tl.length, sample: pdf && pdf.tl.slice(0, 5).map(x => [x.page, x.sep, (x.t || '').slice(0, 20)]), text: state.text.slice(0, 80) })")));
  console.log('ERR', errs.join(' | '));
  await b.close();
})();
