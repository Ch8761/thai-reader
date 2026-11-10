  /* ---------- 照片匯入前：裁切、旋轉、把斜拍的拉正（招牌、菜單） ----------
     拖曳四個角框住要讀的地方，App 會把那個四邊形「攤平」成長方形（透視校正），文字辨識會準很多。 */
  var phWrap = document.createElement('div'); phWrap.className = 'cdlayer phlayer'; phWrap.id = 'photoEdit'; phWrap.hidden = true;
  phWrap.innerHTML = '<div class="cdback"></div><div class="cdsheet phsheet" role="dialog" aria-modal="true" aria-labelledby="phTitle"><div class="cdscroll">' +
    '<h2 class="vptitle" id="phTitle">調整照片</h2>' +
    '<p class="vptip" id="phTip">拖曳四個角的圓點，框住要讀的文字（例如招牌、菜單）。斜斜拍的會自動拉正；不用很準。</p>' +
    '<div class="phbox" id="phBox"><div class="phstage" id="phStage"><canvas id="phCanvas"></canvas><svg class="phsvg" id="phSvg" aria-hidden="true"><polygon id="phPoly"/></svg></div></div>' +
    '<div class="phtools"><button type="button" id="phRotL" aria-label="向左轉"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>向左轉</button>' +
    '<button type="button" id="phRotR" aria-label="向右轉"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/></svg>向右轉</button>' +
    '<button type="button" id="phFull">選整張</button></div>' +
    '<div class="vpact phact"><button type="button" id="phCancel">取消</button><button type="button" id="phSkipAll" hidden>其餘不調整</button><button type="button" class="primary" id="phOk">完成</button></div>' +
    '</div></div>';
  document.body.appendChild(phWrap);
  /* 四個點對應到長方形的四個角：解出透視轉換（8 個未知數） */
  function phHomography(src, dst) {
    var A = [], b = [];
    for (var i = 0; i < 4; i++) {
      var x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    var n = 8;
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) { if (Math.abs(A[r][c]) > Math.abs(A[p][c])) { p = r; } }
      var t = A[c]; A[c] = A[p]; A[p] = t; var tb = b[c]; b[c] = b[p]; b[p] = tb;
      if (Math.abs(A[c][c]) < 1e-12) { return null; }
      for (r = 0; r < n; r++) {
        if (r === c) { continue; }
        var f = A[r][c] / A[c][c];
        for (var k = c; k < n; k++) { A[r][k] -= f * A[c][k]; }
        b[r] -= f * b[c];
      }
    }
    var h = []; for (c = 0; c < n; c++) { h.push(b[c] / A[c][c]); }
    h.push(1);
    return h;
  }
  /* 把來源圖上的四邊形攤平成新的長方形圖 */
  function phWarp(srcCanvas, quad) {
    var W = srcCanvas.width, H = srcCanvas.height;
    var P = quad.map(function (q) { return [q[0] * W, q[1] * H]; });
    var d = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    var ow = Math.max(d(P[0], P[1]), d(P[3], P[2])), oh = Math.max(d(P[0], P[3]), d(P[1], P[2]));
    var k = Math.min(1, 2600 / Math.max(ow, oh));
    ow = Math.max(8, Math.round(ow * k)); oh = Math.max(8, Math.round(oh * k));
    /* 輸出座標 → 來源座標 */
    var h = phHomography([[0, 0], [ow, 0], [ow, oh], [0, oh]], P);
    if (!h) { return null; }
    var sd = srcCanvas.getContext('2d').getImageData(0, 0, W, H).data;
    var out = document.createElement('canvas'); out.width = ow; out.height = oh;
    var og = out.getContext('2d'), im = og.createImageData(ow, oh), od = im.data;
    for (var y = 0; y < oh; y++) {
      for (var x = 0; x < ow; x++) {
        var den = h[6] * x + h[7] * y + 1, sx = (h[0] * x + h[1] * y + h[2]) / den, sy = (h[3] * x + h[4] * y + h[5]) / den;
        var o = (y * ow + x) * 4;
        if (sx < 0 || sy < 0 || sx > W - 1 || sy > H - 1) { od[o] = od[o + 1] = od[o + 2] = 255; od[o + 3] = 255; continue; }
        var x0 = sx | 0, y0 = sy | 0, x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = sx - x0, fy = sy - y0;
        var i00 = (y0 * W + x0) * 4, i10 = (y0 * W + x1) * 4, i01 = (y1 * W + x0) * 4, i11 = (y1 * W + x1) * 4;
        for (var ch = 0; ch < 3; ch++) {
          var top = sd[i00 + ch] + (sd[i10 + ch] - sd[i00 + ch]) * fx, bot = sd[i01 + ch] + (sd[i11 + ch] - sd[i01 + ch]) * fx;
          od[o + ch] = top + (bot - top) * fy;
        }
        od[o + 3] = 255;
      }
    }
    og.putImageData(im, 0, 0);
    return out;
  }
  function phRotate(c, dir) {
    var r = document.createElement('canvas'); r.width = c.height; r.height = c.width;
    var g = r.getContext('2d');
    g.translate(r.width / 2, r.height / 2); g.rotate(dir * Math.PI / 2); g.drawImage(c, -c.width / 2, -c.height / 2);
    return r;
  }
  var PH_FULL = [[0, 0], [1, 0], [1, 1], [0, 1]];
  function phIsFull(q) { return q.every(function (p, i) { return Math.abs(p[0] - PH_FULL[i][0]) < 0.004 && Math.abs(p[1] - PH_FULL[i][1]) < 0.004; }); }
  /* 一張一張調整；回傳調整好的檔案清單，按取消回傳 null */
  function photoEdit(files) {
    return new Promise(function (resolve) {
      var out = [], idx = 0, base = null, quad = null, rot = 0;
      var stage = $('phStage'), box = $('phBox'), cv = $('phCanvas'), svg = $('phSvg'), poly = $('phPoly'), handles = [];
      for (var i = 0; i < 4; i++) {
        var hc = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); hc.setAttribute('class', 'phh'); hc.setAttribute('r', '13');
        svg.appendChild(hc); handles.push(hc);
      }
      function done(r) {
        phWrap.hidden = true; document.body.classList.remove('noscroll');
        handles.forEach(function (h) { h.remove(); });
        ['phOk', 'phCancel', 'phSkipAll', 'phRotL', 'phRotR', 'phFull'].forEach(function (id) { $(id).onclick = null; });
        box.onpointerdown = box.onpointermove = box.onpointerup = box.onpointercancel = null;
        resolve(r);
      }
      function draw() {
        var dw = Math.min(stage.clientWidth || 600, 1000), k = dw / base.width;
        cv.width = Math.round(base.width * Math.min(1, 1400 / Math.max(base.width, base.height)));
        cv.height = Math.round(cv.width * base.height / base.width);
        cv.getContext('2d').drawImage(base, 0, 0, cv.width, cv.height);
        stage.style.aspectRatio = base.width + ' / ' + base.height;
        /* 直的照片不要太高：寬度跟著縮，整張都看得到 */
        stage.style.width = 'min(100%, calc(52vh * ' + (base.width / base.height).toFixed(4) + '))';
        paintQuad();
      }
      function paintQuad() {
        var r = stage.getBoundingClientRect(), w = r.width, h = r.height;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h);
        poly.setAttribute('points', quad.map(function (p) { return (p[0] * w).toFixed(1) + ',' + (p[1] * h).toFixed(1); }).join(' '));
        handles.forEach(function (hc, i) { hc.setAttribute('cx', (quad[i][0] * w).toFixed(1)); hc.setAttribute('cy', (quad[i][1] * h).toFixed(1)); });
      }
      async function load() {
        var o = await ocrLoadImage(files[idx]), im = o.im;
        var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(1, 2600 / Math.max(iw, ih));
        base = document.createElement('canvas'); base.width = Math.max(1, Math.round(iw * k)); base.height = Math.max(1, Math.round(ih * k));
        var g = base.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, base.width, base.height); g.drawImage(im, 0, 0, base.width, base.height);
        URL.revokeObjectURL(o.url);
        quad = PH_FULL.map(function (p) { return p.slice(); }); rot = 0;
        $('phTitle').textContent = files.length > 1 ? '調整照片（第 ' + (idx + 1) + '／' + files.length + ' 張）' : '調整照片';
        $('phOk').textContent = idx + 1 < files.length ? '下一張' : '完成';
        $('phSkipAll').hidden = !(files.length > 1 && idx + 1 < files.length);
        draw();
      }
      var drag = null;
      function pt(e) { var r = stage.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)), r]; }
      box.onpointerdown = function (e) {
        var p = pt(e), r = p[2], best = -1, bd = 1e9;
        quad.forEach(function (q, i) { var dx = (q[0] - p[0]) * r.width, dy = (q[1] - p[1]) * r.height, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = i; } });
        /* 手指點在圓點附近（44 點以內）才算抓住 */
        if (best >= 0 && bd <= 44 * 44) { drag = { i: best, id: e.pointerId }; try { box.setPointerCapture(e.pointerId); } catch (err) {} handles[best].classList.add('on'); e.preventDefault(); }
      };
      box.onpointermove = function (e) {
        if (!drag || e.pointerId !== drag.id) { return; }
        var p = pt(e); quad[drag.i] = [p[0], p[1]]; paintQuad(); e.preventDefault();
      };
      box.onpointerup = box.onpointercancel = function () { if (drag) { handles[drag.i].classList.remove('on'); } drag = null; };
      $('phRotL').onclick = function () { base = phRotate(base, -1); quad = PH_FULL.map(function (p) { return p.slice(); }); draw(); };
      $('phRotR').onclick = function () { base = phRotate(base, 1); quad = PH_FULL.map(function (p) { return p.slice(); }); draw(); };
      $('phFull').onclick = function () { quad = PH_FULL.map(function (p) { return p.slice(); }); paintQuad(); };
      function finishOne() {
        return new Promise(function (res) {
          var c = phIsFull(quad) ? base : (phWarp(base, quad) || base);
          c.toBlob(function (blob) {
            var nm = (files[idx].name || '圖片.jpg').replace(/\.[^.]+$/, '') + '.jpg';
            res(blob ? new File([blob], nm, { type: 'image/jpeg' }) : files[idx]);
          }, 'image/jpeg', 0.92);
        });
      }
      $('phOk').onclick = async function () {
        $('phOk').disabled = true;
        try { out.push(await finishOne()); } finally { $('phOk').disabled = false; }
        idx++;
        if (idx >= files.length) { done(out); return; }
        try { await load(); } catch (err) { out.push(files[idx]); idx++; if (idx >= files.length) { done(out); } else { load(); } }
      };
      $('phSkipAll').onclick = async function () {
        out.push(await finishOne());
        for (var j = idx + 1; j < files.length; j++) { out.push(files[j]); }
        done(out);
      };
      $('phCancel').onclick = function () { done(null); };
      phWrap.querySelector('.cdback').onclick = function () { done(null); };
      phWrap.hidden = false; document.body.classList.add('noscroll');
      window.addEventListener('resize', function onR() { if (phWrap.hidden) { window.removeEventListener('resize', onR); return; } if (base) { paintQuad(); } });
      load().catch(function () { done(files.slice()); });
    });
  }
