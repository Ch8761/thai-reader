p='ux_ui.js'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:60]; s=s.replace(a,b)
rep("""設定頁的「我的專有名詞」可以刪除。'] }]],""","""設定頁的「我的專有名詞」可以刪除。'] },
      { t: '翻譯一整段', s: '長按一個字，不放開，拖到最後一個字', img: 'sel-pop',
        d: ['確認工具列選的是「點字」。', '手指長按第一個字（約半秒），不要放開，拖到最後一個字再放開。用 Pencil 可以直接拖。', '下方會跳出這段文字和中文翻譯。', '還可以「朗讀」「複製」「畫螢光筆」，或「在 Google 翻譯打開」。'],
        tip: '直接翻譯需要網路。' }]],
    ['閱讀', [
      { t: '放大縮小', s: '兩指縮放，或按「符合螢幕 ▾」選比例', img: 'view-zoom',
        d: ['兩根手指在文件上張開、捏合，就能放大縮小。用螢光筆、手寫時也可以。', '或按工具列右下的「符合螢幕 ▾」，選「符合螢幕」「符合寬度」或 125%、150%、200%。', '「符合螢幕」：一整頁剛好放進畫面（打開文件時的預設）。「符合寬度」：左右剛好塞滿。'],
        tip: '放大後，文件可以左右滑動看兩邊。' },
      { t: '捲動或翻頁', s: '在同一個選單選「上下捲動」或「左右翻頁」', img: 'view-menu',
        d: ['「上下捲動」：所有頁面接在一起，往下滑就是下一頁。', '「左右翻頁」：一次看一頁，往左滑是下一頁、往右滑是上一頁，也可以按「‹」「›」。', '翻頁的滑動只在「點字」時有效；畫螢光筆、手寫時請按「‹」「›」。'] },
      { t: '跳到某一頁', s: '點中間的頁碼，打數字', img: 'view-page',
        d: ['點「1 / 12」這樣的頁碼。', '打要去的頁數，按鍵盤的「前往」或 Enter。'] },
      { t: '接著上次讀', s: '不用做什麼，App 會記住', img: '',
        d: ['每份文件會記住你讀到第幾頁、讀到頁面的哪裡。', '下次打開同一份文件，會自動回到那裡。'] }]],""")
rep("""        d: ['按「螢光筆」。', '手指或 Pencil 從第一個字劃到最後一個字，放開就變黃。', '想取消：點一下黃色的地方。'] },""",
"""        d: ['按「螢光筆」，下面會出現顏色和樣式。', '選顏色；最後一個彩色圓圈可以自訂任何顏色。', '「整塊」是塗滿底色，「底線」是只畫在字的下面。', '手指或 Pencil 從第一個字劃到最後一個字，放開就畫好了。', '想取消：點一下畫過的地方。'] },""")
rep("""      { t: '手寫', s: '選「手寫」，用 Apple Pencil 寫', img: 'note-ink',
        d: ['按「手寫」，直接在頁面上寫字或畫線。', '打開「只用 Pencil 畫」：只有 Pencil 會畫線，手指滑動是捲動頁面，比較不會誤畫。'] },""",
"""      { t: '手寫', s: '選「手寫」，選顏色和粗細再寫', img: 'note-ink',
        d: ['按「手寫」，下面會出現顏色和「細／中／粗」。', '直接在頁面上寫字或畫線。', '兩根手指可以縮放，不會畫出線。', '打開「只用 Pencil 畫」：只有 Pencil 會畫線，一根手指滑動是捲動頁面，比較不會誤畫。'] },""")
rep("""        d: ['按「文字框」。', '點一個泰文詞：在它正上方加一個小註解。', '點空白處：放一段自由文字。', '點已經有的註解，可以改顏色、大小，或拖曳「⠿」移動。'] },""",
"""        d: ['按「文字框」，下面會出現大小、顏色、粗細和字體。', '點一個泰文詞：在它正上方加一個小註解。', '點空白處：放一段自由文字。', '點已經有的註解，可以改樣式，或拖曳「⠿」移動。彩色圓圈可以自訂顏色。'] },""")
rep("""      { t: '畫錯了', s: '按「復原」', img: 'note-undo',
        d: ['「復原」：取消上一個動作，可以一直按。', '「清除全部」：刪掉這份文件所有的筆記，要按兩次才會刪。'],""",
"""      { t: '畫錯了', s: '按「↶ 上一步」，反悔了按「↷ 下一步」', img: 'note-undo',
        d: ['「↶ 上一步」：取消剛剛的動作，可以一直往回按。', '「↷ 下一步」：把剛剛取消的動作做回來。', '「清除全部」：刪掉這份文件所有的筆記，要按兩次才會刪；刪了也可以按「↶ 上一步」救回來。'],""")
rep("""        d: ['「跟隨系統」：照 iPad 的淺色／深色自動切換。', '「淺色」「深色」：固定不變。'] },""",
"""        d: ['「跟隨系統」：照 iPad 的淺色／深色自動切換。', '「淺色」「深色」：固定不變。'] },
      { t: '換字體', s: '「中文字體」選喜歡的字', img: 'set-font',
        d: ['「蘋方」：iPad 內建的黑體，最清楚（預設）。', '「思源黑體」：線條較均勻的黑體。', '「思源宋體」：像書本的明體。', '「霞鶩文楷」：像手寫的楷體，比較柔和。', '只改按鈕和說明的中文字，泰文字不變。'],
        tip: '思源字體和文楷第一次要連網下載。' },""")
open(p,'w',encoding='utf-8').write(s)

p='tests/helpshots.js'; s=open(p,encoding='utf-8').read()
rep("""  await p.click('#pop .x').catch(() => {});

  // ---------- 筆記 ----------""","""  await p.click('#pop .x').catch(() => {});
  { const a = await p.evaluate(() => { const el = document.getElementById('text'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode())) { const i = node.textContent.indexOf('เธอบอกว่า'); if (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 28); const rs = r.getClientRects(); const b = rs[0]; return { x0: b.left + 2, x1: b.right - 4, y: b.top + b.height / 2 }; } } });
    await p.mouse.move(a.x0, a.y); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(a.x0 + (a.x1 - a.x0) * i / 10, a.y); } await p.mouse.up(); await p.waitForTimeout(800); }
  await p.evaluate(() => { const t = document.getElementById('spTr'); t.className = 'sp-tr'; t.textContent = '她說很累，但是很好玩'; });
  await shot('sel-pop', '#selpop', ['#spTr'], { tight: 14 });
  await p.click('#spClose');

  // ---------- 筆記 ----------""")
rep("""  await shot('note-hl', '.workbox', ['.tool[data-mode="hl"]', '#text .hl'], { pad: 6, maxH: 300 });""","""  await shot('note-hl', '.workbox', ['.tool[data-mode="hl"]', '#toolopts', '#text .hl'], { pad: 6, maxH: 360 });""")
rep("""  await shot('note-ink', '.workbox', ['.tool[data-mode="ink"]'], { pad: 6, maxH: 300 });""","""  await shot('note-ink', '.workbox', ['.tool[data-mode="ink"]', '#toolopts'], { pad: 6, maxH: 360 });""")
rep("""  await shot('note-box', '.workbox .toolbar', ['.tool[data-mode="box"]'], { pad: 10 });
  await shot('note-undo', '.workbox .toolbar', ['#undo', '#clear'], { pad: 10 });""","""  await shot('note-box', '#toolhead', ['.tool[data-mode="box"]', '#stylebar'], { pad: 10 });
  await shot('note-undo', '.workbox .toolbar', ['#undo', '#redo'], { pad: 10 });""")
rep("""  await shot('ocr-redo', '#docsec', ['#ocrRedo'], { pad: 12 });""","""  await shot('ocr-redo', '#docsec', ['#ocrRedo'], { pad: 12 });

  // ---------- 閱讀 ----------
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await shot('view-zoom', '#toolhead', ['#vbZoom'], { pad: 10 });
  await shot('view-page', '#toolhead', ['#vbPage'], { pad: 10 });
  await p.click('#vbZoom'); await p.waitForTimeout(200);
  await shot('view-menu', '#vbMenu', ['#vbMenu button@@左右翻頁'], { tight: 14 });
  await p.click('#vbZoom');""")
rep("""  await shot('set-theme', '#themeGroup^^.setrow', ['#themeGroup'], { pad: 10 });""","""  await shot('set-theme', '#themeGroup^^.setrow', ['#themeGroup'], { pad: 10 });
  await shot('set-font', '#fontGroup^^.setrow', ['#fontGroup'], { pad: 10 });""")
open(p,'w',encoding='utf-8').write(s)
print('ok')
