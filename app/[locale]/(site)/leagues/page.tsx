import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLeagueLandingIndex } from "@/lib/league-landing";
import { buildBreadcrumbSchema, getOgLocale, generateKeywords } from "@/lib/utils";
import LeagueCard from "@/components/LeagueLanding/LeagueCard";

// ISR: o conteúdo vem do Sanity, e `sanityFetch` marca toda query com o `_type`
// do documento — publicar no Studio dispara o webhook em `/api/revalidate` e a
// página se refaz na hora. Este TTL é só a rede de segurança se o webhook cair.
export const revalidate = 86400;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"
).replace(/\/+$/, "");

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt-br" }];
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "LeagueLanding" });
  const isPt = locale === "pt-br";

  const enUrl = `${SITE_URL}/leagues`;
  const ptUrl = `${SITE_URL}/pt-br/leagues`;
  const canonicalUrl = isPt ? ptUrl : enUrl;

  const title = t("index.seoTitle");
  const description = t("index.seoDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { en: enUrl, "pt-BR": ptUrl, "x-default": enUrl },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...getOgLocale(locale),
      siteName: "Path of Trade",
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: generateKeywords({
      locale,
      customKeywords: isPt
        ? ["ligas path of exile", "próxima liga poe", "quando começa a liga poe"]
        : ["path of exile leagues", "next poe league", "poe league start date"],
    }),
  };
}

export default async function LeaguesIndexPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "LeagueLanding" });
  const leagues = await getLeagueLandingIndex(locale);
  const isPt = locale === "pt-br";

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Path of Trade", url: isPt ? "/pt-br" : "/" },
    { name: t("index.heading"), url: isPt ? `${SITE_URL}/pt-br/leagues` : `${SITE_URL}/leagues` },
  ]);

  // ItemList tells crawlers this is a collection and in what order — the same
  // pattern /builds already uses.
  const itemListSchema =
    leagues.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: leagues.map((league, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: league.name,
            url: `${SITE_URL}${isPt ? "/pt-br" : ""}/leagues/${league.slug}`,
          })),
        }
      : null;

  const cardLabels = {
    live: t("card.live"),
    upcoming: t("card.upcoming"),
    tba: t("card.tba"),
    view: t("card.view"),
  };

  return (
    <main className="relative min-h-screen w-full bg-black">
      {[breadcrumbSchema, itemListSchema].filter(Boolean).map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            {t("index.heading")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-sm text-white/50 sm:text-base">
            {t("index.subheading")}
          </p>
        </div>

        {leagues.length === 0 ? (
          <p className="py-24 text-center text-sm text-white/40">
            {t("index.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                locale={locale}
                labels={cardLabels}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
