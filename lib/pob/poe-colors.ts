/**
 * PoE colour palette + rarity/socket/influence maps shared across every
 * component that renders PoB data (PoB Viewer, mini viewer, tooltips).
 *
 * Extracted from PobViewerClient.tsx (Session 20 split).
 */

// ─── PoE.ninja CSS Variables (HSL) ──────────────────────────────────────────

export const POE_COLORS = {
  rarity: {
    Unique: "26, 65%, 42%",
    Rare: "60, 100%, 73%",
    Magic: "240, 100%, 77%",
    Normal: "0, 0%, 78%",
  },
  socket: {
    R: "0, 100%, 50%",
    G: "120, 100%, 40%",
    B: "220, 100%, 60%",
    W: "0, 0%, 95%",
    A: "280, 70%, 60%",
  },
  mod: {
    normal: "240, 100%, 77%",
    crafted: "240, 100%, 85%",
    fractured: "44, 26%, 51%",
    enchant: "240, 100%, 85%",
    scourge: "20, 100%, 57%",
  },
  link: "0, 0%, 60%",
} as const;

// ─── Rarity helpers ────────────────────────────────────────────────────────

export const RARITY_BORDER_HSL: Record<string, string> = {
  Unique: POE_COLORS.rarity.Unique,
  Rare: POE_COLORS.rarity.Rare,
  Magic: POE_COLORS.rarity.Magic,
  Normal: POE_COLORS.rarity.Normal,
};

export const RARITY_NAME_COLOR_HSL: Record<string, string> = {
  Unique: POE_COLORS.rarity.Unique,
  Rare: POE_COLORS.rarity.Rare,
  Magic: POE_COLORS.rarity.Magic,
  Normal: POE_COLORS.rarity.Normal,
};

export const MOD_COLOR_HSL: Record<string, string> = {
  normal: POE_COLORS.mod.normal,
  crafted: POE_COLORS.mod.crafted,
  fractured: POE_COLORS.mod.fractured,
  enchant: POE_COLORS.mod.enchant,
  scourge: POE_COLORS.mod.scourge,
};

// ─── Socket display (PoE.ninja diamond style) ──────────────────────────────

export const SOCKET_COLOR_HSL: Record<string, string> = {
  R: POE_COLORS.socket.R,
  G: POE_COLORS.socket.G,
  B: POE_COLORS.socket.B,
  W: POE_COLORS.socket.W,
  A: POE_COLORS.socket.A,
};

// ─── Influence icons ───────────────────────────────────────────────────────

export const INFLUENCE_ICONS: Record<string, string> = {
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

// ─── Header textures (per rarity) ──────────────────────────────────────────

export const HEADER_TEXTURES: Record<
  string,
  { left: string; middle: string; right: string; textColor: string } | undefined
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

// ─── Flask base types ──────────────────────────────────────────────────────

export const FLASK_BASE_ICON_URLS: Record<string, string> = {
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
  "Small Hybrid Flask": "/flask_images/small-hybrid-flask.webp",
  "Medium Hybrid Flask": "/flask_images/medium-hybrid-flask.webp",
  "Large Hybrid Flask": "/flask_images/large-hybrid-flask.webp",
  "Colossal Hybrid Flask": "/flask_images/colossal-hybrid-flask.webp",
  "Sacred Hybrid Flask": "/flask_images/sacred-hybrid-flask.webp",
  "Hallowed Hybrid Flask": "/flask_images/hallowed-hybrid-flask.webp",
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

// ─── Unique flasks ─────────────────────────────────────────────────────────

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

// ─── Tincture base types ───────────────────────────────────────────────────

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