# Estado Atual do Projeto — PathOfTrade

> Atualizado em: 25/02/2026
> Caminho: `c:\Users\alexa\Documents\poetrade-dev`

---

## Visão Geral

**PathOfTrade** é uma plataforma de e-commerce e ferramentas focada no jogo *Path of Exile* (PoE 1 e PoE 2). O site permite comprar moedas, itens e serviços do jogo, além de oferecer guias de ligas, blog, comparação de preços e ferramentas como o visualizador de builds (PoB). Suporte a dois idiomas (EN e PT-BR) e dois métodos de pagamento (Stripe e PIX via AbacatePay).

**Domínio de produção:** `pathoftrade.net`

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 18, Tailwind CSS 3, Radix UI, Framer Motion |
| Linguagem | TypeScript 5.7 |
| Auth + DB | Supabase (Auth, PostgreSQL, RLS) |
| CMS | Sanity v3 (hosted studio em `/admin/studio`) |
| i18n | next-intl (EN + PT-BR) |
| Pagamentos | Stripe + AbacatePay (PIX) |
| Email | Resend |
| Formulários | React Hook Form + Zod |
| Tabelas | TanStack Table |
| Gráficos | Recharts |
| Analytics | Vercel Analytics + Speed Insights |
| Live chat | Tawk.to |
| Anti-bot | Cloudflare Turnstile |
| SEO | next-sitemap + script de análise de keywords |
| Deploy | Vercel (inferido) |

---

## Estrutura de Pastas

```
poetrade-dev/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── admin/              # Gestão (leagues, products, orders)
│   │   ├── auth/               # Validação Turnstile
│   │   ├── checkout/           # Verificação de checkout
│   │   ├── orders/             # CRUD de pedidos + PIX
│   │   ├── pix/                # Criação e verificação de QRCode PIX
│   │   ├── tools/              # Ferramentas PoE (preços, gems, items, PoB)
│   │   └── webhooks/           # Stripe, AbacatePay, Sanity
│   └── [locale]/               # Páginas com i18n
│       ├── (site)/             # Grupo: loja pública
│       │   ├── games/          # Listagem de produtos por jogo/liga
│       │   ├── products/       # Detalhe de produto
│       │   ├── league/         # Guias de liga
│       │   ├── blog/           # Blog (Sanity)
│       │   ├── cart/           # Carrinho
│       │   ├── orders/         # Histórico de pedidos
│       │   ├── tools/          # Ferramentas (PoB, price comparison, price tracker)
│       │   ├── auth/           # Login, signup, OAuth
│       │   ├── faq, contact, about, privacy, terms
│       │   └── success/        # Pós-checkout
│       └── admin/              # Painel administrativo
│           ├── dashboard/
│           ├── manage-leagues/
│           ├── manage-products/
│           ├── orders/
│           └── studio/         # Sanity Studio embutido
├── components/                 # Componentes globais
│   ├── ui/                     # shadcn/ui (30+ componentes)
│   ├── Blog/                   # Componentes de blog
│   ├── League/                 # Componentes de guia de liga
│   ├── PriceTracker/           # Tracker de preços
│   └── Product/                # Gráfico de histórico de preço
├── lib/
│   ├── interface.ts            # Interface Product, PageProps
│   ├── pob-parser.ts           # Parser de builds PoB
│   ├── contexts/               # CartContext, CurrencyContext
│   ├── db/index.ts             # Supabase client
│   └── validations/            # Schemas Zod (checkout, ticket)
├── sanity/
│   ├── schemas/                # Schemas Sanity
│   ├── sanity-query.ts         # Queries GROQ
│   └── lib/                    # Cliente Sanity, imagens, live
├── supabase/migrations/        # Migrations SQL
├── types/                      # Interfaces TypeScript globais
├── utils/supabase/             # Helpers Supabase (client, server, admin, middleware)
├── hooks/                      # use-toast
├── i18n/                       # Configuração next-intl (EN + PT-BR)
├── messages/                   # Strings de tradução
├── scripts/                    # Scripts utilitários
└── public/                     # Assets estáticos
```

---

## Banco de Dados (Supabase)

### Tabelas

| Tabela | Descrição |
|---|---|
| `products` | Produtos sincronizados do Sanity (moedas, itens, serviços) |
| `orders` | Pedidos com status, itens, pagamento Stripe/PIX |
| `currency_rates` | Taxas de câmbio BRL/USD/EUR com função SQL de conversão |
| `pob_builds` | Builds do Path of Building compartilhados por hash curto (geradas por usuários via PoB Viewer) |
| `builds` | **[NOVO]** Builds curadas pelo admin com guia, tags, ascendência, código PoB — ver `docs/BUILDS_FEATURE.md` |
| `items` | Dados completos de itens PoE (via PoE Wiki Cargo) |
| `skill_gems` | Dados de skill gems PoE (atributos, tags, variantes) |

### Políticas RLS

Todas as tabelas têm RLS ativado. Padrão:
- Leitura pública (`SELECT` para todos)
- Escrita restrita a `service_role` ou usuários autenticados

---

## Sanity CMS — Schemas

| Schema | Descrição |
|---|---|
| `post` | Posts do blog (com i18n EN/PT-BR) |
| `author` | Autores do blog |
| `category` | Categorias de posts |
| `league` | Guias completos de ligas PoE |
| `product` | Produtos da loja (sincronizados com Supabase) |
| `blockContent` | Conteúdo rich text (Portable Text) |
| `code` | Bloco de código |
| `table` | Tabelas em conteúdo |

**i18n Sanity:** EN + PT-BR nos schemas `post`, `author`, `category`  
**Studio:** acessível em `/admin/studio`

---

## API Routes

### Públicas / Loja

| Rota | Método | Descrição |
|---|---|---|
| `/api/orders` | GET | Lista pedidos |
| `/api/orders/create` | POST | Cria pedido |
| `/api/orders/update` | POST | Atualiza status do pedido |
| `/api/orders/find-order/[id]` | GET | Busca pedido por ID |
| `/api/orders/by-pix/[id]` | GET | Busca pedido pelo QRCode PIX |
| `/api/pix/create` | POST | Gera QRCode PIX (AbacatePay) |
| `/api/pix/check` | POST | Verifica pagamento PIX |
| `/api/pix/by-order/[orderId]` | GET | Retorna PIX de um pedido |
| `/api/checkout/verify` | POST | Verifica sessão Stripe |
| `/api/send-email` | POST | Envia e-mail via Resend |
| `/api/create-ticket` | POST | Abre ticket de suporte |
| `/api/products/[slug]/history` | GET | Histórico de preço de produto |
| `/api/auth/validate-turnstile` | POST | Valida token Cloudflare Turnstile |
| `/api/revalidate` | POST | Revalida cache Next.js |

### Ferramentas

| Rota | Método | Descrição |
|---|---|---|
| `/api/tools/prices` | GET | Preços de mercado (poe.ninja) enriquecidos com produtos da loja |
| `/api/tools/prices/snapshot` | POST | Snapshot de preços |
| `/api/tools/poe-gems` | GET | Busca/filtra skill gems com join `items + skill_gems` |
| `/api/tools/poe-gems/info` | GET | Info detalhada de gem |
| `/api/tools/poe-items` | GET | Busca itens PoE |
| `/api/tools/poe-items/[name]` | GET | Detalhes de item por nome |
| `/api/tools/pob-viewer` | POST | Processa build PoB |
| `/api/tools/pob-viewer/share` | POST | Compartilha build (hash curto) |
| `/api/tools/leagues` | GET | Lista ligas ativas |

### Admin

| Rota | Método | Descrição |
|---|---|---|
| `/api/admin/leagues` | GET/POST | Gerencia ligas |
| `/api/admin/leagues/create` | POST | Cria liga |
| `/api/admin/leagues/clone` | POST | Clona liga |
| `/api/admin/leagues/delete` | DELETE | Remove liga |
| `/api/admin/products/update` | POST | Atualiza produto |
| `/api/admin/products/delete` | DELETE | Remove produto |
| `/api/admin/orders` | GET | Lista pedidos (admin) |
| `/api/admin/sync-ninja` | POST | Sincroniza preços poe.ninja |
| `/api/admin/builds` | GET | Lista todas as builds (incluindo rascunhos) |
| `/api/admin/builds` | POST | Cria nova build curada |
| `/api/admin/builds/[id]` | PATCH | Edita build (qualquer campo, incluindo toggle is_published) |
| `/api/admin/builds/[id]` | DELETE | Remove build |

### Webhooks

| Rota | Descrição |
|---|---|
| `/api/webhooks/stripe` | Eventos Stripe (payment_intent.succeeded, failed, canceled) |
| `/api/webhooks/abacatepay` | Confirmação de pagamento PIX |
| `/api/webhooks/sanity-product` | Sincroniza produto Sanity → Supabase |

---

## Funcionalidades

### Loja
- Produtos organizados por **jogo** (PoE 1 / PoE 2), **liga** e **dificuldade** (softcore / hardcore)
- Categorias: currency, items, services
- Carrinho de compras (Context API)
- Checkout via **Stripe** (cartão) ou **PIX** (AbacatePay)
- Histórico de pedidos por usuário
- Página de sucesso pós-compra
- Indicador de moeda (BRL/USD/EUR com conversão automática)

### Ferramentas
- **Price Tracker** — rastreia histórico de preços de itens PoE
- **Price Comparison** — compara preços entre fontes (poe.ninja vs loja)
- **PoB Viewer** — visualiza e compartilha builds do Path of Building
- **Gem Browser** — busca e filtra skill gems com dados da Wiki PoE

### Builds **[NOVO — fev/2026]**
- Listagem pública em `/builds` com filtros (gameVersion, league, class, ascendancy, tags)
- Página individual `/builds/[slug]` com guia completo, stats e botão "Open in PoB Viewer"
- Imagem da ascendência por upload ou fallback automático do CDN do PoE
- Admin CRUD em `/admin/dashboard` → seção "Builds"
- SEO completo: canonical, hreflang, JSON-LD ItemList + Article
- Incluso no sitemap automático
- Ver documentação detalhada: `docs/BUILDS_FEATURE.md`

### Blog
- Posts com Portable Text (Sanity)
- Categorias, autores, paginação
- Suporte a EN e PT-BR
- Associação por versão do jogo (`gameVersion`)

### Guias de Liga
- Seções: TL;DR, mecânicas, patch notes, builds iniciais, ascendências, moedas em destaque
- Status: `live`, `upcoming`, `ended`
- Gerado dinamicamente a partir do Sanity

### Admin
- Dashboard com visão de pedidos e métricas
- Gerenciamento de ligas (criar, clonar, editar, deletar)
- Gerenciamento de produtos (editar, deletar, sincronizar com poe.ninja)
- Visualização de pedidos
- **Gerenciamento de Builds** — criar, publicar/despublicar e excluir builds curadas **[NOVO]**
- Sanity Studio embutido em `/admin/studio`

### Auth
- Login/Signup com e-mail + senha
- OAuth providers
- Esqueci minha senha / atualizar senha
- Proteção por Cloudflare Turnstile
- Sessão gerenciada pelo Supabase SSR

---

## i18n

- **Idiomas:** `en` (padrão), `pt-br`
- **Prefixo de URL:** `as-needed` (sem prefixo para EN, `/pt-br/...` para PT-BR)
- **Middleware:** intercepta todas as rotas exceto `/api/`, `/_next/`, arquivos estáticos
- **Sanity:** blog, autores e categorias traduzidos via `@sanity/document-internationalization`

---

## Scripts Utilitários

| Script | Descrição |
|---|---|
| `analyze-keywords.js` | Analisa keywords SEO de todas as páginas geradas (executado no `postbuild`) |
| `sync-wiki-to-sanity.ts` | Sincroniza dados da PoE Wiki para o Sanity |
| `backfill-ninja-history.ts` | Preenche histórico de preços do poe.ninja |
| `download-images.ts` | Baixa imagens de itens |
| `download-gems-jewels.ps1` | Baixa imagens de gems e joias |
| `download-keystones.ps1` / `download-masteries.ps1` | Baixa keystones/masteries |
| `convert-to-webp.js` | Converte imagens para WebP |
| `upscale-all.ts` / `test-upscale.ts` | Upscala imagens com `upscayl-node` |
| `clear-sanity-products.ts` | Limpa produtos no Sanity |
| `create-league.js` / `delete-league.js` | Gerencia ligas via script |
| `check-db.ts` / `debug-db.ts` | Diagnóstico do banco de dados |

---

## Configurações Relevantes

### next.config.ts
- Imagens remotas permitidas: `cdn.sanity.io`, `web.poecdn.com`
- `experimental.useCache: true`
- `typescript.ignoreBuildErrors: true` ⚠️

### next-sitemap
- Gerado automaticamente no `postbuild`

### Tailwind
- Plugin `@tailwindcss/typography` (conteúdo blog)
- Plugin `tailwindcss-animate`

---

## Observações e Pontos de Atenção

| # | Observação |
|---|---|
| 1 | `typescript.ignoreBuildErrors: true` no `next.config.ts` — erros de tipo são ignorados no build |
| 2 | Join manual entre `items` e `skill_gems` em `/api/tools/poe-gems` (sem FK direta) |
| 3 | Tabela `pob_builds` armazena o código PoB completo em texto — pode crescer bastante |
| 4 | `currency_rates` com taxas hardcoded (BRL/USD = 0.2 → 1 USD = 5 BRL) — não é atualizada automaticamente |
| 5 | Sem cobertura de testes (sem `jest`, `vitest` ou `playwright` no projeto) |
| 6 | Sanity Studio em `/admin/studio` sem proteção de rota visível além da autenticação Sanity |
| 7 | Script `postbuild` encadeia `next-sitemap` e `analyze-keywords.js` |
| 8 | `upscayl-node` como dependência de produção (binário pesado) |
| 9 | Tabela `builds` criada mas **migration ainda não aplicada** — rodar `supabase db push` ou SQL manual no Studio antes de usar |
| 10 | CDN URLs de ascendência em `lib/builds-data.ts` são estáticas — se a GGG mudar os paths, atualizar o mapa manualmente |
