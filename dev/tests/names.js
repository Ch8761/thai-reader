const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1','1'); }); await p.reload(); await p.waitForTimeout(800);
  await p.click('#openPaste'); await p.fill('#textTitle', '名字測試');
  await p.fill('#input', 'ประธานาธิบดีไล่ ชิง-เต๋อ ออกมาเตือนตามรายงานของรอยเตอร์ วันนี้ญาญ่าอุรัสยากับพิมพ์ชนกจันทร์ฉายไปดูซีรีส์แปลรักฉันด้วยใจเธอกับเพื่อน');
  await p.click('#addText'); await p.waitForTimeout(600);
  const rep = async (k) => (await p.inputValue('#report')).split('\n').filter(l => k.some(x => l.startsWith(x))).join('\n');
  console.log(await rep(['專有名詞']));
  const tapText = async (needle, off = 1) => {
    const pt = await p.evaluate(([n, off]) => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf(n); if (i >= 0) { const r = document.createRange(); r.setStart(node, i + off); r.setEnd(node, i + off + 1); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } } return null; }, [needle, off]);
    await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300);
    return (await p.innerText('#pop')).replace(/\n/g, ' / ').slice(0, 200);
  };
  console.log('tap ไล่:', await tapText('ชิง', 1));
  console.log('tap รอยเตอร์:', await tapText('รอยเตอร์', 2));
  console.log('tap ญาญ่า:', await tapText('ญาญ่า', 1));
  // add custom name: open editor, extend right to cover ญาญ่าอุรัสยา
  console.log('tap พิมพ์:', await tapText('พิมพ์ชนก', 1));
  await p.click('#pop button:has-text("這是名字或劇名？")').catch(async () => { await p.click('#pop button:has-text("存成名字")'); });
  console.log('editor:', await p.innerText('.nmprev'));
  for (let i = 0; i < 12 && (await p.innerText('.nmprev')) !== 'พิมพ์ชนกจันทร์ฉาย'; i++) {
    const cur = await p.innerText('.nmprev');
    if (cur.length < 'พิมพ์ชนกจันทร์ฉาย'.length) await p.click('.nmadj[aria-label="後面多一個字"]'); else await p.click('.nmadj[aria-label="後面少一個字"]');
  }
  console.log('editor after:', await p.innerText('.nmprev'));
  await p.click('.nmtypes button:has-text("人名")'); await p.fill('.nmzh', '女星 Yaya');
  await p.click('#pop button:has-text("存到我的名單")'); await p.waitForTimeout(300);
  console.log('info:', await p.innerText('#info'));
  console.log('tap again:', await tapText('จันทร์ฉาย', 2));
  console.log(await rep(['專有名詞']));
  await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(200);
  console.log('settings:', await p.innerText('#myNamesCount'), '|', (await p.innerText('#myNamesList')).replace(/\n/g, ' '));
  await p.$eval('#myNamesList', e => e.scrollIntoView()); await p.screenshot({ path: 'tests/names-settings.png' });
  await p.click('.tabbar [data-tab="doc"]'); await tapText('จันทร์ฉาย', 2); await p.screenshot({ path: 'tests/names-pop.png' });
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
