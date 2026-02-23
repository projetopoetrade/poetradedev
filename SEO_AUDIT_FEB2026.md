# Auditoria SEO & Código — pathoftrade.net
**Data:** 22 de fevereiro de 2026
**Auditor:** Claude Code
**Escopo:** Análise pós-migração da rota de league + revisão geral de SEO técnico

---

## Resumo Executivo

| Categoria | Status |
|-----------|--------|
| Migração `/league/` → `/games/[gv]/league/` | ✅ Concluída |
| Redirect 301 rota antiga | ✅ Corrigido (`permanentRedirect`) |
| Sitemap atualizado | ✅ Correto |
| **Bug crítico: `buildBreadcrumbSchema` quebrado** | ✅ **CORRIGIDO** (`lib/utils.ts:375`) |
| x-default ausente nas pages de league | ✅ Corrigido (hreflang explícito) |
| Inconsistência de `pt-BR` vs `pt-br` no hreflang | ✅ Padronizado para `pt-BR` nas league pages |
| SEO_PROGRESS.md desatualizado | ✅ Atualizado |

---

## ✅ BUG CRÍTICO CORRIGIDO — `buildBreadcrumbSchema` gera JSON-LD inválido

**Arquivo:** `lib/utils.ts` — linha 375
**Impacto:** TODAS as páginas que usam `buildBreadcrumbSchema` (products + games)

### O problema

```ts
// CÓDIGO ATUAL (QUEBRADO)
itemListElement: items.map((item, index) => ({
  "@type": "ListItem",
  position: index + 1,
  name: item.name,
  item: item.url.startsWith("http")  // ← retorna boolean true/false !!!
})),
```

O campo `item` do BreadcrumbList Schema.org deve ser uma **URL string**, mas está recebendo um `boolean`. O JSON-LD gerado é:

```json
{
  "@type": "ListItem",
  "position": 1,
  "name": "Home",
  "item": false
}
```

Isso faz o Google rejeitar silenciosamente os rich results de breadcrumb.
**Páginas afetadas:**
- `app/[locale]/(site)/products/[name]/page.tsx` (linha 209)
- `app/[locale]/(site)/games/[gameVersion]/page.tsx` (linha 97)

### Fix necessário

```ts
// CORRETO
itemListElement: items.map((item, index) => ({
  "@type": "ListItem",
  position: index + 1,
  name: item.name,
  item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
})),
```

---

## ✅ x-default CORRIGIDO nas páginas de League

**Arquivo:** `app/[locale]/(site)/games/[gameVersion]/league/[leagueSlug]/page.tsx` — linha 120
**Impacto:** Hreflang sem `x-default` nas páginas de liga

### O problema

A função `getHreflangAlternates()` só adiciona `x-default` se ele **não for duplicata** de outra URL existente. Como `en` e `x-default` apontam para o mesmo URL, `x-default` nunca é adicionado:

```ts
// lib/utils.ts — getHreflangAlternates()
const isDuplicate = Object.values(languages).some(url => url === defaultUrl);
if (!isDuplicate) {
  languages['x-default'] = defaultUrl; // nunca entra aqui
}
```

A league page acaba com apenas `en` e `pt-br`, sem `x-default`. Em contraste, as páginas de produto e de jogo declaram `x-default` explicitamente e estão corretas.

### Fix necessário na league page

Substituir o retorno de `getHreflangAlternates` por uma estrutura explícita (como já é feito no product page):

```ts
alternates: {
  canonical,
  languages: {
    en: buildAbsoluteUrl(leaguePath(leagueSlug, gameVersion, "en")),
    "pt-BR": buildAbsoluteUrl(leaguePath(leagueSlug, gameVersion, "pt-br")),
    "x-default": buildAbsoluteUrl(leaguePath(leagueSlug, gameVersion, "en")),
  },
},
```

---

## 🟡 Inconsistência de locale code no hreflang

| Página | Código usado | Correto? |
|--------|-------------|----------|
| Product (`/products/[name]`) | `'pt-BR'` (linha 68) | ✅ Google aceita |
| Games (`/games/[gameVersion]`) | `'pt-BR'` (linha 48) | ✅ Google aceita |
| League (`/games/.../league/[slug]`) | `'pt-br'` via `getHreflangAlternates` | ✅ Google aceita |
| Layout | `'pt-BR'` (linha 82) | ✅ Google aceita |

Google aceita ambos os formatos mas a inconsistência entre páginas é ruim para manutenção. O padrão BCP 47 correto é `pt-BR`.

---

## ✅ O que está correto

### Migração de rota de league
- Nova rota `/games/[gameVersion]/league/[leagueSlug]` criada e funcional
- `generateStaticParams` retorna `gameVersion` + `locale` + `leagueSlug`
- `generateMetadata` valida que o `gameVersion` da URL bate com o do Sanity (retorna 404 se não bater)
- Rota antiga `/league/[leagueSlug]` retorna `permanentRedirect` (308, equivalente a 301 para GET) ✅
- Sitemap usa nova estrutura `/games/${gameVersion}/league/${slug}` ✅
- `analyze-keywords.js` atualizado ✅
- `liveLeagueQuery` retorna `gameVersion` ✅
- Link para live league no banner "ended" usa `liveLeague.gameVersion` ✅
- `SITE_URL` com `.replace(/\/+$/, "")` evita trailing slash no JSON-LD ✅

### Canonical URLs
- `buildCanonical()` força lowercase ✅
- `metadataBase` definido no layout ✅
- Canonical correto em todas as rotas principais ✅

### JSON-LD Schemas
- **Product pages:** `Product` schema com preço real + `FAQPage` + `BreadcrumbList` (mas BreadcrumbList quebrado — ver bug crítico)
- **League pages:** `WebPage` + `BreadcrumbList` (inline, correto) + `FAQPage` ✅
- **Games pages:** `BreadcrumbList` (mas quebrado — ver bug crítico)
- **About page:** `Organization` schema ✅

### Sitemap
- Exclui `/admin`, `/api`, `/cart`, `/auth` ✅
- Páginas estáticas com hreflang alternates ✅
- Produtos com `lastmod` dinâmico do Supabase ✅
- League pages com priority baseado em status ✅
- Blog posts filtrados por language ✅

### ISR / Cache
- `revalidate = 300` em todas as páginas dinâmicas principais ✅
- Sanity com `force-cache` + `revalidate: 3600` ✅

### Estrutura de heading
- Múltiplos H1 corrigidos em iterações anteriores ✅

### robots.txt
- Bloqueia `/admin`, `/api`, `/_next`, `/cart`, `/auth` ✅
- Imagens não bloqueadas (Google Images) ✅

---

## 📋 Próximos Passos Prioritários

### Sprint 1 — Fixes Imediatos (código) ✅ CONCLUÍDOS

| # | Ação | Arquivo | Status |
|---|------|---------|--------|
| 1 | **Fix `buildBreadcrumbSchema`** — ternário para URL absoluta | `lib/utils.ts:375` | ✅ Corrigido |
| 2 | **Fix hreflang `x-default`** nas league pages | `games/[gameVersion]/league/[leagueSlug]/page.tsx` | ✅ Corrigido |
| 3 | **Atualizar `SEO_PROGRESS.md`** | `SEO_PROGRESS.md` | ✅ Atualizado |

### Sprint 2 — Conteúdo SEO

| # | Ação | Impacto |
|---|------|---------|
| 4 | **`generateStaticParams` para products** — pré-renderizar produtos mais vendidos (Divine Orb, Chaos Orb, Exalted Orb) no build | Latência + Googlebot crawl |
| 5 | **Conteúdo de produto via Sanity** — popular `body` dos produtos principais (Divine Orb, Chaos Orb) | E-E-A-T + thin content |
| 6 | **Blog transacional** — "Best Places to Buy PoE Currency 2026", "Is Buying PoE Currency Safe?" | Keywords comerciais de alto volume |
| 7 | **Internal linking** — adicionar links para league pages no footer e na navegação de jogo | PageRank flow + crawlability |

### Sprint 3 — Authority

| # | Ação | Impacto |
|---|------|---------|
| 8 | **Validar redirect www** — `curl -I https://pathoftrade.net` deve retornar `301` | Link equity consolidation |
| 9 | **GSC — submeter novo sitemap** após build com novas URLs de league | Indexação mais rápida |
| 10 | **Backlinks** — Reddit r/pathofexile, PoE fóruns, lista de ferramentas | Domain Authority |

---

## Estado da Estrutura de Código

### Pontos fortes
- Separação clara entre server/client components
- ISR configurado corretamente
- Contexts para cart e currency bem encapsulados
- `buildCanonical()` e `buildAbsoluteUrl()` reutilizáveis e confiáveis
- Sanity schema de league bem estruturado para crescimento futuro

### Pontos de melhoria
- `buildBreadcrumbSchema` quebrado e não testado (sugerido: adicionar testes unitários para funções de `lib/utils.ts`)
- `getHreflangAlternates` tem lógica confusa de x-default — simplificar ou documentar
- `games/[gameVersion]/page.tsx` tipagem inconsistente: `params` declarado como não-Promise mas com `await` (funciona mas confuso)
- `products/[name]/page.tsx` sem `generateStaticParams` — ISR on-demand é aceitável mas produtos principais deveriam ser pré-renderizados
- `sitemap-data-fetchers.js` em CommonJS enquanto o resto do projeto é ESM/TypeScript — considerar migrar para `.ts`

---

## Referências de Arquivos Críticos

```
lib/utils.ts:375                     ← BUG buildBreadcrumbSchema
games/[gameVersion]/league/.../page.tsx:113  ← fix hreflang x-default
app/[locale]/(site)/league/.../page.tsx      ← permanentRedirect (OK)
next-sitemap.config.js:129           ← nova URL de league (OK)
sanity/sanity-query.ts:100           ← liveLeagueQuery com gameVersion (OK)
```
