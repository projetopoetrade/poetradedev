# Plano de Crescimento — Path of Trade

**Data:** 23 de fevereiro de 2026
**Baseline:** SEO técnico ~75/100, league pages no ar, 0 ferramentas, 0 posts transacionais

---

## Visão Geral

O plano tem 2 pilares ativos agora:

```
FERRAMENTAS                          CONTEÚDO
(atrai tráfego recorrente)           (captura keywords + converte)
     │                                    │
     ├── Price Tracker (currency+items)   ├── Blog transacional (2 posts)
     ├── Build Randomizer                 ├── Conteúdo de produtos (Sanity)
     │                                    ├── Internal links (league pages)
     │                                    ├── Landing pages produto × liga
     │                                    └── generateStaticParams
     ▼                                    ▼
  Backlinks orgânicos               Rankings no Google
  Visitas recorrentes               Tráfego de busca
  Compartilhamento social           Conversões diretas
```

**Fora do escopo por agora** (retomar depois):
- League Start Checklist
- Módulo SEO Intelligence (PRD pronto em `docs/PRD-seo-intelligence.md`)

---

## Pilar 1 — Ferramentas (`/tools/`)

### 1.1 Price Tracker — Currency & Items

**Rota:** `/tools/price-tracker`

**O que faz:** Mostra preços em tempo real de currencies, unique items, gems, essences e mais — via poe.ninja API. Valores convertidos pra moeda selecionada no site (USD, BRL, EUR, etc.) usando o CurrencyProvider existente. Para items que a Path of Trade vende, mostra comparação "Nosso Preço vs. Mercado".

#### Fonte de dados — poe.ninja API (gratuita, sem auth)

**PoE 1** (base: `https://poe.ninja/api/data/`):

| Categoria | Endpoint | Tipo |
|-----------|----------|------|
| Currency | `currencyoverview?league={L}&type=Currency` | currencyoverview |
| Fragments | `currencyoverview?league={L}&type=Fragment` | currencyoverview |
| Unique Weapons | `itemoverview?league={L}&type=UniqueWeapon` | itemoverview |
| Unique Armours | `itemoverview?league={L}&type=UniqueArmour` | itemoverview |
| Unique Accessories | `itemoverview?league={L}&type=UniqueAccessory` | itemoverview |
| Unique Flasks | `itemoverview?league={L}&type=UniqueFlask` | itemoverview |
| Unique Jewels | `itemoverview?league={L}&type=UniqueJewel` | itemoverview |
| Divination Cards | `itemoverview?league={L}&type=DivinationCard` | itemoverview |
| Skill Gems | `itemoverview?league={L}&type=SkillGem` | itemoverview |
| Essences | `itemoverview?league={L}&type=Essence` | itemoverview |
| Scarabs | `itemoverview?league={L}&type=Scarab` | itemoverview |

**PoE 2** (base: `https://poe.ninja/poe2/api/economy/`):

| Categoria | Endpoint |
|-----------|----------|
| Currency | `currencyexchange/overview?leagueName={L}&overviewName=Currency` |

(PoE 2 só tem currency no poe.ninja por enquanto — mais categorias serão adicionadas conforme poe.ninja expandir)

**Response de itemoverview (uniques, gems, etc.):**
```json
{
  "lines": [{
    "name": "Headhunter",
    "icon": "https://web.poecdn.com/...",
    "chaosValue": 12500,
    "exaltedValue": 55.3,
    "divineValue": 75.2,
    "sparkline": { "data": [...], "totalChange": -3.5 },
    "listingCount": 45,
    "detailsId": "headhunter-leather-belt"
  }]
}
```

#### Conversão de preço pra moeda do site

```
poe.ninja retorna: chaosValue (em Chaos Orbs)
                    divineValue (em Divine Orbs)

Conversão:
1. divineValue do item (poe.ninja)
2. × preço do Divine Orb em USD (nosso Supabase, tabela products)
3. = estimatedUSD
4. CurrencyProvider converte USD → moeda selecionada pelo usuário (BRL, EUR, etc.)

Exemplo:
  Headhunter = 75.2 Divine Orbs
  Nosso Divine Orb = $0.15 USD
  Headhunter ≈ $11.28 USD ≈ R$ 63.50 BRL
```

Disclaimer obrigatório: "* Estimated values based on Divine Orb market rate. Actual prices may vary."

#### Arquitetura

```
API Route (Next.js)                         Frontend
app/api/tools/prices/route.ts               /tools/price-tracker
├── Query: ?game=poe1|poe2                  ├── Filtros: [PoE 1/PoE 2] [League ▼] [Category ▼]
│          &league={name}                   ├── Search: [Search items by name...]
│          &category={type}                 ├── Tabela:
├── Fetch poe.ninja (server-side)           │   Item | Chaos | Divine | ~USD* | Trend | [Buy]
├── Cache: revalidate 3600 (1h)             ├── Categorias: tabs ou dropdown
├── Merge com preços Supabase               │   All | Currency | Unique Weapons | Unique Armour |
│   (pra items que vendemos)                │   Accessories | Flasks | Jewels | Div Cards |
├── Calcular estimatedUSD                   │   Gems | Essences | Scarabs
└── Return JSON normalizado                 ├── Sort: clicável em cada coluna
                                            ├── Paginação: 50 items/página
                                            ├── Mobile: cards ao invés de tabela <640px
                                            └── Coluna "~BRL/USD/EUR": via CurrencyProvider
```

#### Tabela no Supabase (histórico próprio)

```sql
CREATE TABLE currency_price_history (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    item_category TEXT NOT NULL,       -- 'Currency', 'UniqueWeapon', etc.
    game_version TEXT NOT NULL,        -- 'poe1', 'poe2'
    league TEXT NOT NULL,
    chaos_value FLOAT NOT NULL,
    divine_value FLOAT,
    estimated_usd FLOAT,
    snapshot_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_price_history_item ON currency_price_history(item_name, league);
CREATE INDEX idx_price_history_date ON currency_price_history(snapshot_at);

-- Cron: snapshot 1x/hora pra construir histórico ao longo do tempo
-- Quando tiver dados suficientes: gráfico de evolução de preço
```

#### Frontend — detalhes da tabela

| Coluna | O que mostra | Detalhe |
|--------|-------------|---------|
| Item | Ícone (CDN poe.ninja) + nome | Ícone carrega do URL da response |
| Chaos | Valor em Chaos Orbs | Número formatado (1.2k pra valores altos) |
| Divine | Valor em Divine Orbs | chaosValue / divineOrbChaosRate |
| ~[Moeda] | Valor estimado na moeda do usuário | Label muda conforme CurrencyProvider: "~USD", "~BRL", "~EUR" |
| Trend | Variação 7 dias | Badge verde ↑ / vermelho ↓ + %. Sparkline se disponível (PoE 1). PoE 2 ainda sem sparkline |
| Buy | Botão → product page | Só aparece pra items que vendemos. Match item.name com Supabase products |

**Para items que vendemos (currencies):** mostrar coluna extra "Our Price" com destaque verde se menor que o estimado de mercado.

**Mobile (<640px):** esconder colunas Chaos e Trend. Mostrar cards com: Item | Divine | ~Moeda | Buy.

#### SEO

- **EN title:** "PoE Price Tracker — Currency & Unique Item Prices in Real-Time | Path of Trade"
- **PT title:** "Tracker de Preços PoE — Currency e Items Únicos em Tempo Real | Path of Trade"
- **EN description:** "Check real-time prices for currency, unique items, gems, and more in Path of Exile 1 & 2. Prices shown in USD, BRL, and other currencies. Updated every hour."
- **PT description:** "Veja preços em tempo real de currency, items únicos, gemas e mais em Path of Exile 1 e 2. Preços em BRL, USD e outras moedas. Atualizado a cada hora."
- Hreflang en/pt-br/x-default, canonical lowercase, revalidate = 3600
- JSON-LD: WebApplication schema
- FAQPage: "How often are prices updated?", "Where do prices come from?", "How is the USD/BRL price calculated?", "Can I buy items directly from this page?"

#### Por que é poderoso

- **Keyword altíssima:** "divine orb price poe 2", "headhunter price poe", "mageblood price" têm busca diária constante
- **Tráfego recorrente:** jogadores voltam todo dia pra checar preços
- **Funil natural:** coluna "Our Price vs. Market" converte direto
- **Backlinks:** criadores de conteúdo/streamers linkam pra referência de preços
- **Diferencial:** nenhum concorrente de currency shop mostra preços em USD/BRL — poe.ninja só mostra em Chaos/Divine
- **Uniques expandem alcance:** atrai jogadores que nem estavam buscando comprar currency — mas veem o site e descobrem

---

### 1.2 League Start Build Randomizer

**Rota:** `/tools/build-randomizer`

**O que faz:** Sorteia uma build de league start baseada em filtros. Pra quem tá indeciso antes de uma liga nova — que é praticamente todo jogador de PoE.

#### Dados

Pool de builds vem do Sanity — reutiliza o campo `starters` das league pages:
```
Query GROQ: *[_type == "league" && status == "live"]{ starters[] }
```

#### Mecânica

1. Usuário escolhe filtros (opcionais):
   - Game: PoE 1 / PoE 2
   - Tags: league-start, budget, endgame, bosser, mapper, beginner-friendly
   - Excluir ascendancies que já jogou
2. Clica "SPIN" → animação de roleta/slot machine (~2 segundos)
3. Build sorteada aparece com: nome, ascendancy, tier, pros/cons, budget estimado, link do guide
4. "Not feeling it?" → "SPIN AGAIN"
5. "Love it?" → "Buy currency for this build" → product page com budget sugerido

#### Componentes

```
/tools/build-randomizer/page.tsx
├── FilterPanel (game, tags, exclusions)
├── SpinAnimation (CSS animation, slot machine style)
├── BuildResultCard (reutiliza design do LeagueStarters)
│   ├── Nome, Ascendancy, Tier badge (S/A/B/C com cor)
│   ├── Tags como badges
│   ├── Pros (lista verde) / Cons (lista vermelha)
│   ├── Estimated budget: "~15 Divine Orbs"
│   ├── "View Full Guide" → guideUrl (externo)
│   └── "Buy Currency for This Build" → /products (CTA principal)
└── ShareButton ("I'm playing [Build] this league! 🎲")
```

#### Por que viraliza

- "I let a random generator pick my league start" é formato popular nas comunidades
- Streamers usariam pra conteúdo ao vivo
- Compartilhável: "Path of Trade chose Earthshatter Berserker for me 🎲" com link
- Reddit/Discord-friendly: ferramenta divertida, não propaganda
- Keywords: "poe 2 league start build", "random build generator poe", "poe build picker"

#### SEO

- **EN title:** "PoE 2 Build Randomizer — Can't Decide? Let Us Pick! | Path of Trade"
- **PT title:** "Randomizador de Build PoE 2 — Indeciso no League Start? | Path of Trade"
- Hreflang, canonical, revalidate = 300
- JSON-LD: WebApplication
- FAQPage: "How does the randomizer work?", "Can I filter builds?", "Are these builds tested?"
- Open Graph image dinâmico com a build sorteada (se possível)

---

### 1.3 Sugestão: Hub de Ferramentas (`/tools/`)

**Rota:** `/tools/`

Landing page que lista todas as ferramentas com cards descritivos. Benefícios:
- Keyword: "poe tools", "path of exile tools"
- Ponto central de internal linking
- Página indexável que linka pra cada ferramenta
- Esforço: ~30 minutos

---

## Pilar 2 — Conteúdo Pendente

### 2.1 Blog Transacional (2 posts)

| Post | Keywords | Palavras |
|------|----------|---------|
| "Is It Safe to Buy PoE 2 Currency? Complete Guide 2026" | "is it safe to buy poe currency" | 1200-1500 |
| "Best PoE 2 Currency Shops Compared — 2026" | "best site buy poe 2 currency" | 1500-1800 |

Cada post: FAQPage schema, hreflang en/pt-br, links pra 2+ product pages e 1 league page. Versão pt-br de cada.

### 2.2 Internal Links para League Pages

- Hub `/games/[version]` → card com liga ativa linkando pra league page
- Footer → "Current League" link
- Homepage → seção "Current League" abaixo da seleção de jogo
- Blog posts existentes → link contextual quando mencionam ligas

### 2.3 generateStaticParams nos Produtos

Pré-renderizar top 5 produtos (Divine, Chaos, Exalted, Mirror, Hinekora Lock) no build time.

### 2.4 Conteúdo de Produto no Sanity

Popular campo `body` dos 5 produtos principais com 600+ palavras cada (en + pt-br): mecânica, por que comprar, dicas, FAQ com FAQPage schema.

### 2.5 Landing Pages Produto × Liga (Programmatic SEO)

**Rota:** `/games/[gameVersion]/league/[leagueSlug]/[productSlug]`

Reutiliza `product-detail.tsx` com contexto de liga:
- Title: "Buy Divine Orb — Keepers of the Flame | PoE 1 | Path of Trade"
- H1: "Buy Divine Orb for Keepers of the Flame"
- BreadcrumbList: Home > PoE 1 > Keepers of the Flame > Divine Orb
- Hreflang, canonical, FAQPage schema
- Gerar combinações automaticamente via Sanity leagues × Supabase products
- Incluir no sitemap

### 2.6 Sugestão: Página de Preço Individual por Item

Quando o Price Tracker estiver funcionando, cada item pode ter uma sub-rota:
`/tools/price-tracker/divine-orb`

Mostra: preço atual, gráfico histórico (dos snapshots acumulados), items relacionados, CTA "Buy Now".

Benefício enorme de SEO: cada item vira uma página indexável que captura keywords como "divine orb price", "headhunter price poe 2". Com 200+ items, são 200+ páginas programáticas.

**Implementar depois que o histórico de snapshots tiver 2+ semanas de dados.**

---

## Cronograma

### Semana 1 — Conteúdo + Fundação Price Tracker

| Dia | Ação | Entregável |
|-----|------|-----------|
| 1-2 | 2 blog posts transacionais | Posts publicados e indexados |
| 2-3 | Internal links para league pages (hubs, footer, homepage) | Liga ativa linkada em todo o site |
| 3-4 | API route `/api/tools/prices` (poe.ninja + merge Supabase + conversão) | Endpoint funcionando com todas as categorias |
| 4-5 | Tabela `currency_price_history` no Supabase + API de snapshot | Histórico de preços acumulando |

### Semana 2 — Price Tracker Frontend + Conteúdo de Produto

| Dia | Ação | Entregável |
|-----|------|-----------|
| 1-3 | Frontend do Price Tracker (tabela, filtros, busca, categorias, mobile) | Ferramenta no ar em `/tools/price-tracker` |
| 3-4 | generateStaticParams nos top 5 produtos | Produtos pré-renderizados no build |
| 4-5 | Conteúdo de produto no Sanity (5 produtos × 2 idiomas) | Páginas expandidas de ~165 pra 600+ palavras |

### Semana 3 — Build Randomizer + Programmatic SEO

| Dia | Ação | Entregável |
|-----|------|-----------|
| 1-3 | Build Randomizer (Sanity data, animação, filters, share) | Ferramenta no ar em `/tools/build-randomizer` |
| 3-4 | Landing pages produto × liga (rota + sitemap + SEO) | URLs programáticas indexáveis |
| 5 | Hub `/tools/` + links na navegação/footer | Ferramentas descobríveis |

### Semana 4 — Polimento + Audit

| Dia | Ação | Entregável |
|-----|------|-----------|
| 1-2 | Vercel Cron pra snapshot de preços (1x/hora) | Histórico crescendo automaticamente |
| 2-3 | Testar Rich Results em todas as páginas novas | Schema validado |
| 3-4 | Resubmeter sitemap no GSC | Páginas novas sendo indexadas |
| 5 | Revisão geral: links quebrados, mobile, performance | Site polido |

### Semana 5+ — Audit de Follow-Up + Próximas Decisões

- Rodar audit completo (3 skills, como fizemos)
- Comparar: 41 → ~75 → pós-ferramentas+conteúdo
- GSC com 30+ dias de dados → decisões baseadas em dados reais
- Decidir próxima prioridade: League Start Checklist, SEO Intelligence, páginas individuais de preço, novas ferramentas

---

## Prompts pro Claude Code

### Ferramenta 1 — Price Tracker

```
Crie a ferramenta Price Tracker em /tools/price-tracker.

CONTEXTO:
O site tem um CurrencyProvider (context global em app/[locale]/layout.tsx) que 
gerencia a moeda selecionada pelo usuário (USD, BRL, EUR) e faz conversão.
Reutilizar esse contexto pra mostrar valores na moeda do usuário.

=== BACKEND ===

1. API Route: app/api/tools/prices/route.ts
   Query params: ?game=poe1|poe2&league={leagueName}&category={category}
   
   Endpoints poe.ninja por categoria:
   
   PoE 1 (base: https://poe.ninja/api/data/):
   - Currency:           currencyoverview?league={L}&type=Currency
   - Fragments:          currencyoverview?league={L}&type=Fragment
   - Unique Weapons:     itemoverview?league={L}&type=UniqueWeapon
   - Unique Armours:     itemoverview?league={L}&type=UniqueArmour
   - Unique Accessories: itemoverview?league={L}&type=UniqueAccessory
   - Unique Flasks:      itemoverview?league={L}&type=UniqueFlask
   - Unique Jewels:      itemoverview?league={L}&type=UniqueJewel
   - Divination Cards:   itemoverview?league={L}&type=DivinationCard
   - Skill Gems:         itemoverview?league={L}&type=SkillGem
   - Essences:           itemoverview?league={L}&type=Essence
   - Scarabs:            itemoverview?league={L}&type=Scarab
   
   PoE 2 (base: https://poe.ninja/poe2/api/economy/):
   - Currency: currencyexchange/overview?leagueName={L}&overviewName=Currency
   
   ATENÇÃO — dois formatos de response diferentes:
   
   currencyoverview retorna:
   { lines: [{ currencyTypeName, chaosEquivalent, paySparkLine, receiveSparkLine }],
     currencyDetails: [{ id, icon, name, tradeId }] }
   
   itemoverview retorna:
   { lines: [{ name, icon, chaosValue, divineValue, sparkline, listingCount, detailsId }] }
   
   PoE 2 currency retorna:
   { core: { version, timestamp }, 
     lines: [{ id, primaryValue, volumePrimaryValue }],
     items: [{ id, name, icon, tradeId }] }
   
   NORMALIZAR tudo pra uma shape única:
   {
     items: [{
       name: string,
       icon: string,
       category: string,
       chaosValue: number,
       divineValue: number,
       estimatedUSD: number,
       sparkline: { data: number[], totalChange: number } | null,
       listingCount: number | null,
       detailsId: string,
       weSellThis: boolean,
       ourPriceUSD: number | null
     }]
   }
   
   CONVERSÃO:
   - Buscar preço do Divine Orb no Supabase (tabela products)
   - estimatedUSD = item.divineValue × divineOrbPriceUSD
   - Frontend usa CurrencyProvider pra converter USD → moeda do usuário
   
   Cache: Next.js revalidate 3600 (1 hora)

2. Tabela Supabase: currency_price_history
   CREATE TABLE currency_price_history (
     id SERIAL PRIMARY KEY,
     item_name TEXT NOT NULL,
     item_category TEXT NOT NULL,
     game_version TEXT NOT NULL,
     league TEXT NOT NULL,
     chaos_value FLOAT NOT NULL,
     divine_value FLOAT,
     estimated_usd FLOAT,
     snapshot_at TIMESTAMP NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_price_history_item ON currency_price_history(item_name, league);
   CREATE INDEX idx_price_history_date ON currency_price_history(snapshot_at);

3. API Route: app/api/tools/prices/snapshot/route.ts
   POST endpoint pra cron (Vercel Cron):
   - Fetch preços atuais das categorias principais
   - Salvar snapshot na tabela de histórico
   - Rodar 1x/hora

=== FRONTEND ===

4. Page: app/[locale]/(site)/tools/price-tracker/page.tsx

   Layout:
   - H1: "PoE Price Tracker — Real-Time Market Prices"
   - Sub: "Currency, unique items, gems and more. Updated every hour."
   - Filtros: [PoE 1 / PoE 2] [League dropdown] [Category tabs/dropdown]
   - Search: input "Search items by name..." (client-side filter)
   - Tabela:
     Item (ícone + nome) | Chaos | Divine | ~[Moeda]* | Trend | [Buy]
   - Coluna ~[Moeda]: label muda conforme CurrencyProvider
   - Coluna Trend: badge com % verde/vermelho. Sparkline se disponível
   - Coluna Buy: só pra items que vendemos. Link → product page
   - Para currencies que vendemos: "Our Price" com destaque verde se menor
   - Sort: clicável em cada coluna
   - Paginação: 50 items por página
   - Disclaimer: "* Estimated values based on Divine Orb market rate."
   - Skeleton loading

5. Mobile (<640px):
   - Esconder colunas Chaos e Trend
   - Cards ao invés de tabela

=== SEO ===

6. generateMetadata com titles EN/PT, hreflang, canonical, revalidate 3600
   JSON-LD: WebApplication + FAQPage
7. Link "Price Tracker" na navegação e footer
8. Incluir no sitemap
9. Traduções en/pt-br

Design: shadcn/ui, Tailwind, tema escuro. Ícones de items do CDN poe.ninja.
```

### Ferramenta 2 — Build Randomizer

```
Crie a ferramenta Build Randomizer em /tools/build-randomizer.

DADOS:
- Pool de builds vem do Sanity: campo starters das leagues com status "live"
- Query GROQ: *[_type == "league" && status == "live"]{ starters[] }

FRONTEND:
1. Page: app/[locale]/(site)/tools/build-randomizer/page.tsx

2. FilterPanel (opcional):
   - Game: PoE 1 / PoE 2 (toggle)
   - Tags: league-start, budget, endgame, bosser, mapper, beginner-friendly
   - Exclude ascendancies: multi-select

3. Spin Button: botão grande "🎲 SPIN"
   - Animação shuffle ~2 segundos → para numa build aleatória

4. BuildResultCard:
   - Nome + Ascendancy + Tier badge (S/A/B/C)
   - Tags, Pros (verde), Cons (vermelho)
   - "Estimated Budget: ~15 Divine Orbs"
   - "View Full Guide" → guideUrl externo
   - "Buy Currency for This Build" → /products (CTA principal)

5. Ações: "🎲 Spin Again" + "📋 Share" (copia texto + link)

SEO:
6. Titles EN/PT, hreflang, canonical, revalidate 300
   JSON-LD: WebApplication + FAQPage
7. Traduções en/pt-br
8. Footer + sitemap

Design: tema escuro, animação divertida, shadcn/ui, lucide-react.
```

---

## Métricas de Sucesso

### 30 dias
- Price Tracker no ar com currencies + uniques + conversão de moeda
- Build Randomizer no ar com pool de builds
- 2+ blog posts transacionais publicados (en + pt-br)
- Internal links implementados
- Landing pages produto × liga indexadas
- GSC mostrando impressões pras novas páginas

### 60 dias
- Tráfego orgânico mensurável no GA4
- Price Tracker com 50+ visitas/dia recorrentes
- Build Randomizer compartilhado em Reddit/Discord
- 5+ keywords na página 1-2 do Google
- Histórico de preços com 60 dias de dados

### 90 dias
- Ferramentas gerando 30%+ do tráfego total
- Primeiros backlinks orgânicos
- Landing pages produto × liga aparecendo no Google
- 10+ keywords em top 20
- Score de audit: 85+/100
- Decidir retomada de: Checklist, SEO Intelligence, páginas individuais de preço
