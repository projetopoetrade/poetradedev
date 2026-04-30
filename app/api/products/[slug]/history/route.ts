import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 600 // Cache de 10 minutos

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> } // Params is a promise in Next.js 15
) {
    try {
        const { slug } = await params
        const supabase = await createClient()

        // Name normalization from slug
        const decodedItem = decodeURIComponent(slug).replace(/-/g, ' ')
        const formattedName = decodedItem.replace(/\b\w/g, l => l.toUpperCase()).replace(/'S\b/g, "'s")

        // 1. Tentar encontrar o produto buscando e normalizando os nomes
        const { data: allProducts } = await supabase
            .from('products')
            .select('name, gameVersion, slug')

        const normalizedSearch = decodedItem.toLowerCase().replace(/['\s]/g, '')
        let product = allProducts?.find(p => p.slug === slug)
        
        if (!product) {
            product = allProducts?.find(p => p.name.toLowerCase().replace(/['\s]/g, '') === normalizedSearch)
        }

        const gameVersion = product ? product.gameVersion : 'path-of-exile-1'
        const itemName = product ? product.name : formattedName

        console.log('[API History] Parsed Slug:', slug, '->', formattedName)
        console.log('[API History] Found Product:', product ? product.name : 'null', '| Game:', gameVersion)

        const { searchParams } = new URL(request.url)
        const requestedLeague = searchParams.get('league')

        let activeLeague;

        if (requestedLeague) {
            // Find specific league
            const { data } = await supabase
                .from('leagues')
                .select('name, poe_ninja_name')
                .eq('name', requestedLeague)
                .limit(1)
                .single()
            if (data) activeLeague = data
        }

        if (!activeLeague) {
            // 2. Determinar a liga ativa principal deste jogo
            const { data, error: leagueErr } = await supabase
                .from('leagues')
                .select('name, poe_ninja_name')
                .eq('gameVersion', gameVersion)
                .eq('isActive', true)
                .limit(1)
                .single()

            if (leagueErr) console.error('[API History] League Query Error:', leagueErr)
            activeLeague = data
        }

        if (!activeLeague) {
            return NextResponse.json({ error: 'No active league found for this game' }, { status: 404 })
        }

        // 3. Buscar os snapshots dos últimos 30 dias para a combinação liga + item
        // Utilizando target league.name, mas caso a gravação do cron estiver usando poe_ninja_name, buscamos ambos.
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const searchNames = [activeLeague.name]
        if (activeLeague.poe_ninja_name && activeLeague.poe_ninja_name !== activeLeague.name) {
            searchNames.push(activeLeague.poe_ninja_name)
        }

        const { data: historyData, error: historyError } = await supabase
            .from('currency_price_history')
            .select('chaos_value, divine_value, estimated_usd, snapshot_at, league')
            .ilike('item_name', itemName) // match exact item name ignoring case
            .in('league', searchNames)
            .gte('snapshot_at', thirtyDaysAgo.toISOString())
            .order('snapshot_at', { ascending: true })

        if (historyError) {
            console.error('[/api/products/[slug]/history] Database error:', historyError)
            return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
        }

        // Agrupar os pontos de gráfico por Data exata reduzida por Dia/Hora (opcional) para limpar o gráfico, ou retornar puro.
        const chartData = historyData ? historyData.map(row => ({
            date: new Date(row.snapshot_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            rawTimestamp: row.snapshot_at,
            chaos: row.chaos_value,
            divine: row.divine_value,
            usd: row.estimated_usd
        })) : []

        return NextResponse.json({
            itemName,
            leagueName: activeLeague.name,
            history: chartData
        })
    } catch (error) {
        console.error('[/api/products/[slug]/history] Exception:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
