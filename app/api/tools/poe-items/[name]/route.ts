import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { PoeItem } from '../route'

interface SkillGem {
  id: string
  strength_percent: number | null
  dexterity_percent: number | null
  intelligence_percent: number | null
  primary_attribute: string | null
  gem_description: string | null
  gem_tags: string[] | null
  support_gem_letter: string | null
  is_awakened_support_gem: boolean | null
  is_vaal_skill_gem: boolean | null
  awakened_variant_id: string | null
  vaal_variant_id: string | null
}

// ─── GET /api/tools/poe-items/[name] ─────────────────────────────────────────
//
// Retorna o item pelo nome exato + dados de skill_gem caso seja uma gem.
// Para itens com múltiplos registros (duplicatas do wiki), retorna o primeiro
// que tiver metadata_id.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  try {
    const supabase = await createClient()

    // Busca o item — prioriza registros com metadata_id
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('name', decodedName)
      .order('metadata_id', { ascending: false, nullsFirst: false })
      .limit(1)

    if (error) {
      console.error('[/api/tools/poe-items/[name]] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const item = items[0] as PoeItem
    let skill_gem: SkillGem | null = null

    // Se for uma Skill Gem, busca os dados suplementares
    // Faz match pela descrição ou pelo metadata_id no awakened/vaal_variant_id
    if (item.class?.toLowerCase().includes('gem') || item.frame_type === 4) {
      const { data: gemData } = await supabase
        .from('skill_gems')
        .select(
          'id, strength_percent, dexterity_percent, intelligence_percent, ' +
          'primary_attribute, gem_description, gem_tags, support_gem_letter, ' +
          'is_awakened_support_gem, is_vaal_skill_gem, awakened_variant_id, vaal_variant_id'
        )
        .or(
          `awakened_variant_id.eq.${item.metadata_id ?? ''},` +
          `vaal_variant_id.eq.${item.metadata_id ?? ''}`
        )
        .limit(1)

      // Fallback: busca por gem_description igual à description do item
      if (!gemData || gemData.length === 0) {
        const { data: gemByDesc } = await supabase
          .from('skill_gems')
          .select(
            'id, strength_percent, dexterity_percent, intelligence_percent, ' +
            'primary_attribute, gem_description, gem_tags, support_gem_letter, ' +
            'is_awakened_support_gem, is_vaal_skill_gem, awakened_variant_id, vaal_variant_id'
          )
          .eq('gem_description', item.description ?? '')
          .limit(1)

        skill_gem = gemByDesc?.[0] ?? null
      } else {
        skill_gem = gemData[0]
      }
    }

    return NextResponse.json({ item, skill_gem })
  } catch (err) {
    console.error('[/api/tools/poe-items/[name]] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
