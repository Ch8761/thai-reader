  /* ---------- 聲調學習模式：每個音節的子音類別、活／死音節、聲調符號，推出聲調 ---------- */
  var TONE_KEY = 'thai-tone-mode', TONE_URL = 'https://ch8761.github.io/thai-reader/tones.json';
  var toneMode = false;
  try { toneMode = localStorage.getItem(TONE_KEY) === '1'; } catch (err) {}
  var TONES = null, tonesLoading = null;
  var TONE_NAME = { M: '中平聲', L: '低聲', F: '降聲', H: '高聲', R: '升聲' };
  var TONE_TH = { M: 'สามัญ', L: 'เอก', F: 'โท', H: 'ตรี', R: 'จัตวา' };
  var TONE_PATH = { M: 'M3 9 L25 9', L: 'M3 10 L25 14', F: 'M3 9 Q12 1 25 15', H: 'M3 8 Q14 9 25 2', R: 'M3 11 Q12 17 25 3' };
  var CLS_NAME = { m: '中子音', h: '高子音', l: '低子音' };
  var LST_NAME = { L: '活音節', S: '死音節（短母音）', D: '死音節（長母音＋k/p/t 尾音）' };
  var MARK_NAME = { 1: 'ไม้เอก ◌่', 2: 'ไม้โท ◌้', 3: 'ไม้ตรี ◌๊', 4: 'ไม้จัตวา ◌๋' };
  function loadTones() {
    if (TONES) { return Promise.resolve(TONES); }
    if (tonesLoading) { return tonesLoading; }
    tonesLoading = fetch(TONE_URL).then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.json(); }).then(function (d) { TONES = d; return d; }, function (e) { tonesLoading = null; throw e; });
    return tonesLoading;
  }
  function toneRule(c, lst, mk) {
    if (mk === 1) { return c === 'l' ? 'F' : 'L'; }
    if (mk === 2) { return c === 'l' ? 'H' : 'F'; }
    if (mk === 3) { return 'H'; }
    if (mk === 4) { return 'R'; }
    if (lst === 'L') { return c === 'h' ? 'R' : 'M'; }
    if (c === 'l') { return lst === 'S' ? 'H' : 'F'; }
    return 'L';
  }
  /* 一個詞的音節資料：[{ p 音節, i 起首子音, c 類別, s 活死, m 聲調符號, t 實際聲調, r 規則推出的聲調, lead 有沒有被帶 }] */
  function toneInfo(w) {
    if (!TONES || !w) { return null; }
    var raw = TONES[w] || (typeof dictBase === 'function' && dictBase(w) && TONES[dictBase(w)]);
    if (!raw) { return null; }
    var rom = DICT && DICT[w] && DICT[w][0][1] ? String(DICT[w][0][1]).split('-') : [];
    return raw.split('|').map(function (x, k) {
      var a = x.split('~'), code = a[2] || '';
      var o = { p: a[0], i: a[1], c: code[0], s: code[1], m: Number(code[2]) || 0, t: code[3], lead: code.indexOf('*') >= 0, rom: rom[k] || '' };
      o.r = toneRule(o.c, o.s, o.m);
      return o;
    });
  }
  function toneSvg(t) { return '<svg class="tcurve" viewBox="0 0 28 18" aria-hidden="true"><path d="' + TONE_PATH[t] + '"/></svg>'; }
  function toneWhy(o, prev) {
    var lead = '';
    if (o.lead) {
      if (o.p.indexOf('ห' + o.i) >= 0) { lead = '（ห 不發音，帶著 ' + o.i + ' 照高子音）'; }
      else if (o.p.indexOf('อ' + o.i) >= 0) { lead = '（อ 不發音，帶著 ' + o.i + ' 照中子音）'; }
      else if (prev) { lead = '（前面的 ' + prev.i + ' 帶著它，照' + CLS_NAME[o.c] + '）'; }
    }
    var head = o.i + ' ' + CLS_NAME[o.c] + lead;
    var body = o.m ? '＋' + MARK_NAME[o.m] : '・' + LST_NAME[o.s];
    var s = head + body + ' → ' + TONE_NAME[o.r];
    if (o.r !== o.t) { s += '；實際唸' + TONE_NAME[o.t] + '（例外）'; }
    return s;
  }
  var TONE_TABLE = '<table class="ttable"><thead><tr><th></th><th>活音節</th><th>死・短</th><th>死・長</th><th>่</th><th>้</th><th>๊</th><th>๋</th></tr></thead><tbody>' +
    '<tr><th>中子音</th><td>中平</td><td>低</td><td>低</td><td>低</td><td>降</td><td>高</td><td>升</td></tr>' +
    '<tr><th>高子音</th><td>升</td><td>低</td><td>低</td><td>低</td><td>降</td><td>–</td><td>–</td></tr>' +
    '<tr><th>低子音</th><td>中平</td><td>高</td><td>降</td><td>降</td><td>高</td><td>–</td><td>–</td></tr></tbody></table>' +
    '<p class="tnote">中子音：ก จ ด ต บ ป อ（ฎ ฏ）。高子音：ข ฉ ถ ผ ฝ ศ ษ ส ห（ฃ ฐ）。其餘是低子音。<br>活音節：長母音結尾，或 ม น ง ย ว 結尾（ำ ใ ไ เา 也算）。死音節：短母音結尾，或 ก ด บ 類的尾音。</p>';
  function buildToneSection(w) {
    var sec = document.createElement('div'); sec.className = 'sec tonesec';
    function fill() {
      sec.replaceChildren();
      var info = toneInfo(w);
      if (!info) { sec.hidden = true; return; }
      var h = document.createElement('div'); h.className = 'sl2'; h.textContent = '聲調'; sec.appendChild(h);
      var row = document.createElement('div'); row.className = 'tsyls';
      info.forEach(function (o) {
        var chip = document.createElement('span'); chip.className = 'tsyl t-' + o.t;
        chip.innerHTML = '<span class="tp" lang="th"></span><span class="tr"></span><span class="tt">' + toneSvg(o.t) + '<b></b></span>';
        chip.querySelector('.tp').textContent = o.p; chip.querySelector('.tr').textContent = o.rom;
        chip.querySelector('b').textContent = TONE_NAME[o.t];
        var cb = document.createElement('span'); cb.className = 'tcls c-' + o.c; cb.textContent = o.i + '・' + CLS_NAME[o.c].slice(0, 1); cb.title = CLS_NAME[o.c];
        chip.appendChild(cb);
        row.appendChild(chip);
      });
      sec.appendChild(row);
      var ul = document.createElement('ul'); ul.className = 'twhy';
      info.forEach(function (o, k) { var li = document.createElement('li'); var b = document.createElement('span'); b.lang = 'th'; b.className = 'twp'; b.textContent = o.p; li.appendChild(b); li.appendChild(document.createTextNode('：' + toneWhy(o, info[k - 1]))); if (o.r !== o.t) { li.className = 'exc'; } ul.appendChild(li); });
      sec.appendChild(ul);
      var det = document.createElement('details'); det.className = 'tdet';
      var sm = document.createElement('summary'); sm.textContent = '看聲調規則表'; det.appendChild(sm);
      var box = document.createElement('div'); box.innerHTML = TONE_TABLE; det.appendChild(box);
      sec.appendChild(det);
    }
    if (TONES) { fill(); } else { sec.textContent = '載入聲調資料…'; loadTones().then(fill, function () { sec.textContent = '聲調資料載入失敗（可能沒有網路）。'; }); }
    return sec;
  }
  function renderToneSetting() {
    var g = $('toneGroup'); if (!g) { return; }
    segButtons(g, [['0', '關'], ['1', '開']], toneMode ? '1' : '0', function (v) {
      toneMode = v === '1'; try { localStorage.setItem(TONE_KEY, toneMode ? '1' : '0'); } catch (err) {}
      if (toneMode) { loadTones().catch(function () {}); }
      renderToneSetting();
    });
  }
  renderToneSetting();
  if (toneMode) { loadTones().catch(function () {}); }
