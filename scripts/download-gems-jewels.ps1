# Download all gems and jewels from PoEDB / Poewiki CDN.
# Renames images to PoB-friendly slugs (name <-> image link) and outputs mapping at the end.

$outputRoot = "C:\Users\alexa\Documents\poetrade-dev\public\images"
$script:NameToPathList = [System.Collections.Generic.List[object]]::new()

$pobNameOverrides = @{
    "AdditionalSkeletonMagesModifier" = "Dead Reckoning"
    "IntensityJewel1" = "Intensity (1)"
}

function Get-PobDisplayName {
    param([string]$poedbName, [string]$category)
    if ($pobNameOverrides.ContainsKey($poedbName)) {
        return $pobNameOverrides[$poedbName]
    }
    $withSpaces = $poedbName -creplace '([a-z])([A-Z])', '$1 $2'
    $withSpaces = $withSpaces -creplace '([A-Z]+)([A-Z][a-z])', '$1 $2'
    $withSpaces = $withSpaces -replace '_', ' '
    $display = (Get-Culture).TextInfo.ToTitleCase($withSpaces.ToLower())
    if ($category -eq 'support' -or $category -eq 'awakened') {
        if ($display -notmatch ' Support$') { $display = "$display Support" }
    }
    return $display
}

function Get-PobSlug {
    param([string]$displayName)
    $slug = $displayName -replace "'", ''
    $slug = $slug -replace '[()]', ''
    $slug = $slug -replace '\s+', '-'
    $slug = $slug -replace '[^\w\-]', ''
    return $slug.ToLower()
}

function Get-WikiItems {
    param(
        [string[]]$Urls,
        [string]$Category
    )
    
    $items = @{}
    # Novo padrão: Busca o bloco inteiro do 'hoverbox', pega o 'src' da imagem e o texto da tag 'a'
    $pattern = '(?is)<span class="hoverbox c-item-hoverbox".*?src="([^"]+)".*?<a[^>]*>([^<]+)</a>'
    
    foreach ($url in $Urls) {
        Write-Host "Scraping Poewiki: $url" -ForegroundColor DarkGray
        try {
            $html = Invoke-RestMethod -Uri $url -UseBasicParsing -Headers @{
                "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            $matches = [regex]::Matches($html, $pattern)
            
            foreach ($m in $matches) {
                $src = $m.Groups[1].Value
                $rawName = $m.Groups[2].Value
                $name = [System.Net.WebUtility]::HtmlDecode($rawName).Trim()
                
                # Extrai a URL limpa (ignora thumbnails e tamanhos)
                if ($src -match '/images/(?:thumb/)?([a-f0-9]/[a-f0-9]{2}/[^/"]+\.png)') {
                    $realUrl = "https://www.poewiki.net/images/" + $Matches[1]
                    
                    if (-not $items.ContainsKey($name)) {
                        $items[$name] = @{
                            Url = $realUrl
                            PoedbName = $name
                            Category = $Category
                            IsWiki = $true
                        }
                    }
                }
            }
        }
        catch {
            Write-Host "Erro ao buscar $url - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    return $items.Values
}

function Download-Images {
    param(
        [hashtable[]]$items,
        [string]$outputDir,
        [string]$relativeDir,
        [int]$delayMs = 150
    )
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        Write-Host "Criado diretório: $outputDir"
    }
    $downloaded = 0
    $failed = 0
    $headers = @{
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    foreach ($item in $items) {
        $displayName = if ($item.IsWiki) { $item.PoedbName } else { Get-PobDisplayName -poedbName $item.PoedbName -category $item.Category }
        $slug = Get-PobSlug -displayName $displayName
        
        $ext = if ($item.IsWiki) { ".png" } else { ".webp" }
        $outputFile = Join-Path $outputDir "$slug$ext"
        $relativePath = "$relativeDir/$slug$ext"
        
        $script:NameToPathList.Add([PSCustomObject]@{ Name = $displayName; Slug = $slug; Path = $relativePath })
        
        if (Test-Path $outputFile) {
            Write-Host "SKIP: $slug$ext (exists)"
            $downloaded++
            continue
        }
        try {
            Start-Sleep -Milliseconds $delayMs
            Invoke-WebRequest -Uri $item.Url -OutFile $outputFile -UseBasicParsing -Headers $headers
            Write-Host "OK: $displayName -> $slug$ext" -ForegroundColor Green
            $downloaded++
        }
        catch {
            Write-Host "FAILED: $($item.Url) - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
    return @{ Downloaded = $downloaded; Failed = $failed }
}

# --- URLs da Poewiki ---
$skillUrls    = @("https://www.poewiki.net/wiki/Skill_gem", "https://www.poewiki.net/wiki/Transfigured_skill_gem")
$supportUrls  = @("https://www.poewiki.net/wiki/Support_gem")
$awakenedUrls = @("https://www.poewiki.net/wiki/Awakened_support_gem")
$vaalUrls     = @("https://www.poewiki.net/wiki/Vaal_skill")
$jewelUrls    = @("https://www.poewiki.net/wiki/Jewel", "https://www.poewiki.net/wiki/List_of_unique_jewels")

# --- Processando via Wiki ---
$skillItems    = Get-WikiItems -Urls $skillUrls -Category "skill"
$supportItems  = Get-WikiItems -Urls $supportUrls -Category "support"
$awakenedItems = Get-WikiItems -Urls $awakenedUrls -Category "awakened"
$vaalItems     = Get-WikiItems -Urls $vaalUrls -Category "vaal"
$jewelItems    = Get-WikiItems -Urls $jewelUrls -Category "jewel"

# --- Rotinas de Download ---
$totalDownloaded = 0; $totalFailed = 0;

Write-Host "`n=== Downloading Skill Gems (Wiki) ===" -ForegroundColor Cyan
$res = Download-Images -items $skillItems -outputDir "$outputRoot/gem/skill" -relativeDir "gem/skill"
$totalDownloaded += $res.Downloaded; $totalFailed += $res.Failed

Write-Host "`n=== Downloading Support Gems (Wiki) ===" -ForegroundColor Cyan
$res = Download-Images -items $supportItems -outputDir "$outputRoot/gem/support" -relativeDir "gem/support"
$totalDownloaded += $res.Downloaded; $totalFailed += $res.Failed

Write-Host "`n=== Downloading Awakened Gems (Wiki) ===" -ForegroundColor Cyan
$res = Download-Images -items $awakenedItems -outputDir "$outputRoot/gem/awakened" -relativeDir "gem/awakened"
$totalDownloaded += $res.Downloaded; $totalFailed += $res.Failed

Write-Host "`n=== Downloading Vaal Gems (Wiki) ===" -ForegroundColor Cyan
$res = Download-Images -items $vaalItems -outputDir "$outputRoot/gem/vaal" -relativeDir "gem/vaal"
$totalDownloaded += $res.Downloaded; $totalFailed += $res.Failed

Write-Host "`n=== Downloading Jewels (Wiki) ===" -ForegroundColor Cyan
$res = Download-Images -items $jewelItems -outputDir "$outputRoot/jewel" -relativeDir "jewel"
$totalDownloaded += $res.Downloaded; $totalFailed += $res.Failed

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Total Downloaded: $totalDownloaded" -ForegroundColor Green
Write-Host "Total Failed: $totalFailed" -ForegroundColor $(if ($totalFailed -gt 0) { "Red" } else { "Green" })

# --- Export do CSV ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Mapeamento: Nome (PoB) -> Imagem (path)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$listPath = Join-Path $outputRoot "gems-jewels-mapping.csv"
$script:NameToPathList | Export-Csv -Path $listPath -NoTypeInformation -Encoding UTF8
Write-Host "Lista exportada em: $listPath" -ForegroundColor Yellow

Write-Host "`nResumo por categoria:" -ForegroundColor Cyan
$script:NameToPathList | Group-Object { ($_.Path -split '/')[0..1] -join '/' } | ForEach-Object {
    Write-Host "  $($_.Name) : $($_.Count) itens"
}