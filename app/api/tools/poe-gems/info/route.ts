import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export interface GemInfo {
  primary_attribute: 'strength' | 'dexterity' | 'intelligence' | 'none' | null
  gem_description: string | null
  strength_percent: number | null
  dexterity_percent: number | null
  intelligence_percent: number | null
}

const SUPPORT_SUFFIX = ' Support'

// ─── GET /api/tools/poe-gems/info?names=Fireball,Ice+Nova,... ─────────────────
//
// Retorna { [gemName]: GemInfo } para uma lista de nomes.
// Busca na tabela skill_gems. No CSV/DB as support gems têm sufixo " Support"
// (ex: "Chance to Poison Support"); o PoB envia sem sufixo ("Chance to Poison").
// A API aceita ambos: busca por nome exato e por "Nome Support".

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const namesParam = searchParams.get('names') ?? ''

  if (!namesParam) return NextResponse.json({})

  const names = namesParam
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 200)

  // Incluir "Name Support" na query para encontrar supports que no DB têm sufixo
  const namesToQuery = [...new Set(names.flatMap((n) => (n.endsWith(SUPPORT_SUFFIX) ? [n] : [n, n + SUPPORT_SUFFIX])))]

  console.log(`[poe-gems/info] Requisição com ${names.length} gems:`, names)

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('skill_gems')
      .select('name, primary_attribute, gem_description, strength_percent, dexterity_percent, intelligence_percent')
      .in('name', namesToQuery)

    if (error) {
      console.error('[poe-gems/info] Erro na query skill_gems:', error)
      return NextResponse.json({}, { status: 500 })
    }

    const result: Record<string, GemInfo> = {}
    for (const gem of data ?? []) {
      if (!gem.name) continue
      const info: GemInfo = {
        primary_attribute: gem.primary_attribute as GemInfo['primary_attribute'],
        gem_description: gem.gem_description,
        strength_percent: gem.strength_percent,
        dexterity_percent: gem.dexterity_percent,
        intelligence_percent: gem.intelligence_percent,
      }
      result[gem.name] = info
      // Expor também pelo nome sem " Support" (ex: PoB envia "Chance to Poison")
      if (gem.name.endsWith(SUPPORT_SUFFIX)) {
        const shortName = gem.name.slice(0, -SUPPORT_SUFFIX.length)
        if (!(shortName in result)) result[shortName] = info
      }
    }

    const matched = names.filter((n) => n in result).length
    const missing = names.filter((n) => !(n in result))
    console.log(`[poe-gems/info] Matches: ${matched}/${names.length}`)
    if (missing.length > 0)
      console.warn('[poe-gems/info] Gems sem match:', missing)

    return NextResponse.json(result)
  } catch (err) {
    console.error('[poe-gems/info] Unexpected error:', err)
    return NextResponse.json({}, { status: 500 })
  }
}
