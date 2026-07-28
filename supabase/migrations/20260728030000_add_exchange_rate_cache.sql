-- Último conjunto de taxas de câmbio obtido com sucesso.
--
-- Serve de penúltimo degrau da cadeia de fallback em `lib/pricing/exchange-rates.ts`.
-- Passou a importar quando o servidor virou quem calcula o valor cobrado: antes a
-- taxa só afetava o preço EXIBIDO, agora define quanto o cliente paga, então cair
-- numa constante chumbada no código é cobrar errado.
--
-- O problema é concreto: em 28/07/2026 o fallback do código dizia 1 USD = R$5,60
-- enquanto o mercado estava em R$5,09 — 10% de diferença, cobrados a mais de todo
-- cliente brasileiro se a fonte externa ficasse fora do ar.
--
-- Com esta tabela a pior hipótese vira "a taxa de ontem" em vez de "a taxa de
-- quando alguém digitou aquele número".
--
-- Uma linha só (id fixo 'usd'): guardamos o conjunto inteiro com base em dólar,
-- que é a moeda em que `products.price` está.
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
    id TEXT PRIMARY KEY,
    rates JSONB NOT NULL,
    source TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
