const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2], outdir = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 820, height: 1100 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + file);
  console.log('STATUS:', (await p.innerText('#status')).replace(/\n/g, ' / '));
  console.log('SUMMARY:', await p.innerText('#summary'));
  console.log('CHIPS:', await p.$$eval('#chips .chip', els => els.map(e => e.textContent).join(' | ')));
  await p.click('#chips .chip:nth-of-type(2)');
  console.log('INFO after chip:', (await p.innerText('#info')).replace(/\n/g, ' '));
  console.log('MARK:', await p.$eval('#reader mark', e => e.textContent));

  await p.locator('#reader').scrollIntoViewIfNeeded();
  // tap accuracy: click the centre of each base character, check the marked word contains it
  const total = await p.evaluate(() => document.getElementById('reader').textContent.length);
  let ok = 0, n = 0; const misses = [];
  for (let i = 0; i < total; i++) {
    const info = await p.evaluate((i) => {
      const text = document.getElementById('input').value;
      const ch = text[i];
      if (/[ัิ-ฺ็-๎]/.test(ch)) return null;
      const w = document.createTreeWalker(document.getElementById('reader'), NodeFilter.SHOW_TEXT);
      let node, acc = 0, loc = null;
      while ((node = w.nextNode())) { const l = node.nodeValue.length; if (i < acc + l) { loc = { node, off: i - acc }; break; } acc += l; }
      if (!loc) return null;
      const rg = document.createRange(); rg.setStart(loc.node, loc.off); rg.setEnd(loc.node, loc.off + 1);
      const r = rg.getBoundingClientRect();
      if (r.width === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, ch };
    }, i);
    if (!info) continue;
    await p.mouse.click(info.x, info.y);
    const got = await p.evaluate(() => {
      const m = document.querySelector('#reader mark');
      if (!m) return null;
      const rg = document.createRange(); rg.selectNodeContents(document.getElementById('reader')); rg.setEndBefore(m);
      const start = rg.toString().length;
      return { start, end: start + m.textContent.length, word: m.textContent };
    });
    n++;
    if (got && i >= got.start && i < got.end) ok++; else misses.push({ i, ch: info.ch, got });
  }
  console.log('TAP ACCURACY (centre of each base char):', ok + '/' + n, misses.length ? JSON.stringify(misses) : '');

  // right-edge taps: 80% across each base char
  let ok2 = 0, n2 = 0;
  for (let i = 0; i < total; i++) {
    const info = await p.evaluate((i) => {
      const text = document.getElementById('input').value;
      if (/[ัิ-ฺ็-๎]/.test(text[i])) return null;
      const w = document.createTreeWalker(document.getElementById('reader'), NodeFilter.SHOW_TEXT);
      let node, acc = 0, loc = null;
      while ((node = w.nextNode())) { const l = node.nodeValue.length; if (i < acc + l) { loc = { node, off: i - acc }; break; } acc += l; }
      if (!loc) return null;
      const rg = document.createRange(); rg.setStart(loc.node, loc.off); rg.setEnd(loc.node, loc.off + 1);
      const r = rg.getBoundingClientRect();
      if (r.width < 4) return null;
      return { x: r.left + r.width * 0.8, y: r.top + r.height / 2 };
    }, i);
    if (!info) continue;
    await p.mouse.click(info.x, info.y);
    const got = await p.evaluate(() => {
      const m = document.querySelector('#reader mark'); if (!m) return null;
      const rg = document.createRange(); rg.selectNodeContents(document.getElementById('reader')); rg.setEndBefore(m);
      const s = rg.toString().length; return { start: s, end: s + m.textContent.length };
    });
    n2++; if (got && i >= got.start && i < got.end) ok2++;
  }
  console.log('TAP ACCURACY (80% across char):', ok2 + '/' + n2);

  // sample 3 (space + punctuation) and empty input
  await p.click('[data-sample="2"]');
  console.log('SAMPLE3 chips:', await p.$$eval('#chips .chip, #chips .gap', els => els.map(e => e.textContent).join(' | ')));
  await p.fill('#input', '');
  await p.click('#go');
  console.log('EMPTY summary:', await p.innerText('#summary'));
  await p.click('[data-sample="1"]');
  await p.click('#right'); await p.click('#right'); await p.click('#wrong');
  console.log('REPORT:\n' + await p.inputValue('#report'));
  console.log('ERRORS:', errs.length ? errs.join(' || ') : 'none');

  await p.screenshot({ path: outdir + '/tablet-light.png', fullPage: true });
  const p2 = await b.newPage({ viewport: { width: 400, height: 900 }, colorScheme: 'dark' });
  await p2.goto('file://' + file);
  await p2.click('#chips .chip:nth-of-type(3)');
  const overflow = await p2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('PHONE horizontal overflow:', overflow);
  await p2.screenshot({ path: outdir + '/phone-dark.png', fullPage: true });
  await b.close();
})();
