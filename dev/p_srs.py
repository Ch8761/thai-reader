p='srs_ui.js'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:70]; s=s.replace(a,b)
rep("""  function startQuiz() {
    var list = shuffle(cards.filter(function (c) { return inFolder(c) && cardMeaning(c); })).slice(0, 10);
    if (!list.length) { return; }
    quiz = { qs: list.map(function (c) { return makeQ(c); }), k: 0, right: 0, picked: null, wrong: [] };
    renderCards();
  }""","""  function startQuiz() {
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
  }""")
rep("""      segButtons(seg, [['th2zh', '看泰文選意思'], ['zh2th', '看意思選泰文'], ['listen', '聽發音選泰文']], quizType, function (v) { quizType = v; renderCards(); });""",
"""      var QT = [['th2zh', '看泰文選意思'], ['zh2th', '看意思選泰文'], ['listen', '聽發音選泰文']];
      if (toneMode) { QT.push(['tone', '聲調與子音']); } else if (quizType === 'tone') { quizType = 'th2zh'; }
      segButtons(seg, QT, quizType, function (v) { quizType = v; renderCards(); });
      if (toneMode) { host.appendChild(el('p', 'label', '聲調學習模式開著：其他題型裡也會穿插聲調題。')); }""")
rep("""    var card = el('div', 'fcard qcard');
    if (quizType === 'th2zh') {""","""    var card = el('div', 'fcard qcard');
    if (q.kind) {
      var wl = el('div', 'cword tq'); wl.lang = 'th';
      q.info.forEach(function (o, i) { var sp = el('span', i === q.k ? 'tqhl' : '', o.p); wl.appendChild(sp); });
      card.appendChild(wl);
      var sy = el('button', 'iconbtn csay'); sy.type = 'button'; sy.setAttribute('aria-label', '朗讀 ' + q.c.w); sy.innerHTML = SPK_ICON;
      sy.addEventListener('click', function () { speak(q.c.w); });
      card.appendChild(sy);
      card.appendChild(el('div', 'qprompt small', q.kind === 'tone' ? '標起來的音節「' + q.info[q.k].p + '」唸什麼聲調？' : '「' + q.info[q.k].i + '」是哪一類子音？'));
    } else if (quizType === 'th2zh') {""")
rep("""      var showTh = quizType !== 'th2zh';
      b.textContent = showTh ? o.w : o.m; if (showTh) { b.lang = 'th'; b.classList.add('th'); }""","""      var showTh = !q.kind && quizType !== 'th2zh';
      b.textContent = showTh ? o.w : o.m; if (showTh) { b.lang = 'th'; b.classList.add('th'); }
      if (q.kind === 'tone') { b.innerHTML = toneSvg(o.w) + '<span></span>'; b.querySelector('span').textContent = o.m; b.classList.add('tone', 't-' + o.w); }""")
rep("""        if (quizType !== 'listen') { speak(q.ans.w); }""","""        if (q.kind) { speak(q.c.w); } else if (quizType !== 'listen') { speak(q.ans.w); }""")
rep("""      if (quiz.picked.w !== q.ans.w) { var t2 = el('span', 'cw', q.ans.w); t2.lang = 'th'; fb.appendChild(t2); fb.appendChild(document.createTextNode('　' + q.ans.m)); }
      host.appendChild(fb);""","""      if (q.kind) { if (quiz.picked.w !== q.ans.w) { fb.appendChild(document.createTextNode(q.ans.m)); } var why = el('div', 'qwhy'); var wp = el('span', 'twp', q.info[q.k].p); wp.lang = 'th'; why.appendChild(wp); why.appendChild(document.createTextNode('：' + toneWhy(q.info[q.k], q.info[q.k - 1]))); fb.appendChild(why); }
      else if (quiz.picked.w !== q.ans.w) { var t2 = el('span', 'cw', q.ans.w); t2.lang = 'th'; fb.appendChild(t2); fb.appendChild(document.createTextNode('　' + q.ans.m)); }
      host.appendChild(fb);""")
rep("""        quiz.wrong.forEach(function (q) { var li = el('li'); var t = el('span', 'cw', q.ans.w); t.lang = 'th'; li.appendChild(t); li.appendChild(el('span', 'cm', q.ans.m)); ul.appendChild(li); });""",
"""        quiz.wrong.forEach(function (q) { var li = el('li'); var t = el('span', 'cw', q.kind ? q.c.w : q.ans.w); t.lang = 'th'; li.appendChild(t); li.appendChild(el('span', 'cm', q.kind ? q.info[q.k].p + '：' + q.ans.m : q.ans.m)); ul.appendChild(li); });""")
# fix th2zh answer feedback keyed by o.w - for tone kind, options compare by w; fine
# review back + detail: tone section
rep("""      if (c.my) { back.appendChild(el('div', 'cmy', '我的筆記：' + c.my)); }""","""      if (c.my) { back.appendChild(el('div', 'cmy', '我的筆記：' + c.my)); }
      if (toneMode) { back.appendChild(buildToneSection(c.w)); }""")
rep("""    body.appendChild(sec);
    /* 我的筆記 */""","""    body.appendChild(sec);
    if (toneMode) { var tsx = el('section', 'cdsec'); tsx.appendChild(buildToneSection(c.w)); body.appendChild(tsx); }
    /* 我的筆記 */""")
open(p,'w',encoding='utf-8').write(s)
print('ok')
