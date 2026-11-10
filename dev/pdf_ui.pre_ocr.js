  /* ---------- PDF：開檔、修字型、文字層、分頁顯示 ---------- */
  var THAI_STACK = 'Thonburi, "Sukhumvit Set", "Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif';
  var PDF_GAP = 18, PDF_DOC_PREFIX = 'thai-notes-doc:';
  var pdf = null, pdfIO = null, renderBusy = false, libsReady = null, workerMode = '尚未載入', baseRatio = 0;
  var pdfInfo = { status: '目前顯示：範例或貼上的文字', lastError: '' };
  function setDocStatus(t) { $('docstatus').textContent = t; pdfInfo.status = t; }
  function injectScript(id) {
    var src = $(id);
    if (!src) { throw new Error('缺少 ' + id); }
    var s = document.createElement('script');
    s.textContent = src.textContent;
    document.head.appendChild(s);
  }
  function ensureLibs() {
    if (libsReady) { return libsReady; }
    libsReady = new Promise(function (resolve, reject) {
      try {
        if (!window.PDFLib) { injectScript('lib-pdflib'); }
        if (!window.ThaiPdfFix) { injectScript('lib-pdffix'); }
        if (!window.pdfjsLib) { injectScript('lib-pdfjs'); }
        if (!window.pdfjsLib || !window.PDFLib || !window.ThaiPdfFix) { throw new Error('PDF 工具沒有載入成功'); }
      } catch (err) { libsReady = null; reject(err); return; }
      var url = null, done = false, w = null;
      try { url = URL.createObjectURL(new Blob([$('lib-pdfworker').textContent], { type: 'text/javascript' })); } catch (err) { url = null; }
      function mainThread(why) {
        try { injectScript('lib-pdfworker'); workerMode = '主執行緒（' + why + '，比較慢但能用）'; }
        catch (err) { workerMode = '失敗（' + String(err && err.message || err).slice(0, 40) + '）'; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = url || 'about:blank';
        resolve();
      }
      if (!url) { mainThread('無法建立背景程式'); return; }
      try {
        w = new Worker(url);
        w.onmessage = function () { if (done) { return; } done = true; try { w.terminate(); } catch (e) {} window.pdfjsLib.GlobalWorkerOptions.workerSrc = url; workerMode = '背景執行緒'; resolve(); };
        w.onerror = function () { if (done) { return; } done = true; mainThread('背景程式被擋'); };
        setTimeout(function () { if (done) { return; } done = true; try { w.terminate(); } catch (e) {} mainThread('背景程式沒回應'); }, 5000);
      } catch (err) { done = true; mainThread('背景程式被擋'); }
    });
    return libsReady;
  }
  /* IndexedDB：瀏覽器裡的大容量倉庫，用來放 PDF 原檔 */
  function idb() {
    return new Promise(function (res, rej) {
      try {
        var r = indexedDB.open('thai-notes-files', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('files'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      } catch (err) { rej(err); }
    });
  }
  function idbPutOnly(k, v) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction('files', 'readwrite'), st = tx.objectStore('files');
        st.clear(); st.put(v, k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function idbGet(k) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var rq = db.transaction('files', 'readonly').objectStore('files').get(k);
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { rej(rq.error); };
      });
    });
  }
  function measureBaseline() {
    try {
      var s = document.createElement('span'), b = document.createElement('span');
      s.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;font-size:100px;line-height:1;white-space:pre;font-family:' + THAI_STACK;
      s.textContent = 'ก';
      b.style.cssText = 'display:inline-block;width:1px;height:0;vertical-align:baseline';
      s.appendChild(b);
      document.body.appendChild(s);
      var r = (b.getBoundingClientRect().top - s.getBoundingClientRect().top) / 100;
      s.remove();
      return r > 0.3 && r < 1.5 ? r : 0.86;
    } catch (err) { return 0.86; }
  }
  /* 斷詞把 PDF 多出來的假空白（例如 จี น）合回去：只在字典確認合起來是一個詞時才合 */
  var COMB = /[ัิ-ฺ็-๎]/, THC = /[ก-๎]/;
  function joinFakeSpaces(s) {
    if (!DICT || typeof Intl === 'undefined' || !Intl.Segmenter) { return s; }
    var seg = new Intl.Segmenter('th', { granularity: 'word' });
    for (var i = 1; i < s.length - 1; i++) {
      if (s[i] !== ' ' || !COMB.test(s[i - 1]) || !THC.test(s[i + 1])) { continue; }
      var a = i, b = i + 1;
      while (a > 0 && THC.test(s[a - 1]) && i - a < 12) { a--; }
      while (b < s.length && THC.test(s[b]) && b - i < 13) { b++; }
      var L = s.slice(a, i), R = s.slice(i + 1, b), J = L + R, cut = L.length, ok = false;
      Array.from(seg.segment(J)).forEach(function (x) {
        if (x.index < cut && x.index + x.segment.length > cut && x.segment.length >= 2 && DICT[x.segment]) { ok = true; }
      });
      if (ok) { s = s.slice(0, i) + s.slice(i + 1); i--; }
    }
    return s;
  }
  function linesOf(items, vp, joinSpaces) {
    var U = window.pdfjsLib.Util, raw = [], cur = null;
    items.forEach(function (it) {
      if (typeof it.str !== 'string' || !it.str) { return; }
      var tx = U.transform(vp.transform, it.transform);
      var h = Math.hypot(tx[2], tx[3]);
      if (!h || h < 2) { return; }
      var x = tx[4], base = tx[5], w = (it.width || 0) * vp.scale, str = it.str;
      /* 只有空白的片段不算寬度；前後的空白按比例扣掉，免得文字層被拉長 */
      var core = str.replace(/^\s+|\s+$/g, '');
      if (!core) { if (cur) { cur.raw += ' '; } return; }
      var lead = str.length - str.replace(/^\s+/, '').length, trail = str.length - str.replace(/\s+$/, '').length;
      var per = str.length ? w / str.length : 0, cx0 = x + per * lead, cx1 = x + w - per * trail;
      if (cur && Math.abs(base - cur.base) < 0.3 * h && Math.abs(h - cur.h) < 0.3 * cur.h && cx0 > cur.x1 - 0.6 * h && cx0 - cur.x1 < 0.25 * h && cur.raw.length < 16) {
        cur.raw += (lead && !/\s$/.test(cur.raw) ? ' ' : '') + core;
        cur.x1 = Math.max(cur.x1, cx1);
      } else {
        cur = { x0: cx0, x1: cx1, base: base, h: h, raw: core };
        raw.push(cur);
      }
      if (trail) { cur.raw += ' '; }
    });
    var out = [];
    raw.forEach(function (ln) {
      var c = window.ThaiPdfFix.cleanText(ln.raw);
      var t = joinSpaces ? joinFakeSpaces(c.text) : c.text;
      t = t.replace(/\s+$/, '').replace(/^\s+/, '');
      if (!t) { return; }
      out.push({ x: ln.x0, w: Math.max(1, ln.x1 - ln.x0), base: ln.base, h: ln.h, t: t, nulls: c.nulls });
    });
    return out;
  }
  function sepBetween(a, b) {
    var la = a.t.slice(-1), fb = b.t.charAt(0), H = Math.max(a.h, b.h);
    var thA = /[฀-๿]/.test(la), thB = /[฀-๿]/.test(fb), cjk = /[⺀-鿿豈-﫿＀-￯]/;
    if (Math.abs(b.base - a.base) < 0.35 * H) { return (b.x - (a.x + a.w) < 0.2 * H || /\s$/.test(a.t)) ? '' : ' '; }
    var dy = b.base - a.base;
    if (dy < 0 || dy > 1.9 * H || Math.abs(b.h - a.h) > 0.3 * a.h) { return '\n'; }
    if ((thA && cjk.test(fb)) || (cjk.test(la) && thB)) { return '\n'; }
    if (thA && thB) { return ''; }
    if (cjk.test(la) && cjk.test(fb)) { return ''; }
    return ' ';
  }
  function pageQuality(pg, text) {
    var t = text.slice(pg.range[0], pg.range[1]);
    var thai = (t.match(/[ก-๛]/g) || []).length, all = t.replace(/\s/g, '').length;
    var garb = window.ThaiPdfFix.garbageCount(t), words = 0, hit = 0;
    segs.forEach(function (s) {
      if (s.i < pg.range[0] || s.i >= pg.range[1] || !s.w || s.n < 2 || !/^[ก-๎]+$/.test(s.t)) { return; }
      words++;
      if (DICT && DICT[s.t]) { hit++; }
    });
    var cov = words ? hit / words : 1;
    var q = { n: pg.n, thai: thai, all: all, garb: garb, nulls: pg.nulls, cov: cov, words: words };
    if (all < 15) { q.st = 'empty'; }
    else if (thai >= 30 && ((garb * 1000 / thai) > 20 || (words >= 20 && cov < 0.6))) { q.st = 'broken'; }
    else if (pg.nulls > 0) { q.st = 'minor'; }
    else { q.st = 'ok'; }
    return q;
  }
  var Q_TEXT = { ok: '正常', minor: '有少量缺字', broken: '文字可能壞掉', empty: '沒有文字（可能是掃描或圖片）' };
  var FIX_HOW = { byName: '字形名稱', byComposite: '組合字形', byShape: '外形比對' };
  function renderDocInfo() {
    var ul = $('docpages'), help = $('dochelp');
    ul.replaceChildren();
    $('toText').hidden = !pdf;
    if (!pdf) { ul.hidden = true; help.hidden = true; return; }
    var counts = { ok: 0, minor: 0, broken: 0, empty: 0 };
    pdf.quality.forEach(function (q) { counts[q.st]++; });
    var r = pdf.fix, parts = [];
    Object.keys(FIX_HOW).forEach(function (k) { if (r[k]) { parts.push(FIX_HOW[k] + ' ' + r[k] + ' 個'); } });
    var li0 = document.createElement('li');
    li0.textContent = '共 ' + pdf.pages.length + ' 頁：正常 ' + counts.ok + ' 頁' + (counts.minor ? '、少量缺字 ' + counts.minor + ' 頁' : '') + (counts.broken ? '、文字可能壞掉 ' + counts.broken + ' 頁' : '') + (counts.empty ? '、沒有文字 ' + counts.empty + ' 頁' : '') + '。';
    ul.appendChild(li0);
    var li1 = document.createElement('li');
    li1.textContent = parts.length ? '已自動修好泰文字型：' + parts.join('、') + '（' + r.fixedFonts.join('、') + '）。' : '泰文字型不需要修復。';
    ul.appendChild(li1);
    var bad = pdf.quality.filter(function (q) { return q.st !== 'ok'; });
    if (bad.length) {
      var li2 = document.createElement('li');
      li2.textContent = '要注意的頁面：' + bad.slice(0, 12).map(function (q) { return '第 ' + q.n + ' 頁' + Q_TEXT[q.st]; }).join('、') + (bad.length > 12 ? '…' : '') + '。';
      ul.appendChild(li2);
      help.hidden = false;
      help.textContent = '有問題的頁面可以這樣讀：用 iPad 的「原況文字」選取頁面上的泰文、拷貝，再貼到最下面的「換成你自己的泰文」。之後的版本會加上文字辨識（OCR）。';
    } else { help.hidden = true; }
    ul.hidden = false;
  }
  function buildTextLayer() {
    var el = $('text'), mctx = document.createElement('canvas').getContext('2d');
    el.className = 'pdf';
    el.replaceChildren();
    if (!baseRatio) { baseRatio = measureBaseline(); }
    pdf.tl.forEach(function (sp) {
      var d = document.createElement('span');
      if (sp.sep) { d.className = 'sep'; }
      else {
        d.className = 'tl';
        mctx.font = sp.h + 'px ' + THAI_STACK;
        var mw = mctx.measureText(sp.t).width || sp.w;
        d.style.left = sp.x.toFixed(2) + 'px';
        d.style.top = (sp.base - sp.h * baseRatio).toFixed(2) + 'px';
        d.style.fontSize = sp.h.toFixed(2) + 'px';
        d.style.transform = 'scaleX(' + (sp.w / mw).toFixed(4) + ')';
      }
      d.textContent = sp.t;
      sp.el = d; sp.k = '';
      el.appendChild(d);
    });
  }
  function setupPages() {
    var host = $('pdfpages');
    host.replaceChildren();
    host.hidden = false;
    pdf.pages.forEach(function (pg, i) {
      var d = document.createElement('div');
      d.className = 'pdfpage';
      d.style.top = pg.top + 'px';
      d.style.height = pg.h + 'px';
      d.setAttribute('data-i', String(i));
      var c = document.createElement('canvas'); c.className = 'pc';
      var ik = document.createElement('canvas'); ik.className = 'pi';
      var num = document.createElement('span'); num.className = 'pnum'; num.textContent = pg.n + ' / ' + pdf.pages.length;
      d.appendChild(c); d.appendChild(ik); d.appendChild(num);
      host.appendChild(d);
      pg.el = d; pg.canvas = c; pg.ink = ik; pg.rendered = 0; pg.visible = i < 2;
    });
    if (pdfIO) { pdfIO.disconnect(); pdfIO = null; }
    if (typeof IntersectionObserver === 'function') {
      pdfIO = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          var pg = pdf && pdf.pages[Number(en.target.getAttribute('data-i'))];
          if (pg) { pg.visible = en.isIntersecting; }
        });
        renderVisiblePages();
      }, { rootMargin: '900px 0px 900px 0px' });
      pdf.pages.forEach(function (pg) { pdfIO.observe(pg.el); });
    } else { pdf.pages.forEach(function (pg) { pg.visible = true; }); }
  }
  function wantRes() { return Math.max(1, Math.min(3, (window.devicePixelRatio || 1) * scale)); }
  function renderVisiblePages() {
    if (!pdf || renderBusy) { return; }
    var k = wantRes();
    var rendered = pdf.pages.filter(function (pg) { return pg.rendered; });
    rendered.forEach(function (pg) {
      if (!pg.visible && rendered.length > 6) {
        pg.canvas.width = 0; pg.canvas.height = 0; pg.ink.width = 0; pg.ink.height = 0; pg.rendered = 0;
        rendered = rendered.filter(function (x) { return x !== pg; });
      }
    });
    var next = pdf.pages.filter(function (pg) { return pg.visible && Math.abs(pg.rendered - k) > 0.01; })[0];
    if (!next) { return; }
    renderBusy = true;
    var pg = next, kk = k, doc = pdf;
    if (PAGE_W * kk * pg.h * kk > 6e6) { kk = Math.sqrt(6e6 / (PAGE_W * pg.h)); }
    var vp = pg.proxy.getViewport({ scale: pg.s * kk });
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(vp.width));
    c.height = Math.max(1, Math.round(vp.height));
    c.className = 'pc';
    pg.proxy.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
      if (pdf !== doc) { return; }
      pg.el.replaceChild(c, pg.canvas);
      pg.canvas = c;
      pg.rendered = k;
      pg.ink.width = c.width; pg.ink.height = c.height;
      redrawPageInk(pg);
      renderReport();
    }, function (err) {
      pg.rendered = k;
      pdfInfo.lastError = '第 ' + pg.n + ' 頁畫不出來：' + String(err && err.message || err).slice(0, 60);
    }).then(function () { renderBusy = false; renderVisiblePages(); });
  }
  function pageInkCtx(pg) {
    var c = pg.ink, k = c.width / PAGE_W, g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, -pg.top * k);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = inkColor(); g.fillStyle = inkColor();
    return g;
  }
  function strokeHits(s, pg) {
    for (var i = 0; i < s.p.length; i++) { var y = s.p[i][1]; if (y >= pg.top - 20 && y <= pg.top + pg.h + 20) { return true; } }
    return false;
  }
  function redrawPageInk(pg) {
    if (!pg.ink || !pg.ink.width) { return; }
    var g = pageInkCtx(pg);
    g.clearRect(0, pg.top, PAGE_W, pg.h);
    state.strokes.forEach(function (s) { if (strokeHits(s, pg)) { drawStroke(g, s); } });
  }
  function pageAtY(y) {
    if (!pdf) { return null; }
    for (var i = 0; i < pdf.pages.length; i++) { var pg = pdf.pages[i]; if (y >= pg.top - PDF_GAP && y <= pg.top + pg.h) { return pg; } }
    return null;
  }
  function teardownPdf() {
    if (pdfIO) { pdfIO.disconnect(); pdfIO = null; }
    if (pdf && pdf.doc) { try { pdf.doc.destroy(); } catch (err) {} }
    pdf = null;
    $('pdfpages').replaceChildren();
    $('pdfpages').hidden = true;
    $('text').className = '';
    $('wrap').classList.remove('haspdf');
    renderDocInfo();
  }
  function docKey(id) { return PDF_DOC_PREFIX + id; }
  async function openPdfBytes(bytes, name, restore) {
    var t0 = Date.now();
    $('pdffile').disabled = true;
    try {
      setDocStatus('準備 PDF 工具…（第一次會比較久）');
      await ensureLibs();
      setDocStatus('檢查並修復泰文字型…');
      var fixed = await window.ThaiPdfFix.fixPdfBytes(bytes.slice());
      setDocStatus('讀取頁面…');
      var doc = await window.pdfjsLib.getDocument({ data: fixed.bytes, isEvalSupported: false }).promise;
      var id = name + '|' + bytes.length;
      var pages = [], tl = [], text = '', top = 0, joinSpaces = fixed.report.byName > 0;
      for (var p = 1; p <= doc.numPages; p++) {
        if (p % 3 === 1) { setDocStatus('讀取第 ' + p + ' / ' + doc.numPages + ' 頁…'); }
        var page = await doc.getPage(p);
        var vp1 = page.getViewport({ scale: 1 }), s = PAGE_W / vp1.width, vp = page.getViewport({ scale: s });
        var tc = await page.getTextContent();
        if (Object.keys(fixed.report.textMaps).length) {
          await page.getOperatorList();
          tc.items.forEach(function (it) {
            var f = null;
            try { f = page.commonObjs.get(it.fontName); } catch (err) { f = null; }
            var m = f && fixed.report.textMaps[f.name];
            if (m && it.str) { it.str = Array.from(it.str).map(function (c) { return m[c] || c; }).join(''); }
          });
        }
        var lines = linesOf(tc.items, vp, joinSpaces), pg = { n: p, top: top, h: vp.height, s: s, proxy: page, nulls: 0 };
        if (p > 1) { tl.push({ o: text.length, t: '\n\n', sep: true }); text += '\n\n'; }
        var start = text.length, prev = null;
        lines.forEach(function (ln) {
          if (prev) { var sp = sepBetween(prev, ln); if (sp) { tl.push({ o: text.length, t: sp, sep: true }); text += sp; } }
          ln.o = text.length; ln.page = p; pg.nulls += ln.nulls;
          tl.push(ln); text += ln.t; prev = ln;
        });
        lines.forEach(function (ln) { ln.base += top;
        });
        pg.range = [start, text.length];
        pages.push(pg);
        top += vp.height + PDF_GAP;
      }
      teardownPdf();
      pdf = { doc: doc, name: name, id: id, pages: pages, tl: tl, totalH: Math.max(200, top - PDF_GAP), fix: fixed.report, quality: [], ms: 0 };
      /* 筆記：同一份 PDF 開過就接回上次的筆記，否則從空白開始 */
      var keep = null;
      if (restore && state.src && state.src.id === id) { keep = state; }
      else {
        try { var raw = localStorage.getItem(docKey(id)); if (raw) { keep = JSON.parse(raw); } } catch (err) { keep = null; }
      }
      var sameText = keep && keep.text === text;
      state = {
        text: text, src: { type: 'pdf', name: name, id: id, pages: pages.length },
        hl: sameText ? (keep.hl || []) : [],
        strokes: keep ? (keep.strokes || []) : [], boxes: keep ? (keep.boxes || []) : [],
        nextId: keep ? (keep.nextId || 1) : 1, style: state.style
      };
      if (keep && !sameText) { state.boxes.forEach(function (b) { delete b.a; }); }
      history = []; tapSel = null;
      segs = segment(state.text);
      pdf.quality = pages.map(function (pg) { return pageQuality(pg, text); });
      $('wrap').classList.add('haspdf');
      buildTextLayer();
      setupPages();
      renderText(); layout(); renderBoxes();
      refreshTranslateLink();
      pdf.ms = Date.now() - t0;
      setDocStatus('目前顯示：' + name + '（' + pages.length + ' 頁，' + (pdf.ms / 1000).toFixed(1) + ' 秒）' + (keep && !restore ? '，已接回上次的筆記' : ''));
      renderDocInfo();
      save();
      if (!restore) { $('wrap').scrollIntoView({ block: 'start' }); }
    } catch (err) {
      pdfInfo.lastError = String(err && err.message || err).slice(0, 120);
      setDocStatus('開啟失敗：' + pdfInfo.lastError);
      renderReport();
      throw err;
    } finally { $('pdffile').disabled = false; }
  }
  function openPdfFile(file) {
    if (!file) { return; }
    if (!/pdf$/i.test(file.name) && file.type !== 'application/pdf') { setDocStatus('這不是 PDF 檔，請選副檔名是 .pdf 的檔案。'); return; }
    setDocStatus('讀取檔案…');
    file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      return idbPutOnly(file.name + '|' + bytes.length, bytes).then(function () { pdfInfo.stored = '已存到這台裝置'; }, function (err) { pdfInfo.stored = '存不進裝置（' + String(err && err.message || err).slice(0, 40) + '），下次要重選'; })
        .then(function () { if (pdf && state.src) { try { localStorage.setItem(docKey(state.src.id), JSON.stringify(data())); } catch (e) {} } return openPdfBytes(bytes, file.name, false); });
    }).catch(function () {});
  }
  function restorePdf() {
    setDocStatus('正在打開上次的 PDF…');
    return idbGet(state.src.id).then(function (bytes) {
      if (!bytes) { throw new Error('裝置裡找不到這個檔案'); }
      return openPdfBytes(new Uint8Array(bytes), state.src.name, true);
    });
  }
  $('pdffile').addEventListener('change', function () {
    var f = this.files && this.files[0];
    openPdfFile(f);
    this.value = '';
  });
  $('toText').addEventListener('click', function () {
    if (state.src) { try { localStorage.setItem(docKey(state.src.id), JSON.stringify(data())); } catch (e) {} }
    teardownPdf();
    state = { text: SAMPLE, src: null, hl: [], strokes: [], boxes: [], nextId: 1, style: state.style };
    history = []; tapSel = null;
    segs = segment(state.text);
    $('input').value = state.text;
    renderAllNotes(); save(); refreshTranslateLink();
    setDocStatus('目前顯示：範例文字。PDF 的筆記已保留，再開同一份 PDF 會接回來。');
  });

  /* ---------- 第一次使用：歡迎視窗 ---------- */
  var WELCOME_KEY = 'thai-welcome-v1', welcomeSeen = false, welcomeFrom = null;
  try { welcomeSeen = localStorage.getItem(WELCOME_KEY) === '1'; } catch (err) {}
  var LEVEL_HELP = {
    a: '剛開始學：認得字母和一些單字。',
    b: '會基本句子，能讀簡單的文章。',
    c: '能讀一般新聞、Podcast 或 YouTube 逐字稿，但常卡在句型。',
    d: '能讀大部分內容，想補正式、書面的用法。',
    all: '不篩選：所有程度的句型都列出來。'
  };
  function renderWelcome() {
    segButtons($('wLevel'), LEVELS, level, function (v) {
      level = v; try { localStorage.setItem('thai-level', v); } catch (err) {}
      renderWelcome(); renderSettings(); renderReport();
    });
    $('wLevelHelp').textContent = LEVEL_HELP[level] || '';
    segButtons($('wRom'), [['on', '顯示'], ['off', '不顯示']], showRom ? 'on' : 'off', function (v) {
      if ((v === 'on') !== showRom) { toggleRom(); }
      renderWelcome();
    });
  }
  function openWelcome() {
    welcomeFrom = document.activeElement;
    renderWelcome();
    $('welcome').hidden = false;
    setTimeout(function () { try { $('wDone').focus(); } catch (err) {} }, 30);
  }
  function closeWelcome() {
    $('welcome').hidden = true;
    welcomeSeen = true;
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch (err) {}
    if (welcomeFrom && welcomeFrom.focus) { try { welcomeFrom.focus(); } catch (err) {} }
    renderReport();
  }
  $('wDone').addEventListener('click', closeWelcome);
  $('reWelcome').addEventListener('click', function () { $('settings').hidden = true; $('openSettings').setAttribute('aria-expanded', 'false'); openWelcome(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('welcome').hidden) { closeWelcome(); } });
