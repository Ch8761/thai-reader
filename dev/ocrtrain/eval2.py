# 和 App 一樣：信心 < 50 的行丟掉（App 也會這樣過濾雜訊行），再算錯字率
import sys, glob, os, subprocess, csv, io
from eval import gt_of, norm
from rapidfuzz.distance import Levenshtein
def run(tif, d):
    r = subprocess.run(['tesseract', tif, '-', '--tessdata-dir', d, '-l', 'tha', '--psm', '6', 'tsv'], capture_output=True, text=True)
    lines = {}
    for row in csv.DictReader(io.StringIO(r.stdout), delimiter='\t', quoting=csv.QUOTE_NONE):
        if row['level'] != '5' or not row['text'].strip(): continue
        k = (row['block_num'], row['par_num'], row['line_num']); lines.setdefault(k, []).append((float(row['conf']), row['text']))
    keep = [' '.join(t for _, t in ws) for k, ws in sorted(lines.items(), key=lambda x: tuple(int(v) for v in x[0])) if not (sum(c for c, _ in ws) / len(ws) < 50 or (sum(c for c, _ in ws) / len(ws) < 80 and sum(1 for _, t in ws if len(t) <= 2) * 2 > len(ws)))]
    return norm(''.join(keep))
res = {}
for d in sys.argv[1:]:
    te = tn = 0
    for tif in sorted(glob.glob('eval/*.tif')):
        g = gt_of(tif[:-4] + '.box'); o = run(tif, d); e = Levenshtein.distance(g, o)
        res.setdefault(os.path.basename(tif)[:-4], []).append(100 * e / len(g)); te += e; tn += len(g)
    res.setdefault('TOTAL', []).append(100 * te / tn)
for k, v in res.items(): print('%-24s' % k, ' '.join('%7.2f%%' % x for x in v))
