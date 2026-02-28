import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBuilds, getPublishedLeagueSlugsFromBuilds } from "@/app/actions";
import { getLeagueBySlug } from "@/sanity/sanity-utils";
import { buildAbsoluteUrl, buildBreadcrumbSchema } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import BuildCard from "@/components/Builds/BuildCard";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string; leagueSlug: string }>;
}

function toLeagueTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  try {
    const leagueSlugs = await getPublishedLeagueSlugsFromBuilds();
    return ["en", "pt-br"].flatMap((locale) =>
      leagueSlugs.map((leagueSlug) => ({ locale, leagueSlug }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, leagueSlug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

  // Try to get a nicer league title from Sanity; fall back to slug conversion
  let leagueTitle = toLeagueTitle(leagueSlug);
  try {
    const sanityLeague = await getLeagueBySlug(leagueSlug);
    if (sanityLeague?.title) leagueTitle = sanityLeague.title;
  } catch {
    // Non-blocking — fall back to generated title
  }

  const titles: Record<string, string> = {
    en: `Best ${leagueTitle} Builds — PoE Build Guides | Path of Trade`,
    "pt-br": `Melhores Builds ${leagueTitle} — Guias PoE | Path of Trade`,
  };
  const descriptions: Record<string, string> = {
    en: `Browse curated Path of Exile builds for ${leagueTitle}. Filter by class, ascendancy, and build type.`,
    "pt-br": `Confira as melhores builds de Path of Exile para ${leagueTitle}. Filtre por classe, ascendência e tipo de build.`,
  };

  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;

  const enUrl = `${baseUrl}/builds/league/${leagueSlug}`;
  const ptUrl = `${baseUrl}/pt-br/builds/league/${leagueSlug}`;
  const canonicalUrl = locale === "en" ? enUrl : ptUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        "pt-BR": ptUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Path of Trade",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const LIMIT = 12;

export default async function LeagueBuildsPage({ params }: Props) {
  const { locale, leagueSlug } = await params;
  setRequestLocale(locale);

  const { builds, total } = await getBuilds({ leagueSlug, limit: LIMIT });

  if (builds.length === 0) notFound();

  // Try to enrich with Sanity league data (optional)
  let leagueTitle = toLeagueTitle(leagueSlug);
  let sanityLeagueSlug: string | null = null;
  try {
    const sanityLeague = await getLeagueBySlug(leagueSlug);
    if (sanityLeague?.title) {
      leagueTitle = sanityLeague.title;
      sanityLeagueSlug = sanityLeague.slug;
    }
  } catch {
    // Non-blocking
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net").replace(/\/+$/, "");
  const localePath = locale === "en" ? "" : `/${locale}`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${baseUrl}${localePath}` },
    { name: "Builds", url: `${baseUrl}${localePath}/builds` },
    { name: `${leagueTitle} Builds`, url: `${baseUrl}${localePath}/builds/league/${leagueSlug}` },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${leagueTitle} Builds`,
    url: `${baseUrl}${localePath}/builds/league/${leagueSlug}`,
    numberOfItems: total,
    itemListElement: builds.map((build, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: buildAbsoluteUrl(`/builds/${build.slug}`),
      name: build.title,
    })),
  };

  const leaguePageHref =
    sanityLeagueSlug
      ? `/games/path-of-exile-1/league/${sanityLeagueSlug}`
      : null;

  // Define FAQ data once — schema and UI both derive from this array
  const faqItems: { q: string; a: string }[] =
    locale === "pt-br"
      ? [
          {
            q: `Quais são as melhores builds para ${leagueTitle}?`,
            a: `Confira nossa seleção de builds curadas especificamente para a liga ${leagueTitle}. Cada guia inclui o código completo para o Path of Building e recomendações de equipamentos.`,
          },
          {
            q: `Qual é o melhor league starter para ${leagueTitle}?`,
            a: `Os melhores league starters para ${leagueTitle} são builds que funcionam bem com equipamentos básicos e escalam ao longo do endgame. Filtre por "League Starter" para ver as opções recomendadas.`,
          },
          {
            q: "Como importo um código PoB para o Path of Building?",
            a: 'Abra o Path of Building, clique em "Import/Export Build" e cole o código. Você também pode usar o PoB Viewer da Path of Trade para visualizar qualquer build diretamente no navegador.',
          },
        ]
      : [
          {
            q: `What are the best builds for ${leagueTitle}?`,
            a: `Browse our curated build selection for the ${leagueTitle} league. Each guide includes a full Path of Building code and gear recommendations.`,
          },
          {
            q: `What is the best league starter for ${leagueTitle}?`,
            a: `The best league starters for ${leagueTitle} are builds that perform well with minimal gear and scale into endgame. Filter by "League Starter" to see recommended options.`,
          },
          {
            q: "How do I import a PoB code into Path of Building?",
            a: 'Open Path of Building, click "Import/Export Build" and paste the code. You can also use the Path of Trade PoB Viewer to inspect any build directly in your browser.',
          },
        ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
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

      <main className="min-h-screen py-12 px-4 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Builds", href: "/builds" },
              { label: `${leagueTitle} Builds` },
            ]}
          />
        </div>

        {/* Header + intro */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {leagueTitle} Builds
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-3xl mb-4">
            {locale === "pt-br"
              ? `Encontre as melhores builds curadas para a liga ${leagueTitle}. Cada guia inclui código completo para o Path of Building, recomendações de ascendência e dicas de equipamentos para começar e progredir no endgame.`
              : `Find the best curated builds for the ${leagueTitle} league. Every guide includes a full Path of Building code, ascendancy recommendations, and gear tips to get you started and carry you into endgame.`}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500">
              {total} build{total !== 1 ? "s" : ""}
            </span>
            {leaguePageHref && (
              <Button asChild variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white text-xs">
                <Link href={leaguePageHref}>
                  {locale === "pt-br"
                    ? `Guia da Liga ${leagueTitle} →`
                    : `${leagueTitle} League Guide →`}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Builds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {builds.map((build) => (
            <BuildCard key={build.id} build={build} locale={locale} />
          ))}
        </div>

        {/* More builds CTA */}
        {total > LIMIT && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-3">
              {locale === "pt-br"
                ? `Mostrando ${builds.length} de ${total} builds.`
                : `Showing ${builds.length} of ${total} builds.`}
            </p>
            <Button asChild variant="outline" className="border-gray-700 text-gray-400 hover:text-white">
              <Link href={`/builds?league=${leagueSlug}`}>
                {locale === "pt-br" ? "Ver Todas as Builds →" : "View All Builds →"}
              </Link>
            </Button>
          </div>
        )}

        {/* FAQ */}
        <section className="mt-24 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            {locale === "pt-br" ? "Perguntas Frequentes" : "Frequently Asked Questions"}
          </h2>
          <div className="space-y-5">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="border border-gray-800/60 rounded-lg p-5 bg-black/30">
                <h3 className="font-medium text-white mb-2 text-sm">{q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
