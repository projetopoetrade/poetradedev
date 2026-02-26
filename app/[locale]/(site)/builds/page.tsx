import { Suspense } from "react";
import { Metadata } from "next";
import { buildAbsoluteUrl } from "@/lib/utils";
import { getBuilds } from "@/app/actions";
import BuildsClient from "./BuildsClient";

export const revalidate = 300;

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
  const allBuildsForLeagues = await getBuilds({ limit: 500 });
  const leagues = Array.from(new Set(allBuildsForLeagues.builds.map((b) => b.league).filter(Boolean) as string[])).sort();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net';

  // JSON-LD ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Path of Exile Builds',
    url: locale === 'en' ? `${baseUrl}/builds` : `${baseUrl}/pt-br/builds`,
    numberOfItems: total,
    itemListElement: builds.map((build, i) => ({
      '@type': 'ListItem',
      position: i + 1 + (page - 1) * 12,
      url: buildAbsoluteUrl(`/builds/${build.slug}`),
      name: build.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
