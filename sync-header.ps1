# Propagates the header block from header.html into every page that embeds it.
#
# Usage: edit the <header>...</header> markup inside header.html (between the
# <!-- HEADER:START --> / <!-- HEADER:END --> markers), then run this script:
#
#   powershell -ExecutionPolicy Bypass -File sync-header.ps1
#
# It copies that exact block into the matching markers in every page listed
# in $targets below, so all pages stay byte-for-byte identical. Add new pages
# to $targets as you create them (they need the same START/END marker comments
# already present in their file).

$root = $PSScriptRoot
$sourceFile = Join-Path $root "header.html"
$targets = @(
    "dashboard.html",
    "knowledge-center.html",
    "sop-policies.html",
    "company-info-directory.html",
    "forms.html",
    "company-forms-directory.html",
    "quick-links.html",
    "compliance-dashboard.html",
    "restaurant-details-directory.html",
    "task-checklist.html",
    "announcements.html",
    "sales.html",
    "music-player.html",
    "job-openings.html",
    "job-application.html",
    "manage-job-postings.html",
    "manage-announcements.html"
)

$startMarker = "<!-- HEADER:START -->"
$endMarker = "<!-- HEADER:END -->"

function Get-Between($text, $start, $end) {
    $startIdx = $text.IndexOf($start)
    $endIdx = $text.IndexOf($end)
    if ($startIdx -lt 0 -or $endIdx -lt 0 -or $endIdx -le $startIdx) {
        throw "Could not find HEADER:START/HEADER:END markers."
    }
    $endIdx = $endIdx + $end.Length
    return $text.Substring($startIdx, $endIdx - $startIdx)
}

$sourceText = Get-Content -Raw $sourceFile
$headerBlock = Get-Between $sourceText $startMarker $endMarker

$updated = @()
$skipped = @()

foreach ($name in $targets) {
    $path = Join-Path $root $name
    if (-not (Test-Path $path)) {
        $skipped += "$name (file not found)"
        continue
    }
    $text = Get-Content -Raw $path
    $startIdx = $text.IndexOf($startMarker)
    $endIdx = $text.IndexOf($endMarker)
    if ($startIdx -lt 0 -or $endIdx -lt 0) {
        $skipped += "$name (no HEADER:START/HEADER:END markers found -- add them once, manually, then re-run)"
        continue
    }
    $endIdx = $endIdx + $endMarker.Length
    $before = $text.Substring(0, $startIdx)
    $after = $text.Substring($endIdx)
    $newText = $before + $headerBlock + $after
    if ($newText -ne $text) {
        Set-Content -Path $path -Value $newText -NoNewline -Encoding utf8
        $updated += $name
    }
}

if ($updated.Count -gt 0) {
    Write-Host "Synced header into: $($updated -join ', ')"
} else {
    Write-Host "Already in sync -- no files changed."
}
if ($skipped.Count -gt 0) {
    Write-Host "Skipped: $($skipped -join '; ')"
}
