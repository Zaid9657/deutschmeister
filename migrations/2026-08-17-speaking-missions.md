# Speaking missions for A1.2 – B2.2 (applied 2026-08-17)

Applied to project `omqyueddktqeyrrqvnyq` as Supabase migration
`seed_speaking_missions_a12_b22_2026_08_17`. Data-only; no schema change.

## Why

`speaking_missions` held 8 published rows, **all at level `A1.1`**.
`src/pages/SpeakingPage.jsx` filters `.eq('level', selectedLevel).eq('is_published', true)`,
so every learner at A1.2 and above opened the AI Speaking tab to an empty list
with no explanation — 7 of the 8 levels had nothing (audit finding B-12).

## What was inserted

8 missions for each of A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2 — 56 rows,
bringing the table to 64 (8 per level).

Conventions matched to the existing A1.1 rows:

- ordering column is **`mission_order`** (1–8 per level), not `order_index`;
  `UNIQUE (level, mission_order)` is enforced
- `level` is UPPERCASE (`'A1.2'`), matching the SPA query — there is no CHECK
  constraint enforcing this, so it is convention only
- German fields: `title_de`, `scenario_de`, `ai_opening_line`, `hint_words`
- English fields: `title_en`, `scenario_en`, `ai_role`, `pass_criteria`,
  `system_prompt_extra`, `target_structures`
- each mission links via `grammar_topic_id` to the topic with the same position
  in its level (`grammar_topics` uses `sub_level`/`topic_order`), and drills that
  topic's structures
- `is_free` on `mission_order = 1` per level, mirroring the A1.1 pattern

Difficulty is graded by level: concrete survival tasks at A1.2 (asking
directions, family, shopping), past-tense narration and appointments at A2.x,
opinions, complaints and hypotheticals at B1.x, and abstract argument,
counterfactuals and formal register at B2.x.

## Verify

```sql
SELECT level, count(*) AS missions,
       count(*) FILTER (WHERE is_published)          AS published,
       count(*) FILTER (WHERE grammar_topic_id IS NOT NULL) AS linked,
       count(DISTINCT mission_order)                 AS distinct_orders
FROM speaking_missions GROUP BY level ORDER BY level;
-- 8 rows, each: missions 8, published 8, linked 8, distinct_orders 8
```

Then open `/speaking` as a signed-in user and switch levels — every level should
list 8 missions.

## Re-seeding

The SQL was applied directly through the Supabase MCP rather than from a file in
this folder. To reproduce on a branch or fresh database, dump the current rows:

```sql
SELECT * FROM speaking_missions ORDER BY level, mission_order;
```

`UNIQUE (level, mission_order)` means a re-run of the original inserts conflicts
rather than duplicating — add `ON CONFLICT (level, mission_order) DO NOTHING` if
re-seeding.
