import "server-only";
import { getCurrentTempLeague } from "@/app/actions";
import { getItemIconMap } from "@/lib/poe-ninja-icon-map";
import { CurrencyCta, type CtaGameVersion, type CtaVariant } from "./currency-cta";

interface Props {
  locale: string;
  gameVersion?: CtaGameVersion;
  variant?: CtaVariant;
  /** Required when variant === "product". The product slug (e.g. "divine-orb"). */
  productSlug?: string;
}

/**
 * Server wrapper around `CurrencyCta` — fetches the current temp league
 * (and product icon when variant=product) once at render so page-level
 * callsites stay one line. For PortableText / client renderers, the
 * placeholder resolver injects the same payload directly into the block
 * and the pure `CurrencyCta` is used.
 */
export async function CurrencyCtaSection({
  locale,
  gameVersion = "path-of-exile-1",
  variant = "currency",
  productSlug,
}: Props) {
  const [leagueName, productIconUrl] = await Promise.all([
    getCurrentTempLeague(gameVersion),
    variant === "product" && productSlug
      ? lookupProductIcon(productSlug)
      : Promise.resolve(null),
  ]);
  return (
    <CurrencyCta
      locale={locale}
      gameVersion={gameVersion}
      leagueName={leagueName}
      variant={variant}
      productSlug={productSlug}
      productIconUrl={productIconUrl}
    />
  );
}

async function lookupProductIcon(slug: string): Promise<string | null> {
  const name = slug.replace(/-/g, " ");
  try {
    const map = await getItemIconMap();
    return map.get(name.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}
