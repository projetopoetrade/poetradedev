'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Menu,
  ChevronDown,
  Coins,
  ShoppingBag,
  BarChart2,
  Sword,
  Search,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import CartDropdown from '@/components/cart-dropdown'
import { SearchModal } from './search-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { MobileAuthSection } from './mobile-auth-section'

// ─── Navigation structure ─────────────────────────────────────────────────────

type SubItem = {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

type NavItem =
  | { label: string; items: SubItem[]; href?: never }
  | { label: string; href: string; items?: never }

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Buy Currency',
    items: [
      {
        label: 'PoE 2 Currency',
        href: '/games/path-of-exile-2/currency',
        icon: <Coins className="h-4 w-4" />,
      },
      {
        label: 'PoE 1 Currency',
        href: '/games/path-of-exile-1/currency',
        icon: <Coins className="h-4 w-4" />,
      },
      {
        label: 'All Products',
        href: '/products',
        icon: <ShoppingBag className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Price Tracker',
        href: '/tools/price-tracker',
        icon: <BarChart2 className="h-4 w-4" />,
        badge: 'Live',
      },
      {
        label: 'PoB Viewer',
        href: '/tools/pob-viewer',
        icon: <Sword className="h-4 w-4" />,
        badge: 'New',
      },
    ],
  },
  {
    label: 'Blog',
    href: '/blog',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  locale?: string
  desktopAuth: React.ReactNode
}

export function SiteNavbar({ desktopAuth }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleMobileSection = (label: string) => {
    setMobileExpanded((prev) => (prev === label ? null : label))
  }

  return (
    <>
      {/* Accessibility skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ── Main nav bar ── */}
      <nav
        aria-label="Main navigation"
        className={[
          'w-full fixed top-0 left-0 right-0 z-50 h-16',
          'backdrop-blur-xl bg-background/70 supports-[backdrop-filter]:bg-background/70',
          'border-b border-border/50 transition-shadow duration-200',
          scrolled ? 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.45)]' : '',
        ].join(' ')}
      >
        <div className="mx-auto w-full max-w-6xl h-full px-6 flex items-center justify-between relative">

          {/* Left: hamburger (mobile) + search + nav links (desktop) */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {NAV_ITEMS.map((item) =>
              item.items ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:inline-flex gap-1.5 text-sm text-foreground/75 hover:text-foreground font-medium"
                    >
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={8} className="w-52">
                    <DropdownMenuGroup>
                      {item.items.map((sub) => (
                        <DropdownMenuItem key={sub.href} asChild>
                          <Link
                            href={sub.href}
                            className="flex items-center gap-2.5 cursor-pointer w-full"
                          >
                            <span className="text-muted-foreground shrink-0">{sub.icon}</span>
                            <span className="flex-1">{sub.label}</span>
                            {sub.badge && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden md:inline-flex text-sm text-foreground/75 hover:text-foreground font-medium"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              )
            )}

          </div>

          {/* Center: Logo — absolutely centered in the bar */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 translate-y-1 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
          >
            <Image
              src="/images/logo.webp"
              alt="Path of Trade"
              width={120}
              height={40}
              priority
              sizes="120px"
              quality={90}
              className="block"
            />
          </Link>

          {/* Right: Search + Cart + auth */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <CartDropdown />
            <div className="hidden md:flex items-center gap-2">
              {desktopAuth}
            </div>
          </div>
        </div>
      </nav>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* ── Mobile Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col gap-0">
          {/* Header with logo */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/50">
            <SheetTitle asChild>
              <Link href="/" onClick={() => setSheetOpen(false)}>
                <Image
                  src="/images/logo.webp"
                  alt="Path of Trade"
                  width={100}
                  height={34}
                  quality={90}
                />
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

            {/* Nav sections */}
            {NAV_ITEMS.map((item) =>
              item.items ? (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleMobileSection(item.label)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground/85 hover:text-foreground hover:bg-accent/40 rounded-lg transition-colors"
                    aria-expanded={mobileExpanded === item.label}
                  >
                    {item.label}
                    <ChevronDown
                      className={[
                        'h-4 w-4 opacity-50 transition-transform duration-200',
                        mobileExpanded === item.label ? 'rotate-180' : '',
                      ].join(' ')}
                    />
                  </button>

                  {mobileExpanded === item.label && (
                    <div className="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-border/40 pl-3">
                      {item.items.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-2.5 px-2 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent/40 rounded-md transition-colors"
                        >
                          <span className="text-muted-foreground/70 shrink-0">{sub.icon}</span>
                          <span className="flex-1">{sub.label}</span>
                          {sub.badge && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/85 hover:text-foreground hover:bg-accent/40 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}

            <Separator className="my-3" />

            {/* Auth + settings section */}
            <MobileAuthSection onClose={() => setSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
