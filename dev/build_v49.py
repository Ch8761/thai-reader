import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v49_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = """
/* 1.41 匯出入 */
.cximp { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); }
.cximph { font-size: 16px; margin: 0 0 4px; }
.cximpbtn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); font-weight: 600; cursor: pointer; margin-top: 6px; }
"""
EN = {}
rep('<h2 id="h-export">匯出 PDF</h2>', '<h2 id="h-export">匯出</h2>')
EN.update({'匯出': 'Export'})
rep('id="openExport" aria-expanded="false" aria-controls="exportp">匯出 PDF<', 'id="openExport" aria-expanded="false" aria-controls="exportp">匯出<')
rep("{ t: '匯出生字卡', s: '標題右邊的「匯出」，存成 Word、PDF 或 Anki'", "{ t: '匯出生字卡', s: '標題右邊的「匯出」：Word、PDF、Anki、CSV、Markdown、JSON；也能從 CSV 加入'")
rep("{ t: 'Export flashcards', s: '「Export」 next to the title: save as Word, PDF or Anki'", "{ t: 'Export flashcards', s: '「Export」 next to the title: Word, PDF, Anki, CSV, Markdown or JSON; you can also add cards from CSV'")
#@@MORE@@
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v49 ok')
