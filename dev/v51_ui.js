  /* ==== 1.43：拍歪的照片先自動轉正再辨識 ==== */
  /* 找傾斜角度：把黑色的字點投影到一條條橫線上，角度對的時候每一行的字會疊在同一條，最「集中」 */
  function skewAngle(src) {
    var W = src.width, H = src.height, k = Math.min(1, 900 / Math.max(W, H)), w = Math.max(1, Math.round(W * k)), h = Math.max(1, Math.round(H * k));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, n = w * h, gray = new Uint8Array(n), hist = new Array(256).fill(0), sum = 0;
    for (var i = 0; i < n; i++) { var v = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000 | 0; gray[i] = v; hist[v]++; sum += v; }
    /* Otsu 門檻 */
    var sB = 0, wB = 0, best = 0, th = 128, sAll = 0; for (i = 0; i < 256; i++) { sAll += i * hist[i]; }
    for (i = 0; i < 256; i++) { wB += hist[i]; if (!wB) { continue; } var wF = n - wB; if (!wF) { break; } sB += i * hist[i]; var mB = sB / wB, mF = (sAll - sB) / wF, bt = wB * wF * (mB - mF) * (mB - mF); if (bt > best) { best = bt; th = i; } }
    var dark = sum / n > 110; /* 底是亮的：字是暗的；底是暗的：字是亮的 */
    var xs = [], ys = [], cnt = 0;
    for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { var p = gray[y * w + x]; if (dark ? p < th : p > th) { cnt++; } } }
    if (cnt < 300 || cnt > n * 0.45) { return 0; }
    var step = Math.max(1, Math.round(cnt / 40000));
    for (y = 0, i = 0; y < h; y++) { for (x = 0; x < w; x++) { var q = gray[y * w + x]; if (dark ? q < th : q > th) { if ((i++ % step) === 0) { xs.push(x - w / 2); ys.push(y - h / 2); } } } }
    var R = Math.ceil(Math.sqrt(w * w + h * h)) + 2;
    function score(deg) {
      var a = deg * Math.PI / 180, s = Math.sin(a), co = Math.cos(a), bins = new Float32Array(R), off = R / 2, tot = 0;
      for (var j = 0; j < xs.length; j++) { var yy = (ys[j] * co - xs[j] * s + off) | 0; if (yy >= 0 && yy < R) { bins[yy]++; } }
      for (j = 0; j < R; j++) { tot += bins[j] * bins[j]; }
      return tot;
    }
    var bestA = 0, bestS = score(0), s0 = bestS;
    for (var a = -12; a <= 12.001; a += 0.5) { var sc = score(a); if (sc > bestS) { bestS = sc; bestA = a; } }
    var lo = bestA - 0.5, hi = bestA + 0.5;
    for (a = lo; a <= hi + 0.001; a += 0.1) { sc = score(a); if (sc > bestS) { bestS = sc; bestA = a; } }
    /* 不夠明顯（例如風景照、表格）就不轉 */
    if (Math.abs(bestA) < 0.4 || bestS < s0 * 1.08) { return 0; }
    return Math.round(bestA * 10) / 10;
  }
  function rotateCanvas(src, deg) {
    var a = deg * Math.PI / 180, s = Math.abs(Math.sin(a)), co = Math.abs(Math.cos(a));
    var W = src.width, H = src.height, nw = Math.round(W * co + H * s), nh = Math.round(W * s + H * co);
    var c = document.createElement('canvas'); c.width = nw; c.height = nh;
    var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, nw, nh);
    g.translate(nw / 2, nh / 2); g.rotate(-a); g.imageSmoothingQuality = 'high'; g.drawImage(src, -W / 2, -H / 2);
    return c;
  }
  var DESKEW_KEY = 'thai-deskew', deskewLast = 0;
  function deskewOn() { try { return localStorage.getItem(DESKEW_KEY) !== '0'; } catch (err) { return true; } }
  function deskewCanvas(c) {
    deskewLast = 0;
    if (!deskewOn()) { return c; }
    var a = 0; try { a = skewAngle(c); } catch (err) { a = 0; }
    if (!a) { return c; }
    deskewLast = a;
    var r = rotateCanvas(c, a);
    c.width = 0; c.height = 0;
    return r;
  }
  (function () {
    var g = $('deskewGroup'); if (!g) { return; }
    function draw() { segButtons(g, [['1', L2('自動轉正', 'Straighten')], ['0', L2('保持原樣', 'Keep as is')]], deskewOn() ? '1' : '0', function (v) { try { if (v === '0') { localStorage.setItem(DESKEW_KEY, '0'); } else { localStorage.removeItem(DESKEW_KEY); } } catch (err) {} draw(); }); }
    draw();
  })();
  /* 成就頁：先看到「學習紀錄」（連續天數、本週進度），任務放在下面 */
  var _renderAchTab51 = renderAchTab;
  renderAchTab = function () {
    var r = _renderAchTab51.apply(this, arguments);
    var host = $('achBody'), rec = host && host.querySelector('.recsec');
    if (rec && host.firstElementChild !== rec) { host.insertBefore(rec, host.firstElementChild); }
    return r;
  };
