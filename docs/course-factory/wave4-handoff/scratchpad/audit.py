# -*- coding: utf-8 -*-
import json,re,sys,collections
P="/tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad/wave4/grammar/temporal-prepositions.json"
d=json.load(open(P,encoding="utf-8"))
issues=[]

# collect german strings with paths
ger=[]
def walk(node,path):
    if isinstance(node,dict):
        for k,v in node.items(): walk(v,path+"/"+str(k))
    elif isinstance(node,list):
        for i,v in enumerate(node): walk(v,path+"[%d]"%i)
    elif isinstance(node,str):
        ger.append((path,node))
walk(d,"")
GER_KEYS=("_de","sentence_de","question_de","hook_de","content_de","description_de","text_de","context_de","points","rows","preview_example_de","correct_answer","acceptable_answers","wrong","correct","options","preview_highlight","title_de")
def is_german(path):
    return any(k in path for k in ("_de","points","rows","wrong","correct","options","preview_highlight")) and "_en" not in path.split("/")[-1]

# word count

def split_sentences(text):
    text = re.sub(r'\[[^\]]*\]', 'CUE', text)
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

def wc(s):
    # count word tokens per sentence
    out=[]
    for sent in split_sentences(s):
        toks=[t for t in re.split(r'\s+',sent) if re.search(r'\w',t)]
        if toks: out.append((sent,len(toks)))
    return out
for path,s in ger:
    if not is_german(path): continue
    for sent,n in wc(s):
        if n>12: issues.append(("WORDS %d"%n,path,sent))

BAN = {
 r'\bweil\b':'weil', r'\bdass\b':'dass', r'\bwenn\b':'wenn', r'\bob\b':'ob',
 r'\bwürde|\bwürden|\bwäre|\bhätte|\bsollte|\bkönnte':'Konjunktiv II',
 r'\bwerde\b|\bwirst\b|\bwird\b|\bwerden\b|\bwerdet\b':'werden (Futur/Passiv)',
 r'\bsich\b|\bmich\b|\bdich\b|\buns\b|\beuch\b':'reflexive/pronoun check',
 r'\bam \w+sten\b|\bam besten\b':'Superlativ',
 r'\bals\b':'als',
 r'\bwährend\b':'während',
 r'\bging\b|\bkam\b|\bsagte\b|\bmachte\b|\bhatte\b|\bwar\b|\bwaren\b':'Präteritum check',
 r'\bdes \w+|\bder \w+s\b':'Genitiv check',
}
for path,s in ger:
    if not is_german(path): continue
    for pat,label in BAN.items():
        for m in re.finditer(pat,s):
            issues.append(("BAN:"+label,path,m.group(0)+" || "+s[:80]))

# examples checks
seen=set()
for e in d["examples"]:
    if e["grammar_highlight"] not in e["sentence_de"]:
        issues.append(("HL",str(e["order_index"]),e["grammar_highlight"]))
    toks=[re.sub(r'[.,!?„“"]','',t) for t in e["sentence_de"].split()]
    toks=[t for t in toks if t]
    wb=e["word_breakdown"]
    for t in toks:
        if t not in wb: issues.append(("WB missing",str(e["order_index"]),t))
    for k in wb:
        if k not in toks: issues.append(("WB extra",str(e["order_index"]),k))
    if len(toks)>14: issues.append(("EX len",str(e["order_index"]),str(len(toks))))
    seen.add(e["sentence_de"])

# exercises
mc=[e for e in d["exercises"] if e["exercise_type"]=="multiple_choice"]
typed=[e for e in d["exercises"] if e["exercise_type"]!="multiple_choice"]
print("typed",len(typed),"mc",len(mc))
pos=collections.Counter()
for e in mc:
    if len(e["options"])!=4: issues.append(("MC opts",str(e["order_index"]),""))
    if e["options"].count(e["correct_answer"])!=1: issues.append(("MC dup key",str(e["order_index"]),""))
    pos[e["options"].index(e["correct_answer"])]+=1
print("MC key positions",dict(pos))
for e in d["exercises"]:
    if e["correct_answer"] not in (e["acceptable_answers"] or []):
        issues.append(("ACC missing key","%d/%d"%(e["stage"],e["order_index"]),e["correct_answer"]))
    for f in ("question_de","question_en","explanation_en","explanation_de","why_correct_en","why_correct_de"):
        if not e.get(f): issues.append(("missing "+f,"%d/%d"%(e["stage"],e["order_index"]),""))
    if e["exercise_type"]=="fill_blank" and e["question_de"].count("___")!=1:
        issues.append(("blanks","%d/%d"%(e["stage"],e["order_index"]),""))
    # overlap with examples
    for s in seen:
        if s.rstrip('.') and s.rstrip('.') in e["question_de"] or s in (e["acceptable_answers"] or []):
            issues.append(("DUP example in exercise","%d/%d"%(e["stage"],e["order_index"]),s))

t=d["topic"]
pt="German %s — A2.1 Grammar | DeutschMeister"%t["title_en"]
print("title_en",len(t["title_en"]),"page title",len(pt))
print("desc_de sentences",len(re.split(r'(?<=[.!?])\s+',t["description_de"])),"desc_en",len(re.split(r'(?<=[.!?])\s+',t["description_en"])))

for i in issues: print(" | ".join(i))
print("ISSUES",len(issues))
