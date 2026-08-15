import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { createPublicClient } from '@/utils/supabase/public'
import PriceHistoryChart from '@/components/Product/PriceHistoryChart'
import { buildCanonical, buildAbsoluteUrl, buildBreadcrumbSchema, getOgLocale } from '@/lib/utils'
import { slugToIlikePattern } from '@/utils/url-helper'

// ISR de 1h, igual à página-índice. Sem isto a rota rendereza a cada request:
// é a página que queremos servir rápido para o crawler agora que ela entrou no
// sitemap. createPublicClient (sem cookies) é o que mantém o ISR de pé.
export const revalidate = 3600

interface PageProps {
  params: Promise<{
    locale: string
    item: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { item, locale } = await params

  const decodedItem = decodeURIComponent(item).replace(/-/g, ' ')
  
  // Mesma resolução em três passos do corpo da página — ver comentário lá.
  const supabase = createPublicClient()
  const { data: bySlug } = await supabase
    .from('products')
    .select('slug, name')
    .or(`slug.eq.${item},url_slug.eq.${item}`)
    .limit(1)
  let ourProduct = bySlug?.[0] || null
  if (!ourProduct) {
    const { data: byName } = await supabase
      .from('products')
      .select('slug, name')
      .ilike('name', slugToIlikePattern(item))
      .limit(1)
    ourProduct = byName?.[0] || null
  }
  const itemName = ourProduct?.name || decodedItem.replace(/\b\w/g, l => l.toUpperCase()).replace(/'S\b/g, "'s")

  const canonicalUrl = buildCanonical(`/tools/price-tracker/${item}`, locale)
  const enUrl = buildAbsoluteUrl(`/tools/price-tracker/${item}`)
  const ptUrl = buildAbsoluteUrl(`/pt-br/tools/price-tracker/${item}`)

  const isPt = locale === 'pt-br'

  const title = isPt
    ? `Preço ${itemName} PoE — Histórico e Valor de Mercado | Path of Trade`
    : `${itemName} Price PoE — Live Market Value & History | Path of Trade`

  const description = isPt
    ? `Acompanhe o preço do ${itemName} em tempo real em Path of Exile. Veja o histórico de mercado, variação de preço e onde comprar barato.`
    : `Track the live price of ${itemName} in Path of Exile. View market history, price trends, and where to buy cheap with fast delivery.`

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the current price of ${itemName} in Path of Exile?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The current price of ${itemName} fluctuates based on league progression and player demand. Use the price chart above to see the latest market value in Divine Orbs and estimated USD. Data is updated every hour from poe.ninja.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where can I buy ${itemName} cheaply?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Path of Trade offers ${itemName} at competitive prices with fast in-game delivery. Click the "Buy" button above to purchase at our current rate with secure trading.`,
        },
      },
      {
        '@type': 'Question',
        name: `How accurate is the ${itemName} price data?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Price data is sourced from poe.ninja, the most trusted real-time price aggregator for Path of Exile, and refreshed every hour. Prices reflect active trade listings across the current league.`,
        },
      },
    ],
  }

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
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function TrackerItemPage({ params }: PageProps) {
  const { item, locale } = await params

  const decodedItem = decodeURIComponent(item).replace(/-/g, ' ')
  const itemName = decodedItem.replace(/\b\w/g, l => l.toUpperCase())
  const isPt = locale === 'pt-br'

  const supabase = createPublicClient()

  // Resolução em três passos. O slug do tracker vem de encodeProductName, que
  // colapsa apóstrofos em hífen — por isso o ilike direto em `decodedItem`
  // falhava em nomes como "Blacksmith's Whetstone"; slugToIlikePattern troca os
  // separadores por % e atravessa a pontuação perdida.
  const SELECT = 'slug, url_slug, gameVersion, price, in_stock, name'

  const { data: bySlug } = await supabase
    .from('products')
    .select(SELECT)
    .or(`slug.eq.${item},url_slug.eq.${item}`)
    .limit(1)
  let ourProduct = bySlug?.[0] || null

  if (!ourProduct) {
    const { data: byName } = await supabase
      .from('products')
      .select(SELECT)
      .ilike('name', slugToIlikePattern(item))
      .limit(1)
    ourProduct = byName?.[0] || null
  }

  // URL canônica de compra — /games/<jogo>/products/<url_slug>. Sem url_slug
  // não linkamos: a rota legada /products/<slug> responde 301.
  const buyUrl = ourProduct?.url_slug
    ? `/games/${ourProduct.gameVersion ?? 'path-of-exile-1'}/products/${ourProduct.url_slug}`
    : null

  // Use the database name if available, otherwise fallback to formatting the URL slug
  const finalItemName = ourProduct?.name || decodedItem.replace(/\b\w/g, l => l.toUpperCase()).replace(/'S\b/g, "'s")

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Price Tracker', url: '/tools/price-tracker' },
    { name: finalItemName, url: `/tools/price-tracker/${item}` },
  ])

  const faqItems = [
    {
      q: isPt
        ? `Qual é o preço atual do ${finalItemName} em Path of Exile?`
        : `What is the current price of ${finalItemName} in Path of Exile?`,
      a: isPt
        ? `O preço do ${finalItemName} varia conforme a progressão da liga e a demanda dos jogadores. Veja o gráfico acima para o valor mais recente em Divine Orbs e USD estimado. Dados atualizados a cada hora.`
        : `The current price of ${finalItemName} fluctuates based on league progression and player demand. See the chart above for the latest value in Divine Orbs and estimated USD. Data is refreshed every hour.`,
    },
    {
      q: isPt
        ? `Onde comprar ${finalItemName} barato?`
        : `Where can I buy ${finalItemName} cheaply?`,
      a: isPt
        ? `Path of Trade oferece ${finalItemName} com preços competitivos e entrega rápida no jogo. Clique no botão "Comprar" acima para adquirir ao nosso preço atual com troca segura.`
        : `Path of Trade offers ${finalItemName} at competitive prices with fast in-game delivery. Click the "Buy" button above to purchase at our current rate with secure trading.`,
    },
    {
      q: isPt
        ? `Com que frequência o preço do ${finalItemName} é atualizado?`
        : `How often is the ${finalItemName} price data updated?`,
      a: isPt
        ? `Os dados de preço vêm do poe.ninja, o agregador de preços mais confiável para Path of Exile, e são atualizados a cada hora. Os preços refletem as listagens de troca ativas na liga atual.`
        : `Price data is sourced from poe.ninja and refreshed every hour. Prices reflect active trade listings across the current league.`,
    },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li><ChevronRight className="h-4 w-4" /></li>
          <li><Link href="/tools/price-tracker" className="hover:text-foreground transition-colors">Price Tracker</Link></li>
          <li><ChevronRight className="h-4 w-4" /></li>
          <li className="text-foreground font-medium" aria-current="page">{finalItemName}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            {isPt ? `Preço ${finalItemName} — Tracker ao Vivo` : `${finalItemName} Price — Live Tracker`}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            {isPt
              ? `Acompanhe o valor de mercado do ${finalItemName} em tempo real. Histórico de 30 dias, tendência e onde comprar com entrega rápida.`
              : `Track the live market value of ${finalItemName} in Path of Exile. 30-day price history, trend analysis, and where to buy with fast delivery.`}
          </p>
        </div>

        {ourProduct && ourProduct.in_stock && buyUrl && (
          <Link
            href={buyUrl}
            className="inline-flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm px-5 py-2.5 transition-colors shrink-0"
          >
            {isPt ? `Comprar ${finalItemName} — $${ourProduct.price}` : `Buy ${finalItemName} — $${ourProduct.price}`}
          </Link>
        )}
      </div>

      {/* Chart */}
      <section className="mb-10">
        <PriceHistoryChart productSlug={item} />
      </section>

      {/* Content block */}
      <section className="bg-muted/30 rounded-xl p-6 border border-border/50 text-sm leading-relaxed text-muted-foreground mb-10">
        <h2 className="text-foreground font-semibold text-lg mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {isPt ? `Economia do ${finalItemName}` : `${finalItemName} Economy`}
        </h2>
        <p>
          {isPt
            ? `O valor de mercado do ${finalItemName} oscila constantemente com base na progressão da liga, demanda dos jogadores e mudanças na meta. Use o gráfico acima para determinar se o momento é bom para comprar ou vender antes de converter seus Chaos ou Divine Orbs. Os dados são consolidados a cada hora diretamente dos índices do poe.ninja nas regiões ativas.`
            : `The market value of ${finalItemName} constantly fluctuates based on league progression, player demand, and meta shifts. Use the price chart above to determine whether it is a buyer's or seller's market before converting your Chaos or Divine Orbs. Data is consolidated every hour from poe.ninja indices across active leagues.`}
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          {isPt ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-0 divide-y divide-border/40">
          {faqItems.map((item, i) => (
            <details key={i} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between list-none gap-4 font-medium text-foreground hover:text-primary transition-colors">
                {item.q}
                <span className="text-muted-foreground text-lg shrink-0 group-open:rotate-45 transition-transform duration-200 inline-block">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Link href="/tools/price-tracker" className="text-sm text-primary hover:underline">
        &larr; {isPt ? 'Voltar ao Price Tracker' : 'Back to full Price Tracker'}
      </Link>
    </div>
  )
}
