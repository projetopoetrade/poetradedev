import type { PobItem } from "@/lib/pob-parser";
import { GEM_JEWEL_IMAGE_MAP } from "@/app/[locale]/(site)/tools/pob-viewer/gem-jewel-image-map";

// ─── Flask icon maps ───────────────────────────────────────────────────────────

export const FLASK_BASE_ICON_URLS: Record<string, string> = {
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

export const UNIQUE_FLASK_ICON_URLS: Record<string, string> = {
  "Atziri's Promise": "/flask_images/atziris-promise.webp",
  "Blood of the Karui": "/flask_images/blood-of-the-karui.webp",
  "Bottled Faith": "/flask_images/bottled-faith.webp",
  "Cinderswallow Urn": "/flask_images/cinderswallow-urn.webp",
  "Coralito's Signature": "/flask_images/coralitos-signature.webp",
  "Coruscating Elixir": "/flask_images/coruscating-elixir.webp",
  "Divination Distillate": "/flask_images/divination-distillate.webp",
  "Doedre's Elixir": "/flask_images/doedres-elixir.webp",
  "Dying Sun": "/flask_images/dying-sun.webp",
  "Elixir of the Unbroken Circle": "/flask_images/elixir-of-the-unbroken-circle.webp",
  "Forbidden Taste": "/flask_images/forbidden-taste.webp",
  "Kiara's Determination": "/flask_images/kiaras-determination.webp",
  "Lavianga's Spirit": "/flask_images/laviangas-spirit.webp",
  "Lion's Roar": "/flask_images/lions-roar.webp",
  "Olroth's Resolve": "/flask_images/olroths-resolve.webp",
  "Oriath's End": "/flask_images/oriaths-end.webp",
  Progenesis: "/flask_images/progenesis.webp",
  "Replica Lavianga's Spirit": "/flask_images/replica-laviangas-spirit.webp",
  "Replica Rumi's Concoction": "/flask_images/replica-rumis-concoction.webp",
  "Replica Sorrow of the Divine": "/flask_images/replica-sorrow-of-the-divine.webp",
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

// ─── Tincture icon maps ────────────────────────────────────────────────────────

export const TINCTURE_BASE_ICON_URLS: Record<string, string> = {
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

export const UNIQUE_TINCTURE_ICON_URLS: Record<string, string> = {
  "Sap of the Seasons": "/tinctures/Sap_of_the_Seasons.webp",
  "Mightblood Ire": "/tinctures/Mightblood_Ire.webp",
  "Wildfire Phloem": "/tinctures/Wildfire_Phloem.webp",
  "The Battle Within": "/tinctures/The_Battle_Within.webp",
  "Grasping Nightshade": "/tinctures/Grasping_Nightshade.webp",
};

// ─── Gem aliases ───────────────────────────────────────────────────────────────
// Skill gems cujo arquivo não segue o padrão kebab do nome.
// Support gems não precisam de aliases: o sufixo "-support.webp" cobre todos os casos.

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function toKebab(str: string): string {
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

export function getGemLocalPath(name: string, isSupport: boolean): string {
  if (GEM_JEWEL_IMAGE_MAP[name]) {
    return GEM_JEWEL_IMAGE_MAP[name];
  }

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

export function getJewelLocalPath(name: string): string {
  if (GEM_JEWEL_IMAGE_MAP[name]) {
    return GEM_JEWEL_IMAGE_MAP[name];
  }
  return `/images/jewel/${toKebab(name)}.webp`;
}

export function getEffectiveItemIconUrl(item: PobItem): string | undefined {
  // 1) Uniques: tinctures first, then flasks
  if (item.rarity === "Unique" && UNIQUE_TINCTURE_ICON_URLS[item.name]) {
    return UNIQUE_TINCTURE_ICON_URLS[item.name];
  }
  if (item.rarity === "Unique" && UNIQUE_FLASK_ICON_URLS[item.name]) {
    return UNIQUE_FLASK_ICON_URLS[item.name];
  }

  // 2) Bases: tinctures, then flasks
  const baseName = item.baseName;
  if (baseName && TINCTURE_BASE_ICON_URLS[baseName]) {
    return TINCTURE_BASE_ICON_URLS[baseName];
  }
  if (baseName && FLASK_BASE_ICON_URLS[baseName]) {
    return FLASK_BASE_ICON_URLS[baseName];
  }

  // 3) Fallback to URL from parser/poe.ninja
  return item.iconUrl;
}

/** Normaliza nomes de slot vindos do PoB para bater com o grid de equipamentos. */
export function normalizeSlotName(slot: string): string {
  if (slot === "Helmet") return "Helm";
  return slot;
}
