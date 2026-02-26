# Download Ascendancy icons from Poewiki
# Run from project root: powershell -File ./scripts/download-ascendancy-icons.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$outputDir = Join-Path $projectRoot "public\images\ascendancy"

$headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# PoE 1 Ascendancy Icons - poewiki direct URLs
$poe1Icons = @{
    "Necromancer" = "https://www.poewiki.net/images/7/7f/Necromancer_avatar.png"
    "Elementalist" = "https://www.poewiki.net/images/c/c5/Elementalist_avatar.png"
    "Occultist" = "https://www.poewiki.net/images/e/e9/Occultist_avatar.png"
    "Assassin" = "https://www.poewiki.net/images/d/dc/Assassin_avatar.png"
    "Trickster" = "https://www.poewiki.net/images/6/6d/Trickster_avatar.png"
    "Saboteur" = "https://www.poewiki.net/images/d/d2/Saboteur_avatar.png"
    "Deadeye" = "https://www.poewiki.net/images/8/8e/Deadeye_avatar.png"
    "Pathfinder" = "https://www.poewiki.net/images/a/a1/Pathfinder_avatar.png"
    "Warden" = "https://www.poewiki.net/images/a/a7/Warden_avatar.png"
    "Slayer" = "https://www.poewiki.net/images/4/4a/Slayer_avatar.png"
    "Gladiator" = "https://www.poewiki.net/images/8/8b/Gladiator_avatar.png"
    "Champion" = "https://www.poewiki.net/images/8/89/Champion_avatar.png"
    "Juggernaut" = "https://www.poewiki.net/images/c/c4/Juggernaut_avatar.png"
    "Berserker" = "https://www.poewiki.net/images/8/80/Berserker_avatar.png"
    "Chieftain" = "https://www.poewiki.net/images/4/41/Chieftain_avatar.png"
    "Inquisitor" = "https://www.poewiki.net/images/2/2d/Inquisitor_avatar.png"
    "Hierophant" = "https://www.poewiki.net/images/6/64/Hierophant_avatar.png"
    "Guardian" = "https://www.poewiki.net/images/7/7a/Guardian_avatar.png"
    "Ascendant" = "https://www.poewiki.net/images/1/14/Ascendant_avatar.png"
}

# PoE 2 Ascendancy Icons - poe2wiki
$poe2Icons = @{
    "Deadeye" = "https://www.poe2wiki.net/images/d/d4/Deadeye_portrait.png"
    "Pathfinder" = "https://www.poe2wiki.net/images/c/c4/Pathfinder_portrait.png"
    "Infernalist" = "https://www.poe2wiki.net/images/8/86/Infernalist_portrait.png"
    "Blood Mage" = "https://www.poe2wiki.net/images/d/da/Blood_Mage_portrait.png"
    "Titan" = "https://www.poe2wiki.net/images/8/82/Titan_portrait.png"
    "Warbringer" = "https://www.poe2wiki.net/images/9/94/Warbringer_portrait.png"
    "Witchhunter" = "https://www.poe2wiki.net/images/e/e6/Witchhunter_portrait.png"
    "Gemling Legionnaire" = "https://www.poe2wiki.net/images/5/54/GemlingLegionnaire_portrait.png"
    "Invoker" = "https://www.poe2wiki.net/images/7/70/Invoker_portrait.png"
    "Acolyte of Chayula" = "https://www.poe2wiki.net/images/3/39/AcolyteofChayula_portrait.png"
    "Stormweaver" = "https://www.poe2wiki.net/images/2/29/Stormweaver_portrait.png"
    "Chronomancer" = "https://www.poe2wiki.net/images/5/57/Chronomancer_portrait.png"
}

function Download-AscendancyImages {
    param(
        [hashtable]$icons,
        [string]$subDir
    )
    
    $targetDir = Join-Path $outputDir $subDir
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    $downloaded = 0
    $failed = 0
    
    foreach ($name in $icons.Keys) {
        $url = $icons[$name]
        $outputFilePng = Join-Path $targetDir "$name.png"
        
        if (Test-Path $outputFilePng) {
            Write-Host "  SKIP: $name (exists)" -ForegroundColor DarkGray
            $downloaded++
            continue
        }
        
        try {
            Write-Host "  Downloading: $name" -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $url -OutFile $outputFilePng -UseBasicParsing -Headers $headers
            Write-Host "  OK: $name -> $name.png" -ForegroundColor Green
            $downloaded++
            Start-Sleep -Milliseconds 100
        }
        catch {
            Write-Host "  FAILED: $name - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
    
    return @{ Downloaded = $downloaded; Failed = $failed }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ascendancy Icons Downloader (Poewiki)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Output directory: $outputDir" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Downloading PoE1 Ascendancy Icons ===" -ForegroundColor Yellow
$res1 = Download-AscendancyImages -icons $poe1Icons -subDir "poe1"

Write-Host ""
Write-Host "=== Downloading PoE2 Ascendancy Icons ===" -ForegroundColor Yellow
$res2 = Download-AscendancyImages -icons $poe2Icons -subDir "poe2"

$totalDownloaded = $res1.Downloaded + $res2.Downloaded
$totalFailed = $res1.Failed + $res2.Failed

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Total Downloaded: $totalDownloaded" -ForegroundColor Green
Write-Host "Total Failed: $totalFailed" -ForegroundColor $(if ($totalFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Images saved to:" -ForegroundColor Cyan
Write-Host "  $outputDir\poe1\" -ForegroundColor Gray
Write-Host "  $outputDir\poe2\" -ForegroundColor Gray
