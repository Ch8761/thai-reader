import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
EN = {}

# ======================================================================
# 1. 內建名單：加「菜名」類別、修正撞到一般詞的條目
# ======================================================================
a = s.index('<script type="text/plain" id="celebdata">') + len('<script type="text/plain" id="celebdata">')
b = s.index('</script>', a)
rows = {}
for line in s[a:b].split('\n'):
    if not line:
        continue
    p = line.split('|')
    rows[p[0]] = p
for line in open(os.path.join(D, 'dictin', 'foods.txt'), encoding='utf-8'):
    line = line.rstrip('\n')
    if not line or line.startswith('#'):
        continue
    th, zh, desc, en = line.split('|')
    zh = zh.replace('（', '・').replace('）', '')
    en = re.sub(r'\s*\(.*?\)\s*$', '', en)
    rows[th] = [th, 'food', zh, desc, en]          # 菜名蓋過同名的電影、劇名
WEAK = ['ทวงคืน', 'เรือนแพ', 'สามชุก', 'วาเลนไทน์', 'ปุยฝ้าย', 'ยูนิเวิร์ส', 'ทอมป์สัน', 'เชสเตอร์', 'เนชั่นแนล']
for w in WEAK:
    if w in rows:
        p = (rows[w] + ['', '', '', ''])[:5]; rows[w] = p + ['w']
rows['จอร์เจีย'] = ['จอร์เจีย', 'place', '喬治亞', '國家', 'Georgia']
rows['อินโดจีน'] = ['อินโดจีน', 'place', '印度支那', '地區', 'Indochina']
data = '\n'.join('|'.join(rows[k]) for k in sorted(rows))
s = s[:a] + data + s[b:]
EN.update({'泰國菜': 'Thai dish', '泰國甜點': 'Thai dessert', '泰國飲料': 'Thai drink', '泰國小吃': 'Thai snack', '飲料': 'Drink', '國家': 'Country', '地區': 'Region'})

# ======================================================================
# 2. 類別：菜名
# ======================================================================
rep("place: '地名', foreign: '人名或外來語', other: '專有名詞' };", "place: '地名', food: '菜名／食物', foreign: '人名或外來語', other: '專有名詞' };")
rep("    foreign: '字典查不到、被切成零碎片段的詞，多半是外國人名、音譯詞或品牌名。'\n  };",
    "    foreign: '字典查不到、被切成零碎片段的詞，多半是外國人名、音譯詞或品牌名。',\n    food: '收錄在內建菜名清單的泰國菜、小吃、甜點和飲料。'\n  };")
rep("['place', '地名'], ['other', '其他']];", "['place', '地名'], ['food', '菜名／食物'], ['other', '其他']];")
rep(".ent-other, .ent-box-other { --ec: 13, 148, 136; }", ".ent-other, .ent-box-other { --ec: 13, 148, 136; }\n.ent-food, .ent-box-food { --ec: 180, 120, 0; }")
EN.update({'菜名／食物': 'Food / dish', '菜名': 'Food', '收錄在內建菜名清單的泰國菜、小吃、甜點和飲料。': 'In the built-in list of Thai dishes, snacks, desserts and drinks.'})

# ======================================================================
# 3. 推測規則：少一點把一般句子當成名稱
# ======================================================================
# 「การท่องเที่ยว」大多是「觀光」這個一般詞，不當機構字頭（觀光局在內建名單裡）
rep("'การประปา', 'การท่องเที่ยว', 'การรถไฟ'", "'การประปา', 'การรถไฟ'")
# 名稱遇到這些詞就結束（數量詞、助動詞、常見動詞、副詞）
rep("  var NAMES = {}, FAMILY = {}, PLACES = {}, entsReady = false, ents = [], showEnts = true;",
    "  var NAME_BREAK = {};\n  ['บาง', 'หลาย', 'ทุก', 'ต่าง', 'ต่างๆ', 'จำนวน', 'มาก', 'น้อย', 'ดังกล่าว', 'นั้นๆ', 'ควร', 'ต้อง', 'อาจ', 'จึง', 'ยังคง', 'ถูก', 'ทำให้', 'สร้าง', 'ใกล้เคียง', 'ใหม่', 'เก่า', 'เดิม', 'ทั้งหมด', 'ส่วนใหญ่', 'กำลัง', 'เคย', 'จน', 'ระหว่าง', 'ช่วง', 'ประมาณ', 'เช่น', 'ได้แก่', 'เริ่ม', 'เพิ่ม', 'ลด', 'พยายาม', 'ผลักดัน', 'ควบคุม', 'ส่งเสริม', 'ครบ', 'กำหนด', 'ส่ง', 'คืน', 'ยืม', 'ปิด', 'เปิด', 'หลายแห่ง', 'แต่ละ', 'อื่น', 'อื่นๆ', 'ใด', 'ไหน', 'อะไร', 'นี่', 'ได้ที่', 'ทั่ว', 'ทั่วไป', 'เอง', 'ก็ตาม', 'มากมาย', 'ทั้งนี้', 'ทุกวัน', 'วันนี้', 'พรุ่งนี้', 'เมื่อวาน'].forEach(function (w) { NAME_BREAK[w] = 1; });\n"
    "  var ORG_GENERIC = { 'บริษัท': 1, 'โรงเรียน': 1, 'โรงพยาบาล': 1, 'ธนาคาร': 1, 'คณะ': 1, 'ค่าย': 1, 'สโมสร': 1, 'ห้างสรรพสินค้า': 1, 'สมาคม': 1, 'มูลนิธิ': 1, 'สถาบัน': 1, 'ศาล': 1, 'สภา': 1, 'สำนักงาน': 1, 'สำนัก': 1, 'สหภาพ': 1 };\n"
    "  var NAMES = {}, FAMILY = {}, PLACES = {}, entsReady = false, ents = [], showEnts = true;\n"
    "  var entOff = []; try { entOff = JSON.parse(localStorage.getItem('thai-ent-off') || '[]'); if (!Array.isArray(entOff)) { entOff = []; } } catch (err) { entOff = []; }")
rep("    function cutEnd(r, fromSeg) {",
    "    /* 這一段裡的詞是不是全都是字典裡的一般詞（沒有人名、地名、名單裡的名字） */\n"
    "    function entAllKnown(s0, e0) {\n"
    "      var any = false;\n"
    "      for (var q = 0; q < segs.length; q++) {\n"
    "        var g = segs[q]; if (g.i < s0 || g.i >= e0 || !/[ก-๎]/.test(g.t)) { continue; }\n"
    "        any = true;\n"
    "        if (g.gz || !known(g.t) || PLACES[g.t] || NAMES[g.t] || (DICT[g.t] && DICT[g.t].some(function (x) { return x[0] === 'name'; }))) { return false; }\n"
    "      }\n"
    "      return any;\n"
    "    }\n"
    "    function cutEnd(r, fromSeg) {")
rep("        if (ENT_STOP[g.t] || !/[ก-๎]/.test(g.t) || /^[“”\"'‘’()（）,，]/.test(g.t)) { break; }",
    "        if (ENT_STOP[g.t] || NAME_BREAK[g.t] || !/[ก-๎]/.test(g.t) || /^[“”\"'‘’()（）,，]/.test(g.t)) { break; }")
rep("        if (ENT_STOP[first.t] || !/[ก-๎]/.test(first.t)) { continue; }",
    "        if (ENT_STOP[first.t] || NAME_BREAK[first.t] || !/[ก-๎]/.test(first.t)) { continue; }")
rep("""          if (first.t === 'เรื่อง' && k2 + 1 < r.segs.length) { k2++; first = segs[r.segs[k2]]; }
          var e0 = cutEnd(r, r.segs[k2]), ttl = t.slice(first.i, e0);
          /* 「เรื่องใหม่」（新的）這種一般詞不是劇名 */
          if (!(known(ttl) && ttl.length <= 6)) { add(first.i, e0, 'work'); }""",
"""          var ruang = /เรื่อง$/.test(hit);
          if (first.t === 'เรื่อง' && k2 + 1 < r.segs.length) { k2++; first = segs[r.segs[k2]]; ruang = true; }
          if (NAME_BREAK[first.t] || ENT_STOP[first.t]) { a = k2; continue; }
          var e0 = cutEnd(r, r.segs[k2]), ttl = t.slice(first.i, e0), quoted = /[“"‘'«「]/.test(t.charAt(first.i - 1));
          /* 1.26：劇名、歌名要有「เรื่อง」或引號，不然整段都是一般詞（「ละครไทยมาก」「หนังสืออิเล็กทรอนิกส์」）就不算 */
          if ((ruang || quoted || !entAllKnown(first.i, e0)) && !(known(ttl) && ttl.length <= 6)) { add(first.i, e0, 'work'); }""")
rep("        add(g.i, e1, type);\n", "        if (type === 'org' && ORG_GENERIC[hit] && entAllKnown(hEnd, e1)) { continue; }\n        if (type === 'place' && entAllKnown(hEnd, e1) && (e1 - hEnd) > 12) { continue; }\n        add(g.i, e1, type);\n")

# ======================================================================
# 4. 設定：可以選要標示哪些類別
# ======================================================================
rep("getEnts().forEach(function (en) { marks.push({ s: en.s, e: en.e, c: 'ent ent-' + en.type }); });",
    "getEnts().forEach(function (en) { if (typeof entOff !== 'undefined' && entOff.indexOf(en.type) >= 0) { return; } marks.push({ s: en.s, e: en.e, c: 'ent ent-' + en.type }); });")
rep('<span class="sethelp">用淡色底標出推測的人名、機構、計畫、作品、地名與外來語。<span class="entlegend"><span class="ent-person">人名</span><span class="ent-org">機構</span><span class="ent-plan">計畫／政策</span><span class="ent-work">作品</span><span class="ent-place">地名</span><span class="ent-other">其他名稱</span><span class="ent-foreign">外來語</span></span></span>',
    '<span class="sethelp">用淡色底標出推測的人名、作品、機構、計畫、地名、菜名與外來語。下面的類別點一下就能開關，只標你需要的，例如只留人名和作品。<span class="entlegend" id="entTypes" role="group" aria-label="要標示哪些類別"></span></span>')
EN.update({'用淡色底標出推測的人名、作品、機構、計畫、地名、菜名與外來語。下面的類別點一下就能開關，只標你需要的，例如只留人名和作品。':
           'Lightly shades likely names of people, works, organizations, plans, places, dishes and loanwords. Tap a kind below to turn it on or off, so only what you need is marked — for example just people and works.',
           '要標示哪些類別': 'Which kinds to mark'})
rep("""        showEnts = v === 'on'; try { localStorage.setItem('thai-show-ents', showEnts ? '1' : '0'); } catch (err) {}
        renderSettings(); renderText(); renderReport();
      });""", """        showEnts = v === 'on'; try { localStorage.setItem('thai-show-ents', showEnts ? '1' : '0'); } catch (err) {}
        renderSettings(); renderText(); renderReport();
      });
      var etHost = $('entTypes');
      if (etHost) {
        etHost.replaceChildren();
        [['person', '人名'], ['work', '作品'], ['org', '機構'], ['plan', '計畫／政策'], ['place', '地名'], ['food', '菜名'], ['other', '其他名稱'], ['foreign', '外來語']].forEach(function (x) {
          var on = entOff.indexOf(x[0]) < 0, bt = document.createElement('button');
          bt.type = 'button'; bt.className = 'entchip ent-' + x[0]; bt.textContent = x[1];
          bt.setAttribute('aria-pressed', String(on)); bt.disabled = !showEnts;
          bt.addEventListener('click', function () {
            entOff = on ? entOff.concat([x[0]]) : entOff.filter(function (k) { return k !== x[0]; });
            try { localStorage.setItem('thai-ent-off', JSON.stringify(entOff)); } catch (err) {}
            renderSettings(); renderText(); renderReport();
          });
          etHost.appendChild(bt);
        });
        var eg = $('entGroup');
        if (eg && eg.nextElementSibling !== etHost) { var ps = etHost.parentNode; eg.parentNode.insertBefore(etHost, eg.nextSibling); if (ps && ps.classList.contains('setstat') && !ps.childNodes.length) { ps.remove(); } }
      }""")
rep("'thai-show-ents', 'thai-welcome-v1',", "'thai-show-ents', 'thai-ent-off', 'thai-welcome-v1',")
rep("glossLang = localStorage.getItem('thai-gloss-lang') || glossLang; showEnts = localStorage.getItem('thai-show-ents') !== '0';",
    "glossLang = localStorage.getItem('thai-gloss-lang') || glossLang; showEnts = localStorage.getItem('thai-show-ents') !== '0'; try { entOff = JSON.parse(localStorage.getItem('thai-ent-off') || '[]') || []; } catch (err) {}")
rep('</style>', """
/* 1.26 專有名詞類別開關 */
.entlegend button.entchip { min-height: 34px; padding: 0 12px; border: 1px solid transparent; border-radius: 999px; font-size: 14px; font-weight: 600; color: var(--fg); background: rgba(var(--ec), 0.16); box-shadow: inset 0 -2px 0 rgba(var(--ec), 0.6); }
.entlegend button.entchip[aria-pressed="false"] { background: transparent; box-shadow: none; border: 1px dashed var(--line); color: var(--muted); font-weight: 500; text-decoration: line-through; }
.entlegend button.entchip:disabled { opacity: .45; }\n#entTypes { margin-top: 10px; }
</style>""")
EN.update({'計畫／政策': 'Plan / policy', '機構': 'Organization', '其他名稱': 'Other name', '外來語': 'Loanword', '作品': 'Work', '人名': 'Person', '地名': 'Place'})

# 說明（中文）：設定裡專有名詞那條
a2 = s.index('  var I18N_EN = '); b2 = s.index(';\n', a2)
dd = json.loads(s[a2 + len('  var I18N_EN = '):b2])
for k, v in EN.items():
    dd.setdefault(k, v)
s = s[:a2] + '  var I18N_EN = ' + json.dumps(dd, ensure_ascii=False, separators=(',', ':')) + s[b2:]
open(src, 'w', encoding='utf-8').write(s)
print('v35 ok')
