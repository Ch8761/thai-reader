const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); p.setDefaultTimeout(4000); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-ui-lang', 'en'); localStorage.setItem('thai-gloss-lang', 'en'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  const all = new Map();
  const grab = async tag => {
    const r = await p.evaluate(() => {
      const out = [], cjk = /[一-鿿]/;
      const skip = el => el.closest('#text, textarea, script, style, [contenteditable], .zhline, .cm, .cmy, .gzt, .guse, .gzh, .gname, .gguess, .testtools, [hidden] .testtools');
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t && cjk.test(t) && !skip(n.parentElement)) { const e = n.parentElement; out.push([t, e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')]); } }
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(e => { ['placeholder', 'aria-label', 'title', 'alt'].forEach(a => { const v = e.getAttribute(a); if (v && cjk.test(v) && !skip(e)) { out.push([v.trim(), '@' + a]); } }); });
      return out;
    });
    r.forEach(([t, w]) => { if (!all.has(t)) all.set(t, tag + ' ' + w); });
  };
  const step = async (tag, fn) => { try { await fn(); await p.waitForTimeout(350); await grab(tag); } catch (e) { console.log('step fail', tag, e.message.slice(0, 100)); } };
  await step('home', async () => {});
  await step('paste', async () => { await p.click('#openPaste'); });
  await step('reader', async () => { await p.click('#readerOpen'); });
  await step('reader-d', async () => { await p.click('#rdTabs [data-lv="d"]'); });
  await p.keyboard.press('Escape');
  await step('doc', async () => { await E("showTab('home')"); await p.locator('#docList li').first().click(); await p.waitForTimeout(800); });
  await step('pop', async () => { await E("(function(){ showPop(segAt(state.text.indexOf('อากาศ'))); return 1; })()"); await p.waitForTimeout(600); });
  await step('pop2', async () => { await E("(function(){ showPop(segAt(state.text.indexOf('เพื่อน'))); return 1; })()"); await p.waitForTimeout(600); });
  await p.keyboard.press('Escape');
  await step('tr', async () => { const b2 = p.locator('text=Translate all'); if (await b2.count()) await b2.first().click(); });
  await step('export', async () => { await p.click('#openExport'); });
  await step('tools', async () => { for (const t of ['Highlighter', 'Draw', 'Notes', 'Tap']) { await p.locator('.tool', { hasText: t }).first().click(); await p.waitForTimeout(200); await grab('tool-' + t); } });
  await step('cards-empty', async () => { await E("showTab('cards')"); });
  await E(`(function(){ ['ตลาด','วันนี้','อากาศ','เพื่อน','กิน'].forEach(function(w){ addCard({t:w,w:true}); }); cards.forEach(function(c){ c.due = today0() - 1; }); saveCards(); renderCards(); return 1; })()`);
  await step('cards', async () => {});
  await step('review', async () => { await p.locator('button', { hasText: 'Start review' }).first().click(); });
  await step('review-flip', async () => { await p.click('text=Show answer'); });
  await step('review-done', async () => { for (let i = 0; i < 6; i++) { const g = p.locator('.grade.g2'); if (!(await g.count())) break; await g.click(); await p.waitForTimeout(150); const f = p.locator('text=Show answer'); if (await f.count()) await f.click(); await p.waitForTimeout(150); } });
  await step('quiz', async () => { await p.locator('.seg button, [role=radio]', { hasText: 'Quiz' }).first().click(); });
  await step('quiz-start', async () => { const s = p.locator('button', { hasText: /Start quiz/ }); if (await s.count()) await s.last().click(); });
  await step('cards-all', async () => { await p.locator('[role=radio]', { hasText: /^All \(\d+\)$/ }).last().click(); });
  await step('card-detail', async () => { const c = p.locator('#cardList li, .clist li, .citem').first(); if (await c.count()) await c.click(); });
  await p.keyboard.press('Escape');
  await step('settings', async () => { await E("showTab('settings')"); });
  for (const g of ['look', 'read', 'words', 'data', 'help']) { await step('set-' + g, async () => { await E(`showTab('settings'); settingsOpen('${g}')`); }); }
  await step('helpmodal', async () => { await E('openHelp(0)'); });
  await step('helpdetail', async () => { await E('openHelpDetail(0,0)'); });
  await p.keyboard.press('Escape');
  await step('welcome', async () => { const r = p.locator('#reWelcome'); await E("showTab('settings'); settingsOpen('help')"); await r.click(); await p.waitForTimeout(400); for (let i = 0; i < 6; i++) { await grab('welcome' + i); const n = p.locator('#welcome button.primary'); if (await n.count() && await n.first().isVisible()) { await n.first().click(); await p.waitForTimeout(250); } } });
  const arr = [...all.entries()].map(([t, w]) => ({ t, w }));
  fs.writeFileSync('i18n_left.json', JSON.stringify(arr, null, 0).replace(/},{/g, '},\n{'));
  console.log('strings', arr.length, 'chars', arr.reduce((a, x) => a + x.t.length, 0));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
