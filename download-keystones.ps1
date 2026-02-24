# Download Keystone images from PoEDB CDN

$baseUrl = "https://cdn.poedb.tw/image/Art/2DArt/SkillIcons/passives"
$outputDir = "C:\Users\alexa\Documents\poetrade-dev\public\images\keystone"

# Keystone Passive (46)
$keystonePassives = @(
    "KeystoneMinionInstability",
    "KeystoneConduit",
    "KeystoneAcrobatics",
    "KeystoneIronReflexes",
    "KeystoneResoluteTechnique",
    "KeystoneUnwaveringStance",
    "KeystoneChaosInoculation",
    "KeystoneEldritchBattery",
    "KeystoneBloodMagic",
    "KeystoneNecromanticAegis",
    "KeystonePainAttunement",
    "KeystoneElementalEquilibrium",
    "KeystoneIronGrip",
    "KeystonePointBlankArcher",
    "KeystoneArrowDodging",
    "totemmax",
    "ghostreaver",
    "vaalpact",
    "liferegentoenergyshield",
    "KeystoneAvatarOfFire",
    "heroicspirit",
    "KeystoneElementalOverload",
    "CritAilments",
    "CrimsonDance",
    "BrandKeystone",
    "Occultist/EldrichBarrier",
    "CallToArms",
    "EternalYouth",
    "GlancingBlows",
    "WindDancer",
    "MiracleMaker",
    "SupremeEgo",
    "SacredBastionKeystone",
    "ImpaleKeystone",
    "KeystoneHexMaster",
    "Deaden",
    "KeystoneIronWill",
    "Resilience",
    "Trickster/AcrobaticWillpower",
    "EnergisedFortress",
    "VersatileCombatant",
    "MomentofRespite",
    "PreciseTechnique",
    "AnointOnlyKeystone",
    "RetaliationKeystone",
    "TinctureKeystone1"
)

# Cluster Jewel Keystone (8)
$clusterJewelKeystones = @(
    "DiscipleOfKitava",
    "LoneMessenger",
    "NaturesPatience",
    "SecretOfAgony",
    "Kineticism",
    "VeteransAwareness",
    "DragonStyle",
    "Pitfighter"
)

# Timeless Jewel Keystone (15)
$timelessJewelKeystones = @(
    "DivineFlesh",
    "SoulTetherKeystone",
    "CorruptedDefences",
    "StrengthOfBlood",
    "TemperedByWar",
    "FocusedRage",
    "OasisKeystone",
    "SharpandBrittle",
    "TheBlindMonk",
    "TranscendenceKeystone",
    "InnerConviction",
    "PowerOfPurpose",
    "SupremeDecadence",
    "SupremeGrandstand",
    "SupremeProdigy"
)

$allKeystones = $keystonePassives + $clusterJewelKeystones + $timelessJewelKeystones

$downloaded = 0
$failed = 0

foreach ($keystone in $allKeystones) {
    $url = "$baseUrl/$keystone.webp"
    $outputName = $keystone -replace "/", "_"
    $outputFile = "$outputDir/$outputName.webp"
    
    try {
        Write-Host "Downloading: $keystone"
        Invoke-WebRequest -Uri $url -OutFile $outputFile -UseBasicParsing
        $downloaded++
    }
    catch {
        Write-Host "FAILED: $keystone - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nDownload complete!"
Write-Host "Downloaded: $downloaded"
Write-Host "Failed: $failed"
