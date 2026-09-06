# -*- coding: utf-8 -*-
# Cross-corpus duplicate sweep: every German sentence in the new file vs every
# example sentence and every FILLED exercise/answer of all 72 live topics.
import json,re,sys
MINE="/tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad/wave4/grammar/temporal-prepositions.json"
CACHE="/home/user/deutschmeister/grammar-content-cache.json"

def norm(s):
    s=s.replace('„','').replace('“','').replace('”','').replace('"','')
    s=re.sub(r'[^\wäöüßÄÖÜ ]+',' ',s)
    s=re.sub(r'\s+',' ',s).strip().lower()
    return s


INSTR = re.compile(r'^(schreib den satz( im perfekt)?|korrigiere den fehler|antworte auf[^:]*|sms an eine freundin|fill in[^:]*)\s*[:.]\s*', re.I)

def split_sentences(text):
    # bracket cues are notation, and task instructions are house boilerplate:
    # neither is content, so both are removed before comparing.
    text = re.sub(r'\[[^\]]*\]', ' ', text)
    text = INSTR.sub('', text.strip())
    out, buf = [], ''
    for part in re.split(r'(?<=[.!?])(\s+)', text):
        if part.strip()=='' and buf:
            # decide: was the char before the space an ordinal period?
            if re.search(r'(?:^|\s)\d+\.$', buf.strip()):
                buf += ' '
                continue
            out.append(buf.strip()); buf=''
        else:
            buf += part
    if buf.strip(): out.append(buf.strip())
    return [o for o in out if o]

def sentences(s):
    return [x for x in split_sentences(s) if len(norm(x).split())>=4]

def jaccard(a,b):
    A,B=set(a.split()),set(b.split())
    return len(A&B)/len(A|B) if A|B else 0.0

live=set()
c=json.load(open(CACHE,encoding='utf-8'))
for e in c['examples']:
    for s in sentences(e['sentence_de'] or ''): live.add(norm(s))
for e in c['exercises']:
    q=e['question_de'] or ''
    ca=e['correct_answer'] or ''
    filled=q.replace('___',ca) if '___' in q else q
    for s in sentences(filled): live.add(norm(s))
    for s in sentences(ca): live.add(norm(s))
    for a in (e.get('acceptable_answers') or []):
        for s in sentences(a): live.add(norm(s))
# live rules: table cells / dialogue lines / mistakes, so we also catch teaching sentences
def walkrules(n):
    if isinstance(n,dict):
        for k,v in n.items():
            if isinstance(v,str) and ('_de' in k or k in ('wrong','correct')):
                for s in sentences(v): live.add(norm(s))
            else: walkrules(v)
    elif isinstance(n,list):
        for v in n:
            if isinstance(v,str):
                for s in sentences(v): live.add(norm(s))
            else: walkrules(v)
for r in c['rules']:
    walkrules(r.get('content')); walkrules(r.get('common_mistakes'))

d=json.load(open(MINE,encoding='utf-8'))
mine=[]
def collect(n,p):
    if isinstance(n,dict):
        for k,v in n.items():
            if isinstance(v,str) and (k.endswith('_de') or k in ('wrong','correct','correct_answer','preview_example_de')):
                mine.append((p+'/'+k,v))
            elif isinstance(v,(dict,list)): collect(v,p+'/'+k)
            elif isinstance(v,str) and k in ('question_de',): mine.append((p+'/'+k,v))
    elif isinstance(n,list):
        for i,v in enumerate(n):
            if isinstance(v,str): mine.append((p+'[%d]'%i,v))
            else: collect(v,p+'[%d]'%i)
collect(d,'')
# also filled exercise stems + acceptable answers
for i,e in enumerate(d['exercises']):
    q=e['question_de']; ca=e['correct_answer']
    if '___' in q: mine.append(('/exercises[%d]/filled'%i, q.replace('___',ca)))
    for j,a in enumerate(e.get('acceptable_answers') or []):
        mine.append(('/exercises[%d]/acceptable[%d]'%(i,j), a))

hits=[]
for p,txt in mine:
    for s in sentences(txt):
        if norm(s) in live: hits.append((p,s))
print("live sentence corpus:",len(live))
print("mine sentences checked:",sum(len(sentences(t)) for _,t in mine))
for p,s in hits: print("HIT",p,"::",s)
print("HITS",len(hits))

# near-duplicate pass: any live sentence sharing >=0.7 of its tokens with one of mine
live_list=[l for l in live if len(l.split())>=4]
near=[]
for p_,txt in mine:
    for sn in sentences(txt):
        n=norm(sn)
        if len(n.split())<4: continue
        for l in live_list:
            j=jaccard(n,l)
            if j>=0.7: near.append((round(j,2),p_,sn,l))
near.sort(reverse=True)
for j,p_,sn,l in near[:15]: print("NEAR %.2f"%j,p_,"::",sn,"<>",l)
print("NEAR>=0.70:",len(near))
