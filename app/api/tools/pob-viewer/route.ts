import { NextRequest, NextResponse } from 'next/server';
import { getEngineApiBase } from '@/lib/placeholders/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Thin proxy from the site's `/tools/pob-viewer` UI onto the engine's
 * `POST /api/pob/decode` endpoint.
 *
 * The previous implementation bundled the entire ~1600-line decoder
 * (`lib/pob-parser.ts`) into the site's server build. That code was ported
 * to the engine as `PobDecoderService` (Session 17 Fase D.4) with the same
 * shape + stronger tree-lookup path (reads `PassiveSkill` per-patch instead
 * of GGG master). This route now fans out to that service so the decoder
 * lives in one place.
 *
 * Fallback path: if the engine is unreachable or errors, we still invoke
 * the local decoder so the tool keeps working offline. That path is
 * expected to be removed once `lib/pob-parser.ts` is fully deprecated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pobCode } = body as { pobCode?: string };

    if (!pobCode || typeof pobCode !== 'string' || pobCode.trim().length === 0) {
      return NextResponse.json({ error: 'pobCode é obrigatório.' }, { status: 400 });
    }

    const trimmed = pobCode.trim();
    const engineBase = getEngineApiBase();
    if (engineBase) {
      const engineResponse = await fetchEngineDecode(engineBase, trimmed);
      if (engineResponse.ok) return NextResponse.json(engineResponse.data);
      console.warn(
        `[pob-viewer] engine decode failed (${engineResponse.error}); falling back to local decoder`,
      );
    }

    // Fallback to the legacy in-process decoder. Imported lazily so builds
    // that never hit the fallback (i.e. prod with engine wired up) don't
    // pay the bundle cost.
    const { decodePobCode } = await import('@/lib/pob-parser');
    const data = await decodePobCode(trimmed);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar PoB.';
    console.error('[pob-viewer]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchEngineDecode(
  engineBase: string,
  code: string,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 20_000);
  try {
    const res = await fetch(`${engineBase}/pob/decode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: ac.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${bodyText.slice(0, 200)}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
