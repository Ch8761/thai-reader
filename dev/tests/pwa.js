const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.waitForTimeout(2000);
  console.log('title', await p.title(), '| welcome', await p.isVisible('#welcome'));
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? (r.active || r.installing || r.waiting) && 'registered' : 'none'; });
  console.log('sw', sw, '| manifest', await p.evaluate(() => fetch('manifest.webmanifest').then(r => r.json()).then(j => j.name)));
  await p.click('#wDone');
  console.log((await p.inputValue('#report')).split('\n').filter(l => /^(意見回饋|外觀)/.test(l)).join('\n'));
  await p.setInputFiles('#pdffile', '/tmp/claude-0/-home-claude/88754f5b-9eb8-550b-9e53-96d540ad93ce/scratchpad/pdfin/C.pdf');
  await p.waitForFunction(() => /C\.pdf（/.test(document.getElementById('docstatus').textContent), null, { timeout: 60000 });
  console.log('doc:', await p.innerText('#docstatus'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
