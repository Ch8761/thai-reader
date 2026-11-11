import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
EN = {}
def lit(zh, en=None):
    if en is not None:
        EN[zh] = en
    return json.dumps(zh, ensure_ascii=False)
T = {
  'rr_close': ('關閉', 'Close'),
  'rr_why1': ('依你在設定選的程度、你查過的字，和已記熟的生字推算。「約」表示只是估計，不是測驗結果。', 'Estimated from the level you chose in Settings, the words you looked up and the flashcards you have mastered. “About” means it is an estimate, not a test result.'),
  'rr_why2': ('經驗上，認得率到約 95% 以上，讀起來比較不用一直查字典；低於 80% 會比較吃力。查過的字會慢慢拉低它，把字記熟再回來看，數字就會上升。', 'As a rule of thumb, at around 95% or more you can read without constantly using a dictionary; below 80% it feels hard. Words you look up pull it down; master them as flashcards and it goes back up.'),
  'cap_none': ('不限制', 'No limit'),
}
def fill(js):
    return re.sub(r'\{\{(\w+)\}\}', lambda m: lit(*T[m.group(1)]), js)

# 1. 詞頻表（建置時放進頁面）
freq = open(os.path.join(D, 'dictin', 'freq6000.txt'), encoding='utf-8').read().strip()
rep('<script type="text/plain" id="celebdata">', '<script type="text/plain" id="freqdata">' + freq + '</script>\n<script type="text/plain" id="celebdata">')
# 2. 程式
JS = fill(open(os.path.join(D, 'v36_ui.js'), encoding='utf-8').read())
s = s.replace(ANCHOR, JS + ANCHOR, 1)
# 3. 記錄查過的字
rep("  function showPop(seg) {\n", "  function showPop(seg) {\n    try { rrNoteLook(seg); } catch (err) {}\n")
# 4. 讀物庫：每篇標題旁的標籤＋說明
rep("      top.appendChild(th);\n      if (have) {", "      top.appendChild(th);\n      var rr = rrOn() ? rrCompute(it.text) : null; if (rr) { var rp = rrPill(rr.rate); rp.classList.add('rdrate'); top.appendChild(rp); }\n      if (have) {")
rep("'<div class=\"rdtabs\" role=\"tablist\" aria-label=\"程度\" id=\"rdTabs\"></div>' +", "'<div class=\"rdtabs\" role=\"tablist\" aria-label=\"程度\" id=\"rdTabs\"></div>' +\n    '<p class=\"rdnote\" id=\"rdNote\">標籤「約 82%」是認得率：依你選的程度、查過的字和記熟的生字，推算你大概認得這篇多少比例的詞。</p>' +")
rep("    var ul = $('rdList'); ul.innerHTML = '';", "    var ul = $('rdList'); ul.innerHTML = ''; $('rdNote').hidden = !rrOn();")
EN['標籤「約 82%」是認得率：依你選的程度、查過的字和記熟的生字，推算你大概認得這篇多少比例的詞。'] = 'The “About 82%” tag is your recognition rate: an estimate of how many of this text’s words you probably know, from your chosen level, the words you looked up and your mastered flashcards.'
# 5. 切到文件頁時更新
rep("curTab = t; docSel = null; docMoveOpen = false; docSelRefresh();", "curTab = t; docSel = null; docMoveOpen = false; docSelRefresh(); if (typeof rrRefresh === 'function') { rrRefresh(); }")
# 6. 設定列
rep('    <div class="setrow">\n      <div class="setlabel">辨識中文<',
    '    <div class="setrow">\n      <div class="setlabel">顯示認得率<span class="sethelp">在讀物庫清單和打開文章時，顯示「約 82%」這類標籤：依你選的程度、查過的字和記熟的生字，推算你大概認得多少比例的詞。只是估計。</span></div>\n      <div class="seg" role="radiogroup" aria-label="顯示認得率" id="rrShowGroup"></div>\n    </div>\n'
    '    <div class="setrow">\n      <div class="setlabel">每天複習上限<span class="sethelp">每天最多先排幾張要複習的卡片，其餘的明天再出現，避免卡片越積越多變成負擔。複習頁完成後，想多練可以按「再多複習 10 張」。</span></div>\n      <div class="seg" role="radiogroup" aria-label="每天複習上限" id="revCapGroup"></div>\n    </div>\n'
    '    <div class="setrow">\n      <div class="setlabel">辨識中文<')
rep("    }\n  }\n  renderSettings();\n  function hidePop() {", "    }\n    if (typeof rrSettings === 'function') { rrSettings(); }\n  }\n  renderSettings();\n  function hidePop() {")
EN.update({'顯示認得率': 'Show recognition rate', '每天複習上限': 'Daily review limit',
  '在讀物庫清單和打開文章時，顯示「約 82%」這類標籤：依你選的程度、查過的字和記熟的生字，推算你大概認得多少比例的詞。只是估計。': 'Shows tags like “About 82%” in the reading library and at the top of a text: an estimate of how many of its words you probably know, from your level, the words you looked up and your mastered flashcards.',
  '每天最多先排幾張要複習的卡片，其餘的明天再出現，避免卡片越積越多變成負擔。複習頁完成後，想多練可以按「再多複習 10 張」。': 'The most cards lined up for review each day; the rest come back tomorrow, so cards don’t pile up into a burden. When you finish, tap “Review 10 more” if you want extra practice.',
  '10 張': '10 cards', '20 張': '20 cards', '30 張': '30 cards', '50 張': '50 cards',
  '約 {n}%': 'About {n}%', '認得率約 {n}%': 'Recognition rate about {n}%', '認得率・約 {n} 種詞可能要查': 'Recognition rate · about {n|word|words} may need a lookup'})
# 7. 複習頁
rep("'今天要複習的都完成了。記得越熟，下次出現就隔越久。'", "(revHeld() ? '今天的份量完成了，還有 ' + revHeld() + ' 張明天再出現。' : '今天要複習的都完成了。記得越熟，下次出現就隔越久。')")
rep("row.appendChild(all); }\n", "row.appendChild(all); }\n      if (!n && revHeld()) { var more = el('button', 'primary', '再多複習 10 張'); more.type = 'button'; more.addEventListener('click', function () { revMore(10); renderCards(); }); row.insertBefore(more, row.firstChild); }\n", 2)
EN.update({'今天的份量完成了，還有 {n} 張明天再出現。': 'Today’s batch is done; {n|card comes|cards come} back tomorrow.', '再多複習 10 張': 'Review 10 more'})
# 8. 資料來源
rep("其餘由 ECDICT 與 WordNet 自動對照，僅供參考。';", "其餘由 ECDICT 與 WordNet 自動對照，僅供參考。常用字表：PyThaiNLP 詞頻表（Thai National Corpus、Thai Textbook Corpus，CC0）。';")
EN['詞義：Wiktionary（CC BY-SA，經 kaikki.org 整理）。中文：常用詞為人工翻譯，其餘由 ECDICT 與 WordNet 自動對照，僅供參考。常用字表：PyThaiNLP 詞頻表（Thai National Corpus、Thai Textbook Corpus，CC0）。'] = 'Meanings: Wiktionary (CC BY-SA, via kaikki.org). Chinese: common words are hand-translated, the rest matched automatically from ECDICT and WordNet — for reference only. Common-word list: PyThaiNLP word frequencies (Thai National Corpus, Thai Textbook Corpus; CC0).'
# 9. 說明
rep("      { t: '加文件', s: '按「匯入」選檔案，網址直接貼進網址列', img: 'home-add',",
    "      { t: '認得率', s: '讀物庫和文章上方的「約 82%」：你大概認得多少比例的詞', img: '',\n        d: ['在讀物庫每篇標題旁，和打開文章時上方，會看到「約 82%」。', '它是估計：依你在設定選的程度、你查過的字，和已經記熟的生字推算。', '點文章上方那一條，會看到說明和「可能要查的詞」大約有幾種。', '到設定的「顯示認得率」可以關掉。'],\n        tip: '經驗上，認得率到約 95% 以上，讀起來比較不用一直查字典。查過的字會讓數字下降，把它們記熟，數字就會回升。' },\n      { t: '加文件', s: '按「匯入」選檔案，網址直接貼進網址列', img: 'home-add',")
rep("      { t: '開始複習', s: '到「生字卡」頁，按「開始複習」', img: 'cards-review',",
    "      { t: '每天複習上限', s: '設定裡可以選每天最多幾張，其餘明天再出現', img: '',\n        d: ['到「設定」→「閱讀與查詞」，找「每天複習上限」：10、20、30、50 張或不限制（一開始是 20 張）。', '當天複習到上限後，其餘到期的卡片會明天再出現。', '想多練的話，複習頁按「再多複習 10 張」。'] },\n      { t: '開始複習', s: '到「生字卡」頁，按「開始複習」', img: 'cards-review',")
# 設定分類與同步
rep("['levelGroup', 'romGroup', 'glossGroup', 'entGroup', 'toneGroup', 'ocrZhGroup']", "['levelGroup', 'romGroup', 'glossGroup', 'entGroup', 'rrShowGroup', 'revCapGroup', 'toneGroup', 'ocrZhGroup']")
rep("'thai-ent-off', 'thai-welcome-v1'", "'thai-ent-off', 'thai-rr-show', 'thai-rev-cap', 'thai-lookups', 'thai-welcome-v1'")
CSS = """
/* 1.27 認得率 */
.rrpill { display: inline-flex; align-items: center; flex: none; padding: 1px 9px; border-radius: 999px; font-size: 12.5px; font-weight: 700; line-height: 1.6; white-space: nowrap; }
.rrpill.good { color: color-mix(in srgb, #1f7a45 65%, var(--fg)); background: color-mix(in srgb, #1f7a45 14%, transparent); }
.rrpill.mid { color: var(--fg); background: color-mix(in srgb, var(--muted) 16%, transparent); }
.rrpill.hard { color: color-mix(in srgb, #b45309 70%, var(--fg)); background: color-mix(in srgb, #d9733b 16%, transparent); }
.rditem .rdrate { margin-left: auto; }
.rditem .rdrate + .rdbadge { margin-left: 0; }
.rdnote { margin: 0 0 8px; font-size: 13px; color: var(--muted); line-height: 1.6; }
.rdnote[hidden] { display: none; }
.rrhint { margin: 0 0 10px; border-radius: 12px; background: var(--card); border: 1px solid var(--line); }
.rrhint[hidden], .rrmore[hidden] { display: none; }
.rrrow { display: flex; align-items: center; }
.rrmain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 4px 0 12px; border: 0; border-radius: 12px; background: transparent; color: var(--fg); font-size: 14.5px; text-align: left; }
.rrx { flex: none; width: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--muted); font-size: 22px; }
.rrmore { padding: 0 14px 10px; font-size: 13.5px; color: var(--muted); line-height: 1.65; }
.rrmore p { margin: 0 0 6px; }
"""
rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v36 ok')
