# Páginas de Liga — Landing → Hub

> Criado em: 16/07/2026
> Feature commitada na `main` (sem push): `1f9ba4d` (+ bugfixes `97a91a0`, `6b1db62`)
> Pesquisa que embasou as decisões: [`LEAGUE_RESEARCH.md`](./LEAGUE_RESEARCH.md)

---

## O que é

Uma URL por liga (`/leagues/[slug]`) que **muda de função ao longo do tempo** para
acumular autoridade de SEO em vez de morrer no dia do lançamento:

- **Antes do lançamento** — landing de contagem regressiva: hero, countdown,
  trailers, mecânicas, timeline, FAQ. Ranqueia para "quando começa a liga X",
  "X release date".
- **Depois do lançamento** — vira hub: produtos da liga, price tracker, builds,
  links. Ranqueia para "X builds", "X currency". _(hub ainda não construído — ver
  Pendências.)_

Mais o índice `/leagues` (lista todas as ligas publicadas).

**Decisão de URL única validada pelo Google** (Mueller, conteúdo sazonal): uma URL
acumula links ao longo do tempo; trocar de URL na virada só adiciona complexidade.
Ver `LEAGUE_RESEARCH.md` §3.

---

## Arquitetura

**O código é dono do design; o Sanity é dono só dos dados voláteis** que a live da
GGG define. Não é page-builder — não há campo de layout no schema.

| Camada | Arquivo | Papel |
|---|---|---|
| Schema Sanity | `sanity/schemas/leagueLanding.ts` | Dados da liga (nome, datas, trailers, mecânicas, FAQ, cor) |
| Schema Sanity | `sanity/schemas/localeString.ts`, `localeText.ts` | Strings EN/pt-BR inline (EN obrigatório, pt-BR com fallback para EN) |
| Query | `sanity/sanity-query.ts` | `leagueLandingBySlugQuery`, `leagueLandingIndexQuery`, `leagueLandingSlugsQuery` |
| Tipos | `types/league-landing.ts` | `RawLeagueLanding` (do GROQ) → `LeagueLanding` (resolvido, strings puras) |
| Dados/lógica | `lib/league-landing.ts` | Fetch, `resolveLocale()`, `getLeagueStatus()` |
| Página | `app/[locale]/(site)/leagues/[slug]/page.tsx` | Landing/hub + metadata + JSON-LD |
| Índice | `app/[locale]/(site)/leagues/page.tsx` | Lista de ligas |
| Componentes | `components/LeagueLanding/*` | Hero, Countdown, TrailerGallery, MechanicsSection, Timeline, FaqAccordion, LeagueCard, AddToCalendar, LocalDateTime, `poe-ui.tsx` |

### Status derivado, não armazenado

`getLeagueStatus(startsAt)` → `tba | upcoming | live`, calculado **só a partir de
`startsAt`**. Sem data → "a anunciar"; futuro → countdown; passado → "AO VIVO".
**A página vira sozinha no dia da liga, sem deploy nem toggle manual.** O countdown
no cliente re-deriva a cada segundo e troca o hero para o estado "live" ao cruzar o
zero.

### Cache / atualização sem deploy

Fetch com tag `"leagueLanding"`. O webhook `/api/revalidate` (já existente) chama
`revalidateTag(_type)` no publish do Studio → a página atualiza **na hora**.
`revalidate = 60` na página é a rede de segurança caso o webhook falhe. Ou seja:
editar no Studio reflete no site sem redeploy.

### Design

Vocabulário do **próprio site** (não da GGG): alinhado à esquerda como `/builds`,
card com borda `#262626` e raio `0.5rem`, Source Sans nos títulos, corpo muted.
Cor por liga via `accentColor`. Única concessão PoE: **Fontin SmallCaps no nome da
liga**, ecoando o wordmark do header. (Tentativa de clonar o visual da GGG — madeira,
runas, tudo dourado — foi descartada por destoar do resto do site.)

---

## Como alimentar (fluxo do dia da live)

1. `/admin/studio` → **League Landing** → editar o doc da liga.
2. Campos que a live define: `startsAt` (comanda o countdown inteiro), trailers
   (só o **ID** do YouTube, 11 chars — o schema valida), mecânicas, highlights, FAQ.
3. **Key art**: subir em `keyArt` (crop wide, 2400×1350+). O hero foi desenhado para
   arte full-bleed nos 58% da direita; sem ela, mostra um gradiente com a cor da liga.
4. `supabaseLeagueName`: preencher só quando a liga existir na loja (tabela
   `leagues`). Enquanto vazio, o botão "comprar" se esconde sozinho.
5. **Publish** — o webhook revalida na hora.

pt-BR é opcional em cada campo: se durante a live só der tempo do inglês, a página em
português renderiza igual (fallback para EN) em vez de ficar com buracos.

---

## SEO

- **Structured data**: `Article` + `VideoObject` + `BreadcrumbList`. FAQPage emitido
  mas sem rich result (Google aposentou em mai/2026). **`Event` foi removido de
  propósito** — Google não suporta evento virtual e a doc proíbe marcar "compra" como
  evento (risco de ação manual). Ver `LEAGUE_RESEARCH.md` §SEO.
- **Título começa pelo nome da liga**, não por "PoE" (zona escaneada — NN/g).
- hreflang EN/pt-BR, canonical, entrada no `app/sitemap.ts` (`changeFrequency`
  `daily` enquanto upcoming, `weekly` depois de iniciada).
- Seção de mecânicas vazia vira **placeholder datado** (não some) para evitar
  **soft 404** — ver `LEAGUE_RESEARCH.md` §Conteúdo esparso.

---

## Estado atual do conteúdo

- **Doc "Curse of the Allflame" (3.29)** já publicado no dataset de **produção**
  (`_id: league-curse-of-the-allflame`). `startsAt` = 2026-07-24T20:00:00Z (17:00 BRT),
  `accentColor` = `#3fd19a` (verde da lanterna Allflame), 2 trailers oficiais
  (`cujmZaW2dV4`, `8LEERrp5LE4`), FAQ preenchido. **Sem mecânicas** (só saem na live
  de 16/07) e **sem key art** (só banners 920×150 e thumbnails com texto existem hoje;
  arte real vem no press kit).
- ⚠️ **O código da página não está deployado.** O doc está publicado, mas a URL
  `/leagues/curse-of-the-allflame` não existe no site público até o deploy.

---

## Pendências

### Bloqueado por conteúdo (amanhã, com a live/press kit)
- [ ] Subir **key art** no Studio (hero fica com gradiente vazio sem ela).
- [ ] Preencher **mecânicas** após a GGG Live (16/07 17:00 BRT).
- [ ] Revisar **patch notes** (`patchNotesAt` / `patchNotesUrl`) quando saírem.

### Hub (pós-lançamento)
- [ ] **Produtos da liga**: `getProductsWithParams({ league: supabaseLeagueName, isListed:true })`.
      ⚠️ essa função **lança exceção** em erro — envolver em `try/catch` ou uma
      falha do Supabase derruba a landing no dia do lançamento.
- [ ] **Price tracker** compacto: `fetchPrices(names, ninjaName)` server-side.
      ⚠️ id do poe.ninja é o **nome curto** (`Allflame`, não o nome completo);
      nome errado retorna **200 com lista vazia**, não erro. Resolver via
      `leagues.poe_ninja_name`. Ver `LEAGUE_RESEARCH.md` §poe.ninja.
- [ ] **Builds**: usar tabela `builds` (editorial). ⚠️ `getBuilds` usa client com
      cookies → tornaria a página dinâmica e mataria o ISR; precisa de variante
      admin-client. **Top builds do poe.ninja está VETADO** (API interna, proibida
      a terceiros) — só conteúdo curado.

### Precisa de mudança de schema
- [ ] **Posts da liga**: o schema `post` do Sanity só tem `gameVersion`, sem campo de
      liga. Sem adicionar `league` (referência ou slug) ao `post`, não dá para filtrar
      posts por liga — só por versão do jogo.

### Bug pré-existente (fora do escopo, afeta o site inteiro)
- [ ] **`LocaleSwitcher`** renderiza `<Link href="/pt-br/...">` sempre visível; o
      Next faz prefetch, o middleware do next-intl grava `NEXT_LOCALE=pt-br` nesse
      prefetch, e a partir daí visitante EN é redirecionado para `/pt-br` ao clicar em
      qualquer link. Reproduzido via Playwright nesta sessão.

### Corrigido nesta sessão (commitado)
- [x] `Star` não importado em `success/page.tsx` — quebrava o pós-compra (`97a91a0`).
- [x] `--font-fontin` não registrado no site público — tooltips do PoB em Roboto (`6b1db62`).
