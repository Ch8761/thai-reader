# 防呆：主程式是同一個大範圍，兩個同名函式後面那個會蓋掉前面那個（曾經因此弄壞 PDF 文字）
import re, sys, collections
s = open('thai-notes-test.html', encoding='utf-8').read()
ALLOWED = {'updateCardButton', 'startReview', 'answer', 'renderReview', 'renderList', 'renderCards'}
c = collections.Counter(re.findall(r'^  (?:async )?function (\w+)\(', s, re.M))
bad = sorted(k for k, v in c.items() if v > 1 and k not in ALLOWED)
if bad:
    print('DUPLICATE FUNCTIONS:', bad); sys.exit(1)
print('no duplicate functions')
