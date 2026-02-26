### Build Randomizer – Especificação para Agent (Antigravity)

#### 1. Objetivo

- **Propósito**: ajudar jogadores indecisos a escolher um **league starter** em Path of Exile, sorteando uma build com base em filtros.
- **Reuso**: usar **a mesma estrutura de dados e filtros** já existente para a feature de builds (`builds` no Supabase, interfaces TS, etc.).
- **Experiência**: página de ferramenta dedicada (`/tools/build-randomizer`) com **animação de roleta/slot machine** no momento do sorteio.

---

#### 2. Arquitetura Geral

- **Back-end**
  - Banco: tabela `builds` no Supabase (já existente).
  - Novo endpoint para randomizer:
    - Pode ser **Server Action** em `app/actions.ts` ou **rota API** em `app/api/tools/build-randomizer/route.ts`.

- **Front-end**
  - Nova página client-side:
    - `app/[locale]/(site)/tools/build-randomizer/page.tsx`
  - Reutilizar componentes:
    - `BuildCard` para exibir a build sorteada.
    - Constantes de `lib/builds-data.ts` (`BUILD_TAGS`, classes, ascendências).

- **Integração**
  - CTA de entrada na página de builds `/builds`:
    - Em `app/[locale]/(site)/builds/BuildsClient.tsx`, adicionar um card/botão com link interno para `/tools/build-randomizer` (respeitando `locale`).

---

#### 3. Dados e Filtros

##### 3.1. Modelo `Build` (resumo relevante)

Campos principais já existentes (conforme `docs/BUILDS_FEATURE.md` e schema do Supabase):

- **Identificação e texto**
  - `id`, `title`, `slug`
  - `description`
- **Classificação PoE**
  - `game_version` (`path-of-exile-1` | `path-of-exile-2`)
  - `league`
  - `class`
  - `ascendancy`
  - `main_skill`
  - `tags` (`text[]`, ex: `league-starter`, `endgame`, `boss-killer`, `ssf-viable`, `hardcore`, etc.)
  - `difficulty` (`easy` | `medium` | `hard`)
  - `budget` (`cheap` | `medium` | `expensive`)
- **PoB / mídia / publicação**
  - `pob_code`, `pob_hash`
  - `image_url`, `video_url`
  - `guide_content`
  - `is_published`

O randomizer deve **sempre** considerar apenas builds com `is_published = true`.

##### 3.2. Filtros do Randomizer

- **Obrigatório**
  - **`gameVersion`** (select; default sugerido: `path-of-exile-1`).

- **Opcionais**
  - **`league`** (select; mesma lista usada hoje na listagem de builds).
  - **`class`** (select; depende de `gameVersion`, usar `getClassesForGameVersion` de `lib/builds-data.ts`).
  - **`ascendancy`** (select; depende de `class`).
  - **`tags`** (array de strings; usar `BUILD_TAGS`):
    - Checkbox especial: **“League Starter”** (tag `league-starter`), idealmente marcada por padrão.
  - **`difficulty`**: `easy`, `medium`, `hard`.
  - **`budget`**: `cheap`, `medium`, `expensive`.

- **Filtros avançados (opcional)**
  - **`onlyLeagueStarters: boolean`**:
    - Se `true`, garantir que `tags` inclua `league-starter` (mesmo que o user não marque manualmente).
  - **`includePastLeagues: boolean`**:
    - Se houver distinção entre liga atual e antigas via campo `league`, esse flag pode controlar se aceitamos qualquer liga ou só a atual.

---

#### 4. Endpoint / Server Action de Randomizer

##### 4.1. Assinatura Conceitual

Nome sugerido: **`getRandomBuild`** (ou similar).

Entrada (payload JSON ou parâmetros de função):

```ts
type RandomBuildFilters = {
  gameVersion?: string;       // ex: 'path-of-exile-1'
  league?: string;
  class?: string;
  ascendancy?: string;
  tags?: string[];            // ex: ['league-starter', 'ssf-viable']
  difficulty?: 'easy' | 'medium' | 'hard';
  budget?: 'cheap' | 'medium' | 'expensive';
  onlyLeagueStarters?: boolean;
};
```

Opções de saída:

```ts
type RandomBuildResult =
  | { status: 'ok'; build: Build }
  | { status: 'empty' };      // nenhum match para filtros
```

##### 4.2. Lógica de Seleção

- Base de query:
  - `FROM builds`
  - `WHERE is_published = true`
- Aplicar filtros conforme preenchimento:
  - `game_version = $gameVersion` se informado.
  - `league = $league` se informado.
  - `class = $class` se informado.
  - `ascendancy = $ascendancy` se informado.
  - `tags`:
    - Se `onlyLeagueStarters` ⇒ `tags @> ARRAY['league-starter']`.
    - Se `tags` não vazias ⇒ `tags @> ARRAY[...tags]` (todas as tags selecionadas devem estar presentes).
  - `difficulty = $difficulty` se informado.
  - `budget = $budget` se informado.

- Estratégias de sorteio possíveis:
  - **Opção A – simples (backend decide tudo)**:
    - `SELECT * FROM builds WHERE ... ORDER BY random() LIMIT 1;`
    - Backend já retorna 1 build final.
  - **Opção B – amigável à animação (recomendada)**:
    - `SELECT * FROM builds WHERE ... ORDER BY created_at DESC LIMIT 50;`
    - Backend retorna até 50 candidatos, e o sorteio final acontece client-side (ver seção de animação).

- Tratamento:
  - Se não houver resultado: retornar `{ status: 'empty' }`.
  - Se houver:
    - Em A: `{ status: 'ok', build }`.
    - Em B: retornar array de `Build` (ajustar tipo) e deixar o client escolher o final.

---

#### 5. Página `/tools/build-randomizer`

##### 5.1. Rota e Estrutura

- Criar página em:  
  `app/[locale]/(site)/tools/build-randomizer/page.tsx`
- Página client-side (`"use client"`), já que haverá animação e interação pesada.

Layout sugerido:

1. **Hero**
   - Título: “Build Randomizer” / “Sorteador de Builds”.
   - Subtítulo explicando em 1–2 frases, ex:
     - PT-BR: “Defina alguns filtros e deixe o Path of Trade escolher sua próxima build.”
     - EN: “Set a few filters and let Path of Trade pick your next build.”
2. **Seção de filtros**
   - Linha com `Game Version`, `League`, `Class`, `Ascendancy`.
   - Bloco com `Tags`, `Difficulty`, `Budget`.
   - Filtros avançados em um `Collapsible` se necessário.
3. **Seção de sorteio**
   - Card central grande (área da roleta).
   - Botão principal: “Sortear build” / “Roll build”.
   - Após sorteio: mostrar resultado e botão “Sortear novamente”.

##### 5.2. Estado e Fluxo no Front-end

Estados React conceituais:

- `filters: RandomBuildFilters`
- `status: 'idle' | 'loading' | 'animating' | 'finished' | 'empty'`
- Estrutura de dados:
  - Variante recomendada (para roleta real):
    - `candidates: Build[]`
    - `currentIndex: number`
    - `selectedBuild: Build | null`

Fluxo ao clicar em **“Sortear build”**:

1. Se `status === 'animating'`, ignorar clique.
2. `status = 'loading'`.
3. Chamar endpoint com `filters`.
4. Se resposta for vazia:
   - `status = 'empty'`.
   - Mostrar mensagem: “Nenhuma build encontrada para esses filtros. Tente relaxar um pouco os critérios.”
5. Se resposta tiver candidatos:
   - Preencher `candidates`.
   - Chamar função `startRoulette(candidates)` (ver próximo capítulo).
   - Durante roleta: `status = 'animating'`.
6. Ao fim da roleta:
   - Definir `selectedBuild`.
   - `status = 'finished'`.

---

#### 6. Animação de Roleta (Slot Machine)

##### 6.1. Comportamento Geral

- Área central exibe um **card grande** que muda de build em build rapidamente.
- Duração total: em torno de **2–3 segundos**.
- Intervalo entre trocas:
  - Começa rápido (80–120 ms) e vai desacelerando.
- Build final:
  - Escolher previamente um índice final (`finalIndex`) entre os candidatos.
  - A animação deve “convergir” visualmente para esse índice.

##### 6.2. Pseudo-lógica

```ts
function startRoulette(candidates: Build[]) {
  if (!candidates.length) return;

  const finalIndex = randomIndex(candidates.length);
  const delays = [80, 80, 100, 120, 150, 200, 260, 330, 400, 500]; // exemplo

  let step = 0;
  let index = 0;

  const tick = () => {
    index = (index + 1) % candidates.length;
    setCurrentIndex(index);

    if (step < delays.length - 1) {
      step++;
      setTimeout(tick, delays[step]);
    } else {
      setCurrentIndex(finalIndex);
      setSelectedBuild(candidates[finalIndex]);
      setStatus('finished');
      triggerWinEffects();
    }
  };

  setStatus('animating');
  setTimeout(tick, delays[0]);
}
```

##### 6.3. Efeitos Visuais Finais

Quando a roleta parar:

- **Zoom leve** no card (`scale-105` + sombra extra).
- **Glow** na borda:
  - Ex.: borda com `border-amber-400/70` ou gradiente compatível com o design atual.
- **Confete**:
  - Usar lib leve de confete (ou um componente interno, se já existir).
  - Disparar apenas uma vez ao final da animação.

##### 6.4. UX Durante a Animação

- Enquanto `status = 'animating'`:
  - Desabilitar botão “Sortear build” e mostrar label “Sorteando...”.
  - Idealmente desabilitar filtros (ou permitir editar mas só aplicar após o fim).
- Quando `status = 'finished'`:
  - Reativar botão com texto “Sortear novamente”.
  - Mostrar CTAs da build:
    - Link para `/builds/[slug]`.
    - Opcional: botão “Abrir no PoB Viewer” reaproveitando o padrão da página de build individual.

---

#### 7. Integração com `/builds`

- Arquivo principal:  
  `app/[locale]/(site)/builds/BuildsClient.tsx`

##### 7.1. CTA de Navegação

- Adicionar um pequeno bloco próximo ao header ou logo acima dos filtros:
  - **Texto**:
    - Título: “Indeciso sobre o que jogar?”
    - Sub: “Use o nosso Build Randomizer para sortear um league starter baseado nos filtros que você gosta.”
  - **Botão**:
    - Label: “Abrir Build Randomizer”.
    - Navegação interna (`next/link`) para `/[locale]/tools/build-randomizer`.

##### 7.2. Passagem de Filtros (Opcional)

- Caso queira pré-popular os filtros do randomizer:
  - Ler os search params atuais (`gameVersion`, `league`, `class`, `ascendancy`, `tags`) da página `/builds`.
  - Montar um link com esses params:
    - Ex.: `/tools/build-randomizer?gameVersion=...&class=...&tags=league-starter`.

---

#### 8. UX, i18n e Acessibilidade

- **Idiomas**
  - Reutilizar estratégia atual de `locale` para textos PT-BR / EN.
  - Manter mensagens curtas e claras:
    - Empty state, erros, descrições da ferramenta.

- **Mensagens importantes**
  - Sem resultados:
    - PT-BR: “Nenhuma build encontrada para esses filtros. Tente relaxar um pouco os critérios.”
    - EN: “No builds found for these filters. Try relaxing your criteria.”
  - Erro genérico:
    - PT-BR: “Ocorreu um erro ao sortear a build. Tente novamente em alguns segundos.”
    - EN: “An error occurred while rolling the build. Please try again in a few seconds.”

- **Acessibilidade**
  - Botão principal com `aria-label` detalhado:
    - Ex.: “Sortear uma build baseada nos filtros selecionados”.
  - Evitar flashes intensos ou animações muito longas.
  - Permitir repetir o sorteio sem recarregar a página.

---

#### 9. Casos de Teste Prioritários

1. **Sem filtros (apenas gameVersion default)**  
   - Deve sortear entre todas as builds publicadas daquela versão.
2. **Somente League Starters**  
   - `onlyLeagueStarters = true` ou tag `league-starter` marcada.
3. **Combinação muito restrita**  
   - Ex.: `gameVersion + league + class + ascendancy + tags`.
   - Verificar se empty state aparece corretamente.
4. **Muitas builds disponíveis**  
   - Verificar se animação continua fluida com até 50 candidatos.
5. **Mobile**  
   - Layout responsivo do card de roleta, legibilidade e espaçamento de botões.
6. **Erros de rede / Supabase**  
   - Simular erro e garantir mensagem amigável e possibilidade de tentar novamente.

---

Este documento deve orientar a implementação completa da ferramenta **Build Randomizer**, reaproveitando a infraestrutura de builds já existente, cobrindo:

- Endpoint/Server Action de sorteio.
- Página `/tools/build-randomizer` com filtros.
- Animação de roleta com efeitos visuais.
- CTA de entrada na página `/builds`.

