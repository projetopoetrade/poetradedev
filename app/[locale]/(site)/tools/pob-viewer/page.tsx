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
    ? 'Cole o código do PoB ou um link pobb.in para ver a tree, gems e gear no navegador. Abra a mesma build no Path of Building desktop quando precisar do planner completo.'
    : 'Paste a PoB code or pobb.in link to inspect the tree, gems, and gear in your browser. Open the same build in desktop Path of Building when you need the full planner.'

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
  const pageUrl = isPt ? `${baseUrl}/pt-br/tools/pob-viewer` : `${baseUrl}/tools/pob-viewer`
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Path of Building Online — PoB Viewer",
    alternateName: ["PoB Online", "Path of Building Web", "PoB Viewer"],
    description: isPt
      ? "Cole o código do PoB ou um link pobb.in para ver a tree, gems e gear no navegador."
      : "Paste a PoB code or pobb.in link to inspect the tree, gems, and gear in your browser.",
    url: pageUrl,
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isPt
      ? [
          {
            "@type": "Question",
            name: "O que é Path of Building?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Path of Building (PoB) é um planner offline de build pra Path of Exile, community fork. Você configura tree, gems e gear lá. Não é esta página.",
            },
          },
          {
            "@type": "Question",
            name: "Dá pra usar Path of Building online sem instalar?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Dá pra inspecionar um PoB colado aqui sem instalar nada. Não dá pra tratar esta página como o planner completo. Pra editar e pra stat calculada, usa o app desktop ou um port web do PoB.",
            },
          },
          {
            "@type": "Question",
            name: "Qual a diferença deste viewer pro PoB Web / pob.cool?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Esses rodam Path of Building no navegador. Esta página importa um código PoB ou um link pobb.in / Pastebin e mostra a build. Se você precisa mexer em node, vai pra lá ou pro PoB desktop.",
            },
          },
          {
            "@type": "Question",
            name: "Como abrir um link pobb.in?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Cola a URL inteira no campo. Link de pastebin.com funciona igual. Código PoB cru também.",
            },
          },
          {
            "@type": "Question",
            name: "Como abrir a mesma build no app desktop?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Instala Path of Building, abre Import/Export e cola o mesmo código ou URL que você usou aqui.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "What is Path of Building?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Path of Building (PoB) is an offline build planner for Path of Exile, maintained as a community fork. You set the tree, gems, and gear there. It is not this webpage.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use Path of Building online without installing it?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can inspect a pasted PoB here without installing anything. You cannot treat this page as the full planner. For editing and calculated stats, use the desktop app or a web port of PoB.",
            },
          },
          {
            "@type": "Question",
            name: "How is this different from PoB Web or pob.cool?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Those run Path of Building in the browser. This page imports a PoB code or a pobb.in / Pastebin link and shows the build. If you need to change nodes, go there or to desktop PoB.",
            },
          },
          {
            "@type": "Question",
            name: "How do I open a pobb.in link?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Paste the full URL into the box. Pastebin.com links work the same way. A raw PoB code works too.",
            },
          },
          {
            "@type": "Question",
            name: "How do I open the same build in the desktop app?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Install Path of Building, open Import/Export, and paste the same code or URL you used here.",
            },
          },
        ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
              ? 'Cole o código do Path of Building ou um link pobb.in / Pastebin. O PoB Viewer mostra a build no navegador, sem instalar.'
              : 'Paste a Path of Building code or a pobb.in / Pastebin link. Inspect the build in your browser. No install.'}
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
              <h2 className="text-3xl font-bold text-foreground">O que este visualizador mostra</h2>
              <p className="text-muted-foreground">Essa página lê um export do Path of Building e joga a build na tela: passive tree, gems e gear. Serve pra quando alguém manda um PoB no chat e você quer olhar sem abrir o app desktop.</p>
              <p className="text-muted-foreground">É viewer, não é o planner. Não aloca passiva, não crafta item, não substitui o cálculo do Path of Building. Se o número do export importa pra uma decisão, abre o mesmo código no PoB desktop.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">Como abrir um PoB aqui</h2>
              <ol className="text-muted-foreground list-decimal pl-5 space-y-1">
                <li>Copia o código cru do PoB, ou copia a URL do pobb.in / pastebin.com.</li>
                <li>Cola no campo acima.</li>
                <li>Clica Analisar Build.</li>
              </ol>
              <p className="text-muted-foreground">Só isso. Não tem upload de arquivo. Não tem import de personagem do pathofexile.com.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">Visualizador vs Path of Building desktop</h2>
              <p className="text-muted-foreground">Path of Building é o planner offline da community pra Path of Exile. É ele que monta a character de verdade. Baixa em <a href="https://pathofbuilding.community/" className="text-primary font-semibold hover:underline">pathofbuilding.community</a>.</p>
              <p className="text-muted-foreground">Aqui você inspeciona um export colado. Site que roda o PoB inteiro na aba (pob.cool e similares) é outro produto: tenta ser o planner no navegador. Usa esses pra theorycraft. Usa esta página pra abrir um código ou um paste rápido.</p>
              <p className="text-muted-foreground">Pra mudar a build, instala o Path of Building desktop, vai em Import/Export e cola o mesmo código ou URL.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">Perguntas frequentes</h2>
              <h3 className="text-xl font-bold text-foreground mt-6">O que é Path of Building?</h3>
              <p className="text-muted-foreground">Path of Building (PoB) é um planner offline de build pra Path of Exile, community fork. Você configura tree, gems e gear lá. Não é esta página.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">Dá pra usar Path of Building online sem instalar?</h3>
              <p className="text-muted-foreground">Dá pra inspecionar um PoB colado aqui sem instalar nada. Não dá pra tratar esta página como o planner completo. Pra editar e pra stat calculada, usa o app desktop ou um port web do PoB.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">Qual a diferença deste viewer pro PoB Web / pob.cool?</h3>
              <p className="text-muted-foreground">Esses rodam Path of Building no navegador. Esta página importa um código PoB ou um link pobb.in / Pastebin e mostra a build. Se você precisa mexer em node, vai pra lá ou pro PoB desktop.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">Como abrir um link pobb.in?</h3>
              <p className="text-muted-foreground">Cola a URL inteira no campo. Link de pastebin.com funciona igual. Código PoB cru também.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">Como abrir a mesma build no app desktop?</h3>
              <p className="text-muted-foreground">Instala Path of Building, abre Import/Export e cola o mesmo código ou URL que você usou aqui.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">Outras tools</h2>
              <ul className="text-muted-foreground">
                <li><Link href="/pt-br/builds" className="text-primary font-semibold hover:underline">Build guides</Link></li>
                <li><Link href="/pt-br/tools/price-tracker" className="text-primary font-semibold hover:underline">PoE Price Tracker</Link></li>
                <li><Link href="/pt-br/tools/build-randomizer" className="text-primary font-semibold hover:underline">Build Randomizer</Link></li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-foreground">What this viewer shows</h2>
              <p className="text-muted-foreground">This page reads a Path of Building export and puts the build on screen: passive tree, gems, and gear. Use it when someone drops a PoB in chat and you want a look without booting the desktop app.</p>
              <p className="text-muted-foreground">It is a viewer. It does not allocate passives, craft items, or replace Path of Building’s calculator. If a number in that export matters for a decision, open the same code in the desktop planner.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">How to open a PoB here</h2>
              <ol className="text-muted-foreground list-decimal pl-5 space-y-1">
                <li>Copy the raw PoB code, or copy a pobb.in or pastebin.com URL.</li>
                <li>Paste it in the box above.</li>
                <li>Click Analyze Build.</li>
              </ol>
              <p className="text-muted-foreground">That is the whole input. No file picker. No character import from pathofexile.com.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">Viewer vs desktop Path of Building</h2>
              <p className="text-muted-foreground">Path of Building is the community’s offline build planner for Path of Exile. That is the tool that actually plans the character. Get it from <a href="https://pathofbuilding.community/" className="text-primary font-semibold hover:underline">pathofbuilding.community</a>.</p>
              <p className="text-muted-foreground">This page inspects a pasted export. Sites that run PoB itself in the tab (pob.cool and similar) are a different product: they are trying to be the planner in a browser. Use those to theorycraft. Use this page to open a code or a paste link fast.</p>
              <p className="text-muted-foreground">To change the build, install desktop Path of Building, then Import/Export and paste the same code or URL.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">FAQ</h2>
              <h3 className="text-xl font-bold text-foreground mt-6">What is Path of Building?</h3>
              <p className="text-muted-foreground">Path of Building (PoB) is an offline build planner for Path of Exile, maintained as a community fork. You set the tree, gems, and gear there. It is not this webpage.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">Can I use Path of Building online without installing it?</h3>
              <p className="text-muted-foreground">You can inspect a pasted PoB here without installing anything. You cannot treat this page as the full planner. For editing and calculated stats, use the desktop app or a web port of PoB.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">How is this different from PoB Web or pob.cool?</h3>
              <p className="text-muted-foreground">Those run Path of Building in the browser. This page imports a PoB code or a pobb.in / Pastebin link and shows the build. If you need to change nodes, go there or to desktop PoB.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">How do I open a pobb.in link?</h3>
              <p className="text-muted-foreground">Paste the full URL into the box. Pastebin.com links work the same way. A raw PoB code works too.</p>
              <h3 className="text-xl font-bold text-foreground mt-6">How do I open the same build in the desktop app?</h3>
              <p className="text-muted-foreground">Install Path of Building, open Import/Export, and paste the same code or URL you used here.</p>

              <h2 className="text-2xl font-bold text-foreground mt-8">Related tools</h2>
              <ul className="text-muted-foreground">
                <li><Link href="/builds" className="text-primary font-semibold hover:underline">Build guides</Link></li>
                <li><Link href="/tools/price-tracker" className="text-primary font-semibold hover:underline">PoE Price Tracker</Link></li>
                <li><Link href="/tools/build-randomizer" className="text-primary font-semibold hover:underline">Build Randomizer</Link></li>
              </ul>
            </>
          )}
        </div>
      </main>
    </>
  )
}
