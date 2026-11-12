  /* ====== 1.28：歡迎流程（一頁一題）、目標、專屬地圖、魔王關 ====== */
  var GOAL_KEY = 'thai-goal', MAPSEEN_KEY = 'thai-map-seen', GOALSKIP_KEY = 'thai-goal-skip';
  var LV4 = ['a', 'b', 'c', 'd'], LV4_NAME = { a: '入門', b: '初級', c: '中級', d: '高級' };
  var LV4_DESC = {
    a: '認得字母和一些單字',
    b: '會簡單基本句子',
    c: '能稍微讀懂 YT、IG 貼文和一些短文，但卡在一些句型',
    d: '能讀懂生活大部分內容，但正式書面用法有困難，像是正式新聞、皇室公告、論文'
  };
  function L2(zh, en) { return UI_LANG === 'en' ? en : zh; }
  function lv4() { return level === 'all' ? 'd' : (LV4.indexOf(level) >= 0 ? level : 'b'); }

  /* ---- 目標清單（資料）：每個程度有自己的一組目標；每個目標 = 一串關卡的設計圖 ----
     levels：每個程度能選的目標，第一個是推薦的；「先不設目標」每一級都會自動加在最後。
     goals：目標本身（title、sub 是顯示的文字；legacy 是舊版 1.28 的目標代號，升級時用來對應）。
     stages 的每一項：
       { k:'read', n:3, from:'level' }                 讀 n 篇「自己程度」的短文
       { k:'read', n:3, from:'next' }                  讀 n 篇「下一級」的短文（高級沒有下一級，會自動略過）
       { k:'read', n:2, ids:['a4','a2'], label:'飲食' } 讀 n 篇指定短文中的任何幾篇（讀物庫的編號）
       { k:'words'|'rev'|'known', n:… }                存生字／複習／記熟
       { k:'tone', n:1, lv:['a'] }                      聲調練習；lv 限制只在這些程度出現
       { k:'boss', boss:'menu' }                        魔王關；boss 也可以依程度挑：{ a:'menu', b:'social' }，挑不到就不出現 */
  var GOAL_CATALOG = {
    v: 1,
    levels: {
      a: ['a_base', 'a_eat', 'up'],
      b: ['up', 'b_travel', 'b_life'],
      c: ['up', 'c_news', 'c_social'],
      d: ['d_news', 'd_formal', 'd_lit']
    },
    goals: {
      up: { title: '升到下一級', sub: '一步一步練到下一級', stages: [
        { k: 'tone', n: 1, lv: ['a'] }, { k: 'read', n: 3, from: 'level' }, { k: 'words', n: 10 }, { k: 'rev', n: 30 },
        { k: 'read', n: 3, from: 'next' }, { k: 'known', n: 6 }, { k: 'boss', boss: { a: 'menu', b: 'social', c: 'notice' } }] },
      a_base: { title: '打好基礎：聲調與日常短句', sub: '先把聲調和最常用的字練熟，再讀簡單短文', stages: [
        { k: 'tone', n: 1 }, { k: 'read', n: 3, ids: ['a1', 'a3', 'a5', 'a6'], label: '日常' }, { k: 'words', n: 15 }, { k: 'rev', n: 40 }, { k: 'known', n: 8 }] },
      a_eat: { title: '看懂菜單和點餐', sub: '點餐、看招牌，不用一直查字典', legacy: ['menu'], stages: [
        { k: 'tone', n: 1 }, { k: 'read', n: 2, ids: ['a4', 'a2', 'b2'], label: '飲食與市場' }, { k: 'words', n: 10 }, { k: 'rev', n: 30 }, { k: 'known', n: 6 }, { k: 'boss', boss: 'menu' }] },
      b_travel: { title: '自己去泰國玩', sub: '搭車、問路、安排行程、看旅遊貼文', legacy: ['social'], stages: [
        { k: 'read', n: 2, ids: ['b1', 'b3', 'b7'], label: '旅行' }, { k: 'words', n: 12 }, { k: 'rev', n: 40 }, { k: 'known', n: 8 }, { k: 'boss', boss: 'social' }] },
      b_life: { title: '看懂生活資訊', sub: '網購、看醫生、室友訊息和公告', stages: [
        { k: 'read', n: 2, ids: ['b5', 'b6', 'b8'], label: '生活' }, { k: 'words', n: 12 }, { k: 'rev', n: 40 }, { k: 'known', n: 8 }, { k: 'boss', boss: 'notice' }] },
      c_news: { title: '看懂新聞', sub: '空汙、環保這類新聞風格的短文', legacy: ['news'], stages: [
        { k: 'read', n: 2, ids: ['c1', 'c6', 'd5'], label: '新聞與環境' }, { k: 'words', n: 15 }, { k: 'rev', n: 50 }, { k: 'known', n: 10 }, { k: 'boss', boss: 'news' }] },
      c_social: { title: '看懂社群和口語', sub: 'IG 貼文、Podcast、網路用語', legacy: ['social'], stages: [
        { k: 'read', n: 2, ids: ['c2', 'c3', 'c4'], label: '社群與口語' }, { k: 'words', n: 15 }, { k: 'rev', n: 50 }, { k: 'known', n: 10 }, { k: 'boss', boss: 'social' }] },
      d_news: { title: '讀懂新聞評論與科普', sub: '社會、經濟、科學這類長一點的文章', legacy: ['news'], stages: [
        { k: 'read', n: 2, ids: ['d1', 'd2', 'd5'], label: '評論與科普' }, { k: 'words', n: 20 }, { k: 'rev', n: 60 }, { k: 'known', n: 12 }, { k: 'boss', boss: 'news' }] },
      d_formal: { title: '看懂公告與公文', sub: '大學公告、政府通知這類正式書面', stages: [
        { k: 'read', n: 2, ids: ['d6', 'd1'], label: '正式書面' }, { k: 'words', n: 20 }, { k: 'rev', n: 60 }, { k: 'known', n: 12 }, { k: 'boss', boss: 'notice' }] },
      d_lit: { title: '讀文學與歷史短文', sub: '小說片段和歷史故事，詞彙更豐富', stages: [
        { k: 'read', n: 2, ids: ['d3', 'd4'], label: '文學與歷史' }, { k: 'words', n: 20 }, { k: 'rev', n: 60 }, { k: 'known', n: 12 }] },
      free: { title: '先不設目標', sub: '自己隨意讀。之後想設定，到「地圖」分頁就能補上', stages: [] }
    }
  };
  var GOALDONE_KEY = 'thai-goal-done';
  /* 判斷邏輯：依程度給出可選的目標。
     1) 程度先整理成 a/b/c/d（「全部」當高級、不認得的當初級）；
     2) 取這一級的目標清單，「先不設目標」固定放最後；
     3) 以前完成過的目標排到後面、標「完成過」，推薦的是第一個還沒完成的；
     4) 高級沒有「升到下一級」（資料裡就沒放）。 */
  function goalsFor(lv) {
    lv = LV4.indexOf(lv) >= 0 ? lv : 'b';
    var hist = lsGetJ(GOALDONE_KEY, {}), ids = (GOAL_CATALOG.levels[lv] || GOAL_CATALOG.levels.b).slice();
    var fresh = ids.filter(function (id) { return !hist[id + ':' + lv]; }), old = ids.filter(function (id) { return hist[id + ':' + lv]; });
    var out = fresh.concat(old).map(function (id, i) { return { id: id, goal: GOAL_CATALOG.goals[id], rec: i === 0 && !!fresh.length, finished: !!hist[id + ':' + lv] }; });
    out.push({ id: 'free', goal: GOAL_CATALOG.goals.free, rec: false, finished: false });
    return out;
  }
  function goalIds(lv) { return goalsFor(lv).map(function (o) { return o.id; }); }
  function goalTitle(g, lv) {
    if (g === 'up') { var nx = LV4[LV4.indexOf(lv) + 1]; return '升到「' + LV4_NAME[nx || 'd'] + '」'; }
    return (GOAL_CATALOG.goals[g] || GOAL_CATALOG.goals.free).title;
  }
  function goalSub(g) { return (GOAL_CATALOG.goals[g] || GOAL_CATALOG.goals.free).sub; }

  /* ---- 魔王關：三篇樣本文章（菜單、社群貼文、新聞短訊），讀完答 3 題 ---- */
  var BOSS_THR = 85;
  var BOSS = {
    menu: {
      id: 'x-menu', th: 'เมนูร้านบ้านสวน', zh: '一份泰文菜單', lv: 'b', topic: '魔王關', sum: '菜名、價錢、營業時間、能不能外帶',
      title: '看懂一份菜單',
      text: 'ร้านอาหารบ้านสวน\nเมนูแนะนำวันนี้\nผัดกะเพราหมูสับไข่ดาว 60 บาท\nต้มยำกุ้ง 150 บาท\nส้มตำไทย 50 บาท (เผ็ดน้อย เผ็ดมาก บอกพนักงานได้)\nข้าวเหนียวมะม่วง 80 บาท\nน้ำมะพร้าว 40 บาท\nเปิดทุกวัน 10.00-21.00 น. หยุดวันพุธ\nสั่งกลับบ้านได้ แต่ไม่รับบัตรเครดิต',
      qs: [
        { q: ['「ต้มยำกุ้ง」一份多少錢？', 'How much is “ต้มยำกุ้ง”?'], o: [['50 泰銖', '50 baht'], ['60 泰銖', '60 baht'], ['80 泰銖', '80 baht'], ['150 泰銖', '150 baht']], a: 3, w: 'ต้มยำกุ้ง 150 บาท' },
        { q: ['這家店星期幾公休？', 'Which day is the shop closed?'], o: [['星期一', 'Monday'], ['星期三', 'Wednesday'], ['星期五', 'Friday'], ['每天都營業', 'It is open every day']], a: 1, w: 'หยุดวันพุธ' },
        { q: ['關於外帶和刷卡，哪一項是對的？', 'About takeaway and cards, which is correct?'], o: [['可以外帶，也能刷卡', 'Takeaway is available and cards are accepted'], ['可以外帶，但不能刷卡', 'Takeaway is available, but cards are not accepted'], ['只能內用，不能刷卡', 'Dine-in only, no cards'], ['只能內用，可以刷卡', 'Dine-in only, cards accepted']], a: 1, w: 'สั่งกลับบ้านได้ แต่ไม่รับบัตรเครดิต' }
      ]
    },
    social: {
      id: 'x-social', th: 'โพสต์เที่ยวเชียงใหม่', zh: '一則社群貼文', lv: 'c', topic: '魔王關', sum: '和媽媽去清邁旅行的貼文',
      title: '看懂一則社群貼文',
      text: 'วันนี้พาแม่มาเที่ยวเชียงใหม่เป็นครั้งแรก\nแม่บอกว่าอากาศเย็นสบายมาก ไม่ร้อนเหมือนกรุงเทพฯ\nเช้านี้ไปเดินตลาด ซื้อของฝากเพียบเลย\nเย็นนี้จะไปกินข้าวซอยร้านประจำ อร่อยจนต้องกลับมากินทุกปี\nพรุ่งนี้ตื่นเช้าไปดูพระอาทิตย์ขึ้นที่ดอยสุเทพ\nใครเคยไปมีที่แนะนำไหมคะ\n#เชียงใหม่ #เที่ยวกับแม่',
      qs: [
        { q: ['作者這次和誰一起去旅行？', 'Who did the author travel with?'], o: [['媽媽', 'Mother'], ['朋友', 'Friends'], ['同事', 'Colleagues'], ['一個人', 'Alone']], a: 0, w: 'พาแม่มาเที่ยวเชียงใหม่' },
        { q: ['作者說，媽媽覺得那裡的天氣怎麼樣？', 'How does the author say the weather felt to Mom?'], o: [['涼爽舒服，不像曼谷那麼熱', 'Cool and pleasant, not hot like Bangkok'], ['很熱，比曼谷還熱', 'Hot, hotter than Bangkok'], ['一直下雨', 'It kept raining'], ['冷到要穿羽絨衣', 'So cold you need a down jacket']], a: 0, w: 'อากาศเย็นสบายมาก ไม่ร้อนเหมือนกรุงเทพฯ' },
        { q: ['作者明天打算做什麼？', 'What does the author plan to do tomorrow?'], o: [['早起去看日出', 'Get up early to watch the sunrise'], ['去逛市場買伴手禮', 'Shop for souvenirs at the market'], ['去吃泰北咖哩麵', 'Go eat khao soi'], ['睡到中午', 'Sleep until noon']], a: 0, w: 'พรุ่งนี้ตื่นเช้าไปดูพระอาทิตย์ขึ้นที่ดอยสุเทพ' }
      ]
    },
    news: {
      id: 'x-news', th: 'เตือนฝนตกหนักภาคใต้', zh: '一則新聞短訊', lv: 'c', topic: '魔王關', sum: '氣象署對南部大雨的警告',
      title: '看懂一則新聞短訊',
      text: 'กรมอุตุนิยมวิทยาประกาศเตือนฝนตกหนักถึงหนักมากในภาคใต้ ตั้งแต่วันนี้ถึงวันศุกร์นี้\nประชาชนที่อาศัยในพื้นที่ลุ่มต่ำและใกล้ภูเขาควรเฝ้าระวังน้ำท่วมฉับพลันและดินถล่ม\nส่วนชาวประมงควรงดออกเรือในช่วงนี้ เนื่องจากคลื่นสูงกว่า 3 เมตร',
      qs: [
        { q: ['這則新聞預告哪裡會有什麼天氣？', 'What weather does the news warn about, and where?'], o: [['南部有大雨到豪雨', 'Heavy to very heavy rain in the south'], ['北部有濃霧', 'Dense fog in the north'], ['東北部乾旱', 'Drought in the northeast'], ['首都高溫', 'Heat in the capital']], a: 0, w: 'ฝนตกหนักถึงหนักมากในภาคใต้' },
        { q: ['住在低窪和靠山地區的人要特別留意什麼？', 'What should people in low-lying and mountain areas watch out for?'], o: [['突發洪水和土石流', 'Flash floods and landslides'], ['空氣污染', 'Air pollution'], ['地震', 'Earthquakes'], ['海嘯', 'Tsunamis']], a: 0, w: 'น้ำท่วมฉับพลันและดินถล่ม' },
        { q: ['新聞建議漁民怎麼做？', 'What does the news advise fishermen to do?'], o: [['這段期間暫停出海', 'Stay off the sea for now'], ['多出海捕魚', 'Go out fishing more'], ['只在白天出海', 'Sail only in the daytime'], ['換大一點的船', 'Switch to a bigger boat']], a: 0, w: 'งดออกเรือในช่วงนี้ เนื่องจากคลื่นสูงกว่า 3 เมตร' }
      ]
    }    ,
    notice: {
      id: 'x-notice', th: 'ประกาศปิดปรับปรุงสวนสาธารณะ', zh: '一則官方公告', lv: 'd', topic: '魔王關', sum: '區公所的公園整修公告',
      title: '看懂一則公告',
      text: 'สำนักงานเขตประกาศปิดปรับปรุงสวนสาธารณะตั้งแต่วันที่ 1 ถึง 15 ธันวาคม เพื่อซ่อมแซมทางเดินและปรับปรุงระบบไฟฟ้า\nผู้ที่ประสงค์จะใช้บริการสามารถไปใช้สวนสาธารณะแห่งอื่นในเขตใกล้เคียงได้ในช่วงดังกล่าว\nสอบถามข้อมูลเพิ่มเติมได้ที่สำนักงานเขต ในวันและเวลาราชการ',
      qs: [
        { q: ['公園什麼時候關閉整修？', 'When is the park closed for renovation?'], o: [['12 月 1 日到 15 日', 'December 1 to 15'], ['11 月 1 日到 15 日', 'November 1 to 15'], ['12 月 15 日到 31 日', 'December 15 to 31'], ['整個 12 月', 'All of December']], a: 0, w: 'ตั้งแต่วันที่ 1 ถึง 15 ธันวาคม' },
        { q: ['為什麼要關閉？', 'Why is it closing?'], o: [['整修步道和電力系統', 'To repair the walkways and electrical system'], ['舉辦大型活動', 'To hold a large event'], ['天氣太熱', 'The weather is too hot'], ['要改建成停車場', 'To rebuild it as a car park']], a: 0, w: 'เพื่อซ่อมแซมทางเดินและปรับปรุงระบบไฟฟ้า' },
        { q: ['想知道更多詳情，可以去哪裡問？', 'Where can you ask for more information?'], o: [['區公所，在上班日與上班時間', 'The district office, on working days and hours'], ['附近的公園', 'A nearby park'], ['警察局', 'The police station'], ['市政府網站，隨時', 'The city hall website, any time']], a: 0, w: 'สอบถามข้อมูลเพิ่มเติมได้ที่สำนักงานเขต ในวันและเวลาราชการ' }
      ]
    }
  };
  var BOSS_BY_ID = {}; Object.keys(BOSS).forEach(function (k) { BOSS[k].key = k; BOSS_BY_ID[BOSS[k].id] = BOSS[k]; });

  /* ---- 依「目標＋程度」排出關卡：照目標的設計圖（stages）一項一項轉成關卡 ---- */
  function mkStage(k, n, o) { var s = { k: k, n: n }; if (o) { Object.keys(o).forEach(function (x) { s[x] = o[x]; }); } s.key = k + ':' + n + ':' + (s.lv || (s.ids ? s.ids.join('+') : '') || s.boss || ''); return s; }
  function mapStages(g, lv) {
    var goal = GOAL_CATALOG.goals[g.g] || GOAL_CATALOG.goals.up, nx = LV4[LV4.indexOf(lv) + 1], out = [];
    goal.stages.forEach(function (sp) {
      if (sp.lv && sp.lv.indexOf(lv) < 0) { return; }
      if (sp.k === 'read') {
        if (sp.ids) { out.push(mkStage('read', Math.min(sp.n, sp.ids.length), { ids: sp.ids, label: sp.label })); }
        else if (sp.from === 'next') { if (nx) { out.push(mkStage('read', sp.n, { lv: nx })); } }
        else { out.push(mkStage('read', sp.n, { lv: lv })); }
      } else if (sp.k === 'boss') {
        var bk = typeof sp.boss === 'string' ? sp.boss : sp.boss[lv];
        if (bk && BOSS[bk]) { out.push(mkStage('boss', 1, { boss: bk })); }
      } else { out.push(mkStage(sp.k, sp.n)); }
    });
    return out;
  }
  function stageText(s) {
    if (s.k === 'tone') { return '完成一次聲調練習'; }
    if (s.k === 'read') { return s.lv ? '讀 ' + s.n + ' 篇「' + LV4_NAME[s.lv] + '」短文' : '讀 ' + s.n + ' 篇「' + s.label + '」短文'; }
    if (s.k === 'words') { return '存 ' + s.n + ' 個生字'; }
    if (s.k === 'rev') { return '複習 ' + s.n + ' 次'; }
    if (s.k === 'known') { return '記熟 ' + s.n + ' 個生字'; }
    return '魔王關：' + BOSS[s.boss].title;
  }
  function knownCount() { return cards.filter(function (c) { srsInit(c); return c.fs && c.fs.s >= 21; }).length; }
  /* 1.28 的目標代號（menu／social／news）換成 1.29 每個程度各自的目標；對不上的就用那一級的第一個 */
  function goalMigrate(g) {
    if (GOAL_CATALOG.goals[g.g]) { return g; }
    var lv = LV4.indexOf(g.l0) >= 0 ? g.l0 : lv4(), ids = GOAL_CATALOG.levels[lv] || GOAL_CATALOG.levels.b, hit = ids[0];
    ids.forEach(function (id) { var gl = GOAL_CATALOG.goals[id]; if (hit === ids[0] && gl.legacy && gl.legacy.indexOf(g.g) >= 0) { hit = id; } });
    g.g = hit; g.l0 = lv; lsSetJ(GOAL_KEY, g);
    return g;
  }
  function goalGet() { var g = lsGetJ(GOAL_KEY, null); return g && typeof g === 'object' && g.g && g.g !== 'free' && g.t0 ? goalMigrate(g) : null; }
  function mapHave(s, g) {
    var st = lsGetJ(STAT_KEY, {}), b = g.b || {};
    if (s.k === 'tone') { return Math.max(0, (st.tone || 0) - (b.tone || 0)); }
    if (s.k === 'rev') { return Math.max(0, (st.rev || 0) - (b.rev || 0)); }
    if (s.k === 'words') { return cards.filter(function (c) { return c.added >= g.t0; }).length; }
    if (s.k === 'known') { return Math.max(0, knownCount() - (b.known || 0)); }
    if (s.k === 'boss') { return g.bt && g.bt[s.boss] ? 1 : 0; }
    var seen = {};
    lib.docs.forEach(function (d) {
      if (!d.lib || !(d.opened >= g.t0)) { return; }
      if (s.lv ? (/^[abcd]\d+$/.test(d.lib) && d.lib.charAt(0) === s.lv) : (s.ids || []).indexOf(d.lib) >= 0) { seen[d.lib] = 1; }
    });
    return Object.keys(seen).length;
  }
  var UNIT_MIN = { tone: 8, read: 9, words: 0.8, rev: 0.3, known: 1, boss: 12 };
  function mapEta(stg, have, mins) {
    var rem = 0, knownLeft = false;
    stg.forEach(function (s, i) { var left = Math.max(0, s.n - (have ? have[i] : 0)); if (s.k === 'known' && left > 0) { knownLeft = true; } rem += left * UNIT_MIN[s.k]; });
    if (!rem && !knownLeft) { return null; }
    var perWeek = typeof weekGoal === 'function' ? weekGoal() : 4;
    var days = Math.ceil(rem / mins) * 7 / perWeek;
    if (knownLeft) { days = Math.max(days, 28); }
    days = Math.max(7, Math.ceil(days));
    var d = new Date(); d.setDate(d.getDate() + days);
    return { weeks: Math.ceil(days / 7), m: d.getMonth() + 1, d: d.getDate() };
  }
  function etaText(e) { return e ? '預計約 ' + e.weeks + ' 週後（' + e.m + '/' + e.d + ' 前後）到達' : '全部完成了'; }
  /* 這篇還不熟的詞（沒記熟，而且不在你的程度範圍或被你查過），依出現次數排 */
  function rrUnknown(text, max) {
    if (!rrInit() || !text) { return []; }
    var toks = rrTokens(text) || [], N = RR_N[level] || RR_N.b, mast = rrMastered(), look = rrLookMap(), cnt = {};
    toks.forEach(function (t) {
      if (mast[t] || (!look[t] && ((rrRank[t] && rrRank[t] <= N) || rrIsName(t)))) { return; }
      if (/^\d/.test(t)) { return; }
      cnt[t] = (cnt[t] || 0) + 1;
    });
    return Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, max || 10);
  }
  function mapState() {
    var g = goalGet(); if (!g) { return null; }
    var lv = LV4.indexOf(g.l0) >= 0 ? g.l0 : lv4(), stg = mapStages(g, lv), p = g.p || {}, changed = false;
    var have = stg.map(function (s) { return mapHave(s, g); });
    var done = stg.map(function (s, i) {
      var ok = have[i] >= s.n;
      if (ok && !p[s.key]) { p[s.key] = Date.now(); changed = true; }
      return ok || !!p[s.key];
    });
    if (changed) { g.p = p; lsSetJ(GOAL_KEY, g); }
    var cur = done.indexOf(false); if (cur < 0) { cur = stg.length; }
    var bi = -1; stg.forEach(function (s, i) { if (s.k === 'boss') { bi = i; } });
    var m = { g: g, lv: lv, stg: stg, have: have, done: done, cur: cur, bi: bi, rate: null, unlocked: false, allPrev: true };
    if (bi >= 0) {
      m.allPrev = done.slice(0, bi).every(Boolean);
      var r = rrCompute(BOSS[stg[bi].boss].text); m.rate = r ? r.rate : null;
      m.unlocked = m.allPrev && (m.rate == null || m.rate >= BOSS_THR);
    }
    m.nDone = done.filter(Boolean).length;
    m.eta = mapEta(stg, have, g.m || 10);
    m.stale = lv !== lv4();
    if (m.cur >= stg.length) { var hist = lsGetJ(GOALDONE_KEY, {}); if (!hist[g.g + ':' + lv]) { hist[g.g + ':' + lv] = Date.now(); lsSetJ(GOALDONE_KEY, hist); } }
    return m;
  }
  function goalSave(goal, mins) {
    var st = lsGetJ(STAT_KEY, {}), prev = lsGetJ(GOAL_KEY, null) || {}, pm = prev.t0 ? mapState() : null;
    var keep = prev.t0 && !(pm && pm.cur >= pm.stg.length);
    var o = {
      g: goal, m: mins, l0: lv4(),
      t0: keep ? prev.t0 : Date.now(),
      b: keep ? (prev.b || {}) : { rev: st.rev || 0, tone: st.tone || 0, known: knownCount() },
      p: keep ? (prev.p || {}) : {}, bt: keep ? (prev.bt || {}) : {}
    };
    lsSetJ(GOAL_KEY, o);
    if (goal === 'free') { lsSetJ(GOALSKIP_KEY, 1); }
    var m = mapState(); lsSetJ(MAPSEEN_KEY, m ? m.nDone : 0);
  }

  /* ---- 去做這一關 ---- */
  function openReaderAt(lv) {
    if (typeof closeQuest === 'function') { closeQuest(); }
    rdOpen(); rdLevel = lv || rdLevel; rdRender();
  }
  function mapGo(s, m) {
    if (typeof closeQuest === 'function') { closeQuest(); }
    if (s.k === 'tone') {
      if (!toneMode) { toneMode = true; try { localStorage.setItem(TONE_KEY, '1'); } catch (err) {} loadTones().catch(function () {}); if (typeof renderToneSetting === 'function') { renderToneSetting(); } }
      showTab('cards'); cardTab = 'tone'; tq = null; renderCards(); return;
    }
    if (s.k === 'rev' || s.k === 'known') { showTab('cards'); return; }
    if (s.k === 'read' && s.ids) {
      var nx = s.ids.filter(function (id) { var d = rdDocOf(id); return !(d && d.opened >= m.g.t0); })[0] || s.ids[0];
      showTab('home'); mapOpenText(nx); return;
    }
    if (s.k === 'read') { showTab('home'); openReaderAt(s.lv || lv4()); return; }
    if (s.k === 'words') { showTab('home'); openReaderAt(lv4()); return; }
    if (s.k === 'boss') { bossRead(s.boss); }
  }
  function bossRead(key) { var b = BOSS[key]; if (!b) { return; } showTab('home'); rdOpenItem(b); }
  /* 把還不熟的詞存成生字卡（句子取自魔王關的文章） */
  function mapAddWords(words, text, srcName) {
    var lines = text.split('\n'), n = 0;
    words.forEach(function (w) {
      if (cardOf(w)) { return; }
      var g = glossSnapshot(w), ln = ''; for (var i = 0; i < lines.length; i++) { if (lines[i].indexOf(w) >= 0) { ln = lines[i]; break; } }
      cards.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), w: w, rom: g.rom, pos: g.pos, zh: g.zh, en: g.en, sent: ln.slice(0, 220), src: srcName, page: 0, added: Date.now(), box: 1, due: today0(), seen: 0, right: 0, folder: addTarget() });
      n++;
    });
    if (n) { saveCards(); }
    return n;
  }

  /* ---- 主頁上的一小列：有目標才出現，點下去到「地圖」分頁 ---- */
  var ICON_MAP = '<svg class="hri" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7z"/><path d="M9 4v13M15 7v13"/></svg>';
  function mapProgress(m) {
    var all = m.cur >= m.stg.length, s = m.stg[Math.min(m.cur, m.stg.length - 1)], have, tot, label;
    if (all) { return { all: true, s: s, have: 1, tot: 1, label: '' }; }
    if (s.k === 'boss') {
      if (!m.allPrev) { have = 0; tot = 1; label = '先完成前面的關卡'; }
      else if (!m.unlocked) { have = m.rate || 0; tot = BOSS_THR; label = '認得率 ' + have + '% / ' + BOSS_THR + '%'; }
      else { have = 1; tot = 1; label = '已解鎖，去挑戰'; }
    } else { have = Math.min(m.have[m.cur], s.n); tot = s.n; label = have + ' / ' + tot; }
    return { all: false, s: s, have: have, tot: tot, label: label };
  }
  function mapCard(m) {
    var pr = mapProgress(m), b = el('button', 'mapbar'); b.type = 'button'; b.id = 'questCard';
    b.setAttribute('aria-label', pr.all ? '我的地圖：目標達成' : '我的地圖：第 ' + (m.cur + 1) + ' 關，' + stageText(pr.s));
    var ic = el('span', 'mbic'); ic.innerHTML = ICON_MAP; b.appendChild(ic);
    b.appendChild(el('span', 'mbk', pr.all ? '地圖完成' : '第 ' + (m.cur + 1) + ' 關'));
    b.appendChild(el('span', 'mbv', pr.all ? '目標達成：' + goalTitle(m.g.g, m.lv) : stageText(pr.s)));
    if (!pr.all) { b.appendChild(el('span', 'mbn', pr.label)); }
    b.insertAdjacentHTML('beforeend', ICON_CHEV);
    var bar = el('span', 'mbbar'), fill = el('span'); fill.style.width = Math.round(Math.min(pr.have, pr.tot) / pr.tot * 100) + '%'; bar.appendChild(fill); b.appendChild(bar);
    b.addEventListener('click', function () { showTab('map'); });
    return b;
  }
  /* 沒設目標就什麼都不放；30 關的「一般關卡」已經拿掉，功能由「我的地圖」取代 */
  questCard = function () { var m = mapState(); mapDot(); return m ? mapCard(m) : document.createDocumentFragment(); };
  openQuest = function () { showTab('map'); };
  /* 過一關的小慶祝 */
  questCelebrate = function () {
    var m = mapState(); if (!m) { return; }
    var seen = lsGetJ(MAPSEEN_KEY, null);
    if (seen == null) { lsSetJ(MAPSEEN_KEY, m.nDone); return; }
    try { if (localStorage.getItem('thai-quest-quiet') === '1') { return; } } catch (err) {}
    if (m.nDone <= seen) { if (m.nDone < seen) { lsSetJ(MAPSEEN_KEY, m.nDone); } return; }
    var hv = $('view-home'), cv = $('view-cards'), mv = $('view-map');
    if (!((hv && !hv.hidden) || (cv && !cv.hidden) || (mv && !mv.hidden)) || overlayOpen()) { return; }
    lsSetJ(MAPSEEN_KEY, m.nDone);
    var n = m.nDone - seen, last = Math.min(m.nDone, m.stg.length) - 1;
    $('qcT').textContent = n > 1 ? '過了 ' + n + ' 關！' : '過關！';
    $('qcS').textContent = '第 ' + (last + 1) + ' 關：' + stageText(m.stg[last]);
    $('qcN').textContent = m.cur >= m.stg.length ? '目標達成：' + goalTitle(m.g.g, m.lv) : '下一關：' + stageText(m.stg[m.cur]);
    qcWrap.hidden = false;
    setTimeout(function () { $('qcOk').focus(); }, 30);
  };

  /* ====== 「地圖」分頁：我的地圖＋學習紀錄 ====== */
  var MAPVISIT_KEY = 'thai-map-visit';
  /* 指定短文的名字（讀物庫載入後才有；還沒載入先放編號，載入完整頁重畫一次） */
  function mapTextOf(id) { var r = null; (rdItems || []).forEach(function (x) { if (x.id === id) { r = x; } }); return r; }
  function mapOpenText(id) {
    rdLoad().then(function (items) { var it = null; items.forEach(function (x) { if (x.id === id) { it = x; } }); if (it) { rdOpenItem(it); } else { openReaderAt(id.charAt(0)); } }, function () { openReaderAt(id.charAt(0)); });
  }
  function mapChips(s, m) {
    var wrap = el('div', 'mapchips');
    s.ids.forEach(function (id) {
      var d = rdDocOf(id), seen = !!(d && d.opened >= m.g.t0), it = mapTextOf(id);
      var c = el('button', 'mapchip' + (seen ? ' on' : '')); c.type = 'button';
      if (seen) { c.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>'); }
      var t = el('span', '', it ? (UI_LANG === 'en' ? it.th : it.zh) : id.toUpperCase()); if (it && UI_LANG === 'en') { t.lang = 'th'; } c.appendChild(t);
      c.addEventListener('click', function () { mapOpenText(id); });
      wrap.appendChild(c);
    });
    if (!rdItems) { rdLoad().then(function () { if (curTab === 'map') { renderMapTab(); } }, function () {}); }
    return wrap;
  }
  function mapSection(m) {
    var sec = el('section', 'mapsec');
    var hd = el('div', 'maphd'); hd.appendChild(el('h2', 'maph', '我的地圖'));
    var ch = el('button', 'linkbtn', '修改目標'); ch.type = 'button'; ch.addEventListener('click', function () { wizOpen('goal'); }); hd.appendChild(ch);
    sec.appendChild(hd);
    sec.appendChild(el('p', 'mapsub', goalTitle(m.g.g, m.lv) + '・每天 ' + m.g.m + ' 分鐘'));
    var fin = m.cur >= m.stg.length;
    sec.appendChild(el('p', 'mapeta', etaText(m.eta)));
    if (fin) {
      var fb = el('div', 'mapnote2'); fb.appendChild(el('p', '', '這張地圖走完了，恭喜！要不要挑下一個目標？'));
      var nb = el('button', 'primary', '挑下一個目標'); nb.type = 'button'; nb.addEventListener('click', function () { wizOpen('goal'); }); fb.appendChild(nb); sec.appendChild(fb);
    } else if (m.stale) {
      var sb = el('div', 'mapnote2'), sp = el('p', '');
      [['你的程度已經改成「'], [LV4_NAME[lv4()]], ['」，這張地圖還是照「'], [LV4_NAME[m.lv]], ['」排的。要換一個適合的目標嗎？']].forEach(function (x) { sp.appendChild(el('span', '', x[0])); });
      sb.appendChild(sp);
      var sb2 = el('button', '', '換目標'); sb2.type = 'button'; sb2.addEventListener('click', function () { wizOpen('goal'); }); sb.appendChild(sb2); sec.appendChild(sb);
    }
    var ol = el('ol', 'lqpath');
    m.stg.forEach(function (s, i) {
      var isDone = m.done[i], isCur = i === m.cur, li = el('li', isDone ? 'lqdone' : (isCur ? 'lqcur' : 'lqlock'));
      var dot = el('span', 'lqdot');
      if (isDone) { dot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>'; } else { dot.textContent = String(i + 1); }
      li.appendChild(dot);
      var tx = el('span', 'lqptx'); tx.appendChild(el('span', 'lqpt', stageText(s)));
      if (isCur && s.k !== 'boss') {
        var have = Math.min(m.have[i], s.n), bar = el('span', 'lqbar'), f = el('span'); f.style.width = Math.round(have / s.n * 100) + '%'; bar.appendChild(f);
        var pr = el('span', 'lqprow'); pr.appendChild(bar); pr.appendChild(el('span', 'lqnum', have + ' / ' + s.n)); tx.appendChild(pr);
        if (s.k === 'read' && s.ids) { tx.appendChild(mapChips(s, m)); }
        var go = el('button', 'mapgo', s.k === 'read' && s.ids ? '讀下一篇' : '去做這一關'); go.type = 'button'; go.addEventListener('click', function () { mapGo(s, m); }); tx.appendChild(go);
      }
      if (s.k === 'boss' && !isDone) { tx.appendChild(bossBox(m, s, isCur)); }
      li.appendChild(tx);
      li.setAttribute('aria-label', '第 ' + (i + 1) + ' 關，' + stageText(s) + '，' + (isDone ? '已過關' : isCur ? '進行中' : '還沒開始'));
      ol.appendChild(li);
    });
    sec.appendChild(ol);
    return sec;
  }
  function mapEmpty() {
    var sec = el('section', 'mapsec mapnew');
    sec.appendChild(el('h2', 'maph', '我的地圖'));
    sec.appendChild(el('p', 'mapsub', '選一個目標和每天的時間，產生專屬的學習地圖，還會算出大概哪天能到達。'));
    var row = el('div', 'btns');
    var go = el('button', 'primary', '設定我的目標'); go.type = 'button'; go.addEventListener('click', function () { wizOpen('goal'); });
    row.appendChild(go); sec.appendChild(row);
    return sec;
  }
  function recordSection() {
    var st = learnStats(), sec = el('section', 'mapsec recsec');
    sec.appendChild(el('h2', 'maph', '學習紀錄'));
    var grid = el('div', 'lqstats');
    [[st.read, '篇文章', '讀過'], [st.words, '個生字', '記熟 ' + st.known + ' 個'], [st.week, '/ ' + weekGoal() + ' 天', '本週學習・連續 ' + st.streak + ' 天'], [st.rev, '次', '複習']].forEach(function (x) {
      var t = el('div', 'lqstat'); var n = el('div', 'lqsn'); n.appendChild(el('b', '', String(x[0]))); n.appendChild(el('span', '', x[1])); t.appendChild(n); t.appendChild(el('div', 'lqsl', x[2])); grid.appendChild(t);
    });
    sec.appendChild(grid);
    var wkTile = grid.children[2];
    var gr = el('div', 'lqgoal'); gr.appendChild(el('span', 'lqgl', '每週目標'));
    var gs = el('div', 'seg'); gs.setAttribute('role', 'radiogroup'); gs.setAttribute('aria-label', '每週目標'); gr.appendChild(gs);
    function goalSeg() {
      segButtons(gs, [['3', '3 天'], ['4', '4 天'], ['5', '5 天'], ['6', '6 天']], String(weekGoal()), function (v) {
        lsSetJ(WEEKGOAL_KEY, +v); goalSeg();
        var u = wkTile && wkTile.querySelector('.lqsn span'); if (u) { u.textContent = '/ ' + weekGoal() + ' 天'; }
        renderToday();
      });
    }
    goalSeg(); sec.appendChild(gr);
    sec.appendChild(el('p', 'lqsfoot', '讀文章：打開過的不同文件。記熟：複習後預估能記住 21 天以上的生字。學習天數：那天有打開文件或複習就算，每週一重新計算本週。'));
    return sec;
  }
  function mapDot() {
    var d = $('mapDot'); if (!d) { return; }
    d.hidden = !(goalGet() && !lsGetJ(MAPVISIT_KEY, null));
  }
  function renderMapTab() {
    var host = $('mapBody'); if (!host) { return; }
    host.replaceChildren();
    var m = mapState();
    host.appendChild(m ? mapSection(m) : mapEmpty());
    host.appendChild(recordSection());
    lsSetJ(MAPVISIT_KEY, 1); mapDot();
  }
  setTimeout(mapDot, 0);
  function bossBox(m, s, isCur) {
    var b = BOSS[s.boss], box = el('div', 'mapboss');
    if (!m.allPrev) {
      box.appendChild(el('p', 'mapnote', '先完成前面的關卡，就能挑戰這一關。'));
      return box;
    }
    if (!m.unlocked) {
      box.appendChild(el('p', 'mapnote', '這篇你的認得率約 ' + m.rate + '%，到 ' + BOSS_THR + '% 就解鎖。把下面這些詞記熟，數字就會升上去：'));
      var unk = rrUnknown(b.text, 10), wl = el('p', 'mapunk');
      unk.forEach(function (w) { var sp = el('span', 'mapw', w); sp.lang = 'th'; wl.appendChild(sp); });
      box.appendChild(wl);
      var row = el('div', 'btns mapbtns');
      var add = el('button', '', '全部存成生字卡'); add.type = 'button';
      add.addEventListener('click', function () {
        var n = mapAddWords(unk, b.text, b.th);
        add.disabled = true; add.textContent = n ? '已存 ' + n + ' 個' : '都已經在生字卡裡了';
        renderToday();
      });
      var rd = el('button', '', '先看看這篇'); rd.type = 'button'; rd.addEventListener('click', function () { bossRead(s.boss); });
      row.appendChild(add); row.appendChild(rd); box.appendChild(row);
      return box;
    }
    box.appendChild(el('p', 'mapnote', '已解鎖！先讀完這篇，再答 3 題，答對 2 題就過關。'));
    var row2 = el('div', 'btns mapbtns');
    var r1 = el('button', '', '讀這篇'); r1.type = 'button'; r1.addEventListener('click', function () { bossRead(s.boss); });
    var r2 = el('button', 'primary', '答 3 題'); r2.type = 'button'; r2.addEventListener('click', function () { bossQuiz(s.boss); });
    row2.appendChild(r1); row2.appendChild(r2); box.appendChild(row2);
    return box;
  }

  /* ---- 魔王關答題視窗 ---- */
  var bq = document.createElement('div'); bq.id = 'bossQ'; bq.className = 'modal'; bq.hidden = true;
  bq.setAttribute('role', 'dialog'); bq.setAttribute('aria-modal', 'true'); bq.setAttribute('aria-labelledby', 'bqT');
  bq.innerHTML = '<div class="mcard bqcard"><div id="bqBody"></div></div>';
  document.body.appendChild(bq);
  var bqs = null;
  function bossQuiz(key) {
    var b = BOSS[key]; if (!b) { return; }
    bqs = { b: b, k: 0, right: 0, picked: -1, opts: b.qs.map(function (q) { return shuffle(q.o.map(function (x, i) { return i; })); }) };
    bq.hidden = false; bqRender();
  }
  function bqClose() { bq.hidden = true; bqs = null; renderToday(true); if (curTab === 'map') { renderMapTab(); } }
  function bqRender() {
    var body = $('bqBody'), b = bqs.b; body.replaceChildren();
    var h = el('h2', '', '魔王關：' + b.title); h.id = 'bqT'; body.appendChild(h);
    if (bqs.k >= b.qs.length) {
      var pass = bqs.right >= 2;
      body.appendChild(el('p', 'bqres ' + (pass ? 'ok' : 'bad'), pass ? '過關！答對 ' + bqs.right + ' / ' + b.qs.length + ' 題' : '差一點：答對 ' + bqs.right + ' / ' + b.qs.length + ' 題，要答對 2 題才過關'));
      if (!pass) { body.appendChild(el('p', 'wnote', '再讀一次原文，找找答案在哪一句，再試一次。')); }
      var row = el('div', 'btns');
      if (pass) {
        var g = lsGetJ(GOAL_KEY, null); if (g && (!g.bt || !g.bt[b.key])) { g.bt = g.bt || {}; g.bt[b.key] = Date.now(); lsSetJ(GOAL_KEY, g); }
        var ok = el('button', 'primary', '回到地圖'); ok.type = 'button'; ok.addEventListener('click', function () { bq.hidden = true; bqs = null; showTab('map'); renderMapTab(); }); row.appendChild(ok);
        var cl = el('button', '', '關閉'); cl.type = 'button'; cl.addEventListener('click', bqClose); row.appendChild(cl);
      } else {
        var rd = el('button', '', '再讀一次原文'); rd.type = 'button'; rd.addEventListener('click', function () { var key2 = b.key; bqClose(); bossRead(key2); });
        var re = el('button', 'primary', '再答一次'); re.type = 'button'; re.addEventListener('click', function () { bossQuiz(b.key); });
        row.appendChild(rd); row.appendChild(re);
      }
      body.appendChild(row);
      setTimeout(function () { var f = body.querySelector('button.primary'); if (f) { f.focus(); } }, 30);
      return;
    }
    var q = b.qs[bqs.k];
    body.appendChild(el('p', 'qprog', '第 ' + (bqs.k + 1) + ' / ' + b.qs.length + ' 題'));
    var det = el('details', 'bqtext'); det.appendChild(el('summary', '', '再看一次原文'));
    var pt = el('div', 'bqpass', b.text); pt.lang = 'th'; det.appendChild(pt); body.appendChild(det);
    body.appendChild(el('div', 'qprompt small', L2(q.q[0], q.q[1])));
    var opts = el('div', 'qopts');
    bqs.opts[bqs.k].forEach(function (oi) {
      var btn = el('button', 'qopt', L2(q.o[oi][0], q.o[oi][1])); btn.type = 'button';
      if (bqs.picked >= 0) { btn.disabled = true; if (oi === q.a) { btn.classList.add('ok'); } else if (oi === bqs.picked) { btn.classList.add('bad'); } }
      btn.addEventListener('click', function () {
        if (bqs.picked >= 0) { return; }
        bqs.picked = oi; if (oi === q.a) { bqs.right++; }
        bqRender();
      });
      opts.appendChild(btn);
    });
    body.appendChild(opts);
    if (bqs.picked >= 0) {
      var why = el('div', 'qwhy');
      if (bqs.picked === q.a) { why.appendChild(el('span', '', '答對了。')); }
      else { why.appendChild(el('span', '', '答案：')); why.appendChild(el('b', '', L2(q.o[q.a][0], q.o[q.a][1]))); }
      why.appendChild(document.createTextNode(' ')); why.appendChild(el('span', '', '原文：'));
      var th = el('span', 'twp', q.w); th.lang = 'th'; why.appendChild(th); body.appendChild(why);
      var nx = el('button', 'primary', bqs.k + 1 < b.qs.length ? '下一題' : '看結果'); nx.type = 'button';
      nx.addEventListener('click', function () { bqs.k++; bqs.picked = -1; bqRender(); });
      body.appendChild(nx); setTimeout(function () { nx.focus(); }, 30);
    }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !bq.hidden) { bqClose(); } });

  /* ---- 打開魔王關文章時，文章上方的一條提示 ---- */
  var bsBar = document.createElement('div'); bsBar.id = 'bossBar'; bsBar.className = 'rrhint bossbar'; bsBar.hidden = true;
  bsBar.innerHTML = '<div class="rrrow"><span class="bossbtx" id="bossTx"></span><button type="button" class="bossgo" id="bossGo"></button></div>';
  $('docSrc').parentNode.insertBefore(bsBar, $('docSrc'));
  function bossBarShow() {
    if (!bsBar) { return; }
    bsBar.hidden = true;
    var d = state.src && lib.docs.filter(function (x) { return x.id === state.src.id; })[0], b = d && d.lib && BOSS_BY_ID[d.lib];
    if (!b || curTab !== 'doc') { return; }
    var m = mapState(), can = m && m.unlocked;
    var tx = $('bossTx'); tx.replaceChildren(); tx.appendChild(el('span', '', '魔王關：讀完後答 3 題'));
    if (!can && m) { tx.appendChild(document.createTextNode(' ')); tx.appendChild(el('span', 'bosslock', '認得率還沒到 ' + BOSS_THR + '%')); }
    var go = $('bossGo'); go.textContent = '答 3 題'; go.disabled = !can;
    go.onclick = function () { bossQuiz(b.key); };
    bsBar.hidden = false;
  }
  var _openDoc3 = openDoc;
  openDoc = function (id) { var r = _openDoc3.apply(this, arguments); setTimeout(bossBarShow, 700); return r; };
  var _rrRefresh0 = rrRefresh;
  rrRefresh = function () { _rrRefresh0(); bossBarShow(); };

  /* ---- 聲調練習做完一輪，算一次（入門的第一關） ---- */
  var _renderTonePractice0 = renderTonePractice;
  renderTonePractice = function (host) {
    if (tq && !tq.items[tq.k] && !tq.counted) { tq.counted = 1; statBump('tone'); markDay(); }
    return _renderTonePractice0.apply(this, arguments);
  };

  /* ====== 歡迎流程：一頁一題 ====== */
  var LQ = [
    ['a', 'น้ำ', ['水', 'water'], [['火', 'fire'], ['飯', 'rice'], ['茶', 'tea']]],
    ['a', 'กิน', ['吃', 'to eat'], [['喝', 'to drink'], ['睡', 'to sleep'], ['走', 'to walk']]],
    ['a', 'บ้าน', ['家；房子', 'house; home'], [['學校', 'school'], ['車子', 'car'], ['市場', 'market']]],
    ['a', 'เพื่อน', ['朋友', 'friend'], [['老師', 'teacher'], ['媽媽', 'mother'], ['醫生', 'doctor']]],
    ['a', 'ใหญ่', ['大', 'big'], [['小', 'small'], ['長', 'long'], ['新', 'new']]],
    ['b', 'ตลาด', ['市場', 'market'], [['醫院', 'hospital'], ['車站', 'station'], ['銀行', 'bank']]],
    ['b', 'ราคา', ['價格', 'price'], [['重量', 'weight'], ['時間', 'time'], ['地址', 'address']]],
    ['b', 'ปวด', ['痛', 'to ache'], [['累', 'tired'], ['餓', 'hungry'], ['冷', 'cold']]],
    ['b', 'เปลี่ยน', ['改變；更換', 'to change'], [['等待', 'to wait'], ['忘記', 'to forget'], ['借', 'to borrow']]],
    ['b', 'เดินทาง', ['旅行；出遠門', 'to travel'], [['休息', 'to rest'], ['工作', 'to work'], ['打掃', 'to clean']]],
    ['c', 'เศรษฐกิจ', ['經濟', 'economy'], [['政治', 'politics'], ['教育', 'education'], ['文化', 'culture']]],
    ['c', 'สิ่งแวดล้อม', ['環境', 'environment'], [['娛樂', 'entertainment'], ['職業', 'occupation'], ['建築', 'architecture']]],
    ['c', 'ประสบการณ์', ['經驗', 'experience'], [['知識', 'knowledge'], ['記憶', 'memory'], ['意見', 'opinion']]],
    ['c', 'ความรับผิดชอบ', ['責任', 'responsibility'], [['自由', 'freedom'], ['權利', 'rights'], ['友誼', 'friendship']]],
    ['c', 'ผลกระทบ', ['影響；衝擊', 'impact'], [['原因', 'cause'], ['計畫', 'plan'], ['報告', 'report']]],
    ['d', 'อนุมัติ', ['批准', 'to approve'], [['拒絕', 'to refuse'], ['調查', 'to investigate'], ['推遲', 'to postpone']]],
    ['d', 'มาตรการ', ['措施', 'measure'], [['標準', 'standard'], ['預算', 'budget'], ['證據', 'evidence']]],
    ['d', 'วิพากษ์วิจารณ์', ['批評', 'to criticize'], [['讚美', 'to praise'], ['解釋', 'to explain'], ['翻譯', 'to translate']]],
    ['d', 'ละเมิด', ['侵犯；違反', 'to violate'], [['保護', 'to protect'], ['繼承', 'to inherit'], ['尊重', 'to respect']]],
    ['d', 'แถลงการณ์', ['聲明', 'statement'], [['廣告', 'advertisement'], ['日記', 'diary'], ['劇本', 'script']]]
  ];
  var wz = null;
  function wizSteps() {
    var head = wz.from === 'goal' ? ['level', 'goal'] : ['hi', 'how', 'level', 'goal'];
    return head.concat(wz.goal === 'free' ? ['done'] : ['time', 'map']);
  }
  function wizSetLevel(v) {
    var changed = v !== lv4();
    level = v; try { localStorage.setItem('thai-level', v); } catch (err) {}
    rrMemo = {}; rrMemoN = 0;
    try { renderSettings(); renderReport(); } catch (err) {}
    var opts = goalIds(lv4()); if (changed || opts.indexOf(wz.goal) < 0) { wz.goal = opts[0]; }
  }
  function wizOpen(from) {
    var g0 = lsGetJ(GOAL_KEY, null) || {};
    wz = { from: from === 'goal' ? 'goal' : 'new', i: 0, quiz: null, goal: g0.g || null, mins: g0.m || 10 };
    if (!wz.goal || goalIds(lv4()).indexOf(wz.goal) < 0) { wz.goal = goalIds(lv4())[0]; }
    welcomeFrom = document.activeElement;
    wizRender();
    $('welcome').hidden = false;
    var mc = $('welcome').querySelector('.mcard'); if (mc) { mc.scrollTop = 0; }
  }
  function wzOpt(title, sub, on, tag, onPick) {
    var b = el('button', 'wzopt' + (on ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(!!on));
    var t = el('span', 'wzot'); t.appendChild(el('b', '', title)); if (tag) { t.appendChild(el('em', 'wztag', tag)); } b.appendChild(t);
    if (sub) { b.appendChild(el('span', 'wzos', sub)); }
    b.addEventListener('click', onPick);
    return b;
  }
  function wzHead(text, sub) {
    var h = el('h2', 'wzh', text); h.id = 'h-welcome'; h.tabIndex = -1;
    var f = document.createDocumentFragment(); f.appendChild(h); if (sub) { f.appendChild(el('p', 'wnote', sub)); }
    return f;
  }
  var WZ_SVG = {
    paste: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5V3.5h5v1M9 10h6M9 14h6"/></svg>',
    tap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h8M4 17h13"/><rect x="11.5" y="9.5" width="7" height="5" rx="1.5"/></svg>',
    cards: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/></svg>'
  };
  function wizRender() {
    var steps = wizSteps(); if (wz.i >= steps.length) { wz.i = steps.length - 1; }
    var key = steps[wz.i], body = $('wzBody'); body.replaceChildren();
    var dots = $('wzDots'); dots.replaceChildren();
    steps.forEach(function (s, i) { dots.appendChild(el('span', 'wzdot' + (i === wz.i ? ' cur' : (i < wz.i ? ' on' : '')))); });
    dots.setAttribute('role', 'img'); dots.setAttribute('aria-label', '第 ' + (wz.i + 1) + ' / ' + steps.length + ' 步');
    var last = wz.i === steps.length - 1, lv = lv4();
    if (wz.quiz) { wizQuizRender(body); $('wzDots').hidden = true; return; }
    dots.hidden = false;
    if (key === 'hi') {
      var hh = wzHead('歡迎來到 ไทย Reader！', 'ไทย Reader 是一款讓讀泰文變輕鬆的 App：點一個詞就看到意思，再存成生字卡慢慢記。接下來問你幾個小問題，幫你排一條適合你的學習路線，大約 1 分鐘。選項之後都能在設定修改。');
      body.appendChild(hh);
    } else if (key === 'how') {
      body.appendChild(wzHead('這樣學泰文'));
      var ul = el('ol', 'wzhow');
      [['paste', '加進一篇泰文', '貼上網址、匯入檔案，或從讀物庫挑一篇短文'], ['tap', '點一個不懂的詞', '馬上看到意思、拼音，還能聽發音'], ['cards', '存成生字卡複習', '每天複習幾張，慢慢就記住了']].forEach(function (x, i) {
        var li = el('li', 'wzstep'); var ic = el('span', 'wzic'); ic.innerHTML = WZ_SVG[x[0]]; li.appendChild(ic);
        var tx = el('span', 'wzstx'), tt = el('b', ''); tt.appendChild(el('span', 'wzn', String(i + 1))); tt.appendChild(el('span', '', x[1])); tx.appendChild(tt); tx.appendChild(el('span', '', x[2])); li.appendChild(tx); ul.appendChild(li);
      });
      body.appendChild(ul);
    } else if (key === 'level') {
      body.appendChild(wzHead('你的泰文程度？', '先選最接近的，不確定也沒關係，之後隨時能改。'));
      var grp = el('div', 'wzlist'); grp.setAttribute('role', 'radiogroup'); grp.setAttribute('aria-label', '你的泰文程度');
      LV4.forEach(function (v) {
        grp.appendChild(wzOpt(LV4_NAME[v], LV4_DESC[v], lv === v, '', function () { wizSetLevel(v); wizRender(); }));
      });
      body.appendChild(grp);
      var qb = el('button', 'linkbtn wzquiz', '不確定？做 1 分鐘小測驗'); qb.type = 'button';
      qb.addEventListener('click', function () { wz.quiz = { n: 0, tier: 1, hist: [], used: {}, cur: null, picked: -1 }; lqNext(); wizRender(); });
      body.appendChild(qb);
    } else if (key === 'goal') {
      body.appendChild(wzHead('你想達成什麼？', '選一個目標，地圖會朝它排關卡。'));
      var g2 = el('div', 'wzlist'); g2.setAttribute('role', 'radiogroup'); g2.setAttribute('aria-label', '你想達成什麼？');
      goalsFor(lv).forEach(function (o) {
        g2.appendChild(wzOpt(goalTitle(o.id, lv), goalSub(o.id), wz.goal === o.id, o.rec ? '推薦' : (o.finished ? '完成過' : ''), function () { wz.goal = o.id; wizRender(); }));
      });
      body.appendChild(g2);
    } else if (key === 'time') {
      body.appendChild(wzHead('每天想花多少時間？', '一週學 4 天左右就很好，漏幾天沒關係。'));
      var g3 = el('div', 'wzlist'); g3.setAttribute('role', 'radiogroup'); g3.setAttribute('aria-label', '每天想花多少時間？');
      [[5, '輕鬆起步，讀一小段加幾張卡'], [10, '剛剛好，一篇短文加複習'], [20, '認真一點，進度會快不少']].forEach(function (x) {
        g3.appendChild(wzOpt('每天 ' + x[0] + ' 分鐘', x[1], wz.mins === x[0], x[0] === 10 ? '推薦' : '', function () { wz.mins = x[0]; wizRender(); }));
      });
      body.appendChild(g3);
    } else if (key === 'map') {
      var gl = { g: wz.goal, m: wz.mins }, stg = mapStages(gl, lv), eta = mapEta(stg, null, wz.mins);
      body.appendChild(wzHead('你的專屬地圖', goalTitle(wz.goal, lv) + '・每天 ' + wz.mins + ' 分鐘'));
      var ol = el('ol', 'lqpath wzmap');
      stg.forEach(function (s, i) {
        var li = el('li', i === 0 ? 'lqcur' : 'lqlock'); var dot = el('span', 'lqdot', String(i + 1)); li.appendChild(dot);
        var tx = el('span', 'lqptx'); tx.appendChild(el('span', 'lqpt', stageText(s))); li.appendChild(tx); ol.appendChild(li);
      });
      body.appendChild(ol);
      body.appendChild(el('p', 'mapeta wzeta', etaText(eta)));
      body.appendChild(el('p', 'wnote', '沒有截止日。落後了，日期會自己往後延，不會「失敗」。'));
    } else if (key === 'done') {
      body.appendChild(wzHead('都設定好了', '你可以直接開始讀。想要一條有關卡的學習路線，隨時到「地圖」分頁設定目標。'));
    }
    $('wBack').hidden = wz.i === 0;
    $('wSkip').hidden = last;
    $('wNext').hidden = last; $('wNext').textContent = key === 'hi' ? '開始' : '繼續';
    $('wDone').hidden = !last; $('wDone').textContent = key === 'map' ? '開始第一關' : '開始使用';
    var h = body.querySelector('.wzh'); if (h) { try { h.focus({ preventScroll: true }); } catch (err) {} }
    var mc = $('welcome').querySelector('.mcard'); if (mc) { mc.scrollTop = 0; }
  }
  /* 1 分鐘小測驗：看泰文詞選意思；答對就換難一點的，答錯或不知道就換簡單一點的 */
  function lqNext() {
    var Q = wz.quiz, tier = LV4[Q.tier], pool = LQ.map(function (x, i) { return i; }).filter(function (i) { return LQ[i][0] === tier && !Q.used[i]; });
    if (!pool.length) { pool = LQ.map(function (x, i) { return i; }).filter(function (i) { return !Q.used[i]; }); }
    var idx = pool[Math.floor(Math.random() * pool.length)]; Q.used[idx] = 1; Q.cur = idx; Q.picked = -1;
    var it = LQ[idx], opts = [[it[2], true]].concat(it[3].map(function (x) { return [x, false]; }));
    Q.opts = shuffle(opts); Q.asked = tier;
  }
  function lqAnswer(i) {
    var Q = wz.quiz, ok = i >= 0 && Q.opts[i][1];
    Q.picked = i; Q.hist.push([LV4.indexOf(Q.asked), ok]); Q.n++;
    Q.tier = Math.max(0, Math.min(3, Q.tier + (ok ? 1 : -1)));
    wizRender();
    setTimeout(function () { if (!wz || !wz.quiz || wz.quiz.picked !== i || wz.quiz.n !== Q.n) { return; } if (Q.n >= 10) { Q.done = true; } else { lqNext(); } wizRender(); }, 650);
  }
  function lqLevel(Q) {
    var h = Q.hist.slice(-6), s = 0; h.forEach(function (x) { s += x[0] + (x[1] ? 0.5 : -0.5); });
    return LV4[Math.max(0, Math.min(3, Math.round(s / h.length)))];
  }
  function wizQuizRender(body) {
    var Q = wz.quiz;
    $('wBack').hidden = false; $('wSkip').hidden = true; $('wNext').hidden = true; $('wDone').hidden = true;
    if (Q.done) {
      var lv = lqLevel(Q);
      body.appendChild(wzHead('小測驗結果', '看起來你大概是這個程度。這只是粗略的參考，覺得不準就自己選。'));
      body.appendChild(el('div', 'wzbig', LV4_NAME[lv]));
      var row = el('div', 'btns wzres');
      var use = el('button', 'primary', '用這個程度'); use.type = 'button'; use.addEventListener('click', function () { wizSetLevel(lv); wz.quiz = null; wizRender(); });
      var back = el('button', '', '回去自己選'); back.type = 'button'; back.addEventListener('click', function () { wz.quiz = null; wizRender(); });
      row.appendChild(use); row.appendChild(back); body.appendChild(row);
      setTimeout(function () { use.focus(); }, 30);
      return;
    }
    var it = LQ[Q.cur];
    body.appendChild(wzHead('小測驗', '這個泰文詞是什麼意思？不知道就選「不知道」，不要猜。'));
    body.appendChild(el('p', 'qprog', '第 ' + (Q.picked !== -1 ? Q.n : Q.n + 1) + ' / 10 題'));
    var w = el('div', 'wzword', it[1]); w.lang = 'th'; body.appendChild(w);
    var opts = el('div', 'qopts');
    Q.opts.forEach(function (o, i) {
      var b = el('button', 'qopt', L2(o[0][0], o[0][1])); b.type = 'button';
      if (Q.picked !== -1) { b.disabled = true; if (o[1]) { b.classList.add('ok'); } else if (i === Q.picked) { b.classList.add('bad'); } }
      b.addEventListener('click', function () { if (Q.picked === -1) { lqAnswer(i); } });
      opts.appendChild(b);
    });
    body.appendChild(opts);
    var dk = el('button', 'linkbtn wzdk', '不知道'); dk.type = 'button'; dk.disabled = Q.picked !== -1; dk.addEventListener('click', function () { if (Q.picked === -1) { lqAnswer(-2); } });
    body.appendChild(dk);
  }
  $('wNext').addEventListener('click', function () { wz.i++; wizRender(); });
  $('wBack').addEventListener('click', function () { if (wz.quiz) { wz.quiz = null; wizRender(); return; } if (wz.i > 0) { wz.i--; wizRender(); } });
  $('wSkip').addEventListener('click', function () { closeWelcome(); });
  $('wDone').addEventListener('click', function () {
    if (!wz) { return; }
    var steps = wizSteps(), key = steps[wz.i];
    if (wz.goal === 'free' || key === 'done') { var fe = wz.from === 'goal'; goalSave('free', wz.mins); wz = null; if (fe) { showTab('map'); renderMapTab(); } return; }
    var firstTone = lv4() === 'a' && localStorage.getItem(TONE_KEY) === null;
    if (firstTone) { toneMode = true; try { localStorage.setItem(TONE_KEY, '1'); } catch (err) {} loadTones().catch(function () {}); if (typeof renderToneSetting === 'function') { renderToneSetting(); } }
    var fromEdit = wz.from === 'goal';
    goalSave(wz.goal, wz.mins);
    var m = mapState(); wz = null;
    renderHome();
    if (fromEdit) { showTab('map'); renderMapTab(); }
    else if (m) { setTimeout(function () { mapGo(m.stg[Math.min(m.cur, m.stg.length - 1)], m); }, 120); }
  });
  renderWelcome = function () { if (wz && !$('welcome').hidden) { wizRender(); } };
  openWelcome = function () { wizOpen('new'); };
  /* 「略過」「Esc」關掉時，不管走到哪一步，之前選的程度已經存了；目標沒選完就不存 */
  var _closeWelcome0 = closeWelcome;
  closeWelcome = function () { wz = null; return _closeWelcome0.apply(this, arguments); };
  $('welcome').setAttribute('aria-labelledby', 'h-welcome');
