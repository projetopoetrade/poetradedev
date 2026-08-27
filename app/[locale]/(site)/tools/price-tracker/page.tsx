import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildCanonical, buildAbsoluteUrl, buildBreadcrumbSchema, getOgLocale } from '@/lib/utils'
import PriceTrackerClient from '@/components/PriceTracker/PriceTrackerClient'
import { CurrencyCtaSection } from '@/components/currency-cta-section'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { createPublicClient } from '@/utils/supabase/public'
import { getCurrencyIndexLinks } from '@/lib/price-tracker-items'

export const revalidate = 3600

type FaqItem = { q: string; a: string }

function buildFaq(isPt: boolean): FaqItem[] {
  if (isPt) {
    return [
      {
        q: 'Com que frequência os preços atualizam?',
        a: 'Do poe.ninja, cacheados por 1 hora. O timestamp da tabela é esse snapshot, não um feed ao vivo.',
      },
      {
        q: 'De onde vêm os preços?',
        a: 'poe.ninja. A gente retransmite esse snapshot. Não rodamos feed próprio de economia.',
      },
      {
        q: 'Como o preço em USD/BRL é calculado?',
        a: 'Divine value do item no poe.ninja × preço de Divine Orb da nossa loja. Mesma fórmula pro BRL. Não é FX de banco. Se o preço de Divine da loja estiver faltando, USD/BRL não preenche.',
      },
      {
        q: 'Dá pra comprar item nesta página?',
        a: 'Só o que a Path of Trade tem em estoque. Buy abre a página do produto. O resto é só preço.',
      },
      {
        q: 'Essa página mostra price history?',
        a: 'Não. Este hub é o snapshot horário. Price history fica nas páginas de item. Não tem gráfico de history aqui.',
      },
    ]
  }
  return [
    {
      q: 'How often are prices updated?',
      a: 'From poe.ninja, cached for 1 hour. The timestamp on the table is that snapshot, not a live feed.',
    },
    {
      q: 'Where do prices come from?',
      a: 'poe.ninja. We rebroadcast that snapshot. We do not run our own economy feed.',
    },
    {
      q: 'How is the USD/BRL price calculated?',
      a: "Item divine value from poe.ninja × our store Divine Orb price. Same formula for BRL. Not a bank FX rate. If the store Divine price is missing, USD/BRL will not fill.",
    },
    {
      q: 'Can I buy items from this page?',
      a: 'Only items Path of Trade stocks. Buy opens the product page. Everything else is price-only.',
    },
    {
      q: 'Does this page show price history?',
      a: 'No. This hub is the hourly snapshot. Price history is on item pages. There is no history chart here.',
    },
  ]
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const isPt = locale === 'pt-br'

  const canonicalUrl = buildCanonical('/tools/price-tracker', locale)
  const enUrl = buildAbsoluteUrl('/tools/price-tracker')
  const ptUrl = buildAbsoluteUrl('/pt-br/tools/price-tracker')

  const title = isPt
    ? 'Tracker de Preços PoE — Currency e Itens Únicos | Path of Trade'
    : 'PoE Price Tracker — Currency & Unique Item Prices | Path of Trade'
  const description = isPt
    ? 'Price Tracker de PoE 1 pra currency e uniques. Snapshot horário do poe.ninja, em chaos, divine, USD e BRL. Compre as orbs que a Path of Trade tem em estoque.'
    : 'PoE 1 price checker for currency and uniques. Hourly snapshot from poe.ninja, in chaos, divine, USD and BRL. Buy the orbs Path of Trade stocks.'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      ...getOgLocale(locale),
      siteName: 'Path of Trade',
      images: [{ url: '/images/logo.webp', alt: 'Path of Trade' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/logo.webp'],
    },
  }
}

export default async function PriceTrackerPage(props: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const isPt = locale === 'pt-br'

  // createPublicClient e não createClient: o client de server lê cookies(), o
  // que forçaria render dinâmico e derrubaria em silêncio o revalidate = 3600
  // desta página.
  const supabase = createPublicClient()
  const { data: soldProducts } = await supabase
    .from('products')
    .select('name, url_slug')
    .eq('gameVersion', 'path-of-exile-1')
  const currencyLinks = getCurrencyIndexLinks(soldProducts || [])

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: isPt ? 'Início' : 'Home', url: '/' },
    { name: isPt ? 'Ferramentas' : 'Tools', url: '/tools' },
    { name: isPt ? 'Tracker de Preços' : 'Price Tracker', url: '/tools/price-tracker' },
  ])

  const faqItems = buildFaq(isPt)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  // WebApplication sem offers: price:0 = claim de "free". Mesma regra do PoB Viewer.
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PoE Price Tracker',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net'}/tools/price-tracker`,
    applicationCategory: 'GameApplication',
  }

  const labels = {
    title: isPt ? 'Tracker de Preços PoE' : 'PoE Price Tracker',
    subtitle: isPt
      ? 'Um Price Tracker de PoE 1. Snapshot horário do poe.ninja. Chaos, divine e fiat pela nossa taxa de Divine.'
      : 'A PoE 1 price checker. Hourly snapshot from poe.ninja. Chaos, divine, and fiat via our Divine rate.',
    searchPlaceholder: isPt ? 'Buscar items por nome...' : 'Search items by name...',
    chaos: 'Chaos',
    divine: 'Divine',
    trend: isPt ? 'Tendência' : 'Trend',
    buy: isPt ? 'Comprar' : 'Buy',
    disclaimer: isPt
      ? '* Valores estimados com base na taxa de câmbio do Divine Orb. Preços reais podem variar.'
      : '* Estimated values based on Divine Orb market rate. Actual prices may vary.',
    loading: isPt ? 'Carregando preços...' : 'Loading prices...',
    noResults: isPt ? 'Nenhum item encontrado.' : 'No items found.',
    fetchedAt: isPt ? 'Atualizado em' : 'Last updated',
    ourPrice: isPt ? 'Nosso preço' : 'Our price',
    page: isPt ? 'Página' : 'Page',
    of: isPt ? 'de' : 'of',
    prev: isPt ? 'Anterior' : 'Previous',
    next: isPt ? 'Próximo' : 'Next',
    game: isPt ? 'Versão do jogo' : 'Game version',
    league: isPt ? 'Liga' : 'League',
    category: isPt ? 'Categoria de item' : 'Item category',
    refresh: isPt ? 'Atualizar preços' : 'Refresh prices',
    sortBy: isPt ? 'Ordenar por' : 'Sort by',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      <main className="container mx-auto max-w-7xl min-h-screen py-8 px-4 space-y-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{isPt ? 'Ferramentas' : 'Tools'}</span>
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            {isPt ? 'Tracker de Preços PoE' : 'PoE Price Tracker'}
          </h1>
          <p className="text-muted-foreground text-lg">{labels.subtitle}</p>
        </header>

        <PriceTrackerClient labels={labels} />

        {/* Índice de currency — HTML servido pro crawl. Não inventa product template. */}
        {currencyLinks.length > 0 && (
          <section className="pt-8 border-t border-border/40 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                {isPt ? 'Preço de cada currency de PoE 1' : 'PoE 1 currency prices, item by item'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {isPt
                  ? 'Este hub é o snapshot horário. Price history do item fica na página do item, não num gráfico aqui. Link vai pra loja quando a gente vende a orb.'
                  : 'This hub is the hourly snapshot. Per-item history is on the item pages, not a chart here. Links go to the store when we sell the orb.'}
              </p>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
              {currencyLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isPt ? `Preço ${item.name}` : `${item.name} price`}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-8 border-t border-border/40 space-y-4 max-w-3xl">
          <h2 className="text-xl font-semibold">
            {isPt ? 'O que este Price Tracker mostra' : 'What this price checker shows'}
          </h2>
          {isPt ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Essa página é um Price Tracker de Path of Exile 1. Busca currency, unique items, gems,
                fragments, essences e scarabs. Ordena por chaos, divine ou USD. Liga Allflame ou
                Standard. Também serve de currency tracker: Divine Orbs, Chaos Orbs e o resto da lista,
                com chaos e divine em cada linha.
              </p>
              <p>
                A tabela padrão é PoE 1. Tem uma aba PoE 2. Ela só lista currency quando aquela league
                tem dado.
              </p>
              <p>
                Os preços vêm do poe.ninja, cacheados por uma hora. Você está vendo esse snapshot, não
                um tick ao vivo. Não tem gráfico de price history neste hub. History fica nas páginas
                de item.
              </p>
              <p>
                USD e BRL não são taxa de banco. Pegamos o divine value do item no poe.ninja e
                multiplicamos pelo preço de Divine Orb da nossa loja. Se essa taxa da loja estiver
                vazia, a coluna de fiat fica vazia.
              </p>
              <p>
                Item que a Path of Trade vende ganha botão Buy pra página do produto. Out of stock
                continua out of stock. Sem Buy em orb que a gente não vende.
              </p>
              <p>
                poe.ninja é o feed. Esta página acrescenta fiat pela nossa taxa de Divine, e Buy nas
                orbs em estoque. Se você só quer a fita de chaos/divine, a fonte é o ninja.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This page is a Path of Exile 1 price checker. Search currency, unique items, gems,
                fragments, essences, and scarabs. Sort by chaos, divine, or USD. Pick Allflame or
                Standard. It also works as a PoE currency tracker: Divine Orbs, Chaos Orbs, and the
                rest of the list, with chaos and divine on every row.
              </p>
              <p>
                The default table is PoE 1. A PoE 2 tab is on the page. It only lists currency when
                that league has data.
              </p>
              <p>
                Prices come from poe.ninja, cached for one hour. You are looking at that snapshot, not
                a live tick. There is no price-history chart on this hub. History lives on item pages.
              </p>
              <p>
                USD and BRL are not a bank rate. We take the item&apos;s divine value from poe.ninja
                and multiply by the Divine Orb price in our store. If that store rate is missing, the
                fiat column stays empty.
              </p>
              <p>
                Items Path of Trade stocks get a Buy button to the product page. Out of stock stays
                out of stock. No Buy on orbs we do not sell.
              </p>
              <p>
                poe.ninja is the feed. This page adds fiat using our Divine rate, and Buy on stocked
                orbs. If you only want the raw chaos/divine tape, ninja is the source.
              </p>
            </div>
          )}
        </section>

        <section className="pt-8 border-t border-border/40 space-y-4">
          <h2 className="text-xl font-semibold">
            {isPt ? 'Perguntas frequentes' : 'FAQ'}
          </h2>
          <dl className="space-y-4">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="space-y-1">
                <dt className="font-medium">{q}</dt>
                <dd className="text-muted-foreground text-sm">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="pt-4 space-y-2">
          <h2 className="text-lg font-semibold">
            {isPt ? 'Outras tools' : 'Related tools'}
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <li>
              <Link href="/tools/pob-viewer" className="text-primary hover:underline">
                PoB Viewer
              </Link>
            </li>
            <li>
              <Link href="/tools/build-randomizer" className="text-primary hover:underline">
                Build Randomizer
              </Link>
            </li>
          </ul>
        </section>

        <CurrencyCtaSection locale={locale} />
      </main>
    </>
  )
}
