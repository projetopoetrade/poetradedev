import { ArrowRight } from "lucide-react";
import { PoeHeading, FONTIN, SITE } from "./poe-ui";
import type { HubBuild } from "@/lib/league-hub-mock";

interface BuildsSectionProps {
  builds: HubBuild[];
  accentColor: string;
  leagueName: string;
}

/**
 * Meta builds — editorial only. poe.ninja's builds/profiles API is internal and
 * off-limits to third parties, and GGG's ladder carries no gear, so this is
 * always a curated list (like Maxroll / PoE Vault), never scraped. Labels are
 * English placeholders pending i18n; entries are mock (lib/league-hub-mock)
 * pending the `builds` table (whose fetch uses cookies and would break ISR —
 * needs an admin client).
 */
export function BuildsSection({ builds, accentColor, leagueName }: BuildsSectionProps) {
  if (builds.length === 0) return null;

  return (
    <section id="builds" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-8">
        <PoeHeading as="h2" className="text-2xl sm:text-3xl">
          Meta builds
        </PoeHeading>
        <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
          Hand-picked starters and endgame carries for {leagueName}.
        </p>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {builds.map((b) => (
          <a
            key={b.id}
            href="#"
            className="group flex flex-col gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-white/25"
            style={{ borderColor: SITE.border }}
          >
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: accentColor }}>
                {b.ascendancy}
              </span>
              <h3 className="mt-1.5 text-lg" style={{ fontFamily: FONTIN, color: SITE.fg, fontWeight: 600 }}>
                {b.name}
              </h3>
              <p className="mt-1 text-sm" style={{ color: SITE.muted }}>
                {b.skill}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {b.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border px-2 py-0.5 text-[11px]"
                  style={{ borderColor: SITE.border, color: SITE.muted }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: SITE.border }}>
              <span className="text-xs" style={{ color: SITE.muted }}>
                Budget · <span style={{ color: SITE.fg }}>{b.budget}</span>
              </span>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold transition-transform group-hover:translate-x-0.5"
                style={{ color: accentColor }}
              >
                View guide
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default BuildsSection;
