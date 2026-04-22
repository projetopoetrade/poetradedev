import Link from "next/link";
import { Coins } from "lucide-react";
import { getProductUrl } from "@/utils/url-helper";

export type CtaGameVersion = "path-of-exile-1" | "path-of-exile-2";
export type CtaVariant = "currency" | "product";

interface CurrencyCtaProps {
  locale: string;
  /** Defaults to PoE 1. Pass "path-of-exile-2" to point links at PoE 2 routes. */
  gameVersion?: CtaGameVersion;
  /** Active temp league name. null when the leagues table only has permanent variants. */
  leagueName: string | null;
  /** "currency" (default) renders the multi-orb banner. "product" focuses on a single product. */
  variant?: CtaVariant;
  /** Required when variant === "product". The product slug (e.g. "divine-orb"). */
  productSlug?: string;
}

const POE1_PRODUCTS: Array<{ name: string; slug: string }> = [
  { name: "Divine Orb", slug: "divine-orb" },
  { name: "Chaos Orb", slug: "chaos-orb" },
  { name: "Mirror of Kalandra", slug: "mirror-of-kalandra" },
];

const POE2_PRODUCTS: Array<{ name: string; slug: string }> = [
  { name: "Divine Orb", slug: "divine-orb" },
  { name: "Exalted Orb", slug: "exalted-orb" },
  { name: "Mirror of Kalandra", slug: "mirror-of-kalandra" },
];

function productListFor(gameVersion: CtaGameVersion) {
  return gameVersion === "path-of-exile-2" ? POE2_PRODUCTS : POE1_PRODUCTS;
}

/** Slug → display name. Capitalises each hyphen-separated segment. */
function deslugify(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function browseAllHref(locale: string, gameVersion: CtaGameVersion) {
  const localePath = locale === "en" ? "" : `/${locale}`;
  return gameVersion === "path-of-exile-2"
    ? `${localePath}/games/path-of-exile-2/products`
    : `${localePath}/products`;
}

/**
 * Visual-only currency CTA. Pure sync component — no I/O — so it can be
 * rendered from either a server page (via `CurrencyCtaSection`) or a client
 * renderer (PortableText handler in blockContentComponents.tsx). The league
 * lookup is hoisted out so this body has no server-action imports and can
 * safely cross the client/server boundary.
 *
 * Two variants share the same chrome (subtle muted card, label-style heading):
 *   - "currency": three featured orbs + browse-all. Default.
 *   - "product":  one focused CTA on a specific product slug + browse-all link.
 */
export function CurrencyCta({
  locale,
  gameVersion = "path-of-exile-1",
  leagueName,
  variant = "currency",
  productSlug,
}: CurrencyCtaProps) {
  const isPt = locale === "pt-br";
  const browseAll = browseAllHref(locale, gameVersion);

  if (variant === "product" && productSlug) {
    const productName = deslugify(productSlug);
    const headingPt = leagueName
      ? `Precisa de ${productName} em ${leagueName}?`
      : `Precisa de ${productName}?`;
    const headingEn = leagueName
      ? `Need ${productName} in ${leagueName}?`
      : `Need ${productName}?`;
    const bodyPt = leagueName
      ? `Compre ${productName} em ${leagueName} com entrega rápida e preços competitivos no Path of Trade.`
      : `Compre ${productName} com entrega rápida e preços competitivos no Path of Trade.`;
    const bodyEn = leagueName
      ? `Buy ${productName} in ${leagueName} with fast delivery and competitive prices at Path of Trade.`
      : `Buy ${productName} with fast delivery and competitive prices at Path of Trade.`;

    return (
      <section className="not-prose mt-8 rounded-lg border border-border/50 bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isPt ? headingPt : headingEn}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground/80 mb-3">
          {isPt ? bodyPt : bodyEn}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={getProductUrl(productName, locale, undefined, undefined, gameVersion)}
            className="inline-flex items-center rounded-full border border-foreground/40 bg-foreground/10 px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground/20 transition-colors"
          >
            {isPt ? `Comprar ${productName}` : `Buy ${productName}`}
          </Link>
          <Link
            href={browseAll}
            className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {isPt ? "ou ver todos os produtos" : "or browse all products"}
          </Link>
        </div>
      </section>
    );
  }

  // Currency variant (default) — 3 orbs tailored to the game version.
  const products = productListFor(gameVersion);
  const headingPt = leagueName
    ? `Precisa de currency em ${leagueName}?`
    : "Precisa de currency para sua build?";
  const headingEn = leagueName
    ? `Need currency in ${leagueName}?`
    : "Need currency for your build?";
  const bodyPt = leagueName
    ? `Compre orbs em ${leagueName} com entrega rápida e preços competitivos no Path of Trade.`
    : "Compre orbs com entrega rápida e preços competitivos no Path of Trade.";
  const bodyEn = leagueName
    ? `Buy orbs in ${leagueName} with fast delivery and competitive prices at Path of Trade.`
    : "Buy orbs with fast delivery and competitive prices at Path of Trade.";

  return (
    <section className="not-prose mt-8 rounded-lg border border-border/50 bg-muted/30 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Coins className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {isPt ? headingPt : headingEn}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground/80 mb-3">
        {isPt ? bodyPt : bodyEn}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={getProductUrl(p.name, locale, undefined, undefined, gameVersion)}
            className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            {isPt ? `Comprar ${p.name}` : `Buy ${p.name}`}
          </Link>
        ))}
        <Link
          href={browseAll}
          className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          {isPt ? "Ver todos os produtos" : "Browse all products"}
        </Link>
      </div>
    </section>
  );
}
