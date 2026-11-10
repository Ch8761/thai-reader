import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# 工具框最上面一行：左邊顯示比例＋頁碼，右邊上一步／下一步／清除全部
rep("\n  renderToolOpts(); syncUndoButtons();\n", r'''
  (function () {
    var head = $('toolhead'); if (!head) { return; }
    var top = document.createElement('div'); top.className = 'toprow'; top.id = 'toprow';
    var hist = document.createElement('div'); hist.className = 'histbtns'; hist.setAttribute('role', 'group'); hist.setAttribute('aria-label', '上一步、下一步、清除全部');
    ['undo', 'redo', 'clear'].forEach(function (id) { var el = $(id); if (el) { hist.appendChild(el); } });
    if ($('viewbar')) { top.appendChild($('viewbar')); }
    top.appendChild(hist);
    head.insertBefore(top, head.firstChild);
    var sep = head.querySelector('.toolbar .sep'); if (sep) { sep.remove(); }
  })();
  renderToolOpts(); syncUndoButtons();
''')

CSS = r'''
/* ---- v1.9 工具框：上排（比例｜上一步、下一步、清除）、工具列（Pencil 靠右） ---- */
.toprow { display: flex; align-items: center; gap: 8px; padding: 8px 10px 0; min-height: 42px; }
.toprow .viewbar { margin-left: 0; }
.toprow .vb-menu { left: 0; right: auto; }
.histbtns { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.histbtns .iconbtn { width: 34px; min-width: 34px; height: 34px; min-height: 34px; border-radius: 50%; }
.histbtns .iconbtn svg { width: 18px; height: 18px; }
.histbtns #clear { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; margin-left: 4px; }
.workbox .toolbar #pencil { margin-left: auto; }
.subbar:not(:has(> :not([hidden]))) { display: none; }
.subbar { padding-top: 0; }
/* 朗讀進度條：不要外框 */
.player { border: 0; background: transparent; padding: 0; min-height: 44px; gap: 8px; }
.player .iconbtn:not(.play) { color: var(--muted); }
#ttsSeek::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
#ttsSeek::-webkit-slider-thumb { margin-top: -7px; }
.sw2.custom.picked::after { background: var(--sw); }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v19 ok')
