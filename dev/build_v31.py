import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'

# ---------- 1.21 加入文件：三個按鈕合成一個 ----------
rep('''      <label class="filebtn">＋ 加入 PDF<input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf" multiple></label>
      <label class="filebtn">＋ 圖片／影片<input type="file" id="imgfile" class="vh" accept="image/*,video/*" multiple></label>
      <button type="button" id="openPaste" aria-expanded="false" aria-controls="pastebox">＋ 網址／文字</button>''',
'''      <label class="filebtn addmain"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span class="am-tx"><span class="am-t">加入檔案</span><span class="am-s">PDF・照片・影片</span></span><input type="file" id="anyfile" class="vh" accept="application/pdf,.pdf,image/*,video/*,.mp4,.mov,.m4v,.webm,.txt,.srt,.vtt,text/plain" multiple></label>
      <button type="button" id="openPaste" class="addside" aria-expanded="false" aria-controls="pastebox"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>貼上網址／文字</button>
      <input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf" multiple hidden tabindex="-1" aria-hidden="true"><input type="file" id="imgfile" class="vh" accept="image/*,video/*" multiple hidden tabindex="-1" aria-hidden="true">''')
s = s.replace(ANCHOR, open(os.path.join(D, 'import_ui.js'), encoding='utf-8').read() + ANCHOR, 1)
CSS = '''
/* 1.21 加入檔案：一個主要按鈕＋一個次要按鈕 */
.homeadd { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; gap: 8px !important; }
.homeadd > .addmain { min-height: 56px; padding: 0 16px !important; gap: 12px; justify-content: flex-start !important; font-size: 16px !important; white-space: normal !important; border-radius: 12px; }
.addmain svg, .addside svg { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.addmain .am-tx { display: flex; flex-direction: column; line-height: 1.25; text-align: left; }
.addmain .am-t { font-weight: 700; font-size: 17px; }
.addmain .am-s { font-weight: 500; font-size: 12.5px; opacity: .85; }
.homeadd > .addside { min-height: 56px; padding: 0 14px !important; gap: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px !important; border-radius: 12px; white-space: nowrap; }
.addside svg { width: 18px; height: 18px; stroke-width: 2.2; }
@media (max-width: 360px) { .homeadd > .addside { padding: 0 10px !important; font-size: 13px !important; } .addside svg { display: none; } }
#view-home.dropping { outline: 3px dashed var(--accent); outline-offset: -8px; border-radius: 16px; }
'''
rep('</style>', CSS + '</style>')
# 說明文字跟著改
for a, b in [
    ("'還沒有文件。按上面的「＋ 加入 PDF」或「＋ 貼上文字」開始。'", "'還沒有文件。按上面的「加入檔案」選 PDF、照片或影片，或按「貼上網址／文字」開始。'"),
    ("請按「＋ 加入 PDF」重新選同一個檔案", "請按「加入檔案」重新選同一個檔案"),
    ("{ t: '加文件', s: '按「＋ 加入 PDF」「＋ 圖片／影片」或「＋ 貼上文字」'", "{ t: '加文件', s: '按「加入檔案」選檔案，或按「貼上網址／文字」'"),
    ("d: ['PDF：按「＋ 加入 PDF」，從「檔案」App 選，可以一次選好幾個。', '照片或截圖：按「＋ 圖片／影片」，選好的幾張會合成一份文件。', '逐字稿、文章：先在別的 App 拷貝，按「＋ 貼上文字」，長按文字框選「貼上」，再按「建立文件」。']",
     "d: ['按「加入檔案」，PDF、照片、截圖、影片、文字檔（.txt、字幕檔 .srt）都從這裡選，App 會自己分辨。可以一次選好幾個。', '選好的幾張照片會合成一份文件；影片會讀出泰文字幕。', '逐字稿、文章：先在別的 App 拷貝，按「貼上網址／文字」，長按文字框選「貼上」，再按「建立文件」。', '用電腦時，也可以直接把檔案拖進主頁。']"),
    ("s: '按「＋ 網址／文字」，貼上新聞網址，按「讀取文章」'", "s: '按「貼上網址／文字」，貼上新聞網址，按「讀取文章」'"),
    ("'回到 App 主頁按「＋ 網址／文字」，把網址貼進最上面的格子", "'回到 App 主頁按「貼上網址／文字」，把網址貼進最上面的格子"),
    ("s: '按「＋ 圖片／影片」拍照或選照片，拖曳四個角框住文字'", "s: '按「加入檔案」拍照或選照片，拖曳四個角框住文字'"),
    ("s: '按「＋ 圖片／影片」選有泰文字幕的影片'", "s: '按「加入檔案」選有泰文字幕的影片'"),
    ("'按「＋ 圖片／影片」，選照片或截圖。'", "'按「加入檔案」，選照片或截圖。'"),
    ("PDF 可以先下載，再用「＋ 加入 PDF」。", "PDF 可以先下載，再用「加入檔案」。"),
]:
    rep(a, b)
s = s.replace("['t3', '加入 PDF：出現在主頁", "['t3', '加入檔案：出現在主頁")

rep("'上面選程度：入門、初級、中級（一開始會選你在設定裡的程度）。'", "'上面選程度：入門、初級、中級、高級（一開始會選你在設定裡的程度）。高級是社論、經濟、文學、歷史、科普和公文。'")

# ---------- 1.21 介面整理：主頁「今天」、複習完成的總結、空白時給下一步、按鈕至少 44 點 ----------
s = s.replace(ANCHOR, open(os.path.join(D, 'ux2_ui.js'), encoding='utf-8').read() + ANCHOR, 1)
rep("if (g === 0) { review.again[id] = 1; review.queue.push(id); } else { review.done++; }",
    "if (g >= 2 && !review.again[id]) { review.ok = (review.ok || 0) + 1; } if (typeof markDay === 'function') { markDay(); }\n      if (g === 0) { review.again[id] = 1; review.queue.push(id); } else { review.done++; }")
rep("if (review && review.total) { host.appendChild(el('p', 'cdone', '這一輪完成了：' + review.total + ' 張。')); }",
    "if (review && review.total) { host.appendChild(reviewSummary(review)); }", 2)
rep("還沒有生字卡。在查詞視窗按「＋ 生字卡」就能加入。'));",
    "還沒有生字卡。讀文章時點一個詞，在查詞視窗按「＋ 生字卡」就能加入。'));\n      if (!fc) { var gr = el('button', 'primary', '到讀物庫挑一篇來讀'); gr.type = 'button'; gr.addEventListener('click', function () { showTab('home'); var ro = $('readerOpen'); if (ro) { ro.click(); } }); host.appendChild(gr); }", 2)
SUM = r"""  /* 複習完成：用一個小小的慶祝收尾（結尾的感受最容易被記住） */
  function reviewSummary(rv) {
    var box = el('div', 'rsum'); box.setAttribute('role', 'status');
    box.innerHTML = '<svg class="rs-ic" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="M14 25l7 7 13-15"/></svg>';
    box.appendChild(el('div', 'rs-t', '這一輪完成了！'));
    box.appendChild(el('div', 'rs-s', '複習 ' + rv.total + ' 張' + (rv.ok ? '・一次就記得 ' + rv.ok + ' 張' : '')));
    var sk = typeof streakDays === 'function' ? streakDays() : 0;
    if (sk >= 2) { box.appendChild(el('div', 'rs-k', '已經連續學習 ' + sk + ' 天')); }
    return box;
  }
"""
s = s.replace(ANCHOR, SUM + ANCHOR, 1)
CSS2 = """
/* 1.21 主頁「今天」 */
.todaybox { display: flex; flex-direction: column; gap: 8px; margin: 0 0 16px; }
.tdrow { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 60px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--fg); text-align: left; }
.tdrow > svg:first-child { width: 24px; height: 24px; flex: none; fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.tdrow .tdchev { width: 18px; height: 18px; flex: none; margin-left: auto; fill: none; stroke: currentColor; stroke-width: 2.2; opacity: .5; }
.tdtx { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.tdk { font-size: 12.5px; color: var(--muted, #6b6b6b); font-weight: 600; letter-spacing: .02em; }
.tdv { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tdbar { display: block; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--accent) 18%, transparent); overflow: hidden; margin-top: 6px; }
.tdbar > span { display: block; height: 100%; border-radius: 3px; background: var(--accent); transition: width .4s ease; }
.tdrev.tddone .tdbar > span { background: var(--accent); }
.tdstreak { margin: 0 2px; font-size: 13px; color: var(--muted, #6b6b6b); }
/* 複習完成 */
.rsum { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 20px 16px; margin: 4px 0 12px; border-radius: 16px; background: var(--card); border: 1px solid var(--line); text-align: center; }
.rs-ic { width: 52px; height: 52px; fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; margin-bottom: 4px; }
.rs-ic path { stroke-dasharray: 40; stroke-dashoffset: 0; animation: rsdraw .6s ease-out; }
@keyframes rsdraw { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .rs-ic path { animation: none; } .tdbar > span { transition: none; } }
.rs-t { font-size: 20px; font-weight: 700; }
.rs-s, .rs-k { font-size: 14px; color: var(--muted, #6b6b6b); }
/* 點得到：常用按鈕至少 44 點（Fitts 定律） */
.seg button { min-height: 44px !important; }
.tool { min-height: 44px; }
#readAll, #stopRead, #undo, #redo, #clear { min-width: 44px; min-height: 44px; }
#vbZoom { min-height: 44px; }
.cfolders button { min-height: 44px; }
.qhelp::after { content: ''; position: absolute; inset: -13px; }
"""
rep('</style>', CSS2 + '</style>')

rep('<div id="info" aria-live="polite">還沒有點任何字。</div>', '<div id="info" aria-live="polite">點文章裡任何一個泰文詞，這裡會出現意思和發音。</div>')

# ---------- 1.21 介面語言：中文／English ----------
import json as _json
def _tsv(fn):
    d = {}
    for line in open(os.path.join(D, 'i18n', fn), encoding='utf-8'):
        line = line.rstrip('\n')
        if not line or '\t' not in line: continue
        k, v = line.split('\t', 1)
        d[k] = v
    return d
EN = _tsv('en1.tsv'); EN.update(_tsv('en2.tsv'))
rep('''    <div class="setrow">
      <div class="setlabel">中文字體<span class="sethelp">按鈕、說明和查詞視窗的中文字。泰文字不受影響。</span></div>
      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>''', '''    <div class="setrow">
      <div class="setlabel">介面語言／Language<span class="sethelp">按鈕、說明和選單用哪一種語言。切換後會重新載入 App。詞的意思用哪一種語言，在「閱讀與查詞 → 詞義語言」另外選。</span></div>
      <div class="seg" role="radiogroup" aria-label="介面語言" id="uiLangGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">中文字體<span class="sethelp">按鈕、說明和查詞視窗的中文字。泰文字不受影響。</span></div>
      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>''')
rep("['look', '外觀與字體', ['themeGroup', 'fontGroup']]", "['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'fontGroup']]")
rep("'thai-home-view', 'thai-tone-mode'];", "'thai-home-view', 'thai-tone-mode', 'thai-ui-lang'];")
I18N_JS = '  var I18N_EN = ' + _json.dumps(EN, ensure_ascii=False, separators=(',', ':')) + ';\n' + open(os.path.join(D, 'i18n', 'help_en.js'), encoding='utf-8').read() + open(os.path.join(D, 'i18n_ui.js'), encoding='utf-8').read()
s = s.replace(ANCHOR, I18N_JS + ANCHOR, 1)
rep('</style>', """
/* 1.21 英文介面：CSS 裡的中文字 */
html.ui-en .hdtip::before { content: 'Tip  '; }
html.ui-en .pop .gfocus .sl2:first-child::after { content: ' (opened from other patterns in this sentence)'; }
</style>""")
# 中文說明也更新：同步、介面語言、主頁的今天
rep("'連結後，打開 App 和修改之後會自動同步。Google 的登入每小時要確認一次；過了就按「立即同步」。'", "'連結後，打開 App、回到 App，以及修改後幾秒，都會自動同步，不用每台裝置都按。', '如果看到「改成自動保持登入」，按一次，之後就不用每小時重新登入。'")
rep("""      { t: '換顏色', s: '「深淺色」選淺色或深色', img: 'set-theme',""", """      { t: '介面語言', s: '「外觀與字體」→「介面語言」', img: '',
        d: ['選「中文」或「English」，App 會用那個語言重新載入。', '切換時，查詞的「詞義語言」也會跟著換；之後可以在「閱讀與查詞」另外改。', '句型說明和部分讀物庫的說明目前還是中文。'] },
      { t: '換顏色', s: '「深淺色」選淺色或深色', img: 'set-theme',""")
rep("""        d: ['App 會算好今天該複習哪些卡片：用 FSRS 演算法（Anki 也在用）估計你快忘記的時候，剛好排在那天複習。', '「全部練習一次」：不管排程，全部看一遍。'] },""",
    """        d: ['App 會算好今天該複習哪些卡片：用 FSRS 演算法（Anki 也在用）估計你快忘記的時候，剛好排在那天複習。', '主頁最上面也會顯示今天的複習進度，點一下就開始。', '「全部練習一次」：不管排程，全部看一遍。'] },""")

# ---------- 1.21 句型庫第四批（中級、高級） ----------
GA = "    sim: [['ไป／มา', '去／來（一般）'], ['ทรง', '王室動作前綴']] }\n]);\n"
rep(GA, GA + open(os.path.join(D, 'grammar_data4.js'), encoding='utf-8').read())
open(src, 'w', encoding='utf-8').write(s)
print('v31 ok')
