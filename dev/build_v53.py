import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v53_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = ''
EN = {}
# 設定頁 iPad 不再分兩欄、不自動打開第一類
rep("      if (!key && window.matchMedia && window.matchMedia('(min-width: 760px)').matches) { key = cur || 'look'; }\n", "")
a = s.index("/* iPad：左邊分類、右邊內容 */")
b = s.index("@media (max-width: 600px) {\n  #view-settings.set2 .setgrp > .setrow:not(.hasswitch)", a)
s = s[:a] + s[b:]
CSS += """
#view-settings.set3 .settings { max-width: 760px; }
.setsum.away { display: none !important; }
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
print('v53 ok')
