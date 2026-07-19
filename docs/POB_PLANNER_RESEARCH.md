# PoB Planner — Pesquisa de Viabilidade

> Pesquisa realizada em: 19/07/2026
> Status: **Viável — aguardando priorização**

Análise de viabilidade para transformar o PoB Viewer existente no poetrade-dev em um
planner completo (criação/edição de builds), estilo Path of Building, rodando no
navegador.

---

## Sumário

1. [Contexto atual](#contexto-atual)
2. [O que é o Path of Building](#o-que-é-o-path-of-building)
3. [Caminho A: PoB Headless como Backend](#caminho-a-pob-headless-como-backend)
4. [Caminho B: pobr (Rust → WASM, PoE2 apenas)](#caminho-b-pobr-rust--wasm-poe2-apenas)
5. [Decisão: Caminho A](#decisão-caminho-a)
6. [Arquitetura detalhada](#arquitetura-detalhada)
7. [O que já temos (Viewer) vs o que falta (Planner)](#o-que-já-temos-viewer-vs-o-que-falta-planner)
8. [Estimativa de esforço](#estimativa-de-esforço)
9. [Importação e criação de items](#importação-e-criação-de-items)
10. [Cálculo em tempo real](#cálculo-em-tempo-real)
11. [Concorrentes web existentes](#concorrentes-web-existentes)
12. [Riscos e mitigação](#riscos-e-mitigação)
13. [Licenciamento](#licenciamento)
14. [Referências](#referências)

---

## Contexto atual

O `poetrade-dev` já possui um **PoB Viewer** funcional (`/tools/pob-viewer`):

- Renderiza a passive tree (Canvas + zoom + hover tooltip)
- Exibe items, gems e stats de builds importadas
- Suporta múltiplos loadouts (item sets + tree specs)
- Decode via engine (`poetrade-content`) que faz base64→zlib→XML→parse manual (port do Lua original)

O viewer é **read-only**. A hipótese é que ele pode evoluir para um planner completo
com edição interativa + cálculo de stats em tempo real.

---

## O que é o Path of Building

| | |
|---|---|
| **Repositório** | `PathOfBuildingCommunity/PathOfBuilding` |
| **Linguagem** | Lua 100% (LuaJIT) |
| **Licença** | MIT |
| **Tamanho do engine** | ~500KB+ de código Lua (`CalcPerform.lua` sozinho tem ~135KB) |
| **Funcionalidades** | Cálculo de DPS/EHP/resists, tree planner, item craft, suporte a gems, configuração de charges/buffs/etc. |
| **Headless wrapper** | `HeadlessWrapper.lua` — permite rodar o PoB sem GUI |

### Camada de integração: `pob-headless-runtime`

| | |
|---|---|
| **Repositório** | `Balenciaga69/pob-headless-runtime` |
| **Licença** | MIT |
| **Função** | API JSON-over-stdio para o PoB. Não é um fork — vive dentro de um checkout do PoB |
| **Transporte** | stdin/stdout JSON: request com `{id, method, params}` → response com `{id, ok, result, meta}` |

---

## Caminho A: PoB Headless como Backend

### Conceito

O PoB Community roda em Docker com `pob-headless-runtime` como camada de API.
O Next.js comunica com ele via HTTP:

```
Browser (Next.js UI)
  │ POST /api/planner/calculate
  ▼
Next.js API Route → monta XML → cache → proxy HTTP
  │
  ▼
Docker: PoB Worker (LuaJIT + pob-headless-runtime)
  │ stdin: JSON request com build XML + operação
  │ stdout: JSON response com stats recalculados
  ▼
Resposta: { life, es, dps, resists, attributes, ... }
```

### Sidecar Node.js

O `json_worker.lua` usa stdio, não HTTP. Um sidecar Node.js (~150 linhas) resolve:

- Pool de N processos LuaJIT (ex: 4 workers)
- Cada worker mantém uma sessão PoB ativa
- Exponibiliza HTTP: `POST /calculate`, `GET /health`
- Timeout + kill + respawn de worker travado
- Fila de requests quando todos ocupados

O PoB já tem `Dockerfile` oficial — só adicionar o runtime + sidecar.

### API estável (v1) — métodos relevantes

| Método | O que faz |
|---|---|
| `load_build_xml` / `load_build_code` | Carrega build |
| `save_build_xml` / `save_build_code` | Exporta build |
| `get_summary` | Resumo rápido (vida, DPS, resists) |
| `get_stats` | Stats brutos filtrados por campo |
| `get_display_stats` | Stats formatados (como no PoB GUI) |
| `equip_item` | Equipa item via texto Ctrl+C do jogo |
| `preview_item_display_stats` | Preview de item sem persistir |
| `list_equipment` / `list_items` / `list_skills` | Lista gear/items/gems |
| `set_config` | Configura bandits, pantheon, charges, enemy resist, etc. |
| `select_skill` | Seleciona skill ativa principal |

#### Métodos experimentais (tree interativa)

| Método | O que faz |
|---|---|
| `get_tree` | Dados da passive tree alocada |
| `get_tree_node` | Detalhes de um nó específico |
| `search_tree_nodes` | Busca na tree |
| `create_tree_snapshot` / `restore_tree_snapshot` | Snapshot/restore (undo/redo) |
| `simulate_node_delta` | Simula alocar/desalocar nó |
| `compare_item_stats` | Compara stats de dois items |
| `compare_config_stats` | Compara stats entre configs |

### Performance

| Cenário | Latência |
|---|---|
| Cache hit (build não mudou) | < 1ms |
| Cache miss, worker idle | 50-200ms |
| Worker ocupado (fila) | +100-300ms/request |
| Cold start (worker novo) | ~500ms (LuaJIT + carregar PoB) |

Com pool de 4 workers: ~20-40 req/s sustentado. 1 worker já basta para uso single-user.

---

## Caminho B: pobr (Rust → WASM, PoE2 apenas)

| | |
|---|---|
| **Repositório** | `ackness/pobr` |
| **Licença** | MIT |
| **Abordagem** | Rewrite do PoB2 em Rust, compila para WASM, roda 100% no browser |
| **Estado** | 925 commits, ativo (último 18/jul/2026), beta funcional em pobr-web.pages.dev |
| **Cobre PoE1?** | ❌ Não. Cálculo de PoE1 é diferente (ailments, charges, ascendancies, etc.) |

---

## Decisão: Caminho A

| Critério | Caminho A (PoB headless) | Caminho B (pobr WASM) |
|---|---|---|
| Fidelidade de cálculo | 100% (é o PoB real) | ~90% (rewrite beta) |
| PoE1 | ✅ | ❌ |
| PoE2 | ✅ (PoB já suporta) | ✅ (nativo) |
| Backend necessário | Sim (Docker) | Não (browser) |
| Custo infra | Baixo (1 container) | Zero |
| Esforço integração | Médio (sidecar + API route) | Baixo (import npm) |
| Manutenção | Sincronizar releases PoB | Sincronizar releases pobr |

**PoE1 é o diferencial.** Não existe planner web completo para PoE1 com cálculo de stats.
Todos os concorrentes ou são só tree viewers (poeplanner.com, poeskilltree.com) ou são
PoE2-only (pobr).

---

## Arquitetura detalhada

```
┌─ Browser ──────────────────────────────────────────────┐
│  Next.js App (poetrade-dev)                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ UI Interativa (React)                            │   │
│  │ • Passive tree com click-to-allocate, undo/redo  │   │
│  │ • Slots de item com Ctrl+C paste                 │   │
│  │ • Socket groups de gems                          │   │
│  │ • Craft UI (base type → mods → gerar item)       │   │
│  │ • Config panel (bandits, pantheon, charges)      │   │
│  │ • Stats sidebar (DPS, EHP, resists, attributes)  │   │
│  │ • Zustand store com estado completo do build     │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │ HTTP POST /api/planner/calculate   │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │ API Route (Next.js)                              │   │
│  │ • buildToXml(state) → XML do build              │   │
│  │ • Cache por SHA256 do XML                       │   │
│  │ • Proxy HTTP → sidecar PoB                      │   │
│  └──────────────────┬──────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────┘
                      │ HTTP (rede interna / mesmo Docker network)
┌─────────────────────▼──────────────────────────────────┐
│  PoB Worker Service (Docker)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Sidecar Node.js (express)                        │   │
│  │ • Pool de N processos LuaJIT                     │   │
│  │ • Fila de requests, timeout 5s, health check     │   │
│  │ • Rotação de workers a cada 100 requests         │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │ stdin/stdout JSON                  │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │ json_worker.lua (LuaJIT)                         │   │
│  │ • Carrega PoB Community (src/ + runtime/)        │   │
│  │ • Build.lua → CalcPerform.lua → CalcOffence/     │   │
│  │   CalcDefence.lua                                │   │
│  └─────────────────────────────────────────────────┘   │
│  Base: PathOfBuildingCommunity/PathOfBuilding 🔗        │
│  Layer: Balenciaga69/pob-headless-runtime 🔗            │
└─────────────────────────────────────────────────────────┘
```

---

## O que já temos (Viewer) vs o que falta (Planner)

### ✅ Já existe (60% do caminho)

| Camada | O que temos |
|---|---|
| Tree rendering | Canvas + zoom + hover tooltip + nós alocados coloridos + conexões + ascendancy |
| Decode PoB | Proxy `/api/tools/pob-viewer` → engine `/api/pob/decode` |
| Items display | Slots com ícones, tooltips, mods parseados |
| Skills display | Gem groups, múltiplos skill sets |
| Stats display | Painel lateral com stats do decode |
| Keystones/Masteries | Sidebar resolvida |
| Múltiplas specs | `activeTreeSpecIndex`, troca entre loadouts |
| Parser de item | `item-parser.ts` (engine) — port 1:1 do Lua original |

### ❌ Falta construir (40%)

| O que falta | Complexidade | Semanas |
|---|---|---|
| Click na tree (alocar/desalocar) | Média | 2-3 |
| Undo/redo na tree | Baixa | 1 |
| Serializar estado → XML PoB | Média | 1 |
| Sidecar Node.js + Docker | Baixa | 0.5 |
| API Route `/api/planner/calculate` | Baixa | 0.5 |
| Zustand store do build state | Média | 1 |
| UI de items (slots editáveis, Ctrl+C paste) | Média | 1-2 |
| UI de gems (socket groups, dropdown) | Baixa | 1 |
| UI de craft (base type → mods → gerar item) | Média | 1-2 |
| Config panel (bandits, pantheon, charges, enemy) | Baixa | 0.5-1 |
| Stats sidebar em tempo real | Baixa | 0.5-1 |
| Import/Export (PoB code, URL, XML) | Baixa | 0.5 |
| **Total** | | **11-15 semanas** |

---

## Importação e criação de items

### Importação (Ctrl+C)

O `pob-headless-runtime` já expõe:

```
→ {"method":"equip_item", "params":{"item_text":"Rarity: Unique\nStarforge\n...","slot":"Weapon 1"}}
← {"ok":true, "result":{"item":{...},"stats":{...}}}
```

Fluxo:
1. Usuário cola texto do jogo no input
2. API Route envia para `equip_item`
3. PoB faz parse, valida, equipa e recalcula stats
4. UI atualiza slot + stats sidebar

Também existe `preview_item_display_stats` — preview sem persistir (hover comparativo).

### Criação de items (craft)

O PoB desktop tem craft system completo. O headless runtime não expõe a UI, mas o
nosso PG já tem os dados:

| Recurso | Fonte |
|---|---|
| Base types por slot | PG `Item` table (`classId`, `baseType`, `slot`) |
| Mods por item (prefix/suffix) | PG `Mod` table |
| Unique database | PG `Item` table + chain de ícones (5 tiers, já implementada) |

Abordagem:
1. UI de dropdown: slot → base type → categoria de mod
2. Usuário seleciona mods e tiers
3. Montamos texto do item no formato Ctrl+C (Rarity + Name + mods)
4. Enviamos via `equip_item`
5. PoB valida (mod conflitante, tier inválido) e recalcula

A validação server-side pelo PoB garante que items inválidos são rejeitados.

---

## Cálculo em tempo real

### Latência

| Etapa | Tempo |
|---|---|
| Usuário faz mudança (alocar nó, equipar item) | instantâneo |
| Debounce (acumular mudanças) | 300ms |
| buildToXml(state) | < 5ms |
| SHA256 + cache lookup | < 1ms |
| Cache HIT → resposta | < 1ms total |
| Cache MISS → POST ao worker PoB | ~5ms rede |
| Worker processa (LuaJIT) | 50-200ms |
| Resposta → UI atualiza | ~10ms |

**Latência total percebida: 300-500ms** com debounce. Experiência comparável ao
PoB desktop (onde o delay de cálculo também é perceptível em builds complexas).

### Otimizações

| Técnica | Descrição |
|---|---|
| Cache por hash do XML | Undo/redo retorna instantâneo (< 1ms) |
| Optimistic UI | UI atualiza imediatamente no toggle; cálculo roda em background |
| Batch de mudanças | Debounce 300ms acumula múltiplas ações em 1 request |
| Prefetch | Hover em item já dispara `preview_item_display_stats` |

---

## Concorrentes web existentes

| Projeto | O que faz | PoE1? | Cálculo de stats? |
|---|---|---|---|
| **poeplanner.com** | Só tree planner | ✅ | ❌ |
| **poeskilltree.com** | Só tree viewer | ✅ | ❌ |
| **pobb.in** | Pastebin/viewer | ✅ | Parcial (viewer) |
| **pobr-web.pages.dev** | Planner completo | ❌ (PoE2) | ✅ |
| **poe2-toolkit** | Componentes React para tree PoE2 | ❌ (PoE2) | ❌ |

**Oportunidade**: Não existe planner web completo para PoE1 com cálculo de stats.

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Worker PoB trava (build inválido) | Média | Timeout 5s + kill + respawn automático |
| Memory leak (build complexo) | Baixa | Restart do worker a cada 100 requests |
| PoB atualiza e quebra compatibilidade | Média | Pin de versão no Dockerfile; testes de regressão |
| `simulate_node_delta` é experimental | Alta | Fallback: reenviar build completo via `load_build_xml` + `get_stats` |
| Baixa adoção (PoE1 em declínio) | Média | Se PoE1 perder relevância, migrar para PoE2 via `pobr` WASM |
| Custo de infra | Baixa | 1 container small (512MB-1GB RAM) na VPS existente |

---

## Licenciamento

| Projeto | Licença | Pode usar? |
|---|---|---|
| Path of Building Community | MIT | ✅ Uso comercial, sem restrições |
| pob-headless-runtime | MIT | ✅ |
| pobr (Rust/WASM) | MIT | ✅ |
| pasteofexile (pobb.in) | AGPL-3.0 | ⚠️ Cuidado — não incorporar código |

---

## Referências

- **PoB Community**: https://github.com/PathOfBuildingCommunity/PathOfBuilding
- **pob-headless-runtime**: https://github.com/Balenciaga69/pob-headless-runtime
- **pobr (PoE2 Rust→WASM)**: https://github.com/ackness/pobr
- **pobr web demo**: https://pobr-web.pages.dev
- **PoB Viewer atual**: `app/[locale]/(site)/tools/pob-viewer/PobViewerClient.tsx`
- **Engine PoB decoder**: `poetrade-content/packages/api/src/modules/knowledge/pob-decoder.service.ts`
- **Passive tree viewer**: `components/tree/PassiveTreeViewer.tsx`

---

## Próximos passos sugeridos

1. **PoC do sidecar**: Docker com PoB + runtime + sidecar Node.js. Validar `get_stats` com build real.
2. **PoC da tree interativa**: Adicionar `onNodeClick` handler no `PassiveTreeViewer` com toggle de alocação e verificação de conectividade.
3. **buildToXml()**: Implementar serializador Zustand → XML PoB para alimentar o backend.
4. **Integração end-to-end**: Conectar UI → XML → worker → stats → UI.
