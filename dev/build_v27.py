import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 1.18 複習排程改用 FSRS ----------
OLD = open(os.path.join(D, 'srs_old_block.txt'), encoding='utf-8').read()
rep(OLD, open(os.path.join(D, 'fsrs_ui.js'), encoding='utf-8').read())
rep("srsInit(c); c.due = today0(); c.lapses++; c.ivl = 0; c.box = 1;", "grade(c, 0);")
rep("""    st2.appendChild(el('p', '', '熟悉度 ' + c.box + ' / 5・' + (c.due <= today0() ? '今天要複習' : '下次複習：' + ivlText(Math.round((c.due - today0()) / DAY)) + '後') + '・答對 ' + (c.right || 0) + ' / ' + (c.seen || 0) + ' 次'));""",
"""    var rc = fsRecall(c);
    st2.appendChild(el('p', '', '熟悉度 ' + c.box + ' / 5・' + (c.due <= today0() ? '今天要複習' : '下次複習：' + ivlText(Math.round((c.due - today0()) / DAY)) + '後') + (rc !== null ? '・現在大約記得 ' + Math.round(rc * 100) + '%' : '') + '・答對 ' + (c.right || 0) + ' / ' + (c.seen || 0) + ' 次'));""")
rep("""        d: ['App 會算好今天該複習哪些卡片（間隔重複，像 Anki）。',""", """        d: ['App 會算好今天該複習哪些卡片：用 FSRS 演算法（Anki 也在用）估計你快忘記的時候，剛好排在那天複習。',""")
rep("""'「有點難」「記得」「很簡單」：下次出現會越隔越久，按鈕下面寫著是幾天後。'] },""", """'「有點難」「記得」「很簡單」：下次出現會越隔越久，按鈕下面寫著是幾天後。', '照實際感覺按就好：App 會依你每次的答案調整每張卡的難度，越熟的卡隔越久，常忘的卡會更常出現。'] },""")
open(src, 'w', encoding='utf-8').write(s)
print('v27 ok')
