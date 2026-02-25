/**
 * Schema Sanity para blocos de item do Path of Exile.
 *
 * O editor cola o texto bruto do item (Ctrl+C no jogo) no campo rawText.
 * O frontend faz o parse automaticamente via lib/poe-item-parser.ts.
 *
 * Opcionalmente, o editor pode fornecer a URL do ícone da CDN do PoE.
 */
const poeItem = {
  name: "poeItem",
  title: "PoE Item",
  type: "object",
  fields: [
    {
      name: "rawText",
      title: "Item text",
      type: "text",
      rows: 12,
      description:
        "Cole aqui o texto do item copiado do jogo (Ctrl+C sobre o item).",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "iconUrl",
      title: "Icon URL (opcional)",
      type: "string",
      description:
        "URL do ícone na CDN do PoE (ex: https://web.poecdn.com/gen/image/...). Encontre em poe.wiki ou pob.cool.",
    },
  ],
  preview: {
    select: {
      rawText: "rawText",
    },
    prepare({ rawText }: { rawText?: string }) {
      if (!rawText) return { title: "PoE Item" };
      const lines = rawText.split("\n").map((l) => l.trim());
      const rarityLine = lines.find((l) => l.startsWith("Rarity:"));
      const rarity = rarityLine?.replace("Rarity:", "").trim() ?? "";
      const nameLine = lines.find(
        (l) => l && !l.startsWith("Rarity:") && !l.startsWith("--------"),
      );
      return {
        title: nameLine ?? "PoE Item",
        subtitle: rarity,
      };
    },
  },
};

export default poeItem;
