import subprocess, os, random, sys
from concurrent.futures import ThreadPoolExecutor
TRAIN = ["Anuphan","Bai Jamjuree","Chakra Petch","Charm","Chonburi","Fahkwang","IBM Plex Sans Thai","IBM Plex Sans Thai Looped","Itim","Kanit","Kanit Bold","Kanit Light","Kodchasan","Krub","Maitree","Mitr","Niramit","Noto Sans Thai","Noto Serif Thai","Pridi","Prompt","Prompt Bold","Prompt Medium","Sarabun","Sarabun Bold","Sriracha","Srisakdi","Taviraj","Thasadith","Trirong","Loma","Loma Bold"]
paras = open('train.txt', encoding='utf-8').read().split('\n')
os.makedirs('gt', exist_ok=True)
jobs = []
for i, f in enumerate(TRAIN):
    for v, (pt, exp) in enumerate([(12, 0), (16, -1), (22, 1)]):
        jobs.append((i, f, v, pt, exp))
def do(j):
    i, f, v, pt, exp = j
    n = f.replace(' ', '') + '_%d' % v
    random.seed(i * 10 + v)
    start = random.randrange(0, len(paras) - 400)
    tf = 'gt/%s.txt' % n
    open(tf, 'w', encoding='utf-8').write('\n'.join(paras[start:start + 400]))
    pages = 4 if pt < 20 else 6
    if not os.path.exists('gt/%s.tif' % n):
      subprocess.run(['text2image', '--fonts_dir', os.path.expanduser('~/.local/share/fonts'), '--font', f, '--text', tf, '--outputbase', 'gt/' + n, '--max_pages', str(pages), '--ptsize', str(pt), '--exposure', str(exp), '--strip_unrenderable_words', '--leading', '32', '--char_spacing', '0.0'], capture_output=True)
    subprocess.run(['tesseract', 'gt/%s.tif' % n, 'gt/' + n, '--tessdata-dir', 'base_best', '-l', 'tha', '--psm', '6', 'lstm.train'], capture_output=True)
    return n, os.path.exists('gt/%s.lstmf' % n)
with ThreadPoolExecutor(2) as ex:
    for n, ok in ex.map(do, jobs):
        print(n, ok, flush=True)
