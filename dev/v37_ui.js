  /* ====== 1.31：歡迎流程（一頁一題：歡迎、怎麼用、程度）。目標／地圖／魔王關已移除，改成「成就」分頁 ====== */
  var LV4 = ['a', 'b', 'c', 'd'], LV4_NAME = { a: '入門', b: '初級', c: '中級', d: '高級' };
  var LV4_DESC = {
    a: '認得字母和一些單字',
    b: '會簡單基本句子',
    c: '能稍微讀懂 YT、IG 貼文和一些短文，但卡在一些句型',
    d: '能讀懂生活大部分內容，但正式書面用法有困難'
  };
  function L2(zh, en) { return UI_LANG === 'en' ? en : zh; }
  function lv4() { return level === 'all' ? 'd' : (LV4.indexOf(level) >= 0 ? level : 'b'); }

  function knownCount() { return cards.filter(function (c) { srsInit(c); return c.fs && c.fs.s >= 21; }).length; }

  /* ====== 歡迎流程：一頁一題 ====== */
  var LQ = [
    ['a', 'น้ำ', ['水', 'water'], [['火', 'fire'], ['飯', 'rice'], ['茶', 'tea']]],
    ['a', 'กิน', ['吃', 'to eat'], [['喝', 'to drink'], ['睡', 'to sleep'], ['走', 'to walk']]],
    ['a', 'บ้าน', ['家；房子', 'house; home'], [['學校', 'school'], ['車子', 'car'], ['市場', 'market']]],
    ['a', 'เพื่อน', ['朋友', 'friend'], [['老師', 'teacher'], ['媽媽', 'mother'], ['醫生', 'doctor']]],
    ['a', 'ใหญ่', ['大', 'big'], [['小', 'small'], ['長', 'long'], ['新', 'new']]],
    ['b', 'ตลาด', ['市場', 'market'], [['醫院', 'hospital'], ['車站', 'station'], ['銀行', 'bank']]],
    ['b', 'ราคา', ['價格', 'price'], [['重量', 'weight'], ['時間', 'time'], ['地址', 'address']]],
    ['b', 'ปวด', ['痛', 'to ache'], [['累', 'tired'], ['餓', 'hungry'], ['冷', 'cold']]],
    ['b', 'เปลี่ยน', ['改變；更換', 'to change'], [['等待', 'to wait'], ['忘記', 'to forget'], ['借', 'to borrow']]],
    ['b', 'เดินทาง', ['旅行；出遠門', 'to travel'], [['休息', 'to rest'], ['工作', 'to work'], ['打掃', 'to clean']]],
    ['c', 'เศรษฐกิจ', ['經濟', 'economy'], [['政治', 'politics'], ['教育', 'education'], ['文化', 'culture']]],
    ['c', 'สิ่งแวดล้อม', ['環境', 'environment'], [['娛樂', 'entertainment'], ['職業', 'occupation'], ['建築', 'architecture']]],
    ['c', 'ประสบการณ์', ['經驗', 'experience'], [['知識', 'knowledge'], ['記憶', 'memory'], ['意見', 'opinion']]],
    ['c', 'ความรับผิดชอบ', ['責任', 'responsibility'], [['自由', 'freedom'], ['權利', 'rights'], ['友誼', 'friendship']]],
    ['c', 'ผลกระทบ', ['影響；衝擊', 'impact'], [['原因', 'cause'], ['計畫', 'plan'], ['報告', 'report']]],
    ['d', 'อนุมัติ', ['批准', 'to approve'], [['拒絕', 'to refuse'], ['調查', 'to investigate'], ['推遲', 'to postpone']]],
    ['d', 'มาตรการ', ['措施', 'measure'], [['標準', 'standard'], ['預算', 'budget'], ['證據', 'evidence']]],
    ['d', 'วิพากษ์วิจารณ์', ['批評', 'to criticize'], [['讚美', 'to praise'], ['解釋', 'to explain'], ['翻譯', 'to translate']]],
    ['d', 'ละเมิด', ['侵犯；違反', 'to violate'], [['保護', 'to protect'], ['繼承', 'to inherit'], ['尊重', 'to respect']]],
    ['d', 'แถลงการณ์', ['聲明', 'statement'], [['廣告', 'advertisement'], ['日記', 'diary'], ['劇本', 'script']]]
  ];
  var wz = null;
  function wizSteps() { return ['hi', 'how', 'level']; }
  function wizSetLevel(v) {
    level = v; try { localStorage.setItem('thai-level', v); } catch (err) {}
    rrMemo = {}; rrMemoN = 0;
    try { renderSettings(); renderReport(); } catch (err) {}
  }
  function wizOpen() {
    wz = { i: 0, quiz: null };
    welcomeFrom = document.activeElement;
    wizRender();
    $('welcome').hidden = false;
    var mc = $('welcome').querySelector('.mcard'); if (mc) { mc.scrollTop = 0; }
  }
  function wzOpt(title, sub, on, tag, onPick) {
    var b = el('button', 'wzopt' + (on ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(!!on));
    var t = el('span', 'wzot'); t.appendChild(el('b', '', title)); if (tag) { t.appendChild(el('em', 'wztag', tag)); } b.appendChild(t);
    if (sub) { b.appendChild(el('span', 'wzos', sub)); }
    b.addEventListener('click', onPick);
    return b;
  }
  function wzHead(text, sub) {
    var h = el('h2', 'wzh', text); h.id = 'h-welcome'; h.tabIndex = -1;
    var f = document.createDocumentFragment(); f.appendChild(h); if (sub) { f.appendChild(el('p', 'wnote', sub)); }
    return f;
  }
  var WZ_SVG = {
    paste: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5V3.5h5v1M9 10h6M9 14h6"/></svg>',
    tap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h8M4 17h13"/><rect x="11.5" y="9.5" width="7" height="5" rx="1.5"/></svg>',
    cards: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/></svg>'
  };
  function wizRender() {
    var steps = wizSteps(); if (wz.i >= steps.length) { wz.i = steps.length - 1; }
    var key = steps[wz.i], body = $('wzBody'); body.replaceChildren();
    var dots = $('wzDots'); dots.replaceChildren();
    steps.forEach(function (s, i) { dots.appendChild(el('span', 'wzdot' + (i === wz.i ? ' cur' : (i < wz.i ? ' on' : '')))); });
    dots.setAttribute('role', 'img'); dots.setAttribute('aria-label', '第 ' + (wz.i + 1) + ' / ' + steps.length + ' 步');
    var last = wz.i === steps.length - 1, lv = lv4();
    if (wz.quiz) { wizQuizRender(body); $('wzDots').hidden = true; return; }
    dots.hidden = false;
    if (key === 'hi') {
      body.appendChild(wzHead('歡迎來到 ไทย Reader！'));
      var bl = el('ul', 'wzbul');
      ['ไทย Reader 是讓讀泰文變輕鬆的 App', '點一個泰文詞，馬上看到意思和拼音', '存成生字卡，每天複習幾張就記得住', '接下來選一下你的泰文程度，讀物和句型會更適合你', '選項之後都能在設定裡改'].forEach(function (t) {
        var li = el('li', '', t); bl.appendChild(li);
      });
      body.appendChild(bl);
    } else if (key === 'how') {
      body.appendChild(wzHead('這樣學泰文'));
      var ul = el('ol', 'wzhow');
      [['paste', '加進一篇泰文', '貼上網址、匯入檔案，或從讀物庫挑一篇短文'], ['tap', '點一個不懂的詞', '馬上看到意思、拼音，還能聽發音'], ['cards', '存成生字卡複習', '每天複習幾張，慢慢就記住了']].forEach(function (x, i) {
        var li = el('li', 'wzstep'); var ic = el('span', 'wzic'); ic.innerHTML = WZ_SVG[x[0]]; li.appendChild(ic);
        var tx = el('span', 'wzstx'), tt = el('b', ''); tt.appendChild(el('span', 'wzn', String(i + 1))); tt.appendChild(el('span', '', x[1])); tx.appendChild(tt); tx.appendChild(el('span', '', x[2])); li.appendChild(tx); ul.appendChild(li);
      });
      body.appendChild(ul);
    } else if (key === 'level') {
      body.appendChild(wzHead('你的泰文程度？', '先選最接近的，不確定也沒關係，之後隨時能改。'));
      var grp = el('div', 'wzlist'); grp.setAttribute('role', 'radiogroup'); grp.setAttribute('aria-label', '你的泰文程度');
      LV4.forEach(function (v) {
        grp.appendChild(wzOpt(LV4_NAME[v], LV4_DESC[v], lv === v, '', function () { wizSetLevel(v); wizRender(); }));
      });
      body.appendChild(grp);
      var qb = el('button', 'linkbtn wzquiz', '不確定？做 1 分鐘小測驗'); qb.type = 'button';
      qb.addEventListener('click', function () { wz.quiz = { n: 0, tier: 1, hist: [], used: {}, cur: null, picked: -1 }; lqNext(); wizRender(); });
      body.appendChild(qb);
    }
    $('wBack').hidden = wz.i === 0;
    $('wSkip').hidden = last;
    $('wNext').hidden = last; $('wNext').textContent = key === 'hi' ? '開始' : '繼續';
    $('wDone').hidden = !last; $('wDone').textContent = '開始使用';
    var h = body.querySelector('.wzh'); if (h) { try { h.focus({ preventScroll: true }); } catch (err) {} }
    var mc = $('welcome').querySelector('.mcard'); if (mc) { mc.scrollTop = 0; }
  }
  /* 1 分鐘小測驗：看泰文詞選意思；答對就換難一點的，答錯或不知道就換簡單一點的 */
  function lqNext() {
    var Q = wz.quiz, tier = LV4[Q.tier], pool = LQ.map(function (x, i) { return i; }).filter(function (i) { return LQ[i][0] === tier && !Q.used[i]; });
    if (!pool.length) { pool = LQ.map(function (x, i) { return i; }).filter(function (i) { return !Q.used[i]; }); }
    var idx = pool[Math.floor(Math.random() * pool.length)]; Q.used[idx] = 1; Q.cur = idx; Q.picked = -1;
    var it = LQ[idx], opts = [[it[2], true]].concat(it[3].map(function (x) { return [x, false]; }));
    Q.opts = shuffle(opts); Q.asked = tier;
  }
  function lqAnswer(i) {
    var Q = wz.quiz, ok = i >= 0 && Q.opts[i][1];
    Q.picked = i; Q.hist.push([LV4.indexOf(Q.asked), ok]); Q.n++;
    Q.tier = Math.max(0, Math.min(3, Q.tier + (ok ? 1 : -1)));
    wizRender();
    setTimeout(function () { if (!wz || !wz.quiz || wz.quiz.picked !== i || wz.quiz.n !== Q.n) { return; } if (Q.n >= 10) { Q.done = true; } else { lqNext(); } wizRender(); }, 650);
  }
  function lqLevel(Q) {
    var h = Q.hist.slice(-6), s = 0; h.forEach(function (x) { s += x[0] + (x[1] ? 0.5 : -0.5); });
    return LV4[Math.max(0, Math.min(3, Math.round(s / h.length)))];
  }
  function wizQuizRender(body) {
    var Q = wz.quiz;
    $('wBack').hidden = false; $('wSkip').hidden = false; $('wNext').hidden = true; $('wDone').hidden = true;
    if (Q.done) {
      var lv = lqLevel(Q);
      body.appendChild(wzHead('小測驗結果', '看起來你大概是這個程度。這只是粗略的參考，覺得不準就自己選。'));
      body.appendChild(el('div', 'wzbig', LV4_NAME[lv]));
      var row = el('div', 'btns wzres');
      var use = el('button', 'primary', '用這個程度'); use.type = 'button'; use.addEventListener('click', function () { wizSetLevel(lv); wz.quiz = null; wizRender(); });
      var back = el('button', '', '回去自己選'); back.type = 'button'; back.addEventListener('click', function () { wz.quiz = null; wizRender(); });
      row.appendChild(use); row.appendChild(back); body.appendChild(row);
      setTimeout(function () { use.focus(); }, 30);
      return;
    }
    var it = LQ[Q.cur];
    body.appendChild(wzHead('小測驗', '這個泰文詞是什麼意思？不知道就選「不知道」，不要猜。'));
    body.appendChild(el('p', 'qprog', '第 ' + (Q.picked !== -1 ? Q.n : Q.n + 1) + ' / 10 題'));
    var w = el('div', 'wzword', it[1]); w.lang = 'th'; body.appendChild(w);
    var opts = el('div', 'qopts');
    Q.opts.forEach(function (o, i) {
      var b = el('button', 'qopt', L2(o[0][0], o[0][1])); b.type = 'button';
      if (Q.picked !== -1) { b.disabled = true; if (o[1]) { b.classList.add('ok'); } else if (i === Q.picked) { b.classList.add('bad'); } }
      b.addEventListener('click', function () { if (Q.picked === -1) { lqAnswer(i); } });
      opts.appendChild(b);
    });
    body.appendChild(opts);
    var dk = el('button', 'linkbtn wzdk', '不知道'); dk.type = 'button'; dk.disabled = Q.picked !== -1; dk.addEventListener('click', function () { if (Q.picked === -1) { lqAnswer(-2); } });
    body.appendChild(dk);
  }
  $('wNext').addEventListener('click', function () { wz.i++; wizRender(); });
  $('wBack').addEventListener('click', function () { if (wz.quiz) { wz.quiz = null; wizRender(); return; } if (wz.i > 0) { wz.i--; wizRender(); } });
  $('wSkip').addEventListener('click', function () { closeWelcome(); });
  $('wDone').addEventListener('click', function () {
    if (!wz) { return; }
    wz = null;
    var firstTone = lv4() === 'a' && localStorage.getItem(TONE_KEY) === null;
    if (firstTone) { toneMode = true; try { localStorage.setItem(TONE_KEY, '1'); } catch (err) {} loadTones().catch(function () {}); if (typeof renderToneSetting === 'function') { renderToneSetting(); } }
    closeWelcome();
    renderHome();
  });
  renderWelcome = function () { if (wz && !$('welcome').hidden) { wizRender(); } };
  openWelcome = function () { wizOpen(); };
  /* 「略過」「Esc」關掉時，不管走到哪一步，之前選的程度已經存了；目標沒選完就不存 */
  var _closeWelcome0 = closeWelcome;
  closeWelcome = function () { wz = null; return _closeWelcome0.apply(this, arguments); };
  $('welcome').setAttribute('aria-labelledby', 'h-welcome');
