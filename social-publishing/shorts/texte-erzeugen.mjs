#!/usr/bin/env node
// Schreibt aus daten.mjs:
//   texte/<slug>/clip-N.md   — ein Textblatt pro Clip, für alle drei Plattformen
//   schnittplan.csv          — eine Zeile pro Clip, für den Überblick
//
// Aufruf:  node texte-erzeugen.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIDEOS, link, clipName } from './daten.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const STORAGE = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library';

const tagZeile = (tags) => tags.map((t) => `#${t}`).join(' ');

function blatt(video, clip, i) {
  const name = clipName(video, i);
  const yt = link(video, i, 'yt');
  const ig = link(video, i, 'ig');
  const fb = link(video, i, 'fb');

  return `# ${name}

**Quellvideo:** ${video.titel}
**Schnitt:** ab ${clip.anker} % der Gesamtlänge, 50 Sekunden
**Datei nach dem Schnitt:** \`clips/${name}.mp4\`

---

## YouTube Shorts

**Titel** (unter 100 Zeichen, so übernehmen):

\`\`\`
${clip.titel} #Shorts
\`\`\`

**Beschreibung:**

\`\`\`
${clip.hook}

${clip.de}

Die ganze Lektion: ${yt}

--- In English ---
${clip.en}

${tagZeile(clip.tags)} #Shorts
\`\`\`

---

## Instagram Reels

**Caption:**

\`\`\`
${clip.hook}

${clip.de}

${clip.en}

Ganze Lektion im Profil-Link.
${tagZeile(clip.tags)} #reels #deutschlernen
\`\`\`

**Link für die Bio / den Sticker:** ${ig}

---

## Facebook Reels

**Caption:**

\`\`\`
${clip.hook}

${clip.de}

${clip.en}

Ganze Lektion: ${fb}

${tagZeile(clip.tags)}
\`\`\`

---

## Erster Kommentar (auf allen drei Plattformen, direkt nach dem Posten)

\`\`\`
Welches Wort macht dir dabei am meisten Probleme? Schreib es hier rein — ich antworte jedem.
\`\`\`
`;
}

const zeilen = ['clip,video_nr,video_titel,slug,anker_prozent,dauer_sek,titel,quelle_url'];
// Maschinenlesbar für schneiden.sh / schneiden.ps1 — keine Anführungszeichen,
// keine Kommas, damit kein Parser nötig ist.
const liste = [];

let anzahl = 0;
for (const video of VIDEOS) {
  const ordner = join(HIER, 'texte', video.slug);
  await mkdir(ordner, { recursive: true });

  for (const [i, clip] of video.clips.entries()) {
    await writeFile(join(ordner, `clip-${i + 1}.md`), blatt(video, clip, i), 'utf8');
    zeilen.push(
      [
        clipName(video, i),
        video.nr,
        `"${video.titel}"`,
        video.slug,
        clip.anker,
        50,
        `"${clip.titel.replace(/"/g, '""')}"`,
        `${STORAGE}/${video.slug}/video-en.mp4`,
      ].join(','),
    );
    liste.push(`${clipName(video, i)}|${video.slug}|${clip.anker}|50`);
    anzahl += 1;
  }
}

await writeFile(join(HIER, 'schnittplan.csv'), `${zeilen.join('\n')}\n`, 'utf8');
await writeFile(join(HIER, 'schnittliste.txt'), `${liste.join('\n')}\n`, 'utf8');
console.log(`${anzahl} Clips aus ${VIDEOS.length} Videos — Texte, schnittplan.csv und schnittliste.txt geschrieben.`);
