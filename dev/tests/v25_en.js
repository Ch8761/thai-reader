const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8765/index.html';
(async () => {
  const b = await chromium.launch();
  const left = new Map();
  const grab = async (p, tag) => {
    const r = await p.evaluate(() => {
      const out = [], c = /[一-鿿]/, skip = el => el.closest('textarea, script, style, .zhline, .cm, .cmy, .gname, [data-noi18n]');
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t && c.test(t) && !skip(n.parentElement) && n.parentElement.getClientRects().length) { out.push(t); } }
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e => { ['placeholder', 'aria-label', 'title'].forEach(a => { const v = e.getAttribute(a); if (v && c.test(v) && !skip(e) && e.getClientRects().length) { out.push(a + ':' + v); } }); });
      return out;
    });
    r.forEach(t => { if (!left.has(t)) { left.set(t, tag); } });
  };
  const E = (p, c) => p.evaluate(c => window.__ev(c), c);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, acceptDownloads: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000);
  await p.goto(URL);
  await p.evaluate(() => {
    localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ui-lang', 'en');
    const docs = ['A', 'B', 'C', 'D'].map((n, i) => ({ id: 'text:' + n, name: 'Doc ' + n, type: 'text', size: 10 + i, added: 10 - i, opened: 0, folder: n === 'D' ? 'dx' : '' }));
    localStorage.setItem('thai-docs-v1', JSON.stringify({ docs, folders: [{ id: 'dx', name: 'Mine' }], cur: 'all' }));
    docs.forEach(d => localStorage.setItem('thai-notes-doc:' + d.id, JSON.stringify({ text: 'วันนี้ผมไปตลาด', src: { type: 'text', id: d.id, name: d.name }, hl: [], strokes: [], boxes: [], nextId: 1 })));
  });
  await p.reload(); await p.waitForTimeout(1300);
  await grab(p, 'home'); console.log('tip:', await p.textContent('#selTip'));
  await p.locator('#homeFolders > .seg > button', { hasText: 'Mine' }).click(); await p.waitForTimeout(200);
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(200); await grab(p, 'folder-menu');
  console.log('menu:', (await p.locator('.fmenu button').allTextContents()).join(' | '));
  await p.click('.fmenu .cdel'); await p.waitForTimeout(150); await grab(p, 'folder-del'); console.log('del:', await p.textContent('.fmenu .cdel'));
  await p.keyboard.press('Escape'); await p.locator('#homeFolders > .seg > button', { hasText: 'All' }).click(); await p.waitForTimeout(200);
  const bb = await p.locator('#docList .doccard .dopen').first().boundingBox();
  await p.mouse.move(bb.x + 40, bb.y + 20); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(200);
  await grab(p, 'select'); console.log('bar:', (await p.textContent('#selBar')).replace(/\s+/g, ' '));
  await p.click('#selBar button.primary'); await p.waitForTimeout(200); await grab(p, 'select-menu'); console.log('selmenu:', (await p.textContent('.selmenu')).replace(/\s+/g, ' '), '| ph:', await p.getAttribute('.selmenu input', 'placeholder'));
  await p.screenshot({ path: 'shots/v25-en-select.png' });
  await p.click('.selmenu > button:has-text("Mine")'); await p.waitForTimeout(250); await grab(p, 'moved'); console.log('snack:', await p.textContent('#snackT'));
  await E(p, `(function(){ var now=Date.now(), D=86400000, y=new Date().getFullYear();
    function c(id,w,src,last,seen){ return {id:id,w:w,rom:'r'+id,pos:'n',zh:'意思'+id,en:'mean'+id,sent:'ประโยค '+w,src:src,page:0,added:now,box:2,due:0,seen:seen,right:1,last:last}; }
    cards.length=0; cards.push(c('c1','ตลาด','Doc A',now-3*D,2), c('c2','เพื่อน','Doc B',new Date(y-1,2,4).getTime(),3), c('c3','ผม','Doc A',0,0)); saveCards(); showTab('cards'); cardTab='list'; renderCards(); return 1; })()`);
  await p.waitForTimeout(400); await grab(p, 'cards');
  console.log('clast:', (await p.locator('.clast').allTextContents()).join(' | '));
  await E(p, "openDoc('text:A')"); await p.waitForTimeout(800); await E(p, "showTab('cards')"); await p.waitForTimeout(300);
  await p.click('.clchip'); await p.waitForTimeout(200); await grab(p, 'chip'); console.log('chip:', (await p.textContent('.clchip')).trim());
  await p.click('.clchip'); await p.click('.crow >> nth=0'); await p.waitForTimeout(400); await grab(p, 'detail');
  console.log('detail:', (await p.textContent('#cdBody')).replace(/\s+/g, ' ').match(/Last reviewed[^A-Z]*|Not reviewed[^A-Z]*/g));
  await p.click('#cdClose'); await p.waitForTimeout(200);
  await E(p, "cardFolder='all'; folders.push({id:'fa',name:'Mine'}); cards[0].folder='fa'; saveCards(); cardOnlyDoc=false; renderCards(); 1");
  await p.click('#cardFolders > .seg > button:has-text("Mine")'); await p.waitForTimeout(200);
  await p.click('#cardFolders > .seg > button[aria-checked="true"]'); await p.waitForTimeout(200); await grab(p, 'card-folder-menu');
  await p.click('#cardFolders .fmenu .cdel'); await p.waitForTimeout(150); await grab(p, 'card-folder-del'); console.log('card del:', await p.textContent('#cardFolders .fmenu .cdel'));
  await p.keyboard.press('Escape');
  await p.screenshot({ path: 'shots/v25-en-cards.png' });
  await p.click('#openCardExport'); await p.waitForTimeout(300); await grab(p, 'export'); console.log('export:', (await p.textContent('#cxBody')).replace(/\s+/g, ' '));
  await p.screenshot({ path: 'shots/v25-en-export.png' });
  await p.click('.exfmt[data-fmt="anki"]'); await p.waitForTimeout(600); await grab(p, 'export-done'); console.log('msg:', await p.textContent('#cxMsg'));
  await p.click('.cxcopy'); await p.waitForTimeout(400); await grab(p, 'export-copy'); console.log('copy msg:', await p.textContent('#cxMsg'));
  await p.click('#cxClose');
  await E(p, "cards.length=0; saveCards(); renderCards(); 1"); await p.click('#openCardExport'); await p.waitForTimeout(200); await grab(p, 'export-empty'); console.log('empty:', (await p.textContent('#cxBody')).replace(/\s+/g, ' ')); await p.click('#cxClose');
  /* 說明 */
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
  await p.evaluate(() => window.settingsOpen('help')); await p.waitForTimeout(200);
  await p.click('#openHelp'); await p.waitForTimeout(300);
  const tabs = await p.locator('#helpTabs button').count();
  for (let i = 0; i < tabs; i++) { await p.locator('#helpTabs button').nth(i).click(); await p.waitForTimeout(150); const sum = await p.locator('#helpBody details, #helpBody summary').count(); await p.evaluate(() => document.querySelectorAll('#helpBody details').forEach(d => d.open = true)); await grab(p, 'help' + i); }
  const ht = await p.locator('#helpBody').textContent();
  console.log('\nLEFT:'); left.forEach((v, k) => console.log('  [' + v + '] ' + k));
  console.log('LEFT COUNT:', left.size);
  await b.close();
})().catch(e => { console.error('CRASH', e); process.exit(2); });
