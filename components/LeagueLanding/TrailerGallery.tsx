"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import {
  youtubeEmbedUrl,
  youtubeThumbnail,
  youtubeThumbnailMax,
} from "@/lib/league-landing";
import { PoeHeading, SITE } from "./poe-ui";
import type { Trailer } from "@/types/league-landing";

interface TrailerGalleryProps {
  trailers: Trailer[];
  accentColor: string;
  labels: {
    kicker: string;
    heading: ReactNode;
    play: string;
  };
}

/**
 * The poster frame, at the best resolution the video actually has.
 *
 * Starts on the 1280x720 WebP and drops to the 480x360 JPEG only if that 404s —
 * which is the case for videos never uploaded at 720p+. Going straight to
 * hqdefault instead would cost every real trailer a visibly soft poster; going
 * straight to maxres would break the odd low-res teaser. So: try, then fall back.
 */
function Poster({ trailer }: { trailer: Trailer }) {
  const [src, setSrc] = useState(
    trailer.thumbnailUrl ?? youtubeThumbnailMax(trailer.youtubeId),
  );

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(max-width: 896px) 100vw, 896px"
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      onError={() => setSrc(youtubeThumbnail(trailer.youtubeId))}
    />
  );
}

export function TrailerGallery({ trailers, accentColor, labels }: TrailerGalleryProps) {
  // Which trailer is currently swapped from poster to player. The iframe mounts
  // in place of the poster rather than in a dialog, so playback happens on the
  // page — but still only after a click, which keeps YouTube's ~1MB script and
  // its cookies off the initial load.
  const [playing, setPlaying] = useState<string | null>(null);

  if (trailers.length === 0) return null;

  const [featured, ...rest] = trailers;

  const Player = ({ trailer }: { trailer: Trailer }) =>
    playing === trailer.youtubeId ? (
      <iframe
        src={youtubeEmbedUrl(trailer.youtubeId, { autoplay: true })}
        title={trailer.title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    ) : (
      <button
        type="button"
        onClick={() => setPlaying(trailer.youtubeId)}
        aria-label={`${labels.play}: ${trailer.title}`}
        className="group absolute inset-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ ["--tw-ring-color" as string]: accentColor }}
      >
        <Poster trailer={trailer} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
            style={{
              borderColor: `${accentColor}80`,
              backgroundColor: `${accentColor}26`,
              boxShadow: `0 0 30px -6px ${accentColor}`,
            }}
          >
            <Play className="h-6 w-6 translate-x-[2px] fill-current" style={{ color: accentColor }} />
          </span>
        </span>
      </button>
    );

  return (
    <section id="trailers" className="py-16 lg:py-20">
      {/* Kicker rule — same divider language as the mechanics categories */}
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <span
          className="h-px max-w-[2rem] flex-1"
          style={{ backgroundColor: `${accentColor}40` }}
          aria-hidden="true"
        />
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: `${accentColor}cc` }}
        >
          {labels.kicker}
        </span>
        <span
          className="h-px flex-1"
          style={{ backgroundColor: `${accentColor}18` }}
          aria-hidden="true"
        />
      </div>

      <div className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
        <PoeHeading as="h2" align="center" className="text-3xl sm:text-4xl lg:text-5xl">
          {labels.heading}
        </PoeHeading>
      </div>

      {/* Deliberately narrower than the panels above: at max-w-4xl the 1080p
          source renders near 1:1 instead of being upscaled across a 1440px+
          viewport, which is what made it look soft. */}
      <div className="mx-auto mt-9 w-full max-w-4xl px-4 sm:px-6">
        <div
          className="relative aspect-video w-full overflow-hidden rounded-lg border"
          style={{
            borderColor: `${accentColor}33`,
            boxShadow: `0 0 80px -20px ${accentColor}59`,
          }}
        >
          {/* No `priority`: this sits well below the fold, and preloading it
              only takes bandwidth from the hero art during the first paint. */}
          <Player trailer={featured} />
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mx-auto mt-5 grid w-full max-w-4xl gap-4 px-4 sm:grid-cols-2 sm:px-6">
          {rest.map((t) => (
            <div
              key={t.youtubeId}
              className="relative aspect-video w-full overflow-hidden rounded-lg border"
              style={{ borderColor: SITE.border }}
            >
              <Player trailer={t} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TrailerGallery;
