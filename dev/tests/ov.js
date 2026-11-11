const { chromium } = require('playwright');
const OUT = process.argv[2], DIR = process.argv[3], F = process.argv[4] || 'B.pdf';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 3 })).newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(600);
  await p.setInputFiles('#pdffile', DIR + '/' + F); await p.waitForFunction((f) => document.getElementById('docstatus').textContent.includes(f + '（'), F, { timeout: 60000 });
  await p.evaluate(() => document.body.classList.add('showtl'));
  await p.locator('#wrap').scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  const info = await p.evaluate(() => { const sp=[...document.querySelectorAll('#text .tl')].slice(0,6); return sp.map(s=>{const r=s.getBoundingClientRect(); return s.textContent.slice(0,15)+' '+r.left.toFixed(1)+','+r.top.toFixed(1)+' '+r.width.toFixed(1)+'x'+r.height.toFixed(1)+' fs='+s.style.fontSize+' '+getComputedStyle(s).fontFamily.slice(0,30)}); });
  console.log(info.join('\n'));
  const fonts = await p.evaluate(async () => { const r=[]; for (const f of ['Thonburi','Noto Sans Thai','Tahoma','Loma','Garuda','sans-serif']) r.push(f+':'+document.fonts.check('16px "'+f+'"','ก')); return r.join(' '); });
  console.log(fonts);
  const r = await p.$eval('#text .tl', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await p.screenshot({ path: OUT + '/ov-zoom.png', clip: { x: r.x - 10, y: r.y - 20, width: 420, height: 160 } });
  await b.close();
})();
