/* OpenThai2.0-OCR-Text 在瀏覽器裡跑（onnxruntime-web）：偵測文字行 → 逐行辨識 */
(function (root) {
  var DET = { limit: 1280, thresh: 0.2, boxThresh: 0.4, unclip: 1.4, minSize: 3 };
  var REC = { height: 48, maxW: 3200, dropBelow: 0.65, minChars: 2 };
  var det = null, rec = null, chars = null;
  async function load(base, opts) {
    if (det) { return; }
    var o = Object.assign({ executionProviders: ['wasm'], graphOptimizationLevel: 'all' }, opts || {});
    var txt = await (await fetch(base + 'rec_dict.txt')).text();
    chars = [''].concat(txt.split('\n').filter(function (c) { return c; })).concat([' ']);
    det = await ort.InferenceSession.create(base + 'det.onnx', o);
    rec = await ort.InferenceSession.create(base + 'rec.onnx', o);
  }
  function canvasOf(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  async function detect(src) {
    var W0 = src.width, H0 = src.height, pad = Math.max(8, Math.floor(0.05 * Math.min(W0, H0)));
    var w = W0 + 2 * pad, h = H0 + 2 * pad;
    var s = Math.min(DET.limit / Math.max(w, h), 4);
    var rw = Math.max(32, Math.round(w * s / 32) * 32), rh = Math.max(32, Math.round(h * s / 32) * 32);
    var c = canvasOf(rw, rh), g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, rw, rh); g.imageSmoothingQuality = 'high';
    g.drawImage(src, pad * rw / w, pad * rh / h, W0 * rw / w, H0 * rh / h);
    var d = g.getImageData(0, 0, rw, rh).data, n = rw * rh, x = new Float32Array(3 * n);
    var M = [0.485, 0.456, 0.406], SD = [0.229, 0.224, 0.225];
    /* 模型吃 BGR 順序 */
    for (var i = 0; i < n; i++) {
      x[i] = (d[i * 4 + 2] / 255 - M[0]) / SD[0];
      x[n + i] = (d[i * 4 + 1] / 255 - M[1]) / SD[1];
      x[2 * n + i] = (d[i * 4] / 255 - M[2]) / SD[2];
    }
    var feeds = {}; feeds[det.inputNames[0]] = new ort.Tensor('float32', x, [1, 3, rh, rw]);
    var out = (await det.run(feeds))[det.outputNames[0]];
    var ph = out.dims[2], pw = out.dims[3], prob = out.data;
    /* 連通區塊 → 外接框（先不處理歪斜） */
    var lab = new Int32Array(pw * ph), boxes = [], stack = [];
    for (var p0 = 0; p0 < pw * ph; p0++) {
      if (lab[p0] || prob[p0] <= DET.thresh) { continue; }
      var id = boxes.length + 1, x0 = pw, x1 = 0, y0 = ph, y1 = 0, sum = 0, cnt = 0;
      stack.push(p0); lab[p0] = id;
      while (stack.length) {
        var q = stack.pop(), qx = q % pw, qy = (q - qx) / pw;
        sum += prob[q]; cnt++;
        if (qx < x0) { x0 = qx; } if (qx > x1) { x1 = qx; } if (qy < y0) { y0 = qy; } if (qy > y1) { y1 = qy; }
        for (var dy = -1; dy <= 1; dy++) { for (var dx = -1; dx <= 1; dx++) {
          var nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) { continue; }
          var r = ny * pw + nx; if (!lab[r] && prob[r] > DET.thresh) { lab[r] = id; stack.push(r); }
        } }
      }
      boxes.push({ x0: x0, y0: y0, x1: x1 + 1, y1: y1 + 1, score: sum / cnt, cnt: cnt });
    }
    var sx = w / pw, sy = h / ph, res = [];
    boxes.forEach(function (b) {
      var bw = b.x1 - b.x0, bh = b.y1 - b.y0;
      if (Math.min(bw, bh) < DET.minSize || b.score < DET.boxThresh) { return; }
      var dist = bw * bh * DET.unclip / (2 * (bw + bh));
      var X0 = Math.max(0, (b.x0 - dist) * sx - pad), Y0 = Math.max(0, (b.y0 - dist) * sy - pad);
      var X1 = Math.min(W0, (b.x1 + dist) * sx - pad), Y1 = Math.min(H0, (b.y1 + dist) * sy - pad);
      if (X1 - X0 >= 2 && Y1 - Y0 >= 2) { res.push({ x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0, score: b.score }); }
    });
    return res;
  }
  /* 讀的順序：由上到下分列，同一列由左到右 */
  function order(boxes) {
    var hs = boxes.map(function (b) { return b.h; }).sort(function (a, b) { return a - b; }), hm = hs[hs.length >> 1] || 1;
    var bs = boxes.slice().sort(function (a, b) { return (a.y + a.h / 2) - (b.y + b.h / 2); }), rows = [];
    bs.forEach(function (b) {
      var cy = b.y + b.h / 2, row = rows[rows.length - 1];
      if (row && Math.abs(cy - row.cy) < hm * 0.5) { row.items.push(b); row.cy = (row.cy * (row.items.length - 1) + cy) / row.items.length; }
      else { rows.push({ cy: cy, items: [b] }); }
    });
    rows.forEach(function (r) { r.items.sort(function (a, b) { return a.x - b.x; }); });
    return rows;
  }
  function flatten(gray, w, h) {
    var k = Math.max(2, Math.floor(h / 6)), bg = new Float32Array(w), col = [], x, y;
    for (x = 0; x < w; x++) {
      col.length = 0;
      for (y = 0; y < k; y++) { col.push(gray[y * w + x], gray[(h - 1 - y) * w + x]); }
      col.sort(function (a, b) { return a - b; }); bg[x] = col[col.length >> 1];
    }
    var win = Math.max(3, Math.min(h | 1, 255)), half = win >> 1, bg2 = new Float32Array(w), tmp = [];
    for (x = 0; x < w; x++) { tmp.length = 0; for (var j = Math.max(0, x - half); j <= Math.min(w - 1, x + half); j++) { tmp.push(bg[j]); } tmp.sort(function (a, b) { return a - b; }); bg2[x] = tmp[tmp.length >> 1]; }
    var d = new Float32Array(w * h), hist = new Uint32Array(256);
    for (y = 0; y < h; y++) { for (x = 0; x < w; x++) { var v = Math.abs(gray[y * w + x] - bg2[x]); d[y * w + x] = v; hist[Math.min(255, v | 0)]++; } }
    var tot = w * h, acc = 0, hi = 255;
    for (var i = 0; i < 256; i++) { acc += hist[i]; if (acc >= 0.98 * tot) { hi = i; break; } }
    hi = Math.max(hi, 24);
    var out = new Float32Array(w * h);
    for (i = 0; i < w * h; i++) { out[i] = 255 - Math.max(0, Math.min(255, d[i] * 255 / hi)); }
    return out;
  }
  function canonical(t) {
    t = t.normalize('NFC').replace(/[​-‍⁠­﻿]/g, '').replace(/ /g, ' ');
    t = t.replace(/([่-๋]?)ํ([่-๋]?)า/g, '$1$2ำ').replace(/เเ/g, 'แ').replace(/ำำ/g, 'ำ');
    return t.replace(/[ \t]+/g, ' ').trim();
  }
  async function readLine(src, b) {
    var H = REC.height, rw = Math.min(REC.maxW, Math.max(16, Math.ceil(H * b.w / Math.max(b.h, 1))));
    var c = canvasOf(rw, H), g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high'; g.drawImage(src, b.x, b.y, b.w, b.h, 0, 0, rw, H);
    var d = g.getImageData(0, 0, rw, H).data, n = rw * H, gray = new Float32Array(n);
    for (var i = 0; i < n; i++) { gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; }
    var f = flatten(gray, rw, H), x = new Float32Array(3 * n);
    for (i = 0; i < n; i++) { var v = (f[i] / 255 - 0.5) / 0.5; x[i] = v; x[n + i] = v; x[2 * n + i] = v; }
    var feeds = {}; feeds[rec.inputNames[0]] = new ort.Tensor('float32', x, [1, 3, H, rw]);
    var out = (await rec.run(feeds))[rec.outputNames[0]], T = out.dims[1], C = out.dims[2], p = out.data;
    var text = '', probs = [], prev = -1, pos = [];
    for (var t = 0; t < T; t++) {
      var best = 0, bp = p[t * C];
      for (var k = 1; k < C; k++) { if (p[t * C + k] > bp) { bp = p[t * C + k]; best = k; } }
      if (best !== prev && best !== 0) { var ch = chars[best] || ''; text += ch; probs.push(bp); for (var q = 0; q < ch.length; q++) { pos.push(t / T); } }
      prev = best;
    }
    var conf = probs.length ? probs.reduce(function (a, b2) { return a + b2; }, 0) / probs.length : 0;
    /* 每個詞（用空白分開）在這一行裡的左右位置 */
    var words = [], re = /\S+/g, m, step = 1 / T;
    while ((m = re.exec(text))) {
      var a = pos[m.index], z = pos[m.index + m[0].length - 1];
      words.push({ text: canonical(m[0]), x0: b.x + b.w * Math.max(0, a - step), x1: b.x + b.w * Math.min(1, z + 2 * step) });
    }
    return { text: canonical(text), conf: conf, words: words.filter(function (w) { return w.text; }) };
  }
  async function read(src) {
    var t0 = performance.now(), boxes = await detect(src), t1 = performance.now(), rows = order(boxes), lines = [], dropped = [];
    for (var r = 0; r < rows.length; r++) {
      var parts = [];
      for (var i = 0; i < rows[r].items.length; i++) {
        var b = rows[r].items[i], o = await readLine(src, b);
        if (o.conf >= REC.dropBelow && o.text.length >= REC.minChars && !(o.text.length <= 2 && o.conf < 0.92)) { parts.push(o.text); lines.push({ text: o.text, conf: o.conf, box: b, row: r, words: o.words }); }
        else { dropped.push({ box: b, conf: o.conf, text: o.text }); }
      }
    }
    var text = '', last = -1; lines.forEach(function (l) { text += (last < 0 ? '' : (l.row === last ? ' ' : '\n')) + l.text; last = l.row; });
    return { text: text, lines: lines, dropped: dropped, ms: { det: t1 - t0, rec: performance.now() - t1 }, boxes: boxes.length };
  }
  /* 交回和 Tesseract 一樣形狀的資料，App 原本整理辨識結果的程式可以直接用 */
  function lineData(l) {
    var b = l.box, h = b.h, base = b.y + h * 0.76, c100 = Math.round(l.conf * 100);
    return { text: l.text, confidence: c100, bbox: { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + h },
      rowAttributes: { row_height: h * 0.82, descenders: h * 0.24 }, baseline: { x0: b.x, y0: base, x1: b.x + b.w, y1: base, has_baseline: true },
      words: l.words.map(function (w) { return { text: w.text, confidence: c100, bbox: { x0: w.x0, y0: b.y, x1: w.x1, y1: b.y + h } }; }) };
  }
  async function recognize(src) {
    var r = await read(src);
    return { data: { text: r.text, blocks: [{ paragraphs: [{ lines: r.lines.map(lineData) }] }] }, dropped: r.dropped, ms: r.ms, lines: r.lines };
  }
  root.ThaiOCR = { load: load, read: read, recognize: recognize, detect: detect, ready: function () { return !!rec; }, cfg: { DET: DET, REC: REC } };
})(window);
