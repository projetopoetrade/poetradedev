import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import LocalDateTime from "./LocalDateTime";
import type { LeagueLandingSummary } from "@/types/league-landing";

interface LeagueCardProps {
  league: LeagueLandingSummary;
  locale: string;
  labels: { live: string; upcoming: string; tba: string; view: string };
}

export function LeagueCard({ league, locale, labels }: LeagueCardProps) {
  const accent = league.accentColor;
  const keyArtUrl = league.keyArt?.asset?.url;
  const lqip = league.keyArt?.asset?.metadata?.lqip;
  const gameLabel =
    league.gameVersion === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile";

  const statusLabel =
    league.status === "live"
      ? labels.live
      : league.status === "upcoming"
        ? labels.upcoming
        : labels.tba;

  return (
    <Link
      href={`/leagues/${league.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 transition-colors hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {keyArtUrl ? (
          <Image
            src={keyArtUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${accent}40, #0a0a0a 70%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/70 backdrop-blur-sm">
            {gameLabel}
          </span>
          {league.version && (
            <span
              className="rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] backdrop-blur-sm"
              style={{
                borderColor: `${accent}4d`,
                color: accent,
                backgroundColor: `${accent}1f`,
              }}
            >
              {league.version}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4">
          <span
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm"
            style={{
              borderColor: `${accent}66`,
              color: accent,
              backgroundColor: `${accent}1f`,
            }}
          >
            {league.status === "live" && (
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: accent }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
              </span>
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="p-5">
        {league.startsAt ? (
          <LocalDateTime
            iso={league.startsAt}
            locale={locale}
            dateStyle="medium"
            timeStyle="short"
            className="text-[11px] uppercase tracking-[0.12em] text-white/40"
          />
        ) : (
          <span className="text-[11px] uppercase tracking-[0.12em] text-white/40">
            {labels.tba}
          </span>
        )}

        <h2 className="mt-1.5 text-xl font-bold text-white">{league.name}</h2>

        {league.tagline && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">
            {league.tagline}
          </p>
        )}

        <span
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-transform group-hover:translate-x-0.5"
          style={{ color: accent }}
        >
          {labels.view}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default LeagueCard;
