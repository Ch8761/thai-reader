  /* ---------- 1.21 介面整理（參考 growth.design 心理學原則、rar.design 七大原則） ----------
     主頁最上面的「今天」：繼續讀上次的文件（不用回想在哪）、今天的複習進度條（目標越近越有動力）、連續學習天數。
     沒有要做的事就不顯示（漸進揭露，不多佔版面）。 */
  var DAYS_KEY = 'thai-days';
  function dayKey(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function daysLog() { try { var a = JSON.parse(localStorage.getItem(DAYS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (err) { return []; } }
  function markDay() {
    var a = daysLog(), k = dayKey();
    if (a[a.length - 1] === k) { return; }
    a.push(k); if (a.length > 400) { a = a.slice(-400); }
    try { localStorage.setItem(DAYS_KEY, JSON.stringify(a)); } catch (err) {}
  }
  /* 連續幾天：今天或昨天有學，往前數到中斷為止 */
  function streakDays() {
    var set = {}; daysLog().forEach(function (k) { set[k] = 1; });
    var t = new Date(); t.setHours(12, 0, 0, 0);
    if (!set[dayKey(t.getTime())]) { t.setDate(t.getDate() - 1); if (!set[dayKey(t.getTime())]) { return 0; } }
    var n = 0; while (set[dayKey(t.getTime())]) { n++; t.setDate(t.getDate() - 1); }
    return n;
  }
  function todayStats() {
    var t0 = today0(), due = 0, done = 0;
    (cards || []).forEach(function (c) { if (c.last && c.last >= t0) { done++; } else if (c.due <= t0) { due++; } });
    return { due: due, done: done };
  }
  var todayBox = document.createElement('div'); todayBox.id = 'todayBox'; todayBox.className = 'todaybox'; todayBox.hidden = true;
  (function () { var ha = document.querySelector('#view-home .homeadd'); if (ha) { ha.parentNode.insertBefore(todayBox, ha); } })();
  function renderToday() {
    if (!todayBox.parentNode) { return; }
    var st = todayStats(), sk = streakDays();
    var last = lib.docs.filter(function (d) { return d.opened; }).sort(function (a, b) { return b.opened - a.opened; })[0];
    todayBox.replaceChildren();
    /* 只有一份文件時，清單第一個就是它，不用重複 */
    if (last && lib.docs.length >= 2) {
      var go = el('button', 'tdrow tdread'); go.type = 'button';
      go.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg>';
      var tx = el('span', 'tdtx'); tx.appendChild(el('span', 'tdk', '繼續讀')); var nm = el('span', 'tdv', last.name); nm.lang = 'th'; tx.appendChild(nm); go.appendChild(tx);
      go.insertAdjacentHTML('beforeend', '<svg class="tdchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>');
      go.addEventListener('click', function () { openDoc(last.id); });
      todayBox.appendChild(go);
    }
    if (st.due || st.done) {
      var rv = el('button', 'tdrow tdrev'); rv.type = 'button';
      rv.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/></svg>';
      var tx2 = el('span', 'tdtx');
      tx2.appendChild(el('span', 'tdk', st.due ? '今天要複習' : '今天的複習完成了'));
      tx2.appendChild(el('span', 'tdv', st.due ? '還有 ' + st.due + ' 張生字卡' + (st.done ? '・已完成 ' + st.done + ' 張' : '') : '複習了 ' + st.done + ' 張，明天見'));
      var bar = el('span', 'tdbar'); var fill = el('span'); fill.style.width = Math.round(st.done / Math.max(1, st.done + st.due) * 100) + '%'; bar.appendChild(fill); tx2.appendChild(bar);
      bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(st.done + st.due)); bar.setAttribute('aria-valuenow', String(st.done)); bar.setAttribute('aria-label', '今天的複習進度');
      rv.appendChild(tx2);
      rv.insertAdjacentHTML('beforeend', '<svg class="tdchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>');
      rv.addEventListener('click', function () { if (st.due && !review) { cardFolder = 'all'; cardTab = 'review'; cardsOnlyDoc = false; saveCards(); startReview(false); } showTab('cards'); });
      if (!st.due) { rv.classList.add('tddone'); }
      todayBox.appendChild(rv);
    }
    if (sk >= 2) { todayBox.appendChild(el('p', 'tdstreak', '已經連續學習 ' + sk + ' 天')); }
    todayBox.hidden = !todayBox.childNodes.length;
  }
  /* 開文件、複習都算「今天有學」；主頁出現時更新 */
  var _openDoc0 = openDoc;
  openDoc = function (id) { markDay(); return _openDoc0.apply(this, arguments); };
  var _renderHome0 = renderHome;
  renderHome = function () { var r = _renderHome0.apply(this, arguments); renderToday(); return r; };
  setTimeout(renderToday, 0);
