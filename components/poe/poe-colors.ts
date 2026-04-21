/**
 * Constantes de cor do Path of Exile, baseadas nas variáveis CSS do poe.ninja.
 * Todos os valores são strings HSL (sem o "hsl()" — para uso com hsla() inline).
 */

// Colors are aligned with maxroll.gg's computed values (verified via
// browser DevTools, Apr 2026) which mirror in-game Path of Exile colors:
//   Unique  rgb(175, 96, 37)   → hsl(25, 65%, 42%)
//   Rare    rgb(255, 255, 119) → hsl(60, 100%, 73%)
//   Magic   rgb(136, 136, 255) → hsl(240, 100%, 77%)
//   Gem     rgb(27, 162, 155)  → hsl(176, 71%, 37%)
// Mod-line `normal` is the implicit/explicit blue shared with Magic rarity.
export const POE_COLORS = {
  rarity: {
    Unique: "25, 65%, 42%",
    Rare: "60, 100%, 73%",
    Magic: "240, 100%, 77%",
    Normal: "0, 0%, 78%",
    Gem: "176, 71%, 37%",
    // Currency name in-game — soft tan, ≈rgb(170, 158, 130)
    Currency: "40, 22%, 60%",
  },
  socket: {
    R: "0, 100%, 50%",   // Strength - Red
    G: "120, 100%, 40%", // Dexterity - Green
    B: "220, 100%, 60%", // Intelligence - Blue
    W: "0, 0%, 95%",     // White
    A: "280, 70%, 60%",  // Abyssal
  },
  mod: {
    normal: "240, 100%, 77%",   // rgb(136, 136, 255)
    crafted: "214, 70%, 83%",   // rgb(184, 218, 242) — horadric-helper "crafted" value
    fractured: "44, 26%, 51%",  // rgb(162, 145, 98)
    enchant: "214, 70%, 83%",   // shares crafted blue
    scourge: "20, 100%, 57%",
  },
  link: "0, 0%, 60%",
} as const;

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
  Gem: POE_COLORS.rarity.Gem,
  Currency: POE_COLORS.rarity.Currency,
};

export const MOD_COLOR_HSL: Record<string, string> = {
  normal: POE_COLORS.mod.normal,
  crafted: POE_COLORS.mod.crafted,
  fractured: POE_COLORS.mod.fractured,
  enchant: POE_COLORS.mod.enchant,
  scourge: POE_COLORS.mod.scourge,
};

export const SOCKET_COLOR_HSL: Record<string, string> = {
  R: POE_COLORS.socket.R,
  G: POE_COLORS.socket.G,
  B: POE_COLORS.socket.B,
  W: POE_COLORS.socket.W,
  A: POE_COLORS.socket.A,
};

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

export type HeaderTexture = {
  left: string;
  middle: string;
  right: string;
  textColor: string;
};

export const HEADER_TEXTURES: Record<string, HeaderTexture | undefined> = {
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
