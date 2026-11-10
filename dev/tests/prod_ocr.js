const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } }); const p = await ctx.newPage();
  const errs = [], langs = []; p.on('pageerror', e => errs.push(String(e))); ctx.on('request', r => { if (/traineddata/.test(r.url())) { langs.push(r.url().replace(/^.*\/ocr\//, '')); } });
  await p.goto('http://127.0.0.1:8766/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); }); await p.reload(); await p.waitForTimeout(1500);
  await p.setInputFiles('#imgfile', ['phototest/sign.jpg']); await p.waitForSelector('#photoEdit:not([hidden])'); await p.click('#phOk');
  await p.waitForFunction(() => /ทุกวัน/.test(document.getElementById('text') ? document.getElementById('text').innerText : ''), null, { timeout: 180000 });
  console.log('text:', (await p.textContent('#text')).slice(0, 80));
  console.log('model files:', JSON.stringify(langs));
  console.log('idb keys:', await p.evaluate(() => new Promise(res => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => { const st = r.result.transaction('keyval').objectStore('keyval'); const q = st.getAllKeys(); q.onsuccess = () => res(JSON.stringify(q.result)); }; r.onerror = () => res('none'); })));
  console.log('errors:', errs); await b.close();
})();
