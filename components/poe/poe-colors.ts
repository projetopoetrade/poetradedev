/**
 * Constantes de cor do Path of Exile, baseadas nas variáveis CSS do poe.ninja.
 * Todos os valores são strings HSL (sem o "hsl()" — para uso com hsla() inline).
 */

export const POE_COLORS = {
  rarity: {
    Unique: "26, 65%, 42%",
    Rare: "60, 100%, 73%",
    Magic: "240, 100%, 77%",
    Normal: "0, 0%, 78%",
  },
  socket: {
    R: "0, 100%, 50%",   // Strength - Red
    G: "120, 100%, 40%", // Dexterity - Green
    B: "220, 100%, 60%", // Intelligence - Blue
    W: "0, 0%, 95%",     // White
    A: "280, 70%, 60%",  // Abyssal
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
