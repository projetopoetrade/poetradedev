# Pesquisa — Páginas de Liga (landing/hub, SEO, copy, dados)

> Compilado em: 16/07/2026. Base das decisões em [`LEAGUE_PAGES.md`](./LEAGUE_PAGES.md).
> Três frentes de pesquisa (jul/2026). **Vários números "famosos" desta área são
> mal atribuídos ou inventados** — abaixo, o que sobreviveu à checagem na fonte
> primária, com o rótulo TESTADO / CONVENÇÃO / MITO quando relevante.

---

## Resumo executivo (o que decidiu o design)

1. **Countdown: manter, mas sem esperar lift.** O único teste controlado limpo deu
   nulo. Justificado como informação honesta (data real, pública), não persuasão.
   Nunca evergreen/resetável.
2. **Título começa pelo nome da liga**, nunca por "PoE"/"Path of Exile".
3. **Data é elemento estruturado, não frase.** Ninguém lidera com data crua.
4. **Seção vazia: mostrar datada, com ação — nunca esconder.** "Thin content" é mito;
   o risco real é **soft 404** (não indexação).
5. **Sem "notify me".** Zero assimetria de informação; teto ~1-3 vendas/1000; custo LGPD.
6. **pt-BR: nome da liga em inglês, scaffolding traduz.** É o que a própria GGG faz.
7. **URL única** (landing→hub) endossado pelo Google.
8. **`Event` e `FAQPage` mortos como rich result;** usar `Article`+`VideoObject`.
9. **Top builds do poe.ninja: sem fonte legítima.** Só editorial.

---

## 1. Estrutura de landing / countdown

**Above the fold — TESTADO, mas mede atenção, não conversão.** NN/g eyetracking
(120 participantes, 130k+ fixações): 57% do tempo de visualização acima da dobra,
74% nas duas primeiras telas. Ressalva: é observacional, não A/B. O papel da dobra é
_ganhar o scroll_, não segurar tudo.

**Nº de CTAs — número famoso MAL ATRIBUÍDO.** O "13,5% / 11,9% / 10,5%" (1 / 2-4 / 5+
links) é citado como *Unbounce Conversion Benchmark Report* — **não está lá**. Origem
real: infográfico da Unbounce no Medium (2018), correlacional, conversão
auto-reportada. A convenção de 1 CTA é bem-motivada; os números são fracos.

**Countdown timer — a resposta honesta é: NÃO há boa evidência de lift.**
- Melhor experimento controlado (Tiemessen et al., CHI EA '23, **N=245**): _"não
  encontramos evidência de que descontos com timer tenham efeito mais forte que o
  desconto sozinho"_. Pressão de tempo percebida: **não significativa (p=.132)**.
  **Nenhum participante mencionou o timer**; alguns escolheram o *outro* produto por
  achar o timer "sketchy".
- Os "lifts de 15-30%" de vendors não têm teste publicado (auto-referência).
- **Nosso caso é diferente e é o que justifica manter:** countdown para uma data
  **real, pública, verificável** é *informação* ("quando posso jogar?"), não
  persuasão. Sobrevive a inspeção, nunca reseta.
- **Nunca evergreen/resetável:** >80% dos participantes do CHI relataram
  arrependimento com timer que nunca expira; Princeton (*Dark Patterns at Scale*)
  achou 393 instâncias em 361 sites; a CMA (UK) extraiu compromissos formais de
  Booking.com, Expedia, Agoda etc. por exatamente isso.

Fontes: [NN/g fold](https://www.nngroup.com/articles/scrolling-and-attention/) ·
Tiemessen, Schraffenberger & Acar, CHI EA '23 · [Princeton Dark Patterns](https://webtransparency.cs.princeton.edu/dark-patterns/)

---

## 2. Copywriting

**Não gastar a zona escaneada com "Path of Exile:".** NN/g testou os primeiros ~11
caracteres de links (80 participantes): 35% dos links reais eram ininteligíveis por
esse prefixo. `Curse of th` é distintivo; `Path of Exi` gasta tudo em boilerplate que
o público já sabe. GGG pode pagar o prefixo (domínio deles); loja terceira não.
→ **Título e H1 começam pelo nome da liga.**

**Tagline: 8-17 palavras (punchy) ou 23-37 (explicativa). CONVENÇÃO, sem teste.**
Ignorar o "16-18 palavras" da Outbrain — é clickbait de recomendação paga, categoria
oposta a um hero para público que já conhece o produto.

**Data = slot estruturado, não frase.** Steam **proíbe data na short description**
("Don't add 'Available on March 4th'" — prosa envelhece) mas dá um **campo dedicado**.
GGG põe a data como **última linha da página** em 10/10 ligas. Ninguém lidera com data
crua (5/19 páginas têm data no hero, sempre colada a um substantivo).

**Template da GGG (precedente mais relevante, 10/10 ligas):** trailer → CTA → nome como
**arte de logo, sem headline de texto** → parágrafo de fantasia (23-37 palavras, 2ª
pessoa, `In Path of Exile: <Name>, you will…`) → frase de feature → 10-18 blocos de
feature (títulos = imperativos de 2-5 palavras) → supporter packs → **data por último**.

**Copy oficial da GGG para esta liga:** tagline _"Beneath the deep, an ancient curse
awaits."_ · título do fórum _"Path of Exile: Curse of the Allflame - They Rise Again"_
· lançamento **24 jul 2026, 1 PM PDT / 20:00 UTC**.

**pt-BR — inequívoco e também argumento de SEO.** GGG roda br.pathofexile.com e
**mantém o nome da liga em inglês dentro do scaffolding português**: _"Path of Exile:
Curse of the Allflame será lançado em 24 de julho"_ / _"Liga Mirage"_. Jargão em inglês
é o idioma nativo do público (_build, farmar, endgame, maps, Atlas_) — traduzir "build"
para "construção" lê como tradução de máquina. Usar **você**, nunca _tu_/_o senhor_.
Reservar 2-3× de largura em strings curtas (expansão EN→PT).

Fontes: [NN/g 11 chars](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/) ·
[Steam short description](https://partner.steamgames.com/doc/store/shortdescription)

---

## 3. Conteúdo esparso (a seção de mecânicas vazia)

**"Thin content" é um mito no sentido que os blogs usam.** Na política de spam do
Google a palavra "thin" aparece **uma vez**, sobre afiliação. Contagem de palavras
**não é sinal** (doc do Google, verbatim: _"Are you writing to a particular word
count… (No, we don't.)"_; Mueller, 7 anos: _"word count is not a sign of thin
content"_). **Não existe penalidade por página curta.**

**O risco real é soft 404.** Definição do Google cobre _"uma página pouco povoada ou
vazia"_; a remediação documentada é literalmente _"adicionar mais informação na
página"_. Falha ≠ ranquear mal — é **não ser indexada**, o que significaria brigar por
um primeiro crawl durante a janela da live.

**UX — mostrar, datado, com ação para frente.** Baymard: **30% de abandono** quando
um produto está indisponível sem ação alternativa; um "coming soon" pelado é esse beco.
Placeholder datado + para-onde-ir é o padrão, e **pré-registra a seção no modelo mental**
de quem volta. Stanford Web Credibility: credibilidade cai por *parecer quebrado*, não
por estar incompleto — placeholder intencional e datado *ganha* credibilidade.

**Não é skeleton screen** (esses prometem conteúdo em segundos; o nosso chega em uma
semana). **Não é progressive disclosure** (esse é para conteúdo que *existe* escondido).

**Motivo real de publicar cedo é prosaico: latência de indexação** (horas a semanas).
Publicar antes da live = a URL já é conhecida e a mecânica vira *update de página
conhecida*, não primeiro crawl no pico. (Os motivos "domain age" e "QDF timing" são
folclore — Mueller nega domain authority; QDF não tem fonte primária.)

Fontes: [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies) ·
[Google soft 404](https://developers.google.com/search/docs/crawling-indexing/http-network-errors#soft-404-errors) ·
[Baymard out-of-stock](https://baymard.com/blog/handling-out-of-stock-products)

---

## 4. Captura de email vs. add-to-calendar

**Sem bom dado comparativo — e os próprios vendors admitem.** SeedProd: _"quase nada
existe especificamente para páginas coming-soon"_. GetWaitlist: _"a maioria dos números
na internet é enganosa ou inventada"_.

**A conta que ninguém mostra** (encadeando os dois datasets reais — Unbounce mediana
6,6% de captura; Klaviyo welcome-flow 1,97% placed-order): **~1-3 vendas por 1000
visitantes pré-lançamento**, sendo generoso.

**Argumento decisivo — assimetria de informação.** "Notify me" de restock converte
espetacularmente (Klaviyo ~25%) **porque só o varejista sabe quando volta**. Nosso caso
tem **zero** disso: a data é pública, a GGG está **pagando** gente para assistir à live
(Twitch Drops 16/07), todo veículo de PoE vai cobrir. A proposta de valor é **nula**.

**LGPD é custo real:** consentimento específico por finalidade (notificar ≠ promover
depois), log de consentimento, opt-out em ~2 dias úteis, multa até 2% do faturamento BR.
Construir base de PII de brasileiros atrelada a negócio de RMT é superfície a evitar.

**Revealed preference:** poecurrency, aoeah, iggm, Maxroll — todos publicam artigo de
SEO "3.29 release date / how to prepare". **Nenhum roda notify-me.**
→ **Ranquear para `poe 3.29 currency` em 24/07 quase certamente supera qualquer lista.**

---

## 5. poe.ninja — API nova (a antiga morreu)

**`/api/data/currencyoverview` e `/api/data/itemoverview` retornam 404.** Todo o
`/api/data/*` legado morreu. API nova documentada: https://poe.ninja/docs/api
(`/swagger` também é 404 — resultados que o citam são obsoletos).

**⚠️ O código atual do site ainda chama os endpoints antigos** (`lib/placeholders/
fetch-prices.ts`, `app/api/tools/prices`) — verificar se o price tracker está degradado.

Endpoints vivos (sem auth):
```
GET https://poe.ninja/poe1/api/economy/leagues
GET https://poe.ninja/poe1/api/economy/exchange/current/overview?league={id}&type={type}
GET https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league={id}&type={type}
```
`type` PoE1: Currency, Fragment, Scarab, DivinationCard, Oil, Essence, Fossil, Omen,
Tattoo, **AllflameEmber**, …

**⚠️ Duas armadilhas:**
1. **Id = nome CURTO, não o de marketing.** "Trial of the Ancestors" → `Ancestors`;
   "Mirage" → `Mirage`. Curse of the Allflame será quase certo **`Allflame`**. Não está
   na API ainda (aparece no lançamento). **Resolver via `leagues.poe_ninja_name` em
   runtime.**
2. **Liga inválida retorna HTTP 200 com `lines` vazio, não erro.** Hardcodar o nome
   errado = tabela de preços silenciosamente vazia, sem exceção para capturar.
   **Alertar em `lines` vazio.**

**Rate limit:** sem headers de limite; `Cache-Control: max-age=1800` (30 min).
Política discricionária ("clientes que abusam serão bloqueados"). Exigem User-Agent
descritivo e **cache server-side / proxy pelo backend**, não pelo browser do usuário.

**⛔ Top builds: sem fonte legítima.** Doc do poe.ninja: _"A API de builds/profiles… é
interna, não suportada e não disponível para uso de terceiros"_ + _"não use a API para
replicar o site"_. GGG: ladder aberta traz classe/nível mas **não skills/gear**; API
oficial _"não conseguimos processar novas inscrições"_; ToS §7i/§23. → **Editorial
(tabela `builds`), como Maxroll e PoE Vault fazem.**

Fonte: [poe.ninja API](https://poe.ninja/docs/api) · [GGG dev docs](https://www.pathofexile.com/developer/docs/index)

---

## 6. SEO — structured data e estratégia de URL

**URL única (landing→hub) é o certo, endossado pelo Google.** Mueller (conteúdo
sazonal): _"use uma única URL e reutilize… ela acumula links ao longo do tempo"_ e
_"eu simplesmente substituiria o conteúdo na URL existente… trocar de URL adiciona
complexidade desnecessária"_. Nosso caso é *mais fácil* — "Curse of the Allflame" é uma
entidade nomeada única; a intenção muda, o tópico não. **Não redirecionar nem deletar a
landing no lançamento** — atualizar in-place. Esperar uma leve reavaliação temporária.

**⛔ NÃO usar `Event`.** Doc do Google, verbatim: _"experiências virtuais sem
componente no mundo real não são suportadas"_ e _"eventos devem ocorrer em local
físico"_. `OnlineEventAttendanceMode` foi **removido em jun/2025**. Doc proíbe marcar
"oportunidades de compra" como evento, com _"Google pode aplicar ação manual"_.
Lançamento de jogo não tem local nem ingresso; a página vende currency. Risco sem rich
result.

**⛔ `FAQPage` está morto como rich result** — Google aposentou para sites não
gov/saúde em **7 mai 2026**. Schema.org ainda válido e inofensivo, mas **zero** feature
no SERP. Não é diferencial. (Correção: uma das pesquisas sugeriu "ninguém usa FAQ, é a
brecha" — é o contrário; ninguém usa porque não faz nada.)

**✅ Usar:** `Article`/`NewsArticle`, `BreadcrumbList`, `VideoObject` (vídeo **segue
vivo** no SERP), `Product` (pós-lançamento). A lacuna real do campo é que a PoE Vault
ranqueia **#1 sem nenhum JSON-LD** — então Article+Breadcrumb+Video já supera.

**Campo fraco:** nenhum concorrente publicou hub da 3.29 (16-17/jul foi a janela de
disputa). `arpg-timeline` #1 e `poewiki` #2 para "poe league start date"; pathofexile
só #5 (homepage). Incumbentes fracos (`vhpg.com` ranqueia top-10 com conteúdo 3.25/3.26,
sem schema).

Fontes: [Google Event](https://developers.google.com/search/docs/appearance/structured-data/event) ·
[FAQ deprecado (SEJ)](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/) ·
[Mueller URL única (SEJ)](https://www.searchenginejournal.com/google-recommends-using-one-url-for-all-seasonal-content/280445/)

---

## Riscos transversais (não afetam a página, mas registrar)

- **RMT vs. ToS da GGG (§23):** venda de currency por dinheiro real está fora do que a
  GGG permite; API oficial é efetivamente fechada e o poe.ninja pode bloquear a
  qualquer momento sem aviso. Toda dependência de dados externos é discricionária.
- **Merchant Center / Shopping** carrega risco antes de investir em `Product` markup.

---

## Mapa de dados para o HUB (do codebase)

Detalhe completo em [`LEAGUE_PAGES.md`](./LEAGUE_PAGES.md) §Pendências. Resumo dos três
espaços de identidade de liga (o ponto que mais confunde):

| Sistema | Tabela/fonte | Chave | Como obter do slug do Sanity |
|---|---|---|---|
| Produtos | `products.league` | **NOME** exato | `league.supabaseLeagueName` |
| Builds | `builds.league` | NOME (getBuilds un-slugifica) | passar `leagueSlug` ou o nome |
| Preços poe.ninja | `leagues.poe_ninja_name` | **nome ninja** (curto) | linha da tabela `leagues` |
| Posts do blog | `post` (Sanity) | **não existe campo de liga** | impossível hoje — só `gameVersion` |

Três armadilhas confirmadas: `getProductsWithParams` **lança** em erro (envolver em
try/catch); `getBuilds` usa **client com cookies** (quebra o ISR — precisa admin-client);
`post` **não tem** associação de liga.
