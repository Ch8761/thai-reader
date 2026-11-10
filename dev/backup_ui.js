  /* ---------- 手動備份：把設定、生字卡、所有文件的筆記和目前的 PDF 打包成一個檔案 ---------- */
  var BK_LAST = 'thai-last-backup', backupStatus = '還沒備份過', pendingRestore = null;
  var SETTING_KEYS = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-welcome-v1', 'thai-theme'];
  function b64FromBytes(u8) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) { s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); }
    return btoa(s);
  }
  function bytesFromB64(b) { var s = atob(b), u8 = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) { u8[i] = s.charCodeAt(i); } return u8; }
  function lastBackupText() {
    var t = 0; try { t = Number(localStorage.getItem(BK_LAST) || 0); } catch (err) {}
    if (!t) { return '還沒備份過。建議每週備份一次，或在換 iPad、清除瀏覽器資料之前備份。'; }
    var days = Math.floor((Date.now() - t) / 86400000);
    return '上次備份：' + (days <= 0 ? '今天' : days + ' 天前') + (days >= 7 ? '，建議再備份一次。' : '。');
  }
  function renderBackup() { $('bkLast').textContent = lastBackupText(); }
  async function makeBackup() {
    if (state.src) { try { localStorage.setItem(PDF_DOC_PREFIX + state.src.id, JSON.stringify(data())); } catch (err) {} }
    var o = { app: 'thai-reader', format: 1, at: new Date().toISOString(), ver: APP_VER, settings: {}, cards: { cards: cards, folders: folders }, current: data(), docs: {}, pdf: null };
    SETTING_KEYS.forEach(function (k) { try { var v = localStorage.getItem(k); if (v !== null) { o.settings[k] = v; } } catch (err) {} });
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PDF_DOC_PREFIX) === 0) { o.docs[k] = localStorage.getItem(k); }
      }
    } catch (err) {}
    if (typeof lib !== 'undefined') {
      o.lib = lib; o.pdfs = []; o.ocr = {};
      for (var j = 0; j < lib.docs.length; j++) {
        var d = lib.docs[j];
        if (d.type !== 'pdf') { continue; }
        try { var bytes = await idbGet(d.id); if (bytes) { o.pdfs.push({ id: d.id, name: d.name, b64: b64FromBytes(new Uint8Array(bytes)) }); } } catch (err) {}
        try { var oc = await idbGet('ocr:' + d.id); if (oc && oc.pages) { o.ocr[d.id] = oc; } } catch (err) {}
      }
    }
    return o;
  }
  $('bkSave').addEventListener('click', async function () {
    var btn = $('bkSave'); btn.disabled = true; $('bkStatus').textContent = '打包中…';
    try {
      var o = await makeBackup(), json = JSON.stringify(o);
      var blob = new Blob([json], { type: 'application/json' });
      var res = await saveFile('泰文閱讀備份-' + ymd() + '.json', blob);
      if (res === 'saved') {
        try { localStorage.setItem(BK_LAST, String(Date.now())); } catch (err) {}
        backupStatus = '成功（' + (blob.size / 1048576).toFixed(1) + ' MB，' + saveStatus + '）';
        $('bkStatus').textContent = '備份檔已產生（' + (blob.size / 1048576).toFixed(1) + ' MB）：文件 ' + (o.lib ? o.lib.docs.length : 0) + ' 份（含 PDF 檔 ' + (o.pdfs || []).length + ' 個）、生字卡 ' + cards.length + ' 張。在跳出的視窗選「儲存到檔案」，再選 iCloud Drive 或 Google Drive。';
      } else { backupStatus = res === 'declined' ? '已取消' : '存不了檔：' + saveStatus; $('bkStatus').textContent = res === 'declined' ? '已取消。' : '存不了檔：' + saveStatus; }
    } catch (err) {
      backupStatus = '失敗：' + String(err && err.message || err).slice(0, 60);
      $('bkStatus').textContent = '備份失敗：' + String(err && err.message || err);
    } finally { btn.disabled = false; renderBackup(); renderReport(); }
  });
  $('bkFile').addEventListener('change', function () {
    var f = this.files && this.files[0]; this.value = '';
    if (!f) { return; }
    f.text().then(function (txt) {
      var o = JSON.parse(txt);
      if (!o || o.app !== 'thai-reader') { throw new Error('這不是這個 App 的備份檔'); }
      pendingRestore = o;
      var nCards = (o.cards && o.cards.cards || []).length, nDocs = Object.keys(o.docs || {}).length;
      $('bkConfirmText').textContent = '備份時間：' + new Date(o.at).toLocaleString('zh-TW') + '。內容：文件 ' + (o.lib ? o.lib.docs.length : nDocs) + ' 份（PDF 檔 ' + ((o.pdfs || []).length || (o.pdf ? 1 : 0)) + ' 個）、生字卡 ' + nCards + ' 張。還原會取代這台裝置目前的文件、生字卡、設定和筆記。';
      $('bkConfirm').hidden = false;
      $('bkStatus').textContent = '';
    }).catch(function (err) { $('bkStatus').textContent = '讀不了這個檔案：' + String(err && err.message || err); });
  });
  $('bkCancel').addEventListener('click', function () { pendingRestore = null; $('bkConfirm').hidden = true; });
  $('bkDo').addEventListener('click', async function () {
    var o = pendingRestore; if (!o) { return; }
    $('bkConfirm').hidden = true; $('bkStatus').textContent = '還原中…';
    try {
      Object.keys(o.settings || {}).forEach(function (k) { try { localStorage.setItem(k, o.settings[k]); } catch (err) {} });
      try { for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf(PDF_DOC_PREFIX) === 0) { localStorage.removeItem(k); } } } catch (err) {}
      Object.keys(o.docs || {}).forEach(function (k) { try { localStorage.setItem(k, o.docs[k]); } catch (err) {} });
      cards = (o.cards && o.cards.cards) || []; folders = (o.cards && o.cards.folders) || []; cardFolder = 'all'; saveCards();
      try {
        level = localStorage.getItem('thai-level') || level; showRom = localStorage.getItem('thai-show-rom') !== '0';
        glossLang = localStorage.getItem('thai-gloss-lang') || glossLang; showEnts = localStorage.getItem('thai-show-ents') !== '0';
        if (typeof theme !== 'undefined') { theme = localStorage.getItem('thai-theme') || 'system'; }
      } catch (err) {}
      var pdfs = o.pdfs || (o.pdf ? [o.pdf] : []);
      for (var q = 0; q < pdfs.length; q++) { try { await idbPut(pdfs[q].id, bytesFromB64(pdfs[q].b64)); } catch (err) {} }
      var ocs = Object.keys(o.ocr || {});
      for (var r = 0; r < ocs.length; r++) { try { await idbPut('ocr:' + ocs[r], o.ocr[ocs[r]]); } catch (err) {} }
      if (typeof lib !== 'undefined') {
        if (o.lib) { lib = Object.assign({ docs: [], folders: [], cur: 'all' }, o.lib); }
        else if (o.pdf) { lib = { docs: [{ id: o.pdf.id, name: o.pdf.name, type: 'pdf', size: 0, pages: 0, added: Date.now(), folder: '' }], folders: [], cur: 'all' }; }
        saveLib();
      }
      teardownPdf();
      state = { text: '', src: null, hl: [], strokes: [], boxes: [], nextId: 1, style: state.style };
      segs = []; history = []; tapSel = null;
      var curId = o.current && o.current.src && o.current.src.id;
      if (curId && typeof docById === 'function' && docById(curId)) { openDoc(curId); }
      else { save(); if (typeof syncDocView === 'function') { syncDocView(); renderHome(); } }
      if (typeof applyTheme === 'function') { applyTheme(); renderTheme(); }
      renderSettings();
      backupStatus = '已還原 ' + new Date(o.at).toLocaleDateString('zh-TW') + ' 的備份';
      $('bkStatus').textContent = '還原完成：文件 ' + (typeof lib !== 'undefined' ? lib.docs.length : 0) + ' 份、生字卡 ' + cards.length + ' 張。';
    } catch (err) {
      $('bkStatus').textContent = '還原時出錯：' + String(err && err.message || err);
    } finally { pendingRestore = null; renderReport(); }
  });
  renderBackup();
