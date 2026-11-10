import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:90]); s = s.replace(old, new)
CSS = r'''
.cardbtn { margin-left: auto; min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--accent); background: var(--card); color: var(--accent); font-weight: 700; font-size: 14px; }
.cardbtn[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); }
.pop .head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-right: 48px; }
.fcard { border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; background: var(--bg); }
.cword { font-family: var(--thai); font-size: 40px; font-weight: 700; line-height: 1.4; }
.csent { margin: 0; font-family: var(--thai); font-size: 18px; line-height: 1.8; color: var(--fg); }
.csent strong { color: var(--accent); }
.cback { border-top: 1px dashed var(--line); padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.crom { color: var(--muted); font-size: 15px; }
.cmean { font-size: 20px; font-weight: 600; line-height: 1.5; }
.cmean-en { color: var(--muted); font-size: 14px; }
.csrc { color: var(--muted); font-size: 12px; }
.cans button { flex: 1 1 140px; min-height: 52px; font-size: 17px; }
.cans .cno { border-color: #c2410c; color: #c2410c; }
.cdone { font-weight: 700; margin: 0; }
.clist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.clist li { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; align-items: start; }
.clist .ctop { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; grid-column: 1; }
.clist .cw { font-family: var(--thai); font-size: 20px; font-weight: 700; }
.clist .cbox { font-size: 12px; color: var(--muted); }
.clist .cm, .clist .csrc { grid-column: 1; }
.clist .cdel { grid-column: 2; grid-row: 1 / span 3; align-self: center; min-height: 40px; }
.cmy { color: var(--accent); }
.clist .cmyin { grid-column: 1; margin-top: 4px; min-height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--fg); font-size: 15px; }
.cfolders { display: flex; flex-direction: column; gap: 6px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
.cfolders .fname { min-height: 44px; padding: 0 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--fg); font-size: 16px; flex: 1 1 160px; }
.clist .cmove { grid-column: 1; min-height: 40px; margin-top: 4px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--fg); font-size: 14px; padding: 0 8px; justify-self: start; }
.ankibox { width: 100%; min-height: 120px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; }
'''
rep('</style>', CSS + '</style>')
rep('''    <button type="button" id="openSettings" aria-expanded="false" aria-controls="settings">設定</button>''',
    '''    <button type="button" id="openCards" aria-expanded="false" aria-controls="cards">生字卡</button>
    <button type="button" id="openSettings" aria-expanded="false" aria-controls="settings">設定</button>''')
rep('''    <div class="btns"><button type="button" id="closeSettings" class="primary">完成</button></div>
  </section>''', '''    <div class="btns"><button type="button" id="closeSettings" class="primary">完成</button></div>
  </section>
  <section id="cards" class="settings" aria-labelledby="h-cards" hidden>
    <h2 id="h-cards">生字卡</h2>
    <div id="cardFolders" class="cfolders"></div>
    <div class="seg" role="radiogroup" aria-label="生字卡頁面" id="cardTabs"></div>
    <div id="cardmsg" class="label" aria-live="polite"></div>
    <div id="cardbody" class="cardbody"></div>
    <div class="btns"><button type="button" id="closeCards" class="primary">完成</button></div>
  </section>''')
rep('''    var w = document.createElement('div'); w.className = 'pw'; w.lang = 'th'; w.textContent = seg.t;
    head.appendChild(w);''', '''    var w = document.createElement('div'); w.className = 'pw'; w.lang = 'th'; w.textContent = seg.t;
    head.appendChild(w);
    head.appendChild(cardButton(seg));''')
rep("    ['w1', '歡迎視窗：第一次開啟有跳出，選的程度和拼音有生效']", """    ['w1', '歡迎視窗：第一次開啟有跳出，選的程度和拼音有生效'],
    ['k1', '加入生字卡：查詞視窗按「＋ 生字卡」變成「✓ 已在生字卡」'],
    ['k2', '翻卡複習：看答案、按「會了／不會」，不會的會在最後再出現一次'],
    ['k3', '清單：看得到所有卡片、出處頁碼，可以刪除'],
    ['k4', '複製成 Anki 格式：有出現「已複製」或可以手動拷貝']""")
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'cards_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")
rep('''    lines.push('句型庫：''', '''    if (typeof cards !== 'undefined') { lines.push('生字卡：' + cards.length + ' 張，今天要複習 ' + dueCards().length + ' 張；各盒：' + [1, 2, 3, 4, 5].map(function (b) { return b + ':' + cards.filter(function (c) { return c.box === b; }).length; }).join(' ')); }
    lines.push('句型庫：''')
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
