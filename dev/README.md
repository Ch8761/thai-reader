# ไทย Reader 開發原始檔（dev/）

這個資料夾是「做出 index.html 的原料」，網站本身用不到它。
平常的開發在 Claude 的工作環境裡進行，那裡的檔案會在工作階段結束後消失，所以每次發布時把原料複製一份到這裡保存。

## 怎麼重新建置

1. 準備一個資料夾（下面叫「工作資料夾」），把 dev/ 裡的檔案全部複製進去。
2. 下載三個套件到工作資料夾（用 npm）：
   - `pdfjs/`：`npm install --prefix pdfjs pdfjs-dist@4.10.38 pdf-lib@1.17.1`
   - `ocrpkg/`：`npm install --prefix ocrpkg tesseract.js@5.1.1 tesseract.js-core@5.1.1 @tesseract.js-data/tha @tesseract.js-data/eng`
   - `chi/`（1.20 起的中文辨識）：在 chi/ 裡 `npm pack @tesseract.js-data/chi_tra @tesseract.js-data/chi_sim`，各自解壓到 `chi/x_tesseract.js-data-chi_tra-1.0.0/`、`chi/x_tesseract.js-data-chi_sim-1.0.0/`
   - `ocrmodel/tha.traineddata.gz`（1.18 起自己訓練的泰文模型）：從儲存庫的 `ocr/lang2/` 複製；重新訓練的方法見 `dev/ocrtrain/`
3. 從正式網站（或儲存庫根目錄）複製 `examples.json`、`tones.json`、`help/*.webp`（放到 `helpimg/webp/`）。
   這幾個也可以用 `make_examples.py`、`make_tones.py`、`tests/helpshots.js` 重新產生。
4. `bash build_all.sh` → 產生測試頁 `thai-notes-test.html` 與本機測試網站 `srv/`。
5. `python3 make_pwa.py` → 產生正式版到儲存庫根目錄（記得先把檔案裡的 VER 加一）。
6. 用 `tests/` 裡對應的 Playwright 測試檢查，通過後 commit、push；Cloudflare Pages 會自動部署。

## 檔案分工

- `thai-notes-test.v17.html`：最早的主檔（測試頁 v17），之後的功能都由建置腳本依序加上去。
- `build_*.py`：依 `build_all.sh` 的順序，把各個 `*_ui.js` 插進主檔。
- `*_ui.js`：各功能模組（url_ui＝網址匯入、video_ui＝影片字幕、sync_ui＝雲端同步……）。
- `make_*.py`：產生資料（字典、專有名詞、聲調、例句、錯字對照表）。
- `make_pwa.py`：把測試頁轉成正式版、寫 sw.js、manifest、README、NOTICES。
- `cf_fetch.js`：網址匯入用的 Cloudflare 小程式（發布成 functions/api/fetch.js）。
- `dictin/`：字典與名單的原始資料。
- `tests/`：自動測試腳本（測試用的私人截圖、影片、PDF 沒有放上來）。
- `check_dupes.py`：所有模組共用同一個範圍，同名函式會互相蓋掉，建置時檢查。

完整的設計說明與版本紀錄見「ไทย Reader 開發專案書」（claude.ai 文件）。
