"use client";

import { useEffect, useState } from "react";

interface LocalDateTimeProps {
  /** ISO 8601 UTC instant. */
  iso: string;
  locale: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  className?: string;
}

/**
 * Renders an instant in the *visitor's* timezone.
 *
 * Server-side, Intl resolves to whatever timezone the Vercel box runs in (UTC),
 * so a server-formatted "July 24, 8:00 PM" would be a lie for most of the world
 * — and near a midnight boundary it lands on the wrong day entirely. The first
 * paint is therefore UTC (correct, if unfriendly) and an effect re-formats to
 * the real local zone on mount. Same string length either way, so nothing shifts.
 */
export function LocalDateTime({
  iso,
  locale,
  dateStyle = "medium",
  timeStyle,
  className,
}: LocalDateTimeProps) {
  const intlLocale = locale === "pt-br" ? "pt-BR" : "en-US";

  const format = (timeZone?: string) => {
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        dateStyle,
        ...(timeStyle ? { timeStyle } : {}),
        ...(timeZone ? { timeZone } : {}),
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  const [text, setText] = useState(() => format("UTC"));

  useEffect(() => {
    setText(format());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, intlLocale, dateStyle, timeStyle]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}

export default LocalDateTime;
