import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:90]); s = s.replace(old, new)
CSS = r'''
.exopt { display: flex; align-items: center; gap: 10px; font-weight: 600; min-height: 44px; flex: 1 1 260px; }
.exopt.sub { font-weight: 400; padding-left: 30px; }
.exopt input { width: 22px; height: 22px; }
.filebtn2 { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--line); background: var(--card); color: var(--fg); cursor: pointer; }
.filebtn2:focus-within { outline: 3px solid var(--accent); outline-offset: 2px; }
.bkconfirm { border: 1px solid var(--bad); background: var(--bad-bg); color: var(--fg); border-radius: 10px; padding: 10px 12px; }
.bkconfirm p { margin: 0 0 8px; }
'''
rep('</style>', CSS + '</style>')
rep('''      <button type="button" id="toText" hidden>改回範例文字</button>''', '''      <button type="button" id="toText" hidden>改回範例文字</button>
      <button type="button" id="openExport" aria-expanded="false" aria-controls="exportp">匯出 PDF（筆記＋生字）</button>''')
rep('''  <div class="toolbar" role="toolbar" aria-label="筆記工具">''', '''  <section id="exportp" class="settings" aria-labelledby="h-export" hidden>
    <h2 id="h-export">匯出 PDF</h2>
    <div class="setrow">
      <label class="exopt"><input type="checkbox" id="exPages" checked> 原文頁（含螢光筆、手寫、文字框）</label>
      <span class="sethelp" id="exPagesNote"></span>
      <label class="exopt sub"><input type="checkbox" id="exOnlyNoted"> 只要有筆記的頁</label>
    </div>
    <div class="setrow">
      <label class="exopt"><input type="checkbox" id="exVocab" checked> 生字表</label>
      <div class="seg" role="radiogroup" aria-label="生字表範圍" id="exScope"></div>
      <span class="sethelp" id="exCount"></span>
    </div>
    <div class="setrow">
      <label class="exopt"><input type="checkbox" id="exNotes" checked> 筆記整理（螢光筆的句子、文字框的內容）</label>
    </div>
    <div class="btns"><button type="button" class="primary" id="exGo">產生 PDF</button><button type="button" id="closeExport">關閉</button></div>
    <div id="exStatus" class="label" aria-live="polite"></div>
  </section>
  <div class="toolbar" role="toolbar" aria-label="筆記工具">''')
rep('''    <div class="setrow fbrow">
      <div class="setlabel">意見回饋''', '''    <div class="setrow fbrow">
      <div class="setlabel">備份與還原<span class="sethelp">把生字卡、設定、所有文件的筆記和目前的 PDF 存成一個檔案，可以存到 iCloud Drive 或 Google Drive。<br><span id="bkLast"></span></span></div>
      <div class="btns"><button type="button" class="primary" id="bkSave">匯出備份檔</button><label class="filebtn2">從備份檔還原<input type="file" id="bkFile" class="vh" accept=".json,application/json"></label></div>
      <div id="bkConfirm" class="bkconfirm" role="alert" hidden><p id="bkConfirmText"></p><div class="btns"><button type="button" class="primary" id="bkDo">還原（取代目前資料）</button><button type="button" id="bkCancel">取消</button></div></div>
      <div id="bkStatus" class="label" aria-live="polite"></div>
    </div>
    <div class="setrow fbrow">
      <div class="setlabel">意見回饋''')
rep("    ['k4', '複製成 Anki 格式：有出現「已複製」或可以手動拷貝']", """    ['k4', '複製成 Anki 格式：有出現「已複製」或可以手動拷貝'],
    ['k5', '生字卡資料夾：新增、改名、刪除資料夾，卡片可以移動，複習只出現該資料夾的卡'],
    ['e1', '匯出 PDF：按「產生 PDF」後能存到「檔案」App'],
    ['e2', '匯出的 PDF：螢光筆、手寫、文字框位置正確，最後有生字表和筆記整理'],
    ['b1', '備份：匯出備份檔，存到 iCloud Drive 或 Google Drive'],
    ['b2', '還原：從備份檔還原後，生字卡和筆記都回來了']""")
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'export_ui.js'), encoding='utf-8').read() + open(os.path.join(D, 'backup_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")
rep('''    lines.push('句型庫：''', '''    if (typeof exportStatus !== 'undefined') { lines.push('匯出 PDF：' + exportStatus + '；備份：' + backupStatus + '；存檔方式：' + saveStatus); }
    lines.push('句型庫：''')
rep("    if (open) { hidePop(); renderSettings(); }", "    if (open) { hidePop(); renderSettings(); if (typeof renderBackup === 'function') { renderBackup(); } }")
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
