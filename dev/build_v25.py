import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 1.16 聽真人發音（YouGlish） ----------
YG = open(os.path.join(D, 'youglish_ui.js'), encoding='utf-8').read()
rep('  function armed(btn, label, confirmLabel, action) {\n', YG + '  function armed(btn, label, confirmLabel, action) {\n')
rep("""      a.textContent = L[0];
      extl.appendChild(a);
    });
""", """      a.textContent = L[0];
      extl.appendChild(a);
    });
    if (typeof ygButton === 'function' && /[\\u0E01-\\u0E2E]/.test(seg.t)) { extl.appendChild(ygButton(seg.t)); }
""")
# 使用說明：查詞分頁
rep("""      { t: '專有名詞', s: '淡色底的是人名、劇名、機構等，會顯示中文名', img: 'pop-name',""",
"""      { t: '聽真人發音', s: '查詞視窗「外部字典」那行，按「真人發音」', img: 'yg-pop',
        d: ['點一個詞，在查詞視窗「外部字典」那一行按「真人發音」。', '會跳出 YouTube 影片裡有人說到這個詞的片段，字幕會標出來。', '按 ‹ › 換別段影片，可以調慢速度。按右上角「×」關掉。', '第一次用會先問你：這會載入 YouGlish 和 YouTube 的內容，按「繼續」。'],
        tip: '需要網路。很少見的詞、人名可能找不到影片，這時用「朗讀」聽電腦發音。' },
      { t: '專有名詞', s: '淡色底的是人名、劇名、機構等，會顯示中文名', img: 'pop-name',""")

CSS = r'''
/* ---- v1.16 真人發音（YouGlish） ---- */
.pop .extlinks button.ygbtn { font-size: 13px; min-height: 28px; padding: 0; border: 0; background: none; color: var(--accent); font-weight: 600; }
.ygsheet .cdscroll { display: flex; flex-direction: column; gap: 10px; }
.ygsheet .vptitle { padding-right: 48px; }
.ygbox { width: 100%; min-height: 120px; border-radius: 12px; overflow: hidden; }
.ygbox[hidden] { display: none; }
.ygmsg { font-size: 14px; color: var(--muted); }
.ygmsg[hidden] { display: none; }
.ygconsent { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; padding: 14px; border: 1px solid var(--line); border-radius: 12px; }
.ygconsent[hidden] { display: none; }
.ygconsent p { margin: 0; font-size: 14px; }
.ygcredit { margin: 0; font-size: 12px; color: var(--muted); }
.ygcredit a { color: var(--accent); }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v25 ok')
