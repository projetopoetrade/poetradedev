-- Identidade do produto no Currency Exchange oficial da GGG.
--
-- A API de CX (web.poecdn.com/api/currency-exchange) identifica moeda por
-- caminho de metadata, não por nome: Chaos Orb é
-- `Metadata/Items/Currency/CurrencyRerollRare` e Exalted Orb é
-- `CurrencyAddModToRare`. Os caminhos descrevem FUNÇÃO, não nome — buscar por
-- "Exalted" nos caminhos do CX devolve zero resultados.
--
-- Pior: a GGG mantém DOIS caminhos para o mesmo item. O RePoE e o poe.ninja
-- conhecem o caminho "de item" (`Currency/VeiledChaosOrb`), enquanto o CX usa o
-- caminho "de mercado" (`Currency/CurrencyRerollRareVeiledChaos`). Casar por
-- nome a cada recálculo produzia falso negativo nesses casos e também quebrava
-- em apóstrofo ("Hinekora Lock" no catálogo vs "Hinekora's Lock" na fonte).
--
-- Por isso o vínculo é resolvido UMA vez, por `scripts/resolve-product-metadata.mjs`,
-- e gravado aqui. Em runtime a precificação vira lookup direto por chave.
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata_id TEXT;

-- Qual fonte precificou a linha no último recálculo: 'cx' | 'ninja' | 'manual'.
-- Serve para auditar a cascata — se algo migrar de 'cx' para 'ninja' de repente,
-- é sinal de que o mercado daquele item secou no Currency Exchange.
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_source TEXT;

CREATE INDEX IF NOT EXISTS idx_products_metadata_id ON products (metadata_id);
