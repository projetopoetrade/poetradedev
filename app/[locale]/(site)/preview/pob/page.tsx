import { getEngineApiBase } from "@/lib/placeholders/engine";
import { PobPreviewClient } from "./PobPreviewClient";

/**
 * Developer sandbox for the Path of Building decoder endpoints.
 *
 * The engine exposes two routes over a PoB import code / URL:
 *   - POST /api/pob/decode  — full `PobBuildData` (~2-5k tokens, for debug)
 *   - POST /api/pob/summary — trimmed `PobSummary` (~400 tokens, for LLMs)
 *
 * Both are `@Public()` so the browser can hit them directly. This page
 * reads the engine base URL server-side (so `ENGINE_API_URL` stays in
 * server env) and hands the full endpoint URLs to the client component
 * as props.
 */

export const dynamic = "force-dynamic";

export default async function PobPreviewPage() {
  const engineBase = getEngineApiBase();

  if (!engineBase) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
          <header>
            <h1 className="text-3xl font-bold">PoB preview</h1>
          </header>
          <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-6 text-sm text-amber-200">
            Engine not configured. Set <code>ENGINE_API_URL</code> to your
            running content engine, e.g.{" "}
            <code>http://localhost:3000/api</code>.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">PoB preview</h1>
          <p className="text-neutral-400 text-sm">
            Decode a Path of Building import code or <code>pobb.in</code>{" "}
            /&nbsp;<code>pastebin.com</code> URL and inspect either the full
            engine output or the trimmed LLM summary. Summary endpoint is
            what the content pipeline feeds into the model — the token
            estimate below shows the ~5-10× reduction.
          </p>
        </header>

        <PobPreviewClient
          summaryUrl={`${engineBase}/pob/summary`}
          decodeUrl={`${engineBase}/pob/decode`}
        />
      </div>
    </main>
  );
}
