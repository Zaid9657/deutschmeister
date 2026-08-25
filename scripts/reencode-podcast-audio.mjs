#!/usr/bin/env node
/**
 * Re-encode the "podcast" media from video to audio, and record real durations.
 *
 * WHY
 * ---
 * The podcast library is stored as video/mp4 — 117 MB at A1.1 rising to 420 MB
 * for a single B1.1 episode, 2.8 GB across the 14 that exist. Every play pulls
 * the whole video down: brutal on mobile data and billed as Supabase Storage
 * egress, all to deliver what the product calls a podcast (audio).
 *
 * `duration_seconds` is also placeholder data — 18 of 24 rows were exactly 180
 * — so the card said "3:00" while the player reported 5:03. Since this script
 * has to decode each file anyway, it writes the true duration it measures.
 *
 * At 64 kbps mono a three-minute episode lands around 1.5 MB, roughly a 99%
 * reduction. Speech at 64 kbps mono is transparent enough for language
 * learning; raise BITRATE if you disagree after listening.
 *
 * WHY THIS IS NOT RUN AUTOMATICALLY
 * ---------------------------------
 * It rewrites production Storage objects and DB rows, needs ffmpeg/ffprobe, and
 * needs network access to Supabase Storage. Run it deliberately, from a machine
 * that has all three. It is idempotent: rows already pointing at an .mp3 are
 * skipped, so a partial run can simply be re-run.
 *
 * USAGE
 * -----
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/reencode-podcast-audio.mjs [--dry-run] [--limit N]
 *
 * The originals are NOT deleted — the new object sits alongside under a .mp3
 * key and audio_url is repointed. Delete the .mp4 files by hand once you have
 * listened to the results and are happy.
 */

import { createClient } from '@supabase/supabase-js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const BITRATE = process.env.PODCAST_BITRATE || '64k';
const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}
const supabase = createClient(url, key);

const BUCKET = 'podcasts';

/** Storage object key from a public URL, e.g. .../public/podcasts/A1.1/1.mp4 -> A1.1/1.mp4 */
function keyFromUrl(publicUrl) {
  const marker = `/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

async function ffprobeSeconds(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  return Math.round(parseFloat(stdout.trim()));
}

async function main() {
  const { data: rows, error } = await supabase
    .from('podcasts')
    .select('id, sub_level, podcast_order, title_en, audio_url, duration_seconds')
    .order('sub_level')
    .order('podcast_order');

  // supabase-js resolves rather than throws on a REST error.
  if (error) {
    console.error('Failed to read podcasts:', error.message);
    process.exit(1);
  }

  let done = 0;
  let savedBytes = 0;

  for (const row of rows) {
    if (done >= LIMIT) break;
    if (!row.audio_url) { console.log(`skip  ${row.sub_level}/${row.podcast_order} — no audio_url`); continue; }
    if (row.audio_url.endsWith('.mp3')) { console.log(`skip  ${row.sub_level}/${row.podcast_order} — already mp3`); continue; }

    const srcKey = keyFromUrl(row.audio_url);
    if (!srcKey) { console.log(`skip  ${row.sub_level}/${row.podcast_order} — unrecognised URL`); continue; }

    const dstKey = srcKey.replace(/\.[^.]+$/, '.mp3');
    const dir = await mkdtemp(join(tmpdir(), 'dm-podcast-'));
    const srcFile = join(dir, 'in' + (srcKey.match(/\.[^.]+$/)?.[0] || '.mp4'));
    const dstFile = join(dir, 'out.mp3');

    try {
      const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(srcKey);
      if (dlErr) { console.log(`MISS  ${row.sub_level}/${row.podcast_order} — ${dlErr.message}`); continue; }

      const { writeFile } = await import('node:fs/promises');
      await writeFile(srcFile, Buffer.from(await blob.arrayBuffer()));
      const before = (await stat(srcFile)).size;

      await execFileAsync('ffmpeg', [
        '-y', '-i', srcFile,
        '-vn',                    // drop the video stream — this is the whole point
        '-ac', '1',               // mono: speech, not music
        '-b:a', BITRATE,
        '-map_metadata', '-1',
        dstFile,
      ]);

      const after = (await stat(dstFile)).size;
      const seconds = await ffprobeSeconds(dstFile);
      const pct = Math.round((1 - after / before) * 100);
      console.log(
        `${DRY_RUN ? 'DRY   ' : 'ok    '}${row.sub_level}/${row.podcast_order} ` +
        `${(before / 1048576).toFixed(0)}MB → ${(after / 1048576).toFixed(1)}MB (−${pct}%), ` +
        `${seconds}s (was ${row.duration_seconds}s) — ${row.title_en}`
      );

      if (!DRY_RUN) {
        const body = await readFile(dstFile);
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(dstKey, body, { contentType: 'audio/mpeg', upsert: true });
        if (upErr) { console.error(`  upload failed: ${upErr.message}`); continue; }

        const newUrl = row.audio_url.replace(/\.[^.]+$/, '.mp3');
        const { error: updErr } = await supabase
          .from('podcasts')
          .update({ audio_url: newUrl, duration_seconds: seconds })
          .eq('id', row.id);
        if (updErr) { console.error(`  db update failed: ${updErr.message}`); continue; }
      }

      savedBytes += before - after;
      done += 1;
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  console.log(
    `\n${DRY_RUN ? '[dry run] ' : ''}${done} episode(s) processed, ` +
    `${(savedBytes / 1073741824).toFixed(2)} GB saved.`
  );
  if (!DRY_RUN && done) console.log('Originals left in place — delete the .mp4 objects once you have checked the audio.');
}

main().catch((e) => { console.error(e); process.exit(1); });
