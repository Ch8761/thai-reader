const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [nm, opt] of [['ipad', { viewport: { width: 820, height: 1180 } }], ['phone', devices['iPhone SE']]]) {
    const p = await (await b.newContext(opt)).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: `tests/s2-${nm}-menu.png` });
    await p.click('.setmi[data-grp="read"]'); await p.waitForTimeout(300);
    console.log(nm, 'h1', await p.textContent('#h-settingsv'), 'visible rows', await p.evaluate(() => [...document.querySelectorAll('#settings .setrow')].filter(r => r.offsetHeight > 0).length), 'ver visible', await p.evaluate(() => document.querySelector('.appverrow').offsetHeight > 0));
    await p.screenshot({ path: `tests/s2-${nm}-read.png` });
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(200); console.log('tab tap -> menu', await p.isVisible('.setmenu'));
    await p.click('.setmi[data-grp="data"]'); await p.click('#view-settings .vhead .back'); console.log('back -> menu', await p.isVisible('.setmenu'));
    // update bar
    await p.evaluate(() => { const bar = document.createElement('div'); bar.id = 'updbar'; bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;gap:10px;align-items:center;width:max-content;white-space:nowrap;padding:10px 14px;border-radius:12px;background:var(--card);color:var(--fg);border:1px solid var(--line);box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:15px;max-width:calc(100% - 32px)'; bar.textContent = '有新版本了。'; const bb = document.createElement('button'); bb.className = 'primary'; bb.textContent = '重新整理'; bar.appendChild(bb); document.body.appendChild(bar); });
    console.log('updbar height', await p.evaluate(() => document.getElementById('updbar').offsetHeight));
    await p.screenshot({ path: `tests/s2-${nm}-upd.png` });
    console.log('ERRORS:', errs.join(' | ') || 'none');
  }
  await b.close();
})();
