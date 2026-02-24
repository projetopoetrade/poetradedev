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

export interface PobItem {
  slot: string
  name: string       // display name: custom name for rare/unique, modified name for magic, base for normal
  baseName: string   // base type
  rarity: string
  sockets?: string   // e.g. "R-G-B-R" or "R-G G-B" (space = separate group)
  quality?: number
  itemLevel?: number
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

function parseItemText(rawLines: string[]): Omit<PobItem, 'slot' | 'iconUrl'> {
  if (!rawLines.length) {
    return { name: '', baseName: '', rarity: 'Normal', implicits: [], explicits: [] }
  }

  // Line 0: "Rarity: X"
  const rarityRaw = (rawLines[0] || '').replace('Rarity:', '').trim()
  const rarity =
    (['Unique', 'Rare', 'Magic', 'Normal'].find(
      r => rarityRaw.toLowerCase() === r.toLowerCase(),
    ) || 'Normal')

  let idx = 1
  let name = ''
  let baseName = ''

  if (rarity === 'Unique' || rarity === 'Rare') {
    name = rawLines[idx++] || ''
    baseName = rawLines[idx++] || ''
  } else if (rarity === 'Magic') {
    name = rawLines[idx++] || ''
    baseName = name
  } else {
    // Normal
    name = rawLines[idx++] || ''
    baseName = name
  }

  let sockets: string | undefined
  let quality: number | undefined
  let itemLevel: number | undefined
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

    for (const stat of Array.from(buildNode.querySelectorAll('PlayerStat'))) {
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
    for (const item of Array.from(itemsNode.querySelectorAll(':scope > Item'))) {
      const id = item.getAttribute('id') || ''
      const rawText = item.textContent || ''
      rawItemMap[id] = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    }

    // Fetch icons (unique + base types) in parallel with item parsing
    const iconMap = await getItemIconMap()

    for (const itemSet of Array.from(itemsNode.querySelectorAll('ItemSet'))) {
      const iset: PobItemSet = {
        title: itemSet.getAttribute('title') || 'Default',
        items: [],
      }
      for (const slot of Array.from(itemSet.querySelectorAll('Slot'))) {
        const idRef = slot.getAttribute('itemId') || ''
        if (idRef && rawItemMap[idRef]) {
          const parsed = parseItemText(rawItemMap[idRef])
          // Unique: look up by item name; others: look up by base type name
          const lookupKey =
            parsed.rarity === 'Unique'
              ? parsed.name.toLowerCase()
              : parsed.baseName.toLowerCase()
          iset.items.push({
            ...parsed,
            slot: slot.getAttribute('name') || '',
            iconUrl: iconMap.get(lookupKey),
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
    const skillSets = Array.from(skillsNode.querySelectorAll(':scope > SkillSet'))
    let targetSkills: Element[]

    if (skillSets.length > 0) {
      const activeSet = skillSets.find(s => s.getAttribute('id') === activeSkillSetId)
      targetSkills = Array.from((activeSet || skillSets[0]).querySelectorAll('Skill'))
    } else {
      targetSkills = Array.from(skillsNode.querySelectorAll(':scope > Skill'))
    }

    for (const skill of targetSkills) {
      if (skill.getAttribute('source') || skill.getAttribute('enabled') === 'false') continue

      const slot = skill.getAttribute('slot') || 'Unspecified Slot'
      const gems: PobGem[] = []

      for (const gem of Array.from(skill.querySelectorAll('Gem'))) {
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

      if (gems.length > 0) result.Skills.push({ slot, gems })
    }
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
