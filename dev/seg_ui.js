  /* ---------- 使用者自己調整斷詞：把切開的字合成一個詞、把黏在一起的詞拆開 ----------
     合成的詞放進名單（GAZ，標 word，不當專有名詞）；拆開的規則在斷詞最後套用。所有文件都適用。 */
  var MY_WORDS_KEY = 'thai-my-words', MY_SPLITS_KEY = 'thai-my-splits', myWords = [], mySplits = [], splitMap = {};
  function loadMySeg() {
    try { myWords = JSON.parse(localStorage.getItem(MY_WORDS_KEY) || '[]'); } catch (err) { myWords = []; }
    try { mySplits = JSON.parse(localStorage.getItem(MY_SPLITS_KEY) || '[]'); } catch (err) { mySplits = []; }
    if (!Array.isArray(myWords)) { myWords = []; }
    if (!Array.isArray(mySplits)) { mySplits = []; }
    splitMap = {}; mySplits.forEach(function (x) { if (x && x.t && x.parts && x.parts.join('') === x.t) { splitMap[x.t] = x.parts; } });
  }
  function saveMySeg() {
    try { localStorage.setItem(MY_WORDS_KEY, JSON.stringify(myWords)); localStorage.setItem(MY_SPLITS_KEY, JSON.stringify(mySplits)); } catch (err) {}
    loadMySeg();
  }
  /* 斷詞最後一步：照使用者的規則拆開 */
  function userSplit(out) {
    if (!mySplits.length) { return out; }
    var res = [];
    out.forEach(function (g) {
      var parts = g.w && splitMap[g.t];
      if (!parts) { res.push(g); return; }
      var at = g.i;
      parts.forEach(function (p) { res.push({ i: at, n: p.length, w: true, t: p, us: true, src: g.t }); at += p.length; });
    });
    return res;
  }
  function segChanged() {
    if (typeof gazBuild === 'function') { gazBuild(); }
    if (state.text) { segs = segment(state.text); }
    if (typeof entsText !== 'undefined') { entsText = null; }
    tapSel = null; renderText();
    renderMySeg();
  }
  /* 可以切開的位置：上下的母音、聲調符號不能跟前一個字分開 */
  function cutPoints(w) { var out = []; for (var k = 1; k < w.length; k++) { if (!isMark(w.charAt(k)) && !/[ะาำๅ]/.test(w.charAt(k))) { out.push(k); } } return out; }
  function buildSegEditor(seg) {
    var t = state.text, box = document.createElement('div'); box.className = 'sec segedit';
    var mineW = myWords.some(function (x) { return x.t === seg.t; }), mineS = !!seg.us || !!splitMap[seg.t];
    var tabs = document.createElement('div'); tabs.className = 'seg segtabs'; tabs.setAttribute('role', 'radiogroup'); tabs.setAttribute('aria-label', '要怎麼調整');
    var body = document.createElement('div'), msg = document.createElement('div'); msg.className = 'sl2';
    var mode = 'merge';
    function close() { box.remove(); }
    function paintTabs() { segButtons(tabs, [['merge', '合成一個詞'], ['split', '拆開']], mode, function (v) { mode = v; paint(); }); }
    function paint() {
      paintTabs(); body.replaceChildren(); msg.textContent = '';
      if (mode === 'merge') {
        var cur = { s: seg.i, e: seg.i + seg.n };
        body.appendChild(Object.assign(document.createElement('div'), { className: 'sl2', textContent: '用 ‹＋ 和 ＋› 把前後被切開的字加進來，調成一個完整的詞。' }));
        var row = document.createElement('div'); row.className = 'nmrow';
        var prev = document.createElement('div'); prev.className = 'nmprev'; prev.lang = 'th';
        function show() {
          /* 預覽：框裡是新的一個詞，前後灰色是原本的鄰居 */
          prev.replaceChildren();
          var a = document.createElement('span'); a.className = 'segctx'; a.textContent = t.slice(Math.max(0, cur.s - 3), cur.s).split('\n').pop();
          var m = document.createElement('span'); m.className = 'segnew'; m.textContent = t.slice(cur.s, cur.e);
          var b = document.createElement('span'); b.className = 'segctx'; b.textContent = t.slice(cur.e, cur.e + 3).split('\n')[0];
          prev.appendChild(a); prev.appendChild(m); prev.appendChild(b);
        }
        function btn(label, aria, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'nmadj'; b.textContent = label; b.setAttribute('aria-label', aria); b.addEventListener('click', function () { fn(); show(); }); return b; }
        /* 一次加減一整個原本的詞（比較快），找不到就一個字 */
        row.appendChild(btn('‹＋', '加入前面一個詞', function () { var p = segAt(cur.s - 1); if (p && p.w && t.slice(p.i, cur.s).indexOf('\n') < 0) { cur.s = p.i; } }));
        row.appendChild(btn('－', '前面少一個字', function () { var c = cutPoints(t.slice(cur.s, cur.e)); if (c.length) { cur.s += c[0]; } }));
        row.appendChild(prev);
        row.appendChild(btn('－', '後面少一個字', function () { var c = cutPoints(t.slice(cur.s, cur.e)); if (c.length) { cur.e = cur.s + c[c.length - 1]; } }));
        row.appendChild(btn('＋›', '加入後面一個詞', function () { var n = segAt(cur.e); if (n && n.w && t.slice(cur.e, n.i + n.n).indexOf('\n') < 0) { cur.e = n.i + n.n; } }));
        body.appendChild(row); show();
        var acts = document.createElement('div'); acts.className = 'row2';
        var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'primary'; ok.textContent = '存成一個詞';
        ok.addEventListener('click', function () {
          var w = t.slice(cur.s, cur.e).trim();
          if (w.length < 2 || !/[ก-ฮ]/.test(w)) { msg.textContent = '詞至少要 2 個字，而且要有泰文。'; return; }
          if (/\s/.test(w)) { msg.textContent = '詞裡面不能有空白或換行。'; return; }
          if (w === seg.t && !mineS) { msg.textContent = '範圍跟原本一樣。用 ‹＋ 或 ＋› 把被切開的部分加進來。'; return; }
          myWords = myWords.filter(function (x) { return x.t !== w; }); myWords.push({ t: w, at: Date.now() });
          mySplits = mySplits.filter(function (x) { return x.t !== w; });
          saveMySeg(); hidePop(); segChanged();
          $('info').textContent = '已把「' + w + '」存成一個詞，所有文件都會這樣斷。可以在「設定 → 我的詞庫 → 我的斷詞」改回來。';
        });
        var no = document.createElement('button'); no.type = 'button'; no.textContent = '取消'; no.addEventListener('click', close);
        acts.appendChild(ok); acts.appendChild(no); body.appendChild(acts);
      } else {
        var w = seg.t, cuts = {}, pts = cutPoints(w);
        if (!pts.length) { body.appendChild(Object.assign(document.createElement('div'), { className: 'sl2', textContent: '這個詞太短，沒辦法再拆。' })); return; }
        body.appendChild(Object.assign(document.createElement('div'), { className: 'sl2', textContent: '點兩個字中間的空隙，決定要從哪裡切開（可以切好幾刀）。' }));
        var strip = document.createElement('div'); strip.className = 'segstrip'; strip.lang = 'th';
        function drawStrip() {
          strip.replaceChildren();
          var last = 0;
          pts.concat([w.length]).forEach(function (p) {
            var ch = document.createElement('span'); ch.className = 'segch'; ch.textContent = w.slice(last, p); strip.appendChild(ch);
            if (p < w.length) {
              var gap = document.createElement('button'); gap.type = 'button'; gap.className = 'seggap' + (cuts[p] ? ' on' : ''); gap.setAttribute('aria-label', '在這裡切開'); gap.setAttribute('aria-pressed', String(!!cuts[p]));
              gap.addEventListener('click', function () { cuts[p] = !cuts[p]; drawStrip(); });
              strip.appendChild(gap);
            }
            last = p;
          });
        }
        drawStrip(); body.appendChild(strip);
        var acts2 = document.createElement('div'); acts2.className = 'row2';
        var ok2 = document.createElement('button'); ok2.type = 'button'; ok2.className = 'primary'; ok2.textContent = '存成拆開';
        ok2.addEventListener('click', function () {
          var ks = Object.keys(cuts).filter(function (k) { return cuts[k]; }).map(Number).sort(function (a, b) { return a - b; });
          if (!ks.length) { msg.textContent = '還沒選要切的位置：點字中間的空隙。'; return; }
          var parts = [], last = 0; ks.concat([w.length]).forEach(function (k) { parts.push(w.slice(last, k)); last = k; });
          mySplits = mySplits.filter(function (x) { return x.t !== w; }); mySplits.push({ t: w, parts: parts, at: Date.now() });
          myWords = myWords.filter(function (x) { return x.t !== w; });
          saveMySeg(); hidePop(); segChanged();
          $('info').textContent = '已把「' + w + '」拆成「' + parts.join('｜') + '」，所有文件都會這樣斷。可以在「設定 → 我的詞庫 → 我的斷詞」改回來。';
        });
        var no2 = document.createElement('button'); no2.type = 'button'; no2.textContent = '取消'; no2.addEventListener('click', close);
        acts2.appendChild(ok2); acts2.appendChild(no2); body.appendChild(acts2);
      }
    }
    box.appendChild(Object.assign(document.createElement('div'), { className: 'sl2 segtitle', textContent: '調整斷詞：這個詞切得不對時，可以合起來或拆開。' }));
    if (mineW || mineS) {
      var undo = document.createElement('button'); undo.type = 'button'; undo.className = 'segundo'; undo.textContent = '恢復原本的斷詞（「' + (seg.src || seg.t) + '」是你調整過的）';
      undo.addEventListener('click', function () {
        myWords = myWords.filter(function (x) { return x.t !== seg.t; });
        mySplits = mySplits.filter(function (x) { return x.t !== seg.t && x.t !== seg.src; });
        saveMySeg(); hidePop(); segChanged();
        $('info').textContent = '已恢復原本的斷詞。';
      });
      box.appendChild(undo);
    }
    box.appendChild(tabs); box.appendChild(body); box.appendChild(msg);
    paint();
    return box;
  }
  function openSegEditor(seg) {
    var pop = $('pop'), old = pop.querySelector('.segedit, .nameedit');
    if (old) { old.remove(); }
    var ed = buildSegEditor(seg), x = pop.querySelector('.head');
    pop.insertBefore(ed, x ? x.nextSibling : pop.firstChild);
    ed.scrollIntoView({ block: 'nearest' });
  }
  /* 設定頁：我的斷詞 */
  function renderMySeg() {
    var ul = $('mySegList'), c = $('mySegCount');
    if (!ul) { return; }
    c.textContent = myWords.length + mySplits.length ? '合成的詞 ' + myWords.length + ' 個、拆開的詞 ' + mySplits.length + ' 個。' : '還沒有調整過。';
    ul.replaceChildren();
    var all = myWords.map(function (x) { return { k: 'w', t: x.t, show: x.t, at: x.at }; }).concat(mySplits.map(function (x) { return { k: 's', t: x.t, show: x.parts.join('｜'), at: x.at }; }));
    all.sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).forEach(function (x) {
      var li = document.createElement('li');
      var tag = document.createElement('span'); tag.className = 'nmtag segtag-' + x.k; tag.textContent = x.k === 'w' ? '合成' : '拆開';
      var w = document.createElement('span'); w.className = 'nmword'; w.lang = 'th'; w.textContent = x.show;
      var del = document.createElement('button'); del.type = 'button'; del.className = 'nmdel'; del.textContent = '刪除';
      del.addEventListener('click', function () {
        if (x.k === 'w') { myWords = myWords.filter(function (y) { return y.t !== x.t; }); } else { mySplits = mySplits.filter(function (y) { return y.t !== x.t; }); }
        saveMySeg(); segChanged();
      });
      li.appendChild(tag); li.appendChild(w); li.appendChild(del); ul.appendChild(li);
    });
    ul.hidden = !all.length;
  }
  loadMySeg();
