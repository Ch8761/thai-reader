import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
CSS = ''
EN = {}
# 1.46 加到主畫面的視窗：右上角可以關閉，也有「先在瀏覽器裡用」按鈕
rep('''    var h = el('h2', '', "先把 ไทย Reader 加到主畫面"); h.id = 'igTitle'; box.appendChild(h);
''', '''    var h = el('h2', '', "先把 ไทย Reader 加到主畫面"); h.id = 'igTitle'; box.appendChild(h);
    var ix = el('button', 'igx', '×'); ix.type = 'button'; ix.setAttribute('aria-label', "關閉，先在瀏覽器裡用"); ix.title = "關閉";
    ix.addEventListener('click', igFinish); box.appendChild(ix);
''')
rep('''      box.appendChild(el('p', 'ignote', "已經加過了？請從主畫面的圖示打開，不要在這裡繼續。"));
      var hp = el('div', 'ighelp');''', '''      box.appendChild(el('p', 'ignote', "已經加過了？請從主畫面的圖示打開。"));
      var sk = el('div', 'igskip');
      var sb = el('button', 'igskipbtn', "先在瀏覽器裡用"); sb.type = 'button'; sb.addEventListener('click', igFinish);
      sk.appendChild(sb);
      sk.appendChild(el('p', 'igskipnote', "之後還是可以加到主畫面。瀏覽器裡的資料不會自動跑過去，可以用「設定 → 資料與同步」搬。"));
      box.appendChild(sk);
      var hp = el('div', 'ighelp');''')
rep('''        var mo = el('div', 'igmore'); mo.appendChild(el('p', '', "① 請確認用的是 Safari（iPhone／iPad）或 Chrome（Android）。② 還是裝不起來的話，可以先在這個瀏覽器使用；但這裡的資料不會自動出現在主畫面的 App，之後要用「設定」裡的備份或雲端同步搬過去。"));
        var go = el('button', '', "先在這個瀏覽器使用"); go.type = 'button'; go.addEventListener('click', igFinish);
        var gw = el('div', 'btns'); gw.appendChild(go); mo.appendChild(gw); hp.appendChild(mo);''', '''        var mo = el('div', 'igmore'); mo.appendChild(el('p', '', "請確認用的是 Safari（iPhone／iPad）或 Chrome（Android）。在 LINE、Instagram 裡打開的話，要先換成這兩個瀏覽器。還是裝不起來，就先按上面的「先在瀏覽器裡用」。"));
        hp.appendChild(mo);''')
rep('''  function igOpen() { igRender(); igWrap.hidden = false; }
''', '''  function igOpen() { igRender(); igWrap.hidden = false; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !igWrap.hidden) { e.preventDefault(); igFinish(); } });
''')
CSS += """
.igcard { position: relative; }
.igcard h2 { padding-right: 40px; }
.igx { position: absolute; top: 8px; right: 8px; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 22px; background: transparent; color: var(--muted); font-size: 26px; line-height: 1; }
.igx:hover, .igx:focus-visible { background: var(--bg); color: var(--fg); }
.igskip { margin-top: 10px; padding-top: 14px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; }
.igskipbtn { width: 100%; min-height: 46px; border: 1px solid var(--line); border-radius: 12px; background: transparent; color: var(--fg); font-size: 15px; font-weight: 600; }
.igskipnote { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.55; text-align: center; }
"""
EN.update({
 '關閉，先在瀏覽器裡用': 'Close and use it in the browser',
 '關閉': 'Close',
 '已經加過了？請從主畫面的圖示打開。': 'Already added it? Open it from the Home Screen icon.',
 '先在瀏覽器裡用': 'Use it in the browser for now',
 '之後還是可以加到主畫面。瀏覽器裡的資料不會自動跑過去，可以用「設定 → 資料與同步」搬。': 'You can still add it to your Home Screen later. Data here won’t move over by itself; use Settings → Data & sync to move it.',
 '請確認用的是 Safari（iPhone／iPad）或 Chrome（Android）。在 LINE、Instagram 裡打開的話，要先換成這兩個瀏覽器。還是裝不起來，就先按上面的「先在瀏覽器裡用」。': 'Make sure you’re using Safari (iPhone/iPad) or Chrome (Android). If you opened it inside LINE or Instagram, switch to one of those browsers first. Still can’t install? Tap “Use it in the browser for now” above.',
})
if CSS:
    rep('</style>', CSS + '</style>')
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v54 ok')
