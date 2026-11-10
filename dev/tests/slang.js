const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.click('#openPaste'); await p.fill('#textTitle', 'slang');
  const T = 'ขอบคุณทุกคนมากกกกก น่ารักกกกก รักนะคะะะ งื้ออออ คิดถึงงงง ไปกันน้าาาา ค่าาาา 55555 วันนี้ไลฟ์ด้วยน้าาา ฟินมากกก ปังสุดๆๆๆ';
  await p.fill('#input', T); await p.click('#addText'); await p.waitForTimeout(600);
  console.log((await p.inputValue('#report')).split('\n').filter(l => /^專有名詞：|^網路用語/.test(l)).join('\n').slice(0, 300));
  const tap = async (needle, off = 1) => {
    const pt = await p.evaluate(([n, off]) => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf(n); if (i >= 0) { const r = document.createRange(); r.setStart(node, i + off); r.setEnd(node, i + off + 1); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } } return null; }, [needle, off]);
    await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250);
    const pop = await p.isVisible('#pop') ? (await p.innerText('#pop')).replace(/\n/g, ' / ').slice(0, 130) : '(no pop) ' + await p.innerText('#info');
    return pop;
  };
  for (const [n, o] of [['มากกกกก', 4], ['รักกกกก', 4], ['คะะะ', 2], ['งื้ออออ', 4], ['คิดถึงงงง', 7], ['น้าาาา', 3], ['ค่าาาา', 3], ['55555', 2], ['ไลฟ์', 1], ['ฟิน', 1], ['ปัง', 1]]) console.log(n, '=>', await tap(n, o));
  await tap('ค่าาาา', 3); await p.screenshot({ path: 'tests/slang-pop.png' });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
