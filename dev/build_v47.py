import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v47_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = ''
EN = {}

# 匿名使用統計：只在正式網址載入 Umami；設定裡可以關掉
HEAD = """<script>
/* 匿名使用統計（Umami，不用 cookie、不記錄個人資料）：只在正式網址、而且沒有在設定裡關掉時載入 */
(function () {
  function statsLoad() {
    try {
      if (location.hostname !== 'thai-reader-enn.pages.dev') { return; }
      if (localStorage.getItem('thai-stats-off') === '1') { return; }
    } catch (e) { return; }
    window.__statsSite = 1;
    if (document.getElementById('umamiJs')) { return; }
    var s = document.createElement('script');
    s.id = 'umamiJs'; s.defer = true; s.src = 'https://cloud.umami.is/script.js';
    s.setAttribute('data-website-id', '535cb22e-a432-4ceb-969a-35850702ff42');
    s.setAttribute('data-domains', 'thai-reader-enn.pages.dev');
    s.setAttribute('data-auto-track', 'false');
    s.setAttribute('data-do-not-track', 'true');
    s.onload = function () { if (window.__umamiReady) { window.__umamiReady(); } };
    document.head.appendChild(s);
  }
  window.__loadStats = statsLoad;
  statsLoad();
})();
</script>
"""
i = s.index('<style>')
s = s[:i] + HEAD + s[i:]
rep("""      <button type="button" id="openCredits">查看資料來源</button>
    </div>
""", """      <button type="button" id="openCredits">查看資料來源</button>
    </div>
    <div class="setrow">
      <div class="setlabel">匿名使用統計<span class="sethelp">幫忙改進 App：只傳送「打開了哪個分頁、用了哪種匯入、選的程度」這類次數，不會傳送你的文件內容、標題、查的字或帳號，也不用 cookie。關掉以後就完全不傳。</span></div>
      <div class="seg" role="radiogroup" aria-label="匿名使用統計" id="statsGroup"></div>
    </div>
""")
rep("['help', '說明與回饋', ['openHelp', 'openCredits', 'reWelcome', 'fbCat']]", "['help', '說明與回饋', ['openHelp', 'openCredits', 'statsGroup', 'reWelcome', 'fbCat']]")
EN.update({
 '匿名使用統計': 'Anonymous usage statistics',
 '幫忙改進 App：只傳送「打開了哪個分頁、用了哪種匯入、選的程度」這類次數，不會傳送你的文件內容、標題、查的字或帳號，也不用 cookie。關掉以後就完全不傳。': 'Helps improve the app: only counts such as which tab was opened, which kind of import was used and your level are sent — never your documents, titles, the words you look up or your account, and no cookies are used. Turn it off and nothing is sent.',
})

# 主頁：問一次要不要先下載文字辨識工具
rep('    <div id="homeMsg" class="label" aria-live="polite"></div>\n', """    <div id="homeMsg" class="label" aria-live="polite"></div>
    <div id="ocrAsk" class="ocrask" hidden>
      <div class="ocrasktx">要先下載文字辨識工具嗎？約 21 MB，下載後沒有網路也能辨識照片和影片字幕。建議連 Wi‑Fi 時下載。</div>
      <div class="row2"><button type="button" id="ocrAskYes" class="primary">下載</button><button type="button" id="ocrAskNo">之後再說</button></div>
    </div>
""")
# 設定：離線辨識、沉浸式閱讀
rep("""      <div class="seg" role="radiogroup" aria-label="標示查不到的字" id="unkGroup"></div>
    </div>
""", """      <div class="seg" role="radiogroup" aria-label="標示查不到的字" id="unkGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">閱讀時收起工具列<span class="sethelp">在文件裡往下讀時，上面的工具列和下面的分頁列會先收起來，讓文章多一點空間；往上捲一點、或捲到最上面和最下面時就會回來。</span></div>
      <div class="seg" role="radiogroup" aria-label="閱讀時收起工具列" id="immGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">離線使用文字辨識<span class="sethelp">文字辨識工具比較大，平常是第一次用到時才下載。先下載好，出門沒有網路也能辨識照片和影片字幕。</span></div>
      <div id="ocrPreMsg" class="label"></div>
      <button type="button" id="ocrPreBtn">現在下載（約 21 MB）</button>
    </div>
""")
rep("'ocrZhGroup', 'ocrEngGroup', 'unkGroup']]", "'ocrZhGroup', 'ocrEngGroup', 'unkGroup', 'immGroup', 'ocrPreBtn']]")
rep("'thai-known-w', 'thai-mix-hide',", "'thai-known-w', 'thai-mix-hide', 'thai-immersive',", 2)
rep("'thai-known-w', 'thai-mix-hide'];", "'thai-known-w', 'thai-mix-hide', 'thai-immersive'];")
CSS += """
/* 1.39 */
.segquick { display: flex; flex-direction: column; gap: 6px; padding: 8px 0 10px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
.segq { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 48px; padding: 6px 14px; text-align: left; border-radius: 12px; }
.segq .segql { font-size: 14.5px; color: var(--muted); white-space: nowrap; }
.segq .segqw { font-family: var(--thai); font-size: 20px; font-weight: 600; color: var(--fg); }
.segqmore { font-size: 13.5px; }
.tabbar, #toolhead { transition: transform .22s ease, opacity .22s ease; }
body.immersive .tabbar { transform: translateY(110%); }
body.immersive #toolhead { transform: translateY(-120%); opacity: 0; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .tabbar, #toolhead { transition: none; } }
.ocrask { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; margin: 8px 0 12px; }
.ocrask .ocrasktx { line-height: 1.6; margin-bottom: 8px; }
#ocrPreMsg { margin: 4px 0 8px; }
"""
EN.update({
 '要先下載文字辨識工具嗎？約 21 MB，下載後沒有網路也能辨識照片和影片字幕。建議連 Wi‑Fi 時下載。': 'Download the text recognition tools now? About 21 MB; after that, photos and video subtitles can be recognised offline. Best done on Wi‑Fi.',
 '下載': 'Download', '之後再說': 'Not now',
 '閱讀時收起工具列': 'Hide toolbars while reading',
 '在文件裡往下讀時，上面的工具列和下面的分頁列會先收起來，讓文章多一點空間；往上捲一點、或捲到最上面和最下面時就會回來。': 'While you scroll down a document, the toolbar above and the tab bar below slide away to give the text more room; scroll up a little, or reach the top or bottom, and they come back.',
 '離線使用文字辨識': 'Offline text recognition',
 '文字辨識工具比較大，平常是第一次用到時才下載。先下載好，出門沒有網路也能辨識照片和影片字幕。': 'The recognition tools are large, so normally they download the first time you use them. Download them ahead and photos and video subtitles can be recognised without a connection.',
 '現在下載（約 21 MB）': 'Download now (about 21 MB)',
})

# 說明頁
rep("      { t: '修改文字、修正辨識的字', s: '辨識或斷詞出錯時，自己改', img: '',", """      { t: '斷詞不對、閱讀空間', s: '兩下改好斷詞；往下讀時工具列自動收起', img: '',
        d: ['詞切得不對：點那個詞，按查詞視窗下面的「斷詞不對？」，最上面會列出建議（跟前面合起來、跟後面合起來、拆開），點一下就改好，所有文件都會這樣斷。建議都不對，再用下面的 ‹＋ ＋› 自己調。', '帶「์」（不發音符號）的字母一定跟前面的字一起看，App 斷詞時也會把它們接在一起，例如 เทอร์มินอล、จอห์น。', '在文件裡往下讀時，上面的工具列和下面的分頁列會收起來；往上捲一點就回來。不喜歡可以在設定 → 閱讀與查詞 →「閱讀時收起工具列」改成一直顯示。'],
        tip: '改錯了：點那個詞 →「斷詞不對？」→「恢復原本的斷詞」。' },
      { t: '修改文字、修正辨識的字', s: '辨識或斷詞出錯時，自己改', img: '',""")
rep("      { t: 'Editing text and fixing recognised text', s: 'Fix it yourself when recognition or word splitting goes", """      { t: 'Wrong word splits and reading space', s: 'Fix a split in two taps; toolbars hide while you read', img: '',
        d: ['A word split wrongly: tap it and choose “Split wrong?” at the bottom of the look-up box. Suggestions appear at the top (join with previous, join with next, split); one tap fixes it in all documents. If none is right, adjust it yourself with ‹＋ ＋› below.', 'A letter carrying “์” (the silent mark) always belongs with the letters before it, and the app now keeps them together, as in เทอร์มินอล and จอห์น.', 'While you scroll down a document, the toolbar above and the tab bar below slide away; scroll up a little and they come back. To keep them, go to Settings → Reading & lookup → “Hide toolbars while reading”.'],
        tip: 'Changed your mind: tap the word → “Split wrong?” → restore the original split.' },
      { t: 'Editing text and fixing recognised text', s: 'Fix it yourself when recognition or word splitting goes""")
EN.update({
 '點一下就改好：': 'One tap to fix:',
 '都不對？用下面的方法自己調。': 'None right? Adjust it yourself below.',
})
#@@MORE@@
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v47 ok')
