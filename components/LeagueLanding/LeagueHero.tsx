"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ExternalLink, ShoppingCart, Play } from "lucide-react";
import Countdown from "./Countdown";
import AddToCalendar from "./AddToCalendar";
import { PoeBackdrop, PoeBadge, PoeHeading, PoeArtFade, SITE, FONTIN } from "./poe-ui";
import { sanityImageUrl } from "@/lib/league-landing";
import type { LeagueLanding, LeagueStatus } from "@/types/league-landing";

export interface HeroLabels {
  countdown: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    live: string;
    liveSub: string;
    localTime: string;
    srCountdown: string;
  };
  calendar: { add: string; added: string };
  startsIn: string;
  tbaTitle: string;
  tbaSub: string;
  watchTrailer: string;
  buyCurrency: string;
  official: string;
  scroll: string;
}

interface LeagueHeroProps {
  league: LeagueLanding;
  locale: string;
  pageUrl: string;
  storeUrl: string | null;
  labels: HeroLabels;
  /**
   * Post-launch only. When the league is live and this is provided, it takes the
   * countdown's slot (and widens it) — the economy panel, instead of a "live"
   * badge. A generic slot so the hub can put anything here.
   */
  liveAside?: ReactNode;
}

/**
 * Hero for a league page.
 *
 * Left-aligned, container-width, site card vocabulary — it reads as a Path of
 * Trade page first (compare /builds), with the league's accent doing the
 * theming. GGG's own league pages open on a framed trailer instead; that was
 * tried and dropped, because a video above the fold buries the countdown, which
 * is the one thing this page exists to answer.
 *
 * Key art is optional on purpose. There is none for Curse of the Allflame yet —
 * GGG has published only 920x150 news banners and YouTube thumbnails with text
 * baked in, and the real art lands with the press kit. So the no-art state is
 * the designed state, not a fallback: accent wash plus typography. Drop key art
 * into Sanity later and it slots into the right half with no code change.
 */
export function LeagueHero({
  league,
  locale,
  pageUrl,
  storeUrl,
  labels,
  liveAside,
}: LeagueHeroProps) {
  const accent = league.accentColor ?? "#3fd19a";
  // Cap the source before next/image sees it — the raw press-kit assets are
  // multi-megabyte PNGs and the optimiser has to fetch the whole thing on a
  // cache miss. 2560 covers the full-bleed art on the widest common desktop;
  // 760 covers the logo at its 380px slot on a 2x display.
  const rawKeyArt = league.keyArt?.asset?.url;
  const keyArtUrl = rawKeyArt ? sanityImageUrl(rawKeyArt, { w: 2560 }) : undefined;
  const lqip = league.keyArt?.asset?.metadata?.lqip;
  const rawLogo = league.logo?.asset?.url;
  const logoUrl = rawLogo ? sanityImageUrl(rawLogo, { w: 760, q: 85 }) : undefined;

  // Seeded from the server's derivation, then owned by the countdown once it
  // ticks — this is what flips the hero at the stroke of launch with no deploy.
  const [status, setStatus] = useState<LeagueStatus>(league.status);
  const handleStatusChange = useCallback((next: LeagueStatus) => setStatus(next), []);

  const gameLabel =
    league.gameVersion === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile";

  const showAside = status === "live" && !!liveAside;

  // The hero's right column.
  //  - upcoming → eyebrow + monumental countdown
  //  - no date  → the TBA state
  //  - live + aside → whatever the hub passed (e.g. an economy panel)
  //  - live + no aside → null: the countdown has nothing to say once launched,
  //    so the hero collapses to a single identity column instead of showing a
  //    "live" badge.
  const rightContent = showAside ? (
    liveAside
  ) : status === "live" ? null : league.startsAt ? (
    <div className="w-full">
      {status === "upcoming" && (
        <div className="mb-5 flex items-center gap-2.5">
          <span className="h-px w-7" style={{ backgroundColor: accent }} aria-hidden="true" />
          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: SITE.muted }}>
            {labels.startsIn}
          </p>
        </div>
      )}
      <Countdown
        startsAt={league.startsAt}
        accentColor={accent}
        locale={locale}
        labels={labels.countdown}
        onStatusChange={handleStatusChange}
      />
    </div>
  ) : (
    <div className="flex flex-col gap-2.5">
      <p
        className="text-[clamp(1.6rem,3.2vw,2.5rem)] font-semibold leading-tight"
        style={{ fontFamily: FONTIN, color: accent }}
      >
        {labels.tbaTitle}
      </p>
      <p className="max-w-md text-sm sm:text-base" style={{ color: SITE.muted }}>
        {labels.tbaSub}
      </p>
    </div>
  );

  // No right column (live with nothing passed) → the hero is a single column.
  const twoColumn = !keyArtUrl && rightContent != null;

  return (
    <header className="relative w-full overflow-hidden border-b lg:min-h-[85vh]" style={{ borderColor: SITE.border }}>
      {keyArtUrl ? (
        <>
          {/* Desktop: full-width art eliminates the seam between site bg and
              image bg. A strong left gradient keeps the text area readable. */}
          <div className="absolute inset-0 -z-10 hidden lg:block">
            <Image
              src={keyArtUrl}
              alt={league.keyArt?.alt ?? ""}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[85%_20%]"
              {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
            />
            <PoeArtFade side="left" />
          </div>
          {/* Mobile: art sits above the identity lockup, fading into near-black */}
          <div className="relative aspect-[16/9] w-full overflow-hidden lg:hidden">
            <Image
              src={keyArtUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
              {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          </div>
        </>
      ) : (
        <PoeBackdrop accent={accent} />
      )}

      {keyArtUrl ? (
        /* ── Cinematic hero: logo top-left, countdown bottom-center ── */
        <div className="relative flex min-h-[inherit] flex-col justify-between px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          {/* Gradient at the bottom so the countdown is readable */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2"
            style={{
              background: `linear-gradient(to top, ${SITE.bg} 0%, rgba(10,10,10,0.7) 50%, transparent 100%)`,
            }}
          />

          <h1 className="sr-only">{league.name}</h1>

          {/* Logo — centered within the left info column */}
          <div className="lg-rise relative z-10 mx-auto w-full max-w-7xl">
            <div className="flex justify-center lg:max-w-[420px]">
              {logoUrl ? (
                <div className="relative h-36 w-[min(90vw,380px)] sm:h-44 lg:h-52 lg:w-[380px]">
                  <Image
                    src={logoUrl}
                    alt={league.name}
                    fill
                    priority
                    sizes="(max-width: 640px) 90vw, 380px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <PoeHeading
                  as="span"
                  variant="fontin"
                  accent={accent}
                  className="text-center text-4xl sm:text-5xl lg:text-6xl"
                >
                  {league.name}
                </PoeHeading>
              )}
            </div>
          </div>

          {/* Countdown + CTAs — left column below the logo */}
          <div className="lg-rise relative z-10 mx-auto mt-auto w-full max-w-7xl pt-8" style={{ animationDelay: "120ms" }}>
            {rightContent && <div className="lg:max-w-[420px]">{rightContent}</div>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {storeUrl && (
                <Link
                  href={storeUrl}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{ backgroundColor: accent, ["--tw-ring-color" as string]: accent }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {labels.buyCurrency}
                </Link>
              )}
              {league.trailers.length > 0 && (
                <a
                  href="#trailers"
                  className="inline-flex items-center gap-2 rounded-lg border bg-card/60 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/10"
                  style={{ borderColor: `${SITE.border}80`, color: SITE.fg }}
                >
                  <Play className="h-3.5 w-3.5" />
                  {labels.watchTrailer}
                </a>
              )}
              {league.startsAt && status === "upcoming" && (
                <AddToCalendar
                  startsAt={league.startsAt}
                  title={`${league.name} — ${gameLabel}`}
                  description={league.tagline ?? league.name}
                  url={pageUrl}
                  accentColor={accent}
                  labels={labels.calendar}
                />
              )}
              {league.officialUrl && (
                <a
                  href={league.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-2.5 text-sm transition-colors hover:text-white"
                  style={{ color: SITE.muted }}
                >
                  {labels.official}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Standard hero: left-aligned content, no key art ── */
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div>
            <div
              className={
                !twoColumn
                  ? ""
                  : showAside
                    ? "grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"
                    : "grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
              }
            >
              <div className="lg-rise min-w-0">
                {logoUrl ? (
                  <>
                    <h1 className="sr-only">{league.name}</h1>
                    <div className="relative h-24 w-[min(92vw,520px)] sm:h-32">
                      <Image
                        src={logoUrl}
                        alt={league.name}
                        fill
                        priority
                        sizes="(max-width: 640px) 92vw, 520px"
                        className="object-contain object-left"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2.5">
                      <span
                        className="text-xs font-medium uppercase tracking-[0.28em]"
                        style={{ color: SITE.muted }}
                      >
                        {gameLabel}
                      </span>
                      {league.version && <PoeBadge accent={accent}>{league.version}</PoeBadge>}
                    </div>
                    <PoeHeading
                      as="h1"
                      variant="fontin"
                      accent={accent}
                      className="text-balance text-5xl leading-[1.03] sm:text-6xl lg:text-7xl"
                    >
                      {league.name}
                    </PoeHeading>
                  </>
                )}

                {league.tagline && (
                  <p className="mt-5 max-w-xl text-balance text-base sm:text-lg" style={{ color: SITE.muted }}>
                    {league.tagline}
                  </p>
                )}

                {rightContent && <div className="mt-10">{rightContent}</div>}
              </div>

              {twoColumn && (
                <div className="lg-rise min-w-0" style={{ animationDelay: "120ms" }}>
                  {rightContent}
                </div>
              )}
            </div>

            <div className="lg-rise mt-11 flex flex-wrap items-center gap-3" style={{ animationDelay: "220ms" }}>
              {storeUrl && (
                <Link
                  href={storeUrl}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{ backgroundColor: accent, ["--tw-ring-color" as string]: accent }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {labels.buyCurrency}
                </Link>
              )}
              {league.trailers.length > 0 && (
                <a
                  href="#trailers"
                  className="inline-flex items-center gap-2 rounded-lg border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: SITE.border, color: SITE.fg }}
                >
                  <Play className="h-3.5 w-3.5" />
                  {labels.watchTrailer}
                </a>
              )}
              {league.startsAt && status === "upcoming" && (
                <AddToCalendar
                  startsAt={league.startsAt}
                  title={`${league.name} — ${gameLabel}`}
                  description={league.tagline ?? league.name}
                  url={pageUrl}
                  accentColor={accent}
                  labels={labels.calendar}
                />
              )}
              {league.officialUrl && (
                <a
                  href={league.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-2.5 text-sm transition-colors hover:text-white"
                  style={{ color: SITE.muted }}
                >
                  {labels.official}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {league.highlights.length > 0 && (
              <dl
                className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t pt-7"
                style={{ borderColor: SITE.border }}
              >
                {league.highlights.map((h) => (
                  <div key={h.label}>
                    <dd className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
                      {h.value}
                    </dd>
                    <dt className="mt-0.5 text-[11px] uppercase tracking-[0.12em]" style={{ color: SITE.muted }}>
                      {h.label}
                    </dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default LeagueHero;
