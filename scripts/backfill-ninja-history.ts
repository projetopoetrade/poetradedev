import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente locais do .env ou .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

const POE1_BASE = 'https://poe.ninja/api/data';

async function backfillHistory() {
    console.log("==================================================");
    console.log("🕰️  Iniciando Backfill de 30 dias de Histórico...");
    console.log("==================================================");

    try {
        // 1. Obter Preço do Divine Orb em USD da tabela products
        console.log(">> Buscando preço padrão do Divine Orb em USD...");
        const { data: divineProduct } = await supabase
            .from('products')
            .select('price')
            .ilike('name', '%divine orb%')
            .eq('gameVersion', 'path-of-exile-1')
            .limit(1)
            .single();

        const divineOrbPriceUSD: number = divineProduct?.price ?? 0.15;
        console.log(`>> Preço do Divine Orb: $${divineOrbPriceUSD}`);

        // 2. Buscar Ligas Ativas do PoE 1
        console.log(">> Buscando ligas ativas...");
        const { data: activeLeagues } = await supabase
            .from('leagues')
            .select('name, poe_ninja_name')
            .eq('gameVersion', 'path-of-exile-1')
            .eq('isActive', true);

        if (!activeLeagues || activeLeagues.length === 0) {
            console.log("Nenhuma liga ativa encontrada.");
            return;
        }

        for (const leagueData of activeLeagues) {
            const ninjaName = leagueData.poe_ninja_name || leagueData.name;
            const leagueDbName = leagueData.name;

            console.log(`\n================================`);
            console.log(`🔥 Liga: ${leagueDbName} (Ninja: ${ninjaName})`);
            console.log(`================================`);

            // 3. Pegar Overview para pegar IDs dos itens
            const currencyUrl = `${POE1_BASE}/currencyoverview?league=${encodeURIComponent(ninjaName)}&type=Currency`;
            console.log(`Buscando overview de currencies...`);
            const resOverview = await fetch(currencyUrl, { headers: { 'User-Agent': 'PathOfTrade/1.0' } });

            if (!resOverview.ok) {
                console.error(`Falha ao carregar overview da liga ${ninjaName}`);
                continue;
            }

            const dataOverview = await resOverview.json();
            const lines = dataOverview.lines || [];
            console.log(`Encontrados ${lines.length} currencies.`);

            // Recuperar taxa do Divine Orb na liga
            let divineInChaos = 0;
            for (const line of lines) {
                if (line.currencyTypeName === 'Divine Orb') {
                    divineInChaos = line.chaosEquivalent ?? 0;
                    break;
                }
            }

            // 4. Iterar sobre os currencies para buscar histórico e salvar
            // Evitar limites da ninja com pequenas pausas
            let itemsProcessed = 0;

            for (const line of lines) {
                const itemName = line.currencyTypeName;

                // O currencyId do poe ninja geralmente fica no receive ou pay info
                const currencyId = line.receive?.get_currency_id || line.pay?.pay_currency_id;

                if (!currencyId) {
                    console.warn(`[Pular] Sem ID de moeda para: ${itemName}`);
                    continue;
                }

                console.log(`   > Baixando histórico de: ${itemName} (ID: ${currencyId})`);

                const historyUrl = `${POE1_BASE}/currencyhistory?league=${encodeURIComponent(ninjaName)}&type=Currency&currencyId=${currencyId}`;
                const resHistory = await fetch(historyUrl, { headers: { 'User-Agent': 'PathOfTrade/1.0' } });

                if (!resHistory.ok) {
                    console.error(`     ❌ Erro HTTP ${resHistory.status}`);
                    continue;
                }

                const dataHistory = await resHistory.json();
                const historyGraph = dataHistory.receiveCurrencyGraphData || dataHistory.payCurrencyGraphData || [];

                if (historyGraph.length === 0) {
                    continue;
                }

                // Filtrar os últimos 30 dias
                const last30Days = historyGraph.filter((d: any) => d.daysAgo >= 0 && d.daysAgo <= 30);

                if (last30Days.length === 0) continue;

                const payload = last30Days.map((d: any) => {
                    const chaosValue = d.value;
                    const divineValue = divineInChaos > 0 ? chaosValue / divineInChaos : null;
                    const estimatedUsd = divineValue != null ? divineValue * divineOrbPriceUSD : null;

                    // Reconstituir a data simuladamente
                    const snapshotDate = new Date();
                    snapshotDate.setDate(snapshotDate.getDate() - d.daysAgo);
                    // Zera hora/min/seg pra consistência
                    snapshotDate.setHours(0, 0, 0, 0);

                    return {
                        item_name: itemName,
                        item_category: 'Currency',
                        game_version: 'poe1',
                        league: leagueDbName, // always write original DB league!
                        chaos_value: chaosValue,
                        divine_value: divineValue,
                        estimated_usd: estimatedUsd,
                        snapshot_at: snapshotDate.toISOString()
                    };
                });

                // 5. Inserir no Supabase
                try {
                    const { error: insertError } = await supabase
                        .from('currency_price_history')
                        .insert(payload);

                    if (insertError) {
                        console.error(`     ❌ Erro db: ${insertError.message}`);
                    } else {
                        console.log(`     ✅ Inseridos ${payload.length} dias de hitórico.`);
                    }
                } catch (e) {
                    console.error(`     ❌ Catch Erro db:`, e);
                }

                itemsProcessed++;

                // Pausa para evitar rate-limit pesado
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            console.log(`✅ Backfill concluído para a liga ${leagueDbName}. Itens processados: ${itemsProcessed}`);
        }

        console.log("==================================================");
        console.log("🏁 Operação de Backfill finalizada!");
        console.log("==================================================");

    } catch (error) {
        console.error("❌ Erro ao rodar o backfill:", error);
    }
}

backfillHistory();
