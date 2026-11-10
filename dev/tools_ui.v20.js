  /* ---------- 筆記工具的選項：螢光筆、手寫的顏色與粗細（可以自訂顏色），上一步／下一步 ---------- */
  var TOOL_KEY = 'thai-tools';
  var HL_COLORS = [['#ffd400', '黃'], ['#7ddc7d', '綠'], ['#ff9cc2', '粉紅']];
  var INK_COLORS = [['#1f4fd1', '藍（預設）'], ['#26332e', '黑'], ['#d63b3b', '紅']];
  var INK_WIDTHS = [[2, '細'], [3.5, '中'], [6, '粗']];
  var toolPrefs = { hlColor: '#ffd400', hlStyle: 'full', inkColor: '#1f4fd1', inkW: 3.5, hlCustom: '#c38bff', inkCustom: '#8a5a2b', boxCustom: '#0f8b8d' };
  try { Object.assign(toolPrefs, JSON.parse(localStorage.getItem(TOOL_KEY) || '{}')); } catch (err) {}
  if (!Array.isArray(toolPrefs.hlFav) || toolPrefs.hlFav.length !== 3) { toolPrefs.hlFav = HL_COLORS.map(function (c) { return c[0]; }); }
  if (!Array.isArray(toolPrefs.inkFav) || toolPrefs.inkFav.length !== 3) { toolPrefs.inkFav = INK_COLORS.map(function (c) { return c[0]; }); }
  if (!Array.isArray(toolPrefs.boxFav) || toolPrefs.boxFav.length !== 3) { toolPrefs.boxFav = ['red', 'black', 'blue']; }
  var COLOR_NAMES = { '#ffd400': '黃', '#7ddc7d': '綠', '#ff9cc2': '粉紅', '#1f4fd1': '藍（預設）', '#26332e': '黑', '#d63b3b': '紅', red: '紅', black: '黑', blue: '藍', green: '綠', purple: '紫', orange: '橘' };
  function colorCss(c) { return c === INK_COLORS[0][0] ? 'var(--ink)' : (/^#/.test(c) ? c : 'var(--c-' + c + ')'); }
  function saveTools() { try { localStorage.setItem(TOOL_KEY, JSON.stringify(toolPrefs)); } catch (err) {} }
  function hexA(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) { return hex; }
    var n = parseInt(m[1], 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  /* 螢光筆範圍：[開始, 結束, 顏色, 樣式]；新畫的會蓋過重疊的部分 */
  function addRangeColored(r, color, style) {
    var a = r[0], b = r[1], out = [];
    state.hl.forEach(function (x) {
      if (x[1] <= a || x[0] >= b) { out.push(x); return; }
      if (x[0] < a) { out.push([x[0], a].concat(x.slice(2))); }
      if (x[1] > b) { out.push([b, x[1]].concat(x.slice(2))); }
    });
    if (color === HL_COLORS[0][0]) { color = null; }
    var nr = [a, b, color || null, style === 'under' ? 'u' : ''];
    out.push(nr);
    out.sort(function (x, y) { return x[0] - y[0]; });
    /* 相鄰、同色同樣式的接起來 */
    var merged = [];
    out.forEach(function (x) {
      var last = merged[merged.length - 1];
      if (last && x[0] <= last[1] && (last[2] || null) === (x[2] || null) && (last[3] || '') === (x[3] || '')) { last[1] = Math.max(last[1], x[1]); }
      else { merged.push(x.slice()); }
    });
    state.hl = merged;
  }

  /* 工具列下方的選項列（螢光筆、手寫）；文字框沿用原本的樣式列 */
  var toolbarEl = document.querySelector('.workbox .toolbar') || document.querySelector('.toolbar');
  var styleBarEl = $('stylebar');
  var toolOpts = document.createElement('div');
  toolOpts.className = 'toolopts'; toolOpts.id = 'toolopts'; toolOpts.hidden = true;
  toolOpts.setAttribute('role', 'toolbar'); toolOpts.setAttribute('aria-label', '筆的顏色與粗細');
  /* 工具列＋選項列＋顯示比例包成一個會黏在上方的區塊 */
  var toolHead = document.createElement('div'); toolHead.className = 'toolhead'; toolHead.id = 'toolhead';
  var subBar = document.createElement('div'); subBar.className = 'subbar'; subBar.id = 'subbar';
  if (toolbarEl && toolbarEl.parentNode) {
    toolbarEl.parentNode.insertBefore(toolHead, toolbarEl);
    toolHead.appendChild(toolbarEl);
    toolHead.appendChild(subBar);
    subBar.appendChild(toolOpts);
    if (styleBarEl) { subBar.appendChild(styleBarEl); }
  }
  function swatch(color, label, on, pick) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sw2';
    b.style.setProperty('--sw', color); b.setAttribute('aria-label', label); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.addEventListener('click', function () { pick(color); });
    return b;
  }
  function optLabel(t) { var s = document.createElement('span'); s.className = 'ol'; s.textContent = t; return s; }
  /* 「我的顏色」按鈕（彩色圓圈）：三種工具共用同一種小視窗，各自存自己的顏色 */
  function myColorBtn(kind, id, label, cur, presets) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sw2 custom'; b.id = id;
    var on = !!cur && presets.indexOf(cur) < 0;
    b.classList.toggle('on', on);
    b.style.setProperty('--sw', on ? colorCss(cur) : 'transparent');
    b.title = '我的顏色'; b.setAttribute('aria-label', label); b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', String(!!(cpop && !cpop.hidden && cpKind === kind)));
    b.addEventListener('click', function () { if (cpop.hidden || cpKind !== kind) { openCpop(kind); } else { closeCpop(); } });
    return b;
  }
  function renderToolOpts() {
    toolOpts.replaceChildren();
    if (mode === 'hl') {
      toolOpts.appendChild(optLabel('顏色'));
      toolPrefs.hlFav.forEach(function (c) { toolOpts.appendChild(swatch(c, COLOR_NAMES[c] || c, toolPrefs.hlColor === c, function (v) { toolPrefs.hlColor = v; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(myColorBtn('hl', 'hlCustom', '螢光筆：我的顏色', toolPrefs.hlColor, toolPrefs.hlFav));
      toolOpts.appendChild(optLabel('樣式'));
      [['full', '整塊'], ['under', '底線']].forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ob' + (o[0] === 'under' ? ' ob-under' : ' ob-full');
        b.style.setProperty('--sw', toolPrefs.hlColor);
        b.textContent = o[1]; b.setAttribute('aria-pressed', toolPrefs.hlStyle === o[0] ? 'true' : 'false');
        b.addEventListener('click', function () { toolPrefs.hlStyle = o[0]; saveTools(); renderToolOpts(); });
        toolOpts.appendChild(b);
      });
    } else if (mode === 'ink') {
      toolOpts.appendChild(optLabel('顏色'));
      toolPrefs.inkFav.forEach(function (c) { var b = swatch(colorCss(c), COLOR_NAMES[c] || c, toolPrefs.inkColor === c, function () { toolPrefs.inkColor = c; saveTools(); renderToolOpts(); }); toolOpts.appendChild(b); });
      toolOpts.appendChild(myColorBtn('ink', 'inkCustom', '手寫：我的顏色', toolPrefs.inkColor, toolPrefs.inkFav));
      toolOpts.appendChild(optLabel('粗細'));
      INK_WIDTHS.forEach(function (w) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ob ow';
        var dot = document.createElement('span'); dot.className = 'odot'; dot.style.width = dot.style.height = Math.round(w[0] * 2.2 + 2) + 'px'; dot.style.background = toolPrefs.inkColor === INK_COLORS[0][0] ? 'var(--ink)' : toolPrefs.inkColor;
        b.appendChild(dot); b.appendChild(document.createTextNode(w[1]));
        b.setAttribute('aria-pressed', toolPrefs.inkW === w[0] ? 'true' : 'false');
        b.addEventListener('click', function () { toolPrefs.inkW = w[0]; saveTools(); renderToolOpts(); });
        toolOpts.appendChild(b);
      });
    }
    toolOpts.hidden = !(mode === 'hl' || mode === 'ink');
    if (typeof closeCpop === 'function' && cpop && !cpop.hidden && cpKind !== mode) { closeCpop(); }
    else if (cpop && !cpop.hidden) { placeCpop(); }
  }
  function inkStrokeColor() { return toolPrefs.inkColor === INK_COLORS[0][0] ? null : toolPrefs.inkColor; }

  /* ---------- 我的顏色（最多 50 種）：文字框、螢光筆、手寫各自一組 ---------- */
  var BOX_MAX = 50, BOX_LEGACY = { green: '#2e7d32', purple: '#7b3fb0', orange: '#c25a06' };
  if (!Array.isArray(toolPrefs.boxColors)) { toolPrefs.boxColors = [BOX_LEGACY.green, BOX_LEGACY.purple, BOX_LEGACY.orange]; }
  if (!Array.isArray(toolPrefs.hlColors)) { toolPrefs.hlColors = ['#8cc8ff', '#ffb15c', '#c38bff']; }
  if (!Array.isArray(toolPrefs.inkColors)) { toolPrefs.inkColors = ['#2f8f5b', '#e07a2f', '#7b4fd1']; }
  var CP = {
    box: { list: 'boxColors', btn: 'boxCustom', last: 'boxCustom', fav: 'boxFav' },
    hl: { list: 'hlColors', btn: 'hlCustom', last: 'hlCustom', fav: 'hlFav' },
    ink: { list: 'inkColors', btn: 'inkCustom', last: 'inkCustom', fav: 'inkFav' }
  };
  var keepBoxUntil = 0, cpTarget = null, cpEditing = false, cpKind = 'box', cpPicking = false, cpPending = null, cpSlot = null;
  function keepEditorFocus(el) {
    el.addEventListener('mousedown', function (e) { e.preventDefault(); });
    el.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }
  function onTap(el, fn) {
    keepEditorFocus(el);
    el.addEventListener('pointerup', function (e) { fn(e); });
    el.addEventListener('click', function (e) { if (e.detail === 0) { fn(e); } });
  }
  var boxCustomBtn = null;
  (function () {
    if (!styleBarEl) { return; }
    var after = styleBarEl.querySelector('[data-color="blue"]');
    if (!after) { return; }
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sw custom'; b.id = 'boxCustom';
    b.title = '我的顏色'; b.setAttribute('aria-label', '文字框：我的顏色'); b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
    b.style.setProperty('--sw', 'transparent');
    after.parentNode.insertBefore(b, after.nextSibling);
    boxCustomBtn = b;
    onTap(b, function () { if (cpop.hidden || cpKind !== 'box') { openCpop('box'); } else { closeCpop(); } });
  })();
  function renderBoxFavs() {
    if (!styleBarEl) { return; }
    var bs = styleBarEl.querySelectorAll('.sw[data-color]');
    toolPrefs.boxFav.forEach(function (c, i) {
      var b = bs[i]; if (!b) { return; }
      b.setAttribute('data-color', c); b.style.setProperty('--sw', colorCss(c)); b.setAttribute('aria-label', COLOR_NAMES[c] || c);
    });
  }
  renderBoxFavs();
  function boxColorHex(c) { return /^#/.test(c || '') ? c.toLowerCase() : (BOX_LEGACY[c] || null); }
  function syncBoxCustom() {
    if (!boxCustomBtn) { return; }
    var c = currentStyle().color, on = !!c && toolPrefs.boxFav.indexOf(c) < 0;
    boxCustomBtn.classList.toggle('on', on);
    boxCustomBtn.style.setProperty('--sw', on ? colorCss(c) : 'transparent');
    if (cpop && !cpop.hidden && !cpPicking && cpKind === 'box') { renderCpop(); }
  }
  var cpop = document.createElement('div'); cpop.className = 'cpop'; cpop.id = 'cpop'; cpop.hidden = true;
  cpop.setAttribute('role', 'dialog'); cpop.setAttribute('aria-label', '我的顏色');
  cpop.innerHTML = '<div class="cp-sec">外面顯示的三個顏色</div><div class="cp-favs" id="cpFavs"></div>' +
    '<div class="cp-head"><span class="cp-t">我的顏色</span><span class="cp-n" id="cpCount"></span><button type="button" class="cp-edit" id="cpEdit">編輯</button></div>' +
    '<div class="cp-grid" id="cpGrid"></div><div class="cp-note" id="cpNote"></div>';
  document.body.appendChild(cpop);
  onTap($('cpEdit'), function () { commitPending(); cpEditing = !cpEditing; cpSlot = null; renderCpop(); });
  /* 把某個顏色放進外面的第 i 格；換下來的顏色收進「我的顏色」，不會不見 */
  function setFav(i, c) {
    var favs = toolPrefs[CP[cpKind].fav], list = toolPrefs[CP[cpKind].list], old = favs[i];
    if (favs.indexOf(c) >= 0 && favs.indexOf(c) !== i) { favs[favs.indexOf(c)] = old; }
    else if (old && list.indexOf(old) < 0 && list.length < BOX_MAX) { list.push(old); }
    favs[i] = c;
    saveTools();
    if (cpKind === 'box') { renderBoxFavs(); syncStyleBar(); } else { renderToolOpts(); }
  }
  function cpCurrent() {
    if (cpKind === 'box') { var bc = currentStyle().color; return /^#/.test(bc || '') ? bc.toLowerCase() : bc; }
    return ((cpKind === 'hl' ? toolPrefs.hlColor : toolPrefs.inkColor) || '').toLowerCase();
  }
  function cpApply(hex) {
    if (cpKind === 'box') {
      if (cpTarget !== null && state.boxes.some(function (x) { return x.id === cpTarget; })) { focusedId = cpTarget; }
      setStyle({ color: hex });
      var ed = cpTarget !== null ? document.querySelector('.note-text[data-id="' + cpTarget + '"]') : null;
      if (ed && document.activeElement !== ed && !cpPicking) { try { ed.focus({ preventScroll: true }); } catch (err) { ed.focus(); } }
      return;
    }
    if (cpKind === 'hl') { toolPrefs.hlColor = hex; } else { toolPrefs.inkColor = hex; }
    saveTools(); renderToolOpts();
  }
  function commitPending() {
    if (!cpPending) { return; }
    var k = cpPending.kind, hex = cpPending.hex, list = toolPrefs[CP[k].list];
    cpPending = null; cpPicking = false;
    toolPrefs[CP[k].last] = hex;
    if (list.length < BOX_MAX && list.map(function (x) { return x.toLowerCase(); }).indexOf(hex) < 0) { list.push(hex); }
    saveTools();
    if (cpSlot !== null && k === cpKind) { var sl = cpSlot; cpSlot = null; setFav(sl, hex); }
  }
  function renderCpop() {
    var g = $('cpGrid'), list = toolPrefs[CP[cpKind].list], cur = cpCurrent(), favs = toolPrefs[CP[cpKind].fav];
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
    cpop.classList.toggle('slotting', cpSlot !== null);
    $('cpCount').textContent = list.length + ' / ' + BOX_MAX;
    $('cpEdit').textContent = cpEditing ? '完成' : '編輯';
    $('cpEdit').hidden = !list.length;
    cpop.classList.toggle('editing', cpEditing);
    list.forEach(function (hex, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cp-sw';
      b.style.setProperty('--sw', colorCss(hex));
      b.setAttribute('aria-label', (cpEditing ? '刪除顏色 ' : (cpSlot !== null ? '放進外面第 ' + (cpSlot + 1) + ' 格：' : '顏色 ')) + (COLOR_NAMES[hex] || hex));
      b.setAttribute('aria-pressed', String(!cpEditing && cpSlot === null && cur === String(hex).toLowerCase()));
      onTap(b, function () {
        if (cpEditing) { list.splice(i, 1); saveTools(); if (!list.length) { cpEditing = false; } renderCpop(); return; }
        if (cpSlot !== null) { var sl = cpSlot; cpSlot = null; setFav(sl, hex); renderCpop(); return; }
        cpApply(hex); renderCpop();
      });
      g.appendChild(b);
    });
    if (!cpEditing) {
      var kind = cpKind, lab = document.createElement('label'); lab.className = 'cp-add'; lab.title = '新增顏色';
      var full = list.length >= BOX_MAX;
      lab.classList.toggle('full', full);
      var inp = document.createElement('input'); inp.type = 'color'; inp.setAttribute('aria-label', '新增一個顏色');
      inp.value = /^#[0-9a-f]{6}$/i.test(toolPrefs[CP[kind].last] || '') ? toolPrefs[CP[kind].last] : '#0f8b8d';
      inp.disabled = full;
      lab.addEventListener('pointerdown', function () { keepBoxUntil = Date.now() + 4000; });
      /* iPad 的選色器有時只送 input、不送 change：選色當下就先套用，關掉小視窗時再存進清單 */
      inp.addEventListener('input', function () {
        var hex = inp.value.toLowerCase();
        cpPicking = true; cpPending = { kind: kind, hex: hex }; keepBoxUntil = Date.now() + 4000;
        lab.style.setProperty('--sw', hex); lab.classList.add('picked');
        cpApply(hex);
      });
      inp.addEventListener('change', function () {
        var hex = inp.value.toLowerCase();
        cpPending = { kind: kind, hex: hex };
        cpApply(hex); commitPending(); renderCpop();
      });
      lab.appendChild(inp);
      g.appendChild(lab);
    }
    $('cpNote').textContent = cpSlot !== null ? '現在點下面一個顏色（或按「＋」挑新的），放進外面第 ' + (cpSlot + 1) + ' 格。' : cpEditing ? '點一個顏色就會刪掉它。' : (list.length >= BOX_MAX ? '已經存滿 50 種，按「編輯」刪掉一些才能再加。' : (list.length ? '點顏色套用。想換外面的顏色：先點上面的格子，再點下面的顏色。' : '按「＋」挑一個顏色，它會留在這裡下次再用。'));
  }
  function cpAnchor() { return document.getElementById(CP[cpKind].btn); }
  function placeCpop() {
    var a = cpAnchor(); if (!a) { return; }
    var r = a.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 16);
    cpop.style.width = w + 'px';
    cpop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    cpop.style.top = Math.round(r.bottom + 10) + 'px';
  }
  function openCpop(kind) {
    commitPending();
    cpKind = kind || 'box'; cpTarget = cpKind === 'box' ? focusedId : null; cpEditing = false; cpSlot = null;
    renderCpop(); cpop.hidden = false; placeCpop();
    ['boxCustom', 'hlCustom', 'inkCustom'].forEach(function (id) { var el = document.getElementById(id); if (el) { el.setAttribute('aria-expanded', String(id === CP[cpKind].btn)); } });
  }
  function closeCpop() {
    if (!cpop || cpop.hidden) { return; }
    commitPending();
    cpop.hidden = true; cpEditing = false; cpSlot = null;
    ['boxCustom', 'hlCustom', 'inkCustom'].forEach(function (id) { var el = document.getElementById(id); if (el) { el.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('pointerdown', function (e) {
    if (cpop.hidden || cpop.contains(e.target)) { return; }
    var a = cpAnchor(); if (a && (e.target === a || a.contains(e.target))) { return; }
    closeCpop();
  }, true);
  window.addEventListener('scroll', function () { if (!cpop.hidden) { placeCpop(); } }, { passive: true });
  window.addEventListener('resize', function () { if (!cpop.hidden) { placeCpop(); } });

  /* ---------- 上一步／下一步（像 GoodNotes） ---------- */
  var redoStack = [];
  function notesNow() { return JSON.stringify({ hl: state.hl, strokes: state.strokes, boxes: state.boxes }); }
  function applyNotes(json) {
    var d = JSON.parse(json);
    state.hl = d.hl; state.strokes = d.strokes; state.boxes = d.boxes;
    renderText(); redrawInk(); renderBoxes(); save(); syncUndoButtons();
  }
  function syncUndoButtons() {
    var u = $('undo'), r = $('redo');
    if (u) { u.disabled = !history.length; }
    if (r) { r.disabled = !redoStack.length; }
  }
