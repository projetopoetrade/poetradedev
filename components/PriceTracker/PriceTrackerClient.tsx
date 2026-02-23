'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCurrency } from '@/lib/contexts/currency-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, ShoppingCart, ChevronUp, ChevronDown, ChevronsUpDown, Search, RefreshCw } from 'lucide-react'

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

interface ApiResponse {
  items: NormalizedItem[]
  meta: {
    game: string
    league: string
    category: string
    divineOrbPriceUSD: number
    fetchedAt: string
  }
}

type SortKey = 'name' | 'chaosValue' | 'divineValue' | 'estimatedUSD' | 'trend'
type SortDir = 'asc' | 'desc'

// ─── Configurações ────────────────────────────────────────────────────────────

const POE1_CATEGORIES = [
  { value: 'Currency', label: 'Currency' },
  { value: 'Fragment', label: 'Fragments' },
  { value: 'UniqueWeapon', label: 'Unique Weapons' },
  { value: 'UniqueArmour', label: 'Unique Armour' },
  { value: 'UniqueAccessory', label: 'Unique Accessories' },
  { value: 'UniqueFlask', label: 'Unique Flasks' },
  { value: 'UniqueJewel', label: 'Unique Jewels' },
  { value: 'DivinationCard', label: 'Divination Cards' },
  { value: 'SkillGem', label: 'Skill Gems' },
  { value: 'Essence', label: 'Essences' },
  { value: 'Scarab', label: 'Scarabs' },
]

const POE2_CATEGORIES = [
  { value: 'Currency', label: 'Currency' },
]

const ITEMS_PER_PAGE = 50

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChaos(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  if (value >= 100) return value.toFixed(0)
  return value.toFixed(2)
}

function formatDivine(value: number): string {
  if (value < 0.01) return '< 0.01'
  return value.toFixed(2)
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground inline ml-1" />
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3 inline ml-1" />
    : <ChevronDown className="h-3 w-3 inline ml-1" />
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/40">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

// ─── Trend Badge ──────────────────────────────────────────────────────────────

function TrendBadge({ sparkline }: { sparkline: NormalizedItem['sparkline'] }) {
  if (!sparkline) return <span className="text-muted-foreground text-xs">—</span>
  const change = sparkline.totalChange
  const isPositive = change >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  )
}

// ─── Row de tabela ────────────────────────────────────────────────────────────

function PriceRow({ item, currencyLabel, convertPrice, formatPrice }: {
  item: NormalizedItem
  currencyLabel: string
  convertPrice: (usd: number) => number
  formatPrice: (price: number) => string
}) {
  const convertedPrice = item.estimatedUSD > 0 ? convertPrice(item.estimatedUSD) : null
  const ourConverted = item.ourPriceUSD != null ? convertPrice(item.ourPriceUSD) : null
  const isCheaper = ourConverted != null && convertedPrice != null && ourConverted < convertedPrice

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center px-3 py-2.5 rounded-lg border border-border/30 hover:border-border/60 hover:bg-accent/20 transition-colors">
      {/* Item */}
      <div className="flex items-center gap-3 min-w-0">
        {item.icon ? (
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image
              src={item.icon}
              alt={item.name}
              fill
              sizes="32px"
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
        )}
        <div className="flex flex-col min-w-0">
          <Link
            href={item.weSellThis ? `/products/${encodeURIComponent(item.name.replace(/ /g, '-').toLowerCase())}` : `/tools/price-tracker/${encodeURIComponent(item.name.replace(/ /g, '-').toLowerCase())}`}
            className="text-sm font-medium truncate hover:underline"
            prefetch={false}
          >
            {item.name}
          </Link>
          {item.weSellThis && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 mt-0.5 w-fit hidden sm:inline-flex border-transparent ${item.inStock ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}
            >
              {item.inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
          )}
        </div>
      </div>

      {/* Chaos — oculto em mobile */}
      <span className="text-sm text-muted-foreground hidden sm:block">
        {formatChaos(item.chaosValue)}c
      </span>

      {/* Divine */}
      <span className="text-sm text-amber-400">
        {item.divineValue > 0 ? `${formatDivine(item.divineValue)}d` : '—'}
      </span>

      {/* Moeda estimada */}
      <div className="flex flex-col">
        {convertedPrice != null ? (
          <span className="text-sm font-medium">
            {formatPrice(convertedPrice)}
          </span>
        ) : <span className="text-muted-foreground text-sm">—</span>}
        {item.weSellThis && ourConverted != null && (
          <span className={`text-xs ${isCheaper ? 'text-green-400' : 'text-muted-foreground'}`}>
            Ours: {formatPrice(ourConverted)}
            {isCheaper && ' ↓'}
          </span>
        )}
      </div>

      {/* Trend — oculto em mobile */}
      <div className="hidden sm:block">
        <TrendBadge sparkline={item.sparkline} />
      </div>

      {/* Buy */}
      <div className="flex justify-end">
        {item.weSellThis ? (
          <Link
            href={`/products/${encodeURIComponent(item.name.replace(/ /g, '-').toLowerCase())}`}
            className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="h-3 w-3" />
            <span className="hidden sm:inline">Buy</span>
          </Link>
        ) : (
          <span className="w-[52px] sm:w-[62px]" />
        )}
      </div>
    </div>
  )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function PriceCard({ item, convertPrice, formatPrice }: {
  item: NormalizedItem
  convertPrice: (usd: number) => number
  formatPrice: (price: number) => string
}) {
  const convertedPrice = item.estimatedUSD > 0 ? convertPrice(item.estimatedUSD) : null
  const ourConverted = item.ourPriceUSD != null ? convertPrice(item.ourPriceUSD) : null
  const isCheaper = ourConverted != null && convertedPrice != null && ourConverted < convertedPrice

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-border/60 transition-colors">
      {item.icon ? (
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image src={item.icon} alt={item.name} fill sizes="40px" className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={item.weSellThis ? `/products/${encodeURIComponent(item.name.replace(/ /g, '-').toLowerCase())}` : `/tools/price-tracker/${encodeURIComponent(item.name.replace(/ /g, '-').toLowerCase())}`}
            className="text-sm font-medium truncate hover:underline"
            prefetch={false}
          >
            {item.name}
          </Link>
          {item.weSellThis && (
            <Badge
              variant="outline"
              className={`text-[9px] px-1 py-0 h-4 border-transparent ${item.inStock ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}
            >
              {item.inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.divineValue > 0 ? `${formatDivine(item.divineValue)}d` : `${formatChaos(item.chaosValue)}c`}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {convertedPrice != null && (
          <span className="text-sm font-semibold">{formatPrice(convertedPrice)}</span>
        )}
        {item.weSellThis && ourConverted != null && (
          <span className={`text-xs ${isCheaper ? 'text-green-400' : 'text-muted-foreground'}`}>
            Ours: {formatPrice(ourConverted)}
          </span>
        )}
      </div>
      {item.weSellThis && (
        <Link
          href={`/products/${encodeURIComponent(item.name.replace(/ /g, '-').toLowerCase())}`}
          className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-2.5 py-2 rounded-md transition-colors flex-shrink-0"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PriceTrackerClient({ labels }: {
  labels: {
    title: string
    subtitle: string
    searchPlaceholder: string
    chaos: string
    divine: string
    trend: string
    buy: string
    disclaimer: string
    loading: string
    noResults: string
    fetchedAt: string
    ourPrice: string
    page: string
    of: string
    prev: string
    next: string
  }
}) {
  const { currency, convertPrice, formatPrice } = useCurrency()

  const [game, setGame] = useState<'poe1' | 'poe2'>('poe1')
  const [league, setLeague] = useState('')
  const [category, setCategory] = useState('Currency')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('chaosValue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dynamicLeagues, setDynamicLeagues] = useState<{ poe1: { name: string, poe_ninja_name: string }[], poe2: { name: string, poe_ninja_name: string }[] }>({ poe1: [], poe2: [] })

  // Fetch leagues just once on mount
  useEffect(() => {
    async function fetchLeagues() {
      try {
        const res = await fetch('/api/tools/leagues')
        if (res.ok) {
          const json = await res.json()
          setDynamicLeagues(json)
          if (json.poe1.length > 0) setLeague(json.poe1[0].name)
        }
      } catch (err) {
        console.error('Failed to load leagues', err)
      }
    }
    fetchLeagues()
  }, [])

  const leaguesList = game === 'poe1' ? dynamicLeagues.poe1 : dynamicLeagues.poe2
  const categories = game === 'poe1' ? POE1_CATEGORIES : POE2_CATEGORIES

  const fetchData = useCallback(async () => {
    if (!league) return // wait until a league is set
    setLoading(true)
    setError(null)
    setPage(1)

    // Encontrar o poe_ninja_name exato da liga atual
    const currentLeagueData = leaguesList.find(l => l.name === league)
    const ninjaLeagueName = currentLeagueData?.poe_ninja_name || currentLeagueData?.name || league

    console.log('[PriceTrackerClient] Fetching for League:', league, '-> poe_ninja_name:', ninjaLeagueName)

    try {
      const params = new URLSearchParams({ game, league: ninjaLeagueName, category })
      const res = await fetch(`/api/tools/prices?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json: ApiResponse = await res.json()
      setData(json)
    } catch {
      setError('Failed to load prices. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [game, league, category])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Ao mudar de jogo, reset league e category
  useEffect(() => {
    if (game === 'poe1') {
      const firstL = dynamicLeagues.poe1[0]
      if (firstL) setLeague(firstL.name)
      setCategory('Currency')
    } else {
      const firstL = dynamicLeagues.poe2[0]
      if (firstL) setLeague(firstL.name)
      setCategory('Currency')
    }
  }, [game, dynamicLeagues])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!data) return []
    let items = [...data.items]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q))
    }
    items.sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      switch (sortKey) {
        case 'name': va = a.name; vb = b.name; break
        case 'chaosValue': va = a.chaosValue; vb = b.chaosValue; break
        case 'divineValue': va = a.divineValue; vb = b.divineValue; break
        case 'estimatedUSD': va = a.estimatedUSD; vb = b.estimatedUSD; break
        case 'trend':
          va = a.sparkline?.totalChange ?? 0
          vb = b.sparkline?.totalChange ?? 0
          break
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return items
  }, [data, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const currencyLabel = currency

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Game toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setGame('poe1')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${game === 'poe1' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-accent'}`}
          >
            PoE 1
          </button>
          <button
            onClick={() => setGame('poe2')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${game === 'poe2' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-accent'}`}
          >
            PoE 2
          </button>
        </div>

        {/* League */}
        <Select value={league} onValueChange={setLeague}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="League" />
          </SelectTrigger>
          <SelectContent>
            {leaguesList.map(l => (
              <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={labels.searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Refresh */}
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} title="Refresh prices">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Tabela — desktop */}
      <div className="hidden sm:block">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{labels.noResults}</div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <button className="text-left hover:text-foreground flex items-center" onClick={() => handleSort('name')}>
                Item <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className="text-left hover:text-foreground flex items-center" onClick={() => handleSort('chaosValue')}>
                {labels.chaos} <SortIcon col="chaosValue" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className="text-left hover:text-foreground flex items-center" onClick={() => handleSort('divineValue')}>
                {labels.divine} <SortIcon col="divineValue" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className="text-left hover:text-foreground flex items-center" onClick={() => handleSort('estimatedUSD')}>
                ~{currencyLabel} <SortIcon col="estimatedUSD" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className="text-left hover:text-foreground flex items-center" onClick={() => handleSort('trend')}>
                {labels.trend} <SortIcon col="trend" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <span className="text-right">{labels.buy}</span>
            </div>

            <div className="space-y-1">
              {paginated.map((item, i) => (
                <PriceRow
                  key={`${item.name}-${i}`}
                  item={item}
                  currencyLabel={currencyLabel}
                  convertPrice={convertPrice}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="sm:hidden">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{labels.noResults}</div>
        ) : (
          <div className="space-y-2">
            {paginated.map((item, i) => (
              <PriceCard
                key={`${item.name}-${i}`}
                item={item}
                convertPrice={convertPrice}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paginação */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {labels.page} {page} {labels.of} {totalPages}
            {' '}({filtered.length} items)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              {labels.prev}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              {labels.next}
            </Button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {data && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{labels.disclaimer}</p>
          <p className="text-xs text-muted-foreground">
            {labels.fetchedAt}: {new Date(data.meta.fetchedAt).toLocaleString()}
            {' '}· Divine Orb = ${data.meta.divineOrbPriceUSD.toFixed(2)} USD
          </p>
        </div>
      )}
    </div>
  )
}
