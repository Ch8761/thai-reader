  /* ---- 1.39：帶 ์（不發音符號）的字母一定跟前面的字一起看，不單獨成詞 ---- */
  function thaiTok(x) { return x && x.w && /^[ก-๎]+$/.test(x.t); }
  function karanFix(out) {
    var res = [], changed = false;
    for (var i = 0; i < out.length; i++) {
      var x = { i: out[i].i, n: out[i].n, w: out[i].w, t: out[i].t }, prev = res[res.length - 1];
      if (out[i].gz) { x.gz = out[i].gz; }
      var adj = thaiTok(prev) && thaiTok(x) && prev.i + prev.n === x.i;
      /* 開頭是「子音(+ิ/ุ)+์」：這幾個字屬於前一個詞的尾巴 */
      var m = adj ? /^([ก-ฮ]{1,2}[ิุ]?์)/.exec(x.t) : null;
      if (m) {
        prev.t += m[1]; prev.n += m[1].length; delete prev.gz; changed = true;
        if (m[1].length === x.t.length) { continue; }
        x.t = x.t.slice(m[1].length); x.i += m[1].length; x.n = x.t.length; delete x.gz;
      }
      /* 開頭是母音符號、聲調符號（不能當一個字的開頭）：併到前一個詞 */
      if (adj && /^[ะ-ฺ็-๎ัา]/.test(x.t)) { prev.t += x.t; prev.n += x.n; delete prev.gz; changed = true; continue; }
      /* 單獨一個子音：後面接 ร/ล/ว 開頭的字就跟後面拼（ก|ริลล์ → กริลล์）；
         否則前一個詞以 ์ 結尾、或這個子音字典沒有（例如 นอ|ล），就併到前一個詞 */
      if (adj && /^[ก-ฮ]$/.test(x.t) && !x.gz) {
        var nx = out[i + 1];
        if (thaiTok(nx) && nx.i === x.i + 1 && /^[รลว]./.test(nx.t) && (!known(nx.t) || /์/.test(nx.t)) && /[กขคปผพฟตทบดส]/.test(x.t)) { res.push(x); continue; }
        if (/์$/.test(prev.t) || !known(x.t)) { prev.t += x.t; prev.n += x.n; delete prev.gz; changed = true; continue; }
      }
      res.push(x);
    }
    /* 單獨一個前置母音（เ แ โ ใ ไ）、或單獨一個要跟後面拼的子音：跟後面的字一起 */
    for (var k = res.length - 2; k >= 0; k--) {
      var a = res[k], b = res[k + 1];
      if (!(thaiTok(a) && thaiTok(b) && a.i + a.n === b.i)) { continue; }
      if (/^[เ-ไ]$/.test(a.t) || (/^[ก-ฮ]$/.test(a.t) && !a.gz && /^[รลว]./.test(b.t) && (!known(b.t) || /์/.test(b.t)))) { a.t += b.t; a.n += b.n; delete a.gz; res.splice(k + 1, 1); changed = true; }
    }
    return { out: res, changed: changed };
  }
  var _repairSeg47 = repairSeg;
  repairSeg = function (out) {
    /* 「ๆ」（重複前一個詞）先拆開，不然 เรียบๆ 這種會被當成不認識的字切碎 */
    var pre = [];
    out.forEach(function (x) {
      if (x.w && x.t.length > 1 && /^[ก-๎]+ๆ$/.test(x.t)) {
        var w = { i: x.i, n: x.n - 1, w: true, t: x.t.slice(0, -1) }; if (x.gz) { w.gz = x.gz; }
        pre.push(w, { i: x.i + x.n - 1, n: 1, w: false, t: 'ๆ' });
      } else { pre.push(x); }
    });
    /* 先把 ์ 的尾巴接好；帶 ์ 的詞（多半是外來語）不給後面的修補拆開 */
    var f0 = karanFix(pre), pre2 = f0.out;
    pre2.forEach(function (x) { if (!x.gz && /์/.test(x.t)) { x.gz = 'karan'; } });
    var r = _repairSeg47(pre2);
    r.forEach(function (x) { if (x.gz === 'karan') { delete x.gz; } });
    var f = karanFix(r);
    if (!f.changed && !f0.changed) { return r; }
    /* 修好以後再試一次：拼起來是字典裡的詞就合併（例如 โซเชียล|มีเดีย） */
    var f2 = karanFix(dictMerge(f.out));
    return f2.out;
  };

  /* ---- 1.39：匿名使用統計（Umami）。只送「用了哪個功能」，不送文件內容、標題、查的字或帳號 ---- */
  var STATS_KEY = 'thai-stats-off';
  function statsOn() { try { return localStorage.getItem(STATS_KEY) !== '1'; } catch (err) { return false; } }
  var statsQ = [];
  function statsFlush() { if (!(window.umami && window.umami.track)) { return; } var q = statsQ; statsQ = []; q.forEach(function (f) { try { f(); } catch (err) {} }); }
  window.__umamiReady = statsFlush;
  var statLastView = '';
  function stat(name, data) {
    if (!statsOn() || !window.__statsSite) { return; }
    if (name === 'view') { if (data === statLastView) { return; } statLastView = data; }
    var f = function () {
      if (name === 'view') {
        /* 分頁當成「頁面」：網址只送 /home、/doc 這種，不送網址後面的參數 */
        window.umami.track(function (p) { return { website: p.website, hostname: p.hostname, screen: p.screen, language: p.language, referrer: p.referrer, title: 'ไทย Reader', url: '/' + data }; });
      } else if (data) { window.umami.track(name, data); } else { window.umami.track(name); }
    };
    if (window.umami && window.umami.track) { try { f(); } catch (err) {} } else if (statsQ.length < 30) { statsQ.push(f); }
  }
  setTimeout(function () {
    var lv = 'b'; try { lv = localStorage.getItem('thai-level') || 'b'; } catch (err) {}
    stat('view', curTab || 'home');
    stat('open', { level: lv, lang: UI_LANG, mode: syncStandalone() ? 'app' : 'browser', docs: (function (n) { return n === 0 ? '0' : n <= 5 ? '1-5' : n <= 20 ? '6-20' : '20+'; })((lib && lib.docs ? lib.docs.length : 0)) });
    var tries = 0, iv = setInterval(function () { tries++; if (window.umami && window.umami.track) { statsFlush(); clearInterval(iv); } else if (tries > 30) { clearInterval(iv); } }, 1000);
  }, 800);
  var _showTab47 = showTab;
  showTab = function (t) { _showTab47(t); stat('view', curTab); };
  var _libAddPdf47 = libAddPdfFiles; libAddPdfFiles = function (fs) { if (fs && fs.length) { stat('import', { kind: 'pdf' }); } return _libAddPdf47.apply(this, arguments); };
  var _libAddImg47 = libAddImages; libAddImages = function (fs) { if (fs && fs.length) { stat('import', { kind: 'image' }); } return _libAddImg47.apply(this, arguments); };
  var _libAddVid47 = libAddVideo; libAddVideo = function () { stat('import', { kind: 'video' }); return _libAddVid47.apply(this, arguments); };
  var _libAddUrl47 = libAddUrl; libAddUrl = function (raw) { var h = ''; try { h = new URL(String(raw).trim()).hostname.replace(/^www\./, ''); } catch (err) {} stat('import', { kind: 'url', site: h }); return _libAddUrl47.apply(this, arguments); };
  var _libAddText47 = libAddText; libAddText = function () { var t = ($('input') && $('input').value) || ''; if (t.trim() && !urlLooksLike(t)) { stat('import', { kind: 'text' }); } return _libAddText47.apply(this, arguments); };
  var _rdOpenItem47 = rdOpenItem; rdOpenItem = function (it) { if (it && it.id) { stat('reader', { id: String(it.id), level: String(it.id).charAt(0) }); } return _rdOpenItem47.apply(this, arguments); };
  var _startQuiz47 = startQuiz; startQuiz = function () { stat('quiz'); return _startQuiz47.apply(this, arguments); };
  var _abcStart47 = abcStart; abcStart = function () { stat('abc', { type: String((typeof abc !== 'undefined' && abc.type) || '') }); return _abcStart47.apply(this, arguments); };
  /* 查詞次數：一次打開 App 只送一個總數（離開 App 時） */
  var statLook = 0;
  var _showPop47 = showPop; showPop = function (seg) { statLook++; return _showPop47.apply(this, arguments); };
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden' || !statLook) { return; }
    var n = statLook; statLook = 0;
    stat('lookups', { n: n, bucket: n <= 5 ? '1-5' : n <= 20 ? '6-20' : n <= 50 ? '21-50' : '50+' });
  });
  (function () {
    var g = $('statsGroup'); if (!g) { return; }
    function draw() {
      segButtons(g, [['1', L2('傳送', 'Send')], ['0', L2('不傳送', 'Don’t send')]], statsOn() ? '1' : '0', function (v) {
        try {
          if (v === '0') { localStorage.setItem(STATS_KEY, '1'); localStorage.setItem('umami.disabled', '1'); }
          else { localStorage.removeItem(STATS_KEY); localStorage.removeItem('umami.disabled'); if (window.__loadStats) { window.__loadStats(); } }
        } catch (err) {}
        draw();
      });
    }
    draw();
  })();

  /* ---- 1.39：斷詞不對時，兩下就改好：點「斷詞不對？」→ 點建議 ---- */
  function segQuickMerge(w) {
    myWords = myWords.filter(function (x) { return x.t !== w; }); myWords.push({ t: w, at: Date.now() });
    mySplits = mySplits.filter(function (x) { return x.t !== w; });
    saveMySeg(); hidePop(); segChanged();
    $('info').textContent = L2('已把「' + w + '」存成一個詞，所有文件都會這樣斷。點這個詞 →「斷詞不對？」可以改回來。', 'Saved “' + w + '” as one word in all documents. Tap it → “Split wrong?” to undo.');
  }
  function segQuickSplit(w, parts) {
    mySplits = mySplits.filter(function (x) { return x.t !== w; }); mySplits.push({ t: w, parts: parts, at: Date.now() });
    myWords = myWords.filter(function (x) { return x.t !== w; });
    saveMySeg(); hidePop(); segChanged();
    $('info').textContent = L2('已把「' + w + '」拆成「' + parts.join('｜') + '」，所有文件都會這樣斷。點其中一個詞 →「斷詞不對？」可以改回來。', 'Split “' + w + '” into “' + parts.join(' | ') + '” in all documents. Tap a part → “Split wrong?” to undo.');
  }
  function segSuggest(seg) {
    var t = state.text || '', out = [];
    function nb(s) { return s && s.w && /^[ก-๎]+$/.test(s.t); }
    var p = segAt(seg.i - 1), n = segAt(seg.i + seg.n);
    if (nb(p) && p.i + p.n === seg.i) { var wp = p.t + seg.t; out.push({ k: 'prev', label: L2('跟前面合起來', 'Join with previous'), show: wp, run: function () { segQuickMerge(wp); } }); }
    if (nb(n) && seg.i + seg.n === n.i) { var wn = seg.t + n.t; out.push({ k: 'next', label: L2('跟後面合起來', 'Join with next'), show: wn, run: function () { segQuickMerge(wn); } }); }
    if (seg.t.length >= 4 && /^[ก-๎]+$/.test(seg.t)) {
      /* 拆成最少幾個字典裡有的詞（不算整個詞本身）；一樣多段時，選最短那段比較長的 */
      var w = seg.t, cps = [0].concat(cutPoints(w), [w.length]), best = null;
      (function go(at, acc) {
        if (acc.length > 4) { return; }
        if (at === w.length) {
          if (acc.length < 2) { return; }
          var sc = acc.length * 100 - Math.min.apply(null, acc.map(function (x) { return x.length; }));
          if (!best || sc < best.sc) { best = { sc: sc, parts: acc.slice() }; }
          return;
        }
        cps.forEach(function (k) {
          if (k <= at) { return; }
          var part = w.slice(at, k);
          if (part.length < 2 || part === w || !known(part)) { return; }
          acc.push(part); go(k, acc); acc.pop();
        });
      })(0, []);
      if (best) { var parts = best.parts; out.push({ k: 'split', label: L2('拆開', 'Split'), show: parts.join('｜'), run: function () { segQuickSplit(w, parts); } }); }
    }
    return out;
  }
  var _buildSegEditor47 = buildSegEditor;
  buildSegEditor = function (seg) {
    var box = _buildSegEditor47(seg), sug = segSuggest(seg);
    if (!sug.length) { return box; }
    var q = document.createElement('div'); q.className = 'segquick';
    q.appendChild(Object.assign(document.createElement('div'), { className: 'sl2', textContent: L2('點一下就改好：', 'One tap to fix:') }));
    sug.forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'segq segq-' + s.k;
      var a = document.createElement('span'); a.className = 'segql'; a.textContent = s.label;
      var c = document.createElement('span'); c.className = 'segqw'; c.lang = 'th'; c.textContent = s.show;
      b.appendChild(a); b.appendChild(c); b.addEventListener('click', s.run); q.appendChild(b);
    });
    q.appendChild(Object.assign(document.createElement('div'), { className: 'sl2 segqmore', textContent: L2('都不對？用下面的方法自己調。', 'None right? Adjust it yourself below.') }));
    var title = box.querySelector('.segtitle');
    box.insertBefore(q, title ? title.nextSibling : box.firstChild);
    return box;
  };

  /* ---- 1.39：沉浸式閱讀：往下讀時收起工具列和下面的分頁列，往上捲一點就回來 ---- */
  var IMM_KEY = 'thai-immersive';
  function immOn() { try { return localStorage.getItem(IMM_KEY) !== '0'; } catch (err) { return true; } }
  var immLastY = 0, immAcc = 0;
  function immSet(on) { document.body.classList.toggle('immersive', !!on); }
  window.addEventListener('scroll', function () {
    var y = window.scrollY || 0, d = y - immLastY; immLastY = y;
    if (curTab !== 'doc' || !immOn() || ($('pop') && !$('pop').hidden)) { if (curTab !== 'doc' || !immOn()) { immSet(false); } immAcc = 0; return; }
    var th = $('toolhead'), wb = th && th.parentNode, top = wb ? wb.getBoundingClientRect().top + y : 300;
    var docH = document.documentElement.scrollHeight;
    if (y < top + 60 || y + window.innerHeight >= docH - 8) { immAcc = 0; immSet(false); return; }
    if ((d > 0) !== (immAcc > 0)) { immAcc = 0; }
    immAcc += d;
    if (immAcc > 30) { immSet(true); } else if (immAcc < -30) { immSet(false); }
  }, { passive: true });
  var _showTab47b = showTab;
  showTab = function (t) { immSet(false); return _showTab47b.apply(this, arguments); };
  (function () {
    var g = $('immGroup'); if (!g) { return; }
    function draw() { segButtons(g, [['1', L2('自動收起', 'Auto-hide')], ['0', L2('一直顯示', 'Always show')]], immOn() ? '1' : '0', function (v) { try { if (v === '0') { localStorage.setItem(IMM_KEY, '0'); } else { localStorage.removeItem(IMM_KEY); } } catch (err) {} immSet(false); draw(); }); }
    draw();
  })();

  /* ---- 1.39：第一次打開時，在背景先把例句、聲調表、讀物庫存起來（離線也能用）；文字辨識工具較大，先問 ---- */
  function preWhenControlled(fn) {
    if (!('serviceWorker' in navigator)) { return; }
    var tries = 0;
    (function wait() { if (navigator.serviceWorker.controller) { fn(); return; } if (++tries < 40) { setTimeout(wait, 1500); } })();
  }
  function preFetch(urls) { return Promise.all(urls.map(function (u) { return fetch(u).then(function (r) { if (!r.ok) { throw new Error(u + ' ' + r.status); } return r.blob(); }); })); }
  setTimeout(function () {
    if (!navigator.onLine || (navigator.connection && navigator.connection.saveData)) { return; }
    preWhenControlled(function () { preFetch([EX_URL, TONE_URL, READER_URL]).catch(function () {}); });
  }, 5000);
  var OCR_PRE_KEY = 'thai-ocr-pre';
  function ocrPreUrls() {
    var simd = false;
    try { simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (err) {}
    var b = OCR_BASE, o = b + OT_DIR;
    return [o + 'thaiocr.js', o + 'ort.min.js', o + 'ort-wasm-simd-threaded.mjs', o + 'ort-wasm-simd-threaded.wasm', o + 'det.onnx', o + 'rec.onnx', o + 'rec_dict.txt',
      b + 'tesseract.min.js', b + 'worker.min.js', b + 'core/tesseract-core-' + (simd ? 'simd-' : '') + 'lstm.wasm.js', b + 'lang2/tha.traineddata.gz'];
  }
  function ocrPreState() { try { return localStorage.getItem(OCR_PRE_KEY) || ''; } catch (err) { return ''; } }
  function ocrPreStart(onDone) {
    try { localStorage.setItem(OCR_PRE_KEY, 'busy'); } catch (err) {}
    ocrPreDraw();
    preWhenControlled(function () {
      preFetch(ocrPreUrls()).then(function () { try { localStorage.setItem(OCR_PRE_KEY, 'done'); } catch (err) {} ocrPreDraw(); if (onDone) { onDone(true); } })
        .catch(function () { try { localStorage.setItem(OCR_PRE_KEY, 'fail'); } catch (err) {} ocrPreDraw(); if (onDone) { onDone(false); } });
    });
  }
  function ocrPreDraw() {
    var st = ocrPreState(), btn = $('ocrPreBtn'), msg = $('ocrPreMsg');
    if (btn) { btn.hidden = st === 'done' || st === 'busy'; btn.textContent = st === 'fail' ? L2('再試一次', 'Try again') : L2('現在下載（約 21 MB）', 'Download now (about 21 MB)'); }
    if (msg) { msg.textContent = st === 'done' ? L2('已下載，沒有網路也能辨識。', 'Downloaded — works offline.') : st === 'busy' ? L2('下載中…可以繼續用 App。', 'Downloading… you can keep using the app.') : st === 'fail' ? L2('下載沒有完成（可能是網路斷了）。', 'The download did not finish (the connection may have dropped).') : L2('還沒下載：第一次辨識照片或影片時會自動下載。', 'Not downloaded yet: it downloads the first time you recognise a photo or video.'); }
    var ask = $('ocrAsk'); if (ask && st && st !== 'ask') { ask.hidden = true; }
  }
  if ($('ocrPreBtn')) { $('ocrPreBtn').addEventListener('click', function () { ocrPreStart(); }); }
  /* 上次下載到一半就關掉 App：重新開始 */
  if (ocrPreState() === 'busy') { setTimeout(function () { if (navigator.onLine) { ocrPreStart(); } }, 6000); }
  ocrPreDraw();
  (function () {
    /* 主頁上問一次（看過歡迎畫面、而且有加過文件之後才問，不打擾第一次打開的人） */
    var ask = $('ocrAsk'); if (!ask) { return; }
    function maybe() {
      var seen = false; try { seen = !!localStorage.getItem('thai-welcome-v1'); } catch (err) {}
      ask.hidden = !(seen && !ocrPreState() && 'serviceWorker' in navigator && lib && lib.docs && lib.docs.length > 0);
    }
    $('ocrAskYes').addEventListener('click', function () { ask.hidden = true; ocrPreStart(); });
    $('ocrAskNo').addEventListener('click', function () { ask.hidden = true; try { localStorage.setItem(OCR_PRE_KEY, 'no'); } catch (err) {} ocrPreDraw(); });
    var _renderHome47 = renderHome;
    renderHome = function () { var r = _renderHome47.apply(this, arguments); maybe(); return r; };
    maybe();
  })();
