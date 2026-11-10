  /* ---------- 筆記工具的選項：螢光筆、手寫的顏色與粗細（可以自訂顏色），上一步／下一步 ---------- */
  var TOOL_KEY = 'thai-tools';
  var HL_COLORS = [['#ffd400', '黃'], ['#7ddc7d', '綠'], ['#ff9cc2', '粉紅'], ['#8cc8ff', '藍'], ['#ffb15c', '橘']];
  var INK_COLORS = [['#1f4fd1', '藍'], ['#26332e', '黑'], ['#d63b3b', '紅'], ['#2f8f5b', '綠'], ['#e07a2f', '橘'], ['#7b4fd1', '紫']];
  var INK_WIDTHS = [[2, '細'], [3.5, '中'], [6, '粗']];
  var toolPrefs = { hlColor: '#ffd400', hlStyle: 'full', inkColor: '#1f4fd1', inkW: 3.5, hlCustom: '#c38bff', inkCustom: '#8a5a2b', boxCustom: '#0f8b8d' };
  try { Object.assign(toolPrefs, JSON.parse(localStorage.getItem(TOOL_KEY) || '{}')); } catch (err) {}
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
  function customSwatch(value, on, label, pick) {
    var lab = document.createElement('label'); lab.className = 'sw2 custom' + (on ? ' on' : ''); lab.title = '自訂顏色';
    lab.style.setProperty('--sw', value);
    var inp = document.createElement('input'); inp.type = 'color'; inp.value = value; inp.setAttribute('aria-label', label);
    inp.addEventListener('input', function () { lab.style.setProperty('--sw', inp.value); });
    inp.addEventListener('change', function () { pick(inp.value); });
    lab.appendChild(inp);
    return lab;
  }
  function optLabel(t) { var s = document.createElement('span'); s.className = 'ol'; s.textContent = t; return s; }
  function renderToolOpts() {
    toolOpts.replaceChildren();
    if (mode === 'hl') {
      toolOpts.appendChild(optLabel('顏色'));
      var builtin = HL_COLORS.some(function (c) { return c[0] === toolPrefs.hlColor; });
      HL_COLORS.forEach(function (c) { toolOpts.appendChild(swatch(c[0], c[1], toolPrefs.hlColor === c[0], function (v) { toolPrefs.hlColor = v; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(customSwatch(builtin ? toolPrefs.hlCustom : toolPrefs.hlColor, !builtin, '自訂螢光筆顏色', function (v) { toolPrefs.hlColor = v; toolPrefs.hlCustom = v; saveTools(); renderToolOpts(); }));
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
      var builtin2 = INK_COLORS.some(function (c) { return c[0] === toolPrefs.inkColor; });
      INK_COLORS.forEach(function (c, k) { toolOpts.appendChild(swatch(k ? c[0] : 'var(--ink)', c[1], toolPrefs.inkColor === c[0], function () { toolPrefs.inkColor = c[0]; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(customSwatch(builtin2 ? toolPrefs.inkCustom : toolPrefs.inkColor, !builtin2, '自訂筆的顏色', function (v) { toolPrefs.inkColor = v; toolPrefs.inkCustom = v; saveTools(); renderToolOpts(); }));
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
    if (mode !== 'box' && typeof closeCpop === 'function') { closeCpop(); }
  }
  function inkStrokeColor() { return toolPrefs.inkColor === INK_COLORS[0][0] ? null : toolPrefs.inkColor; }
  /* ---------- 文字框顏色：只放三色，其他放在「我的顏色」（最多 50 種） ---------- */
  var BOX_MAX = 50, BOX_LEGACY = { green: '#2e7d32', purple: '#7b3fb0', orange: '#c25a06' };
  if (!Array.isArray(toolPrefs.boxColors)) { toolPrefs.boxColors = [BOX_LEGACY.green, BOX_LEGACY.purple, BOX_LEGACY.orange]; }
  var keepBoxUntil = 0, cpTarget = null, cpEditing = false;
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
    b.title = '我的顏色'; b.setAttribute('aria-label', '我的顏色（自訂）'); b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
    b.style.setProperty('--sw', 'transparent');
    after.parentNode.insertBefore(b, after.nextSibling);
    boxCustomBtn = b;
    onTap(b, function () { if (cpop.hidden) { openCpop(); } else { closeCpop(); } });
  })();
  function boxColorHex(c) { return /^#/.test(c || '') ? c.toLowerCase() : (BOX_LEGACY[c] || null); }
  function syncBoxCustom() {
    if (!boxCustomBtn) { return; }
    var c = currentStyle().color, hex = boxColorHex(c), on = !!hex && ['red', 'black', 'blue'].indexOf(c) < 0;
    boxCustomBtn.classList.toggle('on', on);
    boxCustomBtn.style.setProperty('--sw', on ? (/^#/.test(c) ? c : 'var(--c-' + c + ')') : 'transparent');
    if (cpop && !cpop.hidden) { renderCpop(); }
  }
  var cpop = document.createElement('div'); cpop.className = 'cpop'; cpop.id = 'cpop'; cpop.hidden = true;
  cpop.setAttribute('role', 'dialog'); cpop.setAttribute('aria-label', '我的顏色');
  cpop.innerHTML = '<div class="cp-head"><span class="cp-t">我的顏色</span><span class="cp-n" id="cpCount"></span><button type="button" class="cp-edit" id="cpEdit">編輯</button></div>' +
    '<div class="cp-grid" id="cpGrid"></div><div class="cp-note" id="cpNote"></div>';
  document.body.appendChild(cpop);
  onTap($('cpEdit'), function () { cpEditing = !cpEditing; renderCpop(); });
  function applyBoxColor(hex) {
    if (cpTarget !== null && state.boxes.some(function (x) { return x.id === cpTarget; })) { focusedId = cpTarget; }
    setStyle({ color: hex });
    var ed = cpTarget !== null ? document.querySelector('.note-text[data-id="' + cpTarget + '"]') : null;
    if (ed && document.activeElement !== ed) { try { ed.focus({ preventScroll: true }); } catch (err) { ed.focus(); } }
  }
  function renderCpop() {
    var g = $('cpGrid'), list = toolPrefs.boxColors, cur = boxColorHex(currentStyle().color);
    g.replaceChildren();
    $('cpCount').textContent = list.length + ' / ' + BOX_MAX;
    $('cpEdit').textContent = cpEditing ? '完成' : '編輯';
    $('cpEdit').hidden = !list.length;
    cpop.classList.toggle('editing', cpEditing);
    list.forEach(function (hex, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cp-sw';
      b.style.setProperty('--sw', hex);
      b.setAttribute('aria-label', (cpEditing ? '刪除顏色 ' : '顏色 ') + hex);
      b.setAttribute('aria-pressed', String(!cpEditing && cur === hex.toLowerCase()));
      onTap(b, function () {
        if (cpEditing) { toolPrefs.boxColors.splice(i, 1); saveTools(); if (!toolPrefs.boxColors.length) { cpEditing = false; } renderCpop(); return; }
        applyBoxColor(hex); renderCpop();
      });
      g.appendChild(b);
    });
    if (!cpEditing) {
      var lab = document.createElement('label'); lab.className = 'cp-add'; lab.title = '新增顏色';
      var full = list.length >= BOX_MAX;
      lab.classList.toggle('full', full);
      var inp = document.createElement('input'); inp.type = 'color'; inp.value = toolPrefs.boxCustom || '#0f8b8d'; inp.setAttribute('aria-label', '新增一個顏色');
      inp.disabled = full;
      lab.addEventListener('pointerdown', function () { keepBoxUntil = Date.now() + 2500; });
      inp.addEventListener('change', function () {
        var hex = inp.value.toLowerCase();
        toolPrefs.boxCustom = hex;
        if (toolPrefs.boxColors.map(function (x) { return x.toLowerCase(); }).indexOf(hex) < 0) { toolPrefs.boxColors.push(hex); }
        saveTools(); applyBoxColor(hex); renderCpop();
      });
      lab.appendChild(inp);
      g.appendChild(lab);
    }
    $('cpNote').textContent = cpEditing ? '點一個顏色就會刪掉它。' : (list.length >= BOX_MAX ? '已經存滿 50 種，按「編輯」刪掉一些才能再加。' : (list.length ? '點顏色套用；按「＋」新增常用的顏色。' : '按「＋」挑一個顏色，它會留在這裡下次再用。'));
  }
  function placeCpop() {
    if (!boxCustomBtn) { return; }
    var r = boxCustomBtn.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 16);
    cpop.style.width = w + 'px';
    cpop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    cpop.style.top = Math.round(r.bottom + 10) + 'px';
  }
  function openCpop() { cpTarget = focusedId; cpEditing = false; renderCpop(); cpop.hidden = false; placeCpop(); boxCustomBtn.setAttribute('aria-expanded', 'true'); }
  function closeCpop() { if (!cpop || cpop.hidden) { return; } cpop.hidden = true; cpEditing = false; if (boxCustomBtn) { boxCustomBtn.setAttribute('aria-expanded', 'false'); } }
  document.addEventListener('pointerdown', function (e) { if (!cpop.hidden && !cpop.contains(e.target) && e.target !== boxCustomBtn) { closeCpop(); } }, true);
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
