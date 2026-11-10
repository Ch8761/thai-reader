import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)
# ---------- 1.19 照片、菜單：讀不到多少字時換版面模式再讀 ----------
O2 = open(os.path.join(D, 'ocr2_ui.js'), encoding='utf-8').read()
rep('  function armed(btn, label, confirmLabel, action) {\n', O2 + '  function armed(btn, label, confirmLabel, action) {\n')
rep("""        var res = await w.recognize(c, {}, { blocks: true, text: false, hocr: false, tsv: false });
        c.width = 0; c.height = 0;
        var got = ocrItems(res.data, cw);""", """        var got = await ocrBest(w, c, cw);
        c.width = 0; c.height = 0;""")
# 同一行裡隔很遠的字（菜單左右兩欄）不要黏成一個詞，不然點字的位置會對不上
rep("            if (cur && !space) { cur.t += wt; cur.x1 = Math.max(cur.x1, w.bbox.x1); }",
    "            if (cur && !space && w.bbox.x0 - cur.x1 > 0.8 * h) { space = true; }\n            if (cur && !space) { cur.t += wt; cur.x1 = Math.max(cur.x1, w.bbox.x1); }")
# 使用說明
rep("'選好照片後會先出現「調整照片」：拖曳四個黃色圓點，框住要讀的招牌或菜單。',", "'選好照片後會先出現「調整照片」：黃底、紅底這類顏色鮮豔的招牌或菜單，App 會自動框好；不對就拖曳四個黃色圓點重新框。',")
rep("'App 會先找字幕在畫面的哪裡，用黃框框起來。框得不對，就用手指在畫面上重新框住字幕；拉下面的滑桿可以換一個有字幕的畫面看。',", "'App 會先找字幕在畫面的哪裡，用黃框框起來；字幕會換位置的影片（例如廣告的大字）會框大一點。IG 的帳號名、說明文字這些一直不變的介面文字會自動略過。框得不對，就用手指在畫面上重新框住字幕；拉下面的滑桿可以換一個有字幕的畫面看。',")
rep("'按「開始讀字幕」。App 每秒看一次框裡的畫面，字幕換了就讀一次，最後整理成一份文字文件。',", "'按「開始讀字幕」。App 每半秒到一秒看一次框裡的畫面，字幕換了就讀一次，最後整理成一份文字文件。白字、黃底黑字、鮮豔的黃色大字都讀得到；夾在字幕裡的中文字會略過。',")
open(src, 'w', encoding='utf-8').write(s)
print('v29 ok')
