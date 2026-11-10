  /* ---------- 句型庫（方案 D） ---------- */
  var gramSel = null, gramFocus = null;
  var LEVELS = [['a', '入門'], ['b', '初級'], ['c', '中級'], ['d', '高級'], ['all', '全部']];
  var LV_NAME = { a: '入門', b: '初級', c: '中級', d: '高級' };
  var LV_ORDER = { a: 1, b: 2, c: 3, d: 4 };
  var level = 'b';
  try { level = localStorage.getItem('thai-level') || 'b'; } catch (err) {}
  var NUMS = ['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  var PRONS = ['ฉัน', 'ผม', 'เขา', 'คุณ', 'เรา', 'เธอ', 'มัน', 'หนู', 'พวกเขา', 'พวกเรา', 'ท่าน', 'แม่', 'พ่อ', 'ลูก', 'ครู', 'นักเรียน', 'ประชาชน', 'เจ้าหน้าที่'];
  function posOf(w) { var e = DICT && w ? DICT[w] : null; return e ? e.map(function (x) { return x[0]; }) : []; }
  function isVerb(w) { return posOf(w).indexOf('verb') !== -1; }
  function isAdj(w) { return posOf(w).indexOf('adj') !== -1; }
  function isNoun(w) { var p = posOf(w); return p.indexOf('noun') !== -1 || p.indexOf('name') !== -1 || p.indexOf('pron') !== -1 || PRONS.indexOf(w) !== -1; }
  var SPEECH = ['บอก', 'พูด', 'คิด', 'กล่าว', 'เปิดเผย', 'ระบุ', 'ยืนยัน', 'เชื่อ', 'รู้', 'เห็น', 'ได้ยิน', 'แจ้ง', 'อธิบาย', 'ชี้แจง', 'หวัง', 'รายงาน', 'เผย', 'ถาม', 'ตอบ', 'รู้สึก', 'แน่ใจ', 'สงสัย', 'เข้าใจ', 'ทราบ', 'ประกาศ', 'เตือน', 'ยอมรับ', 'ปฏิเสธ', 'อ้าง', 'กลัว', 'คาด', 'บ่น', 'สัญญา'];
  var WAA_EXCLUDE = ['ไม่ว่า', 'แม้ว่า', 'ถึงแม้ว่า', 'เพราะว่า', 'แต่ว่า', 'หรือว่า', 'คาดว่า'];
  var CLF = ['คน', 'ตัว', 'อัน', 'เล่ม', 'คัน', 'ใบ', 'ชิ้น', 'ครั้ง', 'แห่ง', 'ราย', 'ฉบับ', 'หลัง', 'ลูก', 'แก้ว', 'จาน', 'ขวด', 'ห้อง', 'เครื่อง', 'ชั่วโมง', 'นาที', 'วัน', 'เดือน', 'ปี', 'บาท', 'ชุด', 'คู่', 'ต้น', 'ดอก', 'เรื่อง', 'ข้อ', 'ประเทศ', 'จังหวัด', 'รอบ', 'ท่าน', 'กิโลเมตร', 'เมตร'];
  var THII_REASON = ['ขอบคุณ', 'ขอบใจ', 'ขอโทษ', 'ดีใจ', 'เสียใจ', 'ยินดี', 'โชคดี', 'ภูมิใจ', 'แปลกใจ', 'โกรธ', 'เสียดาย', 'ผิด'];
  function isNum(w) { return !!w && (/^[0-9๐-๙]+$/.test(w) || NUMS.some(function (n) { return w.indexOf(n) === 0; })); }
  function verbBefore(W, i, span) { for (var q = i - 1; q >= Math.max(0, i - span); q--) { if (isVerb(W[q]) || isAdj(W[q])) { return true; } } return false; }

  /* 多用途詞：依前後文猜在這一句裡最可能的用法（只是推測） */
  var ROLES = {
    thii: function (W, i) {
      var prev = W[i - 1] || '', next = W[i + 1] || '';
      if (W[i] && W[i] !== 'ที่' && W[i].indexOf('ที่') === 0) { next = W[i].slice(3); }
      var R = [
        ['序數「第…」', '後面接數字，例如 ที่หนึ่ง 第一'],
        ['介系詞「在」', '接在 อยู่、ไป、ทำงาน 等動詞後，後面是地點'],
        ['說明原因「（因為）…」', '接在 ขอบคุณ、ขอโทษ、ดีใจ 等後面'],
        ['ที่จะ「要…的、去…」', '後面接 จะ，帶出打算要做的事'],
        ['名詞「地方、位子」', '單獨當名詞，例如 หาที่จอดรถ 找停車位'],
        ['關係詞「…的（那個）」', '接在名詞後，帶出一段描述那個名詞的話']
      ];
      var k = 5;
      if (isNum(next)) { k = 0; }
      else if (['อยู่', 'ไป', 'มา', 'ถึง', 'เกิด', 'ทำงาน', 'เรียน', 'พบ', 'เจอ', 'นั่ง', 'จัด', 'พัก', 'อาศัย', 'ตั้ง', 'เดินทาง', 'ซื้อ', 'กิน', 'ขาย', 'เล่น', 'รอ'].indexOf(prev) !== -1) { k = 1; }
      else if (THII_REASON.indexOf(prev) !== -1) { k = 2; }
      else if (next === 'จะ') { k = 3; }
      else if (['หา', 'มี', 'จอง', 'เต็ม', 'ว่าง', 'ไม่มี'].indexOf(prev) !== -1 && !isVerb(next)) { k = 4; }
      else if (!next) { k = 4; }
      return { roles: R, pick: k };
    },
    daai: function (W, i) {
      var prev = W[i - 1] || '', next = W[i + 1] || '';
      var R = [
        ['動詞後「能、可以」', '例如 พูดได้ 會說；否定 …ไม่ได้ 是「不能」'],
        ['動詞前「有（做到）、已經」', '例如 ได้ไป 有去；否定 ไม่ได้ + 動詞 是「並沒有」'],
        ['「得到、拿到」', '後面接名詞，例如 ได้เงิน 拿到錢'],
        ['單獨回答「行、可以」', '例如 ได้ครับ 可以的']
      ];
      var k = 0;
      if (W[i] === 'ไม่ได้') { k = isVerb(next) ? 1 : 0; }
      else if (isVerb(next) && !isNoun(next)) { k = 1; }
      else if (verbBefore(W, i, 4)) { k = 0; }
      else if (isNoun(next)) { k = 2; }
      else if (!next || ['ครับ', 'ค่ะ', 'คะ', 'นะ', 'จ้ะ', 'เลย'].indexOf(next) !== -1) { k = 3; }
      if (prev === '' && isVerb(next)) { k = 1; }
      return { roles: R, pick: k };
    },
    hai: function (W, i) {
      var prev = W[i - 1] || '', next = W[i + 1] || '', next2 = W[i + 2] || '';
      var R = [
        ['動詞「給」', 'ให้ + 東西 + 人，例如 ให้เงิน 給錢'],
        ['使役「讓、叫（某人做）」', 'ให้ + 人 + 動詞，例如 ให้เขาไป 叫他去'],
        ['「使得、導致」', 'ทำให้ + 結果'],
        ['動詞後「給（某人）、為（某人）」', '動詞 + 東西 + ให้ + 人，例如 ซื้อให้แม่ 買給媽媽']
      ];
      var k = 0;
      if (W[i] === 'ทำให้' || prev === 'ทำ') { k = 2; }
      else if (['อยาก', 'ขอ', 'สั่ง', 'บอก', 'ปล่อย', 'ต้องการ', 'อนุญาต', 'หวัง', 'แนะนำ', 'ช่วย', 'เตือน', 'เรียกร้อง'].indexOf(prev) !== -1) { k = 1; }
      else if ((PRONS.indexOf(next) !== -1 || isNoun(next)) && isVerb(next2)) { k = 1; }
      else if (verbBefore(W, i, 3)) { k = 3; }
      return { roles: R, pick: k };
    },
    waa: function (W, i) {
      var word = W[i] || '', prev = W[i - 1] || '', next = W[i + 1] || '';
      var stem = (word !== 'ว่า' && word.slice(-3) === 'ว่า') ? word.slice(0, -3) : prev;
      var R = [
        ['引述「說、認為…」', '接在 บอก、คิด、กล่าว 等動詞後面，帶出說或想的內容'],
        ['「叫做、稱為」', '接在 เรียก、ชื่อ、หมายความ 後面'],
        ['動詞「責罵、說（某人）」', 'ว่า + 人，例如 แม่ว่าลูก 媽媽罵孩子'],
        ['ว่าแต่「話說、對了」', '句首轉換話題'],
        ['口語問句「…怎麼說？…什麼？」', '例如 ว่าไง、ว่าอะไร']
      ];
      var k = 0;
      if (word.indexOf('ว่าแต่') === 0 || (word === 'ว่า' && next === 'แต่' && !verbBefore(W, i, 2))) { k = 3; }
      else if (['ไง', 'อะไร', 'ยังไง'].indexOf(next) !== -1) { k = 4; }
      else if (['เรียก', 'ชื่อ', 'หมายความ', 'หมายถึง', 'ถือ', 'นับ', 'เรียกกัน'].indexOf(stem) !== -1) { k = 1; }
      else if (SPEECH.indexOf(stem) !== -1 || isVerb(stem)) { k = 0; }
      else if (!verbBefore(W, i, 3) && (PRONS.indexOf(next) !== -1 || isNoun(next))) { k = 2; }
      return { roles: R, pick: k };
    },
    paimaa: function (W, i) {
      var prev = W[i - 1] || '', next = W[i + 1] || '';
      var R = [
        ['主要動詞「去／來」', '句子的主要動作，例如 ฉันไปตลาด 我去市場'],
        ['方向（放在動詞後）「…去／…過來」', '例如 เดินมา 走過來、ส่งไป 寄過去'],
        ['時間「…以來、…下去」', '例如 สามปีมาแล้ว 三年了、ต่อไป 接下來']
      ];
      var k = 0;
      if (W[i] === 'มา' && (isNum(prev) || isNum(next) || /ปี|เดือน|วัน|นาน|อาทิตย์|สัปดาห์/.test(prev) || ['นาน', 'ตลอด', 'ก่อน'].indexOf(next) !== -1)) { k = 2; }
      else if (prev === 'ต่อ' || prev === 'ผ่าน') { k = 2; }
      else if (prev && isVerb(prev) && ['จะ', 'ไม่', 'อยาก', 'ต้อง', 'ควร', 'เคย', 'ได้', 'ก็', 'กำลัง', 'เพิ่ง', 'ยัง', 'อาจ', 'น่าจะ', 'คง', 'ชอบ', 'ลอง'].indexOf(prev) === -1) { k = 1; }
      return { roles: R, pick: k };
    },
    loei: function (W, i) {
      var R = [
        ['ไม่…เลย「一點也不」', '前面有 ไม่ 的否定句'],
        ['加強語氣「真的、超、就直接」', '肯定句句尾'],
        ['ก็เลย「所以」', '帶出結果']
      ];
      var k = 1;
      if (W[i] === 'ก็เลย' || W[i - 1] === 'ก็') { k = 2; }
      else if (W.slice(Math.max(0, i - 6), i).some(function (w) { return w === 'ไม่' || w.indexOf('ไม่') === 0; })) { k = 0; }
      return { roles: R, pick: k };
    },
    thuuk: function (W, i) {
      var next = W[i + 1] || '', next2 = W[i + 2] || '';
      var R = [
        ['被動「被…」', 'ถูก（＋人）＋動詞，多半是不好的事'],
        ['「便宜」', '談價格時'],
        ['「正確、對」', '例如 ถูกต้อง 正確']
      ];
      var k = 2;
      if (W[i] === 'โดน' || isVerb(next) || ((PRONS.indexOf(next) !== -1 || isNoun(next)) && isVerb(next2))) { k = 0; }
      if (W.indexOf('ราคา') !== -1 || W.indexOf('บาท') !== -1) { k = 1; }
      if (next === 'ต้อง' || W[i] === 'ถูกต้อง') { k = 2; }
      return { roles: R, pick: k };
    }
  };

  function tokensCovering(W, t) {
    var joined = W.join(''), pos = joined.indexOf(t), res = [];
    if (pos < 0) { return res; }
    var acc = 0;
    for (var k = 0; k < W.length; k++) {
      var a = acc, b = acc + W[k].length;
      if (b > pos && a < pos + t.length) { res.push(k); }
      acc = b;
    }
    return res;
  }
  function matchPatterns(W, S) {
    var flat = S.replace(/\s+/g, ''), out = [];
    (window.GRAMMAR || []).forEach(function (g) {
      var m = g.m, hits = [], q, p;
      if (m.words) {
        for (q = 0; q < W.length; q++) {
          for (var len = 1; len <= 3 && q + len <= W.length; len++) {
            if (m.words.indexOf(W.slice(q, q + len).join('')) !== -1) {
              for (var z = q; z < q + len; z++) { if (hits.indexOf(z) === -1) { hits.push(z); } }
              break;
            }
          }
          if (m.suffix && hits.indexOf(q) === -1 && m.suffix.some(function (sf) { return W[q].length > sf.length && W[q].slice(-sf.length) === sf; })) { hits.push(q); }
        }
      }
      else if (m.seq) {
        p = 0; var first = -1;
        for (q = 0; q < W.length && p < m.seq.length; q++) { if (W[q] === m.seq[p]) { if (p === 0) { first = q; } p++; } }
        if (p === m.seq.length) { hits.push(first); }
      } else if (m.text) {
        m.text.forEach(function (t) {
          if (!hits.length && flat.indexOf(t) !== -1) {
            hits = tokensCovering(W, t);
            if (!hits.length) { hits.push(0); }
          }
        });
      } else if (m.prefix) {
        for (q = 0; q < W.length; q++) {
          if (m.prefix.some(function (pf) { return W[q].indexOf(pf) === 0 && W[q].length > pf.length; })) { hits.push(q); }
          else if (m.prefix.indexOf(W[q]) !== -1 && W[q + 1]) { hits.push(q); }
        }
      } else if (m.prev) {
        for (q = 0; q < W.length; q++) {
          if (W[q] === m.prev.w && q > 0 && m.prev.list.indexOf(W[q - 1]) !== -1) { hits.push(q); }
          else if (W[q].length > m.prev.w.length && W[q].slice(-m.prev.w.length) === m.prev.w && m.prev.list.indexOf(W[q].slice(0, -m.prev.w.length)) !== -1) { hits.push(q); }
        }
      } else if (m.custom === 'thii') {
        for (q = 0; q < W.length; q++) {
          if (W[q] === 'ที่') { hits.push(q); }
          else if (W[q].indexOf('ที่') === 0 && W[q] !== 'ที่สุด' && W[q].length > 3 &&
            (THII_REASON.indexOf(W[q - 1]) !== -1 || isNum(W[q].slice(3)))) { hits.push(q); }
        }
      } else if (m.custom === 'gaan') {
        for (q = 0; q < W.length; q++) {
          if (['การ', 'ความ'].some(function (pf) { return W[q].indexOf(pf) === 0 && W[q].length > pf.length; })) { hits.push(q); }
          else if ((W[q] === 'การ' || W[q] === 'ความ') && W[q + 1]) { hits.push(q); }
        }
      } else if (m.custom === 'waa') {
        for (q = 0; q < W.length; q++) {
          if (W[q] === 'ว่า' || W[q].indexOf('ว่าแต่') === 0) { hits.push(q); }
          else if (W[q].length > 3 && W[q].slice(-3) === 'ว่า' && WAA_EXCLUDE.indexOf(W[q]) === -1) { hits.push(q); }
        }
      } else if (m.custom === 'clf') {
        for (q = 1; q < W.length; q++) { if (CLF.indexOf(W[q]) !== -1 && isNum(W[q - 1])) { hits.push(q); } }
      } else if (m.custom === 'yaang') {
        for (q = 0; q < W.length; q++) {
          var wq = W[q];
          if (wq.indexOf('อย่าง') === 0 && wq.length > 5 && ['อย่างไร', 'อย่างไรก็ตาม', 'อย่างไรก็ดี', 'อย่างนั้น', 'อย่างนี้'].indexOf(wq) === -1) { hits.push(q); }
          else if (wq === 'อย่าง' && W[q + 1] && (isAdj(W[q + 1]) || W[q + 1] === 'เป็น' || ['ต่อเนื่อง', 'รวดเร็ว', 'ทางการ', 'มาก', 'ยิ่ง'].indexOf(W[q + 1]) !== -1)) { hits.push(q); }
        }
      } else if (m.all) {
        if (m.all.every(function (t) { return flat.indexOf(t) !== -1; })) {
          m.all.forEach(function (t) { tokensCovering(W, t).forEach(function (k) { if (hits.indexOf(k) === -1) { hits.push(k); } }); });
          if (!hits.length) { hits.push(0); }
        }
      } else if (m.custom === 'naa') {
        for (q = 0; q < W.length; q++) {
          if (W[q].indexOf('น่า') === 0 && W[q].length > 3 && ['น่าจะ', 'น่ะ'].indexOf(W[q]) === -1) { hits.push(q); }
          else if (W[q] === 'น่า' && W[q + 1] && W[q + 1] !== 'จะ') { hits.push(q); hits.push(q + 1); }
        }
      } else if (m.custom === 'an') {
        for (q = 0; q < W.length; q++) {
          if (['อันดี', 'อันเนื่องมาจาก', 'อันเป็น', 'อันได้แก่', 'อันเนื่อง'].indexOf(W[q]) !== -1) { hits.push(q); }
          else if (W[q] === 'อัน' && q > 0 && W[q + 1] && ['นี้', 'นั้น', 'ไหน', 'ละ', 'ที่'].indexOf(W[q + 1]) === -1 && !isNum(W[q - 1]) &&
            (isAdj(W[q + 1]) || isVerb(W[q + 1]) || W[q + 1] === 'ดี' || W[q + 1].indexOf('เนื่อง') === 0)) { hits.push(q); }
        }
      } else if (m.custom === 'paipai') {
        for (q = 1; q < W.length; q++) {
          if (W[q] !== 'ไป') { continue; }
          for (var r2 = q + 2; r2 <= q + 3 && r2 < W.length; r2++) {
            if (W[r2] === 'ไป') { for (var z2 = q - 1; z2 <= r2; z2++) { hits.push(z2); } break; }
          }
          if (hits.length) { break; }
        }
      } else if (m.custom === 'gamlang') {
        for (q = 0; q < W.length; q++) {
          if (W[q] === 'กำลัง' && (isVerb(W[q + 1]) || W[q + 1] === 'จะ' || W.indexOf('อยู่', q + 1) !== -1)) { hits.push(q); }
        }
      }
      if (hits.length) { out.push({ g: g, hits: hits }); }
    });
    return out;
  }

  function romOf(text) {
    if (!DICT) { return ''; }
    return segment(text).filter(function (x) { return x.w; }).map(function (x) {
      var e = DICT[x.t]; return e && e[0][1] ? e[0][1] : x.t;
    }).join(' ');
  }

  /* 回傳兩部分：mine＝你點的詞的句型（不受程度限制）；others＝同一句其他句型（依設定的程度篩選，預設收起） */
  function buildGrammarSection(seg) {
    var range = sentenceAround(seg.i);
    var inRange = segs.filter(function (x) { return x.w && x.i >= range[0] && x.i < range[1]; });
    var W = inRange.map(function (x) { return x.t; });
    var ti = inRange.indexOf(seg);
    var S = state.text.slice(range[0], range[1]);
    var found = matchPatterns(W, S);
    found.forEach(function (f) {
      f.mine = f.hits.indexOf(ti) !== -1 || (gramFocus && f.g.id === gramFocus);
      f.focus = !!(gramFocus && f.g.id === gramFocus);
      f.near = f.mine ? ti : f.hits[0];
    });
    var cap = level === 'all' ? 9 : LV_ORDER[level];
    var mine = found.filter(function (f) { return f.mine; });
    mine.sort(function (x, y) { return (y.focus ? 1 : 0) - (x.focus ? 1 : 0); });
    var hasFocus = mine.some(function (f) { return f.focus; });
    var others = found.filter(function (f) { return !f.mine && LV_ORDER[f.g.lv] <= cap; });
    others.sort(function (x, y) {
      function d(f) { return level === 'all' ? LV_ORDER[f.g.lv] : (LV_ORDER[f.g.lv] === cap ? 0 : cap - LV_ORDER[f.g.lv]); }
      return d(x) - d(y) || x.near - y.near;
    });
    var out = { mine: null, others: null };
    if (mine.length) {
      var sec = document.createElement('div'); sec.className = 'sec';
      var lab = document.createElement('div'); lab.className = 'sl2'; lab.textContent = '句型說明';
      sec.appendChild(lab);
      if (hasFocus) { sec.classList.add('gfocus'); }
      mine.forEach(function (f, n) { sec.appendChild(grammarCard(f, W, n === 0, inRange, false)); });
      out.mine = sec;
    }
    if (others.length) {
      var det = document.createElement('details'); det.className = 'sec fold';
      var sum = document.createElement('summary'); sum.textContent = '這句的其他句型（' + others.length + '）';
      det.appendChild(sum);
      var list = document.createElement('div'); list.className = 'glist';
      others.forEach(function (f) { list.appendChild(grammarCard(f, W, false, inRange, true)); });
      det.appendChild(list);
      out.others = det;
    }
    return out;
  }

  /* 句型用到的詞在文章裡的位置（相鄰的併成一段） */
  function grammarRanges(f, inRange) {
    var segsHit = f.hits.map(function (h) { return inRange[h]; }).filter(Boolean).sort(function (a, b) { return a.i - b.i; }), out = [];
    segsHit.forEach(function (x) {
      var last = out[out.length - 1];
      if (last && x.i <= last[1] + 1) { last[1] = Math.max(last[1], x.i + x.n); } else { out.push([x.i, x.i + x.n]); }
    });
    return out;
  }
  /* 點「這句的其他句型」裡的一個：把那個句型的詞圈起來，查詞視窗換成那個句型的詳細說明 */
  function focusGrammar(f, inRange) {
    var first = inRange[Math.min.apply(null, f.hits)];
    if (!first) { return; }
    var rs = grammarRanges(f, inRange);
    gramFocus = f.g.id;
    tapSel = null;
    showPop(first);
    gramFocus = null;
    gramSel = rs;
    renderText();
    $('pop').scrollTop = 0;
  }
  function grammarCard(f, W, open, inRange, isOther) {
    var g = f.g;
    var d = document.createElement('details'); d.className = 'gcard'; if (open) { d.open = true; }
    var s = document.createElement('summary');
    if (inRange && isOther) {
      s.addEventListener('click', function (ev) { ev.preventDefault(); focusGrammar(f, inRange); });
    } else if (inRange) {
      d.addEventListener('toggle', function () { gramSel = d.open ? grammarRanges(f, inRange) : null; renderText(); });
      if (open && f.focus) { /* 剛換過來的句型：圈選已經由 focusGrammar 處理 */ }
    }
    var nm = document.createElement('span'); nm.className = 'gname'; nm.lang = 'th'; nm.textContent = g.name;
    var zh = document.createElement('span'); zh.className = 'gzh'; zh.textContent = g.zh;
    var bd = document.createElement('span'); bd.className = 'gbadge lv-' + g.lv; bd.textContent = LV_NAME[g.lv];
    s.appendChild(nm); s.appendChild(zh); s.appendChild(bd);
    d.appendChild(s);
    var body = document.createElement('div'); body.className = 'gbody';
    if (g.roles && ROLES[g.roles]) {
      var r = ROLES[g.roles](W, f.near);
      var guess = document.createElement('div'); guess.className = 'gguess';
      guess.appendChild(document.createTextNode('在這句裡可能是：'));
      var b = document.createElement('b'); b.textContent = r.roles[r.pick][0]; guess.appendChild(b);
      guess.appendChild(document.createTextNode('（' + r.roles[r.pick][1] + '）'));
      body.appendChild(guess);
      var other = document.createElement('ul'); other.className = 'groles';
      r.roles.forEach(function (x, k) { if (k !== r.pick) { var li = document.createElement('li'); li.textContent = x[0] + '：' + x[1]; other.appendChild(li); } });
      var ol = document.createElement('div'); ol.className = 'sl2'; ol.textContent = '其他可能的用法：';
      body.appendChild(ol); body.appendChild(other);
      var note = document.createElement('div'); note.className = 'sl2'; note.textContent = '這是依前後文自動推測，不一定正確；不確定時用下方的「問 AI」。';
      body.appendChild(note);
    }
    var use = document.createElement('p'); use.className = 'guse'; use.textContent = g.use; body.appendChild(use);
    (g.ex || []).forEach(function (e) {
      var ex = document.createElement('div'); ex.className = 'gex';
      var th = document.createElement('div'); th.className = 'gth'; th.lang = 'th'; th.textContent = e[0];
      var play = document.createElement('button'); play.type = 'button'; play.className = 'gplay'; play.textContent = '▶'; play.setAttribute('aria-label', '朗讀例句');
      play.addEventListener('click', function (ev) { ev.preventDefault(); speak(e[0]); });
      var row = document.createElement('div'); row.className = 'gexrow'; row.appendChild(play); row.appendChild(th);
      ex.appendChild(row);
      if (showRom) { var rm = document.createElement('div'); rm.className = 'grom'; rm.textContent = romOf(e[0]); ex.appendChild(rm); }
      var zt = document.createElement('div'); zt.className = 'gzt'; zt.textContent = e[1]; ex.appendChild(zt);
      body.appendChild(ex);
    });
    if (g.sim && g.sim.length) {
      var sl = document.createElement('div'); sl.className = 'sl2'; sl.textContent = '相似或相關說法：'; body.appendChild(sl);
      var ul = document.createElement('ul'); ul.className = 'gsim';
      g.sim.forEach(function (x) {
        var li = document.createElement('li');
        var t = document.createElement('span'); t.lang = 'th'; t.className = 'gsimth'; t.textContent = x[0];
        li.appendChild(t); li.appendChild(document.createTextNode('：' + x[1])); ul.appendChild(li);
      });
      body.appendChild(ul);
    }
    d.appendChild(body);
    return d;
  }

  /* 自我檢查：每個句型都要能比對到自己的例句 */
  window.__grammarSelfTest = function () {
    var fails = [];
    (window.GRAMMAR || []).forEach(function (g) {
      (g.ex || []).forEach(function (e) {
        var W = segment(e[0]).filter(function (x) { return x.w; }).map(function (x) { return x.t; });
        var ok = matchPatterns(W, e[0]).some(function (f) { return f.g.id === g.id; });
        if (!ok) { fails.push(g.id + '：' + e[0] + ' → ' + W.join('|')); }
      });
    });
    var ids = {}, dup = [];
    (window.GRAMMAR || []).forEach(function (g) { if (ids[g.id]) { dup.push(g.id); } ids[g.id] = 1; });
    return { total: (window.GRAMMAR || []).length, fails: fails, duplicates: dup };
  };
