const { chromium } = require('playwright');
const cases = [
  ['คนที่ใส่เสื้อแดงคือพี่ชายฉัน', 'ที่'], ['เขาทำงานที่กรุงเทพฯ', 'ที่'], ['ขอบคุณที่มา', 'ที่'], ['เขาได้ที่หนึ่ง', 'ที่'],
  ['ฉันพูดภาษาไทยได้', 'ได้'], ['เมื่อวานได้ไปดูหนัง', 'ได้'], ['ครูให้นักเรียนอ่านหนังสือ', 'ให้'], ['ไม่เผ็ดเลย', 'เลย'],
  ['เขาถูกตำรวจจับ', 'ถูก'], ['นายกรัฐมนตรีกล่าวว่ารัฐบาลกำลังพิจารณามาตรการใหม่', 'ว่า'], ['อย่างไรก็ตาม ยังไม่มีการยืนยัน', 'ยัง'],
  ['ฉันคิดว่าเขาพูดถูก', 'ว่า'], ['ผลไม้นี้เรียกว่ามังคุด', 'ว่า'], ['แม่ว่าลูกที่กลับบ้านดึก', 'ว่า'], ['ว่าแต่คุณจะไปไหน', 'ว่า'],
  ['เขาเดินมาหาฉัน', 'มา'], ['พรุ่งนี้ฉันจะไปเชียงใหม่', 'ไป'], ['ฉันเรียนภาษาไทยมาสามปีแล้ว', 'มา'], ['มีผู้ติดเชื้อเพิ่มสิบราย', 'ราย'],
  ['ราคาเพิ่มขึ้นอย่างรวดเร็ว', 'อย่าง'], ['จริงเหรอ', 'รอ']
];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 1400 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-level', 'all'); }); await p.reload();
  await p.click('summary');
  for (const [txt, target] of cases) {
    await p.fill('#input', txt); await p.click('#load'); await p.click('#load'); await p.waitForTimeout(100);
    await p.evaluate(() => window.scrollTo(0, 0));
    const r = await p.evaluate((t) => { const tx = document.getElementById('text'); const i = tx.textContent.indexOf(t); const w = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT); let n, acc = 0; while ((n = w.nextNode())) { const l = n.nodeValue.length; if (i < acc + l) { const rg = document.createRange(); rg.setStart(n, i - acc); rg.setEnd(n, i - acc + 1); const bb = rg.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2 }; } acc += l; } }, target);
    await p.mouse.click(r.x, r.y); await p.waitForTimeout(120);
    const info = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('#pop .gcard')].map(c => c.querySelector('.gname').textContent + (c.querySelector('.gmine') ? '*' : ''));
      const g = document.querySelector('#pop .gcard[open] .gguess');
      return cards.join(' | ') + (g ? '  =>  ' + g.textContent.split('（')[0] : '');
    });
    console.log(txt, '[' + target + ']:', info);
    await p.evaluate(() => { document.getElementById('pop').hidden = true; });
  }
  // level filter test
  await p.evaluate(() => localStorage.setItem('thai-level', 'a')); await p.reload(); await p.click('summary');
  await p.fill('#input', 'อย่างไรก็ตาม ยังไม่มีการยืนยัน'); await p.click('#load'); await p.click('#load'); await p.evaluate(() => window.scrollTo(0, 0));
  const r2 = await p.evaluate(() => { const n = document.getElementById('text').firstChild; const rg = document.createRange(); rg.setStart(n, 16); rg.setEnd(n, 17); const bb = rg.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2 }; });
  await p.mouse.click(r2.x, r2.y); await p.waitForTimeout(120);
  console.log('level a shown:', await p.$$eval('#pop .gcard .gname', es => es.map(e => e.textContent).join(' | ')), '| more:', await p.$eval('#pop .more', e => e.textContent).catch(() => 'none'));
  // example romanization + doubt in prompt
  await p.click('#pop .gcard summary');
  console.log('example rom:', await p.$eval('#pop .gcard .grom', e => e.textContent).catch(() => 'none'));
  await p.fill('#pop textarea.doubt', 'ยัง 和 ยังไม่ 差在哪？');
  const href = await p.$eval('#pop a.ai', e => decodeURIComponent(e.href));
  console.log('prompt has doubt:', href.includes('我特別困惑的地方：ยัง 和 ยังไม่ 差在哪？'));
  console.log((await p.inputValue('#report')).split('\n').find(l => l.startsWith('句型庫')));
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none'); await b.close();
})();
