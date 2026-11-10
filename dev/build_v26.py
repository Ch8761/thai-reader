import os, shutil
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 讀物庫 ----------
rep('''    <div id="homeMsg" class="label" aria-live="polite"></div>
    <div id="homeFolders" class="cfolders"></div>''', '''    <button type="button" id="readerOpen" class="readercard"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg><span class="rctx"><span class="rct">讀物庫</span><span class="rcs">分級泰文短文，挑一篇開始讀</span></span><svg class="rcchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    <div id="homeMsg" class="label" aria-live="polite"></div>
    <div id="homeFolders" class="cfolders"></div>''')
RD = open(os.path.join(D, 'reader_ui.js'), encoding='utf-8').read()
rep('  function armed(btn, label, confirmLabel, action) {\n', RD + '  function armed(btn, label, confirmLabel, action) {\n')
rep("""      { t: '加文件', s:""", """      { t: '讀物庫', s: '主頁按「讀物庫」，挑一篇短文', img: 'reader',
        d: ['按主頁的「讀物庫」。', '上面選程度：入門、初級、中級（一開始會選你在設定裡的程度）。', '點一篇，就會加入「我的文件」並打開，可以點字查詞、畫螢光筆。', '已經加過的會標「已加入」，再點一次直接打開。'],
        tip: '短文是原創的，句子由淺到深。不知道從哪裡開始時，先讀「入門」的第一篇。' },
      { t: '加文件', s:""")
CSS = r'''
/* ---- v1.17 讀物庫 ---- */
.readercard { display: flex; align-items: center; gap: 12px; width: 100%; margin: 12px 0 4px; padding: 10px 14px; min-height: 56px; text-align: left; border: 1px solid var(--line); border-radius: 14px; background: var(--card); color: var(--fg); font-weight: 400; }
.readercard > svg:first-child { flex: 0 0 auto; width: 26px; height: 26px; fill: none; stroke: var(--accent); stroke-width: 1.8; stroke-linejoin: round; }
.readercard .rctx { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
.readercard .rct { font-weight: 700; font-size: 16px; }
.readercard .rcs { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.readercard .rcchev { flex: 0 0 auto; width: 18px; height: 18px; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.rdsheet .cdscroll { display: flex; flex-direction: column; gap: 10px; }
.rdsheet .vptitle { padding-right: 48px; }
.rdtabs { display: flex; gap: 6px; }
.rdtabs button { flex: 1 1 0; min-height: 36px; border-radius: 999px; padding: 0 10px; font-size: 15px; }
.rdtabs button[aria-selected="true"] { background: var(--accent-fill); border-color: var(--accent-fill); color: var(--accent-fill-fg); font-weight: 700; }
.rdmsg { font-size: 14px; color: var(--muted); }
.rdmsg[hidden] { display: none; }
.rdlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.rditem { display: flex; flex-direction: column; align-items: stretch; gap: 3px; width: 100%; text-align: left; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); color: var(--fg); font-weight: 400; min-height: 0; }
.rditem .rdtop { display: flex; align-items: center; gap: 8px; }
.rditem .rdth { font-size: 18px; font-weight: 700; line-height: 1.5; }
.rditem .rdbadge { margin-left: auto; flex: 0 0 auto; font-size: 12px; color: var(--accent); border: 1px solid var(--accent); border-radius: 999px; padding: 1px 8px; }
.rditem .rdzh { font-size: 14px; }
.rditem .rdmeta { font-size: 12px; color: var(--muted); }
.rdcredit { margin: 4px 0 0; font-size: 12px; color: var(--muted); }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
shutil.copyfile(os.path.join(D, 'reader.json'), os.path.join(D, 'srv', 'reader.json'))
print('v26 ok')
