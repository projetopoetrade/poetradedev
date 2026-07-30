# Migrations arquivadas (pré-baseline)

Estas 14 migrations rodaram no banco entre mar/2024 e jul/2026 e foram
**substituídas** pela baseline `20240101000000_baseline_remote_schema.sql`, que
contém o efeito acumulado de todas elas.

Elas não estão mais em `supabase/migrations/` de propósito: a CLI lê tudo o que
está lá e tentaria replayá-las em cima da baseline. No histórico do Supabase
foram marcadas como `reverted` em 30/07/2026 — o que apaga a linha de
bookkeeping, não o efeito no schema.

**Ficam aqui pelo racional.** Os comentários dessas migrations explicam decisões
que o schema sozinho não conta:

| arquivo | o que documenta |
|---|---|
| `20260728000000_add_divine_pricing` | preço ancorado em divine, `price_locked`, `price_source` |
| `20260728020000_add_min_quantity` | por que o pedido mínimo é `ceil(1 / price_divine)` |
| `20260728030000_add_exchange_rate_cache` | cache de câmbio que substituiu a `currency_rates` |
| `20260728040000_retire_price_cron` | quais jobs de cron foram desligados e por quê |
| `20260624000000_add_products_url_slug` | diferença entre `slug` (com liga) e `url_slug` (canônico) |
| `20260729000000_add_product_featured` | por que destaque é flag e não valor em `category` |
| `20240320000000_create_currency_rates` | **nunca foi aplicada** — a tabela não existe no banco |

Consulta apenas. Mudança de schema daqui pra frente é migration nova em
`supabase/migrations/`.
