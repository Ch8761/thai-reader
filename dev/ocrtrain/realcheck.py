# 真實圖片檢查：舊模型和新模型各讀一次，算「讀出來的泰文詞有幾成是字典裡的詞」
import sys, os, subprocess, json, re, glob
from pythainlp.tokenize import word_tokenize
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = set(json.load(open(S + '/dictin/thai_dict_zh.json', encoding='utf-8'))['words'])
for fn in ('slang.txt', 'celebs.txt', 'places.txt'):
    for line in open(S + '/dictin/' + fn, encoding='utf-8'): W.add(line.split('|')[0].strip())
IMGS = sorted(glob.glob(S + '/ocrtest/ig/*.png')) + [S + '/ocrtest/b300-1.png', S + '/ocrtest/photo.jpg', S + '/phototest/sign.jpg'] + sorted(glob.glob(S + '/vidtest/f00[0-9].png'))[:6]
def ocr(img, d):
    r = subprocess.run(['tesseract', img, '-', '--tessdata-dir', d, '-l', 'tha+eng', '--psm', '3', '--oem', '1'], capture_output=True, text=True)
    return r.stdout.replace('ํา', 'ำ')
def score(t):
    ws = [w for w in word_tokenize(t, engine='newmm') if re.search(r'[ก-ฮ]', w)]
    return (sum(1 for w in ws if w in W) / len(ws)) if ws else 0, len(ws)
tot = {}
for img in IMGS:
    row = []
    for d in sys.argv[1:]:
        t = ocr(img, d); s, n = score(t); row.append((s, n, t))
        tot.setdefault(d, []).append((s, n))
    print('==', os.path.basename(img), ' | '.join('%s %.0f%% of %d' % (os.path.basename(d.rstrip('/')), 100 * r[0], r[1]) for d, r in zip(sys.argv[1:], row)))
    if len(sys.argv) > 2 and row[0][2] != row[1][2]:
        a = [l for l in row[0][2].split('\n') if l.strip()]; b = [l for l in row[1][2].split('\n') if l.strip()]
        for x, y in list(zip(a, b))[:4]:
            if x != y: print('   old:', x[:90]); print('   new:', y[:90])
for d, v in tot.items():
    n = sum(x[1] for x in v); print('OVERALL', d, '%.1f%%' % (100 * sum(x[0] * x[1] for x in v) / max(1, n)), n, 'words')
