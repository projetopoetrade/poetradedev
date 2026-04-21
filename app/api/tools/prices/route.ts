import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getEngineApiBase } from '@/lib/placeholders/engine'

export const revalidate = 3600 // 1 hora

const ENGINE_TIMEOUT_MS = 5000

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NormalizedItem {
  name: string
  icon: string
  category: string
  chaosValue: number
  divineValue: number
  estimatedUSD: number
  sparkline: { data: number[]; totalChange: number } | null
  listingCount: number | null
  detailsId: string
  weSellThis: boolean
  inStock: boolean
  ourPriceUSD: number | null
}

// ─── Helpers poe.ninja ────────────────────────────────────────────────────────

const POE1_BASE = 'https://poe.ninja/api/data'
const POE1_EXCHANGE_BASE = 'https://poe.ninja/poe1/api/economy/exchange'
const POE2_BASE = 'https://poe.ninja/poe2/api/economy'

const POE1_ENDPOINTS: Record<string, { path: string; type: 'currency' | 'item' }> = {
  Currency: { path: 'currencyoverview', type: 'currency' },
  Fragment: { path: 'currencyoverview', type: 'currency' },
  UniqueWeapon: { path: 'itemoverview', type: 'item' },
  UniqueArmour: { path: 'itemoverview', type: 'item' },
  UniqueAccessory: { path: 'itemoverview', type: 'item' },
  UniqueFlask: { path: 'itemoverview', type: 'item' },
  UniqueJewel: { path: 'itemoverview', type: 'item' },
  DivinationCard: { path: 'itemoverview', type: 'item' },
  SkillGem: { path: 'itemoverview', type: 'item' },
  Essence: { path: 'itemoverview', type: 'item' },
  Scarab: { path: 'itemoverview', type: 'item' },
}

async function fetchPoeNinja(
  game: 'poe1' | 'poe2',
  league: string,
  category: string
): Promise<NormalizedItem[]> {
  // PoE 1 Currency: exchange overview (preços baseados em trades reais, não stash)
  if (game === 'poe1' && category === 'Currency') {
    const url = `${POE1_EXCHANGE_BASE}/current/overview?league=${encodeURIComponent(league)}&type=Currency`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' },
    })
    if (!res.ok) return []
    const data = await res.json()

    const itemMap: Record<string, { name: string; image: string; detailsId: string }> = {}
    for (const it of data.items || []) {
      itemMap[it.id] = { name: it.name, image: it.image || '', detailsId: it.detailsId || it.id }
    }

    return (data.lines || []).map((line: any) => {
      const meta = itemMap[line.id] || { name: line.id, image: '', detailsId: line.id }
      return {
        name: meta.name,
        icon: meta.image,
        category,
        chaosValue: line.primaryValue ?? 1,
        divineValue: 0,
        estimatedUSD: 0,
        sparkline: line.sparkline
          ? { data: line.sparkline.data || [], totalChange: line.sparkline.totalChange ?? 0 }
          : null,
        listingCount: line.volumePrimaryValue ?? null,
        detailsId: meta.detailsId,
        weSellThis: false,
        inStock: false,
        ourPriceUSD: null,
      }
    })
  }

  let url: string

  if (game === 'poe2') {
    url = `${POE2_BASE}/currencyexchange/overview?leagueName=${encodeURIComponent(league)}&overviewName=Currency`
  } else {
    const endpoint = POE1_ENDPOINTS[category]
    if (!endpoint) return []
    const typeParam = endpoint.type === 'currency' ? 'type' : 'type'
    url = `${POE1_BASE}/${endpoint.path}?league=${encodeURIComponent(league)}&${typeParam}=${category}`
  }

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' },
  })

  if (!res.ok) return []
  const data = await res.json()

  // PoE 2 currency format
  if (game === 'poe2') {
    const items: NormalizedItem[] = []
    const lines: Array<{ id: number; primaryValue: number; volumePrimaryValue?: number }> = data.lines || []
    const itemMap: Record<number, { name: string; icon: string; tradeId: string }> = {}
    for (const it of data.items || []) {
      itemMap[it.id] = { name: it.name, icon: it.icon || '', tradeId: it.tradeId || '' }
    }
    for (const line of lines) {
      const meta = itemMap[line.id]
      if (!meta) continue
      items.push({
        name: meta.name,
        icon: meta.icon,
        category: 'Currency',
        chaosValue: line.primaryValue,
        divineValue: 0, // calculado depois
        estimatedUSD: 0,
        sparkline: null,
        listingCount: line.volumePrimaryValue ?? null,
        detailsId: meta.tradeId,
        weSellThis: false,
        inStock: false,
        ourPriceUSD: null,
      })
    }
    return items
  }

  // PoE 1 currencyoverview
  if (POE1_ENDPOINTS[category]?.type === 'currency') {
    const iconMap: Record<string, string> = {}
    for (const d of data.currencyDetails || []) {
      iconMap[d.name] = d.icon || ''
    }
    const items: NormalizedItem[] = []
    for (const line of data.lines || []) {
      items.push({
        name: line.currencyTypeName,
        icon: iconMap[line.currencyTypeName] || '',
        category,
        chaosValue: line.chaosEquivalent ?? 1,
        divineValue: 0,
        estimatedUSD: 0,
        sparkline: line.receiveSparkLine
          ? { data: line.receiveSparkLine.data || [], totalChange: line.receiveSparkLine.totalChange ?? 0 }
          : null,
        listingCount: null,
        detailsId: line.tradeId || line.currencyTypeName.toLowerCase().replace(/ /g, '-'),
        weSellThis: false,
        inStock: false,
        ourPriceUSD: null,
      })
    }
    return items
  }

  // PoE 1 itemoverview
  const items: NormalizedItem[] = []
  for (const line of data.lines || []) {
    items.push({
      name: line.name,
      icon: line.icon || '',
      category,
      chaosValue: line.chaosValue ?? 0,
      divineValue: line.divineValue ?? 0,
      estimatedUSD: 0,
      sparkline: line.sparkline
        ? { data: line.sparkline.data || [], totalChange: line.sparkline.totalChange ?? 0 }
        : null,
      listingCount: line.listingCount ?? null,
      detailsId: line.detailsId || line.name.toLowerCase().replace(/ /g, '-'),
      weSellThis: false,
      inStock: false,
      ourPriceUSD: null,
    })
  }
  return items
}

// ─── Engine fetch (Fase 2) ────────────────────────────────────────────────────

async function fetchFromEngine(
  game: 'poe1' | 'poe2',
  league: string,
  category: string
): Promise<NormalizedItem[] | null> {
  const base = getEngineApiBase()
  if (!base) return null

  const path = game === 'poe2' ? `ninja/poe2/prices/${category}` : `ninja/prices/${category}`
  const url = `${base}/${path}?league=${encodeURIComponent(league)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const items = Array.isArray(data?.items) ? data.items : []
    if (items.length === 0) return null
    return items.map((it: any) => ({
      name: it.name,
      icon: it.icon || '',
      category,
      chaosValue: it.chaosValue ?? 0,
      divineValue: it.divineValue ?? 0,
      estimatedUSD: 0,
      sparkline: it.sparkline?.data
        ? { data: it.sparkline.data, totalChange: it.sparkline.totalChange ?? 0 }
        : null,
      listingCount: it.listingCount ?? null,
      detailsId: it.detailsId || it.name?.toLowerCase().replace(/ /g, '-') || '',
      weSellThis: false,
      inStock: false,
      ourPriceUSD: null,
    }))
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const game = (searchParams.get('game') || 'poe1') as 'poe1' | 'poe2'
  const league = searchParams.get('league') || 'Settlers'
  const category = searchParams.get('category') || 'Currency'

  const useEngine = process.env.USE_ENGINE_PRICES === '1'
  const t0 = Date.now()
  let source: 'engine' | 'ninja-direct' = 'ninja-direct'

  try {
    // 1. Buscar dados — engine primeiro (se flag ON), fallback poe.ninja em qualquer falha
    let rawItems: NormalizedItem[] = []
    if (useEngine) {
      const fromEngine = await fetchFromEngine(game, league, category)
      if (fromEngine && fromEngine.length > 0) {
        source = 'engine'
        rawItems = fromEngine
      }
    }
    if (rawItems.length === 0) {
      rawItems = await fetchPoeNinja(game, league, category)
    }

    console.info('[/api/tools/prices]', {
      source,
      durationMs: Date.now() - t0,
      game,
      league,
      category,
      count: rawItems.length,
    })

    // 2. Buscar Divine Orb price e products do Supabase
    const supabase = await createClient()
    const { data: divineProducts } = await supabase
      .from('products')
      .select('name, price, slug')
      .ilike('name', '%divine orb%')
      .eq('gameVersion', game === 'poe1' ? 'path-of-exile-1' : 'path-of-exile-2')
      .limit(1)

    const divineOrbPriceUSD: number = divineProducts?.[0]?.price ?? 0.15

    // Também pegar todos os produtos que vendemos para marcar weSellThis e inStock
    const { data: allProducts } = await supabase
      .from('products')
      .select('name, price, slug, in_stock')
      .eq('gameVersion', game === 'poe1' ? 'path-of-exile-1' : 'path-of-exile-2')

    const productMap = new Map<string, { price: number; slug: string; inStock: boolean }>()
    for (const p of allProducts || []) {
      productMap.set(p.name.toLowerCase(), { price: p.price, slug: p.slug, inStock: p.in_stock ?? false })
    }

    // 3. Para currencyoverview (PoE 1), calcular divineValue
    // Primeiro, tentar pegar chaos value do Divine Orb nos items
    let divineInChaos = 0
    for (const item of rawItems) {
      if (item.name === 'Divine Orb' && item.chaosValue > 0) {
        divineInChaos = item.chaosValue
        break
      }
    }

    // 4. Enriquecer items
    const enriched: NormalizedItem[] = rawItems.map((item) => {
      // Calcular divineValue se vier de currencyoverview (onde divineValue = 0)
      let divineValue = item.divineValue
      if (divineValue === 0 && divineInChaos > 0) {
        divineValue = item.chaosValue / divineInChaos
      }

      // estimatedUSD = divineValue × preço do Divine Orb em USD
      const estimatedUSD = divineValue > 0 ? divineValue * divineOrbPriceUSD : 0

      // weSellThis e inStock
      const productEntry = productMap.get(item.name.toLowerCase())
      const weSellThis = !!productEntry
      const inStock = productEntry ? productEntry.inStock : false
      const ourPriceUSD = productEntry ? productEntry.price : null

      return {
        ...item,
        icon: item.icon?.startsWith('/') ? `https://web.poecdn.com${item.icon}` : item.icon,
        divineValue,
        estimatedUSD,
        weSellThis,
        inStock,
        ourPriceUSD,
      }
    })

    // 5. Metadados úteis pro frontend
    const meta = {
      game,
      league,
      category,
      divineOrbPriceUSD,
      fetchedAt: new Date().toISOString(),
    }

    return NextResponse.json({ items: enriched, meta })
  } catch (error) {
    console.error('[/api/tools/prices] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
