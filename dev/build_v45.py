import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v45_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)
# 句型庫第五批
G5 = open(os.path.join(D, 'grammar5.js'), encoding='utf-8').read()
rep("\n/* 1.21 修正：字典把某些詞跟後面的字連成一個詞", "\n" + G5 + "/* 1.21 修正：字典把某些詞跟後面的字連成一個詞")
# 字母練習的紀錄：備份、同步（不重新載入）
rep("'thai-lookups', 'thai-ocr-engine', 'thai-thfont', 'thai-show-unk',", "'thai-lookups', 'thai-ocr-engine', 'thai-thfont', 'thai-show-unk', 'thai-abc',")
rep("'thai-tone-mode', 'thai-font', 'thai-thfont', 'thai-show-unk',", "'thai-tone-mode', 'thai-font', 'thai-thfont', 'thai-show-unk', 'thai-abc',")
rep("var SYNC_QUIET = ['thai-progress', 'thai-tasks', 'thai-flame', 'thai-hist', 'thai-rwd'", "var SYNC_QUIET = ['thai-progress', 'thai-tasks', 'thai-flame', 'thai-hist', 'thai-rwd', 'thai-abc'")
rep("    ['補充詞彙', '外來語、菜名、地名的補充詞表由本 App 自行整理", "    ['補充詞彙', '外來語、菜名、地名、方言、流行語的補充詞表由本 App 自行整理")
rep('</style>', """
/* 1.37 */
.abcsec { margin: 0 0 20px; padding: 14px 14px 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--card); }
.abch { margin: 0 0 6px; font-size: 17px; }
.abcall { display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14.5px; color: var(--muted); }
.abcall input { width: 20px; height: 20px; }
.abccard .abcbig { font-size: 72px; line-height: 1.5; }
.abcafter { margin-top: 8px; font-size: 16px; line-height: 1.6; font-family: var(--thai); }
</style>""")
EN = {
 '字母與拼讀練習': 'Alphabet and reading practice', '生字卡測驗': 'Flashcard quiz',
 '不用先存生字卡。每次 10 題，答錯的字母之後會比較常出現。': 'No flashcards needed. Ten questions each time; letters you miss come up more often later.',
 '練習內容': 'What to practise', '子音': 'Consonants', '母音': 'Vowels', '拼讀': 'Blending', '聽音選字': 'Listen and choose',
 '包含少用的字母（全部 44 個）': 'Include rarely used letters (all 44)', '開始練習': 'Start', '再練一次': 'Practise again', '回到練習內容': 'Back to options',
 '答錯的這幾個，下次會再出現：': 'These will come up again next time:', '看結果': 'See result', '下一題': 'Next',
 '這個字母開頭唸什麼音？': 'What sound does this letter make at the start of a syllable?',
 '這個母音唸什麼音？（◌ 是放子音的位置）': 'What sound is this vowel? (◌ marks where the consonant goes)',
 '這個音節怎麼唸？（先不用管聲調）': 'How is this syllable read? (ignore the tone for now)',
 '聽發音，選出是哪個音節': 'Listen and choose the syllable',
 '外來語、菜名、地名、方言、流行語的補充詞表由本 App 自行整理（中文與英文解釋為人工撰寫，尚未經母語者審訂）。': 'The extra list of loanwords, dishes, place names, dialect words and slang is compiled by this app (definitions written by hand, not yet reviewed by a native speaker).',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v45 ok')
