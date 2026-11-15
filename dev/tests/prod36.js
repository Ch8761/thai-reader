// 正式版：補充詞彙檔載得到、查得到 โฟกัส
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200))); let got = 0; p.on('response', r => { if (/dict2\.txt/.test(r.url()) && r.status() === 200) got++; });
  await p.goto('http://127.0.0.1:8766/index.html');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(2500);
  await p.click('#openPaste').catch(() => {}); await p.fill('#input', 'ช่วยโฟกัสกับคอนเทนต์หน่อย แล้วไปกินกะเพราหมูสับ'); await p.click('#addText').catch(async () => { await p.evaluate(() => document.querySelector('#pastebox button.primary').click()); });
  await p.waitForTimeout(1200);
  const txt = await p.evaluate(() => document.getElementById('text').textContent);
  const ok = got >= 1 && /โฟกัส/.test(txt) && errs.length === 0 && (await p.locator('#editText').isVisible());
  console.log(ok ? 'PASS' : 'FAIL', '正式版：dict2.txt 載入、文字文件有「修改文字」', got, txt.slice(0, 40), errs.join('|'));
  await b.close(); process.exit(ok ? 0 : 1);
})();
