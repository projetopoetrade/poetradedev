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

/** One unit, in the site's card vocabulary: 1px border, 0.5rem radius. */
function Unit({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-16 w-[68px] items-center justify-center rounded-lg border bg-card sm:h-20 sm:w-24"
        style={{
          borderColor: `${accent}33`,
          boxShadow: `0 16px 44px -34px ${accent}`,
        }}
      >
        <span
          // Fontin on the numerals only — the one PoE nod, and it rhymes with
          // the Path of Trade wordmark rather than fighting it. tabular-nums
          // stops the box twitching as digits change width.
          className="text-3xl tabular-nums sm:text-4xl"
          style={{ fontFamily: FONTIN, color: SITE.fg, fontWeight: 600 }}
          suppressHydrationWarning
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className="mt-2 text-[10px] uppercase tracking-[0.14em]"
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
    return (
      <div className="flex flex-col items-start gap-2">
        <span
          className="inline-flex items-center gap-2.5 rounded-lg border px-4 py-2"
          style={{ borderColor: `${accentColor}59`, backgroundColor: `${accentColor}14` }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </span>
          <span
            className="text-lg font-bold uppercase tracking-[0.12em]"
            style={{ color: accentColor }}
          >
            {labels.live}
          </span>
        </span>
        <span className="text-sm" style={{ color: SITE.muted }}>
          {labels.liveSub}
        </span>
      </div>
    );
  }

  const units = [
    { value: remaining.days, label: labels.days },
    { value: remaining.hours, label: labels.hours },
    { value: remaining.minutes, label: labels.minutes },
    { value: remaining.seconds, label: labels.seconds },
  ];

  return (
    <div className="flex flex-col items-start gap-3">
      {/* Ticking numerals are noise to a screen reader; one calm sentence says
          the same thing. Composed from the unit labels rather than an
          interpolated message — next-intl parses {braces} as ICU arguments and
          these values only exist client-side. */}
      <p className="sr-only" aria-live="off">
        {`${labels.srCountdown}: ${remaining.days} ${labels.days}, ${remaining.hours} ${labels.hours}, ${remaining.minutes} ${labels.minutes}`}
      </p>

      <div className="flex items-start gap-2.5 sm:gap-3" aria-hidden="true">
        {units.map((u) => (
          <Unit key={u.label} value={u.value} label={u.label} accent={accentColor} />
        ))}
      </div>

      <p className="h-5 text-xs" style={{ color: SITE.muted }} suppressHydrationWarning>
        {localTime ? `${labels.localTime} ${localTime}` : ""}
      </p>
    </div>
  );
}

export default Countdown;
