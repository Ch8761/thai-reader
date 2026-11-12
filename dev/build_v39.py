import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)

# 1.30：歡迎頁第一頁列點、「略過」固定在右上角、每個目標的關卡改成「讀自己想讀的東西」
CSS3 = """
/* 1.30 歡迎頁：略過放右上角、第一頁列點；地圖「自己想讀」的關卡 */
.wzhead { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 44px; }
.wzhead .wzdots { grid-column: 2; grid-row: 1; padding: 0; }
.wzhead .wzskip { grid-column: 3; grid-row: 1; justify-self: end; min-height: 44px; padding: 0 2px 0 14px; color: var(--muted); font-size: 15px; }
.wzbul { margin: 10px 0 4px; padding: 0 0 0 1.3em; display: flex; flex-direction: column; gap: 12px; font-size: 17px; line-height: 1.6; }
.wzbul li::marker { color: var(--accent); }
.maphint { display: block; margin-top: 4px; font-size: 13.5px; line-height: 1.55; color: var(--muted); }
.mapown { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.mapown .mapgo { margin-top: 4px; }
"""
rep('</style>', CSS3 + '</style>')

EN = {
 '略過': 'Skip',
 'ไทย Reader 是讓讀泰文變輕鬆的 App': 'ไทย Reader makes reading Thai easier',
 '點一個泰文詞，馬上看到意思和拼音': 'Tap a Thai word to see its meaning and romanization right away',
 '存成生字卡，每天複習幾張就記得住': 'Save words as flashcards and review a few each day to remember them',
 '接下來問你幾個小問題，大約一分鐘，幫你排一條學習路線': 'A few quick questions follow, about a minute, to plan a learning route for you',
 '選項之後都能在設定裡改': 'You can change every answer later in Settings',
 '能讀懂生活大部分內容，但正式書面用法有困難': 'You can read most everyday content, but formal written Thai is hard',
 # 目標
 '看懂新聞': 'Read the news', '挑你有興趣的話題，一則一則讀': 'Pick topics you care about and read them one by one',
 '可以用泰文字幕看影集電影': 'Watch series and films with Thai subtitles',
 '用泰文字幕看自己愛的影集和電影，不用一直暫停查字': 'Follow the shows and films you love with Thai subtitles, without pausing for every word',
 '讀懂文學作品': 'Read literary works', '小說、散文、詩，一小段一小段慢慢讀': 'Novels, essays and poems, one small piece at a time',
 '能讀專業文章': 'Read professional articles', '你工作或有興趣領域的文章': 'Articles from your work or a field you care about',
 '看懂正式公文': 'Read formal documents', '比較書面、正式的用語': 'More formal, written-style language',
 # 關卡（{n} 會換成數字）
 '讀 {n} 篇你想讀的泰文': 'Read {n|text|texts} you want to read',
 '讀 {n} 篇你想讀的短句或短文': 'Read {n|short text|short texts} you choose',
 '讀 {n} 份你想看的菜單或招牌': 'Read {n|menu or sign|menus or signs} you want to read',
 '存 {n} 個菜名和食物的生字': 'Save {n|dish and food word|dish and food words}',
 '讀 {n} 則你想去的地方的介紹': 'Read {n|guide|guides} to places you want to visit',
 '存 {n} 個旅行會用到的生字': 'Save {n|travel word|travel words}',
 '拍 {n} 張路標、站牌或告示來讀': 'Photograph and read {n|sign or notice|signs or notices}',
 '讀 {n} 份生活中的泰文訊息': 'Read {n|everyday message|everyday messages} in Thai',
 '存 {n} 個生活用得到的生字': 'Save {n|everyday word|everyday words}',
 '讀 {n} 則你有興趣的新聞': 'Read {n|news story|news stories} you’re interested in',
 '累積讀 {n} 則新聞（換個主題）': 'Read {n|news story|news stories} in total (vary the topics)',
 '加入 {n} 份你想看的影集或電影的字幕': 'Add the subtitles of {n|show or film|shows or films} you want to watch',
 '存 {n} 個台詞裡的生字': 'Save {n|word|words} from the dialogue',
 '累積讀 {n} 份字幕（換集數或換一部）': 'Read {n|subtitle file|subtitle files} in total (other episodes or titles)',
 '讀 {n} 段你想讀的文學作品': 'Read {n|passage|passages} of literature you want to read',
 '存 {n} 個文學裡的詞': 'Save {n|literary word|literary words}',
 '累積讀 {n} 段文學作品': 'Read {n|passage|passages} of literature in total',
 '讀 {n} 篇你專業領域的文章': 'Read {n|article|articles} in your field',
 '存 {n} 個專業術語': 'Save {n|technical term|technical terms}',
 '累積讀 {n} 篇專業文章': 'Read {n|article|articles} in your field in total',
 '讀 {n} 份正式公告或公文': 'Read {n|formal notice or document|formal notices or documents}',
 '存 {n} 個書面用語': 'Save {n|formal word|formal words}',
 # 每一關的做法
 '想讀什麼都可以：貼上文字或網址、匯入檔案或照片，或從讀物庫挑。': 'Anything you like: paste text or a link, import a file or photo, or pick from the library.',
 '短一點的比較輕鬆：貼上一句泰文、匯入照片，或從讀物庫挑一篇入門短文。': 'Short is easier: paste a Thai sentence, import a photo, or pick a starter text from the library.',
 '拍下真的菜單或招牌（用「匯入」選照片），或貼上菜名；找不到，就去讀物庫挑飲食短文。': 'Photograph a real menu or sign (use “Import” to pick the photo) or paste dish names. No luck? Pick a food text from the library.',
 '貼上景點、旅遊部落格或社群貼文的網址就能讀。': 'Paste the link of an attraction, travel blog or social post to read it.',
 '下次出門看到泰文，拍下來用「匯入」加進來。': 'Next time you see Thai when out, photograph it and add it with “Import”.',
 '購物頁、診所說明、室友訊息、公告…你實際會遇到的，貼上文字或拍照都可以。': 'Shopping pages, clinic notes, roommate messages, notices… whatever you actually meet. Paste text or take a photo.',
 '挑你本來就想知道的話題，貼上新聞網址就能讀。': 'Pick topics you already want to know about and paste the news link.',
 '換個主題（體育、娛樂、財經…），詞彙會不一樣。': 'Switch topics (sports, entertainment, finance…) and the vocabulary changes.',
 '匯入 .srt 或 .vtt 字幕檔；沒有字幕檔，也可以匯入影片，讓 App 辨識畫面上的字幕。': 'Import a .srt or .vtt subtitle file. No file? Import the video and the app will read the on-screen subtitles.',
 '貼上一段小說、散文或詩，或匯入電子書文字、PDF 或照片；想不到的話，讀物庫有文學與歷史短文。': 'Paste a passage of fiction, an essay or a poem, or import text, a PDF or a photo. Stuck? The library has literature and history pieces.',
 '每一段貼成一份文件，累積起來就算；同一本書分幾段、或換作者都可以。': 'Add each passage as its own document and they add up. Splitting one book or switching authors both work.',
 '貼上網址、匯入 PDF 或拍照都可以；挑你平常會讀的主題。': 'Paste a link, import a PDF or take a photo. Choose subjects you normally read about.',
 '同一個領域讀多幾篇，術語會一直重複出現，記得特別快。': 'Read several in the same field: the terms keep recurring, so they stick faster.',
 '政府或學校的公告、申請表、合約說明；貼上網址、匯入 PDF 或拍照都可以。': 'Government or school notices, application forms, contract notes. Paste a link, import a PDF or take a photo.',
 # 按鈕
 '匯入檔案或照片': 'Import a file or photo', '匯入照片': 'Import a photo', '匯入字幕檔或影片': 'Import subtitles or a video',
 '貼上文字或網址': 'Paste text or a link', '貼上網址': 'Paste a link', '從讀物庫挑一篇': 'Pick from the library',
}

# ===== 寫出 =====
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data[k] = v
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v39 ok')
