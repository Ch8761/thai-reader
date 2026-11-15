  /* ====== 1.36：辨識結果自動校正、手動修改文字、查不到的字加虛線、補充字典（另一個檔案）====== */

  /* ---- 補充字典：外來語、菜名、地名（放在 dict2.txt，打開 App 後在背景下載，不佔主程式）---- */
  var dict2 = { n: 0, ready: false };
  function dict2Add(txt) {
    if (!DICT) { return 0; }
    var n = 0;
    txt.split('\n').forEach(function (line) {
      if (!line || line.charAt(0) === '#') { return; }
      var p = line.split('|'); if (p.length < 3 || !p[0]) { return; }
      var w = p[0].trim(), plus = w.charAt(0) === '+';
      if (plus) {
        /* 字典本來就有、只是沒有中文：補上中文 */
        w = w.slice(1); var e0 = Object.prototype.hasOwnProperty.call(DICT, w) && DICT[w][0];
        if (e0 && !(e0[4] && e0[4][0]) && p[2]) { e0[4] = [p[2]]; n++; }
        return;
      }
      if (Object.prototype.hasOwnProperty.call(DICT, w)) { return; }
      DICT[w] = [[(p[4] || 'noun').trim(), p[1] || '', '', [p[3] || ''], [p[2] || ''], 2]]; n++;
    });
    return n;
  }
  function dict2Load() {
    if (dict2.ready || !DICT || typeof fetch !== 'function') { return; }
    fetch('dict2.txt').then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.text(); }).then(function (t) {
      dict2.n = dict2Add(t); dict2.ready = true;
      if (dict2.n) {
        unkCache = null;
        try { if (state.text) { segs = segment(state.text); renderText(); } } catch (err) {}
      }
    }).catch(function () {});
  }
  setTimeout(dict2Load, 600);

  /* ---- 辨識結果自動校正：拼不出詞的字，試「辨識常認錯的字母」換回去，換了以後是常用詞才採用 ---- */
  var OG_PAIRS = [['ธ', 'ร'], ['อ', 'ว'], ['จ', 'ง'], ['บ', 'ป'], ['ผ', 'พ'], ['ฝ', 'ฟ'], ['ค', 'ด'], ['ด', 'ต'], ['ค', 'ต'], ['ถ', 'ภ'], ['ม', 'น'], ['ช', 'ซ'], ['ข', 'ช'], ['ล', 'ส'], ['ท', 'ห'], ['ฎ', 'ฏ'], ['ก', 'ถ'], ['ิ', 'ี'], ['ึ', 'ื'], ['ิ', 'ึ'], ['ี', 'ื'], ['า', 'ำ']];
  var OG_MAP = null, OG_TONE = ['่', '้', '์', '็'];
  function ogMap() {
    if (OG_MAP) { return OG_MAP; }
    OG_MAP = {};
    OG_PAIRS.forEach(function (p) { (OG_MAP[p[0]] = OG_MAP[p[0]] || []).push(p[1]); (OG_MAP[p[1]] = OG_MAP[p[1]] || []).push(p[0]); });
    return OG_MAP;
  }
  /* 候選字和「可信度」：補回掉了的小符號最常見（1），換一個長得像的字母次之（2） */
  function ogVariants(w) {
    var M = ogMap(), out = [], i, k;
    for (i = 0; i < w.length; i++) {
      var alts = M[w.charAt(i)] || [];
      for (k = 0; k < alts.length; k++) { out.push([w.slice(0, i) + alts[k] + w.slice(i + 1), 2]); }
      if (/[ก-ฮิ-ูั]/.test(w.charAt(i)) && !/[่-์็]/.test(w.charAt(i + 1) || '')) { for (k = 0; k < OG_TONE.length; k++) { out.push([w.slice(0, i + 1) + OG_TONE[k] + w.slice(i + 1), 1]); } }
    }
    return out;
  }
  function ogBest(w) {
    if (!rrInit()) { return null; }
    var best = null, bs = 1e12, second = 1e12, seen = {};
    ogVariants(w).forEach(function (cw) {
      var c = cw[0]; if (seen[c] || c === w) { return; } seen[c] = 1;
      if (!rsHas(c)) { return; }
      var r = rrRank[c] || (c.length >= 6 ? 4000 : 0); if (!r || r > 4000) { return; }
      var sc = r * cw[1];
      if (sc < bs) { second = bs; bs = sc; best = c; } else if (sc < second) { second = sc; }
    });
    /* 有兩個差不多可能的候選就不猜 */
    return best && (second === 1e12 || bs * 2.5 < second) ? best : null;
  }
  function ogThai(x) { return x && x.w && /^[ก-๎]+$/.test(x.t); }
  function ogNamed(t) { return NAMES[t] || FAMILY[t] || PLACES[t] || (typeof GAZ !== 'undefined' && GAZ[t]); }
  /* 可疑：拼不出詞，或是落單的一個子音（多半是一個詞被認錯後切碎了） */
  function ogSuspect(x) { return ogThai(x) && !ogNamed(x.t) && ((x.t.length >= 2 && !known(x.t)) || /^[ก-ฮเ-ไ]$/.test(x.t)); }
  function nbOk(nb, edge, before) {
    if (!ogThai(nb)) { return true; }
    if (before ? nb.i + nb.n !== edge.i : edge.i + edge.n !== nb.i) { return true; }
    return !!rrRank[nb.t] && nb.t.length >= 2;
  }
  function ocrGuess(t) {
    if (!DICT || !/[ก-๎]/.test(t)) { return { t: t, n: 0 }; }
    var toks = segment(t), outA = toks.map(function (x) { return x.t; }), n = 0, i = 0, lock = 0;
    function join(a, b) {
      var s = '';
      for (var k = a; k <= b; k++) { if (!ogThai(toks[k]) || (k > a && toks[k].i !== toks[k - 1].i + toks[k - 1].n)) { return null; } s += toks[k].t; }
      return s.length >= 3 && s.length <= 14 ? s : null;
    }
    while (i < toks.length) {
      if (!ogSuspect(toks[i])) { i++; continue; }
      /* 從最長的組合試起：這個可疑的字加上前後共最多四段（前面已經改過的不再動） */
      var done = false;
      for (var size = 4; size >= 1 && !done; size--) {
        for (var a = i - (size - 1); a <= i && !done; a++) {
          var b = a + size - 1;
          if (a < lock || b >= toks.length) { continue; }
          if (size === 1 && toks[i].t.length < 3) { continue; }
          var s = join(a, b); if (!s) { continue; }
          var fix = ogBest(s);
          /* 前後緊接著的詞要是常用詞才猜；旁邊是少見的音節，多半是外國名字或品牌的一部分 */
          if (fix && !(nbOk(toks[a - 1], toks[a], true) && nbOk(toks[b + 1], toks[b], false))) { fix = null; }
          /* 前後都是空白的單獨一段（多半是名字），沒有上下文可以判斷，不猜 */
          if (fix && !((ogThai(toks[a - 1]) && toks[a - 1].i + toks[a - 1].n === toks[a].i) || (ogThai(toks[b + 1]) && toks[b].i + toks[b].n === toks[b + 1].i))) { fix = null; }
          /* 有「์」的多半是音譯的外來語，不猜 */
          if (fix && /์/.test(s)) { fix = null; }
          if (fix) { for (var k = a; k <= b; k++) { outA[k] = ''; } outA[a] = fix; n++; lock = b + 1; i = b + 1; done = true; }
        }
      }
      if (!done) { i++; }
    }
    return { t: outA.join(''), n: n };
  }
  var _ocrFixText44 = ocrFixText;
  ocrFixText = function (t) {
    var f = _ocrFixText44(t), g;
    try { g = ocrGuess(f.t); } catch (err) { g = { t: f.t, n: 0 }; }
    return { t: g.t, n: f.n + g.n };
  };

  /* ---- 查不到的字：淡淡的虛線（設定可以關）---- */
  var UNK_KEY = 'thai-show-unk', unkCache = null;
  function unkOn() { try { return localStorage.getItem(UNK_KEY) !== '0'; } catch (err) { return true; } }
  function unkRanges() {
    if (unkCache && unkCache.text === state.text && unkCache.segs === segs && unkCache.dict === DICT && unkCache.n === dict2.n) { return unkCache.list; }
    var list = [];
    if (DICT && segs && segs.length) {
      segs.forEach(function (g) {
        if (!g.w || g.gz || !/^[ก-๎]{2,}$/.test(g.t) || known(g.t)) { return; }
        if (NAMES[g.t] || FAMILY[g.t] || PLACES[g.t]) { return; }
        list.push([g.i, g.i + g.n]);
      });
    }
    unkCache = { text: state.text, segs: segs, dict: DICT, n: dict2.n, list: list };
    return list;
  }
  var _collectMarks44 = collectMarks;
  collectMarks = function (preview) {
    var marks = _collectMarks44(preview);
    if (unkOn()) {
      var ents = [];
      marks.forEach(function (m) { if (/^ent /.test(m.c)) { ents.push(m); } });
      unkRanges().forEach(function (r) {
        for (var k = 0; k < ents.length; k++) { if (r[0] < ents[k].e && r[1] > ents[k].s) { return; } }
        marks.push({ s: r[0], e: r[1], c: 'unk' });
      });
    }
    return marks;
  };
  (function () {
    var g = $('unkGroup'); if (!g) { return; }
    function draw() { segButtons(g, [['1', L2('標示', 'Show')], ['0', L2('不標示', 'Hide')]], unkOn() ? '1' : '0', function (v) { try { if (v === '0') { localStorage.setItem(UNK_KEY, '0'); } else { localStorage.removeItem(UNK_KEY); } } catch (err) {} draw(); try { renderText(); } catch (err) {} }); }
    draw();
  })();

  /* ---- 手動修改文字 ---- */
  /* 文字變了：螢光筆、註解的位置跟著移 */
  function shiftMarks(pos, oldLen, newLen) {
    var d = newLen - oldLen, end = pos + oldLen;
    function mv(a) {
      if (a[1] <= pos) { return a; }
      if (a[0] >= end) { a[0] += d; a[1] += d; return a; }
      if (a[0] >= pos && a[1] <= end) { return null; }
      a[0] = Math.min(a[0], pos); a[1] = a[1] >= end ? a[1] + d : pos + newLen;
      return a[1] > a[0] ? a : null;
    }
    state.hl = state.hl.filter(function (r) { return mv(r); });
    state.boxes.forEach(function (b) { if (b.a) { if (!mv(b.a)) { b.a = null; } } });
  }
  function editSheet(title, value, multi, hint, onSave) {
    var dlg = $('setHelp'); if (!dlg) { return; }
    $('shTitle').textContent = title;
    var body = $('shBody'); body.replaceChildren();
    if (hint) { body.appendChild(el('p', 'edhint', hint)); }
    var inp = document.createElement(multi ? 'textarea' : 'input');
    if (!multi) { inp.type = 'text'; }
    inp.className = 'edbox' + (multi ? ' multi' : ''); inp.value = value; inp.setAttribute('lang', 'th'); inp.setAttribute('aria-label', title);
    inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('autocorrect', 'off'); inp.spellcheck = false;
    body.appendChild(inp);
    var row = el('div', 'btns edbtns'), okb = el('button', 'primary', '儲存'), cb = el('button', '', '取消');
    okb.type = 'button'; cb.type = 'button';
    okb.addEventListener('click', function () { var v = inp.value.replace(/\r/g, ''); dlg.hidden = true; if (v !== value) { onSave(v); } });
    cb.addEventListener('click', function () { dlg.hidden = true; });
    row.appendChild(okb); row.appendChild(cb); body.appendChild(row);
    dlg.hidden = false;
    setTimeout(function () { try { inp.focus(); } catch (err) {} }, 60);
  }
  /* 文字文件（貼上的文字、網址文章、影片字幕）：整篇打開來改 */
  function editTextDoc() {
    if (pdf || !state.src || state.src.type !== 'text') { return; }
    var id = state.src.id, old = state.text;
    editSheet('修改文字', old, true, '可以直接改錯字、補上漏掉的字，或刪掉多餘的行。螢光筆和註解會跟著移到新的位置。', function (v) {
      if (!v.trim()) { return; }
      var pre = 0, mx = Math.min(old.length, v.length);
      while (pre < mx && old.charCodeAt(pre) === v.charCodeAt(pre)) { pre++; }
      var suf = 0;
      while (suf < mx - pre && old.charCodeAt(old.length - 1 - suf) === v.charCodeAt(v.length - 1 - suf)) { suf++; }
      shiftMarks(pre, old.length - pre - suf, v.length - pre - suf);
      state.text = v; segs = segment(v); tapSel = null; history = []; redoStack = [];
      var d = docById(id); if (d) { d.size = v.length; saveLib(); }
      try { hidePop(); } catch (err) {}
      renderAllNotes(); save();
      try { pdfInfo.status = '目前顯示：' + (d ? d.name : '') + '（文字，' + v.length + ' 字）'; refreshTranslateLink(); syncDocView(); } catch (err) {}
    });
  }
  /* 辨識出來的頁面（照片、掃描的 PDF）：點到的那一段字打開來改 */
  function ocrSpanAt(i) {
    if (!pdf) { return null; }
    for (var k = 0; k < pdf.tl.length; k++) { var sp = pdf.tl[k]; if (!sp.sep && sp.ocr && i >= sp.o && i < sp.o + sp.t.length) { return sp; } }
    return null;
  }
  function editOcrSpan(sp) {
    var id = pdf.id, page = sp.page, oi = sp.oi, old = sp.t, pos = sp.o;
    editSheet('修正辨識的字', old, false, '這一段是從畫面上辨識出來的。改成正確的字後按「儲存」；整段都是雜訊的話，清空再儲存就會拿掉。', function (v) {
      v = v.replace(/\n/g, ' ').trim();
      ocrLoad(id).then(function (store) {
        var items = store && store.pages && store.pages[page];
        if (!items || !items[oi] || items[oi][4] !== old) { throw new Error('mismatch'); }
        items[oi][4] = v;
        return ocrSave(id, store);
      }).then(function () {
        /* 清空的話，前後的分隔也會變，交給重新打開時重排；筆記位置先照字數移 */
        if (v) { shiftMarks(pos, old.length, v.length); state.text = state.text.slice(0, pos) + v + state.text.slice(pos + old.length); save(); }
        hidePop(); openDoc(id);
      }).catch(function () { setDocStatus('這一段沒有改成功，請重新打開文件再試一次。'); });
    });
  }
  function syncEditBtn() { var b = $('editText'); if (b) { b.hidden = !!pdf || !(state.src && state.src.type === 'text'); } }
  if ($('editText')) { $('editText').addEventListener('click', editTextDoc); }
  var _syncDocView44 = syncDocView;
  syncDocView = function () { _syncDocView44.apply(this, arguments); syncEditBtn(); };
  syncEditBtn();

  var _showPop44 = showPop;
  showPop = function (seg) {
    _showPop44.apply(this, arguments);
    try {
      var sp = seg && ocrSpanAt(seg.i), pp = $('pop');
      if (sp && !pp.hidden) {
        var b = el('button', 'credit crlink ocrfixlink', '修正辨識的字'); b.type = 'button';
        b.addEventListener('click', function () { editOcrSpan(sp); });
        var hd = pp.querySelector('.head');
        if (hd && hd.nextSibling) { pp.insertBefore(b, hd.nextSibling); } else { pp.appendChild(b); }
      }
    } catch (err) {}
  };

