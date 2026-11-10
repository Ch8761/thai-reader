import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
I_REDO_OCR = '<svg ' + SV + '><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4.5V9h-4.5"/></svg>'
I_UNDO = '<svg ' + SV + '><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>'
I_REDO = '<svg ' + SV + '><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>'
I_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" fill="currentColor"/></svg>'
I_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.2" fill="currentColor"/></svg>'

# ---------- 1. 重新辨識：移到「匯出 PDF」旁邊，只用符號 ----------
rep('<button type="button" id="openExport" aria-expanded="false" aria-controls="exportp">匯出 PDF</button></header>',
    '<span class="vh-acts"><button type="button" class="iconbtn" id="ocrRedo" aria-label="重新辨識" title="重新辨識（用文字辨識再讀一次）" hidden>' + I_REDO_OCR + '</button>'
    '<button type="button" id="openExport" aria-expanded="false" aria-controls="exportp">匯出 PDF</button></span></header>')
rep('        <button type="button" id="ocrRedo" hidden>重新辨識</button>\n', '')
rep("    if (!pdf) { box.hidden = true; if (typeof syncDocSec === 'function') { syncDocSec(); } return; }",
    "    if (!pdf) { box.hidden = true; $('ocrRedo').hidden = true; if (typeof syncDocSec === 'function') { syncDocSec(); } return; }")

# ---------- 2. 朗讀列：慢速｜播放＋進度條＋停止｜整篇翻譯 ----------
rep('''    <button type="button" id="readAll">朗讀全文</button>
    <button type="button" id="stopRead">停止</button>
    <button type="button" class="toggle" id="slow" aria-pressed="false">慢速</button>
    <button type="button" id="translateAll" aria-expanded="false" aria-controls="trpanel">整篇翻譯</button>''',
'''    <button type="button" class="toggle" id="slow" aria-pressed="false">慢速</button>
    <div class="player" id="player" role="group" aria-label="朗讀全文">
      <button type="button" class="iconbtn play" id="readAll" aria-label="播放朗讀全文" title="播放">''' + I_PLAY + '''</button>
      <input type="range" id="ttsSeek" min="0" max="1000" step="1" value="0" aria-label="朗讀進度（可以拖曳）">
      <button type="button" class="iconbtn" id="stopRead" aria-label="停止朗讀，回到開頭" title="停止" disabled>''' + I_STOP + '''</button>
    </div>
    <button type="button" id="translateAll" aria-expanded="false" aria-controls="trpanel">整篇翻譯</button>''')
rep("  $('readAll').addEventListener('click', function () { speak(state.text); });\n", '')
rep('''  function speak(text) {
    if (!hasTTS) {''', '''  function speak(text) {
    if (typeof raHalt === 'function') { raHalt(); }
    if (!hasTTS) {''')
TTS = open(os.path.join(D, 'tts_ui.js'), encoding='utf-8').read()
rep('''    $('slow').setAttribute('aria-pressed', String(ttsRate !== 1));
  });''', '''    $('slow').setAttribute('aria-pressed', String(ttsRate !== 1));
  });
''' + TTS)
# 換文件時停止朗讀、進度歸零
rep("      lastDocId = sid; viewCur = 0;", "      lastDocId = sid; viewCur = 0;\n      if (typeof raReset === 'function') { raReset(); }")

# ---------- 3. 上一步／下一步只用符號 ----------
rep('<button type="button" id="undo" aria-label="上一步" disabled>↶ 上一步</button>',
    '<button type="button" class="iconbtn" id="undo" aria-label="上一步" title="上一步" disabled>' + I_UNDO + '</button>')
rep('<button type="button" id="redo" aria-label="下一步" disabled>↷ 下一步</button>',
    '<button type="button" class="iconbtn" id="redo" aria-label="下一步" title="下一步" disabled>' + I_REDO + '</button>')

# ---------- 4. 文字框顏色只放三色＋「我的顏色」 ----------
rep('''      <button type="button" class="sw" data-color="green" aria-label="綠色" style="--sw: var(--c-green)"></button>
      <button type="button" class="sw" data-color="purple" aria-label="紫色" style="--sw: var(--c-purple)"></button>
      <button type="button" class="sw" data-color="orange" aria-label="橘色" style="--sw: var(--c-orange)"></button>
''', '')
rep("          if (rendering || b.t.trim()) { return; }", "          if (rendering || b.t.trim() || Date.now() < keepBoxUntil) { return; }")

CSS = r'''
/* ---- v1.8 圖示按鈕 ---- */
.iconbtn { display: inline-flex; align-items: center; justify-content: center; width: 44px; min-width: 44px; height: 44px; min-height: 44px; padding: 0; border-radius: 50%; }
.iconbtn svg { width: 22px; height: 22px; display: block; }
.vh-acts { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.vh-acts .iconbtn { width: 40px; min-width: 40px; height: 40px; min-height: 40px; color: var(--accent); }
.vh-acts .iconbtn[hidden] { display: none; }
.toolbar .iconbtn { border-radius: 12px; width: 48px; min-width: 48px; }
.toolbar .iconbtn svg { width: 24px; height: 24px; }

/* ---- 朗讀列 ---- */
.ttsbar { flex-wrap: nowrap; gap: 10px; }
.ttsbar #slow { flex: 0 0 auto; }
.ttsbar #translateAll { flex: 0 0 auto; margin-left: auto; }
.ttsbar #ttsnote:empty { display: none; }
.ttsbar #ttsnote { flex-basis: 100%; font-size: 13px; color: var(--muted); }
.ttsbar:has(#ttsnote:not(:empty)) { flex-wrap: wrap; }
.player { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 6px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); }
.player .iconbtn { width: 38px; min-width: 38px; height: 38px; min-height: 38px; border: 0; background: transparent; color: var(--accent); }
.player .iconbtn.play { background: var(--accent-fill); color: var(--accent-fill-fg); }
.player .iconbtn:disabled { opacity: .35; }
.player .iconbtn svg { width: 20px; height: 20px; }
#ttsSeek { --p: 0%; flex: 1 1 auto; min-width: 60px; height: 28px; margin: 0; background: transparent; -webkit-appearance: none; appearance: none; cursor: pointer; }
#ttsSeek::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, var(--accent) var(--p), var(--line) var(--p)); }
#ttsSeek::-moz-range-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, var(--accent) var(--p), var(--line) var(--p)); }
#ttsSeek::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; margin-top: -6px; border-radius: 50%; background: var(--accent); border: 3px solid var(--card); box-shadow: 0 1px 4px rgba(0, 0, 0, .25); }
#ttsSeek::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); border: 3px solid var(--card); }

/* ---- 我的顏色（文字框） ---- */
.stylebar .sw.custom { background: conic-gradient(from 0deg, #ff5f5f, #ffd400, #4fd18b, #4fb3ff, #b07bff, #ff5fb0, #ff5f5f); }
.stylebar .sw.custom[aria-expanded="true"] { box-shadow: 0 0 0 3px var(--accent); }
.cpop { position: fixed; z-index: 45; background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px 12px 10px; box-shadow: 0 14px 36px rgba(0, 0, 0, .2); display: flex; flex-direction: column; gap: 10px; }
.cpop[hidden] { display: none; }
.cpop .cp-head { display: flex; align-items: center; gap: 8px; }
.cpop .cp-t { font-weight: 700; font-size: 15px; }
.cpop .cp-n { font-size: 13px; color: var(--muted); flex: 1; font-variant-numeric: tabular-nums; }
.cpop .cp-edit { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; }
.cpop .cp-grid { display: grid; grid-template-columns: repeat(auto-fill, 36px); gap: 8px; max-height: 240px; overflow-y: auto; padding: 3px; }
.cpop .cp-sw, .cpop .cp-add { position: relative; width: 36px; height: 36px; min-height: 36px; padding: 0; border-radius: 50%; border: 3px solid var(--card); box-shadow: 0 0 0 1px var(--line); background: var(--sw); cursor: pointer; }
.cpop .cp-sw[aria-pressed="true"] { box-shadow: 0 0 0 3px var(--accent); }
.cpop.editing .cp-sw::after { content: "×"; position: absolute; top: -8px; right: -8px; width: 18px; height: 18px; border-radius: 50%; background: #d63b3b; color: #fff; font-size: 14px; line-height: 17px; text-align: center; font-weight: 700; }
.cpop .cp-add { display: inline-flex; align-items: center; justify-content: center; background: var(--bg); box-shadow: 0 0 0 1px var(--line), inset 0 0 0 1px var(--line); color: var(--accent); font-size: 22px; font-weight: 600; }
.cpop .cp-add::before { content: "+"; }
.cpop .cp-add.full { opacity: .35; }
.cpop .cp-add input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; border: 0; padding: 0; cursor: pointer; }
.cpop .cp-note { font-size: 13px; color: var(--muted); }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v18 ok')
