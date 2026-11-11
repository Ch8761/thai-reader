const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  let authOn = true, rtValid = true; const authCalls = [];
  await ctx.route('**/api/auth', async r => {
    const req = r.request();
    if (req.method() === 'GET') return r.fulfill({ json: { enabled: authOn, linked: false } });
    const body = JSON.parse(req.postData() || '{}'); authCalls.push(body.action + (body.redirect_uri ? ':' + body.redirect_uri : ''));
    if (body.action === 'code') return r.fulfill({ json: { access_token: 'AT1', expires_in: 3599, scope: 'email https://www.googleapis.com/auth/drive.appdata', refresh: true } });
    if (body.action === 'refresh') return rtValid ? r.fulfill({ json: { access_token: 'AT2', expires_in: 3599 } }) : r.fulfill({ status: 401, json: { error: 'invalid_grant' } });
    return r.fulfill({ json: { ok: true } });
  });
  let googleNav = '';
  await ctx.route('https://accounts.google.com/**', r => { const u = r.request().url(); if (u.includes('/o/oauth2/v2/auth')) { googleNav = u; return r.fulfill({ body: 'google' }); } return r.fulfill({ contentType: 'text/javascript', body: 'window.google={accounts:{oauth2:{initTokenClient:function(){return{requestAccessToken:function(){}};}}}};' }); });
  const tokSeen = []; await ctx.route('https://www.googleapis.com/**', r => { tokSeen.push((r.request().headers().authorization || '').replace('Bearer ', '')); const u = new URL(r.request().url()); if (u.pathname.indexOf('userinfo') >= 0) return r.fulfill({ json: { email: 'me@gmail.com' } }); if (u.pathname === '/drive/v3/files' && r.request().method() === 'GET') return r.fulfill({ json: { files: [] } }); return r.fulfill({ json: { id: 'x1' } }); });
  const B = 'http://127.0.0.1:8765/';
  await p.goto(B + 'index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); });
  await p.reload(); await p.waitForTimeout(1500);
  await p.evaluate(() => window.__ev("showTab('settings'); settingsOpen('data')"));
  await p.waitForTimeout(300);
  const btns = await p.$$eval('#syncBox button, #syncBtns button', a => a.map(x => x.textContent));
  console.log('buttons', btns.join(' / '));
  await p.click('text=連結 Google 帳號'); await p.waitForTimeout(1500);
  const gu = new URL(googleNav || 'http://x/'); console.log('google', gu.searchParams.get('response_type'), gu.searchParams.get('access_type'), gu.searchParams.get('prompt'), gu.searchParams.get('redirect_uri'));
  const st = gu.searchParams.get('state');
  await p.goto(B + '?code=CODE1&state=' + st + '&scope=x'); await p.waitForTimeout(4000);
  console.log('after code: url', await p.evaluate(() => location.href), 'rt', await p.evaluate(() => localStorage.getItem('thai-sync-rt')), 'state', await p.textContent('#syncState'), '| msg', await p.textContent('#syncMsg'));
  console.log('authCalls', authCalls.join(', '), 'tok', [...new Set(tokSeen)].join(','));
  // expire the token → next sync should refresh silently
  await p.evaluate(() => localStorage.setItem('thai-sync-token', JSON.stringify({ tok: 'AT1', exp: Date.now() - 1000 })));
  tokSeen.length = 0; authCalls.length = 0;
  await p.evaluate(() => window.__ev('runSync()')); await p.waitForTimeout(2500);
  console.log('after expiry: authCalls', authCalls.join(','), 'tok', [...new Set(tokSeen)].join(','), 'msg', await p.textContent('#syncMsg'));
  // reload with expired token → auto sync on load uses refresh
  await p.evaluate(() => localStorage.setItem('thai-sync-token', JSON.stringify({ tok: 'AT2', exp: Date.now() - 1000 })));
  tokSeen.length = 0; authCalls.length = 0; await p.reload(); await p.waitForTimeout(5000);
  console.log('reload: authCalls', authCalls.join(','), 'tok', [...new Set(tokSeen)].join(','));
  // dead refresh token
  rtValid = false; await p.evaluate(() => localStorage.setItem('thai-sync-token', JSON.stringify({ tok: 'AT2', exp: Date.now() - 1000 })));
  await p.evaluate(() => window.__ev('runSync()')); await p.waitForTimeout(2000);
  console.log('dead: rt', await p.evaluate(() => localStorage.getItem('thai-sync-rt')), 'state', await p.textContent('#syncState'));
  // fallback when no secret
  authOn = false; await p.evaluate(() => localStorage.clear()); await p.evaluate(() => localStorage.setItem('thai-welcome-v1', '1')); await p.reload(); await p.waitForTimeout(1500);
  console.log('nosecret codeOK', await p.evaluate(() => window.__ev ? window.__ev('sync.codeOK') : 'n/a'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
