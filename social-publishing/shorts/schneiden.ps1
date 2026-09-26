# Windows-Fassung von schneiden.sh — gleiches Ergebnis.
#
# Voraussetzung: ffmpeg im PATH.
#   winget install Gyan.FFmpeg
#   danach PowerShell neu öffnen.
#
# Aufruf:
#   .\schneiden.ps1           # alles
#   .\schneiden.ps1 -Nur 3    # nur Video Nummer 3

param([int]$Nur = 0)

$ErrorActionPreference = 'Stop'
$Hier    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Storage = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library'
$Liste   = Join-Path $Hier 'schnittliste.txt'
$Quelle  = Join-Path $Hier 'quelle'
$Ziel    = Join-Path $Hier 'clips'

foreach ($w in @('ffmpeg', 'ffprobe')) {
  if (-not (Get-Command $w -ErrorAction SilentlyContinue)) { throw "Fehlt: $w" }
}
if (-not (Test-Path $Liste)) { throw "schnittliste.txt fehlt — erst 'node texte-erzeugen.mjs' laufen lassen." }

New-Item -ItemType Directory -Force -Path $Quelle, $Ziel | Out-Null

$Filter = 'split=2[bg][fg];' +
          '[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24[bgb];' +
          '[fg]scale=1080:-2[fgs];' +
          '[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1'

$geschnitten = 0
$uebersprungen = 0

foreach ($zeile in Get-Content $Liste) {
  if ([string]::IsNullOrWhiteSpace($zeile)) { continue }
  $t = $zeile.Split('|')
  $name = $t[0]; $slug = $t[1]; $anker = [double]$t[2]; $dauer = [double]$t[3]
  $nummer = [int]($name.Split('-')[0])
  if ($Nur -gt 0 -and $nummer -ne $Nur) { continue }

  $datei = Join-Path $Quelle "$slug.mp4"
  if (-not (Test-Path $datei)) {
    Write-Host "Lade $slug ..."
    Invoke-WebRequest -Uri "$Storage/$slug/video-en.mp4" -OutFile $datei
  }

  $zielDatei = Join-Path $Ziel "$name.mp4"
  if (Test-Path $zielDatei) { $uebersprungen++; continue }

  $laenge = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 $datei)
  $start  = [math]::Round($laenge * $anker / 100, 2)
  $max    = [math]::Max(0, $laenge - $dauer)
  if ($start -gt $max) { $start = [math]::Round($max, 2) }

  Write-Host "Schneide $name  (ab ${start}s von ${laenge}s)"
  ffmpeg -nostdin -v error -y `
    -ss $start -t $dauer -i $datei `
    -vf $Filter `
    -c:v libx264 -preset veryfast -crf 23 -profile:v high -pix_fmt yuv420p `
    -r 30 -g 60 `
    -c:a aac -b:a 128k -ar 48000 -ac 2 `
    -movflags +faststart `
    $zielDatei
  $geschnitten++
}

Write-Host ''
Write-Host "Fertig. $geschnitten neu geschnitten, $uebersprungen waren schon da."
Write-Host "Clips liegen in: $Ziel"
