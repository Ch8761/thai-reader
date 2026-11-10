  /* ---------- 詞義補強：被切開的複合詞接回去、專有名詞的字面意思、機器翻譯 ---------- */
  function zhOfEntry(w) {
    var es = DICT && DICT[w];
    if (!es) { return ''; }
    var fallback = '';
    for (var i = 0; i < es.length; i++) {
      var z = es[i][4] && es[i][4][0], en = String((es[i][3] && es[i][3][0]) || '');
      if (!z) { continue; }
      z = String(z).split(/[；;、，,]/)[0].trim();
      if (/^(alternative|obsolete|archaic|abbreviation|misspelling)/i.test(en) || /^同 /.test(z) || /（同 /.test(z)) { if (!fallback) { fallback = z; } continue; }
      return z;
    }
    return fallback;
  }
  /* 組成機構名、地名常用的字：字典第一個意思常常不是這個用法，這裡直接給 */
  var NAME_PARTS = {
    'กรม': '廳；局', 'กระทรวง': '部（政府）', 'สำนักงาน': '辦公室；署', 'สำนัก': '署；辦公室', 'ไทย': '泰國', 'การค้า': '貿易', 'ประเทศ': '國家',
    'จังหวัด': '府（省）', 'อำเภอ': '縣', 'ตำบล': '鄉', 'มหาวิทยาลัย': '大學', 'บริษัท': '公司', 'ธนาคาร': '銀行', 'โรงเรียน': '學校', 'โรงพยาบาล': '醫院',
    'สมาคม': '協會', 'องค์การ': '組織', 'องค์กร': '組織', 'คณะ': '學院；團', 'กรุง': '首都', 'เมือง': '城市', 'ถนน': '路', 'ซอย': '巷', 'สถาบัน': '機構；學院',
    'ศูนย์': '中心', 'สภา': '議會', 'ศาล': '法院', 'การท่องเที่ยว': '觀光', 'แห่ง': '…的', 'ระหว่างประเทศ': '國際', 'แห่งชาติ': '國家（的）', 'พาณิชย์': '商業',
    'การต่างประเทศ': '外交', 'ต่างประเทศ': '外國', 'เกษตร': '農業', 'ส่งเสริม': '促進', 'พัฒนา': '發展', 'วัฒนธรรม': '文化', 'อุตสาหกรรม': '工業', 'ส่งออก': '出口',
    'นำเข้า': '進口', 'ภาษี': '稅', 'ศุลกากร': '海關', 'ตำรวจ': '警察', 'ทหาร': '軍', 'สาธารณสุข': '公共衛生', 'ศึกษาธิการ': '教育', 'คมนาคม': '交通',
    'มหาดไทย': '內政', 'การคลัง': '財政', 'กลาโหม': '國防', 'ยุติธรรม': '司法', 'แรงงาน': '勞工', 'พลังงาน': '能源', 'ดิจิทัล': '數位', 'สิ่งแวดล้อม': '環境',
    'ทรัพยากร': '資源', 'ธรรมชาติ': '自然', 'วิทยาศาสตร์': '科學', 'เทคโนโลยี': '科技', 'การศึกษา': '教育', 'กีฬา': '體育', 'สื่อ': '媒體', 'บันเทิง': '娛樂',
    'เศรษฐกิจ': '經濟', 'การเงิน': '金融', 'การลงทุน': '投資', 'คณะกรรมการ': '委員會', 'กรรมการ': '委員', 'มูลนิธิ': '基金會', 'พรรค': '黨', 'สถานี': '站',
    'สนามบิน': '機場', 'ตลาด': '市場', 'วัด': '寺', 'พระราชวัง': '王宮', 'อุทยาน': '公園', 'แม่น้ำ': '河', 'เกาะ': '島', 'ภูเขา': '山', 'ทะเล': '海', 'อ่าว': '灣'
  };
  function shortMeaning(w) {
    if (NAME_PARTS[w]) { return NAME_PARTS[w]; }
    var z = zhOfEntry(w);
    if (z && glossLang !== 'en') { return z; }
    var es = DICT && DICT[w];
    if (!es) { return ''; }
    var en = es[0][3] && es[0][3][0];
    var ab = /abstract noun of (\S+)/.exec(String(en || ''));
    if (ab && ab[1] !== w && DICT[ab[1]]) { var zb = shortMeaning(ab[1]); if (zb) { return zb; } }
    return en ? String(en).replace(/\(.*?\)/g, '').split(/[;,]/)[0].trim() : z;
  }
  /* 瀏覽器的斷詞有時把字典裡有的複合詞切開（ส่ง＋ออก）：接回字典裡的那個詞 */
  var DM_MAX = 4;
  function dictMerge(out) {
    if (!DICT) { return out; }
    var res = [];
    for (var i = 0; i < out.length; i++) {
      var g = out[i], done = false;
      if (g.w && !g.gz && /^[ก-๎]+$/.test(g.t)) {
        for (var L = Math.min(DM_MAX, out.length - i); L >= 2 && !done; L--) {
          var ok = true, t = '';
          for (var k = 0; k < L; k++) {
            var x = out[i + k];
            if (!x.w || x.gz || !/^[ก-๎]+$/.test(x.t) || (k && x.i !== out[i + k - 1].i + out[i + k - 1].n)) { ok = false; break; }
            t += x.t;
          }
          if (!ok || t.length < 3 || t.length > 24 || !zhOfEntry(t)) { continue; }
          res.push({ i: g.i, n: t.length, w: true, t: t });
          i += L - 1; done = true;
        }
      }
      if (!done) { res.push(g); }
    }
    return res;
  }
  /* 把一串泰文拆成字典裡的詞（最長的先比），用來說明專有名詞的字面意思 */
  function splitToWords(t) {
    var s = t.replace(/\s+/g, ''), out = [], i = 0;
    while (i < s.length) {
      var hit = null;
      for (var L = Math.min(20, s.length - i); L >= 2; L--) {
        var w = s.slice(i, i + L);
        if (DICT && DICT[w] && shortMeaning(w)) { hit = w; break; }
      }
      if (!hit) { var last = out[out.length - 1]; if (last && !last.g) { last.t += s[i]; } else { out.push({ t: s[i], g: '' }); } i++; continue; }
      out.push({ t: hit, g: shortMeaning(hit) }); i += hit.length;
    }
    return out;
  }
  function buildComposeRow(t) {
    if (!DICT) { return null; }
    var parts = splitToWords(t);
    if (parts.length < 2 || !parts.some(function (p) { return p.g; })) { return null; }
    var row = document.createElement('div'); row.className = 'compose';
    var lab = document.createElement('span'); lab.className = 'cmp-l'; lab.textContent = '字面'; row.appendChild(lab);
    parts.forEach(function (p, k) {
      if (k) { var plus = document.createElement('span'); plus.className = 'cmp-plus'; plus.textContent = '＋'; row.appendChild(plus); }
      var c = document.createElement('span'); c.className = 'cmp-part';
      var th = document.createElement('span'); th.lang = 'th'; th.className = 'cmp-th'; th.textContent = p.t; c.appendChild(th);
      if (p.g) { var z = document.createElement('span'); z.className = 'cmp-zh'; z.textContent = p.g; c.appendChild(z); }
      row.appendChild(c);
    });
    return row;
  }
  /* 機器翻譯（要網路）：查不到的詞、專有名詞，直接給一個中文意思 */
  var MT_CACHE = {};
  function mtRow(t, label) {
    var row = document.createElement('div'); row.className = 'mtrow';
    var lab = document.createElement('span'); lab.className = 'mt-l'; lab.textContent = label || '翻譯'; row.appendChild(lab);
    var val = document.createElement('span'); val.className = 'mt-v'; row.appendChild(val);
    var key = t.replace(/\s+/g, ' ').trim();
    function show(v) { if (v) { val.textContent = v; row.classList.remove('loading'); } else { row.hidden = true; } }
    if (MT_CACHE[key] !== undefined) { show(MT_CACHE[key]); return row; }
    val.textContent = '翻譯中…'; row.classList.add('loading');
    if (typeof translateText !== 'function' || navigator.onLine === false) { row.hidden = true; return row; }
    translateText(key).then(function (z) { z = (z || '').trim(); MT_CACHE[key] = z; show(z); }, function () { row.hidden = true; });
    return row;
  }
