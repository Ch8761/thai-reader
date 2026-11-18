  /* ==== 1.42：生字卡頁重新設計、測驗可複選、主頁讀物庫和匯入同一層、主頁右上角連續天數 ==== */

  /* ---- 生字卡「範圍」：全部、收藏、這篇文件、各個資料夾放在同一排，不再有兩個「全部」 ---- */
  var ICON_DOC50 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4"/></svg>';
  var ICON_PLUS50 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_CHEV50 = '<svg class="csmore" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>';
  function isRealFolder(id) { return folders.some(function (f) { return f.id === id; }); }
  var _inFolder50 = inFolder;
  inFolder = function (c) {
    if (cardFolder === 'fav') { return !!c.fav; }
    if (cardFolder === 'doc') { return !!state.src && c.src === docName(); }
    return _inFolder50(c);
  };
  var _addTarget50 = addTarget;
  addTarget = function () { return isRealFolder(cardFolder) ? cardFolder : (cardFolder === 'fav' || cardFolder === 'doc' ? '' : _addTarget50()); };
  var _folderName50 = folderName;
  folderName = function (id) { return id === 'fav' ? L2('收藏', 'Starred') : id === 'doc' ? L2('這篇文件', 'This document') : _folderName50(id); };
  try { clSet(CF_KEY, 'all'); } catch (err) {}
  cardsOnlyDoc = false;
  if (cardFolder !== 'all' && cardFolder !== 'fav' && cardFolder !== 'doc' && !isRealFolder(cardFolder)) { cardFolder = 'all'; }

  function scopeEditor(kind) {
    var row = el('div', 'cseditor');
    var inp = el('input', 'fname'); inp.type = 'text'; inp.maxLength = 30;
    inp.placeholder = L2('資料夾名稱，例如：課本第 3 課', 'Folder name, e.g. Lesson 3'); inp.setAttribute('aria-label', L2('資料夾名稱', 'Folder name'));
    inp.value = kind === 'new' ? '' : folderName(cardFolder);
    var ok = el('button', 'primary', kind === 'new' ? L2('建立', 'Create') : L2('改名', 'Rename')); ok.type = 'button';
    var cancel = el('button', '', L2('取消', 'Cancel')); cancel.type = 'button';
    function commit() {
      var name = inp.value.trim(); if (!name) { inp.focus(); return; }
      if (kind === 'new') { var f = { id: 'f' + Date.now().toString(36), name: name }; folders.push(f); cardFolder = f.id; }
      else { folders.forEach(function (f) { if (f.id === cardFolder) { f.name = name; } }); }
      folderEdit = null; saveCards(); renderCards();
    }
    ok.addEventListener('click', commit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { commit(); } if (e.key === 'Escape') { folderEdit = null; renderCards(); } });
    cancel.addEventListener('click', function () { folderEdit = null; renderCards(); });
    row.appendChild(inp); row.appendChild(ok); row.appendChild(cancel);
    setTimeout(function () { try { inp.focus(); } catch (err) {} }, 20);
    return row;
  }
  renderFolders = function () {
    var old = $('cardFolders'); if (!old) { return; }
    old.replaceChildren(); old.hidden = true;
    var host = $('cardScope');
    if (!host) { host = el('div', 'cscope'); host.id = 'cardScope'; old.parentNode.insertBefore(host, old.nextSibling); }
    host.replaceChildren();
    var row = el('div', 'csrow'); row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', L2('要看哪些卡片', 'Which cards'));
    function chip(id, label, n, cls, icon) {
      var b = el('button', 'cschip' + (cls ? ' ' + cls : '')); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(cardFolder === id));
      if (icon) { b.insertAdjacentHTML('beforeend', icon); }
      var nm = el('span', 'csn', label); b.appendChild(nm); b.appendChild(el('span', 'csc', String(n)));
      b.addEventListener('click', function () {
        if (cardFolder === id && isRealFolder(id)) { cardMenu = !cardMenu; folderEdit = null; renderCards(); return; }
        cardMenu = false; folderEdit = null; cardFolder = id; review = null; quiz = null; saveCards(); renderCards();
      });
      row.appendChild(b); return b;
    }
    chip('all', L2('全部', 'All'), cards.length);
    var nf = cards.filter(function (c) { return c.fav; }).length;
    if (nf || cardFolder === 'fav') { chip('fav', L2('收藏', 'Starred'), nf, 'csfav', ICON_STAR); }
    if (state.src) { var dn = docName(), nd = cards.filter(function (c) { return c.src === dn; }).length; if (nd || cardFolder === 'doc') { var db = chip('doc', L2('這篇文件', 'This document'), nd, 'csdoc', ICON_DOC50); db.title = dn; } }
    if (folders.length) { row.appendChild(el('span', 'cssep')); }
    folders.forEach(function (f) {
      var b = chip(f.id, f.name, cards.filter(function (c) { return c.folder === f.id; }).length, 'csfold');
      b.querySelector('.csn').setAttribute('data-noi18n', '1');
      if (cardFolder === f.id) { b.classList.add('hasmenu'); b.insertAdjacentHTML('beforeend', ICON_CHEV50); b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', String(cardMenu)); b.title = L2('再點一下：改名或刪除', 'Tap again to rename or delete'); }
    });
    var add = el('button', 'csadd'); add.type = 'button'; add.innerHTML = ICON_PLUS50; add.appendChild(el('span', '', L2('新資料夾', 'New folder')));
    add.addEventListener('click', function () { folderEdit = 'new'; cardMenu = false; renderCards(); });
    row.appendChild(add);
    host.appendChild(row);
    if (folderEdit === 'new' || (folderEdit === 'rename' && isRealFolder(cardFolder))) { host.appendChild(scopeEditor(folderEdit)); }
    if (cardMenu && !folderEdit && isRealFolder(cardFolder)) {
      folderMenu(host, row, function () { cardMenu = false; folderEdit = 'rename'; renderCards(); }, function () {
        var id = cardFolder;
        cards.forEach(function (c) { if (c.folder === id) { c.folder = ''; } });
        folders = folders.filter(function (f) { return f.id !== id; });
        cardFolder = 'all'; cardMenu = false; saveCards(); renderCards();
      }, L2('再按一次確定（裡面的生字卡不會刪，會留在「全部」）', 'Tap again to confirm (the cards stay in “All”)'));
    }
    if (isRealFolder(cardFolder) && cardTab !== 'quiz') { host.appendChild(el('div', 'cstarget', L2('之後新存的生字卡會放進「' + folderName(cardFolder) + '」', 'New cards will go into “' + folderName(cardFolder) + '”'))); }
    /* 目前選的那顆捲到看得見（手機上一排放不下時） */
    var on = row.querySelector('[aria-checked="true"]'); if (on && on.scrollIntoView && row.scrollWidth > row.clientWidth) { try { on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (err) {} }
  };

  /* ---- 卡片分頁：拿掉跟上面重複的「全部／收藏」「只看目前文件」，改成一句張數 ---- */
  var _renderList50 = renderList;
  renderList = function (host) {
    cardsOnlyDoc = false; try { clSet(CF_KEY, 'all'); } catch (err) {}
    _renderList50(host);
    var f = host.querySelector('.clfilt');
    if (f) { var n = cards.filter(inFolder).length; f.replaceWith(el('span', 'clcount', L2(n + ' 張卡片', n + (n === 1 ? ' card' : ' cards')))); }
    var b2 = host.querySelector('.clbar2'); if (b2) { b2.remove(); }
  };

  /* ---- 複習分頁：今天要複習幾張，大大的放在卡片裡 ---- */
  var _renderReview50 = renderReview;
  renderReview = function (host) {
    var idle = !review || !review.queue.length, n = idle ? dueCards().length : 0;
    _renderReview50(host);
    if (!idle || !n) { return; }
    var lab = null, btns = null;
    Array.prototype.forEach.call(host.children, function (x) { if (!lab && x.tagName === 'P' && x.classList.contains('label')) { lab = x; } if (!btns && x.classList.contains('btns')) { btns = x; } });
    if (!lab || !btns) { return; }
    var hero = el('div', 'revhero');
    var big = el('div', 'rvbig'); big.appendChild(el('span', 'rvnum', String(n))); big.appendChild(el('span', 'rvunit', L2('張今天要複習', n === 1 ? 'card due today' : 'cards due today')));
    hero.appendChild(big);
    hero.appendChild(el('p', 'rvsub', L2('大約 ' + Math.max(1, Math.round(n * 0.25)) + ' 分鐘。照記憶曲線排好，現在複習最不容易忘。', 'About ' + Math.max(1, Math.round(n * 0.25)) + ' min. Scheduled on a memory curve — now is the best time.')));
    host.insertBefore(hero, lab); lab.remove(); hero.appendChild(btns);
  };

  /* ---- 測驗：範圍和題型都可以複選，題數可以選 ---- */
  var QS_KEY = 'thai-quiz-setup';
  function quizTypesAll() { var a = [['th2zh', L2('看泰文選意思', 'Thai → meaning')], ['zh2th', L2('看意思選泰文', 'Meaning → Thai')], ['listen', L2('聽發音選泰文', 'Listen → Thai')]]; if (toneMode) { a.push(['tone', L2('聲調與子音', 'Tones & consonant class')]); } return a; }
  function qsGet() {
    var o = {}; try { o = JSON.parse(localStorage.getItem(QS_KEY) || '{}') || {}; } catch (err) {}
    var valid = quizTypesAll().map(function (x) { return x[0]; });
    o.types = (o.types || [quizType || 'th2zh']).filter(function (t) { return valid.indexOf(t) >= 0; }); if (!o.types.length) { o.types = ['th2zh']; }
    o.scopes = (o.scopes || []).filter(function (s) { return s === 'all' || s === 'fav' || isRealFolder(s); });
    if (!o.scopes.length) { o.scopes = [cardFolder === 'doc' ? 'all' : cardFolder || 'all']; }
    if ([10, 20, 'all'].indexOf(o.n) < 0) { o.n = 10; }
    return o;
  }
  function qsSet(o) { try { localStorage.setItem(QS_KEY, JSON.stringify(o)); } catch (err) {} }
  function qsInScope(c, o) { return o.scopes.indexOf('all') >= 0 || o.scopes.some(function (s) { return s === 'fav' ? !!c.fav : c.folder === s; }); }
  function qsCards(o) {
    var tone = o.types.indexOf('tone') >= 0, other = o.types.some(function (t) { return t !== 'tone'; });
    return cards.filter(function (c) { return qsInScope(c, o) && ((other && cardMeaning(c)) || (tone && TONES && toneInfo(c.w)) || (tone && !TONES)); });
  }
  function quizSetup(host) {
    var o = qsGet(), box = el('div', 'qsetup');
    function group(title, hint) { var g = el('div', 'qsgroup'); var h = el('div', 'qsh'); h.appendChild(el('span', '', title)); if (hint) { h.appendChild(el('span', 'qshint', hint)); } g.appendChild(h); var r = el('div', 'qschips'); g.appendChild(r); box.appendChild(g); return r; }
    function tog(r, label, on, fn, extra) { var b = el('button', 'qschip'); b.type = 'button'; b.setAttribute('aria-pressed', String(!!on)); b.appendChild(el('span', 'qsck')); b.appendChild(el('span', '', label)); if (extra != null) { b.appendChild(el('span', 'csc', String(extra))); } b.addEventListener('click', fn); r.appendChild(b); return b; }
    var rs = group(L2('出題範圍', 'Cards to use'), L2('可以複選', 'pick one or more'));
    tog(rs, L2('全部', 'All'), o.scopes.indexOf('all') >= 0, function () { o.scopes = ['all']; qsSet(o); renderCards(); }, cards.length);
    var nf = cards.filter(function (c) { return c.fav; }).length;
    if (nf) { tog(rs, L2('收藏', 'Starred'), o.scopes.indexOf('fav') >= 0, function () { pick('fav'); }, nf); }
    folders.forEach(function (f) { var b = tog(rs, f.name, o.scopes.indexOf(f.id) >= 0, function () { pick(f.id); }, cards.filter(function (c) { return c.folder === f.id; }).length); b.children[1].setAttribute('data-noi18n', '1'); });
    function pick(id) { var s = o.scopes.filter(function (x) { return x !== 'all'; }); var i = s.indexOf(id); if (i >= 0) { s.splice(i, 1); } else { s.push(id); } o.scopes = s.length ? s : ['all']; qsSet(o); renderCards(); }
    var rt = group(L2('題型', 'Question types'), L2('選好幾種會混在一起出', 'several = mixed'));
    quizTypesAll().forEach(function (t) {
      tog(rt, t[1], o.types.indexOf(t[0]) >= 0, function () { var i = o.types.indexOf(t[0]); if (i >= 0) { if (o.types.length > 1) { o.types.splice(i, 1); } } else { o.types.push(t[0]); } qsSet(o); renderCards(); });
    });
    var pool = qsCards(o), rn = group(L2('題數', 'Questions'));
    [[10, '10'], [20, '20'], ['all', L2('全部 ' + pool.length, 'All ' + pool.length)]].forEach(function (x) {
      var b = tog(rn, x[1], o.n === x[0], function () { o.n = x[0]; qsSet(o); renderCards(); }); b.classList.add('qsnum');
    });
    host.appendChild(box);
    var n = o.n === 'all' ? pool.length : Math.min(o.n, pool.length);
    if (!pool.length) { host.appendChild(el('p', 'label', cards.length ? L2('這個範圍還沒有可以出題的生字卡，換一個範圍試試。', 'No cards to quiz in this selection — try another.') : L2('還沒有生字卡。讀文章時點一個詞 →「加入生字卡」。', 'No flashcards yet. While reading, tap a word → “Add to flashcards”.'))); return; }
    host.appendChild(el('p', 'label qsnote', L2('會出 ' + n + ' 題；答錯的會排進今天的複習。', n + (n === 1 ? ' question' : ' questions') + '; wrong answers go into today’s review.')));
    var go = el('button', 'primary wide', L2('開始測驗', 'Start quiz')); go.type = 'button'; go.addEventListener('click', function () { startQuiz(); });
    var row = el('div', 'btns'); row.appendChild(go); host.appendChild(row);
  }
  startQuiz = function () {
    var o = qsGet();
    if (o.types.indexOf('tone') >= 0 && !TONES) { loadTones().then(function () { startQuiz(); }, function () { o.types = o.types.filter(function (t) { return t !== 'tone'; }); if (!o.types.length) { o.types = ['th2zh']; } qsSet(o); startQuiz(); }); return; }
    var pool = shuffle(qsCards(o)), n = o.n === 'all' ? pool.length : Math.min(o.n, pool.length), qs = [];
    var plain = o.types.filter(function (t) { return t !== 'tone'; });
    pool.forEach(function (c) {
      if (qs.length >= n) { return; }
      var t = o.types[Math.floor(Math.random() * o.types.length)];
      if (t === 'tone' && toneInfo(c.w)) { qs.push(toneQ(c)); return; }
      if (t === 'tone') { if (!plain.length || !cardMeaning(c)) { return; } t = plain[Math.floor(Math.random() * plain.length)]; }
      if (!cardMeaning(c)) { if (toneInfo(c.w) && o.types.indexOf('tone') >= 0) { qs.push(toneQ(c)); } return; }
      var q = makeQ(c); q.qt = t; qs.push(q);
    });
    if (!qs.length) { return; }
    stat('quiz', { types: o.types.join('+'), n: qs.length });
    quiz = { qs: qs, k: 0, right: 0, picked: null, wrong: [] };
    renderCards();
  };
  var _renderQuiz50 = renderQuiz;
  renderQuiz = function (host) {
    if (quiz && quiz.k < quiz.qs.length) { var q = quiz.qs[quiz.k]; if (q && q.qt) { quizType = q.qt; } }
    return _renderQuiz50(host);
  };
  var _renderCards50 = renderCards;
  renderCards = function () {
    var r = _renderCards50.apply(this, arguments);
    var sc = $('cardScope'); if (sc) { sc.hidden = cardTab === 'quiz' || cardTab === 'tone'; }
    return r;
  };

  /* ---- 主頁：讀物庫跟匯入放在同一排；右上角連續天數＋小火苗 ---- */
  (function () {
    var ro = $('readerOpen'), ib = document.querySelector('#view-home .importbar'), imp = ib && ib.querySelector('.impbtn');
    if (ro && ib && imp) { ro.className = 'impread'; imp.parentNode.insertBefore(ro, imp.nextSibling); var sub = ro.querySelector('.hpsub'); if (sub) { sub.remove(); } }
    var vh = document.querySelector('#view-home .vhead'); if (!vh) { return; }
    var sb = el('button', 'hstreak'); sb.type = 'button'; sb.id = 'homeStreak';
    sb.addEventListener('click', function () { showTab('ach'); });
    vh.appendChild(sb);
  })();
  function drawHomeStreak() {
    var sb = $('homeStreak'); if (!sb) { return; }
    var n = 0; try { n = streakDays(); } catch (err) {}
    sb.innerHTML = streakIcon(Math.max(1, n));
    sb.classList.toggle('zero', !n);
    sb.appendChild(el('b', '', String(n)));
    sb.appendChild(el('span', '', L2(' 天', n === 1 ? ' day' : ' days')));
    sb.setAttribute('aria-label', n ? L2('已經連續學習 ' + n + ' 天，看成就', n + '-day streak — see achievements') : L2('今天讀一點就開始連續天數，看成就', 'Read a little today to start a streak — see achievements'));
    sb.title = sb.getAttribute('aria-label');
  }
  var _renderHome50 = renderHome;
  renderHome = function () { var r = _renderHome50.apply(this, arguments); drawHomeStreak(); return r; };
  drawHomeStreak();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { setTimeout(drawHomeStreak, 300); } });
  /* 主頁：排列方式按鈕放進資料夾那一排；任務那行沒東西時收起來 */
  var _renderHome50b = renderHome;
  renderHome = function () {
    var r = _renderHome50b.apply(this, arguments);
    var hf = $('homeFolders'), vt = document.querySelector('#view-home .viewtoggle');
    if (hf && vt) { var fr = hf.querySelector('.frow'); (fr || hf).appendChild(vt); var hb = document.querySelector('#view-home .homebar'); if (hb) { hb.hidden = !hb.textContent.trim(); } }
    var hq = $('homeQuiet'), qh = $('questHost'); if (hq && qh) { hq.hidden = !qh.textContent.trim(); }
    return r;
  };
