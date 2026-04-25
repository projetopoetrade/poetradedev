import { CurrencyInfo } from "@/components/currency-info";
import GameVersionPosts from "@/components/GameVersionPosts";
import { LeagueSelectionPage } from "@/components/league-selection";
import PatchInfo from "@/components/PatchInfo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, generateKeywords, buildBreadcrumbSchema, getOgLocale } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";

// ISR: revalidate cache every 5 minutes
export const revalidate = 300;


// Generate metadata based on game version
export async function generateMetadata(props: {
  params: Promise<{ gameVersion: "path-of-exile-1" | "path-of-exile-2"; locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const isPoe2 = params.gameVersion === "path-of-exile-2";
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  const title = isPoe2 ? t("gameVersion.poe2Title") : t("gameVersion.poe1Title");
  const description = isPoe2 ? t("gameVersion.poe2Description") : t("gameVersion.poe1Description");

  // 1. Construção das URLs
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  const pathWithoutLocale = `/games/${params.gameVersion}`;

  const enUrl = `${baseUrl}${pathWithoutLocale}`;
  const ptUrl = `${baseUrl}/pt-br${pathWithoutLocale}`;

  // Canonical correta para a língua atual
  const canonicalUrl = params.locale === 'en' ? enUrl : ptUrl;

  const socialImageUrl = isPoe2
    ? `${baseUrl}/images/social-poe2.png`
    : `${baseUrl}/images/social-poe1.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      // 2. Adição dos Hreflangs
      languages: {
        'en': enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl,
      }
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...getOgLocale(params.locale),
      siteName: t("siteName"),
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl],
    },
    keywords: generateKeywords({
      locale: params.locale,
      gameVersion: params.gameVersion,
      customKeywords: ['buy currency', 'trading', 'items', 'guides']
    })
  };
}
export default async function Page({
  params,
}: {
  params: {
    gameVersion: "path-of-exile-1" | "path-of-exile-2";
    locale: string;
  };
}) {
  const { gameVersion, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });

  const isPoe2 = gameVersion === "path-of-exile-2";

  const shortGameName = isPoe2 ? "PoE 2" : "PoE";
  const gameTitle = isPoe2 ? "Path of Exile 2" : "Path of Exile";
  const patchVersion = isPoe2 ? "path-of-exile-2" : "path-of-exile-1";

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: gameTitle, url: `/games/${gameVersion}` },
  ]);

  // Structured data for rich results

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="container mx-auto min-h-screen space-y-16 py-8">
        <Breadcrumb
          items={[
            { label: gameTitle },
          ]}
        />
      <LeagueSelectionPage gameVersion={gameVersion} />
        <section className="mb-12">
          <article className="space-y-8">
            <GameVersionPosts
              category="Guide"
              gameVersion={gameVersion}
              locale={locale}
              maxPosts={4}
            />
            <header>
              <h2 className="text-4xl font-bold">{gameTitle} Major Updates</h2>
              <p className="mt-2 text-base text-muted-foreground">Latest updates and changes for {gameTitle}.</p>
            </header>
            <PatchInfo gameVersion={patchVersion} />
            <CurrencyInfo gameVersion={gameVersion} />

            {/* Browse by Category */}
            <div className="pt-4">
              <h2 className="text-2xl font-bold mb-1">{`Buy ${gameTitle} Currency, Items & Services`}</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {isPoe2
                  ? "Cheap prices, fast in-game delivery and secure trading for Path of Exile 2."
                  : "Cheap prices, fast in-game delivery and secure trading for Path of Exile 1."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    slug: "currency",
                    label: isPoe2 ? "Buy PoE 2 Currency" : "Buy PoE 1 Currency",
                    desc: isPoe2
                      ? "Divine Orbs, Chaos Orbs, Exalted Orbs and more — cheap prices"
                      : "Chaos Orbs, Divine Orbs, Exalted Orbs and more — cheap prices",
                  },
                  {
                    slug: "items",
                    label: isPoe2 ? "Buy PoE 2 Items" : "Buy PoE 1 Items",
                    desc: "Unique equipment, flasks, jewels and endgame gear",
                  },
                  {
                    slug: "services",
                    label: isPoe2 ? "Buy PoE 2 Services" : "Buy PoE 1 Services",
                    desc: "Power leveling, boss carries and progression boosts",
                  },
                ].map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/games/${gameVersion}/${cat.slug}`}
                    className="group block p-5 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  >
                    <p className="font-semibold mb-1 group-hover:text-primary transition-colors">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
