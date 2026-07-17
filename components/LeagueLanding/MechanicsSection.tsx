"use client";

import { Check, Radio, ExternalLink } from "lucide-react";
import LocalDateTime from "./LocalDateTime";
import { PoeArtFade, PoeHeading, SITE } from "./poe-ui";
import type { Mechanic, MechanicCategory } from "@/types/league-landing";

interface MechanicsSectionProps {
  mechanics: Mechanic[];
  accentColor: string;
  locale: string;
  revealAt?: string;
  officialUrl?: string;
  labels: {
    heading: string;
    subheading: string;
    pendingTitle: string;
    pendingBody: string;
    pendingWatch: string;
    pendingTrailers: string;
    categoryLeague: string;
    categoryEndgame: string;
    categoryBalance: string;
  };
}

const CATEGORY_ORDER: MechanicCategory[] = ["league", "endgame", "balance"];

function groupByCategory(mechanics: Mechanic[]) {
  const groups = new Map<MechanicCategory, Mechanic[]>();
  for (const m of mechanics) {
    const cat = m.category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(m);
  }
  return CATEGORY_ORDER
    .filter((c) => groups.has(c))
    .map((c) => ({ category: c, items: groups.get(c)! }));
}

// Spans the whole panel rather than sitting behind the text column, so the
// opaque stop always lands past the text no matter how the panel reflows —
// a percentage gradient on the column itself drifts off the text as the panel
// narrows and leaves the copy sitting unreadable on top of the video.
const GRADIENT_LEFT =
  "linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.88) 30%, rgba(10,10,10,0.6) 48%, rgba(10,10,10,0.25) 62%, rgba(10,10,10,0) 75%)";
const GRADIENT_RIGHT =
  "linear-gradient(to left, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.88) 30%, rgba(10,10,10,0.6) 48%, rgba(10,10,10,0.25) 62%, rgba(10,10,10,0) 75%)";

function LeagueCard({
  mechanic,
  index,
  accentColor,
}: {
  mechanic: Mechanic;
  index: number;
  accentColor: string;
}) {
  // The still is a CSS background, so next/image never sees it and the asset is
  // served at whatever size it was uploaded — ask the CDN to resize instead.
  const imageUrl = mechanic.image?.asset?.url
    ? `${mechanic.image.asset.url}?w=1600&q=80&auto=format`
    : undefined;
  const hasMedia = !!(imageUrl || mechanic.videoUrl);
  // Panels alternate by default; `imagePosition` pins the media to one side for
  // art whose subject sits off-centre and would otherwise land under the text.
  const textRight =
    mechanic.imagePosition === "right"
      ? false
      : mechanic.imagePosition === "left"
        ? true
        : index % 2 === 1;

  if (!hasMedia) {
    return (
      <article
        className="mx-auto w-full max-w-7xl rounded-lg border px-4 py-7 sm:px-10 sm:py-10"
        style={{ borderColor: SITE.border, backgroundColor: "hsl(0 0% 5.5%)" }}
      >
        <PoeHeading as="h3" className="text-2xl sm:text-3xl">
          {mechanic.title}
        </PoeHeading>
        <p
          className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed sm:text-base"
          style={{ color: SITE.muted }}
        >
          {mechanic.summary}
        </p>
        {mechanic.bullets.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2.5">
            {mechanic.bullets.map((bullet, bi) => (
              <li key={bi} className="flex items-start gap-2.5 text-sm sm:text-base" style={{ color: SITE.muted }}>
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </article>
    );
  }

  return (
    <article
      className="relative aspect-[1440/582] max-h-[582px] w-full overflow-hidden"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Media — two layers, mirroring the official panels:
          the still fills the panel height at its own width, anchored away from
          the text; the video (narrower than the panel) sits on top on the same
          side, so the still covers the strip the video does not reach. */}
      <div
        className={`absolute inset-0 flex ${textRight ? "justify-start" : "justify-end"}`}
        style={
          imageUrl
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "auto 100%",
                backgroundPosition: textRight ? "5% 0%" : "95% 0%",
                backgroundRepeat: "no-repeat",
              }
            : undefined
        }
      >
        {mechanic.videoUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-auto max-w-none object-contain"
          >
            <source src={mechanic.videoUrl} type="video/webm" />
          </video>
        )}
      </div>

      {/* Scrim — full-width so its opaque stop tracks the text column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: textRight ? GRADIENT_RIGHT : GRADIENT_LEFT }}
      />

      {/* Content wrapper — flex, row-reverse for text-right */}
      <div
        className={`relative z-20 flex h-full ${
          textRight ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Content area */}
        <div
          className={`flex h-full w-full flex-col justify-center sm:w-[52%] lg:w-[46%] xl:w-[44%] ${
            textRight
              ? "px-5 text-right sm:pl-0 sm:pr-10 lg:pr-16"
              : "px-5 text-left sm:pl-10 sm:pr-0 lg:pl-16"
          }`}
        >
          <PoeHeading
            as="h3"
            className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl"
          >
            {mechanic.title}
          </PoeHeading>
          <p
            className="mt-3 whitespace-pre-line text-sm leading-relaxed sm:text-base lg:mt-4"
            style={{ color: SITE.muted }}
          >
            {mechanic.summary}
          </p>
          {mechanic.bullets.length > 0 && (
            <ul className={`mt-4 flex flex-col gap-2 lg:mt-5 ${textRight ? "items-end" : ""}`}>
              {mechanic.bullets.map((bullet, bi) => (
                <li
                  key={bi}
                  className={`flex items-start gap-2 text-sm sm:text-base ${
                    textRight ? "flex-row-reverse text-right" : ""
                  }`}
                  style={{ color: SITE.muted }}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

function CategoryHeading({
  label,
  accentColor,
}: {
  label: string;
  accentColor: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 pt-10 pb-1 sm:px-6">
      <span
        className="h-px flex-1 max-w-[2rem]"
        style={{ backgroundColor: `${accentColor}40` }}
        aria-hidden="true"
      />
      <span
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: `${accentColor}cc` }}
      >
        {label}
      </span>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: `${accentColor}18` }}
        aria-hidden="true"
      />
    </div>
  );
}

export function MechanicsSection({
  mechanics,
  accentColor,
  locale,
  revealAt,
  officialUrl,
  labels,
}: MechanicsSectionProps) {
  const pending = mechanics.length === 0;

  if (pending && !revealAt) return null;

  const groups = groupByCategory(mechanics);

  const categoryLabels: Record<MechanicCategory, string> = {
    league: labels.categoryLeague,
    endgame: labels.categoryEndgame,
    balance: labels.categoryBalance,
  };

  let globalIndex = 0;

  return (
    <section id="mechanics" className="py-16 lg:py-20">
      {/* Heading stays contained */}
      <div className="mx-auto mb-8 w-full max-w-7xl px-4 sm:px-6">
        <PoeHeading as="h2" className="text-2xl sm:text-3xl">
          {labels.heading}
        </PoeHeading>
        <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
          {labels.subheading}
        </p>
      </div>

      {pending && revealAt && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div
            className="w-full overflow-hidden rounded-lg border bg-card"
            style={{ borderColor: `${accentColor}33` }}
          >
            <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-12">
              <div>
                <div className="flex items-center gap-2.5">
                  <Radio className="h-4 w-4" style={{ color: accentColor }} aria-hidden="true" />
                  <h3 className="text-base font-semibold" style={{ color: SITE.fg }}>
                    {labels.pendingTitle}
                  </h3>
                </div>

                <LocalDateTime
                  iso={revealAt}
                  locale={locale}
                  dateStyle="full"
                  timeStyle="short"
                  className="mt-3 block text-lg font-medium"
                />

                <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: SITE.muted }}>
                  {labels.pendingBody}
                </p>
              </div>

              <div
                className="flex flex-col gap-3 lg:border-l lg:pl-12"
                style={{ borderColor: SITE.border }}
              >
                <a
                  href="https://www.twitch.tv/pathofexile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  {labels.pendingWatch}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="#trailers"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: SITE.border, color: SITE.fg }}
                >
                  {labels.pendingTrailers}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {!pending && (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const showHeading = groups.length > 1;
            const startIndex = globalIndex;

            globalIndex += group.items.length;

            return (
              <div key={group.category}>
                {showHeading && (
                  <CategoryHeading label={categoryLabels[group.category]} accentColor={accentColor} />
                )}
                <div className={`flex flex-col gap-4 ${showHeading ? "mt-4" : ""}`}>
                  {group.items.map((m, i) => (
                    <LeagueCard key={m.title} mechanic={m} index={startIndex + i} accentColor={accentColor} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MechanicsSection;
