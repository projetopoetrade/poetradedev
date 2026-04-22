import { NextRequest, NextResponse } from 'next/server';
import { getEngineApiBase } from '@/lib/placeholders/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Thin proxy onto the engine's `POST /api/pob/decode` endpoint.
 *
 * The decoder lives exclusively in the engine (`PobDecoderService` in
 * path-of-trade-content/packages/api/src/modules/knowledge/pob-decoder.service.ts).
 * Engine becomes a hard dependency for this route — if `ENGINE_API_URL`
 * is unset or the engine is unreachable, the call fails with 503.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pobCode } = body as { pobCode?: string };

    if (!pobCode || typeof pobCode !== 'string' || pobCode.trim().length === 0) {
      return NextResponse.json({ error: 'pobCode é obrigatório.' }, { status: 400 });
    }

    const engineBase = getEngineApiBase();
    if (!engineBase) {
      return NextResponse.json(
        { error: 'Engine não configurada (ENGINE_API_URL ausente).' },
        { status: 503 },
      );
    }

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 20_000);
    try {
      const res = await fetch(`${engineBase}/pob/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pobCode.trim() }),
        signal: ac.signal,
        cache: 'no-store',
      });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        console.error(`[pob-viewer] engine HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
        return NextResponse.json(
          { error: `Engine retornou HTTP ${res.status}.` },
          { status: 502 },
        );
      }
      return NextResponse.json(await res.json());
    } finally {
      clearTimeout(timer);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar PoB.';
    console.error('[pob-viewer]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
