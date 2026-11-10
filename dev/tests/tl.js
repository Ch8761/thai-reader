const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', 'pdfin/C.pdf'); await p.waitForFunction(() => /\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  const r = await p.evaluate(() => { const out = []; const spans = [...document.querySelectorAll('#text > span')]; let i = spans.findIndex(s => s.textContent.includes('ตอนของซีรียส')); for (let k = i - 2; k < i + 14; k++) { const s = spans[k]; out.push((s.className) + ' ' + JSON.stringify(s.textContent) + ' L' + s.style.left + ' T' + s.style.top + ' F' + s.style.fontSize); } return out; });
  console.log(r.join('\n'));
  await b.close();
})();
