import { CurrencyInfo } from "@/components/currency-info";
import GameVersionPosts from "@/components/GameVersionPosts";
import { LeagueSelectionPage } from "@/components/league-selection";
import PatchInfo from "@/components/PatchInfo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, getHreflangAlternates } from "@/lib/utils";


// Generate metadata based on game version
export async function generateMetadata(props: {
  params: Promise<{ gameVersion: "path-of-exile-1" | "path-of-exile-2"; locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const isPoe2 = params.gameVersion === "path-of-exile-2";
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });
  const title = isPoe2 ? t("gameVersion.poe2Title") : t("gameVersion.poe1Title");
  const description = isPoe2 ? t("gameVersion.poe2Description") : t("gameVersion.poe1Description");
  const canonicalUrl = buildCanonical(`/${params.locale}/games/${params.gameVersion}`, params.locale);
  const socialImageUrl = isPoe2
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/images/social-poe2.png`
    : `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/images/social-poe1.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      ...getHreflangAlternates({
        "en": `/en/games/${params.gameVersion}`,
        "pt-br": `/pt-br/games/${params.gameVersion}`
      }, `/games/${params.gameVersion}`) // x-default points to path without locale prefix
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

  const isPoe2 = gameVersion === "path-of-exile-2";

  const shortGameName = isPoe2 ? "PoE 2" : "PoE";
  const gameTitle = isPoe2 ? "Path of Exile 2" : "Path of Exile";
  const patchVersion = isPoe2 ? "path-of-exile-2" : "path-of-exile-1";

  // Structured data for rich results

  return (
    <>
      <main className="container mx-auto min-h-screen space-y-16 py-8">
        <LeagueSelectionPage gameVersion={gameVersion} />
        <section className="mb-12">
          <article className="space-y-8">
            <GameVersionPosts
              category="news"
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
