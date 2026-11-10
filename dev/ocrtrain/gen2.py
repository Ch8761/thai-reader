import subprocess, os, random, sys
from concurrent.futures import ThreadPoolExecutor
TRAIN_ALL = ["Anuphan","Bai Jamjuree","Chakra Petch","Charm","Chonburi","Fahkwang","IBM Plex Sans Thai","IBM Plex Sans Thai Looped","Itim","Kanit","Kanit Bold","Kanit Light","Kodchasan","Krub","Maitree","Mitr","Niramit","Noto Sans Thai","Noto Serif Thai","Pridi","Prompt","Prompt Bold","Prompt Medium","Sarabun","Sarabun Bold","Sriracha","Srisakdi","Taviraj","Thasadith","Trirong","Loma","Loma Bold"]
TRAIN = ['Sarabun','Sarabun Bold','Niramit','Itim','Sriracha','Charm','Srisakdi','Chonburi','Kodchasan','Fahkwang','Krub','Mitr']
paras = open('train.txt', encoding='utf-8').read().split('\n')
os.makedirs('gt2', exist_ok=True)
jobs = []
for i, f in enumerate(TRAIN):
    for v, (pt, exp) in enumerate([(11, 0), (14, 1), (18, -1), (26, 0)]):
        jobs.append((i, f, v, pt, exp))
def do(j):
    i, f, v, pt, exp = j
    n = f.replace(' ', '') + '_%d' % v
    random.seed(1000 + i * 10 + v)
    start = random.randrange(0, len(paras) - 400)
    tf = 'gt2/%s.txt' % n
    open(tf, 'w', encoding='utf-8').write('\n'.join(paras[start:start + 400]))
    pages = 4 if pt < 20 else 6
    if not os.path.exists('gt2/%s.tif' % n):
      subprocess.run(['text2image', '--fonts_dir', os.path.expanduser('~/.local/share/fonts'), '--font', f, '--text', tf, '--outputbase', 'gt2/' + n, '--max_pages', str(pages), '--ptsize', str(pt), '--exposure', str(exp), '--strip_unrenderable_words', '--leading', '32', '--char_spacing', '0.0'], capture_output=True)
    pass  # subprocess.run(['tesseract', 'gt2/%s.tif' % n, 'gt2/' + n, '--tessdata-dir', 'base_best', '-l', 'tha', '--psm', '6', 'lstm.train'], capture_output=True)
    return n, os.path.exists('gt2/%s.tif' % n)
with ThreadPoolExecutor(1) as ex:
    for n, ok in ex.map(do, jobs):
        print(n, ok, flush=True)
