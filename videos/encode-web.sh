#!/usr/bin/env bash
# Web-encode the line board renders into public/motion/ (docs/redesign-2026-10/README.md).
#   videos/hero-line/renders/video.mp4        -> public/motion/hero-line.mp4 + hero-line-poster.webp
#   videos/hero-line-mobile/renders/video.mp4 -> public/motion/hero-line-mobile.mp4 + hero-line-mobile-poster.webp
# H.264 high profile, yuv420p, no audio, +faststart so it starts before it is fully loaded;
# plus a VP9 WebM of the same render.
# The poster is the shot plan's poster_time_s (all eight stations lit).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/motion
for pair in "hero-line:hero-line" "hero-line-mobile:hero-line-mobile"; do
  proj="${pair%%:*}"; out="${pair##*:}"
  src="videos/$proj/renders/video.mp4"
  [ -s "$src" ] || { echo "missing $src — render it first"; exit 1; }
  t=$(node -e "const p=require('./videos/$proj/shot-plan.json');console.log(p.poster_time_s ?? p.envelope?.poster_time_s ?? 12.6)")
  ffmpeg -y -loglevel error -i "$src" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -preset veryslow -crf 30 -movflags +faststart "public/motion/$out.mp4"
  # VP9/WebM for browsers without H.264 (open-source Chromium builds); LineBoard picks by canPlayType.
  ffmpeg -y -loglevel error -i "$src" -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -deadline good -cpu-used 1 "public/motion/$out.webm"
  ffmpeg -y -loglevel error -ss "$t" -i "$src" -frames:v 1 -c:v libwebp -quality 82 "public/motion/$out-poster.webp"
  echo "$out: $(du -k public/motion/$out.mp4 | cut -f1) KB mp4, $(du -k public/motion/$out.webm | cut -f1) KB webm, $(du -k public/motion/$out-poster.webp | cut -f1) KB poster (t=$t s)"
done
