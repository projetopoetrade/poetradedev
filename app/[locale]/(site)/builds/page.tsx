import { Suspense } from "react";
import { Metadata } from "next";
import { buildAbsoluteUrl, buildBreadcrumbSchema } from "@/lib/utils";
import { getBuilds, getDistinctBuildLeagues } from "@/app/actions";
import BuildsClient from "./BuildsClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
      siteName: 'Path of Trade',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BuildsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const gameVersion = typeof sp.gameVersion === 'string' ? sp.gameVersion : undefined;
  const league = typeof sp.league === 'string' ? sp.league : undefined;
  const poeClass = typeof sp.class === 'string' ? sp.class : undefined;
  const ascendancy = typeof sp.ascendancy === 'string' ? sp.ascendancy : undefined;
  const tagsParam = typeof sp.tags === 'string' ? sp.tags.split(',').filter(Boolean) : undefined;
  const search = typeof sp.search === 'string' ? sp.search : undefined;
  const page = typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1;

  const { builds, total } = await getBuilds({
    gameVersion,
    league,
    class: poeClass,
    ascendancy,
    tags: tagsParam,
    search,
    page,
    limit: 12,
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
      position: i + 1 + (page - 1) * 12,
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
      <Suspense>
        <BuildsClient
          builds={builds}
          total={total}
          page={page}
          locale={locale}
          leagues={leagues}
        />
      </Suspense>
    </>
  );
}
