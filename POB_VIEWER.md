# PoB Viewer — Documentação Técnica

> Última atualização: 2026-02-24

## Visão Geral

Página que recebe um código **Path of Building (PoB)** ou link (pobb.in / pastebin.com), faz o parse do XML comprimido e exibe visualmente a build completa — stats, equipamentos com imagens, gems e keystones da árvore passiva.

URL da ferramenta: `/tools/pob-viewer` (EN) | `/pt-br/tools/pob-viewer` (PT)

---

## Arquivos Relevantes

| Arquivo | Tipo | Responsabilidade |
|---------|------|-----------------|
| `lib/pob-parser.ts` | Utility | Decode base64+inflate, parse XML, fetch icons |
| `app/api/tools/pob-viewer/route.ts` | API Route | POST endpoint que chama o parser |
| `app/[locale]/(site)/tools/pob-viewer/page.tsx` | Server Component | Metadata SEO + BreadcrumbList JSON-LD |
| `app/[locale]/(site)/tools/pob-viewer/PobViewerClient.tsx` | Client Component | UI completo (textarea → display) |
| `app/[locale]/(site)/tools/page.tsx` | Modificado | Contém o card de navegação para a ferramenta |

---

## Fluxo de Dados

```
Browser → POST /api/tools/pob-viewer { pobCode: string }
        → lib/pob-parser.ts
            1. Se URL: fetch pobb.in ou pastebin
            2. Base64 URL-safe → standard, fix padding
            3. Buffer.from(code, 'base64') → inflateSync(zlib) → XML string
            4. JSDOM parse do XML
            5. Extrai: BuildInfo, Stats, Items, ItemSets, Skills, Tree
            6. getItemIconMap() → poe.ninja Standard league (6 tipos em paralelo, cache 24h)
            7. Retorna PobBuildData JSON
        → PobViewerClient setState(data) → render
```

---

## Tipos TypeScript (`lib/pob-parser.ts`)

```typescript
interface ParsedMod {
  text: string
  type: 'normal' | 'crafted' | 'fractured' | 'enchant' | 'scourge'
}

interface PobItem {
  slot: string        // nome do slot PoB ex: "Weapon 1", "Body Armour"
  name: string        // nome do item (custom para rare/unique, base para normal)
  baseName: string    // tipo base (ex: "Leather Belt", "Occultist's Vestment")
  rarity: string      // "Unique" | "Rare" | "Magic" | "Normal"
  sockets?: string    // ex: "R-G-B-R" (dash=linked, space=grupo separado)
  quality?: number
  itemLevel?: number
  corrupted?: boolean
  implicits: ParsedMod[]
  explicits: ParsedMod[]
  iconUrl?: string    // web.poecdn.com URL (buscado no poe.ninja)
}

interface PobBuildData {
  BuildInfo: { Class: string; Ascendancy: string; Level: string }
  Stats: Record<string, string>   // ex: { "Total DPS": "1,234,567", "Life": "5,000" }
  ItemSets: PobItemSet[]
  Skills: PobSkillGroup[]
  TreeDetails: { Keystones: string[]; Masteries: string[]; NodesCount: number }
}
```

---

## Layout do Grid de Equipamentos

O grid de equipamentos usa `CSS grid-template-areas` com 4 colunas × 5 linhas, estilo poe.ninja:

```
Col:    1        2        3        4
Row 1:  [  .   ] [  Helm  Helm  ] [Amul]
Row 2:  [ Wep1 ] [  Body  Body  ] [Wep2]
Row 3:  [ Wep1 ] [  Body  Body  ] [Wep2]   ← Weapons span 2 rows
Row 4:  [Ring1 ] [  Body  Body  ] [Ring2]  ← Body span 3 rows
Row 5:  [Gloves] [ Belt ] [Boots ] [  .  ]
```

Template CSS:
```css
grid-template-areas:
  ". helm helm amul"
  "wep1 body body wep2"
  "wep1 body body wep2"
  "ring1 body body ring2"
  "gloves belt boots .";
grid-template-columns: repeat(4, 1fr);
grid-template-rows: repeat(5, 80px);
```

Nomes de slots no XML do PoB → CSS grid-area:
- `Weapon 1` → `wep1`
- `Weapon 2` → `wep2`
- `Helm` → `helm`
- `Body Armour` → `body`
- `Ring 1` → `ring1`
- `Ring 2` → `ring2`
- `Gloves` → `gloves`
- `Belt` → `belt`
- `Boots` → `boots`
- `Amulet` → `amul`

Os flasks (`Flask 1`–`Flask 5`) ficam em um grid de 5 colunas abaixo do grid principal.

---

## Ícones dos Itens

**Fonte:** poe.ninja API (Standard league) → `web.poecdn.com` CDN

**Endpoints fetchados em paralelo (cache 24h em memória de módulo):**
```
https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueWeapon
https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueArmour
https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueAccessory
https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueFlask
https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueJewel
https://poe.ninja/api/data/itemoverview?league=Standard&type=BaseType
```

**Lógica de lookup:**
- Item Unique → chave = `item.name.toLowerCase()` (ex: `"headhunter"`)
- Item Rare/Normal/Magic → chave = `item.baseName.toLowerCase()` (ex: `"leather belt"`)

`web.poecdn.com` já está configurado em `next.config.ts` como domínio permitido para `<Image>`.

---

## Formato do Item no XML do PoB

```
Rarity: Unique          ← linha 0: raridade
Headhunter              ← linha 1: nome (para unique/rare)
Leather Belt            ← linha 2: base type (para unique/rare)
Item Level: 82          ← propriedades (opcionais)
Sockets: R-G            ← sockets (opcional)
Implicits: 1            ← quantidade de implicits
+25 to maximum Life     ← implicits (quantidade = número acima)
Adds 40 to 55 Physical Damage to Attacks while you have a Rare Enemy Buff  ← explicits
16% increased Damage while you have a Rare Enemy Buff
...
Corrupted               ← flag no final (opcional)
```

**Tags especiais nos mods:**
- `{crafted}+30 to maximum Life` → mod crafted (azul)
- `{fractured}+30 to maximum Life` → mod fraturado (âmbar)
- `{enchant}Regenerate 1% of Life...` → enchant (âmbar brilhante)
- `{range:0.5}+30 to maximum Life` → indica posição do roll (stripped, não afeta display)

---

## Color Scheme (mods e raridades)

| Tipo | Classe Tailwind |
|------|----------------|
| Mod normal | `text-sky-200` |
| Mod crafted | `text-blue-400` |
| Mod fractured | `text-amber-200` |
| Mod enchant | `text-amber-400` |
| Nome Unique | `text-amber-400` |
| Nome Rare | `text-yellow-300` |
| Nome Magic | `text-blue-400` |
| Nome Normal | `text-slate-300` |
| Corrupted | `text-red-500` |

---

## O que ainda falta implementar

### Prioridade Alta
- [ ] **Ícones para Magic items** — baseName para magic == modified name (ex: "Bubbling Divine Flask of the Cheetah") em vez do base type real. Precisa de lógica para extrair o base type removendo prefixo/sufixo mágico.
- [ ] **Múltiplos Item Sets** — PoB suporta múltiplos sets (swap weapon etc.). Atualmente só exibe `ItemSets[0]`. Adicionar um select para alternar entre sets.

### Prioridade Média
- [ ] **PoE2 builds** — poe.ninja tem endpoint diferente: `https://poe.ninja/poe2/api/economy/itemoverview`. Detectar se é PoE2 pelo `<Build>` attribute e usar endpoint correto.
- [ ] **Link "Comprar"** — Para gems ou currency items que o site vende, adicionar link para a página de produto.
- [ ] **Adicionar à sitemap** — `next-sitemap.config.js` não inclui `/tools/pob-viewer` ainda.

### Prioridade Baixa
- [ ] **Tooltip de gems** — mostrar descrição da gem ao hover (precisaria de outra fonte de dados)
- [ ] **Compartilhar link** — URL com o PoB code na query string para compartilhar

---

## Dependências

Todas já instaladas no projeto:
- `jsdom` — parse XML no Node.js
- `zlib` — built-in Node.js (inflate)
- `Buffer` — built-in Node.js (base64 decode)
- `next/image` — display de imagens com domínio `web.poecdn.com` já permitido

---

## Notas de Desenvolvimento

- API route usa `runtime = 'nodejs'` e `dynamic = 'force-dynamic'` (necessário para zlib + jsdom)
- O cache do icon map é por módulo Node.js (module-level variable), resetado a cada cold start/deploy
- `ignoreBuildErrors: true` em `next.config.ts` — TypeScript errors não bloqueiam o build
- Locales: `en` (sem prefixo) e `pt-br` (com prefixo `/pt-br/`)
- `buildAbsoluteUrl()` e `buildCanonical()` em `lib/utils.ts` para URLs SEO
