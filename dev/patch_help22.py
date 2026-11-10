p='ux_ui.js'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:60]; s=s.replace(a,b)
s=s.replace('「＋ 加入圖片」', '「＋ 圖片／影片」')
rep("""        d: ['按「螢光筆」，下面會出現顏色和樣式。', '選顏色；彩色圓圈是「我的顏色」，可以存自己常用的顏色。', '「整塊」是塗滿底色，「底線」是只畫在字的下面。', '手指或 Pencil 從第一個字劃到最後一個字，放開就畫好了。', '想取消：點一下畫過的地方。'] },""",
"""        d: ['按「螢光筆」，下面會出現顏色和樣式。', '點顏色就用那個顏色；再點一次正在用的顏色可以換掉它。', '「整塊」是塗滿底色，「底線」是只畫在字的下面。', '手指或 Pencil 從第一個字劃到最後一個字，放開就畫好了。', '只點一下（不拖）是查詞；想取消螢光筆，在查詞視窗按「取消螢光筆」。'] },""")
rep("""        d: ['按「手寫」，下面會出現顏色和「細／中／粗」；彩色圓圈是「我的顏色」。', '直接在頁面上寫字或畫線。', '兩根手指可以縮放，不會畫出線。',""",
"""        d: ['按「手寫」，下面會出現「筆／橡皮擦」、顏色和「細／中／粗」。', '直接在頁面上寫字或畫線。', '要擦掉：選「橡皮擦」，碰到的那一整筆就會擦掉；擦錯了按「↶」。', '手指點一下泰文（沒有畫出線）就是查詞。', '兩根手指可以縮放，不會畫出線。',""")
rep("""      { t: '翻譯一整段', s:""","""      { t: '邊查邊做筆記', s: '查詞視窗按「畫螢光筆」或「加註解」', img: 'pop-notes',
        d: ['在「點字」模式點一個詞，查詞視窗裡有「畫螢光筆」和「加註解」。', '「畫螢光筆」：用目前的螢光筆顏色畫這個詞；再按一次就取消。', '「加註解」：在這個詞上面加一個文字框，直接打字。會切到「文字框」工具，寫完按「點字」回來。', '用螢光筆、手寫工具時，點一下詞也能查詞。'] },
      { t: '翻譯一整段', s:""")
rep("""      { t: '圖片會自動認字',""","""      { t: '影片的字幕', s: '按「＋ 圖片／影片」選有泰文字幕的影片', img: '',
        d: ['選一部影片（照片 App 或「檔案」App 裡的都可以）。', 'App 會每秒看一次畫面，畫面換了就讀一次上面的泰文，最後整理成一份文字文件。', '同一句字幕只會留一次；畫面上其他的泰文也可能被讀進來。', '3 分鐘的影片大約要 1–5 分鐘，中途可以按「停止」，已經讀到的會保留。'],
        tip: 'IG、YouTube 的連結不能直接讀：先用 iPad 的「螢幕錄影」把影片錄下來，再加入那段錄影。' },
      { t: '圖片會自動認字',""")
rep("""        d: ['選題型：看泰文選意思、看意思選泰文、聽發音選泰文。',""","""        d: ['選題型：看泰文選意思、看意思選泰文、聽發音選泰文；打開「聲調學習模式」還有「聲調與子音」。',""")
rep("""      { t: '換字體',""","""      { t: '聲調學習模式', s: '「聲調學習模式」選「開」', img: 'tone-pop',
        d: ['打開後，點一個詞，查詞視窗會多一塊「聲調」。', '每個音節：聲調（顏色和音高線）、起首子音是中／高／低子音。', '下面一行一行說明怎麼推出聲調，例如「ร 低子音＋ไม้โท → 高聲」；不照規則唸的會標「例外」。', '按「看聲調規則表」可以看整張表。', '生字卡詳解、複習的答案也會顯示；測驗會穿插聲調題。'],
        tip: '聲調資料第一次打開要連網下載。' },
      { t: '換字體',""")
open(p,'w',encoding='utf-8').write(s)
p='tone_ui.js'; s=open(p,encoding='utf-8').read()
s=s.replace("var MARK_NAME = { 1: 'ไม้เอก（่）', 2: 'ไม้โท（้）', 3: 'ไม้ตรี（๊）', 4: 'ไม้จัตวา（๋）' };","var MARK_NAME = { 1: 'ไม้เอก ◌่', 2: 'ไม้โท ◌้', 3: 'ไม้ตรี ◌๊', 4: 'ไม้จัตวา ◌๋' };")
open(p,'w',encoding='utf-8').write(s)
p='tests/helpshots.js'; s=open(p,encoding='utf-8').read()
a="""  await shot('sel-pop', '#selpop', ['#spTr'], { tight: 14 });"""
assert a in s
s=s.replace(a, """  await p.evaluate(() => window.__ev("(function(){ var i = state.text.indexOf('ใหม่'); if (i < 0) i = state.text.indexOf('ละคร'); showPop(segAt(i + 1)); return 1; })()")); await p.waitForTimeout(300);
  await shot('pop-notes', '#pop', ['#pop .popnotes'], { pad: 8, maxH: 700 });
  await p.evaluate(() => { localStorage.setItem('thai-tone-mode', '1'); window.__ev("toneMode = true; loadTones()"); }); await p.waitForTimeout(800);
  await p.evaluate(() => window.__ev("(function(){ var i = state.text.indexOf('ละคร'); showPop(segAt(i + 1)); return 1; })()")); await p.waitForTimeout(500);
  await shot('tone-pop', '#pop', ['#pop .tonesec'], { pad: 8, maxH: 900 });
  await p.evaluate(() => { localStorage.setItem('thai-tone-mode', '0'); window.__ev("toneMode = false; 1"); });
  await p.click('#pop .x').catch(() => {});
""" + a)
open(p,'w',encoding='utf-8').write(s)
print('ok')
