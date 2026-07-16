"use client";

import Image from "next/image";
import { Check, Radio, ExternalLink } from "lucide-react";
import LocalDateTime from "./LocalDateTime";
import { PoeArtFade, PoeHeading, SITE } from "./poe-ui";
import type { Mechanic } from "@/types/league-landing";

interface MechanicsSectionProps {
  mechanics: Mechanic[];
  accentColor: string;
  locale: string;
  /** ISO instant of the reveal stream — dates the placeholder. */
  revealAt?: string;
  officialUrl?: string;
  labels: {
    heading: string;
    subheading: string;
    pendingTitle: string;
    pendingBody: string;
    pendingWatch: string;
    pendingTrailers: string;
  };
}

/**
 * Alternating art/copy sections — the shape GGG uses for every league feature
 * (art bleeding one way, copy set against it), rebuilt in the site's chrome:
 * container width, 0.5rem radius, Source Sans 3 headings, muted body.
 *
 * Renders nothing while `mechanics` is empty, which is the state that matters
 * today: Curse of the Allflame's mechanics are not revealed until GGG Live, and
 * a published commercial page must not invent them. The section appears by
 * itself once someone fills the array in Sanity.
 */
export function MechanicsSection({
  mechanics,
  accentColor,
  locale,
  revealAt,
  officialUrl,
  labels,
}: MechanicsSectionProps) {
  const pending = mechanics.length === 0;

  // Hiding this section while the mechanics are unannounced was the original
  // call and it was wrong twice over.
  //
  // SEO: the fear was "thin content", which is not a real Google concept —
  // "thin" appears once in the spam policy, about affiliation, and word count
  // is explicitly not a signal. The actual risk is the opposite: a soft 404,
  // whose definition covers "a sparsely populated or empty page", and whose
  // documented remedy is literally to add information to the page. A soft 404
  // is not ranked badly, it is not indexed at all — which would mean fighting
  // for a first crawl during the reveal window instead of updating a URL Google
  // already knows.
  //
  // UX: Baymard measured 30% abandonment when a product was unavailable with no
  // forward action — a bare "coming soon" is that dead end. A dated placeholder
  // with somewhere to go is the documented fix, and it pre-registers the section
  // in the reader's mental model so returning visitors find it after the reveal.
  //
  // Not a skeleton screen: those promise content arriving in seconds. This one
  // arrives in a week.
  if (pending && !revealAt) return null;

  return (
    <section id="mechanics" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-8">
        <PoeHeading as="h2" className="text-2xl sm:text-3xl">
          {labels.heading}
        </PoeHeading>
        <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
          {labels.subheading}
        </p>
      </div>

      {pending && revealAt && (
        // Full width, split into copy + a bordered action rail on the right so
        // the waiting state fills the section instead of stranding half of it.
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
      )}

      <div className={pending ? "hidden" : "flex flex-col gap-6"}>
        {mechanics.map((mechanic, i) => {
          const flipped = i % 2 === 1;
          const imageUrl = mechanic.image?.asset?.url;
          const lqip = mechanic.image?.asset?.metadata?.lqip;

          return (
            <article
              key={`${mechanic.title}-${i}`}
              className="relative overflow-hidden rounded-lg border bg-card"
              style={{ borderColor: SITE.border }}
            >
              {imageUrl && (
                <div
                  className={`absolute inset-y-0 hidden w-[55%] lg:block ${
                    flipped ? "left-0" : "right-0"
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt={mechanic.image?.alt ?? ""}
                    fill
                    sizes="55vw"
                    className="object-cover"
                    {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
                  />
                  <PoeArtFade side={flipped ? "right" : "left"} />
                </div>
              )}

              {/* Mobile keeps the art, just stacked above the copy. */}
              {imageUrl && (
                <div className="relative aspect-[16/9] w-full lg:hidden">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover"
                    {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                </div>
              )}

              <div
                className={`relative p-6 sm:p-9 ${
                  imageUrl ? "lg:w-[48%]" : "lg:max-w-3xl"
                } ${flipped && imageUrl ? "lg:ml-auto" : ""}`}
              >
                <span
                  className="mb-3 inline-block text-xs font-bold tabular-nums"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <PoeHeading as="h3" className="text-xl sm:text-2xl">
                  {mechanic.title}
                </PoeHeading>
                <p
                  className="mt-3 whitespace-pre-line text-sm leading-relaxed sm:text-base"
                  style={{ color: SITE.muted }}
                >
                  {mechanic.summary}
                </p>

                {mechanic.bullets.length > 0 && (
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {mechanic.bullets.map((bullet, bi) => (
                      <li key={bi} className="flex items-start gap-2.5 text-sm" style={{ color: SITE.muted }}>
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: accentColor }}
                          aria-hidden="true"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default MechanicsSection;
