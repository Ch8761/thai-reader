import os, re
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'

# ---------- 1.22 主頁：關卡卡片、細長列（繼續讀／今天複習／讀物庫）、小的「匯入」＋網址列 ----------
a = s.index('    <div class="homeadd">')
b = s.index('id="readerOpen"', a); b = s.index('\n', b) + 1
HOME = '''    <div id="questHost"></div>
    <div class="hlist" id="homeList">
      <div id="todayRows" class="hrows" hidden></div>
      <button type="button" id="readerOpen" class="hrow hrlib"><svg class="hri" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg><span class="hrk">讀物庫</span><span class="hrv">分級泰文短文</span><svg class="hrchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    </div>
    <div class="importbar">
      <label class="filebtn impbtn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"/></svg><span>匯入</span><input type="file" id="anyfile" class="vh" accept="application/pdf,.pdf,image/*,video/*,.mp4,.mov,.m4v,.webm,.txt,.srt,.vtt,text/plain" multiple></label>
      <div class="urlbar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><input type="url" id="urlInput" inputmode="url" enterkeyhint="go" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="貼上網址，直接讀文章" aria-label="新聞、文章的網址"><button type="button" class="primary urlgo" id="addUrl" hidden>讀取</button><button type="button" id="openPaste" class="urltext" aria-expanded="false" aria-controls="pastebox">貼文字<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></div>
      <input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf" multiple hidden tabindex="-1" aria-hidden="true"><input type="file" id="imgfile" class="vh" accept="image/*,video/*" multiple hidden tabindex="-1" aria-hidden="true">
    </div>
    <div class="urlfail" id="urlFail" hidden><button type="button" id="urlReport">回報這個網址</button><span>讓我們知道哪些網站讀不到</span></div>
    <div id="pastebox" class="pastebox" hidden>
      <label class="label" for="textTitle">標題（可不填，會用開頭幾個字）</label>
      <input type="text" id="textTitle" maxlength="60" placeholder="例如：Podcast 第 12 集逐字稿">
      <label class="label" for="input">泰文內容：長按文字框選「貼上」</label>
      <textarea id="input" lang="th" spellcheck="false"></textarea>
      <div class="btns"><button type="button" class="primary" id="addText">建立文件</button></div>
    </div>
'''
s = s[:a] + HOME + s[b:]
rep("if (open) { setTimeout(function () { $('urlInput').focus(); }, 20); }", "if (open) { setTimeout(function () { $('input').focus(); }, 20); }")
HOMEJS = r'''  /* 1.22 網址列：有字才出現「讀取」；貼上網址就直接讀（貼的是一般文字就放進「貼文字」） */
  (function () {
    var ui = $('urlInput'), go = $('addUrl');
    function sync() { go.hidden = !ui.value.trim(); }
    ui.addEventListener('input', sync);
    ui.addEventListener('paste', function () {
      setTimeout(function () {
        var v = ui.value.trim();
        if (/^https?:\/\/\S+$/i.test(v) || /^www\.\S+$/i.test(v)) { sync(); go.click(); }
        else if (v && /[฀-๿]/.test(v)) { ui.value = ''; sync(); $('input').value = v; if ($('pastebox').hidden) { $('openPaste').click(); } }
        else { sync(); }
      }, 0);
    });
    sync();
  })();
'''
s = s.replace(ANCHOR, HOMEJS + ANCHOR, 1)

# ---------- 1.22 學習紀錄：複習次數、複習完回主頁前就檢查過關 ----------
rep("if (typeof markDay === 'function') { markDay(); }", "if (typeof markDay === 'function') { markDay(); statBump('rev'); }")
rep("    if (sk >= 2) { box.appendChild(el('div', 'rs-k', '已經連續學習 ' + sk + ' 天')); }\n    return box;",
    "    if (sk >= 2) { box.appendChild(el('div', 'rs-k', '已經連續學習 ' + sk + ' 天')); }\n    setTimeout(function () { renderToday(true); }, 700);\n    return box;")
rep("'thai-home-view', 'thai-tone-mode', 'thai-ui-lang'];", "'thai-home-view', 'thai-tone-mode', 'thai-ui-lang', 'thai-days', 'thai-read', 'thai-stats', 'thai-quest-seen', 'thai-cards-view', 'thai-cards-filter', 'thai-swipe-tip'];")

# ---------- 1.22 生字卡清單：換成新的 renderList ----------
a = s.index('  /* ---- 全部清單：精簡的列，點一下看詳解 ---- */\n')
b = s.index('  /* ---- 單字詳解（跳出的卡片） ---- */', a)
s = s[:a] + open(os.path.join(D, 'cardlist_ui.js'), encoding='utf-8').read() + s[b:]

CSS = '''
/* 1.22 主頁上方 */
#view-home .todaybox { display: none !important; }
.lqcard { display: flex; align-items: center; gap: 14px; width: 100%; margin: 0 0 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 16px; background: var(--card); color: var(--fg); text-align: left; min-height: 72px; }
.lqbadge { flex: none; width: 48px; height: 48px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; background: var(--accent-fill, var(--accent)); color: var(--accent-ink, #fff); }
.lqbadge .lqbn { font-size: 19px; font-weight: 800; }
.lqbadge .lqbl { font-size: 10px; font-weight: 700; margin-top: 2px; opacity: .9; }
.lqbadge.lqall { background: #c9962b; color: #fff; }
.lqtx { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.lqk { font-size: 12.5px; font-weight: 600; color: var(--muted); }
.lqv { font-size: 16px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lqprow { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
.lqbar { flex: 1; display: block; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--accent) 16%, transparent); overflow: hidden; }
.lqbar > span { display: block; height: 100%; border-radius: 3px; background: var(--accent); transition: width .4s ease; }
.lqnum { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.lqflame { flex: none; display: flex; flex-direction: column; align-items: center; gap: 0; color: var(--muted); min-width: 34px; }
.lqflame svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; }
.lqflame.on { color: #d9733b; }
.lqflame.on svg { fill: color-mix(in srgb, #d9733b 22%, transparent); }
.lqfn { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.hlist { border: 1px solid var(--line); border-radius: 14px; background: var(--card); overflow: hidden; margin: 0 0 12px; }
.hrows[hidden] { display: none; }
.hrow { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 0 14px; border: 0; border-radius: 0; background: transparent; color: var(--fg); text-align: left; }
.hrow + .hrow, .hrows + .hrow, .hrows .hrow + .hrow { border-top: 1px solid var(--line); }
.hrow:hover { background: var(--bg); }
.hri { width: 20px; height: 20px; flex: none; fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.hrread .hri { fill: var(--accent); stroke: none; width: 16px; height: 16px; margin: 0 2px; }
.hrk { font-weight: 600; font-size: 15px; flex: none; }
.hrv { flex: 1; min-width: 0; text-align: right; color: var(--muted); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hrrev .hrv { color: var(--accent); font-weight: 600; }
.hrchev { width: 16px; height: 16px; flex: none; fill: none; stroke: var(--muted); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.importbar { display: flex; gap: 8px; align-items: stretch; }
.importbar > .impbtn { flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 46px; padding: 0 14px; border-radius: 12px; font-size: 15px; font-weight: 700; white-space: nowrap; }
.impbtn svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.urlbar { flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px; min-height: 46px; padding: 0 4px 0 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }
.urlbar:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent); }
.urlbar > svg { width: 18px; height: 18px; flex: none; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; }
.urlbar input { flex: 1; min-width: 0; height: 44px; border: 0 !important; background: transparent !important; color: var(--fg); font-size: 16px; padding: 0 4px; outline: none; box-shadow: none !important; }
.urlbar .urlgo { flex: none; min-height: 36px; padding: 0 12px; border-radius: 9px; font-size: 14px; }
.urlbar .urlgo[hidden] { display: none; }
.urlbar .urltext { flex: none; display: inline-flex; align-items: center; gap: 2px; min-height: 38px; padding: 0 8px; border: 0; border-left: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--muted); font-size: 13.5px; white-space: nowrap; }
.urltext svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transition: transform .2s; }
.urltext[aria-expanded="true"] { color: var(--accent); }
.urltext[aria-expanded="true"] svg { transform: rotate(180deg); }
#view-home .pastebox { margin-top: 8px; }
#view-home .urlfail { margin-top: 6px; }
@media (max-width: 380px) { .importbar > .impbtn { padding: 0 10px; } .importbar > .impbtn span { font-size: 14px; } .urlbar { padding-left: 8px; } .urlbar > svg { display: none; } }
/* 過關 */
.lqclayer { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(20, 24, 22, .38); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); }
.lqclayer[hidden] { display: none; }
.lqcbox { width: min(340px, 100%); padding: 24px 20px 18px; border-radius: 20px; background: var(--card); color: var(--fg); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; box-shadow: 0 10px 40px rgba(0, 0, 0, .25); animation: qcpop .32s cubic-bezier(.2, 1.4, .4, 1); }
@keyframes qcpop { from { transform: scale(.85); opacity: 0; } to { transform: none; opacity: 1; } }
.lqcic { width: 60px; height: 60px; fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.lqcic path { stroke-dasharray: 40; animation: rsdraw .6s .15s ease-out both; }
.lqct { font-size: 22px; font-weight: 800; }
.lqcs { font-size: 15px; }
.lqcn { font-size: 13.5px; color: var(--muted); margin-bottom: 8px; }
.lqcbox .primary { min-width: 140px; }
@media (prefers-reduced-motion: reduce) { .lqcbox, .lqcic path { animation: none; } }
/* 學習紀錄 */
.lqsh { margin: 4px 40px 14px 0; font-size: 20px; }
.lqstats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 18px; }
@media (min-width: 560px) { .lqstats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.lqstat { padding: 12px; border-radius: 12px; background: var(--bg); }
.lqsn b { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
.lqsn span { font-size: 13px; margin-left: 3px; color: var(--muted); }
.lqsl { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
.lqchap { margin: 0 0 14px; padding: 0; border: 0; background: none; border-radius: 0; box-shadow: none; }
.lqchh { display: flex; align-items: baseline; gap: 8px; margin: 0 0 6px; }
.lqchn { font-weight: 700; font-size: 15px; }
.lqcht { font-family: var(--thai); color: var(--muted); font-size: 14px; }
.lqchc { margin-left: auto; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.lqpath { list-style: none; margin: 0; padding: 0; }
.lqpath li { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 6px 0 10px; }
.lqpath li:not(:last-child)::before { content: ''; position: absolute; left: 14px; top: 34px; bottom: -4px; width: 2px; background: var(--line); }
.lqpath li.lqdone:not(:last-child)::before { background: var(--accent); }
.lqdot { flex: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; border: 2px solid var(--line); color: var(--muted); background: var(--card); position: relative; z-index: 1; }
.lqdone .lqdot { background: var(--accent); border-color: var(--accent); color: var(--accent-ink, #fff); }
.lqdone .lqdot svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.lqcur .lqdot { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }
.lqptx { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; padding-top: 5px; }
.lqpt { font-size: 15px; }
.lqdone .lqpt { color: var(--muted); }
.lqcur .lqpt { font-weight: 700; }
.lqlock .lqpt { color: var(--muted); opacity: .75; }
.lqsfoot { font-size: 12.5px; color: var(--muted); margin: 6px 0 4px; }
/* 1.22 生字卡清單 */
.clbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 4px 0 8px; }
.clfilt { display: inline-flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); }
.clfilt button { display: inline-flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 12px; border: 0; border-radius: 7px; background: transparent; color: var(--muted); font-size: 14px; }
.clfilt button[aria-checked="true"] { background: var(--bg); color: var(--fg); font-weight: 600; box-shadow: 0 1px 2px rgba(0, 0, 0, .12); }
.clfilt svg, .cstar svg, .swfav svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
.clfav[aria-checked="true"] svg { fill: #e0a526; stroke: #e0a526; }
.clbar2 { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
.clbar2 button { min-height: 38px; font-size: 14px; }
.swtip { font-size: 13px; color: var(--muted); margin: 8px 2px 0; }
.swli { position: relative; overflow: hidden; touch-action: pan-y; }
.swbg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; font-size: 14px; font-weight: 700; color: #fff; }
.swbg > span { display: inline-flex; align-items: center; gap: 6px; opacity: 0; transition: opacity .12s; }
.swbg svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.swli.sw-r .swbg { background: #d99a1e; }
.swli.sw-l .swbg { background: #d0453b; }
.swli.sw-r .swfav, .swli.sw-l .swdel { opacity: .75; }
.swli.sw-go .swfav, .swli.sw-go .swdel { opacity: 1; }
.swli.sw-go.sw-r .swfav svg { fill: #fff; }
.swfg { position: relative; display: flex; align-items: stretch; background: var(--card); will-change: transform; }
.swfg > .crow, .swfg > .ctile { flex: 1; min-width: 0; }
.cstar { flex: none; width: 44px; min-width: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--muted); display: flex; align-items: center; justify-content: center; opacity: .55; }
.cstar[aria-pressed="true"] { color: #e0a526; opacity: 1; }
.cstar[aria-pressed="true"] svg { fill: #e0a526; stroke: #e0a526; }
.clist2 .swfg > .crow { padding-right: 4px; }
.cgrid { list-style: none; margin: 10px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.cgrid > li { border: 1px solid var(--line); border-radius: 14px; background: var(--card); }
.cgrid .swfg { border-radius: 14px; height: 100%; }
.cgrid .ctile { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; min-height: 112px; padding: 12px 4px 10px 12px; border: 0; border-radius: 14px; background: transparent; text-align: left; color: var(--fg); }
.cgrid .crow-l { display: flex; flex-direction: column; flex-wrap: nowrap; align-items: flex-start; gap: 2px; min-width: 0; }
.cgrid .crow-l .cm { flex-basis: auto; white-space: normal; }
.cgrid .cw { font-family: var(--thai); font-size: 23px; line-height: 1.25; word-break: break-word; }
.cgrid .crom { font-size: 12.5px; color: var(--muted); }
.cgrid .cm { font-size: 13.5px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cgrid .crow-r { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.cgrid .cdue { display: inline; min-width: 0; font-size: 11.5px; }
.cgrid .cstar { position: absolute; top: 2px; right: 2px; }
.cgrid .ctile .crow-l { padding-right: 34px; }
.snack { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--tabh, 64px) + 16px + env(safe-area-inset-bottom)); z-index: 70; display: flex; align-items: center; gap: 14px; max-width: calc(100% - 32px); padding: 8px 8px 8px 16px; border-radius: 12px; background: #2b2f2d; color: #fff; font-size: 14px; box-shadow: 0 6px 24px rgba(0, 0, 0, .25); }
.snack[hidden] { display: none; }
.snack span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.snack button { flex: none; min-height: 36px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; color: #9fd8b7; font-weight: 700; }
'''
rep('</style>', CSS + '</style>')

# 說明文字
rep("        d: ['按「加入檔案」，PDF、照片、截圖、影片、文字檔（.txt、字幕檔 .srt）都從這裡選，App 會自己分辨。可以一次選好幾個。', '選好的幾張照片會合成一份文件；影片會讀出泰文字幕。', '逐字稿、文章：先在別的 App 拷貝，按「貼上網址／文字」，長按文字框選「貼上」，再按「建立文件」。', '用電腦時，也可以直接把檔案拖進主頁。'],",
    "        d: ['按「匯入」，PDF、照片、截圖、影片、文字檔（.txt、字幕檔 .srt）都從這裡選，App 會自己分辨。可以一次選好幾個。', '選好的幾張照片會合成一份文件；影片會讀出泰文字幕。', '新聞網址：直接貼進「匯入」旁邊的網址列，就會開始讀。', '逐字稿、文章：先在別的 App 拷貝，按網址列右邊的「貼文字」，長按文字框選「貼上」，再按「建立文件」。', '用電腦時，也可以直接把檔案拖進主頁。'],")
s = s.replace('按「加入檔案」', '按「匯入」').replace('用「加入檔案」', '用「匯入」')
rep("{ t: '加文件', s: '按「匯入」選檔案，或按「貼上網址／文字」'", "{ t: '加文件', s: '按「匯入」選檔案，網址直接貼進網址列'")
rep("s: '按「貼上網址／文字」，貼上新聞網址，按「讀取文章」'", "s: '把新聞網址貼進主頁的網址列，就會自動讀取'")
rep("'回到 App 主頁按「貼上網址／文字」，把網址貼進最上面的格子，按「讀取文章」。'", "'回到 App 主頁，把網址貼進「匯入」旁邊的網址列，會自動開始讀（也可以按「讀取」）。'")
rep("還沒有文件。按上面的「加入檔案」選 PDF、照片或影片，或按「貼上網址／文字」開始。", "還沒有文件。按上面的「匯入」選 PDF、照片或影片，或把新聞網址貼進網址列。", 2)
# 使用說明：學習關卡、生字卡滑動與排列
rep("    ['主頁', [\n", """    ['主頁', [
      { t: '學習關卡', s: '主頁最上面的卡片：這一關的目標和進度', img: '',
        d: ['一共 5 章、30 關，照順序一關一關過：讀文章、存生字、複習、連續學習、記熟生字。', '卡片上是現在這一關的目標和進度條，右邊的火焰是連續學習幾天。', '點卡片打開「學習紀錄」：讀過幾篇、生字幾個（記熟幾個）、連續幾天、複習幾次，還有每一章的關卡。', '過關時回到主頁會跳出慶祝；連續天數斷掉也不會把已經過的關收回。'],
        tip: '那天有打開文件或複習，就算「有學」。' },
""")
rep("    ['生字卡', [\n", """    ['生字卡', [
      { t: '收藏和刪除', s: '在「全部」清單往右滑收藏、往左滑刪除', img: '',
        d: ['手指在一個生字上往右滑放開：收藏（右邊的星星變黃）；再滑一次取消。', '往左滑放開：刪除。下方會出現「復原」，5 秒內按就能救回來。', '也可以直接點右邊的星星收藏。', '上面選「收藏」只看收藏的生字。', '右上角兩個小圖示切換「清單」和「方塊」排法，跟主頁一樣。'] },
""")

open(src, 'w', encoding='utf-8').write(s)
print('v32 ok')
