import { fetchTreeLayout } from "@/lib/engine/tree";
import { getEngineApiBase } from "@/lib/placeholders/engine";
import { TreeViewerClient } from "./TreeViewerClient";

/**
 * Developer sandbox for the new passive-tree viewer.
 *
 * Server-side we only fetch pointers from the engine: which patch is
 * active + where to get the `data.json` and assets. Everything heavy runs
 * client-side so the page streams fast and the 6 MB tree data is cached by
 * the browser + GitHub CDN instead of by our server.
 */

export const dynamic = "force-dynamic";

export default async function TreePreviewPage() {
  const layout = await fetchTreeLayout();

  if (!layout) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
          <header>
            <h1 className="text-3xl font-bold">Passive tree preview</h1>
          </header>
          <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-6 text-sm text-amber-200">
            Engine not configured. Set <code>ENGINE_API_URL</code> or run a tree
            refresh first: <code className="block mt-2 font-mono">npm run tree:refresh -- --version=3.28.0 --activate</code>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Passive tree preview</h1>
          <p className="text-neutral-400 text-sm">
            Rendered from the official GGG <code>skilltree-export</code> repo,
            pinned to tag <span className="font-mono">{layout.patch}</span>.
            Sprites load from GitHub raw (tag-pinned), tooltips read from the
            engine. No iframe, no hardcoded dump — reactive to the active
            patch set via <code>POST /api/passives/activate</code>.
          </p>
        </header>

        <TreeViewerClient
          engineBase={getEngineApiBase()}
          treeDataUrl={layout.treeDataUrl ?? null}
          dataJsonUrl={layout.dataJsonUrl}
          assetBaseUrl={layout.assetBaseUrl}
          patch={layout.patch}
          nodeCount={layout.nodeCount}
        />
      </div>
    </main>
  );
}
