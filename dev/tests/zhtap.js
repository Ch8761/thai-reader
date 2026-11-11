const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await p.click('#openPaste'); await p.fill('#input', 'นิ้วกลาง 中指\nนิ้วนาง 無名指'); await p.click('#addText'); await p.waitForTimeout(800);
  await E("(function(){ showPop(segAt(state.text.indexOf('中指'))); return 1; })()"); await p.waitForTimeout(300);
  console.log('zh pop:', await p.textContent('#pop'));
  await p.screenshot({ path: 'tests/zh-pop.png' });
  await E("(function(){ showPop(segAt(state.text.indexOf('กลาง'))); return 1; })()"); await p.waitForTimeout(300);
  console.log('th pop word:', await p.textContent('#pop .pw'));
  await p.click('.tabbar [data-tab="settings"]'); await E("settingsOpen('read')"); await p.waitForTimeout(300);
  console.log('setting:', await p.textContent('#ocrZhGroup'), '| selected:', await p.getAttribute('#ocrZhGroup [aria-checked="true"]', 'data-v').catch(() => '?'));
  await p.click('#ocrZhGroup button:nth-child(2)'); await p.waitForTimeout(200);
  console.log('after pick:', await E("localStorage.getItem('thai-ocr-zh')"), JSON.stringify(await E('ocrLangs()')), 'checked:', await p.textContent('#ocrZhGroup [aria-checked="true"]'));
  await p.screenshot({ path: 'tests/zh-setting.png' });
  console.log('errors:', errs); await b.close();
})();
