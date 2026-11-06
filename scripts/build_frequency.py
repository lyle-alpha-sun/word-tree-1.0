#!/usr/bin/env python3
"""Rebuild the public NGSL comparison from bundled, licensed source lists."""
import csv,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'public/data';S=R/'data-sources/ngsl'
ngsl={r['Lemma'].strip().lower():int(r['SFI Rank']) for r in csv.DictReader((S/'ngsl.csv').open(encoding='utf-8-sig'))};assert len(ngsl)==2809
supplement={}
for i,row in enumerate(csv.reader((S/'ngsl-supplement.csv').open(encoding='utf-8-sig'))):
 for word in row:
  if word.strip():supplement[word.strip().lower()]=2810+i
for word,rank in supplement.items():ngsl.setdefault(word,rank)
b=json.loads((P/'ielts-book.json').read_text());out={}
for word,e in b['words'].items():
 candidates=[word]+[x for x in [e.get('formOf'),e.get('ex',{}).get('0')] if x and x!=word]
 hits=[(ngsl[c.lower().strip()],c.lower().strip()) for c in candidates if c.lower().strip() in ngsl]
 if hits:
  rank,lemma=min(hits);out[word]=dict(source='ngsl',rank=rank if rank<2810 else None,supplement=rank>=2810,matched=lemma,matchType='exact' if lemma==word else 'dictionary-lemma',priority=rank)
targets={w for w,e in b['words'].items() if e.get('t')};high=targets&out.keys()
d=dict(version=1,basis='NGSL 1.2 with official supplement; exact or explicit dictionary lemma matching',sources=[dict(id='ngsl',name='NGSL 1.2',url='https://www.newgeneralservicelist.com/new-general-service-list',license='CC BY-SA 4.0',files=['data-sources/ngsl/ngsl.csv','data-sources/ngsl/ngsl-supplement.csv'],sha256={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in S.glob('*.csv') if not f.name.startswith('._')})],counts=dict(targets=len(targets),highTargets=len(high),otherTargets=len(targets-high),ngslTargets=len(high),ngslEntries=2809,ngslSupplementForms=len(supplement)),byWord=out)
(P/'ielts-frequency.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));print(d['counts'])
