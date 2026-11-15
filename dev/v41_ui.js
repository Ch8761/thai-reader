  /* ====== 1.33：離開再回來的修復、同步狀態燈、資料來源頁、斷詞修補 ====== */
  /* ---- 同步改了設定：正在讀文件時不要突然重新載入，等離開文件頁再套用 ---- */
  var syncReloadPending = false;
  function syncApplyLater() {
    if (curTab !== 'doc') { return false; }
    syncReloadPending = true; return true;
  }
  var _showTab41 = showTab;
  showTab = function (t) {
    _showTab41.apply(this, arguments);
    if (syncReloadPending && t !== 'doc') { syncReloadPending = false; setTimeout(function () { location.reload(); }, 300); }
  };

  /* ---- 離開 App 再回來（查外部字典、切到別的 App）：畫面比例還原、PDF 頁面重畫，卡住就重開文件 ---- */
  var hidAt = 0, wakeN = 0;
  function vpReset() {
    var m = document.querySelector('meta[name="viewport"]'); if (!m) { return; }
    var c = m.getAttribute('content') || '';
    if (/maximum-scale/.test(c)) { return; }
    m.setAttribute('content', c + ', maximum-scale=1');
    setTimeout(function () { m.setAttribute('content', c); }, 120);
  }
  function pdfWake() {
    if (curTab !== 'doc' || typeof pdf === 'undefined' || !pdf || !pdf.pages) { return; }
    var doc = pdf, n = ++wakeN;
    try {
      renderBusy = false;
      pdf.pages.forEach(function (pg) { if (pg.visible) { pg.rendered = 0; } });
      renderVisiblePages();
    } catch (err) {}
    /* 背景時畫 PDF 的工具可能被系統關掉：6 秒後還沒畫好，就把文件重新打開一次 */
    setTimeout(function () {
      if (n !== wakeN || pdf !== doc || curTab !== 'doc' || document.visibilityState !== 'visible') { return; }
      var stuck = renderBusy && pdf.pages.some(function (pg) { return pg.visible && !pg.rendered; });
      if (stuck && state.src && docById(state.src.id)) { try { renderBusy = false; openDoc(state.src.id); } catch (err) {} }
    }, 6000);
  }
  function wakeUp(longAway) {
    vpReset();
    try { window.scrollBy(0, 0); document.body.style.transform = 'translateZ(0)'; setTimeout(function () { document.body.style.transform = ''; }, 60); } catch (err) {}
    if (longAway) { pdfWake(); }
    try { syncDotDraw(); } catch (err) {}
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { hidAt = Date.now(); return; }
    if (hidAt && Date.now() - hidAt > 800) { wakeUp(Date.now() - hidAt > 4000); }
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { wakeUp(true); } });

  /* ---- 同步狀態燈（主頁標題右邊）：綠＝已同步、轉圈＝同步中、紅＝沒連上或出錯 ---- */
  function syncDotState() {
    if (!SYNC_CLIENT_ID || !syncOn()) { return null; }
    if (sync.busy) { return ['busy', L2('雲端同步：同步中', 'Cloud sync: syncing')]; }
    if (navigator.onLine === false) { return ['err', L2('雲端同步：現在沒有網路，連上後會自動同步', 'Cloud sync: offline; it will sync when you are back online')]; }
    if (sync.err) { return ['err', L2('雲端同步：上次沒有成功，點一下看原因', 'Cloud sync: the last sync failed; tap to see why')]; }
    if (!(syncToken() || syncRt())) { return ['err', L2('雲端同步：需要重新登入，點一下處理', 'Cloud sync: sign-in needed; tap to fix')]; }
    var last = sync.last || Number(localStorage.getItem('thai-sync-last') || 0);
    var sec = Math.round((Date.now() - last) / 1000), m = Math.round(sec / 60), h = Math.round(sec / 3600), d = Math.round(sec / 86400);
    var ago = !last ? L2('還沒同步過', 'not synced yet') : sec < 60 ? L2('剛剛', 'just now') : sec < 3600 ? L2(m + ' 分鐘前', m + ' min ago') : sec < 86400 ? L2(h + ' 小時前', h + (h === 1 ? ' hour ago' : ' hours ago')) : L2(d + ' 天前', d + (d === 1 ? ' day ago' : ' days ago'));
    return ['ok', L2('雲端同步：已同步（' + ago + '）', 'Cloud sync: synced (' + ago + ')')];
  }
  function syncDotDraw() {
    var b = $('syncDot'); if (!b) { return; }
    var st = syncDotState();
    b.hidden = !st; if (!st) { return; }
    b.className = 'syncdot ' + st[0]; b.setAttribute('aria-label', st[1]); b.title = st[1];
  }
  (function () {
    var b = $('syncDot'); if (!b) { return; }
    b.setAttribute('data-noi18n', '');
    b.addEventListener('click', function () {
      showTab('settings');
      setTimeout(function () { var mi = document.querySelector('.setmi[data-grp="data"]'); if (mi && $('syncBtns') && !$('syncBtns').offsetParent) { mi.click(); } }, 80);
    });
    var _rs41 = renderSync; renderSync = function () { _rs41.apply(this, arguments); syncDotDraw(); };
    window.addEventListener('online', syncDotDraw); window.addEventListener('offline', syncDotDraw);
    setInterval(function () { if (document.visibilityState === 'visible') { syncDotDraw(); } }, 60000);
    syncDotDraw();
  })();

  /* ---- 資料來源與授權（原本每次查詞都顯示的那幾行，搬到這裡）---- */
  var CREDIT_ROWS = [
    ['詞義', 'Wiktionary（CC BY-SA），經 kaikki.org／wiktextract 整理。'],
    ['中文詞義', '常用詞為人工翻譯，其餘由 ECDICT 與 WordNet 自動對照，僅供參考。'],
    ['常用字表', 'PyThaiNLP 詞頻表（Thai National Corpus、Thai Textbook Corpus，CC0）。'],
    ['例句', 'scb-mt-en-th-2020（CC BY-SA 4.0），中文為機器翻譯。'],
    ['真人發音', 'YouGlish.com，影片來自 YouTube。'],
    ['文字辨識', 'Tesseract.js（Apache-2.0）。'],
    ['PDF', 'PDF.js（Apache-2.0）、pdf-lib（MIT）。']
  ];
  function openCredits(btn) {
    var dlg = $('setHelp'); if (!dlg) { return; }
    var h = '<dl class="crlist">';
    CREDIT_ROWS.forEach(function (r) { h += '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; });
    h += '</dl>';
    var log = []; try { log = JSON.parse(localStorage.getItem('thai-errlog') || '[]'); } catch (err) {}
    if (log.length) { h += '<p class="crerr"><button type="button" id="crCopy">' + L2('複製錯誤紀錄（' + log.length + ' 筆）', 'Copy error log (' + log.length + ')') + '</button><span id="crCopied" class="label"></span></p>'; }
    $('shTitle').textContent = '資料來源與授權'; $('shBody').innerHTML = h; dlg.hidden = false;
    var cb = $('crCopy');
    if (cb) { cb.addEventListener('click', function () { var t = JSON.stringify(log); try { navigator.clipboard.writeText(t).then(function () { $('crCopied').textContent = L2(' 已複製', ' Copied'); }); } catch (err) { $('crCopied').textContent = t.slice(0, 300); } }); }
    try { $('shClose').focus(); } catch (err) {}
  }
  if ($('openCredits')) { $('openCredits').addEventListener('click', function () { openCredits(this); }); }

  /* ---- 斷詞修補：系統把一串字切出「字典沒有的碎片」時，改用字典重新切那一串（例如 การกระจายอำนาจ）---- */
  var RS_MARK = /^[ะ-ฺ็-๎ๆ]/, RS_LEAD = /[เ-ไ]$/;
  function rsHas(w) { return Object.prototype.hasOwnProperty.call(DICT, w); }
  function repairRun(str) {
    var n = str.length, best = [0], prev = [null], i, j;
    for (i = 1; i <= n; i++) {
      /* 一個字典沒有的字：代價高 */
      best[i] = best[i - 1] + 10; prev[i] = [i - 1, false];
      if (i < n && RS_MARK.test(str.slice(i))) { continue; }
      for (j = Math.max(0, i - 24); j <= i - 2; j++) {
        var w = str.slice(j, i);
        if (RS_MARK.test(w) || RS_LEAD.test(w) || !rsHas(w)) { continue; }
        var c = best[j] + 1 + (w.length === 2 ? 0.5 : 0);
        if (c < best[i]) { best[i] = c; prev[i] = [j, true]; }
      }
    }
    if (best[n] === Infinity) { return null; }
    var parts = []; i = n;
    while (i > 0) { var p = prev[i]; if (!p) { return null; } parts.unshift([p[0], i, p[1]]); i = p[0]; }
    /* 連續的未知字併成一塊 */
    var out = [];
    parts.forEach(function (p) { var last = out[out.length - 1]; if (!p[2] && last && !last[2]) { last[1] = p[1]; } else { out.push(p.slice()); } });
    return { cost: best[n], parts: out };
  }
  function repairSeg(out) {
    if (!DICT) { return out; }
    var res = [], i = 0;
    function plain(x) { return x.w && !x.gz && /^[ก-๎]+$/.test(x.t); }
    while (i < out.length) {
      if (!plain(out[i])) { res.push(out[i]); i++; continue; }
      var j = i; while (j + 1 < out.length && plain(out[j + 1]) && out[j + 1].i === out[j].i + out[j].n) { j++; }
      var run = out.slice(i, j + 1), bad = false, cost0 = 0, str = '';
      run.forEach(function (x) { var k = known(x.t) && x.t.length > 1; if (!k) { bad = true; } cost0 += k ? 1 + (x.t.length === 2 ? 0.5 : 0) : 10 * x.t.length; str += x.t; });
      var fix = (bad && run.length > 1 && str.length <= 200) ? repairRun(str) : null;
      if (fix && fix.cost < cost0 - 0.01) {
        var base = run[0].i;
        fix.parts.forEach(function (p) { res.push({ i: base + p[0], n: p[1] - p[0], w: true, t: str.slice(p[0], p[1]) }); });
      } else { run.forEach(function (x) { res.push(x); }); }
      i = j + 1;
    }
    return res;
  }

