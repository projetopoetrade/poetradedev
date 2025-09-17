import { CurrencyInfo } from "@/components/currency-info";
import GameVersionPosts from "@/components/GameVersionPosts";
import { LeagueSelectionPage } from "@/components/league-selection";
import PatchInfo from "@/components/PatchInfo";
import { Metadata } from "next";
import { useTranslations } from "next-intl";

// Generate metadata based on game version
export async function generateMetadata(props: {
  params: Promise<{ gameVersion: "path-of-exile-1" | "path-of-exile-2" }>;
}): Promise<Metadata> {
  const params = await props.params;
  const isPoe2 = params.gameVersion === "path-of-exile-2";
  const gameTitle = isPoe2 ? "Path of Exile 2" : "Path of Exile";
  const shortGameName = isPoe2 ? "PoE 2" : "PoE"; // Shorter version for concise text

  // More engaging and keyword-rich descriptions
  const description = isPoe2
    ? `Dive into Path of Exile 2 trading with Path of Trade Net! Securely buy and sell ${shortGameName} currency, items, and orbs. Experience instant transactions, competitive prices, and dedicated 24/7 support for all your ${gameTitle} needs.`
    : `Your premier Path of Exile trading hub is Path of Trade Net. Effortlessly buy and sell ${shortGameName} currency, orbs, and unique items. Benefit from lightning-fast delivery, unbeatable prices, and round-the-clock customer assistance for ${gameTitle}.`;

  const pageTitle = `Buy ${gameTitle} Currency & Items | Safe ${shortGameName} Trading | Path of Trade Net`;
  const canonicalUrl = `https://pathoftrade.net/${params.gameVersion}`; // Adjust path as per your routing
  const socialImageUrl = isPoe2
    ? `https://pathoftrade.net/images/social-poe2.png`
    : `https://pathoftrade.net/images/social-poe1.png`; // Create these images

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: canonicalUrl, // Use the canonical URL here
      type: "website",
      siteName: "Path of Trade Net",
      images: [
        {
          url: socialImageUrl,
          width: 1200, // Standard OG image width
          height: 630, // Standard OG image height
          alt: `${gameTitle} Currency Trading - Path of Trade Net`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [socialImageUrl], // Twitter also uses og:image if twitter:image is not set, but explicit is better
      // site: "@YourTwitterHandle", // Optional: Add your Twitter username
    },
    // Meta keywords are generally ignored by Google, so they are omitted.
    // Focus on high-quality content and natural keyword integration.
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
  const patchVersion = isPoe2 ? "poe2" : "3.25";

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
              <p className="mt-2 text-base text-muted-foreground"></p>
            </header>
            <PatchInfo gameVersion={patchVersion} />
            <CurrencyInfo gameVersion={gameVersion} />
          </article>
        </section>
      </main>
    </>
  );
}
