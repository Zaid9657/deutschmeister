// Generate native-quality German audio for grammar examples and vocabulary
// with Azure AI Speech (Neural TTS), upload each MP3 to Supabase Storage
// (public `audio` bucket) and set the row's audio_url.
//
//   grammar_examples.sentence_de → audio/examples/<id>.mp3
//   words.german (+ article)     → audio/words/<id>.mp3
//
// The SPA plays audio_url when present (StageExamples, WordCard) and falls
// back to browser speechSynthesis otherwise, so this can run incrementally.
//
// Why Azure (decision 2026-09-05): the whole backlog is ~60k characters,
// inside Azure's 500k/month free tier, and de-DE-KatjaNeural is the clearest
// standard-German voice for learners. The live speaking teacher still uses
// OpenAI TTS (netlify/functions/_shared/speakingAI.mjs) — two voice
// families, accepted: teacher = conversation, Katja = reference audio.
//
// Usage (needs network + secrets — run locally, not in a sandbox):
//   AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=westeurope \
//   SUPABASE_URL=https://<project>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/generate-example-audio.mjs [--table examples|words|all] [--limit N] [--dry-run]
//
// Defaults: --table all. Resumable: rows with audio_url set are skipped, so
// re-running continues where it stopped. The dry run prints the exact row and
// character counts before spending anything.
import { createClient } from '@supabase/supabase-js';

const azureKey = process.env.AZURE_SPEECH_KEY;
const azureRegion = process.env.AZURE_SPEECH_REGION;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const argValue = (name, fallback) => {
  const inline = process.argv.find((a) => a.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const table = argValue('--table', 'all');
const limit = Number(argValue('--limit', 0)) || Infinity;
const dryRun = process.argv.includes('--dry-run');

if (!['examples', 'words', 'all'].includes(table)) {
  console.error('--table must be examples, words or all');
  process.exit(1);
}
if (!azureKey || !azureRegion || !supabaseUrl || !serviceKey) {
  console.error('Required env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const VOICE = 'de-DE-KatjaNeural'; // clear Hochdeutsch, neutral register
const RATE = '-10%'; // a touch slower than default for A1/A2 ears
const OUTPUT_FORMAT = 'audio-24khz-96kbitrate-mono-mp3';
const TTS_URL = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

const supabase = createClient(supabaseUrl, serviceKey);

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const ssml = (text) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-DE">` +
  `<voice name="${VOICE}"><prosody rate="${RATE}">${escapeXml(text)}</prosody></voice></speak>`;

async function synthesize(text) {
  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': azureKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
      'User-Agent': 'deutsch-meister-audio',
    },
    body: ssml(text),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

// What to say for a words row: nouns get their article so the learner hears
// the gender ("der Hund"), everything else is the bare headword.
const wordText = (row) => {
  const article = (row.article || '').trim();
  const german = (row.german || '').trim();
  if (!article || german.toLowerCase().startsWith(`${article.toLowerCase()} `)) return german;
  return `${article} ${german}`;
};

const JOBS = {
  examples: {
    table: 'grammar_examples',
    select: 'id, sentence_de',
    folder: 'examples',
    text: (row) => (row.sentence_de || '').trim(),
  },
  words: {
    table: 'words',
    select: 'id, german, article',
    folder: 'words',
    text: wordText,
  },
};

async function fetchMissing(job) {
  const { data, error } = await supabase
    .from(job.table)
    .select(job.select)
    .or('audio_url.is.null,audio_url.eq.')
    .order('id');
  if (error) throw error;
  return data.filter((row) => job.text(row));
}

async function run(jobName) {
  const job = JOBS[jobName];
  const rows = await fetchMissing(job);
  const chars = rows.reduce((n, r) => n + job.text(r).length, 0);
  console.log(`${job.table}: ${rows.length} rows without audio, ${chars} characters${dryRun ? ' (dry run — skipping)' : ''}`);
  if (dryRun) return { done: 0, failed: 0 };

  let done = 0;
  let failed = 0;
  for (const row of rows.slice(0, limit)) {
    try {
      const mp3 = await synthesize(job.text(row));
      const path = `${job.folder}/${row.id}.mp3`;
      const { error: upErr } = await supabase.storage.from('audio').upload(path, mp3, {
        contentType: 'audio/mpeg',
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('audio').getPublicUrl(path);
      const { error: dbErr } = await supabase.from(job.table).update({ audio_url: pub.publicUrl }).eq('id', row.id);
      if (dbErr) throw dbErr;

      done++;
      if (done % 25 === 0) console.log(`${job.table}: ${done} done…`);
      await new Promise((r) => setTimeout(r, 150)); // free tier allows 20 req/s; stay far below
    } catch (err) {
      failed++;
      console.error(`FAILED ${job.table} ${row.id}: ${err.message}`);
      if (failed > 10) {
        console.error('Too many failures — stopping this table. Re-run to resume.');
        break;
      }
    }
  }
  console.log(`${job.table}: ${done} generated, ${failed} failed.`);
  return { done, failed };
}

const jobs = table === 'all' ? ['examples', 'words'] : [table];
let totalDone = 0;
let totalFailed = 0;
for (const name of jobs) {
  const r = await run(name);
  totalDone += r.done;
  totalFailed += r.failed;
}
console.log(`Finished: ${totalDone} generated, ${totalFailed} failed. Re-run any time to resume.`);
process.exit(totalFailed > 0 ? 1 : 0);
