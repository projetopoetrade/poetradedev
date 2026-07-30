-- Bloco "Destaque" da página de products.
--
-- Regra do operador: os destaques ficam no topo da listagem, em ordem manual, e
-- somem da grade normal — nada aparece duas vezes na mesma página.
--
-- Por que uma flag e não um valor em `category`: `category` é de valor único
-- (`currency` / `services` / `items`), alimenta os botões de filtro e as rotas
-- /games/[gameVersion]/[category]. Marcar um Divine Orb como "featured" ali o
-- tiraria da categoria Currency — o destaque é promoção, não taxonomia.
--
-- `featured_order` é a posição na vitrine (menor primeiro). Fica NULL de
-- propósito: item destacado sem ordem definida cai no fim do bloco, ordenado por
-- preço, em vez de disputar o primeiro lugar com quem foi posicionado à mão.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_order INTEGER;

-- A listagem lê o catálogo inteiro e separa os destaques em memória; o índice
-- parcial existe para as consultas que filtram direto por is_featured.
CREATE INDEX IF NOT EXISTS products_featured_idx
  ON products (featured_order NULLS LAST)
  WHERE is_featured;
