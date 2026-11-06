#!/usr/bin/env python3
"""Check the distributable dataset without developer backups or private files."""
import collections,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'public/data'
b=json.loads((P/'ielts-book.json').read_text());words=b['words'];index={w:(g,p) for w,g,p in b['index']}
assert len(index)==len(words)==len(b['index']) and set(index)==set(words)
assert b['index']==json.loads((P/'ielts-index.json').read_text())['index']
targets={w for w,e in words.items() if e.get('t')};seen=collections.Counter();relations=0
for gi,g in enumerate(b['groups']):
 members=set(g['members']);seen.update(g['members']);adj={w:set() for w in members};pairs=set()
 assert set(g['targets'])==members&targets
 for e in g['curatedEdges']+g['inflectionEdges']:
  a,c=e['from'],e['to'];assert a!=c and a in members and c in members and e.get('source')
  pair=frozenset([a,c]);assert pair not in pairs;pairs.add(pair);adj[a].add(c);adj[c].add(a);relations+=1
 assert len(g['pages'])==len(g['pageCenters'])==len(members)
 for pi,page in enumerate(g['pages']):
  assert 1<=len(page)<=12 and len(page)==len(set(page)) and page[0]==g['pageCenters'][pi]
  assert index[page[0]]==(gi,pi) and set(page)<=members
  reached={page[0]};queue=[page[0]]
  for word in queue:
   for nxt in adj[word]&set(page)-reached:reached.add(nxt);queue.append(nxt)
  assert reached==set(page),(page[0],'disconnected page')
assert set(seen)==set(words) and all(n==1 for n in seen.values())
t=json.loads((P/'ielts-themes.json').read_text());members=collections.Counter(w for g in t['themes'] for w in g['members'] if w in targets)
assert set(members)==targets and all(n==1 for n in members.values())
f=json.loads((P/'ielts-frequency.json').read_text());high=targets&f['byWord'].keys()
assert f['counts']['highTargets']==len(high) and f['counts']['otherTargets']==len(targets-high)
assert all(e['source']=='ngsl' for e in f['byWord'].values())
assert all(words[w].get('ipa') and words[w].get('pos') and words[w].get('zh') for w in targets)
def page(w):
 gi,pi=index[w];return set(b['groups'][gi]['pages'][pi])
assert page('warden')=={'warden','wardens'} and page('medium')=={'medium','media','mediums'}
assert {'able','ably'}<=page('ability') and 'ablative' not in page('ability')
print(json.dumps(dict(words=len(words),targets=len(targets),groups=len(b['groups']),relations=relations,topics=len(t['themes']),highFrequency=len(high),allPagesConnected=True),ensure_ascii=False))
