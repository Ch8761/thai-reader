import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:100]); s = s.replace(old, new)

# ---------- 樣式 ----------
rep('.ent-foreign, .ent-box-foreign { --ec: 100, 116, 139; }', '''.ent-foreign, .ent-box-foreign { --ec: 100, 116, 139; }
.ent-other, .ent-box-other { --ec: 13, 148, 136; }
.pop .entinfo { font-size: 15px; color: var(--fg); }
.pop .ent-sec .row2 button { min-height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--accent); background: transparent; color: var(--accent); font-weight: 600; font-size: 14px; }
.pop .nameedit { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--line); border-radius: 10px; padding: 10px; background: var(--bg); }
.pop .nmrow { display: flex; align-items: center; gap: 6px; }
.pop .nmprev { flex: 1; min-width: 0; text-align: center; font-family: var(--thai); font-size: 21px; font-weight: 600; padding: 4px 8px; border-radius: 8px; background: var(--card); border: 1px dashed var(--accent); overflow-wrap: anywhere; }
.pop .nmadj { min-width: 44px; min-height: 44px; padding: 0 8px; font-weight: 700; }
.pop .nmtypes { flex-wrap: wrap; }
.pop .nmzh { width: 100%; min-height: 40px; font-size: 16px; }
.mynames { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.mynames li { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
.mynames .nmtag { font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 999px; color: #fff; background: rgb(var(--ec)); }
.mynames .nmword { font-family: var(--thai); font-size: 18px; }
.mynames .nmnote { color: var(--muted); font-size: 14px; flex: 1; }
.mynames .nmdel { min-height: 36px; padding: 0 12px; }''')

# ---------- 程式 ----------
rep("  var ENT_TYPES = { person: '人名', org: '機構／單位', plan: '計畫／政策／法規', work: '作品名稱', place: '地名', foreign: '人名或外來語' };",
    "  var ENT_TYPES = { person: '人名', org: '機構／單位', plan: '計畫／政策／法規', work: '作品名稱', place: '地名', foreign: '人名或外來語', other: '專有名詞' };")
rep("  loadNames();\n", "  loadNames();\n" + open(os.path.join(D, 'names_ui.js'), encoding='utf-8').read())
# 斷詞後合併名單裡的名字
rep('''      for (var k = 0; k < str.length; k++) { out.push({ i: k, n: 1, w: str[k].trim() !== '', t: str[k] }); }
    }
    return out;''', '''      for (var k = 0; k < str.length; k++) { out.push({ i: k, n: 1, w: str[k].trim() !== '', t: str[k] }); }
    }
    if (typeof gazMerge === 'function') { out = gazMerge(str, out); }
    return out;''')
# 名單裡的名字優先標成專有名詞
rep('''    function add(s, e, type) {
      if (e - s < 2 || !free(s, e)) { return; }
      taken.push([s, e]);
      out.push({ s: s, e: e, type: type, t: t.slice(s, e) });
    }''', '''    function add(s, e, type, info) {
      if (e - s < 2 || !free(s, e)) { return; }
      taken.push([s, e]);
      out.push({ s: s, e: e, type: type, t: t.slice(s, e), info: info || null });
    }
    segs.forEach(function (g) { if (g.gz && !g.gz.weak) { add(g.i, g.i + g.n, ENT_TYPES[g.gz.type] ? g.gz.type : 'other', g.gz); } });''')
# 單獨暱稱（弱）：其他規則跑完才加，只取代「人名或外來語」的推測
rep('''    out.sort(function (x, y) { return x.s - y.s; });
    return out;''', '''    segs.forEach(function (g) {
      if (!g.gz || !g.gz.weak) { return; }
      var s1 = g.i, e1 = g.i + g.n, clash = out.filter(function (x) { return x.s < e1 && s1 < x.e; });
      if (!clash.every(function (x) { return x.type === 'foreign'; })) { return; }
      out = out.filter(function (x) { return clash.indexOf(x) < 0; });
      taken = taken.filter(function (r) { return !(r[0] < e1 && s1 < r[1]); });
      add(s1, e1, ENT_TYPES[g.gz.type] ? g.gz.type : 'other', g.gz);
    });
    out.sort(function (x, y) { return x.s - y.s; });
    return out;''')
# 查詞視窗的專有名詞區塊
rep('''tag.textContent = ENT_TYPES[en.type] + '（推測）';''', '''tag.textContent = ENT_TYPES[en.type] + (en.info ? (en.info.mine ? '（我的名單）' : '（名單）') : '（推測）');''')
rep('''    var help = document.createElement('div'); help.className = 'sl2'; help.textContent = ENT_HELP[en.type];''',
    '''    var help = document.createElement('div'); help.className = 'sl2'; help.textContent = en.info ? (en.info.mine ? '你加進「我的專有名詞」的名字。' : '收錄在內建名單' + (en.info.desc ? '：' + en.info.desc : '') + '。' + (en.info.weak ? '這裡只寫了暱稱，也可能是同暱稱的其他人。' : '')) : ENT_HELP[en.type];
    if (en.info && (en.info.zh || en.info.en)) { var inf = document.createElement('div'); inf.className = 'entinfo'; inf.textContent = (en.info.zh ? en.info.zh : '') + (en.info.en ? (en.info.zh ? '（' + en.info.en + '）' : en.info.en) : ''); top.appendChild(inf); }''')
rep('''    say.addEventListener('click', function () { speak(en.t); });
    row.appendChild(say);''', '''    say.addEventListener('click', function () { speak(en.t); });
    row.appendChild(say);
    var fix = document.createElement('button'); fix.type = 'button';
    fix.textContent = en.info && en.info.mine ? '編輯' : (en.info ? '調整範圍' : '存成名字');
    fix.addEventListener('click', function () { openNameEditor(en.s, en.e, en); });
    row.appendChild(fix);
    if (en.info && en.info.mine) {
      var rmv = document.createElement('button'); rmv.type = 'button'; rmv.textContent = '移除';
      rmv.addEventListener('click', function () { removeMyName(en.info.t); hidePop(); $('info').textContent = '已把「' + en.info.t + '」從我的名單移除。'; });
      row.appendChild(rmv);
    }''')
# 不是專有名詞的詞：在連結列加「這是名字？」
rep('''    links.insertBefore(say, links.firstChild);
    var gs = buildGrammarSection(seg);''', '''    links.insertBefore(say, links.firstChild);
    if (!en0 && typeof openNameEditor === 'function') {
      var nmb = document.createElement('button'); nmb.type = 'button'; nmb.className = 'say'; nmb.textContent = '這是名字或劇名？';
      nmb.addEventListener('click', function () { openNameEditor(seg.i, seg.i + seg.n, null); });
      links.appendChild(nmb);
    }
    var gs = buildGrammarSection(seg);''')

# ---------- 設定頁：我的專有名詞 ----------
rep('''      <div class="seg" role="radiogroup" aria-label="標示專有名詞" id="entGroup"></div>
    </div>''', '''      <div class="seg" role="radiogroup" aria-label="標示專有名詞" id="entGroup"></div>
    </div>
    <div class="setrow fbrow">
      <div class="setlabel">我的專有名詞<span class="sethelp">字典沒收錄的明星、劇名、品牌等。查詞時按「這是名字或劇名？」就能加進來，之後所有文件都會把它當成一個詞。<br><span id="myNamesCount"></span></span></div>
      <ul class="mynames" id="myNamesList" hidden></ul>
    </div>''')
rep('''<span class="ent-foreign">外來''', '''<span class="ent-other">其他名稱</span><span class="ent-foreign">外來''')
rep('''    if (en0) { pop.appendChild(buildEntitySection(en0)); }
    pop.appendChild(d);''', '''    if (en0) { pop.appendChild(buildEntitySection(en0)); }
    if (!(seg.gz && en0)) { pop.appendChild(d); }''')
rep("  var SETTING_KEYS = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-welcome-v1', 'thai-theme'];",
    "  var SETTING_KEYS = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-welcome-v1', 'thai-theme', 'thai-my-names'];")
rep('''        if (typeof theme !== 'undefined') { theme = localStorage.getItem('thai-theme') || 'system'; }''',
    '''        if (typeof theme !== 'undefined') { theme = localStorage.getItem('thai-theme') || 'system'; }
        if (typeof loadMyNames === 'function') { loadMyNames(); }''')

# 內建名單資料
data = ''
p = os.path.join(D, 'dictin', 'celebs.txt')
if os.path.exists(p):
    data = open(p, encoding='utf-8').read().strip()
assert '</' not in data
i = s.index('<script type="text/plain" id="lib-pdflib">')
s = s[:i] + '<script type="text/plain" id="celebdata">' + data + '</script>\n' + s[i:]

# 回報與檢查清單
rep('''    lines.push('句型庫：''', '''    if (typeof gazCount !== 'undefined') { lines.push('專有名詞名單：內建 ' + gazCount.builtin + '、我的 ' + gazCount.mine + (myNames.length ? '（' + myNames.slice(-5).map(function (n) { return n.t; }).join('、') + '）' : '')); }
    lines.push('句型庫：''')
rep("    ['b1', ", """    ['n1', '查詞時按「這是名字或劇名？」，調整範圍後存起來，整個名字會變成一個詞'],
    ['n2', '設定頁「我的專有名詞」看得到剛加的名字，也能刪除'],
    ['b1', """)
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
