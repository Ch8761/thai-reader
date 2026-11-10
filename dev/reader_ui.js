  /* ---------- 讀物庫：依程度分好的泰文短文，點一篇就加入「我的文件」並打開 ----------
     短文放在 reader.json（打開讀物庫時才下載）。加入的文件記住 d.lib＝短文編號，避免重複加入。 */
  var READER_URL = 'reader.json';
  var rdItems = null, rdLoading = null, rdLevel = 'b';
  var RD_LV = [['a', '入門'], ['b', '初級'], ['c', '中級']];
  var rdWrap = document.createElement('div'); rdWrap.className = 'cdlayer rdlayer'; rdWrap.id = 'readerSheet'; rdWrap.hidden = true;
  rdWrap.innerHTML = '<div class="cdback" id="rdBack"></div><div class="cdsheet rdsheet" role="dialog" aria-modal="true" aria-labelledby="rdTitle"><div class="cdscroll">' +
    '<button type="button" class="cdx" id="rdClose" aria-label="關閉">×</button>' +
    '<h2 class="vptitle" id="rdTitle">讀物庫</h2>' +
    '<p class="vptip">依程度分好的短文。點一篇，就會加入「我的文件」並打開，可以點字查詞、做筆記。</p>' +
    '<div class="rdtabs" role="tablist" aria-label="程度" id="rdTabs"></div>' +
    '<div class="rdmsg" id="rdMsg" hidden></div>' +
    '<ul class="rdlist" id="rdList"></ul>' +
    '<p class="rdcredit">這些短文是 Claude（AI）為 ไทย Reader 寫的原創內容。讀到不自然的地方，歡迎到「設定 → 說明與回饋」告訴我們。</p>' +
    '</div></div>';
  document.body.appendChild(rdWrap);
  RD_LV.forEach(function (L) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-lv', L[0]); b.textContent = L[1];
    b.addEventListener('click', function () { rdLevel = L[0]; rdRender(); });
    $('rdTabs').appendChild(b);
  });
  function rdLoad() {
    if (rdItems) { return Promise.resolve(rdItems); }
    if (rdLoading) { return rdLoading; }
    rdLoading = fetch(READER_URL).then(function (r) { if (!r.ok) { throw new Error(String(r.status)); } return r.json(); })
      .then(function (j) { rdItems = j; return j; })
      .catch(function (err) { rdLoading = null; throw err; });
    return rdLoading;
  }
  function rdDocOf(id) { for (var i = 0; i < lib.docs.length; i++) { if (lib.docs[i].lib === id) { return lib.docs[i]; } } return null; }
  function rdMinutes(n) { return Math.max(1, Math.round(n / 80)); }
  function rdRender() {
    Array.prototype.forEach.call($('rdTabs').children, function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-lv') === rdLevel)); });
    var ul = $('rdList'); ul.innerHTML = '';
    if (!rdItems) { return; }
    rdItems.filter(function (it) { return it.lv === rdLevel; }).forEach(function (it) {
      var li = document.createElement('li');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rditem'; b.setAttribute('data-id', it.id);
      var have = rdDocOf(it.id);
      var top = document.createElement('span'); top.className = 'rdtop';
      var th = document.createElement('span'); th.className = 'rdth'; th.lang = 'th'; th.textContent = it.th;
      top.appendChild(th);
      if (have) { var bd = document.createElement('span'); bd.className = 'rdbadge'; bd.textContent = '已加入'; top.appendChild(bd); }
      var zh = document.createElement('span'); zh.className = 'rdzh'; zh.textContent = it.zh + '｜' + it.sum;
      var meta = document.createElement('span'); meta.className = 'rdmeta'; meta.textContent = it.topic + '・約 ' + it.n + ' 字・' + rdMinutes(it.n) + ' 分鐘';
      b.appendChild(top); b.appendChild(zh); b.appendChild(meta);
      b.addEventListener('click', function () { rdOpenItem(it); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function rdOpenItem(it) {
    var have = rdDocOf(it.id);
    rdClose();
    if (have) { openDoc(have.id); return; }
    var id = 'text:' + Date.now().toString(36), name = it.th + '｜' + it.zh;
    lib.docs.push({ id: id, name: name, type: 'text', size: it.text.length, added: Date.now(), opened: 0, folder: libTarget(), lib: it.id });
    saveLib();
    try { localStorage.setItem(PDF_DOC_PREFIX + id, JSON.stringify({ text: it.text, src: { type: 'text', id: id, name: name }, hl: [], strokes: [], boxes: [], nextId: 1 })); } catch (err) {}
    $('homeMsg').textContent = '';
    openDoc(id);
  }
  function rdOpen() {
    var lv = 'b'; try { lv = localStorage.getItem('thai-level') || 'b'; } catch (err) {}
    rdLevel = lv === 'd' ? 'c' : (lv === 'a' || lv === 'c' ? lv : 'b');
    rdWrap.hidden = false;
    $('rdMsg').hidden = true; rdRender();
    if (!rdItems) { $('rdMsg').textContent = '載入中…'; $('rdMsg').hidden = false; }
    rdLoad().then(function () { $('rdMsg').hidden = true; rdRender(); })
      .catch(function () { $('rdMsg').textContent = navigator.onLine ? '讀物庫載入失敗，等一下再試一次。' : '第一次打開讀物庫需要網路。連上網路後再試一次。'; $('rdMsg').hidden = false; });
  }
  function rdClose() { rdWrap.hidden = true; }
  $('rdClose').addEventListener('click', rdClose);
  $('rdBack').addEventListener('click', rdClose);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !rdWrap.hidden) { rdClose(); } });
  if ($('readerOpen')) { $('readerOpen').addEventListener('click', rdOpen); }
  window.readerOpen = rdOpen;
