"use client";

import { useState, useEffect, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { ItemTooltip } from "@/components/poe/PoeItemTooltip";
import { RARITY_NAME_COLOR_HSL } from "@/components/poe/poe-colors";
import { parseRawPoeItem } from "@/lib/poe-item-parser";
import { getEffectiveItemIconUrl } from "@/components/poe/poe-icon-utils";
import Image from "next/image";

/** Shape que o Sanity entrega para o bloco poeItem. */
export interface SanityPoeItem {
  _type: "poeItem";
  rawText: string;
  iconUrl?: string;
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

  const iconUrl = localIconUrl ?? fetchedIconUrl;
  const colorHsl =
    RARITY_NAME_COLOR_HSL[item.rarity] ?? RARITY_NAME_COLOR_HSL.Normal;

  return (
    <TooltipProvider delayDuration={150}>
      <SmartTooltip
        content={<ItemTooltip item={item} compact />}
        side="top"
        align="center"
        isMobile={isMobile}
      >
        <span
          className="inline-flex items-center cursor-pointer gap-1"
          role="button"
          tabIndex={0}
        >
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <Image
              src={iconUrl}
              alt={item.name}
              width={100}
              height={100}
              className="inline-block object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            // fallback: nome com cor de raridade quando não há ícone
            <span
              className="underline decoration-dotted underline-offset-2 font-medium"
              style={{ color: `hsl(${colorHsl})` }}
            >
              {item.name}
            </span>
          )}
          <span className="sr-only">{item.name}</span>
        </span>
      </SmartTooltip>
    </TooltipProvider>
  );
}
