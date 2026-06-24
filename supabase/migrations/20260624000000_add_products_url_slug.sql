-- url_slug: slug canônico CURTO do produto (apenas o nome, ex "divine-orb"),
-- independente de liga/dificuldade. É usado na URL canônica
--   /games/<jogo>/products/<url_slug>
-- que resolve para a LIGA ATUAL (smart-default) — o "produto base" que captura
-- buscas como "buy divine orb" sem o adendo da liga.
--
-- A coluna `slug` original (que embute liga e é a chave compartilhada com o
-- Sanity e com o histórico de preço) permanece INTACTA. Nada nelas muda.
ALTER TABLE products ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products (url_slug);
