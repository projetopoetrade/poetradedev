import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getEngineApiBase } from '@/lib/placeholders/engine'

export const revalidate = 600 // Cache de 10 minutos

/**
 * Histórico de preço de um produto, servido pelo engine (poetrade-content).
 *
 * Antes vinha de `currency_price_history`, alimentada por um pg_cron horário no
 * Supabase. Aquele caminho foi aposentado: o cron parou em 03/07/2026 sem gerar
 * um único log de erro, e ninguém percebeu por 25 dias — o gráfico simplesmente
 * exibia dado velho. Pior, ele não descobria liga nova sozinho, então a Allflame
 * tinha zero pontos.
 *
 * O engine já coletava a mesma coisa em paralelo, a cada 30 min, com
 * auto-descoberta de liga. Na comparação de 28/07 ele tinha 4 pontos de Allflame
 * (contra 0) e 1.408 de Mirage (contra 211, parados).
 *
 * O USD é calculado aqui a partir do valor em divine e da âncora da liga
 * (`leagues.divine_usd` × markup) — a mesma conta que precifica a loja. O campo
 * `estimated_usd` da tabela antiga vinha zerado, porque a âncora que ele usava
 * era o preço do Divine Orb de uma liga arbitrária.
 */
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

        // Busca direcionada em vez de carregar o catálogo inteiro em memória:
        // `slug` e `url_slug` cobrem as duas formas que a URL pode ter.
        const { data: matches } = await supabase
            .from('products')
            .select('name, gameVersion, slug, league')
            .or(`slug.eq.${slug},url_slug.eq.${slug}`)
            .limit(1)

        const product = matches?.[0]
        const gameVersion = product?.gameVersion ?? 'path-of-exile-1'
        const itemName = product?.name ?? formattedName

        const { searchParams } = new URL(request.url)
        const requestedLeague = searchParams.get('league')

        let leagueQuery = supabase
            .from('leagues')
            .select('name, poe_ninja_name, divine_usd, price_markup')
        leagueQuery = requestedLeague
            ? leagueQuery.eq('name', requestedLeague)
            : leagueQuery.eq('gameVersion', gameVersion).eq('isActive', true)

        const { data: leagues } = await leagueQuery.limit(1)
        const activeLeague = leagues?.[0]

        if (!activeLeague) {
            return NextResponse.json({ error: 'No active league found for this game' }, { status: 404 })
        }

        const engineBase = getEngineApiBase()
        if (!engineBase) {
            return NextResponse.json(
                { error: 'Engine não configurada (ENGINE_API_URL ausente).' },
                { status: 503 }
            )
        }

        // O engine indexa pelo nome que o poe.ninja usa para a liga.
        const engineLeague = activeLeague.poe_ninja_name || activeLeague.name
        const url = `${engineBase}/ninja/history/${encodeURIComponent(itemName)}?league=${encodeURIComponent(engineLeague)}`

        const response = await fetch(url, { next: { revalidate: 600 } })
        if (!response.ok) {
            console.error('[/api/products/[slug]/history] Engine respondeu', response.status, url)
            return NextResponse.json({ error: 'Failed to fetch history' }, { status: 502 })
        }

        const payload = await response.json() as {
            points?: Array<{ timestamp: string; chaosValue: number; divineValue: number }>
        }

        const usdPerDivine =
            activeLeague.divine_usd != null
                ? activeLeague.divine_usd * (1 + (activeLeague.price_markup ?? 0))
                : null

        const history = (payload.points || []).map(point => ({
            date: new Date(point.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            rawTimestamp: point.timestamp,
            chaos: point.chaosValue,
            divine: point.divineValue,
            usd: usdPerDivine != null ? point.divineValue * usdPerDivine : null,
        }))

        return NextResponse.json({
            itemName,
            leagueName: activeLeague.name,
            history,
        })
    } catch (error) {
        console.error('[/api/products/[slug]/history] Exception:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
