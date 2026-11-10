import os, shutil
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 1.18 新的泰文辨識模型（多學了 30 多種字型） ----------
# 模型放在 ocr/lang2/；cachePath 換成 'm2'，裝置上存著的舊模型就不會再被用到（第一次辨識會重新下載約 4 MB）
rep("core: b + 'core', lang: b + 'lang', cross:", "core: b + 'core', lang: b + 'lang2', cross:")
rep("workerPath: u.worker, corePath: u.core, langPath: u.lang, gzip: true, workerBlobURL: u.cross,",
    "workerPath: u.worker, corePath: u.core, langPath: u.lang, cachePath: 'm2', gzip: true, workerBlobURL: u.cross,")
rep("    }).then(function (w) { ocr.worker = w;", """    }).then(function (w) {
      /* 刪掉舊版存在裝置上的辨識資料（./tha、./eng），省空間 */
      try { var rq = indexedDB.open('keyval-store'); rq.onsuccess = function () { try { var db = rq.result; if (db.objectStoreNames.contains('keyval')) { var st = db.transaction('keyval', 'readwrite').objectStore('keyval'); st.delete('./tha.traineddata'); st.delete('./eng.traineddata'); } } catch (err) {} }; } catch (err) {}
      return w;
    }).then(function (w) { ocr.worker = w;""")
open(src, 'w', encoding='utf-8').write(s)
L2 = os.path.join(D, 'srv', 'ocr', 'lang2'); os.makedirs(L2, exist_ok=True)
shutil.copyfile(os.path.join(D, 'ocrmodel', 'tha.traineddata.gz'), os.path.join(L2, 'tha.traineddata.gz'))
shutil.copyfile(os.path.join(D, 'ocrpkg', 'node_modules', '@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'), os.path.join(L2, 'eng.traineddata.gz'))
print('v28 ok')
