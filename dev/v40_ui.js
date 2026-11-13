  /* ====== 1.31：「成就」分頁（我的任務、學習紀錄、成長圖）＋小火苗 ======
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
    var b = el('button', 'achchk' + (t.done ? ' on' : '')); b.type = 'button';
    if (t.done) { b.innerHTML = ICON_CHECK; } else if (multi) { b.textContent = '+1'; }
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
  var achOpen = { done: false, more: false };
  function taskSection() {
    var sec = el('section', 'mapsec achsec');
    var hd = el('div', 'maphd'); hd.appendChild(el('h2', 'maph', '我的任務')); sec.appendChild(hd);
    sec.appendChild(el('p', 'mapsub', '小小的就好，沒有期限。做完打勾，會冒出一朵小火苗鼓勵你。'));
    function rerender() { var nx = taskSection(); sec.replaceWith(nx); }
    var form = el('form', 'achadd');
    var inp = el('input', 'achin'); inp.type = 'text'; inp.maxLength = 80; inp.placeholder = '例如：讀一篇文章'; inp.setAttribute('aria-label', '新增任務'); form.appendChild(inp);
    var add = el('button', 'primary', '加入'); add.type = 'submit'; form.appendChild(add);
    form.addEventListener('submit', function (e) { e.preventDefault(); if (!taskAdd(inp.value, 1)) { inp.focus(); return; } var nx = taskSection(); sec.replaceWith(nx); try { nx.querySelector('.achin').focus(); } catch (err) {} });
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
    if (fin.length) {
      var d2 = el('details', 'achmore'); d2.open = achOpen.done; d2.addEventListener('toggle', function () { achOpen.done = d2.open; });
      d2.appendChild(el('summary', '', '完成的任務（' + fin.length + '）'));
      var ul3 = el('ul', 'achlist'); fin.forEach(function (t) { ul3.appendChild(taskRow(t, ul3, rerender)); }); d2.appendChild(ul3); sec.appendChild(d2);
    }
    return sec;
  }

  /* ====== 學習紀錄：進度條（往下一個里程碑）====== */
  var REC = [
    ['read', '讀過的文章', '篇', [1, 3, 5, 10, 20, 40, 80, 150, 300, 600]],
    ['words', '存下的生字', '個', [5, 10, 20, 50, 100, 200, 400, 800, 1500, 3000]],
    ['known', '記熟的生字', '個', [3, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]],
    ['rev', '複習次數', '次', [20, 50, 100, 300, 1000, 3000, 10000]],
    ['days', '累計學習天數', '天', [3, 7, 14, 30, 60, 100, 200, 365]]
  ];
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
  function recordSection() {
    var st = learnStats(), sec = el('section', 'mapsec achsec recsec');
    sec.appendChild(el('h2', 'maph', '學習紀錄'));
    REC.forEach(function (r) {
      var have = st[r[0]] || 0, ms = r[3], next = ms[ms.length - 1];
      for (var i = 0; i < ms.length; i++) { if (have < ms[i]) { next = ms[i]; break; } }
      sec.appendChild(recBar(r[1], have, next));
    });
    var wg = weekGoal();
    sec.appendChild(recBar('本週學習', st.week, wg));
    if (st.streak > 1) { sec.appendChild(el('p', 'achstreak', '連續 ' + st.streak + ' 天')); }
    var gr = el('div', 'lqgoal'); gr.appendChild(el('span', 'lqgl', '每週目標'));
    var gs = el('div', 'seg'); gs.setAttribute('role', 'radiogroup'); gs.setAttribute('aria-label', '每週目標'); gr.appendChild(gs);
    function goalSeg() {
      segButtons(gs, [['3', '3 天'], ['4', '4 天'], ['5', '5 天'], ['6', '6 天']], String(weekGoal()), function (v) {
        lsSetJ(WEEKGOAL_KEY, +v); var nx = recordSection(); sec.replaceWith(nx); try { renderToday(); } catch (err) {}
      });
    }
    goalSeg(); sec.appendChild(gr);
    sec.appendChild(el('p', 'lqsfoot', '讀文章：打開過的不同文件。記熟：複習後預估能記住 21 天以上的生字。學習天數：那天有打開文件或複習就算，每週一重新計算本週。'));
    return sec;
  }

  /* ====== 成長圖：記熟的生字（折線）、每天學了幾分鐘（長條）、累計讀過的字數（折線）====== */
  var achMetric = 'k', ACH_DAYS = 30;
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
  function growthSection() {
    var sec = el('section', 'mapsec achsec');
    sec.appendChild(el('h2', 'maph', '我的成長'));
    var tabs = el('div', 'seg achmet'); tabs.setAttribute('role', 'radiogroup'); tabs.setAttribute('aria-label', '成長圖');
    var chartBox = el('div', 'achchart');
    function draw() {
      segButtons(tabs, [['k', '記熟的生字'], ['s', '學習分鐘'], ['w', '讀過的字數']], achMetric, function (v) { achMetric = v; draw(); });
      var ser = histSeries(achMetric), vals = ser.vals, last = vals[vals.length - 1], first = null;
      vals.forEach(function (v) { if (first == null && v != null) { first = v; } });
      chartBox.replaceChildren();
      var sum = el('div', 'achsum'), big = el('b', '', String(achMetric === 's' ? (Math.round((last || 0) * 10) / 10) : (last || 0))); sum.appendChild(big);
      sum.appendChild(el('span', 'achunit', achMetric === 'k' ? '個記熟的生字' : achMetric === 's' ? '分鐘（今天）' : '個詞（累計）'));
      chartBox.appendChild(sum);
      var enough = achMetric === 's' ? vals.some(function (v) { return v > 0; }) : vals.filter(function (v) { return v != null; }).length >= 2;
      if (achMetric !== 's' && last != null && first != null && last !== first) { var dl = el('div', 'achdelta'); dl.appendChild(el('span', '', '最近一個月')); dl.appendChild(el('b', '', '+' + (last - first))); chartBox.appendChild(dl); }
      var holder = el('div', 'achplot'); holder.innerHTML = chartSvg(achMetric, ser); chartBox.appendChild(holder);
      var lbl = achMetric === 'k' ? L2('記熟的生字：從 ' + (first == null ? 0 : first) + ' 個到 ' + (last || 0) + ' 個', 'Mastered words: from ' + (first == null ? 0 : first) + ' to ' + (last || 0)) : achMetric === 's' ? L2('每天學習分鐘', 'Minutes studied each day') : L2('累計讀過的字數：', 'Total words read: ') + (last || 0);
      holder.setAttribute('role', 'img'); holder.setAttribute('aria-label', lbl);
      if (!enough) { chartBox.appendChild(el('p', 'achhint', achMetric === 's' ? '學習時間會自己算：只算畫面開著、有在操作的時間。' : '再多學幾天，這裡就會畫出你的成長線。')); }
    }
    draw();
    sec.appendChild(tabs); sec.appendChild(chartBox);
    sec.appendChild(el('p', 'lqsfoot', '只記數量，不打分數。「讀過的字數」是貼上的文字、網址、字幕這類文字文件，第一次打開時算一次；PDF 和照片不算。'));
    return sec;
  }

  /* ====== 小火苗設定 ====== */
  function rewardSection() {
    var sec = el('section', 'mapsec achsec');
    var det = el('details', 'achmore achset'); det.appendChild(el('summary', '', '小火苗設定'));
    det.appendChild(el('p', 'lqsfoot', '學習時偶爾會冒出一朵小火苗鼓勵你，不用特別做什麼。'));
    [['flame', '小火苗'], ['anim', '動畫']].forEach(function (x) {
      var r = el('div', 'lqgoal'); r.appendChild(el('span', 'lqgl', x[1]));
      var g = el('div', 'seg'); g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', x[1]); r.appendChild(g);
      function draw() { segButtons(g, [['1', '開'], ['0', '關']], rwdGet()[x[0]] ? '1' : '0', function (v) { rwdSet(x[0], v === '1'); draw(); }); }
      draw(); det.appendChild(r);
    });
    det.appendChild(el('p', 'lqsfoot', '手機設定裡開了「減少動態效果」的話，動畫會自動關掉。'));
    sec.appendChild(det);
    return sec;
  }

  /* ====== 分頁 ====== */
  function renderAchTab() {
    var host = $('achBody'); if (!host) { return; }
    host.replaceChildren();
    host.appendChild(taskSection()); host.appendChild(recordSection()); host.appendChild(growthSection()); host.appendChild(rewardSection());
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
