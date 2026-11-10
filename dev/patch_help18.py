p='ux_ui.js'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:60]; s=s.replace(a,b)
rep("""        d: ['按「文字框」，下面會出現大小、顏色、粗細和字體。', '點一個泰文詞：在它正上方加一個小註解。', '點空白處：放一段自由文字。', '點已經有的註解，可以改樣式，或拖曳「⠿」移動。彩色圓圈可以自訂顏色。'] },""",
"""        d: ['按「文字框」，下面會出現大小、顏色、粗細和字體。', '點一個泰文詞：在它正上方加一個小註解。', '點空白處：放一段自由文字。', '點已經有的註解，可以改樣式，或拖曳「⠿」移動。'] },
      { t: '我的顏色', s: '文字框的彩色圓圈：存自己常用的顏色', img: 'note-colors',
        d: ['文字框的顏色只放紅、黑、藍三個，彩色圓圈是「我的顏色」。', '按彩色圓圈，跳出你存的顏色，點一個就套用。', '按「＋」挑一個新顏色，它會留在這裡下次再用，最多存 50 種。', '按「編輯」，再點顏色就能刪掉；按「完成」結束。'],
        tip: '先點一下要改的文字框，再選顏色，就會改那一個。' },""")
rep("""      { t: '畫錯了', s: '按「↶ 上一步」，反悔了按「↷ 下一步」', img: 'note-undo',
        d: ['「↶ 上一步」：取消剛剛的動作，可以一直往回按。', '「↷ 下一步」：把剛剛取消的動作做回來。', '「清除全部」：刪掉這份文件所有的筆記，要按兩次才會刪；刪了也可以按「↶ 上一步」救回來。'],""",
"""      { t: '畫錯了', s: '按「↶」回到上一步，按「↷」做回來', img: 'note-undo',
        d: ['「↶」是上一步：取消剛剛的動作，可以一直往回按。', '「↷」是下一步：把剛剛取消的動作做回來。', '按鈕變淡，代表已經沒有可以退回或做回來的動作。', '「清除全部」：刪掉這份文件所有的筆記，要按兩次才會刪；刪了也可以按「↶」救回來。'],""")
rep("""      { t: '想再認一次', s: '按「重新辨識」', img: 'ocr-redo',
        d: ['App 更新了辨識功能後，按「重新辨識」用新版再認一次。', '沒被改到的頁面上的筆記會保留。'] }]],""",
"""      { t: '想再認一次', s: '按右上角的「↻」', img: 'ocr-redo',
        d: ['「↻」就是重新辨識，在右上角「匯出 PDF」的左邊。', '只有用文字辨識讀過的文件才會出現這個按鈕。', 'App 更新了辨識功能，或覺得錯字太多時，按「↻」再認一次。', '沒被改到的頁面上的筆記會保留。'] }]],""")
rep("""    ['閱讀', [
""", """    ['閱讀', [
      { t: '聽整篇朗讀', s: '按播放鍵，進度條可以拖', img: 'tts-bar',
        d: ['「▶」播放：從頭唸整篇；暫停過就從停下的地方接著唸。', '唸的時候按鈕變成「❚❚」，按一下暫停。', '拖動中間的進度條，可以跳到想聽的地方。', '「■」停止：停下來並回到開頭。', '最左邊的「慢速」：唸慢一點，播放中按也會馬上變慢。', '最右邊的「整篇翻譯」：把整篇分段打開 Google 翻譯。'],
        tip: '唸到一半點了某個詞的朗讀，整篇朗讀會暫停；再按「▶」就接著唸。' },
""")
open(p,'w',encoding='utf-8').write(s)

p='tests/helpshots.js'; s=open(p,encoding='utf-8').read()
rep("""  await shot('ocr-redo', '#docsec', ['#ocrRedo'], { pad: 12 });""","""  await shot('ocr-redo', '#view-doc .vhead', ['#ocrRedo'], { pad: 12 });""")
rep("""  await shot('note-undo', '.workbox .toolbar', ['#undo', '#redo'], { pad: 10 });""","""  await shot('note-undo', '.workbox .toolbar', ['#undo', '#redo'], { pad: 10 });
  await p.click('.tool[data-mode="box"]'); await p.waitForTimeout(150);
  await p.dispatchEvent('#boxCustom', 'pointerup'); await p.waitForTimeout(250);
  await shot('note-colors', '#toolhead', ['#boxCustom', '#cpop'], { pad: 10, union: '#cpop', maxH: 700 });
  await p.dispatchEvent('#boxCustom', 'pointerup'); await p.waitForTimeout(150);
  await p.click('.tool[data-mode="tap"]');""")
rep("    }, [ctxSel, targets]);", "    }, [ctxSel, targets]);\n    if (r && opts.union) { const u = await p.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, opts.union); const x0 = Math.min(r.x, u.x), y0 = Math.min(r.y, u.y), x1 = Math.max(r.x + r.w, u.x + u.w), y1 = Math.max(r.y + r.h, u.y + u.h); r.x = x0; r.y = y0; r.w = x1 - x0; r.h = y1 - y0; }")
open(p,'w',encoding='utf-8').write(s)
print('ok')
