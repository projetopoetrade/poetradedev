import { fetchTreeLayout } from "@/lib/engine/tree";
import { getEngineApiBase } from "@/lib/placeholders/engine";
import { PobPreviewClient } from "./PobPreviewClient";

/**
 * Developer sandbox for the Path of Building decoder + summary pipeline.
 *
 * The engine exposes three routes used by this page:
 *   - POST /api/pob/summary       — trimmed `PobSummary` (~400 tokens, LLM)
 *   - POST /api/pob/decode        — full `PobBuildData` (~2-5k tokens, debug)
 *   - GET  /api/pob/items/:id/raw — snapshot rawText for `{{pobitem:id}}`
 *
 * All routes are `@Public()` so the server actions in `./actions.ts` hit
 * them without auth. The server component only reads the engine base at
 * render time (to keep `ENGINE_API_URL` out of the client bundle) and
 * probes it via `fetchTreeLayout` — the probe doesn't block the page, it
 * just gates the Decode button so the UI can warn when the engine is
 * unreachable.
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

  // Non-blocking engine reachability probe. `fetchTreeLayout` has its own
  // 3s timeout and returns null on failure, so worst case we render with
  // the Decode button disabled and an amber hint.
  const layout = await fetchTreeLayout();
  const engineReachable = layout != null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">PoB preview</h1>
          <p className="text-neutral-400 text-sm">
            Decode a Path of Building import code or <code>pobb.in</code>{" "}
            /&nbsp;<code>pastebin.com</code> URL. The page exercises the
            full snapshot pipeline end-to-end: the engine decodes the tree
            + gear, projects down to the <code>PobSummary</code> shape,
            persists rare items as <code>PobItem</code> snapshots, and this
            preview resolves every <code>{`{{item:…}}`}</code> /{" "}
            <code>{`{{pobitem:id}}`}</code> placeholder through the same{" "}
            <code>resolveBlocks()</code> pipeline the blog uses in
            production.
          </p>
        </header>

        <PobPreviewClient
          summaryUrl={`${engineBase}/pob/summary`}
          decodeUrl={`${engineBase}/pob/decode`}
          engineReachable={engineReachable}
        />
      </div>
    </main>
  );
}
