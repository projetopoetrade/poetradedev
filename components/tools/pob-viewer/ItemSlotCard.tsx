"use client";

// Equipment slot grid configuration and ItemSlotCard component.
import { useEffect, useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Sword, Shield, Shirt, HardHat, Footprints, Hand, Gem,
  CircleDashed, FlaskConical, Diamond,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PobItem, PobSocketedJewel } from "@/lib/pob-types";
import { RARITY_BORDER_HSL, RARITY_NAME_COLOR_HSL, HEADER_TEXTURES } from "@/lib/pob/poe-colors";
import { getEffectiveItemIconUrl } from "@/lib/pob/icon-helpers";
import { SmartTooltip, ItemTooltip } from "./ItemTooltip";

export const EQUIPMENT_GRID = [
  { slot: "Weapon 1", col: "2 / span 2", row: "1 / span 4" },
  { slot: "Weapon 2", col: "8 / span 2", row: "1 / span 4" },
  { slot: "Helm", col: "5 / span 2", row: "1 / span 2" },
  { slot: "Amulet", col: "7 / span 1", row: "3 / span 1" },
  { slot: "Body Armour", col: "5 / span 2", row: "3 / span 3" },
  { slot: "Ring 1", col: "4 / span 1", row: "4 / span 1" },
  { slot: "Ring 2", col: "7 / span 1", row: "4 / span 1" },
  { slot: "Gloves", col: "3 / span 2", row: "5 / span 2" },
  { slot: "Belt", col: "5 / span 2", row: "6 / span 1" },
  { slot: "Boots", col: "7 / span 2", row: "5 / span 2" },
];
export const SLOT_LABEL: Record<string, string> = {
  "Weapon 1": "Main Hand",
  "Weapon 2": "Off Hand",
  Helm: "Helm",
  "Body Armour": "Body",
  "Ring 1": "Ring 1",
  "Ring 2": "Ring 2",
  Gloves: "Gloves",
  Belt: "Belt",
  Boots: "Boots",
  Amulet: "Amulet",
  "Flask 1": "Flask 1",
  "Flask 2": "Flask 2",
  "Flask 3": "Flask 3",
  "Flask 4": "Flask 4",
  "Flask 5": "Flask 5",
};

export const EQUIPMENT_SLOTS = [
  "Weapon 1",
  "Helm",
  "Weapon 2",
  "Amulet",
  "Body Armour",
  "Ring 1",
  "Ring 2",
  "Gloves",
  "Belt",
  "Boots",
] as const;

export const FLASK_SLOTS = [
  "Flask 1",
  "Flask 2",
  "Flask 3",
  "Flask 4",
  "Flask 5",
] as const;

// ─── Slot card ────────────────────────────────────────────────────────────────

/**
 * Silhouette icon per slot type. Mirrors what in-game inventory + popular
 * build tools show: a helm icon in an empty helm socket, boots in an empty
 * boots socket, etc. Lucide's outline style stays cohesive with the rest
 * of the UI. Used both when the slot has no item AND as a fallback when the
 * item exists but its icon URL failed to resolve (missing Item.iconUrl in
 * the engine, 404, etc.) so the user always sees SOMETHING useful.
 */
export const SLOT_PLACEHOLDER_ICON: Record<string, LucideIcon> = {
  "Helmet": HardHat,
  "Helm": HardHat,
  "Body Armour": Shirt,
  "Chest": Shirt,
  "Gloves": Hand,
  "Boots": Footprints,
  "Belt": CircleDashed,
  "Amulet": Gem,
  "Ring 1": CircleDashed,
  "Ring 2": CircleDashed,
  "Weapon 1": Sword,
  "Weapon 2": Shield,
  "Weapon 1 Swap": Sword,
  "Weapon 2 Swap": Shield,
  "Offhand": Shield,
  "Offhand 2": Shield,
  "Flask 1": FlaskConical,
  "Flask 2": FlaskConical,
  "Flask 3": FlaskConical,
  "Flask 4": FlaskConical,
  "Flask 5": FlaskConical,
};

export function slotPlaceholder(slotName: string): LucideIcon {
  return SLOT_PLACEHOLDER_ICON[slotName] ?? Diamond;
}

export function EmptySlot({ label, slotName }: { label: string; slotName: string }) {
  const Icon = slotPlaceholder(slotName);
  return (
    <div className="w-full h-full bg-[#161a20] border border-[#2b313d] rounded flex flex-col items-center justify-center opacity-60 group cursor-not-allowed gap-1">
      <Icon className="h-6 w-6 text-slate-600" strokeWidth={1.5} />
      <span className="text-[9px] text-slate-600 font-medium opacity-60 text-center max-w-full px-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function ItemSlotCard({
  item,
  slotName,
  isMobile = false,
}: {
  item?: PobItem;
  slotName: string;
  isMobile?: boolean;
}) {
  if (!item) return <EmptySlot label={SLOT_LABEL[slotName] ?? slotName} slotName={slotName} />;

  const borderColorHsl =
    RARITY_BORDER_HSL[item.rarity] ?? RARITY_BORDER_HSL.Normal;
  const isCorruptedUnique = item.corrupted && item.rarity === "Unique";
  const parserIconUrl = getEffectiveItemIconUrl(item);

// Server-side lookup fallback: rare items never carry an iconUrl from the
  // PoB export and the engine only populates `Item.iconUrl` for bases that
  // the poe.ninja snapshot has touched. When the parser gives us nothing,
  // we hit `/api/poe/item-icon` (poe.ninja uniques/base types), and if that
  // also comes back empty, we try `/api/poe/base-icon` (wiki base items).
  const [fetchedIconUrl, setFetchedIconUrl] = useState<string | undefined>(undefined);
  const [wikiIconUrl, setWikiIconUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (parserIconUrl || !item) {
      setFetchedIconUrl(undefined);
      setWikiIconUrl(undefined);
      return;
    }
    let cancelled = false;
    const resolveItem = item; // capture for async closure
    const resolveBaseName = item.baseName;

    async function resolve() {
      // 1) Try poe.ninja item-icon
      const params = new URLSearchParams({
        name: resolveItem.name,
        ...(resolveBaseName ? { baseName: resolveBaseName } : {}),
      });
      try {
        const r = await fetch(`/api/poe/item-icon?${params.toString()}`);
        if (r.ok) {
          const data = await r.json();
          if (!cancelled && data?.iconUrl) {
            setFetchedIconUrl(data.iconUrl as string);
            return;
          }
        }
      } catch { /* fall through */ }

      // 2) Try wiki base-icon (only for non-uniques with baseName)
      if (!cancelled && resolveBaseName) {
        try {
          const r2 = await fetch(`/api/poe/base-icon?name=${encodeURIComponent(resolveBaseName)}`);
          if (r2.ok) {
            const data2 = await r2.json();
            if (!cancelled && data2?.iconUrl) {
              setWikiIconUrl(data2.iconUrl as string);
            }
          }
        } catch { /* fall through */ }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [item?.name, item?.baseName, parserIconUrl]);

  const effectiveIconUrl = parserIconUrl ?? fetchedIconUrl ?? wikiIconUrl;
  // When the item exists but no icon URL resolved (rare with no ninja
  // base hit, CDN 404, etc.) we fall back to the same slot-silhouette
  // the empty slot uses. Keeps the grid visually consistent — every
  // cell has a glyph — while the border rarity colour signals "there
  // IS an item here, just missing its icon".
  const FallbackIcon = slotPlaceholder(slotName);

  const trigger = (
    <button
      className="group relative rounded-sm border w-full h-full flex flex-col items-center justify-center bg-[#1a1c23]/80 hover:bg-[#252834] transition-colors cursor-pointer overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      style={{
        borderColor: `hsla(${borderColorHsl}, 0.25)`,
        boxShadow: isCorruptedUnique
          ? `inset 0 0 11px -4px hsla(0, 100%, 41%, 0.5)`
          : "inset 0 0 15px rgba(0,0,0,0.5)",
      }}
    >
      {effectiveIconUrl ? (
        <div className="relative w-full h-full flex items-center justify-center p-1">
          <Image
            src={effectiveIconUrl}
            alt={item.name}
            fill
            className="object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full opacity-75">
          <FallbackIcon
            className="h-7 w-7"
            style={{ color: `hsla(${borderColorHsl}, 0.8)` }}
            strokeWidth={1.5}
          />
        </div>
      )}
    </button>
  );

  return (
    <SmartTooltip
      content={<ItemTooltip item={item} compact={isMobile} />}
      side="right"
      align="start"
      isMobile={isMobile}
    >
      {trigger}
    </SmartTooltip>
  );
}

// ─── Jewel Tooltip (same style as ItemTooltip) ─────────────────────────────────

