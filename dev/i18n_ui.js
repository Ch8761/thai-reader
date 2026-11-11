  /* ---------- 1.21 介面語言：中文／English ----------
     做法：畫面上的中文字（文字、placeholder、aria-label、title、alt）用對照表換成英文；
     之後新出現的字用 MutationObserver 隨時換。數字會先換成 {n} 再查表；組合句用「、・；｜」拆開分別查；
     程式拼起來的句子用片段替換，換完還有中文就保留原文（避免中英夾雜的半句）。
     文章內容、字典的中文意思、使用者自己打的字都不碰。 */
  var UI_LANG = (function () { try { return localStorage.getItem('thai-ui-lang') === 'en' ? 'en' : 'zh'; } catch (err) { return 'zh'; } })();
  var I18N_CJK = /[㐀-鿿]/;
  var I18N_SKIP = '#text, .textLayer, textarea, [contenteditable], [data-noi18n], .zhline, .cm, .cmy, .gzt, .guse, .gzh, .gname, .gguess, .gsim, .ent-note, .zhnote, .tr-out, .trout, #trBody, .sp-tr, #ocrList';
  var i18nMap = null, i18nTpl = null, i18nFrag = null, i18nCache = new Map();
  function i18nInit() {
    if (i18nMap) { return; }
    i18nMap = {}; i18nTpl = {}; var fr = [];
    Object.keys(I18N_EN).forEach(function (k) {
      var v = I18N_EN[k], t = k.trim();
      if (k.indexOf('{n}') >= 0) { i18nTpl[t] = v; return; }
      if (k === t) { i18nMap[t] = v; } else if (i18nMap[t] === undefined) { i18nMap[t] = v; }
      /* 片段：至少兩個中文字，或前後帶空白（數字接在旁邊的那種） */
      var nc = (k.match(/[㐀-鿿]/g) || []).length;
      if (nc >= 2 || (nc >= 1 && /^\s|\s$/.test(k))) { fr.push([k, v]); }
    });
    fr.sort(function (a, b) { return b[0].length - a[0].length; });
    i18nFrag = fr;
  }
  function i18nPlural(v, nums) {
    var i = 0;
    return v.replace(/\{n(?:\|([^|}]*)\|([^}]*))?\}/g, function (m, one, many) {
      var n = nums[i++]; if (n === undefined) { n = ''; }
      if (one === undefined) { return n; }
      return n + ' ' + (String(n).replace(/,/g, '') === '1' ? one : many);
    });
  }
  function i18nCore(t) {
    if (!I18N_CJK.test(t)) { return t; }
    if (i18nMap[t] !== undefined) { return i18nMap[t]; }
    /* 數字樣板 */
    var nums = [], k = t.replace(/\d[\d,]*(?:\.\d+)?/g, function (m) { nums.push(m); return '{n}'; });
    if (nums.length && i18nTpl[k] !== undefined) { return i18nPlural(i18nTpl[k], nums); }
    if (nums.length && i18nMap[k.replace(/\{n\}/g, '')] !== undefined) { /* 例如「3 天」以外的單位已在片段裡處理 */ }
    var m;
    if ((m = t.match(/^(.+?)（(\d[\d,]*)）$/))) { var a = i18nCore(m[1]); if (a != null && !I18N_CJK.test(a)) { return a + ' (' + m[2] + ')'; } }
    if ((m = t.match(/^(.+?)（(.+)）$/))) { var a2 = i18nCore(m[1]), b2 = i18nCore(m[2]); if (a2 != null && b2 != null && !I18N_CJK.test(a2 + b2)) { return a2 + ' (' + b2.replace(/^\(|\)$/g, '') + ')'; } }
    if ((m = t.match(/^「(.+)」是什麼？$/))) { var q = i18nCore(m[1]); if (q != null && !I18N_CJK.test(q)) { return 'What is “' + q + '”?'; } }
    /* 用分隔符號拆開分別翻 */
    var seps = [['｜', ' | '], ['・', ' · '], ['；', '; '], ['、', ', '], ['：', ': '], ['，', ', ']];
    for (var s = 0; s < seps.length; s++) {
      if (t.indexOf(seps[s][0]) > 0) {
        var parts = t.split(seps[s][0]).map(function (x) { return i18nCore(x.trim()); });
        if (parts.every(function (x) { return x != null && !I18N_CJK.test(x); })) { return parts.join(seps[s][1]); }
      }
    }
    /* 片段替換：換完沒有中文才採用 */
    var out = t;
    for (var i = 0; i < i18nFrag.length; i++) { var f = i18nFrag[i][0]; if (out.indexOf(f) >= 0) { out = out.split(f).join(i18nFrag[i][1]); if (!I18N_CJK.test(out)) { break; } } }
    out = out.replace(/「/g, '“').replace(/」/g, '”').replace(/（/g, ' (').replace(/）/g, ')').replace(/：/g, ': ').replace(/，/g, ', ').replace(/、/g, ', ').replace(/；/g, '; ').replace(/。/g, '. ').replace(/\s{2,}/g, ' ');
    return I18N_CJK.test(out) ? null : out.trim();
  }
  function tr(s) {
    if (UI_LANG !== 'en' || s == null) { return s; }
    s = String(s);
    if (!I18N_CJK.test(s)) { return s; }
    i18nInit();
    if (i18nCache.has(s)) { return i18nCache.get(s); }
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    var r = i18nCore(core); r = r == null ? s : lead + r + trail;
    if (i18nCache.size > 4000) { i18nCache.clear(); }
    i18nCache.set(s, r);
    return r;
  }
  /* 寬鬆版：給要複製給 AI 的問題用，使用者自己打的中文可以留著 */
  function trLoose(s) {
    if (UI_LANG !== 'en') { return s; }
    i18nInit();
    return String(s).split('\n').map(function (line) {
      var full = tr(line); if (full !== line) { return full; }
      var out = line;
      i18nFrag.forEach(function (f) { if (out.indexOf(f[0]) >= 0) { out = out.split(f[0]).join(f[1]); } });
      return out.replace(/「/g, '“').replace(/」/g, '”');
    }).join('\n');
  }
  function i18nSkip(el) { return !el || (el.closest && el.closest(I18N_SKIP)) || el.isContentEditable; }
  var I18N_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function i18nText(n) {
    var v = n.nodeValue; if (!v || !I18N_CJK.test(v)) { return; }
    var p = n.parentNode; if (!p || p.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.nodeName) || i18nSkip(p)) { return; }
    var r = tr(v); if (r !== v) { n.nodeValue = r; }
  }
  function i18nAttrs(el) {
    if (i18nSkip(el)) { return; }
    for (var i = 0; i < I18N_ATTRS.length; i++) { var a = I18N_ATTRS[i], v = el.getAttribute(a); if (v && I18N_CJK.test(v)) { var r = tr(v); if (r !== v) { el.setAttribute(a, r); } } }
  }
  function i18nWalk(root) {
    if (!root) { return; }
    if (root.nodeType === 3) { i18nText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) { return; }
    if (root.nodeType === 1) { if (i18nSkip(root)) { return; } i18nAttrs(root); }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.nodeType === 1 && i18nSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var n; while ((n = w.nextNode())) { if (n.nodeType === 3) { i18nText(n); } else { i18nAttrs(n); } }
  }
  if (UI_LANG === 'en') {
    document.documentElement.lang = 'en';
    document.documentElement.classList.add('ui-en');
    i18nWalk(document.body);
    if (document.title && I18N_CJK.test(document.title)) { document.title = tr(document.title); }
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') { i18nText(m.target); }
        else if (m.type === 'attributes') { if (m.target.nodeType === 1) { i18nAttrs(m.target); } }
        else { m.addedNodes.forEach(i18nWalk); }
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
    ['alert', 'confirm', 'prompt'].forEach(function (k) {
      var f = window[k]; if (typeof f !== 'function') { return; }
      window[k] = function (msg) { var args = Array.prototype.slice.call(arguments); args[0] = tr(msg); return f.apply(window, args); };
    });
    setTimeout(function () { if (typeof HELP_EN !== 'undefined') { HELP = HELP_EN; } }, 0);
    var _bp0 = buildPrompt; buildPrompt = function () { return trLoose(_bp0.apply(this, arguments)); };
  }
  /* 設定：外觀與字體 → 介面語言（切換後重新載入；詞義語言跟著換，之後可以另外改） */
  (function () {
    var g = $('uiLangGroup'); if (!g) { return; }
    g.setAttribute('data-noi18n', '');
    segButtons(g, [['zh', '中文'], ['en', 'English']], UI_LANG, function (v) {
      if (v === UI_LANG) { return; }
      try { localStorage.setItem('thai-ui-lang', v); localStorage.setItem('thai-gloss-lang', v === 'en' ? 'en' : 'zh'); } catch (err) {}
      location.reload();
    });
  })();
