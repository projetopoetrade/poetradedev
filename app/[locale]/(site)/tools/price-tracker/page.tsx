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

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const isPt = locale === 'pt-br'

  const canonicalUrl = buildCanonical('/tools/price-tracker', locale)
  const enUrl = buildAbsoluteUrl('/tools/price-tracker')
  const ptUrl = buildAbsoluteUrl('/pt-br/tools/price-tracker')

  const title = isPt
    ? 'Tracker de Preços PoE — Currency e Items Únicos em Tempo Real | Path of Trade'
    : 'PoE Price Tracker — Currency & Unique Item Prices in Real-Time | Path of Trade'
  const description = isPt
    ? 'Veja preços em tempo real de currency, items únicos, gemas e mais em Path of Exile 1 e 2. Preços em BRL, USD e outras moedas. Atualizado a cada hora.'
    : 'Check real-time prices for currency, unique items, gems, and more in Path of Exile 1 & 2. Prices shown in USD, BRL, and other currencies. Updated every hour.'

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

  const faqSchema = isPt ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Com que frequência os preços são atualizados?',
        acceptedAnswer: { '@type': 'Answer', text: 'Os preços são buscados do poe.ninja e atualizados a cada hora.' },
      },
      {
        '@type': 'Question',
        name: 'De onde vêm os preços?',
        acceptedAnswer: { '@type': 'Answer', text: 'Todos os preços são obtidos do poe.ninja, o agregador de preços mais confiável de Path of Exile.' },
      },
      {
        '@type': 'Question',
        name: 'Como o preço em BRL/USD é calculado?',
        acceptedAnswer: { '@type': 'Answer', text: 'Convertemos usando o valor do Divine Orb da nossa loja. Fórmula: valor em Divine do item × nosso preço do Divine Orb em USD.' },
      },
      {
        '@type': 'Question',
        name: 'Posso comprar itens diretamente nessa página?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sim! Itens que o Path of Trade vende exibem um botão "Comprar" com link direto para a nossa página de produto.' },
      },
    ],
  } : {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How often are prices updated?',
        acceptedAnswer: { '@type': 'Answer', text: 'Prices are fetched from poe.ninja and cached for 1 hour.' },
      },
      {
        '@type': 'Question',
        name: 'Where do prices come from?',
        acceptedAnswer: { '@type': 'Answer', text: 'All price data is sourced from poe.ninja, the most trusted real-time price aggregator for Path of Exile.' },
      },
      {
        '@type': 'Question',
        name: 'How is the USD/BRL price calculated?',
        acceptedAnswer: { '@type': 'Answer', text: "We convert using the Divine Orb value from our store. Formula: item's Divine value × our Divine Orb price in USD." },
      },
      {
        '@type': 'Question',
        name: 'Can I buy items directly from this page?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes! Items that Path of Trade sells show a "Buy" button linking directly to our product page.' },
      },
    ],
  }

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PoE Price Tracker',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net'}/tools/price-tracker`,
    applicationCategory: 'GameApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const labels = {
    title: isPt ? 'Tracker de Preços PoE' : 'PoE Price Tracker',
    subtitle: isPt
      ? 'Currency, items únicos, gemas e mais. Atualizado a cada hora.'
      : 'Currency, unique items, gems and more. Updated every hour.',
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
        {/* Breadcrumb nav */}
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{isPt ? 'Ferramentas' : 'Tools'}</span>
        </Link>

        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            {isPt
              ? 'Tracker de Preços PoE — Currency & Items em Tempo Real'
              : 'PoE Price Tracker — Real-Time Currency & Item Prices'}
          </h1>
          <p className="text-muted-foreground text-lg">{labels.subtitle}</p>
          <p className="text-sm text-muted-foreground max-w-2xl pt-1">
            {isPt
              ? 'Consulte preços de Divine Orbs, Chaos Orbs, itens únicos, gemas e muito mais para Path of Exile 1 e 2. Dados atualizados a cada hora via poe.ninja, com valores convertidos para USD, BRL e outras moedas.'
              : 'Check live prices for Divine Orbs, Chaos Orbs, unique items, gems and more across Path of Exile 1 & 2. Data refreshed every hour via poe.ninja, with values converted to USD, BRL and other currencies.'}
          </p>
        </header>

        {/* Client tracker */}
        <PriceTrackerClient labels={labels} />

        {/* Índice de currency — renderizado no servidor.
            O tracker acima é 'use client' e monta a tabela depois de um fetch,
            então nenhuma âncora de item chegava ao HTML servido: a página com
            mais impressões do site não passava autoridade para nenhuma página
            de item. Esta seção é o caminho de crawl que faltava, e de quebra dá
            navegação direta ao leitor. */}
        {currencyLinks.length > 0 && (
          <section className="pt-8 border-t border-border/40 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                {isPt ? 'Preço de cada currency de PoE 1' : 'PoE 1 currency prices, item by item'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {isPt
                  ? 'Página dedicada por item, com valor de mercado atual e histórico de preço.'
                  : 'A dedicated page per item, with current market value and price history.'}
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

        {/* FAQ section */}
        <section className="pt-8 border-t border-border/40 space-y-4">
          <h2 className="text-xl font-semibold">
            {isPt ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
          </h2>
          <dl className="space-y-4">
            {[
              {
                q: isPt ? 'Com que frequência os preços são atualizados?' : 'How often are prices updated?',
                a: isPt
                  ? 'Os preços são buscados do poe.ninja e cacheados por 1 hora. Os dados refletem o snapshot mais recente de mercado.'
                  : 'Prices are fetched from poe.ninja and cached for 1 hour. The data reflects the most recent market snapshot.',
              },
              {
                q: isPt ? 'De onde vêm os preços?' : 'Where do prices come from?',
                a: isPt
                  ? 'Todos os dados de preço vêm do poe.ninja, o agregador de preços em tempo real mais confiável para Path of Exile.'
                  : 'All price data is sourced from poe.ninja, the most trusted real-time price aggregator for Path of Exile.',
              },
              {
                q: isPt ? 'Como o preço em USD/BRL é calculado?' : 'How is the USD/BRL price calculated?',
                a: isPt
                  ? 'Convertemos usando o valor do Divine Orb da nossa loja. Fórmula: valor em Divine do item × preço do Divine Orb em USD.'
                  : "We convert using the Divine Orb value from our store. Formula: item's Divine value × our Divine Orb USD price.",
              },
              {
                q: isPt ? 'Posso comprar itens diretamente nesta página?' : 'Can I buy items directly from this page?',
                a: isPt
                  ? 'Sim! Itens que a Path of Trade vende mostram um botão "Comprar" que leva diretamente à página do produto.'
                  : 'Yes! Items that Path of Trade sells show a "Buy" button linking directly to our product page.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="space-y-1">
                <dt className="font-medium">{q}</dt>
                <dd className="text-muted-foreground text-sm">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <CurrencyCtaSection locale={locale} />
      </main>
    </>
  )
}
