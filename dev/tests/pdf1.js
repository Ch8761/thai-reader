const { chromium } = require('playwright');
const OUT = process.argv[2], DIR = process.argv[3];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); }); await p.reload(); await p.waitForTimeout(1200);
  console.log('welcome visible:', await p.isVisible('#welcome'));
  await p.screenshot({ path: OUT + '/welcome.png' });
  await p.click('#wLevel button:has-text("中級")'); await p.click('#wRom button:has-text("不顯示")');
  console.log('help:', await p.innerText('#wLevelHelp'));
  await p.click('#wDone');
  console.log('welcome after:', await p.isVisible('#welcome'));
  const rep = async (k) => (await p.inputValue('#report')).split('\n').filter(l => k.some(x => l.startsWith(x))).join('\n');
  console.log(await rep(['句型庫', '內建字典', '歡迎']));
  for (const f of ['B.pdf', 'C.pdf']) {
    const t0 = Date.now();
    await p.setInputFiles('#pdffile', DIR + '/' + f);
    await p.waitForFunction(() => /目前顯示：.*pdf|開啟失敗/i.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
    console.log(f, 'status:', await p.innerText('#docstatus'), (Date.now() - t0) + 'ms');
    console.log(await p.innerText('#docpages'));
    await p.waitForTimeout(1500);
    console.log(await rep(['PDF']));
    await p.locator('#wrap').scrollIntoViewIfNeeded();
    await p.screenshot({ path: OUT + '/' + f + '-top.png' });
  }
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
