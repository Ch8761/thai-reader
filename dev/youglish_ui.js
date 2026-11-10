  /* ---------- 聽真人發音（YouGlish）：查詞視窗「外部字典」那一行的「真人發音」 ----------
     按了才載入 YouGlish 的播放器（YouTube 影片裡真的有人講這個詞的片段）。平常不連線、不載入任何東西。
     YouGlish 規定「Powered by YouGlish.com」要一直看得到；隱私權政策要附 YouTube 條款與 Google 隱私權政策。 */
  var YG_SRC = 'https://youglish.com/public/emb/widget.js';
  var ygWidget = null, ygLoading = null, ygWord = '', ygShown = false;
  var ygWrap = document.createElement('div'); ygWrap.className = 'cdlayer yglayer'; ygWrap.id = 'ygSheet'; ygWrap.hidden = true;
  ygWrap.innerHTML = '<div class="cdback" id="ygBack"></div><div class="cdsheet ygsheet" role="dialog" aria-modal="true" aria-labelledby="ygTitle"><div class="cdscroll">' +
    '<button type="button" class="cdx" id="ygClose" aria-label="關閉">×</button><h2 class="vptitle" id="ygTitle">真人發音</h2>' +
    '<p class="vptip" id="ygTip">YouTube 影片裡有人說到這個詞的片段。按 ‹ › 換下一段。</p>' +
    '<div class="ygconsent" id="ygConsent" hidden><p>第一次使用：這會載入 YouGlish 和 YouTube 的內容（它們會使用 Cookie）。</p><button type="button" class="primary" id="ygOk">繼續</button></div>' +
    '<div class="ygmsg" id="ygMsg" hidden></div>' +
    '<div class="ygbox" id="ygBox"><div id="ygWidget"></div></div>' +
    '<p class="ygcredit">Powered by <a href="https://youglish.com" target="_blank" rel="noopener noreferrer">YouGlish.com</a> · 影片來自 YouTube（<a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube 服務條款</a>）</p>' +
    '</div></div>';
  document.body.appendChild(ygWrap);
  function ygMsg(t) { var m = $('ygMsg'); m.textContent = t || ''; m.hidden = !t; }
  function ygConsented() { try { return localStorage.getItem('thai-yg-ok') === '1'; } catch (err) { return false; } }
  function ygLoad() {
    if (window.YG && window.YG.Widget) { return Promise.resolve(); }
    if (ygLoading) { return ygLoading; }
    ygLoading = new Promise(function (ok, bad) {
      var done = false;
      var prev = window.onYouglishAPIReady;
      window.onYouglishAPIReady = function () { done = true; if (typeof prev === 'function') { try { prev(); } catch (err) {} } ok(); };
      var tag = document.createElement('script'); tag.src = YG_SRC; tag.async = true;
      tag.onerror = function () { ygLoading = null; bad(new Error('load')); };
      document.head.appendChild(tag);
      setTimeout(function () { if (!done) { ygLoading = null; bad(new Error('timeout')); } }, 20000);
    });
    return ygLoading;
  }
  function ygWidth() { var b = $('ygBox'); return Math.max(260, Math.min(640, Math.floor((b && b.clientWidth) || 320))); }
  function ygFetch() {
    if (!ygWord) { return; }
    if (!navigator.onLine) { ygMsg('現在沒有網路，連上網路後再試一次。'); return; }
    ygMsg('載入中…');
    ygLoad().then(function () {
      if (!ygWidget) {
        ygWidget = new window.YG.Widget('ygWidget', {
          width: ygWidth(),
          components: 8 + 16 + 64,   /* 字幕、速度、上一段／下一段 */
          autoStart: 1,
          events: {
            onFetchDone: function (ev) { ygMsg(ev && ev.totalResult === 0 ? 'YouGlish 還沒有收錄有人說「' + ygWord + '」的影片。可以按「朗讀」聽電腦發音。' : ''); },
            onError: function () { ygMsg('影片載入失敗，等一下再試一次。'); }
          }
        });
      }
      ygWidget.fetch(ygWord, 'Thai');
    }).catch(function () { ygMsg('連不到 YouGlish。請確認網路，或等一下再試。'); });
  }
  function ygOpen(word) {
    ygWord = String(word || '').trim();
    if (!ygWord) { return; }
    $('ygTitle').textContent = '真人發音：' + ygWord;
    ygWrap.hidden = false; ygShown = true;
    if (!ygConsented()) { $('ygConsent').hidden = false; $('ygBox').hidden = true; ygMsg(''); return; }
    $('ygConsent').hidden = true; $('ygBox').hidden = false;
    ygFetch();
  }
  function ygClose() {
    ygWrap.hidden = true; ygShown = false;
    if (ygWidget) { try { ygWidget.pause(); } catch (err) {} }
  }
  $('ygOk').addEventListener('click', function () {
    try { localStorage.setItem('thai-yg-ok', '1'); } catch (err) {}
    $('ygConsent').hidden = true; $('ygBox').hidden = false;
    ygFetch();
  });
  $('ygClose').addEventListener('click', ygClose);
  $('ygBack').addEventListener('click', ygClose);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ygShown) { ygClose(); } });
  /* 查詞視窗用：外部字典那一行的按鈕 */
  function ygButton(word) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ext ygbtn';
    b.textContent = '真人發音'; b.setAttribute('aria-label', '聽 YouTube 影片裡的真人發音（YouGlish）');
    b.addEventListener('click', function () { ygOpen(word); });
    return b;
  }
  window.ygOpen = ygOpen;
