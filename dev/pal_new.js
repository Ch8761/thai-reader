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
    b.style.setProperty('--sw', on ? cur : 'transparent');
    b.title = '我的顏色'; b.setAttribute('aria-label', label); b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', String(!!(cpop && !cpop.hidden && cpKind === kind)));
    b.addEventListener('click', function () { if (cpop.hidden || cpKind !== kind) { openCpop(kind); } else { closeCpop(); } });
    return b;
  }
  function renderToolOpts() {
    toolOpts.replaceChildren();
    if (mode === 'hl') {
      toolOpts.appendChild(optLabel('顏色'));
      HL_COLORS.forEach(function (c) { toolOpts.appendChild(swatch(c[0], c[1], toolPrefs.hlColor === c[0], function (v) { toolPrefs.hlColor = v; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(myColorBtn('hl', 'hlCustom', '螢光筆：我的顏色', toolPrefs.hlColor, HL_COLORS.map(function (c) { return c[0]; })));
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
      INK_COLORS.forEach(function (c, k) { toolOpts.appendChild(swatch(k ? c[0] : 'var(--ink)', c[1], toolPrefs.inkColor === c[0], function () { toolPrefs.inkColor = c[0]; saveTools(); renderToolOpts(); })); });
      toolOpts.appendChild(myColorBtn('ink', 'inkCustom', '手寫：我的顏色', toolPrefs.inkColor, INK_COLORS.map(function (c) { return c[0]; })));
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
    box: { list: 'boxColors', btn: 'boxCustom', last: 'boxCustom' },
    hl: { list: 'hlColors', btn: 'hlCustom', last: 'hlCustom' },
    ink: { list: 'inkColors', btn: 'inkCustom', last: 'inkCustom' }
  };
  var keepBoxUntil = 0, cpTarget = null, cpEditing = false, cpKind = 'box', cpPicking = false, cpPending = null;
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
  function boxColorHex(c) { return /^#/.test(c || '') ? c.toLowerCase() : (BOX_LEGACY[c] || null); }
  function syncBoxCustom() {
    if (!boxCustomBtn) { return; }
    var c = currentStyle().color, hex = boxColorHex(c), on = !!hex && ['red', 'black', 'blue'].indexOf(c) < 0;
    boxCustomBtn.classList.toggle('on', on);
    boxCustomBtn.style.setProperty('--sw', on ? (/^#/.test(c) ? c : 'var(--c-' + c + ')') : 'transparent');
    if (cpop && !cpop.hidden && !cpPicking && cpKind === 'box') { renderCpop(); }
  }
  var cpop = document.createElement('div'); cpop.className = 'cpop'; cpop.id = 'cpop'; cpop.hidden = true;
  cpop.setAttribute('role', 'dialog'); cpop.setAttribute('aria-label', '我的顏色');
  cpop.innerHTML = '<div class="cp-head"><span class="cp-t">我的顏色</span><span class="cp-n" id="cpCount"></span><button type="button" class="cp-edit" id="cpEdit">編輯</button></div>' +
    '<div class="cp-grid" id="cpGrid"></div><div class="cp-note" id="cpNote"></div>';
  document.body.appendChild(cpop);
  onTap($('cpEdit'), function () { commitPending(); cpEditing = !cpEditing; renderCpop(); });
  function cpCurrent() {
    if (cpKind === 'box') { return boxColorHex(currentStyle().color); }
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
  }
  function renderCpop() {
    var g = $('cpGrid'), list = toolPrefs[CP[cpKind].list], cur = cpCurrent();
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
        if (cpEditing) { list.splice(i, 1); saveTools(); if (!list.length) { cpEditing = false; } renderCpop(); return; }
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
    $('cpNote').textContent = cpEditing ? '點一個顏色就會刪掉它。' : (list.length >= BOX_MAX ? '已經存滿 50 種，按「編輯」刪掉一些才能再加。' : (list.length ? '點顏色套用；按「＋」新增常用的顏色。' : '按「＋」挑一個顏色，它會留在這裡下次再用。'));
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
    cpKind = kind || 'box'; cpTarget = cpKind === 'box' ? focusedId : null; cpEditing = false;
    renderCpop(); cpop.hidden = false; placeCpop();
    ['boxCustom', 'hlCustom', 'inkCustom'].forEach(function (id) { var el = document.getElementById(id); if (el) { el.setAttribute('aria-expanded', String(id === CP[cpKind].btn)); } });
  }
  function closeCpop() {
    if (!cpop || cpop.hidden) { return; }
    commitPending();
    cpop.hidden = true; cpEditing = false;
    ['boxCustom', 'hlCustom', 'inkCustom'].forEach(function (id) { var el = document.getElementById(id); if (el) { el.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('pointerdown', function (e) {
    if (cpop.hidden || cpop.contains(e.target)) { return; }
    var a = cpAnchor(); if (a && (e.target === a || a.contains(e.target))) { return; }
    closeCpop();
  }, true);
  window.addEventListener('scroll', function () { if (!cpop.hidden) { placeCpop(); } }, { passive: true });
  window.addEventListener('resize', function () { if (!cpop.hidden) { placeCpop(); } });

