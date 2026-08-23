import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { buildCanonical, buildAbsoluteUrl, buildBreadcrumbSchema, getOgLocale } from '@/lib/utils'
import { CurrencyCtaSection } from '@/components/currency-cta-section'
import { fetchTreeLayout } from '@/lib/engine/tree'
import { getEngineApiBase } from '@/lib/placeholders/engine'
import { Sword } from 'lucide-react'
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

  // Título casado com a busca real: o tráfego desta página vem de "path of
  // building online" (1.8k impr/mês), "pob online" (1.6k), "pob web" e
  // "path of building web" — nenhum desses termos existia no título antigo,
  // que rendia ~1-2% de CTR na posição 7-8. "pob viewer", a única query que o
  // título respondia literalmente, convertia a 25%.
  const title = isPt
    ? 'Path of Building Online — PoB Viewer no Navegador | Path of Trade'
    : 'Path of Building Online — PoB Viewer in Your Browser | Path of Trade'
  const description = isPt
    ? 'Abra o Path of Building online — sem instalar nada. Cole seu código PoB e veja DPS, equipamentos, gemas e a árvore de passivas direto no navegador.'
    : 'Open Path of Building online — no install needed. Paste your PoB code to view DPS, gear, gems and the passive tree right in your web browser.'

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
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      ...getOgLocale(locale),
      siteName: 'Path of Trade',
      images: [{ url: '/images/logo.webp', alt: 'Path of Trade' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/logo.webp'] },
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
    name: isPt ? "Path of Building Online — PoB Viewer" : "Path of Building Online — PoB Viewer",
    alternateName: ["PoB Online", "Path of Building Web", "PoB Viewer"],
    description: isPt
      ? "Abra o Path of Building online no navegador: cole seu código PoB e veja DPS, equipamentos, gemas e a árvore de passivas."
      : "Open Path of Building online in your browser: paste your PoB code to view DPS, gear, gems and the passive tree.",
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
      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-10rem)]">
        <header className="max-w-7xl mx-auto mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <Sword className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-bold">
              {isPt ? 'Visualizador de Build' : 'PoB Viewer'}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isPt
              ? 'Cole seu código Path of Building ou link pobb.in/Pastebin para visualizar sua build no navegador.'
              : 'Paste your Path of Building code or pobb.in/Pastebin link to view your build in the browser.'}
          </p>
          <Link href="/builds" className="inline-flex text-sm text-primary hover:underline">
            {isPt ? 'Ou explore os guias de builds publicados' : 'Or browse published build guides'}
          </Link>
        </header>
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
              <h2 className="text-3xl font-bold text-foreground">Como usar o Path of Building Online (PoB Viewer no navegador)</h2>
              <p className="text-muted-foreground">O <strong>Path of Building online</strong> — ou <strong>PoB Viewer</strong> — é a ferramenta essencial e definitiva para inspecionar, compartilhar e analisar builds de Path of Exile (PoE) diretamente no seu navegador, sem precisar instalar o software de desktop. Basta importar o link gerado pelo seu Path of Building e pronto: você tem acesso imediato às estatísticas exatas de DPS (Damage Per Second), HP, equipamentos raros e únicos da build, setups de joias e à árvore de passivas ativadas.</p>
              
              <h3 className="text-2xl font-bold text-foreground mt-8">Por que o PoB Import é Essencial?</h3>
              <p className="text-muted-foreground">Avaliar os gargalos do seu personagem através de um visualizador é o que separa jogadores estagnados daqueles que limpam todo o conteúdo de pináculo (T17s, Uber Bosses, Delve profundo). Identificar uma resistência faltante, descobrir qual gema maximiza o benefício, ou qual item base a build recomenda, permite que o jogador faça as correções exatas antes de ir a campo.</p>

              <h3 className="text-2xl font-bold text-foreground mt-8">Equipe-se Analisando o Meta Atual</h3>
              <p className="text-muted-foreground">Se ao avaliar o pastebin da sua build dos sonhos você perceber que falta um cinto Mageblood, um amuleto craftado, ou que os modifiers estão abaixo da média para gerar os milhões de dano prometidos na guide, a solução é pular as dezenas de horas infernais do *farming* cego. Para realizar esses crafts (Metamod) ou para adqurir os itens diretos no trade oficial, grandes volumes de moedas são cobrados.</p>
              <p className="text-muted-foreground">Acelere sua diversão: aproveite nossos descontos diários em atacado para <Link href="/pt-br/games/path-of-exile-1/league/standard/divine-orb" className="text-primary font-semibold hover:underline">comprar Divine Orbs</Link> ou <Link href="/pt-br/games/path-of-exile-1/league/standard/chaos-orb" className="text-primary font-semibold hover:underline">Chaos Orbs</Link> e completar agora mesmo os itens recomendados apresentados acima do seu Visualizador de Personagem.</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-foreground">How to Use Path of Building Online (PoB Viewer in Your Browser)</h2>
              <p className="text-muted-foreground">The <strong>Path of Building online</strong> viewer — also known as the <strong>PoB Viewer</strong> or the PoB web version — is the easiest and most effective way to inspect, share, and analyze Path of Exile (PoE) builds straight from your browser, with no desktop client installation required. By importing your Path of Building pastebin link, you gain immediate, comprehensive access to critical stats like DPS, defensive layers, passive skill trees, and gem setups.</p>
              
              <h3 className="text-2xl font-bold text-foreground mt-8">Why Use a Build Visualizer?</h3>
              <p className="text-muted-foreground">Understanding the hidden bottlenecks of a character is what separates average players from those conquering top-tier endgame content like T17 maps or Uber Bosses. Utilizing an online visualizer highlights missing resistances, suboptimal gem links, and mandatory uncorrupted items, letting you formulate an exact action plan for your progression.</p>

              <h3 className="text-2xl font-bold text-foreground mt-8">Complete Your Build with Path of Trade</h3>
              <p className="text-muted-foreground">If the visualizer reveals that your guide requires high-tier cluster jewels, expensive corrupted weapons, or you simply need millions of DPS to get past an endgame hurdle, farming for days relies purely on cruel RNG. Purchasing direct upgrades allows you to focus on the fun parts of the game.</p>
              <p className="text-muted-foreground">Skip the grind easily by picking up the currency required for top-tier gear. Check out our competitive daily rates to <Link href="/games/path-of-exile-1/league/standard/divine-orb" className="text-primary font-semibold hover:underline">buy Divine Orbs safely</Link> or bulk <Link href="/games/path-of-exile-1/league/standard/chaos-orb" className="text-primary font-semibold hover:underline">buy Chaos Orbs</Link> straight from the Path of Trade marketplace, all delivered within minutes to your in-game stash.</p>
            </>
          )}
        </div>
      </main>
    </>
  )
}
