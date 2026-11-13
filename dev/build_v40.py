import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'

# ===== 1. 「地圖」分頁 → 「成就」分頁 =====
a = s.index('<button type="button" data-tab="map">'); b = s.index('</button>', a) + len('</button>')
s = s[:a] + ('<button type="button" data-tab="ach"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13v4M8.5 20h7M10 17h4"/></svg>'
             '<span>成就</span></button>') + s[b:]
rep("""  <section id="view-map" class="view" aria-labelledby="h-mapv" hidden>
    <header class="vhead"><h1 id="h-mapv">地圖</h1></header>
  <div id="mapBody" class="settings mapview"></div>
  </section>""", """  <section id="view-ach" class="view" aria-labelledby="h-achv" hidden>
    <header class="vhead"><h1 id="h-achv">成就</h1></header>
  <div id="achBody" class="settings achview"></div>
  </section>""")
rep("    ['home', 'doc', 'cards', 'map', 'settings'].forEach(function (k) {", "    ['home', 'doc', 'cards', 'ach', 'settings'].forEach(function (k) {")
rep("    if (t === 'map') { renderMapTab(); }", "    if (t === 'ach') { renderAchTab(); }")
rep("showTab(['home', 'doc', 'cards', 'map', 'settings'].indexOf(t) >= 0 ? t : 'home');", "if (t === 'map') { t = 'ach'; } showTab(['home', 'doc', 'cards', 'ach', 'settings'].indexOf(t) >= 0 ? t : 'home');")

# ===== 2. 程式（接在歡迎流程後面）=====
JS = open(os.path.join(D, 'v40_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# ===== 2b. 設定頁：小火苗（動態／靜態／關）=====
rep("""      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>
""", """      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">小火苗<span class="sethelp">學習時偶爾冒出的小鼓勵，只有一個小圖示。可以選動態、靜態（不會動）或關閉。手機開了「減少動態效果」時，會自動變成靜態。</span></div>
      <div class="seg" role="radiogroup" aria-label="小火苗" id="flameGroup"></div>
    </div>
""")
rep("['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'fontGroup']]", "['look', '外觀與字體', ['themeGroup', 'uiLangGroup', 'fontGroup', 'flameGroup']]")

# ===== 3. 備份與同步 =====
NEWK = "'thai-tasks', 'thai-flame', 'thai-hist', 'thai-rwd'"
rep("'thai-rr-show', 'thai-rev-cap', 'thai-lookups', 'thai-goal',", "'thai-rr-show', 'thai-rev-cap', 'thai-lookups', " + NEWK + ", 'thai-goal',")
m = re.search(r"  var SYNC_SET = \[(.*?)\];\n", s); assert m
s = s[:m.end(1)] + ", " + NEWK + s[m.end(1):]
rep("  var SYNC_QUIET = ['thai-progress'];", "  var SYNC_QUIET = ['thai-progress', " + NEWK + "];")

# ===== 4. 樣式 =====
CSS = """
/* 1.31 「成就」分頁、小火苗、貼紙 */
.achview { padding-bottom: 28px; }
.achsec { margin: 4px 0 16px; padding: 14px 14px 12px; background: var(--card); }
.achsec .maph { font-size: 19px; }
.achadd { display: flex; gap: 8px; margin: 10px 0 6px; }
.achin { flex: 1 1 auto; min-width: 0; min-height: 40px; padding: 0 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--fg); font-size: 16px; }
.achadd .primary { flex: none; min-height: 40px; padding: 0 14px; font-size: 15px; }
.achlist { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.achtask { display: flex; align-items: center; gap: 2px; min-height: 48px; padding: 0 8px 0 0; border-bottom: 1px solid var(--line); }
.achlist > .achtask:last-child { border-bottom: 0; }
.achtask.done { opacity: .75; }
.achtask.editing { display: block; padding: 10px 4px; }
.achchk { flex: none; width: 44px; height: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; }
.achc { width: 24px; height: 24px; box-sizing: border-box; border-radius: 50%; border: 2px solid var(--line); background: var(--card); color: var(--accent); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.achchk.plus .achc { width: 32px; border-radius: 12px; border-color: var(--accent); }
.achchk.on .achc { background: var(--accent-fill); border-color: var(--accent-fill); color: var(--accent-fill-fg); }
.achc svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.achtx { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 0; padding: 2px 0; }
.achname { text-align: left; min-height: 32px; padding: 2px 4px; border: 0; background: transparent; color: var(--fg); font-size: 16px; line-height: 1.4; }
.achtask.done .achname { text-decoration: line-through; color: var(--muted); }
.achedit { display: flex; flex-direction: column; gap: 10px; }
.achrow2 { display: flex; gap: 12px; }
.achnum { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); flex: 1; }
.achnum input { min-height: 44px; padding: 0 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--fg); font-size: 16px; width: 100%; box-sizing: border-box; }
.achedit .btns { justify-content: flex-start; flex-wrap: wrap; }
.achdel { color: #b3261e; }
.achempty { margin: 10px 0 4px; font-size: 14.5px; color: var(--muted); line-height: 1.6; }
.achsgt { margin: 14px 0 6px; font-size: 13.5px; color: var(--muted); }
.achchips { display: flex; flex-wrap: wrap; gap: 8px; }
.achchip { min-height: 36px; padding: 0 12px; border-radius: 999px; border: 1px dashed var(--accent); background: transparent; color: var(--fg); font-size: 14px; }
.achchip::before { content: '+ '; color: var(--accent); font-weight: 700; }
.achmore { margin: 10px 0 0; }
.achmore > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font-weight: 600; font-size: 15px; color: var(--accent); }
.achrec { margin: 12px 0 4px; }
.achrt { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.achrl { font-size: 15px; }
.achrv { font-size: 19px; font-variant-numeric: tabular-nums; }
.achrec .lqnum { min-width: 72px; text-align: right; }
.achhd { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.achstreak { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; color: var(--fg); white-space: nowrap; }
.achfl { width: 26px; height: 26px; flex: none; }
.achblocks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 10px 0 0; }
.achblk { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-height: 104px; padding: 10px 10px 8px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); color: var(--fg); text-align: left; }
.achblk[aria-expanded="true"] { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
.achblk .bi { width: 22px; height: 22px; fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.achblk .bn { margin-top: 4px; font-size: 26px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.achblk .bl { font-size: 13px; color: var(--fg); }
.achblk .bs { font-size: 12px; color: var(--muted); }
.achpanel { margin-top: 10px; padding: 8px 12px 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); }
.achkv { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 8px 0; font-size: 14.5px; border-bottom: 1px solid var(--line); }
.achkv b { font-variant-numeric: tabular-nums; }
.achwk { margin: 16px 0 0; }
.achwt { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
.achwl { font-size: 14.5px; }
.achwl b { font-size: 16px; font-variant-numeric: tabular-nums; }
.achsel { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); }
.achsl { min-height: 32px; padding: 0 6px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); font-size: 13.5px; }
.achcal { margin-top: 12px; }
.achcalhd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.achcalt { font-size: 16px; font-weight: 700; }
.achnav { width: 40px; height: 40px; min-height: 40px; padding: 0; border: 0; border-radius: 12px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); font-size: 22px; line-height: 1; }
.achnav:disabled { opacity: .3; }
.achwdays, .achdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); justify-items: center; }
.achwdays { margin: 6px 0 2px; font-size: 12px; color: var(--muted); }
.achdays { row-gap: 2px; }
.achday { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-variant-numeric: tabular-nums; }
.achday.out { color: var(--muted); opacity: .5; }
.achday.on { background: var(--accent-fill); color: var(--accent-fill-fg); font-weight: 700; opacity: 1; }
.achday.on.out { opacity: .4; }
.achday.today { box-shadow: 0 0 0 2px var(--accent); }
.achday.today.on { background: #c2622b; color: #fff; box-shadow: none; }
.achmin { padding: 2px 0 4px; }
.achchart { margin-top: 10px; }
.achsum { display: flex; align-items: baseline; gap: 8px; }
.achsum b { font-size: 30px; font-variant-numeric: tabular-nums; }
.achunit { font-size: 14px; color: var(--muted); }
.achdelta { display: flex; gap: 6px; align-items: baseline; font-size: 13.5px; color: var(--muted); margin-top: 2px; }
.achdelta b { color: var(--accent); }
.achplot { margin-top: 6px; }
.achsvg { display: block; width: 100%; height: auto; }
.achgrid { stroke: var(--line); stroke-width: 1; }
.achtick { fill: var(--muted); font-size: 10px; }
.achline { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
.achfill { fill: color-mix(in srgb, var(--accent) 14%, transparent); stroke: none; }
.achdot { fill: var(--accent); stroke: var(--card); stroke-width: 2; }
.achbar { fill: color-mix(in srgb, var(--accent) 55%, var(--card)); }
.achbar.now { fill: var(--accent); }
.achhint { margin: 4px 0 0; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
.flame { position: fixed; z-index: 80; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 12px); width: 48px; height: 48px; margin-left: -24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--card); border: 1px solid color-mix(in srgb, #ff8a1f 45%, var(--line)); box-shadow: 0 6px 20px rgba(0, 0, 0, .18); }
.flame.big { width: 68px; height: 68px; margin-left: -34px; box-shadow: 0 8px 28px rgba(255, 138, 31, .35); }
.flame[hidden] { display: none; }
.flame.on { animation: flin .35s cubic-bezier(.2, 1.4, .4, 1) both, flout .35s ease-in var(--fo, 1.9s) forwards; }
.flame.on.still { animation: none; }
@keyframes flin { from { transform: translateY(-28px) scale(.5); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes flout { to { transform: translateY(-10px) scale(.85); opacity: 0; } }
.flic { display: flex; }
.flic svg { width: 28px; height: 28px; transform-origin: 50% 90%; }
.flame.big .flic svg { width: 42px; height: 42px; }
.flame.on:not(.still) .flic svg { animation: flick .9s ease-in-out infinite; }
@keyframes flick { 0%, 100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.12, 1.22) rotate(4deg); } }
.flsp { display: none; position: absolute; left: 50%; top: 40%; width: 7px; height: 7px; margin-left: -3px; border-radius: 50%; background: #ffc83d; opacity: 0; }
.flame.big.on:not(.still) .flsp { display: block; animation: flsp 1.3s ease-out var(--d, 0s) infinite; }
@keyframes flsp { 0% { transform: translate(0, 10px) scale(.4); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--x, 0), -38px) scale(1); opacity: 0; } }
.flsr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .flame.on, .flic svg, .flsp { animation: none !important; } }
"""
rep('</style>', CSS + '</style>')

# ===== 5. 說明 =====
a = s.index("      { t: '目標與專屬地圖'"); b = s.index("      { t: '清單或方塊'")
HELP = [
 '「成就」分頁', '底部第四個分頁：我的任務、學習紀錄',
 ['「我的任務」：自己加小任務（例如讀一篇文章、存五個生字），做完點左邊的圓圈打勾。要做好幾次的任務，每做一次按「+1」，用進度條看做到哪；點任務的名字可以改或刪除。',
  '主頁最上面會顯示第一個還沒完成的任務，點一下到「成就」分頁。沒有任務時，主頁那裡什麼都不放。',
  '「學習紀錄」右上角是連續進入 App 的天數，連續越久，旁邊的火苗圖案越旺。下面有三個區塊：文件、生字卡、完成的任務；點一下區塊，會展開更詳細的紀錄和最近一個月的成長圖，再點一下收起來。',
  '區塊裡的數字怎麼算：文件是打開過的不同文件。頁數是 PDF 和照片停留過的頁，每一頁只算一次。字數是貼上的文字、網址、字幕這類文字文件，第一次打開時算一次。記熟的生字是複習後預估能記住 21 天以上的字。',
  '月曆上，有進入 App 的日子會畫成實心圓，今天是橘色。月曆上面可以設每週目標（3 到 6 天），沒達成也不會扣任何東西。「學習時間」只算畫面開著、有在操作的時間。'],
 '月曆上方的左右箭頭可以翻到以前的月份。',
]
def jq(x): return "'" + x.replace("\\", "\\\\").replace("'", "\\'") + "'"
help_js = ("      { t: " + jq(HELP[0]) + ", s: " + jq(HELP[1]) + ", img: '',\n        d: [" + ', '.join(jq(x) for x in HELP[2]) + "],\n        tip: " + jq(HELP[3]) + " },\n")
s = s[:a] + help_js + s[b:]

# ===== 6. 英文 =====
EN = {
 '成就': 'Achievements',
 '我的任務': 'My tasks', '任務': 'Task',
 '小小的就好，沒有期限。做完打勾，會冒出一朵小火苗鼓勵你。': 'Keep them small, no deadline. Tick one off and a little flame cheers you on.',
 '例如：讀一篇文章': 'e.g. read one article',
 '新增任務': 'Add a task', '加入': 'Add',
 '還沒有任務。挑一個小任務開始，或自己寫一個。': 'No tasks yet. Pick a small one below or write your own.',
 '任務都完成了，太棒了！再加一個吧。': 'All tasks done, great! Add another one.',
 '建議的小任務': 'Suggested small tasks',
 '還有 {n} 個任務': '{n|more task|more tasks}',
 '完成的任務（{n}）': 'Completed tasks ({n})',
 '任務內容': 'Task', '要做幾次': 'Times to do', '已經做了': 'Done so far',
 '儲存': 'Save', '取消': 'Cancel', '刪除': 'Delete', '再按一次刪除': 'Tap again to delete',
 '學習紀錄': 'Learning record',
 '讀過的文章': 'Texts read', '存下的生字': 'Words saved', '記熟的生字': 'Words mastered', '複習次數': 'Reviews', '累計學習天數': 'Days studied', '本週學習': 'This week',
 '連續 {n} 天': 'A {n}-day streak',
 '我的成長': 'My growth', '成長圖': 'Growth chart',
 '學習分鐘': 'Study minutes', '讀過的字數': 'Words read',
 '個記熟的生字': 'mastered words', '分鐘（今天）': 'minutes today', '個詞（累計）': 'words in total',
 '最近一個月': 'Last month',
 '學習時間會自己算：只算畫面開著、有在操作的時間。': 'Study time is counted automatically: only while the screen is open and you are active.',
 '再多學幾天，這裡就會畫出你的成長線。': 'Study a few more days and your growth line will appear here.',
 '只記數量，不打分數。「讀過的字數」是貼上的文字、網址、字幕這類文字文件，第一次打開時算一次；PDF 和照片不算。': 'Only counts, never scores. “Words read” covers text documents such as pasted text, links and subtitles, counted once when first opened; PDFs and photos are not included.',
 '小火苗設定': 'Flame settings', '小火苗': 'Flame', '動畫': 'Animation',
 '學習時偶爾會冒出一朵小火苗鼓勵你，不用特別做什麼。': 'While you study, a little flame may pop up to cheer you on. There is nothing you need to do.',
 '開': 'On', '關': 'Off',
 '手機設定裡開了「減少動態效果」的話，動畫會自動關掉。': 'If “Reduce Motion” is on in your phone settings, animations turn off automatically.',
 '做得好！': 'Well done!',
 '3 天': '3 days', '4 天': '4 days', '5 天': '5 days', '6 天': '6 days',
 '接下來選一下你的泰文程度，讀物和句型會更適合你': 'Next, pick your Thai level so the texts and sentence patterns fit you better',
 # 說明
 HELP[0]: '“Achievements” tab', HELP[1]: 'The fourth tab: my tasks and learning record',
 HELP[2][0]: 'My tasks: add small tasks of your own (such as reading one article or saving five words) and tick the circle on the left when done. For a task you repeat, tap “+1” each time and watch the progress bar; tap the task name to edit or delete it.',
 HELP[2][1]: 'The top of the home screen shows your first unfinished task; tap it to open the Achievements tab. With no tasks, nothing is shown there.',
 HELP[2][2]: 'Learning record: at the top right is the number of days in a row you opened the app; the longer the streak, the bigger the flame icon next to it. Below are three blocks: documents, flashcards and finished tasks. Tap a block to open a more detailed record and a chart of the last month; tap again to close it.',
 HELP[2][3]: 'How the numbers are counted: documents are the different documents you have opened. Pages are the PDF and photo pages you stayed on, each page counted once. Words are counted once, the first time you open a text document such as pasted text, a link or subtitles. Mastered words are the ones you are estimated to remember for 21 days or more after review.',
 HELP[2][4]: 'On the calendar, every day you opened the app is a solid circle, and today is orange. You can set a weekly goal (3 to 6 days) above the calendar; missing it costs you nothing. “Study time” counts only while the screen is open and you are active.',
 HELP[3]: 'Use the arrows above the calendar to go back to earlier months.',
 '學習時偶爾冒出的小鼓勵，只有一個小圖示。可以選動態、靜態（不會動）或關閉。手機開了「減少動態效果」時，會自動變成靜態。': 'A small cheer that now and then pops up while you study, just a little icon. Choose animated, still (no movement) or off. If “Reduce Motion” is on in your phone settings, it turns still automatically.',
}
# 舊的地圖／目標用字：拿掉（避免字典越來越肥）
for k in ['地圖', '設定我的目標', '挑下一個目標', '換目標', '讀下一篇', '地圖完成', '完成過']:
    pass
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v40 ok')
