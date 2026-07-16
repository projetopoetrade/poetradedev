import type { CSSProperties, ReactNode } from "react";

/**
 * Design layer for the league pages.
 *
 * Two references were measured rather than guessed, and this is deliberately
 * the synthesis of them:
 *
 *  - Path of Trade itself (captured from the running build, July 2026):
 *    near-black #0a0a0a, cards = 1px hsl(0 0% 14.9%) border + 0.5rem radius,
 *    headings Source Sans 3 bold and LEFT aligned, body Roboto in muted grey,
 *    colour carried by small pill badges. `/builds` already leans amber for its
 *    highlighted CTA, and the wordmark is a gold serif.
 *
 *  - GGG's league microsites (pathofexile.com/mirage, /settlers): art-forward,
 *    per-league accent colour, Fontin SmallCaps, countdown above the fold.
 *
 * The site wins on chrome — radius, borders, fonts, spacing all come from it,
 * so this page reads as part of Path of Trade and not a bolted-on microsite.
 * PoE contributes exactly two things: the per-league accent (which the site's
 * existing amber already makes native) and Fontin on the league name alone,
 * echoing the wordmark. Going further — wood texture, rune bands, Fontin
 * everywhere — was tried and rejected: it out-dressed every other page.
 */

/** Site tokens, read from the running app rather than re-invented. */
export const SITE = {
  bg: "#0a0a0a",
  card: "hsl(0 0% 3.9%)",
  border: "hsl(0 0% 14.9%)",
  fg: "hsl(0 0% 98%)",
  muted: "hsl(0 0% 67%)",
  radius: "0.5rem",
} as const;

/**
 * The fallback lives *inside* var() on purpose. `var(--x), "Other"` is not a
 * fallback chain: if `--x` is unset the whole declaration is invalid at
 * computed-value time and the element inherits instead of trying "Other".
 * `var(--x, "Other")` is the form that actually degrades.
 */
export const FONTIN =
  'var(--font-fontin, "Fontin SmallCaps"), "Fontin SmallCaps", "Source Sans 3", Georgia, serif';

/**
 * Fine film grain, inlined as SVG so it costs no request. Near-black hero
 * gradients band into visible steps on real panels; a hair of noise breaks the
 * ramp up. Kept faint enough to read as texture, never as static.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Ambient ember backdrop for the hero.
 *
 * The old version was a single 10% radial that read as almost nothing against
 * flat near-black, which is what left the no-key-art hero looking empty rather
 * than composed. This is the *designed* no-art state: an ember anchored bottom-
 * right (where the monumental countdown sits) that stands in for key art, a
 * cooler top wash, film grain to kill banding, and a vignette to frame it.
 *
 * Everything is driven by `accent`, so any league re-skins for free — no PoE
 * chrome, just the site's near-black with the league's colour as heat. The one
 * moving part is a slow breathing glow (`.lg-ember`), disabled under
 * prefers-reduced-motion.
 */
export function PoeBackdrop({ accent }: { accent: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Cool top wash + ember from the countdown corner */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(70% 55% at 82% 78%, ${accent}2e, transparent 62%)`,
            `radial-gradient(100% 70% at 50% -10%, ${accent}14, transparent 60%)`,
          ].join(", "),
        }}
      />
      {/* Breathing ember core — the single moving element */}
      <div
        className="lg-ember absolute right-[6%] top-[38%] h-[42vh] w-[42vh] rounded-full blur-[90px]"
        style={{ background: `radial-gradient(circle, ${accent}40, transparent 68%)` }}
      />
      {/* Grain over the ramps */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-soft-light"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />
      {/* Vignette to seat the composition on the page background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(130% 120% at 50% 30%, transparent 58%, ${SITE.bg} 100%)`,
        }}
      />
    </div>
  );
}

/**
 * A panel in the site's card vocabulary — same border, same 0.5rem radius as
 * `/builds`. `accent` only tints the hairline, so a league can be re-skinned
 * without the panel stopping looking like the rest of the site.
 */
export function PoePanel({
  children,
  className = "",
  accent,
  style,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  accent: string;
  style?: CSSProperties;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-card ${className}`}
      style={{
        borderColor: glow ? `${accent}40` : SITE.border,
        ...(glow ? { boxShadow: `0 20px 60px -40px ${accent}` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Section heading in the site's voice: Source Sans 3, bold, left by default.
 *
 * The inline font-family is not redundant — globals.css sets
 * `h1,h2,h3 { font-family: var(--font-source-sans) }` at base layer, which
 * silently beats any Tailwind font class. `variant="fontin"` is the one
 * sanctioned exception, used for the league name so it rhymes with the
 * Path of Trade wordmark.
 */
export function PoeHeading({
  children,
  as: Tag = "h2",
  accent,
  variant = "site",
  align = "left",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  accent?: string;
  variant?: "site" | "fontin" | "accent";
  align?: "left" | "center";
  className?: string;
}) {
  const isFontin = variant === "fontin";
  return (
    <Tag
      className={className}
      style={{
        fontFamily: isFontin
          ? FONTIN
          : 'var(--font-source-sans, "Source Sans 3"), "Source Sans 3", sans-serif',
        fontWeight: 700,
        color: variant === "accent" && accent ? accent : SITE.fg,
        textAlign: align,
        ...(isFontin && accent
          ? { textShadow: `0 0 45px ${accent}40, 0 2px 10px rgba(0,0,0,0.9)` }
          : {}),
      }}
    >
      {children}
    </Tag>
  );
}

/** Small pill badge — the site's way of carrying colour (see /builds tags). */
export function PoeBadge({
  children,
  accent,
  tone = "accent",
}: {
  children: ReactNode;
  accent?: string;
  tone?: "accent" | "neutral";
}) {
  const isAccent = tone === "accent" && accent;
  return (
    <span
      // w-fit is load-bearing: `inline-flex` still stretches to full width when
      // the badge is a child of a flex column (align-items defaults to stretch),
      // which is exactly what happened inside the trailer cards.
      className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium"
      style={{
        borderColor: isAccent ? `${accent}59` : SITE.border,
        color: isAccent ? accent : SITE.muted,
        backgroundColor: isAccent ? `${accent}14` : "transparent",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Art that dissolves into the page background under the copy — the one move
 * borrowed wholesale from GGG, because it is what stops an image sitting in a
 * box and makes the section feel composed. `side` is where the *text* sits.
 */
export function PoeArtFade({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          side === "left"
            ? `linear-gradient(90deg, ${SITE.bg} 0%, rgba(10,10,10,0.9) 32%, rgba(10,10,10,0.35) 62%, rgba(10,10,10,0.1) 100%)`
            : `linear-gradient(270deg, ${SITE.bg} 0%, rgba(10,10,10,0.9) 32%, rgba(10,10,10,0.35) 62%, rgba(10,10,10,0.1) 100%)`,
      }}
    />
  );
}
