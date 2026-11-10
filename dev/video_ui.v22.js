  /* ---------- 加入影片：每秒看一次畫面，畫面換了才做文字辨識，把泰文字幕整理成一份文字文件 ---------- */
  var vid = { busy: false, stop: false };
  var vbox = document.createElement('div'); vbox.className = 'vidbox'; vbox.id = 'vidbox'; vbox.hidden = true;
  vbox.innerHTML = '<div class="vb-row"><span class="vb-t" id="vidMsg" aria-live="polite"></span><button type="button" id="vidStop">停止</button></div><div class="vb-bar"><span id="vidBar"></span></div>';
  $('homeMsg').parentNode.insertBefore(vbox, $('homeMsg').nextSibling);
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
    if (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0) { return true; }
    if (Math.max(a.length, b.length) > 120) { return false; }
    return 1 - vidLev(a, b) / Math.max(a.length, b.length) >= 0.75;
  }
  /* 把辨識結果的一個個字，依高度排回一行一行 */
  function vidLinesOf(items) {
    var rows = [];
    items.slice().sort(function (p, q) { return p[1] - q[1] || p[0] - q[0]; }).forEach(function (it) {
      var row = rows.filter(function (r) { return Math.abs(r.base - it[1]) < it[3] * 0.6; })[0];
      if (!row) { row = { base: it[1], items: [] }; rows.push(row); }
      row.items.push(it);
    });
    return rows.map(function (r) {
      r.items.sort(function (p, q) { return p[0] - q[0]; });
      return r.items.map(function (it, k) { return (k ? (typeof it[5] === 'string' ? it[5] : ' ') : '') + it[4]; }).join('').trim();
    }).filter(function (t) { return /[ก-ฮ]/.test(t) && t.replace(/\s/g, '').length >= 2; });
  }
  async function libAddVideo(f) {
    if (vid.busy) { $('homeMsg').textContent = '還有一部影片正在讀，請等它完成或按「停止」。'; return; }
    vid.busy = true; vid.stop = false; vbox.hidden = false;
    var msg = $('vidMsg'), bar = $('vidBar'), name = f.name.replace(/\.[^.]+$/, '') || '影片字幕';
    msg.textContent = '讀取影片「' + name + '」…'; bar.style.width = '0%';
    var o = null, lines = [], recent = [], frames = 0, ocrs = 0;
    try {
      o = await vidLoad(f);
      var v = o.v, dur = v.duration;
      if (!isFinite(dur) || dur <= 0) { throw new Error('讀不到影片長度'); }
      if (dur > 20 * 60) { throw new Error('影片太長（超過 20 分鐘），請先剪短或分段錄'); }
      var vw = v.videoWidth, vh = v.videoHeight;
      if (!vw || !vh) { throw new Error('讀不到影片畫面'); }
      var k = Math.min(2.5, 2200 / Math.max(vw, vh));
      var big = document.createElement('canvas'); big.width = Math.round(vw * k); big.height = Math.round(vh * k);
      var small = document.createElement('canvas'); small.width = 96; small.height = Math.max(8, Math.round(96 * vh / vw));
      var bg = big.getContext('2d'), sg = small.getContext('2d', { willReadFrequently: true });
      var prev = null, step = dur > 600 ? 1.5 : 1;
      msg.textContent = '準備文字辨識工具…（第一次要下載約 8 MB）';
      var w = await ensureOcr();
      for (var t = 0.2; t < dur && !vid.stop; t += step) {
        await vidSeek(v, Math.min(t, dur - 0.05));
        frames++;
        sg.drawImage(v, 0, 0, small.width, small.height);
        var px = sg.getImageData(0, 0, small.width, small.height).data, gray = new Uint8Array(px.length / 4), diff = 0;
        for (var i = 0, j = 0; i < px.length; i += 4, j++) { gray[j] = (px[i] * 3 + px[i + 1] * 6 + px[i + 2]) / 10; if (prev) { diff += Math.abs(gray[j] - prev[j]); } }
        diff = prev ? diff / gray.length : 999;
        bar.style.width = Math.round(t / dur * 100) + '%';
        msg.textContent = '看到第 ' + Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2) + '（共 ' + Math.floor(dur / 60) + ':' + ('0' + Math.floor(dur % 60)).slice(-2) + '），已找到 ' + lines.length + ' 句字幕…';
        if (diff < 6) { continue; }
        prev = gray;
        bg.fillStyle = '#ffffff'; bg.fillRect(0, 0, big.width, big.height);
        bg.drawImage(v, 0, 0, big.width, big.height);
        var res = await w.recognize(big, {}, { blocks: true, text: false, hocr: false, tsv: false });
        ocrs++;
        var got = ocrItems(res.data, big.width), ls = vidLinesOf(got.items);
        ls.forEach(function (ln) {
          var nl = vidNorm(ln);
          if (nl.length < 2) { return; }
          for (var q = recent.length - 1; q >= 0; q--) {
            if (vidSimilar(recent[q].n, nl)) {
              /* 同一句：留比較完整（符號比較多）的那一次 */
              if (ln.length > lines[recent[q].k].length) { lines[recent[q].k] = ln; }
              return;
            }
          }
          lines.push(ln); recent.push({ n: nl, k: lines.length - 1 }); if (recent.length > 12) { recent.shift(); }
        });
      }
    } catch (err) {
      msg.textContent = '讀影片失敗：' + String(err && err.message || err);
      vid.busy = false;
      if (o) { URL.revokeObjectURL(o.url); }
      return;
    }
    if (o) { URL.revokeObjectURL(o.url); }
    vid.busy = false;
    if (!lines.length) { msg.textContent = '這部影片沒有讀到泰文字幕（看了 ' + frames + ' 個畫面）。'; bar.style.width = '100%'; return; }
    vbox.hidden = true;
    var text = lines.join('\n'), id = 'text:' + Date.now().toString(36), dn = name + '（影片字幕）';
    lib.docs.push({ id: id, name: dn, type: 'text', size: text.length, added: Date.now(), opened: 0, folder: libTarget(), video: true });
    saveLib();
    try { localStorage.setItem(PDF_DOC_PREFIX + id, JSON.stringify({ text: text, src: { type: 'text', id: id, name: dn }, hl: [], strokes: [], boxes: [], nextId: 1 })); } catch (err) {}
    $('homeMsg').textContent = '已把影片字幕整理成文件「' + dn + '」：' + lines.length + ' 句' + (vid.stop ? '（中途停止）' : '') + '。字幕是文字辨識讀出來的，可能有錯字。';
    setTimeout(function () { $('homeMsg').textContent = ''; }, 12000);
    renderHome();
    openDoc(id);
  }
