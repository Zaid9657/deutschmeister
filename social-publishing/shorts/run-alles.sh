#!/usr/bin/env bash
set -uo pipefail
HIER="$(cd "$(dirname "$0")" && pwd)"
SCRATCH=/tmp/claude-0/-home-user-deutschmeister/d63a56a2-e0d6-5748-9ed1-2a614b7960d5/scratchpad
FF="$SCRATCH/node_modules/ffmpeg-static/ffmpeg"
FP="$SCRATCH/node_modules/ffprobe-static/bin/linux/x64/ffprobe"
BASIS="https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library"
mkdir -p "$HIER/quelle" "$HIER/clips"
FILTER="split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24[bgb];[fg]scale=1080:-2[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1"

while IFS='|' read -r name slug anker dauer; do
  [ -z "${name:-}" ] && continue
  datei="$HIER/quelle/$slug.mp4"
  if [ ! -s "$datei" ]; then
    echo "[dl] $slug"
    curl -sS --max-time 900 -o "$datei" "$BASIS/$slug/video-en.mp4" || { echo "[FEHLER dl] $slug"; continue; }
  fi
  ziel="$HIER/clips/$name.mp4"
  [ -s "$ziel" ] && { echo "[skip] $name"; continue; }
  laenge=$("$FP" -v error -show_entries format=duration -of csv=p=0 "$datei")
  start=$(awk -v l="$laenge" -v a="$anker" 'BEGIN{printf "%.2f", l*a/100}')
  max=$(awk -v l="$laenge" -v d="$dauer" 'BEGIN{m=l-d; if(m<0)m=0; printf "%.2f", m}')
  start=$(awk -v s="$start" -v m="$max" 'BEGIN{printf "%.2f", (s>m?m:s)}')
  echo "[cut] $name  start=${start}s / len=${laenge}s"
  "$FF" -nostdin -v error -y -ss "$start" -t "$dauer" -i "$datei" -vf "$FILTER" \
    -c:v libx264 -preset veryfast -crf 23 -profile:v high -pix_fmt yuv420p \
    -r 30 -g 60 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart "$ziel" \
    || echo "[FEHLER cut] $name"
done < "$HIER/schnittliste.txt"
echo "=== FERTIG: $(ls -1 "$HIER/clips"/*.mp4 2>/dev/null | wc -l) Clips ==="
