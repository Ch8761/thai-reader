  /* ---------- 設定頁整理：分門別類、說明收進「?」、清單用展開的 ---------- */
  (function () {
    var host = $('settings'); if (!host) { return; }
    var GROUPS = [
      ['look', '外觀與字體', ['themeGroup', 'fontGroup']],
      ['read', '閱讀與查詞', ['levelGroup', 'romGroup', 'glossGroup', 'entGroup', 'toneGroup']],
      ['words', '我的詞庫', ['myNamesList', 'mySegList']],
      ['data', '資料與同步', ['syncBtns', 'bkSave']],
      ['help', '說明與回饋', ['openHelp', 'reWelcome', 'fbCat']]
    ];
    /* 說明視窗 */
    var dlg = document.createElement('div'); dlg.className = 'modal shelp'; dlg.id = 'setHelp'; dlg.hidden = true;
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'shTitle');
    dlg.innerHTML = '<div class="mcard shcard"><div class="shhead"><h2 id="shTitle"></h2><button type="button" id="shClose" aria-label="關閉">×</button></div><div class="shbody" id="shBody"></div></div>';
    document.body.appendChild(dlg);
    var lastBtn = null;
    function closeHelp() { dlg.hidden = true; if (lastBtn) { try { lastBtn.focus(); } catch (err) {} } }
    $('shClose').addEventListener('click', closeHelp);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { closeHelp(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) { closeHelp(); } });
    function openHelp(title, html, btn) {
      lastBtn = btn; $('shTitle').textContent = title; $('shBody').innerHTML = html; dlg.hidden = false;
      try { $('shClose').focus(); } catch (err) {}
    }
    /* 每一列：說明文字收進「?」，會變動的狀態（同步狀態、清單數量…）留在標題下面 */
    var rows = Array.prototype.slice.call(host.querySelectorAll(':scope > .setrow'));
    rows.forEach(function (row) {
      var lab = row.querySelector('.setlabel'), help = lab && lab.querySelector('.sethelp');
      if (!lab || !help) { return; }
      var title = Array.prototype.filter.call(lab.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.textContent; }).join('').trim();
      var stat = document.createElement('div'); stat.className = 'setstat';
      help.querySelectorAll('[id], .entlegend').forEach(function (x) { stat.appendChild(x); });
      help.querySelectorAll('br').forEach(function (x) { x.remove(); });
      var html = help.innerHTML.trim();
      help.remove();
      var head = document.createElement('span'); head.className = 'setname';
      Array.prototype.slice.call(lab.childNodes).forEach(function (n) { if (n.nodeType === 3) { lab.removeChild(n); } });
      if (title === '外觀') { title = '深淺色'; }
      head.textContent = title;
      var q = document.createElement('button'); q.type = 'button'; q.className = 'qhelp'; q.textContent = '?'; q.setAttribute('aria-label', '「' + title + '」是什麼？');
      q.addEventListener('click', function () { openHelp(title, html, q); });
      var line = document.createElement('span'); line.className = 'setline'; line.appendChild(head); line.appendChild(q);
      lab.insertBefore(line, lab.firstChild);
      if (stat.childNodes.length) { lab.appendChild(stat); }
    });
    /* 我的專有名詞、我的斷詞：清單收起來，按了才展開 */
    [['myNamesList', '查看我的專有名詞'], ['mySegList', '查看我調整過的詞']].forEach(function (x) {
      var ul = $(x[0]); if (!ul) { return; }
      var d = document.createElement('details'); d.className = 'setlist';
      var s = document.createElement('summary'); s.textContent = x[1]; d.appendChild(s);
      ul.parentNode.insertBefore(d, ul); d.appendChild(ul);
    });
    /* 分類：設定首頁是一張分類清單，點進去才是那一類的設定（像 iPad 的「設定」App） */
    var used = [], menu = document.createElement('nav'); menu.className = 'setmenu'; menu.setAttribute('aria-label', '設定分類');
    var boxes = {};
    GROUPS.forEach(function (g) {
      var box = document.createElement('div'); box.className = 'setgrp'; box.hidden = true; box.setAttribute('data-grp', g[0]);
      var names = [];
      g[2].forEach(function (id) {
        var el = $(id), row = el && el.closest('.setrow');
        if (row && used.indexOf(row) < 0) { used.push(row); box.appendChild(row); var n = row.querySelector('.setname'); if (n) { names.push(n.textContent.replace(/（.*?）/g, '')); } }
      });
      boxes[g[0]] = box;
      host.appendChild(box);
      var mi = document.createElement('button'); mi.type = 'button'; mi.className = 'setmi'; mi.setAttribute('data-grp', g[0]);
      mi.innerHTML = '<span class="smtx"><span class="smt"></span><span class="sms"></span></span><svg class="smchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
      mi.querySelector('.smt').textContent = g[1]; mi.querySelector('.sms').textContent = names.join('、');
      mi.addEventListener('click', function () { settingsOpen(g[0]); });
      menu.appendChild(mi);
    });
    host.insertBefore(menu, host.firstChild);
    /* 沒分到類的（測試用的列）留在首頁最下面 */
    rows.forEach(function (row) { if (used.indexOf(row) < 0) { host.appendChild(row); row.classList.add('setmainonly'); } });
    var view = $('view-settings'), vh = view.querySelector('.vhead'), h1 = $('h-settingsv');
    var back = document.createElement('button'); back.type = 'button'; back.className = 'back'; back.textContent = '‹ 設定'; back.hidden = true;
    back.addEventListener('click', function () { settingsOpen(null); });
    vh.insertBefore(back, h1);
    var cur = null;
    window.settingsOpen = settingsOpen;
    function settingsOpen(key) {
      cur = key && boxes[key] ? key : null;
      menu.hidden = !!cur; back.hidden = !cur;
      Object.keys(boxes).forEach(function (k) { boxes[k].hidden = k !== cur; });
      host.querySelectorAll('.setmainonly').forEach(function (r) { r.classList.toggle('setaway', !!cur); });
      view.querySelectorAll('.appverrow, .testtools').forEach(function (x) { x.classList.toggle('setaway', !!cur); });
      h1.textContent = cur ? GROUPS.filter(function (g) { return g[0] === cur; })[0][1] : '設定';
      window.scrollTo(0, 0);
      if (cur) { var f = boxes[cur].querySelector('button, [tabindex]'); } else { var m = menu.querySelector('.setmi'); }
    }
    /* 已經在設定頁時再點下面的「設定」，回到分類清單 */
    var tb = document.querySelector('.tabbar [data-tab="settings"]');
    if (tb) { tb.addEventListener('click', function () { if (cur) { settingsOpen(null); } }); }
    settingsOpen(null);
  })();
