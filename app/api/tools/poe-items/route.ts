import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PoeItem {
  id: string
  name: string
  class: string | null
  class_id: string | null
  rarity: string | null
  base_item: string | null
  metadata_id: string | null
  release_version: string | null
  removal_version: string | null
  drop_enabled: boolean | null
  drop_level: number | null
  drop_level_maximum: number | null
  required_level: number | null
  required_strength: number | null
  required_dexterity: number | null
  required_intelligence: number | null
  is_corrupted: boolean | null
  is_replica: boolean | null
  is_fractured: boolean | null
  is_synthesised: boolean | null
  is_in_game: boolean | null
  frame_type: number | null
  quality: number | null
  size_x: number | null
  size_y: number | null
  tags: string[] | null
  influences: string[] | null
  description: string | null
  stat_text: string | null
  explicit_stat_text: string | null
  implicit_stat_text: string | null
  flavour_text: string | null
  inventory_icon: string | null
}

// ─── GET /api/tools/poe-items ─────────────────────────────────────────────────
//
// Params:
//   q         — full-text search no campo name (ilike)
//   class     — filtrar por class (ex: "Skill Gem", "Currency Item")
//   rarity    — filtrar por rarity (Normal | Magic | Rare | Unique)
//   frame_type — filtrar por frame_type (integer)
//   is_in_game — true/false (default: true)
//   limit     — itens por página (default: 20, max: 100)
//   offset    — paginação (default: 0)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q          = searchParams.get('q')?.trim() ?? ''
  const itemClass  = searchParams.get('class')?.trim() ?? ''
  const rarity     = searchParams.get('rarity')?.trim() ?? ''
  const frameType  = searchParams.get('frame_type')
  const isInGame   = searchParams.get('is_in_game') ?? 'true'
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset     = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  try {
    const supabase = await createClient()

    let query = supabase
      .from('items')
      .select(
        'id, name, class, class_id, rarity, base_item, metadata_id, release_version, ' +
        'removal_version, drop_enabled, drop_level, drop_level_maximum, ' +
        'required_level, required_strength, required_dexterity, required_intelligence, ' +
        'is_corrupted, is_replica, is_fractured, is_synthesised, is_in_game, ' +
        'frame_type, quality, size_x, size_y, tags, influences, ' +
        'description, stat_text, explicit_stat_text, implicit_stat_text, flavour_text, inventory_icon',
        { count: 'exact' }
      )

    if (q)          query = query.ilike('name', `%${q}%`)
    if (itemClass)  query = query.eq('class', itemClass)
    if (rarity)     query = query.eq('rarity', rarity)
    if (frameType)  query = query.eq('frame_type', parseInt(frameType, 10))
    if (isInGame === 'true')  query = query.eq('is_in_game', true)
    if (isInGame === 'false') query = query.eq('is_in_game', false)

    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[/api/tools/poe-items] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data as PoeItem[],
      total: count ?? 0,
      limit,
      offset,
    })
  } catch (err) {
    console.error('[/api/tools/poe-items] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
