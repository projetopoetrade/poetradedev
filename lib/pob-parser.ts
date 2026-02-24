import { inflateSync } from 'zlib'
import { JSDOM } from 'jsdom'

// --- Types ---

export interface ParsedMod {
  text: string
  type: 'normal' | 'crafted' | 'fractured' | 'enchant' | 'scourge'
}

export interface PobGem {
  name: string
  level: number
  quality: number
  is_support: boolean
}

export interface PobSkillGroup {
  slot: string
  gems: PobGem[]
}

export interface PobSkillSet {
  id: string
  title: string
  skills: PobSkillGroup[]
}

export interface PobItem {
  slot: string
  name: string       // display name: custom name for rare/unique, modified name for magic, base for normal
  baseName: string   // base type
  rarity: string
  sockets?: string   // e.g. "R-G-B-R" or "R-G G-B" (space = separate group)
  quality?: number
  itemLevel?: number
  armour?: number
  evasion?: number
  energyShield?: number
  corrupted?: boolean
  fractured?: boolean
  influences?: string[]
  implicits: ParsedMod[]
  explicits: ParsedMod[]
  iconUrl?: string
}

export interface PobItemSet {
  title: string
  items: PobItem[]
}

export interface PobTreeDetails {
  Keystones: string[]
  Masteries: string[]
  NodesCount: number
}

export interface PobBuildData {
  BuildInfo: { Class: string; Ascendancy: string; Level: string }
  Stats: Record<string, string>
  ItemSets: PobItemSet[]
  SkillSets: PobSkillSet[]
  Skills: PobSkillGroup[]
  TreeDetails: PobTreeDetails
}

// --- Mod parsing ---

function parseModLine(line: string, section: "implicit" | "explicit"): ParsedMod {
  // Strip {range:N} annotations first
  const withoutRange = line.replace(/\{range:[^}]+\}/g, "").trim()

  // Detect type by presence of known tags anywhere in the line.
  // Isso cobre casos como:
  // {tags:...}{crafted}Hits can't be Evaded
  // {tags:...}{enchant}Some enchant text
  let type: ParsedMod["type"] = "normal"
  if (
    withoutRange.includes("{enchant}") ||
    (section === "implicit" &&
      (withoutRange.includes("{crafted}") ||
        withoutRange.includes("{unveiled_mod}")))
  ) {
    // Em implicits, mods marcados como crafted/unveiled se comportam visualmente
    // como "enchants" (primeiro bloco acima da linha), então marcamos como enchant.
    type = "enchant"
  } else if (
    section === "explicit" &&
    (withoutRange.includes("{crafted}") ||
      withoutRange.includes("{unveiled_mod}"))
  ) {
    // Mods de bancada / unveiled nos explicits continuam como "crafted"
    // para podermos colorir em branco, mantendo a ordem original.
    type = "crafted"
  } else if (withoutRange.includes("{fractured}")) {
    type = "fractured"
  } else if (withoutRange.includes("{scourge}")) {
    type = "scourge"
  }

  // Remove all brace tags (including {crafted}, {enchant}, {tags:...}, etc.)
  const text = withoutRange.replace(/\{[^}]+\}/g, "").trim()
  return { text, type }
}

const NON_MOD_LINES = new Set([
  'Corrupted', 'Mirrored', 'Synthesised Item', 'Unidentified', 'Split',
])

// --- Flask / Tincture base type normalization ---
//
// PoB pode exportar flasks em formatos diferentes. Para pegar ícones via poe.ninja,
// precisamos bater o "base type" exatamente (ex.: "Eternal Life Flask", "Gold Flask").
// A lista abaixo é a union dos base types (48) fornecida pelo usuário.
const FLASK_BASE_TYPES = [
  // Life
  'Small Life Flask',
  'Medium Life Flask',
  'Large Life Flask',
  'Greater Life Flask',
  'Grand Life Flask',
  'Giant Life Flask',
  'Colossal Life Flask',
  'Sacred Life Flask',
  'Hallowed Life Flask',
  'Sanctified Life Flask',
  'Divine Life Flask',
  'Eternal Life Flask',
  // Mana
  'Small Mana Flask',
  'Medium Mana Flask',
  'Large Mana Flask',
  'Greater Mana Flask',
  'Grand Mana Flask',
  'Giant Mana Flask',
  'Colossal Mana Flask',
  'Sacred Mana Flask',
  'Hallowed Mana Flask',
  'Sanctified Mana Flask',
  'Divine Mana Flask',
  'Eternal Mana Flask',
  // Hybrid
  'Small Hybrid Flask',
  'Medium Hybrid Flask',
  'Large Hybrid Flask',
  'Colossal Hybrid Flask',
  'Sacred Hybrid Flask',
  'Hallowed Hybrid Flask',
  // Utility
  'Diamond Flask',
  'Ruby Flask',
  'Sapphire Flask',
  'Topaz Flask',
  'Granite Flask',
  'Quicksilver Flask',
  'Amethyst Flask',
  'Quartz Flask',
  'Jade Flask',
  'Basalt Flask',
  'Aquamarine Flask',
  'Stibnite Flask',
  'Sulphur Flask',
  'Silver Flask',
  'Bismuth Flask',
  'Gold Flask',
  'Corundum Flask',
  'Iron Flask',
] as const

const FLASK_BASE_TYPES_LOWER_LONGEST_FIRST = [...FLASK_BASE_TYPES]
  .map(s => s.toLowerCase())
  .sort((a, b) => b.length - a.length)

function detectFlaskBaseTypeFromName(name: string): string | null {
  const n = name.toLowerCase().trim()
  if (!n) return null

  // Match por substring com fronteiras simples. Como as bases todas terminam em "flask",
  // isso evita falso positivo e mantém o custo baixo (48 itens).
  for (const base of FLASK_BASE_TYPES_LOWER_LONGEST_FIRST) {
    const idx = n.indexOf(base)
    if (idx === -1) continue

    const before = idx === 0 ? ' ' : n[idx - 1]
    const afterIdx = idx + base.length
    const after = afterIdx >= n.length ? ' ' : n[afterIdx]

    const okBefore = before === ' ' || before === '"' || before === "'" || before === '('
    const okAfter = after === ' ' || after === '"' || after === "'" || after === ')' || after === ',' || after === '.'

    if (okBefore && okAfter) return base
  }

  return null
}

function toTitleCaseBaseType(lowerBase: string): string {
  // `lowerBase` vem de FLASK_BASE_TYPES_LOWER_LONGEST_FIRST; retornamos o casing original.
  const found = FLASK_BASE_TYPES.find(b => b.toLowerCase() === lowerBase)
  return found ?? lowerBase
}

// Tinctures (PoE2) — lista de bases fornecida pelo usuário.
const TINCTURE_BASE_TYPES = [
  'Prismatic Tincture',
  'Rosethorn Tincture',
  'Ironwood Tincture',
  'Ashbark Tincture',
  'Borealwood Tincture',
  'Fulgurite Tincture',
  'Poisonberry Tincture',
  'Blood Sap Tincture',
  'Oakbranch Tincture',
  'Sporebloom Tincture',
] as const

const TINCTURE_BASE_TYPES_LOWER_LONGEST_FIRST = [...TINCTURE_BASE_TYPES]
  .map(s => s.toLowerCase())
  .sort((a, b) => b.length - a.length)

function detectTinctureBaseTypeFromName(name: string): string | null {
  const n = name.toLowerCase().trim()
  if (!n) return null

  for (const base of TINCTURE_BASE_TYPES_LOWER_LONGEST_FIRST) {
    const idx = n.indexOf(base)
    if (idx === -1) continue

    const before = idx === 0 ? ' ' : n[idx - 1]
    const afterIdx = idx + base.length
    const after = afterIdx >= n.length ? ' ' : n[afterIdx]

    const okBefore = before === ' ' || before === '"' || before === "'" || before === '('
    const okAfter = after === ' ' || after === '"' || after === "'" || after === ')' || after === ',' || after === '.'

    if (okBefore && okAfter) return base
  }

  return null
}

function parseItemText(rawLines: string[]): Omit<PobItem, 'slot' | 'iconUrl'> {
  if (!rawLines.length) {
    return { name: '', baseName: '', rarity: 'Normal', implicits: [], explicits: [] }
  }

  let rarity: string = 'Normal'
  let idx = 0
  let name = ''
  let baseName = ''

  if ((rawLines[0] || '').startsWith('Rarity:')) {
    // Formato completo com cabeçalho "Rarity: X"
    const rarityRaw = (rawLines[0] || '').replace('Rarity:', '').trim()
    rarity =
      (['Unique', 'Rare', 'Magic', 'Normal'].find(
        r => rarityRaw.toLowerCase() === r.toLowerCase(),
      ) || 'Normal')

    idx = 1

    if (rarity === 'Unique' || rarity === 'Rare') {
      name = rawLines[idx++] || ''
      baseName = rawLines[idx++] || ''
    } else if (rarity === 'Magic') {
      // Em muitos exports novos do PoB, itens mágicos seguem:
      //   linha 0: "Rarity: Magic"
      //   linha 1: nome mágico (ex: "Bountiful Eternal Life Flask")
      //   linha 2: base type (ex: "Eternal Life Flask")
      // Quando a segunda linha existir, usamos como baseName para bater com poe.ninja.
      name = rawLines[idx++] || ''
      baseName = rawLines[idx++] || name
    } else {
      // Normal
      name = rawLines[idx++] || ''
      baseName = name
    }

    // Mesmo no formato completo, algumas flasks/tinctures podem vir sem base type separado
    // (ou com base inesperada). Se detectar um base type conhecido no nome, preferimos ele.
    const detectedFlask = detectFlaskBaseTypeFromName(name)
    const detectedTincture = detectTinctureBaseTypeFromName(name)
    if (detectedTincture) {
      baseName = detectedTincture
    } else if (detectedFlask) {
      baseName = toTitleCaseBaseType(detectedFlask)
    }
  } else {
    // Formato "compacto" sem linha de raridade no topo, como:
    //   Bountiful Eternal Life Flask
    //   Crafted: true
    //   Prefix: ...
    //   Suffix: ...
    name = rawLines[0] || ''
    baseName = name
    idx = 1

    // Heurística simples de raridade: se tiver Prefix/Suffix diferente de None,
    // tratamos como Magic; senão deixamos como Normal.
    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i]
      if (line.startsWith('Prefix:') && !line.endsWith('None')) {
        rarity = 'Magic'
        break
      }
      if (line.startsWith('Suffix:') && !line.endsWith('None')) {
        rarity = 'Magic'
        break
      }
    }

    // Para flasks/tinctures no formato compacto, extraímos o base type do nome completo.
    // Ex.: "Bountiful Eternal Life Flask" -> "Eternal Life Flask"
    //      "Gold Flask of the Antelope"   -> "Gold Flask"
    //      "Horticultural Prismatic Tincture of Overpowering" -> "Prismatic Tincture"
    const detectedTincture = detectTinctureBaseTypeFromName(name)
    const detectedFlask = detectFlaskBaseTypeFromName(name)
    if (detectedTincture) {
      baseName = detectedTincture
    } else if (detectedFlask) {
      baseName = toTitleCaseBaseType(detectedFlask)
    }
  }

  let sockets: string | undefined
  let quality: number | undefined
  let itemLevel: number | undefined
  let armour: number | undefined
  let evasion: number | undefined
  let energyShield: number | undefined
  let corrupted = false
  let fractured = false
  const influences: string[] = []
  let implicitsCount = 0

  // Scan header lines until "Implicits:"
  while (idx < rawLines.length) {
    const line = rawLines[idx]
    if (line.startsWith('Implicits:')) {
      implicitsCount = Math.max(0, parseInt(line.split(':')[1]?.trim() || '0', 10))
      idx++
      break
    }
    if (line.startsWith('Sockets:')) {
      sockets = line.replace('Sockets:', '').trim()
    } else if (line.startsWith('Item Level:')) {
      itemLevel = parseInt(line.replace('Item Level:', '').trim(), 10) || undefined
    } else if (line.startsWith('Quality:')) {
      const m = line.match(/\+?(\d+)/)
      quality = m ? parseInt(m[1], 10) : undefined
    } else if (/^Armour:/i.test(line)) {
      const m = line.match(/(\d+)/)
      if (m) armour = parseInt(m[1], 10)
    } else if (/^Evasion(?: Rating)?:/i.test(line)) {
      // PoB pode exportar como "Evasion: 1663" ou "Evasion Rating: 1663"
      const m = line.match(/(\d+)/)
      if (m) evasion = parseInt(m[1], 10)
    } else if (/^Energy(?: Shield)?:/i.test(line) || /^EnergyShield:/i.test(line)) {
      // PoB pode exportar como "Energy Shield: X", "Energy: X" ou "EnergyShield: X"
      const m = line.match(/(\d+)/)
      if (m) energyShield = parseInt(m[1], 10)
    } else if (line === 'Corrupted') {
      corrupted = true
    } else if (line === 'Fractured Item') {
      fractured = true
    } else if (line.endsWith(' Item')) {
      const lower = line.toLowerCase()
      if (lower === 'shaper item') influences.push('shaper')
      else if (lower === 'elder item') influences.push('elder')
      else if (lower === 'crusader item') influences.push('crusader')
      else if (lower === 'redeemer item') influences.push('redeemer')
      else if (lower === 'hunter item') influences.push('hunter')
      else if (lower === 'warlord item') influences.push('warlord')
    }
    idx++
  }

  // Parse implicits (exactly implicitsCount lines)
  const implicits: ParsedMod[] = []
  for (let i = 0; i < implicitsCount && idx < rawLines.length; i++) {
    const line = rawLines[idx++]
    if (line) implicits.push(parseModLine(line, 'implicit'))
  }

  // Parse explicits (remaining lines)
  const explicits: ParsedMod[] = []
  while (idx < rawLines.length) {
    const line = rawLines[idx++]
    if (!line) continue
    if (line === 'Corrupted') { corrupted = true; continue }
    if (line === 'Fractured Item') { fractured = true; continue }
    if (line.endsWith(' Item')) {
      const lower = line.toLowerCase()
      if (lower === 'shaper item') influences.push('shaper')
      else if (lower === 'elder item') influences.push('elder')
      else if (lower === 'crusader item') influences.push('crusader')
      else if (lower === 'redeemer item') influences.push('redeemer')
      else if (lower === 'hunter item') influences.push('hunter')
      else if (lower === 'warlord item') influences.push('warlord')
      continue
    }
    if (NON_MOD_LINES.has(line)) continue
    if (line.startsWith('Note:')) continue
    explicits.push(parseModLine(line, 'explicit'))
  }

  return {
    name,
    baseName,
    rarity,
    sockets,
    quality,
    itemLevel,
    armour,
    evasion,
    energyShield,
    corrupted,
    fractured,
    influences,
    implicits,
    explicits,
  }
}

// --- Skilltree cache ---

let cachedSkilltree: Record<string, { name: string; isKeystone?: boolean; isMastery?: boolean }> | null = null

async function getOfficialSkilltree() {
  if (cachedSkilltree) return cachedSkilltree
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json',
      { headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' } },
    )
    if (!res.ok) return {}
    const data = await res.json()
    cachedSkilltree = data.nodes || {}
    return cachedSkilltree!
  } catch {
    return {}
  }
}

// --- Item icon cache (poe.ninja Standard league — uniques + base types) ---

let itemIconMap: Map<string, string> | null = null
let iconCacheExpiry = 0

// Unique types + BaseType covers equipment, flasks, jewels
const ICON_FETCH_TYPES = [
  'UniqueWeapon', 'UniqueArmour', 'UniqueAccessory', 'UniqueFlask', 'UniqueJewel',
  'BaseType',
]

async function getItemIconMap(): Promise<Map<string, string>> {
  const now = Date.now()
  if (itemIconMap && now < iconCacheExpiry) return itemIconMap

  const map = new Map<string, string>()
  await Promise.all(
    ICON_FETCH_TYPES.map(async type => {
      try {
        const res = await fetch(
          `https://poe.ninja/api/data/itemoverview?league=Standard&type=${type}`,
          { headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' } },
        )
        if (!res.ok) return
        const data = await res.json()
        for (const item of data.lines || []) {
          if (item.name && item.icon) {
            map.set((item.name as string).toLowerCase(), item.icon as string)
          }
        }
      } catch { /* ignore icon fetch errors */ }
    }),
  )

  itemIconMap = map
  iconCacheExpiry = now + 24 * 60 * 60 * 1000 // 24h TTL
  return map
}

// --- URL fetch ---

async function fetchPobFromUrl(url: string): Promise<string> {
  url = url.trim()
  try {
    if (url.includes('pobb.in')) {
      if (!url.includes('/pob/')) url = url.replace('pobb.in/', 'pobb.in/pob/')
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      return await res.text()
    }
    if (url.includes('pastebin.com')) {
      if (!url.includes('/raw/')) url = url.replace('pastebin.com/', 'pastebin.com/raw/')
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      return await res.text()
    }
  } catch {
    return ''
  }
  return url
}

// --- Main exports ---

export async function decodePobCode(pobCode: string): Promise<PobBuildData> {
  if (pobCode.trim().startsWith('http')) {
    const fetched = await fetchPobFromUrl(pobCode.trim())
    if (!fetched) throw new Error('Não foi possível baixar o PoB da URL fornecida.')
    pobCode = fetched
  }

  pobCode = pobCode.trim().replace(/-/g, '+').replace(/_/g, '/')
  const missing = pobCode.length % 4
  if (missing) pobCode += '='.repeat(4 - missing)

  const xmlBuffer = inflateSync(Buffer.from(pobCode, 'base64'))
  return parsePobXml(xmlBuffer.toString('utf-8'))
}

export async function parsePobXml(xmlString: string): Promise<PobBuildData> {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' })
  const doc = dom.window.document

  const result: PobBuildData = {
    BuildInfo: { Class: '', Ascendancy: '', Level: '' },
    Stats: {},
    ItemSets: [],
    SkillSets: [],
    Skills: [],
    TreeDetails: { Keystones: [], Masteries: [], NodesCount: 0 },
  }

  // --- 1. BuildInfo + Stats ---
  const buildNode = doc.querySelector('Build')
  if (buildNode) {
    result.BuildInfo = {
      Class: buildNode.getAttribute('className') || '',
      Ascendancy: buildNode.getAttribute('ascendClassName') || '',
      Level: buildNode.getAttribute('level') || '',
    }

    const statsKeys: Record<string, string> = {
      TotalDPS: 'Total DPS',
      TotalEHP: 'Effective Hit Pool',
      Life: 'Life',
      EnergyShield: 'Energy Shield',
      FireResist: 'Fire Resist',
      ColdResist: 'Cold Resist',
      LightningResist: 'Lightning Resist',
      ChaosResist: 'Chaos Resist',
      EffectiveMovementSpeedMod: 'Movement Speed',
    }

    for (const stat of Array.from(buildNode.querySelectorAll('PlayerStat')) as Element[]) {
      const statName = stat.getAttribute('stat') || ''
      if (statName in statsKeys) {
        const val = parseFloat(stat.getAttribute('value') || '0')
        let formatted: string
        if (val > 1000) {
          formatted = val.toLocaleString('en-US', { maximumFractionDigits: 0 })
        } else if (statName.endsWith('Resist')) {
          formatted = `${Math.round(val)}%`
        } else if (statName === 'EffectiveMovementSpeedMod') {
          formatted = `${val.toFixed(2)}x`
        } else {
          formatted = val.toLocaleString('en-US', { maximumFractionDigits: 0 })
        }
        result.Stats[statsKeys[statName]] = formatted
      }
    }
  }

  // --- 2. Items ---
  const itemsNode = doc.querySelector('Items')
  const rawItemMap: Record<string, string[]> = {}

  if (itemsNode) {
    for (const item of Array.from(itemsNode.querySelectorAll(':scope > Item')) as Element[]) {
      const id = item.getAttribute('id') || ''
      const rawText = item.textContent || ''
      rawItemMap[id] = rawText.trim().split('\n').map((l: string) => l.trim()).filter(Boolean)
    }

    // Fetch icons (unique + base types) in parallel with item parsing
    const iconMap = await getItemIconMap()

    for (const itemSet of Array.from(itemsNode.querySelectorAll('ItemSet')) as Element[]) {
      const iset: PobItemSet = {
        title: itemSet.getAttribute('title') || 'Default',
        items: [],
      }
      for (const slot of Array.from(itemSet.querySelectorAll('Slot')) as Element[]) {
        const idRef = slot.getAttribute('itemId') || ''
        if (idRef && rawItemMap[idRef]) {
          const parsed = parseItemText(rawItemMap[idRef])
          // Unique: look up by item name; others: look up by base type name.
          // Para flasks, garantimos que o base type usado é um dos 48 conhecidos.
          const detectedFlaskBaseLower = detectFlaskBaseTypeFromName(
            parsed.baseName || parsed.name,
          )

          const lookupCandidates: string[] = []
          if (parsed.rarity === 'Unique') {
            lookupCandidates.push(parsed.name.toLowerCase())
          } else if (detectedFlaskBaseLower) {
            lookupCandidates.push(toTitleCaseBaseType(detectedFlaskBaseLower).toLowerCase())
          } else {
            lookupCandidates.push(parsed.baseName.toLowerCase())
          }

          // Último fallback: para casos em que o item vem “compacto” e não temos baseName
          // correto, tentamos detectar via name diretamente.
          const detectedFromNameLower = detectFlaskBaseTypeFromName(parsed.name)
          if (detectedFromNameLower) {
            const key = toTitleCaseBaseType(detectedFromNameLower).toLowerCase()
            if (!lookupCandidates.includes(key)) lookupCandidates.push(key)
          }

          let iconUrl: string | undefined
          for (const key of lookupCandidates) {
            iconUrl = iconMap.get(key)
            if (iconUrl) break
          }

          iset.items.push({
            ...parsed,
            slot: slot.getAttribute('name') || '',
            iconUrl,
          })
        }
      }
      result.ItemSets.push(iset)
    }
  }

  // --- 3. Skills ---
  const skillsNode = doc.querySelector('Skills')
  if (skillsNode) {
    const activeSkillSetId = skillsNode.getAttribute('activeSkillSet') || '1'
    const skillSets = Array.from(skillsNode.querySelectorAll(':scope > SkillSet')) as Element[]
    const parseSkillElementsToGroups = (skillElements: Element[]): PobSkillGroup[] => {
      const groups: PobSkillGroup[] = []
      for (const skill of skillElements) {
        if (skill.getAttribute('source') || skill.getAttribute('enabled') === 'false') continue

        const slot = skill.getAttribute('slot') || 'Unspecified Slot'
        const gems: PobGem[] = []

        for (const gem of Array.from(skill.querySelectorAll('Gem')) as Element[]) {
          const gemName = gem.getAttribute('nameSpec') || ''
          if (!gemName) continue
          const isSupport =
            gemName.includes('Support') || (gem.getAttribute('skillId') || '').endsWith('Support')
          gems.push({
            name: gemName,
            level: parseInt(gem.getAttribute('level') || '1', 10),
            quality: parseInt(gem.getAttribute('quality') || '0', 10),
            is_support: isSupport,
          })
        }

        if (gems.length > 0) groups.push({ slot, gems })
      }
      return groups
    }

    if (skillSets.length > 0) {
      // Parseia TODOS os skill sets para permitir trocar junto com o loadout.
      for (const set of skillSets) {
        const id = set.getAttribute('id') || ''
        const title = set.getAttribute('title') || `Skill Set ${id || '?'}`
        const skills = parseSkillElementsToGroups(
          Array.from(set.querySelectorAll('Skill')),
        )
        result.SkillSets.push({ id: id || String(result.SkillSets.length + 1), title, skills })
      }
    } else {
      // Sem <SkillSet>: skills ficam diretamente sob <Skills>.
      const skills = parseSkillElementsToGroups(
        Array.from(skillsNode.querySelectorAll(':scope > Skill')),
      )
      result.SkillSets.push({ id: activeSkillSetId, title: 'Default', skills })
    }

    // Mantém compatibilidade: `Skills` continua sendo o set ativo (ou o primeiro).
    const activeSet =
      result.SkillSets.find(s => s.id === activeSkillSetId) ?? result.SkillSets[0]
    result.Skills = activeSet?.skills ?? []
  }

  // --- 4. Tree / Keystones / Masteries ---
  const treeNode = doc.querySelector('Tree')
  if (treeNode) {
    const activeSpec = treeNode.querySelector('Spec')
    if (activeSpec) {
      const nodesStr = activeSpec.getAttribute('nodes') || ''
      if (nodesStr) {
        const nodeIds = nodesStr.split(',').filter(Boolean)
        result.TreeDetails.NodesCount = nodeIds.length

        const skilltree = await getOfficialSkilltree()
        if (Object.keys(skilltree).length > 0) {
          const masterySet = new Set<string>()
          for (const nid of nodeIds) {
            const nodeData = skilltree[nid]
            if (!nodeData) continue
            if (nodeData.isKeystone) result.TreeDetails.Keystones.push(nodeData.name)
            else if (nodeData.isMastery) masterySet.add(nodeData.name)
          }
          result.TreeDetails.Masteries = Array.from(masterySet)
        }
      }
    }
  }

  return result
}
