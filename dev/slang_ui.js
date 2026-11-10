  /* ---------- 網路用語與拉長的寫法（มากกกก、ค่าาา） ---------- */
  var SLANG_N, SLANG_SET; /* 不給初值：addSlang 可能比這行先執行 */
  function addSlang() {
    SLANG_N = SLANG_N || 0; SLANG_SET = SLANG_SET || {};
    var el = $('slangdata');
    if (!el || !DICT) { return; }
    el.textContent.split('\n').forEach(function (line) {
      if (!line || line.charAt(0) === '#') { return; }
      var p = line.split('|');
      if (p.length < 3) { return; }
      var ent = ['slang', p[1] || '', '', [p[3] || ''], [p[2]], 1];
      DICT[p[0]] = [ent].concat(DICT[p[0]] || []); SLANG_SET[p[0]] = 1;
      SLANG_N++;
    });
    el.textContent = '';
  }
  var ELONG_MAP = { 'ค่า': 'ค่ะ', 'น้า': 'นะ', 'ค้า': 'ค้า', 'จ้า': 'จ้า' };
  function elongCands(w) {
    var out = [];
    [w.replace(/(.)\1{2,}/g, '$1'), w.replace(/(.)\1+/g, '$1'), w.replace(/(.)\1{2,}/g, '$1$1')].forEach(function (x) { if (x !== w && out.indexOf(x) < 0) { out.push(x); } });
    return out;
  }
  /* 拉長的寫法對應到字典裡的哪個詞（找不到就回傳 null） */
  function dictBase(w) {
    if (!DICT || !w || DICT[w] || !/(.)\1/.test(w)) { return null; }
    var cs = elongCands(w);
    for (var i = 0; i < cs.length; i++) {
      if (ELONG_MAP[cs[i]] && DICT[ELONG_MAP[cs[i]]]) { return ELONG_MAP[cs[i]]; }
      if (DICT[cs[i]]) { return cs[i]; }
    }
    return null;
  }
  /* 斷詞程式不認得網路用語和拉長的寫法，常切錯（ฟิ|นมา|กกก）。
     遇到查不到的片段，就連同前後一個詞用字典重新切；切出來要用到網路用語或拉長寫法才採用。 */
  function slThaiSeg(g) { return g && !g.gz && /^[\u0E01-\u0E4E]+$/.test(g.t); }
  function slUnk(g) { return slThaiSeg(g) && !DICT[g.t] && !dictBase(g.t); }
  function dpSplit(t, nOrig) {
    var L = t.length, best = [0], from = [], piece = [];
    for (var k = 1; k <= L; k++) {
      best[k] = Infinity;
      for (var n = 2; n <= Math.min(16, k); n++) {
        var w = t.substr(k - n, n);
        if (best[k - n] + 1 < best[k] && (DICT[w] || dictBase(w))) { best[k] = best[k - n] + 1; from[k] = k - n; piece[k] = w; }
      }
    }
    if (best[L] === Infinity) { return null; }
    var parts = [];
    for (var e = L; e > 0; e = from[e]) { parts.unshift(piece[e]); }
    if (parts.length < nOrig) { return parts; }
    return parts.some(function (w) { return (SLANG_SET && SLANG_SET[w]) || (!DICT[w] && dictBase(w)); }) ? parts : null;
  }
  function splitScripts(out) {
    var res = [];
    out.forEach(function (g) {
      if (g.gz || !/[\u0E01-\u0E4E]/.test(g.t) || !/[0-9A-Za-z]/.test(g.t)) { res.push(g); return; }
      var re = /[\u0E01-\u0E4E]+|[0-9]+|[A-Za-z]+|[^\u0E01-\u0E4E0-9A-Za-z]+/g, m;
      while ((m = re.exec(g.t))) { res.push({ i: g.i + m.index, n: m[0].length, w: /\S/.test(m[0]), t: m[0] }); }
    });
    return res;
  }
  function resegUnknown(out) {
    var res = [], i = 0;
    while (i < out.length) {
      if (!slUnk(out[i])) { res.push(out[i]); i++; continue; }
      var j = i;
      while (j + 1 < out.length && slThaiSeg(out[j + 1]) && out[j].i + out[j].n === out[j + 1].i && (slUnk(out[j + 1]) || /^([\u0E01-\u0E4E])\1*$/.test(out[j + 1].t))) { j++; }
      var p = res[res.length - 1], usePrev = slThaiSeg(p) && p.i + p.n === out[i].i;
      var nx = out[j + 1], useNext = slThaiSeg(nx) && out[j].i + out[j].n === nx.i;
      var s0 = usePrev ? p.i : out[i].i, e0 = useNext ? nx.i + nx.n : out[j].i + out[j].n;
      var segText = (usePrev ? p.t : '') + out.slice(i, j + 1).map(function (x) { return x.t; }).join('') + (useNext ? nx.t : '');
      var parts = dpSplit(segText, (usePrev ? 1 : 0) + (j - i + 1) + (useNext ? 1 : 0));
      if (parts) {
        if (usePrev) { res.pop(); }
        var o = s0;
        parts.forEach(function (w) { res.push({ i: o, n: w.length, w: true, t: w }); o += w.length; });
        i = useNext ? j + 2 : j + 1;
      } else {
        for (var q = i; q <= j; q++) { res.push(out[q]); }
        i = j + 1;
      }
    }
    return res;
  }
  /* 斷詞後把被切開的拉長尾巴（มาก|กก|กก）接回前一個詞 */
  function mergeElong(out) {
    if (!DICT) { return out; }
    var pre = resegUnknown(splitScripts(out));
    var res = [];
    pre.forEach(function (g) {
      var p = res[res.length - 1];
      if (p && !p.gz && p.i + p.n === g.i && /^([\u0E01-\u0E4E])\1*$/.test(g.t)) {
        var ch = g.t.charAt(0), joined = p.t + g.t;
        if (p.t.slice(-1) === ch || dictBase(joined)) {
          var m = { i: p.i, n: p.n + g.n, w: true, t: joined }, q = res[res.length - 2], b = dictBase(joined) || p.t;
          /* 前一個詞＋原形也是一個詞（คิด＋ถึง）就一起接起來 */
          if (q && !q.gz && q.w && q.i + q.n === p.i && DICT[q.t + b]) { res.pop(); m = { i: q.i, n: q.n + m.n, w: true, t: q.t + joined }; }
          res[res.length - 1] = m;
          return;
        }
      }
      res.push(g);
    });
    return res;
  }
