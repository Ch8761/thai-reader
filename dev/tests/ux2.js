const { chromium } = require('playwright');
(async () => {
  const W = +(process.argv[2] || 390); const TH = process.argv[3] || 'light';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(th => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme', th); }, TH); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  console.log('today hidden at start', await p.evaluate(() => document.getElementById('todayBox').hidden));
  // make 4 due cards, yesterday streak
  await E(`(function(){ ['ตลาด','วันนี้','อากาศ','เพื่อน'].forEach(function(w){ addCard({t:w,w:true}); }); cards.forEach(function(c){ c.due = today0() - 1; }); saveCards();
    var d = new Date(); d.setDate(d.getDate()-1); var y = dayKey(d.getTime()); d.setDate(d.getDate()-1); localStorage.setItem('thai-days', JSON.stringify([dayKey(d.getTime()), y])); return cards.length; })()`);
  await p.locator('#docList li, #docList .docitem, #docList button').first().click().catch(e => console.log('click fail', e.message)); await p.waitForTimeout(1000);
  await E("showTab('home')"); await p.waitForTimeout(500);
  console.log('today text:', (await p.textContent('#todayBox')).replace(/\s+/g, ' '));
  await p.screenshot({ path: `shots/u-home-${W}.png` });
  await p.click('#todayBox .tdrev'); await p.waitForTimeout(500);
  for (let i = 0; i < 4; i++) { await p.click('text=看答案'); await p.waitForTimeout(150); await p.click('.grade.g2'); await p.waitForTimeout(150); }
  await p.waitForTimeout(500); await p.screenshot({ path: `shots/u-done-${W}.png` });
  console.log('summary:', (await p.textContent('.rsum')).replace(/\s+/g, ' '));
  await E("showTab('home')"); await p.waitForTimeout(400); console.log('today after:', (await p.textContent('#todayBox')).replace(/\s+/g, ' '));
  await p.screenshot({ path: `shots/u-home2-${W}.png` });
  await E("showTab('doc')"); await p.waitForTimeout(400); await p.screenshot({ path: `shots/u-doc-${W}.png` });
  await E("showTab('settings'); settingsOpen('read')"); await p.waitForTimeout(300); await p.screenshot({ path: `shots/u-set-${W}.png` });
  console.log('hscroll', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
