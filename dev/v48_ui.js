  /* ==== 1.40：介面整理（主頁上方、文件頁上方）＋切回 App 不卡 ==== */
  /* ---- 文件頁：「點一個詞…」這種一看就懂的說明不顯示；「目前顯示：…」也不顯示（錯誤訊息照常顯示） ---- */
  (function () {
    var TAP = ['點一個詞，會用藍框框住它。手指可以正常捲動頁面。', 'Tap a word to put a blue box around it. You can still scroll with your finger.'];
    function chk(elm, test) { if (!elm) { return; } var t = (elm.textContent || '').trim(); var h = test(t); if (elm.hidden !== h) { elm.hidden = h; } }
    var hint = $('hint'), st = $('docstatus');
    function hintTest(t) { return !t || TAP.indexOf(t) >= 0; }
    function stTest(t) { return !t || /^(目前顯示：|Showing:)/.test(t); }
    if (hint) { new MutationObserver(function () { chk(hint, hintTest); }).observe(hint, { childList: true, characterData: true, subtree: true }); chk(hint, hintTest); }
    if (st) { new MutationObserver(function () { chk(st, stTest); }).observe(st, { childList: true, characterData: true, subtree: true }); chk(st, stTest); }
  })();

  /* ---- 主頁：同步狀態改成「雲朵＋幾個字」，放在標題旁邊，不會被看成連續天數 ---- */
  var SYNC_CLOUD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.4 9.1 4.7 4.7 0 0 0 7 18.5z"/></svg>';
  var _syncDotDraw48 = syncDotDraw;
  syncDotDraw = function () {
    _syncDotDraw48.apply(this, arguments);
    var b = $('syncDot'); if (!b || b.hidden) { return; }
    var c = b.className, t = /busy/.test(c) ? L2('同步中', 'Syncing') : /err/.test(c) ? (navigator.onLine === false ? L2('離線', 'Offline') : L2('同步有問題', 'Sync issue')) : L2('已同步', 'Synced');
    if (!b.querySelector('.sdt')) { b.innerHTML = SYNC_CLOUD + '<span class="sdt"></span>'; }
    b.querySelector('.sdt').textContent = t;
  };
  try { syncDotDraw(); } catch (err) {}

  /* ---- 主頁上方：繼續讀（最常用）→ 加文件 → 一行小字（任務、讀物庫），不再疊三排一樣重的方框 ---- */
  (function () {
    var hl = $('homeList'), qh = $('questHost'), ro = $('readerOpen'), msg = $('homeMsg');
    if (!hl || !qh || !ro || !msg) { return; }
    var row = document.createElement('div'); row.className = 'hquiet'; row.id = 'homeQuiet';
    row.appendChild(qh); row.appendChild(ro);
    msg.parentNode.insertBefore(row, msg);
    ro.classList.add('hqlink');
  })();
  var _renderToday48 = renderToday;
  renderToday = function () {
    var r = _renderToday48.apply(this, arguments);
    var hl = $('homeList'), rows = $('todayRows');
    if (hl && rows) { hl.hidden = rows.hidden; }
    return r;
  };

  /* ---- 切回 App（例如從 GoodNotes 回來）不卡：
     1. 長文件的手寫畫布以前會大到幾千萬像素，iPad 回到前景時要重畫很久；改成最多約 800 萬像素
     2. 回來時不再讓整頁重新繪製兩次（只有畫面真的被放大時才還原比例）
     3. 雲端同步等畫面穩定 2 秒後再做 ---- */
  var INK_MAX_PX = 8e6;
  var _layout48 = layout;
  layout = function () {
    _layout48.apply(this, arguments);
    if (pdf) { return; }
    var c = $('ink'); if (!c || !c.width || !c.height) { return; }
    if (c.width * c.height <= INK_MAX_PX) { return; }
    var k = Math.sqrt(INK_MAX_PX / (PAGE_W * pageH));
    c.width = Math.max(1, Math.floor(PAGE_W * k)); c.height = Math.max(1, Math.floor(pageH * k));
    redrawInk();
  };
  wakeUp = function (longAway) {
    var vv = window.visualViewport;
    if (vv && Math.abs((vv.scale || 1) - 1) > 0.01) { vpReset(); }
    if (longAway) { pdfWake(); }
    try { syncDotDraw(); } catch (err) {}
  };
  var _runSync48 = runSync, syncWakeT = 0;
  runSync = function () {
    var args = arguments, self = this;
    /* 剛回到前景的 2 秒內先不同步，讓畫面先順順地出來 */
    var ev = window.event; if ((ev && (ev.type === 'visibilitychange' || ev.type === 'pageshow')) || Date.now() - wakeAt48 < 2000) { clearTimeout(syncWakeT); syncWakeT = setTimeout(function () { _runSync48.apply(self, args); }, 2000); return; }
    return _runSync48.apply(this, arguments);
  };
  var wakeAt48 = 0;
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { wakeAt48 = Date.now(); } }, true);
  ['mixZh', 'mixEn'].forEach(function (id) { var b = $(id); if (b) { b.setAttribute('data-off', L2('（已收起）', ' (hidden)')); b.setAttribute('data-noi18n', ''); } });
  /* 中英文行開關移到文章外面（文章區會跟著螢幕縮放，放裡面在手機上字會太小） */
  (function () { var bar = $('mixBar'), w = $('wrap'); if (bar && w) { w.parentNode.insertBefore(bar, w); } })();
