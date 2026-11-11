const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  const scan = async name => { const r = await p.evaluate(() => Array.from(document.querySelectorAll('button, a[href], label.filebtn, select, input[type=checkbox], [role=tab], [role=radio]')).filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'); }).map(e => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), (e.id ? '#' + e.id : '') + '.' + (e.className || '').toString().split(' ')[0], (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 14)]; }).filter(x => x[1] < 40 || x[0] < 32)); console.log('==', name); r.forEach(x => console.log('  ', x.join(' '))); };
  await scan('home');
  await p.locator('.libitem, .docitem, [data-docid]').first().click().catch(() => {}); await p.waitForTimeout(1000); await E("showTab('doc')"); await p.waitForTimeout(400);
  await scan('doc');
  const w = p.locator('#text .w, span.w').nth(3); if (await w.count()) { await w.click(); await p.waitForTimeout(600); await scan('popup'); await p.keyboard.press('Escape'); }
  await E("showTab('cards')"); await p.waitForTimeout(300); await scan('cards');
  await E("showTab('settings'); settingsOpen('read')"); await p.waitForTimeout(300); await scan('settings-read');
  await b.close();
})();
