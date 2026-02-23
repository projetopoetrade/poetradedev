# Relatório de Projeto — Path of Trade
**Data:** 22 de fevereiro de 2026
**Estado:** Pós-migração de rota de league + fixes de SEO técnico

---

## 1. Visão Geral do Projeto

**Path of Trade** é uma plataforma de e-commerce para compra e venda de moedas in-game de Path of Exile (PoE 1 e PoE 2). O site opera em dois idiomas (inglês e português BR) e suporta múltiplas ligas e versões do jogo.

**URL de produção:** https://www.pathoftrade.net

### Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js | 15.3.6 |
| Runtime | React | 18.3.1 |
| Linguagem | TypeScript | 5.7.2 |
| Estilo | Tailwind CSS | 3.4.17 |
| i18n | next-intl | 4.1.0 |
| Banco de dados | Supabase (PostgreSQL) | 2.49.8 |
| CMS | Sanity | 7.3.0 |
| Pagamentos | Stripe + AbacatePay (PIX) | Stripe 18.1.0 |
| Deploy | Vercel | — |
| Renderização | ISR (revalidate: 300s) | — |

---

## 2. Estrutura de Rotas

### Públicas (`app/[locale]/(site)/`)

| Rota | Descrição | ISR |
|------|-----------|-----|
| `/` | Homepage | ✅ |
| `/products/[name]` | Detalhe de produto (moeda) | 300s |
| `/games/path-of-exile-1` | Hub do PoE 1 | 300s |
| `/games/path-of-exile-2` | Hub do PoE 2 | 300s |
| `/games/[gameVersion]/league/[leagueSlug]` | Página de liga (nova rota) | 300s |
| `/league/[leagueSlug]` | Rota antiga → redirect 308 | — |
| `/blog` | Lista de posts | — |
| `/blog/[slug]` | Post individual | 300s |
| `/about` | Sobre | — |
| `/faq` | Perguntas frequentes | — |
| `/contact` | Contato | — |
| `/terms` / `/privacy` | Termos e privacidade | — |
| `/cart` | Carrinho (excluído do sitemap) | — |
| `/orders` | Histórico de pedidos | — |

### Admin (`app/[locale]/admin/`)

| Rota | Descrição |
|------|-----------|
| `/admin/studio` | Sanity Studio embarcado |
| `/admin/dashboard` | Dashboard de produtos e estoque |
| `/admin/manage-products` | Gerenciamento de produtos |
| `/admin/manage-leagues` | Gerenciamento de ligas |
| `/admin/orders` | Pedidos |

### API (`app/api/`)

| Rota | Descrição |
|------|-----------|
| `/api/checkout/stripe` | Criação de sessão Stripe |
| `/api/checkout/abacatepay` | Criação de pagamento PIX |
| `/api/webhooks/stripe` | Webhook de eventos Stripe |
| `/api/webhooks/abacatepay` | Webhook de eventos AbacatePay |
| `/api/webhooks/sanity-product` | Webhook de revalidação Sanity |
| `/api/auth/*` | Callbacks de autenticação + Turnstile |
| `/api/send-email` | Envio de emails (Resend) |
| `/api/orders` | Consulta de pedidos |
| `/api/pix` | QR code PIX |
| `/api/revalidate` | Revalidação manual de cache |

---

## 3. Fontes de Dados

### Supabase
- **Tabelas principais:** `products`, `leagues`, `orders`
- **Auth:** Supabase Auth (usuários, sessões)
- **Padrão server:** `createClient()` de `utils/supabase/server.ts`
- **Padrão client:** `supabase` de `lib/db/index.ts`
- **Middleware:** Refresh de sessão em todas as rotas não-API

### Sanity CMS
- **Schemas:** `post`, `author`, `category`, `product`, **`league`** (adicionado Feb 2026)
- **GROQ queries:** centralizadas em `sanity/sanity-query.ts`
- **Fetch function:** `sanityFetch()` com `force-cache` + `revalidate: 3600`
- **Studio:** montado em `/admin/studio` via Next.js App Router

---

## 4. Feature: League Pages

Implementada em fevereiro de 2026. Páginas dinâmicas de liga alimentadas pelo Sanity CMS.

### Rota
```
/games/[gameVersion]/league/[leagueSlug]
/pt-br/games/[gameVersion]/league/[leagueSlug]
```

### Schema Sanity (`sanity/schemas/league.ts`)
- `title`, `slug`, `gameVersion`, `patchVersion`, `status` (`announced` | `live` | `ended`)
- `launchDate`, `endDate`, `bannerImage`
- **Pré-lançamento:** `prelaunchTeaser`, `prelaunchMediaUrls` (YouTube), `gggPosts[]`
- **Pós-lançamento:** `tldr`, `mechanics`, `patchNotes`, `starters` (builds tier list)
- **SEO:** `seoTitle`, `seoDescription`, `ctaLink`

### Lógica de renderização
- `announced` → seção de teaser (texto, vídeos, posts GGG)
- `live` → conteúdo completo (TL;DR, mecânica, patch notes, builds)
- `ended` → conteúdo completo + banner de aviso + link para liga atual

### SEO da league page
- Canonical e hreflang com `en`, `pt-BR`, `x-default` ✅
- `generateStaticParams` retorna `{ locale, gameVersion, leagueSlug }` ✅
- JSON-LD: `WebPage` + `BreadcrumbList` (3 níveis: Home → Game → League) + `FAQPage` ✅
- Validação: 404 se `gameVersion` da URL não bate com o do Sanity ✅

### Redirect legado
Rota `/league/[leagueSlug]` retorna `permanentRedirect` (308) para `/games/[gameVersion]/league/[leagueSlug]`.

---

## 5. Estado do SEO Técnico

### Score Histórico
- **Antes das otimizações:** 41/100
- **Estimativa atual:** ~72–78/100 (baseado em itens resolvidos)

### Checklist Técnico Completo

| Item | Status | Detalhe |
|------|--------|---------|
| www redirect 301 | ✅ | `vercel.json` |
| Canonical URLs (lowercase) | ✅ | `buildCanonical()` força lowercase |
| Hreflang em todas as páginas principais | ✅ | `en`, `pt-BR`, `x-default` |
| Sitemap completo | ✅ | Estáticas + produtos + blog + leagues |
| Sitemap submetido ao GSC | ✅ | |
| robots.txt correto | ✅ | Imagens liberadas |
| H1 único por página | ✅ | `game-selection` e `league-selection` corrigidos |
| ISR ativo nas páginas principais | ✅ | `revalidate = 300` |
| Product schema com preço real | ✅ | Dados do Supabase |
| BreadcrumbList schema (products/games) | ✅ | `buildBreadcrumbSchema()` — **corrigido Feb 2026** |
| BreadcrumbList schema (league) | ✅ | Inline, sempre correto |
| FAQPage schema (products) | ✅ | 5 perguntas dinâmicas por produto |
| FAQPage schema (leagues) | ✅ | Auto-gerado por status da liga |
| Organization schema | ✅ | Página `/about` |
| Open Graph + Twitter cards | ✅ | Todas as páginas principais |
| Títulos únicos por página | ✅ | Game, produto, blog, league |
| H1 com intent de compra nos produtos | ✅ | `"Buy [Nome] — PoE 1/2"` |
| Fake aggregateRating removido | ✅ | Evita penalidade |

### O que ainda falta

| Item | Impacto | Detalhe |
|------|---------|---------|
| Blog transacional | 🔴 Alto | Criar posts: "Best Sites to Buy PoE Currency 2026", "Is Buying PoE Currency Safe?" |
| `generateStaticParams` nos produtos | 🟡 Médio | Pré-renderizar produtos top (Divine Orb, Chaos Orb) no build |
| Conteúdo de produto no Sanity | 🟡 Médio | Popular `body` dos produtos principais via Sanity |
| Internal links para league pages | 🟡 Médio | Footer e hub de jogo devem linkar para ligas ativas |
| Backlinks externos | 🔴 Alto | Reddit, fóruns PoE, streamers — estratégia de longo prazo |
| `Host:` directive no robots.txt | 🟢 Baixo | Ignorada pelo Google, pode remover |

---

## 6. Pagamentos

### Stripe
- Checkout via `/api/checkout/stripe`
- Webhook em `/api/webhooks/stripe` — confirma pedido e atualiza Supabase
- Bot protection: Cloudflare Turnstile em `/api/auth/validate-turnstile`

### AbacatePay (PIX — Brasil)
- Checkout via `/api/checkout/abacatepay`
- QR code gerado em `/api/pix`
- Webhook em `/api/webhooks/abacatepay`

---

## 7. Estado dos Componentes

### UI base
- **shadcn/ui** em `components/ui/` (Button, Card, Badge, Dialog, etc.)
- **Radix UI** como primitivos
- **Fontes:** Roboto + Source Sans 3 (Google Fonts, preload ativo)

### Componentes de negócio

| Componente | Descrição |
|-----------|-----------|
| `components/League/` | LeagueHero, TableOfContents, TLDRSection, MechanicAnalysis, LeagueStarters, PatchNotesSection |
| `components/product-detail.tsx` | Seletor de liga/dificuldade/versão, botão de compra |
| `components/product-card.tsx` | Card de produto com badge de estoque |
| `components/cart-dropdown.tsx` | Cart persistido em localStorage |
| `components/game-selection.tsx` | Seleção de PoE 1 ou PoE 2 na homepage |
| `components/league-selection.tsx` | Seleção de liga no hub do jogo |
| `components/PatchInfo.tsx` | Info de patch do jogo |
| `components/CurrencyInfo.tsx` | Informações de currency por jogo |

### Contexts globais (em `app/[locale]/layout.tsx`)
- `CurrencyProvider` — moeda selecionada + conversão de preços
- `CartProvider` — estado do cart, persistido em localStorage, sync entre abas

---

## 8. i18n

| Aspecto | Implementação |
|---------|--------------|
| Locales | `en` (default, sem prefixo), `pt-br` (prefixo `/pt-br/`) |
| Configuração | `next-intl` com `localePrefix: 'as-needed'` |
| Arquivos | `messages/en.json`, `messages/pt-br.json` |
| Server | `getTranslations()`, `setRequestLocale()` |
| Middleware | Encadeado com refresh de sessão Supabase |
| Hreflang | `en` + `pt-BR` + `x-default` em todas as páginas principais |

---

## 9. Utilidades SEO (`lib/utils.ts`)

| Função | Uso |
|--------|-----|
| `buildCanonical(path, locale)` | URL canônica com lowercase forçado |
| `buildAbsoluteUrl(path)` | Converte path relativo em URL absoluta |
| `getHreflangAlternates(pathsByLocale)` | Gera hreflang (⚠️ omite x-default se igual ao en — usar `languages` explícito) |
| `generateKeywords(options)` | String de keywords locale-aware |
| `buildBreadcrumbSchema(items)` | JSON-LD BreadcrumbList — **corrigido Feb 2026** |
| `buildFAQSchema(items)` | JSON-LD FAQPage |
| `generateFocusedTitle(options)` | Títulos por tipo de página |
| `generateFocusedDescription(options)` | Descrições por tipo de página |

---

## 10. Bugs Corrigidos nesta Sprint (22 Feb 2026)

| Bug | Arquivo | Fix |
|-----|---------|-----|
| `buildBreadcrumbSchema` retornava `boolean` no campo `item` | `lib/utils.ts:375` | Ternário para URL absoluta |
| Redirect 307 (temporário) na rota antiga de league | `league/[leagueSlug]/page.tsx` | Substituído por `permanentRedirect` (308) |
| x-default ausente no hreflang das league pages | `games/.../league/.../page.tsx` | Hreflang explícito com `en`, `pt-BR`, `x-default` |
| `liveLeagueQuery` sem `gameVersion` | `sanity-query.ts` | Adicionado `gameVersion` ao retorno |

---

## 11. Próximos Passos (Priorizado)

### Imediato
1. **Validar redirect www em produção** — `curl -I https://pathoftrade.net` deve retornar 301
2. **Submeter novo sitemap** no Google Search Console (league pages agora indexáveis)
3. **Testar Rich Results** no [Google Rich Results Test](https://search.google.com/test/rich-results) para produto e league

### Sprint curta
4. **Blog transacional** — mínimo 2 posts com intent comercial
5. **Internal links** — hub `/games/[gameVersion]` deve listar ligas com links
6. **`generateStaticParams` nos produtos** — pré-renderizar Divine Orb, Chaos Orb, Exalted Orb

### Médio prazo
7. **Conteúdo de produto** — popular Sanity `body` para os top 5 produtos
8. **Programmatic SEO** — landing pages de produto por liga (`/games/[gv]/league/[league]/[produto]`)
9. **Backlinks** — presença em Reddit r/pathofexile, ferramentas da comunidade PoE
