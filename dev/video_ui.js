  /* ---------- 加入影片：每秒看一次畫面，畫面換了才做文字辨識，把泰文字幕整理成一份文字文件 ---------- */
  var vid = { busy: false, stop: false, debug: false, dbg: [] };
  var vbox = document.createElement('div'); vbox.className = 'vidbox'; vbox.id = 'vidbox'; vbox.hidden = true;
  vbox.innerHTML = '<div class="vb-row"><span class="vb-t" id="vidMsg" aria-live="polite"></span><button type="button" id="vidStop">停止</button><button type="button" class="primary" id="vidRetry" hidden>重新框字幕</button><button type="button" id="vidClose" hidden>關閉</button></div><div class="vb-bar"><span id="vidBar"></span></div>';
  $('homeMsg').parentNode.insertBefore(vbox, $('homeMsg').nextSibling);
  $('vidClose').addEventListener('click', function () { vbox.hidden = true; vid.retry = null; });
  $('vidRetry').addEventListener('click', function () { var r = vid.retry; vid.retry = null; if (r) { r(); } });
  function vidButtons(mode) { $('vidStop').hidden = mode !== 'run'; $('vidRetry').hidden = mode !== 'retry'; $('vidClose').hidden = mode !== 'retry'; }
  $('vidStop').addEventListener('click', function () { vid.stop = true; $('vidMsg').textContent = '停止中…已經讀到的字幕會保留。'; });
  function vidSeek(v, t) {
    return new Promise(function (res) {
      var done = false;
      function ok() { if (!done) { done = true; v.removeEventListener('seeked', ok); res(); } }
      v.addEventListener('seeked', ok);
      v.currentTime = t;
      setTimeout(ok, 3000);
    });
  }
  function vidLoad(f) {
    return new Promise(function (res, rej) {
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('playsinline', '');
      var u = URL.createObjectURL(f);
      v.onloadeddata = function () { res({ v: v, url: u }); };
      v.onerror = function () { URL.revokeObjectURL(u); rej(new Error('這個影片格式讀不了（建議用 iPad 的螢幕錄影或 MP4）')); };
      v.src = u;
      v.load();
    });
  }
  /* 比對用：去掉空白、標點，母音和聲調符號也拿掉（同一句字幕，辨識時常常掉幾個上面的符號） */
  function vidNorm(t) { return t.replace(/[\s.,!?'"“”‘’()\-–—…:;|]/g, '').replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, ''); }
  function vidLev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (j = 0; j <= n; j++) { d[j] = j; }
    for (i = 1; i <= m; i++) { var prev = d[0]; d[0] = i; for (j = 1; j <= n; j++) { var tmp = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = tmp; } }
    return d[n];
  }
  function vidSimilar(a, b) {
    if (!a || !b) { return false; }
    if (a === b) { return true; }
    /* 一句包含另一句：長度差不多才算同一句（「บางคนคือ」和「บางคนคือการมีเจ้าหมาน้อย」是兩句） */
    if ((a.indexOf(b) >= 0 || b.indexOf(a) >= 0) && Math.min(a.length, b.length) / Math.max(a.length, b.length) >= 0.7) { return true; }
    if (Math.max(a.length, b.length) > 120) { return false; }
    return 1 - vidLev(a, b) / Math.max(a.length, b.length) >= 0.75;
  }
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
    var keepIds = {}, kept = [], bandOut = [];
    bands.forEach(function (bd) {
      if (bd.area >= top * 0.25 && bd.items.length >= 3) {
        var b0 = H, b1 = 0;
        bd.items.forEach(function (cp) { b0 = Math.min(b0, cp.y0); b1 = Math.max(b1, cp.y1); if (!keepIds[comps.indexOf(cp)]) { keepIds[comps.indexOf(cp)] = 1; kept.push(cp); } });
        bandOut.push({ cy: ((b0 + b1) / 2 / k + y0) / sh, h: ((b1 - b0) / k) / sh, n: bd.items.length, sig: bd.items.map(function (cp) { return [Math.round(cp.x0 / medH * 4), Math.round((cp.y0 - b0) / medH * 4), Math.round(cp.w / medH * 4), Math.round(cp.h / medH * 4)]; }) });
      }
    });
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
    var sig = kept.map(function (cp) { return [Math.round(cp.x0 / medH * 4), Math.round(cp.y0 / medH * 4), Math.round(cp.w / medH * 4), Math.round(cp.h / medH * 4)]; });
    out.canvas = oc; out.sig = sig; out.bands = bandOut; out.medH = medH / k; out.n = kept.length; out.box = [(bx0 / k + x0) / sw, (by0 / k + y0) / sh, ((bx1 - bx0) / k) / sw, ((by1 - by0) / k) / sh];
    return out;
  }
  /* 兩次的字塊指紋差多少（0＝一樣，1＝完全不同） */
  function vidSigDiff(a, b) {
    if (!a || !b) { return a === b ? 0 : 1; }
    var used = {}, hit = 0;
    a.forEach(function (p) { for (var z = 0; z < b.length; z++) { if (used[z]) { continue; } var o = b[z]; if (Math.abs(o[0] - p[0]) <= 1 && Math.abs(o[1] - p[1]) <= 1 && Math.abs(o[2] - p[2]) <= 1 && Math.abs(o[3] - p[3]) <= 1) { used[z] = 1; hit++; return; } } });
    return 1 - hit / Math.max(a.length, b.length);
  }

  /* 辨識結果整理成一行一行：去掉頭尾的雜訊，信心太低或泰文太少的不要 */
  function vidLinesFrom(data, minConf) {
    var out = [];
    (data.blocks || []).forEach(function (b) {
      (b.paragraphs || []).forEach(function (p) {
        (p.lines || []).forEach(function (ln) {
          var t = (ln.text || '').replace(/\s+/g, ' ').trim();
          t = t.replace(/^[^ก-๛A-Za-z0-9]+/, '').replace(/[^ก-๛A-Za-z0-9!?.]+$/, '');
          var th = (t.match(/[ก-ฮ]/g) || []).length, thAll = (t.match(/[\u0E01-\u0E5B]/g) || []).length, all = t.replace(/\s/g, '').length;
          if (th < 2 || thAll / Math.max(1, all) < 0.6 || ln.confidence < minConf) { return; }
          var f = typeof ocrFixText === 'function' ? ocrFixText(vidDigits(t)) : { t: vidDigits(t) };
          f.t = vidMarksFix(f.t);
          var kn = vidKnown(f.t);
          if (kn < 0.35) { return; }
          out.push({ t: f.t, c: ln.confidence, th: th, kn: kn, q: ln.confidence + 40 * kn });
        });
      });
    });
    return out;
  }
  /* 這一行有多少是字典裡的詞（0～1）：讀錯的字幕通常拼不出真的詞 */
  function vidKnown(t) {
    var th = (t.match(/[\u0E01-\u0E2E]/g) || []).length;
    if (!th || typeof segment !== 'function' || !DICT) { return 0.5; }
    var ok = 0;
    segment(t).forEach(function (x) {
      if (!x.w || !/[\u0E01-\u0E2E]/.test(x.t)) { return; }
      var known = DICT[x.t] || (typeof dictBase === 'function' && dictBase(x.t) && DICT[dictBase(x.t)]) || false;
      if (known && x.t.length >= 2) { ok += (x.t.match(/[\u0E01-\u0E2E]/g) || []).length; }
    });
    return Math.min(1, ok / th);
  }
  /* 有些圓體字的 ต 會被認成泰文數字 ๓，或多出一個 ๑：夾在泰文字中間的泰文數字，試著刪掉或換成 ต，選拼得出最多字典詞的那個 */
  function vidDigits(t) {
    var re = /([\u0E01-\u0E4E])[\u0E50-\u0E59]+(?=[\u0E01-\u0E4E]|\s|$)/g, pos = [], m;
    while ((m = re.exec(t)) && pos.length < 3) { pos.push([m.index + 1, m[0].length - 1]); }
    if (!pos.length) { return t; }
    /* 每個數字試：保留、刪掉、換成 ต、換成 อ（圓體字的 อ 很像 ๑） */
    var OPS = [null, '', 'ต', 'อ'], best = t, bestK = -1, n = Math.pow(4, pos.length);
    for (var c = 0; c < n; c++) {
      var out = '', last = 0, cc = c;
      pos.forEach(function (p) { var op = OPS[cc % 4]; cc = Math.floor(cc / 4); out += t.slice(last, p[0]) + (op === null ? t.substr(p[0], p[1]) : op); last = p[0] + p[1]; });
      out += t.slice(last);
      var kk = vidKnown(out) - (c === 0 ? 0.001 : 0);
      if (kk > bestK) { bestK = kk; best = out; }
    }
    return best;
  }
  /* 文字辨識常常漏掉聲調符號或上下母音：字典裡查不到的詞，如果「只補上符號」就變成唯一一個字典詞，就補上 */
  var VID_MARKS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, vidSkel = null;
  function vidSkelIndex() {
    if (vidSkel || !DICT) { return vidSkel; }
    vidSkel = {};
    Object.keys(DICT).forEach(function (w) { if (w.length > 12 || !/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(w)) { return; } var k = w.replace(VID_MARKS, ''); (vidSkel[k] = vidSkel[k] || []).push(w); });
    return vidSkel;
  }
  function vidSubseq(a, b) { var i = 0; for (var j = 0; j < b.length && i < a.length; j++) { if (a[i] === b[j]) { i++; } } return i === a.length; }
  function vidMarksFix(t) {
    if (typeof segment !== 'function' || !DICT) { return t; }
    var idx = vidSkelIndex(); if (!idx) { return t; }
    return segment(t).map(function (x) {
      if (!x.w || DICT[x.t] || x.t.length < 2 || !/[\u0E01-\u0E2E]/.test(x.t)) { return x.t; }
      var c = (idx[x.t.replace(VID_MARKS, '')] || []).filter(function (w) { return w.length > x.t.length && vidSubseq(x.t, w); });
      return c.length === 1 ? c[0] : x.t;
    }).join('');
  }
  function vidScore(ls) { return ls.reduce(function (s, l) { return s + l.th * l.c / 100 * (0.5 + l.kn / 2); }, 0); }
  function vidFrame(v, maxW) {
    var vw = v.videoWidth, vh = v.videoHeight, k = Math.min(1, (maxW || 1920) / Math.max(vw, vh));
    var c = document.createElement('canvas'); c.width = Math.round(vw * k); c.height = Math.round(vh * k);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    return c;
  }
  /* 自動找字幕在哪：看影片裡幾個畫面，找「有黑邊或底色的字」最常出現的高度 */
  async function vidGuessRegion(v) {
    var dur = v.duration, hits = [];
    for (var i = 1; i <= 7; i++) {
      var t = dur * i / 8;
      await vidSeek(v, Math.min(t, dur - 0.05));
      var fc = vidFrame(v, 960);
      [false, true].forEach(function (inv) {
        var m = vidMask(fc, fc.width, fc.height, [0, 0, 1, 1], inv, 960, 18);
        (m.bands || []).forEach(function (bd) { if (bd.n >= 3) { hits.push({ t: t, cy: bd.cy, h: Math.max(bd.h, 0.02), n: bd.n, sig: bd.sig, inv: inv }); } });
      });
    }
    if (!hits.length) { return null; }
    /* 字幕的特徵是「同一個高度、內容一直在換」；時間、按讚數、帳號名稱這些畫面上固定的字內容不會變 */
    var best = null;
    hits.forEach(function (a) {
      var grp = hits.filter(function (b) { return b.inv === a.inv && Math.abs(b.cy - a.cy) < 0.04; });
      var uniq = [];
      grp.forEach(function (b) { if (!uniq.some(function (u) { return vidSigDiff(u.sig, b.sig) <= 0.3; })) { uniq.push(b); } });
      var times = {}; grp.forEach(function (b) { times[b.t] = 1; });
      var sc = (uniq.length >= 2 ? uniq.length * 100 : 0) + Object.keys(times).length * 10 + grp.reduce(function (s, b) { return s + b.n; }, 0) / 100;
      if (!best || sc > best.sc) { best = { sc: sc, grp: grp, t: a.t }; }
    });
    if (best.sc < 200) { return null; }
    var cys = best.grp.map(function (b) { return b.cy; }).sort(), hs = best.grp.map(function (b) { return b.h; }).sort();
    var cy = cys[Math.floor(cys.length / 2)], h = Math.max(0.1, hs[hs.length - 1] * 2.2);
    var y0 = Math.max(0, cy - h / 2), y1 = Math.min(1, cy + h / 2);
    return { r: [0, y0, 1, y1 - y0], t: best.t };
  }

  /* ---------- 框出字幕位置的視窗 ---------- */
  var VREG_KEY = 'thai-vid-region';
  var vpWrap = document.createElement('div'); vpWrap.className = 'cdlayer vplayer'; vpWrap.id = 'vidPick'; vpWrap.hidden = true;
  vpWrap.innerHTML = '<div class="cdback"></div><div class="cdsheet vpsheet" role="dialog" aria-modal="true" aria-labelledby="vpTitle"><div class="cdscroll">' +
    '<h2 class="vptitle" id="vpTitle">框出字幕的位置</h2>' +
    '<p class="vptip" id="vpTip"></p>' +
    '<div class="vpstage" id="vpStage"><canvas id="vpCanvas"></canvas><div class="vprect" id="vpRect"></div></div>' +
    '<label class="vptime"><span>換一個畫面看</span><input type="range" id="vpTime" min="0" max="1000" value="300"></label>' +
    '<div class="seg vppre" id="vpPresets" role="group" aria-label="常見位置"></div>' +
    '<div class="vpact"><button type="button" id="vpCancel">取消</button><button type="button" class="primary" id="vpGo">開始讀字幕</button></div>' +
    '</div></div>';
  document.body.appendChild(vpWrap);
  function vidPickRegion(v, guess, redo) {
    return new Promise(function (resolve) {
      var cv = $('vpCanvas'), stage = $('vpStage'), rect = $('vpRect'), reg = null, drag = null, seekBusy = false, want = null;
      var saved = null; try { saved = JSON.parse(localStorage.getItem(VREG_KEY) || 'null'); } catch (err) {}
      reg = guess ? guess.r.slice() : (saved && saved.length === 4 ? saved : [0, 0.62, 1, 0.33]);
      $('vpTip').textContent = (redo ? '框是上次用的位置，可以重新框。重新辨識的結果會取代這份文件的文字，這份文件的筆記（螢光筆、手寫、註解）也會清掉。' : guess ? '我們先找到字幕大概在框起來的地方。不對的話，用手指在畫面上重新框一次（框住字幕就好，不用很準）。' : '沒有自動找到字幕。請用手指在畫面上把字幕框起來，或選下面的位置。');
      $('vpGo').textContent = redo ? '重新辨識' : '開始讀字幕';
      cv.width = Math.min(960, v.videoWidth); cv.height = Math.round(cv.width * v.videoHeight / v.videoWidth);
      stage.style.aspectRatio = v.videoWidth + ' / ' + v.videoHeight;
      function paint() { cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height); }
      function show() { rect.style.left = reg[0] * 100 + '%'; rect.style.top = reg[1] * 100 + '%'; rect.style.width = reg[2] * 100 + '%'; rect.style.height = reg[3] * 100 + '%'; }
      async function goTo(t) {
        want = t; if (seekBusy) { return; }
        seekBusy = true;
        while (want !== null) { var tt = want; want = null; await vidSeek(v, tt); paint(); }
        seekBusy = false;
      }
      var t0 = guess ? guess.t : v.duration * 0.3;
      $('vpTime').value = String(Math.round(t0 / v.duration * 1000));
      goTo(t0); show();
      $('vpTime').oninput = function () { goTo(Math.min(v.duration - 0.05, v.duration * Number(this.value) / 1000)); };
      var P = [['下方', [0, 0.62, 1, 0.33]], ['中間', [0, 0.36, 1, 0.28]], ['上方', [0, 0.04, 1, 0.3]], ['整個畫面', [0, 0, 1, 1]]];
      segButtons($('vpPresets'), P.map(function (p, i) { return [String(i), p[0]]; }), '', function (val) { reg = P[Number(val)][1].slice(); show(); });
      function pt(e) { var r = stage.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; }
      stage.onpointerdown = function (e) { drag = { a: pt(e), id: e.pointerId }; try { stage.setPointerCapture(e.pointerId); } catch (err) {} e.preventDefault(); };
      stage.onpointermove = function (e) {
        if (!drag || e.pointerId !== drag.id) { return; }
        var b = pt(e), x0 = Math.min(drag.a[0], b[0]), y0 = Math.min(drag.a[1], b[1]), w = Math.abs(b[0] - drag.a[0]), h = Math.abs(b[1] - drag.a[1]);
        if (w > 0.03 && h > 0.02) { reg = [x0, y0, w, h]; show(); }
      };
      stage.onpointerup = stage.onpointercancel = function () { drag = null; };
      function done(r) {
        vpWrap.hidden = true; document.body.classList.remove('noscroll');
        $('vpGo').onclick = $('vpCancel').onclick = null; vpWrap.querySelector('.cdback').onclick = null;
        resolve(r);
      }
      $('vpGo').onclick = function () {
        /* 框太小的話上下多留一點，字幕換行或長短不同也框得到 */
        var r = reg.slice();
        if (r[3] < 0.08) { var ex = (0.08 - r[3]) / 2; r[1] = Math.max(0, r[1] - ex); r[3] = Math.min(1 - r[1], 0.08); }
        try { localStorage.setItem(VREG_KEY, JSON.stringify(r)); } catch (err) {}
        done(r);
      };
      $('vpCancel').onclick = function () { done(null); };
      vpWrap.querySelector('.cdback').onclick = function () { done(null); };
      vpWrap.hidden = false; document.body.classList.add('noscroll');
    });
  }

  /* 三種讀法：out＝亮色字有黑邊或深色底；inv＝深色字在亮底上；raw＝直接讀框裡的畫面（沒有邊的字幕） */
  async function vidRecognize(w, fc, region, mode, pre) {
    var cv, minConf;
    if (mode === 'raw') {
      var x0 = Math.round(region[0] * fc.width), y0 = Math.round(region[1] * fc.height), cw = Math.max(8, Math.round(region[2] * fc.width)), ch = Math.max(8, Math.round(region[3] * fc.height));
      var k = Math.min(2.5, 1800 / cw);
      cv = document.createElement('canvas'); cv.width = Math.round(cw * k); cv.height = Math.round(ch * k);
      var g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(fc, x0, y0, cw, ch, 0, 0, cv.width, cv.height);
      await w.setParameters({ tessedit_pageseg_mode: '3' });
      minConf = 70;
    } else {
      var m = pre || vidMask(fc, fc.width, fc.height, region, mode === 'inv', 1280, 18);
      if (!m.canvas) { return []; }
      cv = m.canvas;
      await w.setParameters({ tessedit_pageseg_mode: '11' });
      minConf = 60;
    }
    var res = await w.recognize(cv, {}, { blocks: true, text: false, hocr: false, tsv: false });
    return vidLinesFrom(res.data, minConf);
  }

  async function libAddVideo(f) {
    if (vid.busy) { $('homeMsg').textContent = '還有一部影片正在讀，請等它完成或按「停止」。'; return; }
    vid.busy = true; vid.stop = false;
    var name = f.name.replace(/\.[^.]+$/, '') || '影片字幕', o = null, v = null;
    function quit(text) { if (text) { $('homeMsg').textContent = text; } vbox.hidden = true; vid.busy = false; if (o) { URL.revokeObjectURL(o.url); } }
    vbox.hidden = false; vidButtons('none'); $('vidBar').style.width = '0%';
    $('vidMsg').textContent = '讀取影片「' + name + '」…';
    try {
      o = await vidLoad(f); v = o.v;
      var dur = v.duration;
      if (!isFinite(dur) || dur <= 0) { throw new Error('讀不到影片長度'); }
      if (dur > 20 * 60) { throw new Error('影片太長（超過 20 分鐘），請先剪短或分段錄'); }
      if (!v.videoWidth || !v.videoHeight) { throw new Error('讀不到影片畫面'); }
      $('vidMsg').textContent = '正在找字幕在畫面的哪裡…';
      var guess = await vidGuessRegion(v);
      vbox.hidden = true;
      var region = await vidPickRegion(v, guess);
      if (!region) { quit('已取消讀影片。'); return; }
      await vidRead(v, region, name, dur, null, f);
    } catch (err) {
      quit('讀影片失敗：' + String(err && err.message || err));
      return;
    }
    if (o) { URL.revokeObjectURL(o.url); }
  }

  async function vidRead(v, region, name, dur, redoId, file) {
    vbox.hidden = false; vidButtons('run');
    var msg = $('vidMsg'), bar = $('vidBar'), lines = [], recent = [], frames = 0, ocrs = 0;
    var modes = ['out', 'inv', 'raw'], wins = { out: 0, inv: 0, raw: 0 }, tried = 0, best = null;
    var prevSig = null, prevInvSig = null, prevGray = null, lastOcrT = -99;
    var small = document.createElement('canvas'); small.width = 96; small.height = Math.max(8, Math.round(96 * (region[3] * v.videoHeight) / (region[2] * v.videoWidth)));
    var sg = small.getContext('2d', { willReadFrequently: true });
    msg.textContent = '準備文字辨識工具…（第一次要下載約 8 MB）'; bar.style.width = '0%';
    var w = await ensureOcr();
    /* 字幕常常只出現 1 秒多：短影片每 0.5 秒看一次 */
    var step = dur > 600 ? 1.5 : dur > 180 ? 1 : 0.5;
    try {
      for (var t = 0.2; t < dur && !vid.stop; t += step) {
        await vidSeek(v, Math.min(t, dur - 0.05));
        frames++;
        bar.style.width = Math.round(t / dur * 100) + '%';
        msg.textContent = '看到第 ' + Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2) + '（共 ' + Math.floor(dur / 60) + ':' + ('0' + Math.floor(dur % 60)).slice(-2) + '），已找到 ' + lines.length + ' 句字幕…';
        var fc = vidFrame(v, 1920);
        /* 畫面有沒有換字幕：有邊的字看字塊指紋，沒有邊的字看框裡的畫面變了多少 */
        var mo = vidMask(fc, fc.width, fc.height, region, false, 1280, 18), mi = (!best || best === 'inv') ? vidMask(fc, fc.width, fc.height, region, true, 1280, 18) : null;
        var ch = vidSigDiff(mo.sig, prevSig) > 0.3 || (mi && vidSigDiff(mi.sig, prevInvSig) > 0.3);
        if (!best || best === 'raw') {
          sg.drawImage(fc, region[0] * fc.width, region[1] * fc.height, region[2] * fc.width, region[3] * fc.height, 0, 0, small.width, small.height);
          var px = sg.getImageData(0, 0, small.width, small.height).data, gray = new Uint8Array(px.length / 4), diff = 0;
          for (var i = 0, j = 0; i < px.length; i += 4, j++) { gray[j] = (px[i] * 3 + px[i + 1] * 6 + px[i + 2]) / 10; if (prevGray) { diff += Math.abs(gray[j] - prevGray[j]); } }
          diff = prevGray ? diff / gray.length : 999;
          if (diff >= 6) { ch = true; prevGray = gray; }
        }
        /* 保險：畫面上有字、但已經 3 秒沒讀了，就再讀一次 */
        if (!ch && t - lastOcrT >= 2.9 && (mo.canvas || (mi && mi.canvas))) { ch = true; }
        if (vid.debug) { vid.dbg.push([Math.round(t * 10) / 10, ch, mo.n, vidSigDiff(mo.sig, prevSig)]); }
        if (!ch) { continue; }
        lastOcrT = t;
        var sigNow = mo.sig, invNow = mi ? mi.sig : null;
        /* 前幾句三種讀法都試，之後用最常贏的那一種；它讀不到才試別的 */
        var order = best ? [best].concat(modes.filter(function (m) { return m !== best; })) : modes, got = [], gotMode = null, gotScore = 0, all = [];
        for (var z = 0; z < order.length; z++) {
          var md = order[z];
          if (md === 'out' && !mo.canvas) { continue; }
          if (md === 'inv' && mi && !mi.canvas) { continue; }
          var ls = await vidRecognize(w, fc, region, md, md === 'out' ? mo : (md === 'inv' ? mi : null));
          ocrs++;
          var sc = vidScore(ls);
          if (vid.debug) { vid.dbg.push([md, ls.map(function (l) { return l.t + ':' + Math.round(l.c) + ':' + l.kn.toFixed(2); })]); }
          all = all.concat(ls);
          if (sc > gotScore) { got = ls; gotMode = md; gotScore = sc; }
          if (best && got.length) { break; }
        }
        /* 有讀到字才記住這個畫面；沒讀到（例如字幕正在淡入淡出）下一個畫面再試 */
        if (got.length || (!mo.canvas && !(mi && mi.canvas))) { prevSig = sigNow; if (mi) { prevInvSig = invNow; } }
        if (gotMode) {
          wins[gotMode]++; tried++;
          if (tried >= 5 && !best) { best = modes.reduce(function (a, b) { return wins[b] > wins[a] ? b : a; }, 'out'); }
        }
        /* 別的讀法讀到的，只有跟最好那一種讀到的是同一句時，才拿來比哪個版本比較好（避免雜訊變成新的一句） */
        var gn = got.map(function (g) { return vidNorm(g.t); });
        all = all.filter(function (ln) { return got.indexOf(ln) >= 0 || gn.some(function (g) { return vidSimilar(g, vidNorm(ln.t)); }); });
        all.forEach(function (ln) {
          var nl = vidNorm(ln.t);
          if (nl.length < 2) { return; }
          for (var q = recent.length - 1; q >= 0; q--) {
            if (vidSimilar(recent[q].n, nl)) {
              /* 同一句出現好幾次：留「信心高、又拼得出字典裡的詞」的那一次 */
              var cur = lines[recent[q].k];
              if (ln.q > cur.q + 1 || (Math.abs(ln.q - cur.q) <= 1 && ln.t.length > cur.t.length)) { lines[recent[q].k] = ln; }
              return;
            }
          }
          lines.push(ln); recent.push({ n: nl, k: lines.length - 1 }); if (recent.length > 12) { recent.shift(); }
        });
      }
    } finally {
      try { await w.setParameters({ tessedit_pageseg_mode: '3' }); } catch (err) {}
      vid.busy = false;
    }
    vid.last = { frames: frames, ocrs: ocrs, wins: wins, best: best, region: region };
    if (!lines.length) {
      msg.textContent = '沒有讀到泰文字幕（看了 ' + frames + ' 個畫面）。可能是框的位置不對，按「重新框字幕」再試一次。'; bar.style.width = '100%';
      vidButtons('retry');
      /* 重新框：同一部影片再打開框字幕的視窗 */
      vid.retry = async function () {
        vid.busy = true; vid.stop = false;
        var o2 = null;
        try {
          o2 = file ? await vidLoad(file) : null;
          var vv = o2 ? o2.v : v;
          var r2 = await vidPickRegion(vv, { r: region, t: vv.duration * 0.3 }, !!redoId);
          if (!r2) { vid.busy = false; vbox.hidden = true; } else { await vidRead(vv, r2, name, dur, redoId, file); }
        } catch (err) { vid.busy = false; $('vidMsg').textContent = '讀影片失敗：' + String(err && err.message || err); }
        if (o2) { URL.revokeObjectURL(o2.url); }
      };
      return;
    }
    vbox.hidden = true;
    var text = lines.map(function (l) { return l.t; }).join('\n'), id = redoId || 'text:' + Date.now().toString(36), d = redoId ? docById(redoId) : null;
    var dn = d ? d.name : name + '（影片字幕）';
    if (!d) { d = { id: id, name: dn, type: 'text', size: text.length, added: Date.now(), opened: 0, folder: libTarget(), video: true }; lib.docs.push(d); }
    d.size = text.length; d.vregion = region;
    /* 把影片本身也存起來，之後才能「重新辨識」（太大的影片不存） */
    if (file && file.size < 400 * 1048576 && !(redoId && d.vblob)) { try { await idbPut('vid:' + id, file); d.vblob = true; } catch (err) { d.vblob = false; } }
    saveLib();
    if (redoId && state.src && state.src.id === id) { state.src = null; }
    try { localStorage.setItem(PDF_DOC_PREFIX + id, JSON.stringify({ text: text, src: { type: 'text', id: id, name: dn }, hl: [], strokes: [], boxes: [], nextId: 1 })); } catch (err) {}
    $('homeMsg').textContent = (redoId ? '已重新辨識「' : '已把影片字幕整理成文件「') + dn + '」：' + lines.length + ' 句' + (vid.stop ? '（中途停止）' : '') + '。字幕是文字辨識讀出來的，可能有錯字。';
    setTimeout(function () { $('homeMsg').textContent = ''; }, 12000);
    renderHome();
    openDoc(id);
  }
  /* 影片文件的「↻ 重新辨識」：重新框字幕、再讀一次，結果取代原本的文字 */
  function vidRedoable() { var d = state.src && docById(state.src.id); return !!(d && d.video && d.vblob); }
  async function vidRedo() {
    var d = state.src && docById(state.src.id);
    if (!d || vid.busy) { return; }
    var f = null; try { f = await idbGet('vid:' + d.id); } catch (err) {}
    if (!f) { $('info').textContent = '這台裝置上沒有存這部影片，請從主頁重新加入影片。'; return; }
    vid.busy = true; vid.stop = false;
    var o = null;
    try {
      o = await vidLoad(f);
      var guess = d.vregion ? { r: d.vregion, t: o.v.duration * 0.3, redo: true } : await vidGuessRegion(o.v);
      var region = await vidPickRegion(o.v, guess, true);
      if (!region) { vid.busy = false; URL.revokeObjectURL(o.url); return; }
      showTab('home');
      await vidRead(o.v, region, d.name, o.v.duration, d.id, f);
    } catch (err) {
      vid.busy = false; $('homeMsg').textContent = '重新辨識失敗：' + String(err && err.message || err);
    }
    if (o) { URL.revokeObjectURL(o.url); }
  }
