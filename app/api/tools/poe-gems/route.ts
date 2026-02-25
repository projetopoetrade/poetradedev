import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ─── GET /api/tools/poe-gems ──────────────────────────────────────────────────
//
// Retorna gems com join de dados da tabela items (nome, ícone, tags de item)
// e skill_gems (atributos, tags de gem, flags).
//
// Params:
//   q                       — busca por nome (ilike na tabela items)
//   primary_attribute       — strength | dexterity | intelligence | none
//   is_vaal                 — true/false
//   is_awakened             — true/false
//   is_support              — true/false
//   tag                     — filtro por gem_tag (ex: "Spell", "AoE", "Fire")
//   limit                   — default 20, max 100
//   offset                  — default 0

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q                 = searchParams.get('q')?.trim() ?? ''
  const primaryAttribute  = searchParams.get('primary_attribute')?.trim() ?? ''
  const isVaal            = searchParams.get('is_vaal')
  const isAwakened        = searchParams.get('is_awakened')
  const isSupport         = searchParams.get('is_support')
  const tag               = searchParams.get('tag')?.trim() ?? ''
  const limit             = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset            = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  try {
    const supabase = await createClient()

    // Busca items da class "Active Skill Gem" ou "Support Skill Gem"
    let itemsQuery = supabase
      .from('items')
      .select('name, metadata_id, inventory_icon, class, frame_type, tags, release_version, is_in_game', { count: 'exact' })
      .or('class.eq.Active Skill Gem,class.eq.Support Skill Gem')
      .eq('is_in_game', true)

    if (q) itemsQuery = itemsQuery.ilike('name', `%${q}%`)

    // is_support via class
    if (isSupport === 'true')  itemsQuery = itemsQuery.eq('class', 'Support Skill Gem')
    if (isSupport === 'false') itemsQuery = itemsQuery.eq('class', 'Active Skill Gem')

    itemsQuery = itemsQuery.order('name', { ascending: true }).range(offset, offset + limit - 1)

    const { data: itemsData, count: totalCount, error: itemsError } = await itemsQuery

    if (itemsError) {
      console.error('[/api/tools/poe-gems] items error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    if (!itemsData || itemsData.length === 0) {
      return NextResponse.json({ gems: [], total: 0, limit, offset })
    }

    // Busca skill_gems correspondentes
    let gemQuery = supabase
      .from('skill_gems')
      .select(
        'strength_percent, dexterity_percent, intelligence_percent, ' +
        'primary_attribute, gem_description, gem_tags, support_gem_letter, ' +
        'is_awakened_support_gem, is_vaal_skill_gem, awakened_variant_id, vaal_variant_id'
      )

    if (primaryAttribute) gemQuery = gemQuery.eq('primary_attribute', primaryAttribute)
    if (isVaal === 'true')     gemQuery = gemQuery.eq('is_vaal_skill_gem', true)
    if (isVaal === 'false')    gemQuery = gemQuery.eq('is_vaal_skill_gem', false)
    if (isAwakened === 'true') gemQuery = gemQuery.eq('is_awakened_support_gem', true)
    if (tag) gemQuery = gemQuery.contains('gem_tags', [tag])

    const { data: gemsData } = await gemQuery

    // Join manual por gem_description ↔ items.description
    // (a tabela skill_gems não tem metadata_id próprio)
    const gemsByDesc = new Map<string, typeof gemsData extends Array<infer T> ? T : never>()
    for (const gem of gemsData ?? []) {
      if (gem.gem_description) gemsByDesc.set(gem.gem_description, gem)
    }

    // Busca descriptions dos items para cruzar
    const names = itemsData.map((i) => i.name)
    const { data: itemsWithDesc } = await supabase
      .from('items')
      .select('name, description')
      .in('name', names)
      .or('class.eq.Active Skill Gem,class.eq.Support Skill Gem')

    const descByName = new Map<string, string>()
    for (const i of itemsWithDesc ?? []) {
      if (i.name && i.description) descByName.set(i.name, i.description)
    }

    // Monta resposta final
    const gems = itemsData.map((item) => {
      const desc = descByName.get(item.name) ?? ''
      const gemData = gemsByDesc.get(desc) ?? null
      return {
        name: item.name,
        metadata_id: item.metadata_id,
        inventory_icon: item.inventory_icon,
        class: item.class,
        frame_type: item.frame_type,
        item_tags: item.tags,
        release_version: item.release_version,
        // dados de skill_gems
        primary_attribute: gemData?.primary_attribute ?? null,
        strength_percent: gemData?.strength_percent ?? null,
        dexterity_percent: gemData?.dexterity_percent ?? null,
        intelligence_percent: gemData?.intelligence_percent ?? null,
        gem_description: gemData?.gem_description ?? desc ?? null,
        gem_tags: gemData?.gem_tags ?? null,
        support_gem_letter: gemData?.support_gem_letter ?? null,
        is_awakened_support_gem: gemData?.is_awakened_support_gem ?? null,
        is_vaal_skill_gem: gemData?.is_vaal_skill_gem ?? null,
        awakened_variant_id: gemData?.awakened_variant_id ?? null,
        vaal_variant_id: gemData?.vaal_variant_id ?? null,
      }
    })

    return NextResponse.json({ gems, total: totalCount ?? 0, limit, offset })
  } catch (err) {
    console.error('[/api/tools/poe-gems] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
