cd $(dirname $0)
ls $1/*.tif | xargs -P 2 -I{} sh -c 'b=$(echo {} | sed "s/\.tif$//"); tesseract {} $b --tessdata-dir base_best -l tha --psm 6 lstm.train >/dev/null 2>&1'
