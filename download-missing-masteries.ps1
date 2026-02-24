$baseUrl = "https://cdn.poedb.tw/image/Art/2DArt/SkillIcons/passives/MasteryPassiveIcons"
$outputDir = "C:\Users\alexa\Documents\poetrade-dev\public\images\mastery"

$missing = @(
    @{Name="Claw"; File="Claws"},
    @{Name="DualWield"; File="DualWield"},
    @{Name="MinionDefence"; File="MinionDefences"},
    @{Name="MinionOffence"; File="MinionOffences"},
    @{Name="Protection"; File="Protections"},
    @{Name="Rage"; File="Rages"},
    @{Name="Recovery"; File="Recoveries"},
    @{Name="Retaliation"; File="Retaliations"},
    @{Name="Stun"; File="Stuns"},
    @{Name="Tincture"; File="Tinctures"}
)

foreach ($m in $missing) {
    $url = "$baseUrl/PassiveMastery$($m.File)Active.webp"
    $output = "$outputDir/$($m.Name).webp"
    Write-Host "Downloading $($m.Name)..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host "  OK" -ForegroundColor Green
    }
    catch {
        Write-Host "  FAILED: $url" -ForegroundColor Red
    }
}
