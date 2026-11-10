import sys, os, subprocess, unicodedata, glob
from rapidfuzz.distance import Levenshtein
def norm(s):
    s = unicodedata.normalize('NFC', s).replace('ํา', 'ำ').replace('เเ', 'แ')
    return ''.join(ch for ch in s if not ch.isspace())
def gt_of(box):
    out=[]
    for line in open(box, encoding='utf-8'):
        c = line.split(' ')[0]
        if c and c != '\t': out.append(c)
    return norm(''.join(out))
def run(tif, tessdir, lang, psm):
    r = subprocess.run(['tesseract', tif, '-', '--tessdata-dir', tessdir, '-l', lang, '--psm', str(psm), '--oem', '1'], capture_output=True, text=True)
    return norm(r.stdout)
if __name__ == '__main__':
    d, tessdir, lang = sys.argv[1], sys.argv[2], sys.argv[3]
    psm = sys.argv[4] if len(sys.argv) > 4 else '6'
    tot_e = tot_n = 0
    for tif in sorted(glob.glob(d + '/*.tif')):
        g = gt_of(tif[:-4] + '.box'); o = run(tif, tessdir, lang, psm)
        e = Levenshtein.distance(g, o); tot_e += e; tot_n += len(g)
        print('%-28s CER %5.2f%%' % (os.path.basename(tif)[:-4], 100 * e / max(1, len(g))))
    print('TOTAL CER %.2f%%' % (100 * tot_e / tot_n))
