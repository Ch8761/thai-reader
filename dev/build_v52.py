import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v52_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = ''
EN = {}
rep("      help.remove();\n      var head = document.createElement('span'); head.className = 'setname';", "      help.remove();\n      lab.__help = html;\n      var head = document.createElement('span'); head.className = 'setname';")
rep("""      ['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'fontGroup', 'thFontGroup', 'flameGroup']],
      ['read', '閱讀與查詞', ['levelGroup', 'romGroup', 'glossGroup', 'entGroup', 'rrShowGroup', 'revCapGroup', 'toneGroup', 'ocrZhGroup', 'ocrEngGroup', 'unkGroup', 'immGroup', 'deskewGroup', 'ocrPreBtn']],""",
"""      ['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'thFontGroup', 'fontGroup', 'flameGroup']],
      ['read', '閱讀與查詞', ['levelGroup', 'glossGroup', 'romGroup', 'entGroup', 'unkGroup', 'rrShowGroup', 'immGroup']],
      ['cards', '生字卡與複習', ['revCapGroup', 'toneGroup']],
      ['ocr', '照片與影片辨識', ['ocrEngGroup', 'ocrZhGroup', 'deskewGroup', 'ocrPreBtn']],""")
EN.update({'生字卡與複習': 'Flashcards & review', '照片與影片辨識': 'Photo & video recognition', '更改': 'Change'})
# 設定首頁的程度數字要跟著更新：settingsOpen 寬螢幕時直接打開第一類
rep("    function settingsOpen(key) {\n      cur = key && boxes[key] ? key : null;", "    function settingsOpen(key) {\n      if (!key && window.matchMedia && window.matchMedia('(min-width: 760px)').matches) { key = cur || 'look'; }\n      cur = key && boxes[key] ? key : null;\n      menu.querySelectorAll('.setmi').forEach(function (m) { if (m.getAttribute('data-grp') === cur) { m.setAttribute('aria-current', 'page'); } else { m.removeAttribute('aria-current'); } });")
CSS += """
/* 1.44 設定頁 */
#view-settings.set2 .settings { max-width: 980px; }
.setsum { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 76px; padding: 14px 16px; margin: 4px 0 14px; border: 1px solid var(--line); border-radius: 18px; background: var(--card); color: var(--fg); text-align: left; box-shadow: none; }
.setsum .ssav { width: 46px; height: 46px; flex: none; border-radius: 14px; background: color-mix(in srgb, var(--accent) 16%, var(--card)); color: var(--accent); display: flex; align-items: center; justify-content: center; font-family: var(--thai); font-size: 24px; font-weight: 600; }
.setsum .sstx { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.setsum .sstx b { font-size: 16.5px; }
.setsum .sstx span { font-size: 13.5px; color: var(--muted); }
.setsum .ssgo { font-size: 14.5px; font-weight: 600; color: var(--accent); }
#view-settings.set2 .setmenu { border-radius: 18px; }
#view-settings.set2 .setmi { gap: 14px; min-height: 62px; padding: 8px 14px; justify-content: flex-start; }
#view-settings.set2 .setmi .smtx { flex: 1 1 auto; min-width: 0; text-align: left; align-items: stretch; }
#view-settings.set2 .setmi .sms { display: block; }
#view-settings.set2 .setlabel { display: flex; flex-direction: column; align-items: stretch; }
#view-settings.set2 .setlabel .entlegend { margin-top: 8px; }
.setsum .ssgo { white-space: nowrap; }
@media (max-width: 759px) { .setsum.away { display: none; } }
#view-settings.set2 #fontGroup button { padding: 0 12px; white-space: nowrap; }
#view-settings.set2 .setmi .smt { font-size: 16px; }
#view-settings.set2 .setmi .sms { font-size: 12.5px; }
.smico { width: 32px; height: 32px; flex: none; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.smico svg { width: 18px; height: 18px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
#view-settings.set2 .setmi[aria-current="page"] { background: color-mix(in srgb, var(--accent) 12%, var(--card)); }
/* 每一類的設定：一張卡片 */
#view-settings.set2 .setgrp { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 2px 16px; margin: 4px 0 16px; }
#view-settings.set2 .setgrp > .setrow { border-top: 1px solid color-mix(in srgb, var(--line) 70%, transparent); padding: 14px 0; gap: 10px 16px; flex-wrap: nowrap; }
#view-settings.set2 .setgrp > .setrow:first-child { border-top: 0; }
#view-settings.set2 .setrow.stack { flex-direction: column; align-items: stretch; flex-wrap: nowrap; }
#view-settings.set2 .setrow.stack .setlabel { flex: none; }
#view-settings.set2 .setlabel { flex: 1 1 auto; }
#view-settings.set2 .setname { font-size: 16px; }
.setdesc { font-size: 13px; color: var(--muted); font-weight: 400; line-height: 1.5; }
/* 分段按鈕：連在一起，選中的是白色 */
#view-settings.set2 .seg:not(.swhidden):not(#thFontGroup):not(#fontGroup) { display: inline-grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 0; padding: 3px; border-radius: 12px; background: color-mix(in srgb, var(--line) 55%, var(--bg)); flex: none; }
#view-settings.set2 .setrow.stack .seg:not(#thFontGroup):not(#fontGroup) { display: grid; }
#view-settings.set2 .seg:not(#thFontGroup):not(#fontGroup) button { min-height: 40px !important; padding: 0 12px; border: 0; border-radius: 10px; background: transparent; color: var(--fg); font-size: 14.5px; font-weight: 500; white-space: nowrap; box-shadow: none; }
#view-settings.set2 .seg:not(#thFontGroup):not(#fontGroup) button[aria-checked="true"] { background: var(--card); color: var(--fg); font-weight: 700; box-shadow: 0 1px 3px rgba(38, 51, 46, .2); }
.swhidden { display: none !important; }
/* 開關 */
.swt { flex: none; position: relative; width: 52px; min-width: 52px; height: 32px; min-height: 32px; padding: 0; border: 0; border-radius: 16px; background: color-mix(in srgb, var(--line) 85%, var(--muted)); box-shadow: none; transition: background .18s; align-self: center; }
.swt::before { content: ''; position: absolute; inset: -6px; }
.swt .swk { position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .25); transition: left .18s; }
.swt[aria-checked="true"] { background: var(--accent); }
.swt[aria-checked="true"] .swk { left: 23px; }
@media (prefers-reduced-motion: reduce) { .swt, .swt .swk { transition: none; } }
.setrow.hasswitch .setstat .entlegend { margin-top: 6px; }
/* 泰文字體：字樣卡片 */
#view-settings.set2 #thFontGroup { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); grid-auto-rows: 1fr; gap: 10px; }
#view-settings.set2 #thFontGroup button { display: flex; flex-direction: column-reverse; align-items: flex-start; justify-content: flex-end; gap: 2px; min-height: 86px !important; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--card); color: var(--fg); font-size: 13px; font-weight: 600; text-align: left; white-space: normal; box-shadow: none; }
#view-settings.set2 #thFontGroup .thfs { font-size: 25px; line-height: 1.35; font-weight: 400; }
#view-settings.set2 #thFontGroup button[aria-checked="true"] { border: 2px solid var(--accent); padding: 9px 11px; background: color-mix(in srgb, var(--accent) 8%, var(--card)); color: var(--fg); }
/* 中文字體：一排一個 */
#view-settings.set2 #fontGroup { display: grid; grid-auto-flow: row; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; padding: 0; background: none; }
#view-settings.set2 #fontGroup button { min-height: 48px !important; border: 1px solid var(--line); border-radius: 12px; background: var(--card); font-size: 16px; }
#view-settings.set2 #fontGroup button[aria-checked="true"] { border: 2px solid var(--accent); box-shadow: none; }
/* 小火苗：預覽圖 */
#view-settings.set2 #flameGroup button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 48px !important; }
.flpv { display: inline-flex; width: 22px; height: 22px; }
.flpv svg { width: 22px; height: 22px; }
/* 火苗：今天讀過會動、還沒讀是灰的、關掉不顯示 */
svg.achfl.fl-anim { transform-origin: 50% 88%; animation: flick52 1.1s ease-in-out infinite; }
svg.achfl.fl-dim { filter: grayscale(1); opacity: .5; }
svg.achfl.fl-off { display: none; }
@keyframes flick52 { 0%, 100% { transform: scale(1, 1) rotate(-3deg); } 50% { transform: scale(1.06, 1.14) rotate(3deg); } }
@media (prefers-reduced-motion: reduce) { svg.achfl.fl-anim { animation: none; } }
.hstreak[hidden] { display: none !important; }
#view-settings.set2 .setgrp > .setrow.hasswitch { flex-direction: row; flex-wrap: wrap; align-items: center; }
#view-settings.set2 .setrow.hasswitch > .setlabel { flex: 1 1 0; min-width: 0; }
#view-settings.set2 .setrow.hasswitch > :not(.setlabel):not(.swt):not(.swhidden) { flex-basis: 100%; order: 3; }
/* iPad：左邊分類、右邊內容 */
@media (min-width: 760px) {
  #view-settings.set2 .settings { display: grid; grid-template-columns: 260px minmax(0, 1fr); column-gap: 28px; align-items: start; }
  #view-settings.set2 .setsum { grid-column: 1; grid-row: 1; }
  #view-settings.set2 .setmenu, #view-settings.set2 .setmenu[hidden] { grid-column: 1; grid-row: 2; display: flex !important; }
  #view-settings.set2 .setgrp, #view-settings.set2 .setmainonly, #view-settings.set2 .testtools { grid-column: 2; grid-row: 1 / span 40; }
  #view-settings.set2 .vhead .back { display: none !important; }
  #view-settings.set2 .setmi .smchev { display: none; }
  #view-settings.set2 .setsum .ssav { width: 40px; height: 40px; font-size: 21px; }
}
@media (max-width: 600px) {
  #view-settings.set2 .setgrp > .setrow:not(.hasswitch) { flex-direction: column; align-items: stretch; }
  #view-settings.set2 .setgrp > .setrow:not(.hasswitch) .seg:not(#thFontGroup):not(#fontGroup) { display: grid; }
}
"""
# 資料：簡體字改繁體（名人清單、字典），กลับบ้าน 的錯誤詞義
import opencc as _cc, json as _json, re as _re
_c = _cc.OpenCC('s2t')
STRICT = set('毕晓亚銮尔纳伟爱达变鹏运陈壮参维凯伦罗库萨顾亲国间机强炽戏庞吗龙诺团医队触')
def _fix_block(bid):
    global s
    m = _re.search(r'(<script[^>]*id="' + bid + r'"[^>]*>)(.*?)(</script>)', s, flags=_re.S)
    body = m.group(2)
    def conv(mm):
        t = mm.group(0)
        return _c.convert(t) if any(ch in STRICT for ch in t) else t
    nb = _re.sub(r'[㐀-鿿]+', conv, body)
    s = s[:m.start(2)] + nb + s[m.end(2):]
_fix_block('celebdata')
m = _re.search(r'(<script[^>]*id="dictdata"[^>]*>)(.*?)(</script>)', s, flags=_re.S)
dd = _json.loads(m.group(2)); W = dd.get('words', dd)
W['กลับบ้าน'] = [["verb", "glàp-bâan", "/klap̚˨˩.baːn˥˩/", ["to go home; to return home"], ["回家"]]]
s = s[:m.start(2)] + _json.dumps(dd, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
rep('小火苗<span class="sethelp">學習時偶爾冒出的小鼓勵，只有一個小圖示。可以選動態、靜態（不會動）或關閉。手機開了「減少動態效果」時，會自動變成靜態。</span>', '小火苗<span class="sethelp">連續天數旁邊的火苗：今天讀過會亮起來，還沒讀是灰色。「會動」時亮起的火苗會輕輕晃動，完成任務時也會跳出來鼓勵你；「不動」只顯示圖示；「不顯示」連主頁右上角的火苗也收起來。手機開了「減少動態效果」時，會自動變成不動。</span>')
EN.update({'連續天數旁邊的火苗：今天讀過會亮起來，還沒讀是灰色。「會動」時亮起的火苗會輕輕晃動，完成任務時也會跳出來鼓勵你；「不動」只顯示圖示；「不顯示」連主頁右上角的火苗也收起來。手機開了「減少動態效果」時，會自動變成不動。': 'The flame next to your streak: it lights up once you have studied today and stays grey until then. With “Animated” the lit flame flickers gently and also pops up to cheer you on when you finish a task; “Still” shows the icon without movement; “Hidden” also removes the flame from the top right of the home page. If your device has “Reduce Motion” turned on, it stays still.'})
for a, b2 in [
    ('設定 → 閱讀與查詞 → 辨識中文', '設定 → 照片與影片辨識 → 辨識中文'),
    ('Settings → Reading & lookup → Recognize Chinese', 'Settings → Photo & video recognition → Recognize Chinese'),
    ('到「設定」→「閱讀與查詞」，找「每天複習上限」', '到「設定」→「生字卡與複習」，找「每天複習上限」'),
    ('Settings → “Reading & lookup” and find “Daily review', 'Settings → “Flashcards & review” and find “Daily review'),
    ('Settings → Reading and look-up', 'Settings → Reading & lookup'),
    ('外觀與字體、閱讀與查詞、我的詞庫、資料與同步、說明與回饋', '外觀與字體、閱讀與查詞、生字卡與複習、照片與影片辨識、我的詞庫、資料與同步、說明與回饋'),
    ('(Appearance & fonts, Reading & lookup, My word lists, Data & sync, Help & feedback)', '(Appearance & fonts, Reading & lookup, Flashcards & review, Photo & video recognition, My word lists, Data & sync, Help & feedback)'),
    ("b.setAttribute('aria-label', G[1] + '，下次 ' + ivlText(nextIvl(c, G[0])));", "b.setAttribute('aria-label', G[1] + L2('，下次複習：', ', next review: ') + ivlText(nextIvl(c, G[0])));"),
]:
    print('fix', s.count(a), a[:30])
    s = s.replace(a, b2)
#@@MORE@@
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v52 ok')
