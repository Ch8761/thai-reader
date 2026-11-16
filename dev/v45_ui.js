  /* ====== 1.37：字母與拼讀練習（生字卡 → 測驗，只在程度是「入門」時出現）====== */
  /* 子音：字母、名稱（代表字）、代表字的意思、開頭的音、類別（m 中、h 高、l 低）、常不常用 */
  var ABC_C = [
    ['ก', 'ไก่', '雞', 'k', 'm', 1], ['ข', 'ไข่', '蛋', 'kh', 'h', 1], ['ฃ', 'ขวด', '瓶子（已不使用）', 'kh', 'h', 0], ['ค', 'ควาย', '水牛', 'kh', 'l', 1], ['ฅ', 'คน', '人（已不使用）', 'kh', 'l', 0], ['ฆ', 'ระฆัง', '鐘', 'kh', 'l', 0],
    ['ง', 'งู', '蛇', 'ng', 'l', 1], ['จ', 'จาน', '盤子', 'j', 'm', 1], ['ฉ', 'ฉิ่ง', '小鈸', 'ch', 'h', 1], ['ช', 'ช้าง', '大象', 'ch', 'l', 1], ['ซ', 'โซ่', '鐵鍊', 's', 'l', 1], ['ฌ', 'เฌอ', '樹', 'ch', 'l', 0],
    ['ญ', 'หญิง', '女人', 'y', 'l', 1], ['ฎ', 'ชฎา', '舞冠', 'd', 'm', 0], ['ฏ', 'ปฏัก', '趕牛棒', 't', 'm', 0], ['ฐ', 'ฐาน', '底座', 'th', 'h', 0], ['ฑ', 'มณโฑ', '曼陀（人名）', 'th', 'l', 0], ['ฒ', 'ผู้เฒ่า', '老人', 'th', 'l', 0],
    ['ณ', 'เณร', '小沙彌', 'n', 'l', 1], ['ด', 'เด็ก', '小孩', 'd', 'm', 1], ['ต', 'เต่า', '烏龜', 't', 'm', 1], ['ถ', 'ถุง', '袋子', 'th', 'h', 1], ['ท', 'ทหาร', '軍人', 'th', 'l', 1], ['ธ', 'ธง', '旗子', 'th', 'l', 1],
    ['น', 'หนู', '老鼠', 'n', 'l', 1], ['บ', 'ใบไม้', '葉子', 'b', 'm', 1], ['ป', 'ปลา', '魚', 'p', 'm', 1], ['ผ', 'ผึ้ง', '蜜蜂', 'ph', 'h', 1], ['ฝ', 'ฝา', '蓋子', 'f', 'h', 1], ['พ', 'พาน', '高腳盤', 'ph', 'l', 1],
    ['ฟ', 'ฟัน', '牙齒', 'f', 'l', 1], ['ภ', 'สำเภา', '帆船', 'ph', 'l', 1], ['ม', 'ม้า', '馬', 'm', 'l', 1], ['ย', 'ยักษ์', '夜叉', 'y', 'l', 1], ['ร', 'เรือ', '船', 'r', 'l', 1], ['ล', 'ลิง', '猴子', 'l', 'l', 1],
    ['ว', 'แหวน', '戒指', 'w', 'l', 1], ['ศ', 'ศาลา', '涼亭', 's', 'h', 1], ['ษ', 'ฤๅษี', '隱士', 's', 'h', 0], ['ส', 'เสือ', '老虎', 's', 'h', 1], ['ห', 'หีบ', '箱子', 'h', 'h', 1], ['ฬ', 'จุฬา', '風箏', 'l', 'l', 0],
    ['อ', 'อ่าง', '盆子', '-', 'm', 1], ['ฮ', 'นกฮูก', '貓頭鷹', 'h', 'l', 1]
  ];
  var ABC_EN = ['chicken', 'egg', 'bottle (obsolete)', 'buffalo', 'person (obsolete)', 'bell', 'snake', 'plate', 'small cymbals', 'elephant', 'chain', 'tree', 'woman', 'headdress', 'goad', 'pedestal', 'Montho (a name)', 'elder', 'novice monk', 'child', 'turtle', 'bag', 'soldier', 'flag', 'mouse', 'leaf', 'fish', 'bee', 'lid', 'tray', 'teeth', 'junk (ship)', 'horse', 'giant', 'boat', 'monkey', 'ring', 'pavilion', 'hermit', 'tiger', 'chest', 'kite', 'basin', 'owl'];
  ABC_C.forEach(function (c, i) { c[6] = ABC_EN[i]; });
  function abcCls(k) { return ({ m: L2('中類子音', 'mid-class consonant'), h: L2('高類子音', 'high-class consonant'), l: L2('低類子音', 'low-class consonant') })[k]; }
  /* 母音：寫法（◌ 是子音的位置）、音、長短、示範音節 */
  var ABC_V = [
    ['◌ะ', 'a', '短', 'จะ'], ['◌า', 'aa', '長', 'มา'], ['◌ิ', 'i', '短', 'ติ'], ['◌ี', 'ii', '長', 'ดี'], ['◌ึ', 'ue', '短', 'ดึ'], ['◌ือ', 'uue', '長', 'มือ'],
    ['◌ุ', 'u', '短', 'ดุ'], ['◌ู', 'uu', '長', 'ดู'], ['เ◌ะ', 'e', '短', 'เตะ'], ['เ◌', 'ee', '長', 'เก'], ['แ◌ะ', 'ae', '短', 'และ'], ['แ◌', 'aae', '長', 'แก'],
    ['โ◌ะ', 'o', '短', 'โต๊ะ'], ['โ◌', 'oo', '長', 'โต'], ['◌อ', 'aw', '長', 'รอ'], ['เ◌อ', 'oe', '長', 'เจอ'], ['เ◌ีย', 'ia', '長', 'เมีย'], ['เ◌ือ', 'uea', '長', 'เรือ'],
    ['◌ัว', 'ua', '長', 'ตัว'], ['ไ◌', 'ai', '短', 'ไป'], ['ใ◌', 'ai', '短', 'ใจ'], ['เ◌า', 'ao', '短', 'เรา'], ['◌ำ', 'am', '短', 'ทำ']
  ];
  /* 拼讀：子音＋長母音（中類、低類子音配長母音都是平聲，先不用管聲調） */
  var ABC_BI = [['ก', 'k'], ['จ', 'j'], ['ด', 'd'], ['ต', 't'], ['บ', 'b'], ['ป', 'p'], ['ค', 'kh'], ['ง', 'ng'], ['ช', 'ch'], ['ท', 'th'], ['น', 'n'], ['พ', 'ph'], ['ฟ', 'f'], ['ม', 'm'], ['ย', 'y'], ['ร', 'r'], ['ล', 'l'], ['ว', 'w']];
  var ABC_BV = [['า', 'aa', 0], ['ี', 'ii', 0], ['ู', 'uu', 0], ['เ', 'ee', 1], ['แ', 'aae', 1], ['โ', 'oo', 1]];
  var abc = { type: 'cons', q: null, all: false };
  var ABC_KEY = 'thai-abc';
  function abcStat() { return lsGetJ(ABC_KEY, {}) || {}; }
  function abcNote(key, ok) { var s = abcStat(); var a = s[key] || [0, 0]; a[1]++; if (ok) { a[0]++; } s[key] = a; lsSetJ(ABC_KEY, s); }
  function abcWeight(key) { var a = abcStat()[key]; return !a ? 3 : (a[0] / a[1] < 0.7 ? 4 : 1); }
  function abcPick(list, keyOf, n) {
    var pool = list.map(function (x) { return [x, Math.random() * abcWeight(keyOf(x))]; }).sort(function (a, b) { return b[1] - a[1]; });
    return pool.slice(0, n).map(function (x) { return x[0]; });
  }
  function abcSyl(c, v) { return v[2] ? v[0] + c[0] : c[0] + v[0]; }
  function abcOpts(ans, others) {
    var o = [ans], used = {}; used[ans] = 1;
    shuffle(others.slice()).forEach(function (x) { if (o.length < 4 && !used[x]) { used[x] = 1; o.push(x); } });
    return shuffle(o);
  }
  function abcStart() {
    var qs = [];
    if (abc.type === 'cons') {
      var list = ABC_C.filter(function (c) { return abc.all || c[5]; });
      var sounds = []; ABC_C.forEach(function (c) { if (c[3].length <= 2 && sounds.indexOf(c[3]) < 0) { sounds.push(c[3]); } });
      abcPick(list.filter(function (c) { return c[0] !== 'อ'; }), function (c) { return 'c' + c[0]; }, 10).forEach(function (c) {
        qs.push({ key: 'c' + c[0], show: c[0], say: c[0] + ' ' + c[1], ans: c[3], opts: abcOpts(c[3], sounds), ask: '這個字母開頭唸什麼音？', after: c[0] + ' ' + c[1] + L2('（' + c[2] + '）・', ' (' + c[6] + '), ') + abcCls(c[4]) });
      });
    } else if (abc.type === 'vowel') {
      var vs = []; ABC_V.forEach(function (v) { if (vs.indexOf(v[1]) < 0) { vs.push(v[1]); } });
      abcPick(ABC_V, function (v) { return 'v' + v[0]; }, 10).forEach(function (v) {
        qs.push({ key: 'v' + v[0], show: v[0], say: v[3], ans: v[1], opts: abcOpts(v[1], vs), ask: '這個母音唸什麼音？（◌ 是放子音的位置）', after: L2(v[0] + '：' + v[1] + '（' + v[2] + '音），例如 ' + v[3], v[0] + ': ' + v[1] + ' (' + (v[2] === '長' ? 'long' : 'short') + '), e.g. ' + v[3]) });
      });
    } else {
      var all = []; ABC_BI.forEach(function (c) { ABC_BV.forEach(function (v) { all.push([abcSyl(c, v), c[1] + v[1], c, v]); }); });
      abcPick(all, function (x) { return 's' + x[0]; }, 10).forEach(function (x) {
        /* 干擾選項：同子音不同母音、同母音不同子音，逼自己兩邊都看清楚 */
        var near = all.filter(function (y) { return y !== x && (y[2] === x[2] || y[3] === x[3]); });
        if (abc.type === 'blend') { qs.push({ key: 's' + x[0], show: x[0], say: x[0], ans: x[1], opts: abcOpts(x[1], near.map(function (y) { return y[1]; })), ask: '這個音節怎麼唸？（先不用管聲調）', after: x[0] + ' = ' + x[2][0] + ' (' + x[2][1] + ') + ' + (x[3][2] ? x[3][0] + '◌' : '◌' + x[3][0]) + ' (' + x[3][1] + ')' }); }
        else { qs.push({ key: 'l' + x[0], show: '', listen: 1, say: x[0], ans: x[0], th: 1, opts: abcOpts(x[0], near.map(function (y) { return y[0]; })), ask: '聽發音，選出是哪個音節', after: x[0] + ' = ' + x[1] }); }
      });
    }
    abc.q = { qs: qs, k: 0, right: 0, picked: null, wrong: [] };
    renderCards();
  }
  function abcSection(host) {
    var sec = el('section', 'abcsec'); sec.setAttribute('aria-label', '字母與拼讀練習');
    sec.appendChild(el('h3', 'abch', '字母與拼讀練習'));
    var Q = abc.q;
    if (!Q) {
      sec.appendChild(el('p', 'label', '不用先存生字卡。每次 10 題，答錯的字母之後會比較常出現。'));
      var seg = el('div', 'seg qtypes'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', '練習內容');
      segButtons(seg, [['cons', '子音'], ['vowel', '母音'], ['blend', '拼讀'], ['listen', '聽音選字']], abc.type, function (v) { abc.type = v; renderCards(); });
      sec.appendChild(seg);
      if (abc.type === 'cons') {
        var lab = el('label', 'abcall'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = abc.all;
        cb.addEventListener('change', function () { abc.all = cb.checked; });
        lab.appendChild(cb); lab.appendChild(el('span', '', '包含少用的字母（全部 44 個）')); sec.appendChild(lab);
      }
      var go = el('button', 'primary wide', '開始練習'); go.type = 'button'; go.addEventListener('click', abcStart);
      var row = el('div', 'btns'); row.appendChild(go); sec.appendChild(row);
      host.appendChild(sec); return;
    }
    if (Q.k >= Q.qs.length) {
      var box = el('div', 'qdone'); box.appendChild(el('div', 'qscore', Q.right + ' / ' + Q.qs.length));
      box.appendChild(el('p', 'label', Q.right === Q.qs.length ? '全對！' : '答錯的這幾個，下次會再出現：'));
      if (Q.wrong.length) { var ul = el('ul', 'qwrong'); Q.wrong.forEach(function (q) { var li = el('li'); var t = el('span', 'cw', q.listen ? q.ans : q.show); t.lang = 'th'; li.appendChild(t); var cm = el('span', 'cm', q.after); cm.setAttribute('data-noi18n', ''); li.appendChild(cm); ul.appendChild(li); }); box.appendChild(ul); }
      sec.appendChild(box);
      var again = el('button', 'primary', '再練一次'); again.type = 'button'; again.addEventListener('click', abcStart);
      var back = el('button', '', '回到練習內容'); back.type = 'button'; back.addEventListener('click', function () { abc.q = null; renderCards(); });
      var r = el('div', 'btns'); r.appendChild(again); r.appendChild(back); sec.appendChild(r);
      host.appendChild(sec); return;
    }
    var q = Q.qs[Q.k];
    var prog = el('div', 'rprog'), bar = el('div', 'rbar'), fill = el('span'); fill.style.width = Math.round(Q.k / Q.qs.length * 100) + '%'; bar.appendChild(fill);
    prog.appendChild(bar); prog.appendChild(el('span', 'rnum', (Q.k + 1) + ' / ' + Q.qs.length)); sec.appendChild(prog);
    var card = el('div', 'fcard qcard abccard');
    if (q.listen) {
      var lb = el('button', 'iconbtn qlisten'); lb.type = 'button'; lb.setAttribute('aria-label', '再聽一次'); lb.innerHTML = SPK_ICON;
      lb.addEventListener('click', function () { speak(q.say); }); card.appendChild(lb);
      if (Q.picked === null && !q.spoken) { q.spoken = 1; setTimeout(function () { speak(q.say); }, 250); }
    } else { var w = el('div', 'cword abcbig', q.show); w.lang = 'th'; card.appendChild(w); }
    card.appendChild(el('div', 'qprompt small', q.ask));
    if (Q.picked !== null) { var af = el('div', 'abcafter', q.after); af.setAttribute('data-noi18n', ''); card.appendChild(af); }
    sec.appendChild(card);
    var grid = el('div', 'qopts');
    q.opts.forEach(function (o) {
      var b = el('button', 'qopt', o); b.type = 'button'; b.setAttribute('data-noi18n', '');
      if (q.th) { b.lang = 'th'; b.classList.add('th'); }
      if (Q.picked !== null) { b.disabled = true; if (o === q.ans) { b.classList.add('ok'); } else if (o === Q.picked) { b.classList.add('bad'); } }
      b.addEventListener('click', function () {
        if (Q.picked !== null) { return; }
        Q.picked = o; var ok = o === q.ans;
        if (ok) { Q.right++; } else { Q.wrong.push(q); }
        abcNote(q.key, ok);
        try { speak(q.say); } catch (err) {}
        renderCards();
      });
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    if (Q.picked !== null) {
      var nx = el('button', 'primary wide', Q.k + 1 >= Q.qs.length ? '看結果' : '下一題'); nx.type = 'button';
      nx.addEventListener('click', function () { Q.k++; Q.picked = null; renderCards(); });
      var rr = el('div', 'btns'); rr.appendChild(nx); sec.appendChild(rr);
      setTimeout(function () { try { nx.focus(); } catch (err) {} }, 30);
    }
    host.appendChild(sec);
  }
  var _renderQuiz45 = renderQuiz;
  renderQuiz = function (host) {
    var on = lv4() === 'a';
    if (on) { abcSection(host); }
    /* 字母練習進行中：先不顯示下面的生字卡測驗，免得兩個測驗疊在一起 */
    if (on && abc.q) { return; }
    if (on && !quiz) { host.appendChild(el('h3', 'abch', '生字卡測驗')); }
    _renderQuiz45(host);
  };

