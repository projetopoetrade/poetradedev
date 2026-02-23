import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 3600 // 1 hora de cache

export async function GET() {
    try {
        const supabase = await createClient()

        // Busca apenas ligas ativas, de todos os jogos
        const { data, error } = await supabase
            .from('leagues')
            .select('name, gameVersion, poe_ninja_name')
            .eq('isActive', true)
            .order('name', { ascending: true })

        if (error) {
            console.error('[/api/tools/leagues] Error fetching leagues:', error)
            return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 })
        }

        // Agrupa por jogo para facilitar o uso no frontend e no cron
        const poe1Leagues = data?.filter(l => l.gameVersion === 'path-of-exile-1') || []
        const poe2Leagues = data?.filter(l => l.gameVersion === 'path-of-exile-2') || []

        return NextResponse.json({
            poe1: poe1Leagues,
            poe2: poe2Leagues,
        })
    } catch (error) {
        console.error('[/api/tools/leagues] Exception:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
