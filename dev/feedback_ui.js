  /* ---------- 意見回饋：存到這個測試頁的資料庫，只有擁有者看得到全部 ---------- */
  var APP_VER = '測試頁 v26';
  /* Google 表單：每則回饋同時送一份過去，表單再連到試算表 */
  var GFORM = 'https://docs.google.com/forms/d/e/1FAIpQLSc8n5I7EjtxBvTbUM_Z6MkzIElceZYvuDK3Nc9RqWNV08J38w/';
  var GF_ENTRY = { cat: 'entry.26173553', text: 'entry.919369813', ctx: 'entry.94901169' };
  var gformStatus = '還沒送過';
  function catName(c) { return (FB_CATS.filter(function (x) { return x[0] === c; })[0] || [0, '其他'])[1]; }
  function ctxText(ctx) { return ctx ? ['版本 ' + ctx.ver, '文件 ' + ctx.doc, '程度 ' + ctx.level, '詞義 ' + ctx.gloss, '寬 ' + ctx.w, '裝置 ' + ctx.ua].join('｜') : '（未附）'; }
  function gformParams(item) {
    var q = new URLSearchParams();
    q.set(GF_ENTRY.cat, catName(item.cat));
    q.set(GF_ENTRY.text, item.text);
    q.set(GF_ENTRY.ctx, ctxText(item.ctx));
    return q;
  }
  function gformPrefillUrl(item) { var q = gformParams(item); q.set('usp', 'pp_url'); return GFORM + 'viewform?' + q.toString(); }
  /* 先用 fetch 送；被擋就改用隱藏表單送；都不行就回傳 false */
  function sendToGForm(item) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      try {
        fetch(GFORM + 'formResponse', { method: 'POST', mode: 'no-cors', body: gformParams(item) })
          .then(function () { finish('fetch'); }, function () { viaForm(); });
      } catch (err) { viaForm(); }
      function viaForm() {
        try {
          var name = 'gf' + Date.now(), ifr = document.createElement('iframe');
          ifr.name = name; ifr.hidden = true; ifr.title = '送出到 Google 表單';
          var f = document.createElement('form');
          f.method = 'POST'; f.action = GFORM + 'formResponse'; f.target = name; f.hidden = true;
          gformParams(item).forEach(function (v, k) { var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); });
          ifr.addEventListener('load', function () { finish('form'); setTimeout(function () { ifr.remove(); f.remove(); }, 1000); });
          document.body.appendChild(ifr); document.body.appendChild(f);
          f.submit();
          setTimeout(function () { finish(false); }, 6000);
        } catch (err) { finish(false); }
      }
    });
  }
  var FB_CATS = [['idea', '功能建議'], ['bug', '問題回報'], ['other', '其他']];
  var fbCat = 'idea', fbDb = null, fbUid = null, fbItems = [], fbLocal = [], fbMode = '連線中';
  try { fbLocal = JSON.parse(localStorage.getItem('thai-feedback-local') || '[]'); } catch (err) { fbLocal = []; }
  function fbTime(t) { var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function renderFeedback() {
    segButtons($('fbCat'), FB_CATS, fbCat, function (v) { fbCat = v; renderFeedback(); });
    var ul = $('fbList');
    ul.replaceChildren();
    var all = fbItems.concat(fbLocal.map(function (x) { x.local = true; return x; })).sort(function (a, b) { return b.t - a.t; }).slice(0, 10);
    all.forEach(function (x) {
      var li = document.createElement('li');
      var meta = document.createElement('div'); meta.className = 'fbmeta';
      meta.textContent = fbTime(x.t) + '・' + catName(x.cat) + (x.local ? '・只存在這台裝置' : '・已送出') + (x.form === 'blocked' ? '（表單未送）' : (x.form ? '・表單已送' : ''));
      var tx = document.createElement('div'); tx.className = 'fbtext'; tx.textContent = x.text;
      li.appendChild(meta); li.appendChild(tx);
      ul.appendChild(li);
    });
    $('fbListWrap').hidden = !all.length;
  }
  function fbContext() {
    return { ver: APP_VER, doc: state.src ? state.src.name : '貼上的文字', level: level, gloss: glossLang, ua: navigator.userAgent.slice(0, 160), w: window.innerWidth };
  }
  async function sendFeedback() {
    var text = $('fbText').value.trim();
    if (!text) { $('fbStatus').textContent = '請先寫下想說的內容。'; $('fbText').focus(); return; }
    var item = { t: Date.now(), cat: fbCat, text: text.slice(0, 4000), ctx: $('fbCtx').checked ? fbContext() : null };
    $('fbSend').disabled = true;
    $('fbStatus').textContent = '送出中…';
    $('fbManual').hidden = true;
    /* 在 Claude App 的測試頁裡，送到 Google 的連線一定會被擋，直接改用按鈕；正式版會自動送出 */
    var inClaude = !!(window.claude && typeof window.claude.use === 'function');
    var gf = inClaude ? false : await sendToGForm(item);
    gformStatus = gf === 'fetch' ? '成功（直接送出）' : (gf === 'form' ? '已送出（用隱藏表單，請到試算表確認）' : '被擋下來');
    item.form = gf || 'blocked';
    if (gf !== 'fetch') { $('fbManual').href = gformPrefillUrl(item); $('fbManual').hidden = false; }
    try {
      if (!fbDb || !fbUid) { throw { code: 'no_db' }; }
      await fbDb.collection('feedback/' + fbUid + '/items').add(item);
      try { await fbDb.doc('feedback/' + fbUid).set({ last: item.t }); } catch (e) {}
      $('fbText').value = '';
      $('fbStatus').textContent = gf === 'fetch' ? '謝謝！已送出，也已送到 Google 表單。' : gf === 'form' ? '謝謝！已送出。Google 表單那邊無法確認有沒有收到，請到試算表看一下；沒有的話按下面的按鈕補送。' : (inClaude ? '已存進 App 的回饋資料庫。測試版在 Claude App 裡不能自動送到 Google 表單，請按下面的按鈕打開表單（內容已填好），再按「提交」。正式版會自動送出。' : '謝謝！已存進 App 的回饋資料庫，但 Google 表單那邊被擋下來了。可以按下面的按鈕，打開表單（內容已填好）再按「提交」。');
    } catch (err) {
      fbLocal.unshift(item);
      try { localStorage.setItem('thai-feedback-local', JSON.stringify(fbLocal.slice(0, 50))); } catch (e) {}
      $('fbText').value = '';
      $('fbStatus').textContent = gf ? '已送到 Google 表單；App 的回饋資料庫暫時連不上，先存在這台裝置，下次打開會自動補送。' : '目前連不上回饋資料庫，已先存在這台裝置，下次打開會自動補送。也可以按下面的按鈕用 Google 表單送出。';
      renderFeedback();
    } finally { $('fbSend').disabled = false; renderReport(); }
  }
  async function flushLocalFeedback() {
    if (!fbDb || !fbUid || !fbLocal.length) { return; }
    var left = [];
    for (var i = 0; i < fbLocal.length; i++) {
      var x = Object.assign({}, fbLocal[i]); delete x.local;
      try { await fbDb.collection('feedback/' + fbUid + '/items').add(x); } catch (err) { left.push(fbLocal[i]); }
    }
    if (left.length < fbLocal.length) { try { await fbDb.doc('feedback/' + fbUid).set({ last: Date.now() }); } catch (e) {} }
    fbLocal = left;
    try { localStorage.setItem('thai-feedback-local', JSON.stringify(fbLocal)); } catch (e) {}
    renderFeedback();
  }
  async function initFeedback() {
    var timer = setTimeout(function () { if (fbMode === '連線中') { fbMode = '連不上（只存在裝置）'; renderReport(); } }, 10000);
    try {
      if (!window.claude || typeof window.claude.use !== 'function') { throw new Error('none'); }
      var db = await window.claude.use('db'), user = await window.claude.use('user');
      if (!db || !user) { throw new Error('none'); }
      var uid = await user.id();
      if (!uid) { throw new Error('none'); }
      fbDb = db; fbUid = uid; fbMode = '已連線';
      db.collection('feedback/' + uid + '/items').orderBy('t', 'desc').limit(10).onSnapshot(function (snap) {
        fbItems = snap.docs.map(function (d) { return d.data() || {}; });
        renderFeedback();
      }, function () { fbMode = '讀取失敗'; renderReport(); });
      flushLocalFeedback();
    } catch (err) { fbMode = '連不上（只存在裝置）'; }
    clearTimeout(timer);
    renderReport();
  }
  $('fbSend').addEventListener('click', sendFeedback);
  renderFeedback();
  initFeedback();
