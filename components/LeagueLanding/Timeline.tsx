import { Radio, FileText, Swords } from "lucide-react";
import LocalDateTime from "./LocalDateTime";
import { PoeHeading, SITE } from "./poe-ui";

export interface Milestone {
  key: "reveal" | "patchNotes" | "start";
  iso: string;
  title: string;
  description: string;
}

interface TimelineProps {
  milestones: Milestone[];
  accentColor: string;
  locale: string;
  labels: { heading: string; subheading: string };
}

const ICONS = {
  reveal: Radio,
  patchNotes: FileText,
  start: Swords,
} as const;

/**
 * Server component on purpose. `isPast` is evaluated at render time and never
 * re-derived on the client, so there is no hydration mismatch to suppress. The
 * page's revalidate window is the only staleness, and a dot turning gold up to a
 * minute late is not something anyone can perceive.
 */
export function Timeline({
  milestones,
  accentColor,
  locale,
  labels,
}: TimelineProps) {
  if (milestones.length === 0) return null;

  const now = Date.now();

  return (
    <section
      id="timeline"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
    >
      <div className="mb-10">
        <PoeHeading as="h2" className="text-2xl sm:text-3xl">
          {labels.heading}
        </PoeHeading>
        <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
          {labels.subheading}
        </p>
      </div>

      {/* Capped rather than full-bleed: `flex-1` items spread to fill whatever
          width they are given, so two milestones across a 6xl container left
          each one marooned in half a screen of empty space. Most leagues have
          two or three of these. */}
      <ol className="relative flex max-w-3xl flex-col gap-10 sm:flex-row sm:gap-0">
        {/* Rail — hidden on mobile, where the list stacks instead */}
        <div
          className="absolute left-[15px] top-2 hidden h-[calc(100%-1rem)] w-px sm:left-0 sm:top-[19px] sm:block sm:h-px sm:w-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}66, ${accentColor}1a)`,
          }}
          aria-hidden="true"
        />

        {milestones.map((milestone) => {
          const isPast = new Date(milestone.iso).getTime() <= now;
          const Icon = ICONS[milestone.key];

          return (
            <li
              key={milestone.key}
              className="relative flex flex-1 gap-4 sm:flex-col sm:gap-0 sm:px-3"
            >
              <div
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm"
                style={{
                  borderColor: isPast ? accentColor : "rgba(255,255,255,0.15)",
                  backgroundColor: isPast ? `${accentColor}26` : "#0a0a0a",
                }}
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={{
                    color: isPast ? accentColor : "rgba(255,255,255,0.4)",
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="sm:mt-5">
                <LocalDateTime
                  iso={milestone.iso}
                  locale={locale}
                  dateStyle="medium"
                  timeStyle="short"
                  className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
                />
                <h3
                  className="mt-1.5 text-base font-semibold"
                  style={{ color: isPast ? "#fff" : "rgba(255,255,255,0.75)" }}
                >
                  {milestone.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {milestone.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default Timeline;
