import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLeagueLanding, getLeagueLandingSlugs } from "@/lib/league-landing";
import { buildBreadcrumbSchema, getOgLocale, generateKeywords } from "@/lib/utils";
import LeagueHero, { type HeroLabels } from "@/components/LeagueLanding/LeagueHero";
import TrailerGallery from "@/components/LeagueLanding/TrailerGallery";
import MechanicsSection from "@/components/LeagueLanding/MechanicsSection";
import FaqAccordion from "@/components/LeagueLanding/FaqAccordion";
import type { LeagueLanding, TrailerKind } from "@/types/league-landing";

// Short on purpose. The Sanity webhook (revalidateTag "leagueLanding") is the
// primary path and is near-instant, but during a reveal stream the cost of a
// stale hero is much higher than the cost of a re-render, so this is the floor
// if the webhook is ever misconfigured or drops an event.
export const revalidate = 60;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"
).replace(/\/+$/, "");

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Path the store CTA points at, or null while the league has no store presence. */
function storePath(league: LeagueLanding): string | null {
  if (!league.supabaseLeagueName) return null;
  return `/games/${league.gameVersion}/league/${nameToSlug(league.supabaseLeagueName)}`;
}

// ─── generateStaticParams ─────────────────────────────────────────────────────

export async function generateStaticParams() {
  const leagues = await getLeagueLandingSlugs();
  return leagues.flatMap((league) =>
    ["en", "pt-br"].map((locale) => ({ locale, slug: league.slug })),
  );
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const league = await getLeagueLanding(slug, locale);
  if (!league) return { title: "Not Found" };

  const isPt = locale === "pt-br";
  const gameShort =
    league.gameVersion === "path-of-exile-2" ? "PoE 2" : "PoE";
  const path = `/leagues/${slug}`;
  const enUrl = `${SITE_URL}${path}`;
  const ptUrl = `${SITE_URL}/pt-br${path}`;
  const canonicalUrl = isPt ? ptUrl : enUrl;

  // Date in the title is deliberate: the highest-volume query on launch week is
  // literally "<league> release date", and having it in the SERP title answers
  // the search before the click.
  const dateLabel = league.startsAt
    ? new Intl.DateTimeFormat(isPt ? "pt-BR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(league.startsAt))
    : null;

  // League name first, never "PoE"/"Path of Exile" first.
  // NN/g's link-scanning study (80 participants) found users judge a link from
  // roughly its first 11 characters — 35% of real links were unintelligible
  // from that prefix. "Path of Exi" spends the whole scanned zone on boilerplate
  // this audience already knows; "Curse of th" is unambiguous to a PoE player.
  // GGG can afford the prefix on their own domain; a third-party store cannot.
  // The game and version still appear, just after the distinctive part.
  const autoTitle = isPt
    ? `${league.name} — ${gameShort} ${league.version ?? ""}${dateLabel ? ` Início ${dateLabel}` : " Em Breve"}, Trailers e Mecânicas | Path of Trade`.replace(
        /\s+/g,
        " ",
      )
    : `${league.name} — ${gameShort} ${league.version ?? ""}${dateLabel ? ` Start Date ${dateLabel}` : " Coming Soon"}, Trailers & Mechanics | Path of Trade`.replace(
        /\s+/g,
        " ",
      );

  const autoDescription = isPt
    ? `Contagem regressiva para a liga ${league.name} de ${gameShort}${dateLabel ? `, que começa em ${dateLabel}` : ""}. Trailers, mecânicas, datas e tudo o que você precisa para se preparar para o dia 1.${league.tagline ? ` ${league.tagline}` : ""}`
    : `Countdown to the ${gameShort} ${league.name} league${dateLabel ? `, starting ${dateLabel}` : ""}. Trailers, mechanics, dates and everything you need to be ready on day one.${league.tagline ? ` ${league.tagline}` : ""}`;

  const title = league.seoTitle || autoTitle;
  const description = (league.seoDescription || autoDescription).slice(0, 300);

  const ogImage =
    league.ogImage?.asset?.url ||
    league.keyArt?.asset?.url ||
    `${SITE_URL}/images/${league.gameVersion === "path-of-exile-2" ? "path-of-exile2-card.webp" : "path-of-exile-card.webp"}`;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: league.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    keywords: generateKeywords({
      locale,
      gameVersion: league.gameVersion,
      league: league.name,
      leagueSlug: slug,
      customKeywords: [
        `${league.name} release date`,
        `${league.name} start time`,
        `${league.name} trailer`,
        isPt ? `quando começa a liga ${league.name}` : `when does ${league.name} start`,
        isPt ? `${league.name} data de lançamento` : `${league.name} launch`,
      ],
    }),
  };
}

// ─── Structured data ──────────────────────────────────────────────────────────

/**
 * Article, not Event.
 *
 * Event markup was the obvious reach for a dated launch, and it is wrong here.
 * Google's Event docs say verbatim that "virtual experiences that have no
 * real-world component aren't supported" and that events "must take place in a
 * physical location" — `eventAttendanceMode: OnlineEventAttendanceMode` was
 * removed in June 2025, so it is not the escape hatch it looks like. The docs
 * also forbid marking up "purchase opportunities" as events and warn that
 * "Google may take manual action against it". A league launch has no venue and
 * no ticket, this page sells currency, and there is no rich result to win: all
 * risk, no upside.
 *
 * Article is supported, honest about what the page is, and is the gap in the
 * field — PoE Vault outranks everyone here with no structured data at all.
 */
function buildArticleSchema(
  league: LeagueLanding,
  canonicalUrl: string,
  description: string,
  title: string,
) {
  const image = league.ogImage?.asset?.url || league.keyArt?.asset?.url;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title.slice(0, 110),
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    ...(image ? { image: [image] } : {}),
    dateModified: league.updatedAt,
    ...(league.revealAt ? { datePublished: league.revealAt } : {}),
    author: { "@type": "Organization", name: "Path of Trade", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Path of Trade",
      url: SITE_URL,
    },
    about: {
      "@type": "VideoGame",
      name:
        league.gameVersion === "path-of-exile-2"
          ? "Path of Exile 2"
          : "Path of Exile",
      publisher: { "@type": "Organization", name: "Grinding Gear Games" },
    },
  };
}

/**
 * VideoObject for the featured trailer. Unlike Event and FAQ, video rich
 * results are still live in Google's gallery — this is the one piece of markup
 * on the page with an actual SERP feature behind it.
 */
function buildVideoSchema(league: LeagueLanding, canonicalUrl: string) {
  const trailer = league.trailers[0];
  if (!trailer) return null;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: trailer.title,
    description: league.tagline ?? trailer.title,
    thumbnailUrl: [
      trailer.thumbnailUrl ?? `https://i.ytimg.com/vi/${trailer.youtubeId}/hqdefault.jpg`,
    ],
    uploadDate: league.revealAt ?? league.updatedAt,
    embedUrl: `https://www.youtube-nocookie.com/embed/${trailer.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${trailer.youtubeId}`,
    url: canonicalUrl,
  };
}

function buildFaqSchema(league: LeagueLanding) {
  if (league.faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: league.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeagueLandingPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const league = await getLeagueLanding(slug, locale);
  if (!league) notFound();

  const t = await getTranslations({ locale, namespace: "LeagueLanding" });

  const isPt = locale === "pt-br";
  const path = `/leagues/${slug}`;
  const canonicalUrl = isPt ? `${SITE_URL}/pt-br${path}` : `${SITE_URL}${path}`;

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
    buyCurrency: t("hero.buyCurrency", { league: league.name }),
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

  const description =
    league.seoDescription || league.tagline || league.intro || league.name;

  const isPt2 = locale === "pt-br";
  const gameShort = league.gameVersion === "path-of-exile-2" ? "PoE 2" : "PoE";
  const articleTitle =
    league.seoTitle ?? `${gameShort} ${league.name}${isPt2 ? "" : ""}`;

  const articleSchema = buildArticleSchema(
    league,
    canonicalUrl,
    description,
    articleTitle,
  );
  const videoSchema = buildVideoSchema(league, canonicalUrl);
  // Still emitted, but no longer load-bearing: Google deprecated FAQ rich
  // results for non-gov/health sites on 7 May 2026 and pulled the docs in June.
  // Valid Schema.org, harmless, zero SERP feature — keep expectations honest.
  const faqSchema = buildFaqSchema(league);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Path of Trade", url: isPt ? "/pt-br" : "/" },
    { name: t("breadcrumb.leagues"), url: isPt ? `${SITE_URL}/pt-br/leagues` : `${SITE_URL}/leagues` },
    { name: league.name, url: canonicalUrl },
  ]);

  return (
    // The site is dark-only (forcedTheme="dark" in the root layout), so the
    // body is always near-black and this page's hardcoded dark ink is safe
    // without a per-route override.
    <main className="relative w-full">
      {[breadcrumbSchema, articleSchema, videoSchema, faqSchema]
        .filter(Boolean)
        .map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

      <LeagueHero
        league={league}
        locale={locale}
        pageUrl={canonicalUrl}
        storeUrl={storePath(league)}
        labels={heroLabels}
      />

      {/* Intro sits tight under the hero — it is the hero's continuation, not a
          section of its own. Every section below shares one py-16 rhythm; the
          earlier mix of pt-16 and py-20 stacked into ~80px of dead space that
          read as a missing section. */}
      {league.intro && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-6">
          <div
            className={
              league.tagline
                ? "grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16"
                : ""
            }
          >
            <p className="max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
              {league.intro}
            </p>
            {/* The tagline becomes a display pull-quote here — the same words the
                hero carries as small body text, restated in Fontin so the
                right half of the band reads as composed, not empty. */}
            {league.tagline && (
              <p
                className="font-fontin border-l-2 pl-6 text-2xl leading-snug text-foreground/85 sm:text-3xl"
                style={{ borderColor: league.accentColor! }}
              >
                {league.tagline}
              </p>
            )}
          </div>
        </section>
      )}

      <TrailerGallery
        trailers={league.trailers}
        accentColor={league.accentColor!}
        labels={{
          heading: t("trailers.heading"),
          subheading: t("trailers.subheading"),
          play: t("trailers.play"),
          kinds: trailerKinds,
        }}
      />

      <MechanicsSection
        mechanics={league.mechanics}
        accentColor={league.accentColor!}
        locale={locale}
        revealAt={league.revealAt}
        officialUrl={league.officialUrl}
        labels={{
          heading: t("mechanics.heading"),
          subheading: t("mechanics.subheading", { league: league.name }),
          pendingTitle: t("mechanics.pendingTitle"),
          pendingBody: t("mechanics.pendingBody"),
          pendingWatch: t("mechanics.pendingWatch"),
          pendingTrailers: t("mechanics.pendingTrailers"),
        }}
      />

      <FaqAccordion
        faq={league.faq}
        accentColor={league.accentColor!}
        labels={{
          heading: t("faq.heading"),
          subheading: t("faq.subheading", { league: league.name }),
        }}
      />

      <div className="h-20" />
    </main>
  );
}
