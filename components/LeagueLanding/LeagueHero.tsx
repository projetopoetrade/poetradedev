"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ExternalLink, ShoppingCart, Play } from "lucide-react";
import Countdown from "./Countdown";
import AddToCalendar from "./AddToCalendar";
import { PoeBackdrop, PoeBadge, PoeHeading, PoeArtFade, SITE, FONTIN } from "./poe-ui";
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
  const keyArtUrl = league.keyArt?.asset?.url;
  const lqip = league.keyArt?.asset?.metadata?.lqip;
  const logoUrl = league.logo?.asset?.url;

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
    <header className="relative w-full overflow-hidden border-b" style={{ borderColor: SITE.border }}>
      <PoeBackdrop accent={accent} />

      {keyArtUrl && (
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] lg:block">
          <Image
            src={keyArtUrl}
            alt={league.keyArt?.alt ?? ""}
            fill
            priority
            sizes="58vw"
            className="object-cover"
            {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
          />
          <PoeArtFade side="left" />
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className={keyArtUrl ? "lg:max-w-[52%]" : ""}>
          {/* Identity and time sit side by side when there is no key art, so the
              countdown fills the right half instead of leaving it empty. CTAs
              live in a full-width row below the grid — which also gives mobile
              the right stacking order (name → time → actions). */}
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
                  {/* The official GGG league logo (Path of Exile + league name)
                      replaces the type lockup. The h1 still carries the name as
                      text for search engines and screen readers. */}
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
                  {/* Type lockup that mirrors the shape of the GGG league logo —
                      the game name set small over the league name — so leagues
                      without an uploaded logo still read like one. */}
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

              {/* With key art, the time cluster continues the left column. */}
              {keyArtUrl && rightContent && <div className="mt-10">{rightContent}</div>}
            </div>

            {/* No key art: the countdown becomes the right column (nothing once
                live unless the hub passes an aside). */}
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
    </header>
  );
}

export default LeagueHero;
