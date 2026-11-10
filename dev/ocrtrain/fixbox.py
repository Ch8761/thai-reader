# 泰文模型把 ำ 記成 ํ＋า 兩個字：把 box 檔裡的 ำ 拆開，訓練時才不會整行被丟掉
import glob, sys
n = 0
for f in glob.glob(sys.argv[1] + '/*.box'):
    out = []
    for line in open(f, encoding='utf-8'):
        if line.startswith('ำ '):
            rest = line[2:]; out.append('ํ ' + rest); out.append('า ' + rest); n += 1
        else:
            out.append(line)
    open(f, 'w', encoding='utf-8').writelines(out)
print('split', n)
