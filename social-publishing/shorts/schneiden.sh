#!/usr/bin/env bash
# Schneidet aus den 11 Videos der Bibliothek 55 hochkant-Clips für
# YouTube Shorts, Instagram Reels und Facebook Reels.
#
# Voraussetzung: ffmpeg und curl.
#   macOS   : brew install ffmpeg
#   Ubuntu  : sudo apt install ffmpeg
#   Windows : schneiden.ps1 benutzen
#
# Aufruf:
#   ./schneiden.sh            # alles: 11 Videos laden, 55 Clips schneiden
#   ./schneiden.sh 3          # nur Video Nummer 3
#
# Ergebnis:
#   quelle/<slug>.mp4         — die Originalvideos (einmal geladen, bleiben liegen)
#   clips/<name>.mp4          — die fertigen Clips, 1080x1920, je 50 Sekunden

set -euo pipefail

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STORAGE="https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library"
LISTE="$HIER/schnittliste.txt"
QUELLE="$HIER/quelle"
ZIEL="$HIER/clips"
NUR="${1:-}"

for werkzeug in ffmpeg ffprobe curl; do
  command -v "$werkzeug" >/dev/null 2>&1 || { echo "Fehlt: $werkzeug"; exit 1; }
done
[ -f "$LISTE" ] || { echo "schnittliste.txt fehlt — erst 'node texte-erzeugen.mjs' laufen lassen."; exit 1; }

mkdir -p "$QUELLE" "$ZIEL"

# Hochkant 1080x1920: das Originalbild mittig, dahinter dasselbe Bild
# formatfüllend und unscharf. Kein Text eingebrannt — Titel kommen aus texte/.
FILTER="split=2[bg][fg];\
[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24[bgb];\
[fg]scale=1080:-2[fgs];\
[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1"

geschnitten=0
uebersprungen=0

while IFS='|' read -r name slug anker dauer; do
  [ -n "${name:-}" ] || continue
  nummer="${name%%-*}"
  if [ -n "$NUR" ] && [ "$((10#$nummer))" != "$((10#$NUR))" ]; then continue; fi

  datei="$QUELLE/$slug.mp4"
  if [ ! -s "$datei" ]; then
    echo "Lade $slug ..."
    curl -fL --retry 3 --retry-delay 2 -o "$datei.teil" "$STORAGE/$slug/video-en.mp4"
    mv "$datei.teil" "$datei"
  fi

  ziel="$ZIEL/$name.mp4"
  if [ -s "$ziel" ]; then
    uebersprungen=$((uebersprungen + 1))
    continue
  fi

  laenge=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$datei")
  start=$(awk -v l="$laenge" -v a="$anker" 'BEGIN{printf "%.2f", l*a/100}')
  # Nie über das Ende hinaus schneiden.
  max=$(awk -v l="$laenge" -v d="$dauer" 'BEGIN{m=l-d; if(m<0)m=0; printf "%.2f", m}')
  start=$(awk -v s="$start" -v m="$max" 'BEGIN{printf "%.2f", (s>m?m:s)}')

  echo "Schneide $name  (ab ${start}s von ${laenge}s)"
  ffmpeg -nostdin -v error -y \
    -ss "$start" -t "$dauer" -i "$datei" \
    -vf "$FILTER" \
    -c:v libx264 -preset veryfast -crf 23 -profile:v high -pix_fmt yuv420p \
    -r 30 -g 60 \
    -c:a aac -b:a 128k -ar 48000 -ac 2 \
    -movflags +faststart \
    "$ziel"
  geschnitten=$((geschnitten + 1))
done < "$LISTE"

echo
echo "Fertig. $geschnitten neu geschnitten, $uebersprungen waren schon da."
echo "Clips liegen in: $ZIEL"
echo "Texte dazu in:   $HIER/texte/<slug>/clip-N.md"
