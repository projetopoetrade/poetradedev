"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sword, ClipboardCopy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  PobBuildData,
  PobItem,
  PobKeystone,
  PobSocketedJewel,
  PobTreeSpec,
} from "@/lib/pob-parser";
import { GEM_JEWEL_IMAGE_MAP } from "./gem-jewel-image-map";

interface Props {
  locale: string;
}

// ─── PoE.ninja CSS Variables (HSL) ────────────────────────────────────────────

const POE_COLORS = {
  rarity: {
    Unique: "26, 65%, 42%",
    Rare: "60, 100%, 73%",
    Magic: "240, 100%, 77%",
    Normal: "0, 0%, 78%",
  },
  socket: {
    R: "0, 100%, 50%", // Strength - Red
    G: "120, 100%, 40%", // Dexterity - Green
    B: "220, 100%, 60%", // Intelligence - Blue
    W: "0, 0%, 95%", // White
    A: "280, 70%, 60%", // Abyssal
  },
  mod: {
    normal: "240, 100%, 77%",
    crafted: "240, 100%, 85%",
    fractured: "44, 26%, 51%",
    enchant: "240, 100%, 85%",
    scourge: "20, 100%, 57%",
  },
  link: "0, 0%, 60%",
};

// ─── Rarity helpers ───────────────────────────────────────────────────────────

const RARITY_BORDER_HSL: Record<string, string> = {
  Unique: POE_COLORS.rarity.Unique,
  Rare: POE_COLORS.rarity.Rare,
  Magic: POE_COLORS.rarity.Magic,
  Normal: POE_COLORS.rarity.Normal,
};
const RARITY_NAME_COLOR_HSL: Record<string, string> = {
  Unique: POE_COLORS.rarity.Unique,
  Rare: POE_COLORS.rarity.Rare,
  Magic: POE_COLORS.rarity.Magic,
  Normal: POE_COLORS.rarity.Normal,
};
const MOD_COLOR_HSL: Record<string, string> = {
  normal: POE_COLORS.mod.normal,
  crafted: POE_COLORS.mod.crafted,
  fractured: POE_COLORS.mod.fractured,
  enchant: POE_COLORS.mod.enchant,
  scourge: POE_COLORS.mod.scourge,
};

// ─── Socket display (PoE.ninja diamond style) ─────────────────────────────────

const SOCKET_COLOR_HSL: Record<string, string> = {
  R: POE_COLORS.socket.R,
  G: POE_COLORS.socket.G,
  B: POE_COLORS.socket.B,
  W: POE_COLORS.socket.W,
  A: POE_COLORS.socket.A,
};

const INFLUENCE_ICONS: Record<string, string> = {
  shaper: "/pob-influence/shaper.webp",
  elder: "/pob-influence/elder.webp",
  crusader: "/pob-influence/crusader.webp",
  redeemer: "/pob-influence/redeemer.webp",
  hunter: "/pob-influence/hunter.webp",
  warlord: "/pob-influence/warlord.webp",
  fractured: "/pob-influence/fractured.webp",
  searing: "/pob-influence/searing.webp",
  eater: "/pob-influence/eater.webp",
};

const HEADER_TEXTURES: Record<
  string,
  | {
      left: string;
      middle: string;
      right: string;
      textColor: string;
    }
  | undefined
> = {
  Unique: {
    left: "/pob-headers/ItemsHeaderUniqueLeft.webp",
    middle: "/pob-headers/ItemsHeaderUniqueMiddle.webp",
    right: "/pob-headers/ItemsHeaderUniqueRight.webp",
    textColor: "#ffaf60",
  },
  Rare: {
    left: "/pob-headers/ItemsHeaderRareLeft.webp",
    middle: "/pob-headers/ItemsHeaderRareMiddle.webp",
    right: "/pob-headers/ItemsHeaderRareRight.webp",
    textColor: "#ffdd77",
  },
  Magic: {
    left: "/pob-headers/ItemsHeaderMagicLeft.webp",
    middle: "/pob-headers/ItemsHeaderMagicMiddle.webp",
    right: "/pob-headers/ItemsHeaderMagicRight.webp",
    textColor: "#b4b4ff",
  },
};

// Flask base types (normal/magic) → local icon paths (pasta public/flask_images)
const FLASK_BASE_ICON_URLS: Record<string, string> = {
  // Life flasks
  "Small Life Flask": "/flask_images/small-life-flask.webp",
  "Medium Life Flask": "/flask_images/medium-life-flask.webp",
  "Large Life Flask": "/flask_images/large-life-flask.webp",
  "Greater Life Flask": "/flask_images/greater-life-flask.webp",
  "Grand Life Flask": "/flask_images/grand-life-flask.webp",
  "Giant Life Flask": "/flask_images/giant-life-flask.webp",
  "Colossal Life Flask": "/flask_images/colossal-life-flask.webp",
  "Sacred Life Flask": "/flask_images/sacred-life-flask.webp",
  "Hallowed Life Flask": "/flask_images/hallowed-life-flask.webp",
  "Sanctified Life Flask": "/flask_images/sanctified-life-flask.webp",
  "Divine Life Flask": "/flask_images/divine-life-flask.webp",
  "Eternal Life Flask": "/flask_images/eternal-life-flask.webp",

  // Mana flasks
  "Small Mana Flask": "/flask_images/small-mana-flask.webp",
  "Medium Mana Flask": "/flask_images/medium-mana-flask.webp",
  "Large Mana Flask": "/flask_images/large-mana-flask.webp",
  "Greater Mana Flask": "/flask_images/greater-mana-flask.webp",
  "Grand Mana Flask": "/flask_images/grand-mana-flask.webp",
  "Giant Mana Flask": "/flask_images/giant-mana-flask.webp",
  "Colossal Mana Flask": "/flask_images/colossal-mana-flask.webp",
  "Sacred Mana Flask": "/flask_images/sacred-mana-flask.webp",
  "Hallowed Mana Flask": "/flask_images/hallowed-mana-flask.webp",
  "Sanctified Mana Flask": "/flask_images/sanctified-mana-flask.webp",
  "Divine Mana Flask": "/flask_images/divine-mana-flask.webp",
  "Eternal Mana Flask": "/flask_images/eternal-mana-flask.webp",

  // Hybrid flasks
  "Small Hybrid Flask": "/flask_images/small-hybrid-flask.webp",
  "Medium Hybrid Flask": "/flask_images/medium-hybrid-flask.webp",
  "Large Hybrid Flask": "/flask_images/large-hybrid-flask.webp",
  "Colossal Hybrid Flask": "/flask_images/colossal-hybrid-flask.webp",
  "Sacred Hybrid Flask": "/flask_images/sacred-hybrid-flask.webp",
  "Hallowed Hybrid Flask": "/flask_images/hallowed-hybrid-flask.webp",

  // Utility flasks
  "Diamond Flask": "/flask_images/diamond-flask.webp",
  "Ruby Flask": "/flask_images/ruby-flask.webp",
  "Sapphire Flask": "/flask_images/sapphire-flask.webp",
  "Topaz Flask": "/flask_images/topaz-flask.webp",
  "Granite Flask": "/flask_images/granite-flask.webp",
  "Quicksilver Flask": "/flask_images/quicksilver-flask.webp",
  "Amethyst Flask": "/flask_images/amethyst-flask.webp",
  "Quartz Flask": "/flask_images/quartz-flask.webp",
  "Jade Flask": "/flask_images/jade-flask.webp",
  "Basalt Flask": "/flask_images/basalt-flask.webp",
  "Aquamarine Flask": "/flask_images/aquamarine-flask.webp",
  "Stibnite Flask": "/flask_images/stibnite-flask.webp",
  "Sulphur Flask": "/flask_images/sulphur-flask.webp",
  "Silver Flask": "/flask_images/silver-flask.webp",
  "Bismuth Flask": "/flask_images/bismuth-flask.webp",
  "Gold Flask": "/flask_images/gold-flask.webp",
  "Corundum Flask": "/flask_images/corundum-flask.webp",
  "Iron Flask": "/flask_images/iron-flask.webp",
};

// Unique flasks → local icon paths (pasta public/flask_images)
const UNIQUE_FLASK_ICON_URLS: Record<string, string> = {
  "Atziri's Promise": "/flask_images/atziris-promise.webp",
  "Blood of the Karui": "/flask_images/blood-of-the-karui.webp",
  "Bottled Faith": "/flask_images/bottled-faith.webp",
  "Cinderswallow Urn": "/flask_images/cinderswallow-urn.webp",
  "Coralito's Signature": "/flask_images/coralitos-signature.webp",
  "Coruscating Elixir": "/flask_images/coruscating-elixir.webp",
  "Divination Distillate": "/flask_images/divination-distillate.webp",
  "Doedre's Elixir": "/flask_images/doedres-elixir.webp",
  "Dying Sun": "/flask_images/dying-sun.webp",
  "Elixir of the Unbroken Circle":
    "/flask_images/elixir-of-the-unbroken-circle.webp",
  "Forbidden Taste": "/flask_images/forbidden-taste.webp",
  "Kiara's Determination": "/flask_images/kiaras-determination.webp",
  "Lavianga's Spirit": "/flask_images/laviangas-spirit.webp",
  "Lion's Roar": "/flask_images/lions-roar.webp",
  "Olroth's Resolve": "/flask_images/olroths-resolve.webp",
  "Oriath's End": "/flask_images/oriaths-end.webp",
  Progenesis: "/flask_images/progenesis.webp",
  "Replica Lavianga's Spirit": "/flask_images/replica-laviangas-spirit.webp",
  "Replica Rumi's Concoction": "/flask_images/replica-rumis-concoction.webp",
  "Replica Sorrow of the Divine":
    "/flask_images/replica-sorrow-of-the-divine.webp",
  "Replica Witchfire Brew": "/flask_images/replica-witchfire-brew.webp",
  Rotgut: "/flask_images/rotgut.webp",
  "Rumi's Concoction": "/flask_images/rumis-concoction.webp",
  "Sin's Rebirth": "/flask_images/sins-rebirth.webp",
  "Soul Catcher": "/flask_images/soul-catcher.webp",
  "Soul Ripper": "/flask_images/soul-ripper.webp",
  "Starlight Chalice": "/flask_images/starlight-chalice.webp",
  "Taste of Hate": "/flask_images/taste-of-hate.webp",
  "The Overflowing Chalice": "/flask_images/the-overflowing-chalice.webp",
  "The Sorrow of the Divine": "/flask_images/the-sorrow-of-the-divine.webp",
  "The Wise Oak": "/flask_images/the-wise-oak.webp",
  "The Writhing Jar": "/flask_images/the-writhing-jar.webp",
  "Vessel of Vinktar": "/flask_images/vessel-of-vinktar.webp",
  "Vorana's Preparation": "/flask_images/voranas-preparation.webp",
  "Wellwater Phylactery": "/flask_images/wellwater-phylactery.webp",
  "Wine of the Prophet": "/flask_images/wine-of-the-prophet.webp",
  "Witchfire Brew": "/flask_images/witchfire-brew.webp",
  "Zerphi's Last Breath": "/flask_images/zerphis-last-breath.webp",
};

// Tincture base types → local icon paths (pasta public/tinctures)
const TINCTURE_BASE_ICON_URLS: Record<string, string> = {
  "Prismatic Tincture": "/tinctures/Prismatic_Tincture.webp",
  "Rosethorn Tincture": "/tinctures/Rosethorn_Tincture.webp",
  "Ironwood Tincture": "/tinctures/Ironwood_Tincture.webp",
  "Ashbark Tincture": "/tinctures/Ashbark_Tincture.webp",
  "Borealwood Tincture": "/tinctures/Borealwood_Tincture.webp",
  "Fulgurite Tincture": "/tinctures/Fulgurite_Tincture.webp",
  "Poisonberry Tincture": "/tinctures/Poisonberry_Tincture.webp",
  "Blood Sap Tincture": "/tinctures/Blood_Sap_Tincture.webp",
  "Oakbranch Tincture": "/tinctures/Oakbranch_Tincture.webp",
  "Sporebloom Tincture": "/tinctures/Sporebloom_Tincture.webp",
};

// Unique tinctures → local icon paths (pasta public/tinctures)
const UNIQUE_TINCTURE_ICON_URLS: Record<string, string> = {
  "Sap of the Seasons": "/tinctures/Sap_of_the_Seasons.webp",
  "Mightblood Ire": "/tinctures/Mightblood_Ire.webp",
  "Wildfire Phloem": "/tinctures/Wildfire_Phloem.webp",
  "The Battle Within": "/tinctures/The_Battle_Within.webp",
  "Grasping Nightshade": "/tinctures/Grasping_Nightshade.webp",
};

// Mapeamentos especiais para skill gems cujo arquivo não segue o kebab padrão do nome.
// (ex: "Pride" → arquivo "pride-aura.webp")
// Support gems NÃO precisam de aliases: o padrão "nome-support.webp" cobre todos os casos.

const SKILL_GEM_ALIASES: Record<string, string> = {
  beserk: "beserk",
  "purifying flame": "purifying-flame",
  vitality: "vitality",
  wrath: "wrath",
  hatred: "hatred",
  haste: "haste",
  grace: "grace",
  determination: "determination",
  discipline: "discipline",
  clarity: "clarity",
  anger: "anger",
  pride: "pride-aura",
};

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getKeystoneLocalPath(name: string): string {
  return `/images/keystone/${toKebab(name)}.webp`;
}

function getMasteryLocalPath(masteryName: string): string {
  const base = masteryName.replace(/\s*mastery$/i, "").trim();
  return `/images/mastery/${toKebab(base)}.webp`;
}

function getGemLocalPath(name: string, isSupport: boolean): string {
  // Check map first
  if (GEM_JEWEL_IMAGE_MAP[name]) {
    return GEM_JEWEL_IMAGE_MAP[name];
  }

  // Skill gems com arquivo que não segue o kebab padrão (ex: Pride → pride-aura.webp)
  const lowerName = name.toLowerCase().replace(/\s+support$/i, "");
  if (!isSupport && SKILL_GEM_ALIASES[lowerName]) {
    return `/images/gem/skill/${SKILL_GEM_ALIASES[lowerName]}.webp`;
  }

  // Para o kebab: usamos o nome sem " Support" para checks de vaal/awakened,
  // e o nome completo para o fallback de support.
  const normalizedName = name.replace(/\s+Support$/i, "");
  const kebab = toKebab(normalizedName); // sem "Support" — para vaal/awakened checks
  const fullKebab = toKebab(name); // nome completo — para support fallback

  if (kebab.startsWith("vaal-")) return `/images/gem/vaal/${fullKebab}.webp`;
  if (kebab.startsWith("awakened-"))
    return `/images/gem/awakened/${fullKebab.endsWith("-support") ? fullKebab : `${fullKebab}-support`}.webp`;
  if (isSupport) {
    // Arquivos de support seguem o padrão "nome-support.webp".
    // Se o nameSpec do PoB não inclui "Support" (ex: "Faster Attacks"),
    // o fullKebab não terá o sufixo — adicionamos aqui.
    const supportFilename = fullKebab.endsWith("-support")
      ? fullKebab
      : `${fullKebab}-support`;
    return `/images/gem/support/${supportFilename}.webp`;
  }
  return `/images/gem/skill/${kebab}.webp`;
}

function getJewelLocalPath(name: string): string {
  // Check map first
  if (GEM_JEWEL_IMAGE_MAP[name]) {
    return GEM_JEWEL_IMAGE_MAP[name];
  }
  return `/images/jewel/${toKebab(name)}.webp`;
}

function getEffectiveItemIconUrl(item: PobItem): string | undefined {
  // 1) Uniques primeiro: tinctures, depois flasks
  const uniqueTinctureIcon =
    item.rarity === "Unique" && UNIQUE_TINCTURE_ICON_URLS[item.name]
      ? UNIQUE_TINCTURE_ICON_URLS[item.name]
      : undefined;
  if (uniqueTinctureIcon) return uniqueTinctureIcon;

  const uniqueFlaskIcon =
    item.rarity === "Unique" && UNIQUE_FLASK_ICON_URLS[item.name]
      ? UNIQUE_FLASK_ICON_URLS[item.name]
      : undefined;
  if (uniqueFlaskIcon) return uniqueFlaskIcon;

  // 2) Bases: tinctures, depois flasks
  const baseName = item.baseName;
  if (baseName && TINCTURE_BASE_ICON_URLS[baseName]) {
    return TINCTURE_BASE_ICON_URLS[baseName];
  }
  if (baseName && FLASK_BASE_ICON_URLS[baseName]) {
    return FLASK_BASE_ICON_URLS[baseName];
  }

  // 3) Fallback para URL vinda do parser/poe.ninja
  return item.iconUrl;
}

// Normaliza alguns nomes de slot vindos do PoB para bater com o grid
function normalizeSlotName(slot: string): string {
  if (slot === "Helmet") return "Helm";
  return slot;
}

// ─── SmartTooltip ─────────────────────────────────────────────────────────────
// Hover no desktop, click no mobile (pointer: coarse).

function SmartTooltip({
  children,
  content,
  side = "right",
  align = "start",
  isMobile,
}: {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={8}
          className="p-0 border-none bg-transparent shadow-none w-auto min-w-0"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* cloneElement para adicionar onClick sem perder props existentes */}
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={6}
        className="p-0 border-none bg-transparent shadow-none w-auto min-w-0 max-w-[95vw] overflow-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

// ─── Socket display ───────────────────────────────────────────────────────────

function SocketDisplay({ sockets }: { sockets: string }) {
  const groups = sockets.split(" ").filter(Boolean);
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center justify-center">
          {group.split("-").map((sock, si, arr) => (
            <div key={si} className="flex items-center">
              <div
                className="w-4 h-4 relative shadow-lg bg-[#1e2530]"
                style={{
                  border: `3px solid hsla(${SOCKET_COLOR_HSL[sock] ?? "0, 0%, 50%"}, 0.5)`,
                  borderRadius:
                    si === 0 || si === arr.length - 1 ? "4px" : "9999px",
                  transform: "rotate(45deg)",
                }}
                title={sock}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle, hsla(${SOCKET_COLOR_HSL[sock] ?? "0, 0%, 50%"}, 0.3) 0%, transparent 70%)`,
                  }}
                />
              </div>
              {si < arr.length - 1 && (
                <div
                  className="w-3 h-1 -mx-0.5"
                  style={{
                    backgroundColor: `hsla(${POE_COLORS.link}, 0.6)`,
                    border: `1px solid hsla(${POE_COLORS.link}, 0.8)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Item tooltip (PoE style) ─────────────────────────────────────────────────

function ItemTooltip({ item, compact = false }: { item: PobItem; compact?: boolean }) {
  const nameColorHsl =
    RARITY_NAME_COLOR_HSL[item.rarity] ?? RARITY_NAME_COLOR_HSL.Normal;
  const headerTextures = HEADER_TEXTURES[item.rarity];

  const influences = item.influences ?? [];
  const isFracturedItem = Boolean(item.fractured);

  const leftInfluenceKey = isFracturedItem ? "fractured" : influences[0];
  const rightInfluenceKey = isFracturedItem
    ? "fractured"
    : (influences[1] ?? influences[0]);

  const leftInfluenceIcon =
    leftInfluenceKey && INFLUENCE_ICONS[leftInfluenceKey];
  const rightInfluenceIcon =
    rightInfluenceKey && INFLUENCE_ICONS[rightInfluenceKey];

  // Enchant em bloco separado; crafted continua na lista de explicits,
  // apenas com cor diferenciada.
  const enchantMods = [...item.implicits, ...item.explicits].filter(
    (m) => m.type === "enchant",
  );
  const implicitMods = item.implicits.filter((m) => m.type !== "enchant");
  const explicitMods = item.explicits; // mantém crafted na ordem original

  const hasEnchant = enchantMods.length > 0;
  const hasImplicit = implicitMods.length > 0;
  const hasExplicit = explicitMods.length > 0;
  const effectiveIconUrl = getEffectiveItemIconUrl(item);

  // Tamanhos adaptados para modo compacto (mobile)
  const w        = compact ? "w-[min(300px,88vw)]" : "w-[420px]";
  const baseText = compact ? "text-[12px]"          : "text-[14px]";
  const hdrPad   = compact ? "px-4 py-1"            : "px-6 py-1.5";
  const bodyPad  = compact ? "px-4 py-1.5"          : "px-6 py-2";
  const nameSz   = compact
    ? (item.rarity === "Magic" ? "text-[13px]" : "text-[16px]")
    : (item.rarity === "Magic" ? "text-[15px]" : "text-[20px]");
  const baseSz   = compact ? "text-[11px]" : "text-[13px]";

  return (
    <div className={`${w} ${baseText} leading-snug overflow-hidden rounded shadow-xl bg-black/80 font-fontin`}>
      {/* Header: name + base type */}
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
          {item.name}
        </p>
        {item.baseName && item.baseName !== item.name && (
          <p className={`text-slate-200 ${baseSz} mt-0.5`}>{item.baseName}</p>
        )}

        {leftInfluenceIcon && (
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6">
            <Image
              src={leftInfluenceIcon}
              alt={leftInfluenceKey ?? "influence"}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        {rightInfluenceIcon && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6">
            <Image
              src={rightInfluenceIcon}
              alt={rightInfluenceKey ?? "influence"}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}
      </div>

      <div className={`${bodyPad} space-y-3 bg-black/80 text-center`}>
        {/* Properties */}
        {(item.quality ||
          item.itemLevel ||
          item.sockets ||
          item.armour ||
          item.evasion ||
          item.energyShield ||
          item.physDamage ||
          item.eleDamage) && (
          <div className="space-y-1.5 border-b border-slate-600/60 pb-2">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-slate-300 text-[12px]">
              {item.quality !== undefined && (
                <span>
                  Quality:{" "}
                  <span className="text-sky-300 font-semibold">
                    +{item.quality}%
                  </span>
                </span>
              )}
              {item.itemLevel !== undefined && (
                <span>
                  Item Level:{" "}
                  <span className="text-slate-100 font-semibold">
                    {item.itemLevel}
                  </span>
                </span>
              )}
            </div>

            {/* Weapon DPS */}
            {(item.physDamage || item.eleDamage || item.chaosDamage) &&
              item.aps !== undefined &&
              (() => {
                const aps = item.aps!;
                const pDPS = item.physDamage
                  ? ((item.physDamage[0] + item.physDamage[1]) / 2) * aps
                  : 0;
                const eDPS = item.eleDamage
                  ? ((item.eleDamage[0] + item.eleDamage[1]) / 2) * aps
                  : 0;
                const cDPS = item.chaosDamage
                  ? ((item.chaosDamage[0] + item.chaosDamage[1]) / 2) * aps
                  : 0;
                const totalDPS = pDPS + eDPS + cDPS;
                return (
                  <div className="mt-1 flex flex-col items-center gap-1 text-slate-300 text-[12px]">
                    {item.physDamage && (
                      <span>
                        Physical Damage:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.physDamage[0]}-{item.physDamage[1]}
                        </span>{" "}
                        ·{" "}
                        <span className="text-sky-300 font-semibold">
                          {pDPS.toFixed(1)} pDPS
                        </span>
                      </span>
                    )}
                    {item.eleDamage && (
                      <span>
                        Elemental Damage:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.eleDamage[0]}-{item.eleDamage[1]}
                        </span>{" "}
                        ·{" "}
                        <span className="text-orange-300 font-semibold">
                          {eDPS.toFixed(1)} eDPS
                        </span>
                      </span>
                    )}
                    {item.chaosDamage && (
                      <span>
                        Chaos Damage:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.chaosDamage[0]}-{item.chaosDamage[1]}
                        </span>{" "}
                        ·{" "}
                        <span className="text-purple-400 font-semibold">
                          {cDPS.toFixed(1)} cDPS
                        </span>
                      </span>
                    )}
                    <span>
                      Attacks per Second:{" "}
                      <span className="text-slate-100 font-semibold">
                        {aps.toFixed(2)}
                      </span>
                    </span>
                    {item.critChance !== undefined && (
                      <span>
                        Crit Chance:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.critChance.toFixed(2)}%
                        </span>
                      </span>
                    )}
                    <span className="border-t border-slate-600/50 pt-1 mt-0.5 w-full text-center">
                      <span className="text-yellow-300 font-bold">
                        {item.isEstimatedDps ? "~" : ""}{totalDPS.toFixed(1)} Total DPS
                      </span>
                      {pDPS > 0 && eDPS + cDPS > 0 && (
                        <span className="text-slate-500 ml-2">
                          ({pDPS.toFixed(0)} phys + {(eDPS + cDPS).toFixed(0)} ele/chaos)
                        </span>
                      )}
                    </span>
                    {item.isEstimatedDps && (
                      <span className="text-slate-500 text-[10px] italic w-full text-center">
                        estimated from base type
                      </span>
                    )}
                  </div>
                );
              })()}

            {(item.armour || item.evasion || item.energyShield) && (
              <div className="mt-1 flex flex-col items-center gap-1 text-slate-300 text-[12px]">
                {item.armour !== undefined && (
                  <span>
                    Armour:{" "}
                    <span className="text-sky-300 font-semibold">
                      {item.armour}
                    </span>
                  </span>
                )}
                {item.evasion !== undefined && (
                  <span>
                    Evasion:{" "}
                    <span className="text-sky-300 font-semibold">
                      {item.evasion}
                    </span>
                  </span>
                )}
                {item.energyShield !== undefined && (
                  <span>
                    Energy Shield:{" "}
                    <span className="text-sky-300 font-semibold">
                      {item.energyShield}
                    </span>
                  </span>
                )}
              </div>
            )}

            {item.sockets && <SocketDisplay sockets={item.sockets} />}
          </div>
        )}

        {/* Enchant */}
        {hasEnchant && (
          <div className="pt-2 space-y-0.25">
            {enchantMods.map((mod, i) => (
              <p
                key={`enchant-${i}`}
                className="uppercase first-letter:text-[13px]"
                style={{ color: `hsl(${MOD_COLOR_HSL[mod.type]})` }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {/* Divider entre Enchant e Implicits */}
        {hasEnchant && hasImplicit && (
          <div className="mt-1 border-t border-slate-600/60 pt-1.5" />
        )}

        {/* Implicits (não-enchant) */}
        {hasImplicit && (
          <div className={`${hasEnchant ? "" : "pt-1"}`}>
            {implicitMods.map((mod, i) => (
              <p
                key={`implicit-${i}`}
                className="uppercase first-letter:text-[13px]"
                style={{ color: `hsl(${MOD_COLOR_HSL[mod.type]})` }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {/* Divider entre implicits e explicits */}
        {hasImplicit && hasExplicit && (
          <div className="flex items-center">
            <div className="flex-1 h-px bg-slate-600/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <div className="flex-1 h-px bg-slate-600/50" />
          </div>
        )}

        {/* Explicits (inclui crafted; crafted fica branco) */}
        {hasExplicit && (
          <div className="space-y-0.5">
            {explicitMods.map((mod, i) => (
              <p
                key={i}
                className="uppercase first-letter:text-[14px]"
                style={{
                  color:
                    mod.type === "crafted"
                      ? "#ffffff"
                      : `hsl(${MOD_COLOR_HSL[mod.type]})`,
                }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {/* Corrupted */}
        {item.corrupted && (
          <div className="border-t border-slate-600/70 pt-2">
            <p className="text-red-500 font-semibold tracking-wide">
              Corrupted
            </p>
          </div>
        )}

        {/* Icon inside tooltip removed (slot already shows icon) */}
      </div>
    </div>
  );
}

// ─── Equipment slot layout ────────────────────────────────────────────────────
//
//  poe.ninja-style grid (4 cols × 5 rows):
//
//    Col:   1       2       3       4
//    Row1:  .       Helm    Helm    Amulet
//    Row2:  Wep1    Body    Body    Wep2
//    Row3:  Wep1    Body    Body    Wep2
//    Row4:  Ring1   Body    Body    Ring2
//    Row5:  Gloves  Belt    Boots   .
//
//  Belt is in col 2 row 5 → right of Gloves (col 1) and left of Boots (col 3) ✓

const EQUIPMENT_GRID = [
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
const SLOT_LABEL: Record<string, string> = {
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

const EQUIPMENT_SLOTS = [
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

const FLASK_SLOTS = [
  "Flask 1",
  "Flask 2",
  "Flask 3",
  "Flask 4",
  "Flask 5",
] as const;

// ─── Slot card ────────────────────────────────────────────────────────────────

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-[#161a20] border border-[#2b313d] rounded flex flex-col items-center justify-center opacity-70 group cursor-not-allowed">
      <span className="text-[10px] text-slate-600 font-medium opacity-50 text-center max-w-full px-1">
        {label}
      </span>
    </div>
  );
}

function ItemSlotCard({
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

function JewelTooltip({ jewel, compact = false }: { jewel: PobSocketedJewel; compact?: boolean }) {
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

  const w        = compact ? "w-[min(300px,88vw)]" : "w-[420px]";
  const baseText = compact ? "text-[12px]"          : "text-[14px]";
  const hdrPad   = compact ? "px-4 py-1"            : "px-6 py-1.5";
  const bodyPad  = compact ? "px-4 py-1.5"          : "px-6 py-2";
  const nameSz   = compact
    ? (rarity === "Magic" ? "text-[13px]" : "text-[16px]")
    : (rarity === "Magic" ? "text-[15px]" : "text-[20px]");
  const baseSz   = compact ? "text-[11px]" : "text-[13px]";

  return (
    <div className={`${w} ${baseText} leading-snug overflow-hidden rounded shadow-xl bg-black/80 font-fontin`}>
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

function JewelSlotCard({
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

export default function PobViewerClient({ locale }: Props) {
  const isPt = locale === "pt-br";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PobBuildData | null>(null);
  const [activeItemSetIndex, setActiveItemSetIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTreeSpecIndex, setActiveTreeSpecIndex] = useState(0);
  const [gemInfoMap, setGemInfoMap] = useState<
    Record<
      string,
      {
        primary_attribute: string | null;
        gem_description: string | null;
      }
    >
  >({});

  const hasUrlParam = Boolean(
    searchParams.get("id") || searchParams.get("code"),
  );
  const [isInitialLoad, setIsInitialLoad] = useState(hasUrlParam);
  const [isMobile, setIsMobile] = useState(false);
  const [sharedBuildId, setSharedBuildId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pobKey, setPobKey] = useState<string | null>(null);
  const [pobLoading, setPobLoading] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function formatMovementSpeed(value: string): string {
    const match = value.match(/^([\d.]+)x$/);
    if (match) {
      const multiplier = parseFloat(match[1]);
      const percent = (multiplier - 1) * 100;
      return `${percent.toFixed(0)}%`;
    }
    return value;
  }

  function handleLoadoutChange(newIndex: number) {
    setActiveItemSetIndex(newIndex);
    const newItemSetTitle = itemSets[newIndex]?.title;
    if (newItemSetTitle && treeDetails?.Specs) {
      const matchingSpecIndex = treeDetails.Specs.findIndex(
        (spec) => spec.title === newItemSetTitle,
      );
      if (matchingSpecIndex !== -1) {
        setActiveTreeSpecIndex(matchingSpecIndex);
        const specNodes = treeDetails.Specs[matchingSpecIndex]?.nodes ?? [];
        if (specNodes.length > 0) sendNodesToViewer(specNodes);
      }
    }
  }

  function sendNodesToViewer(nodeIds: number[]) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "loadNodes", nodeIds },
      "*",
    );
  }
  async function handleAnalyze(
    from?: string,
    options?: { updateUrl?: boolean },
  ) {
    const source = (from ?? input).trim();
    if (!source) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSharedBuildId(null);
    setPobKey(null);
    try {
      // 1) Criar/obter hash compartilhável no Supabase
      let sharedId: string | null = null;
      try {
        const shareRes = await fetch("/api/tools/pob-viewer/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pobCode: source }),
        });
        const shareJson = await shareRes.json();
        if (shareRes.ok && shareJson.id) {
          sharedId = shareJson.id as string;
          setSharedBuildId(shareJson.id as string);
        }
      } catch {
        // Se der erro no share, seguimos apenas com o parse normal
      }

      // 2) Processar o PoB normalmente
      const res = await fetch("/api/tools/pob-viewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pobCode: source }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(
          json.error ??
            (isPt ? "Erro ao processar PoB." : "Error processing PoB."),
        );
      } else {
        const buildData = json as PobBuildData;
        setData(buildData);
        const specIdx = buildData.TreeDetails?.ActiveSpecIndex ?? 0;
        setActiveTreeSpecIndex(specIdx);
        const specNodes = buildData.TreeDetails?.Specs?.[specIdx]?.nodes ?? [];
        if (specNodes.length > 0) sendNodesToViewer(specNodes);
        // Atualiza a URL com ?id=<hash> quando disponível
        if ((options?.updateUrl ?? true) && sharedId) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("code"); // legado
          params.set("id", sharedId);
          router.replace(`?${params.toString()}`, { scroll: true });
        }
      }
    } catch {
      setError(
        isPt
          ? "Erro de rede. Tente novamente."
          : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.Stats ?? {};
  const hasStats = Object.keys(stats).length > 0;
  const buildInfo = data?.BuildInfo;
  const treeDetails = data?.TreeDetails;
  const itemSets = data?.ItemSets ?? [];
  const skillSets = data?.SkillSets ?? [];

  const safeItemSetIndex =
    itemSets.length === 0
      ? 0
      : Math.min(activeItemSetIndex, itemSets.length - 1);
  const itemSetItems =
    itemSets.length > 0 ? (itemSets[safeItemSetIndex]?.items ?? []) : [];
  const slotMap: Record<string, PobItem> = {};
  for (const item of itemSetItems) {
    const key = normalizeSlotName(item.slot);
    slotMap[key] = item;
  }

  const hasMultipleLoadouts = itemSets.length > 1;
  const hasMultipleSpecs = (treeDetails?.Specs?.length ?? 0) > 1;
  const activeViewSpec: PobTreeSpec | undefined =
    treeDetails?.Specs[activeTreeSpecIndex];

  // Ao trocar o loadout (ItemSet), mostramos o SkillSet correspondente (por índice) quando disponível.
  const skillSetIndex = Math.min(
    safeItemSetIndex,
    Math.max(0, skillSets.length - 1),
  );
  const activeSkillGroups =
    skillSets.length > 0
      ? (skillSets[skillSetIndex]?.skills ?? [])
      : (data?.Skills ?? []);

  // Dev logging para ajudar a depurar ícones de flasks / items.
  if (
    process.env.NODE_ENV !== "production" &&
    data &&
    itemSetItems.length > 0
  ) {
    // Loga visão geral dos item sets carregados.
    // eslint-disable-next-line no-console
    console.log("[PoB Viewer] ItemSets:", {
      totalSets: itemSets.length,
      activeSetIndex: safeItemSetIndex,
      activeSetTitle: itemSets[safeItemSetIndex]?.title,
      itemsInActiveSet: itemSetItems.length,
    });

    // Foca principalmente nos slots de Flask para debug de imagens.
    const flaskSlotsDebug = FLASK_SLOTS.map((slotName) => {
      const it = slotMap[slotName];
      return it
        ? {
            slot: slotName,
            name: it.name,
            baseName: it.baseName,
            rarity: it.rarity,
            iconUrl: it.iconUrl,
          }
        : { slot: slotName, empty: true };
    });

    // eslint-disable-next-line no-console
    console.log("[PoB Viewer] Flask slots debug:", flaskSlotsDebug);

    // ── Weapon DPS debug (client) ──────────────────────────────────────────
    const weaponSlots = ["Weapon 1", "Weapon 2"] as const;
    for (const slot of weaponSlots) {
      const w = slotMap[slot];
      if (!w) {
        // eslint-disable-next-line no-console
        console.log(`[PoB Viewer] ${slot}: vazio`);
        continue;
      }
      const aps = w.aps;
      const pDPS =
        w.physDamage && aps
          ? (((w.physDamage[0] + w.physDamage[1]) / 2) * aps).toFixed(1)
          : null;
      const eDPS =
        w.eleDamage && aps
          ? (((w.eleDamage[0] + w.eleDamage[1]) / 2) * aps).toFixed(1)
          : null;
      const cDPS =
        w.chaosDamage && aps
          ? (((w.chaosDamage[0] + w.chaosDamage[1]) / 2) * aps).toFixed(1)
          : null;
      // eslint-disable-next-line no-console
      console.log(`[PoB Viewer] ${slot}: "${w.name}" (${w.rarity})`, {
        physDamage:  w.physDamage  ?? "—",
        eleDamage:   w.eleDamage   ?? "—",
        chaosDamage: w.chaosDamage ?? "—",
        critChance:  w.critChance != null ? `${w.critChance}%` : "—",
        aps:         aps           ?? "—",
        pDPS:        pDPS          ?? "—",
        eDPS:        eDPS          ?? "—",
        cDPS:        cDPS          ?? "—",
        totalDPS: aps
          ? (
              (w.physDamage
                ? ((w.physDamage[0] + w.physDamage[1]) / 2) * aps
                : 0) +
              (w.eleDamage
                ? ((w.eleDamage[0] + w.eleDamage[1]) / 2) * aps
                : 0) +
              (w.chaosDamage
                ? ((w.chaosDamage[0] + w.chaosDamage[1]) / 2) * aps
                : 0)
            ).toFixed(1)
          : "—",
      });
    }
    // ──────────────────────────────────────────────────────────────────────
  }

  // Buscar primary_attribute e descrição das gems após build carregado
  useEffect(() => {
    if (!data) return;
    const allGems = (data.SkillSets ?? []).flatMap((ss) =>
      (ss.skills ?? []).flatMap((sg) => sg.gems ?? []),
    );
    const uniqueNames = Array.from(new Set(allGems.map((g) => g.name)));
    if (uniqueNames.length === 0) return;

    console.log(
      `[PoB] Buscando info de ${uniqueNames.length} gems:`,
      uniqueNames,
    );

    const encoded = uniqueNames.map(encodeURIComponent).join(",");
    const url = `/api/tools/poe-gems/info?names=${encoded}`;
    console.log(`[PoB] GET ${url}`);

    fetch(url)
      .then(async (r) => {
        const json = await r.json();
        const matched = Object.keys(json);
        const missing = uniqueNames.filter((n) => !json[n]);
        console.log(
          `[PoB] Gems com match (${matched.length}/${uniqueNames.length}):`,
          matched,
        );
        if (missing.length > 0)
          console.warn(
            `[PoB] Gems sem match no DB (${missing.length}):`,
            missing,
          );
        console.log("[PoB] gemInfoMap completo:", json);
        setGemInfoMap(json);
      })
      .catch((err) => console.error("[PoB] Erro ao buscar gem info:", err));
  }, [data]);

  // Auto-carregar PoB se houver ?code= na URL
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const codeFromUrl = searchParams.get("code"); // suporte legado
    if (loading || data) return;

    const run = async () => {
      try {
        if (idFromUrl) {
          const res = await fetch(
            `/api/tools/pob-viewer/share?id=${encodeURIComponent(idFromUrl)}`,
          );
          const json = await res.json();
          if (!res.ok || json.error || !json.pobCode) {
            setError(
              json.error ??
                (isPt
                  ? "Não foi possível carregar o PoB deste link."
                  : "Could not load PoB for this link."),
            );
            setIsInitialLoad(false);
            return;
          }
          const pobCode = String(json.pobCode);
          setInput(pobCode);
          await handleAnalyze(pobCode, { updateUrl: false });
        } else if (codeFromUrl) {
          setInput(codeFromUrl);
          await handleAnalyze(codeFromUrl, { updateUrl: false });
        }
      } catch {
        setError(
          isPt
            ? "Erro ao carregar PoB a partir do link."
            : "Failed to load PoB from link.",
        );
      } finally {
        setIsInitialLoad(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading, data]);

  if (isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">
          {isPt ? "Carregando build..." : "Loading build..."}
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={`max-w-7xl mx-auto ${data ? "space-y-5" : "space-y-8"}`}
      >
        {/* Page header */}
        <header className={data ? "space-y-0.5" : "space-y-1"}>
          <div className="flex items-center gap-2">
            <Sword
              className={data ? "h-5 w-5 text-primary" : "h-6 w-6 text-primary"}
            />
            <h1 className={data ? "text-xl font-semibold" : "text-2xl font-bold"}>
              {isPt ? "Visualizador de Build" : "PoB Viewer"}
            </h1>
          </div>
          {!data && (
            <p className="text-muted-foreground text-sm">
              {isPt
                ? "Cole seu código Path of Building ou link pobb.in/pastebin para visualizar sua build."
                : "Paste your Path of Building code or pobb.in/pastebin link to visualize your build."}
            </p>
          )}
        </header>

        {/* Input (inline, some à medida que o PoB é carregado) */}
        {!data && (
          <section className="pt-4 space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isPt
                  ? "Cole o código PoB ou link (pobb.in / pastebin.com)..."
                  : "Paste the PoB code or link (pobb.in / pastebin.com)..."
              }
              className="w-full h-28 rounded-md border border-input/80 bg-background/90 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={() => void handleAnalyze()}
              disabled={loading || !input.trim()}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPt ? "Analisando..." : "Analyzing..."}
                </>
              ) : isPt ? (
                "Analisar Build"
              ) : (
                "Analyze Build"
              )}
            </Button>
          </section>
        )}

        {data && (
          <>
            {/* Build header + key stats em uma faixa compacta */}
            {(buildInfo || hasStats) && (
              <section className="rounded-lg border border-border/50 bg-background px-3 py-2 flex flex-wrap items-center gap-3">
                {buildInfo && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="text-xs sm:text-sm px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30">
                      {buildInfo.Ascendancy || buildInfo.Class}
                    </Badge>
                    {buildInfo.Ascendancy &&
                      buildInfo.Ascendancy !== buildInfo.Class && (
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm px-2.5 py-0.5"
                        >
                          {buildInfo.Class}
                        </Badge>
                      )}
                    <Badge
                      variant="secondary"
                      className="text-xs sm:text-sm px-2.5 py-0.5"
                    >
                      Lv {buildInfo.Level}
                    </Badge>
                  </div>
                )}

                {hasStats && (
                  <div className="flex-1 min-w-[220px] flex flex-wrap items-center gap-2 justify-start md:justify-center text-[11px] sm:text-xs">
                    {stats["Total DPS"] && (
                      <span className="inline-flex items-baseline gap-1.5 font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide">
                          {isPt ? "DPS Total" : "Total DPS"}
                        </span>
                        <span className="tabular-nums text-sm">
                          {stats["Total DPS"]}
                        </span>
                      </span>
                    )}
                    {stats["Effective Hit Pool"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          EHP
                        </span>
                        <span className="tabular-nums font-semibold">
                          {stats["Effective Hit Pool"]}
                        </span>
                      </span>
                    )}
                    {stats["Life"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          Life
                        </span>
                        <span className="tabular-nums font-semibold">
                          {stats["Life"]}
                        </span>
                      </span>
                    )}
                    {stats["Energy Shield"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          ES
                        </span>
                        <span className="tabular-nums font-semibold">
                          {stats["Energy Shield"]}
                        </span>
                      </span>
                    )}
                    {stats["Movement Speed"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          {isPt ? "Vel. Mov." : "Move SPD"}
                        </span>
                        <span className="tabular-nums font-semibold">
                          {formatMovementSpeed(stats["Movement Speed"])}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Open in PoB + Copy Code buttons */}
                {input.trim() && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={async () => {
                              console.log("[OpenInPoB] botão clicado");
                              if (pobKey) {
                                const existingUrl = `pob://pobbin/${pobKey}`;
                                console.log("[OpenInPoB] reutilizando chave existente:", pobKey);
                                console.log("[OpenInPoB] abrindo URL:", existingUrl);
                                window.location.href = existingUrl;
                                return;
                              }
                              const code = input.trim();
                              console.log("[OpenInPoB] código (primeiros 80 chars):", code.slice(0, 80));
                              console.log("[OpenInPoB] tamanho do código:", code.length);
                              setPobLoading(true);
                              try {
                                console.log("[OpenInPoB] chamando /api/tools/pob-viewer/pobbin...");
                                const res = await fetch("/api/tools/pob-viewer/pobbin", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ code }),
                                });
                                console.log("[OpenInPoB] resposta status:", res.status, res.statusText);
                                const json = await res.json() as { key?: string; error?: string };
                                console.log("[OpenInPoB] resposta json:", json);
                                if (json.key) {
                                  console.log("[OpenInPoB] chave recebida:", json.key);
                                  const pobUrl = `pob://pobbin/${json.key}`;
                                  console.log("[OpenInPoB] abrindo URL:", pobUrl);
                                  setPobKey(json.key);
                                  window.location.href = pobUrl;
                                } else {
                                  console.error("[OpenInPoB] sem chave na resposta:", json);
                                }
                              } catch (err) {
                                console.error("[OpenInPoB] erro na requisição:", err);
                              } finally {
                                setPobLoading(false);
                              }
                            }}
                            disabled={pobLoading}
                            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {pobLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                            {pobLoading
                              ? isPt ? "Gerando..." : "Generating..."
                              : "Open in PoB"}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-[220px] text-center">
                          {isPt
                            ? "Abre a build no Path of Building (requer PoB instalado)"
                            : "Opens the build in Path of Building (requires PoB installed)"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              void navigator.clipboard
                                .writeText(input.trim())
                                .then(() => {
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {copied ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <ClipboardCopy className="w-3 h-3" />
                            )}
                            {copied
                              ? isPt ? "Copiado!" : "Copied!"
                              : isPt ? "Copiar código" : "Copy code"}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {isPt
                            ? "Copia o código PoB para a área de transferência"
                            : "Copy PoB code to clipboard"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

              </section>
            )}

            {/* Equipment */}
            {itemSets.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                    {isPt ? "Equipamentos" : "Equipment"}
                  </h2>
                  {hasMultipleLoadouts && (
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium shrink-0">
                        Loadout
                      </span>
                      <Select
                        value={String(activeItemSetIndex)}
                        onValueChange={(v) => handleLoadoutChange(Number(v))}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {itemSets.map((set, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {set.title ||
                                `${isPt ? "Conjunto" : "Set"} ${idx + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Itens do conjunto ativo */}
                {itemSetItems.length > 0 && (
                  <div className="bg-background p-3 sm:p-4 rounded-xl border border-border/40 flex flex-col md:flex-row items-start gap-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                    <div className="flex flex-col items-center w-full md:w-auto">
                      {/*
                        Mobile: escala o grid para caber na tela.
                        Grid natural = 10 cols × 60px = 600px.
                        scale(0.58) → ~348px visual, cabe em qualquer iPhone 6+.
                        transform não afeta layout → wrapper com altura fixa para
                        compensar o espaço que o elemento ainda ocupa no DOM.
                        (6 rows × 60px + flasks 132px) × 0.58 ≈ 287px
                      */}
                      <div
                        className="w-full flex justify-center overflow-hidden"
                        style={isMobile ? { height: "293px" } : undefined}
                      >
                        <div
                          style={
                            isMobile
                              ? { transform: "scale(0.58)", transformOrigin: "top center" }
                              : undefined
                          }
                        >
                          <div
                            className="grid gap-0.5 justify-center"
                            style={{
                              gridTemplateColumns:
                                "60px 60px 60px 60px 60px 60px 60px 60px 60px 60px",
                              gridAutoRows: "60px",
                            }}
                          >
                            {EQUIPMENT_GRID.map(({ slot, col, row }) => (
                              <div
                                key={slot}
                                style={{ gridColumn: col, gridRow: row }}
                              >
                                <ItemSlotCard
                                  item={slotMap[slot]}
                                  slotName={slot}
                                  isMobile={isMobile}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Flasks */}
                          <div className="flex justify-center gap-1 pt-3">
                            {FLASK_SLOTS.map((slotName) => (
                              <div key={slotName} className="w-[60px] h-[120px]">
                                <ItemSlotCard
                                  item={slotMap[slotName]}
                                  slotName={slotName}
                                  isMobile={isMobile}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Jewels socketed na tree - abaixo das flasks */}
                      {(activeViewSpec?.socketedJewels?.length ?? 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/40 w-full">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 text-center">
                            {isPt ? "Jewels na Árvore" : "Jewels in Tree"}
                          </p>
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {activeViewSpec!.socketedJewels.map((j, i) => (
                              <div
                                key={j.nodeId ?? i}
                                className="w-[60px] h-[60px] shrink-0 rounded-sm overflow-hidden"
                              >
                                <JewelSlotCard jewel={j} isMobile={isMobile} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills / Gems na lateral direita */}
                    {activeSkillGroups.length > 0 && (
                      <div className="flex flex-col gap-2 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Skills &amp; Gems
                        </p>
                        {(() => {
                          const leftGroups = activeSkillGroups.filter(
                            (_, idx) => idx % 2 === 0,
                          );
                          const rightGroups = activeSkillGroups.filter(
                            (_, idx) => idx % 2 === 1,
                          );
                          const renderGroupCard = (
                            group: (typeof activeSkillGroups)[number],
                            key: number,
                          ) => (
                            <div
                              key={key}
                              className="rounded-lg border border-border/50 bg-slate-950/30 p-2"
                            >
                              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                                {group.slot}
                              </p>
                              <div className="flex flex-col gap-1">
                                <TooltipProvider delayDuration={300}>
                                  {group.gems.map((gem, j) => {
                                    const info = gemInfoMap[gem.name];
                                    const attr =
                                      info?.primary_attribute ??
                                      (gem.is_support ? "support" : "strength");
                                    const badgeClass =
                                      attr === "intelligence"
                                        ? "border-blue-500/50 text-blue-300 bg-blue-950/20"
                                        : attr === "dexterity"
                                          ? "border-green-500/50 text-green-300 bg-green-950/20"
                                          : attr === "none"
                                            ? "border-slate-500/50 text-slate-300 bg-slate-950/20"
                                            : "border-red-500/40 text-red-300 bg-red-950/20";

                                    const badge = (
                                      <Badge
                                        key={j}
                                        variant="outline"
                                        className={
                                          badgeClass +
                                          " text-[12px] flex items-center justify-between gap-1.5 px-1.5 py-1 cursor-default w-full"
                                        }
                                      >
                                        <img
                                          src={getGemLocalPath(
                                            gem.name,
                                            gem.is_support,
                                          )}
                                          alt=""
                                          width={16}
                                          height={16}
                                          className="shrink-0 rounded-sm"
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                        <span className="flex-1 truncate text-[11px]">
                                          {gem.name}
                                        </span>
                                        <span className="ml-1 text-muted-foreground text-[10px]">
                                          {gem.level}/{gem.quality}Q
                                        </span>
                                      </Badge>
                                    );

                                    if (!info?.gem_description) return badge;

                                    const gemTooltipContent = (
                                      <div className="max-w-[240px] space-y-1 text-left p-2.5 bg-popover text-popover-foreground rounded-md border border-border shadow-md">
                                        <p className="font-semibold text-[12px]">
                                          {gem.name}
                                        </p>
                                        <p className="text-muted-foreground text-[10px] leading-snug">
                                          {info.gem_description}
                                        </p>
                                        <div className="flex gap-2 text-[10px] pt-0.5 border-t border-border/40">
                                          <span>
                                            Lv{" "}
                                            <span className="text-foreground font-medium">
                                              {gem.level}
                                            </span>
                                          </span>
                                          <span>
                                            Q{" "}
                                            <span className="text-sky-400 font-medium">
                                              +{gem.quality}%
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    );

                                    return (
                                      <SmartTooltip
                                        key={j}
                                        content={gemTooltipContent}
                                        side="left"
                                        align="start"
                                        isMobile={isMobile}
                                      >
                                        {badge}
                                      </SmartTooltip>
                                    );
                                  })}
                                </TooltipProvider>
                              </div>
                            </div>
                          );

                          return (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1 flex flex-col gap-2">
                                {leftGroups.map((group, i) =>
                                  renderGroupCard(group, i),
                                )}
                              </div>
                              <div className="flex-1 flex flex-col gap-2">
                                {rightGroups.map((group, i) =>
                                  renderGroupCard(
                                    group,
                                    i + leftGroups.length,
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Passive Tree */}
            {treeDetails && treeDetails.NodesCount > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {isPt ? "Árvore Passiva" : "Passive Tree"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasMultipleSpecs && (
                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium shrink-0">
                        {isPt ? "Árvore" : "Tree"}
                      </span>
                      <Select
                        value={String(activeTreeSpecIndex)}
                        onValueChange={(v) => {
                          const idx = Number(v);
                          setActiveTreeSpecIndex(idx);
                          sendNodesToViewer(
                            treeDetails.Specs[idx]?.nodes ?? [],
                          );
                        }}
                      >
                        <SelectTrigger className="w-56 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {treeDetails.Specs.map((spec, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {spec.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Grid: iframe 75% | sidebar 25% no desktop; stack no mobile */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-[3fr_1fr]">
                    <iframe
                      ref={iframeRef}
                      src="/tools/viewer.html"
                      title="Passive Skill Tree"
                      className="w-full rounded-lg border border-zinc-700"
                      style={{
                        height: isMobile ? "320px" : "600px",
                        background: "#0c0c0c",
                      }}
                      onLoad={() => {
                        const nodes = activeViewSpec?.nodes;
                        if (nodes?.length) sendNodesToViewer(nodes);
                      }}
                    />

                    {/* Sidebar: Keystones + Masteries */}
                    <div
                      className="overflow-y-auto space-y-5 pr-1"
                      style={{ maxHeight: isMobile ? "none" : "600px" }}
                    >
                      {(activeViewSpec?.keystones?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                            Keystones
                          </p>
                          <div className="flex flex-col gap-2">
                            {activeViewSpec!.keystones.map((k, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <img
                                  src={getKeystoneLocalPath(k.name)}
                                  alt={k.name}
                                  width={28}
                                  height={28}
                                  className="shrink-0 rounded-sm"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <span className="text-xs font-semibold text-yellow-300 leading-tight">
                                  {k.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const resolvedMasteries = (
                          activeViewSpec?.masteries ?? []
                        ).filter((m) => m.stats.length > 0);
                        return resolvedMasteries.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                              Masteries
                            </p>
                            <div className="space-y-3">
                              {resolvedMasteries.map((m, i) => (
                                <div key={i} className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getMasteryLocalPath(m.masteryName)}
                                      alt={m.masteryName}
                                      width={24}
                                      height={24}
                                      className="shrink-0 rounded-sm"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <span className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wide leading-tight">
                                      {m.masteryName}
                                    </span>
                                  </div>
                                  {m.stats.map((s, j) => (
                                    <span
                                      key={j}
                                      className="text-xs text-blue-300 leading-snug pl-8"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {(activeViewSpec?.keystones?.length ?? 0) === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          {isPt ? "Sem keystones" : "No keystones"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
