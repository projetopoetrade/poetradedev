"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check } from "lucide-react";

interface AddToCalendarProps {
  /** ISO 8601 UTC instant of league start. */
  startsAt: string;
  title: string;
  description: string;
  url: string;
  accentColor: string;
  labels: { add: string; added: string };
}

/** ISO 8601 → the basic UTC form iCalendar and Google both want: 20260724T180000Z */
function toStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * RFC 5545 requires CRLF line endings and escaping of , ; and \ inside TEXT
 * values — an unescaped comma in a league tagline silently truncates the field
 * in some calendar clients.
 */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function AddToCalendar({
  startsAt,
  title,
  description,
  url,
  accentColor,
  labels,
}: AddToCalendarProps) {
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 2500);
    return () => clearTimeout(id);
  }, [done]);

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  // League launches have no published end; a one-hour block reads as an event
  // rather than an all-day banner in most calendar UIs.
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const googleUrl = (() => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${toStamp(start)}/${toStamp(end)}`,
      details: `${description}\n\n${url}`,
      location: url,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  })();

  const downloadIcs = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Path of Trade//League Countdown//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${startsAt}-pathoftrade@pathoftrade.net`,
      `DTSTAMP:${toStamp(new Date())}`,
      `DTSTART:${toStamp(start)}`,
      `DTEND:${toStamp(end)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(`${description}\n\n${url}`)}`,
      `URL:${escapeIcs(url)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(title)}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
    setDone(true);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {done ? (
          <Check className="h-4 w-4" style={{ color: accentColor }} />
        ) : (
          <CalendarPlus className="h-4 w-4" />
        )}
        {done ? labels.added : labels.add}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 z-20 mt-2 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 shadow-xl backdrop-blur-md"
        >
          <a
            role="menuitem"
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Google Calendar
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={downloadIcs}
            className="block w-full px-4 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}

export default AddToCalendar;
