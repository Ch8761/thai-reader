set -e
cp thai-notes-test.v17.html thai-notes-test.html && python3 build_pdf.py && python3 build_zh.py && python3 build_cards.py && python3 build_fb.py && python3 build_export.py && python3 build_shell.py && python3 build_ocr.py && python3 build_names.py && python3 build_slang.py && python3 build_style.py && python3 build_ux.py && python3 build_view.py && python3 build_v18.py && python3 build_v19.py && python3 build_v20.py && python3 build_v21.py
bash mksrv.sh
