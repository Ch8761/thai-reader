  /* ====== 1.25：資料夾下拉、長按多選文件、生字卡匯出、上次複習日 ====== */
  var CX_EN = false; try { CX_EN = localStorage.getItem('thai-ui-lang') === 'en'; } catch (err) {}
  function cxL(zh, en) { return CX_EN ? en : zh; }
  var FOOT_NAME = '';

  /* --- 上次複習日 --- */
  function lastTs(c) { return c.last || (c.seen && c.fs && c.fs.t) || 0; }
  function lastLine(c) {
    var t = lastTs(c); if (!t) { return '還沒複習'; }
    var d = new Date(t), now = new Date(), md = (d.getMonth() + 1) + '/' + d.getDate();
    return '上次複習 ' + (d.getFullYear() === now.getFullYear() ? md : d.getFullYear() + '/' + md);
  }
  function lastIso(c) {
    var t = lastTs(c); if (!t) { return '—'; }
    var d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* --- 資料夾分頁下面的小選單（改名、刪除資料夾） --- */
  function folderMenu(host, seg, onRename, onDelete, sureText) {
    var m = el('div', 'fmenu'); m.setAttribute('role', 'menu');
    var ren = el('button', '', {{fm_rename}}); ren.type = 'button'; ren.setAttribute('role', 'menuitem');
    ren.addEventListener('click', onRename);
    var del = el('button', 'cdel', {{fm_delete}}); del.type = 'button'; del.setAttribute('role', 'menuitem');
    del.addEventListener('click', function () {
      if (del.getAttribute('data-sure') !== '1') { del.setAttribute('data-sure', '1'); del.textContent = sureText; return; }
      onDelete();
    });
    m.appendChild(ren); m.appendChild(del);
    host.appendChild(m);
    var on = seg.querySelector('[aria-checked="true"]');
    if (on) {
      var hr = host.getBoundingClientRect(), br = on.getBoundingClientRect();
      m.style.top = Math.round(br.bottom - hr.top + 2) + 'px';
      m.style.left = Math.max(0, Math.min(Math.round(br.left - hr.left), Math.round(hr.width - 200))) + 'px';
    }
    return m;
  }
  function closeFolderMenus() {
    if (libMenu) { libMenu = false; renderHome(); }
    if (cardMenu) { cardMenu = false; renderCards(); }
  }
  document.addEventListener('click', function (e) {
    if (!libMenu && !cardMenu) { return; }
    if (e.target && e.target.closest && e.target.closest('.fmenu, .hasmenu')) { return; }
    closeFolderMenus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (libMenu || cardMenu)) { closeFolderMenus(); } });

  /* --- 長按文件 → 多選 → 移到資料夾 --- */
  var docSel = null, docMoveOpen = false, docLpAt = 0, selTipOk = null, SELTIP_KEY = 'thai-select-tip';
  var selBar = document.createElement('div'); selBar.className = 'selbar'; selBar.id = 'selBar'; selBar.hidden = true;
  selBar.setAttribute('role', 'toolbar'); selBar.setAttribute('aria-label', {{sel_aria}});
  document.body.appendChild(selBar);
  function docSelCount() { return docSel ? Object.keys(docSel).length : 0; }
  function docSelCheckSvg() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'; }
  function docSelAttach(li, d) {
    li.classList.add('selable'); li.setAttribute('data-id', d.id);
    var chk = el('span', 'dchk'); chk.setAttribute('aria-hidden', 'true'); chk.innerHTML = docSelCheckSvg(); li.appendChild(chk);
    var timer = 0, sx = 0, sy = 0, fired = false;
    function stop() { if (timer) { clearTimeout(timer); timer = 0; } }
    li.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) { return; }
      if (e.target.closest && e.target.closest('.dside, .dmore')) { return; }
      fired = false; stop(); sx = e.clientX; sy = e.clientY;
      timer = setTimeout(function () {
        timer = 0; fired = true; docLpAt = Date.now();
        try { if (navigator.vibrate) { navigator.vibrate(12); } } catch (err) {}
        docSelToggle(d.id, true);
      }, 500);
    });
    li.addEventListener('pointermove', function (e) { if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { stop(); } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { li.addEventListener(t, stop); });
    li.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* 捕獲階段：選取中，點文件是「勾選」不是「打開」；長按放開時接著來的那一下點擊也要吃掉 */
    li.addEventListener('click', function (e) {
      if (fired && Date.now() - docLpAt < 8000) { fired = false; e.preventDefault(); e.stopPropagation(); return; }
      if (!docSel) { return; }
      if (e.target.closest && e.target.closest('.dside, .dmore')) { return; }
      e.preventDefault(); e.stopPropagation(); docSelToggle(d.id);
    }, true);
  }
  function docSelToggle(id, start) {
    if (!docSel) { docSel = {}; docMoveOpen = false; selTipOk = false; try { localStorage.setItem(SELTIP_KEY, '9'); } catch (err) {} }
    if (start) { docSel[id] = true; } else if (docSel[id]) { delete docSel[id]; } else { docSel[id] = true; }
    if (!docSelCount()) { docSel = null; docMoveOpen = false; }
    docSelRefresh();
  }
  function docSelClear() { docSel = null; docMoveOpen = false; docSelRefresh(); }
  function docSelRefresh() {
    var ul = $('docList'); if (!ul || !selBar) { return; }
    var visible = {}; lib.docs.filter(libIn).forEach(function (d) { visible[d.id] = true; });
    if (docSel) { Object.keys(docSel).forEach(function (id) { if (!visible[id]) { delete docSel[id]; } }); if (!docSelCount()) { docSel = null; } }
    if (docSel && curTab !== 'home') { docSel = null; }
    var on = !!docSel;
    ul.classList.toggle('selecting', on); document.body.classList.toggle('selmode', on);
    Array.prototype.forEach.call(ul.querySelectorAll('.doccard'), function (li) {
      var p = on && docSel[li.getAttribute('data-id')], ob = li.querySelector('.dopen');
      li.classList.toggle('picked', !!p);
      if (ob) { if (on) { ob.setAttribute('aria-pressed', String(!!p)); } else { ob.removeAttribute('aria-pressed'); } }
    });
    docBarRender();
    /* 長按小提示：只出現前幾次，用過一次就不再出現 */
    var vis = Object.keys(visible).length, canTip = !on && vis >= 2 && curTab === 'home';
    if (canTip && selTipOk === null) {
      var tn = 0; try { tn = parseInt(localStorage.getItem(SELTIP_KEY) || '0', 10) || 0; } catch (err) {}
      selTipOk = tn < 4; if (selTipOk) { try { localStorage.setItem(SELTIP_KEY, String(tn + 1)); } catch (err) {} }
    }
    var want = canTip && selTipOk === true, tip = $('selTip');
    if (want && !tip) { tip = el('p', 'swtip', {{sel_tip}}); tip.id = 'selTip'; ul.parentNode.insertBefore(tip, ul); }
    if (tip) { tip.hidden = !want; }
  }
  function docMove(folderId) {
    var ids = Object.keys(docSel || {}), before = {};
    ids.forEach(function (id) { var d = lib.docs.filter(function (x) { return x.id === id; })[0]; if (d) { before[id] = d.folder || ''; d.folder = folderId; } });
    var n = ids.length;
    docSel = null; docMoveOpen = false; saveLib(); renderHome();
    showSnack('已移動 ' + n + ' 份文件', function () {
      lib.docs.forEach(function (d) { if (before[d.id] !== undefined) { d.folder = before[d.id]; } });
      saveLib(); renderHome();
    });
  }
  function docBarRender() {
    var bar = selBar; bar.replaceChildren();
    if (!docSel) { bar.hidden = true; return; }
    bar.hidden = false;
    var x = el('button', 'selx', '×'); x.type = 'button'; x.setAttribute('aria-label', {{sel_cancel}});
    x.addEventListener('click', docSelClear);
    var cnt = el('span', 'selcount', '已選 ' + docSelCount() + ' 份'); cnt.setAttribute('aria-live', 'polite');
    var all = el('button', '', {{sel_all}}); all.type = 'button';
    all.addEventListener('click', function () { lib.docs.filter(libIn).forEach(function (d) { docSel[d.id] = true; }); docSelRefresh(); });
    var mv = el('button', 'primary', {{sel_move}}); mv.type = 'button'; mv.setAttribute('aria-haspopup', 'menu'); mv.setAttribute('aria-expanded', String(docMoveOpen));
    mv.addEventListener('click', function () { docMoveOpen = !docMoveOpen; docBarRender(); });
    bar.appendChild(x); bar.appendChild(cnt); bar.appendChild(all); bar.appendChild(mv);
    if (docMoveOpen) {
      var m = el('div', 'selmenu'); m.setAttribute('role', 'menu');
      [['', {{sel_nofolder}}]].concat(lib.folders.map(function (f) { return [f.id, f.name]; })).forEach(function (o) {
        var b = el('button', '', o[1]); b.type = 'button'; b.setAttribute('role', 'menuitem');
        if (o[0]) { b.setAttribute('data-noi18n', '1'); }
        b.addEventListener('click', function () { docMove(o[0]); });
        m.appendChild(b);
      });
      var nw = el('div', 'selnew');
      var inp = el('input'); inp.type = 'text'; inp.maxLength = 30; inp.placeholder = {{sel_newname}}; inp.setAttribute('aria-label', {{sel_newname}});
      var go = el('button', 'primary', {{sel_create}}); go.type = 'button';
      function create() {
        var name = inp.value.trim(); if (!name) { inp.focus(); return; }
        var f = { id: 'd' + Date.now().toString(36), name: name }; lib.folders.push(f); docMove(f.id);
      }
      go.addEventListener('click', create);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { create(); } });
      nw.appendChild(inp); nw.appendChild(go); m.appendChild(nw);
      bar.appendChild(m);
    }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && docSel) { docSelClear(); } });

  /* --- 生字卡匯出：Word / PDF / Anki --- */
  var cxScope = 'shown', cxBusy = false;
  function cxShown() {
    var doc = docName(), f = clGet(CF_KEY, 'all');
    var a = cards.filter(function (c) { return inFolder(c) && (!cardsOnlyDoc || c.src === doc); });
    if (f === 'fav') { var b = a.filter(function (c) { return c.fav; }); if (b.length) { return b; } }
    return a;
  }
  function cxList() { return cxScope === 'all' ? cards.slice() : cxShown(); }
  function cxMean(c) {
    var g = glossSnapshot(c.w), zh = g.zh || c.zh, en = g.en || c.en, m = [];
    if (c.my) { m.push(c.my); }
    if (glossLang !== 'en' && zh) { m.push(zh); }
    if ((glossLang !== 'zh' || !zh) && en) { m.push(en); }
    return m;
  }
  function cxEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function cxAnki(list) {
    var head = '#separator:tab\n#html:true\n#tags column:4\n';
    return head + list.map(function (c) {
      var back = [c.rom, c.my, cxMean(c).filter(function (x) { return x !== c.my; }).join(' / ')].filter(Boolean).map(cxEsc).join('<br>');
      var front = cxEsc(c.w) + (c.sent ? '<br><small>' + cxEsc(c.sent) + '</small>' : '');
      var tag = '泰文' + (c.folder ? '::' + folderName(c.folder).replace(/\s+/g, '_') : '');
      return [front, back, srcText(c), tag].map(function (x) { return String(x).replace(/[\t\r\n]+/g, ' '); }).join('\t');
    }).join('\n') + '\n';
  }
  /* 最簡單的 .docx：把 XML 檔用「只存不壓縮」的 ZIP 包起來，Word、Pages、Google 文件都開得了 */
  var CX_CRC = null;
  function cxCrc(u8) {
    if (!CX_CRC) { CX_CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) { c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; } CX_CRC[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) { crc = CX_CRC[(crc ^ u8[i]) & 255] ^ (crc >>> 8); }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function cxZip(files, mime) {
    var enc = new TextEncoder(), parts = [], cd = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), data = enc.encode(f.text), crc = cxCrc(data), sz = data.length;
      var lh = new Uint8Array(30 + nm.length), v = new DataView(lh.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true); v.setUint16(10, 0, true); v.setUint16(12, 0x21, true);
      v.setUint32(14, crc, true); v.setUint32(18, sz, true); v.setUint32(22, sz, true); v.setUint16(26, nm.length, true); v.setUint16(28, 0, true); lh.set(nm, 30);
      parts.push(lh, data);
      var ch = new Uint8Array(46 + nm.length), w = new DataView(ch.buffer);
      w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(8, 0x0800, true); w.setUint16(10, 0, true); w.setUint16(12, 0, true); w.setUint16(14, 0x21, true);
      w.setUint32(16, crc, true); w.setUint32(20, sz, true); w.setUint32(24, sz, true); w.setUint16(28, nm.length, true); w.setUint32(42, off, true); ch.set(nm, 46);
      cd.push(ch); off += lh.length + sz;
    });
    var cdSize = cd.reduce(function (a, b) { return a + b.length; }, 0), end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cd, [end]), { type: mime });
  }
  function cxX(s) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function cxRun(t, o) {
    o = o || {}; var sz = o.sz || 20;
    return '<w:r><w:rPr>' + (o.b ? '<w:b/><w:bCs/>' : '') + (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/></w:rPr><w:t xml:space="preserve">' + cxX(t) + '</w:t></w:r>';
  }
  function cxPara(t, o) { return '<w:p><w:pPr><w:spacing w:after="30"/></w:pPr>' + (t === '' ? '' : cxRun(t, o)) + '</w:p>'; }
  function cxCell(w, paras, fill) {
    return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + fill + '"/>' : '') + '</w:tcPr>' + (paras.length ? paras.join('') : '<w:p/>') + '</w:tc>';
  }
  function cxDocx(list) {
    var W = [2300, 2100, 3800, 4000, 1800, 1398], head = [{{docx_h1|en}}, {{docx_h2|en}}, {{docx_h3|en}}, {{docx_h4|en}}, {{docx_h5|en}}, {{docx_h6|en}}];
    if (!CX_EN) { head = [{{docx_h1}}, {{docx_h2}}, {{docx_h3}}, {{docx_h4}}, {{docx_h5}}, {{docx_h6}}]; }
    var rows = '<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' + head.map(function (h, i) { return cxCell(W[i], [cxPara(h, { b: 1, color: 'FFFFFF' })], '0D6B86'); }).join('') + '</w:tr>';
    list.forEach(function (c) {
      var wc = [cxPara(c.w, { b: 1, sz: 28 })]; if (c.pos) { wc.push(cxPara(c.pos, { sz: 16, color: '777777' })); }
      var src = [cxPara(srcText(c), { sz: 18 })]; if (c.folder) { src.push(cxPara(folderName(c.folder), { sz: 16, color: '777777' })); }
      rows += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cxCell(W[0], wc) + cxCell(W[1], [cxPara(c.rom || '')]) + cxCell(W[2], cxMean(c).map(function (m) { return cxPara(m); })) +
        cxCell(W[3], [cxPara(c.sent || '', { sz: 20 })]) + cxCell(W[4], src) + cxCell(W[5], [cxPara(lastIso(c), { sz: 18 })]) + '</w:tr>';
    });
    var bd = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="D3D9DF"/>'; }).join('');
    var d = new Date(), ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var body = '<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>' + cxRun(cxL({{docx_title}}, {{docx_title|en}}), { b: 1, sz: 36, color: '0D6B86' }) + '</w:p>' +
      cxPara(ds + '  ·  ' + list.length + cxL(' 張', ' cards'), { sz: 18, color: '777777' }) + '<w:p/>' +
      '<w:tbl><w:tblPr><w:tblW w:w="' + W.reduce(function (a, b) { return a + b; }, 0) + '" w:type="dxa"/><w:tblBorders>' + bd + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' +
      W.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>' + rows + '</w:tbl><w:p/>' +
      '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>';
    var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"', H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    return cxZip([
      { name: '[Content_Types].xml', text: H + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
      { name: '_rels/.rels', text: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/_rels/document.xml.rels', text: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'word/styles.xml', text: H + '<w:styles ' + NS + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:eastAsia="Microsoft JhengHei" w:cs="Tahoma"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-US" w:eastAsia="zh-TW" w:bidi="th-TH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>' },
      { name: 'word/document.xml', text: H + '<w:document ' + NS + '><w:body>' + body + '</w:body></w:document>' }
    ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }
  async function cxPdf(list) {
    await ensureLibs();
    var L = window.PDFLib, doc = await L.PDFDocument.create(), pages;
    FOOT_NAME = cxL({{docx_title}}, {{docx_title|en}});
    try { pages = drawAppendix(cxL('生字表（' + list.length + ' 個）', 'Vocabulary (' + list.length + ')'), vocabBlocks(list)); } finally { FOOT_NAME = ''; }
    for (var i = 0; i < pages.length; i++) {
      var img = await doc.embedPng(pages[i]), np = doc.addPage([595.28, 841.89]);
      np.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    doc.setTitle(cxL({{docx_title}}, {{docx_title|en}})); doc.setProducer('Thai Reader');
    return new Blob([await doc.save()], { type: 'application/pdf' });
  }
  var cxWrap = document.createElement('div'); cxWrap.className = 'cdlayer'; cxWrap.id = 'cardExport'; cxWrap.hidden = true;
  cxWrap.innerHTML = '<div class="cdback" id="cxBack"></div><div class="cdsheet" role="dialog" aria-modal="true" aria-labelledby="cxTitle"><button type="button" class="cdx" id="cxClose">×</button><div class="cdscroll" id="cxBody"></div></div>';
  document.body.appendChild(cxWrap);
  $('cxClose').setAttribute('aria-label', {{cx_close}});
  function closeCx() { cxWrap.hidden = true; document.body.classList.remove('cdopen'); }
  $('cxClose').addEventListener('click', closeCx);
  $('cxBack').addEventListener('click', closeCx);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !cxWrap.hidden) { closeCx(); } });
  function cxMsg(t) { var m = $('cxMsg'); if (m) { m.textContent = t; } }
  function cxRender() {
    var body = $('cxBody'); body.replaceChildren();
    var h = el('h2', 'lqsh', {{cx_title}}); h.id = 'cxTitle'; body.appendChild(h);
    var nAll = cards.length, nShown = cxShown().length;
    if (!nAll) { body.appendChild(el('p', 'label', {{cx_empty}})); return; }
    if (nShown === nAll) { cxScope = 'all'; body.appendChild(el('p', 'label', '共 ' + nAll + ' 張')); }
    else {
      var sc = el('div', 'seg cxseg'); sc.setAttribute('role', 'radiogroup'); sc.setAttribute('aria-label', {{cx_scope}}); body.appendChild(sc);
      segButtons(sc, [['shown', '目前顯示的 ' + nShown + ' 張'], ['all', '全部 ' + nAll + ' 張']], cxScope, function (v) { cxScope = v; cxRender(); });
    }
    var fm = [['docx', 'Word (.docx)', {{cx_word_sub}}], ['pdf', 'PDF', {{cx_pdf_sub}}], ['anki', 'Anki (.txt)', {{cx_anki_sub}}]];
    fm.forEach(function (x) {
      var b = el('button', 'exfmt'); b.type = 'button'; b.setAttribute('data-fmt', x[0]);
      b.appendChild(el('b', '', x[1])); b.appendChild(el('span', '', x[2]));
      b.addEventListener('click', function () { cxGo(x[0]); });
      body.appendChild(b);
    });
    var cp = el('button', 'linkbtn cxcopy', {{cx_copy}}); cp.type = 'button';
    cp.addEventListener('click', function () { cxCopy(); });
    body.appendChild(cp);
    var ta = el('textarea', 'ankibox'); ta.id = 'cxText'; ta.readOnly = true; ta.hidden = true; ta.setAttribute('aria-label', 'Anki'); ta.setAttribute('data-noi18n', '1');
    body.appendChild(ta);
    var msg = el('p', 'label'); msg.id = 'cxMsg'; msg.setAttribute('aria-live', 'polite'); body.appendChild(msg);
  }
  function cxBusySet(on) { cxBusy = on; Array.prototype.forEach.call(document.querySelectorAll('#cxBody .exfmt'), function (b) { b.disabled = on; }); }
  async function cxGo(kind) {
    if (cxBusy) { return; }
    var list = cxList(); if (!list.length) { cxMsg({{cx_empty}}); return; }
    cxBusySet(true); cxMsg({{cx_busy}});
    try {
      var blob, name = 'thai-flashcards-' + ymd();
      if (kind === 'docx') { blob = cxDocx(list); name += '.docx'; }
      else if (kind === 'pdf') { blob = await cxPdf(list); name += '.pdf'; }
      else { blob = new Blob([cxAnki(list)], { type: 'text/plain;charset=utf-8' }); name += '.txt'; }
      var r = await saveFile(name, blob);
      cxMsg(r === 'declined' ? {{cx_cancel}} : '已匯出 ' + list.length + ' 張。如果跳出視窗，請選「儲存到檔案」。');
    } catch (err) { cxMsg('匯出失敗：' + String(err && err.message || err).slice(0, 80)); }
    cxBusySet(false);
  }
  function cxCopy() {
    var txt = cxAnki(cxList()), ta = $('cxText');
    function fallback() { ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); cxMsg({{cx_copy_fail}}); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { cxMsg({{cx_copied}}); }, fallback); }
      else { fallback(); }
    } catch (err) { fallback(); }
  }
  function openCx() {
    cxScope = 'shown'; cxRender(); cxWrap.hidden = false; document.body.classList.add('cdopen');
    setTimeout(function () { var b = cxWrap.querySelector('.exfmt') || $('cxClose'); b.focus(); }, 30);
  }
  $('openCardExport').addEventListener('click', openCx);
