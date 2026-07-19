/**
 * Icon-path helpers for PoB items: gems, jewels, keystones, masteries,
 * flasks, tinctures. Shared across the PoB Viewer and any component
 * that renders PoB data.
 *
 * Extracted from PobViewerClient.tsx (Session 21 split).
 */

import {
  FLASK_BASE_ICON_URLS,
  TINCTURE_BASE_ICON_URLS,
  UNIQUE_FLASK_ICON_URLS,
  UNIQUE_TINCTURE_ICON_URLS,
} from "@/lib/pob/poe-colors";
import { GEM_JEWEL_IMAGE_MAP } from "@/app/[locale]/(site)/tools/pob-viewer/gem-jewel-image-map";
import { lookupBaseIcon } from "@/lib/pob/base-icon-urls";
import type { PobItem } from "@/lib/pob-types";

// ─── Skill gem aliases ─────────────────────────────────────────────────────

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

export function getKeystoneLocalPath(name: string): string {
  return `/images/keystone/${toKebab(name)}.webp`;
}

export function getMasteryLocalPath(masteryName: string): string {
  const base = masteryName.replace(/\s*mastery$/i, "").trim();
  return `/images/mastery/${toKebab(base)}.webp`;
}

export function getGemLocalPath(
  name: string,
  isSupport: boolean,
): string {
  if (GEM_JEWEL_IMAGE_MAP[name]) return GEM_JEWEL_IMAGE_MAP[name];

  const lowerName = name.toLowerCase().replace(/\s+support$/i, "");
  if (!isSupport && SKILL_GEM_ALIASES[lowerName]) {
    return `/images/gem/skill/${SKILL_GEM_ALIASES[lowerName]}.webp`;
  }

  const normalizedName = name.replace(/\s+Support$/i, "");
  const kebab = toKebab(normalizedName);
  const fullKebab = toKebab(name);

  if (kebab.startsWith("vaal-")) return `/images/gem/vaal/${fullKebab}.webp`;
  if (kebab.startsWith("awakened-"))
    return `/images/gem/awakened/${fullKebab.endsWith("-support") ? fullKebab : `${fullKebab}-support`}.webp`;
  if (isSupport) {
    const supportFilename = fullKebab.endsWith("-support")
      ? fullKebab
      : `${fullKebab}-support`;
    return `/images/gem/support/${supportFilename}.webp`;
  }
  return `/images/gem/skill/${kebab}.webp`;
}

// ─── Jewel base patterns ───────────────────────────────────────────────────

const JEWEL_BASE_PATTERNS: Array<{ re: RegExp; slug: string }> = [
  { re: /small cluster jewel/i, slug: "small-cluster-jewel" },
  { re: /medium cluster jewel/i, slug: "medium-cluster-jewel" },
  { re: /large cluster jewel/i, slug: "large-cluster-jewel" },
  { re: /ghastly eye jewel/i, slug: "ghastly-eye-jewel" },
  { re: /hypnotic eye jewel/i, slug: "hypnotic-eye-jewel" },
  { re: /murderous eye jewel/i, slug: "murderous-eye-jewel" },
  { re: /searching eye jewel/i, slug: "searching-eye-jewel" },
  { re: /cobalt jewel/i, slug: "cobalt-jewel" },
  { re: /crimson jewel/i, slug: "crimson-jewel" },
  { re: /viridian jewel/i, slug: "viridian-jewel" },
  { re: /prismatic jewel/i, slug: "prismatic-jewel" },
];

export function getJewelLocalPath(name: string): string {
  if (GEM_JEWEL_IMAGE_MAP[name]) return GEM_JEWEL_IMAGE_MAP[name];
  for (const { re, slug } of JEWEL_BASE_PATTERNS) {
    if (re.test(name)) return `/images/jewel/${slug}.webp`;
  }
  return `/images/jewel/${toKebab(name)}.webp`;
}

// ─── Item icon URL resolver ────────────────────────────────────────────────

function caseInsensitiveGet(map: Record<string, string>, key: string): string | undefined {
  // Direct hit first (most common)
  if (map[key]) return map[key];
  // Try case-insensitive: find the original key
  const lower = key.toLowerCase();
  for (const k of Object.keys(map)) {
    if (k.toLowerCase() === lower) return map[k];
  }
  return undefined;
}

export function getEffectiveItemIconUrl(
  item: PobItem,
): string | undefined {
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

  const baseName = item.baseName;
  if (baseName) {
    const tinctureIcon = caseInsensitiveGet(TINCTURE_BASE_ICON_URLS, baseName);
    if (tinctureIcon) return tinctureIcon;
  }
  if (baseName) {
    const flaskIcon = caseInsensitiveGet(FLASK_BASE_ICON_URLS, baseName);
    if (flaskIcon) return flaskIcon;
  }

  if (item.iconUrl) {
    if (item.iconUrl.startsWith("http")) return item.iconUrl;
    if (item.iconUrl.startsWith("//")) return "https:" + item.iconUrl;
    if (item.iconUrl.startsWith("/gen/") || item.iconUrl.startsWith("/image/") || item.iconUrl.startsWith("/Art/")) {
      return "https://web.poecdn.com" + item.iconUrl;
    }
    return item.iconUrl;
  }

  // 4) Local base type icons
  if (item.baseName) {
    const local = lookupBaseIcon(item.baseName);
    if (local) return local;
  }

  // 5) pobb.in CDN — last resort for base types not in our local set
  if (item.baseName) {
    return `https://assets.pobb.in/1/${encodeURIComponent(item.baseName)}.webp`;
  }

  return undefined;
}

// ─── Slot name normalizer ──────────────────────────────────────────────────

export function normalizeSlotName(slot: string): string {
  if (slot === "Helmet") return "Helm";
  return slot;
}