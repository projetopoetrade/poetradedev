import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildCanonical, buildBreadcrumbSchema } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, BarChart2, Dices } from 'lucide-react'

export const revalidate = 3600

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net'
  const path = '/tools'
  const enUrl = `${baseUrl}${path}`
  const ptUrl = `${baseUrl}/pt-br${path}`
  const canonicalUrl = locale === 'en' ? enUrl : ptUrl
  const isPt = locale === 'pt-br'

  const title = isPt
    ? 'Ferramentas PoE — Price Tracker e Build Randomizer | Path of Trade'
    : 'PoE Tools — Price Tracker & Build Randomizer | Path of Trade'
  const description = isPt
    ? 'Ferramentas gratuitas para Path of Exile: tracker de preços em tempo real e randomizador de builds. Powered by Path of Trade.'
    : 'Free tools for Path of Exile: real-time price tracker and build randomizer. Powered by Path of Trade.'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { en: enUrl, 'pt-BR': ptUrl, 'x-default': enUrl },
    },
    openGraph: { title, description, url: canonicalUrl, type: 'website', siteName: 'Path of Trade' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ToolsHubPage(props: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const isPt = locale === 'pt-br'

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
  ])

  const tools = [
    {
      href: '/tools/price-tracker',
      icon: <BarChart2 className="h-8 w-8 text-primary" />,
      title: isPt ? 'Tracker de Preços' : 'Price Tracker',
      description: isPt
        ? 'Veja preços em tempo real de currency, items únicos, gemas e mais em PoE 1 e 2. Valores em USD, BRL e outras moedas.'
        : 'Real-time prices for currency, unique items, gems and more in PoE 1 & 2. Values in USD, BRL and other currencies.',
      badge: isPt ? 'Tempo Real' : 'Live',
    },
    {
      href: '/tools/build-randomizer',
      icon: <Dices className="h-8 w-8 text-primary" />,
      title: isPt ? 'Randomizador de Build' : 'Build Randomizer',
      description: isPt
        ? 'Indeciso no league start? Deixa o destino decidir. Filtros por game, tags e ascendancy.'
        : "Can't decide what to play? Let fate choose your league start build. Filter by game, tags and ascendancy.",
      badge: isPt ? 'Em Breve' : 'Coming Soon',
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="container mx-auto max-w-4xl min-h-screen py-8 px-4 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{isPt ? 'Início' : 'Home'}</span>
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            {isPt ? 'Ferramentas PoE' : 'PoE Tools'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isPt
              ? 'Ferramentas gratuitas para jogadores de Path of Exile.'
              : 'Free tools for Path of Exile players.'}
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex flex-col gap-4 p-6 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-accent/20 transition-all"
            >
              <div className="flex items-start justify-between">
                {tool.icon}
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {tool.badge}
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
