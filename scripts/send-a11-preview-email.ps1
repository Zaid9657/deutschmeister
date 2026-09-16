# DeutschStart A1.1 preview sequence — operator script (2026-09-15 launch
# plan Task 4 Step 3).
#
# SAFE BY DEFAULT: every run is a TEST send (to the configured test address)
# unless BOTH -Live and -ConfirmCampaign a11-foundation-2026-09 are given.
# There is no way to send to the real audience by forgetting a flag.
#
#   .\scripts\send-a11-preview-email.ps1 -Email 1
#   .\scripts\send-a11-preview-email.ps1 -Email 5 -Live -ConfirmCampaign a11-foundation-2026-09
#
# The secret comes from the environment ($env:CAMPAIGN_SECRET, set in the
# Netlify site settings) and is NEVER written into this file.
#
# A real audience send is a hard owner checkpoint: it happens only after the
# production purchase journey has been verified end to end (launch plan
# Task 6 Step 3).

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateRange(1, 5)]
  [int]$Email,

  [switch]$Live,

  [string]$ConfirmCampaign = ''
)

$ErrorActionPreference = 'Stop'

$Campaign = 'a11-foundation-2026-09'
$Endpoint = 'https://deutsch-meister.de/.netlify/functions/send-campaign'
$DraftPath = Join-Path $PSScriptRoot "..\drafts\deutschstart-a11-preview-$Email.md"

if (-not (Test-Path $DraftPath)) {
  throw "Draft not found: $DraftPath"
}

if (-not $env:CAMPAIGN_SECRET) {
  throw 'CAMPAIGN_SECRET is not set in the environment. Set it for this shell only; never write it into a file.'
}

# --- test mode is the default; a live send needs both flags ----------------
$testMode = $true
if ($Live) {
  if ($ConfirmCampaign -ne $Campaign) {
    throw "A live send also needs -ConfirmCampaign $Campaign (got: '$ConfirmCampaign'). Refusing."
  }
  $testMode = $false
}

# --- subject + body from the draft -----------------------------------------
$draft = Get-Content -Raw -Path $DraftPath
$subjectMatch = [regex]::Match($draft, '(?m)^\*\*Subject:\*\*\s*(.+)$')
if (-not $subjectMatch.Success) { throw "No '**Subject:**' line in $DraftPath" }
$subject = $subjectMatch.Groups[1].Value.Trim()

# The email body is everything after the first '---' separator that follows
# the subject line, minus the trailing send-notes block.
$parts = $draft -split '(?m)^---\s*$'
if ($parts.Count -lt 3) { throw "Unexpected draft structure in $DraftPath" }
$body = $parts[2].Trim()

# --- exclusions: emails 2-5 never reach someone who already bought ---------
$exclude = @()
if ($Email -ge 2) { $exclude += 'purchased:course_a1_1' }

$payload = @{
  subject  = $subject
  body     = $body
  testMode = $testMode
  exclude  = $exclude
} | ConvertTo-Json -Depth 5

Write-Host "Campaign : $Campaign"
Write-Host "Email    : $Email"
Write-Host "Subject  : $subject"
Write-Host ("Mode     : " + $(if ($testMode) { 'TEST (test address only)' } else { 'LIVE — real audience' }))
Write-Host ("Exclude  : " + $(if ($exclude.Count) { $exclude -join ', ' } else { '(none — first email)' }))

if (-not $testMode) {
  $answer = Read-Host 'Type SEND to mail the real audience'
  if ($answer -ne 'SEND') { throw 'Aborted.' }
}

$response = Invoke-RestMethod -Method Post -Uri $Endpoint -Body $payload -ContentType 'application/json' -Headers @{
  'x-campaign-secret' = $env:CAMPAIGN_SECRET
}

$response | ConvertTo-Json -Depth 5
