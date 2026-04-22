import "server-only";
import { getCurrentTempLeague } from "@/app/actions";
import { CurrencyCta, type CtaGameVersion } from "./currency-cta";

interface Props {
  locale: string;
  gameVersion?: CtaGameVersion;
}

/**
 * Server wrapper around `CurrencyCta` — fetches the current temp league
 * once at render so page-level callsites stay one line. Use this in
 * `page.tsx` files. For PortableText / client renderers, the placeholder
 * resolver injects `leagueName` directly into the block payload and the
 * pure `CurrencyCta` is used.
 */
export async function CurrencyCtaSection({ locale, gameVersion = "path-of-exile-1" }: Props) {
  const leagueName = await getCurrentTempLeague(gameVersion);
  return (
    <CurrencyCta
      locale={locale}
      gameVersion={gameVersion}
      leagueName={leagueName}
    />
  );
}
