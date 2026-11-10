# 在 build_pdf.py 之後執行：中文詞義、詞義語言設定、專有名詞、整篇翻譯分段
import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:90])
    s = s.replace(old, new)

# ---------- 字典換成含中文的版本 ----------
a = s.index('<script type="application/json" id="dictdata">') + len('<script type="application/json" id="dictdata">')
b = s.index('</script>', a)
dz = open(os.path.join(D, 'dictin/thai_dict_zh.json'), encoding='utf-8').read()
assert '</script' not in dz.lower()
s = s[:a] + dz + s[b:]

# ---------- 名字與地名清單（PyThaiNLP：名字 CC BY-SA 4.0，國名與府名 CC0） ----------
C = os.path.join(D, 'dl/pythainlp/pythainlp/corpus')
W = json.load(open(os.path.join(D, 'dictin/thai_dict.json'), encoding='utf-8'))['words']
def lines(fn):
    return [x.strip() for x in open(os.path.join(C, fn), encoding='utf-8') if x.strip() and not x.startswith('#')]
first = sorted({x for x in lines('person_names_male_th.txt') + lines('person_names_female_th.txt') if len(x) >= 3 and x not in W})
family = sorted({x for x in lines('family_names_th.txt') if len(x) >= 3 and x not in W})
places = sorted(set(lines('countries_th.txt')) | {x.split(',')[0] for x in lines('thailand_provinces_th.csv')})
NAMEDATA = '#first\n' + '\n'.join(first) + '\n#family\n' + '\n'.join(family) + '\n#place\n' + '\n'.join(places)
print('names', len(first), len(family), len(places))
rep('<script type="text/plain" id="lib-pdflib">', '<script type="text/plain" id="namedata">' + NAMEDATA + '</script>\n<script type="text/plain" id="lib-pdflib">')

# ---------- CSS ----------
CSS = r'''
a.ext.small { display: inline-flex; align-items: center; min-height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--accent); color: var(--accent); text-decoration: none; font-weight: 600; font-size: 14px; }
a.ext.small:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.trpanel { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }
.trlist { display: flex; flex-wrap: wrap; gap: 6px; max-height: 260px; overflow-y: auto; }
#translateAll[aria-expanded="true"] { border-color: var(--accent); color: var(--accent); font-weight: 600; }
.pop .zhline { font-size: 16px; line-height: 1.6; }
.pop ol.gl li.enfb { color: var(--muted); }
.pop ol.gl li.enfb::before { content: "（英）"; font-size: 12px; }
.pop .engl { display: block; color: var(--muted); font-size: 13px; }
.pop ol.gl.en2 { color: var(--muted); font-size: 13px; }
.pop .autotag { font-size: 11px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 0 6px; }
.ent-person, .ent-box-person { --ec: 219, 39, 119; }
.ent-org, .ent-box-org { --ec: 37, 99, 235; }
.ent-plan, .ent-box-plan { --ec: 22, 145, 74; }
.ent-work, .ent-box-work { --ec: 147, 51, 234; }
.ent-place, .ent-box-place { --ec: 214, 88, 12; }
.ent-foreign, .ent-box-foreign { --ec: 100, 116, 139; }
#text mark.ent:not(.hl):not(.pv) { background: rgba(var(--ec), 0.14); box-shadow: inset 0 -2px 0 rgba(var(--ec), 0.55); }
#text.pdf mark.ent:not(.hl):not(.pv) { background: rgba(var(--ec), 0.16); color: transparent; mix-blend-mode: multiply; box-shadow: inset 0 -1px 0 rgba(var(--ec), 0.7); }
.pop .ent-sec { background: rgba(var(--ec), 0.08); border-top: none; border-radius: 8px; padding: 8px 10px; }
.pop .enthead { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pop .enttag { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; color: #ffffff; background: rgb(var(--ec)); }
.pop .entname { font-family: var(--thai); font-size: 19px; font-weight: 600; }
.entlegend { display: flex; flex-wrap: wrap; gap: 6px; font-size: 13px; }
.entlegend span { padding: 1px 8px; border-radius: 999px; background: rgba(var(--ec), 0.14); box-shadow: inset 0 -2px 0 rgba(var(--ec), 0.55); }
'''
rep('</style>', CSS + '</style>')

# ---------- HTML ----------
rep('''    <a class="ext" id="translateAll" href="https://translate.google.com/" target="_blank" rel="noopener noreferrer">整篇翻譯（Google 翻譯）</a>''',
    '''    <button type="button" id="translateAll" aria-expanded="false" aria-controls="trpanel">整篇翻譯（Google 翻譯）</button>''')
rep('''  <div id="info" aria-live="polite">還沒有點任何字。</div>''', '''  <div id="trpanel" class="trpanel" hidden>
    <div class="label" id="trnote"></div>
    <div class="trlist" id="trlist"></div>
    <div id="trdoc" class="label" hidden>想一次翻整份 PDF：<a class="ext small" href="https://translate.google.com/?sl=th&amp;tl=zh-TW&amp;op=docs" target="_blank" rel="noopener noreferrer">開啟 Google 翻譯的「文件」</a> 再上傳同一個 PDF 檔。</div>
  </div>
  <div id="info" aria-live="polite">還沒有點任何字。</div>''')
rep('''    <div class="setrow">
      <div class="setlabel">歡迎視窗''', '''    <div class="setrow">
      <div class="setlabel">詞義語言<span class="sethelp">查詞視窗顯示中文、英文，或兩種都顯示。常用詞的中文是人工翻譯，其餘是自動對照。</span></div>
      <div class="seg" role="radiogroup" aria-label="詞義語言" id="glossGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">標示專有名詞<span class="sethelp">用淡色底標出推測的人名、機構、計畫、作品、地名與外來語。<span class="entlegend"><span class="ent-person">人名</span><span class="ent-org">機構</span><span class="ent-plan">計畫／政策</span><span class="ent-work">作品</span><span class="ent-place">地名</span><span class="ent-foreign">外來語</span></span></span></div>
      <div class="seg" role="radiogroup" aria-label="標示專有名詞" id="entGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">歡迎視窗''')
rep('''      <div class="setrow">
        <div class="setlabel">顯示拼音<span class="sethelp">查詞和例句旁是否顯示羅馬拼音，例如 sà-wàt-dii。</span></div>
        <div class="seg" role="radiogroup" aria-label="顯示拼音" id="wRom"></div>
      </div>''', '''      <div class="setrow">
        <div class="setlabel">顯示拼音<span class="sethelp">查詞和例句旁是否顯示羅馬拼音，例如 sà-wàt-dii。</span></div>
        <div class="seg" role="radiogroup" aria-label="顯示拼音" id="wRom"></div>
      </div>
      <div class="setrow">
        <div class="setlabel">詞義語言<span class="sethelp">查詞時看中文、英文，或兩種都看。</span></div>
        <div class="seg" role="radiogroup" aria-label="詞義語言" id="wGloss"></div>
      </div>''')
rep('<h2 id="h-welcome">歡迎！先設定兩件事</h2>', '<h2 id="h-welcome">歡迎！先設定三件事</h2>')

# ---------- JS ----------
rep("  var DICT = null, dictStatus = '載入中', showRom = true, lastPopSeg = null;",
    "  var DICT = null, dictStatus = '載入中', showRom = true, lastPopSeg = null, glossLang = 'zh';\n  try { glossLang = localStorage.getItem('thai-gloss-lang') || 'zh'; } catch (err) {}")
old_eb = s[s.index('  function entryBlock(word, list) {'):s.index('  function buildDictSection(seg) {')]
rep(old_eb, '''  function entryBlock(word, list) {
    var box = document.createElement('div');
    list.forEach(function (e) {
      var ent = document.createElement('div'); ent.className = 'ent';
      var meta = document.createElement('div'); meta.className = 'meta';
      var pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = POS_ZH[e[0]] || e[0] || '';
      var rom = document.createElement('span'); rom.className = 'rom'; rom.textContent = e[1] || '';
      meta.appendChild(pos);
      if (showRom && e[1]) { meta.appendChild(rom); }
      var en = e[3] || [], zh = e[4] || [], manual = e[5] === 1, hasZh = zh.some(Boolean);
      if (glossLang !== 'en' && hasZh && !manual) { var au = document.createElement('span'); au.className = 'autotag'; au.textContent = '中文自動對照'; meta.appendChild(au); }
      ent.appendChild(meta);
      if (manual && glossLang !== 'en') {
        var zl = document.createElement('div'); zl.className = 'zhline'; zl.textContent = zh[0];
        ent.appendChild(zl);
        if (glossLang === 'both') {
          var ol2 = document.createElement('ol'); ol2.className = 'gl en2'; ol2.lang = 'en';
          en.forEach(function (g) { var li = document.createElement('li'); li.textContent = g; ol2.appendChild(li); });
          ent.appendChild(ol2);
        }
      } else {
        var ol = document.createElement('ol'); ol.className = 'gl';
        en.forEach(function (g, i) {
          var li = document.createElement('li'), z = zh[i];
          if (glossLang === 'en' || !z) { li.textContent = g; li.lang = 'en'; if (glossLang !== 'en') { li.className = 'enfb'; } }
          else if (glossLang === 'zh') { li.textContent = z; }
          else { li.textContent = z; var sp = document.createElement('span'); sp.className = 'engl'; sp.lang = 'en'; sp.textContent = g; li.appendChild(sp); }
          ol.appendChild(li);
        });
        ent.appendChild(ol);
      }
      box.appendChild(ent);
    });
    return box;
  }
  function shortGloss(w) {
    var e = DICT[w] && DICT[w][0];
    if (!e) { return ''; }
    var zh = (e[4] || []).filter(Boolean)[0];
    if (glossLang !== 'en' && zh) { return zh; }
    return (e[3] || [])[0] || '';
  }
''')
rep("      also.appendChild(document.createTextNode('　' + ((DICT[w][0][3] || [])[0] || '')));",
    "      also.appendChild(document.createTextNode('　' + shortGloss(w)));")
old_cr = s[s.index("    var cr = document.createElement('div'); cr.className = 'credit'; cr.textContent = '詞義來源："):]
old_cr = old_cr[:old_cr.index('\n') + 1]
rep(old_cr, "    var cr = document.createElement('div'); cr.className = 'credit'; cr.textContent = '詞義：Wiktionary（CC BY-SA，經 kaikki.org 整理）。中文：常用詞為人工翻譯，其餘由 ECDICT 與 WordNet 自動對照，僅供參考。';\n")
# settings
rep('''    segButtons($('romGroup'), [['on', '顯示'], ['off', '不顯示']], showRom ? 'on' : 'off', function (v) {
      if ((v === 'on') !== showRom) { toggleRom(); }
    });''', '''    segButtons($('romGroup'), [['on', '顯示'], ['off', '不顯示']], showRom ? 'on' : 'off', function (v) {
      if ((v === 'on') !== showRom) { toggleRom(); }
    });
    segButtons($('glossGroup'), GLOSS_OPTS, glossLang, function (v) { setGlossLang(v); });
    if (typeof showEnts !== 'undefined') {
      segButtons($('entGroup'), [['on', '標示'], ['off', '不標示']], showEnts ? 'on' : 'off', function (v) {
        showEnts = v === 'on'; try { localStorage.setItem('thai-show-ents', showEnts ? '1' : '0'); } catch (err) {}
        renderSettings(); renderText(); renderReport();
      });
    }''')
rep("  function syncRomToggle() { renderSettings(); }", '''  var GLOSS_OPTS = [['zh', '中文'], ['en', '英文'], ['both', '中英都顯示']];
  function setGlossLang(v) {
    glossLang = v; try { localStorage.setItem('thai-gloss-lang', v); } catch (err) {}
    renderSettings();
    if (!$('welcome').hidden) { renderWelcome(); }
    if (!$('pop').hidden && lastPopSeg) { showPop(lastPopSeg); }
    renderReport();
  }
  function syncRomToggle() { renderSettings(); }''')
rep('''    segButtons($('wRom'), [['on', '顯示'], ['off', '不顯示']], showRom ? 'on' : 'off', function (v) {
      if ((v === 'on') !== showRom) { toggleRom(); }
      renderWelcome();
    });''', '''    segButtons($('wRom'), [['on', '顯示'], ['off', '不顯示']], showRom ? 'on' : 'off', function (v) {
      if ((v === 'on') !== showRom) { toggleRom(); }
      renderWelcome();
    });
    segButtons($('wGloss'), GLOSS_OPTS, glossLang, function (v) { setGlossLang(v); });''')
# marks for entities
rep('''    state.boxes.forEach(function (b) { if (b.a) { marks.push({ s: b.a[0], e: b.a[1], c: 'anno anno-' + ((b.s && b.s.color) || 'red') }); } });
    return marks;''', '''    state.boxes.forEach(function (b) { if (b.a) { marks.push({ s: b.a[0], e: b.a[1], c: 'anno anno-' + ((b.s && b.s.color) || 'red') }); } });
    if (typeof showEnts !== 'undefined' && showEnts && typeof getEnts === 'function') { getEnts().forEach(function (en) { marks.push({ s: en.s, e: en.e, c: 'ent ent-' + en.type }); }); }
    return marks;''')
# popup: entity section + translate sentence
rep('''    var d = buildDictSection(seg);''', '''    var d = buildDictSection(seg);
    var en0 = entityAt(seg.i);''')
rep('''    pop.appendChild(x); pop.appendChild(head); pop.appendChild(d);''', '''    var sr = sentenceAround(seg.i), trs = document.createElement('a');
    trs.className = 'ext'; trs.target = '_blank'; trs.rel = 'noopener noreferrer'; trs.textContent = '翻譯這句';
    trs.href = trUrl(state.text.slice(sr[0], sr[1]).trim().slice(0, 600));
    links.appendChild(trs);
    pop.appendChild(x); pop.appendChild(head);
    if (en0) { pop.appendChild(buildEntitySection(en0)); }
    pop.appendChild(d);''')
# remove old refreshTranslateLink
old_rtl = s[s.index('  function refreshTranslateLink() {'):]
old_rtl = old_rtl[:old_rtl.index('  }\n') + 4]
rep(old_rtl, '')
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'ner_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")
# report
rep('''    lines.push('句型庫：''', '''    lines.push('詞義語言：' + ({ zh: '中文', en: '英文', both: '中英都顯示' })[glossLang] + '；專有名詞標示：' + (typeof showEnts === 'undefined' ? '檢查中' : (showEnts ? '開' : '關')));
    if (typeof getEnts === 'function' && entsReady) {
      var es = getEnts(), cnt = {};
      es.forEach(function (x) { cnt[x.type] = (cnt[x.type] || 0) + 1; });
      lines.push('專有名詞：共 ' + es.length + ' 個（' + Object.keys(cnt).map(function (k) { return ENT_TYPES[k] + ' ' + cnt[k]; }).join('、') + '）；例：' + es.slice(0, 12).map(function (x) { return x.t + '=' + ENT_TYPES[x.type].slice(0, 2); }).join('、'));
    }
    lines.push('句型庫：''')
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
