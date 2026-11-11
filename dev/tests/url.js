const { chromium, devices } = require('playwright'); const fs = require('fs');
const FX = { 'https://news.example.co.th/travel/1': ['news.html', 'text/html; charset=utf-8'], 'https://econ.example.com/a': ['ld.html', 'text/html'], 'http://school.example.ac.th/news.php': ['tis.html', 'text/html'], 'https://www.bbc.co.uk/news/x': ['en.html', 'text/html'] };
(async () => {
  const b = await chromium.launch();
  for (const [nm, opt] of [['ipad', { viewport: { width: 820, height: 1180 } }], ['phone', devices['iPhone SE']]]) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.route('**/api/fetch?*', route => {
      const u = new URL(route.request().url()).searchParams.get('url');
      if (/js\.example/.test(u)) { const viaR = /via=reader/.test(route.request().url()); return route.fulfill({ status: 200, headers: { 'content-type': 'application/octet-stream', 'x-final-url': encodeURI(u), 'x-source-type': 'text/html', 'x-via': viaR ? 'reader' : 'direct' }, body: viaR ? fs.readFileSync('tests/urlfx/news.html') : '<html><body><div id="app">Loading</div></body></html>' }); }
      if (/403/.test(u)) return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'status', status: 403 }) });
      const f = FX[u]; if (!f) return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'network' }) });
      route.fulfill({ status: 200, headers: { 'content-type': 'application/octet-stream', 'x-final-url': encodeURI(u), 'x-source-type': f[1] }, body: fs.readFileSync('tests/urlfx/' + f[0]) });
    });
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); localStorage.setItem('thai-theme','light'); }); await p.reload(); await p.waitForTimeout(1500);
    await p.screenshot({ path: `tests/url-${nm}-home.png` });
    await p.click('#openPaste'); await p.waitForTimeout(200); await p.screenshot({ path: `tests/url-${nm}-panel.png` });
    const run = async (u, viaTextarea) => {
      await p.click('.tabbar [data-tab="home"]'); if (await p.locator('#pastebox').isHidden()) await p.click('#openPaste');
      if (viaTextarea) { await p.fill('#input', u); await p.click('#addText'); } else { await p.fill('#urlInput', u); await p.click('#addUrl'); }
      await p.waitForFunction(() => !window.__ev('urlBusy'), null, { timeout: 10000 }); await p.waitForTimeout(400);
      const docOpen = await p.evaluate(() => !document.getElementById('view-doc').hidden);
      return docOpen ? { title: await p.textContent('#h-docv'), src: await p.textContent('#docSrc'), text: (await p.evaluate(() => window.__ev('state.text'))) } : { msg: await p.textContent('#homeMsg') };
    };
    if (nm === 'ipad') {
      const r1 = await run('https://news.example.co.th/travel/1'); console.log('NEWS', JSON.stringify(r1, null, 1));
      await p.screenshot({ path: 'tests/url-doc.png' });
      console.log('LD', JSON.stringify(await run('https://econ.example.com/a')));
      console.log('TIS', JSON.stringify(await run('school.example.ac.th/news.php'.replace(/^/, 'http://'))));
      console.log('TEXTAREA', JSON.stringify((await run('https://econ.example.com/a', true)).title));
      console.log('JS->READER', JSON.stringify((await run('https://js.example.com/d')).title));
      console.log('EN', JSON.stringify(await run('https://www.bbc.co.uk/news/x')));
      console.log('403', JSON.stringify(await run('https://paywall.example.com/403')));
      console.log('FB', JSON.stringify(await run('https://www.facebook.com/somepage/posts/1')));
      console.log('BAD', JSON.stringify(await run('not a url at all')));
    }
    console.log(nm, 'ERRORS:', errs.join(' | ') || 'none');
  }
  await b.close();
})();
