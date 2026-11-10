  /* ---------- 貼上網址就匯入：由網站上的小程式（/api/fetch）代抓網頁，App 自己找出文章內文，做成可點詞的文件 ---------- */
  var URL_API = 'api/fetch';
  function urlLooksLike(s) { return /^\s*https?:\/\/[^\s]+\s*$/i.test(s || ''); }
  function urlThaiCount(s) { return (String(s).match(/[ก-๛]/g) || []).length; }
  /* 編碼：先看伺服器說的，再看網頁裡寫的；泰文舊網站常用 TIS-620（windows-874） */
  function urlDecode(buf, type) {
    var bytes = new Uint8Array(buf), cs = (/charset=([\w-]+)/i.exec(type || '') || [])[1];
    if (!cs) {
      var head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
      cs = (/<meta[^>]+charset=["']?([\w-]+)/i.exec(head) || [])[1];
    }
    cs = (cs || 'utf-8').toLowerCase();
    if (/tis-?620|iso-8859-11|x-windows-874/.test(cs)) { cs = 'windows-874'; }
    try { return new TextDecoder(cs).decode(bytes); } catch (err) { return new TextDecoder('utf-8').decode(bytes); }
  }
  function urlClean(t) { return String(t || '').replace(/ /g, ' ').replace(/[ \t\f\v​]+/g, ' ').replace(/ *\n */g, '\n').trim(); }
  /* 文章結構化資料（很多新聞網站有）：直接拿內文 */
  var urlLdHead = '';
  function urlLdBody(doc) {
    var best = ''; urlLdHead = '';
    Array.prototype.forEach.call(doc.querySelectorAll('script[type="application/ld+json"]'), function (s) {
      var data = null; try { data = JSON.parse(s.textContent); } catch (err) { return; }
      (function walk(o, depth) {
        if (!o || depth > 6) { return; }
        if (Array.isArray(o)) { o.forEach(function (x) { walk(x, depth + 1); }); return; }
        if (typeof o === 'object') {
          if (typeof o.articleBody === 'string' && o.articleBody.length > best.length) { best = o.articleBody; if (typeof o.headline === 'string') { urlLdHead = o.headline; } }
          else if (!urlLdHead && typeof o.headline === 'string' && /Article|Posting/i.test(String(o['@type'] || ''))) { urlLdHead = o.headline; }
          Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === 'object') { walk(o[k], depth + 1); } });
        }
      })(data, 0);
    });
    if (best && /<\w+[^>]*>/.test(best)) { var d2 = new DOMParser().parseFromString(best, 'text/html'); best = d2.body.innerText || d2.body.textContent || ''; }
    return urlClean(best);
  }
  var URL_JUNK = /(comment|share|social|related|recommend|advert|^ads?$|ads?[-_]|sponsor|promo|sidebar|footer|header|navbar|menu|breadcrumb|subscribe|newsletter|popup|modal|cookie|banner|widget|tags?$|author-box|read-?more|more-?news|trending|popular|login)/i;
  /* 找出網頁裡的文章本文：泰文字最多的那一塊（像瀏覽器的「閱讀模式」） */
  function urlArticle(html, pageUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var meta = function (sel) { var m = doc.querySelector(sel); return m ? (m.getAttribute('content') || '').trim() : ''; };
    var site = meta('meta[property="og:site_name"]');
    var title = meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]') || ((doc.querySelector('h1') || {}).textContent || '').trim() || (doc.title || '').trim();
    title = urlClean(title).replace(/\s+/g, ' ');
    if (site && title.length > site.length + 3) { title = title.replace(new RegExp('\\s*[|\\-–—:·•]\\s*' + site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$'), ''); }
    var ld = urlLdBody(doc);
    /* 標題：文章結構化資料的標題最乾淨；沒有的話，網頁標題後面「 - 網站名稱」「 | 網站名稱」拿掉 */
    if (urlLdHead && urlThaiCount(urlLdHead) >= 4) { title = urlClean(urlLdHead); }
    else { var m2 = /^(.{8,}?)\s+[|\-–—]\s+[^|\-–—]{2,30}$/.exec(title); if (m2 && urlThaiCount(m2[1]) >= 4) { title = m2[1]; } }
    ['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'form', 'nav', 'header', 'footer', 'aside', 'button', 'select', 'template', 'object', 'video', 'audio'].forEach(function (t) {
      Array.prototype.forEach.call(doc.querySelectorAll(t), function (e) { e.remove(); });
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[aria-hidden="true"], [hidden], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'), function (e) { e.remove(); });
    Array.prototype.slice.call(doc.body ? doc.body.querySelectorAll('*') : []).forEach(function (e) {
      if (!e.isConnected) { return; }
      var key = (e.className && typeof e.className === 'string' ? e.className : '') + ' ' + (e.id || '');
      if (key.trim() && URL_JUNK.test(key) && !/article|content|story|entry|post-body|detail/i.test(key)) {
        /* 被標成側欄、留言之類的，但裡面泰文很多的不刪（有些網站的類別名稱亂取） */
        if (urlThaiCount(e.textContent) < 400) { e.remove(); }
      }
    });
    /* 每一段（p、li…）的泰文字數加給上一層和上上一層，分數最高的就是本文的容器 */
    var score = new Map();
    Array.prototype.forEach.call(doc.querySelectorAll('p, li, blockquote, pre, td, h2, h3, div'), function (e) {
      var own = '';
      if (e.tagName === 'DIV') { Array.prototype.forEach.call(e.childNodes, function (n) { if (n.nodeType === 3) { own += n.textContent; } }); }
      else { own = e.textContent; }
      var n = urlThaiCount(own);
      if (n < 20) { return; }
      var bonus = e.tagName === 'P' ? 1.2 : 1;
      var p1 = e.parentElement, p2 = p1 && p1.parentElement;
      if (p1) { score.set(p1, (score.get(p1) || 0) + n * bonus); }
      if (p2) { score.set(p2, (score.get(p2) || 0) + n * bonus / 2); }
    });
    var top = null, topS = 0;
    score.forEach(function (s, e) {
      var tag = e.tagName, k = (e.className || '') + ' ' + (e.id || '');
      if (tag === 'ARTICLE' || /article|content|story|entry|detail|post/i.test(k)) { s *= 1.15; }
      if (s > topS) { top = e; topS = s; }
    });
    /* 本文常被拆在幾個兄弟節點裡：分數夠高的兄弟一起收進來 */
    var parts = [];
    if (top) {
      var par = top.parentElement;
      if (par) {
        Array.prototype.forEach.call(par.children, function (sib) {
          if (sib === top || (score.get(sib) || 0) >= topS * 0.25) { parts.push(sib); }
        });
      } else { parts = [top]; }
    }
    var lines = [];
    function grab(root) {
      var blocks = root.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, pre, figcaption, td');
      if (!blocks.length) { lines.push(root.textContent); return; }
      Array.prototype.forEach.call(blocks, function (b) {
        if (b.querySelector('p, li, h2, h3, blockquote')) { return; } /* 外層的不重複收 */
        var t = urlClean(b.innerText || b.textContent);
        if (t) { lines.push(t); }
      });
      /* 沒有放在段落標籤裡、直接寫在 div 裡的文字 */
      if (urlThaiCount(lines.join('')) < urlThaiCount(root.textContent) * 0.5) { lines = urlClean(root.innerText || root.textContent).split(/\n+/); }
    }
    parts.forEach(grab);
    var text = lines.map(urlClean).filter(function (l, i, a) { return l && a.indexOf(l) === i; }).join('\n');
    /* 結構化資料比較完整就用它 */
    if (urlThaiCount(ld) > urlThaiCount(text) * 1.1) { text = ld; }
    return { title: title, site: site, text: text, thai: urlThaiCount(text) };
  }
  var URL_ERR = {
    forbidden: '讀取被拒絕了，請重新整理 App 再試一次。',
    bad_url: '這不是一個有效的網址，請確認是以 https:// 開頭的完整網址。',
    blocked: '這個網址不能讀取。',
    timeout: '那個網站太久沒有回應，等一下再試，或改用複製貼上。',
    network: '連不到那個網站，請確認網址正確，或改用複製貼上。',
    status: '那個網站不讓 App 讀取（可能需要登入、付費，或擋掉了自動讀取），備用的讀取方式也失敗了。請在瀏覽器打開文章、全選複製，貼到下面的「貼上泰文」。',
    not_html: '這個網址不是一般網頁（可能是圖片或 PDF 檔）。PDF 可以先下載，再用「＋ 加入 PDF」。'
  };
  async function urlFetchArticle(raw) {
    var u = String(raw || '').trim();
    if (/\s/.test(u) || !/\./.test(u)) { throw new Error(URL_ERR.bad_url); }
    if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; }
    try { u = new URL(u).toString(); } catch (err) { throw new Error(URL_ERR.bad_url); }
    if (/(^|\.)(facebook|instagram|x|twitter|tiktok|threads)\.(com|net)$/i.test(new URL(u).hostname)) { throw new Error('Facebook、IG、X、TikTok 要登入才看得到內容，沒辦法直接讀取。可以複製貼文文字，用下面的「貼上泰文」加入。'); }
    var a = await urlFetchOnce(u, false);
    /* 直接讀到的網頁裡找不到泰文本文（常見於用程式載入內容的網站）：改請閱讀服務用瀏覽器打開再讀一次 */
    if (a.thai < 60 && a.via !== 'reader') {
      try { var b2 = await urlFetchOnce(u, true); if (b2.thai > a.thai) { a = b2; } } catch (err) {}
    }
    if (a.thai < 60) { throw new Error('這個網頁找不到泰文文章內容（可能是英文網頁、要登入才看得到，或內容是用程式載入的）。可以在瀏覽器打開文章、全選複製，再用下面的「貼上泰文」加入。'); }
    return a;
  }
  async function urlFetchOnce(u, viaReader) {
    var r;
    try { r = await fetch(URL_API + '?url=' + encodeURIComponent(u) + (viaReader ? '&via=reader' : ''), { credentials: 'same-origin' }); }
    catch (err) { throw new Error(navigator.onLine === false ? '現在沒有網路，連上網路後再試。' : '讀取失敗，請確認有網路後再試一次。'); }
    if (r.status === 404 && !/json/.test(r.headers.get('content-type') || '')) { throw new Error('這個網址的 App 還不能讀取文章。請到新網址 thai-reader-enn.pages.dev 使用這個功能。'); }
    if (/json/.test(r.headers.get('content-type') || '')) {
      var j = {}; try { j = await r.json(); } catch (err) {}
      if (j.reader === 429) { throw new Error('那個網站不讓 App 直接讀取，備用的讀取服務現在太多人在用（429）。等一分鐘再按一次「讀取文章」，或在瀏覽器打開文章、全選複製，貼到下面的「貼上泰文」。'); }
      throw new Error((URL_ERR[j.error] || '讀取失敗。') + (j.status ? '（網站回應 ' + j.status + (j.reader ? '，備用讀取 ' + j.reader : '') + '）' : ''));
    }
    var fin = u; try { fin = decodeURI(r.headers.get('x-final-url') || u); } catch (err) {}
    var html = urlDecode(await r.arrayBuffer(), r.headers.get('x-source-type'));
    var a = urlArticle(html, fin);
    if (/^https?:\/\/r\.jina\.ai\//.test(fin)) { fin = u; }
    a.url = viaReader ? u : fin; a.via = r.headers.get('x-via') || (viaReader ? 'reader' : 'direct');
    return a;
  }
  var urlBusy = false, urlLastFail = null;
  async function libAddUrl(raw) {
    if (urlBusy) { return; }
    var btn = $('addUrl'), msg = $('homeMsg');
    urlBusy = true; if (btn) { btn.disabled = true; btn.textContent = '讀取中…'; }
    $('urlFail').hidden = true;
    msg.textContent = '正在讀取文章…（有些網站要等 10–20 秒）';
    try {
      var a = await urlFetchArticle(raw);
      var name = (a.title || a.text.slice(0, 24)).slice(0, 60);
      var id = 'text:' + Date.now().toString(36);
      lib.docs.push({ id: id, name: name, type: 'text', size: a.text.length, added: Date.now(), opened: 0, folder: libTarget(), url: a.url, site: a.site || '' });
      saveLib();
      try { localStorage.setItem(PDF_DOC_PREFIX + id, JSON.stringify({ text: a.text, src: { type: 'text', id: id, name: name, url: a.url }, hl: [], strokes: [], boxes: [], nextId: 1 })); } catch (err) {}
      $('urlInput').value = ''; $('input').value = ''; $('textTitle').value = ''; $('pastebox').hidden = true; $('openPaste').setAttribute('aria-expanded', 'false');
      msg.textContent = '已匯入「' + name + '」' + (a.site ? '（' + a.site + '）' : '') + '。內文是自動整理的，開頭或結尾可能多了幾行網站的文字，可以忽略。';
      setTimeout(function () { if (/^已匯入/.test(msg.textContent)) { msg.textContent = ''; } }, 12000);
      openDoc(id);
    } catch (err) {
      msg.textContent = String(err && err.message || err);
      /* 讀不到：可以一鍵回報這個網址（網址打錯的不用） */
      if (!/有效的網址/.test(msg.textContent)) { urlLastFail = { url: String(raw).trim(), msg: msg.textContent }; $('urlFail').hidden = false; }
    } finally {
      urlBusy = false; if (btn) { btn.disabled = false; btn.textContent = '讀取文章'; }
    }
  }
  $('addUrl').addEventListener('click', function () {
    var v = $('urlInput').value.trim();
    if (!v) { $('homeMsg').textContent = '請先貼上文章的網址。'; $('urlInput').focus(); return; }
    libAddUrl(v);
  });
  $('urlInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('addUrl').click(); } });
  /* 回報讀不到的網址：打開意見回饋，類型選「問題回報」，網址和錯誤訊息先填好，使用者確認後按送出 */
  $('urlReport').addEventListener('click', function () {
    var f = urlLastFail; if (!f) { return; }
    showTab('settings'); if (typeof settingsOpen === 'function') { settingsOpen('help'); }
    fbCat = 'bug'; renderFeedback();
    $('fbText').value = '讀不到這個網址：' + f.url + '\n畫面上的訊息：' + f.msg + '\n\n（可以補充：這是什麼網站、想讀哪一類文章）';
    $('fbStatus').textContent = '已經幫你填好網址和錯誤訊息，確認後按「送出回饋」就好。';
    setTimeout(function () { var t = $('fbText'); t.scrollIntoView({ block: 'center' }); try { t.focus({ preventScroll: true }); } catch (err) {} }, 60);
    $('urlFail').hidden = true;
  });
