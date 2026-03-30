import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// SQL para criar a tabela (rodar uma vez no Supabase Dashboard):
//
// CREATE TABLE IF NOT EXISTS currency_price_history (
//     id SERIAL PRIMARY KEY,
//     item_name TEXT NOT NULL,
//     item_category TEXT NOT NULL,
//     game_version TEXT NOT NULL,
//     league TEXT NOT NULL,
//     chaos_value FLOAT NOT NULL,
//     divine_value FLOAT,
//     estimated_usd FLOAT,
//     snapshot_at TIMESTAMP NOT NULL DEFAULT NOW()
// );
// CREATE INDEX IF NOT EXISTS idx_price_history_item ON currency_price_history(item_name, league);
// CREATE INDEX IF NOT EXISTS idx_price_history_date ON currency_price_history(snapshot_at);

const POE1_EXCHANGE_BASE = 'https://poe.ninja/poe1/api/economy/exchange'

// Cron job chama este endpoint 1x/hora
// pg_cron: { "schedule": "0 * * * *", "job": "price-snapshot-hourly" }
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Verificar secret para evitar chamadas não autorizadas
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Pegar todas as ligas ativas do PoE 1 para snapshot
    const { data: activeLeagues } = await supabase
      .from('leagues')
      .select('name, poe_ninja_name')
      .eq('gameVersion', 'path-of-exile-1')
      .eq('isActive', true)

    // Pegar preço do Divine Orb
    const { data: divineProduct } = await supabase
      .from('products')
      .select('price')
      .ilike('name', '%divine orb%')
      .eq('gameVersion', 'path-of-exile-1')
      .limit(1)
      .single()

    const divineOrbPriceUSD: number = divineProduct?.price ?? 0.15

    const snapshots: Array<{
      item_name: string
      item_category: string
      game_version: string
      league: string
      chaos_value: number
      divine_value: number | null
      estimated_usd: number | null
    }> = []

    const leaguesToProcess = activeLeagues || []

    for (const leagueData of leaguesToProcess) {
      const ninjaName = leagueData.poe_ninja_name || leagueData.name
      // Snapshot das currencies (PoE 1) via exchange overview — preços baseados em trades reais
      const currencyUrl = `${POE1_EXCHANGE_BASE}/current/overview?league=${encodeURIComponent(ninjaName)}&type=Currency`
      const res = await fetch(currencyUrl, {
        headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' },
      })

      if (!res.ok) continue
      const data = await res.json()

      // Montar mapa id → name a partir do array items[]
      const itemNameMap: Record<string, string> = {}
      for (const it of data.items || []) {
        itemNameMap[it.id] = it.name
      }

      // Descobrir chaos value do Divine Orb
      let divineInChaos = 0
      for (const line of data.lines || []) {
        if (line.id === 'divine') {
          divineInChaos = line.primaryValue ?? 0
          break
        }
      }

      for (const line of data.lines || []) {
        const chaosValue = line.primaryValue ?? 0
        const divineValue = divineInChaos > 0 ? chaosValue / divineInChaos : null
        const estimatedUsd = divineValue != null ? divineValue * divineOrbPriceUSD : null

        snapshots.push({
          item_name: itemNameMap[line.id] || line.id,
          item_category: 'Currency',
          game_version: 'poe1',
          league: leagueData.name,
          chaos_value: chaosValue,
          divine_value: divineValue,
          estimated_usd: estimatedUsd,
        })
      }
    }

// Inserir snapshots no Supabase em lotes
    if (snapshots.length > 0) {
      const BATCH_SIZE = 100
      for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
        const batch = snapshots.slice(i, i + BATCH_SIZE)
        const { error } = await supabase.from('currency_price_history').insert(batch)
        if (error) {
          console.error('[snapshot] Supabase insert error:', error)
        }
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      snapshotCount: snapshots.length,
      snapshotAt: new Date().toISOString(),
      durationMs: duration,
    };

    // Log success to cron_job_logs
    await supabase.from('cron_job_logs').insert({
      job_name: 'price-snapshot-hourly',
      status: 'success',
      message: `Snapshotted ${snapshots.length} items in ${duration}ms`,
      response_body: JSON.stringify(response),
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[/api/tools/prices/snapshot] Error:', error)
    
    // Log error to cron_job_logs
    try {
      const supabase = createAdminClient();
      await supabase.from('cron_job_logs').insert({
        job_name: 'price-snapshot-hourly',
        status: 'failed',
        message: error.message || 'Unknown error',
        response_body: JSON.stringify({ error: error.message }),
      });
    } catch (logError) {
      console.error('[snapshot] Failed to log error:', logError);
    }
    
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 })
  }
}

// GET para testar via browser
export async function GET() {
  return NextResponse.json({
    message: 'Price snapshot endpoint. Use POST to trigger a snapshot.',
    sql: `
CREATE TABLE IF NOT EXISTS currency_price_history (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    item_category TEXT NOT NULL,
    game_version TEXT NOT NULL,
    league TEXT NOT NULL,
    chaos_value FLOAT NOT NULL,
    divine_value FLOAT,
    estimated_usd FLOAT,
    snapshot_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_history_item ON currency_price_history(item_name, league);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON currency_price_history(snapshot_at);
    `.trim(),
  })
}
