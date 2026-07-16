# Páginas de Liga — Landing → Hub

> Criado em: 16/07/2026 · revisão de design (dark-first/art-forward) + scaffold do
> hub pós-lançamento: 16/07/2026
> Feature base commitada na `main`: `1f9ba4d` (+ bugfixes `97a91a0`, `6b1db62`)
> Pesquisa que embasou as decisões: [`LEAGUE_RESEARCH.md`](./LEAGUE_RESEARCH.md)

---

## O que é

Uma URL por liga (`/leagues/[slug]`) que **muda de função ao longo do tempo** para
acumular autoridade de SEO em vez de morrer no dia do lançamento:

- **Antes do lançamento** — landing de contagem regressiva: hero, countdown,
  trailers, mecânicas, FAQ. Ranqueia para "quando começa a liga X", "X release date".
- **Depois do lançamento** — vira hub: price tracker (+ altas/baixas), produtos da
  liga, builds. Ranqueia para "X builds", "X currency". _(hub montado como **preview
  com dados mock** — falta ligar dados reais; ver §Hub e Pendências.)_

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
| Componentes | `components/LeagueLanding/*` | Hero (lockup/logo/keyArt), Countdown, TrailerGallery, MechanicsSection, FaqAccordion, LeagueCard, AddToCalendar, LocalDateTime, `poe-ui.tsx` |
| Componentes (hub) | `components/LeagueLanding/*` | PriceTracker (+ board de altas/baixas), ProductsSection, BuildsSection, `economy-charts.tsx` (AreaChart/Sparkline/MoverBoard — SVG puro) |
| Preview do hub | `app/[locale]/(site)/league-hub-preview/page.tsx` | Rota isolada (**noindex**) que força o estado live e renderiza o hub com dados mock (`lib/league-hub-mock.ts`). Mantém a página real estática. |

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

### Design — dark-first, art-forward (revisado jul/2026)

O rumo mudou nesta revisão: saiu a "contenção que imita o resto do site", entrou um
hero **art-forward no espírito das microsites da GGG**, mas ainda dentro do sistema
near-black + tipográfico do site (sem madeira/runas). Cor por liga via `accentColor`;
Fontin no nome/numerais; Source Sans nos headings; Roboto no corpo.

- **Dark-only.** O site inteiro é forçado no escuro — `forcedTheme="dark"` no
  `app/[locale]/layout.tsx`. O chrome global (header transparente, footer em
  `black/40`) é dark-first e virava **cinza** no tema claro; **não há tema claro**.
- **Hero de largura total** (`max-w-7xl`, grid de 2 colunas) — nada de coluna estreita
  à esquerda com metade direita vazia. As seções também ocupam o body: trailers em
  grid `auto-fit`, card de mecânicas em 2 colunas, FAQ com heading à esquerda +
  accordion à direita.
- **Countdown monumental.** Antes do lançamento, o tempo é o herói: numerais grandes
  em Fontin na coluna direita (fazendo as vezes de arte), com brasa ambiente puxada do
  `accentColor` (`PoeBackdrop`). No lançamento o hero vira **coluna única** (não mostra
  badge "live").
- **Título = lockup estilo logo da GGG.** "PATH OF EXILE" pequeno sobre o nome da liga
  em Fontin. Se o campo **`logo`** (logo oficial da GGG) existe, a imagem substitui o
  lockup; se **`keyArt`** (imagem do press kit) existe, ocupa os 58% da direita
  dissolvendo no conteúdo (`PoeArtFade`).
- **Motion** (brasa que respira + fade-in de entrada) é **puro CSS** e respeita
  `prefers-reduced-motion` — nada de framer/whileInView (que shippa `opacity:0` no SSR).
- **`Timeline` ("Road to launch") foi removida** — componente + strings `timeline.*`.

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

## Hub pós-lançamento (preview + mock)

O layout do hub já existe, montado como **preview** para revisão de design antes de
ligar dados reais. Rota isolada e **noindex**: `/league-hub-preview` (opcional
`?slug=`). Ela busca a liga real, força o estado live (start no passado, `keyArt`
mock com imagem real da Allflame, mecânicas mock) e renderiza o hub com
`lib/league-hub-mock.ts`. **A página real `/leagues/[slug]` continua estática** — o
preview é separado de propósito (ler `searchParams` deixaria a rota real dinâmica).

Seções do hub (ordem no live): **Hero** (lockup/logo + `keyArt`, sem countdown) →
**Live economy** (`PriceTracker`: tiles de preço + board de altas/baixas com
sparkline) → **Buy currency** (`ProductsSection`) → **Meta builds** (`BuildsSection`)
→ mecânicas, trailers, FAQ (compartilhados com a landing).

Gráficos: `economy-charts.tsx` (SVG puro, sem lib — AreaChart/Sparkline/MoverBoard),
seguindo a skill de dataviz (série única = hue único; altas/baixas com ícone+rótulo,
nunca cor sozinha).

⚠️ **Tudo é mock e os rótulos das seções do hub estão em inglês (sem i18n).** Os
formatos em `league-hub-mock.ts` espelham o que as fontes reais retornam, pra troca
ser direta. Antes de ir ao ar: mover as seções para o branch `status === "live"` da
página real, ligar os dados e traduzir os rótulos.

---

## Pendências

### Bloqueado por conteúdo (amanhã, com a live/press kit)
- [ ] Subir **key art** no Studio (hero fica com gradiente vazio sem ela).
- [ ] Preencher **mecânicas** após a GGG Live (16/07 17:00 BRT).
- [ ] Revisar **patch notes** (`patchNotesAt` / `patchNotesUrl`) quando saírem.

### Hub (pós-lançamento) — UI pronta (mock), falta ligar dados
UI e layout já feitos (ver §Hub). O que falta é **dado real** + mover para o branch
`status === "live"` da página real + **i18n dos rótulos** (hoje em inglês).
- [ ] **Price tracker / altas-baixas**: `fetchPrices(names, ninjaName)` server-side.
      ⚠️ id do poe.ninja é o **nome curto** (`Allflame`, não o nome completo); nome
      errado retorna **200 com lista vazia**, não erro. Resolver via
      `leagues.poe_ninja_name`. ⚠️ código atual chama endpoints **antigos** do
      poe.ninja (mortos) — ver `LEAGUE_RESEARCH.md` §poe.ninja pros novos.
- [ ] **Produtos da liga**: `getProductsWithParams({ league: supabaseLeagueName, isListed:true })`.
      ⚠️ essa função **lança exceção** em erro — envolver em `try/catch` ou uma
      falha do Supabase derruba a página no dia do lançamento.
- [ ] **Builds**: tabela `builds` (editorial). ⚠️ `getBuilds` usa client com cookies
      → tornaria a página dinâmica e mataria o ISR; precisa de variante admin-client.
      **Top builds do poe.ninja está VETADO** (API interna, proibida a terceiros).
- [ ] **Hero mobile art-forward**: `keyArt` hoje é **só desktop** (escondida no mobile).

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
