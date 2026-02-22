# SEO Progress Tracker — pathoftrade.net

**Audit score inicial:** 41/100  
**Última atualização:** 22 de fevereiro de 2026

---

## Legenda

| Ícone | Status |
|-------|--------|
| ✅ | Concluído e deployado |
| 🔄 | Parcialmente feito / pendente validação |
| ❌ | Não iniciado |

---

## 1. Crawlability & Indexação

| # | Problema | Impacto | Status | Detalhe |
|---|----------|---------|--------|---------|
| 1.1 | www vs non-www — dois 200 OK (conteúdo duplicado) | 🔴 CRÍTICO | ✅ | Redirect 301 `pathoftrade.net → www` adicionado em `vercel.json` |
| 1.2 | Hreflang só no HTTP header, ausente no HTML | 🔴 CRÍTICO | 🔄 | Implementado via `alternates` API do Next.js em homepage, FAQ, Contact, About, produto e game pages. Verificar se está correto em todas as páginas internas |
| 1.3 | Canonical URLs com capitalização incorreta | 🔴 ALTO | ✅ | `buildCanonical()` atualizado para forçar lowercase via `.toLowerCase()` |
| 1.4 | Sitemap sem páginas de liga | 🔴 ALTO | 🔄 | `next-sitemap.config.js` atualizado com `alternateRefs` e PoE 2 query params. Páginas `/games/[version]/[league]` ainda não incluídas |
| 1.5 | robots.txt bloqueando todas as imagens | 🟡 MÉDIO | ❌ | Disallow `*.png`, `*.jpg` etc. ainda presente |
| 1.6 | `Host:` directive no robots.txt ignorada pelo Google | 🟡 BAIXO | ❌ | Não removida ainda |

---

## 2. Fundações Técnicas

| # | Problema | Impacto | Status | Detalhe |
|---|----------|---------|--------|---------|
| 2.1 | Cache desabilitado (`no-store`) em todas as páginas | 🔴 ALTO | 🔄 | `revalidate = 300` adicionado em FAQ, Contact, About pages. Páginas de produto, game e blog ainda a verificar |
| 2.2 | Múltiplos H1 por página | 🔴 ALTO | ✅ | `<h1>CHOOSE YOUR GAME</h1>` → `<p>` em `game-selection.tsx`. `<h1>SELECT YOUR LEAGUE</h1>` → `<p>` em `league-selection.tsx` (ambas as instâncias) |
| 2.3 | Product schema com preço placeholder ($1.000) | 🟡 MÉDIO | ✅ | Preço dinâmico do produto real; `in_stock` resolve a raiz do problema (preço 1000 era workaround) |
| 2.4 | Sem BreadcrumbList schema nas páginas de produto e jogo | 🟡 MÉDIO | ✅ | `buildBreadcrumbSchema()` adicionado em `lib/utils.ts` e injetado em product pages, game pages e blog posts |

---

## 3. On-Page Optimization

| # | Problema | Impacto | Status | Detalhe |
|---|----------|---------|--------|---------|
| 3.1 | Blog, FAQ e game pages com title/meta duplicados da homepage | 🔴 CRÍTICO | ✅ | Titles únicos implementados: game pages (`/games/path-of-exile-1`, `/games/path-of-exile-2`), FAQ, Contact, Blog index |
| 3.2 | H1 dos produtos sem intent de compra | 🔴 ALTO | ✅ | H1 atualizado para `"Buy [Name] — Path of Exile 1/2"` em `product-detail.tsx` |
| 3.3 | Sem páginas de produto por liga (gap de keyword transacional) | 🔴 CRÍTICO | ❌ | Maior oportunidade de crescimento. Requer programmatic SEO com rotas `/games/[version]/[league]/[product]` |
| 3.4 | Conteúdo thin nas páginas de produto (~165-600 palavras) | 🟡 ALTO | ❌ | Chaos Orb ~165 palavras. Ideal: 800-1500+ com guia de uso, FAQ por produto com FAQPage schema |
| 3.5 | Title dos produtos genérico e sem versão do jogo | 🟡 MÉDIO | 🔄 | Template atualizado para incluir PoE 1/2. Validar se `generateMetadata` está sendo chamado corretamente |

---

## 4. Content Quality

| # | Problema | Impacto | Status | Detalhe |
|---|----------|---------|--------|---------|
| 4.1 | Blog só tem conteúdo informacional, nada transacional | 🔴 ALTO | ❌ | Criar: "Best Sites to Buy PoE 2 Currency", "Is Buying PoE Currency Safe?", "Settlers of Kalguur Economy Guide" |
| 4.2 | Conteúdo desatualizado (posts de maio-outubro 2025) | 🟡 MÉDIO | ❌ | Meta: 2 posts/mês com conteúdo de liga atual |
| 4.3 | E-E-A-T fraco (sinais de confiança genéricos) | 🟡 MÉDIO | ✅ | Página About Us criada (`/about` e `/pt-br/about`) com seções: Quem Somos, Por que confiar, Como funciona, Compromisso, Estatísticas |

---

## 5. Authority & Links

| # | Problema | Impacto | Status | Detalhe |
|---|----------|---------|--------|---------|
| 5.1 | Google Search Console não configurado | 🔴 CRÍTICO | 🔄 | GSC configurado com service account. Verificar se a propriedade `www.pathoftrade.net` está verificada e sitemap submetido |
| 5.2 | Perfil de backlinks mínimo | 🔴 ALTO | ❌ | Estratégia de longo prazo: Reddit, PoE fóruns, streamers, ferramentas úteis |

---

## Extras Implementados (não no audit original)

| Funcionalidade | Descrição | Arquivos |
|----------------|-----------|----------|
| **Stock Management** | Campo `in_stock` no Supabase. Badge "Out of Stock" + botões desabilitados na listagem e detalhe. Toggle no admin dashboard | `lib/interface.ts`, `components/product-card.tsx`, `components/product-detail.tsx`, `admin/dashboard/components/DashboardViews.tsx`, `api/admin/products/update/route.ts` |
| **Organization Schema** | JSON-LD `Organization` com contactPoint na página About | `app/[locale]/(site)/about/page.tsx` |
| **Fake aggregateRating removido** | Rating fabricado removido do schema da homepage para evitar penalidade | `app/[locale]/page.tsx` |
| **Footer About link** | Link "About Us" no footer corrigido de `#` para `/about` | `components/footer.tsx` |

---

## Próximos Passos Prioritários

### 🔥 Imediato (já pode fazer hoje)

1. **robots.txt** — remover `Disallow: *.png`, `*.jpg`, `*.jpeg`, `*.svg`, `*.gif` e a diretiva `Host:`
2. **Supabase SQL** — rodar `UPDATE products SET in_stock = true WHERE in_stock IS NULL;`
3. **GSC** — confirmar que sitemap `https://www.pathoftrade.net/sitemap.xml` está submetido e a propriedade `www` verificada

### 📅 Próxima sprint

4. **`revalidate = 300`** nas pages que ainda não têm (product pages, game pages, blog) para resolver o `Cache-Control: no-store`
5. **Sitemap de ligas** — adicionar URLs de `/games/[version]` com parâmetros de liga ao `next-sitemap.config.js`
6. **Conteúdo das páginas de produto** — expandir Chaos Orb, Divine Orb (Portable Text via Sanity ou campo `body` existente)

### 📈 Mês 1-2

7. **Programmatic SEO** — landing pages por liga (`/games/path-of-exile-2/Settlers-of-Kalguur/divine-orb`) com dados reais do Supabase
8. **Blog transacional** — 3 artigos com intent comercial
9. **FAQPage schema** por produto

---

## Pendência Técnica Crítica

> ⚠️ O **redirect www** no `vercel.json` precisa ser **validado em produção** (`curl -I https://pathoftrade.net` deve retornar `301 → www`). Confirmar antes de continuar outras melhorias, pois todos os links equity dependem disso.
