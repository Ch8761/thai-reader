const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(1500);
  fs.writeFileSync('/tmp/claude-0/-home-claude/88754f5b-9eb8-550b-9e53-96d540ad93ce/scratchpad/shots/t.srt', '1\n00:00:01,000 --> 00:00:02,000\nสวัสดีครับ\n\n2\n00:00:03,000 --> 00:00:04,000\n<i>ไปไหนมา</i>\n');
  await p.setInputFiles('#anyfile', ['shots/t.srt']); await p.waitForTimeout(1500);
  console.log('srt doc', await p.evaluate(() => window.__ev('state.text')), '| tab', await p.evaluate(() => window.__ev('curTab')));
  await p.evaluate(() => window.__ev("showTab('home')"));
  const pdf = 'pdfin/B.pdf';
  console.log('pdf file', pdf);
  if (pdf) { await p.setInputFiles('#anyfile', [pdf]); await p.waitForTimeout(3000); console.log('docs', await p.evaluate(() => JSON.stringify(window.__ev('lib.docs.map(function(d){return d.type+":"+d.name})')))); }
  await p.evaluate(() => window.__ev("showTab('home')"));
  fs.writeFileSync('shots/x.zip', 'zz'); await p.setInputFiles('#anyfile', ['shots/x.zip']); await p.waitForTimeout(300);
  console.log('msg', await p.textContent('#homeMsg'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
