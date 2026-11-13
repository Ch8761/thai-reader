const { chromium, devices } = require('playwright');
const URL = 'http://127.0.0.1:8765/index.html';
(async () => {
  const b = await chromium.launch(); const cjk = /[一-鿿]/;
  const left = new Map(); let shown = [];
  const grab = async (p, tag) => {
    const r = await p.evaluate(() => {
      const out = [], c = /[一-鿿]/, skip = el => el.closest('textarea, script, style, .zhline, .cm, .cmy, .gname, [data-noi18n]');
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t && c.test(t) && !skip(n.parentElement) && n.parentElement.getClientRects().length) { out.push(t); } }
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e => { ['placeholder', 'aria-label', 'title'].forEach(a => { const v = e.getAttribute(a); if (v && c.test(v) && !skip(e)) { out.push(a + ':' + v); } }); });
      return out;
    });
    r.forEach(t => { if (!left.has(t)) { left.set(t, tag); } });
  };
  const E = (p, c) => p.evaluate(c => window.__ev(c), c);
  const mk = async (o, init) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, hasTouch: true }, o || {})); if (init) { await ctx.addInitScript(init); } const p = await ctx.newPage(); p.setDefaultTimeout(5000); return p; };
  let p = await mk();
  await p.goto(URL); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ui-lang', 'en'); });
  await p.reload(); await p.waitForTimeout(1300);
  await p.evaluate(() => { const a = []; const t = new Date(); t.setHours(12, 0, 0, 0); a.push(window.__ev('dayKey(' + t.getTime() + ')')); localStorage.setItem('thai-days', JSON.stringify(a)); });
  await E(p, `(function(){ rdFolderEnsure(); lib.docs.push({id:'text:s1',name:'Test',type:'text',size:20,added:1,opened:0,folder:'rdlib',lib:'a1'}); saveLib();
    localStorage.setItem(PDF_DOC_PREFIX+'text:s1', JSON.stringify({text:'วันนี้ผมไปตลาดกับเพื่อน', src:{type:'text',id:'text:s1',name:'Test'}, hl:[],strokes:[],boxes:[],nextId:1}));
    ['ตลาด','เพื่อน'].forEach(function(w){ addCard({t:w,i:0}); }); cards.forEach(function(c){ c.due = today0() - 86400000; c.last = Date.now() - 3*86400000; c.seen = 2; }); saveCards(); renderHome(); renderToday(); return 1; })()`);
  await p.waitForTimeout(500); await grab(p, 'home');
  console.log('tabs:', (await p.locator('#homeFolders > .seg > button').allTextContents()).join(' | '));
  await p.screenshot({ path: 'shots/v24-en-home.png' });
  await p.locator('#homeFolders > .seg > button', { hasText: 'Reading library' }).click(); await p.waitForTimeout(300); await grab(p, 'folder');
  console.log('target:', await p.textContent('#homeTarget'));
  await p.locator('#homeFolders > .seg > button[aria-checked="true"]').click(); await p.waitForTimeout(200); await grab(p, 'folder-menu'); await p.click('.fmenu .cdel'); await p.waitForTimeout(200); await grab(p, 'folder-del'); console.log('del:', await p.textContent('.fmenu .cdel'));
  await p.locator('#docList .cmove').first().focus(); console.log('move opts:', (await p.locator('#docList .cmove').first().locator('option').allTextContents()).join(' | '));
  await E(p, "showTab('ach'); 1"); await p.waitForTimeout(400); await grab(p, 'record'); await p.screenshot({ path: 'shots/v24-en-record.png' });
  console.log('record:', (await p.textContent('#achBody')).replace(/\s+/g, ' ').slice(0, 260));
  await E(p, "openDoc('text:s1')"); await p.waitForTimeout(1200); await grab(p, 'soft'); console.log('soft:', (await p.textContent('#softHint')).replace(/\s+/g, ' ')); await p.screenshot({ path: 'shots/v24-en-soft.png' });
  const iphone = devices['iPhone 13'];
  const g = async (tag, ua, evt) => {
    const q = await mk({ userAgent: ua, viewport: iphone.viewport, isMobile: true, hasTouch: true });
    await q.goto(URL); await q.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-ui-lang', 'en'); }); await q.reload(); await q.waitForTimeout(1300);
    if (evt) { await q.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); window.dispatchEvent(e); }); await q.waitForTimeout(200); }
    await grab(q, tag); console.log(tag + ':', (await q.textContent('#installGuide')).replace(/\s+/g, ' ').slice(0, 330));
    await q.screenshot({ path: 'shots/v24-en-' + tag + '.png' });
    if (tag === 'ios') { await q.click('.ighelp > button'); await q.waitForTimeout(200); await grab(q, 'ios-more'); console.log('more:', (await q.textContent('.igmore')).replace(/\s+/g, ' ')); }
  };
  await g('ios', iphone.userAgent);
  await g('line', iphone.userAgent + ' Line/13.0.0');
  await g('android', devices['Pixel 7'].userAgent);
  await g('android-evt', devices['Pixel 7'].userAgent, true);
  console.log('\nLEFT:'); left.forEach((v, k) => console.log('  [' + v + '] ' + k));
  await b.close();
})().catch(e => { console.error('CRASH', e); process.exit(2); });
