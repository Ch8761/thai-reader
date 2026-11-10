/* preprocess: returns canvas with black text on white, from source canvas region */
window.__pre = function (src, rx, mode) {
  var sw = src.width, sh = src.height;
  var x0 = Math.round(rx[0] * sw), y0 = Math.round(rx[1] * sh), w = Math.round(rx[2] * sw), h = Math.round(rx[3] * sh);
  var k = Math.min(3, Math.max(1, 1600 / w));
  var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  var g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, x0, y0, w, h, 0, 0, c.width, c.height);
  if (mode === 'raw') { return c; }
  var W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), d = im.data, n = W * H;
  var lum = new Uint8Array(n), sat = new Uint8Array(n);
  for (var i = 0, j = 0; j < n; i += 4, j++) { var r = d[i], gg = d[i + 1], b = d[i + 2]; lum[j] = (r * 3 + gg * 6 + b) / 10; sat[j] = Math.max(r, gg, b) - Math.min(r, gg, b); }
  var out = new Uint8Array(n);
  if (mode === 'gray') {
    for (j = 0; j < n; j++) { out[j] = lum[j]; }
  } else {
    var bright = new Uint8Array(n), dark = new Uint8Array(n);
    var dk = mode === 'dark';
    for (j = 0; j < n; j++) {
      if (dk) { bright[j] = lum[j] < 70 ? 1 : 0; dark[j] = lum[j] > 190 ? 1 : 0; }
      else { bright[j] = (lum[j] > 175 && (sat[j] < 70 || (d[j * 4] > 170 && d[j * 4 + 1] > 150 && d[j * 4 + 2] < 120))) ? 1 : 0; dark[j] = lum[j] < 75 ? 1 : 0; }
    }
    var keep = bright;
    if (mode === 'outline' || mode === 'dark') {
      /* keep bright pixels that have a dark pixel within R (outline or dark box) */
      var R = Math.max(2, Math.round(5 * k));
      /* horizontal then vertical max filter of dark */
      var tmp = new Uint8Array(n), near = new Uint8Array(n);
      for (var y = 0; y < H; y++) { var run = -1e9; for (var x = 0; x < W; x++) { if (dark[y * W + x]) { run = x; } tmp[y * W + x] = x - run <= R ? 1 : 0; } run = 1e9; for (x = W - 1; x >= 0; x--) { if (dark[y * W + x]) { run = x; } if (run - x <= R) { tmp[y * W + x] = 1; } } }
      for (x = 0; x < W; x++) { run = -1e9; for (y = 0; y < H; y++) { if (tmp[y * W + x]) { run = y; } near[y * W + x] = y - run <= R ? 1 : 0; } run = 1e9; for (y = H - 1; y >= 0; y--) { if (tmp[y * W + x]) { run = y; } if (run - y <= R) { near[y * W + x] = 1; } } }
      keep = new Uint8Array(n); for (j = 0; j < n; j++) { keep[j] = bright[j] && near[j] ? 1 : 0; }
    }
    for (j = 0; j < n; j++) { out[j] = keep[j] ? 0 : 255; }
  }
  for (i = 0, j = 0; j < n; i += 4, j++) { d[i] = d[i + 1] = d[i + 2] = out[j]; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return c;
};
window.__ocrTest = async function (url, rx, mode) {
  var img = new Image(); img.src = url; await img.decode();
  var s = document.createElement('canvas'); s.width = img.width; s.height = img.height; s.getContext('2d').drawImage(img, 0, 0);
  var c = window.__pre(s, rx, mode);
  var w = await window.__ev('ensureOcr()');
  var res = await w.recognize(c, {}, { blocks: true, text: true });
  var lines = []; (res.data.blocks || []).forEach(function (b) { b.paragraphs.forEach(function (p) { p.lines.forEach(function (l) { lines.push(Math.round(l.confidence) + ' ' + l.text.trim()); }); }); });
  return { lines: lines, png: c.toDataURL() };
};
/* connected components: keep bright (or dark when inv) blobs whose edge has strong contrast all around (outline / box) */
window.__cc = function (src, rx, inv) {
  var sw = src.width, sh = src.height;
  var x0 = Math.round(rx[0] * sw), y0 = Math.round(rx[1] * sh), w = Math.round(rx[2] * sw), h = Math.round(rx[3] * sh);
  var k = Math.min(3, Math.max(1, 1600 / w));
  var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  var g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, x0, y0, w, h, 0, 0, c.width, c.height);
  var W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), d = im.data, n = W * H;
  var lum = new Uint8Array(n), fg = new Uint8Array(n);
  for (var i = 0, j = 0; j < n; i += 4, j++) {
    var r = d[i], gg = d[i + 1], b = d[i + 2], L = (r * 3 + gg * 6 + b) / 10;
    lum[j] = inv ? 255 - L : L;
    var sat = Math.max(r, gg, b) - Math.min(r, gg, b);
    fg[j] = inv ? (L < 80 ? 1 : 0) : (L > 170 && (sat < 80 || (r > 170 && gg > 150 && b < 130)) ? 1 : 0);
  }
  /* min filter of lum, radius R */
  var R = Math.max(2, Math.round(3 * k)), mn = new Uint8Array(n), tmp = new Uint8Array(n);
  for (var y = 0; y < H; y++) { for (var x = 0; x < W; x++) { var m = 255; for (var q = Math.max(0, x - R); q <= Math.min(W - 1, x + R); q++) { var v = lum[y * W + q]; if (v < m) { m = v; } } tmp[y * W + x] = m; } }
  for (x = 0; x < W; x++) { for (y = 0; y < H; y++) { m = 255; for (q = Math.max(0, y - R); q <= Math.min(H - 1, y + R); q++) { v = tmp[q * W + x]; if (v < m) { m = v; } } mn[y * W + x] = m; } }
  /* label */
  var lab = new Int32Array(n).fill(-1), comps = [], stack = new Int32Array(n);
  for (j = 0; j < n; j++) {
    if (!fg[j] || lab[j] >= 0) { continue; }
    var id = comps.length, sp = 0, area = 0, edge = 0, good = 0, minx = W, maxx = 0, miny = H, maxy = 0;
    stack[sp++] = j; lab[j] = id;
    while (sp) {
      var p = stack[--sp], px = p % W, py = (p - px) / W; area++;
      if (px < minx) { minx = px; } if (px > maxx) { maxx = px; } if (py < miny) { miny = py; } if (py > maxy) { maxy = py; }
      var isEdge = false;
      var nb = [px > 0 ? p - 1 : -1, px < W - 1 ? p + 1 : -1, py > 0 ? p - W : -1, py < H - 1 ? p + W : -1];
      for (var t = 0; t < 4; t++) { var o = nb[t]; if (o < 0) { isEdge = true; continue; } if (!fg[o]) { isEdge = true; } else if (lab[o] < 0) { lab[o] = id; stack[sp++] = o; } }
      if (isEdge) { edge++; if (lum[p] - mn[p] > 100) { good++; } }
    }
    comps.push({ area: area, edge: edge, good: good, x0: minx, x1: maxx, y0: miny, y1: maxy });
  }
  var keep = comps.map(function (cp) {
    var ch = cp.y1 - cp.y0 + 1, cw = cp.x1 - cp.x0 + 1;
    return cp.area >= 6 * k && ch < H * 0.7 && cw < W * 0.5 && cp.good / cp.edge >= 0.7;
  });
  var out = new Uint8ClampedArray(n * 4), bx0 = W, bx1 = 0, by0 = H, by1 = 0, kept = 0;
  for (j = 0; j < n; j++) { var on = lab[j] >= 0 && keep[lab[j]]; var vv = on ? 0 : 255; out[j * 4] = out[j * 4 + 1] = out[j * 4 + 2] = vv; out[j * 4 + 3] = 255; }
  comps.forEach(function (cp, z) { if (keep[z]) { kept++; bx0 = Math.min(bx0, cp.x0); bx1 = Math.max(bx1, cp.x1); by0 = Math.min(by0, cp.y0); by1 = Math.max(by1, cp.y1); } });
  g.putImageData(new ImageData(out, W, H), 0, 0);
  if (!kept) { return null; }
  var pad = Math.round(16 * k), cx0 = Math.max(0, bx0 - pad), cy0 = Math.max(0, by0 - pad), cw2 = Math.min(W, bx1 + pad) - cx0, ch2 = Math.min(H, by1 + pad) - cy0;
  var o2 = document.createElement('canvas'); o2.width = cw2; o2.height = ch2; o2.getContext('2d').drawImage(c, cx0, cy0, cw2, ch2, 0, 0, cw2, ch2);
  return o2;
};
window.__ocrCC = async function (url, rx, inv, sc, psm) {
  var img = new Image(); img.src = url; await img.decode();
  var s = document.createElement('canvas'); s.width = img.width; s.height = img.height; s.getContext('2d').drawImage(img, 0, 0);
  var t0 = performance.now(); var c = window.__cc(s, rx, inv); var pre = performance.now() - t0;
  if (!c) { return { lines: [], png: null, pre: pre }; }
  if (sc && sc !== 1) { var c2 = document.createElement('canvas'); c2.width = Math.round(c.width * sc); c2.height = Math.round(c.height * sc); var g2 = c2.getContext('2d'); g2.imageSmoothingQuality = 'high'; g2.drawImage(c, 0, 0, c2.width, c2.height); c = c2; }
  var w = await window.__ev('ensureOcr()');
  await w.setParameters({ tessedit_pageseg_mode: String(psm || 3) });
  var res = await w.recognize(c, {}, { blocks: true, text: true });
  var lines = []; (res.data.blocks || []).forEach(function (b) { b.paragraphs.forEach(function (p) { p.lines.forEach(function (l) { lines.push(Math.round(l.confidence) + ' ' + l.text.trim()); }); }); });
  return { lines: lines, png: c.toDataURL(), pre: Math.round(pre) };
};
