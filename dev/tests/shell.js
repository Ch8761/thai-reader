const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(800);
  const rep = async (k) => (await p.inputValue('#report')).split('\n').filter(l => k.some(x => l.startsWith(x))).join('\n');
  console.log('start tab home visible:', await p.isVisible('#view-home'), '| docs:', (await p.innerText('#docList')).replace(/\n/g, ' / '));
  await p.screenshot({ path: 'tests/sh-home-light.png' });
  // add folder + both PDFs
  await p.click('#homeFolders button:has-text("新資料夾")'); await p.fill('#homeFolders .fname', '新聞'); await p.click('#homeFolders button:has-text("建立")');
  await p.setInputFiles('#pdffile', ['pdfin/B.pdf', 'pdfin/C.pdf']); await p.waitForFunction(() => /已加入/.test(document.getElementById('homeMsg').textContent), null, { timeout: 30000 });
  console.log('msg:', await p.innerText('#homeMsg'), '| list:', (await p.innerText('#docList')).replace(/\n/g, ' / ').slice(0, 300));
  // open B
  await p.click('#docList .dopen:has-text("B.pdf")'); await p.waitForFunction(() => /B\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  console.log('doc tab:', await p.isVisible('#view-doc'), await p.innerText('#h-docv'));
  // add highlight via drag on first line
  await p.click('.tool[data-mode="ink"]'); const wr = await p.$eval('#wrap', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await p.mouse.move(wr.x + 100, wr.y + 200); await p.mouse.down(); for (let i = 0; i < 10; i++) await p.mouse.move(wr.x + 100 + i * 15, wr.y + 200 + i * 2); await p.mouse.up(); await p.click('.tool[data-mode="tap"]');
  console.log(await rep(['筆記數量']));
  // home: paste text doc
  await p.click('.tabbar [data-tab="home"]'); await p.click('#openPaste'); await p.fill('#textTitle', '測試文字'); await p.fill('#input', 'สวัสดีครับ วันนี้อากาศดีมาก'); await p.click('#addText');
  await p.waitForTimeout(500); console.log('text doc:', await p.innerText('#h-docv'), '|', await rep(['筆記數量']));
  // switch back to B via home
  await p.click('.tabbar [data-tab="home"]'); console.log('home list:', (await p.innerText('#docList')).replace(/\n/g, ' / ').slice(0, 400));
  await p.click('#docList .dopen:has-text("B.pdf")'); await p.waitForTimeout(1500); console.log('back to B:', await p.innerText('#h-docv'), '|', await rep(['筆記數量']));
  await p.screenshot({ path: 'tests/sh-doc-light.png' });
  // move C to 新聞 folder
  await p.click('.tabbar [data-tab="home"]'); await p.click('#homeFolders [role="radio"]:has-text("全部")').catch(() => {});
  const sel = await p.$$('#docList select'); console.log('selects', sel.length);
  // cards & settings
  await p.click('.tabbar [data-tab="cards"]'); console.log('cards view:', (await p.innerText('#view-cards')).replace(/\n/g, ' / ').slice(0, 160));
  await p.click('.tabbar [data-tab="settings"]'); await p.click('#themeGroup button:has-text("深色")'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'tests/sh-settings-dark.png' });
  await p.click('.tabbar [data-tab="home"]'); await p.screenshot({ path: 'tests/sh-home-dark.png' });
  await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(800); await p.screenshot({ path: 'tests/sh-doc-dark.png' });
  console.log(await rep(['外觀']));
  // reload persistence
  await p.reload(); await p.waitForTimeout(2500); console.log('reload tab doc visible:', await p.isVisible('#view-doc'), await p.innerText('#h-docv'), '|', await p.innerText('#docstatus'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
