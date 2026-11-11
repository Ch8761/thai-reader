const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const d of ['iPhone SE', 'iPhone 13', 'Pixel 5']) {
    const p = await (await b.newContext(devices[d])).newPage();
    await p.goto('http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500);
    await p.click('#openPaste'); await p.waitForTimeout(200); await p.fill('#textTitle', 'ScreenRecording_11-10-2026_09-48-59_1（影片字幕）'); await p.fill('#input', 'แค่ตืนมาแล้วได้เจอ'); await p.click('#addText'); await p.waitForTimeout(800);
    await p.evaluate(() => { document.getElementById('ocrRedo').hidden = false; });
    await p.screenshot({ path: `tests/phead-${d.replace(/ /g, '')}.png`, clip: { x: 0, y: 0, width: p.viewportSize().width, height: 200 } });
    console.log(d, p.viewportSize().width, await p.evaluate(() => { const r = id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return Math.round(b.top) + ',' + Math.round(b.left) + ' w' + Math.round(b.width); }; return ['ocrRedo', 'openExport'].map(r).join(' | ') + ' parent=' + document.getElementById('ocrRedo').parentNode.className; }));
  }
  await b.close(); })();
