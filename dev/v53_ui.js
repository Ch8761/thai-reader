  /* ==== 1.45：字典等資料沒載到時自動補載（避免整篇被當成「查不到／外來語」）；設定頁 iPad 也用點進去的頁面、說明收回「?」 ==== */
  function errNote(kind, msg) {
    try { var a = JSON.parse(localStorage.getItem('thai-errlog') || '[]'); a.push({ t: Date.now(), k: kind, m: String(msg).slice(0, 300), s: '', l: 0 }); localStorage.setItem('thai-errlog', JSON.stringify(a.slice(-10))); } catch (err) {}
  }
  var dataFixing = {};
  function dataMissing(id) {
    if (id === 'dictdata') { return !DICT; }
    if (id === 'namedata') { return !entsReady; }
    if (id === 'celebdata') { return !gazBuiltin || !gazBuiltin.length; }
    if (id === 'freqdata') { return !rrRank && !$('freqdata'); }
    if (id === 'ocrfix') { return !$('ocrfix') && (typeof OCR_FIX === 'undefined' || !OCR_FIX || !Object.keys(OCR_FIX).length); }
    return false;
  }
  function dataApply(id) {
    try {
      if (id === 'dictdata') { loadDict(); }
      else if (id === 'namedata') { loadNames(); }
      else if (id === 'celebdata') { gazBuiltin = null; gazBuild(); }
      else if (id === 'freqdata') { rrRank = null; }
      else if (id === 'ocrfix') { if (typeof OCR_FIX !== 'undefined') { OCR_FIX = null; } }
    } catch (err) { errNote('data', id + ' apply: ' + (err && err.message || err)); }
  }
  function dataRedraw() {
    try { if (state.text) { segs = segment(state.text); renderText(); } } catch (err) {}
    try { renderHome(); } catch (err) {}
  }
  function dataRecover(tries) {
    var U = window.__DATA_URLS; if (!U) { return; }
    var need = Object.keys(U).filter(function (id) { return !/^lib-/.test(id) && dataMissing(id) && !dataFixing[id]; });
    if (!need.length) { return; }
    errNote('data', '資料沒有載到，自動補載：' + need.join(',') + ((window.__dataFail || []).length ? '（載入失敗：' + window.__dataFail.join(',') + '）' : ''));
    var left = need.length, okAny = false;
    need.forEach(function (id) {
      dataFixing[id] = 1;
      var old = document.getElementById(id); if (old && !old.textContent) { old.remove(); }
      var sc = document.createElement('script'); sc.src = U[id] + (tries ? '?r=' + tries : '');
      sc.onload = function () { dataFixing[id] = 0; dataApply(id); if (!dataMissing(id)) { okAny = true; } if (--left === 0) { done(); } };
      sc.onerror = function () { dataFixing[id] = 0; if (--left === 0) { done(); } };
      document.head.appendChild(sc);
    });
    function done() {
      if (okAny) { dataRedraw(); }
      var still = need.filter(dataMissing);
      if (still.length && (tries || 0) < 5) { setTimeout(function () { dataRecover((tries || 0) + 1); }, 4000 * ((tries || 0) + 1)); }
      else if (still.length) { errNote('data', '補載失敗：' + still.join(',')); }
    }
  }
  setTimeout(function () { dataRecover(0); }, 300);
  window.addEventListener('online', function () { dataRecover(1); });

  /* 斷詞：瀏覽器把一整串泰文當成一個詞（沒有泰文斷詞字典）時，也用字典切開 */
  var _repairSeg53 = repairSeg;
  repairSeg = function (out) {
    if (DICT) {
      out = [].concat.apply([], out.map(function (x) {
        if (!x.w || x.gz || x.t.length < 8 || !/^[ก-๎]+$/.test(x.t) || known(x.t)) { return [x]; }
        var fx = null; try { fx = repairRun(x.t); } catch (err) {}
        if (!fx || fx.parts.length < 2 || (x.t.length < 12 && !fx.parts.every(function (q) { return q[2]; }))) { return [x]; }
        return fx.parts.map(function (p) { return { i: x.i + p[0], n: p[1] - p[0], w: true, t: x.t.slice(p[0], p[1]) }; });
      }));
    }
    return _repairSeg53(out);
  };

  /* 設定：說明只放在「?」裡；iPad 也是點分類進到那一頁 */
  (function () {
    var view = $('view-settings'); if (!view) { return; }
    view.querySelectorAll('.setdesc').forEach(function (d) { d.remove(); });
    view.querySelectorAll('.setlabel .qhelp').forEach(function (q) { q.hidden = false; });
    view.classList.add('set3');
  })();
