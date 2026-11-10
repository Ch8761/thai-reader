  /* ---------- 生字卡的「聲調」分頁：規則表（點格子看例詞）、子音分類、一步一步推聲調的練習 ---------- */
  var TONE_COLS = [['L', '活音節'], ['S', '死・短'], ['D', '死・長'], ['1', '่'], ['2', '้'], ['3', '๊'], ['4', '๋']];
  var TONE_ROWS = [['m', '中子音'], ['h', '高子音'], ['l', '低子音']];
  var TONE_EX = {
    mL: ['กิน', 'ดี', 'ตา', 'ปลา', 'บิน', 'จาน'], mS: ['จับ', 'ติด', 'ตก', 'เด็ก'], mD: ['บาท', 'ปาก', 'จอด', 'แดด'],
    m1: ['ไก่', 'ป่า', 'ต่อ', 'บ่าย'], m2: ['ได้', 'บ้าน', 'ต้ม', 'ป้า'], m3: ['โต๊ะ', 'จ๊ะ', 'ป๊า'], m4: ['จ๋า', 'เดี๋ยว'],
    hL: ['ขา', 'หมา', 'สวย', 'ขาย', 'ฝน', 'สี'], hS: ['สิบ', 'ขับ', 'ผัก', 'หก'], hD: ['ขาด', 'สอบ', 'ถูก', 'ขวด'],
    h1: ['ข่าว', 'ส่ง', 'ผ่าน', 'ถ่าย'], h2: ['ข้าว', 'ห้อง', 'ถ้า', 'ส้ม'],
    lL: ['มา', 'คน', 'ยาว', 'นอน', 'ลม'], lS: ['รัก', 'นก', 'คิด', 'ลด'], lD: ['มาก', 'ลูก', 'ชอบ', 'เลือด'],
    l1: ['พี่', 'แม่', 'ที่', 'ไม่'], l2: ['น้ำ', 'ร้อน', 'ใช้', 'ม้า']
  };
  var CLS_LETTERS = { m: 'ก จ ด ต บ ป อ ฎ ฏ', h: 'ข ฉ ถ ผ ฝ ศ ษ ส ห ฃ ฐ', l: 'ค ฅ ฆ ง ช ซ ฌ ญ ฑ ฒ ณ ท ธ น พ ฟ ภ ม ย ร ล ว ฬ ฮ' };
  var toneCell = 'mL', tq = null;
  /* 格子裡的聲調（照規則推出來） */
  function cellTone(c, col) { return /\d/.test(col) ? toneRule(c, 'L', Number(col)) : toneRule(c, col, 0); }
  function cellHtml(t) { return '<span class="tcell t-' + t + '">' + toneSvg(t) + '<b>' + TONE_NAME[t].replace('聲', '') + '</b></span>'; }
  /* 規則表：markExtra＝格子能不能點 */
  function toneTableHtml(clickable) {
    var h = '<div class="ttwrap"><table class="ttable' + (clickable ? ' tclick' : '') + '"><thead><tr><th></th>';
    TONE_COLS.forEach(function (c) { h += '<th>' + (/\d/.test(c[0]) ? '<span class="tmk" lang="th">◌' + c[1] + '</span>' : c[1]) + '</th>'; });
    h += '</tr></thead><tbody>';
    TONE_ROWS.forEach(function (r) {
      h += '<tr><th>' + r[1] + '</th>';
      TONE_COLS.forEach(function (c) {
        var key = r[0] + c[0], ok = !(r[0] !== 'm' && (c[0] === '3' || c[0] === '4'));
        if (!ok) { h += '<td class="tna">–</td>'; return; }
        var inner = cellHtml(cellTone(r[0], c[0]));
        h += clickable ? '<td><button type="button" class="tcellbtn" data-cell="' + key + '" aria-pressed="' + (key === toneCell) + '">' + inner + '</button></td>' : '<td>' + inner + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }
  /* 例詞：只留資料和規則一致的（不是例外的）單音節詞 */
  function cellExamples(key) {
    return (TONE_EX[key] || []).map(function (w) { var info = toneInfo(w); return info && info.length === 1 && info[0].r === info[0].t ? { w: w, o: info[0] } : null; }).filter(Boolean);
  }
  function cellLabel(key) {
    var r = TONE_ROWS.filter(function (x) { return x[0] === key[0]; })[0][1], col = key.slice(1);
    return r + '＋' + (/\d/.test(col) ? MARK_NAME[col] : LST_NAME[col]) + ' → ' + TONE_NAME[cellTone(key[0], col)];
  }
  function renderToneTab(host) {
    host.appendChild(el('p', 'label', '泰文的聲調由三件事決定：起首子音是哪一類、活音節還是死音節、有沒有聲調符號。點表格裡的格子，可以看例詞、聽發音。'));
    if (!TONES) {
      var ld = el('p', 'label', '載入聲調資料…'); host.appendChild(ld);
      loadTones().then(function () { if (cardTab === 'tone') { renderCards(); } }, function () { ld.textContent = '聲調資料載入失敗（可能沒有網路）。'; });
      return;
    }
    if (tq) { renderTonePractice(host); return; }
    var box = el('div', 'ttab'); box.innerHTML = toneTableHtml(true); host.appendChild(box);
    var exHost = el('div', 'texhost'); host.appendChild(exHost);
    function showEx() {
      exHost.replaceChildren();
      exHost.appendChild(el('div', 'texlab', cellLabel(toneCell)));
      var row = el('div', 'texrow');
      cellExamples(toneCell).forEach(function (x) {
        var g = glossSnapshot(x.w), b = el('button', 'texw t-' + x.o.t); b.type = 'button';
        var th = el('span', 'texth', x.w); th.lang = 'th'; b.appendChild(th);
        b.appendChild(el('span', 'texr', g.rom || ''));
        b.appendChild(el('span', 'texz', (g.zh || g.en || '').split('；')[0]));
        b.addEventListener('click', function () { speak(x.w); });
        row.appendChild(b);
      });
      exHost.appendChild(row);
      exHost.appendChild(el('p', 'tnote', '點詞可以聽發音。'));
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.tcellbtn'); if (!b) { return; }
      toneCell = b.getAttribute('data-cell');
      box.querySelectorAll('.tcellbtn').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      showEx();
    });
    showEx();
    var cl = el('details', 'tdet tcls2'); var sm = el('summary', '', '三類子音有哪些字'); cl.appendChild(sm);
    TONE_ROWS.forEach(function (r) {
      var p = el('div', 'tclsrow'); p.appendChild(el('span', 'tcls c-' + r[0] + ' tclsl', r[1]));
      var t = el('span', 'tclst', CLS_LETTERS[r[0]]); t.lang = 'th'; p.appendChild(t); cl.appendChild(p);
    });
    cl.appendChild(el('p', 'tnote', '活音節：長母音結尾，或 ม น ง ย ว 結尾（ำ ใ ไ เา 也算）。死音節：短母音結尾，或 ก ด บ 類的尾音（k、t、p 音）。前面有不發音的 ห 時，照高子音算；อ 帶 ย（อย่า、อยู่、อย่าง、อยาก）照中子音算。'));
    host.appendChild(cl);
    var go = el('button', 'primary tgo', '練習推聲調（10 題）'); go.type = 'button';
    go.addEventListener('click', function () { tq = makeTonePractice(); renderCards(); });
    host.appendChild(go);
  }
  /* 練習：一題一個單音節詞，依序問：子音類別 →（沒有聲調符號時）活或死 → 聲調 */
  function makeTonePractice() {
    var pool = [];
    Object.keys(TONE_EX).forEach(function (k) { cellExamples(k).forEach(function (x) { pool.push(x); }); });
    cards.forEach(function (c) { var info = toneInfo(c.w); if (info && info.length === 1 && info[0].r === info[0].t && !info[0].lead && !pool.some(function (x) { return x.w === c.w; })) { pool.push({ w: c.w, o: info[0] }); } });
    return { items: shuffle(pool).slice(0, 10), k: 0, step: 0, right: 0, wrong: 0, picked: null };
  }
  function renderTonePractice(host) {
    var it = tq.items[tq.k];
    if (!it) {
      host.appendChild(el('div', 'qdone', '練習完成：' + tq.right + ' 步答對、' + tq.wrong + ' 步答錯。'));
      var again = el('button', 'primary', '再練一次'); again.type = 'button'; again.addEventListener('click', function () { tq = makeTonePractice(); renderCards(); });
      var back = el('button', '', '回到規則表'); back.type = 'button'; back.addEventListener('click', function () { tq = null; renderCards(); });
      var row = el('div', 'row2 tqend'); row.appendChild(again); row.appendChild(back); host.appendChild(row);
      return;
    }
    var o = it.o, steps = ['cls'].concat(o.m ? [] : ['lst']).concat(['tone']);
    var top = el('div', 'tphead'); top.appendChild(el('span', 'qprog', '第 ' + (tq.k + 1) + ' / ' + tq.items.length + ' 題'));
    var quit = el('button', 'linkbtn', '結束練習'); quit.type = 'button'; quit.addEventListener('click', function () { tq = null; renderCards(); }); top.appendChild(quit);
    host.appendChild(top);
    var wrap = el('div', 'tpwrap'); host.appendChild(wrap); host = wrap;
    var wrow = el('div', 'tpword'); var w = el('span', 'cword', it.w); w.lang = 'th'; wrow.appendChild(w);
    var say = el('button', 'iconbtn csay'); say.type = 'button'; say.setAttribute('aria-label', '朗讀'); say.innerHTML = SPK_ICON; say.addEventListener('click', function () { speak(it.w); });
    wrow.appendChild(say); host.appendChild(wrow);
    var g = glossSnapshot(it.w); var gl = (g.zh || g.en || '').split('；')[0].split('; ')[0]; if (gl.length > 30) { gl = gl.slice(0, 30) + '…'; }
    host.appendChild(el('div', 'tpgloss', (g.rom ? g.rom + '　' : '') + gl));
    var done = [];
    steps.slice(0, tq.step).forEach(function (s) { done.push(s); });
    /* 已經答完的步驟 */
    var ul = el('ol', 'tpsteps');
    done.forEach(function (s) { ul.appendChild(el('li', 'ok', stepAnswerText(s, o))); });
    if (done.length) { host.appendChild(ul); }
    var cur = steps[tq.step];
    if (!cur) {
      host.appendChild(el('div', 'qwhy tpwhy', toneWhy(o, null)));
      var nx = el('button', 'primary', tq.k + 1 < tq.items.length ? '下一題' : '看結果'); nx.type = 'button';
      nx.addEventListener('click', function () { tq.k++; tq.step = 0; tq.picked = null; renderCards(); });
      host.appendChild(nx);
      return;
    }
    var q = cur === 'cls' ? ['起首子音「' + o.i + '」是哪一類？', [['m', '中子音'], ['h', '高子音'], ['l', '低子音']], o.c]
      : cur === 'lst' ? ['沒有聲調符號。這個音節是活音節還是死音節？', [['L', '活音節'], ['S', '死音節']], o.s === 'L' ? 'L' : 'S']
        : ['所以聲調是？', ['M', 'L', 'F', 'H', 'R'].map(function (t) { return [t, TONE_NAME[t]]; }), o.t];
    if (cur === 'tone' && o.m) { q[0] = '有聲調符號 ' + MARK_NAME[o.m] + '。所以聲調是？'; }
    host.appendChild(el('div', 'qprompt small', q[0]));
    var opts = el('div', 'qopts');
    q[1].forEach(function (x) {
      var b = el('button', 'qopt' + (cur === 'tone' ? ' tone t-' + x[0] : '')); b.type = 'button';
      if (cur === 'tone') { b.innerHTML = toneSvg(x[0]); b.appendChild(document.createTextNode(x[1])); } else { b.textContent = x[1]; }
      if (tq.picked) { b.disabled = true; if (x[0] === q[2]) { b.classList.add('ok'); } else if (x[0] === tq.picked) { b.classList.add('bad'); } }
      b.addEventListener('click', function () {
        if (tq.picked) { return; }
        tq.picked = x[0];
        if (x[0] === q[2]) { tq.right++; tq.step++; tq.picked = null; } else { tq.wrong++; }
        renderCards();
      });
      opts.appendChild(b);
    });
    host.appendChild(opts);
    if (tq.picked) {
      host.appendChild(el('div', 'qwhy', '答案是「' + q[1].filter(function (x) { return x[0] === q[2]; })[0][1] + '」。' + stepHint(cur, o)));
      var cont = el('button', 'primary', '繼續'); cont.type = 'button';
      cont.addEventListener('click', function () { tq.picked = null; tq.step++; renderCards(); });
      host.appendChild(cont);
    }
  }
  function stepAnswerText(s, o) {
    if (s === 'cls') { return o.i + ' 是' + CLS_NAME[o.c]; }
    if (s === 'lst') { return LST_NAME[o.s]; }
    return TONE_NAME[o.t];
  }
  function stepHint(s, o) {
    if (s === 'cls') { return CLS_NAME[o.c] + '：' + CLS_LETTERS[o.c] + (o.c === 'l' ? '（中、高子音以外都是低子音）' : ''); }
    if (s === 'lst') { return o.s === 'L' ? '長母音結尾，或 ม น ง ย ว 結尾，是活音節。' : '短母音結尾，或尾音是 k、t、p 音（ก ด บ 類），是死音節。'; }
    return toneWhy(o, null);
  }
