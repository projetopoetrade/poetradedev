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
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar PoB.'
    console.error('[pob-viewer]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
