  /* ---- 間隔重複：FSRS（Free Spaced Repetition Scheduler，Anki 也在用的開放演算法）----
     每張卡記兩個數字：穩定度 s（大約「幾天後還有九成機會記得」）和難度 d（1–10）。
     按「忘了／有點難／記得／很簡單」時，依現在大概還記得多少（R）更新 s 和 d，下次複習就排在 s 天後。
     參數用 FSRS-5 的預設值；c.fs = { s, d, t（上次複習的時間） }。舊卡第一次複習時用原本的間隔換算。 */
  var FSRS_W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
  var FSRS_DECAY = -0.5, FSRS_FACTOR = 19 / 81, FSRS_RETAIN = 0.9, FSRS_MAX = 36500;
  function fsClamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function fsD0(G) { return fsClamp(FSRS_W[4] - Math.exp(FSRS_W[5] * (G - 1)) + 1, 1, 10); }
  function fsR(t, s) { return Math.pow(1 + FSRS_FACTOR * t / s, FSRS_DECAY); }
  function fsIvl(s) { return fsClamp(Math.round(s / FSRS_FACTOR * (Math.pow(FSRS_RETAIN, 1 / FSRS_DECAY) - 1)), 1, FSRS_MAX); }
  function srsInit(c) {
    if (typeof c.ivl !== 'number') { c.ivl = c.box > 1 ? BOX_DAYS[c.box - 1] : 0; }
    if (typeof c.ease !== 'number') { c.ease = 2.5; }
    if (typeof c.lapses !== 'number') { c.lapses = 0; }
    /* 舊卡：用原本的間隔當穩定度、用 ease 換算難度 */
    if (!c.fs && (c.seen || c.ivl > 0)) {
      c.fs = { s: Math.max(0.5, c.ivl || 0.5), d: fsClamp(10 - (c.ease - 1.3) * 4.5, 1, 10), t: c.last || (c.due ? c.due - (c.ivl || 0) * DAY : Date.now()) };
    }
    return c;
  }
  /* 按了某個鈕之後的新狀態（不改卡片），g：0 忘了、1 有點難、2 記得、3 很簡單 */
  function fsNext(c, g, now) {
    srsInit(c); now = now || Date.now();
    var G = g + 1, f = c.fs;
    if (!f) { return { s: FSRS_W[G - 1], d: fsD0(G) }; }
    var t = Math.max(0, (now - f.t) / DAY), s = f.s, d = f.d, s2;
    var d2 = d - FSRS_W[6] * (G - 3) * (10 - d) / 9;
    d2 = fsClamp(FSRS_W[7] * fsD0(4) + (1 - FSRS_W[7]) * d2, 1, 10);
    if (t < 1) {
      /* 同一天再複習一次（例如剛剛按了「忘了」） */
      s2 = s * Math.exp(FSRS_W[17] * (G - 3 + FSRS_W[18]));
    } else if (G === 1) {
      var r = fsR(t, s);
      s2 = Math.min(s, FSRS_W[11] * Math.pow(d, -FSRS_W[12]) * (Math.pow(s + 1, FSRS_W[13]) - 1) * Math.exp(FSRS_W[14] * (1 - r)));
    } else {
      var r2 = fsR(t, s);
      s2 = s * (Math.exp(FSRS_W[8]) * (11 - d) * Math.pow(s, -FSRS_W[9]) * (Math.exp(FSRS_W[10] * (1 - r2)) - 1) * (G === 2 ? FSRS_W[15] : 1) * (G === 4 ? FSRS_W[16] : 1) + 1);
    }
    return { s: fsClamp(s2, 0.1, FSRS_MAX), d: d2 };
  }
  function ivlToBox(d) { return d <= 0 ? 1 : d <= 2 ? 2 : d <= 6 ? 3 : d <= 20 ? 4 : 5; }
  /* 四個鈕各自的下次間隔（天）：忘了＝今天；其餘依 FSRS，並保證 有點難 ≤ 記得 < 很簡單 */
  function fsIvls(c) {
    var h = fsIvl(fsNext(c, 1).s), g = fsIvl(fsNext(c, 2).s), e = fsIvl(fsNext(c, 3).s);
    h = Math.min(h, g); g = Math.max(g, h + (c.fs ? 1 : 0)); e = Math.max(e, g + 1);
    return [0, h, g, e];
  }
  function nextIvl(c, grade) { return fsIvls(c)[grade]; }
  function ivlText(d) { return d <= 0 ? '今天' : d < 30 ? d + ' 天' : d < 365 ? Math.round(d / 30) + ' 個月' : Math.round(d / 365 * 10) / 10 + ' 年'; }
  /* 現在大概還記得的機率（0–1），還沒複習過的卡回傳 null */
  function fsRecall(c) { srsInit(c); return c.fs ? fsR(Math.max(0, (Date.now() - c.fs.t) / DAY), c.fs.s) : null; }
  function grade(c, g) {
    srsInit(c);
    var d = nextIvl(c, g), n = fsNext(c, g);
    c.fs = { s: Math.round(n.s * 1000) / 1000, d: Math.round(n.d * 1000) / 1000, t: Date.now() };
    if (g === 0) { c.lapses++; }
    c.ivl = d; c.box = ivlToBox(d); c.due = today0() + d * DAY; c.seen = (c.seen || 0) + 1; c.last = Date.now();
    if (g > 0) { c.right = (c.right || 0) + 1; }
  }
