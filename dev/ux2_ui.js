  /* ---------- 1.21／1.22 主頁上方：學習關卡＋細長的「繼續讀／今天複習／讀物庫」 ----------
     參考 growth.design（目標漸近、未完成效應、峰終定律）與 rar.design（相近的東西放一組、一頁一個主要動作）。 */
  var DAYS_KEY = 'thai-days', READ_KEY = 'thai-read', STAT_KEY = 'thai-stats', QSEEN_KEY = 'thai-quest-seen';
  function lsGetJ(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (err) { return d; } }
  function lsSetJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (err) {} }
  function dayKey(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function daysLog() { var a = lsGetJ(DAYS_KEY, []); return Array.isArray(a) ? a : []; }
  function markDay() {
    var a = daysLog(), k = dayKey();
    if (a.indexOf(k) >= 0) { return; }
    a.push(k); if (a.length > 1000) { a = a.slice(-1000); }
    lsSetJ(DAYS_KEY, a);
  }
  /* 連續幾天：今天或昨天有學，往前數到中斷為止 */
  function streakDays() {
    var set = {}; daysLog().forEach(function (k) { set[k] = 1; });
    var t = new Date(); t.setHours(12, 0, 0, 0);
    if (!set[dayKey(t.getTime())]) { t.setDate(t.getDate() - 1); if (!set[dayKey(t.getTime())]) { return 0; } }
    var n = 0; while (set[dayKey(t.getTime())]) { n++; t.setDate(t.getDate() - 1); }
    return n;
  }
  /* 最長連續天數（關卡用這個，斷掉一天也不會把已經過的關收回） */
  function bestStreak() {
    var ts = daysLog().map(function (k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12).getTime(); }).sort(function (a, b) { return a - b; });
    var best = 0, run = 0, prev = 0;
    ts.forEach(function (t) { run = prev && Math.round((t - prev) / 864e5) === 1 ? run + 1 : (prev === t ? run : 1); prev = t; if (run > best) { best = run; } });
    return Math.max(best, streakDays());
  }
  function todayStats() {
    var t0 = today0(), due = 0, done = 0;
    (cards || []).forEach(function (c) { if (c.last && c.last >= t0) { done++; } else if (c.due <= t0) { due++; } });
    return { due: due, done: done };
  }
  /* ---- 學習紀錄：讀了幾篇（開過的不同文件）、生字幾個、記熟幾個（穩定度 ≥ 21 天）、複習幾次 ---- */
  function markRead(id) {
    if (!id) { return; }
    var r = lsGetJ(READ_KEY, {}); if (r[id]) { return; }
    r[id] = Date.now(); lsSetJ(READ_KEY, r);
  }
  function statBump(k) { var s = lsGetJ(STAT_KEY, {}); s[k] = (s[k] || 0) + 1; lsSetJ(STAT_KEY, s); }
  (function backfill() {
    var r = lsGetJ(READ_KEY, null); if (r) { return; }
    r = {}; (lib.docs || []).forEach(function (d) { if (d.opened) { r[d.id] = d.opened; } });
    var s = lsGetJ(STAT_KEY, {}); if (!s.rev) { s.rev = (cards || []).reduce(function (a, c) { return a + (c.reps || (c.fs && c.fs.n) || 0); }, 0); lsSetJ(STAT_KEY, s); }
    lsSetJ(READ_KEY, r);
  })();
  function learnStats() {
    var known = (cards || []).filter(function (c) { return c.fs && c.fs.s >= 21; }).length;
    return { read: Object.keys(lsGetJ(READ_KEY, {})).length, words: (cards || []).length, known: known, rev: lsGetJ(STAT_KEY, {}).rev || 0, streak: streakDays(), best: bestStreak() };
  }
  /* ---- 關卡：5 章、每章 6 關，照順序一關一關過 ---- */
  var QUEST_CH = [['起步', 'เริ่มต้น'], ['市場', 'ตลาด'], ['旅行', 'เที่ยว'], ['新聞', 'ข่าว'], ['文學', 'วรรณกรรม']];
  var QUEST = [
    ['read', 1], ['words', 5], ['rev', 20], ['best', 3], ['read', 5], ['words', 20],
    ['known', 5], ['best', 7], ['rev', 100], ['read', 10], ['words', 50], ['known', 20],
    ['best', 14], ['read', 20], ['rev', 300], ['words', 100], ['known', 50], ['best', 30],
    ['read', 40], ['words', 200], ['rev', 1000], ['known', 100], ['best', 60], ['read', 80],
    ['words', 400], ['known', 200], ['best', 100], ['read', 150], ['rev', 3000], ['known', 500]];
  var QUEST_TXT = { read: ['讀 ', ' 篇文章'], words: ['存 ', ' 個生字'], rev: ['複習 ', ' 次'], best: ['連續學 ', ' 天'], known: ['記熟 ', ' 個生字'] };
  function questText(q) { return q[0] === 'read' && q[1] === 1 ? '讀完第一篇文章' : QUEST_TXT[q[0]][0] + q[1] + QUEST_TXT[q[0]][1]; }
  function questState(st) {
    st = st || learnStats();
    var cur = QUEST.length;
    for (var i = 0; i < QUEST.length; i++) { if ((st[QUEST[i][0]] || 0) < QUEST[i][1]) { cur = i; break; } }
    return { cur: cur, st: st };
  }
  var ICON_FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.5 3-1.6 4.6-3 6.4C7.6 11.2 7 12.6 7 14.3A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5.2c0-2.3-1.2-3.8-2.3-5 .1 1.4-.4 2.5-1.4 3 .3-3-.5-6.3-1.3-9.3z"/></svg>';
  var ICON_CHEV = '<svg class="hrchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  function questCard(qs) {
    var b = el('button', 'lqcard'); b.type = 'button'; b.id = 'questCard';
    var done = qs.cur >= QUEST.length, q = QUEST[Math.min(qs.cur, QUEST.length - 1)];
    var badge = el('span', 'lqbadge' + (done ? ' lqall' : ''));
    badge.appendChild(el('span', 'lqbn', String(done ? QUEST.length : qs.cur + 1)));
    b.appendChild(badge);
    var tx = el('span', 'lqtx');
    var line = el('span', 'lqline');
    line.appendChild(el('span', 'lqk', done ? '全部過關' : '第 ' + (qs.cur + 1) + ' 關'));
    line.appendChild(el('span', 'lqv', done ? '30 關全部完成了！' : questText(q)));
    tx.appendChild(line);
    if (!done) {
      var have = Math.min(qs.st[q[0]] || 0, q[1]);
      var bar = el('span', 'lqbar'); var fill = el('span'); fill.style.width = Math.round(have / q[1] * 100) + '%'; bar.appendChild(fill);
      bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(q[1])); bar.setAttribute('aria-valuenow', String(have)); bar.setAttribute('aria-label', '這一關的進度');
      var row = el('span', 'lqprow'); row.appendChild(bar); row.appendChild(el('span', 'lqnum', have + ' / ' + q[1])); tx.appendChild(row);
    }
    b.appendChild(tx);
    var fl = el('span', 'lqflame' + (qs.st.streak ? ' on' : '')); fl.innerHTML = ICON_FLAME; fl.appendChild(el('span', 'lqfn', String(qs.st.streak)));
    fl.setAttribute('aria-label', '連續學習 ' + qs.st.streak + ' 天'); fl.setAttribute('title', '連續學習 ' + qs.st.streak + ' 天');
    b.appendChild(fl);
    b.addEventListener('click', openQuest);
    return b;
  }
  function hrow(cls, icon, k, v, onClick) {
    var b = el('button', 'hrow ' + cls); b.type = 'button';
    b.innerHTML = icon;
    b.appendChild(el('span', 'hrk', k));
    var vv = el('span', 'hrv', v); b.appendChild(vv);
    b.insertAdjacentHTML('beforeend', ICON_CHEV);
    b.addEventListener('click', onClick);
    return b;
  }
  var ICON_BOOK = '<svg class="hri" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg>';
  var ICON_CARDS = '<svg class="hri" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/></svg>';
  var ICON_RESUME = '<svg class="hri" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function renderToday(celebrate) {
    var qh = $('questHost'), rows = $('todayRows');
    if (!qh || !rows) { return; }
    var qs = questState();
    qh.replaceChildren(questCard(qs));
    rows.replaceChildren();
    var last = lib.docs.filter(function (d) { return d.opened; }).sort(function (a, b) { return b.opened - a.opened; })[0];
    /* 只有一份文件時，清單第一個就是它，不用重複 */
    if (last && lib.docs.length >= 2) {
      var r1 = el('button', 'hpill hpread'); r1.type = 'button'; r1.innerHTML = ICON_RESUME;
      r1.appendChild(el('span', 'hpk', '繼續讀'));
      var nm = el('span', 'hpv', last.name); nm.lang = 'th'; r1.appendChild(nm);
      r1.setAttribute('aria-label', '繼續讀 ' + last.name);
      r1.addEventListener('click', function () { openDoc(last.id); });
      rows.appendChild(r1);
    }
    rows.hidden = !rows.childNodes.length;
    $('homeList').classList.toggle('hpone', rows.hidden);
    if (celebrate) { questCelebrate(qs); } else if (lsGetJ(QSEEN_KEY, null) == null) { lsSetJ(QSEEN_KEY, qs.cur); }
  }
  /* ---- 過關：小小的慶祝（只出現一次） ---- */
  var qcWrap = document.createElement('div'); qcWrap.className = 'lqclayer'; qcWrap.hidden = true;
  qcWrap.innerHTML = '<div class="lqcbox" role="alertdialog" aria-modal="true" aria-labelledby="qcT"><svg class="lqcic" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="M14 25l7 7 13-15"/></svg><div class="lqct" id="qcT"></div><div class="lqcs" id="qcS"></div><div class="lqcn" id="qcN"></div><button type="button" class="primary" id="qcOk">繼續</button></div>';
  document.body.appendChild(qcWrap);
  $('qcOk').addEventListener('click', function () { qcWrap.hidden = true; });
  qcWrap.addEventListener('click', function (e) { if (e.target === qcWrap) { qcWrap.hidden = true; } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !qcWrap.hidden) { qcWrap.hidden = true; } });
  /* 有其他視窗開著（照片調整、讀物庫、說明…）就先不慶祝，下次回主頁再說 */
  function overlayOpen() {
    if (document.body.classList.contains('cdopen')) { return true; }
    return Array.prototype.some.call(document.querySelectorAll('[aria-modal="true"], [role="dialog"]'), function (d) { return d !== qcWrap.firstChild && d.getClientRects().length > 0; });
  }
  function questCelebrate(qs) {
    var seen = lsGetJ(QSEEN_KEY, null);
    if (seen == null) { lsSetJ(QSEEN_KEY, qs.cur); return; }  /* 第一次：已經過的關不補慶祝 */
    try { if (localStorage.getItem('thai-quest-quiet') === '1') { return; } } catch (err) {}  /* 自動測試用 */
    if (qs.cur <= seen) { if (qs.cur < seen) { lsSetJ(QSEEN_KEY, qs.cur); } return; }
    /* 只在主頁或生字卡頁出現，不打斷正在讀的文章 */
    var hv = $('view-home'), cv = $('view-cards');
    if (!((hv && !hv.hidden) || (cv && !cv.hidden)) || overlayOpen()) { return; }
    lsSetJ(QSEEN_KEY, qs.cur);
    var n = qs.cur - seen;
    $('qcT').textContent = n > 1 ? '過了 ' + n + ' 關！' : '過關！';
    $('qcS').textContent = '第 ' + qs.cur + ' 關：' + questText(QUEST[qs.cur - 1]);
    $('qcN').textContent = qs.cur >= QUEST.length ? '30 關全部完成了！' : '下一關：' + questText(QUEST[qs.cur]);
    qcWrap.hidden = false;
    setTimeout(function () { $('qcOk').focus(); }, 30);
  }
  /* ---- 學習紀錄（點關卡卡片打開） ---- */
  var qsWrap = document.createElement('div'); qsWrap.className = 'cdlayer'; qsWrap.id = 'questSheet'; qsWrap.hidden = true;
  qsWrap.innerHTML = '<div class="cdback" id="qsBack"></div><div class="cdsheet" role="dialog" aria-modal="true" aria-labelledby="qsTitle"><button type="button" class="cdx" id="qsClose" aria-label="關閉">×</button><div class="cdscroll" id="qsBody"></div></div>';
  document.body.appendChild(qsWrap);
  function closeQuest() { qsWrap.hidden = true; document.body.classList.remove('cdopen'); }
  $('qsClose').addEventListener('click', closeQuest);
  $('qsBack').addEventListener('click', closeQuest);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !qsWrap.hidden) { closeQuest(); } });
  function openQuest() {
    var qs = questState(), st = qs.st, body = $('qsBody');
    body.replaceChildren();
    var h = el('h2', 'lqsh', '學習紀錄'); h.id = 'qsTitle'; body.appendChild(h);
    var grid = el('div', 'lqstats');
    [[st.read, '篇文章', '讀過'], [st.words, '個生字', '記熟 ' + st.known + ' 個'], [st.streak, '天', '連續學習・最長 ' + st.best + ' 天'], [st.rev, '次', '複習']].forEach(function (x) {
      var t = el('div', 'lqstat'); var n = el('div', 'lqsn'); n.appendChild(el('b', '', String(x[0]))); n.appendChild(el('span', '', x[1])); t.appendChild(n); t.appendChild(el('div', 'lqsl', x[2])); grid.appendChild(t);
    });
    body.appendChild(grid);
    QUEST_CH.forEach(function (ch, ci) {
      var sec = el('section', 'lqchap');
      var hd = el('div', 'lqchh'); hd.appendChild(el('span', 'lqchn', '第 ' + (ci + 1) + ' 章')); hd.appendChild(el('span', 'lqchn', ch[0]));
      var th = el('span', 'lqcht', ch[1]); th.lang = 'th'; hd.appendChild(th);
      var cleared = 0; for (var k = ci * 6; k < ci * 6 + 6; k++) { if (k < qs.cur) { cleared++; } }
      hd.appendChild(el('span', 'lqchc', cleared + ' / 6'));
      sec.appendChild(hd);
      var ol = el('ol', 'lqpath');
      for (var i = ci * 6; i < ci * 6 + 6; i++) {
        var q = QUEST[i], li = el('li', i < qs.cur ? 'lqdone' : (i === qs.cur ? 'lqcur' : 'lqlock'));
        var dot = el('span', 'lqdot');
        if (i < qs.cur) { dot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>'; } else { dot.textContent = String(i + 1); }
        li.appendChild(dot);
        var tx = el('span', 'lqptx'); tx.appendChild(el('span', 'lqpt', questText(q)));
        if (i === qs.cur) {
          var have = Math.min(st[q[0]] || 0, q[1]);
          var bar = el('span', 'lqbar'); var f = el('span'); f.style.width = Math.round(have / q[1] * 100) + '%'; bar.appendChild(f);
          var pr = el('span', 'lqprow'); pr.appendChild(bar); pr.appendChild(el('span', 'lqnum', have + ' / ' + q[1])); tx.appendChild(pr);
        }
        li.appendChild(tx);
        li.setAttribute('aria-label', '第 ' + (i + 1) + ' 關，' + questText(q) + '，' + (i < qs.cur ? '已過關' : i === qs.cur ? '進行中' : '還沒開始'));
        ol.appendChild(li);
      }
      sec.appendChild(ol); body.appendChild(sec);
    });
    body.appendChild(el('p', 'lqsfoot', '讀文章：打開過的不同文件。記熟：複習後預估能記住 21 天以上的生字。連續學習：那天有打開文件或複習就算。'));
    qsWrap.hidden = false; document.body.classList.add('cdopen');
    var cur = body.querySelector('.lqcur'); if (cur) { setTimeout(function () { cur.scrollIntoView({ block: 'center' }); }, 30); }
    setTimeout(function () { $('qsClose').focus(); }, 30);
  }
  /* 開文件、複習都算「今天有學」；主頁出現時更新 */
  var _openDoc0 = openDoc;
  openDoc = function (id) { markDay(); markRead(id); return _openDoc0.apply(this, arguments); };
  /* 資料夾分頁太多時可以左右滑；選中的那個自動捲進畫面 */
  function tabIntoView(hostId) {
    var seg = document.querySelector('#' + hostId + ' > .seg'), on = seg && seg.querySelector('[aria-checked="true"]');
    if (!on || seg.scrollWidth <= seg.clientWidth) { return; }
    var l = on.offsetLeft - seg.offsetLeft, r = l + on.offsetWidth;
    if (l < seg.scrollLeft) { seg.scrollLeft = Math.max(0, l - 16); } else if (r > seg.scrollLeft + seg.clientWidth) { seg.scrollLeft = r - seg.clientWidth + 28; }
  }
  var _renderHome0 = renderHome;
  renderHome = function () { var r = _renderHome0.apply(this, arguments); renderToday(); tabIntoView('homeFolders'); return r; };
  var _renderCards0 = renderCards;
  renderCards = function () { var r = _renderCards0.apply(this, arguments); tabIntoView('cardFolders'); return r; };
  /* 過關慶祝只在「回到主頁」和「複習完成」時出現，不會蓋住照片調整、讀物庫等視窗 */
  var _showTab0 = showTab;
  showTab = function (t) { var r = _showTab0.apply(this, arguments); if (t === 'home') { setTimeout(function () { if (!$('view-home').hidden && !overlayOpen()) { renderToday(true); } }, 250); } return r; };
  setTimeout(renderToday, 0);
