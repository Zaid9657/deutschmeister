#!/usr/bin/env bash
# Lädt alle Videos und Podcasts von deutsch-meister.de herunter und benennt sie
# nach ihren Titeln. Erneutes Ausführen setzt abgebrochene Downloads fort.
#
#   bash herunterladen.sh            # alles (~6,9 GB)
#   bash herunterladen.sh Video      # nur die 22 Videos (~0,7 GB)
#   bash herunterladen.sh Podcast    # nur die 24 Podcasts (~6,2 GB)

set -u
BASIS="https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public"
FILTER="${1:-}"
CSV="$(dirname "$0")/dateien.csv"
OK=0; FEHLER=0

while IFS=';' read -r typ stufe titel pfad ziel mb; do
  [ "$typ" = "typ" ] && continue
  [ -n "$FILTER" ] && [ "$typ" != "$FILTER" ] && continue
  mkdir -p "$(dirname "$ziel")"
  if [ -s "$ziel" ]; then echo "vorhanden: $ziel"; OK=$((OK+1)); continue; fi
  echo "lade (${mb} MB): $titel"
  if curl -fL --retry 3 --retry-delay 2 -C - -# -o "$ziel" --url-query "" "$BASIS/$pfad" 2>/dev/null \
     || curl -fL --retry 3 --retry-delay 2 -C - -# -o "$ziel" "$BASIS/$(printf '%s' "$pfad" | sed 's/ /%20/g; s/(/%28/g; s/)/%29/g')"; then
    OK=$((OK+1))
  else
    echo "  FEHLER bei: $pfad"; rm -f "$ziel"; FEHLER=$((FEHLER+1))
  fi
done < "$CSV"

echo
echo "Fertig. Geladen/vorhanden: $OK   Fehlgeschlagen: $FEHLER"
