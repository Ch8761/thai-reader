  /* ---------- 搬家提示：舊網址（GitHub Pages）上顯示新網址，教使用者把資料帶過去 ---------- */
  /* 等雲端同步的程式也載入後再執行（它在檔案比較後面） */
  setTimeout(function () {
    var NEW_URL = 'https://thai-reader-enn.pages.dev/';
    var OLD_HOSTS = ['ch8761.github.io'];
    if (OLD_HOSTS.indexOf(location.hostname) < 0 && !/[?&]movetest=1/.test(location.search)) { return; }
    var box = document.createElement('div'); box.className = 'movebox'; box.setAttribute('role', 'status');
    function paint() {
      var on = typeof syncOn === 'function' && syncOn();
      box.innerHTML = '<div class="mvhead"><b>ไทย Reader 搬家了</b><span>新網址：</span><a class="mvurl" target="_blank" rel="noopener"></a></div>' +
        '<ol class="mvsteps"></ol><div class="mvbtns"><a class="mvgo primary" target="_blank" rel="noopener">打開新網址</a><button type="button" class="mvsync"></button></div>';
      box.querySelector('.mvurl').href = NEW_URL; box.querySelector('.mvurl').textContent = NEW_URL.replace(/^https:\/\//, '').replace(/\/$/, '');
      box.querySelector('.mvgo').href = NEW_URL;
      var steps = on
        ? ['先按下面的「立即同步」，把這裡最新的資料存到你的 Google 雲端硬碟。', '打開新網址（iPad／iPhone：用 Safari 打開後按「分享 →加入主畫面」）。', '在新網址的「設定 → 資料與同步」連結同一個 Google 帳號，資料就會跟過去。', '確認新的都在了，就可以刪掉舊的主畫面圖示。']
        : ['先到「設定 → 資料與同步」連結 Google 帳號（或用「匯出備份檔」存一份）。', '打開新網址（iPad／iPhone：用 Safari 打開後按「分享 →加入主畫面」）。', '在新網址連結同一個 Google 帳號（或用「從備份檔還原」），資料就會跟過去。', '確認新的都在了，就可以刪掉舊的主畫面圖示。'];
      var ol = box.querySelector('.mvsteps'); steps.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ol.appendChild(li); });
      var sb = box.querySelector('.mvsync');
      sb.textContent = on ? (sync.busy ? '同步中…' : '立即同步') : '去連結 Google 帳號';
      sb.disabled = !!sync.busy;
      sb.addEventListener('click', function () {
        if (!on) { showTab('settings'); if (typeof settingsOpen === 'function') { settingsOpen('data'); } return; }
        if (syncToken()) { runSync(); } else { syncSignIn(); }
        setTimeout(paint, 300);
      });
    }
    paint();
    var home = $('view-home'), head = home && home.querySelector('.vhead');
    if (head) { head.parentNode.insertBefore(box, head.nextSibling); }
    /* 同步狀態變了就更新按鈕 */
    var _rs = renderSync;
    renderSync = function () { _rs(); try { paint(); } catch (err) {} };
  }, 0);
