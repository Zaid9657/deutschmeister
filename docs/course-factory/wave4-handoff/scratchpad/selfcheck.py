# -*- coding: utf-8 -*-
"""Self-check modal-verbs-past.json against the A2.1 level constraint."""
import json, re, sys, os

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'grammar', 'modal-verbs-past.json')
d = json.load(open(P, encoding='utf-8'))
issues = []

DE_SUFFIX = ('_de',)
GERMANY_KEYS = {'sentence_de', 'question_de', 'title_de', 'content_de', 'description_de',
                'explanation_de', 'why_correct_de', 'hook_de', 'text_de', 'context_de',
                'detail_de', 'memory_trick_de', 'formal_note_de', 'key_insight_de',
                'preview_example_de', 'correct', 'wrong'}

def walk(node, path=''):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from walk(v, f'{path}.{k}')
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk(v, f'{path}[{i}]')
    else:
        yield path, node

# --- 1. German sentence length -------------------------------------------
def sentences(text):
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

def words(s):
    s = re.sub(r'\([^)]*\)', ' ', s)          # cue brackets are metadata
    s = re.sub(r'\[[^\]]*\]', ' ', s)
    return [w for w in re.split(r'\s+', s.strip()) if w]

for path, val in walk(d):
    if not isinstance(val, str):
        continue
    key = path.split('.')[-1].split('[')[0]
    if key.endswith('_de') or key in ('correct', 'wrong') or key in ('points',) or 'points' in path:
        for s in sentences(val):
            n = len(words(s))
            if n > 12:
                issues.append(f'LONG({n}) {path}: {s}')

# summary points array
for r in d['rules']:
    if r['rule_type'] == 'summary':
        for p in r['content']['points']:
            for s in sentences(p):
                if len(words(s)) > 12:
                    issues.append(f'LONG summary point: {s}')

# --- 2. banned constructions in German strings ---------------------------
BANNED = [
    (r'\bweil\b|\bdass\b|\bwenn\b|\bobwohl\b|\bals ich\b|\bals er\b|\bals Kind\b', 'Nebensatz/als'),
    (r'\bwerde\b|\bwirst\b|\bwerden wir\b', 'Futur'),
    (r'\bdes \w+s\b|\bstatt des\b|\bwegen des\b', 'Genitiv'),
    (r'\bwürde\b|\bhätte\b|\bkönnte\b|\bmüsste\b|\bsollte ich mal\b', 'Konjunktiv II'),
    (r'\bsich \w+', 'Reflexiv'),
    (r'\bmich\b|\bmir\b(?= freue)', 'reflexive marker'),
    (r'\bging\b|\bkam\b|\bsagte\b|\bmachte\b|\bwar es so\b', 'Präteritum Vollverb'),
    (r'\bum .* zu \w+en\b', 'um...zu'),
    (r'\bgrößer als\b|\bam besten\b|\bam häufigsten\b|\bhäufigsten\b', 'Komparativ/Superlativ'),
]
for path, val in walk(d):
    if not isinstance(val, str):
        continue
    key = path.split('.')[-1].split('[')[0]
    german = key.endswith('_de') or key in ('correct', 'wrong') or 'points' in path
    if not german:
        continue
    for pat, label in BANNED:
        for m in re.finditer(pat, val):
            issues.append(f'BANNED[{label}] {path}: …{val[max(0,m.start()-30):m.end()+30]}…')

# --- 3. examples ----------------------------------------------------------
for e in d['examples']:
    if e['grammar_highlight'] not in e['sentence_de']:
        issues.append(f"highlight not substring: {e['order_index']}")
    toks = [re.sub(r'^[^\wÄÖÜäöüß]+|[^\wÄÖÜäöüß]+$', '', t) for t in e['sentence_de'].split()]
    toks = [t for t in toks if t]
    missing = [t for t in toks if t not in e['word_breakdown']]
    if missing:
        issues.append(f"breakdown missing {missing} in example {e['order_index']}")
    extra = [k for k in e['word_breakdown'] if k not in toks]
    if extra:
        issues.append(f"breakdown extra {extra} in example {e['order_index']}")
    if len(words(e['sentence_de'])) > 14:
        issues.append(f"example {e['order_index']} too long")

# --- 4. exercises ---------------------------------------------------------
mc_pos = []
for x in d['exercises']:
    tag = f"s{x['stage']}#{x['order_index']:02d}"
    if x['exercise_type'] == 'multiple_choice':
        mc_pos.append((tag, x['options'].index(x['correct_answer'])))
        if len(set(x['options'])) != 4:
            issues.append(f'{tag}: duplicate options')
    else:
        if not isinstance(x['acceptable_answers'], list):
            issues.append(f'{tag}: acceptable_answers not a list')
        elif x['correct_answer'] not in x['acceptable_answers']:
            issues.append(f'{tag}: correct_answer not in acceptable_answers')
        if len(set(x['acceptable_answers'])) != len(x['acceptable_answers']):
            issues.append(f'{tag}: duplicate acceptable_answers')
    for f in ('question_de', 'question_en', 'explanation_en', 'explanation_de',
              'why_correct_en', 'why_correct_de'):
        if not x.get(f):
            issues.append(f'{tag}: empty {f}')

print('MC key positions:', mc_pos)
print('typed:', sum(1 for x in d['exercises'] if x['exercise_type'] != 'multiple_choice'),
      'mc:', sum(1 for x in d['exercises'] if x['exercise_type'] == 'multiple_choice'))

# --- 5. duplicate sentences between examples and exercises ---------------
ex_sents = {e['sentence_de'] for e in d['examples']}
for x in d['exercises']:
    for cand in (x.get('correct_answer'),):
        if cand in ex_sents:
            issues.append(f"s{x['stage']}#{x['order_index']}: answer duplicates an example sentence: {cand}")

# --- 6. title lengths -----------------------------------------------------
t = d['topic']
core = f"German {t['title_en']} — A2.1 Grammar"
full = core + (' | DeutschMeister' if len(core) <= 43 else '')
print('title_en len', len(t['title_en']), '| page title len', len(full), '|', full)
if len(t['title_en']) > 45 or len(full) > 70:
    issues.append('title too long')

# --- 7. English words leaking into German fields -------------------------
EN = re.compile(r'\b(the|you|and|with|verb|sentence|past|form|answer|word)\b')
for path, val in walk(d):
    if isinstance(val, str) and path.split('.')[-1].split('[')[0].endswith('_de'):
        m = EN.search(val)
        if m:
            issues.append(f'ENGLISH in {path}: {m.group(0)} — {val[:60]}')

# --- 8. rule/exercise counts ---------------------------------------------
print('rules', len(d['rules']), [r['order_index'] for r in d['rules']])
cm = [r for r in d['rules'] if r['common_mistakes']]
print('common_mistakes rules', [(r['order_index'], len(r['common_mistakes'])) for r in cm])

print()
if issues:
    print(f'{len(issues)} issue(s):')
    for i in issues:
        print(' -', i)
    sys.exit(1)
print('SELF-CHECK CLEAN')
