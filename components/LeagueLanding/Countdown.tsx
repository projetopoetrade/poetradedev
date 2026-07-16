"use client";

import { useEffect, useMemo, useState } from "react";
import { getLeagueStatus } from "@/lib/league-landing";
import { FONTIN, SITE } from "./poe-ui";
import type { LeagueStatus } from "@/types/league-landing";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeRemaining(target: number, now: number): Remaining {
  const diff = Math.max(0, target - now);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

interface CountdownProps {
  /** ISO 8601 UTC instant of league start. */
  startsAt: string;
  accentColor: string;
  locale: string;
  labels: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    live: string;
    liveSub: string;
    localTime: string;
    srCountdown: string;
  };
  onStatusChange?: (status: LeagueStatus) => void;
}

/**
 * One time segment, rendered monumentally rather than in a boxed widget.
 *
 * This is the page's signature: a countdown to a real, public launch instant is
 * *information* ("when can I play?"), so the honest move is to make the time the
 * hero — huge Fontin numerals that echo the wordmark, not a stock four-box
 * timer. `live` tints the fastest-moving unit (seconds) so the row reads as
 * ticking. tabular-nums keeps the columns from twitching as digits change.
 */
function Segment({
  value,
  label,
  accent,
  live = false,
}: {
  value: number;
  label: string;
  accent: string;
  live?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-[clamp(2.9rem,7vw,5.75rem)] font-semibold leading-[0.9] tabular-nums"
        style={{
          fontFamily: FONTIN,
          color: live ? accent : SITE.fg,
          textShadow: `0 0 40px ${accent}${live ? "55" : "22"}, 0 2px 12px rgba(0,0,0,0.7)`,
        }}
        suppressHydrationWarning
      >
        {String(value).padStart(2, "0")}
      </span>
      <span
        className="mt-2 text-[10px] uppercase tracking-[0.18em] sm:text-[11px]"
        style={{ color: SITE.muted }}
      >
        {label}
      </span>
    </div>
  );
}

export function Countdown({
  startsAt,
  accentColor,
  locale,
  labels,
  onStatusChange,
}: CountdownProps) {
  const target = useMemo(() => new Date(startsAt).getTime(), [startsAt]);

  // Seeded from the render-time clock so the hero never flashes empty. Server
  // and client necessarily differ by the request latency, hence
  // suppressHydrationWarning on the numerals: React keeps the server text
  // through hydration and the interval corrects it within a second.
  const [remaining, setRemaining] = useState<Remaining>(() =>
    computeRemaining(target, Date.now()),
  );
  const [status, setStatus] = useState<LeagueStatus>(() =>
    getLeagueStatus(startsAt, Date.now()),
  );

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const tick = () => {
      const now = Date.now();
      setRemaining(computeRemaining(target, now));
      const next = getLeagueStatus(startsAt, now);
      setStatus((prev) => {
        if (prev !== next) onStatusChange?.(next);
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, startsAt, onStatusChange]);

  // Client-only: Intl resolves to the *server's* zone during SSR, so shipping
  // this in the initial HTML would show the wrong time — near midnight, the
  // wrong day — until hydration.
  const [localTime, setLocalTime] = useState<string | null>(null);
  useEffect(() => {
    if (Number.isNaN(target)) return;
    try {
      setLocalTime(
        // Individual components, not dateStyle/timeStyle: ECMA-402 forbids
        // pairing those shorthands with timeZoneName and Intl throws "Invalid
        // option". The throw lands in an effect, so SSR stays green and only a
        // real browser dies — which is how Playwright caught it and curl did not.
        new Intl.DateTimeFormat(locale === "pt-br" ? "pt-BR" : "en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }).format(new Date(target)),
      );
    } catch {
      setLocalTime(null);
    }
  }, [target, locale]);

  if (Number.isNaN(target)) return null;

  if (status === "live") {
    // The flip at launch is the page's payoff, so the live state is monumental
    // too — not a shrink back into a pill.
    return (
      <div className="flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </span>
          <span
            className="text-[clamp(1.75rem,4vw,3rem)] font-semibold uppercase leading-none tracking-[0.06em]"
            style={{
              fontFamily: FONTIN,
              color: accentColor,
              textShadow: `0 0 45px ${accentColor}55`,
            }}
          >
            {labels.live}
          </span>
        </span>
        <span className="text-sm sm:text-base" style={{ color: SITE.muted }}>
          {labels.liveSub}
        </span>
      </div>
    );
  }

  const units = [
    { value: remaining.days, label: labels.days },
    { value: remaining.hours, label: labels.hours },
    { value: remaining.minutes, label: labels.minutes },
    { value: remaining.seconds, label: labels.seconds, live: true },
  ];

  return (
    <div className="flex w-full flex-col items-start gap-4">
      {/* Ticking numerals are noise to a screen reader; one calm sentence says
          the same thing. Composed from the unit labels rather than an
          interpolated message — next-intl parses {braces} as ICU arguments and
          these values only exist client-side. */}
      <p className="sr-only" aria-live="off">
        {`${labels.srCountdown}: ${remaining.days} ${labels.days}, ${remaining.hours} ${labels.hours}, ${remaining.minutes} ${labels.minutes}`}
      </p>

      {/* Four columns spread across the panel width — the numerals *are* the
          composition here, so they fill the space rather than huddling left.
          Faint accent dividers between columns give the clock its segmentation. */}
      <div className="grid w-full grid-cols-4" aria-hidden="true">
        {units.map((u, i) => (
          <div
            key={u.label}
            className={`flex justify-center px-1 ${i > 0 ? "border-l" : ""}`}
            style={i > 0 ? { borderColor: `${accentColor}1f` } : undefined}
          >
            <Segment value={u.value} label={u.label} accent={accentColor} live={u.live} />
          </div>
        ))}
      </div>

      {/* Baseline hairline grounds the numerals as a single structural block. */}
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}59, ${accentColor}0d)` }}
        aria-hidden="true"
      />

      <p className="h-5 text-xs sm:text-sm" style={{ color: SITE.muted }} suppressHydrationWarning>
        {localTime ? `${labels.localTime} ${localTime}` : ""}
      </p>
    </div>
  );
}

export default Countdown;
