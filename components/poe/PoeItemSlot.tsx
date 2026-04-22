"use client";

import Image from "next/image";
import type { PobItem, PobSocketedJewel } from "@/lib/pob-types";
import { RARITY_BORDER_HSL } from "@/components/poe/poe-colors";
import { getEffectiveItemIconUrl, getJewelLocalPath } from "@/components/poe/poe-icon-utils";
import { ItemTooltip, JewelTooltip } from "@/components/poe/PoeItemTooltip";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

// ─── Layout constants ──────────────────────────────────────────────────────────
//
//  poe.ninja-style grid (10 cols × 6 rows):
//
//    Col:   1   2   3   4   5   6   7   8   9   10
//    Row1:  .   .   .   .   Helm Helm Amulet  .   .   .
//    Row2:  .  Wep1 .   .   Body Body .  Wep2 .   .
//    Row3:  .  Wep1 .  Ring1 Body Body Ring2 Wep2 .   .
//    Row4:  .  Wep1 .   .   Body Body .  Wep2 .   .
//    Row5:  .   .  Gloves Gloves Belt Belt Boots Boots .  .
//    Row6:  .   .   .   .  Belt Belt  .   .   .   .
//

export const EQUIPMENT_GRID = [
  { slot: "Weapon 1",    col: "2 / span 2", row: "1 / span 4" },
  { slot: "Weapon 2",    col: "8 / span 2", row: "1 / span 4" },
  { slot: "Helm",        col: "5 / span 2", row: "1 / span 2" },
  { slot: "Amulet",      col: "7 / span 1", row: "3 / span 1" },
  { slot: "Body Armour", col: "5 / span 2", row: "3 / span 3" },
  { slot: "Ring 1",      col: "4 / span 1", row: "4 / span 1" },
  { slot: "Ring 2",      col: "7 / span 1", row: "4 / span 1" },
  { slot: "Gloves",      col: "3 / span 2", row: "5 / span 2" },
  { slot: "Belt",        col: "5 / span 2", row: "6 / span 1" },
  { slot: "Boots",       col: "7 / span 2", row: "5 / span 2" },
] as const;

export const SLOT_LABEL: Record<string, string> = {
  "Weapon 1":    "Main Hand",
  "Weapon 2":    "Off Hand",
  Helm:          "Helm",
  "Body Armour": "Body",
  "Ring 1":      "Ring 1",
  "Ring 2":      "Ring 2",
  Gloves:        "Gloves",
  Belt:          "Belt",
  Boots:         "Boots",
  Amulet:        "Amulet",
  "Flask 1":     "Flask 1",
  "Flask 2":     "Flask 2",
  "Flask 3":     "Flask 3",
  "Flask 4":     "Flask 4",
  "Flask 5":     "Flask 5",
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

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
export type FlaskSlot = (typeof FLASK_SLOTS)[number];

// ─── EmptySlot ─────────────────────────────────────────────────────────────────

export function EmptySlot({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-[#161a20] border border-[#2b313d] rounded flex flex-col items-center justify-center opacity-70 group cursor-not-allowed">
      <span className="text-[10px] text-slate-600 font-medium opacity-50 text-center max-w-full px-1">
        {label}
      </span>
    </div>
  );
}

// ─── ItemSlotCard ──────────────────────────────────────────────────────────────

export function ItemSlotCard({
  item,
  slotName,
  isMobile = false,
}: {
  item?: PobItem;
  slotName: string;
  isMobile?: boolean;
}) {
  if (!item) return <EmptySlot label={SLOT_LABEL[slotName] ?? slotName} />;

  const borderColorHsl =
    RARITY_BORDER_HSL[item.rarity] ?? RARITY_BORDER_HSL.Normal;
  const isCorruptedUnique = item.corrupted && item.rarity === "Unique";
  const effectiveIconUrl = getEffectiveItemIconUrl(item);

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
        <div className="flex items-center justify-center w-full h-full">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: `hsla(${borderColorHsl}, 0.4)`,
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <SmartTooltip
        content={<ItemTooltip item={item} compact={isMobile} />}
        side="right"
        align="start"
        isMobile={isMobile}
      >
        {trigger}
      </SmartTooltip>
    </TooltipProvider>
  );
}

// ─── JewelSlotCard ─────────────────────────────────────────────────────────────

export function JewelSlotCard({
  jewel,
  isMobile = false,
}: {
  jewel: PobSocketedJewel;
  isMobile?: boolean;
}) {
  const displayName =
    jewel.name === "New Item" ? (jewel.baseName ?? jewel.name) : jewel.name;
  const iconUrl =
    jewel.iconUrl ?? getJewelLocalPath(jewel.baseName ?? jewel.name);
  const borderHsl = jewel.isCluster
    ? "270, 60%, 55%"
    : (RARITY_BORDER_HSL[jewel.rarity] ?? RARITY_BORDER_HSL.Normal);

  const trigger = (
    <button
      type="button"
      className="group relative rounded-sm border w-full h-full flex flex-col items-center justify-center bg-[#1a1c23]/80 hover:bg-[#252834] transition-colors cursor-pointer overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      style={{
        borderColor: `hsla(${borderHsl}, 0.25)`,
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center justify-center p-0.5">
        <Image
          src={iconUrl}
          alt={displayName}
          width={48}
          height={48}
          className="object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
          unoptimized
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    </button>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <SmartTooltip
        content={<JewelTooltip jewel={jewel} compact={isMobile} />}
        side="right"
        align="start"
        isMobile={isMobile}
      >
        {trigger}
      </SmartTooltip>
    </TooltipProvider>
  );
}
