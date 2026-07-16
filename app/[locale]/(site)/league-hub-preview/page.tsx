import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLeagueLanding } from "@/lib/league-landing";
import LeagueHero, { type HeroLabels } from "@/components/LeagueLanding/LeagueHero";
import PriceTracker from "@/components/LeagueLanding/PriceTracker";
import ProductsSection from "@/components/LeagueLanding/ProductsSection";
import BuildsSection from "@/components/LeagueLanding/BuildsSection";
import MechanicsSection from "@/components/LeagueLanding/MechanicsSection";
import TrailerGallery from "@/components/LeagueLanding/TrailerGallery";
import FaqAccordion from "@/components/LeagueLanding/FaqAccordion";
import {
  MOCK_PRICES,
  MOCK_PRODUCTS,
  MOCK_BUILDS,
  MOCK_MECHANICS,
  MOCK_GAINERS,
  MOCK_LOSERS,
} from "@/lib/league-hub-mock";
import type { TrailerKind } from "@/types/league-landing";

/**
 * Throwaway preview of the *post-launch* league hub, with mock data.
 *
 * This is a separate route on purpose: the real page at /leagues/[slug] stays
 * statically generated (ISR), so reading searchParams here — which forces
 * dynamic rendering — never touches its performance. It fetches a real league
 * for its name/tagline/trailers, then forces the live state (a start in the
 * past, a store presence, stand-in mechanics) and renders the hub sections with
 * mock data from lib/league-hub-mock. Not indexed.
 *
 * When the hub goes live for real, these same sections move into the live
 * branch of the real page, fed by getProductsWithParams / poe.ninja / the
 * builds table instead of the mocks. See docs/LEAGUE_PAGES.md §Pendências.
 */
export const metadata: Metadata = {
  title: "League hub preview (mock data)",
  robots: { index: false, follow: false },
};

const DEFAULT_SLUG = "curse-of-the-allflame";

export default async function LeagueHubPreviewPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ slug?: string }>;
}) {
  const { locale } = await props.params;
  const { slug } = await props.searchParams;
  setRequestLocale(locale);

  const real = await getLeagueLanding(slug || DEFAULT_SLUG, locale);
  if (!real) notFound();

  const t = await getTranslations({ locale, namespace: "LeagueLanding" });
  const accent = real.accentColor!;

  // Force the post-launch state so the whole hub is visible. Mock key art (a
  // real Allflame trailer still) stands in for the press-kit image that would
  // be uploaded to Sanity's `keyArt` field.
  const view = {
    ...real,
    startsAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: "live" as const,
    supabaseLeagueName: real.supabaseLeagueName ?? "Allflame",
    mechanics: real.mechanics.length ? real.mechanics : MOCK_MECHANICS,
    keyArt:
      real.keyArt ??
      ({
        asset: { url: "https://i.ytimg.com/vi/8LEERrp5LE4/maxresdefault.jpg", metadata: {} },
        alt: `${real.name} key art`,
      } as unknown as NonNullable<typeof real.keyArt>),
  };

  const heroLabels: HeroLabels = {
    countdown: {
      days: t("countdown.days"),
      hours: t("countdown.hours"),
      minutes: t("countdown.minutes"),
      seconds: t("countdown.seconds"),
      live: t("countdown.live"),
      liveSub: t("countdown.liveSub"),
      localTime: t("countdown.localTime"),
      srCountdown: t("countdown.srCountdown"),
    },
    calendar: { add: t("calendar.add"), added: t("calendar.added") },
    startsIn: t("hero.startsIn"),
    tbaTitle: t("hero.tbaTitle"),
    tbaSub: t("hero.tbaSub"),
    watchTrailer: t("hero.watchTrailer"),
    buyCurrency: t("hero.buyCurrency", { league: view.name }),
    official: t("hero.official"),
    scroll: t("hero.scroll"),
  };

  const trailerKinds: Record<TrailerKind, string> = {
    teaser: t("trailers.kinds.teaser"),
    trailer: t("trailers.kinds.trailer"),
    gameplay: t("trailers.kinds.gameplay"),
    mechanic: t("trailers.kinds.mechanic"),
    vod: t("trailers.kinds.vod"),
  };

  return (
    <main className="relative w-full">
      {/* Unmistakable preview marker — this route is never the real page. */}
      <div
        className="w-full border-b text-center text-[11px] uppercase tracking-[0.18em]"
        style={{ borderColor: `${accent}40`, backgroundColor: `${accent}14`, color: accent }}
      >
        <p className="mx-auto max-w-7xl px-4 py-2">
          Preview · post-launch hub · mock data (prices, currency and builds are placeholders)
        </p>
      </div>

      <LeagueHero
        league={view}
        locale={locale}
        pageUrl="#"
        storeUrl="#buy"
        labels={heroLabels}
      />

      <PriceTracker
        prices={MOCK_PRICES}
        gainers={MOCK_GAINERS}
        losers={MOCK_LOSERS}
        accentColor={accent}
        updatedLabel="updated 8 min ago"
      />

      <ProductsSection
        products={MOCK_PRODUCTS}
        accentColor={accent}
        leagueName={view.name}
        storeUrl="#buy"
      />

      <BuildsSection builds={MOCK_BUILDS} accentColor={accent} leagueName={view.name} />

      <MechanicsSection
        mechanics={view.mechanics}
        accentColor={accent}
        locale={locale}
        revealAt={view.revealAt}
        officialUrl={view.officialUrl}
        labels={{
          heading: t("mechanics.heading"),
          subheading: t("mechanics.subheading", { league: view.name }),
          pendingTitle: t("mechanics.pendingTitle"),
          pendingBody: t("mechanics.pendingBody"),
          pendingWatch: t("mechanics.pendingWatch"),
          pendingTrailers: t("mechanics.pendingTrailers"),
        }}
      />

      <TrailerGallery
        trailers={view.trailers}
        accentColor={accent}
        labels={{
          heading: t("trailers.heading"),
          subheading: t("trailers.subheading"),
          play: t("trailers.play"),
          kinds: trailerKinds,
        }}
      />

      <FaqAccordion
        faq={view.faq}
        accentColor={accent}
        labels={{
          heading: t("faq.heading"),
          subheading: t("faq.subheading", { league: view.name }),
        }}
      />

      <div className="h-20" />
    </main>
  );
}
