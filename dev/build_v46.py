import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v46_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

rep('    <button type="button" id="editText" hidden>修改文字</button>\n', '    <button type="button" id="glossAll" aria-expanded="false" aria-controls="glpanel">逐詞對照</button>\n    <button type="button" id="editText" hidden>修改文字</button>\n')
rep('  <div id="trpanel" class="trpanel" hidden>', '  <div id="glpanel" class="trpanel glpanel" hidden>\n    <div class="label">每個詞的意思是從字典查來的，只是幫你拆解句子；整句的意思請看「整句翻譯」。點一個詞可以看完整的解釋。</div>\n    <div id="gllist"></div>\n  </div>\n  <div id="trpanel" class="trpanel" hidden>')
for k in ("'thai-show-unk', 'thai-abc',",):
    pass
rep("'thai-lookups', 'thai-ocr-engine', 'thai-thfont', 'thai-show-unk', 'thai-abc',", "'thai-lookups', 'thai-ocr-engine', 'thai-thfont', 'thai-show-unk', 'thai-abc', 'thai-known-w', 'thai-mix-hide',")
rep("'thai-tone-mode', 'thai-font', 'thai-thfont', 'thai-show-unk', 'thai-abc',", "'thai-tone-mode', 'thai-font', 'thai-thfont', 'thai-show-unk', 'thai-abc', 'thai-known-w', 'thai-mix-hide',")
rep("'thai-rwd', 'thai-abc'", "'thai-rwd', 'thai-abc', 'thai-known-w', 'thai-mix-hide'")

# 說明頁：補上 1.33～1.38 的新功能
HELP_ADD = r"""      { t: '修改文字、修正辨識的字', s: '辨識或斷詞出錯時，自己改', img: '',
        d: ['貼上的文字、網址文章、影片字幕：工具列按「修改文字」，整篇打開來改，改完按「儲存」。螢光筆和註解會跟著移到新的位置。', '照片和掃描的 PDF：點那個字，查詞視窗最上面有「修正辨識的字」，可以改那一段；清空再儲存就是拿掉。', '辨識出來的字，App 會先自動校正一次：拼不出詞的字，試著換回「常被認錯的字母」（例如 ร 和 ธ、ว 和 อ），換了以後是常用詞才採用。偶爾會改錯，改錯的用上面的方法改回來。'],
        tip: '文章裡字典查不到的詞，下面有淡淡的虛線，可以在設定 → 閱讀與查詞關掉。' },
      { t: '逐詞對照、中英文行', s: '拆解句子；字幕裡的中文、英文行可以收起來', img: '',
        d: ['工具列按「逐詞對照」：每一行泰文下面，列出每個詞的意思（從字典查的），再附一個「整句翻譯」連結。點一個詞可以看完整解釋。', '逐詞對照只是幫你拆解，詞和詞拼起來不一定是通順的句子，整句的意思請以整句翻譯為準。', '文章裡如果有整行都是中文或英文的行（例如雙語字幕），文章上方會出現「中文行」「英文行」兩個按鈕，按一下就收起來，再按一下打開。'],
        tip: '如果字幕是一行泰文、一行中文，逐詞對照會把那行中文直接附在泰文下面。' },
      { t: '字母與拼讀練習', s: '程度選「入門」時，在生字卡 → 測驗', img: '',
        d: ['子音：看字母，選它開頭唸什麼音。預設只出常用的 33 個，勾選後 44 個都出。', '母音：看寫法（◌ 是放子音的位置），選它唸什麼音。', '拼讀：子音加母音的音節，選怎麼唸（先不用管聲調）。聽音選字：聽發音，選是哪個音節。', '每次 10 題，答錯的之後會比較常出現。'],
        tip: '題目裡的拼音是簡化寫法：aa、ii 這種重複的字母表示長音。' },
"""
rep("      { t: '加文件', s: '按「匯入」選檔案，網址直接貼進網址列', img: 'home-add',", HELP_ADD + "      { t: '加文件', s: '按「匯入」選檔案，網址直接貼進網址列', img: 'home-add',")

# 英文版使用說明（HELP_EN 是另一份）：拿掉舊的地圖兩則，換成「成就」分頁，並補上新功能
a = s.index("      { t: 'Goal and personal map'"); b = s.index("      { t: 'List or grid'")
HELP_EN_ADD = """      { t: '“Achievements” tab', s: 'The fourth tab: my tasks and learning record', img: '',
        d: ['My tasks: add small tasks of your own (such as reading one article or saving five words) and tick the circle on the left when done. For a task you repeat, tap 「+1」 each time and watch the progress bar; tap the task name to edit or delete it.', 'Learning record: at the top right is the number of days in a row you opened the app; the longer the streak, the bigger the flame icon. Below are three blocks — documents, flashcards and finished tasks. Tap a block for a more detailed record and a chart of the last month.', 'On the calendar, every day you opened the app is a solid circle, and today is orange. You can set a weekly goal (3 to 6 days) above the calendar.'],
        tip: 'Use the arrows above the calendar to go back to earlier months.' },
      { t: 'Editing text and fixing recognised text', s: 'Fix it yourself when recognition or word splitting goes wrong', img: '',
        d: ['Pasted text, web articles and video subtitles: tap 「Edit text」 in the toolbar to edit the whole text, then 「Save」. Highlights and notes move with the text.', 'Photos and scanned PDFs: tap the word; at the top of the look-up box, 「Fix recognised text」 lets you edit that piece. Clear it and save to remove it.', 'Recognised text is auto-corrected once: where letters do not make a word, the app tries letters that are often confused (such as ร/ธ and ว/อ) and only accepts a change that gives a common word. It is occasionally wrong; fix it back as above.'],
        tip: 'Words not in the dictionary get a faint dotted underline; you can turn this off in Settings → Reading and look-up.' },
      { t: 'Word by word, Chinese and English lines', s: 'Take sentences apart; hide Chinese or English lines in subtitles', img: '',
        d: ['Tap 「Word by word」 in the toolbar: under each Thai line you see what each word means (from the dictionary), plus a 「Translate sentence」 link. Tap a word for the full entry.', 'Word by word only helps you take the sentence apart; the words put together are not a smooth translation, so rely on the sentence translation for the meaning.', 'If a text has lines entirely in Chinese or English (such as bilingual subtitles), 「Chinese lines」 and 「English lines」 buttons appear above it; tap to hide, tap again to show.'],
        tip: 'If subtitles alternate a Thai line and a Chinese line, word by word shows the Chinese line right under the Thai.' },
      { t: 'Alphabet and reading practice', s: 'In Flashcards → Quiz when your level is “Beginner”', img: '',
        d: ['Consonants: see a letter and choose the sound it starts with. Only the 33 common letters by default; tick the box for all 44.', 'Vowels: see how it is written (◌ marks where the consonant goes) and choose its sound.', 'Blending: choose how a consonant-plus-vowel syllable is read (ignore the tone for now). Listen and choose: hear a syllable and pick it.', 'Ten questions each time; ones you miss come up more often later.'],
        tip: 'The spelling in the answers is simplified: doubled letters such as aa and ii mean a long vowel.' },
"""
s = s[:a] + HELP_EN_ADD + s[b:]

rep('</style>', """
/* 1.38 */
#text mark.lnx { display: none; }
#glossAll, #editText, #translateAll { white-space: nowrap; }
.ttsbar { flex-wrap: wrap; }
.mixbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 8px; }
.mixbar .label { margin: 0; }
.mixb { min-height: 36px; padding: 0 12px; border-radius: 18px; font-size: 14px; }
.mixb[aria-pressed="true"] { background: var(--accent-fill); color: var(--accent-fill-fg); border-color: var(--accent-fill); }
.mixb[aria-pressed="false"] { text-decoration: line-through; color: var(--muted); }
.glpanel { max-height: 60vh; overflow-y: auto; }
.glblk { padding: 10px 0 12px; border-bottom: 1px solid var(--line); }
.glsent { font-family: var(--thai); font-size: 19px; line-height: 1.7; margin-bottom: 6px; }
.glrow { display: flex; flex-wrap: wrap; gap: 4px; }
.glw { display: inline-flex; flex-direction: column; align-items: center; gap: 0; min-height: 44px; padding: 3px 7px; border-radius: 10px; background: var(--bg); line-height: 1.25; }
.glth { font-family: var(--thai); font-size: 17px; }
.glz { font-size: 12px; color: var(--muted); max-width: 9em; }
.glz.none { opacity: .6; }
.gltr { margin-top: 6px; font-size: 14.5px; color: var(--fg); }
.gllink { display: inline-block; margin-top: 6px; }
.rrbtns { margin-top: 8px; flex-wrap: wrap; }
.rklist { list-style: none; margin: 0; padding: 0; }
.rkrow { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 4px 10px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.rkrow.moved { opacity: .5; }
.rkw { font-family: var(--thai); font-size: 19px; }
.rkg { font-size: 13.5px; color: var(--muted); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rkn { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.rkwhy { grid-column: 2 / 3; font-size: 12px; color: var(--muted); }
.rkb { min-height: 36px; padding: 0 10px; font-size: 13.5px; grid-row: 1; grid-column: 4; }
</style>""")
EN = {
 '逐詞對照': 'Word by word',
 '每個詞的意思是從字典查來的，只是幫你拆解句子；整句的意思請看「整句翻譯」。點一個詞可以看完整的解釋。': 'Each word’s meaning comes from the dictionary — it only helps you take the sentence apart; for the meaning of the whole sentence, use “Translate sentence”. Tap a word for the full entry.',
 '修改文字、修正辨識的字': 'Editing text and fixing recognised text', '辨識或斷詞出錯時，自己改': 'Fix it yourself when recognition or word splitting goes wrong',
 '貼上的文字、網址文章、影片字幕：工具列按「修改文字」，整篇打開來改，改完按「儲存」。螢光筆和註解會跟著移到新的位置。': 'Pasted text, web articles and video subtitles: tap “Edit text” in the toolbar to edit the whole text, then “Save”. Highlights and notes move with the text.',
 '照片和掃描的 PDF：點那個字，查詞視窗最上面有「修正辨識的字」，可以改那一段；清空再儲存就是拿掉。': 'Photos and scanned PDFs: tap the word; at the top of the look-up box, “Fix recognised text” lets you edit that piece. Clear it and save to remove it.',
 '辨識出來的字，App 會先自動校正一次：拼不出詞的字，試著換回「常被認錯的字母」（例如 ร 和 ธ、ว 和 อ），換了以後是常用詞才採用。偶爾會改錯，改錯的用上面的方法改回來。': 'Recognised text is auto-corrected once: where letters do not make a word, the app tries letters that are often confused (such as ร/ธ and ว/อ) and only accepts the change if it gives a common word. It is occasionally wrong; fix it back as described above.',
 '文章裡字典查不到的詞，下面有淡淡的虛線，可以在設定 → 閱讀與查詞關掉。': 'Words not in the dictionary get a faint dotted underline; you can turn this off in Settings → Reading and look-up.',
 '逐詞對照、中英文行': 'Word by word, Chinese and English lines', '拆解句子；字幕裡的中文、英文行可以收起來': 'Take sentences apart; hide Chinese or English lines in subtitles',
 '工具列按「逐詞對照」：每一行泰文下面，列出每個詞的意思（從字典查的），再附一個「整句翻譯」連結。點一個詞可以看完整解釋。': 'Tap “Word by word” in the toolbar: under each Thai line you see what each word means (from the dictionary), plus a “Translate sentence” link. Tap a word for the full entry.',
 '逐詞對照只是幫你拆解，詞和詞拼起來不一定是通順的句子，整句的意思請以整句翻譯為準。': 'Word by word only helps you take the sentence apart; the words put together are not a smooth translation, so rely on the sentence translation for the meaning.',
 '文章裡如果有整行都是中文或英文的行（例如雙語字幕），文章上方會出現「中文行」「英文行」兩個按鈕，按一下就收起來，再按一下打開。': 'If a text has lines entirely in Chinese or English (such as bilingual subtitles), “Chinese lines” and “English lines” buttons appear above it; tap to hide, tap again to show.',
 '如果字幕是一行泰文、一行中文，逐詞對照會把那行中文直接附在泰文下面。': 'If subtitles alternate a Thai line and a Chinese line, word by word shows the Chinese line right under the Thai.',
 '字母與拼讀練習': 'Alphabet and reading practice', '程度選「入門」時，在生字卡 → 測驗': 'In Flashcards → Quiz when your level is “Beginner”',
 '子音：看字母，選它開頭唸什麼音。預設只出常用的 33 個，勾選後 44 個都出。': 'Consonants: see a letter and choose the sound it starts with. Only the 33 common letters by default; tick the box for all 44.',
 '母音：看寫法（◌ 是放子音的位置），選它唸什麼音。': 'Vowels: see how it is written (◌ marks where the consonant goes) and choose its sound.',
 '拼讀：子音加母音的音節，選怎麼唸（先不用管聲調）。聽音選字：聽發音，選是哪個音節。': 'Blending: choose how a consonant-plus-vowel syllable is read (ignore the tone for now). Listen and choose: hear a syllable and pick it.',
 '每次 10 題，答錯的之後會比較常出現。': 'Ten questions each time; ones you miss come up more often later.',
 '題目裡的拼音是簡化寫法：aa、ii 這種重複的字母表示長音。': 'The spelling in the answers is simplified: doubled letters such as aa and ii mean a long vowel.',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v46 ok')
