  function optLabel(t) { var s = document.createElement('span'); s.className = 'ol'; s.textContent = t; return s; }
  /* 外面的三個顏色（像 GoodNotes）：點一下選用；再點一次已選的那個，跳出「我的顏色」來換這一格 */
  function favSwatch(kind, i, c, on) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sw2 fav'; b.id = 'fav-' + kind + '-' + i;
    b.style.setProperty('--sw', colorCss(c));
    b.setAttribute('aria-label', (COLOR_NAMES[c] || c) + (on ? '（使用中，再點一次可以換顏色）' : ''));
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', String(!!(cpop && !cpop.hidden && cpKind === kind && cpSlot === i)));
    b.addEventListener('click', function () { favTapIdx(kind, i, c); });
    return b;
  }
  function favTapIdx(kind, i, c) {
    var cur = kind === 'hl' ? toolPrefs.hlColor : kind === 'ink' ? toolPrefs.inkColor : currentStyle().color;
    if (cur === c) {
      if (cpop && !cpop.hidden && cpKind === kind && cpSlot === i) { closeCpop(); } else { openCpop(kind, i); }
      return true;
    }
    closeCpop();
    if (kind === 'hl') { toolPrefs.hlColor = c; saveTools(); renderToolOpts(); }
    else if (kind === 'ink') { toolPrefs.inkColor = c; saveTools(); renderToolOpts(); }
    return false;
  }
  /* 文字框樣式列的三個顏色鈕（styleAction 會先問這裡） */
  function favTap(kind, el) {
    var bs = Array.prototype.slice.call(styleBarEl.querySelectorAll('.sw[data-color]'));
    return favTapIdx('box', bs.indexOf(el), el.getAttribute('data-color'));
  }
  function renderToolOpts() {
    toolOpts.replaceChildren();
    if (mode === 'hl') {
      toolOpts.appendChild(optLabel('顏色'));
      toolPrefs.hlFav.forEach(function (c, i) { toolOpts.appendChild(favSwatch('hl', i, c, toolPrefs.hlColor === c)); });
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
      toolPrefs.inkFav.forEach(function (c, i) { toolOpts.appendChild(favSwatch('ink', i, c, toolPrefs.inkColor === c)); });
      toolOpts.appendChild(optLabel('粗細'));
      INK_WIDTHS.forEach(function (w) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ob ow';
        var dot = document.createElement('span'); dot.className = 'odot'; dot.style.width = dot.style.height = Math.round(w[0] * 2.2 + 2) + 'px'; dot.style.background = colorCss(toolPrefs.inkColor);
        b.appendChild(dot); b.appendChild(document.createTextNode(w[1]));
        b.setAttribute('aria-pressed', toolPrefs.inkW === w[0] ? 'true' : 'false');
        b.addEventListener('click', function () { toolPrefs.inkW = w[0]; saveTools(); renderToolOpts(); });
        toolOpts.appendChild(b);
      });
    }
    toolOpts.hidden = !(mode === 'hl' || mode === 'ink');
    if (cpop && !cpop.hidden && cpKind !== mode) { closeCpop(); }
    else if (cpop && !cpop.hidden) { placeCpop(); }
  }
  function inkStrokeColor() { return toolPrefs.inkColor === INK_COLORS[0][0] ? null : toolPrefs.inkColor; }

  /* ---------- 我的顏色（最多 50 種）：文字框、螢光筆、手寫各自一組 ---------- */
  var BOX_MAX = 50, BOX_LEGACY = { green: '#2e7d32', purple: '#7b3fb0', orange: '#c25a06' };
  if (!Array.isArray(toolPrefs.boxColors)) { toolPrefs.boxColors = [BOX_LEGACY.green, BOX_LEGACY.purple, BOX_LEGACY.orange]; }
  if (!Array.isArray(toolPrefs.hlColors)) { toolPrefs.hlColors = ['#8cc8ff', '#ffb15c', '#c38bff']; }
  if (!Array.isArray(toolPrefs.inkColors)) { toolPrefs.inkColors = ['#2f8f5b', '#e07a2f', '#7b4fd1']; }
  var CP = {
    box: { list: 'boxColors', last: 'boxCustom', fav: 'boxFav' },
    hl: { list: 'hlColors', last: 'hlCustom', fav: 'hlFav' },
    ink: { list: 'inkColors', last: 'inkCustom', fav: 'inkFav' }
  };
  var keepBoxUntil = 0, cpTarget = null, cpEditing = false, cpKind = 'box', cpPicking = false, cpPending = null, cpSlot = 0;
  function keepEditorFocus(el) {
    el.addEventListener('mousedown', function (e) { e.preventDefault(); });
    el.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }
  function onTap(el, fn) {
    keepEditorFocus(el);
    el.addEventListener('pointerup', function (e) { fn(e); });
    el.addEventListener('click', function (e) { if (e.detail === 0) { fn(e); } });
  }
  function renderBoxFavs() {
    if (!styleBarEl) { return; }
    var bs = styleBarEl.querySelectorAll('.sw[data-color]'), cur = currentStyle().color;
    toolPrefs.boxFav.forEach(function (c, i) {
      var b = bs[i]; if (!b) { return; }
      b.id = 'fav-box-' + i; b.classList.add('fav');
      b.setAttribute('data-color', c); b.style.setProperty('--sw', colorCss(c));
      b.setAttribute('aria-label', (COLOR_NAMES[c] || c) + (cur === c ? '（使用中，再點一次可以換顏色）' : ''));
      b.setAttribute('aria-haspopup', 'dialog');
    });
  }
  function syncBoxCustom() {
    renderBoxFavs();
    if (cpop && !cpop.hidden && !cpPicking && cpKind === 'box') { renderCpop(); }
  }
  var cpop = document.createElement('div'); cpop.className = 'cpop'; cpop.id = 'cpop'; cpop.hidden = true;
  cpop.setAttribute('role', 'dialog'); cpop.setAttribute('aria-label', '換顏色');
  cpop.innerHTML = '<div class="cp-head"><span class="cp-cur" id="cpCur" aria-hidden="true"></span><span class="cp-t" id="cpTitle">我的顏色</span><span class="cp-n" id="cpCount"></span><button type="button" class="cp-edit" id="cpEdit">編輯</button></div>' +
    '<div class="cp-grid" id="cpGrid"></div><div class="cp-note" id="cpNote"></div>';
  document.body.appendChild(cpop);
  renderBoxFavs();
  onTap($('cpEdit'), function () { commitPending(); cpEditing = !cpEditing; renderCpop(); });
  /* 把這一格換成顏色 c，並馬上使用；換下來的顏色收進「我的顏色」，不會不見 */
  function setFav(i, c) {
    var favs = toolPrefs[CP[cpKind].fav], list = toolPrefs[CP[cpKind].list], old = favs[i];
    if (favs.indexOf(c) >= 0 && favs.indexOf(c) !== i) { favs[favs.indexOf(c)] = old; }
    else if (old && old !== c && list.indexOf(old) < 0 && list.length < BOX_MAX) { list.push(old); }
    favs[i] = c;
    saveTools();
    cpApply(c);
    if (cpKind === 'box') { renderBoxFavs(); syncStyleBar(); }
  }
  function cpApply(c) {
    if (cpKind === 'box') {
      if (cpTarget !== null && state.boxes.some(function (x) { return x.id === cpTarget; })) { focusedId = cpTarget; }
      setStyle({ color: c });
      var ed = cpTarget !== null ? document.querySelector('.note-text[data-id="' + cpTarget + '"]') : null;
      if (ed && document.activeElement !== ed && !cpPicking) { try { ed.focus({ preventScroll: true }); } catch (err) { ed.focus(); } }
      return;
    }
    if (cpKind === 'hl') { toolPrefs.hlColor = c; } else { toolPrefs.inkColor = c; }
    saveTools(); renderToolOpts();
  }
  function commitPending() {
    if (!cpPending) { return; }
    var k = cpPending.kind, hex = cpPending.hex, sl = cpPending.slot, list = toolPrefs[CP[k].list];
    cpPending = null; cpPicking = false;
    toolPrefs[CP[k].last] = hex;
    if (list.length < BOX_MAX && list.map(function (x) { return String(x).toLowerCase(); }).indexOf(hex) < 0) { list.push(hex); }
    saveTools();
    if (k === cpKind) { setFav(sl, hex); }
  }
  function renderCpop() {
    var g = $('cpGrid'), list = toolPrefs[CP[cpKind].list], favs = toolPrefs[CP[cpKind].fav], cur = favs[cpSlot];
    g.replaceChildren();
    $('cpCur').style.setProperty('--sw', colorCss(cur));
    $('cpTitle').textContent = cpEditing ? '刪除顏色' : '換成…';
    $('cpCount').textContent = '我的顏色 ' + list.length + ' / ' + BOX_MAX;
    $('cpEdit').textContent = cpEditing ? '完成' : '編輯';
    $('cpEdit').hidden = !list.length;
    cpop.classList.toggle('editing', cpEditing);
    list.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cp-sw';
      b.style.setProperty('--sw', colorCss(c));
      b.setAttribute('aria-label', (cpEditing ? '刪除顏色 ' : '換成 ') + (COLOR_NAMES[c] || c));
      b.setAttribute('aria-pressed', String(!cpEditing && String(cur).toLowerCase() === String(c).toLowerCase()));
      onTap(b, function () {
        if (cpEditing) { list.splice(i, 1); saveTools(); if (!list.length) { cpEditing = false; } renderCpop(); return; }
        setFav(cpSlot, c); closeCpop();
      });
      g.appendChild(b);
    });
    if (!cpEditing) {
      var kind = cpKind, slot = cpSlot, lab = document.createElement('label'); lab.className = 'cp-add'; lab.title = '自訂顏色';
      var full = list.length >= BOX_MAX;
      lab.classList.toggle('full', full);
      var inp = document.createElement('input'); inp.type = 'color'; inp.setAttribute('aria-label', '自訂一個新顏色');
      inp.value = /^#[0-9a-f]{6}$/i.test(toolPrefs[CP[kind].last] || '') ? toolPrefs[CP[kind].last] : '#0f8b8d';
      inp.disabled = full;
      lab.addEventListener('pointerdown', function () { keepBoxUntil = Date.now() + 4000; });
      /* iPad 的選色器有時只送 input、不送 change：選色當下就先套用，關掉小視窗時再存進清單 */
      inp.addEventListener('input', function () {
        var hex = inp.value.toLowerCase();
        cpPicking = true; cpPending = { kind: kind, hex: hex, slot: slot }; keepBoxUntil = Date.now() + 4000;
        lab.style.setProperty('--sw', hex); lab.classList.add('picked');
        $('cpCur').style.setProperty('--sw', hex);
      });
      inp.addEventListener('change', function () {
        cpPending = { kind: kind, hex: inp.value.toLowerCase(), slot: slot };
        commitPending(); closeCpop();
      });
      lab.appendChild(inp);
      g.appendChild(lab);
    }
    $('cpNote').textContent = cpEditing ? '點一個顏色就會刪掉它。' : (list.length >= BOX_MAX ? '已經存滿 50 種，按「編輯」刪掉一些才能再加。' : '點一個顏色換掉這一格；按「＋」自訂新顏色，會存進「我的顏色」。');
  }
  function cpAnchor() { return document.getElementById('fav-' + cpKind + '-' + cpSlot); }
  function placeCpop() {
    var a = cpAnchor(); if (!a) { return; }
    var r = a.getBoundingClientRect(), w = Math.min(300, window.innerWidth - 16);
    cpop.style.width = w + 'px';
    cpop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    cpop.style.top = Math.round(r.bottom + 10) + 'px';
    cpop.style.setProperty('--arrow', Math.round(r.left + r.width / 2 - parseFloat(cpop.style.left)) + 'px');
  }
  function setExpanded() {
    Array.prototype.forEach.call(document.querySelectorAll('.fav[aria-haspopup]'), function (el) { el.setAttribute('aria-expanded', String(!cpop.hidden && el.id === 'fav-' + cpKind + '-' + cpSlot)); });
  }
  function openCpop(kind, slot) {
    commitPending();
    cpKind = kind || 'box'; cpSlot = slot || 0; cpTarget = cpKind === 'box' ? focusedId : null; cpEditing = false;
    renderCpop(); cpop.hidden = false; placeCpop(); setExpanded();
  }
  function closeCpop() {
    if (!cpop || cpop.hidden) { return; }
    commitPending();
    cpop.hidden = true; cpEditing = false; setExpanded();
  }
  document.addEventListener('pointerdown', function (e) {
    if (cpop.hidden || cpop.contains(e.target)) { return; }
    var a = cpAnchor(); if (a && (e.target === a || a.contains(e.target))) { return; }
    closeCpop();
  }, true);
  window.addEventListener('scroll', function () { if (!cpop.hidden) { placeCpop(); } }, { passive: true });
  window.addEventListener('resize', function () { if (!cpop.hidden) { placeCpop(); } });

