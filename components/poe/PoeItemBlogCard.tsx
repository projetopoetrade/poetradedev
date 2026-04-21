"use client";

import { useState, useEffect, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { ItemTooltip } from "@/components/poe/PoeItemTooltip";
import { CurrencyTooltip } from "@/components/poe/PoeCurrencyTooltip";
import { GemTooltip } from "@/components/poe/PoeGemTooltip";
import { RARITY_NAME_COLOR_HSL } from "@/components/poe/poe-colors";
import { parseRawPoeItem } from "@/lib/poe-item-parser";
import { getEffectiveItemIconUrl } from "@/components/poe/poe-icon-utils";
import Image from "next/image";

/** Shape que o Sanity entrega para o bloco poeItem. */
export interface SanityPoeItem {
  _type: "poeItem";
  rawText: string;
  iconUrl?: string | null;
  /** True when classId contains "currency" or "MapFragment" — minimal tooltip. */
  isCurrency?: boolean;
  /** True when classId is "Active Skill Gem" / "Support Skill Gem". */
  isGem?: boolean;
  /** Primary attribute for gem header colour. */
  primaryAttribute?: "Strength" | "Dexterity" | "Intelligence" | null;
  /** Awakened gem flag (gold tint). */
  isAwakened?: boolean;
  /** Vaal gem flag (green tint). */
  isVaal?: boolean;
}

/**
 * Card inline de item PoE para uso em posts do blog.
 * Renderiza o ícone do item com a cor da raridade e um tooltip ao hover/tap.
 *
 * Ordem de resolução do ícone:
 *  1. Ícone local (flasks/tinctures via getEffectiveItemIconUrl)
 *  2. iconUrl manual do Sanity
 *  3. Fetch automático via /api/tools/poe-items/:name (Supabase inventory_icon)
 *  4. Fallback: nome com cor de raridade
 *
 * Usado pelo PortableText de RenderBodyContent como handler do tipo "poeItem".
 */
export function PoeItemBlogCard({ value }: { value: SanityPoeItem }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const item = useMemo(() => {
    const parsed = parseRawPoeItem(value.rawText);
    if (!parsed) return null;
    if (value.iconUrl) parsed.iconUrl = value.iconUrl;
    return parsed;
  }, [value.rawText, value.iconUrl]);

  // ícone resolvido localmente (flasks/tinctures) ou via iconUrl manual
  const localIconUrl = item ? getEffectiveItemIconUrl(item) : undefined;

  // ícone buscado automaticamente via poe.ninja quando não há ícone local
  const [fetchedIconUrl, setFetchedIconUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!item || localIconUrl) {
      setFetchedIconUrl(undefined);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      name: item.name,
      ...(item.baseName ? { baseName: item.baseName } : {}),
    });
    fetch(`/api/poe/item-icon?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.iconUrl) {
          setFetchedIconUrl(data.iconUrl as string);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [item?.name, localIconUrl]);

  if (!item) return null;

  const iconUrl = localIconUrl ?? fetchedIconUrl ?? value.iconUrl ?? undefined;
  const colorHsl =
    RARITY_NAME_COLOR_HSL[item.rarity] ?? RARITY_NAME_COLOR_HSL.Normal;

  // Pick the right tooltip variant for this item class:
  //   - Gems → in-game gem layout (header by attribute, tags, properties, stats)
  //   - Currencies / fragments / scarabs → minimal (description + centered icon)
  //   - Everything else (uniques, rares) → ItemTooltip rare-item layout
  const tooltipContent = value.isGem ? (
    <GemTooltip
      name={item.name}
      rawText={value.rawText}
      iconUrl={iconUrl ?? null}
      primaryAttribute={value.primaryAttribute ?? null}
      isAwakened={value.isAwakened}
      isVaal={value.isVaal}
    />
  ) : value.isCurrency ? (
    <CurrencyTooltip
      name={item.name}
      description={value.rawText}
      iconUrl={iconUrl ?? null}
    />
  ) : (
    <ItemTooltip item={item} compact={isMobile} />
  );

  return (
    <TooltipProvider delayDuration={150}>
      <SmartTooltip
        content={tooltipContent}
        side="top"
        align="center"
        isMobile={isMobile}
      >
        <span
          className="not-prose inline-flex items-center cursor-pointer gap-1.5 align-middle"
          role="button"
          tabIndex={0}
        >
          {iconUrl && (
            // Maxroll-style: small square icon (1em-ish) next to the coloured
            // name. Scales with the surrounding font-size so it never disrupts
            // the paragraph line-height. Letterboxed via object-contain so
            // weapons (1×4 aspect) don't stretch.
            <span
              className="relative inline-block shrink-0"
              style={{ width: "1.7em", height: "1.7em" }}
            >
              <Image
                src={iconUrl}
                alt=""
                fill
                sizes="32px"
                className="object-contain"
                // Bypass Vercel's image optimizer for these hosts. The
                // passive-icon WebPs live behind Cloudflare bot-protection on
                // pathoftrade.net, which 502s the optimizer's server-side
                // fetch. Unoptimized loads go direct from the client (whose
                // browser passes the Cloudflare challenge) so icons render.
                // poewiki.net Special:Filepath redirects also don't play well
                // with the optimizer, so they get the same treatment.
                unoptimized={
                  iconUrl.startsWith("https://pathoftrade.net/") ||
                  iconUrl.startsWith("https://www.pathoftrade.net/") ||
                  iconUrl.startsWith("https://www.poewiki.net/")
                }
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </span>
          )}
          <span
            className="font-semibold"
            style={{ color: `hsl(${colorHsl})` }}
          >
            {item.name}
          </span>
        </span>
      </SmartTooltip>
    </TooltipProvider>
  );
}
