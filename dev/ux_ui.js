  /* ---------- 主頁的文件縮圖：PDF 顯示第一頁，文字文件顯示開頭幾行 ---------- */
  var THUMBS = {}, thumbQueue = [], thumbBusy = false;
  function docIcon(d) {
    var icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    if (d.type === 'pdf') {
      icon.className = 'dicon pdf';
      if (THUMBS[d.id]) { setThumb(icon, THUMBS[d.id]); }
      else { icon.textContent = 'PDF'; icon.setAttribute('data-tid', d.id); queueThumb(d.id); }
    } else {
      icon.className = 'dicon textprev'; icon.lang = 'th';
      icon.textContent = docSnippet(d);
    }
    return icon;
  }
  function setThumb(icon, url) {
    icon.textContent = ''; icon.classList.add('thumb');
    var im = new Image(); im.alt = ''; im.src = url; icon.appendChild(im);
  }
  function docSnippet(d) {
    if (d.snip) { return d.snip; }
    try {
      var o = JSON.parse(localStorage.getItem(PDF_DOC_PREFIX + d.id) || 'null');
      if (o && o.text) { d.snip = o.text.replace(/\s+/g, ' ').slice(0, 70); return d.snip; }
    } catch (err) {}
    return '文';
  }
  function queueThumb(id) {
    if (thumbQueue.indexOf(id) < 0) { thumbQueue.push(id); }
    if (!thumbBusy) { thumbBusy = true; setTimeout(nextThumb, 300); }
  }
  async function nextThumb() {
    var id = thumbQueue.shift();
    if (!id) { thumbBusy = false; return; }
    try {
      var url = await idbGet('thumb:' + id);
      if (!url) {
        var bytes = await idbGet(id);
        if (bytes) {
          await ensureLibs();
          var doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
          var page = await doc.getPage(1), vp1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 160 / vp1.width });
          var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
          await page.render({ canvasContext: g, viewport: vp }).promise;
          url = c.toDataURL('image/jpeg', 0.75);
          try { doc.destroy(); } catch (err) {}
          try { idbPut('thumb:' + id, url); } catch (err) {}
        }
      }
      if (url) {
        THUMBS[id] = url;
        Array.prototype.forEach.call(document.querySelectorAll('.dicon[data-tid]'), function (el) { if (el.getAttribute('data-tid') === id) { el.removeAttribute('data-tid'); setThumb(el, url); } });
      }
    } catch (err) {}
    setTimeout(nextThumb, 50);
  }

  /* ---------- 使用說明：各頁怎麼用，集中在這裡（設定頁、歡迎視窗都能打開） ---------- */
  /* 每一則：粗體重點＋一句話＋截圖（橘框＝要按的地方）＋可以展開的詳細步驟。「」裡的字會畫成按鈕的樣子 */
  var HELP_IMG = 'https://ch8761.github.io/thai-reader/help/';
  var HELP = [
    ['主頁', [
      { t: '清單或方塊', s: '右邊的兩個小圖示切換排列', img: 'home-grid',
        d: ['「清單」：一行一份文件，看得到更多資訊。', '「方塊」：大縮圖、名稱在下面，像 Google 雲端硬碟。', '方塊模式點縮圖就打開；按「⋯」可以搬資料夾或刪除。'] },
      { t: '加文件', s: '按「＋ 加入 PDF」「＋ 圖片／影片」或「＋ 貼上文字」', img: 'home-add',
        d: ['PDF：按「＋ 加入 PDF」，從「檔案」App 選，可以一次選好幾個。', '照片或截圖：按「＋ 圖片／影片」，選好的幾張會合成一份文件。', '逐字稿、文章：先在別的 App 拷貝，按「＋ 貼上文字」，長按文字框選「貼上」，再按「建立文件」。'],
        tip: '新文件會放進目前選的資料夾。' },
      { t: '從網址匯入文章', s: '按「＋ 網址／文字」，貼上新聞網址，按「讀取文章」', img: 'url-panel',
        d: ['在瀏覽器打開泰文新聞或文章，複製網址（分享 → 拷貝）。', '回到 App 主頁按「＋ 網址／文字」，把網址貼進最上面的格子，按「讀取文章」。', 'App 會自動抓下文章內文（去掉選單、廣告、留言），做成可以點詞查詞的文件；文件標題下面有「原文」連結可以回到原網頁。', '要登入或付費才看得到的文章、Facebook／IG／X 的貼文讀不到：改成複製文字，貼在下面的「貼上泰文」。'] },
      { t: '拍招牌、菜單', s: '按「＋ 圖片／影片」拍照或選照片，拖曳四個角框住文字', img: 'photo-edit',
        d: ['選好照片後會先出現「調整照片」：拖曳四個黃色圓點，框住要讀的招牌或菜單。', '斜斜拍的照片會自動拉正成長方形，文字辨識會準很多。', '照片方向不對就按「向左轉」「向右轉」；不需要調整就直接按「完成」。', '一次選好幾張時，每張都可以調整；按「其餘不調整」可以跳過後面的。'] },
      { t: '影片的字幕', s: '按「＋ 圖片／影片」選有泰文字幕的影片', img: 'vid-pick',
        d: ['選一部影片（照片 App 或「檔案」App 裡的都可以）。', 'App 會先找字幕在畫面的哪裡，用黃框框起來。框得不對，就用手指在畫面上重新框住字幕；拉下面的滑桿可以換一個有字幕的畫面看。', '按「開始讀字幕」。App 每秒看一次框裡的畫面，字幕換了就讀一次，最後整理成一份文字文件。', '同一句字幕只會留一次。進度會浮在畫面下方，中途可以按「停止」，已經讀到的會保留。', '沒讀到字幕時，按「重新框字幕」換個位置再試。', '讀出來的結果不滿意：打開那份影片文件，按右上角的「↻」，重新框字幕再讀一次（會取代原本的文字和筆記）。'],
        tip: 'IG、YouTube 的連結不能直接讀：先用 iPad 的「螢幕錄影」把影片錄下來，再加入那段錄影。' },
      { t: '圖片會自動認字', s: '照片、截圖加進來，App 會自己讀出泰文', img: 'home-img',
        d: ['按「＋ 圖片／影片」，選照片或截圖。', 'App 會打開這份文件，自動開始文字辨識（每張約 5–20 秒）。', '完成後就能點字查詞。'],
        tip: '第一次要先下載約 8 MB 的辨識工具，記得連上網路。' },
      { t: '分資料夾', s: '點上面的分類切換，按「＋ 新資料夾」建新的', img: 'home-folders',
        d: ['點「全部」「未分類」或自己建的資料夾，下面只列出那個資料夾的文件。', '按「＋ 新資料夾」，打名字，按「建立」。'] },
      { t: '搬文件', s: '用文件右邊的選單，選要放的資料夾', img: 'home-move',
        d: ['在文件卡片上點寫著資料夾名稱的選單。', '選要搬去的資料夾，就搬好了。'] },
      { t: '改名、刪資料夾', s: '先點進那個資料夾，再按「改名」或「刪除資料夾」', img: 'home-folderbar',
        d: ['點上面自己建的資料夾。', '文件清單上方會出現這個資料夾的名稱，旁邊有「改名」「刪除資料夾」。', '刪除要按兩次才會刪；裡面的文件不會被刪，會移到「未分類」。'] }]],
    ['查詞', [
      { t: '點字查詞', s: '選「點字」，點任何一個泰文字', img: 'tap-tool',
        d: ['確認工具列選的是「點字」（綠色底）。', '用手指點文件裡的任何一個字，會跳出查詞視窗。', '點別的字就換查那個字；按右上角「×」關掉。'] },
      { t: '看懂查詞視窗', s: '最上面是這個詞，下面是詞性、拼音和中文意思', img: 'pop-overview',
        d: ['最上面：你點的詞。', '第二行：詞性（名詞、動詞…）和拼音。', '再下面：中文意思。標「中文自動對照」的是電腦翻的，僅供參考。', '往下捲還有「這句的其他句型」和「整句解析・問 AI」。'] },
      { t: '句型', s: '點「這句的其他句型」裡的一個', img: 'gram-focus',
        d: ['查詞視窗的「句型說明」是你點的詞用到的句型。', '「這句的其他句型」是同一句裡的其他句型：點一個，文章裡會圈出那個句型用到的詞，查詞視窗最上面換成它的詳細說明和例句。', '關掉查詞視窗，圈選就會消失。'] },
      { t: '聽發音、翻整句', s: '按「朗讀這個詞」或「翻譯這句」', img: 'pop-links',
        d: ['「朗讀這個詞」：iPad 會唸出這個詞。', '「翻譯這句」：在 Google 翻譯打開你點的那一句。', '「在 thai2english 查」「在 Longdo 查」：去更大的線上字典查。'] },
      { t: '專有名詞', s: '淡色底的是人名、劇名、機構等，會顯示中文名', img: 'pop-name',
        d: ['App 內建約一萬五千個明星、政治人物、劇名、品牌的名單。', '點到名單裡的名字，會顯示中文名、英文名和說明。', '「朗讀」唸出全名，「Google」用 Google 搜尋這個名字。'] },
      { t: '名字被切錯', s: '按「這是名字？」，調好範圍存起來', img: 'name-edit',
        d: ['點被切錯的名字，按查詞視窗下方的「這是名字？」。', '用「‹＋」「＋›」往前、往後多選一個字，「－」少選一個字，直到中間顯示完整的名字。', '選種類（人名、作品…），可以寫中文名，按「存到我的名單」。', '之後所有文件都會把它當成一個詞。設定頁的「我的專有名詞」可以刪除。'] },
      { t: '詞切得不對', s: '查詞視窗最下面「調整」那行，按「斷詞不對？」', img: 'seg-edit',
        d: ['一個詞被切成兩半：按「合成一個詞」，用 ‹＋ 或 ＋› 把前後被切開的部分加進來，按「存成一個詞」。', '兩個詞黏在一起：按「拆開」，點字中間的空隙決定從哪裡切，按「存成拆開」。', '之後所有文件都會照你的方式斷詞。', '想改回來：再點那個詞按「斷詞不對？」→「恢復原本的斷詞」，或到「設定 → 我的詞庫 → 我的斷詞」刪掉。'] },
      { t: '地名、機關的意思', s: '點專有名詞，看中文名或「字面」意思', img: 'ent-mean',
        d: ['內建名單裡的國家、泰國各府、政府機關、大學，會直接顯示中文名。', '不在名單裡的，會拆成字典裡的詞，顯示「字面」意思，例如 กรม（廳）＋ส่งเสริม（促進）＋การค้า（貿易）。', '有網路時還會顯示「翻譯」：機器翻譯的中文意思，僅供參考。'] },
      { t: '邊查邊做筆記', s: '查詞視窗按「畫螢光筆」或「加註解」', img: 'pop-notes',
        d: ['在「點字」模式點一個詞，查詞視窗裡有「畫螢光筆」和「加註解」。', '「畫螢光筆」：用目前的螢光筆顏色畫這個詞；再按一次就取消。', '「加註解」：在這個詞上面加一個文字框，直接打字。會切到「文字框」工具，寫完按「點字」回來。', '用螢光筆、手寫工具時，點一下詞也能查詞。'] },
      { t: '翻譯一整段', s: '長按一個字，不放開，拖到最後一個字', img: 'sel-pop',
        d: ['確認工具列選的是「點字」。', '手指長按第一個字（約半秒），不要放開，拖到最後一個字再放開。用 Pencil 可以直接拖。', '下方會跳出這段文字和中文翻譯。', '還可以「朗讀」「複製」「畫螢光筆」，或「在 Google 翻譯打開」。'],
        tip: '直接翻譯需要網路。' }]],
    ['閱讀', [
      { t: '聽整篇朗讀', s: '按播放鍵，進度條可以拖', img: 'tts-bar',
        d: ['「▶」播放：從頭唸整篇；暫停過就從停下的地方接著唸。', '唸的時候按鈕變成「❚❚」，按一下暫停。', '拖動中間的進度條，可以跳到想聽的地方。', '「■」停止：停下來並回到開頭。', '最左邊的「慢速」：唸慢一點，播放中按也會馬上變慢。', '最右邊的「整篇翻譯」：把整篇分段打開 Google 翻譯。'],
        tip: '唸到一半點了某個詞的朗讀，整篇朗讀會暫停；再按「▶」就接著唸。' },
      { t: '跟著讀', s: '朗讀時，正在唸的那一段會標出來', img: 'read-along',
        d: ['按「▶」之後，正在唸的那一小段會有淡色底，畫面也會自己捲過去。', '自己用手指捲動頁面時，會先停止跟著捲 4 秒，方便你回頭看。', '左右翻頁模式下，唸到下一頁會自動翻頁。'] },
      { t: '放大縮小', s: '兩指縮放，或按「符合螢幕 ▾」選比例', img: 'view-zoom',
        d: ['兩根手指在文件上張開、捏合，就能放大縮小。用螢光筆、手寫時也可以。', '或按工具框左上角的「符合螢幕 ▾」，選「符合螢幕」「符合寬度」或 100%、125%、150%、200%。', '「符合螢幕」：一整頁剛好放進畫面（打開文件時的預設）。「符合寬度」：左右剛好塞滿。', '100%：PDF 照紙本的實際大小顯示。'],
        tip: '放大後，文件可以左右滑動看兩邊。' },
      { t: '捲動或翻頁', s: '在同一個選單選「上下捲動」或「左右翻頁」', img: 'view-menu',
        d: ['「上下捲動」：所有頁面接在一起，往下滑就是下一頁。', '「左右翻頁」：一次看一頁，往左滑是下一頁、往右滑是上一頁，也可以按「‹」「›」。', '翻頁的滑動只在「點字」時有效；畫螢光筆、手寫時請按「‹」「›」。'] },
      { t: '跳到某一頁', s: '點中間的頁碼，打數字', img: 'view-page',
        d: ['點「1 / 12」這樣的頁碼。', '打要去的頁數，按鍵盤的「前往」或 Enter。'] },
      { t: '接著上次讀', s: '不用做什麼，App 會記住', img: '',
        d: ['每份文件會記住你讀到第幾頁、讀到頁面的哪裡。', '下次打開同一份文件，會自動回到那裡。'] }]],
    ['筆記', [
      { t: '畫重點', s: '選「螢光筆」，從一個字劃到另一個字', img: 'note-hl',
        d: ['按「螢光筆」，下面會出現顏色和樣式。', '點顏色就用那個顏色；再點一次正在用的顏色可以換掉它。', '「整塊」是塗滿底色，「底線」是只畫在字的下面。', '手指或 Pencil 從第一個字劃到最後一個字，放開就畫好了。', '只點一下（不拖）是查詞；想取消螢光筆，在查詞視窗按「取消螢光筆」。'] },
      { t: '手寫', s: '選「手寫」，選顏色和粗細再寫', img: 'note-ink',
        d: ['按「手寫」，下面會出現「筆／橡皮擦」、顏色和「細／中／粗」。', '直接在頁面上寫字或畫線。', '要擦掉：選「橡皮擦」，碰到的那一整筆就會擦掉；擦錯了按「↶」。', '用 Pencil 點一下是寫一個點（例如 i 上面的點）；用手指點一下泰文才是查詞。', '兩根手指可以縮放，不會畫出線。', '打開工具列最右邊的「只用 Pencil 畫」開關：只有 Pencil 會畫線，一根手指滑動是捲動頁面，比較不會誤畫。'] },
      { t: '寫註解', s: '選「文字框」，點字或點空白處', img: 'note-box',
        d: ['按「文字框」，下面會出現大小、顏色、粗細和字體。', '點一個泰文詞：先跳出查詞視窗，按「加註解」就在詞的正上方加一個小註解。用 Apple Pencil 點詞會直接加註解。', '點空白處：放一段自由文字。', '點已經有的註解，可以改樣式，或拖曳「⠿」移動。'] },
      { t: '換顏色', s: '再點一次正在用的顏色，就能換掉它', img: 'note-colors',
        d: ['螢光筆、手寫、文字框下面都有三個顏色，點一下就換成那個顏色。', '正在用的顏色下面有個小箭頭；再點它一次，會跳出「我的顏色」。', '點「我的顏色」裡的一個，就換掉外面這一格。', '按「＋」可以自訂任何顏色，它會存進「我的顏色」（最多 50 種）。', '按「編輯」，再點顏色就能刪掉；換下來的顏色會收進「我的顏色」，不會不見。'],
        tip: '文字框：先點一下要改的那一框，再換顏色，就會改那一框。' },
      { t: '畫錯了', s: '按「↶」回到上一步，按「↷」做回來', img: 'note-undo',
        d: ['「↶」「↷」和「清除全部」在工具框的右上角。', '「↶」是上一步：取消剛剛的動作，可以一直往回按。', '「↷」是下一步：把剛剛取消的動作做回來。', '按鈕變淡，代表已經沒有可以退回或做回來的動作。', '「清除全部」：刪掉這份文件所有的筆記，要按兩次才會刪；刪了也可以按「↶」救回來。'],
        tip: '筆記會自動儲存，不用按存檔。' },
      { t: '輸出', s: '右上角「匯出 PDF」', img: 'note-export',
        d: ['按右上角「匯出 PDF」。', '勾選要放進去的內容：原文頁（含筆記）、生字表、筆記整理，再按「產生 PDF」。', '在跳出的視窗選「儲存到檔案」，或直接分享。'] }]],
    ['掃描頁', [
      { t: '讀不到字', s: '按「用文字辨識讀這 N 頁」', img: 'ocr-go',
        d: ['掃描或拍照的 PDF 頁面沒有文字，文件上方會提醒你。', '按「用文字辨識讀這 N 頁」，App 會一頁一頁把字認出來。', '辨識中可以按「停止」。'],
        tip: '每頁約 5–20 秒；第一次要先下載約 8 MB 的工具。' },
      { t: '可能有錯字', s: '尤其是聲調符號，查詞時對照原圖', img: '',
        d: ['辨識最常認錯泰文上方的小符號（聲調、母音）。', 'App 會用字典和名單自動補回常見的錯字，但不是全部都補得回來。', '名字常認錯：把它加進「我的專有名詞」，之後辨識會自動補對。'] },
      { t: '想再認一次', s: '按右上角的「↻」', img: 'ocr-redo',
        d: ['「↻」就是重新辨識，在右上角「匯出 PDF」的左邊。', '只有用文字辨識讀過的文件才會出現這個按鈕。', 'App 更新了辨識功能，或覺得錯字太多時，按「↻」再認一次。', '沒被改到的頁面上的筆記會保留。'] }]],
    ['生字卡', [
      { t: '收藏單字', s: '查詞視窗按「＋ 生字卡」', img: 'card-add',
        d: ['點一個字，在查詞視窗右上角按「＋ 生字卡」。', '變成「✓ 已在生字卡」就加好了，會連同那一句一起存。', '下方「生字卡」的紅圈是新加的張數；打開生字卡頁就會消失。'] },
      { t: '開始複習', s: '到「生字卡」頁，按「開始複習」', img: 'cards-review',
        d: ['App 會算好今天該複習哪些卡片（間隔重複，像 Anki）。', '「全部練習一次」：不管排程，全部看一遍。'] },
      { t: '看答案、打分數', s: '先想一想，按「看答案」，再選記得的程度', img: 'cards-grade',
        d: ['先看泰文和例句，自己想意思，按「看答案」。', '「忘了」：今天會再出現一次。', '「有點難」「記得」「很簡單」：下次出現會越隔越久，按鈕下面寫著是幾天後。'] },
      { t: '測驗', s: '「測驗」分頁：選擇題，最多 10 題', img: 'cards-quiz',
        d: ['選題型：看泰文選意思、看意思選泰文、聽發音選泰文；打開「聲調學習模式」還有「聲調與子音」。', '按「開始測驗」，點你覺得對的答案，答完看成績。', '答錯的會排進今天的複習。'] },
      { t: '單字詳解和例句', s: '「全部」分頁點一個單字', img: 'cards-detail',
        d: ['會看到所有詞性和意思、拼音、自己的筆記。', '例句有三種：原本那一句、這份文件裡的其他句子、生活化例句（日常對話）。', '每句都能按喇叭朗讀，按「看中文翻譯」看中文（要網路）。', '下面可以搬資料夾、排進今天複習或刪除。'] }]],
    ['設定', [
      { t: '更新 App', s: '設定頁最下面按「檢查更新」', img: '',
        d: ['App 平常會自己更新；想馬上拿到新版時，到設定頁最下面按「檢查更新」。', '有新版會自動下載並重新整理；沒有的話會顯示「已經是最新版了」。', '版本號就寫在按鈕左邊。'] },
      { t: '換顏色', s: '「深淺色」選淺色或深色', img: 'set-theme',
        d: ['「跟隨系統」：照 iPad 的淺色／深色自動切換。', '「淺色」「深色」：固定不變。', '設定頁先列出分類（外觀與字體、閱讀與查詞、我的詞庫、資料與同步、說明與回饋），點進去才是那一類的設定；左上「‹ 設定」回到分類。每個設定旁邊的「?」可以看它的說明。'] },
      { t: '聲調學習模式', s: '「聲調學習模式」選「開」', img: 'tone-pop',
        d: ['打開後，點一個詞，查詞視窗會多一塊「聲調」。', '每個音節：聲調（顏色和音高線）、起首子音是中／高／低子音。', '下面一行一行說明怎麼推出聲調，例如「ร 低子音＋ไม้โท → 高聲」；不照規則唸的會標「例外」。', '按「看聲調規則表」可以看整張表。', '生字卡詳解、複習的答案也會顯示；測驗會穿插聲調題。', '生字卡頁會多一個「聲調」分頁：規則表（點格子看例詞、聽發音）、三類子音有哪些字，還有「練習推聲調」：一步一步答子音類別、活或死音節、聲調。'],
        tip: '聲調資料第一次打開要連網下載。' },
      { t: '換字體', s: '「中文字體」選喜歡的字', img: 'set-font',
        d: ['「蘋方」：iPad 內建的黑體，最清楚（預設）。', '「思源黑體」：線條較均勻的黑體。', '「思源宋體」：像書本的明體。', '「霞鶩文楷」：像手寫的楷體，比較柔和。', '只改按鈕和說明的中文字，泰文字不變。'],
        tip: '思源字體和文楷第一次要連網下載。' },
      { t: '雲端同步', s: '設定頁按「連結 Google 帳號」', img: '',
        d: ['文件、PDF、筆記、生字卡和設定，會存在你自己 Google 雲端硬碟裡這個 App 專用的隱藏資料夾（不會出現在檔案清單，App 也看不到你其他的檔案）。', '在另一台平板、手機或電腦打開這個 App，連結同一個 Google 帳號，兩邊就會自動合併：改過的以比較新的為準，刪掉的另一台也會刪。', '連結後，打開 App 和修改之後會自動同步。Google 的登入每小時要確認一次；過了就按「立即同步」。', '加到主畫面的 App 按連結時，會先跳到 Google 的登入頁，登入完自動回到 App。', '匯入的影片本身不會上傳（太大），影片做成的文字文件會同步。'] },
      { t: '備份', s: '按「匯出備份檔」，存到 iCloud Drive', img: 'set-backup',
        d: ['按「匯出備份檔」。', '在跳出的視窗選「儲存到檔案」，再選 iCloud Drive 或 Google Drive。', '要還原時按「從備份檔還原」，選那個檔案。'],
        tip: '換 iPad、刪掉 App 或清除瀏覽器資料前，一定要先備份！' },
      { t: '我的專有名詞', s: '看你加過的名字，也可以刪除', img: 'set-names',
        d: ['這裡列出你用「這是名字？」加的名字。', '按「刪除」就會拿掉。'] },
      { t: '有建議', s: '寫在「意見回饋」', img: 'set-feedback',
        d: ['選類型（功能建議、問題回報、其他），寫下來，按「送出回饋」。', '開發者會收到你的訊息。'] }]]
  ];
  function helpLine(text) {
    var frag = document.createDocumentFragment();
    text.split(/(「[^」]+」)/).forEach(function (part) {
      if (!part) { return; }
      if (/^「.+」$/.test(part)) { var chip = document.createElement('span'); chip.className = 'hchip'; chip.textContent = part.slice(1, -1); frag.appendChild(chip); }
      else { frag.appendChild(document.createTextNode(part)); }
    });
    return frag;
  }
  function helpImgUrl(name) { return new URL(HELP_IMG + name + '.webp', location.href).href; }
  /* 清單：每則只有編號、重點、一句話；點了才跳出畫面截圖和詳細步驟 */
  function openHelp(start) {
    var m = $('helpModal'), body = $('helpBody'), tabs = $('helpTabs');
    var cur = typeof start === 'number' ? start : 0;
    function paint() {
      tabs.replaceChildren(); body.replaceChildren();
      HELP.forEach(function (h, i) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = h[0];
        b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === cur ? 'true' : 'false');
        b.addEventListener('click', function () { cur = i; paint(); });
        tabs.appendChild(b);
      });
      var ol = document.createElement('ol'); ol.className = 'hlist';
      HELP[cur][1].forEach(function (it, i) {
        var li = document.createElement('li');
        var row = document.createElement('button'); row.type = 'button'; row.className = 'hrow';
        var num = document.createElement('span'); num.className = 'hnum'; num.textContent = String(i + 1);
        var tx = document.createElement('span'); tx.className = 'htext';
        var t = document.createElement('span'); t.className = 'htitle'; t.textContent = it.t;
        var d = document.createElement('span'); d.className = 'hdesc'; d.appendChild(helpLine(it.s));
        tx.appendChild(t); tx.appendChild(d);
        var go = document.createElement('span'); go.className = 'hgo'; go.setAttribute('aria-hidden', 'true'); go.textContent = '›';
        row.appendChild(num); row.appendChild(tx); row.appendChild(go);
        row.addEventListener('click', function () { openHelpDetail(cur, i); });
        li.appendChild(row); ol.appendChild(li);
      });
      body.appendChild(ol);
      body.scrollTop = 0;
    }
    paint();
    m.hidden = false;
    setTimeout(function () { try { $('helpClose').focus(); } catch (err) {} }, 30);
  }
  /* 跳出的說明卡：上面是畫面截圖（橘框＝要按的地方），下面是步驟；可以上一則、下一則 */
  function openHelpDetail(tab, idx) {
    var box = $('helpDetail'), list = HELP[tab][1], it = list[idx];
    var fig = $('hdFig'), steps = $('hdSteps');
    $('hdKicker').textContent = HELP[tab][0] + '・' + (idx + 1) + ' / ' + list.length;
    $('hdTitle').textContent = it.t;
    var line = $('hdLine'); line.replaceChildren(); line.appendChild(helpLine(it.s));
    fig.replaceChildren();
    if (it.img) {
      var im = new Image(); im.alt = it.t + '的畫面，橘色框是要按的地方'; im.decoding = 'async';
      im.src = helpImgUrl(it.img);
      im.onload = function () { fig.classList.add('ready'); };
      im.onerror = function () { fig.hidden = true; };
      fig.classList.remove('ready'); fig.hidden = false; fig.appendChild(im);
    } else { fig.hidden = true; }
    steps.replaceChildren();
    (it.d || []).forEach(function (x) { var li = document.createElement('li'); li.appendChild(helpLine(x)); steps.appendChild(li); });
    var tip = $('hdTip'); tip.hidden = !it.tip; tip.textContent = it.tip ? it.tip : '';
    var prev = $('hdPrev'), next = $('hdNext');
    prev.disabled = idx === 0; next.disabled = idx === list.length - 1;
    prev.onclick = function () { if (idx > 0) { openHelpDetail(tab, idx - 1); } };
    next.onclick = function () { if (idx < list.length - 1) { openHelpDetail(tab, idx + 1); } };
    box.hidden = false;
    $('hdScroll').scrollTop = 0;
    setTimeout(function () { try { $('hdBack').focus(); } catch (err) {} }, 30);
  }
  $('hdBack').addEventListener('click', function () { $('helpDetail').hidden = true; });
  $('helpDetail').addEventListener('click', function (e) { if (e.target === $('helpDetail')) { $('helpDetail').hidden = true; } });
  $('helpClose').addEventListener('click', function () { $('helpModal').hidden = true; $('helpDetail').hidden = true; });
  $('helpModal').addEventListener('click', function (e) { if (e.target === $('helpModal')) { $('helpModal').hidden = true; } });
  $('openHelp').addEventListener('click', function () { openHelp(0); });
  if ($('wHelp')) { $('wHelp').addEventListener('click', function () { openHelp(0); }); }
