import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
def cut(a_marker, b_marker, new, include_b=True):
    """把 a_marker 到 b_marker（含）之間整段換掉"""
    global s
    assert s.count(a_marker) == 1, ('cut a', s.count(a_marker), a_marker[:80])
    a = s.index(a_marker); b = s.index(b_marker, a)
    assert b > a, ('cut order', b_marker[:80])
    s = s[:a] + new + s[b + (len(b_marker) if include_b else 0):]
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
EN = {}
def lit(zh, en=None):
    if en is not None:
        EN[zh] = en
    return json.dumps(zh, ensure_ascii=False)
def fill(js, table):
    def f(m):
        z, e = table[m.group(1)]
        if m.group(2):
            return json.dumps(e, ensure_ascii=False)
        return lit(z, e)
    return re.sub(r'\{\{(\w+)(\|en)?\}\}', f, js)

# ======================================================================
# A. 資料夾：再點一下目前的分頁 → 下拉「改名／刪除資料夾」（主頁、生字卡頁）
# ======================================================================
rep("libFolderEdit = null, curTab = 'home', theme = 'system';", "libFolderEdit = null, libMenu = false, curTab = 'home', theme = 'system';")
rep("cardsOnlyDoc = false, folderEdit = null;", "cardsOnlyDoc = false, folderEdit = null, cardMenu = false;")
CHEV = "{ var onb = seg.querySelector('[aria-checked=\"true\"]'); if (onb) { onb.classList.add('hasmenu'); onb.setAttribute('aria-haspopup', 'menu'); onb.setAttribute('aria-expanded', String(%s)); onb.insertAdjacentHTML('beforeend', '<svg class=\"fchev\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 10l5 5 5-5\"/></svg>'); } }"
# 主頁
rep("segButtons(seg, opts, lib.cur, function (v) { lib.cur = v; libFolderEdit = null; saveLib(); renderHome(); });\n    var custom = lib.cur !== 'all';",
    "segButtons(seg, opts, lib.cur, function (v) {\n      if (v === lib.cur && v !== 'all') { libMenu = !libMenu; libFolderEdit = null; renderHome(); return; }\n      libMenu = false; docSel = null; lib.cur = v; libFolderEdit = null; saveLib(); renderHome();\n    });\n    var custom = lib.cur !== 'all';\n    if (custom) " + CHEV % 'libMenu')
cut("    /* 選了自己建的資料夾：在文件清單上方顯示資料夾名稱，改名、刪除放在這裡 */\n", "      bar.appendChild(ren); bar.appendChild(del);\n    }\n",
"""    /* 1.25 選了自己建的資料夾，再點一下同一個分頁 → 下拉「改名」「刪除資料夾」 */
    if (custom && libFolderEdit === 'rename') { host.appendChild(editor('rename')); }
    if (custom && libMenu && !libFolderEdit) {
      folderMenu(host, seg, function () { libMenu = false; libFolderEdit = 'rename'; renderHome(); }, function () {
        var id = lib.cur;
        lib.docs.forEach(function (d) { if (d.folder === id) { d.folder = ''; } });
        lib.folders = lib.folders.filter(function (f) { return f.id !== id; });
        lib.cur = 'all'; libMenu = false; saveLib(); renderHome();
      }, "再按一次確定（裡面的文件不會刪，會留在「全部」）");
    }
""")
# 生字卡頁
rep("segButtons(seg, opts, cardFolder, function (v) { cardFolder = v; folderEdit = null; review = null; saveCards(); renderCards(); });",
    "segButtons(seg, opts, cardFolder, function (v) {\n      if (v === cardFolder && v !== 'all') { cardMenu = !cardMenu; folderEdit = null; renderCards(); return; }\n      cardMenu = false; cardFolder = v; folderEdit = null; review = null; saveCards(); renderCards();\n    });\n    if (cardFolder !== 'all') " + CHEV % 'cardMenu')
cut("    /* 選了自己建的資料夾：改名、刪除放在資料夾名稱旁邊 */\n", "      host.appendChild(bar);\n    }\n",
"""    /* 1.25 再點一下目前的資料夾分頁 → 下拉「改名」「刪除資料夾」 */
    if (cardFolder !== 'all' && folderEdit === 'rename') { host.appendChild(editor('rename')); }
    if (cardFolder !== 'all' && cardMenu && !folderEdit) {
      folderMenu(host, seg, function () { cardMenu = false; folderEdit = 'rename'; renderCards(); }, function () {
        var id = cardFolder;
        cards.forEach(function (c) { if (c.folder === id) { c.folder = ''; } });
        folders = folders.filter(function (f) { return f.id !== id; });
        cardFolder = 'all'; cardMenu = false; saveCards(); renderCards();
      }, "再按一次確定（裡面的生字卡不會刪，會留在「全部」）");
    }
""")

# ======================================================================
# B. 長按文件多選（主頁）：renderHome 尾端接上、其餘放在 ANCHOR
# ======================================================================
rep("      ul.appendChild(li);\n    });\n  }\n  var HV_KEY = 'thai-home-view'", "      ul.appendChild(li);\n      docSelAttach(li, d);\n    });\n    docSelRefresh();\n  }\n  var HV_KEY = 'thai-home-view'")

# ======================================================================
# C. 生字卡清單：篩選晶片、上次複習日
# ======================================================================
cut("    /* 第二排：只看目前文件、Anki */\n", "    host.appendChild(ta);\n",
"""    /* 第二排：篩選「只看目前文件」（打開時顯示是哪一份） */
    var bar = el('div', 'clbar2');
    var only = el('button', 'clchip'); only.type = 'button'; only.setAttribute('aria-pressed', String(cardsOnlyDoc)); only.disabled = !state.src;
    only.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z"/></svg>';
    only.appendChild(el('span', '', '只看目前文件'));
    if (cardsOnlyDoc && state.src) { var dn = el('span', 'cldoc', docName()); dn.setAttribute('data-noi18n', '1'); only.appendChild(dn); }
    only.addEventListener('click', function () { cardsOnlyDoc = !cardsOnlyDoc; renderCards(); });
    bar.appendChild(only);
    host.appendChild(bar);
""")
rep("l.appendChild(el('span', 'cm', cardMeaning(c) || '（字典沒有）'));", "l.appendChild(el('span', 'cm', cardMeaning(c) || '（字典沒有）'));\n      l.appendChild(el('span', 'clast', lastLine(c)));")
rep("'・熟悉度 ' + c.box + ' / 5', font: '400 8.5px $UI'", "'・熟悉度 ' + c.box + ' / 5・' + lastLine(c), font: '400 8.5px $UI'")
rep("    st2.appendChild(el('p', 'label', '加入：'", "    st2.appendChild(el('p', '', lastTs(c) ? '上次複習：' + new Date(lastTs(c)).toLocaleDateString('zh-TW') : '還沒複習過'));\n    st2.appendChild(el('p', 'label', '加入：'")
rep("g.fillText(docName() + '・' + new Date().toLocaleDateString('zh-TW')", "g.fillText((FOOT_NAME || docName()) + '・' + new Date().toLocaleDateString('zh-TW')")
EN.update({'上次複習 {n}/{n}': 'Last reviewed {n}/{n}', '上次複習 {n}/{n}/{n}': 'Last reviewed {n}/{n}/{n}', '還沒複習': 'Not reviewed yet',
           '上次複習：{n}/{n}/{n}': 'Last reviewed: {n}/{n}/{n}', '還沒複習過': 'Not reviewed yet'})

# ======================================================================
# D. 生字卡標題右邊的「匯出」
# ======================================================================
rep('<header class="vhead"><h1 id="h-cardsv">生字卡</h1></header>',
    '<header class="vhead"><h1 id="h-cardsv">生字卡</h1><span class="vh-acts"><button type="button" id="openCardExport" class="cexport" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"/></svg>匯出</button></span></header>')

JS = open(os.path.join(D, 'v34_ui.js'), encoding='utf-8').read()
T = {
  'fm_rename': ('改名', 'Rename'), 'fm_delete': ('刪除資料夾', 'Delete folder'),
  'sel_aria': ('已選文件', 'Selected documents'), 'sel_cancel': ('取消選取', 'Cancel selection'),
  'sel_all': ('全選', 'Select all'), 'sel_move': ('移到資料夾', 'Move to folder'),
  'sel_nofolder': ('不放資料夾', 'No folder'), 'sel_newname': ('新資料夾名稱', 'New folder name'), 'sel_create': ('建立並移入', 'Create and move'),
  'sel_tip': ('小技巧：長按文件可以一次選好幾份，移到資料夾', 'Tip: long-press a document to select several and move them to a folder'),
  'cx_title': ('匯出生字卡', 'Export flashcards'), 'cx_scope': ('匯出範圍', 'What to export'),
  'cx_word_sub': ('表格，可以在 Word、Pages、Google 文件裡再編輯', 'A table you can edit in Word, Pages or Google Docs'),
  'cx_pdf_sub': ('可以直接列印，或存進檔案', 'Ready to print or save as a file'),
  'cx_anki_sub': ('每張卡一行，用 Anki 的「匯入檔案」匯入（需要 Anki 2.1.54 以上）', 'One card per line; import with Anki’s “Import File” (needs Anki 2.1.54 or newer)'),
  'cx_copy': ('複製成 Anki 文字', 'Copy as Anki text'), 'cx_empty': ('還沒有生字卡可以匯出。', 'There are no flashcards to export yet.'),
  'cx_busy': ('產生中…', 'Working…'), 'cx_cancel': ('已取消。', 'Cancelled.'),
  'cx_copied': ('已複製。貼到記事本存成 .txt，再用 Anki 的「匯入檔案」匯入。', 'Copied. Paste it into a notes app, save as .txt, then use Anki’s “Import File”.'),
  'cx_close': ('關閉', 'Close'),
  'cx_copy_fail': ('這裡不能直接複製，已經把內容放在下面的框裡並全選，請長按後選「拷貝」。', 'Copying isn’t allowed here. The text is in the box below, already selected — long-press and choose “Copy”.'),
  'docx_title': ('泰文生字卡', 'Thai flashcards'),
  'docx_h1': ('單字', 'Word'), 'docx_h2': ('拼音', 'Romanization'), 'docx_h3': ('意思', 'Meaning'), 'docx_h4': ('例句', 'Example'), 'docx_h5': ('來源', 'Source'), 'docx_h6': ('上次複習', 'Last reviewed'),
}
JS = fill(JS, T)
for k, v in {
  '已選 {n} 份': '{n} selected', '已移動 {n} 份文件': '{n|document|documents} moved',
  '目前顯示的 {n} 張': 'Currently shown ({n})', '全部 {n} 張': 'All {n|card|cards}', '共 {n} 張': '{n|card|cards} in total',
  '已匯出 {n} 張。如果跳出視窗，請選「儲存到檔案」。': 'Exported {n|card|cards}. If a window opens, choose “Save to Files”.',
  '匯出失敗：': 'Export failed: ',
}.items():
    EN[k] = v
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# showTab：離開主頁就收起選取列；移掉舊的資料夾名稱列
rep("    curTab = t;\n    try { localStorage.setItem(TAB_KEY, t); }", "    curTab = t; docSel = null; docMoveOpen = false; docSelRefresh();\n    try { localStorage.setItem(TAB_KEY, t); }")
rep('    <div id="homeFolderBar" class="fbar" hidden></div>\n', '')

# ======================================================================
# E. 說明（中文）
# ======================================================================
rep("      { t: '改名、刪資料夾', s: '先點進那個資料夾，再按「改名」或「刪除資料夾」', img: 'home-folderbar',\n        d: ['點上面自己建的資料夾。', '文件清單上方會出現這個資料夾的名稱，旁邊有「改名」「刪除資料夾」。', '刪除要按兩次才會刪；裡面的文件不會被刪，會留在「全部」。'] }]],",
    "      { t: '改名、刪資料夾', s: '先點進那個資料夾，再點一下同一個分頁', img: '',\n        d: ['先點上面自己建的資料夾（「讀物庫」也一樣）。', '再點一下同一個分頁（旁邊有小箭頭），下面會下拉「改名」和「刪除資料夾」。', '刪除要按兩次才會刪；裡面的文件不會被刪，會留在「全部」。'] },\n"
    "      { t: '多選文件', s: '長按一份文件，一次選好幾份，移到資料夾', img: '',\n        d: ['用手指長按一份文件約半秒，就進入選取：每份文件右邊會出現圓圈。', '再點其他文件，把要搬的都選起來；「全選」會選取目前這個分頁的全部文件。', '按下方的「移到資料夾」，選資料夾，也可以直接建新的。搬好之後下方有「復原」。', '按左邊的「×」離開選取。'],\n        tip: '用電腦時，用滑鼠按住文件不放也可以。' }]],")
rep("    ['生字卡', [\n", """    ['生字卡', [
      { t: '匯出生字卡', s: '標題右邊的「匯出」，存成 Word、PDF 或 Anki', img: '',
        d: ['按「生字卡」標題右邊的「匯出」。', '選範圍：目前畫面上顯示的（照你選的資料夾、收藏、只看目前文件），或全部。', '選格式：Word（.docx 表格）、PDF（可列印），或 Anki（.txt，欄位用 Tab 分隔，每張卡一行）。', '跳出的視窗選「儲存到檔案」或其他 App。Anki 也可以按「複製成 Anki 文字」。'] },
      { t: '上次複習和篩選', s: '每張卡都寫著上次複習的日子；可以只看目前文件', img: '',
        d: ['清單和方塊裡，每個生字下面都有「上次複習 11/10」；還沒複習過的寫「還沒複習」。', '「只看目前文件」是篩選：打開之後，只列出你現在打開的那份文件的生字卡，再按一次關掉。'] },
""")

# ======================================================================
# CSS
# ======================================================================
CSS = open(os.path.join(D, 'v34.css'), encoding='utf-8').read()
rep('</style>', CSS + '</style>')

# ======================================================================
# 英文對照
# ======================================================================
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v34 ok')
