import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function run() {
    console.log('--- DB Check ---')
    const name = 'Mirror of Kalandra'

    const { data: p } = await supabase.from('products').select('name, gameVersion, slug').ilike('name', name).limit(1)
    console.log('Products:', p)

    const { data: l } = await supabase.from('leagues').select('name, poe_ninja_name, isActive').eq('isActive', true)
    console.log('Leagues:', l)

    const { data: h } = await supabase.from('currency_price_history').select('item_name, league, snapshot_at').ilike('item_name', name).limit(5)
    console.log('History:', h)
}

run()
