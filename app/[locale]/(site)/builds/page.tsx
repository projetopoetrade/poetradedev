import { Suspense } from "react";
import { Metadata } from "next";
import { buildAbsoluteUrl, buildBreadcrumbSchema, getOgLocale } from "@/lib/utils";
import { getBuilds, getDistinctBuildLeagues } from "@/app/actions";
import BuildsClient from "./BuildsClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net';

  const titles: Record<string, string> = {
    en: 'Best Path of Exile Builds — PoE Build Guides | Path of Trade',
    'pt-br': 'Melhores Builds Path of Exile — Guias de Builds PoE | Path of Trade',
  };
  const descriptions: Record<string, string> = {
    en: 'Browse curated Path of Exile builds. Filter by class, ascendancy, league starter, endgame and more. Open any build in our PoB Viewer.',
    'pt-br': 'Encontre as melhores builds de Path of Exile. Filtre por classe, ascendência, league starter, endgame e mais. Abra qualquer build no PoB Viewer.',
  };

  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;
  const enUrl = `${baseUrl}/builds`;
  const ptUrl = `${baseUrl}/pt-br/builds`;
  const canonicalUrl = locale === 'en' ? enUrl : ptUrl;

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
      images: [{ url: "/images/logo.webp" }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ["/images/logo.webp"],
    },
  };
}

// Teto para "traga todos" — a filtragem e a paginacao acontecem no cliente.
const ALL_BUILDS_LIMIT = 500;

// Nao le `searchParams`: filtros e `?page=` eram resolvidos no servidor, o que
// tornava a rota dinamica (uma execucao de funcao por combinacao). A listagem
// inteira cabe no payload e o BuildsClient filtra em memoria. Os builds estao
// individualmente no sitemap, entao a descoberta nao depende desta listagem.
export default async function BuildsPage({ params }: Props) {
  const { locale } = await params;

  const { builds, total } = await getBuilds({
    page: 1,
    limit: ALL_BUILDS_LIMIT,
  });

  // Unique leagues from all published builds for filter options
  const leagues = await getDistinctBuildLeagues();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net';
  const localePath = locale === 'en' ? '' : `/${locale}`;
  const buildsUrl = `${baseUrl}${localePath}/builds`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: `${baseUrl}${localePath}` },
    { name: 'Builds', url: buildsUrl },
  ]);

  // JSON-LD ItemList
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Path of Exile Builds',
    url: buildsUrl,
    numberOfItems: total,
    itemListElement: builds.map((build, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: buildAbsoluteUrl(`/builds/${build.slug}`),
      name: build.title,
      description: build.description ?? undefined,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: locale === 'pt-br' ? 'Qual a melhor build para começar uma liga em Path of Exile?' : 'What is the best league starter build in Path of Exile?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: locale === 'pt-br'
            ? 'Os melhores league starters são builds que funcionam bem com equipamentos básicos: Righteous Fire, Lightning Arrow, Boneshatter e Arc são escolhas clássicas por escalarem com pouco investimento e terem boa progressão para o endgame.'
            : 'The best league starters are builds that perform well with minimal gear: Righteous Fire, Lightning Arrow, Boneshatter, and Arc are perennial picks because they scale on a low budget and transition smoothly into endgame.',
        },
      },
      {
        '@type': 'Question',
        name: locale === 'pt-br' ? 'Como abro uma build no Path of Building?' : 'How do I open a build in Path of Building?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: locale === 'pt-br'
            ? 'Use o PoB Viewer da Path of Trade para colar qualquer código de build e visualizar a árvore passiva, gemas e equipamentos diretamente no navegador, sem instalar nada.'
            : 'Use the Path of Trade PoB Viewer to paste any build code and inspect the passive tree, skill gems, and gear directly in your browser — no installation required.',
        },
      },
      {
        '@type': 'Question',
        name: locale === 'pt-br' ? 'Qual a diferença entre uma build SSF e uma build padrão?' : 'What is the difference between an SSF build and a standard build?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: locale === 'pt-br'
            ? 'Builds SSF (Solo Self-Found) são projetadas para funcionar apenas com itens que você mesmo encontra, sem depender do mercado. Elas priorizam habilidades que não dependem de únicos caros ou craft avançado.'
            : 'SSF (Solo Self-Found) builds are designed to function using only items you find yourself, without relying on trade. They prioritise skills that do not depend on expensive uniques or endgame crafting.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main>
        <Suspense>
          <BuildsClient
            builds={builds}
            total={total}
            page={1}
            locale={locale}
            leagues={leagues}
          />
        </Suspense>

        <section className="container mx-auto px-4 mt-12 border-t border-border pt-8">
          <div className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl space-y-4">
            {locale === "pt-br" ? (
              <>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  Como escolher uma build em Path of Exile
                </h2>
                <p>
                  Uma build é o conjunto de decisões que define como o seu personagem
                  joga: a classe e ascendência escolhidas, a habilidade principal, as gemas
                  de suporte, a árvore passiva e os itens que sustentam tudo isso. Pequenas
                  mudanças nessas peças transformam completamente a experiência, e é por isso
                  que vale a pena partir de um guia bem testado antes de improvisar.
                </p>
                <p>
                  Para quem está começando uma liga nova, uma <em>league starter</em> que
                  funciona com pouco investimento costuma ser a escolha mais segura, pois
                  permite farmar currency e evoluir até builds de endgame mais caras. Já quem
                  tem recursos e experiência pode mirar direto em arquétipos de alto custo,
                  focados em matar chefes ou limpar mapas com velocidade. Pensar no seu
                  orçamento e no objetivo é o primeiro passo para não desperdiçar tempo.
                </p>
                <p>
                  Catalogamos cada build com tags de classe, ascendência e estilo de jogo,
                  e você pode abrir qualquer uma no nosso PoB Viewer para inspecionar a árvore
                  passiva, as gemas e o equipamento direto no navegador. Seguir um guia testado
                  reduz tentativa e erro e ajuda iniciantes e veteranos a aproveitarem melhor
                  cada liga.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  How to choose a Path of Exile build
                </h2>
                <p>
                  A build is the full set of choices that defines how your character plays:
                  the class and ascendancy you pick, your main skill, the support gems, the
                  passive tree and the items that hold it all together. Small changes to those
                  pieces can completely reshape the experience, which is exactly why starting
                  from a well-tested guide beats improvising from scratch.
                </p>
                <p>
                  If you are kicking off a fresh league, a <em>league starter</em> that works
                  on a small budget is usually the safest pick, since it lets you farm currency
                  and grow toward pricier endgame setups. Players with resources and experience,
                  on the other hand, can aim straight for high-investment archetypes built around
                  bossing or fast map clearing. Weighing your budget against your goal is the
                  first step to spending your time wisely.
                </p>
                <p>
                  We catalogue every build with class, ascendancy and play-style tags, and you
                  can open any of them in our PoB Viewer to inspect the passive tree, gem links
                  and gear right in the browser. Following a proven guide cuts down on trial and
                  error and helps newcomers and veterans alike get more out of each league.
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
