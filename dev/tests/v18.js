const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(800);
  const E = (c) => p.evaluate(c => window.__ev(c), c);
  // text doc: TTS player
  await p.click('.tabbar [data-tab="doc"]').catch(()=>{}); await p.waitForTimeout(400);
  console.log('redo hidden on text doc', await p.evaluate(() => document.getElementById('ocrRedo').hidden));
  await p.screenshot({ path: 'tests/w-top.png', clip: { x: 0, y: 0, width: 820, height: 420 } });
  // stub speechSynthesis to simulate playback
  await p.evaluate(() => {
    const q = []; let cur = null;
    window.speechSynthesis.speak = (u) => { q.push(u); if (!cur) next(); };
    function next() { cur = q.shift(); if (!cur) return; setTimeout(() => { cur.onstart && cur.onstart(); setTimeout(() => { const u = cur; cur = null; u.onend && u.onend(); next(); }, 300); }, 20); }
    window.speechSynthesis.cancel = () => { q.length = 0; if (cur) { const u = cur; cur = null; u.onerror && u.onerror({ error: 'interrupted' }); } };
    Object.defineProperty(window.speechSynthesis, 'speaking', { get: () => !!cur, configurable: true });
    Object.defineProperty(window.speechSynthesis, 'pending', { get: () => q.length > 0, configurable: true });
  });
  await E("state.text = 'ทดสอบ '.repeat(200); 0");
  await p.click('#readAll'); await p.waitForTimeout(700);
  console.log('playing', await E("[ra.playing, ra.pos, document.getElementById('readAll').getAttribute('aria-label'), document.getElementById('ttsSeek').value].join()"));
  await p.click('#readAll'); await p.waitForTimeout(200);
  console.log('paused', await E("[ra.playing, ra.pos, document.getElementById('readAll').getAttribute('aria-label')].join()"));
  await p.evaluate(() => { const r = document.getElementById('ttsSeek'); r.value = 600; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); });
  console.log('seek', await E("[ra.pos, state.text.length].join()"));
  await p.click('#readAll'); await p.waitForTimeout(400);
  console.log('resume', await E("[ra.playing, ra.pos].join()"));
  await p.screenshot({ path: 'tests/w-tts.png', clip: { x: 0, y: 100, width: 820, height: 140 } });
  await p.click('#stopRead'); await p.waitForTimeout(200);
  console.log('stop', await E("[ra.playing, ra.pos, document.getElementById('stopRead').disabled].join()"));
  // text box palette
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(200);
  console.log('swatches', await p.evaluate(() => [...document.querySelectorAll('#stylebar .sw')].map(x => x.dataset.color || x.id).join()));
  const t = await p.locator('#text').boundingBox();
  await p.mouse.click(t.x + t.width - 40, t.y + t.height - 20); await p.waitForTimeout(300);
  await p.keyboard.type('abc'); await p.waitForTimeout(100);
  const fid = await E('focusedId'); console.log('focused', fid);
  await p.dispatchEvent('#boxCustom', 'pointerup'); await p.waitForTimeout(200);
  console.log('cpop', await p.evaluate(() => [document.getElementById('cpop').hidden, document.getElementById('cpCount').textContent, document.querySelectorAll('#cpGrid .cp-sw').length].join()));
  await p.screenshot({ path: 'tests/w-cpop.png', clip: { x: 0, y: 0, width: 820, height: 600 } });
  await p.dispatchEvent('#cpGrid .cp-sw >> nth=1', 'pointerup'); await p.waitForTimeout(200);
  console.log('box color', await E("JSON.stringify(state.boxes.map(b => [b.t, b.s && b.s.color]))"));
  await p.evaluate(() => { const i = document.querySelector('#cpGrid .cp-add input'); i.value = '#123456'; i.dispatchEvent(new Event('change')); });
  console.log('added', await E("[toolPrefs.boxColors.join(' '), JSON.stringify(state.boxes.map(b => b.s && b.s.color))].join(' | ')"));
  await p.dispatchEvent('#cpEdit', 'pointerup'); await p.dispatchEvent('#cpGrid .cp-sw >> nth=0', 'pointerup'); await p.waitForTimeout(100);
  console.log('deleted', await E("toolPrefs.boxColors.join(' ')"));
  await p.screenshot({ path: 'tests/w-cpop-edit.png', clip: { x: 0, y: 0, width: 820, height: 600 } });
  // OCR doc: header redo
  await p.click('.tool[data-mode="tap"]');
  await p.setInputFiles('#imgfile', ['ocrtest/photo.jpg']);
  await p.waitForFunction(() => !document.getElementById('ocrRedo').hidden, null, { timeout: 180000 });
  await p.screenshot({ path: 'tests/w-ocr.png', clip: { x: 0, y: 0, width: 820, height: 420 } });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
