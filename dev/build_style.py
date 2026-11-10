# 按鈕外觀整理：同一排的按鈕一樣大、不會只剩一顆掉到下一排
import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
CSS = '''
/* ---------- 按鈕外觀整理 ---------- */
.seg { gap: 6px; }
.seg button { min-height: 36px; padding: 0 14px; font-size: 14px; border-radius: 999px; }
/* 資料夾列：分類和「＋ 新資料夾」排在同一行 */
#homeFolders, #cardFolders { display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 6px; margin: 4px 0 10px; }
#homeFolders > .label, #cardFolders > .label { flex-basis: 100%; margin-top: 4px; }
#homeFolders > .seg, #cardFolders > .seg, #homeFolders > .frow, #cardFolders > .frow { display: contents; }
#homeFolders .frow > button, #cardFolders .frow > button { min-height: 36px; padding: 0 14px; font-size: 14px; border-radius: 999px; }
#homeFolders .frow > button:first-child, #cardFolders .frow > button:first-child { border-style: dashed; background: transparent; color: var(--muted); }
#homeFolders .frow > input.fname, #cardFolders .frow > input.fname { min-height: 36px; border-radius: 999px; padding: 0 14px; flex: 1 1 160px; max-width: 280px; }
/* 生字卡的「複習／全部清單」：做成一個切換鈕 */
#cardTabs { display: inline-flex; gap: 0; padding: 3px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); margin: 14px 0 6px; }
#cardTabs button { border: 0; background: transparent; min-height: 34px; padding: 0 18px; }
#cardTabs button[aria-checked="true"] { background: var(--accent-fill); color: var(--accent-fill-fg); }
/* 筆記工具列：維持一排，太窄時可以左右滑，不會只剩一顆掉到下一排 */
.workbox .toolbar { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.workbox .toolbar::-webkit-scrollbar { display: none; }
.workbox .toolbar > * { flex: 0 0 auto; }
/* 查詞視窗：按鈕排成整齊的格子 */
.pop .links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pop .links > * { width: 100%; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; text-align: center; min-height: 40px; padding: 0 8px; font-size: 14px; border-radius: 10px; }
.pop .links > :last-child:nth-child(odd) { grid-column: 1 / -1; }
.pop .ent-sec .row2 { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; }
.pop .ent-sec .row2 > * { width: 100%; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; text-align: center; min-height: 38px; padding: 0 6px; font-size: 14px; border-radius: 10px; }
'''
s = s.replace('aria-controls="trpanel">整篇翻譯（Google 翻譯）</button>', 'aria-controls="trpanel">整篇翻譯</button>', 1)
s = s.replace('id="pencil" aria-pressed="false">只讓 Apple Pencil 畫</button>', 'id="pencil" aria-pressed="false">只用 Pencil 畫</button>', 1)
old = "    links.appendChild(trs);\n"
assert s.count(old) == 1
s = s.replace(old, "    links.insertBefore(trs, say.nextSibling);\n")
i = s.index('</style>')
s = s[:i] + CSS + s[i:]
open(src, 'w', encoding='utf-8').write(s)
print('style ok')
