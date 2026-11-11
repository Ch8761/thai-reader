const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const E = c => p.evaluate(c => window.__ev(c), c);
  await p.setInputFiles('#imgfile', ['vidtest3/small.mp4']); await p.waitForTimeout(300);
  await p.screenshot({ path: 'tests/vr-0.png' });
  await p.waitForSelector('#vidPick:not([hidden])', { timeout: 60000 });
  // deliberately pick a wrong region (top)
  await p.click('#vpPresets button:has-text("上方")'); await p.click('#vpGo'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'tests/vr-1.png' });
  await p.waitForFunction(() => !window.__ev('vid.busy'), null, { timeout: 120000 }); await p.waitForTimeout(500);
  console.log('wrong region result:', await p.textContent('#vidMsg'), '| retry', await p.isVisible('#vidRetry')); await p.screenshot({ path: 'tests/vr-1b.png' }); await p.click('#vidRetry'); await p.waitForSelector('#vidPick:not([hidden])'); await p.click('#vpPresets button:has-text("下方")'); await p.click('#vpGo'); await p.waitForFunction(() => !window.__ev('vid.busy') && !document.getElementById('view-doc').hidden, null, { timeout: 120000 }); console.log('retry doc', JSON.stringify(await E('state.text')));
  // import again with right region to have a doc, then redo
  await p.click('.tabbar [data-tab="home"]');
  await p.setInputFiles('#imgfile', ['vidtest3/small.mp4']); await p.waitForSelector('#vidPick:not([hidden])', { timeout: 60000 }); await p.click('#vpGo');
  await p.waitForFunction(() => !window.__ev('vid.busy') && !document.getElementById('view-doc').hidden, null, { timeout: 120000 }); await p.waitForTimeout(800);
  console.log('doc', await E('state.text.split("\\n").length'), 'redo visible', await p.isVisible('#ocrRedo'), 'vblob', await E('docById(state.src.id).vblob'));
  await E("(function(){ snapshot(); addRangeColored([0,5], '#ffd400', 'full'); renderText(); save(); return 1; })()");
  const id = await E('state.src.id');
  await p.click('#ocrRedo'); await p.waitForSelector('#vidPick:not([hidden])', { timeout: 30000 });
  console.log('redo picker', await p.textContent('#vpGo'), '|', await p.textContent('#vpTip'));
  await p.screenshot({ path: 'tests/vr-2.png' });
  await p.click('#vpGo');
  await p.waitForFunction(() => !window.__ev('vid.busy') && !document.getElementById('view-doc').hidden, null, { timeout: 120000 }); await p.waitForTimeout(800);
  console.log('after redo same id', (await E('state.src.id')) === id, 'docs', await E('lib.docs.length'), 'hl', await E('state.hl.length'), 'text', JSON.stringify(await E('state.text')));
  await E(`deleteDoc(${JSON.stringify(id)})`); await p.waitForTimeout(300);
  console.log('blob after delete', await p.evaluate(id => window.__ev(`idbGet('vid:' + ${JSON.stringify(id)}).then(function(x){return !!x;})`), id));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
