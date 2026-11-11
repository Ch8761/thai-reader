const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(5000); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme', 'light'); localStorage.setItem('thai-ui-lang', 'en'); localStorage.setItem('thai-gloss-lang', 'en'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await E(`(function(){ ['ตลาด','วันนี้','อากาศ'].forEach(function(w){ addCard({t:w,w:true}); }); cards.forEach(function(c){ c.due = today0() - 1; }); saveCards(); renderHome(); return 1; })()`);
  await p.waitForTimeout(300); await p.screenshot({ path: 'shots/en-home.png' });
  await p.locator('#docList li').first().click(); await p.waitForTimeout(800);
  await E("(function(){ showPop(segAt(state.text.indexOf('อากาศ'))); return 1; })()"); await p.waitForTimeout(600); await p.screenshot({ path: 'shots/en-pop.png' });
  await p.keyboard.press('Escape');
  await E("showTab('cards')"); await p.waitForTimeout(300); await p.click('text=Start review'); await p.click('text=Show answer'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/en-review.png' });
  await E("showTab('settings'); settingsOpen('look')"); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/en-set.png' });
  await E('openHelp(6)'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/en-help.png' });
  await E('openHelpDetail(6,4)'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/en-help2.png' });
  console.log('hscroll', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'lang', await p.evaluate(() => document.documentElement.lang));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
