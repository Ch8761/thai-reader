import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:100]); s = s.replace(old, new)

rep("  var POS_ZH = { noun: '名詞',", "  var POS_ZH = { slang: '網路用語／口語', noun: '名詞',")
rep("  function entryBlock(word, list) {", open(os.path.join(D, 'slang_ui.js'), encoding='utf-8').read() + "  function entryBlock(word, list) {")
rep("        DICT = dd.words || dd;\n", "        DICT = dd.words || dd;\n        addSlang();\n")
rep("    if (typeof gazMerge === 'function') { out = gazMerge(str, out); }\n", "    if (typeof gazMerge === 'function') { out = gazMerge(str, out); }\n    out = mergeElong(out);\n")
rep("  function known(t) { return !!(DICT && DICT[t]); }", "  function known(t) { return !!(DICT && (DICT[t] || dictBase(t))); }")
# 查詞：拉長的寫法
rep("""    } else if (hits) { wrapD.appendChild(entryBlock(seg.t, hits)); }
    else { var no = document.createElement('div'); no.textContent = '內建字典裡沒有這個詞，可以用下面的按鈕查。'; wrapD.appendChild(no); }""",
"""    } else if (hits) { wrapD.appendChild(entryBlock(seg.t, hits)); }
    else if (dictBase(key0)) {
      var bw = dictBase(key0), lab3 = document.createElement('div'); lab3.className = 'also';
      lab3.appendChild(document.createTextNode('拉長的寫法（加強語氣或撒嬌），原本的詞：'));
      var sp4 = document.createElement('span'); sp4.lang = 'th'; sp4.textContent = bw; lab3.appendChild(sp4);
      wrapD.appendChild(lab3); wrapD.appendChild(entryBlock(bw, DICT[bw])); hits = true;
    }
    else { var no = document.createElement('div'); no.textContent = '內建字典裡沒有這個詞，可以用下面的按鈕查。'; wrapD.appendChild(no); }""")
rep("      var base = key0.replace(/\\s*ๆ$/, '');", "      var base = key0.replace(/(\\s*ๆ)+$/, '');")
# 點到 555
rep("""$('info').textContent = '你點到「' + s.t + '」，這不是泰文詞。'; return; }""",
    """$('info').textContent = /^[5๕]{3,}$/.test(s.t) ? '你點到「' + s.t + '」：泰國網路用語，5 的泰文唸 hâa，555 就是「哈哈哈」。' : '你點到「' + s.t + '」，這不是泰文詞。'; return; }""")
data = open(os.path.join(D, 'dictin', 'slang.txt'), encoding='utf-8').read().strip()
assert '</' not in data
i = s.index('<script type="text/plain" id="lib-pdflib">')
s = s[:i] + '<script type="text/plain" id="slangdata">' + data + '</script>\n' + s[i:]
rep('''    lines.push('句型庫：''', '''    lines.push('網路用語：' + SLANG_N + ' 個');
    lines.push('句型庫：''')
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))

# ---------- 外觀：一打開就套用（不等整頁讀完），另存一份在 IndexedDB ----------
s = open(src, encoding='utf-8').read()
def rep2(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:100]); s = s.replace(old, new)
rep2('<style>\n/* Layout:', '''<script>try{var t0=localStorage.getItem('thai-theme');if(t0==='light'||t0==='dark'){document.documentElement.setAttribute('data-theme',t0);}}catch(e){}</script>
<style>
/* Layout:''')
rep2('''  function applyTheme() {
    if (theme === 'light' || theme === 'dark') { document.documentElement.setAttribute('data-theme', theme); }
    else { document.documentElement.removeAttribute('data-theme'); }''', '''  function applyTheme() {
    if (theme === 'light' || theme === 'dark') { document.documentElement.setAttribute('data-theme', theme); }
    else { document.documentElement.removeAttribute('data-theme'); }
    /* iPad 最上方狀態列的底色跟著外觀 */
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
      if (!m.dataset.orig) { m.dataset.orig = m.content; }
      m.content = theme === 'light' ? '#f5eedf' : theme === 'dark' ? '#1e2125' : m.dataset.orig;
    });''')
rep2('''      theme = v; try { localStorage.setItem(THEME_KEY, v); } catch (err) {} applyTheme(); renderTheme(); renderReport();''',
     '''      theme = v; try { localStorage.setItem(THEME_KEY, v); } catch (err) {} try { idbPut('setting:theme', v); } catch (err) {} applyTheme(); renderTheme(); renderReport();''')
rep2('''  renderTheme();
''', '''  renderTheme();
  /* 備援：如果這台裝置的 localStorage 被清掉，從 IndexedDB 找回外觀設定 */
  try {
    if (!localStorage.getItem(THEME_KEY)) {
      idbGet('setting:theme').then(function (v) {
        if (v === 'light' || v === 'dark' || v === 'system') { theme = v; try { localStorage.setItem(THEME_KEY, v); } catch (err) {} applyTheme(); renderTheme(); }
      }, function () {});
    } else { idbPut('setting:theme', theme); }
  } catch (err) {}
''')
open(src, 'w', encoding='utf-8').write(s)
print('theme ok')
