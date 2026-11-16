  /* ====== 1.38：中英泰混排的顯示開關、逐詞對照、認得率掃描與單詞清單 ====== */

  /* ---- 中英泰混排：整行沒有泰文的中文行、英文行，可以收起來 ---- */
  var MIX_KEY = 'thai-mix-hide', mixCache = null;
  function mixHide() { var o = lsGetJ(MIX_KEY, {}); return o && typeof o === 'object' ? o : {}; }
  function mixLines() {
    if (mixCache && mixCache.text === state.text) { return mixCache; }
    var t = state.text || '', out = { text: t, zh: [], en: [], th: 0 }, pos = 0;
    if (!pdf) {
      t.split('\n').forEach(function (ln, i, arr) {
        var s = pos, e = pos + ln.length; pos = e + 1;
        if (/[ก-๛]/.test(ln)) { out.th++; return; }
        var kind = /[㐀-鿿]/.test(ln) ? 'zh' : (/[A-Za-z]{2,}/.test(ln) ? 'en' : '');
        if (!kind) { return; }
        /* 連同換行一起收：最後一行就收前面那個換行 */
        var r = i < arr.length - 1 ? [s, e + 1] : [Math.max(0, s - 1), e];
        out[kind].push(r);
      });
    }
    mixCache = out;
    return out;
  }
  function mixDraw() {
    var bar = $('mixBar'); if (!bar) { return; }
    var m = mixLines(), h = mixHide(), show = !pdf && state.src && m.th >= 1 && (m.zh.length + m.en.length) >= 1;
    bar.hidden = !show; if (!show) { return; }
    [['zh', 'mixZh'], ['en', 'mixEn']].forEach(function (k) {
      var b = $(k[1]); b.hidden = !m[k[0]].length;
      b.setAttribute('aria-pressed', h[k[0]] ? 'false' : 'true');
    });
  }
  var _collectMarks46 = collectMarks;
  collectMarks = function (preview) {
    var marks = _collectMarks46(preview);
    if (!pdf && state.text) {
      var m = mixLines(), h = mixHide();
      ['zh', 'en'].forEach(function (k) { if (h[k]) { m[k].forEach(function (r) { marks.push({ s: r[0], e: r[1], c: 'lnx' }); }); } });
    }
    try { mixDraw(); } catch (err) {}
    return marks;
  };
  (function () {
    var bar = document.createElement('div'); bar.id = 'mixBar'; bar.className = 'mixbar'; bar.hidden = true;
    bar.innerHTML = '<span class="label" id="mixLab"></span><button type="button" class="mixb" id="mixZh"></button><button type="button" class="mixb" id="mixEn"></button>';
    var tx = $('text'); tx.parentNode.insertBefore(bar, tx);
    $('mixLab').textContent = L2('這篇也有：', 'This text also has:');
    $('mixZh').textContent = L2('中文行', 'Chinese lines'); $('mixEn').textContent = L2('英文行', 'English lines');
    [['zh', 'mixZh'], ['en', 'mixEn']].forEach(function (k) {
      $(k[1]).addEventListener('click', function () {
        var h = mixHide(); h[k[0]] = h[k[0]] ? 0 : 1; lsSetJ(MIX_KEY, h);
        tapSel = null; try { hidePop(); } catch (err) {}
        renderAllNotes();
      });
    });
  })();

  /* ---- 逐詞對照：每一行泰文下面列出每個詞的意思（查字典得來），再附上整句翻譯的連結 ---- */
  var GL_FIX = {'ที่': '在；的', 'การ': '…這件事', 'จะ': '會；將', 'ใน': '在…裡', 'ของ': '的；東西', 'ก็': '也；就', 'ได้': '能；得到', 'ว่า': '說；（引述）', 'ความ': '…性；…感', 'แล้ว': '了；已經', 'อยู่': '在；住', 'กับ': '和；跟', 'หรือ': '或；嗎', 'แต่': '但是', 'จาก': '從', 'อย่าง': '樣子；種', 'ด้วย': '也；一起', 'ซึ่ง': '其（關係詞）', 'ผู้': '…者', 'ตาม': '依照；跟隨', 'ฉัน': '我', 'โดย': '由；藉由', 'คำ': '詞；話', 'ทาง': '路；方向', 'เรื่อง': '事情', 'เมื่อ': '當…時', 'ยัง': '還；仍', 'ตัว': '身體；隻', 'ผม': '我（男）', 'มัน': '它；牠', 'อีก': '再；另', 'ถึง': '到', 'เพราะ': '因為', 'ท่าน': '您', 'ลง': '下', 'ไทย': '泰國', 'เธอ': '你；她', 'คุณ': '你', 'ทั้ง': '都；全', 'ต่อ': '繼續；對', 'พระ': '僧侶；佛', 'เลย': '就；完全', 'ต่าง': '各；不同', 'หา': '找', 'ถูก': '對；被', 'จน': '直到', 'นำ': '帶領', 'เจ้า': '主人；你', 'เสีย': '失去；壞', 'หน้า': '臉；前面', 'แห่ง': '的（書面）', 'บาง': '一些', 'พอ': '夠；一…就', 'แก่': '老；給', 'คง': '大概', 'อัน': '個', 'ใด': '任何', 'พวก': '們', 'ขอ': '請；要', 'ระหว่าง': '之間', 'ใช่': '是', 'กำลัง': '正在', 'เงิน': '錢', 'หาก': '如果', 'มาตรา': '條（法律）', 'ข้า': '我（古）', 'กฎหมาย': '法律', 'แก': '你；老', 'ยิ่ง': '越', 'หลัง': '後面', 'เพื่อน': '朋友', 'ข้อ': '條；項', 'ละ': '每', 'ตั้ง': '設立', 'ยก': '舉起', 'สัก': '大約', 'ค่า': '費用', 'หนู': '老鼠；我（小孩）', 'ตอน': '時候', 'ไหม': '嗎', 'เดือน': '月', 'มัก': '常常', 'ทหาร': '軍人', 'หลัก': '主要', 'ข้าง': '旁邊', 'ข้าว': '飯', 'รูป': '照片', 'บาท': '泰銖', 'เก็บ': '收', 'เสมอ': '總是', 'ชั้น': '層；樓', 'คืน': '夜晚', 'ค่ะ': '（女性句尾）', 'จง': '務必', 'แล': '和（古）', 'หมา': '狗', 'ดอก': '花', 'ที': '次', 'ใบ': '葉子；張', 'ครั้น': '當…時', 'ยอม': '願意', 'นา': '田', 'หัว': '頭', 'ปรากฏ': '出現', 'เครื่อง': '機器', 'ร้าน': '店', 'ใต้': '下面；南', 'จุด': '點', 'พลาง': '一邊…一邊', 'โต': '大；長大', 'ล้าน': '百萬', 'เย็น': '涼；傍晚', 'ทัน': '來得及', 'สระ': '母音；池塘', 'แนว': '方向', 'ชุด': '套；衣服', 'ราย': '件；名', 'เถิด': '吧', 'ไก่': '雞', 'ขน': '毛；搬運', 'สิ': '嘛', 'ซิ': '嘛', 'ซี': '嘛', 'เปล่า': '沒有', 'ชม': '欣賞', 'วัว': '牛', 'เรือน': '房屋', 'ได้แก่': '包括', 'เชิง': '方面', 'องค์': '位；尊', 'ยังไง': '怎麼', 'อา': '叔叔；啊', 'ฐานะ': '身分', 'ลา': '告別；請假', 'ปรับ': '調整', 'เท้า': '腳', 'เกาะ': '島', 'โอ': '喔', 'ตื่น': '醒來', 'รับประทาน': '吃（禮貌）', 'กล้า': '敢', 'ลำ': '艘', 'ควบคุม': '控制', 'ต้นไม้': '樹', 'สวัสดี': '你好', 'มะม่วง': '芒果', 'ลูก': '孩子；顆', 'ผล': '結果', 'ต้น': '樹；開頭', 'แม่น้ำ': '河', 'สาย': '線；晚', 'ไฟ': '火；燈', 'ชั่ว': '壞', 'สม': '符合', 'ร่าง': '身體；草稿', 'ไง': '怎樣', 'ทัพ': '軍隊', 'สาว': '年輕女性', 'นาง': '女士；她', 'คอย': '等', 'ช้าง': '大象', 'ร้อง': '唱；叫', 'ร่วม': '一起', 'มอง': '看', 'ตา': '眼睛', 'ฝ่าย': '方', 'จัด': '安排', 'ช่วง': '期間', 'ห้อง': '房間', 'บุตร': '子女', 'ทอง': '金', 'สิ้น': '完', 'ขาด': '缺；斷', 'นอก': '外面', 'แน่': '一定', 'คราว': '次', 'เขต': '區', 'ชาวบ้าน': '村民', 'นาม': '名字', 'เท่า': '等於；倍'};
  var GL_FIX_EN = {'ที่': 'at; that', 'การ': '(noun-maker)', 'จะ': 'will', 'ใน': 'in', 'ของ': 'of; thing', 'ก็': 'also; then', 'ได้': 'can; get', 'ว่า': 'say; that', 'ความ': '(noun-maker)', 'แล้ว': 'already', 'แต่': 'but', 'จาก': 'from', 'กับ': 'and; with', 'ผม': 'I (male)', 'คุณ': 'you', 'เพื่อน': 'friend', 'สวัสดี': 'hello', 'มะม่วง': 'mango', 'หรือ': 'or', 'อยู่': 'be at; live', 'ด้วย': 'also; with', 'ซึ่ง': 'which', 'ไหม': '(question)', 'ค่ะ': '(polite, female)', 'ใช่': 'yes'};
  function glShort(w) {
    if (glossLang !== 'en' && GL_FIX[w]) { return GL_FIX[w]; }
    if (glossLang === 'en' && GL_FIX_EN[w]) { return GL_FIX_EN[w]; }
    if (rrIsName(w)) { return L2('（名字）', '(name)'); }
    var g = glossLang !== 'en' ? (zhOfEntry(w) || shortGloss(w)) : shortGloss(w); if (!g) { return ''; }
    g = String(g).split(/[；;，,（(／/]/)[0].trim();
    return g.length > 9 ? g.slice(0, 8) + '…' : g;
  }
  function renderGlossPanel() {
    var host = $('gllist'); host.replaceChildren();
    if (!DICT) { host.appendChild(el('p', 'label', L2('字典還在載入，請稍後再按一次。', 'The dictionary is still loading; please try again in a moment.'))); return; }
    var t = state.text || '', lines = [], pos = 0, mx = mixLines(), skip = {};
    mx.zh.concat(mx.en).forEach(function (r) { skip[r[0]] = 1; });
    t.split('\n').forEach(function (ln) { lines.push([pos, ln]); pos += ln.length + 1; });
    var n = 0, si = 0;
    for (var li = 0; li < lines.length && n < 150; li++) {
      var s = lines[li][0], ln = lines[li][1];
      if (!/[ก-๛]/.test(ln)) { continue; }
      var e = s + ln.length, blk = el('div', 'glblk');
      var head = el('div', 'glsent', ln.trim()); head.lang = 'th'; blk.appendChild(head);
      var row = el('div', 'glrow');
      while (si < segs.length && segs[si].i < s) { si++; }
      for (var k = si; k < segs.length && segs[k].i < e; k++) {
        var g = segs[k];
        if (!g.w || !/[ก-ฮ]/.test(g.t)) { continue; }
        var chip = el('button', 'glw'); chip.type = 'button'; chip.setAttribute('data-i', String(g.i));
        var a = el('span', 'glth', g.t); a.lang = 'th'; chip.appendChild(a);
        var gz = glShort(g.t), b = el('span', 'glz' + (gz ? '' : ' none'), gz || '?'); b.setAttribute('data-noi18n', ''); chip.appendChild(b);
        chip.addEventListener('click', (function (seg) { return function () { tapSel = [seg.i, seg.i + seg.n]; renderText(); showPop(seg); }; })(g));
        row.appendChild(chip);
      }
      blk.appendChild(row);
      /* 下一行是這句的中文或英文翻譯（字幕常這樣排）：直接附上 */
      var nx = lines[li + 1];
      if (nx && skip[nx[0]] && nx[1].trim()) { var tr = el('div', 'gltr', nx[1].trim()); tr.setAttribute('data-noi18n', ''); blk.appendChild(tr); }
      var lk = document.createElement('a'); lk.className = 'ext small gllink'; lk.href = trUrl(ln.trim()); lk.target = '_blank'; lk.rel = 'noopener noreferrer';
      lk.textContent = L2('整句翻譯', 'Translate sentence'); blk.appendChild(lk);
      host.appendChild(blk); n++;
    }
    if (!n) { host.appendChild(el('p', 'label', L2('這份文件沒有泰文。', 'This document has no Thai text.'))); }
    else if (n >= 150) { host.appendChild(el('p', 'label', L2('只列出前 150 行。', 'Only the first 150 lines are shown.'))); }
  }
  function glossToggle() {
    var p = $('glpanel'), open = p.hidden;
    p.hidden = !open; $('glossAll').setAttribute('aria-expanded', String(open));
    if (open) { renderGlossPanel(); }
  }
  $('glossAll').addEventListener('click', glossToggle);
  function glossRefresh() { if (!$('glpanel').hidden) { renderGlossPanel(); } }

  /* ---- 認得率：用 App 自己的斷詞（和畫面上一樣，也包含補充詞彙），單詞清單可以標「我認得」 ---- */
  var RK_KEY = 'thai-known-w', rkSet = null;
  function rkMap() { if (!rkSet) { rkSet = lsGetJ(RK_KEY, {}); if (!rkSet || typeof rkSet !== 'object' || Array.isArray(rkSet)) { rkSet = {}; } } return rkSet; }
  function rkToggle(w, on) {
    var m = rkMap(); if (on) { m[w] = 1; } else { delete m[w]; }
    if (!on) { rrNoteLook({ t: w }); } else { var lk = rrLookMap(); if (lk[w] != null) { delete lk[w]; lsSetJ(RR_LOOK_KEY, lk); } }
    lsSetJ(RK_KEY, m); rrMemo = {}; rrMemoN = 0;
  }
  rrTokens = function (text) {
    var out = [];
    if (typeof DICT !== 'undefined' && DICT) {
      var tk = text === state.text && segs && segs.length ? segs : segment(String(text).slice(0, 40000));
      tk.forEach(function (g) { if (g.w && g.t.length >= 2 && /[ก-ฮ]/.test(g.t) && !/^(.)\1+$/.test(g.t)) { out.push(g.t); } });
      return out;
    }
    if (typeof Intl === 'undefined' || !Intl.Segmenter) { return null; }
    if (!rrSegr) { rrSegr = new Intl.Segmenter('th', { granularity: 'word' }); }
    Array.from(rrSegr.segment(String(text).slice(0, 40000))).forEach(function (x) { if (x.isWordLike && x.segment.length >= 2 && /[ก-ฮ]/.test(x.segment)) { out.push(x.segment); } });
    return out;
  };
  rrCompute = function (text) {
    if (!rrInit() || !text) { return null; }
    var key = level + '|' + (DICT ? 'd' : '') + dict2.n + '|' + text.length + '|' + text.slice(0, 40) + '|' + text.slice(-40);
    if (rrMemo[key]) { return rrMemo[key]; }
    var toks = rrTokens(text); if (!toks || toks.length < 15) { return null; }
    var N = RR_N[level] || RR_N.b, mast = rrMastered(), look = rrLookMap(), mk = rkMap(), known = 0, unk = {}, kn = {};
    toks.forEach(function (t) {
      var why = mk[t] ? 'mark' : mast[t] ? 'card' : look[t] ? '' : (rrRank[t] && rrRank[t] <= N) ? 'freq' : rrIsName(t) ? 'name' : '';
      if (why) { known++; kn[t] = kn[t] || { n: 0, why: why }; kn[t].n++; } else { unk[t] = (unk[t] || 0) + 1; }
    });
    var r = { rate: Math.round(100 * known / toks.length), n: toks.length, unk: Object.keys(unk).length, unkMap: unk, knMap: kn };
    if (rrMemoN > 60) { rrMemo = {}; rrMemoN = 0; }
    rrMemo[key] = r; rrMemoN++;
    return r;
  };
  var WHY = { mark: L2('你標了認得', 'you marked it'), card: L2('已記熟的生字', 'mastered flashcard'), freq: L2('常用字', 'common word'), name: L2('名字', 'name') };
  function rrListSheet(kind) {
    var r = rrCompute(state.text); if (!r) { return; }
    var dlg = $('setHelp'); if (!dlg) { return; }
    var map = kind === 'unk' ? r.unkMap : r.knMap, words = Object.keys(map);
    words.sort(function (a, b) { var na = kind === 'unk' ? map[a] : map[a].n, nb = kind === 'unk' ? map[b] : map[b].n; return nb - na || a.localeCompare(b, 'th'); });
    $('shTitle').textContent = kind === 'unk' ? L2('可能要查的詞（' + words.length + '）', 'Words you may need to look up (' + words.length + ')') : L2('認得的詞（' + words.length + '）', 'Words you know (' + words.length + ')');
    var body = $('shBody'); body.replaceChildren();
    body.appendChild(el('p', 'edhint', kind === 'unk' ? L2('依出現次數排列。其實已經認得的，按「我認得」，認得率會跟著更新。', 'Sorted by how often they appear. If you already know one, tap “I know it” and the rate updates.') : L2('依出現次數排列。標錯的可以按「不熟」改回來。', 'Sorted by how often they appear. Tap “Not sure” to move a word back.')));
    var ul = el('ul', 'rklist');
    words.slice(0, 400).forEach(function (w) {
      var li = el('li', 'rkrow'), n = kind === 'unk' ? map[w] : map[w].n;
      var a = el('span', 'rkw', w); a.lang = 'th'; li.appendChild(a);
      var g = el('span', 'rkg', (shortGloss(w) || '').split(/[；;]/)[0].slice(0, 24) || (kind === 'unk' ? L2('字典查不到', 'not in the dictionary') : '')); g.setAttribute('data-noi18n', ''); li.appendChild(g);
      li.appendChild(el('span', 'rkn', '×' + n));
      if (kind === 'kn') { li.appendChild(el('span', 'rkwhy', WHY[map[w].why] || '')); }
      var b = el('button', 'rkb'); b.type = 'button';
      var on = kind === 'unk';
      b.textContent = on ? L2('我認得', 'I know it') : L2('不熟', 'Not sure');
      b.addEventListener('click', function () {
        rkToggle(w, on);
        li.classList.add('moved'); b.disabled = true; b.textContent = on ? L2('已標認得', 'Marked') : L2('已移回', 'Moved back');
        try { var wasOpen = !$('rrMore').hidden; rrShow(state.src && state.src.id); if (wasOpen) { $('rrMore').hidden = false; $('rrMain').setAttribute('aria-expanded', 'true'); } } catch (err) {}
      });
      li.appendChild(b); ul.appendChild(li);
    });
    body.appendChild(ul);
    if (words.length > 400) { body.appendChild(el('p', 'label', L2('只列出最常出現的 400 個。', 'Only the 400 most frequent are shown.'))); }
    dlg.hidden = false;
    try { $('shClose').focus(); } catch (err) {}
  }
  (function () {
    var more = $('rrMore'); if (!more) { return; }
    var row = el('div', 'btns rrbtns');
    var b1 = el('button', '', ''); b1.type = 'button'; b1.id = 'rrUnk';
    var b2 = el('button', '', ''); b2.type = 'button'; b2.id = 'rrKn';
    b1.addEventListener('click', function () { rrListSheet('unk'); });
    b2.addEventListener('click', function () { rrListSheet('kn'); });
    row.appendChild(b1); row.appendChild(b2); more.appendChild(row);
  })();
  var _rrShow46 = rrShow;
  rrShow = function (id) {
    var ok = _rrShow46.apply(this, arguments);
    if (ok) {
      var r = rrCompute(state.text);
      $('rrUnk').textContent = L2('看可能要查的詞（' + r.unk + '）', 'Words to look up (' + r.unk + ')');
      $('rrKn').textContent = L2('看認得的詞（' + Object.keys(r.knMap).length + '）', 'Words you know (' + Object.keys(r.knMap).length + ')');
    }
    return ok;
  };
  /* 補充詞彙晚一點才載入：載好後重算一次 */
  var _dict2Add46 = dict2Add;
  dict2Add = function (t) { var n = _dict2Add46(t); rrMemo = {}; rrMemoN = 0; setTimeout(function () { try { rrRefresh(); } catch (err) {} }, 50); return n; };

  /* 換文件、改文字：兩個面板跟著更新 */
  var _openDoc46 = openDoc;
  openDoc = function () { var r = _openDoc46.apply(this, arguments); mixCache = null; setTimeout(function () { glossRefresh(); mixDraw(); }, 400); return r; };

