  /* ---------- 把檔案交給使用者：先用 Claude 的下載功能，再試分享面板，最後用一般下載 ---------- */
  var saveStatus = '還沒存過';
  async function saveFile(filename, blob) {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        var dl = await window.claude.use('downloads');
        if (dl) {
          try { await dl.save({ filename: filename, data: blob }); saveStatus = '已交給 Claude 下載'; return 'saved'; }
          catch (err) {
            if (err && err.code === 'declined') { saveStatus = '使用者取消'; return 'declined'; }
            saveStatus = 'Claude 下載失敗：' + (err && err.code || err);
          }
        }
      }
    } catch (err) {}
    try {
      var file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        saveStatus = '已用分享面板'; return 'saved';
      }
    } catch (err) { if (err && err.name === 'AbortError') { saveStatus = '使用者取消'; return 'declined'; } }
    try {
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = filename; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      saveStatus = '已用一般下載'; return 'saved';
    } catch (err) { saveStatus = '無法存檔：' + String(err && err.message || err).slice(0, 60); return 'failed'; }
  }
  function safeName(s) { return String(s || '泰文').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60); }
  function ymd() { var d = new Date(); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }

  /* ---------- 匯出 PDF：原文頁＋筆記、生字表、筆記整理 ---------- */
  var LIGHT = { ink: '#1f4fd1', red: '#c62828', black: '#1a1a1a', blue: '#1f5fbf', green: '#2e7d32', purple: '#7b3fb0', orange: '#c25a06', hl: '#ffd400' };
  var exportStatus = '還沒匯出過', exScope = 'doc';
  function hexRgb(h) { var n = parseInt(h.replace('#', ''), 16); return window.PDFLib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }
  function renderExport() {
    var hasPdf = !!pdf;
    $('exPages').disabled = !hasPdf; $('exOnlyNoted').disabled = !hasPdf;
    if (!hasPdf) { $('exPages').checked = false; }
    $('exPagesNote').textContent = hasPdf ? '保留原檔的文字（可以選取、搜尋），再疊上你的螢光筆、手寫和文字框。' : '貼上的文字沒有原始頁面，只能匯出生字表和筆記整理。';
    segButtons($('exScope'), [['doc', '這份文件的'], ['folder', '目前資料夾的'], ['all', '全部']], exScope, function (v) { exScope = v; renderExport(); });
    $('exCount').textContent = '共 ' + exportCards().length + ' 張生字卡';
  }
  function exportCards() {
    if (exScope === 'doc') { var d = docName(); return cards.filter(function (c) { return c.src === d; }); }
    if (exScope === 'folder') { return cards.filter(inFolder); }
    return cards.slice();
  }
  /* 文字層上某一類標記（螢光筆、註解底線）在每一頁的矩形，單位是頁面邏輯座標 */
  function markRects(selector) {
    var out = [], pr = $('page').getBoundingClientRect();
    Array.prototype.forEach.call(document.querySelectorAll('#text ' + selector), function (m) {
      Array.prototype.forEach.call(m.getClientRects(), function (r) {
        if (r.width < 0.5) { return; }
        out.push({ x: (r.left - pr.left) / scale, y: (r.top - pr.top) / scale, w: r.width / scale, h: r.height / scale, cls: m.className });
      });
    });
    return out;
  }
  /* 把文字框照畫面上的換行方式畫成圖片（瀏覽器會把泰文排好） */
  function boxImages() {
    var out = [], pr = $('page').getBoundingClientRect();
    Array.prototype.forEach.call(document.querySelectorAll('#boxes .note-text'), function (ed) {
      var id = Number(ed.getAttribute('data-id')), b = state.boxes.filter(function (x) { return x.id === id; })[0];
      if (!b || !b.t.trim()) { return; }
      var st = Object.assign({}, DEFAULT_STYLE, b.s || {}), cs = getComputedStyle(ed);
      var node = ed.firstChild, lines = [];
      if (node && node.nodeType === 3) {
        var rg = document.createRange(), cur = null;
        for (var i = 0; i < node.nodeValue.length; i++) {
          rg.setStart(node, i); rg.setEnd(node, i + 1);
          var rs = rg.getClientRects(); if (!rs.length) { continue; }
          var r = rs[0], ch = node.nodeValue[i];
          if (ch === '\n') { cur = null; continue; }
          if (!cur || Math.abs(r.top - cur.top) > r.height * 0.5) { cur = { top: r.top, left: r.left, bottom: r.bottom, t: '' }; lines.push(cur); }
          cur.t += ch; cur.bottom = Math.max(cur.bottom, r.bottom);
        }
      }
      if (!lines.length) { return; }
      var x0 = Math.min.apply(null, lines.map(function (l) { return l.left; })), y0 = lines[0].top, y1 = lines[lines.length - 1].bottom;
      var k = 3, fs = parseFloat(cs.fontSize), cv = document.createElement('canvas'), g = cv.getContext('2d');
      g.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      var logicalW = 0; lines.forEach(function (l) { logicalW = Math.max(logicalW, (l.left - x0) / scale + g.measureText(l.t).width); });
      var wL = logicalW + 4, hL = (y1 - y0) / scale + 4;
      cv.width = Math.ceil(wL * k); cv.height = Math.ceil(hL * k);
      g = cv.getContext('2d'); g.scale(k, k);
      g.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      g.fillStyle = LIGHT[st.color] || LIGHT.red; g.textBaseline = 'bottom';
      lines.forEach(function (l) { g.fillText(l.t, (l.left - x0) / scale + 1, (l.bottom - y0) / scale + 1); });
      out.push({ x: (x0 - pr.left) / scale - 1, y: (y0 - pr.top) / scale - 1, w: wL, h: hL, png: cv.toDataURL('image/png') });
    });
    return out;
  }
  /* 文字自動換行（以字元量寬度；泰文詞中也可能斷開，但不會跑位） */
  function wrapText(g, text, maxW) {
    var out = [];
    String(text).split('\n').forEach(function (para) {
      var seg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(para)).map(function (x) { return x.segment; }) : para.split('');
      var line = '';
      seg.forEach(function (w) {
        if (g.measureText(line + w).width > maxW && line) { out.push(line); line = w.replace(/^\s+/, ''); }
        else { line += w; }
        while (g.measureText(line).width > maxW && line.length > 1) {
          var cut = line.length - 1; while (cut > 1 && g.measureText(line.slice(0, cut)).width > maxW) { cut--; }
          out.push(line.slice(0, cut)); line = line.slice(cut);
        }
      });
      out.push(line);
    });
    return out;
  }
  /* 用畫布一頁一頁畫附錄（A4），回傳 PNG 清單 */
  function drawAppendix(title, blocks) {
    var W = 595.28, H = 841.89, k = 2.4, M = 46, pages = [], cv, g, y;
    var UI = getComputedStyle(document.documentElement).getPropertyValue('--ui') || 'sans-serif';
    var TH = getComputedStyle(document.documentElement).getPropertyValue('--thai') || 'sans-serif';
    function newPage() {
      if (cv) { pages.push(cv.toDataURL('image/png')); }
      cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      g = cv.getContext('2d'); g.scale(k, k); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#0d6b86'; g.font = '700 15px ' + UI; g.textBaseline = 'top';
      g.fillText(title + (pages.length ? '（續）' : ''), M, M - 18);
      g.fillStyle = '#9aa5b1'; g.font = '400 9px ' + UI;
      g.fillText(docName() + '・' + new Date().toLocaleDateString('zh-TW') + '・第 ' + (pages.length + 1) + ' 頁', M, H - M + 14);
      y = M + 8;
    }
    newPage();
    blocks.forEach(function (bl) {
      var parts = [];
      bl.forEach(function (p) {
        g.font = p.font.replace('$UI', UI).replace('$TH', TH);
        var ls = wrapText(g, p.text, W - 2 * M - (p.indent || 0));
        parts.push({ p: p, lines: ls, lh: p.size * 1.55 });
      });
      var need = parts.reduce(function (a, x) { return a + x.lines.length * x.lh; }, 0) + 12;
      if (y + need > H - M && y > M + 10) { newPage(); }
      parts.forEach(function (x) {
        g.font = x.p.font.replace('$UI', UI).replace('$TH', TH); g.fillStyle = x.p.color || '#1a1a1a'; g.textBaseline = 'top';
        x.lines.forEach(function (l) { if (y + x.lh > H - M) { newPage(); g.font = x.p.font.replace('$UI', UI).replace('$TH', TH); g.fillStyle = x.p.color || '#1a1a1a'; } g.fillText(l, M + (x.p.indent || 0), y); y += x.lh; });
      });
      g.strokeStyle = '#e3e8ee'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(M, y + 4); g.lineTo(W - M, y + 4); g.stroke();
      y += 12;
    });
    pages.push(cv.toDataURL('image/png'));
    return pages;
  }
  function vocabBlocks(list) {
    return list.map(function (c) {
      var g = glossSnapshot(c.w), zh = g.zh || c.zh, en = g.en || c.en, mean = [];
      if (c.my) { mean.push('我的意思：' + c.my); }
      if (glossLang !== 'en' && zh) { mean.push(zh); }
      if ((glossLang !== 'zh' || !zh) && en) { mean.push(en); }
      var b = [{ text: c.w + (c.rom ? '   ' + c.rom : '') + (c.pos ? '   ' + c.pos : ''), font: '700 15px $TH', size: 15, color: '#0d3b4c' }];
      if (mean.length) { b.push({ text: mean.join('\n'), font: '400 11px $UI', size: 11 }); }
      if (c.sent) { b.push({ text: c.sent, font: '400 10.5px $TH', size: 10.5, color: '#4a5562', indent: 10 }); }
      b.push({ text: srcText(c) + '・' + folderName(c.folder) + '・熟悉度 ' + c.box + ' / 5', font: '400 8.5px $UI', size: 8.5, color: '#9aa5b1' });
      return b;
    });
  }
  function noteBlocks() {
    var bl = [];
    state.hl.slice().sort(function (a, b) { return a[0] - b[0]; }).forEach(function (r) {
      var pg = pageOfIndex(r[0]);
      bl.push([{ text: '螢光筆' + (pg ? '・第 ' + pg + ' 頁' : ''), font: '700 9px $UI', size: 9, color: '#b08900' },
        { text: state.text.slice(r[0], r[1]).replace(/\s+/g, ' ').trim(), font: '400 13px $TH', size: 13 }]);
    });
    state.boxes.filter(function (b) { return b.t && b.t.trim(); }).forEach(function (b) {
      var pg = b.a ? pageOfIndex(b.a[0]) : (pdf ? (pageAtY(b.y) || {}).n : 0);
      var head = '文字框' + (pg ? '・第 ' + pg + ' 頁' : '') + (b.a ? '・註解「' + state.text.slice(b.a[0], b.a[1]) + '」' : '');
      bl.push([{ text: head, font: '700 9px $UI', size: 9, color: '#b42318' }, { text: b.t, font: '400 13px $UI', size: 13 }]);
    });
    if (state.strokes.length) {
      var pages = {};
      state.strokes.forEach(function (s) { var pg = pdf ? pageAtY(s.p[0][1]) : null; pages[pg ? pg.n : 0] = 1; });
      bl.push([{ text: '手寫筆記：' + state.strokes.length + ' 筆' + (pdf ? '（在第 ' + Object.keys(pages).join('、') + ' 頁，請看原文頁）' : ''), font: '400 11px $UI', size: 11, color: '#4a5562' }]);
    }
    return bl;
  }
  async function buildExportPdf() {
    await ensureLibs();
    var L = window.PDFLib, wantPages = pdf && $('exPages').checked, onlyNoted = $('exOnlyNoted').checked;
    var doc, notedPages = {};
    if (wantPages) {
      var bytes = await idbGet(state.src.id);
      if (!bytes) { throw new Error('裝置裡找不到原始 PDF，請重新開啟這份檔案再匯出'); }
      doc = await L.PDFDocument.load(new Uint8Array(bytes), { ignoreEncryption: true });
      var pagesOut = doc.getPages();
      var hls = markRects('mark.hl'), annos = markRects('mark.anno'), imgs = boxImages();
      for (var i = 0; i < pdf.pages.length && i < pagesOut.length; i++) {
        var pg = pdf.pages[i], P = pagesOut[i], rot = (P.getRotation().angle || 0) % 360;
        if (rot !== 0) { continue; }
        var cb = P.getCropBox(), s = pg.s;
        var X = function (x) { return cb.x + x / s; }, Y = function (y) { return cb.y + cb.height - (y - pg.top) / s; };
        var inPage = function (y) { return y >= pg.top - 2 && y <= pg.top + pg.h + 2; };
        hls.forEach(function (r) {
          if (!inPage(r.y + r.h / 2)) { return; }
          P.drawRectangle({ x: X(r.x), y: Y(r.y + r.h), width: r.w / s, height: r.h / s, color: hexRgb(LIGHT.hl), opacity: 0.35 });
          notedPages[i] = 1;
        });
        annos.forEach(function (r) {
          if (!inPage(r.y + r.h / 2)) { return; }
          var m = /anno-(\w+)/.exec(r.cls), col = hexRgb(LIGHT[m ? m[1] : 'red'] || LIGHT.red);
          P.drawLine({ start: { x: X(r.x), y: Y(r.y + r.h) + 0.6 }, end: { x: X(r.x + r.w), y: Y(r.y + r.h) + 0.6 }, thickness: 0.8, color: col, dashArray: [1.5, 1.5] });
        });
        state.strokes.forEach(function (st) {
          if (!st.p.some(function (q) { return inPage(q[1]); })) { return; }
          var d = st.p.map(function (q, n) { return (n ? 'L' : 'M') + q[0].toFixed(1) + ' ' + (q[1] - pg.top).toFixed(1); }).join(' ');
          if (st.p.length === 1) { d += ' L' + (st.p[0][0] + 0.1).toFixed(1) + ' ' + (st.p[0][1] - pg.top).toFixed(1); }
          P.drawSvgPath(d, { x: cb.x, y: cb.y + cb.height, scale: 1 / s, borderColor: hexRgb(LIGHT.ink), borderWidth: st.w, borderLineCap: L.LineCapStyle.Round });
          notedPages[i] = 1;
        });
        for (var j = 0; j < imgs.length; j++) {
          var im = imgs[j];
          if (!inPage(im.y + im.h / 2)) { continue; }
          var png = await doc.embedPng(im.png);
          P.drawImage(png, { x: X(im.x), y: Y(im.y + im.h), width: im.w / s, height: im.h / s });
          notedPages[i] = 1;
        }
      }
      if (onlyNoted) {
        for (var r2 = pagesOut.length - 1; r2 >= 0; r2--) { if (!notedPages[r2] && doc.getPageCount() > 1) { doc.removePage(r2); } }
      }
    } else {
      doc = await L.PDFDocument.create();
    }
    var extra = [];
    if ($('exVocab').checked) { var vl = exportCards(); if (vl.length) { extra = extra.concat(drawAppendix('生字表（' + vl.length + ' 個）', vocabBlocks(vl))); } }
    if ($('exNotes').checked) { var nb = noteBlocks(); if (nb.length) { extra = extra.concat(drawAppendix('筆記整理', nb)); } }
    for (var e = 0; e < extra.length; e++) {
      var img = await doc.embedPng(extra[e]);
      var np = doc.addPage([595.28, 841.89]);
      np.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    if (!doc.getPageCount()) { throw new Error('沒有可以匯出的內容：請至少勾選一項，或先加一些生字卡和筆記'); }
    doc.setTitle(docName() + ' 筆記'); doc.setProducer('泰文閱讀 App（測試版）');
    var out = await doc.save();
    return { blob: new Blob([out], { type: 'application/pdf' }), pages: doc.getPageCount(), extra: extra.length };
  }
  $('openExport').addEventListener('click', function () {
    var panel = $('exportp'), open = panel.hidden;
    panel.hidden = !open; $('openExport').setAttribute('aria-expanded', String(open));
    if (open) { hidePop(); renderExport(); panel.scrollIntoView({ block: 'nearest' }); }
  });
  $('closeExport').addEventListener('click', function () { $('exportp').hidden = true; $('openExport').setAttribute('aria-expanded', 'false'); });
  $('exGo').addEventListener('click', async function () {
    var btn = $('exGo'); btn.disabled = true; $('exStatus').textContent = '產生中…（頁數多的檔案要等一下）';
    try {
      var t0 = Date.now(), r = await buildExportPdf();
      $('exStatus').textContent = '完成：共 ' + r.pages + ' 頁（' + (r.blob.size / 1048576).toFixed(1) + ' MB，' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒）。正在交給你存檔…';
      var res = await saveFile(safeName(docName()) + '-筆記-' + ymd() + '.pdf', r.blob);
      exportStatus = '成功 ' + r.pages + ' 頁，存檔：' + saveStatus;
      $('exStatus').textContent = res === 'saved' ? '已匯出 ' + r.pages + ' 頁。在跳出的視窗選「儲存到檔案」或其他 App。' : (res === 'declined' ? '已取消存檔。' : '產生好了，但存不了檔：' + saveStatus);
    } catch (err) {
      exportStatus = '失敗：' + String(err && err.message || err).slice(0, 80);
      $('exStatus').textContent = '匯出失敗：' + String(err && err.message || err);
    } finally { btn.disabled = false; renderReport(); }
  });
