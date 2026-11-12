// 正式版煙霧測試：第一次打開 → 精靈走完（初級、升級目標）→ 地圖分頁；再模擬從 Google 跳回來
const { chromium } = require('playwright');
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route('**/api/auth', r => r.request().method() === 'GET' ? r.fulfill({ json: { enabled: true, linked: false } }) : r.fulfill({ json: { access_token: 'AT1', expires_in: 3599, scope: 'email https://www.googleapis.com/auth/drive.appdata', refresh: true } }));
  await ctx.route('https://www.googleapis.com/**', r => { const u = new URL(r.request().url()); if (u.pathname.indexOf('userinfo') >= 0) return r.fulfill({ json: { email: 'x@example.com' } }); if (u.pathname === '/drive/v3/files' && r.request().method() === 'GET') return r.fulfill({ json: { files: [] } }); return r.fulfill({ json: { id: 'f1' } }); });
  await ctx.route('https://accounts.google.com/**', r => r.fulfill({ contentType: 'text/javascript', body: 'window.google={accounts:{oauth2:{initTokenClient:function(){return {requestAccessToken:function(){}}}}}}' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8766/'); await p.waitForTimeout(1800);
  ok('第一次打開：出現歡迎精靈', await p.locator('#welcome').isVisible());
  await p.click('#wNext'); await p.click('#wNext'); await p.waitForTimeout(100);
  await p.locator('#wzBody .wzopt').nth(1).click(); await p.click('#wNext'); await p.waitForTimeout(150);
  ok('初級：目標第一個是「升到中級」並推薦', (await p.locator('#wzBody .wzopt b').first().innerText()).includes('中級') && (await p.locator('#wzBody .wztag').count()) === 1);
  await p.click('#wNext'); await p.click('#wNext'); await p.waitForTimeout(150);
  await p.click('#wDone'); await p.waitForTimeout(1200);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.tabbar [data-tab="map"]').click()); await p.waitForTimeout(500);
  ok('地圖分頁：我的地圖 6 關＋學習紀錄', (await p.locator('#mapBody .mapsec .lqpath li').count()) === 6 && (await p.locator('#mapBody .recsec').count()) === 1);
  ok('底部 5 個分頁', (await p.locator('.tabbar [data-tab]').count()) === 5);
  // 從 Google 跳回來
  await p.evaluate(() => { localStorage.setItem('thai-sync-state', 'S1'); });
  await p.goto('http://127.0.0.1:8766/?code=CODE1&state=S1&scope=x'); await p.waitForTimeout(3500);
  ok('跳回來：沒有程式錯誤、停在設定頁、取得自動續登入', errs.length === 0 && (await p.evaluate(() => localStorage.getItem('thai-sync-rt'))) === '1' && (await p.locator('#view-settings').isVisible()), errs.join('|'));
  console.log(fails ? '失敗 ' + fails : '全部通過'); await b.close();
})();
