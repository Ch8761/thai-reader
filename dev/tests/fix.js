const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1000);
for (const t of ['ตอนนิกี้เริ่มเจ็บ', 'ใส่แมสก์ ตอนนิกี้เริ่มเจ็บ']) console.log(await p.evaluate((t) => window.__fix(t), t)); await b.close(); })();
