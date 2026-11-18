  /* ==== 1.44：設定頁重新設計（照 Design 設計稿）、小火苗「會動／不動」看得出差別 ==== */
  var SET_ICON = {
    look: ['#6b847a', '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'],
    read: ['#6e8a9c', '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'],
    cards: ['#a48468', '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>'],
    ocr: ['#857c9e', '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 10h8M8 14h5"/>'],
    words: ['#9c7686', '<path d="M6 4h10l2 2v14H6z"/><path d="M9 9h6M9 13h6M9 17h3"/>'],
    data: ['#6a8e7d', '<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.4 9.1 4.7 4.7 0 0 0 7 18.5z"/>'],
    help: ['#7d8a84', '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17.5v.01"/>']
  };
  var SET_SUB = {
    look: ['深淺色、介面語言、中文和泰文字體', 'Theme, language, Chinese and Thai fonts'],
    read: ['程度、詞義語言、拼音、標示', 'Level, meanings, romanization, highlights'],
    cards: ['每天複習上限、聲調學習模式', 'Daily review limit, tone mode'],
    ocr: ['辨識方式、辨識中文、自動轉正、離線下載', 'Engine, Chinese, straightening, offline'],
    words: ['我加的專有名詞、我調整過的斷詞', 'Names you added, splits you changed'],
    data: ['雲端同步、備份與還原', 'Cloud sync, backup and restore'],
    help: ['使用說明、資料來源、意見回饋、隱私', 'Guide, sources, feedback, privacy']
  };
  /* 開關：兩個選項（開／關）的設定改成右邊一個開關；數字＝「開」是第幾個按鈕 */
  var SET_SWITCH = { romGroup: 0, entGroup: 0, rrShowGroup: 0, unkGroup: 0, immGroup: 0, deskewGroup: 0, statsGroup: 0, toneGroup: 1 };
  /* 控制項比較寬的列：說明下面另起一行放控制項 */
  var SET_STACK = ['thFontGroup', 'fontGroup', 'themeGroup', 'flameGroup', 'levelGroup', 'glossGroup', 'revCapGroup', 'ocrZhGroup', 'ocrEngGroup', 'uiLangGroup', 'fbCat', 'syncBtns', 'bkSave', 'ocrPreBtn', 'myNamesList', 'mySegList'];
  /* 比較長的說明：名稱下面改用一句短的（完整說明還是在「?」裡） */
  var SET_DESC = {
    levelGroup: ['決定讀物推薦、認得率和句型的範圍。', 'Sets reading suggestions, the known-words estimate and grammar range.'],
    entGroup: ['用顏色標出人名、地名、菜名等，下面的類別可以單獨開關。', 'Colours names, places, dishes and more; toggle each type below.'],
    unkGroup: ['字典查不到的詞加淡淡的虛線。', 'Words the dictionary doesn’t know get a faint dotted line.'],
    rrShowGroup: ['文章和讀物庫顯示你大約認得幾成的字。', 'Shows roughly how much of a text you already know.'],
    immGroup: ['往下讀時收起上下的工具列，往上捲就回來。', 'Hides the toolbars while you scroll down; scroll up to bring them back.'],
    statsGroup: ['只傳送功能使用次數，不含文件內容和帳號。', 'Sends feature counts only — never your documents or account.'],
    syncBtns: ['文件、筆記、生字卡和設定存在你自己的 Google 雲端硬碟。', 'Keeps documents, notes, cards and settings in your own Google Drive.'],
    bkSave: ['所有資料存成一個檔案；換裝置或清除瀏覽器資料前先備份。', 'Saves everything to one file — back up before switching devices.'],
    flameGroup: ['今天讀過火苗會亮起來，還沒讀是灰色。', 'The flame lights up once you have studied today.']
  };
  function setFirstSentence(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim(); if (!t) { return ['', '']; }
    var m = /^(.+?[。！？]|.+?[.!?](?=\s|$))\s*(.*)$/.exec(t);
    return m ? [m[1], m[2]] : [t, ''];
  }
  (function setRedesign() {
    var view = $('view-settings'); if (!view) { return; }
    view.classList.add('set2');
    /* 分類清單：加上圖示和新的說明 */
    view.querySelectorAll('.setmi').forEach(function (mi) {
      var k = mi.getAttribute('data-grp'), ic = SET_ICON[k]; if (!ic || mi.querySelector('.smico')) { return; }
      var sp = document.createElement('span'); sp.className = 'smico'; sp.style.background = ic[0];
      sp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ic[1] + '</svg>';
      mi.insertBefore(sp, mi.firstChild);
      var sub = mi.querySelector('.sms'); if (sub && SET_SUB[k]) { sub.textContent = L2(SET_SUB[k][0], SET_SUB[k][1]); sub.setAttribute('data-noi18n', ''); }
    });
    /* 每一列：說明的第一句直接寫在名稱下面；比較長的才留「?」看完整說明 */
    view.querySelectorAll('.setrow').forEach(function (row) {
      var lab = row.querySelector('.setlabel'); if (!lab || lab.querySelector('.setdesc')) { return; }
      var html = lab.__help || '', tmp = document.createElement('div'); tmp.innerHTML = html;
      var plain = tmp.textContent || '';
      if (UI_LANG === 'en') { plain = tr(plain); }
      var fs = setFirstSentence(plain), oid = '';
      Array.prototype.some.call(row.querySelectorAll('[id]'), function (x) { if (SET_DESC[x.id]) { oid = x.id; return true; } return false; });
      if (oid) { fs = [L2(SET_DESC[oid][0], SET_DESC[oid][1]), 'more text here']; }
      if (fs[0]) {
        var d = document.createElement('span'); d.className = 'setdesc'; d.textContent = fs[0]; d.setAttribute('data-noi18n', '');
        var line = lab.querySelector('.setline'); lab.insertBefore(d, line ? line.nextSibling : lab.firstChild);
      }
      var q = lab.querySelector('.qhelp'); if (q && fs[1].length < 12) { q.hidden = true; }
      var ctl = row.querySelector('[id]:not(.setlabel *)');
      var id = '';
      Array.prototype.some.call(row.querySelectorAll('[id]'), function (x) { if (SET_SWITCH[x.id] !== undefined || SET_STACK.indexOf(x.id) >= 0) { id = x.id; return true; } return false; });
      if (SET_STACK.indexOf(id) >= 0) { row.classList.add('stack'); }
      if (SET_SWITCH[id] !== undefined) { setMakeSwitch(row, $(id), SET_SWITCH[id]); }
    });
    /* 設定首頁上方：程度、連續天數、同步狀態 */
    var menu = view.querySelector('.setmenu');
    if (menu && !$('setSummary')) {
      var sm = document.createElement('button'); sm.type = 'button'; sm.id = 'setSummary'; sm.className = 'setsum';
      sm.addEventListener('click', function () { if (window.settingsOpen) { window.settingsOpen('read'); } });
      menu.parentNode.insertBefore(sm, menu);
    }
    setSummaryDraw();
  })();
  function setMakeSwitch(row, g, onIdx) {
    if (!g) { return; }
    g.classList.add('swhidden');
    var name = (row.querySelector('.setname') || {}).textContent || '';
    var sw = document.createElement('button'); sw.type = 'button'; sw.className = 'swt'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-label', name);
    sw.innerHTML = '<span class="swk"></span>';
    g.parentNode.insertBefore(sw, g.nextSibling);
    function on() { var b = g.querySelectorAll('button')[onIdx]; return !!b && b.getAttribute('aria-checked') === 'true'; }
    function sync() { sw.setAttribute('aria-checked', String(on())); }
    sw.addEventListener('click', function () { var bs = g.querySelectorAll('button'); var t = on() ? bs[1 - onIdx] : bs[onIdx]; if (t) { t.click(); } sync(); setTimeout(sync, 50); });
    new MutationObserver(sync).observe(g, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
    sync();
    row.classList.add('hasswitch');
  }
  function setSummaryDraw() {
    var sm = $('setSummary'); if (!sm) { return; }
    var lvName = ''; try { var cur = localStorage.getItem('thai-level') || 'b'; LEVELS.forEach(function (x) { if (x[0] === cur) { lvName = tr(x[1]); } }); } catch (err) {}
    var n = 0; try { n = streakDays(); } catch (err) {}
    var syncTxt = ''; try { var st = syncDotState(); syncTxt = st ? (st[0] === 'ok' ? L2('已同步', 'Synced') : st[0] === 'busy' ? L2('同步中', 'Syncing') : L2('同步有問題', 'Sync issue')) : L2('還沒連結雲端同步', 'Cloud sync not set up'); } catch (err) {}
    sm.innerHTML = '<span class="ssav" lang="th">ก</span><span class="sstx"><b></b><span></span></span><span class="ssgo"></span>';
    sm.querySelector('b').textContent = L2('程度：', 'Level: ') + lvName;
    sm.querySelector('.sstx span').textContent = L2('連續 ' + n + ' 天', n + (n === 1 ? '-day' : '-day') + ' streak') + ' · ' + syncTxt;
    sm.querySelector('.ssgo').textContent = L2('更改', 'Change');
    sm.setAttribute('data-noi18n', '');
  }
  var _showTab52 = showTab;
  showTab = function (t) { var r = _showTab52.apply(this, arguments); if (t === 'settings') { setSummaryDraw(); } return r; };

  /* ---- 小火苗：今天讀過→會動（設定「會動」時）；今天還沒讀→灰色；「不顯示」→不出現圖示 ---- */
  function todayDone() { try { var k = dayKey(Date.now()); return daysLog().indexOf(k) >= 0; } catch (err) { return false; } }
  var _streakIcon52 = streakIcon;
  streakIcon = function (n) {
    var s = _streakIcon52(n), m = flameMode(), done = todayDone();
    var cls = m === 'off' ? ' fl-off' : (!done ? ' fl-dim' : (m === 'on' ? ' fl-anim' : ''));
    return s.replace('class="achfl', 'class="achfl' + cls);
  };
  var _drawHomeStreak52 = drawHomeStreak;
  drawHomeStreak = function () {
    _drawHomeStreak52();
    var sb = $('homeStreak'); if (!sb) { return; }
    sb.hidden = flameMode() === 'off';
    if (!todayDone() && streakDays() > 0) { sb.title = sb.getAttribute('aria-label') + L2('（今天還沒讀，讀一點就接上）', ' (not yet today — read a little to keep it)'); }
  };
  (function () {
    var g = $('flameGroup'); if (!g) { return; }
    function draw() {
      segButtons(g, [['on', L2('會動', 'Animated')], ['still', L2('不動', 'Still')], ['off', L2('不顯示', 'Hidden')]], flameMode(), function (v) { flameModeSet(v); draw(); try { drawHomeStreak(); renderAchTab(); } catch (err) {} });
      var ics = { on: 'fl-anim', still: '', off: 'fl-off' };
      g.querySelectorAll('button').forEach(function (b, i) {
        var k = ['on', 'still', 'off'][i], ic = document.createElement('span'); ic.className = 'flpv';
        ic.innerHTML = k === 'off' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="1.8"/></svg>' : _streakIcon52(3).replace('class="achfl', 'class="achfl ' + ics[k]);
        b.insertBefore(ic, b.firstChild);
      });
    }
    draw();
  })();
  /* 手機：點進某一類時，上面的程度卡片收起來 */
  (function () { var menu = document.querySelector('#view-settings .setmenu'), sm = $('setSummary'); if (!menu || !sm) { return; } function f() { sm.classList.toggle('away', menu.hidden); } new MutationObserver(f).observe(menu, { attributes: true, attributeFilter: ['hidden'] }); f(); })();
