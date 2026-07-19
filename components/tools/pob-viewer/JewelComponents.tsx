"use client";

// JewelTooltip and JewelSlotCard components.
import { useEffect, useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Gem, Diamond } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PobSocketedJewel } from "@/lib/pob-types";
import {
  RARITY_BORDER_HSL,
  RARITY_NAME_COLOR_HSL,
  MOD_COLOR_HSL,
  HEADER_TEXTURES,
  INFLUENCE_ICONS,
} from "@/lib/pob/poe-colors";
import { getJewelLocalPath, normalizeSlotName } from "@/lib/pob/icon-helpers";
import { SmartTooltip } from "./ItemTooltip";

export function JewelTooltip({
  jewel,
  compact = false,
}: {
  jewel: PobSocketedJewel;
  compact?: boolean;
}) {
  const displayName =
    jewel.name === "New Item" ? (jewel.baseName ?? jewel.name) : jewel.name;

  const rarity = jewel.rarity || "Normal";
  const nameColorHsl =
    RARITY_NAME_COLOR_HSL[rarity] ?? RARITY_NAME_COLOR_HSL.Normal;
  const headerTextures = HEADER_TEXTURES[rarity];

  const implicits = jewel.implicits ?? [];
  const explicits = jewel.explicits ?? [];
  const hasImplicits = implicits.length > 0;
  const hasExplicits = explicits.length > 0;

  const w = compact ? "w-[min(300px,88vw)]" : "w-[420px]";
  const baseText = compact ? "text-[12px]" : "text-[14px]";
  const hdrPad = compact ? "px-4 py-1" : "px-6 py-1.5";
  const bodyPad = compact ? "px-4 py-1.5" : "px-6 py-2";
  const nameSz = compact
    ? rarity === "Magic"
      ? "text-[13px]"
      : "text-[16px]"
    : rarity === "Magic"
      ? "text-[15px]"
      : "text-[20px]";
  const baseSz = compact ? "text-[11px]" : "text-[13px]";

  return (
    <div
      className={`${w} ${baseText} leading-snug overflow-hidden rounded shadow-xl bg-black/80 font-fontin`}
    >
      <div
        className={`${hdrPad} text-center relative`}
        style={
          headerTextures
            ? {
                background:
                  `url("${headerTextures.left}") top left / contain no-repeat, ` +
                  `url("${headerTextures.right}") top right / contain no-repeat, ` +
                  `url("${headerTextures.middle}") top left / contain repeat-x`,
              }
            : {
                backgroundImage: `linear-gradient(to bottom, hsl(${nameColorHsl}), #3a2a1b)`,
              }
        }
      >
        <p
          className={`font-semibold leading-tight tracking-wide ${nameSz}`}
          style={{
            color: headerTextures
              ? headerTextures.textColor
              : `hsl(${nameColorHsl})`,
          }}
        >
          {displayName}
        </p>
        {jewel.baseName &&
          jewel.baseName !== jewel.name &&
          jewel.name !== "New Item" && (
            <p className={`text-slate-200 ${baseSz} mt-0.5`}>
              {jewel.baseName}
            </p>
          )}
      </div>

      <div className={`${bodyPad} space-y-2 bg-black/80 text-center`}>
        {hasImplicits && (
          <div className="space-y-0.5">
            {implicits.map((mod, i) => (
              <p
                key={`implicit-${i}`}
                className="uppercase first-letter:text-[13px]"
                style={{ color: `hsl(${MOD_COLOR_HSL.crafted})` }}
              >
                {mod}
              </p>
            ))}
          </div>
        )}

        {hasImplicits && hasExplicits && (
          <div className="flex items-center">
            <div className="flex-1 h-px bg-slate-600/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <div className="flex-1 h-px bg-slate-600/50" />
          </div>
        )}

        {hasExplicits && (
          <div className="space-y-0.5">
            {explicits.map((mod, i) => (
              <p
                key={`explicit-${i}`}
                className="uppercase first-letter:text-[14px]"
                style={{ color: `hsl(${MOD_COLOR_HSL.normal})` }}
              >
                {mod}
              </p>
            ))}
          </div>
        )}

        {!hasImplicits && !hasExplicits && (
          <p className="text-slate-500 text-xs italic">No modifiers</p>
        )}
      </div>
    </div>
  );
}

// ─── Jewel slot card (mesmo estilo de ItemSlotCard: slot + imagem ao centro) ──

export function JewelSlotCard({
  jewel,
  isMobile = false,
}: {
  jewel: PobSocketedJewel;
  isMobile?: boolean;
}) {
  const displayName =
    jewel.name === "New Item" ? (jewel.baseName ?? jewel.name) : jewel.name;
  // `getJewelLocalPath` reads both jewel.baseName AND jewel.name via
  // its regex fallback (JEWEL_BASE_PATTERNS) — so even a rare named
  // "Surging Cobalt Jewel of Intelligence" resolves to the Cobalt Jewel
  // base WebP. Passing both strings joined with a space gives the regex
  // a single place to match the base type regardless of whether the
  // parser put it in `name` or `baseName`.
  const searchString = `${jewel.name ?? ""} ${jewel.baseName ?? ""}`;
  const parserIconUrl =
    jewel.iconUrl ?? getJewelLocalPath(searchString);
  const borderHsl = jewel.isCluster
    ? "270, 60%, 55%"
    : (RARITY_BORDER_HSL[jewel.rarity] ?? RARITY_BORDER_HSL.Normal);
  // If `onError` ends up hiding the `<Image>` (missing file, 404, …) we
  // swap to a Lucide diamond silhouette coloured by rarity so the slot
  // never renders as a bare box. Mirrors the ItemSlotCard placeholder
  // treatment for consistency.
  const [iconFailed, setIconFailed] = useState(false);
  // Second-chance fetch: when the local path 404s (e.g. a rare jewel
  // base we don't ship — Timeless, Megalomaniac, etc.) ask poe.ninja
  // via the shared item-icon route before giving up on the glyph.
  const [fetchedIconUrl, setFetchedIconUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!iconFailed) {
      setFetchedIconUrl(undefined);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      name: jewel.name,
      ...(jewel.baseName ? { baseName: jewel.baseName } : {}),
    });
    fetch(`/api/poe/item-icon?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.iconUrl) setFetchedIconUrl(data.iconUrl as string);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [iconFailed, jewel.name, jewel.baseName]);

  const iconUrl = fetchedIconUrl ?? parserIconUrl;

  const trigger = (
    <button
      type="button"
      className="group relative rounded-sm border w-full h-full flex flex-col items-center justify-center bg-[#1a1c23]/80 hover:bg-[#252834] transition-colors cursor-pointer overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      style={{
        borderColor: `hsla(${borderHsl}, 0.25)`,
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.5)",
      }}
    >
      {iconFailed && !fetchedIconUrl ? (
        // Local WebP failed AND the poe.ninja fallback also returned
        // nothing — paint the rarity-tinted silhouette so the slot still
        // reads as "there's a jewel here, icon unavailable".
        <div className="flex items-center justify-center opacity-75">
          <Diamond
            className="h-7 w-7"
            style={{ color: `hsla(${borderHsl}, 0.8)` }}
            strokeWidth={1.5}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center p-0.5">
          <Image
            // Key forces a fresh <img> when the URL changes between the
            // local miss and the ninja-hit so React doesn't reuse the
            // error state from the first attempt.
            key={iconUrl}
            src={iconUrl}
            alt={displayName}
            width={48}
            height={48}
            className="object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            unoptimized
            onError={() => setIconFailed(true)}
          />
        </div>
      )}
    </button>
  );

  return (
    <SmartTooltip
      content={<JewelTooltip jewel={jewel} compact={isMobile} />}
      side="right"
      align="start"
      isMobile={isMobile}
    >
      {trigger}
    </SmartTooltip>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

