const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 612, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { window.__spoken = []; const orig = window.speechSynthesis; if (orig) { orig.speak = (u) => { window.__spoken.push([u.text, u.lang, u.rate]); }; } });
  await p.goto('file://' + process.argv[2]); await p.evaluate(() => localStorage.clear()); await p.reload();
  console.log('translate href:', decodeURIComponent(await p.$eval('#translateAll', e => e.href)).slice(0, 120));
  await p.click('#slow'); await p.click('#readAll');
  console.log('spoken:', JSON.stringify(await p.evaluate(() => window.__spoken)));
  await p.locator('#wrap').scrollIntoViewIfNeeded();
  const pt = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 9); rg.setEnd(n, 10); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(pt.x, pt.y);
  console.log('popup buttons:', JSON.stringify(await p.$$eval('#pop .links > *', es => es.map(e => e.textContent + (e.href ? ' ' + decodeURIComponent(e.href) : '')))));
  await p.click('#pop button.say');
  console.log('spoken after word:', JSON.stringify((await p.evaluate(() => window.__spoken)).slice(-1)));
  console.log('report tts line:', (await p.inputValue('#report')).split('\n').find(l => l.startsWith('朗讀')));
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none'); await b.close();
})();
