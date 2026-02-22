# SEO Audit Report — pathoftrade.net

**Data:** 22 de fevereiro de 2026
**Auditor:** Claude Code
**Escopo:** Audit técnico + on-page completo

---

## Executive Summary

**Saúde Geral: 41/100 — Problemas Críticos Bloqueando Rankings**

O site tem uma fundação decente (Cloudflare + Vercel, schema markup implementado, conteúdo estruturado) mas está sendo destruído por bugs técnicos que impedem o Google de entender e indexar as páginas corretamente. Os 5 problemas mais graves:

| # | Problema | Impacto |
|---|----------|---------|
| 1 | `pathoftrade.net` E `www.pathoftrade.net` servem 200 — conteúdo duplicado em escala | CRÍTICO |
| 2 | Hreflang só no HTTP header, não no HTML — não funciona em páginas internas | CRÍTICO |
| 3 | Blog, FAQ e game pages usam o mesmo title/meta da homepage | CRÍTICO |
| 4 | Sem páginas de produto por liga — keywords transacionais de maior conversão sem landing page | CRÍTICO |
| 5 | `Cache-Control: no-store` em todas as páginas — TTFB lento, CDN completamente bypassed | ALTO |

---

## 1. Crawlability & Indexação

### 🔴 1.1 — www vs non-www: Dois 200 OK (Conteúdo Duplicado Total)

**Impacto:** CRÍTICO

**Evidência:**
```
curl -I https://pathoftrade.net     → HTTP/1.1 200 OK
curl -I https://www.pathoftrade.net → HTTP/1.1 200 OK
```

Nenhum dos dois redireciona para o outro. O Google vê dois sites completamente separados. Todo o conteúdo é duplicado. O link equity é dividido entre as duas versões.

**Agravante:** O hreflang no HTTP header do `pathoftrade.net` aponta para `https://pathoftrade.net/` e o do `www` aponta para `https://www.pathoftrade.net/` — sinais conflitantes enviados ao Google sobre qual é o site real.

**Fix:** Adicionar redirect 301 em `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "pathoftrade.net" }],
      "destination": "https://www.pathoftrade.net/:path*",
      "permanent": true
    }
  ]
}
```

---

### 🔴 1.2 — Hreflang Só no HTTP Header, Ausente no HTML

**Impacto:** CRÍTICO

**Evidência:** `curl -I` mostra o header:
```
link: <https://pathoftrade.net/>; rel="alternate"; hreflang="en"
link: <https://pathoftrade.net/pt-br>; rel="alternate"; hreflang="pt-br"
```
Nenhuma tag `<link rel="alternate" hreflang>` detectada no HTML das páginas internas (produtos, blog, game pages). A página `/pt-br` também não mostra hreflang.

**Problema:** HTTP header hreflang tecnicamente é suportado pelo Google, mas só funciona quando o servidor responde com os headers corretos em **todas** as páginas, incluindo as páginas PT-BR apontando de volta para EN. Com Next.js no Vercel, é muito mais confiável implementar no HTML via API `alternates` do Next.js Metadata.

**Fix no Next.js 15:**
```typescript
// Em cada page.tsx
export async function generateMetadata({ params }) {
  return {
    alternates: {
      canonical: buildCanonical(path, locale),
      languages: {
        'en': `https://www.pathoftrade.net${path}`,
        'pt-BR': `https://www.pathoftrade.net/pt-br${path}`,
        'x-default': `https://www.pathoftrade.net${path}`,
      },
    },
  }
}
```

---

### 🔴 1.3 — Canonical URLs com Capitalização Incorreta

**Impacto:** ALTO

**Evidência:**
- Sitemap lista: `https://www.pathoftrade.net/products/divine-orb` (lowercase)
- Canonical na página aponta: `https://www.pathoftrade.net/products/Divine-Orb` (camelCase)

O Google trata `/divine-orb` e `/Divine-Orb` como URLs diferentes. O canonical contradiz o sitemap — sinal confuso.

**Fix:** Forçar lowercase na função `buildCanonical()` em `lib/utils.ts`:
```typescript
export function buildCanonical(path: string, locale: string) {
  return `${baseUrl}${prefix}${path.toLowerCase()}`
}
```

---

### 🔴 1.4 — Sitemap Sem Páginas de Liga (As Páginas de Maior Valor)

**Impacto:** ALTO

**Evidência:** Sitemap tem 50 URLs (25 páginas únicas). Não contém nenhuma URL de tipo `/games/path-of-exile-2/[league]` ou `/games/path-of-exile-2/[league]/[product]`.

As páginas que o usuário acessa para comprar (jogo → liga → produto) não estão no sitemap. O Google pode não priorizá-las para crawl.

**Fix:** Atualizar `next-sitemap.config.js` para incluir pages de liga usando as fetchers já existentes em `lib/sitemap-data-fetchers.js`.

---

### 🟡 1.5 — Robots.txt Bloqueando Todas as Imagens

**Impacto:** MÉDIO

**Evidência:**
```
Disallow: *.png
Disallow: *.jpg
Disallow: *.jpeg
Disallow: *.svg
Disallow: *.gif
```

Google Images completamente bloqueado. Mais importante: o Googlebot não consegue buscar as imagens dos produtos para entender o conteúdo visual das páginas (relevante para schema de Product).

**Fix:** Remover as regras de imagem. Se quiser bloquear a pasta `/_next/static/`, seja específico:
```
Disallow: /_next/static/
```

---

### 🟡 1.6 — `Host:` Directive no robots.txt é Ignorado pelo Google

**Impacto:** BAIXO

**Evidência:** `Host: https://www.pathoftrade.net/` no robots.txt.

Essa diretiva só é reconhecida pelo Yandex. Google ignora completamente. Não resolve o problema www/non-www.

**Fix:** Remover (não faz mal, mas cria falsa sensação de que o problema está resolvido).

---

## 2. Fundações Técnicas

### 🔴 2.1 — Cache Completamente Desabilitado em Todas as Páginas

**Impacto:** ALTO (Core Web Vitals / TTFB)

**Evidência:**
```
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
```

**Problema:** A CDN da Vercel (edge network) não consegue cachear nenhuma página. Cada request vai até o servidor de origem. Para usuários no Brasil acessando um servidor nos EUA, isso significa TTFB potencialmente acima de 500ms — impacto direto no LCP e na nota do Core Web Vitals.

**Fix no Next.js:**
```typescript
// Em cada page.tsx estático/semi-estático
export const revalidate = 300 // ISR a cada 5 minutos

// Ou para dados puramente estáticos:
export const dynamic = 'force-static'
```

---

### 🔴 2.2 — Múltiplos H1 por Página

**Impacto:** ALTO

**Evidência:**
- Homepage: H1 `"CHOOSE YOUR GAME"` + H1 `"Buy Path of Exile (PoE) Currency - Fast Delivery"`
- `/games/path-of-exile-2`: H1 `"SELECT YOUR LEAGUE"` + H1 `"Path of Exile 2 Major Updates"`

**Problema:** H1 é o sinal on-page mais forte de tópico principal de uma página. Dois H1s dilui o sinal. "SELECT YOUR LEAGUE" é texto de UI — não deve ser heading semântico, muito menos H1.

**Fix:** Transformar os headings de UI (`CHOOSE YOUR GAME`, `SELECT YOUR LEAGUE`) em `<div>` ou `<h2>`. O único H1 deve ser o título keyword-rich.

---

### 🟡 2.3 — Product Schema com Preço Placeholder ($1.000)

**Impacto:** MÉDIO

**Evidência:** Product schema do Divine Orb mostra `Price: $1000 USD`.

Um Divine Orb não custa $1.000. Se o schema está puxando um valor errado, o Google pode rejeitar o rich result ou mostrar um preço absurdo no SERP.

**Fix:** Validar com [Rich Results Test](https://search.google.com/test/rich-results) e garantir que o price no schema é dinâmico e reflete o preço real do produto.

---

### 🟡 2.4 — Sem Breadcrumb Schema nas Páginas de Produto e Jogo

**Impacto:** MÉDIO

Páginas de produto têm um link "Back to Products" mas sem `BreadcrumbList` schema. O Google usa breadcrumbs para mostrar a hierarquia no SERP — aumenta CTR e ajuda na compreensão da arquitetura do site.

**Fix:** Adicionar `BreadcrumbList` JSON-LD:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pathoftrade.net" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://www.pathoftrade.net/products" },
    { "@type": "ListItem", "position": 3, "name": "Divine Orb" }
  ]
}
```

---

## 3. On-Page Optimization

### 🔴 3.1 — Blog, FAQ e Game Pages com Title/Meta Duplicados da Homepage

**Impacto:** CRÍTICO

**Evidência:**

| Página | Title atual |
|--------|-------------|
| Homepage | "Buy PoE 1 & 2 Currency — Delivery in up to 30 Minutes \| Path of Trade" |
| `/blog` | **Idêntico à homepage** |
| `/faq` | **Idêntico à homepage** |
| `/games/path-of-exile-1` | **Idêntico à homepage** |

Google vê 4+ páginas com título idêntico. Sinal de baixa qualidade. Oportunidades de keyword perdidas.

**Fix:**

| Página | Title sugerido |
|--------|----------------|
| `/blog` | "Path of Exile Blog — Guides, Tips & Currency News \| Path of Trade" |
| `/faq` | "PoE Currency FAQ — Safe Buying, Delivery & Payment \| Path of Trade" |
| `/games/path-of-exile-1` | "Buy Path of Exile 1 Currency — Chaos, Divine & Exalted Orbs \| Path of Trade" |
| `/games/path-of-exile-2` | "Buy Path of Exile 2 Currency — Divine, Chaos & Exalted Orbs \| Path of Trade" |

---

### 🔴 3.2 — H1 dos Produtos Sem Intent de Compra

**Impacto:** ALTO

**Evidência:**
- `/products/divine-orb` → H1: `"Divine Orb"` (apenas o nome)
- `/products/chaos-orb` → H1: `"Chaos Orb"`

Usuário busca `"buy divine orb poe 2"` — o H1 deveria refletir esse intent.

**Fix:**
- H1: `"Buy Divine Orb for PoE 1 & 2"` ou `"Divine Orb — Buy for Path of Exile"`
- H2 de apoio: `"Fast Delivery · Best Price · 100% Safe"`

---

### 🔴 3.3 — Sem Páginas de Produto por Liga (Gap de Keyword Transacional)

**Impacto:** CRÍTICO (Revenue)

**Evidência:** Não existe nenhuma URL do tipo `/games/path-of-exile-2/settlers/divine-orb` no sitemap ou detectada durante crawl.

**Problema:** Os keywords mais valiosos são league-specific:
- `"buy divine orb poe 2 settlers"` → busca de alta conversão, sem landing page
- `"buy chaos orb path of exile 2 settlers of kalguur"` → sem landing page
- `"divine orb settlers league price"` → sem landing page

Concorrentes como currency.to e odealo.com têm páginas dedicadas por liga.

**Fix:** Criar programaticamente páginas de landing por combinação `game + league + product`. Já existe a estrutura de ligas no Supabase — é só gerar as rotas e incluí-las no sitemap.

---

### 🟡 3.4 — Conteúdo Thin nas Páginas de Produto

**Impacto:** ALTO

**Evidência:**
- Chaos Orb: ~165 palavras de conteúdo único
- Exalted Orb: ~200 palavras
- Divine Orb: ~500-600 palavras (melhor, mas ainda fraco)

Os templates são muito similares entre si. Concorrentes como odealo.com têm 800-1.500+ palavras com guias de uso, tabelas de preço, e contexto específico de liga.

**Fix por produto:**
- O que é e para que serve (mecânica específica do jogo)
- Preço atual e variação por liga
- Como usar de forma eficiente no jogo
- Safe buying guide
- FAQ específico do produto com schema FAQPage

---

### 🟡 3.5 — Title dos Produtos Genérico e Sem Versão do Jogo

**Impacto:** MÉDIO

**Evidência:**
- `"Buy Divine Orb | Low Price & Fast Delivery | Path of Trade"`
- `"Buy Chaos Orb | Low Price & Fast Delivery | Path of Trade"`

O segmento `"Low Price & Fast Delivery"` é idêntico em todos — desperdiça espaço. Não menciona PoE 1 ou PoE 2.

**Fix:**
- `"Buy Divine Orb PoE 1 & 2 — Best Price | Path of Trade"`
- `"Buy Chaos Orb for PoE 2 — Instant Delivery | Path of Trade"`

---

## 4. Content Quality

### 🔴 4.1 — Blog Só Tem Conteúdo Informacional, Nada Transacional

**Impacto:** ALTO

**Evidência:** Posts: Guia Delve/Fossil, Guia Heist, Item Filter, Bandit Quest, Patch 3.27. Todos são guias de gameplay, sem intenção comercial.

**Problema:** Esses posts atraem jogadores buscando dicas — não necessariamente compradores. Faltam artigos que conectam conhecimento do jogo com a decisão de compra.

**Fix — Conteúdo a criar:**

| Tipo | Exemplo de título | Intent |
|------|-------------------|--------|
| Comparativo | "Best Sites to Buy PoE 2 Currency in 2026" | Comercial |
| Segurança | "Is Buying PoE Currency Safe? The Real Answer" | Informacional→Comercial |
| Guia de compra | "PoE 2 Currency Buying Guide: Prices, Safety & Fast Delivery" | Comercial |
| Liga-específico | "Settlers of Kalguur Economy: Best Currencies to Buy" | Comercial |
| Farming vs Buying | "PoE 2 Farming Divine Orbs vs Buying: Which is Faster?" | Comercial |

---

### 🟡 4.2 — Conteúdo Desatualizado (Posts de maio-outubro 2025)

**Impacto:** MÉDIO

**Evidência:** Post mais recente no sitemap: "Keepers of the Flame" (patch 3.27, outubro 2025). Nenhum conteúdo de 2026 visível.

Path of Exile é um jogo ativo com novas ligas e patches frequentes. Frescor de conteúdo é sinal de site ativo.

**Fix:** Meta de 2 posts por mês. Priorizar conteúdo de liga atual.

---

### 🟡 4.3 — E-E-A-T Fraco para Nicho YMYL-Adjacent

**Impacto:** MÉDIO

Sites de trading de currency de jogos por dinheiro real têm scrutiny elevado do Google (categoria próxima a YMYL — transações financeiras). Os sinais de confiança da homepage são genéricos ("4.9 rating, 1000+ reviews").

**Fix:**
- Página "About Us" com história da empresa e razões de confiança
- Metodologia de entrega explicada detalhadamente
- Política de reembolso clara e acessível
- Número de ordens completadas com sucesso (social proof real)

---

## 5. Authority & Links

### 🔴 5.1 — Google Search Console Não Configurado

**Impacto:** CRÍTICO (visibilidade zero)

Sem GSC: sem dados de indexação, sem erros de cobertura, sem keywords, sem Core Web Vitals field data, sem alertas de problemas.

**Fix:** Configurar GSC hoje. É a primeira ação da lista. Submeter `https://www.pathoftrade.net/sitemap.xml` após configurar.

---

### 🔴 5.2 — Perfil de Backlinks Provavelmente Mínimo (Site Inicial)

**Impacto:** ALTO

Concorrentes como currency.to, odealo.com, playerauctions.com têm milhares de backlinks de comunidades PoE (Reddit, fóruns, wikis, YouTube).

**Fix — Estratégia de link building:**
1. **Reddit /r/pathofexile** — Participar com valor genuíno. Responder perguntas sobre currency trading.
2. **PoE wikis e fóruns** — Contribuir com guias e incluir referências naturais
3. **Ferramentas úteis** — Currency calculators, price trackers atraem links naturais
4. **Parceria com streamers/YouTubers de PoE** — Patrocínio ou product placement
5. **Gaming press** — PR sobre o site

---

## Prioritized Action Plan

### Semana 1 — Bloqueadores Críticos

| Prioridade | Ação | Esforço |
|------------|------|---------|
| P1 | Configurar Google Search Console e submeter sitemap | 30 min |
| P2 | Redirect 301 de `pathoftrade.net` → `www.pathoftrade.net` via `vercel.json` | 1h |
| P3 | Implementar hreflang no HTML via `alternates` API do Next.js 15 em todas as pages | 3h |
| P4 | Corrigir titles/meta duplicados: blog, FAQ, game pages | 2h |
| P5 | Corrigir canonical lowercase em `buildCanonical()` | 30 min |
| P6 | Corrigir múltiplos H1 por página (transformar headings de UI em `<div>` ou `<h2>`) | 2h |

---

### Semana 2-3 — Alto Impacto

| Prioridade | Ação |
|------------|------|
| P7 | Ativar ISR/caching nas pages (`export const revalidate = 300`) para eliminar `no-store` |
| P8 | Corrigir robots.txt: remover bloqueio de imagens |
| P9 | Validar Product schema com Rich Results Test e corrigir preço ($1.000 placeholder) |
| P10 | Adicionar BreadcrumbList schema nas páginas de produto e jogo |
| P11 | Melhorar H1s dos produtos para incluir intent de compra |
| P12 | Expandir conteúdo das páginas de produto (Chaos Orb: 165 palavras — crítico) |

---

### Mês 1-2 — Growth

| Prioridade | Ação |
|------------|------|
| P13 | Criar páginas de produto por liga (game + league + currency) — programmatic SEO |
| P14 | Publicar 3 artigos de blog com intent comercial (is it safe, best site, buying guide) |
| P15 | Adicionar league pages e league+product URLs ao sitemap |
| P16 | Fortalecer About page com E-E-A-T signals |
| P17 | Iniciar estratégia de link building (Reddit, YouTube, ferramentas) |

---

## Quick Wins (impacto em menos de 48h de indexação)

1. **301 redirect www** — resolve conteúdo duplicado do site inteiro imediatamente
2. **GSC + sitemap submission** — Google re-crawla em dias
3. **Titles únicos** para blog/FAQ/game pages — melhoria de CTR visível em 2-4 semanas
4. **Remover `no-store` do Cache-Control** — TTFB melhora imediatamente para usuários globais

---

## Notas Finais

O esqueleto do site está correto — arquitetura Next.js, Cloudflare, schema markup, conteúdo em dois idiomas, blog. O problema é que **vários sinais SEO fundamentais estão quebrados silenciosamente**: o Google está crawleando dois sites ao invés de um, o hreflang não está chegando nas páginas internas, e os meta tags das páginas de conteúdo estão errados.

A boa notícia: todos os problemas críticos são corrigíveis em código que já existe no projeto (`lib/utils.ts`, `next.config.ts`, `vercel.json`, page metadata). Não precisa refatorar nada — são ajustes pontuais de alto impacto.
