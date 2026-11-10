import os, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:100]); s = s.replace(old, new)

# ---------- 樣式 ----------
rep('</style>', '''.ocrbox { margin-top: 6px; display: flex; flex-direction: column; gap: 8px; }
#docpages { list-style: none; margin: 0; padding: 0; font-size: 14px; color: var(--fg); }
#docpages li { margin: 0; }
.ocrbox p { margin: 0; font-size: 14px; color: var(--fg); line-height: 1.6; }
.ocrbox .btns { margin: 0; }
</style>''')

# ---------- 主頁：加入圖片 ----------
rep('''      <label class="filebtn">＋ 加入 PDF<input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf" multiple></label>''',
    '''      <label class="filebtn">＋ 加入 PDF<input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf" multiple></label>
      <label class="filebtn">＋ 加入圖片<input type="file" id="imgfile" class="vh" accept="image/*" multiple></label>''')

# ---------- 文件資訊：文字辨識方塊 ----------
rep('''    <div id="dochelp" class="label" hidden></div>''', '''    <div id="dochelp" class="label" hidden></div>
    <div id="ocrbox" class="ocrbox" hidden aria-live="polite">
      <p id="ocrmsg"></p>
      <div class="btns">
        <button type="button" class="primary" id="ocrGo">用文字辨識讀這些頁</button>
        <button type="button" id="ocrStop" hidden>停止</button>
        <button type="button" id="ocrRedo" hidden>重新辨識</button>
      </div>
    </div>''')

# ---------- 程式 ----------
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'ocr_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")

# 常見錯字對照表（從泰文語料庫的詞頻算出來）
fix = json.dumps(json.load(open(os.path.join(D, 'dictin', 'ocrfix.json'), encoding='utf-8')), ensure_ascii=False, separators=(',', ':'))
assert '</' not in fix
i = s.index('<script type="text/plain" id="lib-pdflib">')
s = s[:i] + '<script type="application/json" id="ocrfix">' + fix + '</script>\n' + s[i:]

# 回報與檢查清單
rep('''    lines.push('句型庫：''', '''    if (typeof ocr !== 'undefined') { lines.push('文字辨識：' + ocr.engine + (ocr.done || ocr.lastError ? '；上次辨識 ' + ocr.done + '/' + ocr.total + ' 頁、' + Math.round(ocr.ms / 1000) + ' 秒、補字 ' + ocr.fixes + (ocr.lastError ? '；錯誤：' + ocr.lastError : '') : '') + (pdf && pdf.quality ? '；這份文件辨識頁數 ' + ocrHave() : '')); }
    lines.push('句型庫：''')
rep("    ['b1', ", """    ['o1', '掃描的 PDF：按「用文字辨識讀這 N 頁」，完成後可以點字查詞'],
    ['o2', '加入圖片：選照片或截圖，會變成文件並自動辨識'],
    ['b1', """)
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
