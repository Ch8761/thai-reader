# 主頁資料夾列、文件縮圖、精簡文件資訊、使用說明
import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:100]); s = s.replace(old, new)

rep('''    <div id="homeTarget" class="label"></div>''', '''    <div id="homeTarget" class="label"></div>
    <div id="homeFolderBar" class="fbar" hidden></div>''')
rep('''      var icon = mk('span', 'dicon ' + d.type, d.type === 'pdf' ? 'PDF' : '文');
      icon.setAttribute('aria-hidden', 'true');''', '''      var icon = docIcon(d);''')
rep("    idbDel(id); idbDel('ocr:' + id);", "    idbDel(id); idbDel('ocr:' + id); idbDel('thumb:' + id);")
rep("  /* ---------- 文字辨識（OCR）：掃描的 PDF 頁面、照片、截圖 ----------", open(os.path.join(D, 'ux_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 文字辨識（OCR）：掃描的 PDF 頁面、照片、截圖 ----------")
# 設定頁最上方：使用說明
rep('''  <div id="settings" class="settings">
    <div class="setrow">
      <div class="setlabel">外觀<span class="sethelp">淺色是奶油白、卡其、深咖啡；深色是黑、灰、藍。「跟隨系統」會照 iPad 的設定自動切換。</span></div>''',
'''  <div id="settings" class="settings">
    <div class="setrow">
      <div class="setlabel">使用說明<span class="sethelp">每一頁怎麼用、各個按鈕的作用。</span></div>
      <button type="button" id="openHelp">打開使用說明</button>
    </div>
    <div class="setrow">
      <div class="setlabel">外觀<span class="sethelp">淺色是奶油白配綠色；深色是黑、灰、藍。「跟隨系統」會照 iPad 的設定自動切換。</span></div>''')
rep('''<p class="wnote">選好就能開始。之後隨時可以按下方的「設定」修改。</p>''',
    '''<p class="wnote">選好就能開始。之後隨時可以按下方的「設定」修改；各頁怎麼用，可以看「設定 → 使用說明」。</p>''')
rep('''  <div id="welcome" class="modal"''', '''  <div id="helpModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="h-help" hidden>
    <div class="mcard helpcard">
      <div class="helphead"><h2 id="h-help">使用說明</h2><button type="button" id="helpClose" aria-label="關閉">×</button></div>
      <div class="helptabs" id="helpTabs" role="tablist" aria-label="說明分類"></div>
      <div class="helpbody" id="helpBody"></div>
    </div>
  </div>
  <div id="helpDetail" class="hdlayer" role="dialog" aria-modal="true" aria-labelledby="hdTitle" hidden>
    <div class="hdcard">
      <div class="hdbar"><button type="button" id="hdBack" class="hdback">‹ 返回清單</button><span class="hdkicker" id="hdKicker"></span></div>
      <div class="hdscroll" id="hdScroll">
        <figure class="hdfig" id="hdFig"></figure>
        <h3 class="hdtitle" id="hdTitle"></h3>
        <p class="hdline" id="hdLine"></p>
        <ol class="hdsteps" id="hdSteps"></ol>
        <p class="hdtip" id="hdTip" hidden></p>
      </div>
      <div class="hdnav"><button type="button" id="hdPrev">‹ 上一則</button><button type="button" id="hdNext">下一則 ›</button></div>
    </div>
  </div>
  <div id="welcome" class="modal"''')
CSS = '''
/* ---------- 資料夾、縮圖、文件資訊、使用說明 ---------- */
#homeFolders .frow > button.fadd, #cardFolders .frow > button.fadd { border: 1px dashed var(--accent); color: var(--accent); background: transparent; }
.fbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 8px 0 4px; padding: 8px 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--line); }
.fbar[hidden] { display: none; }
#cardFolders > .fbar { flex-basis: 100%; }
.fbar .fbname { font-weight: 700; margin-right: auto; }
.fbar button { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; }
.fbar .frow { display: flex; flex: 1; gap: 8px; margin: 0; }
.fbar .frow input.fname { flex: 1 1 160px; min-height: 34px; border-radius: 999px; padding: 0 12px; }
.dicon.thumb { padding: 0; overflow: hidden; background: #ffffff; border: 1px solid var(--line); }
.dicon.thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.dicon.textprev { background: var(--paper); color: var(--fg); border: 1px solid var(--line); font-family: var(--thai); font-size: 7px; line-height: 1.35; font-weight: 400; padding: 4px; align-items: flex-start; justify-content: flex-start; text-align: left; overflow: hidden; word-break: break-all; }
#docsec { display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 4px 12px; padding: 8px 12px; }
#docsec[hidden] { display: none; }
#docsec #docpages { flex: 0 0 auto; font-size: 14px; }
#docsec #docstatus { flex: 1 1 100%; margin: 0; }
#docsec .ocrbox { flex: 1 1 280px; flex-direction: row; align-items: center; gap: 10px; margin: 0; }
#docsec .ocrbox[hidden] { display: none; }
#docsec #ocrmsg { flex: 1; font-size: 13px; color: var(--muted); }
#docsec .ocrbox .btns { flex: 0 0 auto; flex-wrap: nowrap; }
#docsec .ocrbox button { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; }
.helphead { display: flex; align-items: center; justify-content: space-between; }
.helphead h2 { margin: 0; }
.helphead button { min-width: 44px; min-height: 44px; font-size: 20px; border-radius: 999px; }
.helptabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
.helptabs button { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; }
.helptabs button[aria-selected="true"] { background: var(--accent-fill); color: var(--accent-fill-fg); border-color: var(--accent-fill); font-weight: 600; }
.helpbody .hlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.helpbody .hrow { width: 100%; display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--bg); text-align: left; color: var(--fg); font: inherit; min-height: 64px; }
.helpbody .hrow:active { transform: scale(.99); }
.helpbody .hnum { flex: 0 0 28px; height: 28px; border-radius: 999px; background: var(--accent-fill); color: var(--accent-fill-fg); font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.helpbody .htext { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.helpbody .htitle { font-weight: 800; font-size: 17px; line-height: 1.4; }
.helpbody .hdesc { font-size: 15px; line-height: 1.9; color: var(--muted); }
.helpbody .hgo { flex: 0 0 auto; font-size: 26px; line-height: 1; color: var(--muted); }
.hchip { display: inline-block; margin: 0 3px; padding: 0 10px; border: 1px solid var(--accent); border-radius: 999px; color: var(--accent); font-weight: 700; font-size: 14px; line-height: 1.7; white-space: nowrap; background: var(--card); }
.helpcard { max-width: 640px; max-height: 88vh; display: flex; flex-direction: column; }
.helpbody { overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1; min-height: 0; padding-right: 2px; }
/* 跳出的說明卡 */
.hdlayer { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(16, 22, 20, .55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); animation: hdfade .18s ease-out; }
.hdlayer[hidden] { display: none; }
@keyframes hdfade { from { opacity: 0; } to { opacity: 1; } }
@keyframes hdpop { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
.hdcard { width: 100%; max-width: 720px; max-height: calc(100vh - 40px); display: flex; flex-direction: column; background: var(--card); color: var(--fg); border-radius: 22px; box-shadow: 0 30px 80px rgba(0, 0, 0, .35), 0 2px 8px rgba(0, 0, 0, .12); overflow: hidden; animation: hdpop .22s cubic-bezier(.2, .8, .2, 1); }
.hdbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px; }
.hdback { border: 0; background: transparent; color: var(--accent); font-weight: 700; font-size: 16px; min-height: 40px; padding: 0 6px; }
.hdkicker { font-size: 13px; color: var(--muted); letter-spacing: .02em; }
.hdscroll { overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 0 22px 18px; flex: 1; min-height: 0; }
.hdfig { margin: 4px 0 18px; padding: 22px; border-radius: 18px; background: linear-gradient(145deg, #e9efe9 0%, #f6f1e4 100%); display: flex; align-items: center; justify-content: center; min-height: 120px; }
.hdfig[hidden] { display: none; }
.hdfig img { display: block; max-width: 100%; max-height: 46vh; width: auto; height: auto; border-radius: 12px; box-shadow: 0 18px 40px rgba(38, 51, 46, .18), 0 2px 6px rgba(38, 51, 46, .10); opacity: 0; transition: opacity .2s; }
.hdfig.ready img { opacity: 1; }
.hdtitle { margin: 0 0 4px; font-size: 22px; font-weight: 800; }
.hdline { margin: 0 0 14px; font-size: 16px; line-height: 1.9; color: var(--muted); }
.hdsteps { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 8px; font-size: 16px; line-height: 1.85; }
.hdtip { margin: 16px 0 0; padding: 10px 14px; border-radius: 12px; background: rgba(224, 122, 47, .10); border-left: 4px solid #e07a2f; font-size: 15px; line-height: 1.7; }
.hdtip::before { content: '小提醒　'; font-weight: 800; color: #c4651f; }
.hdnav { display: flex; gap: 10px; padding: 12px 16px 16px; border-top: 1px solid var(--line); }
.hdnav button { flex: 1; min-height: 44px; border-radius: 12px; font-size: 15px; }
.hdnav button:disabled { opacity: .4; }
:root[data-theme="dark"] .hdfig { background: linear-gradient(145deg, #30353b 0%, #25292e 100%); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .hdfig { background: linear-gradient(145deg, #30353b 0%, #25292e 100%); } }
'''
i = s.index('</style>')
s = s[:i] + CSS + s[i:]
rep("    ['b1', ", """    ['u1', '主頁：PDF 文件前面顯示第一頁縮圖，文字文件顯示開頭幾行'],
    ['u2', '設定 → 使用說明：可以切換各頁的說明'],
    ['b1', """)
open(src, 'w', encoding='utf-8').write(s)
print('ux ok')
