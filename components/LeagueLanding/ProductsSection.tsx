import { Link } from "@/i18n/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { PoeHeading, FONTIN, SITE } from "./poe-ui";
import type { CurrencyProduct } from "@/lib/league-hub-mock";

interface ProductsSectionProps {
  products: CurrencyProduct[];
  accentColor: string;
  leagueName: string;
  /** Where the buy buttons point (the league's store page). */
  storeUrl: string | null;
}

/**
 * Buy currency — the commercial core of the live hub. Cards in the site's
 * vocabulary, price in the league accent, the featured listing outlined. Labels
 * are English placeholders pending i18n; listings are mock (lib/league-hub-mock)
 * pending getProductsWithParams (which throws on error — wrap it).
 */
export function ProductsSection({ products, accentColor, leagueName, storeUrl }: ProductsSectionProps) {
  if (products.length === 0) return null;
  const href = storeUrl ?? "#";

  return (
    <section id="buy" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PoeHeading as="h2" className="text-2xl sm:text-3xl">
            Buy currency
          </PoeHeading>
          <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
            Stocked and delivered for {leagueName}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: SITE.muted }}>
          <Zap className="h-3.5 w-3.5" style={{ color: accentColor }} aria-hidden="true" />
          Instant delivery
        </span>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between gap-5 rounded-lg border bg-card p-5"
            style={{ borderColor: p.popular ? `${accentColor}55` : SITE.border }}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold" style={{ color: SITE.fg }}>
                  {p.name}
                </h3>
                {p.popular && (
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: accentColor, backgroundColor: `${accentColor}1f` }}
                  >
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em]" style={{ color: SITE.muted }}>
                {p.unit}
              </p>
              <p className="mt-4 flex items-baseline gap-1">
                <span
                  className="text-3xl font-semibold tabular-nums"
                  style={{ fontFamily: FONTIN, color: accentColor }}
                >
                  ${p.priceUsd.toFixed(2)}
                </span>
              </p>
            </div>

            <Link
              href={href}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingCart className="h-4 w-4" />
              Buy now
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductsSection;
