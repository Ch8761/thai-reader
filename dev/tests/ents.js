const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', 'pdfin/' + (process.argv[2] || 'C.pdf')); await p.waitForFunction(() => /\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  const t = await p.evaluate(() => JSON.parse(localStorage.getItem('thai-notes-test-v1')).text);
  const ents = await p.evaluate(() => { return null; });
  // re-run detection via report text is limited; instead expose through console: compute contexts from report examples
  const rep = (await p.inputValue('#report')).split('\n').find(l => l.startsWith('專有名詞'));
  const ex = rep.split('例：')[1].split('、').map(x => x.split('=')[0]);
  for (const e of ex) { const i = t.indexOf(e); console.log(JSON.stringify(e), '→', JSON.stringify(t.slice(Math.max(0, i - 15), i + e.length + 15))); }
  await b.close();
})();
