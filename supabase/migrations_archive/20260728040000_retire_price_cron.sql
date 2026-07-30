-- Aposenta a coleta de preço própria do Supabase.
--
-- Os três jobs abaixo chamavam rotas deste site por HTTP para replicar dados que
-- o engine (poetrade-content) já coletava em paralelo, a cada 30 min, com
-- auto-descoberta de liga. A duplicata custou caro:
--
--  * `price-snapshot-hourly` parou em 03/07/2026 e NENHUM erro foi registrado —
--    o job seguia `active = true` em `cron.job`, o segredo estava correto e o
--    endpoint no ar. Ninguém percebeu por 25 dias.
--  * Ele não descobria liga nova sozinho, então a Allflame tinha zero pontos
--    enquanto o engine já servia histórico dela.
--  * `sync-ninja-products-daily` criava produtos a partir dessa tabela morta.
--    Foi substituído por `scripts/add-currencies.mjs`, que usa o Currency
--    Exchange oficial mais a PoE Wiki (99% de cobertura contra ~87%).
--
-- Quem consumia `currency_price_history` era só `/api/products/[slug]/history`,
-- reapontado para `GET {engine}/ninja/history/:item`. As rotas
-- `/api/tools/prices/snapshot` e `/api/admin/sync-ninja` foram removidas do
-- código no mesmo commit.
--
-- `cron.unschedule` levanta exceção se o job não existir, daí o bloco com EXCEPTION.
DO $$
DECLARE
    job TEXT;
BEGIN
    FOREACH job IN ARRAY ARRAY[
        'price-snapshot-hourly',
        'sync-ninja-products-daily',
        'cleanup-price-history-daily'
    ] LOOP
        BEGIN
            PERFORM cron.unschedule(job);
            RAISE NOTICE 'job removido: %', job;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'job inexistente, ignorado: %', job;
        END;
    END LOOP;
END $$;

-- Funções auxiliares que só existiam para operar esses jobs.
DROP FUNCTION IF EXISTS reschedule_price_snapshot(TEXT, TEXT);
DROP FUNCTION IF EXISTS unschedule_cron_job(TEXT);

DROP TABLE IF EXISTS currency_price_history;
