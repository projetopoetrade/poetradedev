-- Precificação ancorada em divine.
--
-- O produto passa a ter o valor expresso em DIVINES (`price_divine`), que é a
-- unidade real do mercado in-game e já vem calculada no snapshot do poe.ninja
-- (currency_price_history.divine_value). O preço em USD (`price`, coluna que já
-- existia e é lida pelo site, carrinho e Stripe) vira um valor DERIVADO:
--
--   price = price_divine * leagues.divine_usd * (1 + leagues.price_markup)
--
-- Ou seja: mudar o preço do divine num campo só reprecifica o catálogo inteiro,
-- sem tocar em produto nenhum à mão.
--
-- `price_locked` é a escotilha manual: ao editar o preço de um item pelo painel
-- a linha é travada e o recálculo passa a ignorá-la até alguém destravar. Sem
-- isso todo ajuste manual seria silenciosamente desfeito no recálculo seguinte.
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_divine NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Âncora e margem vivem na LIGA, não numa config global: um divine da Standard e
-- um da liga temporária valem coisas bem diferentes em USD.
--
-- Isso também conserta a consulta de `app/api/tools/prices/snapshot/route.ts`,
-- que buscava o preço do divine em `products` com `.ilike('%divine orb%')` e
-- `.limit(1)` — sem filtro de liga. Na prática ela vinha pegando o Divine Orb da
-- Mirage, que está a 0, e por isso `estimated_usd` era 0 em toda a tabela.
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS divine_usd NUMERIC;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS price_markup NUMERIC NOT NULL DEFAULT 0.5;

-- O recálculo varre por liga e pula as linhas travadas.
CREATE INDEX IF NOT EXISTS idx_products_reprice ON products (league, price_locked);
