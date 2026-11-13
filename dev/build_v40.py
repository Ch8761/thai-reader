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
.achcount { font-size: 14px; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; }
.achadd { display: flex; gap: 8px; margin: 10px 0 8px; }
.achin { flex: 1 1 auto; min-width: 0; min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--fg); font-size: 16px; }
.achadd .primary { flex: none; min-height: 44px; padding: 0 18px; }
.achlist { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.achtask { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 6px 10px 6px 6px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); }
.achtask.done { opacity: .75; }
.achtask.editing { display: block; padding: 10px; }
.achchk { flex: none; width: 44px; height: 44px; min-height: 44px; border-radius: 50%; border: 2px solid var(--line); background: var(--card); color: var(--accent); font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0; }
.achchk.on { background: var(--accent-fill); border-color: var(--accent-fill); color: var(--accent-fill-fg); }
.achchk svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.achtx { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.achname { text-align: left; min-height: 36px; padding: 2px 4px; border: 0; background: transparent; color: var(--fg); font-size: 16px; line-height: 1.4; }
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
.achchip { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px dashed var(--accent); background: transparent; color: var(--fg); font-size: 14px; }
.achchip::before { content: '+ '; color: var(--accent); font-weight: 700; }
.achmore { margin: 10px 0 0; }
.achmore > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font-weight: 600; font-size: 15px; color: var(--accent); }
.achrec { margin: 12px 0 4px; }
.achrt { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.achrl { font-size: 15px; }
.achrv { font-size: 19px; font-variant-numeric: tabular-nums; }
.achrec .lqnum { min-width: 72px; text-align: right; }
.achstreak { margin: 8px 0 0; font-size: 14px; font-weight: 700; color: #d9730d; }
.achmet { margin: 10px 0 4px; }
.achchart { margin-top: 8px; }
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
 '「成就」分頁', '底部第四個分頁：我的任務、學習紀錄、我的成長',
 ['「我的任務」：自己加小任務（例如讀一篇文章、存五個生字），做完點左邊的圓圈打勾，畫面上方會冒出一朵小火苗。要做好幾次的任務，每做一次按「+1」，用進度條看做到哪；點任務的名字可以改或刪除。',
  '主頁最上面會顯示第一個還沒完成的任務，點一下到「成就」分頁。沒有任務時，主頁那裡什麼都不放。',
  '「學習紀錄」用進度條顯示離下一個里程碑還有多遠：讀過幾篇、存幾個生字、記熟幾個、複習幾次、學了幾天。每週目標可以改（3 到 6 天）。',
  '「我的成長」畫出最近一個月記熟的生字、每天學習的分鐘、累計讀過的字數，只記數量，不打分數。學習時間只算畫面開著、有在操作的時間。',
  '學習時偶爾會冒出一朵小火苗（例如存了五個生字、今天的複習都做完、學滿十分鐘），不會告訴你條件，也不用特別做什麼。任務完成、記熟的生字到一個里程碑、連續學習幾天、達成每週目標時，火苗會大一點。'],
 '小火苗和動畫不喜歡，可以在「成就」分頁最下面的「小火苗設定」關掉。',
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
 HELP[0]: '“Achievements” tab', HELP[1]: 'The fourth tab: my tasks, learning record and growth',
 HELP[2][0]: 'My tasks: add small tasks of your own (such as reading one article or saving five words) and tick the circle on the left when done; a little flame pops up at the top of the screen. For a task you repeat, tap “+1” each time and watch the progress bar; tap the task name to edit or delete it.',
 HELP[2][1]: 'The top of the home screen shows your first unfinished task; tap it to open the Achievements tab. With no tasks, nothing is shown there.',
 HELP[2][2]: 'Learning record: progress bars show how far you are from the next milestone: texts read, words saved, words mastered, reviews and days studied. You can change the weekly goal (3 to 6 days).',
 HELP[2][3]: 'My growth: charts for mastered words over the last month, minutes studied each day, and total words read. It only counts, it never scores. Study time counts only while the screen is open and you are active.',
 HELP[2][4]: 'While you study, a little flame pops up now and then (for example after saving five words, finishing today’s reviews or studying ten minutes). It never tells you the condition and there is nothing you need to do. The flame is bigger when you finish a task, reach a mastered-words milestone, keep a streak of days or hit your weekly goal.',
 HELP[3]: 'If you don’t like the flames and animations, turn them off under “Flame settings” at the bottom of the Achievements tab.',
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
