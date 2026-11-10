import os, re
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:100]); s = s.replace(old, new)
def cut(start, end_incl):
    """remove and return text from start marker through end marker"""
    global s
    a = s.index(start); b = s.index(end_incl, a) + len(end_incl)
    blk = s[a:b]; s = s[:a] + s[b:]; return blk

# ---------- 主題色 ----------
rep('''  --bg: #eef2f5;
  --fg: #14202b;
  --muted: #55677a;
  --card: #ffffff;
  --paper: #ffffff;
  --line: #d3dce4;
  --accent: #0d6b86;
  --accent-fg: #ffffff;''', '''  --bg: #f5eedf;
  --fg: #26332e;
  --muted: #5f6f68;
  --card: #fffaf0;
  --paper: #fffdf7;
  --line: #cfdcd5;
  --accent: #557568;
  --accent-fg: #ffffff;
  --accent-fill: #739488;
  --accent-fill-fg: #1c2622;
  --khaki: #b7cabf;''')
OLD_DARK = '''--bg: #0f171e; --fg: #e5ecf1; --muted: #94a5b3; --card: #172229; --paper: #141d24; --line: #2a3a47;
    --accent: #5cc0dc; --accent-fg: #06222c;'''
NEW_DARK = '''--bg: #1e2125; --fg: #e8ebef; --muted: #a3abb5; --card: #2a2e33; --paper: #24282c; --line: #3d434a;
    --accent: #bed2e0; --accent-fg: #17191c; --accent-fill: #bed2e0; --accent-fill-fg: #17191c; --khaki: #3e464f;'''
OLD_DARK2 = OLD_DARK.replace('\n    ', '\n  ')
NEW_DARK2 = NEW_DARK.replace('\n    ', '\n  ')
assert s.count(OLD_DARK) == 1 and s.count(OLD_DARK2) == 1, (s.count(OLD_DARK), s.count(OLD_DARK2))
s = s.replace(OLD_DARK, NEW_DARK).replace(OLD_DARK2, NEW_DARK2)
rep('<title>泰文筆記測試</title>', '<title>泰文閱讀</title>')
_css_end = s.index('</style>')
_css = s[:_css_end].replace('background: var(--accent); color: var(--accent-fg); border-color: var(--accent)', 'background: var(--accent-fill); color: var(--accent-fill-fg); border-color: var(--accent-fill)')
_css = _css.replace('background: var(--accent); color: var(--accent-fg)', 'background: var(--accent-fill); color: var(--accent-fill-fg)')
_css = _css.replace('color: var(--accent-fg); background: var(--accent);', 'color: var(--accent-fill-fg); background: var(--accent-fill);')
s = _css + s[_css_end:]

CSS = r'''
body { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
.view { display: flex; flex-direction: column; gap: 16px; }
section.view, div.view { border: 0; background: transparent; padding: 0; border-radius: 0; box-shadow: none; }
#wrap.haspdf { --ink: #1f4fd1; --anno: #b42318; --anno-line: #e5a39b; --c-red: #c62828; --c-black: #1a1a1a; --c-blue: #1f5fbf; --c-green: #2e7d32; --c-purple: #7b3fb0; --c-orange: #c25a06; --note: #fff6c2; --note-line: #e2cf6a; --note-fg: #2a2100; }
.vhead { display: flex; align-items: center; gap: 10px; min-height: 48px; }
.vhead h1 { font-size: 24px; margin: 0; line-height: 1.3; overflow-wrap: anywhere; }
.vhead .back { min-height: 40px; padding: 0 12px; color: var(--accent); border-color: var(--line); }
.vhead h1 { flex: 1 1 auto; min-width: 0; }
.vhead #openExport { flex: 0 0 auto; min-height: 40px; }
.workbox { display: flex; flex-direction: column; gap: 8px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 0 0 10px; }
.workbox > .toolbar { border: 0; border-bottom: 1px solid var(--line); border-radius: 14px 14px 0 0; }
.workbox > #hint { padding: 0 12px; }
.workbox > #wrap { margin: 0 10px; }
@media (max-width: 480px) { .workbox > #wrap { margin: 0 4px; } }
.tabbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 12; background: var(--card); border-top: 1px solid var(--line); padding: 4px max(8px, env(safe-area-inset-right, 0px)) calc(4px + env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px)); }
.tabbar .tabs { display: flex; max-width: 760px; margin: 0 auto; }
.tabbar button { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 56px; border: 0; background: transparent; color: var(--muted); font-size: 12px; padding: 0 4px; position: relative; border-radius: 10px; }
.tabbar button[aria-current="page"] { color: var(--accent); font-weight: 700; }
.tabbar button[aria-current="page"] svg { stroke-width: 2.2; }
.tabbar svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.tabbadge { position: absolute; top: 4px; left: calc(50% + 6px); background: #c62828; color: #ffffff; border-radius: 999px; font-size: 11px; font-weight: 700; min-width: 18px; padding: 0 5px; line-height: 18px; }
.homeadd { display: flex; flex-wrap: wrap; gap: 8px; }
.pastebox { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }
.pastebox input { min-height: 44px; padding: 0 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--fg); font-size: 16px; }
.doclist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.doccard { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); }
.doccard.current { border-color: var(--accent); box-shadow: inset 4px 0 0 var(--accent); }
.dicon { width: 44px; height: 54px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: var(--accent-fg); background: var(--accent); grid-row: span 2; }
.dicon.text { background: var(--khaki); color: var(--fg); font-size: 18px; }
.dopen { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; border: 0; background: transparent; padding: 4px 0; min-height: 44px; }
.dname { font-weight: 700; font-size: 16px; overflow-wrap: anywhere; color: var(--fg); }
.dmeta { font-size: 12px; color: var(--muted); }
.dside { display: flex; flex-wrap: wrap; gap: 6px; grid-column: 2; }
.dside .cmove { min-height: 40px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--fg); font-size: 14px; padding: 0 8px; }
.dside .cdel { min-height: 40px; font-size: 14px; }
.docempty { text-align: center; padding: 48px 16px; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px dashed var(--line); border-radius: 14px; }
button.speaking, .pop button.say.speaking { background: var(--accent-fill); color: var(--accent-fill-fg); border-color: var(--accent-fill); font-weight: 700; }\n.testtools > summary { cursor: pointer; font-weight: 700; min-height: 44px; display: flex; align-items: center; }
#view-cards .cardbody, #view-cards .cfolders { background: transparent; }
@media (max-width: 480px) { .tabbar button { font-size: 11px; } .vhead h1 { font-size: 20px; } }
'''
rep('</style>', CSS + '</style>')

# ---------- 拆出既有區塊 ----------
cut('  <header>\n    <h1>泰文筆記測試</h1>', '  </header>\n')
docsec = cut('  <section id="docsec"', '  </section>\n')
docsec = docsec.replace('''      <label class="filebtn">開啟 PDF 檔<input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf"></label>
      <button type="button" id="toText" hidden>改回範例文字</button>
''', '')
docsec = docsec.replace('<h2 id="h-doc">文件</h2>', '<h2 id="h-doc" class="vh">文件資訊</h2>')
docsec = re.sub(r'\s*<div class="btns">\s*<button type="button" id="openExport" aria-expanded="false" aria-controls="exportp">匯出 PDF（筆記＋生字）</button>\s*</div>', '', docsec)
assert 'openExport' not in docsec, docsec
exportp = cut('  <section id="exportp"', '  </section>\n')
toolbar_start = s.index('  <div class="toolbar" role="toolbar" aria-label="筆記工具">')
wrap_end = s.index('  <div id="pop" class="pop" role="dialog" aria-label="查詞" hidden></div>\n') + len('  <div id="pop" class="pop" role="dialog" aria-label="查詞" hidden></div>\n')
docmain = s[toolbar_start:wrap_end]; s = s[:toolbar_start] + '<!--DOCMAIN-->' + s[wrap_end:]
_ti = docmain.index('  <div class="ttsbar"'); _ii = docmain.index('  <div id="info"')
docmain = docmain[_ti:_ii] + '  <div class="workbox">\n' + docmain[:_ti] + '  </div>\n' + docmain[_ii:]
settings = re.search(r'  <section id="settings".*?\n  </section>\n', docmain, re.S).group(0)
cards = re.search(r'  <section id="cards".*?\n  </section>\n', docmain, re.S).group(0)
docmain = docmain.replace(settings, '').replace(cards, '')
docmain = docmain.replace('''    <button type="button" id="openCards" aria-expanded="false" aria-controls="cards">生字卡</button>
    <button type="button" id="openSettings" aria-expanded="false" aria-controls="settings">設定</button>
''', '')
settings = settings.replace('<section id="settings" class="settings" aria-labelledby="h-settings" hidden>\n    <h2 id="h-settings">設定</h2>',
    '''<div id="settings" class="settings">
    <div class="setrow">
      <div class="setlabel">外觀<span class="sethelp">淺色是奶油白、卡其、深咖啡；深色是黑、灰、藍。「跟隨系統」會照 iPad 的設定自動切換。</span></div>
      <div class="seg" role="radiogroup" aria-label="外觀" id="themeGroup"></div>
    </div>''')
settings = settings.replace('''    <div class="btns"><button type="button" id="closeSettings" class="primary">完成</button></div>
  </section>''', '  </div>')
cards = cards.replace('<section id="cards" class="settings" aria-labelledby="h-cards" hidden>\n    <h2 id="h-cards">生字卡</h2>', '<div id="cards" class="settings">')
cards = cards.replace('''    <div class="btns"><button type="button" id="closeCards" class="primary">完成</button></div>
  </section>''', '  </div>')
checks = cut('  <section aria-labelledby="h-checks">', '  </section>\n')
report = cut('  <section aria-labelledby="h-report">', '  </section>\n')
paste = cut('  <section>\n    <details>\n      <summary>換成你自己的泰文</summary>', '  </section>\n')

ICON = {
 'home': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/></svg>',
 'doc': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/></svg>',
 'cards': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
 'settings': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'}
VIEWS = '''  <section id="view-home" class="view" aria-labelledby="h-home">
    <header class="vhead"><h1 id="h-home">我的文件</h1></header>
    <div class="homeadd">
      <label class="filebtn">＋ 加入 PDF<input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf" multiple></label>
      <button type="button" id="openPaste" aria-expanded="false" aria-controls="pastebox">＋ 貼上文字</button>
    </div>
    <div id="pastebox" class="pastebox" hidden>
      <label class="label" for="textTitle">標題（可不填，會用開頭幾個字）</label>
      <input type="text" id="textTitle" maxlength="60" placeholder="例如：Podcast 第 12 集逐字稿">
      <label class="label" for="input">泰文內容：長按文字框選「貼上」</label>
      <textarea id="input" lang="th" spellcheck="false"></textarea>
      <div class="btns"><button type="button" class="primary" id="addText">建立文件</button></div>
    </div>
    <div id="homeMsg" class="label" aria-live="polite"></div>
    <div id="homeFolders" class="cfolders"></div>
    <div id="homeTarget" class="label"></div>
    <ul id="docList" class="doclist"></ul>
    <p id="homeEmpty" class="label" hidden></p>
  </section>
  <section id="view-doc" class="view" aria-labelledby="h-docv" hidden>
    <header class="vhead"><button type="button" class="back" id="backHome">‹ 主頁</button><h1 id="h-docv">文件</h1><button type="button" id="openExport" aria-expanded="false" aria-controls="exportp">匯出 PDF</button></header>
    <div id="docempty" class="docempty" hidden><p>還沒有打開文件。</p><button type="button" class="primary" id="goHome">到主頁選一份文件</button></div>
    <div id="docbody" class="view">
''' + docsec + exportp + docmain + '''    </div>
  </section>
  <section id="view-cards" class="view" aria-labelledby="h-cardsv" hidden>
    <header class="vhead"><h1 id="h-cardsv">生字卡</h1></header>
''' + cards + '''  </section>
  <section id="view-settings" class="view" aria-labelledby="h-settingsv" hidden>
    <header class="vhead"><h1 id="h-settingsv">設定</h1></header>
''' + settings + '''    <details class="testtools">
      <summary>測試工具（逐項檢查、回報給 Claude）</summary>
''' + checks + report + '''    </details>
  </section>
'''
rep('<!--DOCMAIN-->', VIEWS)
NAV = '<nav class="tabbar" aria-label="主要分頁"><div class="tabs">' + ''.join(
    '<button type="button" data-tab="%s">%s<span>%s</span>%s</button>' % (k, ICON[k], label, '<span class="tabbadge" id="cardBadge" hidden></span>' if k == 'cards' else '')
    for k, label in (('home', '主頁'), ('doc', '文件'), ('cards', '生字卡'), ('settings', '設定'))) + '</div></nav>\n'
rep('</main>\n', '</main>\n' + NAV)
rep('<p class="wnote">選好就能開始。之後隨時可以按工具列的「設定」修改。</p>', '<p class="wnote">選好就能開始。之後隨時可以按下方的「設定」修改。</p>')

# ---------- 程式：移除舊的面板開關、接上分頁 ----------
a = s.index("  $('openSettings').addEventListener('click', function () {"); b = s.index("  renderSettings();\n  function hidePop()", a)
s = s[:a] + s[b:]
rep("    $('toText').hidden = !pdf;\n", "")
a = s.index("  $('pdffile').addEventListener('change', function () {\n    var f = this.files && this.files[0];"); b = s.index("  /* ---------- 第一次使用：歡迎視窗", a)
s = s[:a] + s[b:]
rep("  $('reWelcome').addEventListener('click', function () { $('settings').hidden = true; $('openSettings').setAttribute('aria-expanded', 'false'); openWelcome(); });",
    "  $('reWelcome').addEventListener('click', function () { openWelcome(); });")
rep("""    $('openCards').textContent = '生字卡' + (cards.length ? '（' + cards.length + (n ? '，' + n + ' 張要複習' : '') + '）' : '');""",
    """    var bd = $('cardBadge'); if (bd) { bd.textContent = n > 99 ? '99+' : String(n); bd.hidden = !n; bd.setAttribute('aria-label', n + ' 張要複習'); }""")
a = s.index("  $('openCards').addEventListener('click', function () {"); b = s.index("  updateCardButton();", a)
s = s[:a] + s[b:]
rep("      return idbPutOnly(file.name + '|' + bytes.length, bytes)", "      return idbPut(file.name + '|' + bytes.length, bytes)")
a = s.index("  armed($('load'), '換成這段文字'"); b = s.index("  function renderChecks() {", a)
s = s[:a] + s[b:]
# openPdfBytes 結束時登記到文件庫
rep("""      renderDocInfo();
      save();
      if (!restore) { $('wrap').scrollIntoView({ block: 'start' }); }""", """      renderDocInfo();
      save();
      if (typeof libRegisterPdf === 'function') { libRegisterPdf(id, name, bytes.length, pages.length); }
      if (typeof syncDocView === 'function') { syncDocView(); }""")
rep('''    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = inkColor(); g.fillStyle = inkColor();
    return g;''', '''    g.lineCap = 'round'; g.lineJoin = 'round';
    var pc = getComputedStyle($('wrap')).getPropertyValue('--ink').trim() || '#1f4fd1';
    g.strokeStyle = pc; g.fillStyle = pc;
    return g;''')
rep("""  function speak(text) {
    if (!hasTTS) { $('ttsnote').textContent = '這個瀏覽器不支援朗讀。'; return; }
    window.speechSynthesis.cancel();""", """  /* 朗讀中：把按下的那顆朗讀按鈕填成藍色，唸完或按停止就恢復 */
  var lastTapBtn = null, lastTapAt = 0, speakBtn = null, speakTimer = null;
  document.addEventListener('click', function (e) { var b = e.target && e.target.closest ? e.target.closest('button') : null; if (b) { lastTapBtn = b; lastTapAt = Date.now(); } }, true);
  function markSpeaking(b) {
    if (speakBtn && speakBtn !== b) { speakBtn.classList.remove('speaking'); speakBtn.removeAttribute('aria-pressed'); }
    speakBtn = b;
    if (speakTimer) { clearInterval(speakTimer); speakTimer = null; }
    if (!b) { return; }
    b.classList.add('speaking'); b.setAttribute('aria-pressed', 'true');
    var started = Date.now();
    speakTimer = setInterval(function () {
      var on = hasTTS && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
      if (!on && Date.now() - started > 800) { stopSpeakingMark(); }
    }, 300);
  }
  function stopSpeakingMark() {
    if (speakTimer) { clearInterval(speakTimer); speakTimer = null; }
    if (speakBtn) { speakBtn.classList.remove('speaking'); speakBtn.removeAttribute('aria-pressed'); speakBtn = null; }
  }
  function speak(text) {
    if (!hasTTS) { $('ttsnote').textContent = '這個瀏覽器不支援朗讀。'; return; }
    window.speechSynthesis.cancel();
    markSpeaking(lastTapBtn && Date.now() - lastTapAt < 1500 && lastTapBtn.id !== 'stopRead' ? lastTapBtn : null);""")
rep("""      if (i === list.length - 1) { u.onend = function () { $('ttsnote').textContent = ''; }; }""", """      if (i === list.length - 1) { u.onend = function () { $('ttsnote').textContent = ''; stopSpeakingMark(); }; }""")
rep("""  $('stopRead').addEventListener('click', function () { if (hasTTS) { window.speechSynthesis.cancel(); } $('ttsnote').textContent = ''; });""", """  $('stopRead').addEventListener('click', function () { if (hasTTS) { window.speechSynthesis.cancel(); } $('ttsnote').textContent = ''; stopSpeakingMark(); });""")
# 文件庫程式放在儲存之前
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'library_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")
# 啟動：先整理文件庫，再決定打開哪個分頁
rep('''  /* ---------- 啟動 ---------- */
  load();
  var startPdf = !!(state.src && state.src.type === 'pdf');
  if (startPdf) { $('text').textContent = ''; } else {
    segs = segment(state.text);
    $('input').value = state.text;
    renderText();
    renderBoxes();
  }''', '''  /* ---------- 啟動 ---------- */
  load();
  libMigrate();
  var startPdf = !!(state.src && state.src.type === 'pdf');
  if (startPdf) { $('text').textContent = ''; } else {
    segs = segment(state.text);
    renderText();
    renderBoxes();
  }''')
rep("  if (!welcomeSeen) { openWelcome(); }", """  (function () { var t = 'home'; try { t = localStorage.getItem(TAB_KEY) || 'home'; } catch (err) {} curTab = ''; showTab(['home', 'doc', 'cards', 'settings'].indexOf(t) >= 0 ? t : 'home'); syncDocView(); renderHome(); })();
  if (!welcomeSeen) { openWelcome(); }""")
# 回報：外觀、文件庫
rep('''    lines.push('句型庫：''', '''    if (typeof lib !== 'undefined') { lines.push('外觀：' + ({ system: '跟隨系統', light: '淺色', dark: '深色' })[theme] + '；分頁：' + curTab + '；文件庫：' + lib.docs.length + ' 份（PDF ' + lib.docs.filter(function (d) { return d.type === 'pdf'; }).length + '、文字 ' + lib.docs.filter(function (d) { return d.type === 'text'; }).length + '）、資料夾 ' + lib.folders.length + ' 個'); }
    lines.push('句型庫：''')
# 新的檢查清單
a = s.index('  var CHECKS = ['); b = s.index('  ];', a) + 4
s = s[:a] + '''  var CHECKS = [
    ['t1', '底部分頁：主頁、文件、生字卡、設定可以切換，目前分頁會變色'],
    ['t2', '主頁：新增文件資料夾，把文件移進去，選資料夾只顯示裡面的文件'],
    ['t3', '加入 PDF：出現在主頁，點名稱會在「文件」分頁打開'],
    ['t4', '貼上文字：建立新文件，出現在主頁'],
    ['t5', '切換文件：在兩份文件各畫一點筆記，來回切換後各自保留'],
    ['t6', '外觀：淺色（奶油白、卡其、深咖啡）與深色（黑、灰、藍）都正常、字看得清楚'],
    ['k5', '生字卡分頁：資料夾、複習、清單都正常'],
    ['e1', '匯出 PDF：在 iPad 存到「檔案」App，位置正確'],
    ['b1', '備份與還原：匯出備份檔後可以還原']
  ];
''' + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
