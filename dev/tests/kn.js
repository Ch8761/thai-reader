const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
  for (const s of ['แค่ตืนมาแล้วได้เจ๑', 'บางคนคือ', 'แค่ตื่นมาแล้วได้เจอ']) console.log(s, await p.evaluate(s => window.__ev(`[vidKnown(${JSON.stringify(s)}), vidDigits(${JSON.stringify(s)}), segment(${JSON.stringify(s)}).map(function(x){return x.t;}).join('|')]`), s));
  await b.close(); })();
