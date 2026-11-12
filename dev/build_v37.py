import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'

# 1. 歡迎視窗：換成一頁一題
m = re.search(r'(<div id="welcome" class="modal" role="dialog" aria-modal="true" aria-labelledby="h-welcome" hidden>\n    <div class="mcard">)(.*?)(\n    </div>\n  </div>\n</main>)', s, re.S)
assert m
NEW_W = """
      <div class="wzhead">
        <span></span>
        <div class="wzdots" id="wzDots"></div>
        <button type="button" class="linkbtn wzskip" id="wSkip" aria-label="略過，之後再設定">略過</button>
      </div>
      <div id="wzBody"></div>
      <div class="wzfoot">
        <button type="button" class="linkbtn" id="wBack" hidden>‹ 上一步</button>
        <span class="wzgrow"></span>
        <button type="button" class="primary" id="wNext">開始</button>
        <button type="button" class="primary" id="wDone" hidden>開始使用</button>
      </div>"""
s = s[:m.start(2)] + NEW_W + s[m.end(2):]

# 2. 程式
JS = open(os.path.join(D, 'v37_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# 3. 設定同步
rep("'thai-rr-show', 'thai-rev-cap', 'thai-lookups',", "'thai-rr-show', 'thai-rev-cap', 'thai-lookups', 'thai-goal', 'thai-map-seen', 'thai-goal-skip',")

# 4. 說明
rep("      { t: '學習關卡', s: '主頁最上面的卡片：這一關的目標和進度', img: '',",
    "      { t: '目標與專屬地圖', s: '第一次打開會問幾個小問題，排出你的闖關地圖', img: '',\n"
    "        d: ['第一次從主畫面打開，會一頁一個問題：怎麼學、你的程度、想達成的目標、每天花多少時間，最後產生專屬地圖。每一頁都有預選的推薦項，可以直接按「繼續」，也可以「略過」之後再設定。', '不確定程度，可以做 1 分鐘的小測驗，只是粗略參考，最後還是你自己選。', '地圖是一串關卡：讀你自己想讀的東西、存生字、複習、記熟生字；有些目標最後是「魔王關」：一篇像菜單、社群貼文或新聞短訊的真實樣本文章。', '魔王關要認得率到 85% 才解鎖，讀完答 3 題，答對 2 題就過關。認得率還不夠時，會列出該記熟的詞，可以一次存成生字卡。', '地圖會算出預計到達的日期，但沒有截止日：落後了日期會自己往後延，不會「失敗」。', '想改目標或每天時間：點主頁的關卡卡片打開「學習紀錄」，按「我的地圖」旁的「修改目標」。以前就在用的人，會在那裡看到「設定你的目標」。'],\n"
    "        tip: '改程度（設定 → 閱讀與查詞）後，地圖會自動換成新程度的關卡，已經過的關會保留。' },\n"
    "      { t: '學習關卡', s: '主頁最上面的卡片：這一關的目標和進度', img: '',")
rep("'過關時回到主頁會跳出慶祝；某一天沒學、這週沒達標，都不會扣任何東西，也不會把已經過的關收回。'],",
    "'過關時回到主頁會跳出慶祝；某一天沒學、這週沒達標，都不會扣任何東西，也不會把已經過的關收回。', '設定了目標之後，卡片會改顯示「我的地圖」的這一關；原本的 30 關收在學習紀錄的「一般關卡」裡。'],")

CSS = """
/* 1.28 歡迎流程、地圖、魔王關 */
#welcome .mcard { gap: 8px; }
.wzdots { display: flex; gap: 6px; justify-content: center; align-items: center; padding: 2px 0 6px; }
.wzdots[hidden] { display: none; }
.wzdot { width: 8px; height: 8px; border-radius: 50%; background: var(--line); transition: width .15s; }
.wzdot.on { background: color-mix(in srgb, var(--accent) 55%, var(--line)); }
.wzdot.cur { width: 22px; border-radius: 999px; background: var(--accent); }
#welcome .wzh { font-size: 22px; margin: 2px 0 0; outline: none; line-height: 1.35; }
.wzlist { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.wzopt { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; width: 100%; min-height: 56px; padding: 12px 46px 12px 14px; text-align: left; border: 1.5px solid var(--line); border-radius: 14px; background: var(--bg); color: var(--fg); font-size: 16px; }
.wzopt::after { content: ''; position: absolute; right: 14px; top: 50%; width: 22px; height: 22px; margin-top: -11px; border-radius: 50%; border: 2px solid var(--line); background: var(--card); box-sizing: border-box; }
.wzopt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--card)); }
.wzopt.on::after { border-color: var(--accent); background: var(--accent); box-shadow: inset 0 0 0 4px var(--card); }
.wzot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.wzot b { font-size: 17px; }
.wztag { font-style: normal; font-size: 12px; font-weight: 700; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); border-radius: 999px; padding: 1px 9px; }
.wzos { font-size: 13.5px; font-weight: 400; color: var(--muted); line-height: 1.5; }
.wzquiz { align-self: flex-start; margin-top: 6px; min-height: 40px; }
.wzhow { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.wzstep { display: flex; gap: 14px; align-items: flex-start; }
.wzic { flex: none; width: 44px; height: 44px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 12%, var(--card)); color: var(--accent); display: flex; align-items: center; justify-content: center; }
.wzic svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.wzstx { display: flex; flex-direction: column; gap: 2px; font-size: 14px; color: var(--muted); line-height: 1.5; }
.wzstx b { font-size: 16px; color: var(--fg); display: flex; align-items: center; gap: 8px; }
.wzn { display: inline-flex; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: var(--accent-fill-fg, #fff); font-size: 12px; align-items: center; justify-content: center; flex: none; }
.wzfoot { display: flex; align-items: center; gap: 12px; padding-top: 10px; }
.wzfoot .wzgrow { flex: 1; }
.wzfoot button.primary { min-height: 46px; padding: 0 22px; font-size: 16px; }
.wzfoot .linkbtn { min-height: 44px; }
.wzword { font-size: 34px; font-weight: 700; text-align: center; padding: 10px 0 6px; font-family: var(--thai, inherit); }
.wzdk { align-self: center; margin-top: 4px; min-height: 44px; }
.wzbig { font-size: 30px; font-weight: 700; text-align: center; padding: 6px 0; color: var(--accent); }
.wzres { justify-content: center; }
.wzmap { margin: 8px 0 0; }
.mapeta { margin: 4px 0 8px; font-size: 14px; font-weight: 600; color: var(--accent); }
.mapsec { margin: 0 0 18px; padding: 14px 14px 6px; border: 1px solid var(--line); border-radius: 14px; background: color-mix(in srgb, var(--accent) 6%, var(--card)); }
.maphd { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.maph { margin: 0; font-size: 18px; }
.mapsub { margin: 4px 0 2px; font-size: 14px; color: var(--muted); line-height: 1.55; }
.mapnew { padding-bottom: 14px; }
.mapsec .lqpath { margin-top: 10px; }
.mapgo { margin-top: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14px; }
.mapboss { margin-top: 6px; }
.mapnote { margin: 0 0 8px; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
.mapunk { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; }
.mapw { padding: 2px 10px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); font-size: 15px; }
.mapbtns { margin: 0 0 4px; }
.mapbtns button { min-height: 40px; font-size: 14px; }
.lqmore { margin: 6px 0 16px; }
.lqmore > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font-weight: 600; font-size: 15px; color: var(--accent); }
.mapcard .lqnum { white-space: nowrap; }
.bqcard { gap: 10px; }
.bqcard h2 { font-size: 19px; }
.bqtext > summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; font-size: 14px; font-weight: 600; color: var(--accent); }
.bqpass { white-space: pre-wrap; font-size: 17px; line-height: 1.9; padding: 10px 12px; border-radius: 12px; background: var(--bg); border: 1px solid var(--line); font-family: var(--thai, inherit); }
.bqres { font-size: 18px; font-weight: 700; margin: 6px 0; }
.bqres.ok { color: #1e8449; }
.bqres.bad { color: #b45309; }
.bossbar .rrrow { padding: 6px 8px 6px 14px; gap: 10px; }
.bossbtx { flex: 1; font-size: 14.5px; font-weight: 600; line-height: 1.5; }
.bosslock { font-weight: 400; color: var(--muted); }
.bossgo { flex: none; min-height: 40px; padding: 0 16px; border-radius: 999px; background: var(--accent-fill); color: var(--accent-fill-fg); border-color: var(--accent-fill); font-weight: 600; font-size: 14px; }
.bossgo:disabled { opacity: .45; }
"""
rep('</style>', CSS + '</style>')

# 5. 英文
EN = {
 '歡迎來到 ไทย Reader！': 'Welcome to ไทย Reader!',
 'ไทย Reader 是一款讓讀泰文變輕鬆的 App：點一個詞就看到意思，再存成生字卡慢慢記。接下來問你幾個小問題，幫你排一條適合你的學習路線，大約 1 分鐘。選項之後都能在設定修改。': 'ไทย Reader makes reading Thai easier: tap a word to see its meaning, then save it as a flashcard to learn it slowly. A few quick questions follow so I can plan a learning route for you. It takes about a minute, and you can change every answer later in Settings.',
 '這樣學泰文': 'How you will learn',
 '加進一篇泰文': 'Add a Thai text',
 '貼上網址、匯入檔案，或從讀物庫挑一篇短文': 'Paste a link, import a file, or pick a short text from the reading library',
 '點一個不懂的詞': 'Tap a word you don’t know',
 '馬上看到意思、拼音，還能聽發音': 'See the meaning and romanization at once, and hear it spoken',
 '存成生字卡複習': 'Save it as a flashcard',
 '每天複習幾張，慢慢就記住了': 'Review a few cards every day and you’ll remember them',
 '你的泰文程度？': 'What is your Thai level?',
 '先選最接近的，不確定也沒關係，之後隨時能改。': 'Pick the closest one. Not sure? That’s fine, you can change it any time.',
 '認得字母和一些單字': 'You know the letters and a few words',
 '會簡單基本句子': 'You can handle simple basic sentences',
 '能稍微讀懂 YT、IG 貼文和一些短文，但卡在一些句型': 'You can roughly follow YouTube and Instagram posts and some short texts, but get stuck on some sentence patterns',
 '能讀懂生活大部分內容，但正式書面用法有困難，像是正式新聞、皇室公告、論文': 'You can read most everyday content, but formal written Thai is hard, such as formal news, royal announcements and papers',
 '不確定？做 {n} 分鐘小測驗': 'Not sure? Take a {n}-minute quiz',
 '你想達成什麼？': 'What do you want to achieve?',
 '選一個目標，地圖會朝它排關卡。': 'Pick a goal and the map will be built around it.',
 '推薦': 'Recommended',
 '升到「初級」': 'Move up to “Beginner”', '升到「中級」': 'Move up to “Intermediate”', '升到「高級」': 'Move up to “Advanced”',
 '一步一步練到下一級': 'Practice step by step up to the next level',
 '看懂菜單': 'Understand a menu', '點餐、看招牌，不用一直查字典': 'Order food and read signs without constant dictionary lookups',
 '看懂社群貼文': 'Understand social posts', 'IG、Facebook 上的貼文和留言': 'Posts and comments on Instagram and Facebook',
 '看懂新聞短訊': 'Understand news briefs', '天氣、社會、生活的快訊': 'Quick news about weather, society and daily life',
 '先不設目標': 'No goal for now', '自己隨意讀。之後想設定，到學習紀錄就能補上': 'Just read as you like. You can set a goal later in your learning record',
 '每天想花多少時間？': 'How much time each day?',
 '一週學 {n} 天左右就很好，漏幾天沒關係。': 'Studying about {n} days a week is plenty. Missing a few days is fine.',
 '每天 {n} 分鐘': '{n} minutes a day',
 '輕鬆起步，讀一小段加幾張卡': 'An easy start: a short passage and a few cards',
 '剛剛好，一篇短文加複習': 'Just right: one short text plus review',
 '認真一點，進度會快不少': 'More serious: you’ll progress a lot faster',
 '你的專屬地圖': 'Your personal map',
 '預計約 {n} 週後（{n}/{n} 前後）到達': 'Expected in about {n|week|weeks} ({n}/{n})',
 '全部完成了': 'All done',
 '沒有截止日。落後了，日期會自己往後延，不會「失敗」。': 'There is no deadline. If you fall behind, the date simply moves back; you never “fail”.',
 '都設定好了': 'All set',
 '你可以直接開始讀。想要一條有關卡的學習路線，隨時到「學習紀錄」設定目標。': 'You can start reading right away. For a route with stages, set a goal any time in your learning record.',
 '‹ 上一步': '‹ Back', '略過，之後再設定': 'Skip, set up later', '開始': 'Start', '繼續': 'Continue', '開始第一關': 'Start stage 1', '開始使用': 'Get started',
 '第 {n} / {n} 步': 'Step {n} of {n}',
 '小測驗': 'Quick quiz', '小測驗結果': 'Quiz result',
 '這個泰文詞是什麼意思？不知道就選「不知道」，不要猜。': 'What does this Thai word mean? If you don’t know, pick “Don’t know” instead of guessing.',
 '不知道': 'Don’t know',
 '看起來你大概是這個程度。這只是粗略的參考，覺得不準就自己選。': 'You look to be around this level. It’s only a rough guide; if it feels off, pick your own.',
 '用這個程度': 'Use this level', '回去自己選': 'Pick my own',
 '第 {n} / {n} 題': 'Question {n} of {n}',
 '我的地圖': 'My map', '修改目標': 'Change goal',
 '完成一次聲調練習': 'Finish one tone practice',
 '讀 {n} 篇「入門」短文': 'Read {n} “Starter” texts', '讀 {n} 篇「初級」短文': 'Read {n} “Beginner” texts', '讀 {n} 篇「中級」短文': 'Read {n} “Intermediate” texts', '讀 {n} 篇「高級」短文': 'Read {n} “Advanced” texts',
 '讀 {n} 篇飲食短文': 'Read {n} text about food', '讀 {n} 篇社群短文': 'Read {n} social-media text', '讀 {n} 篇新聞短文': 'Read {n} news text',
 '看懂一則公告': 'Understand an announcement',
 '魔王關': 'Boss stage', '看懂一份菜單': 'Understand a menu', '看懂一則社群貼文': 'Understand a social post', '看懂一則新聞短訊': 'Understand a news brief',
 '目標達成': 'Goal reached', '地圖完成': 'Map complete',
 '認得率 {n}% / {n}%': 'Recognition {n}% / {n}%', '先完成前面的關卡': 'Finish the earlier stages first', '已解鎖，去挑戰': 'Unlocked: go for it',
 '設定你的目標': 'Set your goal', '選一個目標和每天的時間，產生專屬的學習地圖，還會算出大概哪天能到達。': 'Pick a goal and your daily time to get a personal learning map, with an estimate of when you’ll get there.',
 '開始設定': 'Set up', '不用了': 'No thanks', '設定我的目標': 'Set my goal',
 '去做這一關': 'Do this stage',
 '先完成前面的關卡，就能挑戰這一關。': 'Finish the earlier stages to take on this one.',
 '這篇你的認得率約 {n}%，到 {n}% 就解鎖。把下面這些詞記熟，數字就會升上去：': 'Your recognition rate for this text is about {n}%; it unlocks at {n}%. Master these words and the number goes up:',
 '全部存成生字卡': 'Save all as flashcards', '先看看這篇': 'Preview this text',
 '已存 {n} 個': '{n|word|words} saved', '都已經在生字卡裡了': 'They’re all in your flashcards already',
 '已解鎖！先讀完這篇，再答 {n} 題，答對 {n} 題就過關。': 'Unlocked! Read this text, then answer {n} questions; get {n} right to pass.',
 '讀這篇': 'Read this text', '答 {n} 題': 'Answer {n} questions',
 '一般關卡（{n} 關）': 'General stages ({n})',
 '再看一次原文': 'Read the text again', '答對了。': 'Correct.', '答案：': 'Answer:', '原文：': 'Text:',
 '過關！答對 {n} / {n} 題': 'Passed! {n} of {n} correct', '差一點：答對 {n} / {n} 題，要答對 {n} 題才過關': 'Almost: {n} of {n} correct; you need {n} to pass',
 '再讀一次原文，找找答案在哪一句，再試一次。': 'Read the text again, find which sentence holds the answer, and try once more.',
 '回到地圖': 'Back to the map', '再讀一次原文': 'Read the text again', '再答一次': 'Try again',
 '魔王關：讀完後答 {n} 題': 'Boss stage: read, then answer {n} questions', '認得率還沒到 {n}%': 'recognition rate not at {n}% yet',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v37 ok')
