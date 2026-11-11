const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.click('#openPaste'); await p.fill('#textTitle', 'weak');
  await p.fill('#input', 'วันนี้ฟรีนไปกองถ่ายกับเบคกี้ ฟรีนบอกว่าสนุกมาก ประธานาธิบดีไล่ ชิง-เต๋อ ออกมาเตือน ส่วนเพื่อนของฟรีนก็มาด้วย');
  await p.click('#addText'); await p.waitForTimeout(600);
  console.log((await p.inputValue('#report')).split('\n').filter(l => /^專有名詞：/.test(l))[0]);
  const pt = await p.evaluate(() => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf('ฟรีน'); if (i >= 0) { const r = document.createRange(); r.setStart(node, i + 1); r.setEnd(node, i + 2); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } } });
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300);
  console.log('POP:', (await p.innerText('#pop')).replace(/\n/g, ' / ').slice(0, 200));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
