import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:90]); s = s.replace(old, new)
CSS = r'''
.fbbox { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.fbbox textarea { width: 100%; min-height: 110px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); font: inherit; font-size: 16px; resize: vertical; }
.fbbox textarea:focus-visible { outline: 3px solid var(--accent); outline-offset: 1px; }
.fbck { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); min-height: 40px; }
.fbck input { width: 20px; height: 20px; }
.fblist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.fblist li { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
.fbmeta { font-size: 12px; color: var(--muted); }
.fbtext { white-space: pre-wrap; font-size: 14px; }
.setrow.fbrow { flex-direction: column; align-items: stretch; }
.setrow.fbrow .setlabel { flex: 0 0 auto; }
'''
rep('</style>', CSS + '</style>')
rep('''    <div class="setrow">
      <div class="setlabel">歡迎視窗''', '''    <div class="setrow fbrow">
      <div class="setlabel">意見回饋<span class="sethelp">對這個 App 的建議、遇到的問題，都可以寫在這裡。</span></div>
      <div class="fbbox">
        <div class="seg" role="radiogroup" aria-label="回饋類型" id="fbCat"></div>
        <label class="vh" for="fbText">回饋內容</label>
        <textarea id="fbText" maxlength="4000" placeholder="例如：希望生字卡可以依文件分組；點某個詞時查到的意思不對……"></textarea>
        <label class="fbck"><input type="checkbox" id="fbCtx" checked> 一起附上目前狀態（版本、開著的文件、裝置），方便找問題</label>
        <div class="btns"><button type="button" class="primary" id="fbSend">送出回饋</button></div>
        <div id="fbStatus" class="label" aria-live="polite"></div>
        <a class="ext small" id="fbManual" href="#" target="_blank" rel="noopener noreferrer" hidden>改用 Google 表單送出（內容已填好）</a>
        <div id="fbListWrap" hidden><div class="label">你最近的回饋</div><ul class="fblist" id="fbList"></ul></div>
      </div>
    </div>
    <div class="setrow">
      <div class="setlabel">歡迎視窗''')
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'feedback_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")
rep('''    lines.push('句型庫：''', '''    if (typeof fbMode !== 'undefined') { lines.push('意見回饋：' + fbMode + '；Google 表單：' + gformStatus + '；已送出 ' + fbItems.length + ' 則' + (fbLocal.length ? '，裝置裡待補送 ' + fbLocal.length + ' 則' : '')); }
    lines.push('句型庫：''')
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
