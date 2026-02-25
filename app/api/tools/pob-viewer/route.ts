import { NextRequest, NextResponse } from 'next/server'
import { decodePobCode } from '@/lib/pob-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pobCode } = body as { pobCode?: string }

    if (!pobCode || typeof pobCode !== 'string' || pobCode.trim().length === 0) {
      return NextResponse.json({ error: 'pobCode é obrigatório.' }, { status: 400 })
    }

    const data = await decodePobCode(pobCode.trim())

    // ─── Weapon DPS debug ────────────────────────────────────────────────────
    if (process.env.NODE_ENV !== 'production') {
      const allItems = (data.ItemSets ?? []).flatMap(s => s.items ?? [])
      const weapons = allItems.filter(i =>
        i.slot === 'Weapon 1' || i.slot === 'Weapon 2' ||
        i.slot === 'Weapon' || i.slot === 'Offhand',
      )
      if (weapons.length > 0) {
        console.log('[pob-viewer] Weapon slots found:', weapons.length)
        for (const w of weapons) {
          console.log(`[pob-viewer] Weapon [${w.slot}] "${w.name}" (${w.rarity})`, {
            physDamage: w.physDamage ?? null,
            eleDamage:  w.eleDamage  ?? null,
            chaosDamage: w.chaosDamage ?? null,
            critChance: w.critChance ?? null,
            aps:        w.aps        ?? null,
            pDPS: w.physDamage && w.aps
              ? (((w.physDamage[0] + w.physDamage[1]) / 2) * w.aps).toFixed(1)
              : null,
            eDPS: w.eleDamage && w.aps
              ? (((w.eleDamage[0]  + w.eleDamage[1])  / 2) * w.aps).toFixed(1)
              : null,
            cDPS: w.chaosDamage && w.aps
              ? (((w.chaosDamage[0] + w.chaosDamage[1]) / 2) * w.aps).toFixed(1)
              : null,
          })
        }
      } else {
        console.warn('[pob-viewer] No weapon slots found in ItemSets. All slots:', [
          ...new Set(allItems.map(i => i.slot)),
        ])
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar PoB.'
    console.error('[pob-viewer]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
