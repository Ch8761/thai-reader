  /* ---------- 專有名詞推測：人名、機構、計畫／政策、作品、地名、外來語 ---------- */
  var ENT_TYPES = { person: '人名', org: '機構／單位', plan: '計畫／政策／法規', work: '作品名稱', place: '地名', foreign: '人名或外來語' };
  var ENT_HELP = {
    person: '前面有稱謂（如 นาย、ดร.、คุณ）或符合常見泰國人名，通常不必逐字查。',
    org: '以機構字頭開頭（如 กระทรวง 部、กรม 廳、บริษัท 公司），整串是一個單位名稱。',
    plan: '以 โครงการ（計畫）、นโยบาย（政策）、พ.ร.บ.（法案）等開頭，整串是一個名稱。',
    work: '前面有 ซีรีส์、ละคร、เพลง 等字，後面通常是劇名、歌名或書名。',
    place: '國名、府名，或以 จังหวัด（府）、อำเภอ（縣）、ถนน（路）等開頭的地名。',
    foreign: '字典查不到、被切成零碎片段的詞，多半是外國人名、音譯詞或品牌名。'
  };
  var ORG_HEAD = ['สำนักนายกรัฐมนตรี', 'คณะกรรมการ', 'คณะรัฐมนตรี', 'กระทรวง', 'กรม', 'สำนักงาน', 'สำนัก', 'ธนาคาร', 'บริษัท', 'มหาวิทยาลัย', 'โรงเรียน', 'โรงพยาบาล', 'สถาบัน', 'องค์การ', 'การไฟฟ้า', 'การประปา', 'การท่องเที่ยว', 'การรถไฟ', 'ศาล', 'พรรค', 'กองทัพ', 'กองบัญชาการ', 'สมาคม', 'มูลนิธิ', 'วุฒิสภา', 'สภา', 'สถานทูต', 'สถานกงสุล', 'สถานีตำรวจ', 'กรุงเทพมหานคร', 'สหภาพ', 'สมาพันธ์', 'ทำเนียบ', 'รัฐบาล', 'ห้างสรรพสินค้า', 'คณะ', 'ค่าย', 'สโมสร'];
  var PLAN_HEAD = ['ร่างพระราชบัญญัติ', 'พระราชบัญญัติ', 'พระราชกำหนด', 'พ.ร.บ.', 'พ.ร.ก.', 'โครงการ', 'นโยบาย', 'ยุทธศาสตร์', 'แผนพัฒนา', 'แผนงาน', 'มาตรการ', 'แคมเปญ', 'กฎหมาย', 'ข้อตกลง', 'สนธิสัญญา'];
  var WORK_HEAD = ['ซีรีส์วาย', 'ซีรีส์', 'ซีรีย์', 'ซีรีย์ส', 'ละครเวที', 'ละคร', 'ภาพยนตร์', 'หนังเรื่อง', 'เพลง', 'อัลบั้ม', 'รายการ', 'นวนิยาย', 'นิยาย', 'หนังสือ', 'การ์ตูน', 'อนิเมะ', 'พอดแคสต์', 'ซิงเกิล', 'เกม'];
  var PLACE_HEAD = ['อุทยานแห่งชาติ', 'จังหวัด', 'อำเภอ', 'ตำบล', 'แขวง', 'ถนน', 'ซอย', 'หมู่บ้าน', 'แม่น้ำ', 'ภูเขา', 'ดอย', 'เกาะ', 'สนามบิน', 'สถานี', 'มณฑล', 'เมือง', 'ประเทศ', 'รัฐ'];
  var TITLE_STRICT = ['ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.', 'นางสาว', 'น.ส.', 'ดร.', 'พล.อ.', 'พล.ต.อ.', 'พล.ท.', 'พล.ต.', 'พ.ต.อ.', 'พ.ต.ท.', 'ร.ต.อ.', 'ศ.', 'รศ.', 'ผศ.', 'นพ.', 'พญ.', 'ม.ร.ว.', 'ม.ล.', 'ส.ส.', 'ส.ว.', 'ปธน.', 'นายกฯ', 'รมว.', 'รมต.'];
  var TITLE_SOFT = ['ประธานาธิบดี', 'นายกรัฐมนตรี', 'อาจารย์', 'นาย', 'นาง', 'คุณ', 'พี่', 'น้อง', 'ท่าน', 'หม่อม', 'เจ้าชาย', 'เจ้าหญิง', 'สมเด็จ'];
  var ENT_STOP = { 'ที่': 1, 'ซึ่ง': 1, 'และ': 1, 'หรือ': 1, 'ของ': 1, 'ใน': 1, 'ได้': 1, 'ว่า': 1, 'เป็น': 1, 'จะ': 1, 'ก็': 1, 'กับ': 1, 'โดย': 1, 'เพื่อ': 1, 'ให้': 1, 'แล้ว': 1, 'ไม่': 1, 'คือ': 1, 'เมื่อ': 1, 'ต่อ': 1, 'จาก': 1, 'ถึง': 1, 'นี้': 1, 'นั้น': 1, 'ด้วย': 1, 'ไป': 1, 'มา': 1, 'แห่ง': 1, 'ทั้ง': 1, 'ยัง': 1, 'ซึ่ง': 1, 'อยู่': 1, 'มี': 1, 'ก่อน': 1, 'หลัง': 1, 'นะ': 1, 'ครับ': 1, 'ค่ะ': 1, 'คะ': 1, 'เลย': 1, 'ก็ได้': 1, 'กัน': 1, 'แต่': 1, 'ตาม': 1, 'เนี่ย': 1, 'ที่สุด': 1 };
  var NAMES = {}, FAMILY = {}, PLACES = {}, entsReady = false, ents = [], showEnts = true;
  try { showEnts = localStorage.getItem('thai-show-ents') !== '0'; } catch (err) {}
  function loadNames() {
    var el = $('namedata');
    if (!el) { return; }
    var part = null;
    el.textContent.split('\n').forEach(function (line) {
      if (line.charAt(0) === '#') { part = line.slice(1).trim(); return; }
      if (!line) { return; }
      if (part === 'first') { NAMES[line] = 1; } else if (part === 'family') { FAMILY[line] = 1; } else if (part === 'place') { PLACES[line] = 1; }
    });
    el.textContent = '';
    entsReady = true;
  }
  loadNames();
  var isThaiSeg = function (t) { return /^[ก-๎.]+$/.test(t); };
  function known(t) { return !!(DICT && DICT[t]); }
  function startsWithAny(t, list) { for (var i = 0; i < list.length; i++) { if (t.indexOf(list[i]) === 0) { return list[i]; } } return null; }
  /* 在 state.text 上找出專有名詞範圍：[{s, e, type, t}] */
  function detectEntities() {
    var out = [], t = state.text, taken = [];
    if (!segs.length) { return out; }
    function free(s, e) { for (var i = 0; i < taken.length; i++) { if (s < taken[i][1] && e > taken[i][0]) { return false; } } return true; }
    function add(s, e, type) {
      if (e - s < 2 || !free(s, e)) { return; }
      taken.push([s, e]);
      out.push({ s: s, e: e, type: type, t: t.slice(s, e) });
    }
    /* 把連續的非空白詞段分成「詞串」 */
    var runs = [], cur = null;
    segs.forEach(function (g, k) {
      if (/^\s+$/.test(g.t)) { cur = null; return; }
      if (!cur || g.i !== cur.e) { cur = { s: g.i, e: g.i, segs: [] }; runs.push(cur); }
      cur.segs.push(k); cur.e = g.i + g.n;
    });
    function runAfter(r) { var j = runs.indexOf(r) + 1; return (j < runs.length && /^ $/.test(t.slice(r.e, runs[j].s))) ? runs[j] : null; }
    function cutEnd(r, fromSeg) {
      var e = segs[fromSeg].i + segs[fromSeg].n;
      for (var q = fromSeg + 1; q <= r.segs[r.segs.length - 1]; q++) {
        var g = segs[q];
        if (ENT_STOP[g.t] || !/[ก-๎]/.test(g.t) || /^[“”"'‘’()（）,，]/.test(g.t)) { break; }
        e = g.i + g.n;
      }
      return e;
    }
    /* 1. 稱謂＋人名 */
    runs.forEach(function (r) {
      var rt = t.slice(r.s, r.e), strict = startsWithAny(rt, TITLE_STRICT), soft = strict ? null : startsWithAny(rt, TITLE_SOFT);
      var head = strict || soft;
      if (!head) { return; }
      var rest = rt.slice(head.length);
      if (rest.length < 2) {
        if (strict) { var nx = runAfter(r); if (nx && isThaiSeg(t.slice(nx.s, nx.e))) { var nx2 = runAfter(nx); add(r.s, (nx2 && (FAMILY[t.slice(nx2.s, nx2.e)] || /-/.test(t.slice(nx2.s, nx2.e)))) ? nx2.e : nx.e, 'person'); } }
        return;
      }
      /* 稱謂後面的名字：取查不到或在名字清單裡的詞段，遇到一般詞就停 */
      var nameEnd = r.s + head.length, firstSeg = null;
      for (var q = 0; q < r.segs.length; q++) {
        var g = segs[r.segs[q]];
        if (g.i + g.n <= r.s + head.length) { continue; }
        if (g.i < r.s + head.length) { break; }
        if (!firstSeg) { firstSeg = g; }
        if (NAMES[g.t] || FAMILY[g.t] || !known(g.t) || (g.t.length <= 2 && nameEnd > r.s + head.length)) { nameEnd = g.i + g.n; continue; }
        break;
      }
      var next = runAfter(r), nextT = next ? t.slice(next.s, next.e) : '';
      var famNext = next && (FAMILY[nextT] || /^[\u0E01-\u0E4E]+-[\u0E01-\u0E4E]+$/.test(nextT) || (isThaiSeg(nextT) && !known(nextT) && nextT.length >= 3 && nextT.length <= 14 && next.segs.every(function (k) { return !known(segs[k].t) || segs[k].t.length <= 2; })));
      if (nameEnd > r.s + head.length) {
        if (soft && !NAMES[t.slice(r.s + head.length, nameEnd)] && !famNext && (nameEnd - r.s - head.length) < 3) { return; }
        add(r.s, (famNext && nameEnd === r.e) ? next.e : nameEnd, 'person');
      } else if (famNext && firstSeg && firstSeg.i === r.s + head.length && firstSeg.i + firstSeg.n === r.e) {
        add(r.s, next.e, 'person');
      }
    });
    /* 2. 機構、計畫、作品、地名：從字頭開始到詞串結束（遇到虛詞就停） */
    var HEADS = [[ORG_HEAD, 'org'], [PLAN_HEAD, 'plan'], [WORK_HEAD, 'work'], [PLACE_HEAD, 'place']];
    runs.forEach(function (r) {
      for (var a = 0; a < r.segs.length; a++) {
        var g = segs[r.segs[a]], restT = t.slice(g.i, r.e), hit = null, type = null;
        HEADS.forEach(function (H) { if (!hit) { var h = startsWithAny(restT, H[0]); if (h) { hit = h; type = H[1]; } } });
        if (!hit) { continue; }
        var hEnd = g.i + hit.length, k2 = a;
        while (k2 < r.segs.length && segs[r.segs[k2]].i + segs[r.segs[k2]].n <= hEnd) { k2++; }
        if (k2 >= r.segs.length) { continue; }
        var first = segs[r.segs[k2]];
        if (ENT_STOP[first.t] || !/[ก-๎]/.test(first.t)) { continue; }
        if (type === 'work') {
          if (first.t === 'เรื่อง' && k2 + 1 < r.segs.length) { k2++; first = segs[r.segs[k2]]; }
          var e0 = cutEnd(r, r.segs[k2]), ttl = t.slice(first.i, e0);
          /* 「เรื่องใหม่」（新的）這種一般詞不是劇名 */
          if (!(known(ttl) && ttl.length <= 6)) { add(first.i, e0, 'work'); }
          a = k2; continue;
        }
        var e1 = cutEnd(r, r.segs[k2]), nAfter = 0;
        r.segs.forEach(function (k) { if (segs[k].i >= hEnd && segs[k].i < e1) { nAfter++; } });
        if (type === 'plan' && hit !== 'โครงการ' && hit !== 'พ.ร.บ.' && hit !== 'พระราชบัญญัติ' && nAfter < 2) { continue; }
        if (type === 'place' && (hit === 'เมือง' || hit === 'ประเทศ' || hit === 'รัฐ' || hit === 'เกาะ') && !PLACES[t.slice(hEnd, e1)] && known(t.slice(hEnd, e1))) { continue; }
        add(g.i, e1, type);
        while (a + 1 < r.segs.length && segs[r.segs[a + 1]].i < e1) { a++; }
      }
    });
    /* 3. 國名、府名 */
    segs.forEach(function (g) { if (PLACES[g.t] && (!known(g.t) || (g.t.length >= 4 && DICT[g.t][0][0] === 'name'))) { add(g.i, g.i + g.n, 'place'); } });
    /* 4. 連字號的外國人名（ชิง-เต๋อ），常見泰國名字＋姓 */
    runs.forEach(function (r) {
      var rt = t.slice(r.s, r.e);
      if (/^[ก-๎]+-[ก-๎]+$/.test(rt)) { add(r.s, r.e, 'person'); return; }
      if (NAMES[rt]) { var nx = runAfter(r); if (nx && (FAMILY[t.slice(nx.s, nx.e)] || (!known(t.slice(nx.s, nx.e)) && isThaiSeg(t.slice(nx.s, nx.e))))) { add(r.s, nx.e, 'person'); } }
    });
    /* 5. 字典查不到、被切碎的詞：外國人名、音譯詞、品牌 */
    runs.forEach(function (r) {
      var k = 0, list = r.segs;
      while (k < list.length) {
        var g = segs[list[k]];
        if (!/^[\u0E01-\u0E45\u0E47-\u0E4E]+$/.test(g.t) || !/[\u0E01-\u0E2E]/.test(g.t) || (known(g.t) && g.t.length > 1)) { k++; continue; }
        var j = k, frag = g.t.length <= 2 ? 1 : 0, unk = 1;
        while (j + 1 < list.length) {
          var n2 = segs[list[j + 1]];
          if (!/^[\u0E01-\u0E45\u0E47-\u0E4E]+$/.test(n2.t)) { break; }
          if (!known(n2.t) || n2.t.length === 1) { j++; unk++; if (n2.t.length <= 2) { frag = 1; } continue; }
          if (n2.t.length <= 1) { j++; frag = 1; continue; }
          break;
        }
        /* 往前接一個被切出的短字（例如 ฟรี + น） */
        var s0 = g.i;
        if (g.t.length <= 2 && k > 0) { var pv = segs[list[k - 1]]; if (/^[ก-๎]+$/.test(pv.t) && !ENT_STOP[pv.t] && pv.t.length <= 4) { s0 = pv.i; frag = 1; } }
        var e2 = segs[list[j]].i + segs[list[j]].n;
        if ((frag || unk >= 2) && e2 - s0 >= 3) { add(s0, e2, 'foreign'); }
        k = j + 1;
      }
    });
    out.sort(function (x, y) { return x.s - y.s; });
    return out;
  }
  var entsText = null, entsSegs = null;
  function getEnts() {
    if (entsText !== state.text || entsSegs !== segs) { ents = entsReady ? detectEntities() : []; entsText = state.text; entsSegs = segs; }
    return ents;
  }
  function entityAt(i) { getEnts(); for (var k = 0; k < ents.length; k++) { if (i >= ents[k].s && i < ents[k].e) { return ents[k]; } } return null; }
  function buildEntitySection(en) {
    var sec = document.createElement('div'); sec.className = 'sec ent-sec ent-box-' + en.type;
    var top = document.createElement('div'); top.className = 'enthead';
    var tag = document.createElement('span'); tag.className = 'enttag ent-' + en.type; tag.textContent = ENT_TYPES[en.type] + '（推測）';
    var nm = document.createElement('span'); nm.className = 'entname'; nm.lang = 'th'; nm.textContent = en.t;
    top.appendChild(tag); top.appendChild(nm);
    var help = document.createElement('div'); help.className = 'sl2'; help.textContent = ENT_HELP[en.type];
    var row = document.createElement('div'); row.className = 'row2';
    var say = document.createElement('button'); say.type = 'button'; say.textContent = '朗讀';
    say.addEventListener('click', function () { speak(en.t); });
    row.appendChild(say);
    [['Google', 'https://www.google.com/search?q=' + encodeURIComponent(en.t)]].forEach(function (L) {
      var a = document.createElement('a'); a.className = 'ext small'; a.href = L[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = L[0];
      row.appendChild(a);
    });
    sec.appendChild(top); sec.appendChild(help); sec.appendChild(row);
    return sec;
  }

  /* ---------- 整篇翻譯：切成 Google 翻譯能接受的長度 ---------- */
  var TR_MAX = 5200;
  function trUrl(s) { return 'https://translate.google.com/?sl=th&tl=zh-TW&op=translate&text=' + encodeURIComponent(s); }
  function splitForTranslate(s) {
    var out = [], cur = '';
    function push() { if (cur.trim()) { out.push(cur.trim()); } cur = ''; }
    s.split(/(\s+)/).forEach(function (p) {
      if (encodeURIComponent(cur + p).length > TR_MAX) {
        push();
        while (encodeURIComponent(p).length > TR_MAX) {
          var cut = Math.max(1, Math.floor(p.length * TR_MAX / encodeURIComponent(p).length) - 5);
          out.push(p.slice(0, cut)); p = p.slice(cut);
        }
      }
      cur += p;
    });
    push();
    return out;
  }
  function translateParts() {
    var parts = [];
    if (pdf) {
      pdf.pages.forEach(function (pg) {
        var ch = splitForTranslate(state.text.slice(pg.range[0], pg.range[1]));
        ch.forEach(function (c, i) { parts.push({ label: '第 ' + pg.n + ' 頁' + (ch.length > 1 ? '（' + (i + 1) + '/' + ch.length + '）' : ''), text: c }); });
      });
    } else {
      var ch2 = splitForTranslate(state.text);
      ch2.forEach(function (c, i) { parts.push({ label: ch2.length > 1 ? '第 ' + (i + 1) + ' 段' : '全文', text: c }); });
    }
    return parts;
  }
  function renderTranslatePanel() {
    var host = $('trlist');
    host.replaceChildren();
    var parts = translateParts();
    parts.forEach(function (p) {
      var a = document.createElement('a'); a.className = 'ext small'; a.href = trUrl(p.text); a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = p.label;
      a.title = p.text.slice(0, 60);
      host.appendChild(a);
    });
    $('trdoc').hidden = !pdf;
    $('trnote').textContent = parts.length > 1 ? 'Google 翻譯一次只收得下一小段，所以分成 ' + parts.length + ' 段，按想讀的那一段。' : '';
  }
  function refreshTranslateLink() { if (!$('trpanel').hidden) { renderTranslatePanel(); } }
  $('translateAll').addEventListener('click', function () {
    var open = $('trpanel').hidden;
    $('trpanel').hidden = !open;
    $('translateAll').setAttribute('aria-expanded', String(open));
    if (open) { renderTranslatePanel(); }
  });
