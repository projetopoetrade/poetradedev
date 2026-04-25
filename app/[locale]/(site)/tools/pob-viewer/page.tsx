import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { buildCanonical, buildAbsoluteUrl, buildBreadcrumbSchema, getOgLocale } from '@/lib/utils'
import { CurrencyCtaSection } from '@/components/currency-cta-section'
import { fetchTreeLayout } from '@/lib/engine/tree'
import { getEngineApiBase } from '@/lib/placeholders/engine'
import PobViewerClient from './PobViewerClient'

const FALLBACK_DATA_JSON_URL =
  'https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json'
const FALLBACK_ASSET_BASE_URL = 'https://web.poecdn.com/image/'
const FALLBACK_PATCH = 'master'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params
  const isPt = locale === 'pt-br'
  const canonical = buildCanonical('/tools/pob-viewer', locale)

  const title = isPt
    ? 'Visualizador de Build PoE — Importar Path of Building | Path of Trade'
    : 'PoE Build Viewer — Import Path of Building | Path of Trade'
  const description = isPt
    ? 'Cole seu código Path of Building para visualizar sua build de PoE: stats, equipamentos, gems e destaques da árvore passiva.'
    : 'Paste your Path of Building code to visualize your PoE build: stats, equipment, gems and passive tree highlights.'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: buildAbsoluteUrl('/tools/pob-viewer'),
        'pt-BR': buildAbsoluteUrl('/pt-br/tools/pob-viewer'),
        'x-default': buildAbsoluteUrl('/tools/pob-viewer'),
      },
    },
    openGraph: { title, description, url: canonical, type: 'website', ...getOgLocale(locale), siteName: 'Path of Trade' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PobViewerPage(props: PageProps) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const isPt = locale === 'pt-br'

  const layout = await fetchTreeLayout()

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: isPt ? 'Ferramentas' : 'Tools', url: '/tools' },
    { name: isPt ? 'Visualizador de Build' : 'PoB Viewer', url: '/tools/pob-viewer' },
  ])

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net'
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: isPt ? "Visualizador de Build PoE" : "PoE Build Viewer",
    description: isPt
      ? "Cole seu código Path of Building para visualizar sua build"
      : "Paste your Path of Building code to visualize your PoE build",
    url: `${baseUrl}/tools/pob-viewer`,
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-10rem)]">
        <PobViewerClient
          locale={locale}
          engineBase={getEngineApiBase()}
          treeDataUrl={layout?.treeDataUrl ?? null}
          dataJsonUrl={layout?.dataJsonUrl ?? FALLBACK_DATA_JSON_URL}
          assetBaseUrl={layout?.assetBaseUrl ?? FALLBACK_ASSET_BASE_URL}
          patch={layout?.patch ?? FALLBACK_PATCH}
        />
        <div className="max-w-4xl mx-auto">
          <CurrencyCtaSection locale={locale} />
        </div>

        {/* SEO Text Block (SSR) */}
        <div className="mt-20 max-w-4xl mx-auto prose prose-invert prose-slate">
          {isPt ? (
            <>
              <h2 className="text-3xl font-bold text-foreground">Como usar o Visualizador de Build (PoB Viewer) online no Path of Exile?</h2>
              <p className="text-muted-foreground">O <strong>PoB Viewer</strong> é a ferramenta essencial e definitiva para inspecionar, compartilhar e analisar builds de Path of Exile (PoE) diretamente no seu navegador, sem precisar instalar o software de desktop. Basta importar o link gerado pelo seu Path of Building e pronto: você tem acesso imeditato às estatísticas exatas de DPS (Damage Per Second), HP, equipamentos raros e únicos da build, setups de joias e à árvore de passivas ativadas.</p>
              
              <h3 className="text-2xl font-bold text-foreground mt-8">Por que o PoB Import é Essencial?</h3>
              <p className="text-muted-foreground">Avaliar os gargalos do seu personagem através de um visualizador é o que separa jogadores estagnados daqueles que limpam todo o conteúdo de pináculo (T17s, Uber Bosses, Delve profundo). Identificar uma resistência faltante, descobrir qual gema maximiza o benefício, ou qual item base a build recomenda, permite que o jogador faça as correções exatas antes de ir a campo.</p>

              <h3 className="text-2xl font-bold text-foreground mt-8">Equipe-se Analisando o Meta Atual</h3>
              <p className="text-muted-foreground">Se ao avaliar o pastebin da sua build dos sonhos você perceber que falta um cinto Mageblood, um amuleto craftado, ou que os modifiers estão abaixo da média para gerar os milhões de dano prometidos na guide, a solução é pular as dezenas de horas infernais do *farming* cego. Para realizar esses crafts (Metamod) ou para adqurir os itens diretos no trade oficial, grandes volumes de moedas são cobrados.</p>
              <p className="text-muted-foreground">Acelere sua diversão: aproveite nossos descontos diários em atacado para <Link href="/pt-br/games/path-of-exile-1/league/standard/divine-orb" className="text-primary font-semibold hover:underline">comprar Divine Orbs</Link> ou <Link href="/pt-br/games/path-of-exile-1/league/standard/chaos-orb" className="text-primary font-semibold hover:underline">Chaos Orbs</Link> e completar agora mesmo os itens recomendados apresentados acima do seu Visualizador de Personagem.</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-foreground">How to use the Path of Building (PoB) Viewer</h2>
              <p className="text-muted-foreground">The <strong>PoB Viewer</strong> is the easiest and most effective way to inspect, share, and analyze Path of Exile (PoE) builds straight from your browser—no desktop client installation required. By importing your Path of Building pastebin link, you gain immediate, comprehensive access to critical stats like DPS, defensive layers, passive skill trees, and gem setups.</p>
              
              <h3 className="text-2xl font-bold text-foreground mt-8">Why Use a Build Visualizer?</h3>
              <p className="text-muted-foreground">Understanding the hidden bottlenecks of a character is what separates average players from those conquering top-tier endgame content like T17 maps or Uber Bosses. Utilizing an online visualizer highlights missing resistances, suboptimal gem links, and mandatory uncorrupted items, letting you formulate an exact action plan for your progression.</p>

              <h3 className="text-2xl font-bold text-foreground mt-8">Complete Your Build with Path of Trade</h3>
              <p className="text-muted-foreground">If the visualizer reveals that your guide requires high-tier cluster jewels, expensive corrupted weapons, or you simply need millions of DPS to get past an endgame hurdle, farming for days relies purely on cruel RNG. Purchasing direct upgrades allows you to focus on the fun parts of the game.</p>
              <p className="text-muted-foreground">Skip the grind easily by picking up the currency required for top-tier gear. Check out our competitive daily rates to <Link href="/games/path-of-exile-1/league/standard/divine-orb" className="text-primary font-semibold hover:underline">buy Divine Orbs safely</Link> or bulk <Link href="/games/path-of-exile-1/league/standard/chaos-orb" className="text-primary font-semibold hover:underline">buy Chaos Orbs</Link> straight from the Path of Trade marketplace, all delivered within minutes to your in-game stash.</p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
