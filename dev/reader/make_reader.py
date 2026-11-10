# 讀物庫：把 texts.txt 轉成 reader.json，並檢查每篇用到的詞字典裡有沒有
import json, os, re, sys
from pythainlp.tokenize import word_tokenize
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(D)
items = []
for block in open(os.path.join(D, 'texts.txt'), encoding='utf-8').read().split('=== ')[1:]:
    head, _, body = block.partition('\n')
    iid, lv, th, zh, topic, summ = [x.strip() for x in head.split('|')]
    body = body.strip('\n')
    items.append({'id': iid, 'lv': lv, 'th': th, 'zh': zh, 'topic': topic, 'sum': summ, 'text': body, 'n': len(re.sub(r'\s', '', body))})
dict_words = set(json.load(open(os.path.join(R, 'dictin', 'thai_dict_zh.json'), encoding='utf-8'))['words'].keys())
for fn in ('slang.txt', 'celebs.txt', 'places.txt'):
    for line in open(os.path.join(R, 'dictin', fn), encoding='utf-8'):
        dict_words.add(line.split('|')[0].strip())
custom = set(dict_words)
bad = 0
for it in items:
    words = [w for w in word_tokenize(it['text'], engine='newmm', custom_dict=None) if re.search(r'[ก-ฮ]', w)]
    unk = sorted(set(w for w in words if w not in custom and not re.fullmatch(r'(.)\1+', w)))
    it['words'] = len(words)
    if unk:
        bad += 1
    print(it['id'], it['lv'], it['n'], 'chars', len(words), 'words', 'UNKNOWN:' if unk else '', ' '.join(unk))
json.dump([{k: v for k, v in it.items() if k != 'words'} for it in items], open(os.path.join(R, 'reader.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(items), 'texts ->', os.path.getsize(os.path.join(R, 'reader.json')), 'bytes')
