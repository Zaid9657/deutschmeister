#!/usr/bin/env node
// Recorded course audio (plan P1, docs/course-standard-2026-09-12.md §3).
//
// Renders every spoken line of a course curriculum with Azure AI Speech
// (Neural TTS), uploads the MP3s to Supabase Storage (public `audio` bucket)
// and writes a COMMITTED manifest the SPA reads at build time:
//
//   dialog.lines[i].de   → audio/course/<level>/<lektionId>/line-<i>.mp3
//   pretest.model        → audio/course/<level>/<lektionId>/pretest.mp3
//   phonetik.items[i]    → audio/course/<level>/<lektionId>/phonetik-<i>.mp3
//   wortfeld (wordId null) → audio/course/<level>/words/<slug>.mp3
//                            + public.words.audio_url on the seeded row
//
//   manifest: src/data/curricula/<level>.audio.js
//             { level, generatedAt, voices, lektionen: { [id]: { [key]: {url, sha1, voice} } } }
//
// The checkpoint Hören items dictate the SAME dialogue lines the Lektion does
// (src/lib/checkpoint/buildCheckpoint.js → dialogLines()), so the `line-<i>`
// keys already cover them — there is deliberately no separate `cp<n>-…` render.
//
// TWO VOICES, chosen by the speaker name (SPEAKER_VOICES): the learners and the
// women speak de-DE-KatjaNeural, the men de-DE-ConradNeural, so a dialogue is
// audibly a dialogue and not one voice talking to itself. Rate -10 % like
// scripts/generate-example-audio.mjs — a touch slower than default for A1 ears.
// The live speaking teacher keeps OpenAI TTS; that split is accepted
// (see the header of generate-example-audio.mjs).
//
// IDEMPOTENT. Every manifest entry carries the sha1 of the text that was
// rendered: a re-run skips a line whose sha1 is unchanged and re-renders only
// what the curriculum changed. Seeded words are skipped once their row has an
// audio_url. So this can be interrupted and re-run at any time.
//
// Usage (needs network + secrets — the owner runs it locally, see
// docs/owner-prompts.md, "Run the A1.1 course audio"):
//
//   node scripts/generate-course-audio.mjs a1.1 --dry     # plan + counts + cost, no calls
//   AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=westeurope \
//   SUPABASE_URL=https://<project>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/generate-course-audio.mjs a1.1
//
// Afterwards commit src/data/curricula/a11.audio.js and run
// `node scripts/sync-curricula.mjs` so the Astro twin matches (check:duplicates).
//
// This module is importable WITHOUT any env var: everything that reads
// process.env lives inside main(), so tests/course-audio.test.mjs can import
// planRenders() and the pure helpers.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── constants ───────────────────────────────────────────────────────────────

export const VOICE_FEMALE = 'de-DE-KatjaNeural';
export const VOICE_MALE = 'de-DE-ConradNeural';
/** Narration voice for anything that is not a dialogue turn (pretest, Phonetik). */
export const VOICE_DEFAULT = VOICE_FEMALE;
export const RATE = '-10%';
export const OUTPUT_FORMAT = 'audio-24khz-96kbitrate-mono-mp3';
export const BUCKET = 'audio';
/** Azure Neural TTS list price, US$ per 1M characters (2026-09) — cost estimate only. */
export const USD_PER_MILLION_CHARS = 16;

/**
 * Every speaker name used in src/data/curricula/a11.js, mapped to a voice.
 * Ana, Lena and the two Frauen are female; Tim, Paul and the two Herren male.
 * An unknown name falls back to VOICE_DEFAULT rather than failing the run —
 * a wrong-gendered line is a content bug, a crashed run is a blocked owner.
 */
export const SPEAKER_VOICES = {
  'Ana': VOICE_FEMALE,
  'Lena': VOICE_FEMALE,
  'Frau Kaya': VOICE_FEMALE,
  'Frau Wolf': VOICE_FEMALE,
  'Tim': VOICE_MALE,
  'Paul': VOICE_MALE,
  'Herr Weber': VOICE_MALE,
  'Herr Schmidt': VOICE_MALE,
};

// ── pure helpers (unit-tested) ──────────────────────────────────────────────

export const sha1 = (text) => createHash('sha1').update(String(text), 'utf8').digest('hex');

export function voiceForSpeaker(speaker) {
  const name = String(speaker || '').trim();
  return SPEAKER_VOICES[name] || VOICE_DEFAULT;
}

/**
 * The Phonetik items are written for the EYE — syllable hyphens and a
 * capitalised stressed syllable ("HAL-lo", "Te-le-FON"), plus the melody arrows
 * of the question items ("Hast du ZEIT?↗"). Spoken back literally, a TTS engine
 * says "H-A-L dash lo". So the display text stays exactly as authored and only
 * the SPEECH text is normalised: arrows dropped, syllable hyphens closed up,
 * the shouted syllable returned to ordinary case.
 *
 * German TTS is effectively case-insensitive for pronunciation, so the
 * capitalisation this produces ("Der Bruder", "Ich bin") is cosmetic — what
 * matters is that no hyphen and no arrow survives into the SSML.
 */
export function phonetikSpeechText(display) {
  const cleaned = String(display || '')
    .replace(/[↗↘➚➘]/g, ' ')
    .replace(/(\p{L})-(\p{L})/gu, '$1$2') // HAL-lo → HALlo, Te-le-FON → TeleFON
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').map((w) => {
    if (!w) return w;
    if (w === w.toUpperCase() && w !== w.toLowerCase()) return w.toLowerCase(); // BIN → bin
    return w[0] + w.slice(1).toLowerCase(); // HALlo → Hallo, TeleFON → Telefon
  });
  const out = words.join(' ');
  return out ? out[0].toUpperCase() + out.slice(1) : out;
}

/**
 * What to say for a Wortfeld entry. `de` already carries the article
 * ("der Buchstabe"), which is exactly what a learner must hear. The only
 * rewrite is the two collective entries whose dash would be read as a dash:
 * "die Zahlen 0–10" → "die Zahlen 0 bis 10".
 */
export const wordSpeechText = (entry) =>
  String((entry && entry.de) || (entry && entry.word) || '')
    .replace(/(\d)\s*[–—-]\s*(\d)/g, '$1 bis $2')
    .trim();

/** Storage-safe slug for a word file name: ä→ae, ß→ss, everything else → '-'. */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * planRenders(curriculum) → [{ kind, lektionId, lektionNr, key, text, display,
 *                              voice, path, german }]
 *
 * The complete, deterministic list of everything this level needs rendered —
 * the single source both the run and tests/course-audio.test.mjs read, so the
 * test cannot drift from what the owner's run will actually do.
 *
 * kinds: 'line' (dialogue turn, covers the checkpoint dictation too),
 * 'pretest' (the model answer), 'phonetik' (one drill item), 'word' (a Wortfeld
 * entry the `words` table does not carry yet — wordId null).
 */
export function planRenders(curriculum) {
  const level = String((curriculum && curriculum.level) || '').toLowerCase();
  const out = [];
  const seenWords = new Set();

  for (const lektion of (curriculum && curriculum.lektionen) || []) {
    const lektionId = lektion.id;
    const base = `course/${level}/${lektionId}`;

    (lektion.dialog?.lines || []).forEach((line, i) => {
      if (!line?.de) return;
      out.push({
        kind: 'line',
        lektionId,
        lektionNr: lektion.nr,
        key: `line-${i}`,
        text: line.de,
        display: line.de,
        voice: voiceForSpeaker(line.speaker),
        path: `${base}/line-${i}.mp3`,
      });
    });

    if (lektion.pretest?.model) {
      out.push({
        kind: 'pretest',
        lektionId,
        lektionNr: lektion.nr,
        key: 'pretest',
        text: lektion.pretest.model,
        display: lektion.pretest.model,
        voice: VOICE_DEFAULT,
        path: `${base}/pretest.mp3`,
      });
    }

    (lektion.phonetik?.items || []).forEach((item, i) => {
      const text = phonetikSpeechText(item);
      if (!text) return;
      out.push({
        kind: 'phonetik',
        lektionId,
        lektionNr: lektion.nr,
        key: `phonetik-${i}`,
        text,
        display: item,
        voice: VOICE_DEFAULT,
        path: `${base}/phonetik-${i}.mp3`,
      });
    });

    for (const entry of lektion.wortfeld || []) {
      if (entry.wordId) continue; // the row exists and generate-example-audio.mjs owns its audio
      const german = (entry.word || entry.de || '').trim();
      const slug = slugify(german);
      if (!slug || seenWords.has(slug)) continue;
      seenWords.add(slug);
      out.push({
        kind: 'word',
        lektionId: null,
        lektionNr: lektion.nr,
        key: `word-${slug}`,
        text: wordSpeechText(entry),
        display: entry.de || german,
        german,
        voice: VOICE_DEFAULT,
        path: `course/${level}/words/${slug}.mp3`,
      });
    }
  }

  return out;
}

/** US cents the whole plan would cost at Azure's neural list price. */
export const estimateCents = (entries) =>
  Math.round(entries.reduce((n, e) => n + e.text.length, 0) * (USD_PER_MILLION_CHARS / 1e6) * 100 * 100) / 100;

/** Serialise the manifest module exactly as it is committed. */
export function renderManifest({ level, generatedAt, voices, lektionen }) {
  const ids = Object.keys(lektionen).sort();
  const body = ids.map((id) => {
    const keys = Object.keys(lektionen[id]).sort();
    const inner = keys
      .map((k) => `      ${JSON.stringify(k)}: ${JSON.stringify(lektionen[id][k])},`)
      .join('\n');
    return `    ${JSON.stringify(id)}: {\n${inner}\n    },`;
  }).join('\n');

  return `// GENERATED by scripts/generate-course-audio.mjs — do not hand-edit.
// Recorded course audio for ${level.toUpperCase()}: public URLs in Supabase Storage (bucket
// \`audio\`, course/${level}/<lektion>/<key>.mp3) keyed by lektion id and key
// (\`line-<i>\`, \`pretest\`, \`phonetik-<i>\`, checkpoint \`cp<n>-<key>\`), with the
// sha1 of the text that was rendered so a re-run only re-renders changed lines.
export default {
  level: ${JSON.stringify(level)},
  generatedAt: ${generatedAt ? JSON.stringify(generatedAt) : 'null'},
  voices: ${JSON.stringify(voices)},
  lektionen: {${body ? `\n${body}\n  ` : ''}},
};
`;
}

/** Where the manifest for a level lives: a1.1 → src/data/curricula/a11.audio.js */
export const manifestPathFor = (level) =>
  join(ROOT, 'src/data/curricula', `${String(level).replace(/\./g, '')}.audio.js`);

/** Which curriculum module a level maps to (same flattening as the manifest). */
export const curriculumModuleFor = (level) =>
  join(ROOT, 'src/data/curricula', `${String(level).replace(/\./g, '')}.js`);

// ── the run ─────────────────────────────────────────────────────────────────

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const ssml = (text, voice) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-DE">` +
  `<voice name="${voice}"><prosody rate="${RATE}">${escapeXml(text)}</prosody></voice></speak>`;

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry') || args.includes('--dry-run');
  const level = (args.find((a) => !a.startsWith('--')) || 'a1.1').toLowerCase();

  const { CURRICULA, curriculumFor } = await import(pathToFileURL(join(ROOT, 'src/data/curricula/index.js')).href);
  const curriculum = curriculumFor(level);
  if (!curriculum) {
    console.error(`Unknown level "${level}". Known: ${Object.keys(CURRICULA || {}).join(', ')}`);
    process.exit(1);
  }

  const entries = planRenders(curriculum);
  const lines = entries.filter((e) => e.kind === 'line').length;
  const pretests = entries.filter((e) => e.kind === 'pretest').length;
  const phonetik = entries.filter((e) => e.kind === 'phonetik').length;
  const words = entries.filter((e) => e.kind === 'word').length;
  const chars = entries.reduce((n, e) => n + e.text.length, 0);
  const cents = estimateCents(entries);

  console.log(`${level}: ${entries.length} clips — ${lines} dialogue lines, ${pretests} pretest models, ${phonetik} Phonetik items, ${words} Wortfeld words`);
  console.log(`${level}: ${chars} characters ≈ ${cents} US cents at $${USD_PER_MILLION_CHARS}/1M`);

  // The previous manifest is the skip ledger: same sha1 → the MP3 is already up.
  const manifestPath = manifestPathFor(level);
  let previous = { lektionen: {} };
  try {
    previous = (await import(`${pathToFileURL(manifestPath).href}?t=${Date.now()}`)).default || previous;
  } catch {
    /* first run — no manifest yet */
  }

  if (dry) {
    for (const e of entries.slice(0, 8)) {
      console.log(`  ${e.path}  [${e.voice.replace('de-DE-', '').replace('Neural', '')}]  ${JSON.stringify(e.text).slice(0, 70)}`);
    }
    if (entries.length > 8) console.log(`  … ${entries.length - 8} more`);
    const already = entries.filter((e) => e.lektionId && previous.lektionen?.[e.lektionId]?.[e.key]?.sha1 === sha1(e.text)).length;
    console.log(`Dry run: nothing called, nothing written. ${already} clip(s) already in the manifest with an unchanged text.`);
    console.log(`Summary (dry): rendered 0 / skipped ${already} / failed 0 / ≈ ${cents} cents if all ${entries.length} are rendered.`);
    return;
  }

  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!azureKey || !azureRegion || !supabaseUrl || !serviceKey) {
    console.error('Required env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    console.error('(--dry needs none of them.)');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey);
  const TTS_URL = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const synthesize = async (text, voice) => {
    const res = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
        'User-Agent': 'deutsch-meister-course-audio',
      },
      body: ssml(text, voice),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return Buffer.from(await res.arrayBuffer());
  };

  const lektionen = JSON.parse(JSON.stringify(previous.lektionen || {}));
  const voices = {};
  let rendered = 0;
  let skipped = 0;
  let failed = 0;
  let renderedChars = 0;

  for (const entry of entries) {
    const hash = sha1(entry.text);
    voices[entry.voice] = (voices[entry.voice] || 0) + 1;

    if (entry.lektionId) {
      const known = lektionen[entry.lektionId]?.[entry.key];
      if (known && known.sha1 === hash && known.url) { skipped += 1; continue; }
    }

    try {
      if (entry.kind === 'word') {
        // Words carry their audio on the row, not in the manifest: skip when the
        // seeded row (migrations/2026-09-13-a1-1-course-words.sql) already has one.
        const { data: row, error: selErr } = await supabase
          .from('words')
          .select('id, audio_url')
          .eq('german', entry.german)
          .eq('level', level)
          .limit(1)
          .maybeSingle();
        if (selErr) throw selErr;
        if (!row) throw new Error(`no words row for "${entry.german}" at ${level} — apply migrations/2026-09-13-a1-1-course-words.sql first`);
        if (row.audio_url) { skipped += 1; continue; }

        const mp3 = await synthesize(entry.text, entry.voice);
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(entry.path, mp3, { contentType: 'audio/mpeg', upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(entry.path);
        const { error: dbErr } = await supabase.from('words').update({ audio_url: pub.publicUrl }).eq('id', row.id);
        if (dbErr) throw dbErr;
      } else {
        const mp3 = await synthesize(entry.text, entry.voice);
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(entry.path, mp3, { contentType: 'audio/mpeg', upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(entry.path);
        lektionen[entry.lektionId] = lektionen[entry.lektionId] || {};
        lektionen[entry.lektionId][entry.key] = { url: pub.publicUrl, sha1: hash, voice: entry.voice };
      }
      rendered += 1;
      renderedChars += entry.text.length;
      if (rendered % 25 === 0) console.log(`  ${rendered} rendered …`);
      await new Promise((r) => setTimeout(r, 150)); // stay far below the 20 req/s free-tier ceiling
    } catch (err) {
      failed += 1;
      console.error(`FAILED ${entry.path}: ${err.message}`);
      if (failed > 10) { console.error('Too many failures — stopping. Re-run to resume.'); break; }
    }
  }

  writeFileSync(
    manifestPath,
    renderManifest({ level, generatedAt: new Date().toISOString(), voices, lektionen }),
    'utf8',
  );
  console.log(`Wrote ${manifestPath.replace(`${ROOT}/`, '')}`);

  const spentCents = Math.round(renderedChars * (USD_PER_MILLION_CHARS / 1e6) * 100 * 100) / 100;
  console.log(`Summary: rendered ${rendered} / skipped ${skipped} / failed ${failed} / ≈ ${spentCents} cents (${renderedChars} characters this run).`);
  process.exit(failed > 0 ? 1 : 0);
}

/** Read the committed manifest module as text — used by the test suite. */
export const readManifestSource = (level) => readFileSync(manifestPathFor(level), 'utf8');

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
