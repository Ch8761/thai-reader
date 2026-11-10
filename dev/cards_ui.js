  /* ---------- 生字卡：加入、翻卡複習（萊特納盒子法）、清單、複製成 Anki 格式 ---------- */
  var CARD_KEY = 'thai-cards-v1', DAY = 86400000;
  var BOX_DAYS = [0, 1, 3, 7, 14, 30];   /* 第 1–5 盒，會了就往後一盒，隔越久才再出現 */
  var cards = [], folders = [], cardFolder = 'all', cardTab = 'review', review = null, cardsOnlyDoc = false, folderEdit = null;
  function loadCards() {
    try {
      var rawC = localStorage.getItem(CARD_KEY);
      var o = rawC ? JSON.parse(rawC) : {};
      cards = o.cards || []; folders = o.folders || []; cardFolder = o.cur || 'all';
      if (cardFolder !== 'all' && cardFolder !== 'none' && !folders.some(function (f) { return f.id === cardFolder; })) { cardFolder = 'all'; }
    } catch (err) { cards = []; folders = []; cardFolder = 'all'; }
  }
  loadCards();
  function saveCards() { try { localStorage.setItem(CARD_KEY, JSON.stringify({ cards: cards, folders: folders, cur: cardFolder })); } catch (err) {} updateCardButton(); renderReport(); }
  /* 資料夾：'all' 全部、'none' 未分類，其他是自己建立的資料夾 id */
  function folderName(id) { if (!id) { return '未分類'; } var f = folders.filter(function (x) { return x.id === id; })[0]; return f ? f.name : '未分類'; }
  function inFolder(c) { return cardFolder === 'all' || (cardFolder === 'none' ? !c.folder : c.folder === cardFolder); }
  function addTarget() { return (cardFolder === 'all' || cardFolder === 'none') ? '' : cardFolder; }
  function today0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function cardOf(w) { for (var i = 0; i < cards.length; i++) { if (cards[i].w === w) { return cards[i]; } } return null; }
  function docName() { return state.src && state.src.name ? state.src.name : '貼上的文字'; }
  function pageOfIndex(i) {
    if (!pdf) { return 0; }
    for (var k = 0; k < pdf.pages.length; k++) { if (i >= pdf.pages[k].range[0] && i <= pdf.pages[k].range[1]) { return pdf.pages[k].n; } }
    return 0;
  }
  function glossSnapshot(w) {
    var list = DICT && DICT[w], zh = [], en = [], rom = '', pos = '';
    (list || []).forEach(function (e) {
      if (!rom && e[1]) { rom = e[1]; }
      if (!pos) { pos = POS_ZH[e[0]] || e[0] || ''; }
      (e[4] || []).forEach(function (z) { if (z && zh.indexOf(z) === -1 && zh.length < 3) { zh.push(z); } });
      (e[3] || []).forEach(function (g) { if (en.length < 3) { en.push(g); } });
    });
    return { zh: zh.join('；'), en: en.join('; '), rom: rom, pos: pos };
  }
  function addCard(seg) {
    if (cardOf(seg.t)) { return cardOf(seg.t); }
    var sr = sentenceAround(seg.i), g = glossSnapshot(seg.t);
    var c = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      w: seg.t, rom: g.rom, pos: g.pos, zh: g.zh, en: g.en,
      sent: state.text.slice(sr[0], sr[1]).replace(/\s+/g, ' ').trim().slice(0, 220),
      src: docName(), page: pageOfIndex(seg.i),
      added: Date.now(), box: 1, due: today0(), seen: 0, right: 0, folder: addTarget()
    };
    cards.unshift(c);
    saveCards();
    return c;
  }
  function removeCard(id) { cards = cards.filter(function (c) { return c.id !== id; }); saveCards(); }
  function dueCards(all) { var t = today0(); return cards.filter(function (c) { return c.due <= t && (all || inFolder(c)); }); }
  function updateCardButton() {
    var n = dueCards(true).length;
    $('openCards').textContent = '生字卡' + (cards.length ? '（' + cards.length + (n ? '，' + n + ' 張要複習' : '') + '）' : '');
  }
  /* 查詞視窗裡的「加入生字卡」按鈕 */
  function cardButton(seg) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cardbtn';
    function paint() {
      var has = !!cardOf(seg.t);
      b.textContent = has ? '✓ 已在生字卡' : '＋ 生字卡';
      b.setAttribute('aria-pressed', String(has));
      b.title = has ? '再按一次可以從生字卡移除' : '把這個詞和這一句存成生字卡';
    }
    b.addEventListener('click', function () {
      var c = cardOf(seg.t);
      if (c) { removeCard(c.id); $('info').textContent = '已從生字卡移除「' + seg.t + '」。'; }
      else { addCard(seg); $('info').textContent = '已加入生字卡：「' + seg.t + '」（' + folderName(addTarget()) + '），到下方「生字卡」分頁複習。'; }
      paint();
    });
    paint();
    return b;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function sentenceNode(c) {
    var p = el('p', 'csent'); p.lang = 'th';
    var i = c.sent.indexOf(c.w);
    if (i < 0) { p.textContent = c.sent; return p; }
    p.appendChild(document.createTextNode(c.sent.slice(0, i)));
    p.appendChild(el('strong', '', c.w));
    p.appendChild(document.createTextNode(c.sent.slice(i + c.w.length)));
    return p;
  }
  function meaningNodes(c, host) {
    var g = glossSnapshot(c.w), zh = g.zh || c.zh, en = g.en || c.en;
    if (c.my) { host.appendChild(el('div', 'cmean cmy', c.my)); }
    var showZh = glossLang !== 'en' && zh, showEn = glossLang === 'en' || glossLang === 'both' || !zh;
    if (showZh) { host.appendChild(el('div', 'cmean', zh)); }
    if (showEn && en) { var e = el('div', showZh ? 'cmean-en' : 'cmean', en); e.lang = 'en'; host.appendChild(e); }
    if (!zh && !en && !c.my) { host.appendChild(el('div', 'cmean-en', '內建字典沒有這個詞的意思。可以到「全部清單」在這張卡寫上自己查到的意思。')); }
  }
  function srcText(c) { return c.src + (c.page ? '・第 ' + c.page + ' 頁' : ''); }
  function startReview(all) {
    var list = all ? cards.filter(inFolder) : dueCards();
    list.sort(function (a, b) { return a.box - b.box || a.due - b.due; });
    review = { queue: list.map(function (c) { return c.id; }), done: 0, total: list.length, flipped: false, again: {} };
    renderCards();
  }
  function answer(ok) {
    var id = review.queue.shift(), c = cards.filter(function (x) { return x.id === id; })[0];
    if (c) {
      c.seen++;
      if (ok) {
        if (!review.again[id]) { c.right++; }
        c.box = Math.min(5, c.box + 1);
        c.due = today0() + BOX_DAYS[c.box] * DAY;
        review.done++;
      } else {
        c.box = 1; c.due = today0();
        review.again[id] = 1;
        review.queue.push(id);   /* 不會的卡，這一輪最後再出現一次 */
      }
      saveCards();
    }
    review.flipped = false;
    renderCards();
  }
  function renderReview(host) {
    if (!review || !review.queue.length) {
      var n = dueCards().length;
      if (review && review.total) { host.appendChild(el('p', 'cdone', '這一輪完成了：' + review.total + ' 張。')); }
      var fc = cards.filter(inFolder).length;
      host.appendChild(el('p', 'label', fc ? (n ? '有 ' + n + ' 張卡片今天要複習。' : '今天要複習的卡片都完成了。會了的卡片會隔 1、3、7、14、30 天再出現。') : '還沒有生字卡。在查詞視窗按「＋ 生字卡」就能加入。'));
      var row = el('div', 'btns');
      if (n) { var go = el('button', 'primary', '開始複習（' + n + ' 張）'); go.type = 'button'; go.addEventListener('click', function () { startReview(false); }); row.appendChild(go); }
      if (fc) { var all = el('button', '', '全部練習一次'); all.type = 'button'; all.addEventListener('click', function () { startReview(true); }); row.appendChild(all); }
      host.appendChild(row);
      review = null;
      return;
    }
    var id = review.queue[0], c = cards.filter(function (x) { return x.id === id; })[0];
    if (!c) { review.queue.shift(); renderReview(host); return; }
    host.appendChild(el('div', 'label', '第 ' + (review.done + 1) + ' / ' + review.total + ' 張' + (review.again[id] ? '（再試一次）' : '') + '・熟悉度 ' + c.box + ' / 5'));
    var card = el('div', 'fcard');
    var w = el('div', 'cword', c.w); w.lang = 'th';
    card.appendChild(w);
    card.appendChild(sentenceNode(c));
    var say = el('button', '', '朗讀'); say.type = 'button';
    say.addEventListener('click', function () { speak(c.w); });
    var saySent = el('button', '', '朗讀這句'); saySent.type = 'button';
    saySent.addEventListener('click', function () { speak(c.sent); });
    var r1 = el('div', 'btns'); r1.appendChild(say); r1.appendChild(saySent);
    card.appendChild(r1);
    if (review.flipped) {
      var back = el('div', 'cback');
      if (showRom && c.rom) { back.appendChild(el('div', 'crom', c.rom + (c.pos ? '・' + c.pos : ''))); }
      else if (c.pos) { back.appendChild(el('div', 'crom', c.pos)); }
      meaningNodes(c, back);
      back.appendChild(el('div', 'csrc', '出處：' + srcText(c)));
      card.appendChild(back);
    }
    host.appendChild(card);
    var row = el('div', 'btns cans');
    if (!review.flipped) {
      var flip = el('button', 'primary', '看答案'); flip.type = 'button';
      flip.addEventListener('click', function () { review.flipped = true; renderCards(); setTimeout(function () { var k = document.querySelector('.cans .primary'); if (k) { k.focus(); } }, 20); });
      row.appendChild(flip);
    } else {
      var no = el('button', 'cno', '不會'); no.type = 'button'; no.addEventListener('click', function () { answer(false); });
      var yes = el('button', 'primary', '會了'); yes.type = 'button'; yes.addEventListener('click', function () { answer(true); });
      row.appendChild(no); row.appendChild(yes);
    }
    host.appendChild(row);
  }
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
    var ul = el('ul', 'clist');
    list.forEach(function (c) {
      var li = el('li');
      var top = el('div', 'ctop');
      var w = el('span', 'cw', c.w); w.lang = 'th';
      top.appendChild(w);
      if (showRom && c.rom) { top.appendChild(el('span', 'crom', c.rom)); }
      top.appendChild(el('span', 'cbox', '熟悉度 ' + c.box + ' / 5'));
      li.appendChild(top);
      var g = glossSnapshot(c.w), mean = (glossLang !== 'en' && (g.zh || c.zh)) || g.en || c.en || '（字典沒有）';
      li.appendChild(el('div', 'cm', mean));
      li.appendChild(el('div', 'csrc', srcText(c)));
      var my = el('input', 'cmyin'); my.type = 'text'; my.value = c.my || ''; my.placeholder = '我的意思或筆記（可不填）';
      my.setAttribute('aria-label', c.w + ' 的自訂意思');
      my.addEventListener('change', function () { c.my = my.value.trim(); saveCards(); });
      li.appendChild(my);
      var mv = el('select', 'cmove'); mv.setAttribute('aria-label', '把 ' + c.w + ' 移到資料夾');
      [['', '未分類']].concat(folders.map(function (f) { return [f.id, f.name]; })).forEach(function (o) {
        var op = el('option', '', o[1]); op.value = o[0]; if ((c.folder || '') === o[0]) { op.selected = true; } mv.appendChild(op);
      });
      mv.addEventListener('change', function () { c.folder = mv.value; saveCards(); renderCards(); });
      li.appendChild(mv);
      var del = el('button', 'cdel', '刪除'); del.type = 'button'; del.setAttribute('aria-label', '刪除 ' + c.w);
      del.addEventListener('click', function () { removeCard(c.id); renderCards(); });
      li.appendChild(del);
      ul.appendChild(li);
    });
    host.appendChild(ul);
  }
  function ankiText() {
    return cards.map(function (c) {
      var g = glossSnapshot(c.w);
      var back = [c.rom, c.my, g.zh || c.zh, g.en || c.en].filter(Boolean).join('<br>');
      var front = c.w + '<br><small>' + c.sent.replace(/\t/g, ' ') + '</small>';
      var tag = '泰文::' + folderName(c.folder).replace(/\s+/g, '_');
      return [front, back, srcText(c), tag].map(function (x) { return String(x).replace(/[\t\n]/g, ' '); }).join('\t');
    }).join('\n');
  }
  function copyAnki() {
    var txt = ankiText(), ta = $('ankibox');
    function fallback() {
      ta.hidden = false; ta.value = txt; ta.focus(); ta.select();
      $('cardmsg').textContent = '這裡不能直接複製，已經把內容放在下面的框裡並全選，請長按後選「拷貝」。';
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () {
          $('cardmsg').textContent = '已複製 ' + cards.length + ' 張卡片。到 Anki 選「匯入檔案」貼成 .txt，欄位用 Tab 分隔、允許 HTML；第 4 欄是資料夾標籤。';
        }, fallback);
      } else { fallback(); }
    } catch (err) { fallback(); }
  }
  function renderFolders() {
    var host = $('cardFolders');
    host.replaceChildren();
    var opts = [['all', '全部（' + cards.length + '）'], ['none', '未分類（' + cards.filter(function (c) { return !c.folder; }).length + '）']]
      .concat(folders.map(function (f) { return [f.id, f.name + '（' + cards.filter(function (c) { return c.folder === f.id; }).length + '）']; }));
    var seg = el('div', 'seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', '資料夾');
    host.appendChild(seg);
    segButtons(seg, opts, cardFolder, function (v) { cardFolder = v; folderEdit = null; review = null; saveCards(); renderCards(); });
    function editor(kind) {
      var row = el('div', 'btns frow');
      var inp = el('input', 'fname'); inp.type = 'text'; inp.maxLength = 30;
      inp.placeholder = '資料夾名稱'; inp.setAttribute('aria-label', '資料夾名稱');
      inp.value = kind === 'new' ? '' : folderName(cardFolder);
      var ok = el('button', 'primary', kind === 'new' ? '建立' : '改名'); ok.type = 'button';
      var cancel = el('button', '', '取消'); cancel.type = 'button';
      function commit() {
        var name = inp.value.trim();
        if (!name) { inp.focus(); return; }
        if (kind === 'new') { var f = { id: 'f' + Date.now().toString(36), name: name }; folders.push(f); cardFolder = f.id; }
        else { folders.forEach(function (f) { if (f.id === cardFolder) { f.name = name; } }); }
        folderEdit = null; saveCards(); renderCards();
      }
      ok.addEventListener('click', commit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { commit(); } });
      cancel.addEventListener('click', function () { folderEdit = null; renderCards(); });
      row.appendChild(inp); row.appendChild(ok); row.appendChild(cancel);
      setTimeout(function () { inp.focus(); }, 20);
      return row;
    }
    if (folderEdit === 'new') { host.appendChild(editor('new')); }
    else {
      var row = el('div', 'btns frow');
      var add = el('button', 'fadd', '＋ 新資料夾'); add.type = 'button';
      add.addEventListener('click', function () { folderEdit = 'new'; renderCards(); });
      row.appendChild(add);
      host.appendChild(row);
    }
    host.appendChild(el('div', 'label', '新加入的生字卡會放進：' + folderName(addTarget())));
    /* 選了自己建的資料夾：改名、刪除放在資料夾名稱旁邊 */
    if (cardFolder !== 'all' && cardFolder !== 'none') {
      var bar = el('div', 'fbar');
      if (folderEdit === 'rename') { bar.appendChild(editor('rename')); }
      else {
        bar.appendChild(el('span', 'fbname', folderName(cardFolder)));
        var ren = el('button', '', '改名'); ren.type = 'button';
        ren.addEventListener('click', function () { folderEdit = 'rename'; renderCards(); });
        var del = el('button', 'cdel', '刪除資料夾'); del.type = 'button';
        del.addEventListener('click', function () {
          if (del.getAttribute('data-sure') !== '1') { del.setAttribute('data-sure', '1'); del.textContent = '再按一次確定（卡片會移到未分類）'; return; }
          var id = cardFolder;
          cards.forEach(function (c) { if (c.folder === id) { c.folder = ''; } });
          folders = folders.filter(function (f) { return f.id !== id; });
          cardFolder = 'all'; saveCards(); renderCards();
        });
        bar.appendChild(ren); bar.appendChild(del);
      }
      host.appendChild(bar);
    }
  }
  function renderCards() {
    var host = $('cardbody');
    host.replaceChildren();
    renderFolders();
    var n = dueCards().length;
    segButtons($('cardTabs'), [['review', '複習' + (n ? '（' + n + '）' : '')], ['list', '全部清單（' + cards.length + '）']], cardTab, function (v) { cardTab = v; renderCards(); });
    if (cardTab === 'review') { renderReview(host); } else { renderList(host); }
  }
  $('openCards').addEventListener('click', function () {
    var panel = $('cards'), open = panel.hidden;
    panel.hidden = !open; $('openCards').setAttribute('aria-expanded', String(open));
    if (open) { hidePop(); $('settings').hidden = true; $('openSettings').setAttribute('aria-expanded', 'false'); $('cardmsg').textContent = ''; renderCards(); }
  });
  $('closeCards').addEventListener('click', function () { $('cards').hidden = true; $('openCards').setAttribute('aria-expanded', 'false'); review = null; });
  updateCardButton();
