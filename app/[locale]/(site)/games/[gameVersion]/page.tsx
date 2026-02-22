import { CurrencyInfo } from "@/components/currency-info";
import GameVersionPosts from "@/components/GameVersionPosts";
import { LeagueSelectionPage } from "@/components/league-selection";
import PatchInfo from "@/components/PatchInfo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, generateKeywords, buildBreadcrumbSchema } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

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
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
            aria-label={t("backToHome")}
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm md:text-base font-semibold">{t("backToHome")}</span>
          </Link>
        </div>
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
          </article>
        </section>
      </main>
    </>
  );
}
