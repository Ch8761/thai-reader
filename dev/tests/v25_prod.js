const { chromium } = require('playwright');
const fs = require('fs');
const URL = 'http://127.0.0.1:8766/index.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, acceptDownloads: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(6000); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1');
    const docs = ['A', 'B', 'C'].map((n, i) => ({ id: 'text:' + n, name: 'Doc' + n, type: 'text', size: 10, added: 10 - i, opened: 0, folder: '' }));
    localStorage.setItem('thai-docs-v1', JSON.stringify({ docs, folders: [{ id: 'dx', name: 'Mine' }], cur: 'all' }));
    docs.forEach(x => localStorage.setItem('thai-notes-doc:' + x.id, JSON.stringify({ text: 'วันนี้', src: { type: 'text', id: x.id, name: x.name }, hl: [], strokes: [], boxes: [], nextId: 1 })));
    localStorage.setItem('thai-cards-v1', JSON.stringify({ cards: [{ id: 'c1', w: 'ตลาด', rom: 'dta-làat', pos: 'n', zh: '市場', en: 'market', sent: 'ไปตลาด', src: 'DocA', page: 0, added: 1, box: 2, due: 0, seen: 1, right: 1, last: Date.now() - 86400000 }], folders: [], cur: 'all' })); });
  await p.reload(); await p.waitForTimeout(1500);
  console.log('version text:', await p.evaluate(() => document.body.innerText.match(/1\.2\d\.\d/g)));
  await p.locator('#homeFolders > .seg > button', { hasText: 'Mine' }).click(); await p.waitForTimeout(200);
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(200);
  console.log('folder menu:', (await p.locator('.fmenu button').allTextContents()).join('|'));
  await p.keyboard.press('Escape'); await p.locator('#homeFolders > .seg > button').first().click(); await p.waitForTimeout(200);
  const bb = await p.locator('#docList .doccard:nth-child(1) .dopen').boundingBox();
  await p.mouse.move(bb.x + 60, bb.y + 20); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(200);
  console.log('selected:', await p.locator('.doccard.picked').count(), (await p.textContent('#selBar .selcount')).trim());
  await p.keyboard.press('Escape');
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(300);
  await p.click('#cardTabs button:nth-child(3)'); await p.waitForTimeout(200);
  console.log('clast:', (await p.locator('.clast').allTextContents()).join('|'), '| chip:', (await p.locator('.clchip').count()));
  await p.click('#openCardExport'); await p.waitForTimeout(300);
  fs.mkdirSync('shots/dl25p', { recursive: true });
  for (const [f, e] of [['docx', 'docx'], ['pdf', 'pdf'], ['anki', 'txt']]) {
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('.exfmt[data-fmt="' + f + '"]')]);
    await d.saveAs('shots/dl25p/c.' + e); console.log(f, d.suggestedFilename(), fs.statSync('shots/dl25p/c.' + e).size);
  }
  console.log('errors:', errs.join('|') || 'none');
  await b.close();
})();
