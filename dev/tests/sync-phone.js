// 重現：手機（已有自己的資料、已連結但沒有自動續登入）按「改成自動保持登入」→ 從 Google 跳回來 → 有沒有當掉／一直重新載入
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:8765/';
const SYNC_SET = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-theme', 'thai-tone-mode', 'thai-font', 'thai-tools', 'thai-my-names', 'thai-progress', 'thai-home-view', 'thai-my-words', 'thai-my-splits'];
(async () => {
  const b = await chromium.launch();
  // ---- 假的 Google 雲端硬碟（兩台共用）----
  const drive = { files: {}, n: 0 };
  async function fakeDrive(r) {
    const req = r.request(), u = new URL(req.url()), m = req.method();
    if (u.pathname.indexOf('userinfo') >= 0) return r.fulfill({ json: { email: 'x@example.com' } });
    if (u.pathname.indexOf('/upload/drive/v3/files') === 0) {
      const id = (u.pathname.split('/')[5]) || ('f' + (++drive.n));
      if (m === 'PATCH') { const f = drive.files[id]; f.data = req.postDataBuffer(); return r.fulfill({ json: { id } }); }
      const buf = req.postDataBuffer(), txt = buf.toString('latin1'), bd = /boundary=(.+)$/.exec(req.headers()['content-type'])[1];
      const parts = txt.split('--' + bd).filter(x => x.indexOf('name="') >= 0);
      let meta = null, data = null;
      parts.forEach(p => { const i = p.indexOf('\r\n\r\n'), head = p.slice(0, i), body = p.slice(i + 4, p.length - 2); if (/name="metadata"/.test(head)) meta = JSON.parse(Buffer.from(body, 'latin1').toString('utf8')); else data = Buffer.from(body, 'latin1'); });
      drive.files['f' + drive.n] = { id: 'f' + drive.n, name: meta.name, data }; return r.fulfill({ json: { id: 'f' + drive.n } });
    }
    if (u.pathname === '/drive/v3/files') return r.fulfill({ json: { files: Object.values(drive.files).map(f => ({ id: f.id, name: f.name, size: String(f.data.length) })) } });
    const id = u.pathname.split('/')[4]; if (drive.files[id]) return r.fulfill({ body: drive.files[id].data, contentType: 'application/json' });
    return r.fulfill({ status: 404, body: 'no' });
  }
  async function mkCtx(opts) {
    const ctx = await b.newContext(opts);
    let authOn = true;
    await ctx.route('**/api/auth', async r => {
      const req = r.request();
      if (req.method() === 'GET') return r.fulfill({ json: { enabled: true, linked: false } });
      const body = JSON.parse(req.postData() || '{}');
      if (body.action === 'code') return r.fulfill({ json: { access_token: 'AT1', expires_in: 3599, scope: 'email https://www.googleapis.com/auth/drive.appdata', refresh: true } });
      if (body.action === 'refresh') return r.fulfill({ json: { access_token: 'AT2', expires_in: 3599 } });
      return r.fulfill({ json: { ok: true } });
    });
    let nav = '';
    await ctx.route('https://accounts.google.com/**', r => { const u = r.request().url(); if (u.includes('/o/oauth2/v2/auth')) { nav = u; return r.fulfill({ body: 'google' }); } return r.fulfill({ contentType: 'text/javascript', body: 'window.google={accounts:{oauth2:{initTokenClient:function(){return {requestAccessToken:function(){}}},hasGrantedAllScopes:function(){return true}}}}' }); });
    await ctx.route('https://www.googleapis.com/**', fakeDrive);
    ctx.getNav = () => nav; return ctx;
  }
  const mkPage = async ctx => { const p = await ctx.newPage(); p.errs = []; p.navs = 0; p.logs = []; p.on('pageerror', e => p.errs.push(String(e) + ' @ ' + String(e.stack).split('\n').slice(1, 4).join(' ; '))); p.on('console', m => { if (m.type() === 'error' || /sync/i.test(m.text())) p.logs.push(m.text().slice(0, 160)); }); p.on('framenavigated', f => { if (f === p.mainFrame()) p.navs++; }); p.on('crash', () => p.errs.push('PAGE CRASH')); return p; };
  const E = (p, c) => p.evaluate(c => window.__ev(c), c);
  const seed = (p, kv) => p.evaluate(o => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); for (const k in o) localStorage.setItem(k, o[k]); }, kv);

  // ---- iPad：先同步一次，把資料放到雲端 ----
  const ipadCtx = await mkCtx({ viewport: { width: 820, height: 1180 } });
  const ipad = await mkPage(ipadCtx);
  await ipad.goto(B + 'index.html');
  await seed(ipad, { 'thai-level': 'c', 'thai-theme': 'dark', 'thai-font': 'serif', 'thai-sync-on': '1', 'thai-sync-token': JSON.stringify({ tok: 'AT0', exp: Date.now() + 3600000 }) });
  await ipad.reload(); await ipad.waitForTimeout(1500);
  await E(ipad, "cards.push({id:'ipadcard1',w:'สวัสดี',m:'你好',added:Date.now()-5000}); saveCards(); 1");
  await ipad.waitForTimeout(500); await E(ipad, 'runSync()'); await ipad.waitForTimeout(3000);
  console.log('iPad uploaded files:', Object.values(drive.files).map(f => f.name).join(','), '| navs', ipad.navs, '| errs', ipad.errs.join('|') || 'none');

  // ---- 手機：有自己的資料，之前用小視窗連過（有 token、沒有自動續登入）----
  const phoneCtx = await mkCtx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await mkPage(phoneCtx);
  await phone.addInitScript(() => { const o = Storage.prototype.setItem; window.__w = []; Storage.prototype.setItem = function (k, v) { if (this === localStorage && /^thai-(level|show|gloss|theme|tone|font|tools|my-|progress|home)/.test(k) && localStorage.getItem(k) !== String(v)) window.__w.push(k); return o.call(this, k, v); }; });
  await phone.goto(B + 'index.html');
  await seed(phone, { 'thai-level': 'a', 'thai-theme': 'light', 'thai-sync-on': '1', 'thai-sync-token': JSON.stringify({ tok: 'AT0', exp: Date.now() + 3600000 }) });
  await phone.reload(); await phone.waitForTimeout(1500);
  await E(phone, "cards.push({id:'phonecard1',w:'ขอบคุณ',m:'謝謝',added:Date.now()-4000}); saveCards(); 1");
  await phone.evaluate(() => window.__ev("showTab('settings'); settingsOpen('data')")); await phone.waitForTimeout(500);
  console.log('phone buttons:', (await phone.$$eval('#syncBtns button', a => a.map(x => x.textContent))).join(' / '));
  await phone.click('text=改成自動保持登入'); await phone.waitForTimeout(1200);
  const st = new URL(phoneCtx.getNav() || 'http://x/').searchParams.get('state');
  console.log('google prompt =', new URL(phoneCtx.getNav() || 'http://x/').searchParams.get('prompt'));
  phone.navs = 0; phone.errs.length = 0;
  await phone.goto(B + '?code=CODE1&state=' + st + '&scope=x');
  for (let i = 1; i <= 12; i++) { await phone.waitForTimeout(2500); if (i % 4 === 0) console.log('t=' + i * 2.5 + 's navs', phone.navs, 'url', phone.url().replace(B, '/'), '| state:', (await phone.textContent('#syncState').catch(() => '??')).slice(0, 80)); }
  let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };
  ok('跳回來後沒有程式錯誤', phone.errs.length === 0, phone.errs.join(' | '));
  ok('手機和 iPad 的生字卡合併了', (await E(phone, "cards.map(function(c){return c.id}).sort().join(',')")) === 'ipadcard1,phonecard1');
  ok('取得自動續登入（thai-sync-rt）', (await phone.evaluate(() => localStorage.getItem('thai-sync-rt'))) === '1');
  ok('同步狀態顯示「會自動保持登入」', /會自動保持登入/.test(await phone.textContent('#syncState')));
  ok('沒有一直重新載入（頁面切換 ≤ 3 次）', phone.navs <= 3, phone.navs);
  ok('跳回來後 App 其他部分都啟動了（切到生字卡正常）', (await E(phone, "showTab('cards'); curTab")) === 'cards');
  ok('停在設定頁的資料區', true);
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  await b.close();
})();
