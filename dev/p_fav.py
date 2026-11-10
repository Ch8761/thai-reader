p='tools_ui.js'; s=open(p,encoding='utf-8').read()
def rep(a,b,c=1):
    global s; assert s.count(a)==c,(s.count(a),a[:70]); s=s.replace(a,b)
# favourites
rep("""  function saveTools() {""","""  if (!Array.isArray(toolPrefs.hlFav) || toolPrefs.hlFav.length !== 3) { toolPrefs.hlFav = HL_COLORS.map(function (c) { return c[0]; }); }
  if (!Array.isArray(toolPrefs.inkFav) || toolPrefs.inkFav.length !== 3) { toolPrefs.inkFav = INK_COLORS.map(function (c) { return c[0]; }); }
  if (!Array.isArray(toolPrefs.boxFav) || toolPrefs.boxFav.length !== 3) { toolPrefs.boxFav = ['red', 'black', 'blue']; }
  var COLOR_NAMES = { '#ffd400': '黃', '#7ddc7d': '綠', '#ff9cc2': '粉紅', '#1f4fd1': '藍（預設）', '#26332e': '黑', '#d63b3b': '紅', red: '紅', black: '黑', blue: '藍', green: '綠', purple: '紫', orange: '橘' };
  function colorCss(c) { return c === INK_COLORS[0][0] ? 'var(--ink)' : (/^#/.test(c) ? c : 'var(--c-' + c + ')'); }
  function saveTools() {""")
rep("""      HL_COLORS.forEach(function (c) { toolOpts.appendChild(swatch(c[0], c[1], toolPrefs.hlColor === c[0], function (v) { toolPrefs.hlColor = v; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(myColorBtn('hl', 'hlCustom', '螢光筆：我的顏色', toolPrefs.hlColor, HL_COLORS.map(function (c) { return c[0]; })));""",
"""      toolPrefs.hlFav.forEach(function (c) { toolOpts.appendChild(swatch(c, COLOR_NAMES[c] || c, toolPrefs.hlColor === c, function (v) { toolPrefs.hlColor = v; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(myColorBtn('hl', 'hlCustom', '螢光筆：我的顏色', toolPrefs.hlColor, toolPrefs.hlFav));""")
rep("""      INK_COLORS.forEach(function (c, k) { toolOpts.appendChild(swatch(k ? c[0] : 'var(--ink)', c[1], toolPrefs.inkColor === c[0], function () { toolPrefs.inkColor = c[0]; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(myColorBtn('ink', 'inkCustom', '手寫：我的顏色', toolPrefs.inkColor, INK_COLORS.map(function (c) { return c[0]; })));""",
"""      toolPrefs.inkFav.forEach(function (c) { var b = swatch(colorCss(c), COLOR_NAMES[c] || c, toolPrefs.inkColor === c, function () { toolPrefs.inkColor = c; saveTools(); renderToolOpts(); }); toolOpts.appendChild(b); });
      toolOpts.appendChild(myColorBtn('ink', 'inkCustom', '手寫：我的顏色', toolPrefs.inkColor, toolPrefs.inkFav));""")
rep("""    b.style.setProperty('--sw', on ? cur : 'transparent');""","""    b.style.setProperty('--sw', on ? colorCss(cur) : 'transparent');""")
# CP config: favs
rep("""    box: { list: 'boxColors', btn: 'boxCustom', last: 'boxCustom' },
    hl: { list: 'hlColors', btn: 'hlCustom', last: 'hlCustom' },
    ink: { list: 'inkColors', btn: 'inkCustom', last: 'inkCustom' }""","""    box: { list: 'boxColors', btn: 'boxCustom', last: 'boxCustom', fav: 'boxFav' },
    hl: { list: 'hlColors', btn: 'hlCustom', last: 'hlCustom', fav: 'hlFav' },
    ink: { list: 'inkColors', btn: 'inkCustom', last: 'inkCustom', fav: 'inkFav' }""")
rep("""cpKind = 'box', cpPicking = false, cpPending = null;""","""cpKind = 'box', cpPicking = false, cpPending = null, cpSlot = null;""")
# box: three outside buttons follow boxFav
rep("""  function boxColorHex(c) {""","""  function renderBoxFavs() {
    if (!styleBarEl) { return; }
    var bs = styleBarEl.querySelectorAll('.sw[data-color]');
    toolPrefs.boxFav.forEach(function (c, i) {
      var b = bs[i]; if (!b) { return; }
      b.setAttribute('data-color', c); b.style.setProperty('--sw', colorCss(c)); b.setAttribute('aria-label', COLOR_NAMES[c] || c);
    });
  }
  renderBoxFavs();
  function boxColorHex(c) {""")
rep("""    var c = currentStyle().color, hex = boxColorHex(c), on = !!hex && ['red', 'black', 'blue'].indexOf(c) < 0;""",
"""    var c = currentStyle().color, on = !!c && toolPrefs.boxFav.indexOf(c) < 0;""")
rep("""    boxCustomBtn.style.setProperty('--sw', on ? (/^#/.test(c) ? c : 'var(--c-' + c + ')') : 'transparent');""",
"""    boxCustomBtn.style.setProperty('--sw', on ? colorCss(c) : 'transparent');""")
# popover markup: favourite slots
rep("""  cpop.innerHTML = '<div class="cp-head"><span class="cp-t">我的顏色</span><span class="cp-n" id="cpCount"></span><button type="button" class="cp-edit" id="cpEdit">編輯</button></div>' +
    '<div class="cp-grid" id="cpGrid"></div><div class="cp-note" id="cpNote"></div>';""",
"""  cpop.innerHTML = '<div class="cp-sec">外面顯示的三個顏色</div><div class="cp-favs" id="cpFavs"></div>' +
    '<div class="cp-head"><span class="cp-t">我的顏色</span><span class="cp-n" id="cpCount"></span><button type="button" class="cp-edit" id="cpEdit">編輯</button></div>' +
    '<div class="cp-grid" id="cpGrid"></div><div class="cp-note" id="cpNote"></div>';""")
rep("""  onTap($('cpEdit'), function () { commitPending(); cpEditing = !cpEditing; renderCpop(); });""",
"""  onTap($('cpEdit'), function () { commitPending(); cpEditing = !cpEditing; cpSlot = null; renderCpop(); });
  /* 把某個顏色放進外面的第 i 格；換下來的顏色收進「我的顏色」，不會不見 */
  function setFav(i, c) {
    var favs = toolPrefs[CP[cpKind].fav], list = toolPrefs[CP[cpKind].list], old = favs[i];
    if (favs.indexOf(c) >= 0 && favs.indexOf(c) !== i) { favs[favs.indexOf(c)] = old; }
    else if (old && list.indexOf(old) < 0 && list.length < BOX_MAX) { list.push(old); }
    favs[i] = c;
    saveTools();
    if (cpKind === 'box') { renderBoxFavs(); syncStyleBar(); } else { renderToolOpts(); }
  }""")
rep("""  function cpCurrent() {
    if (cpKind === 'box') { return boxColorHex(currentStyle().color); }""","""  function cpCurrent() {
    if (cpKind === 'box') { var bc = currentStyle().color; return /^#/.test(bc || '') ? bc.toLowerCase() : bc; }""")
rep("""    var k = cpPending.kind, hex = cpPending.hex, list = toolPrefs[CP[k].list];
    cpPending = null; cpPicking = false;
    toolPrefs[CP[k].last] = hex;
    if (list.length < BOX_MAX && list.map(function (x) { return x.toLowerCase(); }).indexOf(hex) < 0) { list.push(hex); }
    saveTools();""","""    var k = cpPending.kind, hex = cpPending.hex, list = toolPrefs[CP[k].list];
    cpPending = null; cpPicking = false;
    toolPrefs[CP[k].last] = hex;
    if (list.length < BOX_MAX && list.map(function (x) { return x.toLowerCase(); }).indexOf(hex) < 0) { list.push(hex); }
    saveTools();
    if (cpSlot !== null && k === cpKind) { var sl = cpSlot; cpSlot = null; setFav(sl, hex); }""")
rep("""    var g = $('cpGrid'), list = toolPrefs[CP[cpKind].list], cur = cpCurrent();
    g.replaceChildren();""","""    var g = $('cpGrid'), list = toolPrefs[CP[cpKind].list], cur = cpCurrent(), favs = toolPrefs[CP[cpKind].fav];
    g.replaceChildren();
    var fv = $('cpFavs'); fv.replaceChildren();
    favs.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cp-slot' + (cpSlot === i ? ' sel' : '');
      b.style.setProperty('--sw', colorCss(c));
      b.setAttribute('aria-label', '外面第 ' + (i + 1) + ' 格：' + (COLOR_NAMES[c] || c) + (cpSlot === i ? '（選取中）' : '，點一下來更換'));
      b.setAttribute('aria-pressed', String(cpSlot === i));
      var n = document.createElement('span'); n.className = 'cp-slotn'; n.textContent = i + 1; b.appendChild(n);
      onTap(b, function () { cpEditing = false; cpSlot = cpSlot === i ? null : i; renderCpop(); });
      fv.appendChild(b);
    });
    cpop.classList.toggle('slotting', cpSlot !== null);""")
rep("""        if (cpEditing) { list.splice(i, 1); saveTools(); if (!list.length) { cpEditing = false; } renderCpop(); return; }
        cpApply(hex); renderCpop();""","""        if (cpEditing) { list.splice(i, 1); saveTools(); if (!list.length) { cpEditing = false; } renderCpop(); return; }
        if (cpSlot !== null) { var sl = cpSlot; cpSlot = null; setFav(sl, hex); renderCpop(); return; }
        cpApply(hex); renderCpop();""")
rep("""      b.style.setProperty('--sw', hex);
      b.setAttribute('aria-label', (cpEditing ? '刪除顏色 ' : '顏色 ') + hex);""","""      b.style.setProperty('--sw', colorCss(hex));
      b.setAttribute('aria-label', (cpEditing ? '刪除顏色 ' : (cpSlot !== null ? '放進外面第 ' + (cpSlot + 1) + ' 格：' : '顏色 ')) + (COLOR_NAMES[hex] || hex));""")
rep("""    $('cpNote').textContent = cpEditing ? '點一個顏色就會刪掉它。' :""","""    $('cpNote').textContent = cpSlot !== null ? '現在點下面一個顏色（或按「＋」挑新的），放進外面第 ' + (cpSlot + 1) + ' 格。' : cpEditing ? '點一個顏色就會刪掉它。' :""")
rep("""(list.length ? '點顏色套用；按「＋」新增常用的顏色。' :""","""(list.length ? '點顏色套用。想換外面的顏色：先點上面的格子，再點下面的顏色。' :""")
rep("""    cpKind = kind || 'box'; cpTarget = cpKind === 'box' ? focusedId : null; cpEditing = false;""","""    cpKind = kind || 'box'; cpTarget = cpKind === 'box' ? focusedId : null; cpEditing = false; cpSlot = null;""")
rep("""    cpop.hidden = true; cpEditing = false;""","""    cpop.hidden = true; cpEditing = false; cpSlot = null;""")
# list entries could be names (box) — compare loosely
rep("""      b.setAttribute('aria-pressed', String(!cpEditing && cur === hex.toLowerCase()));""","""      b.setAttribute('aria-pressed', String(!cpEditing && cpSlot === null && cur === String(hex).toLowerCase()));""")
# inkStrokeColor unchanged (theme ink = '#1f4fd1')
open(p,'w',encoding='utf-8').write(s)
print('ok')
