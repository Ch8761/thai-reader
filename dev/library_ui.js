  /* ---------- App 外框：底部分頁、主頁文件庫（含資料夾）、外觀模式 ---------- */
  var LIB_KEY = 'thai-docs-v1', TAB_KEY = 'thai-tab', THEME_KEY = 'thai-theme';
  var lib = { docs: [], folders: [], cur: 'all' }, libFolderEdit = null, curTab = 'home', theme = 'system';
  try { var rawL = localStorage.getItem(LIB_KEY); if (rawL) { lib = Object.assign(lib, JSON.parse(rawL)); } } catch (err) {}
  try { theme = localStorage.getItem(THEME_KEY) || 'system'; } catch (err) {}
  function saveLib() { try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); } catch (err) {} }
  function docById(id) { for (var i = 0; i < lib.docs.length; i++) { if (lib.docs[i].id === id) { return lib.docs[i]; } } return null; }
  function libFolderName(id) { if (!id) { return '未分類'; } var f = lib.folders.filter(function (x) { return x.id === id; })[0]; return f ? f.name : '未分類'; }
  function libIn(d) { return lib.cur === 'all' || (lib.cur === 'none' ? !d.folder : d.folder === lib.cur); }
  function libTarget() { return (lib.cur === 'all' || lib.cur === 'none') ? '' : lib.cur; }
  function idbPut(k, v) {
    return idb().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(v, k); tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); }; }); });
  }
  function idbDel(k) {
    return idb().then(function (db) { return new Promise(function (res) { var tx = db.transaction('files', 'readwrite'); tx.objectStore('files').delete(k); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); });
  }
  /* 開過的 PDF 都登記進文件庫 */
  function libRegisterPdf(id, name, size, pages) {
    var d = docById(id);
    if (!d) { d = { id: id, name: name, type: 'pdf', size: size, pages: pages, added: Date.now(), folder: libTarget() }; lib.docs.push(d); }
    d.pages = pages; d.opened = Date.now();
    saveLib(); renderHome();
  }
  /* 第一次升級：把舊的單一文件搬進文件庫 */
  function libMigrate() {
    if (lib.docs.length) { return; }
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(PDF_DOC_PREFIX) !== 0) { continue; }
        var o = JSON.parse(localStorage.getItem(k) || 'null');
        if (o && o.src && o.src.type === 'pdf' && !docById(o.src.id)) {
          lib.docs.push({ id: o.src.id, name: o.src.name, type: 'pdf', size: Number(String(o.src.id).split('|').pop()) || 0, pages: o.src.pages || 0, added: Date.now() - 1000, opened: 0, folder: '' });
        }
      }
    } catch (err) {}
    if (!state.src) {
      var id = 'text:' + Date.now().toString(36), name = state.text === SAMPLE ? '範例文字' : '貼上的文字';
      state.src = { type: 'text', id: id, name: name };
      lib.docs.push({ id: id, name: name, type: 'text', size: state.text.length, added: Date.now(), opened: Date.now(), folder: '' });
      save();
    } else if (state.src.type === 'pdf' && docById(state.src.id)) { docById(state.src.id).opened = Date.now(); }
    saveLib();
  }
  function noteCount(id) {
    try {
      var o = JSON.parse(localStorage.getItem(PDF_DOC_PREFIX + id) || 'null');
      if (!o) { return 0; }
      return (o.hl || []).length + (o.strokes || []).length + (o.boxes || []).length;
    } catch (err) { return 0; }
  }
  function ago(t) {
    if (!t) { return '還沒開過'; }
    var m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) { return '剛剛開過'; } if (m < 60) { return m + ' 分鐘前開過'; }
    var h = Math.floor(m / 60); if (h < 24) { return h + ' 小時前開過'; }
    return Math.floor(h / 24) + ' 天前開過';
  }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function renderHomeFolders() {
    var host = $('homeFolders'), bar = $('homeFolderBar');
    host.replaceChildren();
    if (bar) { bar.replaceChildren(); bar.hidden = true; }
    var opts = [['all', '全部（' + lib.docs.length + '）'], ['none', '未分類（' + lib.docs.filter(function (d) { return !d.folder; }).length + '）']]
      .concat(lib.folders.map(function (f) { return [f.id, f.name + '（' + lib.docs.filter(function (d) { return d.folder === f.id; }).length + '）']; }));
    var seg = mk('div', 'seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', '文件資料夾');
    host.appendChild(seg);
    segButtons(seg, opts, lib.cur, function (v) { lib.cur = v; libFolderEdit = null; saveLib(); renderHome(); });
    var custom = lib.cur !== 'all' && lib.cur !== 'none';
    function editor(kind) {
      var row = mk('div', 'btns frow');
      var inp = mk('input', 'fname'); inp.type = 'text'; inp.maxLength = 30; inp.placeholder = '資料夾名稱'; inp.setAttribute('aria-label', '資料夾名稱');
      inp.value = kind === 'new' ? '' : libFolderName(lib.cur);
      var ok = mk('button', 'primary', kind === 'new' ? '建立' : '改名'); ok.type = 'button';
      var no = mk('button', '', '取消'); no.type = 'button';
      var commit = function () {
        var name = inp.value.trim(); if (!name) { inp.focus(); return; }
        if (kind === 'new') { var f = { id: 'd' + Date.now().toString(36), name: name }; lib.folders.push(f); lib.cur = f.id; }
        else { lib.folders.forEach(function (f) { if (f.id === lib.cur) { f.name = name; } }); }
        libFolderEdit = null; saveLib(); renderHome();
      };
      ok.addEventListener('click', commit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { commit(); } });
      no.addEventListener('click', function () { libFolderEdit = null; renderHome(); });
      row.appendChild(inp); row.appendChild(ok); row.appendChild(no);
      setTimeout(function () { inp.focus(); }, 20);
      return row;
    }
    if (libFolderEdit === 'new') { host.appendChild(editor('new')); }
    else {
      var row = mk('div', 'btns frow');
      var add = mk('button', 'fadd', '＋ 新資料夾'); add.type = 'button';
      add.addEventListener('click', function () { libFolderEdit = 'new'; renderHome(); });
      row.appendChild(add);
      host.appendChild(row);
    }
    /* 選了自己建的資料夾：在文件清單上方顯示資料夾名稱，改名、刪除放在這裡 */
    if (custom && bar) {
      bar.hidden = false;
      if (libFolderEdit === 'rename') { bar.appendChild(editor('rename')); return; }
      bar.appendChild(mk('span', 'fbname', libFolderName(lib.cur)));
      var ren = mk('button', '', '改名'); ren.type = 'button';
      ren.addEventListener('click', function () { libFolderEdit = 'rename'; renderHome(); });
      var del = mk('button', 'cdel', '刪除資料夾'); del.type = 'button';
      del.addEventListener('click', function () {
        if (del.getAttribute('data-sure') !== '1') { del.setAttribute('data-sure', '1'); del.textContent = '再按一次確定（文件會移到未分類）'; return; }
        var id = lib.cur;
        lib.docs.forEach(function (d) { if (d.folder === id) { d.folder = ''; } });
        lib.folders = lib.folders.filter(function (f) { return f.id !== id; });
        lib.cur = 'all'; saveLib(); renderHome();
      });
      bar.appendChild(ren); bar.appendChild(del);
    }
  }
  function renderHome() {
    if (!$('docList')) { return; }
    renderHomeFolders();
    var ul = $('docList'), list = lib.docs.filter(libIn).sort(function (a, b) { return (b.opened || b.added || 0) - (a.opened || a.added || 0); });
    ul.replaceChildren();
    $('homeEmpty').hidden = !!list.length;
    $('homeEmpty').textContent = lib.docs.length ? '這個資料夾還沒有文件。' : '還沒有文件。按上面的「＋ 加入 PDF」或「＋ 貼上文字」開始。';
    $('homeTarget').textContent = '新加入的文件會放進：' + libFolderName(libTarget());
    list.forEach(function (d) {
      var li = mk('li', 'doccard' + (state.src && state.src.id === d.id ? ' current' : ''));
      var icon = mk('span', 'dicon ' + d.type, d.type === 'pdf' ? 'PDF' : '文');
      icon.setAttribute('aria-hidden', 'true');
      var open = mk('button', 'dopen'); open.type = 'button';
      open.appendChild(mk('span', 'dname', d.name));
      var n = noteCount(d.id);
      open.appendChild(mk('span', 'dmeta', (d.type === 'pdf' ? 'PDF' + (d.pages ? '・' + d.pages + ' 頁' : '') : '文字・' + (d.size || 0) + ' 字') + '・' + ago(d.opened) + (n ? '・筆記 ' + n : '') + (state.src && state.src.id === d.id ? '・目前開著' : '')));
      open.setAttribute('aria-label', '打開 ' + d.name);
      open.addEventListener('click', function () { openDoc(d.id); });
      var side = mk('div', 'dside');
      var mv = mk('select', 'cmove'); mv.setAttribute('aria-label', '把 ' + d.name + ' 移到資料夾');
      [['', '未分類']].concat(lib.folders.map(function (f) { return [f.id, f.name]; })).forEach(function (o) {
        var op = mk('option', '', o[1]); op.value = o[0]; if ((d.folder || '') === o[0]) { op.selected = true; } mv.appendChild(op);
      });
      mv.addEventListener('change', function () { d.folder = mv.value; saveLib(); renderHome(); });
      var del = mk('button', 'cdel', '刪除'); del.type = 'button'; del.setAttribute('aria-label', '刪除 ' + d.name);
      del.addEventListener('click', function () {
        if (del.getAttribute('data-sure') !== '1') { del.setAttribute('data-sure', '1'); del.textContent = '再按一次刪除（筆記也會刪掉）'; return; }
        deleteDoc(d.id);
      });
      side.appendChild(mv); side.appendChild(del);
      li.appendChild(icon); li.appendChild(open); li.appendChild(side);
      ul.appendChild(li);
    });
  }
  function deleteDoc(id) {
    var wasCur = state.src && state.src.id === id;
    lib.docs = lib.docs.filter(function (d) { return d.id !== id; });
    saveLib();
    try { localStorage.removeItem(PDF_DOC_PREFIX + id); } catch (err) {}
    idbDel(id); idbDel('ocr:' + id);
    if (wasCur) {
      teardownPdf();
      state = { text: '', src: null, hl: [], strokes: [], boxes: [], nextId: 1, style: state.style };
      segs = []; history = []; tapSel = null;
      save(); syncDocView();
    }
    renderHome();
  }
  function syncDocView() {
    var has = !!(state.src);
    $('docempty').hidden = has; $('docbody').hidden = !has; $('openExport').hidden = !has;
    $('h-docv').textContent = has ? state.src.name : '文件';
    if (has && curTab === 'doc') { layout(); }
  }
  function openDoc(id) {
    var d = docById(id);
    if (!d) { return; }
    if (state.src && state.src.id === id && (d.type === 'text' || pdf)) { d.opened = Date.now(); saveLib(); showTab('doc'); return; }
    if (state.src && state.src.id) { save(); }
    hidePop();
    if (d.type === 'pdf') {
      showTab('doc');
      $('docempty').hidden = true; $('docbody').hidden = false; $('h-docv').textContent = d.name;
      idbGet(id).then(function (bytes) {
        if (!bytes) { throw new Error('missing'); }
        return openPdfBytes(new Uint8Array(bytes), d.name, state.src && state.src.id === id && !!pdf ? true : false);
      }).then(function () { d.opened = Date.now(); saveLib(); renderHome(); syncDocView(); }).catch(function (err) {
        showTab('home');
        $('homeMsg').textContent = String(err && err.message) === 'missing' ? '找不到「' + d.name + '」的檔案（可能是換了裝置或清除過資料）。請按「＋ 加入 PDF」重新選同一個檔案，筆記會自動接回。' : '打不開「' + d.name + '」：' + String(err && err.message || err);
      });
      return;
    }
    teardownPdf();
    var o = null;
    try { o = JSON.parse(localStorage.getItem(PDF_DOC_PREFIX + id) || 'null'); } catch (err) { o = null; }
    state = Object.assign({ text: '', hl: [], strokes: [], boxes: [], nextId: 1 }, o || {}, { src: { type: 'text', id: id, name: d.name }, style: state.style });
    segs = segment(state.text); history = []; tapSel = null;
    d.opened = Date.now(); saveLib();
    pdfInfo.status = '目前顯示：' + d.name + '（文字，' + state.text.length + ' 字）';
    setDocStatus('');
    showTab('doc');
    renderAllNotes(); save(); refreshTranslateLink(); renderHome(); syncDocView();
  }
  function libAddPdfFiles(files) {
    var list = Array.prototype.slice.call(files || []).filter(function (f) { return /pdf$/i.test(f.name) || f.type === 'application/pdf'; });
    if (!list.length) { $('homeMsg').textContent = '請選副檔名是 .pdf 的檔案。'; return; }
    $('homeMsg').textContent = '加入中…';
    var chain = Promise.resolve(), added = [];
    list.forEach(function (f) {
      chain = chain.then(function () { return f.arrayBuffer(); }).then(function (buf) {
        var bytes = new Uint8Array(buf), id = f.name + '|' + bytes.length;
        return idbPut(id, bytes).then(function () {
          if (!docById(id)) { lib.docs.push({ id: id, name: f.name, type: 'pdf', size: bytes.length, pages: 0, added: Date.now(), opened: 0, folder: libTarget() }); }
          added.push(id); saveLib();
        });
      });
    });
    chain.then(function () {
      $('homeMsg').textContent = '已加入 ' + added.length + ' 份文件' + (added.length === 1 ? '，正在打開…' : '。點文件名稱就能打開。');
      renderHome();
      if (added.length === 1) { openDoc(added[0]); }
    }).catch(function (err) { $('homeMsg').textContent = '加入失敗：' + String(err && err.message || err) + '（裝置空間可能不夠）'; });
  }
  function libAddText() {
    var t = $('input').value.replace(/\r/g, ''), name = $('textTitle').value.trim();
    if (!t.trim()) { $('homeMsg').textContent = '文字框是空的，請先貼上泰文。'; $('input').focus(); return; }
    if (!name) { name = t.trim().replace(/\s+/g, ' ').slice(0, 24) + (t.trim().length > 24 ? '…' : ''); }
    var id = 'text:' + Date.now().toString(36);
    lib.docs.push({ id: id, name: name, type: 'text', size: t.length, added: Date.now(), opened: 0, folder: libTarget() });
    saveLib();
    try { localStorage.setItem(PDF_DOC_PREFIX + id, JSON.stringify({ text: t, src: { type: 'text', id: id, name: name }, hl: [], strokes: [], boxes: [], nextId: 1 })); } catch (err) {}
    $('input').value = ''; $('textTitle').value = ''; $('pastebox').hidden = true; $('openPaste').setAttribute('aria-expanded', 'false');
    $('homeMsg').textContent = '';
    openDoc(id);
  }
  /* ---------- 底部分頁 ---------- */
  function showTab(t) {
    if (t === curTab && !$('view-' + t).hidden) { return; }
    curTab = t;
    try { localStorage.setItem(TAB_KEY, t); } catch (err) {}
    ['home', 'doc', 'cards', 'settings'].forEach(function (k) {
      $('view-' + k).hidden = k !== t;
      var b = document.querySelector('.tabbar [data-tab="' + k + '"]');
      if (b) { if (k === t) { b.setAttribute('aria-current', 'page'); } else { b.removeAttribute('aria-current'); } }
    });
    hidePop();
    if (t === 'home') { renderHome(); }
    if (t === 'doc') { syncDocView(); setTimeout(function () { layout(); if (pdf) { renderVisiblePages(); } }, 30); }
    if (t === 'cards') { $('cardmsg').textContent = ''; renderCards(); }
    if (t === 'settings') { renderSettings(); if (typeof renderBackup === 'function') { renderBackup(); } }
    window.scrollTo(0, 0);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tabbar [data-tab]'), function (b) {
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
  });
  $('backHome').addEventListener('click', function () { showTab('home'); });
  $('goHome').addEventListener('click', function () { showTab('home'); });
  $('pdffile').addEventListener('change', function () { var fs = this.files; libAddPdfFiles(fs); this.value = ''; });
  $('openPaste').addEventListener('click', function () {
    var open = $('pastebox').hidden; $('pastebox').hidden = !open; $('openPaste').setAttribute('aria-expanded', String(open));
    if (open) { setTimeout(function () { $('textTitle').focus(); }, 20); }
  });
  $('addText').addEventListener('click', libAddText);
  /* ---------- 外觀：跟隨系統／淺色（奶油白、卡其、深咖啡）／深色（黑、灰、藍） ---------- */
  function applyTheme() {
    if (theme === 'light' || theme === 'dark') { document.documentElement.setAttribute('data-theme', theme); }
    else { document.documentElement.removeAttribute('data-theme'); }
    if (typeof redrawInk === 'function' && state && state.strokes) { try { redrawInk(); } catch (err) {} }
  }
  applyTheme();
  function renderTheme() {
    segButtons($('themeGroup'), [['system', '跟隨系統'], ['light', '淺色'], ['dark', '深色']], theme, function (v) {
      theme = v; try { localStorage.setItem(THEME_KEY, v); } catch (err) {} applyTheme(); renderTheme(); renderReport();
    });
  }
  renderTheme();
