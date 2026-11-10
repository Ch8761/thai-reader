const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', 'pdfin/B.pdf'); await p.waitForFunction(() => /\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  const pt = (word, off = 1) => p.evaluate(([word, off]) => { for (const sp of document.querySelectorAll('#text .tl')) { const t = sp.textContent, i = t.indexOf(word); if (i < 0) continue; const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); let n, acc = 0; while ((n = w.nextNode())) { if (i + off < acc + n.nodeValue.length) { const rg = document.createRange(); rg.setStart(n, i + off - acc); rg.setEnd(n, i + off + 1 - acc); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += n.nodeValue.length; } } return null; }, [word, off]);
  // folders: create folder 新聞 and add cards
  await p.click('.tabbar [data-tab="cards"]'); await p.click('#cardFolders button:has-text("新資料夾")'); await p.fill('#cardFolders .fname', '新聞'); await p.click('#cardFolders button:has-text("建立")');
  console.log('folders:', (await p.innerText('#cardFolders')).replace(/\n/g, ' / '));
  await p.click('.tabbar [data-tab="doc"]'); await p.waitForTimeout(800);
  for (const w of ['เตือน', 'อิทธิพล']) { await p.keyboard.press('Escape'); let q = await pt(w); await p.evaluate((y) => window.scrollBy(0, y - 400), q.y); await p.waitForTimeout(200); q = await pt(w); await p.mouse.click(q.x, q.y); await p.waitForTimeout(200); await p.click('#pop .cardbtn'); console.log(await p.innerText('#info')); }
  await p.keyboard.press('Escape');
  // notes: highlight, ink, box
  await p.click('.tool[data-mode="hl"]');
  let a = await pt('ได้ยกระดับ'), z = await pt('อิทธิพล', 5);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(z.x, z.y, { steps: 6 }); await p.mouse.up();
  await p.click('.tool[data-mode="ink"]');
  await p.mouse.move(a.x, a.y + 18); await p.mouse.down(); for (let i = 1; i <= 20; i++) await p.mouse.move(a.x + i * 12, a.y + 18 + Math.sin(i / 2) * 6); await p.mouse.up();
  await p.click('.tool[data-mode="box"]'); const bw = await pt('เกาะ'); await p.mouse.click(bw.x, bw.y); await p.keyboard.type('島嶼 island'); await p.click('.tool[data-mode="tap"]');
  await p.waitForTimeout(300);
  // export
  await p.click('#openExport'); console.log('export panel:', (await p.innerText('#exportp')).replace(/\n/g, ' / ').slice(0, 260));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#exGo')]);
  const f = 'tests/out/' + dl.suggestedFilename(); await dl.saveAs(f); console.log('saved', f);
  await p.waitForTimeout(300); console.log('status:', await p.innerText('#exStatus'));
  // backup
  await p.click('.tabbar [data-tab="settings"]');
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#bkSave')]);
  const f2 = 'tests/out/backup.json'; await dl2.saveAs(f2); await p.waitForTimeout(200); console.log('bk:', await p.innerText('#bkStatus'));
  // wipe and restore
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); indexedDB.deleteDatabase('thai-notes-files'); }); await p.reload(); await p.waitForTimeout(1200);
  console.log('after wipe cards:', await p.innerText('#cardBadge'), '|', await p.innerText('#docstatus'));
  await p.click('.tabbar [data-tab="settings"]'); await p.setInputFiles('#bkFile', f2); await p.waitForTimeout(400);
  console.log('confirm:', await p.innerText('#bkConfirmText')); await p.click('#bkDo');
  await p.waitForFunction(() => /還原完成|出錯/.test(document.getElementById('bkStatus').textContent), null, { timeout: 60000 });
  console.log('restored:', await p.innerText('#bkStatus'), '|', await p.innerText('#cardBadge'), '|', await p.innerText('#docstatus'));
  await p.waitForTimeout(2500); console.log('after open:', await p.innerText('#docstatus')); console.log((await p.inputValue('#report')).split('\n').filter(l => /^筆記數量/.test(l)).join());
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
