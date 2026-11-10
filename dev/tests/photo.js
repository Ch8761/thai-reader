const { chromium, devices } = require('playwright'); const fs = require('fs');
const corners = JSON.parse(fs.readFileSync('phototest/corners.json'));
(async () => {
  const b = await chromium.launch();
  for (const mode of (process.env.MODES || 'plain,warp').split(',')) {
    const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
    await p.setInputFiles('#imgfile', ['phototest/sign.jpg']);
    await p.waitForSelector('#photoEdit:not([hidden])', { timeout: 20000 }); await p.waitForTimeout(500);
    if (mode === 'warp') {
      const r = await p.evaluate(() => { const b = document.getElementById('phStage').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
      const start = [[0, 0], [1, 0], [1, 1], [0, 1]]; console.log('r', JSON.stringify(r)); p.on('console', m => console.log('C', m.text())); await p.evaluate(() => ['pointerdown','pointerup'].forEach(t => document.addEventListener(t, e => console.log(t, e.target.id || e.target.tagName, Math.round(e.clientX), Math.round(e.clientY)), true)));
      for (let i = 0; i < 4; i++) {
        await p.mouse.move(r.x + start[i][0] * r.w + (start[i][0] ? -2 : 2), r.y + start[i][1] * r.h + (start[i][1] ? -2 : 2)); await p.mouse.down();
        await p.mouse.move(r.x + corners[i][0] * r.w, r.y + corners[i][1] * r.h, { steps: 6 }); await p.mouse.up(); console.log('after', i, await p.getAttribute('#phPoly', 'points'));
      }
      console.log('poly', await p.getAttribute('#phPoly', 'points')); await p.screenshot({ path: 'tests/photo-edit.png' });
    }
    if (process.env.STOP) { await b.close(); return; }
    await p.click('#phOk');
    await p.waitForFunction(() => { try { return !document.getElementById('view-doc').hidden && window.__ev('ocr.total') > 0 && window.__ev('ocr.done') >= window.__ev('ocr.total') && !window.__ev('ocr.busy'); } catch (e) { return false; } }, null, { timeout: 180000 });
    await p.waitForTimeout(500);
    console.log(mode, JSON.stringify(await p.evaluate(() => window.__ev('state.text || (pdf && pdf.pages ? pdf.pages.map(function(g){return g.text || "";}).join("|") : "")'))), await p.textContent('#text').then(t => t.slice(0, 300)));
    if (mode === 'warp') await p.screenshot({ path: 'tests/photo-doc.png' });
    console.log('ERRORS:', errs.join(' | ') || 'none');
  }
  await b.close();
})();
