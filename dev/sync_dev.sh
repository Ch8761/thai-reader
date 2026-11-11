# 把建置原料同步到儲存庫的 dev/（不含私人測試檔）
S=/tmp/claude-0/-home-claude/88754f5b-9eb8-550b-9e53-96d540ad93ce/scratchpad; D=/home/claude/thai-reader/dev
mkdir -p $D/tests $D/dictin
cd $S && cp *.py *.js *.sh *.css privacy.html thai-notes-test.v17.html srs_old_block.txt reader.json $D/ && rm -f $D/memo.py && cp dictin/* $D/dictin/ && cp tests/*.js tests/*.mjs $D/tests/ 2>/dev/null; cp -r tests/cf $D/tests/; [ -d tests/urlfx ] && cp -r tests/urlfx $D/tests/
[ -d reader ] && mkdir -p $D/reader && cp reader/*.py reader/*.txt reader/*.json $D/reader/ 2>/dev/null
[ -d ocrtrain ] && mkdir -p $D/ocrtrain && cp ocrtrain/*.py ocrtrain/*.sh ocrtrain/*.md $D/ocrtrain/ 2>/dev/null
P=$(cat $S/.private_pattern 2>/dev/null); [ -n "$P" ] && grep -rIl "$P" $D && echo "PRIVATE INFO FOUND" || true
[ -d i18n ] && mkdir -p $D/i18n && cp i18n/*.tsv i18n/help_en.js i18n/extract.js $D/i18n/ 2>/dev/null
