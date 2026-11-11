  /* ====== 1.27：認得率（約 N%）、每天複習上限 ====== */
  /* 詞頻表：PyThaiNLP 的 Thai National Corpus 與 Thai Textbook Corpus（CC0），交錯合併後依常用程度排好，建置時直接放進頁面，不用上網抓。 */
  var RR_N = { a: 600, b: 1500, c: 2500, d: 4500, all: 4500 };
  var RR_LOOK_KEY = 'thai-lookups', RR_SHOW_KEY = 'thai-rr-show', RR_CAP_KEY = 'thai-rev-cap', RR_EXTRA_KEY = 'thai-rev-extra';
  var rrRank = null, rrLook = null, rrSegr = null, rrMemo = {}, rrMemoN = 0, rrSaveT = 0;
  function rrInit() {
    if (rrRank) { return true; }
    var e = $('freqdata'); if (!e) { return false; }
    rrRank = {}; e.textContent.split(' ').forEach(function (w, i) { if (w) { rrRank[w] = i + 1; } });
    e.textContent = '';
    return true;
  }
  function rrOn() { try { return localStorage.getItem(RR_SHOW_KEY) !== '0'; } catch (err) { return true; } }
  function rrLookMap() {
    if (!rrLook) { rrLook = lsGetJ(RR_LOOK_KEY, {}); if (!rrLook || typeof rrLook !== 'object' || Array.isArray(rrLook)) { rrLook = {}; } }
    return rrLook;
  }
  /* 查詞視窗打開的泰文詞，記下來（只記有哪些字，不記次數；最多留最近 1500 個） */
  function rrNoteLook(seg) {
    if (!seg || !seg.t || !/[ก-ฮ]/.test(seg.t) || seg.t.length > 24) { return; }
    var m = rrLookMap(), d = Math.floor(Date.now() / 86400000);
    if (m[seg.t] === d) { return; }
    m[seg.t] = d; rrMemo = {}; rrMemoN = 0;
    clearTimeout(rrSaveT);
    rrSaveT = setTimeout(function () {
      var ks = Object.keys(m);
      if (ks.length > 1500) { ks.sort(function (a, b) { return m[b] - m[a]; }); var nm = {}; ks.slice(0, 1500).forEach(function (k) { nm[k] = m[k]; }); rrLook = m = nm; }
      lsSetJ(RR_LOOK_KEY, m);
    }, 600);
  }
  function rrMastered() {
    var o = {};
    cards.forEach(function (c) { srsInit(c); if (c.fs && c.fs.s >= 21 && c.w) { o[c.w] = 1; } });
    return o;
  }
  function rrIsName(t) {
    if (NAMES[t] || FAMILY[t] || PLACES[t]) { return true; }
    return !!(typeof DICT !== 'undefined' && DICT && DICT[t] && DICT[t].every(function (x) { return x[0] === 'name'; }));
  }
  function rrTokens(text) {
    if (typeof Intl === 'undefined' || !Intl.Segmenter) { return null; }
    if (!rrSegr) { rrSegr = new Intl.Segmenter('th', { granularity: 'word' }); }
    var out = [];
    Array.from(rrSegr.segment(String(text).slice(0, 12000))).forEach(function (x) { if (x.isWordLike && x.segment.length >= 2 && /[ก-ฮ]/.test(x.segment)) { out.push(x.segment); } });
    return out;
  }
  /* 認得率 = 這篇的泰文詞裡，你大概認得的比例。
     認得：記熟的生字，或「常用字表前 N 名（N 看你選的程度）且沒有被你查過」，或人名、地名。 */
  function rrCompute(text) {
    if (!rrInit() || !text) { return null; }
    var key = level + '|' + text.length + '|' + text.slice(0, 40) + '|' + text.slice(-40);
    if (rrMemo[key]) { return rrMemo[key]; }
    var toks = rrTokens(text); if (!toks || toks.length < 15) { return null; }
    var N = RR_N[level] || RR_N.b, mast = rrMastered(), look = rrLookMap(), known = 0, unk = {};
    toks.forEach(function (t) {
      if (mast[t] || (!look[t] && ((rrRank[t] && rrRank[t] <= N) || rrIsName(t)))) { known++; } else { unk[t] = 1; }
    });
    var r = { rate: Math.round(100 * known / toks.length), n: toks.length, unk: Object.keys(unk).length };
    if (rrMemoN > 60) { rrMemo = {}; rrMemoN = 0; }
    rrMemo[key] = r; rrMemoN++;
    return r;
  }
  function rrPill(rate) {
    var p = el('span', 'rrpill ' + (rate >= 93 ? 'good' : rate >= 80 ? 'mid' : 'hard'), '約 ' + rate + '%');
    p.setAttribute('aria-label', '認得率約 ' + rate + '%');
    return p;
  }
  /* 打開文章時，文章上方的一小條 */
  var rrBox = document.createElement('div'); rrBox.id = 'rrHint'; rrBox.className = 'rrhint'; rrBox.hidden = true;
  rrBox.innerHTML = '<div class="rrrow"><button type="button" class="rrmain" id="rrMain" aria-expanded="false"><span id="rrPillHost"></span><span id="rrTx"></span></button><button type="button" class="rrx" id="rrX"></button></div><div class="rrmore" id="rrMore" hidden></div>';
  $('docSrc').parentNode.insertBefore(rrBox, $('docSrc'));
  $('rrX').textContent = '×'; $('rrX').setAttribute('aria-label', {{rr_close}});
  var rrMore = $('rrMore');
  [{{rr_why1}}, {{rr_why2}}].forEach(function (t) { rrMore.appendChild(el('p', '', t)); });
  $('rrMain').addEventListener('click', function () { rrMore.hidden = !rrMore.hidden; $('rrMain').setAttribute('aria-expanded', String(!rrMore.hidden)); });
  $('rrX').addEventListener('click', function () { rrBox.hidden = true; });
  function rrShow(id) {
    rrBox.hidden = true;
    if (!rrOn() || !state.src || (id && state.src.id !== id) || !state.text) { return false; }
    var r = rrCompute(state.text); if (!r) { return false; }
    var host = $('rrPillHost'); host.replaceChildren(); host.appendChild(rrPill(r.rate));
    $('rrTx').textContent = '認得率・約 ' + r.unk + ' 種詞可能要查';
    rrMore.hidden = true; $('rrMain').setAttribute('aria-expanded', 'false');
    rrBox.hidden = false;
    return true;
  }
  function rrTry(id, n) {
    setTimeout(function () {
      if (!state.src || state.src.id !== id) { return; }
      if (!state.text && n < 2) { rrTry(id, n + 1); return; }
      rrShow(id);
    }, n === 0 ? 500 : 1400);
  }
  var _openDoc2 = openDoc;
  openDoc = function (id) { var r = _openDoc2.apply(this, arguments); rrTry(id, 0); return r; };
  function rrRefresh() { if (curTab === 'doc' && state.src) { rrShow(state.src.id); } else { rrBox.hidden = true; } }

  /* --- 每天複習上限：只先排出一部分到期的卡，其餘明天再出現 --- */
  function revCap() { var v = 20; try { var s = localStorage.getItem(RR_CAP_KEY); if (s !== null) { v = parseInt(s, 10); } } catch (err) {} return isNaN(v) ? 20 : v; }
  function revExtra() { var o = lsGetJ(RR_EXTRA_KEY, {}); return o && o.d === dayKey() ? (o.n || 0) : 0; }
  function dueRaw(all) { var t = today0(); return cards.filter(function (c) { return c.due <= t && (all || inFolder(c)); }); }
  dueCards = function (all) {
    var list = dueRaw(all), cap = revCap();
    if (!cap) { return list; }
    var t = today0(), done = cards.filter(function (c) { return c.last >= t; }).length, left = Math.max(0, cap + revExtra() - done);
    if (list.length <= left) { return list; }
    list.forEach(srsInit);
    list.sort(function (a, b) { return a.due - b.due || a.ivl - b.ivl; });
    return list.slice(0, left);
  };
  function revHeld() { return dueRaw(false).length - dueCards().length; }
  function revMore(n) { lsSetJ(RR_EXTRA_KEY, { d: dayKey(), n: revExtra() + n }); }
  function rrSettings() {
    var g1 = $('revCapGroup'), g2 = $('rrShowGroup');
    if (g1) {
      var cap = String(revCap());
      segButtons(g1, [['10', '10 張'], ['20', '20 張'], ['30', '30 張'], ['50', '50 張'], ['0', {{cap_none}}]], cap, function (v) {
        try { localStorage.setItem(RR_CAP_KEY, v); } catch (err) {}
        rrSettings(); if (typeof renderCards === 'function') { renderCards(); } if (typeof renderHome === 'function') { renderHome(); }
      });
    }
    if (g2) {
      segButtons(g2, [['on', '顯示'], ['off', '不顯示']], rrOn() ? 'on' : 'off', function (v) {
        try { localStorage.setItem(RR_SHOW_KEY, v === 'on' ? '1' : '0'); } catch (err) {}
        rrSettings(); rrRefresh();
      });
    }
  }
  rrSettings();
