"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/league-landing";
import { PoeBadge, PoeHeading, SITE } from "./poe-ui";
import type { Trailer, TrailerKind } from "@/types/league-landing";

interface TrailerGalleryProps {
  trailers: Trailer[];
  accentColor: string;
  labels: {
    heading: string;
    subheading: string;
    play: string;
    kinds: Record<TrailerKind, string>;
  };
}

export function TrailerGallery({ trailers, accentColor, labels }: TrailerGalleryProps) {
  const [active, setActive] = useState<Trailer | null>(null);

  if (trailers.length === 0) return null;

  const Card = ({
    trailer,
    featured: isFeatured,
    index,
  }: {
    trailer: Trailer;
    featured?: boolean;
    index: number;
  }) => (
    // No scroll-reveal here. framer-motion's whileInView renders the initial
    // state into the SSR HTML, so every card shipped as opacity:0 and only
    // appeared once JS ran and the user scrolled — invisible to crawlers, to
    // no-JS clients, and to any full-page capture. The rest of the site does
    // not animate on scroll either.
    <button
      type="button"
      onClick={() => setActive(trailer)}
      aria-label={`${labels.play}: ${trailer.title}`}
      className="group block overflow-hidden rounded-lg border bg-card text-left transition-colors hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      style={{ borderColor: SITE.border, ["--tw-ring-color" as string]: accentColor }}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={trailer.thumbnailUrl ?? youtubeThumbnail(trailer.youtubeId)}
          alt=""
          fill
          priority={isFeatured}
          sizes={isFeatured ? "(max-width: 1024px) 100vw, 768px" : "(max-width: 768px) 100vw, 384px"}
          // hqdefault is 480x360 (4:3); object-cover crops the letterbox bars
          // rather than showing black bands.
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
            style={{
              borderColor: `${accentColor}66`,
              backgroundColor: `${accentColor}1f`,
            }}
          >
            <Play className="h-4 w-4 translate-x-[1px] fill-current" style={{ color: accentColor }} />
          </span>
        </span>
      </div>
      <div className="flex flex-col items-start gap-2 p-4">
        <PoeBadge accent={accentColor}>{labels.kinds[trailer.kind]}</PoeBadge>
        <h3 className="line-clamp-2 text-sm font-semibold" style={{ color: SITE.fg }}>
          {trailer.title}
        </h3>
      </div>
    </button>
  );

  return (
    <section id="trailers" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <PoeHeading as="h2" className="text-2xl sm:text-3xl">
          {labels.heading}
        </PoeHeading>
        <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
          {labels.subheading}
        </p>
      </div>

      {/* Uniform grid, every card equal — same shape as /builds.
          A "featured spans 2/3, rest stack in a column" layout was tried and
          reverted: with two trailers it left the hero card *smaller* than the
          secondary one and a dead gap between them, and it would break again at
          every new trailer count. Reveal week will add several, so predictable
          beats clever. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trailers.map((t, i) => (
          <Card key={t.youtubeId} trailer={t} featured={i === 0} index={i} />
        ))}
      </div>

      {/* The player lives here and nowhere else. Mounting it only on open keeps
          YouTube's ~1MB script and its cookies off the initial load — which is
          the difference between surviving a launch-day spike and not. */}
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-5xl border-0 bg-black p-0">
          {active && (
            <>
              <DialogTitle className="sr-only">{active.title}</DialogTitle>
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={youtubeEmbedUrl(active.youtubeId, { autoplay: true })}
                  title={active.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default TrailerGallery;
