import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v44_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# 辨識的每一段記住它是第幾個（修改時用）
rep("    return items.map(function (a) {\n      var ln = { x: a[0] * pageW, base: a[1] * pageW, w: Math.max(1, a[2] * pageW), h: a[3] * pageW, t: a[4], nulls: 0, ocr: true };",
    "    return items.map(function (a, oi) {\n      var ln = { x: a[0] * pageW, base: a[1] * pageW, w: Math.max(1, a[2] * pageW), h: a[3] * pageW, t: a[4], nulls: 0, ocr: true, oi: oi };")
# 「修改文字」按鈕
rep('    <button type="button" id="translateAll" aria-expanded="false" aria-controls="trpanel">整篇翻譯</button>\n',
    '    <button type="button" id="translateAll" aria-expanded="false" aria-controls="trpanel">整篇翻譯</button>\n    <button type="button" id="editText" hidden>修改文字</button>\n')
# 設定：標示查不到的字
a = s.index('      <div class="seg" role="radiogroup" aria-label="文字辨識方式" id="ocrEngGroup"></div>\n    </div>\n')
b = a + len('      <div class="seg" role="radiogroup" aria-label="文字辨識方式" id="ocrEngGroup"></div>\n    </div>\n')
s = s[:b] + """    <div class="setrow">
      <div class="setlabel">標示查不到的字<span class="sethelp">文章裡 App 的字典查不到的泰文詞，下面會有一條淡淡的虛線。這類詞可能是很新的用語、少見的名字，也可能是辨識或斷詞出了錯。虛線越多，代表這篇 App 幫得上忙的地方越少。人名、地名和已經標示的專有名詞不算。</span></div>
      <div class="seg" role="radiogroup" aria-label="標示查不到的字" id="unkGroup"></div>
    </div>
""" + s[b:]
rep("'toneGroup', 'ocrZhGroup', 'ocrEngGroup']]", "'toneGroup', 'ocrZhGroup', 'ocrEngGroup', 'unkGroup']]")
rep("'thai-lookups', 'thai-ocr-engine', 'thai-thfont',", "'thai-lookups', 'thai-ocr-engine', 'thai-thfont', 'thai-show-unk',")
rep("'thai-tone-mode', 'thai-font', 'thai-thfont',", "'thai-tone-mode', 'thai-font', 'thai-thfont', 'thai-show-unk',")
rep("    ['中文詞義', ", "    ['補充詞彙', '外來語、菜名、地名的補充詞表由本 App 自行整理（中文與英文解釋為人工撰寫，尚未經母語者審訂）。'],\n    ['中文詞義', ")
rep('</style>', """
/* 1.36 */
#text mark.unk { background: none; color: inherit; border-bottom: 1.5px dotted color-mix(in srgb, var(--muted) 75%, transparent); }
#text.pdf mark.unk { background: none; color: transparent; border-bottom: 1.5px dotted rgba(90, 100, 110, 0.75); }
.edhint { margin: 0 0 10px; font-size: 14.5px; line-height: 1.6; color: var(--muted); }
.edbox { width: 100%; box-sizing: border-box; min-height: 48px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--fg); font-family: var(--thai); font-size: 19px; line-height: 1.8; }
.edbox.multi { min-height: 46vh; resize: vertical; }
.edbtns { margin-top: 12px; justify-content: flex-start; }
.pop .ocrfixlink { display: block; margin: 0 0 6px; min-height: 36px; font-size: 13.5px; color: var(--accent); }
</style>""")
EN = {
 '修改文字': 'Edit text', '修正辨識的字': 'Fix recognised text', '儲存': 'Save',
 '可以直接改錯字、補上漏掉的字，或刪掉多餘的行。螢光筆和註解會跟著移到新的位置。': 'Correct wrong letters, add missing words or delete extra lines. Highlights and notes move along with the text.',
 '這一段是從畫面上辨識出來的。改成正確的字後按「儲存」；整段都是雜訊的話，清空再儲存就會拿掉。': 'This piece was recognised from the picture. Type the correct text and tap “Save”; if it is all noise, clear it and save to remove it.',
 '這一段沒有改成功，請重新打開文件再試一次。': 'That change could not be saved. Reopen the document and try again.',
 '標示查不到的字': 'Mark words not in the dictionary',
 '文章裡 App 的字典查不到的泰文詞，下面會有一條淡淡的虛線。這類詞可能是很新的用語、少見的名字，也可能是辨識或斷詞出了錯。虛線越多，代表這篇 App 幫得上忙的地方越少。人名、地名和已經標示的專有名詞不算。': 'Thai words the app’s dictionary cannot find get a faint dotted underline. They may be very new expressions, rare names, or mistakes in recognition or word splitting. The more dotted lines, the less the app can help with this text. Names, places and proper nouns already marked are not counted.',
 '補充詞彙': 'Extra vocabulary',
 '外來語、菜名、地名的補充詞表由本 App 自行整理（中文與英文解釋為人工撰寫，尚未經母語者審訂）。': 'The extra list of loanwords, dishes and place names is compiled by this app (definitions written by hand, not yet reviewed by a native speaker).',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v44 ok')
