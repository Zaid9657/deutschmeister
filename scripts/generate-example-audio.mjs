// Generate native-quality audio for grammar examples (0/673 have audio today).
//
// For every grammar_examples row without an audio_url: synthesize sentence_de
// with OpenAI TTS, upload the MP3 to Supabase Storage
// (audio/examples/<id>.mp3, public bucket), and set audio_url. The SPA's
// StageExamples plays audio_url when present and falls back to browser
// speechSynthesis otherwise, so this can run incrementally.
//
// Usage (needs network + secrets — run locally or in CI, not in a sandbox):
//   OPENAI_API_KEY=sk-... \
//   SUPABASE_URL=https://<project>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/generate-example-audio.mjs [--limit N] [--dry-run]
//
// Resumable: rows with audio_url set are skipped, so re-running continues
// where it stopped. ~673 sentences ≈ well under $5 at gpt-4o-mini-tts rates;
// the dry run prints the exact count before spending anything.
import { createClient } from '@supabase/supabase-js';

const openaiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const limit = Number((process.argv.find((a) => a.startsWith('--limit')) || '').split('=')[1] || process.argv[process.argv.indexOf('--limit') + 1] || 0) || Infinity;
const dryRun = process.argv.includes('--dry-run');

if (!openaiKey || !supabaseUrl || !serviceKey) {
  console.error('Required env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const VOICE = 'marin'; // warm, clear; consistent with the speaking feature's voice family
const MODEL = 'gpt-4o-mini-tts';

const { data: rows, error } = await supabase
  .from('grammar_examples')
  .select('id, sentence_de')
  .or('audio_url.is.null,audio_url.eq.')
  .order('id');
if (error) throw error;

console.log(`${rows.length} examples without audio${dryRun ? ' (dry run — stopping)' : ''}`);
if (dryRun) process.exit(0);

let done = 0;
let failed = 0;
for (const row of rows.slice(0, limit)) {
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        input: row.sentence_de,
        instructions: 'Speak clearly in standard German (Hochdeutsch), at a calm pace suitable for language learners.',
        response_format: 'mp3',
      }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const mp3 = Buffer.from(await res.arrayBuffer());

    const path = `examples/${row.id}.mp3`;
    const { error: upErr } = await supabase.storage.from('audio').upload(path, mp3, {
      contentType: 'audio/mpeg',
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from('audio').getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from('grammar_examples')
      .update({ audio_url: pub.publicUrl })
      .eq('id', row.id);
    if (dbErr) throw dbErr;

    done++;
    if (done % 25 === 0) console.log(`${done} done…`);
    await new Promise((r) => setTimeout(r, 250)); // stay well under rate limits
  } catch (err) {
    failed++;
    console.error(`FAILED ${row.id}: ${err.message}`);
    if (failed > 10) {
      console.error('Too many failures — stopping. Re-run to resume.');
      break;
    }
  }
}
console.log(`Finished: ${done} generated, ${failed} failed. Re-run any time to resume.`);
