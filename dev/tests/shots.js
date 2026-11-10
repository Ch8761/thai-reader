const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const W = +(process.env.W || 820), H = +(process.env.H || 1180);
  const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await p.goto(process.env.URL || 'http://127.0.0.1:8766/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
  const tag = process.env.TAG || 'a';
  await p.screenshot({ path: `tests/s-${tag}-home.png` });
  await p.click('#openPaste'); await p.fill('#textTitle', '測試'); await p.fill('#input', 'วันนี้ฟรีน สโรชา ไปกองถ่ายละครเรื่องใหม่ เหนื่อยมากกกก แต่สนุกมาก ขอบคุณทุกคนนะคะ'); await p.click('#addText'); await p.waitForTimeout(600);
  await p.screenshot({ path: `tests/s-${tag}-doc.png` });
  const tap = async (n, off) => { const pt = await p.evaluate(([n, off]) => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf(n); if (i >= 0) { const r = document.createRange(); r.setStart(node, i + off); r.setEnd(node, i + off + 1); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } } }, [n, off]); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(400); };
  await tap('สโรชา', 1); await p.screenshot({ path: `tests/s-${tag}-popname.png` });
  await p.click('#pop .x'); await p.waitForTimeout(200); await tap('ขอบคุณ', 2); await p.screenshot({ path: `tests/s-${tag}-popword.png` });
  await p.$eval('#pop', e => e.scrollTop = 9999); await p.screenshot({ path: `tests/s-${tag}-popword2.png` });
  await p.click('#pop .x');
  await p.click('#openExport').catch(() => {}); await p.waitForTimeout(300); await p.screenshot({ path: `tests/s-${tag}-export.png` });
  await p.click('.tabbar [data-tab="cards"]'); await p.waitForTimeout(300); await p.screenshot({ path: `tests/s-${tag}-cards.png`, fullPage: false });
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300); await p.screenshot({ path: `tests/s-${tag}-settings.png`, fullPage: true });
  await b.close();
})();
