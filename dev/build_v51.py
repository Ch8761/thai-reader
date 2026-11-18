import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v51_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

CSS = ''
EN = {}
rep("""      g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(o.url);
      var blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.88); });""", """      g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(o.url);
      c = deskewCanvas(c);
      var blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.88); });""")
rep("""      <div class="seg" role="radiogroup" aria-label="閱讀時收起工具列" id="immGroup"></div>
    </div>
""", """      <div class="seg" role="radiogroup" aria-label="閱讀時收起工具列" id="immGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">照片自動轉正<span class="sethelp">加入照片時，先找出字歪了幾度再轉正，辨識會比較準。最多轉 12 度；看不出是文字的照片（風景、表格）不會動。</span></div>
      <div class="seg" role="radiogroup" aria-label="照片自動轉正" id="deskewGroup"></div>
    </div>
""")
rep("'unkGroup', 'immGroup', 'ocrPreBtn']]", "'unkGroup', 'immGroup', 'deskewGroup', 'ocrPreBtn']]")
rep("'thai-known-w', 'thai-mix-hide', 'thai-immersive',", "'thai-known-w', 'thai-mix-hide', 'thai-immersive', 'thai-deskew',", 2)
rep("'thai-known-w', 'thai-mix-hide', 'thai-immersive'];", "'thai-known-w', 'thai-mix-hide', 'thai-immersive', 'thai-deskew'];")
EN.update({'照片自動轉正': 'Straighten photos automatically', '加入照片時，先找出字歪了幾度再轉正，辨識會比較準。最多轉 12 度；看不出是文字的照片（風景、表格）不會動。': 'When you add a photo, the app finds how tilted the text is and straightens it first, which makes recognition more accurate. Up to 12°; photos that don’t look like text (scenery, tables) are left alone.'})
#@@MORE@@
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v51 ok')
