# -*- coding: utf-8 -*-
import json, re, collections
P = "/tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad/wave4/grammar/adjective-endings-intro.json"
CACHE = "/home/user/deutschmeister/grammar-content-cache.json"
d = json.load(open(P, encoding="utf-8")); cache = json.load(open(CACHE, encoding="utf-8"))
slugs = {t["slug"] for t in cache["topics"]}; issues = []
for k in ("prerequisite_slugs", "related_slugs"):
    for s in d["topic"][k]:
        if s not in slugs: issues.append(f"topic.{k}: '{s}' missing")
if set(d["topic"]["prerequisite_slugs"]) & set(d["topic"]["related_slugs"]): issues.append("prereq/related overlap")
for t in cache["topics"]:
    if t["sub_level"]=="A2.1" and t["topic_order"]==d["topic"]["topic_order"]: issues.append("topic_order collision "+t["slug"])
if d["topic"]["slug"] in slugs: issues.append("slug exists")
tl = len(f"German {d['topic']['title_en']} — A2.1 Grammar | DeutschMeister")
print("page title:", tl, "| title_en:", len(d["topic"]["title_en"]))
if tl > 70: issues.append(f"page title {tl}>70")
allstr=[]
def walk(n,p):
    if isinstance(n,dict):
        for k,v in n.items():
            if k=="word_breakdown": continue
            walk(v,f"{p}.{k}")
    elif isinstance(n,list):
        for i,v in enumerate(n): walk(v,f"{p}[{i}]")
    elif isinstance(n,str): allstr.append((p,n))
walk(d,"$")
def isde(p):
    k=p.split(".")[-1].split("[")[0]
    return k.endswith("_de") or k in ("de","wrong","correct","question_de","sentence_de","correct_answer","highlight") or re.search(r"\.(points|rows|options|acceptable_answers)",p)
gs=[(p,n) for p,n in allstr if isde(p)]
wc=lambda t: len([w for w in re.split(r"\s+",t.strip()) if w])
for p,s in gs:
    for sent in re.split(r"(?<=[.!?])\s+", s):
        if wc(sent)>12: issues.append(f"[len {wc(sent)}] {p}: {sent}")
BANNED={r"\bweil\b|\bdass\b|\bwenn\b|\bobwohl\b|\bals ich\b":"Nebensatz", r"\bdenn\b":"denn(A2.2)",
 r"\baber\b":"aber(A2.2)", r"\bwerde\b|\bwirst\b":"Futur", r"\bsich \w+":"reflexiv",
 r"\bum .{1,40} zu \w+en\b":"um...zu", r"\bzu \w+en\b":"zu-Infinitiv",
 r"\bwürde\b|\bkönnte\b|\bsollte\b|\bmüsste\b|\bhätte\b":"KonjII", r"\bdes \w+e?s\b":"Genitiv",
 r"\bam (besten|meisten|liebsten|häufigsten)\b":"Superlativ", r"\bwurde\b|\bwerden ge\w+":"Passiv",
 r"\bging\b|\bkam\b|\bsagte\b|\bmachte\b|\bfuhr\b":"Prät.Vollverb", r"\b\w+er als\b|\bbesser\b|\bgrößer\b|\bkleiner\b|\bschöner\b":"Komparativ",
 r"\bals \w+e[nmrs]? \b":"Nullartikel-Endung?"}
for p,s in gs:
    for rx,lab in BANNED.items():
        m=re.search(rx,s,re.I)
        if m: issues.append(f"BANNED[{lab}] {p}: ...{m.group(0)}... :: {s[:80]}")
for e in d["examples"]:
    if e["grammar_highlight"] not in e["sentence_de"]: issues.append(f"ex{e['order_index']} highlight")
    toks=re.findall(r"[A-Za-zÄÖÜäöüß\-]+", e["sentence_de"]); wb=set(e["word_breakdown"])
    if [t for t in toks if t not in wb]: issues.append(f"ex{e['order_index']} wb missing {[t for t in toks if t not in wb]}")
    if [k for k in wb if k not in toks]: issues.append(f"ex{e['order_index']} wb extra")
    if wc(e["sentence_de"])>14: issues.append(f"ex{e['order_index']} sentence too long")
mc=collections.Counter(); prompts=collections.Counter()
for x in d["exercises"]:
    tag=f"s{x['stage']}#{x['order_index']:02d}"; prompts[x["question_de"]]+=1
    if x["exercise_type"]=="multiple_choice":
        mc[x["options"].index(x["correct_answer"])]+=1
        if len(set(x["options"]))!=4: issues.append(tag+" dup options")
        if x["acceptable_answers"] is not None: issues.append(tag+" MC acceptable_answers not null")
    else:
        aa=x["acceptable_answers"]
        if not isinstance(aa,list) or x["correct_answer"] not in aa: issues.append(tag+" key not in acceptable_answers")
        if x["options"] is not None: issues.append(tag+" typed options not null")
        # policy check
        ca=x["correct_answer"]
        if " " in ca:  # whole sentence
            base=ca[:-1] if ca[-1] in ".!?" else ca
            want=[]
            for f in (base, base[0].lower()+base[1:]):
                for suf in (".","","!"):
                    if f+suf not in want: want.append(f+suf)
            missing=[w for w in want if w not in aa]
            if missing: issues.append(f"{tag} policy: missing {missing}")
            if len(aa)%6: issues.append(f"{tag} policy: {len(aa)} entries not a multiple of 6")
        else:
            if len(aa)!=1: issues.append(f"{tag} single-word policy: {len(aa)} entries")
    if "(" not in x["question_en"]: issues.append(tag+" no cue in question_en")
for q,c in prompts.items():
    if c>1: issues.append(f"duplicate question_de x{c}: {q}")
print("MC key positions:", dict(sorted(mc.items())), "| typed:", sum(1 for x in d['exercises'] if x['exercise_type']!='multiple_choice'), "MC:", sum(mc.values()))
print("stage4:", sum(1 for x in d['exercises'] if x['stage']==4), "stage5:", sum(1 for x in d['exercises'] if x['stage']==5))
print("stage5 types:", collections.Counter(x['exercise_type'] for x in d['exercises'] if x['stage']==5))
exs={e["sentence_de"] for e in d["examples"]}
for x in d["exercises"]:
    for s in exs:
        if s in x["question_de"]+" "+x["correct_answer"]: issues.append(f"s{x['stage']}#{x['order_index']} reuses example")
print("rules:", [r["rule_type"] for r in d["rules"]])
b=json.dumps(d,ensure_ascii=False)
print("anchors:", {t:b.count(t) for t in ["Schreiben Teil","Sprechen Teil","Goethe A2"]})
print(f"\n--- ISSUES ({len(issues)}) ---")
for i in issues: print(" *", i)
