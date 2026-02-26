# Feature: Builds Page

> Implementado em: 25/02/2026

Página de builds curadas de Path of Exile, com listagem filtrada, páginas individuais com guia e integração com o PoB Viewer.

---

## Sumário

1. [Arquitetura](#arquitetura)
2. [Configuração inicial (migration)](#configuração-inicial)
3. [Como usar — Admin](#como-usar--admin)
4. [Como usar — Páginas Públicas](#como-usar--páginas-públicas)
5. [Integração com PoB Viewer](#integração-com-pob-viewer)
6. [Estratégia de Imagens](#estratégia-de-imagens)
7. [SEO](#seo)
8. [Próximos Passos](#próximos-passos)

---

## Arquitetura

```
Supabase (tabela `builds`)
        │
        ├── app/actions.ts          → server actions (getBuilds, getBuildBySlug, ...)
        │
        ├── app/api/admin/builds/   → CRUD admin (auth required)
        │
        ├── app/[locale]/(site)/builds/
        │   ├── page.tsx            → listagem pública (server)
        │   ├── BuildsClient.tsx    → filtros + grid (client)
        │   └── [slug]/page.tsx     → página individual (server)
        │
        └── components/Builds/
            ├── AscendancyImage.tsx → imagem com fallback CDN
            ├── BuildCard.tsx       → card na listagem
            ├── BuildFilters.tsx    → filtros (URL search params)
            ├── BuildHero.tsx       → hero da página individual
            └── BuildGuide.tsx      → renderiza Markdown do guia
```

### Arquivos-chave

| Arquivo | Responsabilidade |
|---------|-----------------|
| `supabase/migrations/20260225100000_create_builds.sql` | Schema da tabela `builds` |
| `lib/builds-data.ts` | Classes, ascendências, tags e CDN fallback URLs |
| `lib/interface.ts` | Interface TypeScript `Build` |
| `app/actions.ts` | Server actions de leitura pública |
| `app/api/admin/builds/route.ts` | GET (lista tudo) + POST (cria) |
| `app/api/admin/builds/[id]/route.ts` | PATCH (edita) + DELETE (remove) |

---

## Configuração Inicial

### 1. Aplicar a migration no Supabase

**Via CLI:**
```bash
supabase db push
```

**Via Supabase Studio (SQL Editor):**
1. Abrir `supabase/migrations/20260225100000_create_builds.sql`
2. Copiar o conteúdo
3. Colar no SQL Editor do projeto e executar

### 2. Verificar

No Supabase Studio → Table Editor, a tabela `builds` deve aparecer com as colunas:

```
id, title, slug, description, game_version, league, class, ascendancy,
main_skill, tags, difficulty, budget, pob_code, pob_hash, image_url,
video_url, guide_content, seo_title, seo_description, is_published,
author, created_at, updated_at
```

---

## Como Usar — Admin

### Acessar

`/admin/dashboard` → sidebar → seção **"Builds"**

Dois itens disponíveis:
- **Gerenciar Builds** — lista todas as builds (publicadas + rascunhos)
- **Nova Build** — formulário de criação

### Criar uma Build

1. Clique em **Nova Build** na sidebar
2. Preencha os campos obrigatórios (**\***):
   - **Título\*** — nome descritivo (ex: "Hexblast Mines Saboteur")
   - **Slug\*** — gerado automaticamente do título (pode editar). Usado na URL: `/builds/hexblast-mines-saboteur`
   - **Versão do Jogo\*** — Path of Exile 1 ou 2
   - **Classe\*** — carregada dinamicamente pela versão do jogo
   - **Ascendência\*** — carregada dinamicamente pela classe
   - **Código PoB\*** — o código base64 exportado do Path of Building
3. Preencha os campos opcionais conforme desejado:
   - **Liga** — ex: "Phrecia", "Standard"
   - **Skill Principal** — ex: "Hexblast"
   - **Tags** — checkboxes: League Starter, Endgame, Boss Killer, Speed Farm, SSF Viable, Hardcore
   - **Dificuldade** — Fácil / Médio / Difícil
   - **Budget** — Barato / Médio / Caro
   - **URL da Imagem** — URL externa. Se vazio, usa fallback do CDN do PoE
   - **URL do Vídeo** — YouTube (ex: `https://youtube.com/watch?v=XXXX`)
   - **Guia (Markdown)** — conteúdo longo em Markdown
   - **SEO Title / Description** — se vazios, usa title/description da build
   - **Autor** — nome exibido no guia
4. Marque **"Publicar imediatamente"** para tornar a build visível
5. Clique em **Criar Build**

### Gerenciar Builds Existentes

Na tela **Gerenciar Builds**:

| Ação | Botão |
|------|-------|
| Publicar / Despublicar | Ícone de olho (Eye/EyeOff) |
| Excluir | Ícone de lixeira (com confirmação) |
| Filtrar por versão | Select no topo |

> **Nota:** edição completa (todos os campos) ainda não implementada via UI — está nos próximos passos.

### Como obter o Código PoB

1. Abrir o Path of Building
2. Carregar ou montar a build
3. `File` → `Export Build` → copiar o código base64
4. Colar no campo **Código PoB** do formulário

---

## Como Usar — Páginas Públicas

### Listagem: `/builds`

URL: `https://pathoftrade.net/builds`
PT-BR: `https://pathoftrade.net/pt-br/builds`

**Filtros disponíveis via URL search params:**

| Param | Exemplo | Descrição |
|-------|---------|-----------|
| `gameVersion` | `path-of-exile-1` | Filtra por versão do jogo |
| `league` | `Phrecia` | Filtra por liga |
| `class` | `Shadow` | Filtra por classe |
| `ascendancy` | `Saboteur` | Filtra por ascendência |
| `tags` | `league-starter,ssf-viable` | Filtra por tags (vírgula para múltiplas) |
| `search` | `hexblast` | Busca no título |
| `page` | `2` | Paginação (12 builds por página) |

**Exemplo de URL filtrada:**
```
/builds?gameVersion=path-of-exile-1&tags=league-starter&class=Shadow
```

### Página Individual: `/builds/[slug]`

URL: `https://pathoftrade.net/builds/hexblast-mines-saboteur`

**Conteúdo exibido:**
1. Breadcrumb: Home > Builds > [Build Name]
2. Hero com imagem da ascendência + título + tags + botão **"Open in PoB Viewer"**
3. Badges: classe, ascendência, skill principal, liga
4. Stats: dificuldade, budget, autor
5. Embed do YouTube (se `video_url` preenchido)
6. Guia em Markdown (se `guide_content` preenchido)

---

## Integração com PoB Viewer

O botão **"Open in PoB Viewer"** na página individual abre:

```
/tools/pob-viewer?code=<pob_code_url_encoded>
```

O PoB Viewer detecta o parâmetro `?code=` automaticamente e carrega a build sem que o usuário precise colar nada.

**Fluxo completo:**
```
Usuário acessa /builds/hexblast-mines-saboteur
        → Clica em "Open in PoB Viewer"
        → Abre /tools/pob-viewer?code=eNq...
        → Viewer carrega e exibe stats, gear, gems, árvore
```

---

## Estratégia de Imagens

O componente `AscendancyImage` funciona com 3 camadas de fallback:

```
1. image_url (upload customizado pelo admin)
        ↓ (se vazio ou erro de carregamento)
2. CDN do PoE: web.poecdn.com/.../Ascendancy/Saboteur.png
        ↓ (se CDN falhar)
3. Placeholder: quadrado com inicial da ascendência
```

**Recomendação:** usar imagens customizadas (screenshots do jogo, arte oficial) para melhor visual. O CDN do PoE como fallback garante que nenhuma build fique sem imagem.

---

## SEO

### Página de Listagem `/builds`

```html
<title>Best Path of Exile Builds — PoE Build Guides | Path of Trade</title>
<meta name="description" content="Browse curated Path of Exile builds...">
<link rel="canonical" href="https://pathoftrade.net/builds">
<link rel="alternate" hreflang="en" href="https://pathoftrade.net/builds">
<link rel="alternate" hreflang="pt-BR" href="https://pathoftrade.net/pt-br/builds">
<link rel="alternate" hreflang="x-default" href="https://pathoftrade.net/builds">
```

JSON-LD: `ItemList` com todas as builds da página atual.

### Página Individual `/builds/[slug]`

```html
<title>[SEO Title ou Title] — PoE Build Guide | Path of Trade</title>
```

JSON-LD: `BreadcrumbList` + `Article` (com datePublished, dateModified, author).

### Sitemap

Builds publicadas são incluídas automaticamente no `sitemap.xml` após o próximo build/deploy.

### Estratégia de Conteúdo Recomendada

Para maximizar SEO, criar posts de blog que linkam para builds específicas:

**Exemplo:**
1. Criar build: `/builds/hexblast-mines-saboteur` (rankeia para "hexblast mines guide")
2. Criar build: `/builds/lightning-strike-raider` (rankeia para "lightning strike raider poe")
3. Criar post de blog: "5 Best League Starters for Phrecia 3.26" com links para as builds
4. Post rankeia para "best league starters phrecia" e distribui link juice para as builds

---

## Próximos Passos

### Prioridade Alta

- [ ] **Aplicar a migration** no Supabase (`supabase db push` ou SQL manual no Studio)
- [ ] **Criar a primeira build** de teste via admin para validar o fluxo completo
- [ ] **Testar a integração PoB Viewer** — colar um código PoB real e verificar se abre corretamente

### Prioridade Média

- [ ] **Edição de builds existentes** — o formulário `AddBuildView` recebe `initialData` e usa PATCH ao invés de POST. Adicionar botão "Editar" na `ManageBuildsView` que passa a build selecionada.
- [ ] **Imagens de ascendência customizadas** — fazer download/upload das artes oficiais do PoE para `public/images/ascendancy/` e atualizar `getAscendancyCdnUrl()` para usar paths locais (mais rápido, sem dependência externa)
- [ ] **Link "Comprar" na página da build** — adicionar CTA para moedas relevantes da loja (ex: "Precisa de Divine Orbs? [Comprar]")

### Prioridade Baixa

- [ ] **Múltiplos ItemSets** — quando o código PoB tem mais de um item set, permitir trocar no viewer
- [ ] **Ordenação** na listagem (mais recentes, mais populares)
- [ ] **Build counter / views** — rastrear quantas vezes cada build foi acessada
- [ ] **Builds em destaque** — campo `is_featured` para destacar no topo da listagem ou na home
- [ ] **Relacionar builds com Liga** — na página da liga (/games/poe1/league/phrecia), mostrar builds da liga em destaque

---

## Schema da Tabela `builds`

```sql
-- Campos principais
id UUID PRIMARY KEY
title TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
description TEXT                    -- resumo curto (card)

-- Classificação PoE
game_version TEXT DEFAULT 'path-of-exile-1'
league TEXT                         -- ex: 'Phrecia'
class TEXT NOT NULL                 -- ex: 'Shadow'
ascendancy TEXT NOT NULL            -- ex: 'Saboteur'
main_skill TEXT                     -- ex: 'Hexblast'
tags TEXT[]                         -- ['league-starter', 'boss-killer', ...]
difficulty TEXT                     -- 'easy' | 'medium' | 'hard'
budget TEXT                         -- 'cheap' | 'medium' | 'expensive'

-- PoB
pob_code TEXT NOT NULL              -- base64 PoB code
pob_hash VARCHAR(12)                -- ref para pob_builds (gerado ao compartilhar)

-- Mídia
image_url TEXT                      -- imagem custom (null → fallback CDN)
video_url TEXT                      -- YouTube embed

-- Conteúdo
guide_content TEXT                  -- Markdown

-- SEO
seo_title TEXT
seo_description TEXT

-- Publicação
is_published BOOLEAN DEFAULT false
author TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ              -- auto-updated por trigger
```

### Tags disponíveis

| Valor | Label EN | Label PT-BR |
|-------|----------|-------------|
| `league-starter` | League Starter | League Starter |
| `endgame` | Endgame | Endgame |
| `boss-killer` | Boss Killer | Boss Killer |
| `speed-farm` | Speed Farm | Speed Farm |
| `ssf-viable` | SSF Viable | Viável em SSF |
| `hardcore` | Hardcore | Hardcore |

### Valores de Dificuldade e Budget

| Campo | Valores |
|-------|---------|
| `difficulty` | `easy` \| `medium` \| `hard` |
| `budget` | `cheap` \| `medium` \| `expensive` |
