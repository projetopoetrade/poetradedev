'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { Search, X, Loader2, ShoppingBag, FileText, Trophy, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchProduct {
  name: string
  slug: string
  category: string
  imgUrl: string
  price: number
  gameVersion: string
  in_stock: boolean
}

interface SearchPost {
  title: string
  slug: string
  metadata: string
  imageUrl?: string
  publishedAt: string
}

interface SearchLeague {
  title: string
  slug: string
  gameVersion: string
  status: 'announced' | 'live' | 'ended'
  imageUrl?: string
}

interface SearchResults {
  products: SearchProduct[]
  posts: SearchPost[]
  leagues: SearchLeague[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  live: 'Live',
  announced: 'Coming',
  ended: 'Ended',
}

const STATUS_COLOR: Record<string, string> = {
  live: 'bg-green-500/15 text-green-400 border-green-500/30',
  announced: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ended: 'bg-muted text-muted-foreground',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: Props) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalResults = results
    ? results.products.length + results.posts.length + results.leagues.length
    : 0

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults(null)
        setSearched(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`)
        const data: SearchResults = await res.json()
        setResults(data)
        setSearched(true)
      } catch {
        setResults({ products: [], posts: [], leagues: [] })
        setSearched(true)
      } finally {
        setLoading(false)
      }
    },
    [locale]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Focus input when modal opens, reset when closed
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults(null)
      setSearched(false)
    }
  }, [open])

  const navigate = (href: string) => {
    onOpenChange(false)
    router.push(href as any)
  }

  const hasResults = results && totalResults > 0
  const isEmpty = searched && totalResults === 0 && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, blog, leagues…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Idle state */}
          {!searched && !loading && query.length < 2 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Search className="h-8 w-8 opacity-20" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          )}

          {hasResults && (
            <div className="py-2">

              {/* Products */}
              {results.products.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Products
                    </span>
                  </div>
                  {results.products.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => navigate(`/products/${p.name}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left group"
                    >
                      {p.imgUrl && (
                        <div className="shrink-0 w-8 h-8 rounded overflow-hidden bg-muted">
                          <Image
                            src={p.imgUrl}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!p.in_stock && (
                          <span className="text-[10px] text-muted-foreground">Out of stock</span>
                        )}
                        <span className="text-sm font-medium text-primary">
                          ${p.price.toFixed(2)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Blog */}
              {results.posts.length > 0 && (
                <>
                  {results.products.length > 0 && <Separator className="my-1" />}
                  <section>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Blog
                      </span>
                    </div>
                    {results.posts.map((post) => (
                      <button
                        key={post.slug}
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {post.title}
                          </p>
                          {post.metadata && (
                            <p className="text-xs text-muted-foreground truncate">{post.metadata}</p>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </section>
                </>
              )}

              {/* Leagues */}
              {results.leagues.length > 0 && (
                <>
                  {(results.products.length > 0 || results.posts.length > 0) && (
                    <Separator className="my-1" />
                  )}
                  <section>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Leagues
                      </span>
                    </div>
                    {results.leagues.map((league) => (
                      <button
                        key={league.slug}
                        onClick={() =>
                          navigate(`/games/${league.gameVersion}/league/${league.slug}`)
                        }
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {league.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {league.gameVersion === 'path-of-exile-2' ? 'PoE 2' : 'PoE 1'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[league.status]}`}
                          >
                            {STATUS_LABEL[league.status]}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </section>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {hasResults && (
          <div className="border-t border-border/60 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> to close
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
