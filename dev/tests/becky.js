const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const mk = await b.newPage({ viewport: { width: 1179, height: 900 } });
  await mk.setContent('<body style="margin:40px;background:#fff;font:34px/1.7 Loma,Garuda,sans-serif;color:#111">ฟรีน สโรชา และเบคกี้ รีเบคก้า เปิดตัวซีรีส์เรื่องใหม่ เบคกี้บอกว่าตื่นเต้นมาก ส่วนฟรีนก็ขอบคุณแฟนๆ ที่ติดตามมาตลอด</body>');
  await mk.screenshot({ path: 'ocrtest/becky.png' });
  const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1');  });
  await p.reload(); await p.waitForTimeout(800);
  await p.setInputFiles('#imgfile', ['ocrtest/becky.png']);
  await p.waitForFunction(() => /由文字辨識讀出/.test(document.getElementById('ocrmsg').textContent), null, { timeout: 120000 });
  console.log('docsec:', (await p.innerText('#docsec')).replace(/\n/g, ' / '));
  console.log('text:', await p.$eval('#text', e => e.textContent.slice(0, 200)));
  console.log((await p.inputValue('#report')).split('\n').filter(l => /^專有名詞：|^文字辨識/.test(l)).join('\n').slice(0, 400));
  await p.screenshot({ path: 'tests/becky-doc.png' });
  const el = await p.$('#text mark.ent');
  if (el) { const bb = await el.boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(400); await p.screenshot({ path: 'tests/becky-pop.png' }); }
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
