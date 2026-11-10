const { chromium } = require('playwright');
const drive = {}; let nid = 1; const log = [];
const GIS = `window.google = { accounts: { oauth2: {
  initTokenClient: function (cfg) { return { requestAccessToken: function () { setTimeout(function () { cfg.callback({ access_token: 'tok' + Date.now(), expires_in: 3600, scope: cfg.scope }); }, 50); } }; },
  hasGrantedAllScopes: function () { return true; }, revoke: function (t, cb) { cb && cb(); } } } };`;
function parseMultipart(buf, ct) {
  const bd = '--' + /boundary=([^;]+)/.exec(ct)[1]; const s = buf.toString('latin1'); const parts = s.split(bd).slice(1, -1);
  return parts.map(p => { const i = p.indexOf('\r\n\r\n'); return Buffer.from(p.slice(i + 4, p.length - 2), 'latin1'); });
}
async function setup(ctx) {
  await ctx.route('https://accounts.google.com/**', r => r.fulfill({ contentType: 'text/javascript', body: GIS }));
  await ctx.route('https://www.googleapis.com/**', async route => {
    const rq = route.request(), u = new URL(rq.url()), m = rq.method(); log.push(m + ' ' + u.pathname + u.search.slice(0, 40));
    const H = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'Location' };
    if (u.pathname === '/oauth2/v3/userinfo') return route.fulfill({ headers: H, json: { email: 'tester@gmail.com' } });
    if (m === 'GET' && u.pathname === '/drive/v3/files') return route.fulfill({ headers: H, json: { files: Object.values(drive).map(f => ({ id: f.id, name: f.name, size: String(f.data.length) })) } });
    let mm = /^\/drive\/v3\/files\/(\w+)$/.exec(u.pathname);
    if (mm && m === 'GET') { const f = drive[mm[1]]; return f ? route.fulfill({ headers: H, body: f.data }) : route.fulfill({ status: 404, headers: H, body: 'nf' }); }
    if (mm && m === 'DELETE') { delete drive[mm[1]]; return route.fulfill({ status: 204, headers: H, body: '' }); }
    if (u.pathname === '/upload/drive/v3/files' && m === 'POST' && u.searchParams.get('uploadType') === 'multipart') {
      const [meta, data] = parseMultipart(rq.postDataBuffer(), rq.headers()['content-type']); const md = JSON.parse(meta.toString('utf8'));
      const id = 'f' + (nid++); drive[id] = { id, name: md.name, data }; return route.fulfill({ headers: H, json: { id } });
    }
    if (u.pathname === '/upload/drive/v3/files' && m === 'POST' && u.searchParams.get('uploadType') === 'resumable') {
      const md = JSON.parse(rq.postData()); const id = 'f' + (nid++); drive[id] = { id, name: md.name, data: Buffer.alloc(0), pending: true };
      return route.fulfill({ headers: Object.assign({ Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=' + id }, H), body: '' });
    }
    if (u.pathname === '/upload/drive/v3/files' && m === 'PUT') { const id = u.searchParams.get('upload_id'); drive[id].data = rq.postDataBuffer(); delete drive[id].pending; return route.fulfill({ headers: H, json: { id } }); }
    mm = /^\/upload\/drive\/v3\/files\/(\w+)$/.exec(u.pathname);
    if (mm && m === 'PATCH') { drive[mm[1]].data = rq.postDataBuffer(); return route.fulfill({ headers: H, json: { id: mm[1] } }); }
    route.fulfill({ status: 400, headers: H, body: 'unhandled' });
  });
}
(async () => {
  const b = await chromium.launch();
  const A = await b.newContext({ viewport: { width: 1024, height: 1100 } }), B = await b.newContext({ viewport: { width: 400, height: 860 } });
  await setup(A); await setup(B);
  const pa = await A.newPage(), pb = await B.newPage(); const errs = [];
  for (const p of [pa, pb]) { p.on('pageerror', e => errs.push(String(e))); await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-theme', 'light'); }); await p.reload(); await p.waitForTimeout(1500); }
  const EA = c => pa.evaluate(c => window.__ev(c), c), EB = c => pb.evaluate(c => window.__ev(c), c);
  const syncWait = async (p) => { await p.waitForFunction(() => window.__ev && !window.__ev('sync.busy'), null, { timeout: 60000 }); await p.waitForTimeout(300); };
  // A: content
  await pa.click('#openPaste'); await pa.waitForTimeout(300); await pa.fill('#textTitle', 'บันทึก'); await pa.fill('#input', 'วันนี้ไปตลาดกับแม่ อร่อยมาก'); await pa.click('#addText'); await pa.waitForTimeout(800);
  console.log('A text', await EA('state.text'));
  await EA("(function(){ addCard(segAt(state.text.indexOf('ตลาด') + 1)); return 1; })()");
  await pa.click('.tabbar [data-tab="home"]'); await pa.setInputFiles('#pdffile', 'pdfin/B.pdf'); await pa.waitForTimeout(6000);
  await EA("localStorage.setItem('thai-tone-mode','1')");
  // A: link
  await pa.click('.tabbar [data-tab="settings"]'); await pa.evaluate(() => window.settingsOpen('data')); await pa.waitForTimeout(4500);
  console.log('A row visible', await pa.isVisible('#syncRow'), await pa.textContent('#syncState'));
  await pa.click('#syncBtns button:has-text("連結")'); await pa.waitForTimeout(500); await syncWait(pa);
  console.log('A after sync:', await pa.textContent('#syncState'), '|', await pa.textContent('#syncMsg'));
  console.log('drive files', Object.values(drive).map(f => f.name + ' ' + f.data.length).join(', '));
  // B: link
  await pb.click('.tabbar [data-tab="settings"]'); await pb.evaluate(() => window.settingsOpen('data')); await pb.waitForTimeout(4500);
  await pb.click('#syncBtns button:has-text("連結")'); await pb.waitForTimeout(800); await syncWait(pb);
  await pb.waitForTimeout(2500); // reload due to settings
  await syncWait(pb);
  console.log('B docs', await EB('JSON.stringify(lib.docs.map(function(d){return d.name+":"+d.type;}))'), 'cards', await EB('cards.map(function(c){return c.w;}).join(",")'), 'tone', await EB('toneMode'));
  const pdfId = await EB("lib.docs.filter(function(d){return d.type==='pdf';})[0].id");
  console.log('B has pdf bytes', await pb.evaluate(id => window.__ev(`idbGet(${JSON.stringify(id)}).then(function(x){return x ? x.byteLength : 0;})`), pdfId));
  // B edits: highlight in text doc, add card, then sync
  const tid = await EB("lib.docs.filter(function(d){return d.type==='text';})[0].id");
  await EB(`openDoc(${JSON.stringify(tid)})`); await pb.waitForTimeout(800);
  await EB("(function(){ snapshot(); addRangeColored([0,6], '#ffd400', 'full'); renderText(); save(); addCard(segAt(state.text.indexOf('อร่อย') + 1)); return 1; })()");
  await EB('runSync()'); await pb.waitForTimeout(300); await syncWait(pb);
  // A sync
  await EA('runSync()'); await pa.waitForTimeout(300); await syncWait(pa);
  console.log('A cards', await EA('cards.map(function(c){return c.w;}).join(",")'), 'A text doc hl', await pa.evaluate(id => JSON.parse(localStorage.getItem('thai-notes-doc:' + id)).hl.length, tid));
  // A deletes the pdf doc and a card; sync; B sync
  await EA(`deleteDoc(${JSON.stringify(pdfId)})`); await EA("removeCard(cards.filter(function(c){return c.w==='ตลาด';})[0].id)");
  await EA('runSync()'); await pa.waitForTimeout(300); await syncWait(pa);
  await EB('runSync()'); await pb.waitForTimeout(300); await syncWait(pb);
  console.log('B after delete: docs', await EB('lib.docs.length'), 'cards', await EB('cards.map(function(c){return c.w;}).join(",")'), 'drive', Object.values(drive).map(f => f.name.slice(0, 20)).join(', '));
  await pb.click('.tabbar [data-tab="settings"]'); await pb.screenshot({ path: 'tests/sync-b.png' });
  console.log('B msg', await pb.textContent('#syncState'), '|', await pb.textContent('#syncMsg'));
  console.log('ERRORS:', errs.join(' | ') || 'none'); await b.close();
})();
