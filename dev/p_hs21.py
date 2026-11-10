p='tests/helpshots.js'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:60]; s=s.replace(a,b)
rep("""  await p.dispatchEvent('#boxCustom', 'pointerup'); await p.waitForTimeout(250);
  await shot('note-colors', '#toolhead', ['#boxCustom', '#cpop'], { pad: 10, union: '#cpop', maxH: 700 });
  await p.dispatchEvent('#boxCustom', 'pointerup'); await p.waitForTimeout(150);""","""  await p.dispatchEvent('#fav-box-1', 'pointerup'); await p.waitForTimeout(150);
  await p.dispatchEvent('#fav-box-1', 'pointerup'); await p.waitForTimeout(250);
  await shot('note-colors', '#toolhead', ['#fav-box-1', '#cpop'], { pad: 10, union: '#cpop', maxH: 700 });
  await p.dispatchEvent('#fav-box-1', 'pointerup'); await p.waitForTimeout(150);
  await p.dispatchEvent('#fav-box-0', 'pointerup'); await p.waitForTimeout(150);""")
rep("""  await shot('note-export', '#view-doc .vhead', ['#openExport'], { pad: 12 });""","""  await shot('note-export', '#view-doc .vhead', ['#openExport'], { pad: 12 });
  await p.evaluate(() => {
    const q = []; let cur = null;
    window.speechSynthesis.speak = (u) => { q.push(u); if (!cur) next(); };
    function next() { cur = q.shift(); if (!cur) return; const u0 = cur; setTimeout(() => { if (cur !== u0) return; u0.onstart && u0.onstart(); setTimeout(() => { if (cur !== u0) return; cur = null; u0.onend && u0.onend(); next(); }, 900); }, 20); }
    window.speechSynthesis.cancel = () => { q.length = 0; if (cur) { const u = cur; cur = null; u.onerror && u.onerror({ error: 'interrupted' }); } };
    Object.defineProperty(window.speechSynthesis, 'speaking', { get: () => !!cur, configurable: true });
    Object.defineProperty(window.speechSynthesis, 'pending', { get: () => q.length > 0, configurable: true });
  });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('#readAll'); await p.waitForTimeout(1300);
  await p.evaluate(() => { const n = document.getElementById('ttsnote'); if (n) { n.textContent = ''; } });
  await shot('read-along', '.workbox', ['#readAll', '#text mark.reading'], { pad: 8, maxH: 520, union: '.ttsbar' });
  await p.click('#stopRead'); await p.waitForTimeout(200);""")
rep("""  await shot('cards-grade', '#cardbody', ['#cardbody button@@會了', '#cardbody button@@不會'], { pad: 12, maxH: 560 });
  await p.click('#cardTabs button:has-text("全部清單")'); await p.waitForTimeout(300);
  await shot('cards-list', '#cardbody li', ['#cardbody li .cmyin'], { pad: 10, maxH: 360 });""","""  await shot('cards-grade', '#cardbody', ['#cardbody .grades'], { pad: 12, maxH: 600 });
  await p.click('#cardTabs button:has-text("測驗")'); await p.waitForTimeout(200);
  await p.click('#cardbody button:has-text("開始測驗")'); await p.waitForTimeout(300);
  await p.click('#cardbody .qopt >> nth=0'); await p.waitForTimeout(300);
  await shot('cards-quiz', '#cardbody', ['#cardbody .qopts'], { pad: 12, maxH: 640 });
  await p.click('#cardTabs button:has-text("全部")'); await p.waitForTimeout(300);
  await p.click('#cardbody .crow >> nth=0'); await p.waitForTimeout(900);
  await shot('cards-detail', '.cdsheet', ['.cdsheet .cdlife'], { pad: 0, maxH: 1000 });
  await p.click('#cdClose'); await p.waitForTimeout(200);""")
rep("""  await shot('home-add', '.homeadd', ['.homeadd'], { pad: 16 });""","""  await shot('home-add', '.homeadd', ['.homeadd'], { pad: 16 });
  await p.click('.viewtoggle [data-hv="grid"]'); await p.waitForTimeout(400);
  await shot('home-grid', '#view-home', ['.viewtoggle'], { pad: 10, maxH: 560 });
  await p.click('.viewtoggle [data-hv="list"]'); await p.waitForTimeout(200);""")
open(p,'w',encoding='utf-8').write(s)
print('ok')
