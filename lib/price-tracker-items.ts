import { encodeProductName } from "@/utils/url-helper";

/**
 * Catálogo estático das páginas de preço que o sitemap pode anunciar.
 *
 * Por que estático e não buscado do poe.ninja no build do sitemap:
 *  - determinismo — o sitemap não pode depender de um upstream que muda de
 *    contrato. Em ago/2026 o `itemoverview` legado do poe.ninja já responde 404
 *    para UniqueWeapon/SkillGem/DivinationCard/etc., e o endpoint de PoE 2
 *    também. Só o exchange overview de currency de PoE 1 continua servindo.
 *  - honestidade de índice — semear URLs cujo gráfico renderiza vazio é o
 *    caminho mais curto para "crawled, currently not indexed".
 *
 * A lista abaixo é exatamente o conjunto servido pelo exchange overview de
 * PoE 1 (88 itens). Quando o engine (`USE_ENGINE_PRICES=1`) passar a cobrir
 * uniques, gems e cards de forma estável, estender aqui — não no sitemap.
 */
export const POE1_CURRENCY_ITEMS: readonly string[] = [
  "Ancient Orb",
  "Armourer's Scrap",
  "Awakener's Orb",
  "Blacksmith's Whetstone",
  "Chaos Orb",
  "Chromatic Orb",
  "Crusader's Exalted Orb",
  "Crystallised Rancour",
  "Divine Orb",
  "Elder's Exalted Orb",
  "Eldritch Chaos Orb",
  "Eldritch Exalted Orb",
  "Eldritch Orb of Annulment",
  "Enkindling Orb",
  "Exalted Orb",
  "Exalted Shard",
  "Exceptional Eldritch Ember",
  "Exceptional Eldritch Ichor",
  "Fertile Catalyst",
  "Flesh of Xesht",
  "Foulborn Exalted Orb",
  "Foulborn Orb of Augmentation",
  "Fracturing Orb",
  "Gemcutter's Prism",
  "Glassblower's Bauble",
  "Grand Eldritch Ember",
  "Grand Eldritch Ichor",
  "Greater Eldritch Ember",
  "Greater Eldritch Ichor",
  "Hinekora's Lock",
  "Hunter's Exalted Orb",
  "Instilling Orb",
  "Intrinsic Catalyst",
  "Jeweller's Orb",
  "Lesser Eldritch Ember",
  "Lesser Eldritch Ichor",
  "Maven's Chisel of Avarice",
  "Maven's Chisel of Divination",
  "Maven's Chisel of Proliferation",
  "Maven's Chisel of Scarabs",
  "Mirror of Kalandra",
  "Mirror Shard",
  "Noxious Catalyst",
  "Orb of Alchemy",
  "Orb of Alteration",
  "Orb of Annulment",
  "Orb of Augmentation",
  "Orb of Chance",
  "Orb of Conflict",
  "Orb of Dominance",
  "Orb of Fusing",
  "Orb of Regret",
  "Orb of Remembrance",
  "Orb of Scouring",
  "Orb of Transmutation",
  "Orb of Unmaking",
  "Portal Scroll",
  "Primal Crystallised Lifeforce",
  "Prismatic Catalyst",
  "Reflecting Mist",
  "Regal Orb",
  "Rogue's Marker",
  "Sacred Crystallised Lifeforce",
  "Sacred Orb",
  "Scroll of Wisdom",
  "Shaper's Exalted Orb",
  "Stacked Deck",
  "Tailoring Orb",
  "Tainted Armourer's Scrap",
  "Tainted Blacksmith's Whetstone",
  "Tainted Catalyst",
  "Tainted Chaos Orb",
  "Tainted Chromatic Orb",
  "Tainted Exalted Orb",
  "Tainted Jeweller's Orb",
  "Tainted Mythic Orb",
  "Tainted Orb of Fusing",
  "Tempering Catalyst",
  "Tempering Orb",
  "Turbulent Catalyst",
  "Unstable Catalyst",
  "Vaal Orb",
  "Veiled Chaos Orb",
  "Veiled Exalted Orb",
  "Vivid Crystallised Lifeforce",
  "Volatile Vaal Orb",
  "Warlord's Exalted Orb",
  "Wild Crystallised Lifeforce",
];

export type TrackedItem = {
  name: string;
  /** Destino canônico do item: página de produto quando vendemos, tracker quando não. */
  href: string;
};

export type SoldProduct = { name: string; url_slug: string | null };

/**
 * Chave de comparação com os nomes vindos do Supabase. Espelha a normalização
 * de /api/tools/prices, que casa poe.ninja × catálogo ignorando apóstrofos e
 * espaços ("Hinekora's Lock" ↔ "hinekoraslock").
 */
export const normalizeItemKey = (name: string): string =>
  name.toLowerCase().replace(/['\s]/g, "");

/**
 * Índice de currency para renderizar no servidor em /tools/price-tracker.
 *
 * O tracker é 'use client' e monta a tabela depois de um fetch, então nenhuma
 * âncora de item chegava ao HTML servido — a página com mais impressões do site
 * não passava autoridade para nenhuma página de item. Este índice é o caminho
 * de crawl que faltava.
 *
 * Cada item aponta para o destino canônico: a página de produto quando
 * vendemos (o caso de todas as 88 currencies hoje), e a página de preço do
 * tracker apenas para o que não vendemos.
 */
export function getCurrencyIndexLinks(
  soldProducts: readonly SoldProduct[] = [],
  gameVersion: string = "path-of-exile-1"
): TrackedItem[] {
  const sold = new Map<string, string>(); // chave normalizada → url_slug
  soldProducts.forEach((p) => {
    if (p?.name && p.url_slug) sold.set(normalizeItemKey(p.name), p.url_slug);
  });

  return POE1_CURRENCY_ITEMS.map((name) => {
    const urlSlug = sold.get(normalizeItemKey(name));
    return {
      name,
      href: urlSlug
        ? `/games/${gameVersion}/products/${urlSlug}`
        : `/tools/price-tracker/${encodeProductName(name)}`,
    };
  });
}
