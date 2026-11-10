const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); }); await p.reload(); await p.waitForTimeout(1000);
  console.log('welcome title:', await p.innerText('#h-welcome'), '| gloss btns:', await p.innerText('#wGloss'));
  await p.click('#wDone');
  const rep = async (k) => (await p.inputValue('#report')).split('\n').filter(l => k.some(x => l.startsWith(x))).join('\n');
  const pt = (word, nth = 0, off = 1) => p.evaluate(([word, nth, off]) => {
    const root = document.getElementById('text'); const spans = root.classList.contains('pdf') ? [...root.querySelectorAll('.tl')] : [root];
    let seen = 0;
    for (const sp of spans) { const t = sp.textContent; let i = -1;
      while ((i = t.indexOf(word, i + 1)) >= 0) { if (seen++ < nth) continue;
        const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); let n, acc = 0;
        while ((n = w.nextNode())) { const l = n.nodeValue.length; const k = i + off; if (k < acc + l) { const rg = document.createRange(); rg.setStart(n, k - acc); rg.setEnd(n, k - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += l; } } }
    return null; }, [word, nth, off]);
  const tap = async (word, nth = 0) => { const q = await pt(word, nth); if (!q) return word + ': not found';
    await p.evaluate((y) => window.scrollBy(0, y - 400), q.y); await p.waitForTimeout(250); const q2 = await pt(word, nth); await p.keyboard.press('Escape'); await p.mouse.click(q2.x, q2.y); await p.waitForTimeout(250);
    if (!await p.isVisible('#pop')) return word + ' → ' + await p.innerText('#info');
    const ent = await p.$('#pop .ent-sec'); const et = ent ? (await ent.innerText()).split('\n').slice(0, 2).join(' ') : '';
    return word + ' → ' + (await p.innerText('#pop .pw')) + (et ? ' [' + et + ']' : '') + ' | ' + (await p.innerText('#pop .pd')).replace(/\n/g, ' / ').slice(0, 90); };
  for (const w of ['อากาศ', 'สวน', 'ร้าน']) console.log(await tap(w));
  // translate panel in text mode
  await p.click('#translateAll'); console.log('tr text mode:', await p.innerText('#trlist'), '| href len', await p.$eval('#trlist a', a => a.href.length));
  await p.setInputFiles('#pdffile', 'pdfin/B.pdf'); await p.waitForFunction(() => document.getElementById('docstatus').textContent.includes('B.pdf（'), null, { timeout: 60000 }); await p.waitForTimeout(800);
  console.log(await rep(['專有名詞', '詞義語言']));
  for (const w of ['ไต้หวัน', 'ชิง', 'กระทรวงการต่างประเทศ', 'โครงการสร้าง', 'ไล่', 'เตือน', 'อิทธิพล']) console.log(await tap(w));
  await p.click('#translateAll'); await p.click('#translateAll');
  console.log('tr pdf:', (await p.innerText('#trlist')).replace(/\n/g, ' '), '| max href', await p.$$eval('#trlist a', as => Math.max(...as.map(a => a.href.length))), '| doc visible', await p.isVisible('#trdoc'));
  await p.setInputFiles('#pdffile', 'pdfin/C.pdf'); await p.waitForFunction(() => document.getElementById('docstatus').textContent.includes('C.pdf（'), null, { timeout: 60000 }); await p.waitForTimeout(800);
  console.log(await rep(['專有名詞']));
  for (const w of ['ฟรีน', 'สโรชา', 'กัทชลี', 'กรมส่งเสริม', 'เนี่ย']) console.log(await tap(w));
  // gloss modes
  await p.click('#openSettings'); await p.click('#glossGroup button:has-text("中英都顯示")'); await p.click('#closeSettings');
  console.log('both:', await tap('เศรษฐกิจ'));
  await p.click('#openSettings'); await p.click('#glossGroup button:has-text("英文")'); await p.click('#closeSettings');
  console.log('en:', await tap('เศรษฐกิจ'));
  await p.click('#openSettings'); await p.click('#glossGroup button:has-text("中文")'); await p.click('#closeSettings');
  const q = await pt('ฟรีน'); await p.evaluate((y) => window.scrollBy(0, y - 300), q.y); await p.waitForTimeout(600);
  await p.screenshot({ path: 'tests/ent-C.png', clip: { x: 0, y: 150, width: 820, height: 420 } });
  await tap('ไต้หวัน');
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
