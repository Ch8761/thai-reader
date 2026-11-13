  /* ====== 1.31：「成就」分頁（我的任務、學習紀錄＋成長）＋小火苗 ======
     原則：不考試、不扣分。用「投入的時間」和「做了的事」給鼓勵（參考 Leafy 的做法）。
     每日任務不顯示在畫面上，達成時只冒出一朵小火苗（一個小圖示動畫，沒有文字）；任務完成、記熟里程碑、連續學習、達成週目標時，火苗大一點。 */
  var TASK_KEY = 'thai-tasks', FLAME_KEY = 'thai-flame', HIST_KEY = 'thai-hist', RWD_KEY = 'thai-rwd';
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function keyTime(k) { var p = String(k).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12).getTime(); }
  function clampN(v, a, b) { v = parseInt(v, 10); if (!(v >= a)) { v = a; } return v > b ? b : v; }
  function quietMode() { try { return localStorage.getItem('thai-quest-quiet') === '1'; } catch (err) { return false; } }
  function reduceMotion() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (err) { return false; } }
  function rwdGet() { var o = lsGetJ(RWD_KEY, {}) || {}; return { flame: o.flame !== 0, anim: o.anim !== 0 }; }
  function rwdSet(k, on) { var o = lsGetJ(RWD_KEY, {}) || {}; o[k] = on ? 1 : 0; lsSetJ(RWD_KEY, o); }
  function animOn() { return rwdGet().anim && !reduceMotion(); }

  /* ---- 學習時間與每日紀錄：只算「畫面開著、最近一分鐘內有動過」的時間 ---- */
  var act = { last: Date.now(), acc: 0, lastMin: -1 };
  function histGet() {
    var h = lsGetJ(HIST_KEY, null); if (!h || typeof h !== 'object') { h = {}; }
    if (!h.d || typeof h.d !== 'object') { h.d = {}; } if (!h.c || typeof h.c !== 'object') { h.c = {}; }
    return h;
  }
  function histSave(h) {
    var ks = Object.keys(h.d);
    if (ks.length > 400) { ks.sort(function (a, b) { return keyTime(a) - keyTime(b); }); ks.slice(0, ks.length - 400).forEach(function (k) { delete h.d[k]; }); }
    lsSetJ(HIST_KEY, h);
  }
  function histToday(h) { var k = dayKey(); return h.d[k] || (h.d[k] = { k: 0, s: 0, w: 0 }); }
  function todaySecs() { var h = histGet(), o = h.d[dayKey()]; return ((o && o.s) || 0) + act.acc; }
  /* 把累積的秒數、今天記熟的數量寫進紀錄（有變才寫，避免一直同步） */
  function flushTime() {
    var h = histGet(), o = histToday(h), kn = knownCount(), ch = false;
    if (act.acc > 0) { o.s = (o.s || 0) + act.acc; act.acc = 0; ch = true; }
    if (o.k !== kn) { o.k = kn; ch = true; }
    if (ch) { histSave(h); }
  }
  ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(function (ev) { document.addEventListener(ev, function () { act.last = Date.now(); }, { passive: true, capture: true }); });
  function timeTick() {
    if (document.visibilityState !== 'visible' || Date.now() - act.last > 60000) { return; }
    visit(); pagesTick();
    act.acc += 5;
    if (act.acc >= 120) { flushTime(); }
    var m = Math.floor(todaySecs() / 60); if (m !== act.lastMin) { act.lastMin = m; if (m >= 10) { flameSoon(); } }
  }
  setInterval(timeTick, 5000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { flushTime(); } });
  window.addEventListener('pagehide', function () { flushTime(); });

  /* 讀過的字數：每份文字文件第一次打開時，算一次它有幾個詞 */
  var _openDoc4 = openDoc;
  openDoc = function (id) {
    var r = _openDoc4.apply(this, arguments);
    try {
      var d = docById(id);
      if (d && d.type === 'text' && state.src && state.src.id === id && segs) {
        var h = histGet();
        if (!h.c[id]) { var n = 0; segs.forEach(function (x) { if (x.w) { n++; } }); h.c[id] = n || 1; var o = histToday(h); o.w = (o.w || 0) + n; o.k = knownCount(); histSave(h); }
      }
    } catch (err) {}
    flameSoon();
    return r;
  };

  /* ====== 小火苗：每日的小目標達成時，畫面上方冒出一朵小火苗（只有圖示動畫，沒有文字、也不說條件）====== */
  var KNOWN_MS = [5, 10, 25, 50, 100, 200, 300, 500, 1000], STREAK_MS = [3, 7, 14, 30, 60, 100, 200, 365];
  function flameGet() { var f = lsGetJ(FLAME_KEY, null); if (!f || typeof f !== 'object') { f = {}; } f.d = f.d || ''; if (!Array.isArray(f.done)) { f.done = []; } if (!Array.isArray(f.once)) { f.once = []; } return f; }
  function weekKey() { var t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return 'w' + dayKey(t.getTime()); }
  var rq = [], rqTimer = null, flameTimer = null;
  function flameSoon() { clearTimeout(flameTimer); flameTimer = setTimeout(function () { flameCheck(false); }, 350); }
  function flameCheck(silent) {
    var f = flameGet(), changed = false, small = false, big = false, today = dayKey();
    if (f.d !== today) { f.d = today; f.done = []; changed = true; }
    if (!f.init) { f.init = 1; silent = true; changed = true; }
    var t0 = today0(), saved = 0, ts = todayStats(), known = knownCount(), st = streakDays(), mins = Math.floor(todaySecs() / 60);
    (cards || []).forEach(function (c) { if (c.added >= t0) { saved++; } });
    /* 每天各一次：學 10／30 分鐘、存 5／15 張生字、今天到期的卡都複習完（記憶保衛戰） */
    function once(id, cond) { if (cond && f.done.indexOf(id) < 0) { f.done.push(id); changed = true; small = true; } }
    once('m10', mins >= 10); once('m30', mins >= 30); once('s5', saved >= 5); once('s15', saved >= 15); once('rv', ts.done >= 1 && ts.due === 0);
    /* 只有一次：記熟的生字到里程碑、連續學習幾天、達成每週的學習天數 */
    function ever(id, cond) { if (cond && f.once.indexOf(id) < 0) { f.once.push(id); changed = true; big = true; } }
    KNOWN_MS.forEach(function (n) { ever('k' + n, known >= n); });
    STREAK_MS.forEach(function (n) { ever('d' + n, st >= n); });
    ever(weekKey(), weekDays() >= weekGoal());
    if (f.once.length > 300) { f.once = f.once.slice(-300); }
    if (changed) { lsSetJ(FLAME_KEY, f); }
    flushTime();
    if (silent || quietMode() || !rwdGet().flame) { return; }
    if (big || small) { flameQueue(big); }
  }
  function flameQueue(big) { if (rq.length < 3) { rq.push(big); } flameRun(); }
  function flameRun() {
    clearTimeout(rqTimer);
    if (!rq.length) { return; }
    if (!flameEl.hidden) { rqTimer = setTimeout(flameRun, 1200); return; }
    var big = rq.some(function (x) { return x; }); rq = [];
    flameShow(big);
  }

  var FLAME_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 3.2-1.8 5-3.2 7C7.4 11 6.5 12.6 6.5 14.6A5.5 5.5 0 0 0 12 20.5a5.5 5.5 0 0 0 5.5-5.6c0-2.5-1.3-4.2-2.5-5.5.1 1.5-.4 2.7-1.5 3.2.3-3.2-.5-6.8-1.5-10.6z" fill="#ff8a1f"/><path d="M12 20.5a3.3 3.3 0 0 1-3.3-3.4c0-1.6 1-2.6 1.8-3.6.6-.8 1-1.6 1-2.6 1.4 1.3 3.8 2.8 3.8 6a3.3 3.3 0 0 1-3.3 3.6z" fill="#ffd23f"/></svg>';
  var flameEl = document.createElement('div'); flameEl.id = 'flame'; flameEl.className = 'flame'; flameEl.hidden = true;
  flameEl.setAttribute('role', 'status'); flameEl.setAttribute('aria-live', 'polite');
  flameEl.innerHTML = '<span class="flic">' + FLAME_SVG + '</span><i class="flsp" style="--x:-22px;--d:.0s"></i><i class="flsp" style="--x:18px;--d:.25s"></i><i class="flsp" style="--x:-6px;--d:.5s"></i><span class="flsr">做得好！</span>';
  document.body.appendChild(flameEl);
  var flameHide = null;
  function flameClose() { clearTimeout(flameHide); flameEl.hidden = true; flameEl.classList.remove('on'); }
  flameEl.addEventListener('click', flameClose);
  function flameShow(big) {
    flameEl.className = 'flame' + (big ? ' big' : '') + (animOn() ? '' : ' still');
    flameEl.hidden = false; void flameEl.offsetWidth; flameEl.classList.add('on');
    var ms = animOn() ? (big ? 3000 : 2200) : 1800;
    flameEl.style.setProperty('--fo', (ms - 350) + 'ms');
    clearTimeout(flameHide); flameHide = setTimeout(flameClose, ms);
  }
  /* 任務完成：大一點的小火苗 */
  function flameBig() { if (quietMode() || !rwdGet().flame) { return; } flameQueue(true); }

  /* ====== 我的任務（自己加、自己打勾；小的、沒有期限）====== */
  function tasksGet() { var o = lsGetJ(TASK_KEY, null); if (!o || !Array.isArray(o.list)) { o = { list: [] }; } return o; }
  function tasksSave(o) { lsSetJ(TASK_KEY, o); try { renderToday(); } catch (err) {} }
  function taskFind(o, id) { for (var i = 0; i < o.list.length; i++) { if (o.list[i].id === id) { return o.list[i]; } } return null; }
  function taskAdd(text, n) {
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80); if (!text) { return null; }
    var o = tasksGet(); if (o.list.filter(function (t) { return !t.done; }).length >= 50) { return null; }
    var t = { id: uid(), t: text, n: clampN(n, 1, 99), c: 0, done: 0, added: Date.now() };
    o.list.push(t); tasksSave(o); return t;
  }
  function taskBump(id) {
    var o = tasksGet(), t = taskFind(o, id); if (!t) { return; }
    if (t.done) { t.done = 0; t.c = t.n > 1 ? t.n - 1 : 0; tasksSave(o); return; }
    t.c = Math.min(t.n, (t.c || 0) + 1);
    var fin = t.c >= t.n; if (fin) { t.done = Date.now(); }
    tasksSave(o);
    if (fin) { flameBig(); }
  }
  var SUGG = {
    a: [['完成一次聲調練習', 'Do one tone practice', 1], ['存 5 個生字', 'Save 5 new words', 5], ['讀一篇入門短文', 'Read one beginner text', 1], ['複習 10 張生字卡', 'Review 10 flashcards', 10]],
    b: [['讀一篇初級短文', 'Read one elementary text', 1], ['存 5 個生字', 'Save 5 new words', 5], ['貼上一則有興趣的網址來讀', 'Paste a link you’re curious about and read it', 1], ['記熟 3 個生字', 'Master 3 words', 3]],
    c: [['讀一則有興趣的新聞', 'Read a news story you like', 1], ['讀一份泰文字幕', 'Read one Thai subtitle file', 1], ['存 10 個生字', 'Save 10 new words', 10], ['單日學習 30 分鐘', 'Study for 30 minutes in one day', 1]],
    d: [['讀一段文學作品', 'Read a passage of literature', 1], ['讀一篇專業領域的文章', 'Read an article in your field', 1], ['讀一份正式公告', 'Read a formal notice', 1], ['存 10 個書面用語', 'Save 10 formal words', 10]]
  };
  /* 以前設定過的目標：變成一個任務（進度保留），舊的地圖資料清掉 */
  var OLD_GOALS = { up: ['升到下一級', 6], a_base: ['打好基礎：聲調與日常短句', 5], a_eat: ['看懂菜單和點餐', 6], b_travel: ['自己去泰國玩', 6], b_life: ['看懂生活資訊', 5], c_news: ['看懂新聞', 6], c_sub: ['可以用泰文字幕看影集電影', 5], d_lit: ['讀懂文學作品', 5], d_pro: ['能讀專業文章', 5], d_formal: ['看懂正式公文', 5] };
  var OLD_LEGACY = { menu: 'a_eat', social: 'b_travel', news: 'c_news' };
  function goalToTask() {
    var o = tasksGet();
    if (!o.mig) {
      o.mig = 1;
      var g = lsGetJ('thai-goal', null);
      if (g && typeof g === 'object' && g.g && g.g !== 'free') {
        var id = OLD_GOALS[g.g] ? g.g : OLD_LEGACY[g.g], def = id && OLD_GOALS[id];
        if (def) {
          var title = def[0], n = def[1];
          if (id === 'up') { var nx = LV4[LV4.indexOf(g.l0) + 1]; title = '升到「' + LV4_NAME[nx || 'd'] + '」'; if (g.l0 === 'a') { n = 7; } }
          var c = Math.min(n, Object.keys(g.p || {}).length);
          o.list.push({ id: uid(), t: title, n: n, c: c, done: c >= n ? Date.now() : 0, added: g.t0 || Date.now() });
        }
      }
      ['thai-goal', 'thai-map-seen', 'thai-goal-skip', 'thai-goal-done', 'thai-map-visit'].forEach(function (k) { try { localStorage.removeItem(k); } catch (err) {} });
      lsSetJ(TASK_KEY, o);
    }
  }
  goalToTask();

  var ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 7.5"/></svg>';
  function taskRow(t, host, rerender) {
    var li = el('li', 'achtask' + (t.done ? ' done' : '')), multi = t.n > 1;
    var b = el('button', 'achchk' + (t.done ? ' on' : '') + (multi && !t.done ? ' plus' : '')); b.type = 'button';
    var cc = el('span', 'achc'); if (t.done) { cc.innerHTML = ICON_CHECK; } else if (multi) { cc.textContent = '+1'; } b.appendChild(cc);
    b.setAttribute('aria-label', t.done ? L2('取消完成：', 'Undo: ') + t.t : (multi ? L2('做了一次：', 'Did it once: ') + t.t : L2('完成：', 'Done: ') + t.t));
    b.addEventListener('click', function () { taskBump(t.id); rerender(); });
    li.appendChild(b);
    var tx = el('span', 'achtx');
    var nm = el('button', 'achname', t.t); nm.type = 'button'; nm.setAttribute('aria-label', L2('編輯任務：', 'Edit task: ') + t.t);
    nm.addEventListener('click', function () { taskEdit(t, li, rerender); });
    tx.appendChild(nm);
    if (multi) {
      var bar = el('span', 'lqbar'), f = el('span'); f.style.width = Math.round(Math.min(t.c, t.n) / t.n * 100) + '%'; bar.appendChild(f);
      bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(t.n)); bar.setAttribute('aria-valuenow', String(t.c));
      var pr = el('span', 'lqprow'); pr.appendChild(bar); pr.appendChild(el('span', 'lqnum', Math.min(t.c, t.n) + ' / ' + t.n)); tx.appendChild(pr);
    }
    li.appendChild(tx);
    return li;
  }
  function taskEdit(t, li, rerender) {
    li.replaceChildren(); li.classList.add('editing');
    var form = el('form', 'achedit');
    var inp = el('input', 'achin'); inp.type = 'text'; inp.maxLength = 80; inp.value = t.t; inp.setAttribute('aria-label', '任務內容'); form.appendChild(inp);
    var r2 = el('div', 'achrow2');
    var l1 = el('label', 'achnum'); l1.appendChild(el('span', '', '要做幾次')); var n1 = el('input', ''); n1.type = 'number'; n1.min = '1'; n1.max = '99'; n1.value = String(t.n); l1.appendChild(n1); r2.appendChild(l1);
    var l2 = el('label', 'achnum'); l2.appendChild(el('span', '', '已經做了')); var n2 = el('input', ''); n2.type = 'number'; n2.min = '0'; n2.max = '99'; n2.value = String(t.c || 0); l2.appendChild(n2); r2.appendChild(l2);
    form.appendChild(r2);
    var row = el('div', 'btns');
    var ok = el('button', 'primary', '儲存'); ok.type = 'submit'; row.appendChild(ok);
    var cn = el('button', '', '取消'); cn.type = 'button'; cn.addEventListener('click', rerender); row.appendChild(cn);
    var del = el('button', 'achdel', '刪除'); del.type = 'button';
    armed(del, '刪除', '再按一次刪除', function () { var o = tasksGet(); o.list = o.list.filter(function (x) { return x.id !== t.id; }); tasksSave(o); rerender(); });
    row.appendChild(del); form.appendChild(row);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var o = tasksGet(), x = taskFind(o, t.id); if (!x) { rerender(); return; }
      var txt = inp.value.replace(/\s+/g, ' ').trim().slice(0, 80); if (txt) { x.t = txt; }
      x.n = clampN(n1.value, 1, 99); var c = parseInt(n2.value, 10); x.c = Math.max(0, Math.min(x.n, isNaN(c) ? 0 : c));
      if (x.c >= x.n) { if (!x.done) { x.done = Date.now(); } } else { x.done = 0; }
      tasksSave(o); rerender();
    });
    li.appendChild(form);
    setTimeout(function () { try { inp.focus(); inp.select(); } catch (err) {} }, 30);
  }
  var achOpen = { more: false, mins: false };
  function taskSection() {
    var sec = el('section', 'mapsec achsec');
    var hd = el('div', 'maphd'); hd.appendChild(el('h2', 'maph', '我的任務')); sec.appendChild(hd);
    var rerender = renderAchTab;
    var form = el('form', 'achadd');
    var inp = el('input', 'achin'); inp.type = 'text'; inp.maxLength = 80; inp.placeholder = '例如：讀一篇文章'; inp.setAttribute('aria-label', '新增任務'); form.appendChild(inp);
    var add = el('button', 'primary', '加入'); add.type = 'submit'; form.appendChild(add);
    form.addEventListener('submit', function (e) { e.preventDefault(); if (!taskAdd(inp.value, 1)) { inp.focus(); return; } renderAchTab(); try { $('achBody').querySelector('.achin').focus(); } catch (err) {} });
    sec.appendChild(form);
    var o = tasksGet(), pend = o.list.filter(function (t) { return !t.done; }), fin = o.list.filter(function (t) { return t.done; }).sort(function (a, b) { return b.done - a.done; });
    if (pend.length) {
      var ul = el('ul', 'achlist');
      pend.slice(0, 3).forEach(function (t) { ul.appendChild(taskRow(t, ul, rerender)); });
      sec.appendChild(ul);
      if (pend.length > 3) {
        var det = el('details', 'achmore'); det.open = achOpen.more; det.addEventListener('toggle', function () { achOpen.more = det.open; });
        det.appendChild(el('summary', '', '還有 ' + (pend.length - 3) + ' 個任務'));
        var ul2 = el('ul', 'achlist'); pend.slice(3).forEach(function (t) { ul2.appendChild(taskRow(t, ul2, rerender)); }); det.appendChild(ul2); sec.appendChild(det);
      }
    } else if (!fin.length) {
      sec.appendChild(el('p', 'achempty', '還沒有任務。挑一個小任務開始，或自己寫一個。'));
    } else {
      sec.appendChild(el('p', 'achempty', '任務都完成了，太棒了！再加一個吧。'));
    }
    if (pend.length < 3) {
      var have = {}; o.list.forEach(function (t) { have[t.t] = 1; });
      var sg = (SUGG[lv4()] || SUGG.b).filter(function (x) { return !have[x[0]] && !have[x[1]]; });
      if (sg.length) {
        sec.appendChild(el('p', 'achsgt', '建議的小任務'));
        var chips = el('div', 'achchips');
        sg.slice(0, 4).forEach(function (x) {
          var c = el('button', 'achchip', L2(x[0], x[1])); c.type = 'button'; c.setAttribute('aria-label', L2('加入任務：', 'Add task: ') + L2(x[0], x[1]));
          c.addEventListener('click', function () { taskAdd(L2(x[0], x[1]), x[2]); rerender(); });
          chips.appendChild(c);
        });
        sec.appendChild(chips);
      }
    }
    return sec;
  }

  /* ====== 學習紀錄（合併「我的成長」）：連續天數＋火苗、三個區塊（點開看細節）、每週目標、月曆 ====== */
  var REC = [
    ['read', [1, 3, 5, 10, 20, 40, 80, 150, 300, 600]],
    ['words', [5, 10, 20, 50, 100, 200, 400, 800, 1500, 3000]],
    ['known', [3, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]],
    ['rev', [20, 50, 100, 300, 1000, 3000, 10000]]
  ];
  function recNext(key, have) {
    var ms = [1]; REC.forEach(function (r) { if (r[0] === key) { ms = r[1]; } });
    var next = ms[ms.length - 1];
    for (var i = 0; i < ms.length; i++) { if (have < ms[i]) { next = ms[i]; break; } }
    return next;
  }
  function recBar(label, have, next) {
    var row = el('div', 'achrec'), top = el('div', 'achrt');
    top.appendChild(el('span', 'achrl', label));
    top.appendChild(el('b', 'achrv', String(have)));
    row.appendChild(top);
    var bar = el('span', 'lqbar'), f = el('span'); f.style.width = Math.round(Math.min(have, next) / next * 100) + '%'; bar.appendChild(f);
    bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(next)); bar.setAttribute('aria-valuenow', String(Math.min(have, next))); bar.setAttribute('aria-label', label);
    var pr = el('span', 'lqprow'); pr.appendChild(bar); pr.appendChild(el('span', 'lqnum', Math.min(have, next) + ' / ' + next)); row.appendChild(pr);
    return row;
  }

  /* ---- 進入應用程式的日子：每天打開（或回到）App 就記一天 ---- */
  var visitKey = '';
  function visit() { var k = dayKey(); if (k !== visitKey) { visitKey = k; try { markDay(); } catch (err) {} } }
  visit();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { visit(); } });

  /* ---- 讀過的頁數：PDF／照片，畫面停在某一頁（每 5 秒抽樣一次）就算讀過那一頁 ---- */
  function pagesTick() {
    try {
      var vd = $('view-doc');
      if (!pdf || !pdf.id || !vd || vd.hidden || typeof currentPageIndex !== 'function') { return; }
      var i = currentPageIndex(); if (!(i >= 0)) { return; }
      var h = histGet(); if (!h.p) { h.p = {}; }
      var a = h.p[pdf.id] || (h.p[pdf.id] = []);
      if (a.indexOf(i) >= 0) { return; }
      a.push(i);
      var ks = Object.keys(h.p); if (ks.length > 300) { ks.slice(0, ks.length - 300).forEach(function (k) { delete h.p[k]; }); }
      histSave(h);
    } catch (err) {}
  }
  function pagesRead() { var h = histGet(), n = 0; Object.keys(h.p || {}).forEach(function (k) { n += (h.p[k] || []).length; }); return n; }
  function wordsRead() { var h = histGet(), n = 0; Object.keys(h.c || {}).forEach(function (k) { n += h.c[k] || 0; }); return n; }

  /* ---- 連續天數的火苗圖案：連續越久，火苗越旺 ---- */
  function streakTier(n) { return n >= 100 ? 6 : n >= 30 ? 5 : n >= 14 ? 4 : n >= 7 ? 3 : n >= 3 ? 2 : 1; }
  var FL_OUT = 'M12 2c.6 3.2-1.8 5-3.2 7C7.4 11 6.5 12.6 6.5 14.6A5.5 5.5 0 0 0 12 20.5a5.5 5.5 0 0 0 5.5-5.6c0-2.5-1.3-4.2-2.5-5.5.1 1.5-.4 2.7-1.5 3.2.3-3.2-.5-6.8-1.5-10.6z';
  var FL_IN = 'M12 20.5a3.3 3.3 0 0 1-3.3-3.4c0-1.6 1-2.6 1.8-3.6.6-.8 1-1.6 1-2.6 1.4 1.3 3.8 2.8 3.8 6a3.3 3.3 0 0 1-3.3 3.6z';
  var FL_COL = [null, ['#ffb347', '#ffe08a'], ['#ff8a1f', '#ffd23f'], ['#ff6a1a', '#ffc83d'], ['#ff3d2e', '#ffb020'], ['#2f7dff', '#9be0ff'], ['#e0243a', '#ffd23f']];
  function spark(x, y, r, c) { return '<path d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + c + '"/>'; }
  function streakIcon(n) {
    var t = streakTier(n), c = FL_COL[t];
    var s = '<svg viewBox="0 0 24 24" aria-hidden="true" class="achfl t' + t + '">';
    if (t >= 6) { s += '<circle cx="12" cy="13" r="10.5" fill="#ffd23f" opacity=".3"/>'; }
    s += '<path d="' + FL_OUT + '" fill="' + c[0] + '"/><path d="' + FL_IN + '" fill="' + c[1] + '"/>';
    if (t >= 3) { s += '<path d="M4.2 20.4a2.5 2.5 0 0 1-1.9-2.4c0-1.2.9-1.9 1.4-2.8.3.9 1 1.4 1.7 1.9a2.6 2.6 0 0 1-1.2 3.3z" fill="' + c[0] + '" opacity=".9"/>'; }
    if (t >= 4) { s += spark(19.5, 6, 2.2, c[1]); }
    if (t >= 5) { s += spark(4.5, 7, 1.7, c[1]); }
    if (t >= 6) { s += spark(12, 1.6, 1.6, '#fff3b0'); }
    return s + '</svg>';
  }

  /* ---- 成長圖（區塊點開後看）：記熟的生字（折線）、讀過的字數（累計折線）、學習分鐘（長條）---- */
  var ACH_DAYS = 30;
  function niceMax(v) { if (v <= 4) { return 4; } var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function histSeries(metric) {
    var h = histGet(), keys = [], t = new Date(); t.setHours(12, 0, 0, 0);
    for (var i = ACH_DAYS - 1; i >= 0; i--) { var d = new Date(t.getTime()); d.setDate(d.getDate() - i); keys.push(dayKey(d.getTime())); }
    var t0 = keyTime(keys[0]), vals = [], base = 0, prevK = null;
    var all = Object.keys(h.d).sort(function (a, b) { return keyTime(a) - keyTime(b); });
    all.forEach(function (k) { if (keyTime(k) < t0) { base += (h.d[k].w || 0); if (h.d[k].k != null) { prevK = h.d[k].k; } } });
    var cum = base, carry = prevK;
    keys.forEach(function (k) {
      var o = h.d[k];
      if (metric === 'k') { if (o && o.k != null) { carry = o.k; } vals.push(carry); }
      else if (metric === 's') { vals.push(o ? Math.round((o.s || 0) / 6) / 10 : 0); }
      else { cum += (o && o.w) || 0; vals.push(cum > 0 || o ? cum : null); }
    });
    if (metric === 'k') { vals[vals.length - 1] = knownCount(); }
    return { keys: keys, vals: vals };
  }
  function chartSvg(metric, ser) {
    var W = 320, H = 150, L = 34, R = 10, T = 14, B = 24, n = ser.vals.length, pts = [];
    var mx = 0; ser.vals.forEach(function (v) { if (v != null && v > mx) { mx = v; } });
    var top = niceMax(Math.max(mx, 1)), pw = W - L - R, ph = H - T - B;
    function X(i) { return L + (n === 1 ? pw / 2 : pw * i / (n - 1)); }
    function Y(v) { return T + ph - ph * v / top; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="achsvg" role="img" aria-hidden="true">';
    [0, 0.5, 1].forEach(function (f) { var y = Y(top * f); s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" class="achgrid"/><text x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" class="achtick">' + (Math.round(top * f * 10) / 10) + '</text>'; });
    var dm = function (k) { var p = k.split('-'); return p[1] + '/' + p[2]; };
    s += '<text x="' + L + '" y="' + (H - 6) + '" class="achtick">' + dm(ser.keys[0]) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" class="achtick">' + dm(ser.keys[n - 1]) + '</text>';
    if (metric === 's') {
      var bw = Math.max(3, pw / n - 3);
      ser.vals.forEach(function (v, i) { if (v > 0) { var y = Y(v); s += '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1.5, T + ph - y).toFixed(1) + '" rx="1.5" class="achbar' + (i === n - 1 ? ' now' : '') + '"/>'; } });
    } else {
      ser.vals.forEach(function (v, i) { if (v != null) { pts.push([X(i), Y(v)]); } });
      if (pts.length > 1) {
        var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
        s += '<path d="' + line + 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (T + ph) + 'L' + pts[0][0].toFixed(1) + ' ' + (T + ph) + 'Z" class="achfill"/><path d="' + line + '" class="achline"/>';
      }
      if (pts.length) { var lp = pts[pts.length - 1]; s += '<circle cx="' + lp[0].toFixed(1) + '" cy="' + lp[1].toFixed(1) + '" r="4" class="achdot"/>'; }
    }
    return s + '</svg>';
  }
  function growthChart(metric) {
    var box = el('div', 'achchart');
    var ser = histSeries(metric), vals = ser.vals, last = vals[vals.length - 1], first = null;
    vals.forEach(function (v) { if (first == null && v != null) { first = v; } });
    var sum = el('div', 'achsum'); sum.appendChild(el('b', '', String(metric === 's' ? (Math.round((last || 0) * 10) / 10) : (last || 0))));
    sum.appendChild(el('span', 'achunit', metric === 'k' ? L2('個記熟的生字', 'mastered words') : metric === 's' ? L2('分鐘（今天）', 'minutes today') : L2('個詞（累計）', 'words in total')));
    box.appendChild(sum);
    var enough = metric === 's' ? vals.some(function (v) { return v > 0; }) : vals.filter(function (v) { return v != null; }).length >= 2;
    if (metric !== 's' && last != null && first != null && last !== first) { var dl = el('div', 'achdelta'); dl.appendChild(el('span', '', L2('最近一個月', 'Last month'))); dl.appendChild(el('b', '', '+' + (last - first))); box.appendChild(dl); }
    var holder = el('div', 'achplot'); holder.innerHTML = chartSvg(metric, ser); box.appendChild(holder);
    var lbl = metric === 'k' ? L2('記熟的生字：從 ' + (first == null ? 0 : first) + ' 個到 ' + (last || 0) + ' 個', 'Mastered words: from ' + (first == null ? 0 : first) + ' to ' + (last || 0)) : metric === 's' ? L2('每天學習分鐘', 'Minutes studied each day') : L2('累計讀過的字數：', 'Total words read: ') + (last || 0);
    holder.setAttribute('role', 'img'); holder.setAttribute('aria-label', lbl);
    if (!enough) { box.appendChild(el('p', 'achhint', metric === 's' ? L2('學習時間會自己算：只算畫面開著、有在操作的時間。', 'Study time is counted automatically: only while the screen is open and you are active.') : L2('再多學幾天，這裡就會畫出你的成長線。', 'Study a few more days and your growth line will appear here.'))); }
    return box;
  }

  /* ---- 三個區塊：點一下才展開細節 ---- */
  var achBlock = '', calM = null;
  var ICO = {
    doc: '<svg class="bi" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h5M9.5 16h5"/></svg>',
    wd: '<svg class="bi" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-3.6L6 21z"/><path d="M9.5 9h5"/></svg>',
    task: '<svg class="bi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.5 2.5 4.5-5"/></svg>'
  };
  function kv(label, val) { var r = el('div', 'achkv'); r.appendChild(el('span', '', label)); r.appendChild(el('b', '', String(val))); return r; }
  function blockPanel(kind) {
    var st = learnStats(), p = el('div', 'achpanel'); p.id = 'achPanel'; p.setAttribute('role', 'region');
    if (kind === 'doc') {
      p.setAttribute('aria-label', L2('文件的紀錄', 'Document record'));
      p.appendChild(recBar(L2('讀過的文件', 'Documents read'), st.read, recNext('read', st.read)));
      p.appendChild(kv(L2('讀過的頁數（PDF、照片）', 'Pages read (PDF, photos)'), pagesRead()));
      p.appendChild(kv(L2('讀過的字數（文字文件）', 'Words read (text documents)'), wordsRead()));
      p.appendChild(growthChart('w'));
    } else if (kind === 'wd') {
      p.setAttribute('aria-label', L2('生字的紀錄', 'Word record'));
      p.appendChild(recBar(L2('存下的生字卡', 'Flashcards saved'), st.words, recNext('words', st.words)));
      p.appendChild(recBar(L2('記熟的生字', 'Words mastered'), st.known, recNext('known', st.known)));
      p.appendChild(recBar(L2('複習次數', 'Reviews'), st.rev, recNext('rev', st.rev)));
      p.appendChild(growthChart('k'));
    } else {
      p.setAttribute('aria-label', L2('任務的紀錄', 'Task record'));
      var o = tasksGet(), fin = o.list.filter(function (t) { return t.done; }).sort(function (a, b) { return b.done - a.done; });
      var wk = fin.filter(function (t) { return t.done >= Date.now() - 7 * 864e5; }).length;
      p.appendChild(kv(L2('最近 7 天完成', 'Done in the last 7 days'), wk));
      p.appendChild(kv(L2('進行中', 'In progress'), o.list.length - fin.length));
      if (fin.length) {
        p.appendChild(el('p', 'achsgt', L2('完成的任務（點圓圈可以取消）', 'Completed tasks (tap the circle to undo)')));
        var ul = el('ul', 'achlist'); fin.slice(0, 30).forEach(function (t) { ul.appendChild(taskRow(t, ul, renderAchTab)); }); p.appendChild(ul);
      } else { p.appendChild(el('p', 'achhint', L2('完成的任務會記在這裡。', 'Finished tasks will be listed here.'))); }
    }
    return p;
  }

  /* ---- 月曆：有進入應用程式的日子畫實心圓，今天是橘色 ---- */
  var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function calendarBox() {
    var box = el('div', 'achcal'), now = new Date(), set = {}, first = null;
    daysLog().forEach(function (k) { set[k] = 1; var t = keyTime(k); if (first == null || t < first) { first = t; } });
    var cur = now.getFullYear() * 12 + now.getMonth(), fd = first == null ? now : new Date(first), min = Math.min(cur, fd.getFullYear() * 12 + fd.getMonth());
    if (!calM) { calM = cur; }
    calM = Math.max(min, Math.min(cur, calM));
    var y = Math.floor(calM / 12), m = calM % 12;
    var hd = el('div', 'achcalhd');
    var pv = el('button', 'achnav', '‹'); pv.type = 'button'; pv.disabled = calM <= min; pv.setAttribute('aria-label', L2('上一個月', 'Previous month'));
    var nx = el('button', 'achnav', '›'); nx.type = 'button'; nx.disabled = calM >= cur; nx.setAttribute('aria-label', L2('下一個月', 'Next month'));
    var ttl = el('span', 'achcalt', L2(y + ' 年 ' + (m + 1) + ' 月', MONTHS_EN[m] + ' ' + y)); ttl.setAttribute('aria-live', 'polite');
    pv.addEventListener('click', function () { calM--; box.replaceWith(calendarBox()); });
    nx.addEventListener('click', function () { calM++; box.replaceWith(calendarBox()); });
    hd.appendChild(pv); hd.appendChild(ttl); hd.appendChild(nx); box.appendChild(hd);
    var wd = el('div', 'achwdays'); wd.setAttribute('aria-hidden', 'true');
    L2('一,二,三,四,五,六,日', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun').split(',').forEach(function (x) { wd.appendChild(el('span', '', x)); });
    box.appendChild(wd);
    var lead = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate(), rows = Math.ceil((lead + dim) / 7), grid = el('div', 'achdays'), tk = dayKey();
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', L2('這個月進入應用程式的日子', 'Days you opened the app this month'));
    for (var i = 0; i < rows * 7; i++) {
      var d = new Date(y, m, 1 - lead + i, 12), k = dayKey(d.getTime()), inM = d.getMonth() === m, on = !!set[k], isT = k === tk;
      var c = el('span', 'achday' + (inM ? '' : ' out') + (on ? ' on' : '') + (isT ? ' today' : ''), String(d.getDate()));
      if (on && inM) { c.setAttribute('aria-label', L2((d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日，有進入應用程式', MONTHS_EN[d.getMonth()] + ' ' + d.getDate() + ': opened the app')); }
      grid.appendChild(c);
    }
    box.appendChild(grid);
    return box;
  }

  /* ---- 每週目標（月曆上面）：本週進度＋小小的選項 ---- */
  function weekRow() {
    var wg = weekGoal(), wd = weekDays(), row = el('div', 'achwk');
    var top = el('div', 'achwt'), lt = el('span', 'achwl'); lt.appendChild(document.createTextNode(L2('本週學習 ', 'This week ') )); lt.appendChild(el('b', '', Math.min(wd, wg) + ' / ' + wg)); lt.appendChild(document.createTextNode(L2(' 天', ' days')));
    top.appendChild(lt);
    var lab = el('label', 'achsel'); lab.appendChild(el('span', '', L2('每週目標', 'Weekly goal')));
    var sel = el('select', 'achsl'); sel.setAttribute('aria-label', L2('每週目標', 'Weekly goal'));
    var opts = [3, 4, 5, 6]; if (opts.indexOf(wg) < 0) { opts.push(wg); opts.sort(); }
    opts.forEach(function (n) { var o = el('option', '', L2(n + ' 天', n + ' days')); o.value = String(n); if (n === wg) { o.selected = true; } sel.appendChild(o); });
    sel.addEventListener('change', function () { lsSetJ(WEEKGOAL_KEY, +sel.value); row.replaceWith(weekRow()); try { renderToday(); } catch (err) {} });
    lab.appendChild(sel); top.appendChild(lab); row.appendChild(top);
    var bar = el('span', 'lqbar'), f = el('span'); f.style.width = Math.round(Math.min(wd, wg) / wg * 100) + '%'; bar.appendChild(f);
    bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(wg)); bar.setAttribute('aria-valuenow', String(Math.min(wd, wg))); bar.setAttribute('aria-label', L2('本週學習', 'This week'));
    row.appendChild(bar);
    return row;
  }

  function minutesBox() {
    var d = el('details', 'achmore'); d.open = !!achOpen.mins;
    d.appendChild(el('summary', '', L2('學習時間', 'Study time')));
    var inner = el('div', 'achmin'); d.appendChild(inner);
    function fill() { inner.replaceChildren(); inner.appendChild(growthChart('s')); }
    d.addEventListener('toggle', function () { achOpen.mins = d.open; if (d.open) { fill(); } });
    if (d.open) { fill(); }
    return d;
  }

  function recordSection() {
    var st = learnStats(), sec = el('section', 'mapsec achsec recsec');
    var hd = el('div', 'achhd'); hd.appendChild(el('h2', 'maph', L2('學習紀錄', 'Learning record')));
    var sn = streakDays(), sk = el('span', 'achstreak'), stx = L2('連續 ' + sn + ' 天', 'A ' + sn + '-day streak');
    sk.setAttribute('aria-label', stx); sk.appendChild(el('span', 'achstx', stx)); sk.insertAdjacentHTML('beforeend', streakIcon(Math.max(sn, 1)));
    hd.appendChild(sk); sec.appendChild(hd);
    var o = tasksGet(), nfin = o.list.filter(function (t) { return t.done; }).length;
    var BK = [
      ['doc', st.read, L2('文件', 'Documents'), L2('讀過 ' + pagesRead() + ' 頁', pagesRead() + (pagesRead() === 1 ? ' page' : ' pages') + ' read')],
      ['wd', st.words, L2('生字卡', 'Flashcards'), L2('記熟 ' + st.known + ' 個', st.known + ' mastered')],
      ['task', nfin, L2('完成的任務', 'Tasks done'), L2('進行中 ' + (o.list.length - nfin) + ' 個', (o.list.length - nfin) + ' in progress')]
    ];
    var grid = el('div', 'achblocks'), btns = {};
    function paint() {
      var old = sec.querySelector('#achPanel'); if (old) { old.remove(); }
      Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-expanded', achBlock === k ? 'true' : 'false'); });
      if (achBlock) { grid.after(blockPanel(achBlock)); }
    }
    BK.forEach(function (b) {
      var btn = el('button', 'achblk'); btn.type = 'button'; btn.setAttribute('aria-controls', 'achPanel'); btn.setAttribute('data-blk', b[0]);
      btn.insertAdjacentHTML('beforeend', ICO[b[0]]);
      btn.appendChild(el('span', 'bn', String(b[1]))); btn.appendChild(el('span', 'bl', b[2])); btn.appendChild(el('span', 'bs', b[3]));
      btn.addEventListener('click', function () { achBlock = achBlock === b[0] ? '' : b[0]; paint(); });
      btns[b[0]] = btn; grid.appendChild(btn);
    });
    sec.appendChild(grid); paint();
    sec.appendChild(weekRow());
    sec.appendChild(calendarBox());
    sec.appendChild(minutesBox());
    return sec;
  }

  /* ====== 設定裡的「小火苗」：動態／靜態／關 ====== */
  function flameMode() { var r = rwdGet(); return !r.flame ? 'off' : (r.anim ? 'on' : 'still'); }
  function flameModeSet(v) { var o = lsGetJ(RWD_KEY, {}) || {}; o.flame = v === 'off' ? 0 : 1; o.anim = v === 'on' ? 1 : 0; lsSetJ(RWD_KEY, o); }
  (function () {
    var g = $('flameGroup'); if (!g) { return; }
    function draw() { segButtons(g, [['on', L2('動態', 'Animated')], ['still', L2('靜態', 'Still')], ['off', L2('關', 'Off')]], flameMode(), function (v) { flameModeSet(v); draw(); }); }
    draw();
  })();

  /* ====== 分頁 ====== */
  function renderAchTab() {
    var host = $('achBody'); if (!host) { return; }
    var y = window.scrollY;
    host.replaceChildren();
    host.appendChild(taskSection()); host.appendChild(recordSection());
    try { window.scrollTo(0, y); } catch (err) {}
  }

  /* ---- 主頁最上面：有任務時顯示第一個，點一下到「成就」；沒有任務就什麼都不放 ---- */
  var ICON_TASK = '<svg class="hri" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.5 2.5 4.5-5"/></svg>';
  questCard = function () {
    var o = tasksGet(), t = o.list.filter(function (x) { return !x.done; })[0];
    if (!t) { return document.createDocumentFragment(); }
    var b = el('button', 'mapbar'); b.type = 'button'; b.id = 'questCard'; b.setAttribute('aria-label', '我的任務：' + t.t);
    var ic = el('span', 'mbic'); ic.innerHTML = ICON_TASK; b.appendChild(ic);
    b.appendChild(el('span', 'mbk', '任務')); b.appendChild(el('span', 'mbv', t.t));
    if (t.n > 1) { b.appendChild(el('span', 'mbn', Math.min(t.c, t.n) + ' / ' + t.n)); }
    b.insertAdjacentHTML('beforeend', ICON_CHEV);
    var bar = el('span', 'mbbar'), fill = el('span'); fill.style.width = Math.round(Math.min(t.c || 0, t.n) / t.n * 100) + '%'; bar.appendChild(fill); b.appendChild(bar);
    b.addEventListener('click', function () { showTab('ach'); });
    return b;
  };
  openQuest = function () { showTab('ach'); };
  questCelebrate = function () { flameSoon(); };

  /* 存生字卡、複習之後檢查有沒有達成什麼 */
  var _saveCards1 = saveCards;
  saveCards = function () { var r = _saveCards1.apply(this, arguments); flameSoon(); return r; };
  setTimeout(function () { flameCheck(true); }, 1200);
