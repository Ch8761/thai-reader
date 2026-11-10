  /* ---------- 生字卡 v2：新卡紅圈、單字詳解＋生活化例句、間隔重複複習、測驗 ---------- */
  var SEEN_KEY = 'thai-cards-seen-at', EX_URL = 'https://ch8761.github.io/thai-reader/examples.json';
  var cardsSeenAt = 0;
  try { cardsSeenAt = Number(localStorage.getItem(SEEN_KEY) || 0); } catch (err) {}
  if (!cardsSeenAt) { cardsSeenAt = Date.now(); try { localStorage.setItem(SEEN_KEY, String(cardsSeenAt)); } catch (err) {} }
  function markCardsSeen() { cardsSeenAt = Date.now(); try { localStorage.setItem(SEEN_KEY, String(cardsSeenAt)); } catch (err) {} updateCardButton(); }
  /* 下方「生字卡」的紅圈：上次打開生字卡頁之後新加的張數 */
  function updateCardButton() {
    var n = cards.filter(function (c) { return (c.added || 0) > cardsSeenAt; }).length;
    if (typeof curTab !== 'undefined' && curTab === 'cards') { n = 0; }
    var bd = $('cardBadge'); if (bd) { bd.textContent = n > 99 ? '99+' : String(n); bd.hidden = !n; bd.setAttribute('aria-label', '新加了 ' + n + ' 張生字卡'); }
  }

  /* ---- 間隔重複（類似 Anki）：忘了／有點難／記得／很簡單 ---- */
  function srsInit(c) {
    if (typeof c.ivl !== 'number') { c.ivl = c.box > 1 ? BOX_DAYS[c.box - 1] : 0; }
    if (typeof c.ease !== 'number') { c.ease = 2.5; }
    if (typeof c.lapses !== 'number') { c.lapses = 0; }
    return c;
  }
  function ivlToBox(d) { return d <= 0 ? 1 : d <= 2 ? 2 : d <= 6 ? 3 : d <= 20 ? 4 : 5; }
  function nextIvl(c, grade) {
    srsInit(c);
    if (grade === 0) { return 0; }
    if (grade === 1) { return Math.max(1, Math.round(c.ivl * 1.2)); }
    if (grade === 2) { return c.ivl ? Math.max(c.ivl + 1, Math.round(c.ivl * c.ease)) : 1; }
    return c.ivl ? Math.max(c.ivl + 2, Math.round(c.ivl * c.ease * 1.3)) : 4;
  }
  function ivlText(d) { return d <= 0 ? '今天' : d < 30 ? d + ' 天' : d < 365 ? Math.round(d / 30) + ' 個月' : Math.round(d / 365 * 10) / 10 + ' 年'; }
  function grade(c, g) {
    srsInit(c);
    var d = nextIvl(c, g);
    if (g === 0) { c.ease = Math.max(1.3, c.ease - 0.2); c.lapses++; }
    else if (g === 1) { c.ease = Math.max(1.3, c.ease - 0.15); }
    else if (g === 3) { c.ease = Math.min(3.2, c.ease + 0.15); }
    c.ivl = d; c.box = ivlToBox(d); c.due = today0() + d * DAY; c.seen = (c.seen || 0) + 1; c.last = Date.now();
    if (g > 0) { c.right = (c.right || 0) + 1; }
  }
  function startReview(all) {
    var list = all ? cards.filter(inFolder) : dueCards();
    list.forEach(srsInit);
    list.sort(function (a, b) { return a.due - b.due || a.ivl - b.ivl; });
    review = { queue: list.map(function (c) { return c.id; }), done: 0, total: list.length, flipped: false, again: {} };
    renderCards();
  }
  function answer(g) {
    var id = review.queue.shift(), c = cards.filter(function (x) { return x.id === id; })[0];
    if (c) {
      grade(c, g);
      if (g === 0) { review.again[id] = 1; review.queue.push(id); } else { review.done++; }
      saveCards();
    }
    review.flipped = false;
    renderCards();
  }
  function renderReview(host) {
    if (!review || !review.queue.length) {
      var n = dueCards().length, fc = cards.filter(inFolder).length;
      if (review && review.total) { host.appendChild(el('p', 'cdone', '這一輪完成了：' + review.total + ' 張。')); }
      host.appendChild(el('p', 'label', fc ? (n ? '有 ' + n + ' 張卡片今天要複習。' : '今天要複習的都完成了。記得越熟，下次出現就隔越久。') : '還沒有生字卡。在查詞視窗按「＋ 生字卡」就能加入。'));
      var row = el('div', 'btns');
      if (n) { var go = el('button', 'primary', '開始複習（' + n + ' 張）'); go.type = 'button'; go.addEventListener('click', function () { startReview(false); }); row.appendChild(go); }
      if (fc) { var all = el('button', '', '全部練習一次'); all.type = 'button'; all.addEventListener('click', function () { startReview(true); }); row.appendChild(all); }
      host.appendChild(row);
      review = null;
      return;
    }
    var id = review.queue[0], c = cards.filter(function (x) { return x.id === id; })[0];
    if (!c) { review.queue.shift(); renderReview(host); return; }
    srsInit(c);
    var prog = el('div', 'rprog');
    var bar = el('div', 'rbar'); var fill = el('span'); fill.style.width = Math.round(review.done / Math.max(1, review.total) * 100) + '%'; bar.appendChild(fill);
    prog.appendChild(bar); prog.appendChild(el('span', 'rnum', (review.done + 1) + ' / ' + review.total + (review.again[id] ? '・再一次' : '')));
    host.appendChild(prog);
    var card = el('div', 'fcard');
    var top = el('div', 'fctop');
    var w = el('div', 'cword', c.w); w.lang = 'th'; top.appendChild(w);
    var say = el('button', 'iconbtn csay'); say.type = 'button'; say.setAttribute('aria-label', '朗讀 ' + c.w); say.innerHTML = SPK_ICON;
    say.addEventListener('click', function () { speak(c.w); });
    top.appendChild(say);
    card.appendChild(top);
    if (c.sent) { var sn = sentenceNode(c); var ss = el('button', 'iconbtn csay small'); ss.type = 'button'; ss.setAttribute('aria-label', '朗讀這句'); ss.innerHTML = SPK_ICON; ss.addEventListener('click', function () { speak(c.sent); }); sn.appendChild(ss); card.appendChild(sn); }
    if (review.flipped) {
      var back = el('div', 'cback');
      if (showRom && c.rom) { back.appendChild(el('div', 'crom', c.rom + (c.pos ? '・' + c.pos : ''))); }
      else if (c.pos) { back.appendChild(el('div', 'crom', c.pos)); }
      meaningNodes(c, back);
      if (c.my) { back.appendChild(el('div', 'cmy', '我的筆記：' + c.my)); }
      if (toneMode) { back.appendChild(buildToneSection(c.w)); }
      var more = el('button', 'linkbtn', '看完整解釋和例句 ›'); more.type = 'button';
      more.addEventListener('click', function () { openCardDetail(c.id); });
      back.appendChild(more);
      card.appendChild(back);
    }
    host.appendChild(card);
    var row = el('div', 'btns cans');
    if (!review.flipped) {
      var flip = el('button', 'primary wide', '看答案'); flip.type = 'button';
      flip.addEventListener('click', function () { review.flipped = true; renderCards(); });
      row.appendChild(flip);
    } else {
      row.classList.add('grades');
      [[0, '忘了', 'g0'], [1, '有點難', 'g1'], [2, '記得', 'g2'], [3, '很簡單', 'g3']].forEach(function (G) {
        var b = el('button', 'grade ' + G[2]); b.type = 'button';
        b.appendChild(el('span', 'gl', G[1])); b.appendChild(el('span', 'gi', ivlText(nextIvl(c, G[0]))));
        b.setAttribute('aria-label', G[1] + '，下次 ' + ivlText(nextIvl(c, G[0])));
        b.addEventListener('click', function () { answer(G[0]); });
        row.appendChild(b);
      });
    }
    host.appendChild(row);
  }

  /* ---- 測驗：看泰文選中文、看中文選泰文、聽發音選泰文 ---- */
  var quiz = null, quizType = 'th2zh';
  function cardMeaning(c) { var g = glossSnapshot(c.w); return (glossLang !== 'en' && (c.my || g.zh || c.zh)) || g.en || c.en || ''; }
  function quizMeaning(c) { var m = String(cardMeaning(c)).split(/[；;]/)[0].trim(); return m.length > 28 ? m.slice(0, 27) + '…' : m; }
  var POOL = null;
  function distractorPool() {
    if (POOL) { return POOL; }
    POOL = [];
    if (DICT) { Object.keys(DICT).forEach(function (w) { if (w.length >= 2 && w.length <= 8 && /^[ก-๎]+$/.test(w)) { var z = zhOfEntry(w); if (z && z.length <= 10) { POOL.push([w, z]); } } }); }
    return POOL;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz() {
    if (toneMode && !TONES) { loadTones().then(startQuiz, function () { toneMode = false; startQuiz(); }); return; }
    var list, qs;
    if (quizType === 'tone') {
      list = shuffle(cards.filter(function (c) { return inFolder(c) && toneInfo(c.w); })).slice(0, 10);
      qs = list.map(toneQ);
    } else {
      list = shuffle(cards.filter(function (c) { return inFolder(c) && cardMeaning(c); })).slice(0, 10);
      qs = list.map(function (c, k) { return toneMode && k % 3 === 2 && toneInfo(c.w) ? toneQ(c) : makeQ(c); });
    }
    if (!qs.length) { return; }
    quiz = { qs: qs, k: 0, right: 0, picked: null, wrong: [] };
    renderCards();
  }
  /* 聲調題：這個音節唸什麼聲調？／這個子音是哪一類？ */
  function toneQ(c) {
    var info = toneInfo(c.w), k = Math.floor(Math.random() * info.length), o = info[k];
    var kind = Math.random() < 0.65 ? 'tone' : 'cls';
    var opts = kind === 'tone' ? ['M', 'L', 'F', 'H', 'R'].map(function (t) { return { w: t, m: TONE_NAME[t] }; }) : ['m', 'h', 'l'].map(function (x) { return { w: x, m: CLS_NAME[x] }; });
    var ans = opts.filter(function (x) { return x.w === (kind === 'tone' ? o.t : o.c); })[0];
    return { c: c, kind: kind, info: info, k: k, ans: { w: ans.w, m: ans.m, id: c.id }, opts: opts };
  }
  function makeQ(c) {
    var ans = { w: c.w, m: quizMeaning(c), id: c.id }, opts = [ans], used = {};
    used[c.w] = 1; used[ans.m] = 1;
    shuffle(cards.filter(function (x) { return x.id !== c.id && cardMeaning(x); }).slice()).forEach(function (x) {
      if (opts.length < 4 && !used[x.w] && !used[quizMeaning(x)]) { used[x.w] = used[quizMeaning(x)] = 1; opts.push({ w: x.w, m: quizMeaning(x) }); }
    });
    var pool = distractorPool(), tries = 0;
    while (opts.length < 4 && pool.length && tries++ < 200) {
      var p = pool[Math.floor(Math.random() * pool.length)];
      if (!used[p[0]] && !used[p[1]]) { used[p[0]] = used[p[1]] = 1; opts.push({ w: p[0], m: p[1] }); }
    }
    return { c: c, ans: ans, opts: shuffle(opts) };
  }
  function renderQuiz(host) {
    var fc = cards.filter(function (c) { return inFolder(c) && cardMeaning(c); }).length;
    if (!quiz) {
      host.appendChild(el('p', 'label', fc ? '從這個資料夾隨機出最多 10 題，答錯的會排進今天的複習。' : '還沒有可以出題的生字卡。'));
      if (!fc) { return; }
      var seg = el('div', 'seg qtypes'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', '題型');
      var QT = [['th2zh', '看泰文選意思'], ['zh2th', '看意思選泰文'], ['listen', '聽發音選泰文']];
      if (toneMode) { QT.push(['tone', '聲調與子音']); } else if (quizType === 'tone') { quizType = 'th2zh'; }
      segButtons(seg, QT, quizType, function (v) { quizType = v; renderCards(); });
      if (toneMode) { host.appendChild(el('p', 'label', '聲調學習模式開著：其他題型裡也會穿插聲調題。')); }
      host.appendChild(seg);
      var go = el('button', 'primary wide', '開始測驗'); go.type = 'button'; go.addEventListener('click', startQuiz);
      var row = el('div', 'btns'); row.appendChild(go); host.appendChild(row);
      return;
    }
    if (quiz.k >= quiz.qs.length) {
      var box = el('div', 'qdone');
      box.appendChild(el('div', 'qscore', quiz.right + ' / ' + quiz.qs.length));
      box.appendChild(el('p', 'label', quiz.right === quiz.qs.length ? '全對！' : '答錯的已經排進今天的複習。'));
      if (quiz.wrong.length) {
        var ul = el('ul', 'qwrong');
        quiz.wrong.forEach(function (q) { var li = el('li'); var t = el('span', 'cw', q.kind ? q.c.w : q.ans.w); t.lang = 'th'; li.appendChild(t); li.appendChild(el('span', 'cm', q.kind ? q.info[q.k].p + '：' + q.ans.m : q.ans.m)); ul.appendChild(li); });
        box.appendChild(ul);
      }
      host.appendChild(box);
      var again = el('button', 'primary', '再測一次'); again.type = 'button'; again.addEventListener('click', startQuiz);
      var back = el('button', '', '回到題型'); back.type = 'button'; back.addEventListener('click', function () { quiz = null; renderCards(); });
      var r = el('div', 'btns'); r.appendChild(again); r.appendChild(back); host.appendChild(r);
      return;
    }
    var q = quiz.qs[quiz.k];
    var prog = el('div', 'rprog'); var bar = el('div', 'rbar'); var fill = el('span'); fill.style.width = Math.round(quiz.k / quiz.qs.length * 100) + '%'; bar.appendChild(fill);
    prog.appendChild(bar); prog.appendChild(el('span', 'rnum', (quiz.k + 1) + ' / ' + quiz.qs.length)); host.appendChild(prog);
    var card = el('div', 'fcard qcard');
    if (q.kind) {
      var wl = el('div', 'cword tq'); wl.lang = 'th';
      q.info.forEach(function (o, i) { var sp = el('span', i === q.k ? 'tqhl' : '', o.p); wl.appendChild(sp); });
      card.appendChild(wl);
      var sy = el('button', 'iconbtn csay'); sy.type = 'button'; sy.setAttribute('aria-label', '朗讀 ' + q.c.w); sy.innerHTML = SPK_ICON;
      sy.addEventListener('click', function () { speak(q.c.w); });
      card.appendChild(sy);
      card.appendChild(el('div', 'qprompt small', q.kind === 'tone' ? '標起來的音節「' + q.info[q.k].p + '」唸什麼聲調？' : '「' + q.info[q.k].i + '」是哪一類子音？'));
    } else if (quizType === 'th2zh') { var w = el('div', 'cword', q.ans.w); w.lang = 'th'; card.appendChild(w); }
    else if (quizType === 'zh2th') { card.appendChild(el('div', 'qprompt', q.ans.m)); }
    else {
      var lb = el('button', 'iconbtn qlisten'); lb.type = 'button'; lb.setAttribute('aria-label', '再聽一次'); lb.innerHTML = SPK_ICON;
      lb.addEventListener('click', function () { speak(q.ans.w); });
      card.appendChild(lb); card.appendChild(el('div', 'label', '聽發音，選出是哪個詞'));
      if (quiz.picked === null && !q.spoken) { q.spoken = 1; setTimeout(function () { speak(q.ans.w); }, 250); }
    }
    host.appendChild(card);
    var grid = el('div', 'qopts');
    q.opts.forEach(function (o) {
      var b = el('button', 'qopt'); b.type = 'button';
      var showTh = !q.kind && quizType !== 'th2zh';
      b.textContent = showTh ? o.w : o.m; if (showTh) { b.lang = 'th'; b.classList.add('th'); }
      if (q.kind === 'tone') { b.innerHTML = toneSvg(o.w) + '<span></span>'; b.querySelector('span').textContent = o.m; b.classList.add('tone', 't-' + o.w); }
      if (quiz.picked !== null) {
        b.disabled = true;
        if (o.w === q.ans.w) { b.classList.add('ok'); } else if (o === quiz.picked) { b.classList.add('bad'); }
      }
      b.addEventListener('click', function () {
        if (quiz.picked !== null) { return; }
        quiz.picked = o;
        var ok = o.w === q.ans.w, c = q.c;
        if (ok) { quiz.right++; c.right = (c.right || 0) + 1; }
        else { quiz.wrong.push(q); srsInit(c); c.due = today0(); c.lapses++; c.ivl = 0; c.box = 1; }
        c.seen = (c.seen || 0) + 1; saveCards();
        if (q.kind) { speak(q.c.w); } else if (quizType !== 'listen') { speak(q.ans.w); }
        renderCards();
      });
      grid.appendChild(b);
    });
    host.appendChild(grid);
    if (quiz.picked !== null) {
      var fb = el('div', 'qfb ' + (quiz.picked.w === q.ans.w ? 'ok' : 'bad'));
      fb.textContent = quiz.picked.w === q.ans.w ? '答對了！' : '正確答案：';
      if (q.kind) { if (quiz.picked.w !== q.ans.w) { fb.appendChild(document.createTextNode(q.ans.m)); } var why = el('div', 'qwhy'); var wp = el('span', 'twp', q.info[q.k].p); wp.lang = 'th'; why.appendChild(wp); why.appendChild(document.createTextNode('：' + toneWhy(q.info[q.k], q.info[q.k - 1]))); fb.appendChild(why); }
      else if (quiz.picked.w !== q.ans.w) { var t2 = el('span', 'cw', q.ans.w); t2.lang = 'th'; fb.appendChild(t2); fb.appendChild(document.createTextNode('　' + q.ans.m)); }
      host.appendChild(fb);
      var nx = el('button', 'primary wide', quiz.k + 1 < quiz.qs.length ? '下一題' : '看成績'); nx.type = 'button';
      nx.addEventListener('click', function () { quiz.k++; quiz.picked = null; renderCards(); });
      var r2 = el('div', 'btns'); r2.appendChild(nx); host.appendChild(r2);
      setTimeout(function () { nx.focus(); }, 30);
    }
  }

  /* ---- 全部清單：精簡的列，點一下看詳解 ---- */
  function renderList(host) {
    var doc = docName();
    var bar = el('div', 'btns');
    var only = el('button', 'toggle', '只看目前文件'); only.type = 'button'; only.setAttribute('aria-pressed', String(cardsOnlyDoc));
    only.addEventListener('click', function () { cardsOnlyDoc = !cardsOnlyDoc; renderCards(); });
    var copy = el('button', '', '複製成 Anki 格式'); copy.type = 'button';
    copy.addEventListener('click', function () { copyAnki(); });
    bar.appendChild(only); bar.appendChild(copy);
    host.appendChild(bar);
    var ta = el('textarea', 'ankibox'); ta.id = 'ankibox'; ta.readOnly = true; ta.hidden = true; ta.setAttribute('aria-label', 'Anki 格式內容');
    host.appendChild(ta);
    var list = cards.filter(function (c) { return inFolder(c) && (!cardsOnlyDoc || c.src === doc); });
    if (!list.length) { host.appendChild(el('p', 'label', cardsOnlyDoc ? '這個資料夾裡沒有這份文件的生字卡。' : '這個資料夾還沒有生字卡。')); return; }
    var ul = el('ul', 'clist2');
    list.forEach(function (c) {
      srsInit(c);
      var li = el('li');
      var b = el('button', 'crow'); b.type = 'button'; b.setAttribute('aria-label', c.w + '，' + cardMeaning(c) + '，點一下看詳解');
      var l = el('span', 'crow-l');
      var w = el('span', 'cw', c.w); w.lang = 'th'; l.appendChild(w);
      if (showRom && c.rom) { l.appendChild(el('span', 'crom', c.rom)); }
      l.appendChild(el('span', 'cm', cardMeaning(c) || '（字典沒有）'));
      b.appendChild(l);
      var r = el('span', 'crow-r');
      var dots = el('span', 'cdots'); dots.setAttribute('aria-hidden', 'true');
      for (var k = 1; k <= 5; k++) { dots.appendChild(el('i', k <= c.box ? 'on' : '')); }
      r.appendChild(dots);
      r.appendChild(el('span', 'cdue', c.due <= today0() ? '今天複習' : ivlText(Math.round((c.due - today0()) / DAY)) + '後'));
      r.appendChild(el('span', 'chev', '›'));
      b.appendChild(r);
      b.addEventListener('click', function () { openCardDetail(c.id); });
      li.appendChild(b); ul.appendChild(li);
    });
    host.appendChild(ul);
  }

  /* ---- 單字詳解（跳出的卡片） ---- */
  var SPK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var EX = null, exLoading = null;
  function loadExamples() {
    if (EX) { return Promise.resolve(EX); }
    if (exLoading) { return exLoading; }
    exLoading = fetch(EX_URL).then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.json(); }).then(function (d) { EX = d; return d; }, function (e) { exLoading = null; throw e; });
    return exLoading;
  }
  var cdWrap = document.createElement('div'); cdWrap.className = 'cdlayer'; cdWrap.id = 'cardDetail'; cdWrap.hidden = true;
  cdWrap.innerHTML = '<div class="cdback" id="cdBack"></div><div class="cdsheet" role="dialog" aria-modal="true" aria-labelledby="cdWord"><button type="button" class="cdx" id="cdClose" aria-label="關閉">×</button><div class="cdscroll" id="cdBody"></div></div>';
  document.body.appendChild(cdWrap);
  function closeCardDetail() { cdWrap.hidden = true; document.body.classList.remove('cdopen'); renderCards(); }
  $('cdClose').addEventListener('click', closeCardDetail);
  $('cdBack').addEventListener('click', closeCardDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !cdWrap.hidden) { closeCardDetail(); } });
  function markWord(p, s, w) {
    var i = s.indexOf(w);
    if (i < 0) { p.textContent = s; return; }
    p.appendChild(document.createTextNode(s.slice(0, i)));
    p.appendChild(el('mark', 'cwmark', w));
    p.appendChild(document.createTextNode(s.slice(i + w.length)));
  }
  function exampleRow(th, en, w, srcLabel) {
    var box = el('div', 'cdex');
    var line = el('div', 'cdex-th');
    var p = el('p'); p.lang = 'th'; markWord(p, th, w); line.appendChild(p);
    var s = el('button', 'iconbtn csay small'); s.type = 'button'; s.setAttribute('aria-label', '朗讀這句'); s.innerHTML = SPK_ICON;
    s.addEventListener('click', function () { speak(th); });
    line.appendChild(s);
    box.appendChild(line);
    if (en) { var e = el('div', 'cdex-en', en); e.lang = 'en'; box.appendChild(e); }
    var foot = el('div', 'cdex-foot');
    if (srcLabel) { foot.appendChild(el('span', 'cdex-src', srcLabel)); }
    var zb = el('button', 'linkbtn', '看中文翻譯'); zb.type = 'button';
    zb.addEventListener('click', function () { var row = mtRow(th, '中文'); zb.replaceWith(row); });
    foot.appendChild(zb);
    box.appendChild(foot);
    return box;
  }
  function openCardDetail(id) {
    var c = cards.filter(function (x) { return x.id === id; })[0];
    if (!c) { return; }
    srsInit(c);
    var body = $('cdBody'); body.replaceChildren();
    var head = el('div', 'cdhead');
    var w = el('h2', 'cdword', c.w); w.id = 'cdWord'; w.lang = 'th'; head.appendChild(w);
    var say = el('button', 'iconbtn csay'); say.type = 'button'; say.setAttribute('aria-label', '朗讀'); say.innerHTML = SPK_ICON;
    say.addEventListener('click', function () { speak(c.w); });
    head.appendChild(say);
    body.appendChild(head);
    var g = glossSnapshot(c.w);
    if (g.rom || c.rom) { body.appendChild(el('div', 'cdrom', (g.rom || c.rom) + (DICT && DICT[c.w] && DICT[c.w][0][2] ? '　' + DICT[c.w][0][2] : ''))); }
    /* 詞義：字典裡所有詞性 */
    var sec = el('section', 'cdsec'); sec.appendChild(el('h3', '', '意思'));
    var es = DICT && (DICT[c.w] || (typeof dictBase === 'function' && dictBase(c.w) && DICT[dictBase(c.w)]));
    if (es && es.length) {
      es.forEach(function (e) {
        var blk = el('div', 'cdpos');
        blk.appendChild(el('span', 'cdpos-l', (typeof POS_ZH !== 'undefined' && POS_ZH[e[0]]) || e[0]));
        var zh = (e[4] || []).filter(Boolean), en = (e[3] || []).filter(Boolean);
        var ol = el('ol', 'cdsenses');
        var n = Math.max(zh.length, glossLang === 'zh' && zh.length ? 0 : en.length);
        for (var k = 0; k < Math.max(zh.length, en.length); k++) {
          var li = el('li');
          if (glossLang !== 'en' && zh[k]) { li.appendChild(el('span', 'cdzh', zh[k])); }
          if ((glossLang !== 'zh' || !zh[k]) && en[k]) { var ee = el('span', 'cden', en[k]); ee.lang = 'en'; li.appendChild(ee); }
          if (li.childNodes.length) { ol.appendChild(li); }
        }
        blk.appendChild(ol);
        sec.appendChild(blk);
      });
    } else { sec.appendChild(el('p', 'label', cardMeaning(c) || '字典裡沒有這個詞。')); }
    var cmp = typeof buildComposeRow === 'function' ? buildComposeRow(c.w) : null;
    if (cmp) { sec.appendChild(cmp); }
    body.appendChild(sec);
    if (toneMode) { var tsx = el('section', 'cdsec'); tsx.appendChild(buildToneSection(c.w)); body.appendChild(tsx); }
    /* 我的筆記 */
    var ms = el('section', 'cdsec'); ms.appendChild(el('h3', '', '我的筆記'));
    var my = el('textarea', 'cdmy'); my.value = c.my || ''; my.placeholder = '自己的意思、記法、聯想（可不填）'; my.rows = 2; my.setAttribute('aria-label', c.w + ' 的筆記');
    my.addEventListener('change', function () { c.my = my.value.trim(); saveCards(); });
    ms.appendChild(my); body.appendChild(ms);
    /* 例句：原文、目前文件裡的其他句子、生活化例句 */
    var xs = el('section', 'cdsec'); xs.appendChild(el('h3', '', '例句'));
    if (c.sent) { xs.appendChild(exampleRow(c.sent, '', c.w, '出處：' + srcText(c))); }
    if (state.text && state.src && c.src === docName()) {
      var more = 0, from = 0, seenS = {}; seenS[c.sent] = 1;
      while (more < 2) {
        var i = state.text.indexOf(c.w, from); if (i < 0) { break; }
        var sr = sentenceAround(i), st = state.text.slice(sr[0], sr[1]).replace(/\s+/g, ' ').trim().slice(0, 220);
        from = i + c.w.length;
        if (!seenS[st] && st.length > c.w.length + 3) { seenS[st] = 1; xs.appendChild(exampleRow(st, '', c.w, '這份文件')); more++; }
      }
    }
    var life = el('div', 'cdlife'); life.appendChild(el('h4', '', '生活化例句'));
    var lifeBody = el('div', 'cdlife-b', '載入中…'); life.appendChild(lifeBody);
    xs.appendChild(life);
    body.appendChild(xs);
    loadExamples().then(function (d) {
      lifeBody.replaceChildren();
      var key = d.w[c.w] ? c.w : (typeof dictBase === 'function' && dictBase(c.w) && d.w[dictBase(c.w)] ? dictBase(c.w) : null);
      if (!key) { lifeBody.appendChild(el('p', 'label', '例句庫裡還沒有這個詞的句子。')); return; }
      d.w[key].forEach(function (k) { var s = d.s[k]; if (s) { lifeBody.appendChild(exampleRow(s[0], s[1], key, '')); } });
      lifeBody.appendChild(el('div', 'credit', '例句：scb-mt-en-th-2020（CC BY-SA 4.0，VISTEC 與 SCB）；中文為機器翻譯，需要網路。'));
    }, function () { lifeBody.textContent = '例句庫載入失敗（可能沒有網路），連上網路後再打開一次。'; });
    /* 學習狀況與管理 */
    var st2 = el('section', 'cdsec cdmeta'); st2.appendChild(el('h3', '', '學習狀況'));
    st2.appendChild(el('p', '', '熟悉度 ' + c.box + ' / 5・' + (c.due <= today0() ? '今天要複習' : '下次複習：' + ivlText(Math.round((c.due - today0()) / DAY)) + '後') + '・答對 ' + (c.right || 0) + ' / ' + (c.seen || 0) + ' 次'));
    st2.appendChild(el('p', 'label', '加入：' + new Date(c.added || Date.now()).toLocaleDateString('zh-TW') + '・' + srcText(c)));
    var row = el('div', 'btns');
    var mv = el('select', 'cmove'); mv.setAttribute('aria-label', '移到資料夾');
    [['', '未分類']].concat(folders.map(function (f) { return [f.id, f.name]; })).forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; if ((c.folder || '') === o[0]) { op.selected = true; } mv.appendChild(op); });
    mv.addEventListener('change', function () { c.folder = mv.value; saveCards(); });
    var rs = el('button', '', '今天再複習'); rs.type = 'button';
    rs.addEventListener('click', function () { c.due = today0(); saveCards(); rs.textContent = '已排進今天'; });
    var del = el('button', 'cdel', '刪除'); del.type = 'button';
    del.addEventListener('click', function () {
      if (del.getAttribute('data-sure') !== '1') { del.setAttribute('data-sure', '1'); del.textContent = '再按一次刪除'; return; }
      removeCard(c.id); closeCardDetail();
    });
    row.appendChild(mv); row.appendChild(rs); row.appendChild(del);
    st2.appendChild(row);
    body.appendChild(st2);
    cdWrap.hidden = false; document.body.classList.add('cdopen');
    body.scrollTop = 0;
    setTimeout(function () { $('cdClose').focus(); }, 30);
  }

  /* ---- 生字卡頁：三個分頁 ---- */
  function renderCards() {
    var host = $('cardbody');
    host.replaceChildren();
    renderFolders();
    var n = dueCards().length;
    segButtons($('cardTabs'), [['review', '複習' + (n ? '（' + n + '）' : '')], ['quiz', '測驗'], ['list', '全部（' + cards.filter(inFolder).length + '）']], cardTab, function (v) { cardTab = v; if (v !== 'quiz') { quiz = null; } renderCards(); });
    if (cardTab === 'review') { renderReview(host); } else if (cardTab === 'quiz') { renderQuiz(host); } else { renderList(host); }
    updateCardButton();
  }
