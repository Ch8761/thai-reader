  /* ====== 1.34：新的泰文辨識（OpenThai2.0-OCR-Text，在裝置上跑）；舊的 Tesseract 留作中文與備援 ====== */
  var OT_DIR = 'ot2/', ot = { ready: null, failed: false, err: '' };
  function otOn() { try { return localStorage.getItem('thai-ocr-engine') !== 'old'; } catch (err) { return true; } }
  var _ensureOcr42 = ensureOcr;
  function otLoad() {
    if (ot.ready) { return ot.ready; }
    var base = new URL(OCR_BASE, location.href).href + OT_DIR;
    ocr.engine = '載入中';
    ot.ready = (window.ort ? Promise.resolve() : ocrScript(base + 'ort.min.js'))
      .then(function () { return window.ThaiOCR ? null : ocrScript(base + 'thaiocr.js'); })
      .then(function () {
        window.ort.env.wasm.wasmPaths = base; window.ort.env.wasm.numThreads = 1;
        try { window.ort.env.wasm.proxy = true; } catch (err) {}
        return window.ThaiOCR.load(base);
      })
      .then(function () { ocr.engine = '已載入（新版辨識）'; return otWorker; }, function (err) { ot.ready = null; ot.failed = true; ot.err = String(err && err.message || err).slice(0, 120); throw err; });
    return ot.ready;
  }
  function otTessLine(text, conf, b) {
    var base = b.y + b.h * 0.76;
    return { text: text, confidence: conf, bbox: { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h }, rowAttributes: { row_height: b.h * 0.82, descenders: b.h * 0.24 },
      baseline: { x0: b.x, y0: base, x1: b.x + b.w, y1: base, has_baseline: true }, words: [{ text: text, confidence: conf, bbox: { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h } }] };
  }
  /* 新版只認泰文和英文：沒讀出來的行，如果設定要認中文，就交給舊工具讀那一小塊 */
  async function otChinese(cv, r) {
    var cand = r.dropped.filter(function (d) { return d.conf < 0.5 && d.box.h >= 12 && d.box.w >= d.box.h * 1.2; }).slice(0, 12);
    if (!cand.length) { return; }
    var w = await _ensureOcr42(), lines = r.data.blocks[0].paragraphs[0].lines, added = 0;
    try {
      await w.setParameters({ tessedit_pageseg_mode: '7' });
      for (var i = 0; i < cand.length; i++) {
        var b = cand[i].box, pad = Math.round(b.h * 0.15), k = Math.min(3, Math.max(1, 64 / b.h));
        var c = document.createElement('canvas'); c.width = Math.round((b.w + 2 * pad) * k); c.height = Math.round((b.h + 2 * pad) * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high';
        g.drawImage(cv, b.x, b.y, b.w, b.h, pad * k, pad * k, b.w * k, b.h * k);
        var res = await w.recognize(c, {}, { blocks: false, text: true, hocr: false, tsv: false });
        var tx = String(res.data.text || '').replace(/\s+/g, ' ').trim(), cf = res.data.confidence || 0;
        var nz = (tx.match(/[\u4E00-\u9FFF]/g) || []).length;
        if (cf >= 72 && nz >= 2 && nz / tx.replace(/\s/g, '').length > 0.6) { lines.push(otTessLine(tx.replace(/([一-鿿]) (?=[一-鿿])/g, '$1'), cf, b)); added++; }
      }
    } finally { try { await w.setParameters({ tessedit_pageseg_mode: '3' }); } catch (err) {} }
    if (added) { lines.sort(function (a, b2) { var ay = (a.bbox.y0 + a.bbox.y1) / 2, by = (b2.bbox.y0 + b2.bbox.y1) / 2, h = Math.min(a.bbox.y1 - a.bbox.y0, b2.bbox.y1 - b2.bbox.y0); return Math.abs(ay - by) < h * 0.5 ? a.bbox.x0 - b2.bbox.x0 : ay - by; }); }
  }
  /* 少數造型很特別的字體（很寬的無圈廣告體），新版會把 ร 認成 ธ、ว 認成 อ。
     讀出來的行如果拼不出字典裡的詞，就請舊工具也讀一次，同一行取「拼得出比較多詞」的那個 */
  var otMix = { runs: 0, swaps: 0 };
  async function otSecondOpinion(cv, r) {
    if (!DICT) { return; }
    var lines = r.data.blocks[0].paragraphs[0].lines, bad = [], thai = 0;
    lines.forEach(function (ln, i) {
      if ((ln.text.match(/[\u0E01-\u0E2E]/g) || []).length < 3) { return; }
      thai++; ln._kn = vidKnown(ln.text);
      if (ln._kn < 0.9) { bad.push(i); }
    });
    if (!bad.length || (thai > 3 && bad.length / thai < 0.2)) { return; }
    var w = await _ensureOcr42();
    otMix.runs++;
    try {
      await w.setParameters({ tessedit_pageseg_mode: '7' });
      for (var q = 0; q < bad.length && q < 12; q++) {
        var a = lines[bad[q]], bb = a.bbox, bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0, pad = Math.round(bh * 0.2), k = Math.min(3, Math.max(1, 70 / bh));
        var c = document.createElement('canvas'); c.width = Math.round((bw + 2 * pad) * k); c.height = Math.round((bh + 2 * pad) * k);
        var g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
        g.drawImage(cv, Math.max(0, bb.x0 - pad), Math.max(0, bb.y0 - pad), bw + 2 * pad, bh + 2 * pad, 0, 0, c.width, c.height);
        var res = await w.recognize(c, {}, { blocks: false, text: true, hocr: false, tsv: false });
        var tx = String(res.data.text || '').replace(/\s+/g, ' ').trim(), kn = vidKnown(tx);
        if ((res.data.confidence || 0) >= 70 && /[\u0E01-\u0E2E]/.test(tx) && kn >= a._kn + 0.1 && Math.abs(tx.replace(/\s/g, '').length - a.text.replace(/\s/g, '').length) <= Math.max(3, a.text.length * 0.3)) {
          lines[bad[q]] = otTessLine(tx, res.data.confidence, { x: bb.x0, y: bb.y0, w: bw, h: bh }); otMix.swaps++;
        }
      }
    } finally { try { await w.setParameters({ tessedit_pageseg_mode: '3' }); } catch (err) {} ocr.engine = '已載入（新版辨識）'; }
  }
  var otWorker = {
    ot: true,
    setParameters: function () { return Promise.resolve(); },
    terminate: function () {},
    recognize: async function (cv) {
      var r = await window.ThaiOCR.recognize(cv);
      if (ocrZh() !== 'off' && r.dropped.length) { try { await otChinese(cv, r); } catch (err) {} ocr.engine = '已載入（新版辨識）'; }
      try { await otSecondOpinion(cv, r); } catch (err) {}
      return { data: r.data };
    },
    /* 影片用：只讀，不找舊工具幫忙（影片那邊本來就會拿幾種讀法互相比） */
    recognizeOnly: async function (cv) {
      var r = await window.ThaiOCR.recognize(cv);
      if (ocrZh() !== 'off' && r.dropped.length) { try { await otChinese(cv, r); } catch (err) {} }
      return { data: r.data };
    }
  };
  ensureOcr = function () {
    if (!otOn() || ot.failed) { return _ensureOcr42(); }
    return otLoad().catch(function () { return _ensureOcr42(); });
  };
  /* 設定：文字辨識方式 */
  (function () {
    var g = $('ocrEngGroup'); if (!g) { return; }
    function draw() {
      segButtons(g, [['new', L2('新版', 'New')], ['old', L2('舊版', 'Old')]], otOn() ? 'new' : 'old', function (v) {
        try { if (v === 'old') { localStorage.setItem('thai-ocr-engine', 'old'); } else { localStorage.removeItem('thai-ocr-engine'); } } catch (err) {}
        ot.failed = false; draw();
      });
    }
    draw();
  })();

