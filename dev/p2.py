p='tests/helpshots.js'; s=open(p,encoding='utf-8').read()
a="  // ---------- 閱讀 ----------\n  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);\n"
assert s.count(a)==1
s=s.replace(a, a+"  await p.evaluate(() => { const r = document.getElementById('ttsSeek'); r.value = 350; r.style.setProperty('--p', '35%'); });\n  await shot('tts-bar', '.ttsbar', ['#player'], { pad: 10 });\n")
open(p,'w',encoding='utf-8').write(s)
