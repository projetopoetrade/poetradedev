import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildCanonical, buildAbsoluteUrl, buildBreadcrumbSchema, getOgLocale } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, BarChart2, Dices, Sword } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const revalidate = 3600

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const isPt = locale === 'pt-br'

  const canonicalUrl = buildCanonical('/tools', locale)
  const enUrl = buildAbsoluteUrl('/tools')
  const ptUrl = buildAbsoluteUrl('/pt-br/tools')

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
    openGraph: { title, description, url: canonicalUrl, type: 'website', ...getOgLocale(locale), siteName: 'Path of Trade' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

// SEO: FAQ Data
const getFAQData = (isPt: boolean) => [
  {
    question: isPt ? 'As ferramentas de PoE são 100% gratuitas?' : 'Are these PoE tools 100% free?',
    answer: isPt
      ? 'Sim! Todas as nossas ferramentas, incluindo o Rastreador de Preços, Randomizador de Builds e o PoB Viewer são totalmente gratuitos para a comunidade usar quantas vezes quiser.'
      : 'Yes! All our tools, including the Price Tracker, Build Randomizer, and PoB Viewer are completely free for the community to use as much as they want.',
  },
  {
    question: isPt ? 'O Rastreador de Preços mostra o valor real nas ligas?' : 'Does the Price Tracker show live market values?',
    answer: isPt
      ? 'Nosso Tracker utiliza dados diretos da economia de Path of Exile 1 e 2 para exibir os preços mais atualizados em Chaos e Divine Orbs.'
      : 'Our Price Tracker uses direct economy data from Path of Exile 1 and 2 to display the most up-to-date prices in Chaos and Divine Orbs.',
  },
  {
    question: isPt ? 'O PoB Viewer é seguro?' : 'Is the PoB Viewer safe to use?',
    answer: isPt
      ? 'Completamente seguro. O visualizador de Path of Building apenas analisa e carrega o código Base64 ou Pastebin em uma visualização web da sua build, sem necessitar de nenhum login.'
      : 'Completely safe. The Path of Building viewer simply parses your Base64 or Pastebin code into a clean web preview of your build, keeping everything client-side without any login required.',
  },
]

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

  const faqData = getFAQData(isPt)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const tools = [
    {
      href: '/tools/price-tracker',
      icon: <BarChart2 className="h-8 w-8 text-primary" />,
      title: isPt ? 'Tracker de Preços' : 'Path of Exile Price Tracker',
      description: isPt
        ? 'Acompanhe os preços reais do mercado de currency, items únicos e gemas de PoE 1 e PoE 2 convertidos automaticamente para a sua moeda.'
        : 'Track live market prices for currency, unique items, and gems in PoE 1 & PoE 2, automatically converted to your local currency.',
      badge: isPt ? 'Atualizado' : 'Live rates',
    },
    {
      href: '/tools/build-randomizer',
      icon: <Dices className="h-8 w-8 text-primary" />,
      title: isPt ? 'Randomizador de Build' : 'Build Randomizer',
      description: isPt
        ? 'Indeciso sobre o que jogar na nova liga? Gire a roleta e deixe o destino escolher sua próxima build inicial com base nos nossos filtros avançados.'
        : "Can't decide what to play next league? Spin the wheel and let fate choose your ideal league starter build using our advanced tags filter.",
      badge: isPt ? 'Novo' : 'New',
    },
    {
      href: '/tools/pob-viewer',
      icon: <Sword className="h-8 w-8 text-primary" />,
      title: isPt ? 'Web PoB Viewer' : 'Web PoB Viewer',
      description: isPt
        ? 'Importe rapidamente seu código do Path of Building e veja na web todos os atributos, árvores de passivas e equipamentos detalhados sem abrir o programa.'
        : 'Quickly import your Path of Building code to view exact stats, passive skill trees, and detailed equipment all inside your browser.',
      badge: isPt ? 'Novo' : 'New',
    },
  ]

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
      <main className="container mx-auto max-w-4xl min-h-screen py-8 px-4 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{isPt ? 'Início' : 'Home'}</span>
        </Link>

        <header className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {isPt ? 'Recursos & Ferramentas Essenciais do PoE' : 'Essential PoE Tools'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {isPt
              ? 'Maximize sua jogabilidade com nossas ferramentas gratuitas para jogadores de Path of Exile 1 e 2. Compare a economia, veja o mercado em tempo real e analise builds com facilidade.'
              : 'Maximize your gameplay with our free utilities for Path of Exile 1 & 2 players. Analyze the economy, check real-time market values, and dive deep into builds.'}
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex flex-col gap-4 p-6 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-accent/10 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  {tool.icon}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                  {tool.badge}
                </span>
              </div>
              <div className="space-y-2 mt-2">
                <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="pt-8 border-t border-border/40" aria-labelledby="faq-heading">
          <div className="mb-6 space-y-2 text-center">
            <h2 id="faq-heading" className="text-2xl font-bold">
              {isPt ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-muted-foreground">
              {isPt ? 'Tudo sobre as ferramentas' : 'Everything you need to know about our tools'}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
    </>
  )
}
