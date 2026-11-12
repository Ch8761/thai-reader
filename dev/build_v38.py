# v1.29.0：同步當掉修正、生字卡分頁、「地圖」分頁、依程度的目標清單
import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
EN = {}

# ===== 1. 從 Google 跳回來就當掉：啟動到一半呼叫了還沒準備好的畫面 =====
# 等整支程式啟動完再處理「從 Google 跳回來」；就算切換頁面失敗，也要繼續完成連結
rep("""  if (SYNC_CLIENT_ID) {
    var fromGoogle = syncFromRedirect();""", """  function syncAfterBoot(fn) { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); } else { setTimeout(fn, 0); } }
  if (SYNC_CLIENT_ID) {
    var fromGoogle = syncFromRedirect();""")
rep("""    if (fromGoogle) { showTab('settings'); if (typeof settingsOpen === 'function') { settingsOpen('data'); } if (sync.pendingCode) { var pc = sync.pendingCode; sync.pendingCode = null; syncFromCode(pc); } else if (sync.justLinked) { setTimeout(runSync, 300); } }""",
"""    if (fromGoogle) {
      syncAfterBoot(function () {
        try { showTab('settings'); if (typeof settingsOpen === 'function') { settingsOpen('data'); } } catch (err) {}
        if (sync.pendingCode) { var pc = sync.pendingCode; sync.pendingCode = null; syncFromCode(pc); } else if (sync.justLinked) { setTimeout(runSync, 300); } else { renderSync(); }
      });
    }""")
# 已連結、但還沒有自動續登入：說明按下去會發生什麼事
rep("""    $('syncMsg').textContent = sync.err || sync.lastNote || '';""",
"""    $('syncMsg').textContent = sync.err || sync.lastNote || (on && sync.codeOK && !syncRt() && !sync.busy ? '按「改成自動保持登入」會跳到 Google 確認一次（只需要這一次），確認完會自動回到這裡。' : '');""")
EN['按「改成自動保持登入」會跳到 Google 確認一次（只需要這一次），確認完會自動回到這裡。'] = 'Tapping “Keep me signed in automatically” takes you to Google to confirm once (only this once), then brings you right back here.'

# ===== 4. 生字卡頁：分頁（複習｜測驗｜清單｜聲調）在最上面，資料夾移到下面當篩選 =====
rep("""    <div id="cardFolders" class="cfolders"></div>
    <div class="seg" role="radiogroup" aria-label="生字卡頁面" id="cardTabs"></div>""",
"""    <div class="seg" role="radiogroup" aria-label="生字卡頁面" id="cardTabs"></div>
    <div id="cardFolders" class="cfolders"></div>""")
rep("""['list', '全部（' + cards.filter(inFolder).length + '）']];
    if (toneMode) { tabs.push(['tone', '聲調']); }""", """['list', '清單（' + cards.filter(inFolder).length + '）']];
    if (toneMode) { tabs.push(['tone', '聲調']); }""")
# 聲調練習不分資料夾：資料夾列只在複習／測驗／清單出現
rep("""    if (cardTab === 'review') { renderReview(host); } else if (cardTab === 'quiz') { renderQuiz(host); } else if (cardTab === 'tone') { renderToneTab(host); } else { renderList(host); }
    updateCardButton();""", """    var cfBar = $('cardFolders'); if (cfBar) { cfBar.style.display = cardTab === 'tone' ? 'none' : ''; }
    if (cardTab === 'review') { renderReview(host); } else if (cardTab === 'quiz') { renderQuiz(host); } else if (cardTab === 'tone') { renderToneTab(host); } else { renderList(host); }
    updateCardButton();""")
# 資料夾列前面加一個小標籤，讓人看得出這是「篩選」
rep("""    renderFolders();
    var n = dueCards().length;
    if (cardTab === 'tone' && !toneMode) { cardTab = 'review'; }""", """    renderFolders();
    var cfh = $('cardFolders'); if (cfh && !cfh.querySelector('.cflab')) { cfh.insertBefore(el('span', 'cflab', '資料夾'), cfh.firstChild); }
    var n = dueCards().length;
    if (cardTab === 'tone' && !toneMode) { cardTab = 'review'; }""")
EN['清單（'] = 'List ('

CSS = """
/* 1.29 生字卡：上面是平行的分頁，下面是資料夾篩選 */
#view-cards #cardTabs { display: flex; width: 100%; padding: 0; gap: 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent; margin: 4px 0 0; }
#view-cards #cardTabs button { flex: 1 1 0; min-width: 0; min-height: 48px; padding: 0 4px; border: 0; border-radius: 0; background: transparent; color: var(--muted); font-size: 16px; position: relative; white-space: nowrap; }
#view-cards #cardTabs button[aria-checked="true"] { background: transparent; color: var(--fg); font-weight: 700; }
#view-cards #cardTabs button[aria-checked="true"]::after { content: ''; position: absolute; left: 12%; right: 12%; bottom: -1px; height: 3px; border-radius: 3px; background: var(--accent); }
#view-cards #cardFolders { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px !important; margin: 12px 0 8px !important; padding: 0 !important; border: 0 !important; position: relative; }
#view-cards #cardFolders .cflab { flex: none; font-size: 13px; color: var(--muted); }
#view-cards #cardFolders > .seg { display: flex !important; align-items: center; min-height: 0 !important; flex: 1 1 0; min-width: 0; flex-wrap: nowrap !important; gap: 6px !important; overflow-x: auto; border: 0 !important; padding: 0 !important; background: transparent !important; }
#view-cards #cardFolders > .seg > button { flex: none; min-height: 34px !important; padding: 0 12px !important; border: 1px solid var(--line) !important; border-radius: 999px !important; font-size: 14px !important; font-weight: 400 !important; background: transparent !important; color: var(--muted) !important; }
#view-cards #cardFolders > .seg > button::after { display: none !important; }
#view-cards #cardFolders > .seg > button[aria-checked="true"] { border-color: var(--accent) !important; color: var(--fg) !important; font-weight: 600 !important; background: var(--card) !important; }
#view-cards #cardFolders > .frow { flex: none; border-bottom: 0 !important; }
#view-cards #cardFolders > .frow:has(.fname) { flex-basis: 100%; }
"""
rep('</style>', CSS + '</style>')

# ===== 5. 「地圖」分頁：目標地圖＋學習紀錄；主頁只留一小列；30 關「一般關卡」拿掉 =====
# 底部分頁：多一個「地圖」
rep("""<span>生字卡</span><span class="tabbadge" id="cardBadge" hidden></span></button>""",
    """<span>生字卡</span><span class="tabbadge" id="cardBadge" hidden></span></button><button type="button" data-tab="map"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7z"/><path d="M9 4v13M15 7v13"/></svg><span>地圖</span><span class="tabdot" id="mapDot" hidden></span></button>""")
rep("""  </section>
  <section id="view-settings" class="view" aria-labelledby="h-settingsv" hidden>""", """  </section>
  <section id="view-map" class="view" aria-labelledby="h-mapv" hidden>
    <header class="vhead"><h1 id="h-mapv">地圖</h1></header>
  <div id="mapBody" class="settings mapview"></div>
  </section>
  <section id="view-settings" class="view" aria-labelledby="h-settingsv" hidden>""")
rep("""    ['home', 'doc', 'cards', 'settings'].forEach(function (k) {
      $('view-' + k).hidden = k !== t;""", """    ['home', 'doc', 'cards', 'map', 'settings'].forEach(function (k) {
      $('view-' + k).hidden = k !== t;""")
rep("""    if (t === 'settings') { renderSettings(); if (typeof renderBackup === 'function') { renderBackup(); } }
    window.scrollTo(0, 0);""", """    if (t === 'map') { renderMapTab(); }
    if (t === 'settings') { renderSettings(); if (typeof renderBackup === 'function') { renderBackup(); } }
    window.scrollTo(0, 0);""")
rep("showTab(['home', 'doc', 'cards', 'settings'].indexOf(t) >= 0 ? t : 'home');", "showTab(['home', 'doc', 'cards', 'map', 'settings'].indexOf(t) >= 0 ? t : 'home');")
# 精靈結尾提示
EN['你可以直接開始讀。想要一條有關卡的學習路線，隨時到「地圖」分頁設定目標。'] = 'You can start reading right away. For a route with stages, set a goal any time on the Map tab.'
EN['自己隨意讀。之後想設定，到「地圖」分頁就能補上'] = 'Just read as you like. You can set a goal later on the Map tab'

CSS2 = """
/* 1.29 「地圖」分頁與主頁小列 */
.tabdot { position: absolute; top: 8px; left: calc(50% + 8px); width: 9px; height: 9px; border-radius: 50%; background: #c62828; }
.tabdot[hidden] { display: none; }
.tabbar button { position: relative; }
#questHost:empty { display: none; }
.mapbar { position: relative; display: flex; align-items: center; gap: 8px; width: 100%; min-height: 46px; margin: 0 0 12px; padding: 0 12px 4px; text-align: left; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: var(--fg); font-size: 14px; overflow: hidden; }
.mapbar .mbic { flex: none; display: inline-flex; color: var(--accent); }
.mapbar .mbic svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.mapbar .mbk { flex: none; font-weight: 700; color: var(--accent); }
.mapbar .mbv { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mapbar .mbn { flex: none; font-size: 13px; color: var(--muted); white-space: nowrap; }
.mapbar .hrchev { flex: none; width: 16px; height: 16px; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.mapbar .mbbar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--line); }
.mapbar .mbbar > span { display: block; height: 100%; background: var(--accent); }
.mapview { padding-bottom: 24px; }
.mapview .mapsec { margin: 4px 0 16px; }
.mapview .maph { font-size: 19px; }
.mapview .recsec { padding-bottom: 14px; background: var(--card); }
.mapview .recsec .lqstats { margin-top: 10px; }
.mapnote2 { margin: 6px 0 4px; padding: 10px 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--line); }
.mapnote2 p { margin: 0 0 8px; font-size: 14px; line-height: 1.6; }
.mapnote2 button { min-height: 40px; }
.mapchips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.mapchip { display: inline-flex; align-items: center; gap: 4px; min-height: 34px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); color: var(--fg); font-size: 14px; }
.mapchip svg { width: 14px; height: 14px; fill: none; stroke: var(--accent); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.mapchip.on { border-color: var(--accent); color: var(--muted); }
"""
rep('</style>', CSS2 + '</style>')
EN.update({
 '地圖': 'Map', '學習紀錄': 'Learning record', '設定我的目標': 'Set my goal', '挑下一個目標': 'Pick the next goal', '換目標': 'Change goal', '讀下一篇': 'Read the next one',
 '這張地圖走完了，恭喜！要不要挑下一個目標？': 'You finished this map. Congratulations! Want to pick the next goal?',
 '地圖完成': 'Map complete', '完成過': 'Done before',
 '升到下一級': 'Move up a level',
 '打好基礎：聲調與日常短句': 'Build the basics: tones and everyday sentences', '先把聲調和最常用的字練熟，再讀簡單短文': 'Get comfortable with tones and the most common words, then read easy texts',
 '看懂菜單和點餐': 'Read menus and order food', '點餐、看招牌，不用一直查字典': 'Order food and read signs without constant dictionary lookups',
 '自己去泰國玩': 'Travel Thailand on my own', '搭車、問路、安排行程、看旅遊貼文': 'Getting around, asking directions, planning trips, reading travel posts',
 '看懂生活資訊': 'Understand everyday messages', '網購、看醫生、室友訊息和公告': 'Online shopping, doctor visits, roommate messages and notices',
 '看懂新聞': 'Read the news', '空汙、環保這類新聞風格的短文': 'News-style texts on air pollution, the environment and more',
 '看懂社群和口語': 'Read social media and spoken Thai', 'IG 貼文、Podcast、網路用語': 'Instagram posts, podcasts, internet slang',
 '讀懂新聞評論與科普': 'Read news commentary and science articles', '社會、經濟、科學這類長一點的文章': 'Longer pieces on society, the economy and science',
 '看懂公告與公文': 'Read notices and official documents', '大學公告、政府通知這類正式書面': 'Formal writing such as university and government notices',
 '讀文學與歷史短文': 'Read literature and history', '小說片段和歷史故事，詞彙更豐富': 'Story excerpts and historical pieces with richer vocabulary',
 '你的程度已經改成「': 'Your level is now “', '」，這張地圖還是照「': '”, but this map was built for “', '」排的。要換一個適合的目標嗎？': '”. Want to switch to a goal that fits?',
})
for lab, en in [('日常', 'Daily life'), ('飲食與市場', 'Food and markets'), ('旅行', 'Travel'), ('生活', 'Everyday life'), ('新聞與環境', 'News and environment'), ('社群與口語', 'Social media and spoken Thai'), ('評論與科普', 'Commentary and science'), ('正式書面', 'Formal writing'), ('文學與歷史', 'Literature and history')]:
    EN['讀 {n} 篇「' + lab + '」短文'] = 'Read {n} texts: ' + en
# ===== 說明（中文）=====
a = s.index("      { t: '學習關卡', s: '主頁最上面的卡片：這一關的目標和進度', img: '',")
b = s.index("      { t: '清單或方塊'")
s = s[:a] + """      { t: '「地圖」分頁', s: '底部第四個分頁：我的地圖和學習紀錄', img: '',
        d: ['「我的地圖」把你的目標排成一串關卡，一關一關過；現在這一關會顯示進度，旁邊有「去做這一關」的按鈕。', '有些關是「讀幾篇指定短文」，會把那幾篇列出來，點一下就能打開，讀過的會打勾。', '主頁最上面只留一小列：現在是第幾關、做到哪裡，點一下就到「地圖」分頁。還沒設目標的話，主頁那裡什麼都不放。', '「學習紀錄」在地圖下面：讀過幾篇、生字幾個（記熟幾個）、本週學了幾天、複習幾次。每週目標也能在這裡改（3 到 6 天）。', '過關時回到主頁會跳出慶祝；某一天沒學、這週沒達標，都不會扣任何東西，也不會把已經過的關收回。'],
        tip: '那天有打開文件或複習，就算「有學」。每週一重新計算。' },
""" + s[b:]
rep("'想改目標或每天時間：點主頁的關卡卡片打開「學習紀錄」，按「我的地圖」旁的「修改目標」。以前就在用的人，會在那裡看到「設定你的目標」。'],",
    "'每個程度能選的目標不一樣：入門有「看懂菜單和點餐」，初級有「自己去泰國玩」，中級有「看懂新聞」，高級有「看懂公告與公文」；除了高級，每一級也都有「升到下一級」。', '想改目標或每天時間：到底部的「地圖」分頁，按「我的地圖」旁的「修改目標」。以前就在用的人，也在那裡按「設定我的目標」。'],")
rep("tip: '改程度（設定 → 閱讀與查詞）後，地圖會自動換成新程度的關卡，已經過的關會保留。' },",
    "tip: '改了程度，這張地圖不會變動、進度也不會掉；「地圖」分頁會提示你換一個適合新程度的目標。' },")
rep("{ t: '收藏和刪除', s: '在「全部」清單往右滑收藏、往左滑刪除', img: '',", "{ t: '收藏和刪除', s: '在「清單」分頁往右滑收藏、往左滑刪除', img: '',")
rep("{ t: '單字詳解和例句', s: '「全部」分頁點一個單字', img: 'cards-detail',", "{ t: '單字詳解和例句', s: '「清單」分頁點一個單字', img: 'cards-detail',")
rep("可以到「全部清單」在這張卡寫上自己查到的意思。", "可以到「清單」在這張卡寫上自己查到的意思。", 2)
EN['內建字典沒有這個詞的意思。可以到「清單」在這張卡寫上自己查到的意思。'] = 'The built-in dictionary has no meaning for this word. You can add your own on this card in the “List” tab.'
# 備份、還原要帶著新的設定
rep("'thai-goal', 'thai-map-seen', 'thai-goal-skip',", "'thai-goal', 'thai-map-seen', 'thai-goal-skip', 'thai-goal-done', 'thai-map-visit',")
# ===== 寫出 =====
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v38 ok')
