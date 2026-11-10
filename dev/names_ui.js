  /* ---------- 專有名詞名單：內建（明星、劇名等）＋使用者自己加的 ----------
     名單裡的名字會被當成一整個詞：點任何一個字都會選到整個名字，也不會被切碎。 */
  var MY_NAMES_KEY = 'thai-my-names', myNames = [], GAZ = {}, gazCount = { builtin: 0, mine: 0 }, gazBuiltin = null;
  var NAME_TYPES = [['person', '人名'], ['work', '作品（劇、電影、歌）'], ['org', '機構／團體'], ['place', '地名'], ['other', '其他']];
  function isMark(c) { return /[ัิ-ฺ็-๎]/.test(c || ''); }
  function isThaiCh(c) { return /[ก-๎]/.test(c || ''); }
  function loadMyNames() {
    try { myNames = JSON.parse(localStorage.getItem(MY_NAMES_KEY) || '[]'); } catch (err) { myNames = []; }
    if (!Array.isArray(myNames)) { myNames = []; }
    gazBuild();
  }
  function saveMyNames() { try { localStorage.setItem(MY_NAMES_KEY, JSON.stringify(myNames)); } catch (err) {} }
  function gazAdd(o) {
    var k = o.t.slice(0, 2);
    (GAZ[k] = GAZ[k] || []).push(o);
  }
  function gazBuild() {
    GAZ = {}; gazSk = null;
    if (!gazBuiltin) {
      gazBuiltin = [];
      var el = $('celebdata');
      if (el) {
        el.textContent.split('\n').forEach(function (line) {
          var p = line.split('|');
          if (p.length >= 2 && p[0].length >= 4) { gazBuiltin.push({ t: p[0], type: p[1], zh: p[2] || '', desc: p[3] || '', en: p[4] || '', weak: p[5] === 'w' }); }
        });
        el.textContent = '';
      }
    }
    gazBuiltin.forEach(gazAdd);
    myNames.forEach(function (n) { if (n && n.t && n.t.length >= 2) { gazAdd({ t: n.t, type: n.type || 'other', zh: n.zh || '', desc: '', mine: true }); } });
    Object.keys(GAZ).forEach(function (k) { GAZ[k].sort(function (a, b) { return (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || b.t.length - a.t.length; }); });
    gazCount = { builtin: gazBuiltin.length, mine: myNames.length };
  }
  /* 在斷好的詞上找名單裡的名字：名字當成一個詞，名字前後的文字重新斷詞（避免像 ฟรี|นบ|อก 這種被名字帶歪的切法） */
  var gazSeg = null;
  function gazSplit(str, from, to, out) {
    if (to <= from) { return; }
    var piece = str.slice(from, to);
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      if (!gazSeg) { gazSeg = new Intl.Segmenter('th', { granularity: 'word' }); }
      Array.from(gazSeg.segment(piece)).forEach(function (x) { out.push({ i: from + x.index, n: x.segment.length, w: !!x.isWordLike, t: x.segment }); });
    } else { for (var k = 0; k < piece.length; k++) { out.push({ i: from + k, n: 1, w: piece[k].trim() !== '', t: piece[k] }); } }
  }
  function gazMerge(str, segsIn) {
    if (!segsIn.length || !Object.keys(GAZ).length) { return segsIn; }
    var starts = {}, ends = {};
    segsIn.forEach(function (g) { starts[g.i] = 1; ends[g.i + g.n] = 1; });
    var hits = [], i = 0, L = str.length;
    while (i < L - 1) {
      var list = GAZ[str.substr(i, 2)];
      if (list && (starts[i] || !isThaiCh(str.charAt(i - 1)))) {
        var hit = null;
        for (var k = 0; k < list.length; k++) {
          var o = list[k], e = i + o.t.length;
          if (str.substr(i, o.t.length) !== o.t) { continue; }
          var nx = str.charAt(e);
          if (isMark(nx) || /[\u0E30\u0E32\u0E33\u0E45]/.test(nx)) { continue; }
          if (o.weak) { if (!starts[i] || str.charAt(i - 1) === '-' || nx === '-') { continue; } }
          else if (o.t.length < 6 && !ends[e] && isThaiCh(nx)) { continue; }
          hit = { s: i, e: e, o: o }; break;
        }
        if (hit) { hits.push(hit); i = hit.e; continue; }
      }
      i++;
    }
    if (!hits.length) { return segsIn; }
    var out = [], pos = 0;
    hits.forEach(function (m) {
      gazSplit(str, pos, m.s, out);
      out.push({ i: m.s, n: m.e - m.s, w: true, t: str.slice(m.s, m.e), gz: m.o });
      pos = m.e;
    });
    gazSplit(str, pos, L, out);
    return out;
  }
  function namesChanged() {
    gazBuild();
    if (state.text) { segs = segment(state.text); }
    entsText = null; tapSel = null;
    renderText();
    if (typeof renderMyNames === 'function') { renderMyNames(); }
    if (typeof renderReport === 'function') { renderReport(); }
  }
  /* 查詞視窗裡的「加入專有名詞」編輯器：可以往前、往後多選或少選一個字 */
  function buildNameEditor(s, e, en) {
    var t = state.text, box = document.createElement('div'); box.className = 'sec nameedit';
    var old = en && en.info && en.info.mine ? en.info : null;
    var cur = { s: s, e: e, type: old ? old.type : (en && en.type && en.type !== 'foreign' ? en.type : 'person') };
    var ttl = document.createElement('div'); ttl.className = 'sl2'; ttl.textContent = '把範圍調成完整的名字，再選種類。之後這個名字在所有文件都會被當成一個詞。';
    var row = document.createElement('div'); row.className = 'nmrow';
    var prev = document.createElement('div'); prev.className = 'nmprev'; prev.lang = 'th';
    function btn(label, aria, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'nmadj'; b.textContent = label; b.setAttribute('aria-label', aria); b.addEventListener('click', function () { fn(); paint(); }); return b; }
    var lp = btn('‹＋', '前面多一個字', function () { if (cur.s > 0 && t.charAt(cur.s - 1) !== '\n') { cur.s--; while (cur.s > 0 && isMark(t.charAt(cur.s))) { cur.s--; } } });
    var lm = btn('－', '前面少一個字', function () { if (cur.e - cur.s > 1) { cur.s++; while (cur.s < cur.e - 1 && isMark(t.charAt(cur.s))) { cur.s++; } } });
    var rm = btn('－', '後面少一個字', function () { if (cur.e - cur.s > 1) { cur.e--; while (cur.e > cur.s + 1 && isMark(t.charAt(cur.e))) { cur.e--; } } });
    var rp = btn('＋›', '後面多一個字', function () { if (cur.e < t.length && t.charAt(cur.e) !== '\n') { cur.e++; while (cur.e < t.length && isMark(t.charAt(cur.e))) { cur.e++; } } });
    row.appendChild(lp); row.appendChild(lm); row.appendChild(prev); row.appendChild(rm); row.appendChild(rp);
    var types = document.createElement('div'); types.className = 'seg nmtypes'; types.setAttribute('role', 'radiogroup'); types.setAttribute('aria-label', '名字的種類');
    var zh = document.createElement('input'); zh.type = 'text'; zh.className = 'nmzh'; zh.placeholder = '中文名稱或備註（可不填）'; zh.value = old ? old.zh || '' : (en && en.info && en.info.zh) || '';
    var msg = document.createElement('div'); msg.className = 'sl2';
    var acts = document.createElement('div'); acts.className = 'row2';
    var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'primary'; ok.textContent = '存到我的名單';
    var no = document.createElement('button'); no.type = 'button'; no.textContent = '取消';
    acts.appendChild(ok); acts.appendChild(no);
    function paint() {
      prev.textContent = t.slice(cur.s, cur.e);
      types.replaceChildren();
      NAME_TYPES.forEach(function (T) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = T[1]; b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', cur.type === T[0] ? 'true' : 'false');
        b.addEventListener('click', function () { cur.type = T[0]; paint(); });
        types.appendChild(b);
      });
    }
    ok.addEventListener('click', function () {
      var nm = t.slice(cur.s, cur.e).replace(/^\s+|\s+$/g, '');
      if (nm.length < 2) { msg.textContent = '名字至少要 2 個字。'; return; }
      if (/\n/.test(nm)) { msg.textContent = '名字不能跨行。'; return; }
      if (!/[ก-ฮ]/.test(nm)) { msg.textContent = '名字裡要有泰文字。'; return; }
      myNames = myNames.filter(function (n) { return n.t !== nm && (!old || n.t !== old.t); });
      myNames.push({ t: nm, type: cur.type, zh: zh.value.trim().slice(0, 60), at: Date.now() });
      saveMyNames(); hidePop(); namesChanged();
      $('info').textContent = '已把「' + nm + '」加入我的專有名詞，所有文件都會把它當成一個詞。';
    });
    no.addEventListener('click', function () { box.remove(); });
    box.appendChild(ttl); box.appendChild(row); box.appendChild(types); box.appendChild(zh); box.appendChild(msg); box.appendChild(acts);
    paint();
    return box;
  }
  function openNameEditor(s, e, en) {
    var pop = $('pop'), old = pop.querySelector('.nameedit');
    if (old) { old.remove(); }
    var ed = buildNameEditor(s, e, en), x = pop.querySelector('.head');
    pop.insertBefore(ed, x ? x.nextSibling : pop.firstChild);
    ed.scrollIntoView({ block: 'nearest' });
  }
  function removeMyName(nm) {
    myNames = myNames.filter(function (n) { return n.t !== nm; });
    saveMyNames(); namesChanged();
  }
  /* 設定頁：我的專有名詞清單 */
  function renderMyNames() {
    var ul = $('myNamesList'), c = $('myNamesCount');
    if (!ul) { return; }
    c.textContent = '內建名單 ' + gazCount.builtin.toLocaleString() + ' 個；我的名單 ' + myNames.length + ' 個。';
    ul.replaceChildren();
    myNames.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).forEach(function (n) {
      var li = document.createElement('li');
      var tag = document.createElement('span'); tag.className = 'nmtag ent-' + (n.type || 'other'); tag.textContent = (ENT_TYPES[n.type] || '專有名詞').split('／')[0];
      var w = document.createElement('span'); w.className = 'nmword'; w.lang = 'th'; w.textContent = n.t;
      var z = document.createElement('span'); z.className = 'nmnote'; z.textContent = n.zh || '';
      var del = document.createElement('button'); del.type = 'button'; del.className = 'nmdel'; del.textContent = '刪除';
      del.addEventListener('click', function () { removeMyName(n.t); });
      li.appendChild(tag); li.appendChild(w); li.appendChild(z); li.appendChild(del);
      ul.appendChild(li);
    });
    ul.hidden = !myNames.length;
  }
  loadMyNames();
  renderMyNames();
