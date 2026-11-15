import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v43_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# ===== 1. 影片字幕：字幕位置照舊的方式鎖定，多一種讀法「ot」＝用新版辨識直接讀框裡的畫面，和舊的三種讀法比分數 =====
rep("    var w = await _ensureOcr42();\n    var stat = await vidStatic(v);", """    var w = await _ensureOcr42();
    if (otOn()) { try { await otLoad(); modes.unshift('ot'); wins.ot = 0; } catch (err) {} }
    var stat = await vidStatic(v);""")
rep("""  async function vidRecognize(w, fc, region, mode, pre, stat) {
    var cv, minConf;
""", """  async function vidRecognize(w, fc, region, mode, pre, stat) {
    var cv, minConf;
    if (mode === 'ot') {
      var ox = Math.round(region[0] * fc.width), oy = Math.round(region[1] * fc.height), ow = Math.max(8, Math.round(region[2] * fc.width)), oh = Math.max(8, Math.round(region[3] * fc.height));
      var ok = Math.min(2, 1280 / ow);
      cv = document.createElement('canvas'); cv.width = Math.round(ow * ok); cv.height = Math.round(oh * ok);
      var og = cv.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(fc, ox, oy, ow, oh, 0, 0, cv.width, cv.height);
      var ores = await otWorker.recognizeOnly(cv);
      return vidLinesFrom(ores.data, 70);
    }
""")

# ===== 2. 泰文字體 =====
rep("""      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>
""", """      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">泰文字體<span class="sethelp">App 裡的泰文要用哪種字體顯示。課本和報紙多半是「有圈」的字（字母上有小圓圈）；招牌、廣告、手機介面常用「無圈」的字，同一個字母長得很不一樣，兩種都看得懂才算真的認得。選了以後，文章、查詞、生字卡都會換。PDF 和照片是原本的畫面，不會變。</span></div>
      <div class="seg" role="radiogroup" aria-label="泰文字體" id="thFontGroup"></div>
    </div>
""")
rep("['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'fontGroup', 'flameGroup']]", "['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'fontGroup', 'thFontGroup', 'flameGroup']]")
rep("'thai-rr-show', 'thai-rev-cap', 'thai-lookups', 'thai-ocr-engine',", "'thai-rr-show', 'thai-rev-cap', 'thai-lookups', 'thai-ocr-engine', 'thai-thfont',")
rep("var SYNC_SET = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-theme', 'thai-tone-mode', 'thai-font',", "var SYNC_SET = ['thai-level', 'thai-show-rom', 'thai-gloss-lang', 'thai-show-ents', 'thai-theme', 'thai-tone-mode', 'thai-font', 'thai-thfont',")
rep("    ['PDF', 'PDF.js（Apache-2.0）、pdf-lib（MIT）。']", "    ['泰文字體', 'Sarabun、Kanit、Mali（Cadson Demak）、Noto Serif Thai（Google），皆為 SIL Open Font License 1.1。'],\n    ['PDF', 'PDF.js（Apache-2.0）、pdf-lib（MIT）。']")
rep('</style>', """
/* 1.35 */
#thFontGroup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
#thFontGroup button { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 6px 4px; line-height: 1.3; }
#thFontGroup .thfs { font-size: 19px; line-height: 1.5; }
</style>""")
EN = {
 '泰文字體': 'Thai font',
 'App 裡的泰文要用哪種字體顯示。課本和報紙多半是「有圈」的字（字母上有小圓圈）；招牌、廣告、手機介面常用「無圈」的字，同一個字母長得很不一樣，兩種都看得懂才算真的認得。選了以後，文章、查詞、生字卡都會換。PDF 和照片是原本的畫面，不會變。': 'Which typeface Thai is shown in. Textbooks and newspapers mostly use “looped” letters (with small circles); signs, ads and phone interfaces often use “loopless” letters, where the same letter looks quite different — being able to read both is part of really knowing the script. Your choice applies to articles, look-ups and flashcards. PDFs and photos keep their original look.',
 'Sarabun、Kanit、Mali（Cadson Demak）、Noto Serif Thai（Google），皆為 SIL Open Font License 1.1。': 'Sarabun, Kanit, Mali (Cadson Demak) and Noto Serif Thai (Google), all under the SIL Open Font License 1.1.',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]

open(src, 'w', encoding='utf-8').write(s)
print('v43 ok')
