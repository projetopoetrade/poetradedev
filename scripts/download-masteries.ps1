$masteries = @(
    @{Name="Accuracy"; File="Accuracy"},
    @{Name="Armour and Energy Shield"; File="ArmourAndEnergyShield"},
    @{Name="Armour and Evasion"; File="ArmourAndEvasion"},
    @{Name="Armour"; File="Armour"},
    @{Name="Attack"; File="Attack"},
    @{Name="Attributes"; File="Attributes"},
    @{Name="Axe"; File="Axe"},
    @{Name="Banner"; File="Banner"},
    @{Name="Bleeding"; File="Bleeding"},
    @{Name="Blind"; File="Blind"},
    @{Name="Block"; File="Block"},
    @{Name="Bow"; File="Bow"},
    @{Name="Brand"; File="Brand"},
    @{Name="Caster"; File="Caster"},
    @{Name="Chaos"; File="Chaos"},
    @{Name="Charge"; File="Charges"},
    @{Name="Claw"; File="Claw"},
    @{Name="Cold"; File="Cold"},
    @{Name="Critical"; File="Critical"},
    @{Name="Curse"; File="Curse"},
    @{Name="Dagger"; File="Dagger"},
    @{Name="Damage Over Time"; File="DamageOverTime"},
    @{Name="Dual Wielding"; File="DualWielding"},
    @{Name="Duration"; File="Duration"},
    @{Name="Elemental"; File="Elemental"},
    @{Name="Energy Shield"; File="Energy"},
    @{Name="Evasion and Energy Shield"; File="EvasionAndEnergyShield"},
    @{Name="Evasion"; File="Evasion"},
    @{Name="Fire"; File="Fire"},
    @{Name="Flask"; File="Flask"},
    @{Name="Fortify"; File="Fortify"},
    @{Name="Impale"; File="Impale"},
    @{Name="Leech"; File="Leech"},
    @{Name="Life"; File="Life"},
    @{Name="Lightning"; File="Lightning"},
    @{Name="Link"; File="Link"},
    @{Name="Mace"; File="Mace"},
    @{Name="Mana"; File="Mana"},
    @{Name="Mark"; File="Mark"},
    @{Name="Mine"; File="Mine"},
    @{Name="Minion Defence"; File="MinionDefence"},
    @{Name="Minion Offence"; File="MinionOffence"},
    @{Name="Physical"; File="Physical"},
    @{Name="Poison"; File="Poison"},
    @{Name="Projectile"; File="Projectile"},
    @{Name="Protection"; File="Protection"},
    @{Name="Rage"; File="Rage"},
    @{Name="Recovery"; File="Recovery"},
    @{Name="Reservation"; File="Reservation"},
    @{Name="Retaliation"; File="Retaliation"},
    @{Name="Shield"; File="Shield"},
    @{Name="Spell Suppression"; File="SpellSuppression"},
    @{Name="Staff"; File="Staff"},
    @{Name="Stun"; File="Stun"},
    @{Name="Sword"; File="Sword"},
    @{Name="Tincture"; File="Tincture"},
    @{Name="Totem"; File="Totem"},
    @{Name="Trap"; File="Trap"},
    @{Name="Two Hand"; File="TwoHand"},
    @{Name="Wand"; File="Wand"},
    @{Name="Warcry"; File="Warcry"}
)

$baseUrl = "https://cdn.poedb.tw/image/Art/2DArt/SkillIcons/passives/MasteryPassiveIcons"
$outputDir = "C:\Users\alexa\Documents\poetrade-dev\public\images\mastery"

foreach ($mastery in $masteries) {
    $url = "$baseUrl/PassiveMastery$($mastery.File)Active.webp"
    $output = "$outputDir/$($mastery.File).webp"
    
    Write-Host "Downloading $($mastery.Name)..."
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host "  OK" -ForegroundColor Green
    }
    catch {
        Write-Host "  FAILED: $url" -ForegroundColor Red
    }
}

Write-Host "`nDone!"
