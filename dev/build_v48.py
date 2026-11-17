import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v48_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = ''
EN = {}
# 文件頁：原文連結放到標題下面
rep('<h1 id="h-docv">文件</h1>', '<div class="vhtitle"><h1 id="h-docv">文件</h1><a id="docSrc" class="docsrc" target="_blank" rel="noopener noreferrer" hidden></a></div>')
rep('    <a id="docSrc" class="docsrc" target="_blank" rel="noopener noreferrer" hidden></a>\n', '')
CSS += """
/* 1.40 介面整理 */
.vhtitle { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.vhtitle h1 { flex: none; }
.vhtitle .docsrc { margin: 0; font-size: 13.5px; font-weight: 600; line-height: 1.4; align-self: flex-start; }
#hint[hidden], #docstatus[hidden] { display: none; }
/* 螢光筆底線：細一點 */
#text mark.hl.hlu { background: linear-gradient(transparent calc(100% - .14em), var(--hlu, rgba(255, 200, 0, .85)) calc(100% - .14em)); }
#text.pdf mark.hl.hlu { background: linear-gradient(transparent calc(100% - .14em), var(--hlu, rgba(255, 200, 0, .85)) calc(100% - .14em)); }
/* 文件上方的按鈕：播放最重要；翻譯、對照、修改是次要的，改成淡一點的文字按鈕 */
.ttsbar #translateAll, .ttsbar #glossAll, .ttsbar #editText { border-color: transparent; background: transparent; color: var(--accent); font-weight: 600; min-height: 40px; padding: 0 10px; box-shadow: none; }
.ttsbar #translateAll[aria-expanded="true"], .ttsbar #glossAll[aria-expanded="true"] { background: color-mix(in srgb, var(--accent) 12%, transparent); }
/* 中英文行開關：跟文章對齊、不要刪除線 */
.mixbar { padding: 4px 12px 8px; gap: 8px; font-size: 15px; margin: 0; }
.mixbar .label { font-size: 15px; color: var(--muted); }
.mixb { min-height: 36px; padding: 0 14px; border-radius: 18px; font-size: 15px; font-weight: 600; }
.mixb[aria-pressed="true"] { background: color-mix(in srgb, var(--accent) 14%, var(--card)); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
.mixb[aria-pressed="true"]::before { content: "✓"; margin-right: 5px; }
.mixb[aria-pressed="false"] { text-decoration: none; background: transparent; color: var(--muted); border: 1px dashed var(--line); }
.mixb[aria-pressed="false"]::after { content: attr(data-off); margin-left: 4px; font-weight: 400; }
/* 主頁：同步狀態 */
#view-home .vhead { justify-content: flex-start; }
#view-home .vhead h1 { flex: 0 1 auto; }
.syncdot { width: auto; min-width: 44px; padding: 0 10px; gap: 5px; border-radius: 999px; color: #2e7d4f; font-size: 13.5px; font-weight: 600; }
.syncdot svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
.syncdot.err { color: #b3362c; }
.syncdot.busy { color: var(--muted); }
.syncdot.busy svg { animation: sdpulse 1.2s ease-in-out infinite; }
@keyframes sdpulse { 50% { opacity: .35; } }
.syncdot .sd { display: none; }
/* 主頁：繼續讀一整排；任務和讀物庫變成一行小字 */
.hpills[hidden] { display: none; }
.hpills .hpread { flex: 1 1 auto; min-width: 0; }
.hquiet { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 18px; margin: 4px 0 6px; }
.hquiet #questHost { flex: 0 1 auto; min-width: 0; }
.hquiet .mapbar { width: auto; max-width: 100%; min-height: 40px; margin: 0; padding: 0 2px; border: 0; background: transparent; font-size: 14.5px; }
.hquiet .mapbar .mbbar { display: none; }
.hquiet .mapbar .mbk { color: var(--muted); font-weight: 600; }
.hquiet .hqlink { min-height: 40px; padding: 0 2px; border: 0; background: transparent; color: var(--accent); font-size: 14.5px; font-weight: 600; gap: 6px; }
.hquiet .hqlink .hpsub { display: none; }
.hquiet .hqlink:hover, .hquiet .mapbar:hover { background: transparent; text-decoration: underline; }
"""
EN.update({'已同步': 'Synced', '同步中': 'Syncing', '同步有問題': 'Sync issue', '離線': 'Offline', '（收起）': ' (hidden)'})
rep("  $('docSrc').parentNode.insertBefore(softBox, $('docSrc'));", "  (function () { var vh = document.querySelector('#view-doc .vhead'); vh.parentNode.insertBefore(softBox, vh.nextSibling); })();")
rep("  $('docSrc').parentNode.insertBefore(rrBox, $('docSrc'));", "  (function () { var sb = $('softHint'); sb.parentNode.insertBefore(rrBox, sb.nextSibling); })();")
#@@MORE@@
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v48 ok')
