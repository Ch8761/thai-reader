const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 1400 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.evaluate(() => localStorage.clear()); await p.reload();
  console.log('settings hidden at start:', await p.$eval('#settings', e => e.hidden));
  await p.click('summary'); await p.fill('#input', 'ในปีนี้ราคาน้ำมันขึ้นแล้วซึ่งส่งผลต่อประชาชน'); await p.click('#load'); await p.click('#load');
  const tapWord = async (t, nth = 0) => {
    await p.evaluate(() => window.scrollTo(0, 0));
    const r = await p.evaluate(([t, nth]) => { const tx = document.getElementById('text'); let i = -1; for (let k = 0; k <= nth; k++) i = tx.textContent.indexOf(t, i + 1); const w = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT); let n, acc = 0; while ((n = w.nextNode())) { const l = n.nodeValue.length; if (i < acc + l) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const bb = rg.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2 }; } acc += l; } }, [t, nth]);
    await p.mouse.click(r.x, r.y); await p.waitForTimeout(120);
    return p.evaluate(() => {
      const mine = [...document.querySelectorAll('#pop > .sec:not(.fold) .gcard .gname')].map(e => e.textContent);
      const other = document.querySelector('#pop details.fold summary');
      const folds = [...document.querySelectorAll('#pop details.fold > summary')].map(e => e.textContent);
      return 'mine=[' + mine.join(' | ') + '] folds=[' + folds.join(' | ') + ']';
    });
  };
  console.log('tap ใน   :', await tapWord('ใน'));
  console.log('tap แล้ว :', await tapWord('แล้ว'));
  console.log('tap ซึ่ง  :', await tapWord('ซึ่ง'));
  console.log('tap ต่อ   :', await tapWord('ต่อ'));
  console.log('tap ราคา :', await tapWord('ราคา'));
  // settings: level a -> others filtered
  await p.evaluate(() => { document.getElementById('pop').hidden = true; window.scrollTo(0, 0); });
  await p.click('#openSettings');
  console.log('settings shown:', !(await p.$eval('#settings', e => e.hidden)), '| level buttons:', await p.$$eval('#levelGroup button', es => es.map(e => e.textContent + (e.getAttribute('aria-checked') === 'true' ? '✓' : '')).join(' ')));
  await p.click('#levelGroup button:nth-child(1)'); await p.click('#romGroup button:nth-child(2)'); await p.click('#closeSettings');
  console.log('after level=入門, tap ใน:', await tapWord('ใน'));
  await p.click('#pop details.fold summary');
  console.log('example rom hidden:', (await p.$$eval('#pop .grom', es => es.length)) === 0, '| dict rom hidden:', (await p.$$eval('#pop .rom', es => es.length)) === 0);
  console.log('ask fold present:', await p.$$eval('#pop details.fold > summary', es => es.map(e => e.textContent).join(' / ')));
  await p.evaluate(() => window.scrollTo(0, 0));
  const box = await p.$eval('#pop', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.screenshot({ path: process.argv[3] + '/pop2.png', clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: box.w + 20, height: Math.min(box.h + 20, 1200) } });
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none'); await b.close();
})();
