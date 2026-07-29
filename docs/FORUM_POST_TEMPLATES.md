# Posts de fórum — versão enxuta

Copy pronta pra colar, filtrada pelas regras levantadas em
[`FORUM_MARKETING.md`](./FORUM_MARKETING.md). Preview visual:
[`forum-posts-preview.html`](./forum-posts-preview.html) (abre no navegador).

**Falta só preencher 2 coisas** (marcadas `«assim»` no texto):

1. **`«discord»`** — seu username do Discord. Não pode ser o convite
   `discord.gg/pathoftrade`: o EpicNPC proíbe link de servidor ("no social
   groups; usernames are okay") e no OwnedCore todo link externo fica desativado
   fora de thread Legendary. Username em texto puro passa nos dois.
2. **`«ano»`** — desde quando vocês operam. Se não quiser datar, apague a frase;
   não invente ano.

**Os dois textos são propositalmente diferentes** — EpicNPC pune duplicata e
cross-posting, e texto igual entre fóruns é rastreável.

## Escopo e fatos

Entrega face-to-face em até 30 min, sem bot, sem pedir login, Stripe/Google Pay/
Apple Pay/crypto/PIX e reembolso integral: tudo do FAQ do próprio site
(`messages/en.json`). Anunciamos **Curse of the Allflame (3.29) softcore** e
**Standard**, **só PC** — sem Hardcore e sem console. Se algum mudar, o post
passa a mentir; revise na virada.

## Por que estes posts são curtos

Medido ao vivo em 28/07/2026, contando linhas úteis do primeiro post das threads
de currency:

| | OwnedCore | EpicNPC |
|---|---|---|
| amostra (linhas) | 6 · 27 · 44 · 53 · 67 | 6 · 18 · 19 · 19 · 24 · 26 |
| mediana | ~44 | ~19 |
| caracteres | 410 – 3.280 | 206 – 2.436 |

Fora da faixa só apareceram dois extremos: a thread Legendary da ExpCarry, com
342 linhas de catálogo (é uma vitrine paga, outro produto), e um vendedor de 6
linhas que resume tudo em "just write to me". Os textos abaixo ficam em ~15 e ~13
linhas — dentro da norma, do lado curto, que é o que aguenta ser relido a cada
bump.

## Preço não vai fechado no post

- **OwnedCore** não exige preço, e nenhuma thread do topo publica rate de
  currency — todas dizem "live pricing, message me for a quote".
- **EpicNPC** *exige* preço, mas o vendedor melhor ranqueado da seção (195
  reviews) cumpre a regra escrevendo **`$ask`** na tabela de currency. Preço fixo
  lá só aparece em serviço (powerleveling 1-70 $30, 1-90 $50).

Editar post **não bumpa**, então rate desatualizado num post fixo é pior que não
ter rate. Estoque também não entra: o catálogo só guarda `in_stock` booleano, e
número de estoque seria inventado.

---

## A. OwnedCore — thread de venda

**Título** (sem domínio, sem superlativo — "Fastest/Cheapest/Best" é infração;
"fast" passa):

```
Selling PoE 1 & 2 Currency ⚡ Divine · Exalted · Chaos · Mirror ⚡ Allflame & Standard ⚡ PC ⚡ Face-to-Face Delivery
```

**Corpo (BBCode):**

```bbcode
[B]PoE 1 & 2 currency, hand-delivered by real players. Running since «ano».[/B]

[B]Selling:[/B] Divine Orb, Exalted Orb, Chaos Orb, Mirror of Kalandra, plus PoE 2 currency and items.
[B]Leagues:[/B] Curse of the Allflame (Softcore) and Standard. PC only — no Xbox or PlayStation.
[B]Rates:[/B] ask. The league economy moves daily, so we quote live instead of posting a number that goes stale in a day. Bulk orders quoted individually.
[B]Delivery:[/B] in-game face-to-face trade, usually within 30 minutes of the payment confirming. No delivery bots, and we never ask for your account login.
[B]Payment:[/B] card, Google Pay, Apple Pay, crypto, and PIX for customers in Brazil.
[B]Refund policy:[/B] if we cannot deliver within the stated window because of stock or server issues, you get a full refund to the original payment method, no fee on our side.

[B]Discord: «discord»[/B] — or a forum PM.

Feedback goes in this thread. If an order went wrong, post it here and we answer publicly.
```

**Bloco extra, só quando a thread estiver Legendary** (fora disso o link é
desativado automaticamente e o domínio não pode aparecer em título, username,
assinatura ou perfil):

```bbcode
[B]Order online:[/B] [URL=https://www.pathoftrade.net]Path of Trade — live prices per league[/URL] · [URL=https://discord.gg/pathoftrade]Discord server[/URL]
```

---

## B. OwnedCore — thread de compra

Segunda thread do limite de 3, e vale tanto quanto a de venda: é assim que se
forma estoque, e a seção tem várias no topo ("LF suppliers", "searching for
long-term partners").

**Título:**

```
Buying PoE 1 & 2 Orbs — Divine · Exalted · Mirror — Allflame & Standard — PC — Instant Payment — LF Long-Term Suppliers
```

**Corpo:**

```bbcode
[B]We buy PoE currency every day. Instant payment, recurring volume.[/B]

[B]Buying:[/B] Divine Orb, Exalted Orb, Mirror of Kalandra, plus PoE 2 currency and items.
[B]Where:[/B] Curse of the Allflame (Softcore) and Standard, PC.
[B]How it works:[/B] tell us the league, currency and amount, we quote right away, we trade in-game, and payment goes out right after the trade.
[B]No minimum.[/B] Solo farmers and small teams welcome — recurring suppliers get priority and better rates.

[B]Discord: «discord»[/B] — or a forum PM. We answer every offer, including the small ones.
```

---

## C. EpicNPC — thread de venda

Regras duras da casa: preço, informação do item e contato **no próprio post**;
**nenhum link** do site; nada de "trusted / verified / escrow / middleman / MM"
(palavras protegidas, dão infração sem o badge).

**Título:**

```
PoE 1 & 2 Orbs — Divine / Exalted / Chaos / Mirror — Allflame & Standard — PC — Player-to-Player Trade
```

**Corpo (BBCode):**

```bbcode
[B]Hand-farmed Path of Exile currency, delivered player to player. No bots, no account access.[/B]

[TABLE]
[TR][TH]League[/TH][TH]Currency[/TH][TH]Price[/TH][/TR]
[TR][TD]Curse of the Allflame[/TD][TD]Divine Orb[/TD][TD]$ask[/TD][/TR]
[TR][TD]Curse of the Allflame[/TD][TD]Exalted Orb[/TD][TD]$ask[/TD][/TR]
[TR][TD]Curse of the Allflame[/TD][TD]Chaos Orb[/TD][TD]$ask[/TD][/TR]
[TR][TD]Curse of the Allflame[/TD][TD]Mirror of Kalandra[/TD][TD]$ask[/TD][/TR]
[TR][TD]Standard[/TD][TD]Divine Orb[/TD][TD]$ask[/TD][/TR]
[/TABLE]
Prices change constantly during a league — message me and you get the current rate straight away. Bulk orders quoted individually.

[B]Platform:[/B] PC only, no Xbox or PlayStation. [B]Leagues:[/B] Curse of the Allflame (Softcore) and Standard. PoE 2 currency and items also available.
[B]Delivery:[/B] in-game trade, face to face, usually within 30 minutes of payment. I never ask for your login.
[B]Payment:[/B] card, Google Pay, Apple Pay, crypto, PIX.
[B]If it goes wrong:[/B] not delivered within the stated window because of stock or server issues means a full refund to the original payment method, no fee.

[B]Contact:[/B] Discord «discord» (username), or reply here / DM me on the forum.
```

**Onde o link do site entra no EpicNPC:** só na **Contact page do perfil**, que é
a exceção da regra ("can contain a link to a website if the member is the
owner"). Preencha lá `https://www.pathoftrade.net` e deixe a thread limpa.

---

## D. Mensagens de bump

No OwnedCore, "I'm online now" é spam passível de ban, mas promo e status update
são permitidos — e thread sem atualização é trancada por abandono. No EpicNPC o
bump é botão, 1 a cada 6h (ou o Bump Manager); responder não bumpa.

```
Stock update: Allflame Divine and Exalted restocked, delivery times back to the usual window.
```
```
Delivery times are back to the usual window after today's maintenance — thanks for the patience.
```
```
Weekend promo: discount on bulk Divine orders until Sunday, message for the current rate.
```
```
PoE 2 stock is live for the new league — Divine and Exalted available now.
```
```
Heads up: league ends «data». Standard transfers are business as usual after that.
```

Evite qualquer coisa que seja só "up", "online" ou "still selling".

---

## E. Antes de apertar "Post"

- [ ] Trocou `«discord»` pelo username (nunca `discord.gg/...` fora de Legendary)
- [ ] Trocou ou apagou `«ano»`
- [ ] Nenhum domínio no título, username, assinatura ou perfil (OwnedCore fora de Legendary)
- [ ] Nenhum link no corpo do post do EpicNPC (o site vai na Contact page)
- [ ] Sem "Best / Cheapest / Fastest / beating everyone's price"
- [ ] Sem "Trusted / Verified / Escrow / Middleman / MM" (EpicNPC)
- [ ] Reembolso escrito no post, sem link (obrigatório no OwnedCore)
- [ ] Preço e contato no corpo (obrigatório no EpicNPC)
- [ ] Nome da liga conferido no título e no corpo
- [ ] Nenhuma menção a Hardcore ou a Xbox/PlayStation sobrou
- [ ] Texto diferente do usado no outro fórum
