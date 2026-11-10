p='ux_ui.js'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:60]; s=s.replace(a,b)
rep("      { t: '翻譯一整段', s:", """      { t: '地名、機關的意思', s: '點專有名詞，看中文名或「字面」意思', img: 'ent-mean',
        d: ['內建名單裡的國家、泰國各府、政府機關、大學，會直接顯示中文名。', '不在名單裡的，會拆成字典裡的詞，顯示「字面」意思，例如 กรม（廳）＋ส่งเสริม（促進）＋การค้า（貿易）。', '有網路時還會顯示「翻譯」：機器翻譯的中文意思，僅供參考。'] },
      { t: '翻譯一整段', s:""")
rep("'按「編輯」，再點顏色就能刪掉；按「完成」結束。'", "'想換外面那三個顏色：先點上面「外面顯示的三個顏色」的一格，再點下面的顏色（或按「＋」挑新的）。換下來的顏色會收進「我的顏色」。', '按「編輯」，再點顏色就能刪掉；按「完成」結束。'")
rep("'打開工具列最右邊的「只用 Pencil 畫」：只有", "'打開工具列最右邊的「只用 Pencil 畫」開關：只有")
rep("    ['設定', [\n", """    ['設定', [
      { t: '更新 App', s: '設定頁最下面按「檢查更新」', img: '',
        d: ['App 平常會自己更新；想馬上拿到新版時，到設定頁最下面按「檢查更新」。', '有新版會自動下載並重新整理；沒有的話會顯示「已經是最新版了」。', '版本號就寫在按鈕左邊。'] },
""")
open(p,'w',encoding='utf-8').write(s)
p='tests/helpshots.js'; s=open(p,encoding='utf-8').read()
# entity meaning screenshot: on the Podcast/sample text there may be no entity; build after sel-pop using the doc text
a="  await shot('sel-pop', '#selpop', ['#spTr'], { tight: 14 });\n  await p.click('#spClose');\n"
assert s.count(a)==1
s=s.replace(a, a+"""  await p.evaluate(() => window.__ev("(function(){ var t = 'วันนี้ไปประชุมที่กรมส่งเสริมการค้า แล้วก็เดินทางกลับประเทศไทย'; setText(t, 'demo'); return 1; })()")).catch(e => console.log('setText fail', e.message));
  await p.waitForTimeout(500);
  { const ok = await p.evaluate(() => window.__ev("(function(){ var i = state.text.indexOf('กรมส่งเสริมการค้า'); if (i < 0) return false; var sg = segAt(i + 4); showPop(sg); return true; })()")).catch(e => 'err ' + e.message); console.log('ent pop', ok); }
  await p.waitForTimeout(300);
  await p.evaluate(() => { const r = document.querySelector('#pop .mtrow'); if (r) { r.hidden = false; r.classList.remove('loading'); r.querySelector('.mt-v').textContent = '國際貿易促進廳'; } });
  await shot('ent-mean', '#pop .ent-sec', ['#pop .compose', '#pop .mtrow'], { pad: 10 });
  await p.click('#pop .x').catch(() => {});
""")
open(p,'w',encoding='utf-8').write(s)
print('ok')
