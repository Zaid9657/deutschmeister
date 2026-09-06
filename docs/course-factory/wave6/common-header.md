# Common rules for every Wave 6 author (A2.2 legacy re-cut + the Goethe-A2 30-day exam plan)

S = /tmp/claude-0/-home-user-deutschmeister/1b1f97c3-6e1a-5925-9c65-14dbfce0a673/scratchpad/wave6
Repo = /home/user/deutschmeister — READ-ONLY for you. Never edit, commit, or run git write commands
there. Write ONLY under the S/<area>/ folder your brief names. Never touch Supabase.
The sandbox cannot reach supabase.co, goethe.de, deutsch-meister.de; do not try.

1. `S/level-a2.2.md` is BINDING (a copy of docs/course-factory/wave5/level-a2.2.md). Every German
   string you write must be inside it — including German ABOUT German: rule explanations, tables,
   summaries and memory tricks are learner-facing. Banned items are blocking defects. Sentences ≤16
   words in learner-facing German.
2. Edit in place: you may change a string, never delete or add a row. Counts, ids and order_index
   stay exactly as they are (tests pin them).
3. Correct standard German: umlauts/ß, capitalisation of nouns, commas before Nebensätze, natural
   everyday register. No English inside German fields; keep English fields in English.
4. Self-check line by line against the level file, then run the verifier your brief names, then
   write `<area>/notes.md` (what changed and why, deliberate non-changes, doubts for the reviewer).
5. Report ≤15 lines: file paths, counts, verifier output, open doubts. An adversarial Opus reviewer
   reads your output next; expect a second round.
