  /* ---------- 文字辨識（OCR）：掃描的 PDF 頁面、照片、截圖 ----------
     做法：把頁面畫成圖，交給 Tesseract（開源的文字辨識程式）認字，
     再把每個字的位置存起來，之後就跟一般 PDF 一樣可以點字查詞、畫螢光筆。 */
  var OCR_BASE = 'https://ch8761.github.io/thai-reader/ocr/';
  var ocr = { busy: false, stop: false, done: 0, total: 0, page: 0, msg: '', msgId: '', lastError: '', worker: null, ready: null, engine: '尚未載入', fixes: 0, ms: 0, onlog: null, autoId: '' };
  function ocrUrls() {
    var b = new URL(OCR_BASE, location.href).href;
    return { lib: b + 'tesseract.min.js', worker: b + 'worker.min.js', core: b + 'core', lang: b + 'lang', cross: new URL(b).origin !== location.origin };
  }
  function ocrScript(u) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = u; s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('下載不到文字辨識工具（請確認有連上網路）')); };
      document.head.appendChild(s);
    });
  }
  function ensureOcr() {
    if (ocr.ready) { return ocr.ready; }
    var u = ocrUrls();
    ocr.engine = '載入中';
    ocr.ready = (window.Tesseract ? Promise.resolve() : ocrScript(u.lib)).then(function () {
      if (!window.Tesseract) { throw new Error('文字辨識工具沒有載入成功'); }
      return window.Tesseract.createWorker(['tha', 'eng'], 1, {
        workerPath: u.worker, corePath: u.core, langPath: u.lang, gzip: true, workerBlobURL: u.cross,
        logger: function (m) { if (ocr.onlog) { ocr.onlog(m); } },
        errorHandler: function (e) { ocr.lastError = String(e && e.message || e).slice(0, 120); }
      });
    }).then(function (w) { ocr.worker = w; ocr.engine = '已載入（' + (u.cross ? '從 GitHub 下載' : '同一個網站') + '）'; return w; }, function (err) {
      ocr.ready = null; ocr.engine = '載入失敗'; throw err;
    });
    return ocr.ready;
  }
  function ocrKey(id) { return 'ocr:' + id; }
  function ocrLoad(id) { return idbGet(ocrKey(id)).then(function (o) { return o && o.pages ? o : null; }, function () { return null; }); }
  function ocrSave(id, o) { return idbPut(ocrKey(id), o); }

  /* 辨識完的修正：常見的錯字型（少了聲調符號、ึ／ื 認錯）換回常用詞 */
  var OCR_FIX = null, ocrSeg = null;
  function ocrFixMap() {
    if (!OCR_FIX) {
      try { OCR_FIX = JSON.parse($('ocrfix').textContent); } catch (err) { OCR_FIX = {}; }
      /* 辨識常見的認錯（從使用者的截圖整理）：นี้／นี่ 的上方符號掉了、น้ำ 少了聲調 */
      var EXTRA = { 'ตอนนิ': 'ตอนนี้', 'ที่นิ': 'ที่นี่', 'ทีนิ': 'ที่นี่', 'แบบนิ': 'แบบนี้', 'อันนิ': 'อันนี้', 'คนนิ': 'คนนี้', 'วันนิ': 'วันนี้', 'ปีนิ': 'ปีนี้', 'เรื่องนิ': 'เรื่องนี้', 'แบบนี': 'แบบนี้',
        'ตอนนี่': 'ตอนนี้', 'ตอนนี': 'ตอนนี้', 'วันนี่': 'วันนี้', 'วันนี': 'วันนี้', 'แบบนี่': 'แบบนี้', 'ปีนี่': 'ปีนี้', 'คนนี่': 'คนนี้', 'อันนี่': 'อันนี้', 'เรื่องนี่': 'เรื่องนี้', 'ทีนี่': 'ที่นี่', 'เมื่อกี': 'เมื่อกี้', 'เมือกี้': 'เมื่อกี้',
        'นำมูก': 'น้ำมูก', 'นำตา': 'น้ำตา', 'นำหนัก': 'น้ำหนัก', 'นำใจ': 'น้ำใจ', 'นำแข็ง': 'น้ำแข็ง', 'นำเสียง': 'น้ำเสียง', 'นำผึ้ง': 'น้ำผึ้ง' };
      Object.keys(EXTRA).forEach(function (k) { OCR_FIX[k] = EXTRA[k]; });
    }
    return OCR_FIX;
  }
  function ocrNorm(t) {
    return t.replace(/ํา/g, 'ำ').replace(/เเ/g, 'แ').replace(/[​-‍﻿]/g, '');
  }
  function ocrFixText(t) {
    t = ocrNorm(t);
    if (!/[ก-๎]/.test(t) || typeof Intl === 'undefined' || !Intl.Segmenter) { return { t: t, n: 0 }; }
    if (!ocrSeg) { ocrSeg = new Intl.Segmenter('th', { granularity: 'word' }); }
    var M = ocrFixMap(), toks = Array.from(ocrSeg.segment(t)).map(function (x) { return x.segment; }), out = '', n = 0;
    var prevW = '';
    for (var i = 0; i < toks.length;) {
      var hit = false;
      for (var k = Math.min(3, toks.length - i); k >= 1; k--) {
        var w = toks.slice(i, i + k).join('');
        if (Object.prototype.hasOwnProperty.call(M, w)) { out += M[w]; prevW = M[w]; i += k; n++; hit = true; break; }
      }
      if (hit) { continue; }
      /* ก็ 常被認成 กี้／ก้：前一個是完整的詞時才換（避免改到 เบคกี้、มิกกี้ 這類名字） */
      if ((toks[i] === 'กี้' || toks[i] === 'ก้' || toks[i] === 'กิ') && prevW.length >= 2 && DICT && DICT[prevW]) { out += 'ก็'; prevW = 'ก็'; i++; n++; continue; }
      out += toks[i]; prevW = toks[i]; i++;
    }
    var g = ocrNameFix(out);
    return { t: g.t, n: n + g.n };
  }
  /* 用專有名詞名單補回名字裡漏掉的聲調符號（例如 เบคกี → เบคกี้，名單裡要有這個名字） */
  var gazSk = null, TONE_ONLY = /[\u0E48-\u0E4C]/;
  /* 名字的「骨架」：拿掉聲調符號，ิ ี ึ ื ็ 當成同一類（辨識最常認錯這幾個） */
  function skel(s) { return s.replace(/[\u0E48-\u0E4C]/g, '').replace(/[\u0E34-\u0E37\u0E47]/g, '\u0E34'); }
  function gazSkeletonIndex() {
    if (gazSk) { return gazSk; }
    gazSk = {};
    if (typeof GAZ === 'undefined') { return gazSk; }
    Object.keys(GAZ).forEach(function (k) {
      GAZ[k].forEach(function (o) {
        if (o.t.length < 4 || / /.test(o.t)) { return; }
        var sk = skel(o.t);
        if (sk === o.t) { return; }
        if (sk.length < 3) { return; }
        (gazSk[sk.slice(0, 2)] = gazSk[sk.slice(0, 2)] || []).push({ sk: sk, o: o });
      });
    });
    /* 字典裡的詞（含網路用語）：骨架只對到一個詞時才用，而且只在原本的字查不到時才換 */
    if (typeof DICT !== 'undefined' && DICT) {
      var bySk = {};
      Object.keys(DICT).forEach(function (w) {
        if (w.length < 3 || / /.test(w) || !/^[\u0E01-\u0E4E]+$/.test(w)) { return; }
        var sk = skel(w);
        if (sk === w || sk.length < 3) { return; }
        bySk[sk] = Object.prototype.hasOwnProperty.call(bySk, sk) && bySk[sk] !== w ? null : w;
      });
      Object.keys(bySk).forEach(function (sk) { if (bySk[sk]) { (gazSk[sk.slice(0, 2)] = gazSk[sk.slice(0, 2)] || []).push({ sk: sk, o: { t: bySk[sk] }, word: true }); } });
    }
    Object.keys(gazSk).forEach(function (k) { gazSk[k].sort(function (a, b) { return b.sk.length - a.sk.length || (a.word ? 1 : 0) - (b.word ? 1 : 0); }); });
    return gazSk;
  }
  function ocrNameFix(t) {
    var idx = gazSkeletonIndex();
    if (!/[\u0E01-\u0E2E]/.test(t) || !Object.keys(idx).length) { return { t: t, n: 0 }; }
    var sk = '', map = [], starts = { 0: 1 }, ends = {}, pieces = [];
    for (var i = 0; i < t.length; i++) { var c = t.charAt(i); if (!TONE_ONLY.test(c)) { map.push(i); sk += skel(c); } }
    map.push(t.length);
    if (ocrSeg) { Array.from(ocrSeg.segment(t)).forEach(function (x) { starts[x.index] = 1; ends[x.index + x.segment.length] = 1; pieces.push([x.index, x.index + x.segment.length, x.segment]); }); }
    ends[t.length] = 1;
    /* 這一段裡有沒有查不到的片段（字典詞的補字只在有查不到的片段時才做，避免把 ความ 改成 คว้า＋ม） */
    function hasUnknown(a, b) { return pieces.some(function (p) { return p[0] < b && a < p[1] && /[\u0E01-\u0E4E]/.test(p[2]) && !DICT[p[2]]; }); }
    var out = '', pos = 0, n = 0, j = 0;
    while (j < sk.length - 1) {
      var list = idx[sk.substr(j, 2)], hit = null;
      if (list && (starts[map[j]] || !isThaiCh(t.charAt(map[j] - 1)))) {
        for (var k = 0; k < list.length; k++) {
          var L = list[k].sk.length;
          if (sk.substr(j, L) !== list[k].sk) { continue; }
          var nx = t.charAt(map[j + L]);
          if (isMark(nx) || /[\u0E30\u0E32\u0E33\u0E45]/.test(nx)) { continue; }
          if (list[k].word && (DICT[t.slice(map[j], map[j + L])] || !ends[map[j + L]] || !hasUnknown(map[j], map[j + L]))) { continue; }
          /* 名字也一樣：原本的字全都查得到（例如 นี้ก็）就不改成名字（นิกี้） */
          if (!list[k].word && !hasUnknown(map[j], map[j + L])) { continue; }
          hit = list[k]; break;
        }
      }
      if (hit) {
        var a = map[j], b = map[j + hit.sk.length];
        if (t.slice(a, b) !== hit.o.t) { out += t.slice(pos, a) + hit.o.t; pos = b; n++; }
        j += hit.sk.length; continue;
      }
      j++;
    }
    return { t: out + t.slice(pos), n: n };
  }
  /* 把 Tesseract 的結果變成文字層的片段：位置都存成「頁寬的幾分之幾」，換螢幕大小也對得上 */
  function ocrItems(data, W) {
    var out = [], fixes = 0;
    function r(v) { return Math.round(v / W * 1e5) / 1e5; }
    (data.blocks || []).forEach(function (b) {
      (b.paragraphs || []).forEach(function (p) {
        (p.lines || []).forEach(function (ln) {
          /* 表情符號常被認成亂碼：沒有字母或數字的字，信心要很高才留 */
          var ws = (ln.words || []).filter(function (w) {
            if (!w.text || !w.text.trim()) { return false; }
            return /[A-Za-z0-9\u0E01-\u0E4E\u0E50-\u0E59]/.test(w.text) ? w.confidence >= 20 : w.confidence >= 75;
          });
          if (!ws.length || ln.confidence < 50) { return; }
          /* 截圖裡的按讚數、時間、使用者名稱旁的符號：字母太少的行不要 */
          var lineTxt = ws.map(function (w) { return w.text; }).join(''), letters = (lineTxt.match(/[A-Za-z\u0E01-\u0E4E]/g) || []).length;
          if (letters < 2 || letters / lineTxt.length < 0.5) { return; }
          /* 泰文字之間孤立的單一符號或英文字母（多半是表情符號） */
          ws = ws.filter(function (w, k) {
            var tx = w.text.trim();
            if (tx.length > 1 || !/^[A-Za-z@©®&|$#%*¢§~^`]$/.test(tx)) { return true; }
            var a = ws[k - 1], b = ws[k + 1];
            return !((!a || /[\u0E01-\u0E4E]/.test(a.text)) && (!b || /[\u0E01-\u0E4E]/.test(b.text)));
          });
          if (!ws.length) { return; }
          var short = ws.filter(function (w) { return w.text.trim().length <= 2; }).length;
          if (ln.confidence < 80 && ws.length >= 4 && short / ws.length >= 0.6) { return; }
          var ra = ln.rowAttributes || {}, bb = ln.bbox, h = ra.row_height || (bb.y1 - bb.y0);
          var bl = ln.baseline || {}, hasBl = bl.has_baseline !== false && bl.x1 > bl.x0;
          var slope = hasBl ? (bl.y1 - bl.y0) / (bl.x1 - bl.x0) : 0;
          var baseAt = function (x) { return hasBl ? bl.y0 + slope * (x - bl.x0) : bb.y1 - (ra.descenders || 0); };
          var lt = ln.text || '', ptr = 0, items = [], cur = null;
          ws.forEach(function (w) {
            var wt = w.text.trim(), at = lt.indexOf(wt, ptr), space;
            if (at >= 0) { space = /\s/.test(lt.slice(ptr, at)); ptr = at + wt.length; }
            else { space = cur ? (w.bbox.x0 - cur.x1) > 0.3 * h : true; }
            if (cur && !space) { cur.t += wt; cur.x1 = Math.max(cur.x1, w.bbox.x1); }
            else { cur = { x0: w.bbox.x0, x1: w.bbox.x1, t: wt, jp: items.length ? (space ? ' ' : '') : null }; items.push(cur); }
          });
          items.forEach(function (it) {
            var f = ocrFixText(it.t);
            fixes += f.n;
            if (f.t) { out.push([r(it.x0), r(baseAt((it.x0 + it.x1) / 2)), r(Math.max(1, it.x1 - it.x0)), r(h), f.t, it.jp]); }
          });
        });
      });
    });
    return { items: out, fixes: fixes };
  }
  function ocrLinesFor(items, pageW) {
    return items.map(function (a) {
      var ln = { x: a[0] * pageW, base: a[1] * pageW, w: Math.max(1, a[2] * pageW), h: a[3] * pageW, t: a[4], nulls: 0, ocr: true };
      if (typeof a[5] === 'string') { ln.jp = a[5]; }
      return ln;
    }).filter(function (ln) { return ln.t && ln.h >= 2; });
  }
  async function ocrCanvas(pg) {
    var vp1 = pg.proxy.getViewport({ scale: 1 }), sc = 2400 / vp1.width;
    if (vp1.width * sc * vp1.height * sc > 9e6) { sc = Math.sqrt(9e6 / (vp1.width * vp1.height)); }
    var vp = pg.proxy.getViewport({ scale: sc }), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(vp.width)); c.height = Math.max(1, Math.round(vp.height));
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
    await pg.proxy.render({ canvasContext: g, viewport: vp }).promise;
    return c;
  }
  var OCR_STATUS = {
    'loading tesseract core': '下載文字辨識程式', 'initializing tesseract': '啟動文字辨識程式',
    'loading language traineddata': '下載泰文、英文辨識資料', 'loading language traineddata (from cache)': '讀取辨識資料',
    'initializing api': '準備辨識', 'initialized api': '準備辨識'
  };
  function setOcrMsg(t) { ocr.msg = t; ocr.msgId = pdf ? pdf.id : ''; var el = $('ocrmsg'); if (el) { el.textContent = t; } }
  function ocrNeed() {
    if (!pdf || !pdf.quality) { return []; }
    return pdf.quality.filter(function (q) { return q.st === 'empty' || q.st === 'broken'; }).map(function (q) { return q.n; });
  }
  function ocrHavePages() { return pdf && pdf.quality ? pdf.quality.filter(function (q) { return q.st === 'ocr'; }).map(function (q) { return q.n; }) : []; }
  function ocrHave() { return pdf && pdf.quality ? pdf.quality.filter(function (q) { return q.st === 'ocr'; }).length : 0; }
  function renderOcrBox() {
    var box = $('ocrbox');
    if (!box) { return; }
    if (!pdf) { box.hidden = true; if (typeof syncDocSec === 'function') { syncDocSec(); } return; }
    if (ocr.msgId && ocr.msgId !== pdf.id && !ocr.busy) { ocr.msg = ''; ocr.msgId = ''; }
    var need = ocrNeed(), have = ocrHave();
    box.hidden = !need.length && !have && !ocr.busy && !ocr.msg;
    $('ocrGo').hidden = ocr.busy || !need.length;
    $('ocrGo').textContent = '用文字辨識讀' + (need.length === pdf.pages.length ? '全部 ' : '這 ') + need.length + ' 頁';
    $('ocrStop').hidden = !ocr.busy;
    $('ocrRedo').hidden = ocr.busy || !have;
    function pageList(ns) { return ns.length === pdf.pages.length && ns.length > 1 ? '全部頁面' : '第 ' + ns.slice(0, 10).join('、') + (ns.length > 10 ? '…' : '') + ' 頁'; }
    var haveN = ocrHavePages(), lines = [];
    if (need.length) { lines.push(pageList(need) + '讀不到文字（掃描或照片），可以用文字辨識讀出來'); }
    if (haveN.length) { lines.push(pageList(haveN) + '由文字辨識讀出，可能有錯字'); }
    $('ocrmsg').textContent = ocr.busy || ocr.msg ? ocr.msg : lines.join('；');
    if (typeof syncDocSec === 'function') { syncDocSec(); }
    if (ocr.autoId && ocr.autoId === pdf.id && need.length && !ocr.busy) { ocr.autoId = ''; setTimeout(function () { runOcr(need); }, 50); }
  }
  async function runOcr(nums) {
    if (!pdf || ocr.busy || !nums || !nums.length) { return; }
    var doc = pdf, id = pdf.id, name = pdf.name, t0 = Date.now();
    ocr.busy = true; ocr.stop = false; ocr.done = 0; ocr.total = nums.length; ocr.lastError = ''; ocr.fixes = 0;
    ocr.onlog = function (m) {
      if (!m || !m.status) { return; }
      var pct = typeof m.progress === 'number' && m.progress > 0 && m.progress < 1 ? ' ' + Math.round(m.progress * 100) + '%' : '';
      if (m.status === 'recognizing text') { setOcrMsg('辨識第 ' + ocr.page + ' 頁（' + (ocr.done + 1) + ' / ' + ocr.total + '）…' + pct); }
      else if (OCR_STATUS[m.status]) { setOcrMsg(OCR_STATUS[m.status] + '…' + pct); }
    };
    setOcrMsg('準備文字辨識工具…（第一次要下載約 8 MB，之後就不用）');
    renderOcrBox();
    try {
      var w = await ensureOcr();
      var store = (await ocrLoad(id)) || { v: 1, pages: {} };
      for (var i = 0; i < nums.length; i++) {
        if (ocr.stop || pdf !== doc) { break; }
        var n = nums[i], pg = doc.pages[n - 1];
        if (!pg) { continue; }
        ocr.page = n;
        setOcrMsg('辨識第 ' + n + ' 頁（' + (i + 1) + ' / ' + nums.length + '）…');
        var c = await ocrCanvas(pg), cw = c.width;
        var res = await w.recognize(c, {}, { blocks: true, text: false, hocr: false, tsv: false });
        c.width = 0; c.height = 0;
        var got = ocrItems(res.data, cw);
        store.pages[n] = got.items; store.at = Date.now();
        ocr.fixes += got.fixes;
        await ocrSave(id, store);
        ocr.done++;
      }
    } catch (err) {
      ocr.lastError = String(err && err.message || err).slice(0, 120);
    } finally { ocr.busy = false; ocr.onlog = null; }
    ocr.ms = Date.now() - t0;
    var fail = ocr.lastError ? '文字辨識出錯：' + ocr.lastError + '。' : '';
    if (ocr.done && pdf === doc) {
      try {
        save();
        var bytes = await idbGet(id);
        await openPdfBytes(new Uint8Array(bytes), name, true);
      } catch (err) { fail += '重新整理頁面時出錯：' + String(err && err.message || err).slice(0, 80); }
      setOcrMsg(fail);
    } else {
      setOcrMsg(fail || (ocr.stop ? '已停止。' : '沒有辨識任何頁面。'));
    }
    renderOcrBox(); renderReport();
  }
  $('ocrGo').addEventListener('click', function () { runOcr(ocrNeed()); });
  $('ocrStop').addEventListener('click', function () { ocr.stop = true; setOcrMsg('辨識完這一頁就停止…'); });
  $('ocrRedo').addEventListener('click', function () { runOcr(ocrHavePages()); });

  /* ---------- 加入圖片：照片、截圖變成一份 PDF 文件，再自動做文字辨識 ---------- */
  function ocrLoadImage(f) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(f), im = new Image();
      im.onload = function () { res({ im: im, url: u }); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('讀不了這張圖片：' + f.name)); };
      im.src = u;
    });
  }
  async function imagesToPdf(files, onStep) {
    await ensureLibs();
    var L = window.PDFLib, doc = await L.PDFDocument.create();
    for (var i = 0; i < files.length; i++) {
      if (onStep) { onStep(i); }
      var o = await ocrLoadImage(files[i]), im = o.im;
      var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(1, 2600 / Math.max(iw, ih));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(iw * k)); c.height = Math.max(1, Math.round(ih * k));
      var g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(o.url);
      var blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.88); });
      if (!blob) { throw new Error('圖片太大，轉不了：' + files[i].name); }
      var jpg = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      var pw = 595.28, ph = pw * c.height / c.width;
      doc.addPage([pw, ph]).drawImage(jpg, { x: 0, y: 0, width: pw, height: ph });
      c.width = 0; c.height = 0;
    }
    return await doc.save();
  }
  function libAddImages(files) {
    var list = Array.prototype.slice.call(files || []).filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|heic|heif|webp|gif|bmp)$/i.test(f.name); });
    if (!list.length) { $('homeMsg').textContent = '請選圖片（照片或截圖）。'; return; }
    var first = list[0].name.replace(/\.[^.]+$/, '');
    var d = new Date(), z = function (n) { return ('0' + n).slice(-2); };
    var stamp = d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
    var name = (/^(image|img_?\d*|photo|圖片)$/i.test(first) || list.length > 1 ? '圖片 ' + stamp : first) + '.pdf';
    imagesToPdf(list, function (i) { $('homeMsg').textContent = '把圖片做成文件…（' + (i + 1) + ' / ' + list.length + '）'; }).then(function (bytes) {
      var id = name + '|' + bytes.length;
      return idbPut(id, bytes).then(function () {
        if (!docById(id)) { lib.docs.push({ id: id, name: name, type: 'pdf', size: bytes.length, pages: list.length, added: Date.now(), opened: 0, folder: libTarget(), img: true }); }
        saveLib();
        $('homeMsg').textContent = '已做成文件「' + name + '」（' + list.length + ' 頁），正在打開並開始文字辨識…';
        setTimeout(function () { $('homeMsg').textContent = ''; }, 8000);
        ocr.autoId = id;
        renderHome();
        openDoc(id);
      });
    }).catch(function (err) { $('homeMsg').textContent = '加入圖片失敗：' + String(err && err.message || err); });
  }
  $('imgfile').addEventListener('change', function () { var fs = this.files; libAddImages(fs); this.value = ''; });
