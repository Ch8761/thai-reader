const { chromium } = require('playwright');
const OUT = process.argv[2], DIR = process.argv[3];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('thai-notes-files'); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(800);
  const open = async (f) => { await p.setInputFiles('#pdffile', DIR + '/' + f); await p.waitForFunction((f) => document.getElementById('docstatus').textContent.includes(f + '（'), f, { timeout: 60000 }); await p.waitForTimeout(1200); };
  const rep = async (k) => (await p.inputValue('#report')).split('\n').filter(l => k.some(x => l.startsWith(x))).join('\n');
  // find point of the n-th occurrence of word in state text (via spans)
  const pt = (word, nth = 0, off = 1) => p.evaluate(([word, nth, off]) => {
    const spans = [...document.querySelectorAll('#text .tl')];
    let seen = 0;
    for (const sp of spans) {
      const t = sp.textContent; let i = -1;
      while ((i = t.indexOf(word, i + 1)) >= 0) {
        if (seen++ < nth) continue;
        const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); let n, acc = 0;
        while ((n = w.nextNode())) { const l = n.nodeValue.length; const k = i + off; if (k < acc + l) { const rg = document.createRange(); rg.setStart(n, k - acc); rg.setEnd(n, k - acc + 1); const r = rg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } acc += l; }
      }
    }
    return null;
  }, [word, nth, off]);
  const tap = async (word, nth = 0) => {
    const q = await pt(word, nth); if (!q) return word + ': not found';
    await p.evaluate((y) => window.scrollBy(0, y - 400), q.y); await p.waitForTimeout(300);
    const q2 = await pt(word, nth); await p.mouse.click(q2.x, q2.y); await p.waitForTimeout(250);
    const vis = await p.isVisible('#pop');
    return word + ' → ' + (vis ? (await p.innerText('#pop .pw')) + ' | ' + (await p.innerText('#pop .pd')).replace(/\n/g, ' / ').slice(0, 70) : await p.innerText('#info'));
  };
  await open('B.pdf');
  for (const w of ['ไต้หวัน', 'เตือน', 'ระวัง', 'แทรกซึม', 'ยกระดับ', 'อิทธิพล', 'จีน', 'ชื่อเสียง', 'มีนาคม', 'Reuters']) console.log(await tap(w));
  // overlay check
  await p.click('#openSettings'); await p.click('#showTl'); await p.click('#closeSettings');
  const q = await pt('ประธานาธิบดี'); await p.evaluate((y) => window.scrollBy(0, y - 300), q.y); await p.waitForTimeout(400);
  const q3 = await pt('ประธานาธิบดี');
  await p.screenshot({ path: OUT + '/B-overlay.png', clip: { x: 40, y: q3.y - 120, width: 760, height: 330 } });
  await p.click('#openSettings'); await p.click('#showTl'); await p.click('#closeSettings');
  // highlight drag
  await p.click('.tool[data-mode="hl"]');
  const a = await pt('ได้ยกระดับ'), z = await pt('อิทธิพล', 0, 5);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + z.x) / 2, a.y, { steps: 5 }); await p.mouse.move(z.x, z.y, { steps: 5 }); await p.mouse.up();
  // ink
  await p.click('.tool[data-mode="ink"]');
  await p.mouse.move(a.x, a.y + 20); await p.mouse.down(); for (let i = 1; i <= 20; i++) await p.mouse.move(a.x + i * 12, a.y + 20 + Math.sin(i / 2) * 6); await p.mouse.up();
  // box on word
  await p.click('.tool[data-mode="box"]');
  const bw = await pt('เกาะ'); await p.mouse.click(bw.x, bw.y); await p.keyboard.type('島'); await p.click('.tool[data-mode="tap"]');
  await p.waitForTimeout(300);
  const a2 = await pt('ได้ยกระดับ');
  await p.screenshot({ path: OUT + '/B-notes.png', clip: { x: 40, y: a2.y - 150, width: 760, height: 330 } });
  console.log(await rep(['筆記數量', '儲存']));
  await p.reload(); await p.waitForFunction(() => document.getElementById('docstatus').textContent.includes('B.pdf（'), null, { timeout: 60000 }); await p.waitForTimeout(1500);
  console.log('after reload:', await p.innerText('#docstatus')); console.log(await rep(['筆記數量', 'PDF 文字層']));
  const a3 = await pt('ได้ยกระดับ'); await p.evaluate((y) => window.scrollBy(0, y - 300), a3.y); await p.waitForTimeout(800);
  const a4 = await pt('ได้ยกระดับ');
  await p.screenshot({ path: OUT + '/B-reload.png', clip: { x: 40, y: a4.y - 150, width: 760, height: 330 } });
  await open('C.pdf');
  for (const w of ['เนี่ย', 'บันเทิง', 'เศรษฐกิจ', 'ขึ้น', 'แฟชั่น', '泰國']) console.log(await tap(w));
  await p.click('#openSettings'); await p.click('#showTl'); await p.click('#closeSettings');
  const c1 = await pt('กระแส'); await p.evaluate((y) => window.scrollBy(0, y - 300), c1.y); await p.waitForTimeout(600);
  const c2 = await pt('กระแส');
  await p.screenshot({ path: OUT + '/C-overlay.png', clip: { x: 40, y: c2.y - 60, width: 760, height: 300 } });
  console.log(await rep(['PDF 文字層']));
  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
