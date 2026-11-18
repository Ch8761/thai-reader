import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v50_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = """
/* 1.42 生字卡範圍列 */
#cardFolders[hidden], #cardScope[hidden] { display: none !important; }
.cscope { position: relative; margin: 14px 0 12px; }
.csrow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cschip, .csadd { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); color: var(--fg); font-size: 15px; font-weight: 500; white-space: nowrap; box-shadow: none; }
.cschip svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; flex: none; }
.cschip.csfav svg { fill: #e0a326; stroke: #e0a326; }
.cschip .csc { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
.cschip[aria-checked="true"] { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
.cschip[aria-checked="true"] .csc { color: rgba(255, 255, 255, .85); }
.cschip[aria-checked="true"].csfav svg { fill: #ffd56b; stroke: #ffd56b; }
.cschip .csmore { width: 16px; height: 16px; margin-right: -4px; stroke-width: 2.2; }
.cssep { width: 1px; height: 22px; background: var(--line); margin: 0 2px; }
.csadd { border-style: dashed; color: var(--accent); background: transparent; }
.csadd svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.2; }
.cseditor { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.cseditor .fname { flex: 1 1 220px; min-height: 44px; border-radius: 12px; padding: 0 14px; }
.cstarget { margin-top: 8px; font-size: 13.5px; color: var(--muted); }
@media (max-width: 600px) {
  .csrow { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 2px 16px; }
  .csrow::-webkit-scrollbar { display: none; }
}
.clcount { font-size: 14.5px; color: var(--muted); align-self: center; }
/* 複習 */
.revhero { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 22px 22px 18px; margin: 4px 0 8px; }
.rvbig { display: flex; align-items: baseline; gap: 10px; }
.rvnum { font-size: 48px; font-weight: 700; line-height: 1; color: var(--accent); font-variant-numeric: tabular-nums; }
.rvunit { font-size: 17px; font-weight: 600; }
.rvsub { margin: 8px 0 14px; color: var(--muted); font-size: 14.5px; line-height: 1.55; }
.revhero .btns { margin: 0; }
/* 測驗設定 */
.qsetup { display: flex; flex-direction: column; gap: 16px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 18px; margin: 12px 0 10px; }
.qsh { display: flex; align-items: baseline; gap: 8px; font-weight: 700; font-size: 15.5px; margin-bottom: 8px; }
.qshint { font-weight: 400; font-size: 13px; color: var(--muted); }
.qschips { display: flex; flex-wrap: wrap; gap: 8px; }
.qschip { display: inline-flex; align-items: center; gap: 7px; min-height: 42px; padding: 0 14px 0 10px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); font-size: 15px; box-shadow: none; }
.qschip .qsck { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--muted); flex: none; position: relative; }
.qschip[aria-pressed="true"] { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--card)); font-weight: 600; }
.qschip[aria-pressed="true"] .qsck { background: var(--accent); border-color: var(--accent); }
.qschip[aria-pressed="true"] .qsck::after { content: ""; position: absolute; left: 5px; top: 1.5px; width: 5px; height: 10px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.qschip .csc { font-size: 13px; color: var(--muted); }
.qschip.qsnum { padding: 0 16px; min-width: 64px; justify-content: center; }
.qschip.qsnum .qsck { display: none; }
.qsnote { margin: 4px 0 8px; }
/* 主頁：讀物庫在匯入旁邊；連續天數 */
.importbar .impread { display: inline-flex; align-items: center; gap: 6px; flex: none; min-height: 46px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--accent); font-weight: 700; font-size: 15px; white-space: nowrap; }
.importbar .impread .hri, .importbar .impread svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; }
.importbar .impread .hpt { display: inline; }
.hstreak { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0 12px 0 8px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); color: var(--fg); font-size: 14px; box-shadow: none; }
.hstreak svg { width: 24px; height: 24px; }
.hstreak b { font-size: 17px; font-variant-numeric: tabular-nums; }
.hstreak.zero svg { filter: grayscale(1); opacity: .45; }
.hstreak.zero b { color: var(--muted); }
/* 主頁文件清單：每一列不再攤開「資料夾下拉＋刪除」，收進 ⋯ */
#docList:not(.grid) .doccard .dside { display: none; }
#docList:not(.grid) .doccard .dopen { padding-right: 52px; }
#docList:not(.grid) .dmore { display: inline-flex; position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 44px; min-width: 44px; height: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--muted); align-items: center; justify-content: center; }
#docList:not(.grid) .dmore svg { width: 20px; height: 20px; }
#docList:not(.grid) .doccard.menu { z-index: 6; }
#docList:not(.grid) .doccard.menu .dside { display: flex; flex-direction: column; gap: 6px; position: absolute; right: 8px; top: calc(50% + 24px); z-index: 7; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 8px; box-shadow: 0 10px 28px rgba(0, 0, 0, .16); min-width: 200px; }
#docList.selecting .dmore { display: none !important; }
"""
EN = {}
rep("['list', '清單（' + cards.filter(inFolder).length + '）']", "['list', L2('卡片（', 'Cards (') + cards.filter(inFolder).length + L2('）', ')')]")
rep("    var cfh = $('cardFolders'); if (cfh && !cfh.querySelector('.cflab')) { cfh.insertBefore(el('span', 'cflab', '資料夾'), cfh.firstChild); }\n", "")
# 測驗設定畫面換成新的（範圍、題型可複選）
a = s.index("    if (!quiz) {\n      host.appendChild(el('p', 'label', fc ? '從這個資料夾隨機出最多 10 題")
b = s.index("    if (quiz.k >= quiz.qs.length) {", a)
s = s[:a] + "    if (!quiz) { quizSetup(host); return; }\n" + s[b:]
rep("      l.appendChild(el('span', 'clast', lastLine(c)));", "      if (lastTs(c)) { l.appendChild(el('span', 'clast', lastLine(c))); }")
CSS += """
.csadd { width: 40px; min-width: 40px; padding: 0; justify-content: center; }
.csadd span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
#homeFolders .viewtoggle { margin-left: 8px; align-self: center; }
#view-home .homebar:empty, #view-home .homebar[hidden] { display: none; }
.hquiet[hidden] { display: none; }
"""
CSS += """
@media (max-width: 600px) {
  #view-home .importbar { flex-wrap: wrap; }
  #view-home .importbar .impbtn, #view-home .importbar .impread { flex: 1 1 0; justify-content: center; }
  #view-home .importbar .urlbar { flex: 1 1 100%; order: 3; }
}
"""
#@@MORE@@
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v50 ok')
