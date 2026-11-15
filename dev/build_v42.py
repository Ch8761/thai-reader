import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v42_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# 新版一次就讀好，不用再換版面模式重讀
rep("    if (bs >= 400) { return best; }", "    if (bs >= 400 || w.ot) { return best; }")
rep("    setOcrMsg('準備文字辨識工具…（第一次要下載約 8 MB，之後就不用）');", "    setOcrMsg('準備文字辨識工具…（第一次要下載約 15 MB，之後就不用）');")

# 影片字幕：遮罩後的畫面是照舊工具調的，新版在這種畫面上反而容易認錯，先維持舊工具
rep("bar.style.width = '0%';\n    var w = await ensureOcr();\n", "bar.style.width = '0%';\n    var w = await _ensureOcr42();\n")

# 設定：文字辨識方式
a = s.index('      <div class="seg" role="radiogroup" aria-label="辨識中文" id="ocrZhGroup"></div>\n    </div>\n')
b = a + len('      <div class="seg" role="radiogroup" aria-label="辨識中文" id="ocrZhGroup"></div>\n    </div>\n')
s = s[:b] + """    <div class="setrow">
      <div class="setlabel">文字辨識方式<span class="sethelp">圖片和掃描的 PDF 裡的字要怎麼認。「新版」認泰文和英文比較準、也比較快（中文和影片字幕仍由舊工具負責）。如果新版在你的裝置上不能用或結果奇怪，可以改回「舊版」。已經辨識過的文件不會自動重讀。</span></div>
      <div class="seg" role="radiogroup" aria-label="文字辨識方式" id="ocrEngGroup"></div>
    </div>
""" + s[b:]
rep("'toneGroup', 'ocrZhGroup']]", "'toneGroup', 'ocrZhGroup', 'ocrEngGroup']]")
rep("'thai-rr-show', 'thai-rev-cap', 'thai-lookups',", "'thai-rr-show', 'thai-rev-cap', 'thai-lookups', 'thai-ocr-engine',")

# 資料來源頁
rep("    ['文字辨識', 'Tesseract.js（Apache-2.0）。'],", "    ['文字辨識', 'OpenThai2.0-OCR-Text（iApp Technology，Apache-2.0；文字偵測為 PaddlePaddle PP-OCRv6，Apache-2.0）、ONNX Runtime Web（MIT）、Tesseract.js（Apache-2.0）。'],")

# Pantip 不讓程式讀取：直接講清楚
rep("    if (a.thai < 60) { throw new Error('這個網頁找不到泰文文章內容", "    if (a.thai < 60 && /(^|\\.)pantip\\.com$/i.test(new URL(u).hostname)) { throw new Error('Pantip 不開放程式讀取它的文章（網站自己擋的）。請在瀏覽器打開那一篇、全選複製，貼到下面的「貼上泰文」。'); }\n    if (a.thai < 60) { throw new Error('這個網頁找不到泰文文章內容")

EN = {
 '文字辨識方式': 'Text recognition engine',
 '圖片和掃描的 PDF 裡的字要怎麼認。「新版」認泰文和英文比較準、也比較快（中文和影片字幕仍由舊工具負責）。如果新版在你的裝置上不能用或結果奇怪，可以改回「舊版」。已經辨識過的文件不會自動重讀。': 'How text in images and scanned PDFs is read. “New” reads Thai and English more accurately and faster (Chinese and video subtitles are still handled by the old tool). If the new one does not work on your device or gives odd results, switch back to “Old”. Documents already recognised are not re-read automatically.',
 '準備文字辨識工具…（第一次要下載約 15 MB，之後就不用）': 'Preparing text recognition… (about 15 MB to download the first time only)',
 '準備文字辨識工具…（第一次要下載約 15 MB）': 'Preparing text recognition… (about 15 MB the first time)',
 'OpenThai2.0-OCR-Text（iApp Technology，Apache-2.0；文字偵測為 PaddlePaddle PP-OCRv6，Apache-2.0）、ONNX Runtime Web（MIT）、Tesseract.js（Apache-2.0）。': 'OpenThai2.0-OCR-Text (iApp Technology, Apache-2.0; text detection by PaddlePaddle PP-OCRv6, Apache-2.0), ONNX Runtime Web (MIT), Tesseract.js (Apache-2.0).',
 'Pantip 不開放程式讀取它的文章（網站自己擋的）。請在瀏覽器打開那一篇、全選複製，貼到下面的「貼上泰文」。': 'Pantip does not let apps read its posts (the site blocks it). Open the post in your browser, select all and copy, then paste it into “Paste Thai text” below.',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v42 ok')
