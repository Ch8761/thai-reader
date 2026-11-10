const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await ctx.route('https://accounts.google.com/**', r => r.fulfill({ contentType: 'text/javascript', body: 'window.google={accounts:{oauth2:{initTokenClient:function(){return{requestAccessToken:function(){}};}}}};' }));
  const calls = []; await ctx.route('https://www.googleapis.com/**', r => { calls.push(r.request().method() + ' ' + new URL(r.request().url()).pathname); const u = new URL(r.request().url()); if (u.pathname.indexOf('userinfo') >= 0) return r.fulfill({ json: { email: 'me@gmail.com' } }); if (u.pathname === '/drive/v3/files' && r.request().method() === 'GET') return r.fulfill({ json: { files: [] } }); return r.fulfill({ json: { id: 'x1' } }); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-sync-state', 'S123'); });
  await p.goto('about:blank'); await p.goto('http://127.0.0.1:8765/index.html#access_token=TOKEN1&token_type=Bearer&expires_in=3599&state=S123&scope=email%20https://www.googleapis.com/auth/drive.appdata');
  await p.waitForTimeout(4000);
  console.log('url', p.url(), 'on', await p.evaluate(() => localStorage.getItem('thai-sync-on')), 'tab settings', await p.evaluate(() => !document.getElementById('view-settings').hidden));
  console.log('state', await p.textContent('#syncState'), '|', await p.textContent('#syncMsg')); console.log('calls', calls.join(', '));
  // bad state
  await p.goto('about:blank'); await p.goto('http://127.0.0.1:8765/index.html#access_token=T2&state=WRONG'); await p.waitForTimeout(1500); console.log('bad', await p.textContent('#syncMsg'));
  // redirect url built
  const u = await p.evaluate(() => { window.__ev("syncSignInRedirect = syncSignInRedirect"); return window.__ev("(function(){ var h; var q = { client_id: SYNC_CLIENT_ID, redirect_uri: syncRedirectUri() }; return JSON.stringify(q); })()"); }); console.log('redir', u);
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
