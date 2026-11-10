  /* ---------- 雲端同步（Google 雲端硬碟）----------
     資料存在使用者自己的 Google 雲端硬碟裡「這個 App 專用的隱藏資料夾」（appDataFolder），
     不會出現在雲端硬碟的檔案清單，也看不到使用者其他的檔案。
     同步單位：每份文件（清單資訊＋筆記）、每張生字卡、每個設定，各自記「最後修改時間」，兩邊合併時新的贏；
     刪掉的東西會記一筆「刪除時間」，另一台同步時也會跟著刪。PDF 原檔各自存成一個檔案。 */
  var SYNC_CLIENT_ID = '';
  var SYNC_SCOPE = 'https://www.googleapis.com/auth/drive.appdata email';
  var SYNC_META = 'thai-sync-meta', SYNC_TOK = 'thai-sync-token', SYNC_ON = 'thai-sync-on';
  var SYNC_SET = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-theme', 'thai-tone-mode', 'thai-font', 'thai-tools', 'thai-my-names', 'thai-progress', 'thai-home-view', 'thai-my-words', 'thai-my-splits'];
  var SYNC_QUIET = ['thai-progress'];
  var DRV = 'https://www.googleapis.com/drive/v3/files', DRV_UP = 'https://www.googleapis.com/upload/drive/v3/files';
  var sync = { client: null, busy: false, again: false, timer: null, suspend: 0, status: '', err: '', last: 0, email: '' };
  function syncNow() { return Date.now(); }
  function syncLoadMeta() {
    var m = null; try { m = JSON.parse(localStorage.getItem(SYNC_META) || 'null'); } catch (err) {}
    m = m || {};
    ['d', 'c', 's'].forEach(function (k) { m[k] = m[k] || {}; });
    m.del = m.del || {}; m.del.d = m.del.d || {}; m.del.c = m.del.c || {};
    m.lf = m.lf || 0; m.cf = m.cf || 0;
    return m;
  }
  var syncMeta = syncLoadMeta();
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  function syncSaveMeta() { try { rawSet.call(localStorage, SYNC_META, JSON.stringify(syncMeta)); } catch (err) {} }
  function syncOn() { try { return localStorage.getItem(SYNC_ON) === '1'; } catch (err) { return false; } }
  function syncParse(v) { try { return JSON.parse(v); } catch (err) { return null; } }
  function syncDocKey(d) { var x = Object.assign({}, d); delete x.opened; return JSON.stringify(x); }
  /* 記錄每樣東西什麼時候改過：攔下寫進瀏覽器儲存的動作 */
  var syncPrevLib = syncParse(localStorage.getItem(LIB_KEY)) || { docs: [], folders: [] };
  var syncPrevCards = syncParse(localStorage.getItem(CARD_KEY)) || { cards: [], folders: [] };
  function syncTrack(k, v) {
    if (sync.suspend) { return; }
    var now = syncNow(), hit = false;
    if (k.indexOf(PDF_DOC_PREFIX) === 0) { syncMeta.d[k.slice(PDF_DOC_PREFIX.length)] = now; hit = true; }
    else if (k === LIB_KEY) {
      var nl = syncParse(v) || { docs: [], folders: [] }, old = {};
      (syncPrevLib.docs || []).forEach(function (d) { old[d.id] = syncDocKey(d); });
      (nl.docs || []).forEach(function (d) { if (old[d.id] !== syncDocKey(d)) { syncMeta.d[d.id] = now; hit = true; } delete old[d.id]; });
      Object.keys(old).forEach(function (id) { syncMeta.del.d[id] = now; hit = true; });
      if (JSON.stringify(nl.folders || []) !== JSON.stringify(syncPrevLib.folders || [])) { syncMeta.lf = now; hit = true; }
      syncPrevLib = nl;
    } else if (k === CARD_KEY) {
      var nc = syncParse(v) || { cards: [], folders: [] }, oc = {};
      (syncPrevCards.cards || []).forEach(function (c) { oc[c.id] = JSON.stringify(c); });
      (nc.cards || []).forEach(function (c) { if (oc[c.id] !== JSON.stringify(c)) { syncMeta.c[c.id] = now; hit = true; } delete oc[c.id]; });
      Object.keys(oc).forEach(function (id) { syncMeta.del.c[id] = now; hit = true; });
      if (JSON.stringify(nc.folders || []) !== JSON.stringify(syncPrevCards.folders || [])) { syncMeta.cf = now; hit = true; }
      syncPrevCards = nc;
    } else if (SYNC_SET.indexOf(k) >= 0) { syncMeta.s[k] = now; hit = true; }
    if (hit) { syncSaveMeta(); syncSoon(); }
  }
  Storage.prototype.setItem = function (k, v) {
    var mine = this === localStorage, old = null;
    if (mine) { try { old = this.getItem(k); } catch (err) {} }
    rawSet.call(this, k, v);
    /* 寫進去的內容跟原本一樣就不算修改 */
    if (mine && old !== String(v)) { try { syncTrack(String(k), String(v)); } catch (err) {} }
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === localStorage && SYNC_SET.indexOf(String(k)) >= 0 && !sync.suspend) { syncMeta.s[k] = syncNow(); syncSaveMeta(); }
  };
  /* 這台裝置目前的資料，整理成同步用的樣子 */
  function syncLocal() {
    var L = { v: 1, docs: {}, cards: {}, s: {}, lf: null, cf: null, del: JSON.parse(JSON.stringify(syncMeta.del)) };
    var lb = syncParse(localStorage.getItem(LIB_KEY)) || { docs: [], folders: [] };
    (lb.docs || []).forEach(function (d) {
      var st = null; try { st = localStorage.getItem(PDF_DOC_PREFIX + d.id); } catch (err) {}
      L.docs[d.id] = { t: syncMeta.d[d.id] || d.added || 1, meta: d, st: st };
    });
    L.lf = { t: syncMeta.lf || 1, v: lb.folders || [] };
    var cd = syncParse(localStorage.getItem(CARD_KEY)) || { cards: [], folders: [] };
    (cd.cards || []).forEach(function (c) { L.cards[c.id] = { t: syncMeta.c[c.id] || c.added || 1, c: c }; });
    L.cf = { t: syncMeta.cf || 1, v: cd.folders || [] };
    SYNC_SET.forEach(function (k) { var v = null; try { v = localStorage.getItem(k); } catch (err) {} if (v !== null || syncMeta.s[k]) { L.s[k] = { t: syncMeta.s[k] || 1, v: v }; } });
    return L;
  }
  /* 合併兩邊：每一樣東西新的贏；刪除時間比較新就刪掉 */
  function syncMerge(L, R) {
    R = R || { docs: {}, cards: {}, s: {}, del: { d: {}, c: {} } };
    var M = { v: 1, docs: {}, cards: {}, s: {}, del: { d: {}, c: {} } };
    ['d', 'c'].forEach(function (k) {
      var a = (L.del && L.del[k]) || {}, b = (R.del && R.del[k]) || {};
      Object.keys(a).concat(Object.keys(b)).forEach(function (id) { M.del[k][id] = Math.max(a[id] || 0, b[id] || 0); });
    });
    function pick(l, r) { if (!l) { return r; } if (!r) { return l; } return r.t > l.t ? r : l; }
    function each(name, dk) {
      var ids = {}; Object.keys(L[name] || {}).forEach(function (i) { ids[i] = 1; }); Object.keys(R[name] || {}).forEach(function (i) { ids[i] = 1; });
      Object.keys(ids).forEach(function (id) {
        var it = pick((L[name] || {})[id], (R[name] || {})[id]);
        if (it && !((M.del[dk][id] || 0) >= it.t)) { M[name][id] = it; }
      });
    }
    each('docs', 'd'); each('cards', 'c');
    var sk = {}; Object.keys(L.s || {}).forEach(function (k) { sk[k] = 1; }); Object.keys(R.s || {}).forEach(function (k) { sk[k] = 1; });
    Object.keys(sk).forEach(function (k) { M.s[k] = pick((L.s || {})[k], (R.s || {})[k]); });
    /* 每台新裝置都會自動放一份一樣的範例文件：內容和名稱完全一樣的文字文件只留一份（兩台選同一份：編號小的） */
    var byKey = {};
    Object.keys(M.docs).sort().forEach(function (id) {
      var d = M.docs[id]; if (!d.meta || d.meta.type !== 'text' || !d.st) { return; }
      var st = syncParse(d.st), key = d.meta.name + '\u0001' + (st && st.text);
      if (!st || (st.hl && st.hl.length) || (st.strokes && st.strokes.length) || (st.boxes && st.boxes.length)) { return; }
      if (byKey[key]) { M.del.d[id] = Math.max(M.del.d[id] || 0, d.t); delete M.docs[id]; } else { byKey[key] = id; }
    });
    M.lf = pick(L.lf, R.lf) || { t: 1, v: [] };
    M.cf = pick(L.cf, R.cf) || { t: 1, v: [] };
    return M;
  }
  function syncSame(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  /* 把合併結果寫回這台裝置；回傳改了哪些 */
  function syncApply(L, M) {
    var ch = { docs: [], cards: false, settings: false, lib: false };
    sync.suspend++;
    try {
      var lb = syncParse(localStorage.getItem(LIB_KEY)) || { docs: [], folders: [], cur: 'all' };
      var docs = [], seen = {};
      lb.docs.forEach(function (d) {
        var m = M.docs[d.id];
        if (!m) { ch.lib = true; ch.docs.push(d.id); rawRemove.call(localStorage, PDF_DOC_PREFIX + d.id); idbDel(d.id); idbDel('ocr:' + d.id); idbDel('thumb2:' + d.id); idbDel('vid:' + d.id); return; }
        seen[d.id] = 1;
        if (!syncSame(m, L.docs[d.id])) {
          ch.lib = true; ch.docs.push(d.id);
          if (m.st !== null && m.st !== undefined) { rawSet.call(localStorage, PDF_DOC_PREFIX + d.id, m.st); }
          docs.push(Object.assign({}, m.meta, { opened: d.opened || m.meta.opened || 0 }));
        } else { docs.push(d); }
      });
      Object.keys(M.docs).forEach(function (id) {
        if (seen[id]) { return; }
        var m = M.docs[id]; ch.lib = true; ch.docs.push(id);
        if (m.st !== null && m.st !== undefined) { rawSet.call(localStorage, PDF_DOC_PREFIX + id, m.st); }
        docs.push(Object.assign({}, m.meta));
      });
      docs.sort(function (a, b) { return (a.added || 0) - (b.added || 0); });
      if (!syncSame(M.lf.v, lb.folders || [])) { ch.lib = true; }
      if (ch.lib) {
        var nl = { docs: docs, folders: M.lf.v, cur: lb.cur || 'all' };
        if (nl.cur !== 'all' && nl.cur !== 'none' && !nl.folders.some(function (f) { return f.id === nl.cur; })) { nl.cur = 'all'; }
        rawSet.call(localStorage, LIB_KEY, JSON.stringify(nl)); syncPrevLib = nl;
      }
      var cd = syncParse(localStorage.getItem(CARD_KEY)) || { cards: [], folders: [], cur: 'all' };
      var mc = Object.keys(M.cards).map(function (id) { return M.cards[id].c; }).sort(function (a, b) { return (a.added || 0) - (b.added || 0); });
      var lcIds = Object.keys(L.cards).sort().join(','), same = lcIds === Object.keys(M.cards).sort().join(',') && Object.keys(M.cards).every(function (id) { return syncSame(M.cards[id], L.cards[id]); });
      if (!same || !syncSame(M.cf.v, cd.folders || [])) {
        ch.cards = true;
        var ncd = { cards: mc, folders: M.cf.v, cur: cd.cur || 'all' };
        rawSet.call(localStorage, CARD_KEY, JSON.stringify(ncd)); syncPrevCards = ncd;
      }
      Object.keys(M.s).forEach(function (k) {
        var m = M.s[k]; if (!m || syncSame(m, L.s[k])) { return; }
        if (SYNC_QUIET.indexOf(k) < 0 && (!L.s[k] || L.s[k].v !== m.v)) { ch.settings = true; }
        if (m.v === null) { rawRemove.call(localStorage, k); } else { rawSet.call(localStorage, k, m.v); }
      });
      /* 合併後的時間也記下來，下次比較才正確 */
      Object.keys(M.docs).forEach(function (id) { syncMeta.d[id] = M.docs[id].t; });
      Object.keys(M.cards).forEach(function (id) { syncMeta.c[id] = M.cards[id].t; });
      Object.keys(M.s).forEach(function (k) { if (M.s[k]) { syncMeta.s[k] = M.s[k].t; } });
      syncMeta.lf = M.lf.t; syncMeta.cf = M.cf.t; syncMeta.del = M.del;
      syncSaveMeta();
    } finally { sync.suspend--; }
    return ch;
  }
  /* 改完之後畫面跟著更新 */
  function syncRefresh(ch) {
    if (ch.settings) { sync.status = '已同步，套用另一台裝置的設定…'; renderSync(); setTimeout(function () { location.reload(); }, 600); return; }
    if (ch.lib) {
      var nl = syncParse(localStorage.getItem(LIB_KEY)); if (nl) { lib = Object.assign({ docs: [], folders: [], cur: 'all' }, nl); }
      renderHome();
      if (state.src && ch.docs.indexOf(state.src.id) >= 0) {
        if (docById(state.src.id)) { openDoc(state.src.id); }
        else { teardownPdf(); state = { text: '', src: null, hl: [], strokes: [], boxes: [], nextId: 1, style: state.style }; segs = []; history = []; redoStack = []; tapSel = null; save(); syncDocView(); }
      }
    }
    if (ch.cards) {
      var nc = syncParse(localStorage.getItem(CARD_KEY));
      if (nc) { cards = nc.cards || []; folders = nc.folders || []; }
      updateCardButton(); if (curTab === 'cards') { renderCards(); }
    }
  }

  /* ---------- 登入 Google（Google 官方的登入元件，只拿到「App 專用資料夾」和 email 的權限） ---------- */
  var gisLoading = null;
  function syncLoadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) { return Promise.resolve(); }
    if (gisLoading) { return gisLoading; }
    gisLoading = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () { res(); }; s.onerror = function () { gisLoading = null; rej(new Error('連不到 Google 登入服務（請確認有網路）')); };
      document.head.appendChild(s);
    });
    return gisLoading;
  }
  function syncToken() {
    var t = syncParse(localStorage.getItem(SYNC_TOK));
    return t && t.exp > syncNow() + 60000 ? t.tok : null;
  }
  function syncClient() {
    if (sync.client || !(window.google && google.accounts && google.accounts.oauth2)) { return sync.client; }
    sync.client = google.accounts.oauth2.initTokenClient({
      client_id: SYNC_CLIENT_ID, scope: SYNC_SCOPE, prompt: '',
      callback: function (r) {
        if (!r || r.error || !r.access_token) { sync.err = r && r.error === 'access_denied' ? '你取消了授權。' : '登入沒有成功' + (r && r.error ? '（' + r.error + '）' : '') + '。'; renderSync(); return; }
        if (google.accounts.oauth2.hasGrantedAllScopes && !google.accounts.oauth2.hasGrantedAllScopes(r, 'https://www.googleapis.com/auth/drive.appdata')) { sync.err = '需要勾選「查看及管理這個應用程式的設定資料」才能同步，請再按一次並勾選。'; renderSync(); return; }
        try { rawSet.call(localStorage, SYNC_TOK, JSON.stringify({ tok: r.access_token, exp: syncNow() + (Number(r.expires_in) || 3600) * 1000 })); rawSet.call(localStorage, SYNC_ON, '1'); } catch (err) {}
        sync.err = '';
        runSync();
      },
      error_callback: function (e) {
        /* 小視窗被擋：改用整頁登入 */
        if (e && e.type === 'popup_failed_to_open') { syncSignInRedirect(); return; }
        sync.err = e && e.type === 'popup_closed' ? '登入視窗關掉了，還沒連結。' : '登入視窗打不開' + (e && e.type ? '（' + e.type + '）' : '') + '。'; renderSync();
      }
    });
    return sync.client;
  }
  /* 按鈕按下去時呼叫（Safari 規定登入視窗一定要在點按的當下打開） */
  /* 加到主畫面的 App（iPad「加入主畫面」）裡，登入的小視窗常常回不來：改成整頁跳到 Google 登入，登入完再跳回 App */
  function syncStandalone() { try { return !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)); } catch (err) { return false; } }
  function syncRedirectUri() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
  function syncSignInRedirect() {
    var st = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { rawSet.call(localStorage, 'thai-sync-state', st); } catch (err) {}
    var q = { client_id: SYNC_CLIENT_ID, redirect_uri: syncRedirectUri(), response_type: 'token', scope: SYNC_SCOPE, include_granted_scopes: 'true', state: st };
    if (!syncOn()) { q.prompt = 'consent'; }
    location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
  }
  /* 從 Google 登入頁跳回來時，網址後面帶著登入結果 */
  function syncFromRedirect() {
    var h = location.hash || '';
    if (!/access_token=|error=/.test(h) || !/state=/.test(h)) { return false; }
    var p = {}; h.replace(/^#/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) { p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); } });
    var want = null; try { want = localStorage.getItem('thai-sync-state'); rawRemove.call(localStorage, 'thai-sync-state'); } catch (err) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch (err) { location.hash = ''; }
    if (!want || p.state !== want) { sync.err = '登入結果對不上（可能是舊的連結），請再按一次「連結 Google 帳號」。'; return true; }
    if (p.error || !p.access_token) { sync.err = p.error === 'access_denied' ? '你取消了授權。' : '登入沒有成功' + (p.error ? '（' + p.error + '）' : '') + '。'; return true; }
    if (p.scope && p.scope.indexOf('drive.appdata') < 0) { sync.err = '需要勾選「查看及管理這個應用程式的設定資料」才能同步，請再按一次並勾選。'; return true; }
    try { rawSet.call(localStorage, SYNC_TOK, JSON.stringify({ tok: p.access_token, exp: syncNow() + (Number(p.expires_in) || 3600) * 1000 })); rawSet.call(localStorage, SYNC_ON, '1'); } catch (err) {}
    sync.err = ''; sync.justLinked = true;
    return true;
  }
  function syncSignIn() {
    if (syncStandalone()) { syncSignInRedirect(); return; }
    var c = syncClient();
    if (!c) { sync.err = 'Google 登入服務還在載入，請再按一次。'; renderSync(); syncLoadGis().then(function () { syncClient(); }); return; }
    c.requestAccessToken({ prompt: syncOn() ? '' : 'consent' });
  }
  async function drv(url, opt, tok) {
    opt = opt || {}; opt.headers = Object.assign({ Authorization: 'Bearer ' + tok }, opt.headers || {});
    var r = await fetch(url, opt);
    if (r.status === 401) { try { rawRemove.call(localStorage, SYNC_TOK); } catch (err) {} var e = new Error('登入過期了'); e.auth = true; throw e; }
    if (!r.ok) { var tx = ''; try { tx = (await r.text()).slice(0, 160); } catch (err) {} throw new Error('Google 雲端硬碟回應錯誤 ' + r.status + (tx ? '：' + tx : '')); }
    return r;
  }
  async function drvList(tok) {
    var out = {}, pt = '';
    do {
      var r = await drv(DRV + '?spaces=appDataFolder&pageSize=1000&fields=nextPageToken,files(id,name,modifiedTime,size)' + (pt ? '&pageToken=' + encodeURIComponent(pt) : ''), {}, tok);
      var j = await r.json();
      (j.files || []).forEach(function (f) { out[f.name] = f; });
      pt = j.nextPageToken || '';
    } while (pt);
    return out;
  }
  /* 上傳：小檔一次送；大檔（PDF）用可續傳的方式 */
  async function drvPut(tok, name, blob, existing) {
    if (existing) { return drv(DRV_UP + '/' + existing.id + '?uploadType=media', { method: 'PATCH', body: blob, headers: { 'Content-Type': blob.type || 'application/octet-stream' } }, tok); }
    var meta = { name: name, parents: ['appDataFolder'] };
    if (blob.size < 4 * 1048576) {
      var fd = new FormData();
      fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
      fd.append('file', blob);
      return drv(DRV_UP + '?uploadType=multipart', { method: 'POST', body: fd }, tok);
    }
    var r = await drv(DRV_UP + '?uploadType=resumable', { method: 'POST', body: JSON.stringify(meta), headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': blob.type || 'application/octet-stream' } }, tok);
    var loc = r.headers.get('Location');
    if (!loc) { throw new Error('上傳大檔案時沒有拿到上傳位址'); }
    return drv(loc, { method: 'PUT', body: blob }, tok);
  }
  async function drvGet(tok, f, asJson) { var r = await drv(DRV + '/' + f.id + '?alt=media', {}, tok); return asJson ? r.json() : r.arrayBuffer(); }
  function syncFileName(kind, id) { return kind + ':' + id; }

  /* ---------- 同步一次 ---------- */
  async function runSync() {
    if (!SYNC_CLIENT_ID || !syncOn()) { return; }
    if (sync.busy) { sync.again = true; return; }
    var tok = syncToken();
    if (!tok) { sync.status = ''; renderSync(); return; }
    sync.busy = true; sync.err = ''; sync.status = '同步中…'; renderSync();
    try {
      if (state.src) { try { save(); } catch (err) {} }
      if (!sync.email) { try { var u = await (await drv('https://www.googleapis.com/oauth2/v3/userinfo', {}, tok)).json(); sync.email = u.email || ''; rawSet.call(localStorage, 'thai-sync-email', sync.email); } catch (err) { if (err.auth) { throw err; } } }
      var files = await drvList(tok);
      var R = files['state.json'] ? await drvGet(tok, files['state.json'], true) : null;
      var L = syncLocal(), M = syncMerge(L, R);
      var ch = syncApply(L, M);
      if (!R || !syncSame(M, R)) {
        sync.status = '上傳變更…'; renderSync();
        M.at = new Date().toISOString();
        await drvPut(tok, 'state.json', new Blob([JSON.stringify(M)], { type: 'application/json' }), files['state.json']);
      }
      /* PDF 原檔、文字辨識結果：雲端沒有的上傳，這台沒有的下載，刪掉的文件把雲端的檔也刪掉 */
      var ids = Object.keys(M.docs).filter(function (id) { return M.docs[id].meta && M.docs[id].meta.type === 'pdf'; }), up = 0, down = 0, miss = 0;
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i], fn = syncFileName('pdf', id), on = null;
        try { on = await idbGet(id); } catch (err) {}
        if (on && !files[fn]) {
          sync.status = '上傳 PDF（' + (i + 1) + '／' + ids.length + '）…'; renderSync();
          await drvPut(tok, fn, new Blob([on], { type: 'application/pdf' })); up++;
        } else if (!on && files[fn]) {
          sync.status = '下載 PDF（' + (i + 1) + '／' + ids.length + '）…'; renderSync();
          var bytes = await drvGet(tok, files[fn], false); await idbPut(id, bytes); down++;
        } else if (!on) { miss++; }
        var on2 = null; try { on2 = await idbGet('ocr:' + id); } catch (err) {}
        var fo = syncFileName('ocr', id);
        if (on2 && on2.pages && !files[fo]) { await drvPut(tok, fo, new Blob([JSON.stringify(on2)], { type: 'application/json' })); }
        else if (!(on2 && on2.pages) && files[fo]) { try { await idbPut('ocr:' + id, await drvGet(tok, files[fo], true)); } catch (err) {} }
      }
      var dels = Object.keys(M.del.d);
      for (var j = 0; j < dels.length; j++) {
        if (M.docs[dels[j]]) { continue; }
        var f1 = files[syncFileName('pdf', dels[j])], f2 = files[syncFileName('ocr', dels[j])];
        if (f1) { try { await drv(DRV + '/' + f1.id, { method: 'DELETE' }, tok); } catch (err) {} }
        if (f2) { try { await drv(DRV + '/' + f2.id, { method: 'DELETE' }, tok); } catch (err) {} }
      }
      sync.last = syncNow(); rawSet.call(localStorage, 'thai-sync-last', String(sync.last));
      sync.status = '';
      sync.lastNote = (down ? '下載了 ' + down + ' 個 PDF。' : '') + (up ? '上傳了 ' + up + ' 個 PDF。' : '') + (miss ? miss + ' 份 PDF 只存在另一台裝置、還沒上傳，等那台同步後會自動下載。' : '');
      syncRefresh(ch);
      if (down && curTab === 'home') { renderHome(); }
    } catch (err) {
      sync.status = '';
      sync.err = err && err.auth ? '登入過期了，按「立即同步」重新登入就好。' : '同步失敗：' + String(err && err.message || err).slice(0, 200);
    } finally {
      sync.busy = false; renderSync();
      if (sync.again) { sync.again = false; setTimeout(runSync, 1000); }
    }
  }
  function syncSoon() {
    if (!SYNC_CLIENT_ID || !syncOn() || !syncToken()) { return; }
    clearTimeout(sync.timer);
    sync.timer = setTimeout(runSync, 15000);
  }
  function syncAgo(t) {
    if (!t) { return '還沒同步過'; }
    var s = Math.round((syncNow() - t) / 1000);
    return s < 60 ? '剛剛' : s < 3600 ? Math.round(s / 60) + ' 分鐘前' : s < 86400 ? Math.round(s / 3600) + ' 小時前' : new Date(t).toLocaleDateString('zh-TW');
  }
  function renderSync() {
    var row = $('syncRow'); if (!row) { return; }
    row.hidden = !SYNC_CLIENT_ID;
    if (!SYNC_CLIENT_ID) { return; }
    var on = syncOn(), tok = syncToken(), st = $('syncState'), btns = $('syncBtns');
    try { sync.last = sync.last || Number(localStorage.getItem('thai-sync-last') || 0); sync.email = sync.email || localStorage.getItem('thai-sync-email') || ''; } catch (err) {}
    st.textContent = !on ? '還沒連結。' : (sync.status || ('已連結' + (sync.email ? ' ' + sync.email : '') + '・上次同步：' + syncAgo(sync.last) + (tok ? '' : '。要再同步時按「立即同步」（Google 的登入每小時要確認一次）')));
    btns.replaceChildren();
    function btn(t, cls, fn) { var b = document.createElement('button'); b.type = 'button'; if (cls) { b.className = cls; } b.textContent = t; b.disabled = sync.busy; b.addEventListener('click', fn); btns.appendChild(b); }
    if (!on) { btn('連結 Google 帳號', 'primary', function () { syncSignIn(); }); }
    else {
      btn('立即同步', 'primary', function () { if (syncToken()) { runSync(); } else { syncSignIn(); } });
      btn('取消連結', '', function () {
        var t = syncParse(localStorage.getItem(SYNC_TOK));
        try { rawRemove.call(localStorage, SYNC_ON); rawRemove.call(localStorage, SYNC_TOK); rawRemove.call(localStorage, 'thai-sync-email'); } catch (err) {}
        if (window.google && google.accounts && google.accounts.oauth2 && t && t.tok) { try { google.accounts.oauth2.revoke(t.tok, function () {}); } catch (err) {} }
        sync.email = ''; sync.err = ''; sync.lastNote = '已取消連結。這台裝置上的資料都還在；雲端上的資料也會保留，之後再連結會自動合併。'; renderSync();
      });
    }
    $('syncMsg').textContent = sync.err || sync.lastNote || '';
    $('syncMsg').className = 'label' + (sync.err ? ' syncerr' : '');
  }
  if (SYNC_CLIENT_ID) {
    var fromGoogle = syncFromRedirect();
    renderSync();
    if (fromGoogle) { showTab('settings'); if (typeof settingsOpen === 'function') { settingsOpen('data'); } if (sync.justLinked) { setTimeout(runSync, 300); } }
    /* 預先載入 Google 登入元件，按按鈕時才能馬上打開登入視窗 */
    var syncPre = function () { syncLoadGis().then(function () { syncClient(); renderSync(); }, function () {}); };
    if (syncOn()) { syncPre(); setTimeout(runSync, 2500); } else { setTimeout(syncPre, 4000); }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && syncOn() && syncToken() && syncNow() - sync.last > 60000) { runSync(); } });
  }
