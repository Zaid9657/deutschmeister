# Windows: Rechtsklick auf die Datei -> "Mit PowerShell ausführen"
# oder:  powershell -ExecutionPolicy Bypass -File herunterladen.ps1
$basis = "https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public"
$csv = Join-Path $PSScriptRoot "dateien.csv"
$zeilen = Import-Csv -Path $csv -Delimiter ';'
$ok = 0; $fehler = 0
foreach ($z in $zeilen) {
  $ziel = Join-Path $PSScriptRoot $z.zieldatei.Replace('/', '\')
  $ordner = Split-Path $ziel -Parent
  if (!(Test-Path $ordner)) { New-Item -ItemType Directory -Path $ordner -Force | Out-Null }
  if ((Test-Path $ziel) -and ((Get-Item $ziel).Length -gt 0)) {
    Write-Host "vorhanden: $($z.zieldatei)"; $ok++; continue
  }
  $url = "$basis/" + [uri]::EscapeUriString($z.storage_pfad)
  Write-Host "lade ($($z.mb) MB): $($z.titel)"
  try { Invoke-WebRequest -Uri $url -OutFile $ziel -UseBasicParsing; $ok++ }
  catch { Write-Host "  FEHLER bei: $($z.storage_pfad)"; Remove-Item $ziel -ErrorAction SilentlyContinue; $fehler++ }
}
Write-Host ""
Write-Host "Fertig. Geladen/vorhanden: $ok   Fehlgeschlagen: $fehler"
