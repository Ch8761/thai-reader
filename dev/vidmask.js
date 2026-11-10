  /* 字幕清理：把框裡的畫面放大，找出「周圍一圈都是深色」的亮色字塊（有黑邊或黑底的字幕），其他背景通通變白，
     再只留排成一行一行的字，縮放到文字辨識最認得的大小。inv＝深色字（白邊）。 */
  function vidMask(src, sw, sh, rx, inv, maxW, target) {
    var x0 = Math.round(rx[0] * sw), y0 = Math.round(rx[1] * sh), w = Math.max(8, Math.round(rx[2] * sw)), h = Math.max(8, Math.round(rx[3] * sh));
    var k = Math.min(2.5, (maxW || 1280) / w);
    var W = Math.max(8, Math.round(w * k)), H = Math.max(8, Math.round(h * k));
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, x0, y0, w, h, 0, 0, W, H);
    var d = g.getImageData(0, 0, W, H).data, n = W * H;
    var lum = new Uint8Array(n), fg = new Uint8Array(n), i, j, x, y, q, m, v;
    for (i = 0, j = 0; j < n; i += 4, j++) {
      var r = d[i], gg = d[i + 1], b = d[i + 2], L = (r * 3 + gg * 6 + b) / 10, sat = Math.max(r, gg, b) - Math.min(r, gg, b);
      lum[j] = inv ? 255 - L : L;
      fg[j] = inv ? (L < 80 ? 1 : 0) : (L > 170 && (sat < 80 || (r > 170 && gg > 150 && b < 130)) ? 1 : 0);
    }
    var R = Math.max(2, Math.round(3 * Math.max(1, k * 0.8))), mn = new Uint8Array(n), tmp = new Uint8Array(n);
    for (y = 0; y < H; y++) { var row = y * W; for (x = 0; x < W; x++) { m = 255; for (q = Math.max(0, x - R); q <= Math.min(W - 1, x + R); q++) { v = lum[row + q]; if (v < m) { m = v; } } tmp[row + x] = m; } }
    for (x = 0; x < W; x++) { for (y = 0; y < H; y++) { m = 255; for (q = Math.max(0, y - R); q <= Math.min(H - 1, y + R); q++) { v = tmp[q * W + x]; if (v < m) { m = v; } } mn[y * W + x] = m; } }
    var lab = new Int32Array(n).fill(-1), comps = [], stack = new Int32Array(n);
    for (j = 0; j < n; j++) {
      if (!fg[j] || lab[j] >= 0) { continue; }
      var id = comps.length, sp = 0, cp = { area: 0, edge: 0, good: 0, x0: W, x1: 0, y0: H, y1: 0 };
      stack[sp++] = j; lab[j] = id;
      while (sp) {
        var p = stack[--sp], px = p % W, py = (p - px) / W, edge = false;
        cp.area++;
        if (px < cp.x0) { cp.x0 = px; } if (px > cp.x1) { cp.x1 = px; } if (py < cp.y0) { cp.y0 = py; } if (py > cp.y1) { cp.y1 = py; }
        if (px > 0) { q = p - 1; if (!fg[q]) { edge = true; } else if (lab[q] < 0) { lab[q] = id; stack[sp++] = q; } } else { edge = true; }
        if (px < W - 1) { q = p + 1; if (!fg[q]) { edge = true; } else if (lab[q] < 0) { lab[q] = id; stack[sp++] = q; } } else { edge = true; }
        if (py > 0) { q = p - W; if (!fg[q]) { edge = true; } else if (lab[q] < 0) { lab[q] = id; stack[sp++] = q; } } else { edge = true; }
        if (py < H - 1) { q = p + W; if (!fg[q]) { edge = true; } else if (lab[q] < 0) { lab[q] = id; stack[sp++] = q; } } else { edge = true; }
        if (edge) { cp.edge++; if (lum[p] - mn[p] > 100) { cp.good++; } }
      }
      cp.h = cp.y1 - cp.y0 + 1; cp.w = cp.x1 - cp.x0 + 1;
      cp.ok = cp.area >= 5 * k && cp.h < H * 0.7 && cp.w < W * 0.5 && cp.good / cp.edge >= 0.7;
      comps.push(cp);
    }
    var ok = comps.filter(function (cp) { return cp.ok; });
    var out = { canvas: null, sig: null, medH: 0, n: 0 };
    if (ok.length < 2) { return out; }
    /* 字的高度：大的字塊（不含聲調符號這類小點）的中位數 */
    var big = ok.slice().sort(function (a, b) { return b.area - a.area; }).slice(0, Math.max(3, Math.ceil(ok.length * 0.6)));
    var hs = big.map(function (cp) { return cp.h; }).sort(function (a, b) { return a - b; }), medH = hs[Math.floor(hs.length / 2)];
    /* 一行一行：被兩個以上字塊蓋到的高度範圍 */
    var cover = new Uint16Array(H);
    big.forEach(function (cp) { if (cp.h >= medH * 0.5 && cp.h <= medH * 2.2) { for (var yy = cp.y0; yy <= cp.y1; yy++) { cover[yy]++; } } });
    var bands = [], cur = null, gapMax = Math.round(medH * 0.3), gap = 0;
    for (y = 0; y < H; y++) {
      if (cover[y] >= 2) { if (!cur) { cur = { y0: y, y1: y }; bands.push(cur); } cur.y1 = y; gap = 0; }
      else if (cur) { gap++; if (gap > gapMax) { cur = null; } }
    }
    if (!bands.length) { return out; }
    bands.forEach(function (bd) {
      bd.e0 = bd.y0 - medH * 0.7; bd.e1 = bd.y1 + medH * 0.6;
      bd.items = ok.filter(function (cp) { var cy = (cp.y0 + cp.y1) / 2; return cy >= bd.e0 && cy <= bd.e1 && cp.h <= medH * 2.5; });
      /* 同一行裡離太遠的零星字塊（背景上的其他字）不要 */
      bd.items.sort(function (a, b) { return a.x0 - b.x0; });
      var cl = [], cc = null;
      bd.items.forEach(function (cp) { if (!cc || cp.x0 - cc.x1 > medH * 1.2) { cc = { x1: cp.x1, area: 0, items: [] }; cl.push(cc); } cc.items.push(cp); cc.area += cp.area; cc.x1 = Math.max(cc.x1, cp.x1); });
      var best = cl.reduce(function (a, b2) { return b2.area > a ? b2.area : a; }, 0);
      bd.items = []; cl.forEach(function (c2) {
        /* 字比較矮的一群（背景上的小字）不要 */
        var hh = c2.items.filter(function (cp) { return cp.area >= medH * medH * 0.08; }).map(function (cp) { return cp.h; }).sort(function (a, b) { return a - b; });
        var mh = hh.length ? hh[Math.floor(hh.length / 2)] : 0;
        if (c2.area >= best * 0.15 && c2.items.length >= 2 && mh >= medH * 0.65) { bd.items = bd.items.concat(c2.items); }
      });
      bd.area = bd.items.reduce(function (s, cp) { return s + cp.area; }, 0);
    });
    var top = bands.reduce(function (a, b2) { return b2.area > a ? b2.area : a; }, 0);
    var keepIds = {}, kept = [];
    bands.forEach(function (bd) { if (bd.area >= top * 0.25 && bd.items.length >= 3) { bd.items.forEach(function (cp) { if (!keepIds[comps.indexOf(cp)]) { keepIds[comps.indexOf(cp)] = 1; kept.push(cp); } }); } });
    if (!kept.length) { return out; }
    var bx0 = W, bx1 = 0, by0 = H, by1 = 0;
    kept.forEach(function (cp) { bx0 = Math.min(bx0, cp.x0); bx1 = Math.max(bx1, cp.x1); by0 = Math.min(by0, cp.y0); by1 = Math.max(by1, cp.y1); });
    var pad = Math.round(medH * 0.8), cx0 = Math.max(0, bx0 - pad), cy0 = Math.max(0, by0 - pad), cw = Math.min(W, bx1 + pad + 1) - cx0, ch = Math.min(H, by1 + pad + 1) - cy0;
    /* 縮放：讓字高大約是 target 像素（文字辨識最準的大小） */
    var s = Math.max(0.25, Math.min(2, (target || 20) / medH));
    var OW = Math.max(8, Math.round(cw * s)), OH = Math.max(8, Math.round(ch * s));
    var full = new Uint8ClampedArray(cw * ch * 4);
    for (y = 0; y < ch; y++) { for (x = 0; x < cw; x++) { var L2 = lab[(y + cy0) * W + x + cx0], on = L2 >= 0 && keepIds[L2], o = (y * cw + x) * 4; full[o] = full[o + 1] = full[o + 2] = on ? 0 : 255; full[o + 3] = 255; } }
    var mc = document.createElement('canvas'); mc.width = cw; mc.height = ch; mc.getContext('2d').putImageData(new ImageData(full, cw, ch), 0, 0);
    var oc = document.createElement('canvas'); oc.width = OW; oc.height = OH;
    var og = oc.getContext('2d'); og.imageSmoothingQuality = 'high'; og.fillStyle = '#fff'; og.fillRect(0, 0, OW, OH); og.drawImage(mc, 0, 0, OW, OH);
    /* 比對畫面有沒有換字幕用的「指紋」：字塊的位置和大小 */
    var sig = kept.map(function (cp) { return [Math.round(cp.x0 / medH * 2), Math.round(cp.y0 / medH * 2), Math.round(cp.area / (medH * medH) * 8)]; });
    out.canvas = oc; out.sig = sig; out.medH = medH / k; out.n = kept.length; out.box = [(bx0 / k + x0) / sw, (by0 / k + y0) / sh, ((bx1 - bx0) / k) / sw, ((by1 - by0) / k) / sh];
    return out;
  }
  /* 兩次的字塊指紋差多少（0＝一樣，1＝完全不同） */
  function vidSigDiff(a, b) {
    if (!a || !b) { return a === b ? 0 : 1; }
    var used = {}, hit = 0;
    a.forEach(function (p) { for (var z = 0; z < b.length; z++) { if (used[z]) { continue; } var o = b[z]; if (Math.abs(o[0] - p[0]) <= 1 && Math.abs(o[1] - p[1]) <= 1 && Math.abs(o[2] - p[2]) <= Math.max(2, p[2] * 0.3)) { used[z] = 1; hit++; return; } } });
    return 1 - hit / Math.max(a.length, b.length);
  }
