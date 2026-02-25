# PoE Components — Guia de Uso

Biblioteca de componentes reutilizáveis para exibição de itens, gems e tooltips do Path of Exile em qualquer página do projeto.

## Módulos disponíveis

| Arquivo | O que exporta |
|---|---|
| `components/ui/smart-tooltip.tsx` | `SmartTooltip` — tooltip genérico desktop/mobile |
| `components/poe/poe-colors.ts` | Constantes de cor HSL do PoE (raridade, mods, sockets) |
| `components/poe/poe-icon-utils.ts` | Funções e mapas de ícone (gems, jewels, flasks, tinctures) |
| `components/poe/PoeItemTooltip.tsx` | `SocketDisplay`, `ItemTooltip`, `JewelTooltip` |
| `components/poe/PoeItemSlot.tsx` | `EmptySlot`, `ItemSlotCard`, `JewelSlotCard` + constantes de layout |
| `components/poe/PoeItemBlogCard.tsx` | `PoeItemBlogCard` — card inline para posts do blog |

---

## SmartTooltip

Tooltip adaptativo: usa `Tooltip` (hover) no desktop e `Popover` (tap) no mobile. Detectado via prop `isMobile` booleana.

```tsx
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

// O consumidor é responsável por detectar se é mobile (ex: pointer: coarse)
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const mq = window.matchMedia("(pointer: coarse)");
  setIsMobile(mq.matches);
}, []);

<TooltipProvider delayDuration={150}>
  <SmartTooltip
    content={<div>conteúdo do tooltip</div>}
    side="right"
    align="start"
    isMobile={isMobile}
  >
    <button>hover em mim</button>
  </SmartTooltip>
</TooltipProvider>
```

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `children` | `React.ReactElement` | — | Elemento que dispara o tooltip |
| `content` | `React.ReactNode` | — | Conteúdo renderizado dentro do tooltip |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | Posição |
| `align` | `"start" \| "center" \| "end"` | `"start"` | Alinhamento |
| `isMobile` | `boolean` | — | Troca para Popover clicável no mobile |

---

## ItemTooltip

Renderiza o tooltip completo de um item no estilo PoE (header com textura de raridade, mods coloridos, DPS de armas, etc.).

```tsx
import { ItemTooltip } from "@/components/poe/PoeItemTooltip";
import type { PobItem } from "@/lib/pob-parser";

const item: PobItem = {
  slot: "Body Armour",
  name: "Skin of the Lords",
  baseName: "Simple Robe",
  rarity: "Unique",
  corrupted: true,
  implicits: [],
  explicits: [
    { text: "+1 to Level of Socketed Gems", type: "normal" },
    { text: "100% increased Global Defences", type: "normal" },
    { text: "You can only Socket Colourless Gems in this item", type: "normal" },
    { text: "Item has 6 Sockets", type: "normal" },
  ],
};

<ItemTooltip item={item} />
// ou em modo compacto (mobile):
<ItemTooltip item={item} compact />
```

---

## JewelTooltip

Tooltip para jewels (normais ou cluster). Aceita o tipo `PobSocketedJewel`.

```tsx
import { JewelTooltip } from "@/components/poe/PoeItemTooltip";
import type { PobSocketedJewel } from "@/lib/pob-parser";

const jewel: PobSocketedJewel = {
  nodeId: 12345,
  name: "Watcher's Eye",
  baseName: "Prismatic Jewel",
  rarity: "Unique",
  isCluster: false,
  implicits: [],
  explicits: [
    "15% increased maximum Energy Shield while affected by Discipline",
    "Gain 5% of Maximum Mana as Extra Maximum Energy Shield while affected by Clarity",
  ],
};

<JewelTooltip jewel={jewel} />
```

---

## SocketDisplay

Exibe os sockets de um item no estilo diamante do poe.ninja (cores R/G/B/W/A com links).

```tsx
import { SocketDisplay } from "@/components/poe/PoeItemTooltip";

// Formato: grupos separados por espaço, sockets ligados por "-"
<SocketDisplay sockets="R-G-B-R R-G" />
// Resultado: grupo de 4 sockets linked + grupo de 2 sockets linked
```

---

## ItemSlotCard e JewelSlotCard

Cards clicáveis com imagem do item e tooltip integrado. Ideais para grids de equipamentos.

```tsx
import { ItemSlotCard, JewelSlotCard } from "@/components/poe/PoeItemSlot";
import type { PobItem, PobSocketedJewel } from "@/lib/pob-parser";

// ItemSlotCard mostra EmptySlot automaticamente se item for undefined
<ItemSlotCard item={item} slotName="Helm" isMobile={false} />

// JewelSlotCard
<JewelSlotCard jewel={jewel} isMobile={false} />
```

---

## Constantes de layout

Para montar grids de equipamentos compatíveis com poe.ninja.

```tsx
import {
  EQUIPMENT_GRID,
  EQUIPMENT_SLOTS,
  FLASK_SLOTS,
  SLOT_LABEL,
} from "@/components/poe/PoeItemSlot";

// EQUIPMENT_GRID: array de { slot, col, row } para CSS Grid
// EQUIPMENT_SLOTS: tuple com os 10 slots principais
// FLASK_SLOTS: tuple com os 5 slots de flask
// SLOT_LABEL: Record<string, string> com labels amigáveis
```

---

## Caso de uso 1 — Item inline com tooltip em qualquer página

Exibir um item clicável/hoverable em qualquer componente, por exemplo numa página de league ou produto:

```tsx
"use client";

import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { ItemTooltip } from "@/components/poe/PoeItemTooltip";
import { RARITY_NAME_COLOR_HSL } from "@/components/poe/poe-colors";
import type { PobItem } from "@/lib/pob-parser";

function InlineItemLink({ item }: { item: PobItem }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
  }, []);

  const colorHsl = RARITY_NAME_COLOR_HSL[item.rarity] ?? RARITY_NAME_COLOR_HSL.Normal;

  return (
    <TooltipProvider delayDuration={150}>
      <SmartTooltip content={<ItemTooltip item={item} />} isMobile={isMobile}>
        <span
          className="cursor-pointer underline decoration-dotted"
          style={{ color: `hsl(${colorHsl})` }}
        >
          {item.name}
        </span>
      </SmartTooltip>
    </TooltipProvider>
  );
}
```

---

## Caso de uso 2 — Grid de equipamentos numa página de build guide

Montar o grid completo de equipamentos + flasks para exibição de uma build em páginas de league:

```tsx
"use client";

import { ItemSlotCard, EQUIPMENT_GRID, FLASK_SLOTS } from "@/components/poe/PoeItemSlot";
import { normalizeSlotName } from "@/components/poe/poe-icon-utils";
import type { PobItem } from "@/lib/pob-parser";

function BuildEquipmentGrid({
  items,
  isMobile = false,
}: {
  items: PobItem[];
  isMobile?: boolean;
}) {
  const slotMap: Record<string, PobItem> = {};
  for (const item of items) {
    slotMap[normalizeSlotName(item.slot)] = item;
  }

  return (
    <div className="space-y-2">
      {/* Grid principal */}
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: "repeat(10, 60px)",
          gridAutoRows: "60px",
        }}
      >
        {EQUIPMENT_GRID.map(({ slot, col, row }) => (
          <div key={slot} style={{ gridColumn: col, gridRow: row }}>
            <ItemSlotCard item={slotMap[slot]} slotName={slot} isMobile={isMobile} />
          </div>
        ))}
      </div>

      {/* Flasks */}
      <div className="flex gap-1">
        {FLASK_SLOTS.map((slotName) => (
          <div key={slotName} className="w-[60px] h-[120px]">
            <ItemSlotCard item={slotMap[slotName]} slotName={slotName} isMobile={isMobile} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Caso de uso 3 — Item card no blog (via Sanity)

O bloco `poeItem` pode ser adicionado pelo editor no Sanity Studio dentro do corpo de qualquer post. No frontend, é renderizado como um card inline com o ícone do item e tooltip ao passar o mouse.

**No Sanity Studio**, o editor vê um formulário com os campos:
- Nome do item, Base type, Raridade
- URL do ícone (da CDN do PoE: `https://web.poecdn.com/gen/image/...`)
- Sockets (ex: `R-G-B-R`)
- Item Level, Quality, Corrupted
- Lista de implicits e explicits (texto + tipo: `normal`, `crafted`, `fractured`, `enchant`)

**No blog**, o resultado visual é:

```
[🟠 Headhunter]  ← clicável, tooltip aparece no hover
```

O componente `PoeItemBlogCard` renderiza o item inline no fluxo do texto, compatível tanto com desktop (hover) quanto mobile (tap).

---

## Utilitários de ícone

```tsx
import {
  getGemLocalPath,
  getJewelLocalPath,
  getKeystoneLocalPath,
  getMasteryLocalPath,
  getEffectiveItemIconUrl,
  toKebab,
} from "@/components/poe/poe-icon-utils";

// Caminho local de uma gem
getGemLocalPath("Lightning Arrow", false);
// → "/images/gem/skill/lightning-arrow.webp"

getGemLocalPath("Awakened Elemental Damage with Attacks", true);
// → "/images/gem/awakened/awakened-elemental-damage-with-attacks-support.webp"

// Caminho local de um jewel
getJewelLocalPath("Watcher's Eye");
// → "/images/jewel/watcher-s-eye.webp"

// Ícone efetivo de um PobItem (resolve flask/tincture/iconUrl)
getEffectiveItemIconUrl(item);
// → "/flask_images/headhunter.webp" | item.iconUrl | undefined
```
