  /* ---------- 1.21 加入文件只剩一個「加入檔案」：PDF、照片、影片、文字檔都從同一個按鈕選，App 自己分辨 ---------- */
  function addKind(f) {
    var n = f.name || '', t = f.type || '';
    if (t === 'application/pdf' || /\.pdf$/i.test(n)) { return 'pdf'; }
    if (/^video\//.test(t) || /\.(mp4|mov|m4v|webm)$/i.test(n)) { return 'video'; }
    if (/^image\//.test(t) || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(n)) { return 'image'; }
    if (/^text\//.test(t) || /\.(txt|srt|vtt)$/i.test(n)) { return 'text'; }
    return '';
  }
  /* 字幕檔（.srt／.vtt）去掉編號和時間，只留台詞 */
  function addSubText(s) {
    return s.replace(/\r/g, '').replace(/^WEBVTT[^\n]*\n/, '').split(/\n{2,}/).map(function (blk) {
      return blk.split('\n').filter(function (l) { return !/^\d+$/.test(l.trim()) && !/-->/.test(l) && !/^(NOTE|STYLE)\b/.test(l); }).map(function (l) { return l.replace(/<[^>]+>/g, '').trim(); }).filter(Boolean).join('\n');
    }).filter(Boolean).join('\n');
  }
  function addTextFile(f) {
    var rd = new FileReader();
    rd.onload = function () {
      var s = String(rd.result || '');
      if (/\.(srt|vtt)$/i.test(f.name)) { s = addSubText(s); }
      $('input').value = s; $('textTitle').value = f.name.replace(/\.[^.]+$/, '').slice(0, 60);
      libAddText();
    };
    rd.onerror = function () { $('homeMsg').textContent = '讀不到「' + f.name + '」。'; };
    rd.readAsText(f);
  }
  function libAddAny(list) {
    var all = Array.prototype.slice.call(list || []), by = { pdf: [], image: [], video: [], text: [], '': [] };
    all.forEach(function (f) { by[addKind(f)].push(f); });
    if (by[''].length) { $('homeMsg').textContent = '「' + by[''].map(function (f) { return f.name; }).join('、') + '」不是 PDF、照片、影片或文字檔，沒有加入。'; }
    if (by.pdf.length) { libAddPdfFiles(by.pdf); }
    if (by.image.length) { libAddImages(by.image); }
    if (by.video.length) { libAddVideo(by.video[0]); if (by.video.length > 1) { $('homeMsg').textContent = '影片一次讀一部，先讀「' + by.video[0].name + '」。'; } }
    if (by.text.length) { addTextFile(by.text[0]); }
  }
  $('anyfile').addEventListener('change', function () { var fs = Array.prototype.slice.call(this.files || []); this.value = ''; libAddAny(fs); });
  /* 電腦上：把檔案拖進主頁也可以 */
  (function () {
    var hv = $('view-home'), depth = 0;
    function hasFiles(e) { var t = e.dataTransfer && e.dataTransfer.types; return t && Array.prototype.indexOf.call(t, 'Files') >= 0; }
    hv.addEventListener('dragenter', function (e) { if (!hasFiles(e)) { return; } e.preventDefault(); depth++; hv.classList.add('dropping'); });
    hv.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
    hv.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) { hv.classList.remove('dropping'); } });
    hv.addEventListener('drop', function (e) { if (!hasFiles(e)) { return; } e.preventDefault(); depth = 0; hv.classList.remove('dropping'); libAddAny(e.dataTransfer.files); });
  })();
