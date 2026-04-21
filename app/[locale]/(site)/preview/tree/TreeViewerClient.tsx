"use client";

import { useCallback, useMemo, useState } from "react";
import { PassiveTreeViewer } from "@/components/tree/PassiveTreeViewer";
import { PassivePortalTooltip } from "@/components/tree/PassivePortalTooltip";
import { PassiveTreeSearch } from "@/components/tree/PassiveTreeSearch";
import { useTreeData } from "@/components/tree/useTreeData";
import { computeLayout } from "@/components/tree/tree-positioning";
import type { PositionedNode } from "@/components/tree/tree-types";

/**
 * Preview page client wrapper. Fetches the GGG `data.json` (pinned to the
 * active patch by the engine) on mount, then renders the canvas viewer
 * with search/filter controls on top and a floating tooltip on hover.
 */

interface Props {
  engineBase: string | null;
  treeDataUrl: string | null;
  dataJsonUrl: string;
  assetBaseUrl: string;
  patch: string;
  nodeCount: number;
}

export function TreeViewerClient({
  engineBase,
  treeDataUrl,
  dataJsonUrl,
  assetBaseUrl,
  patch,
  nodeCount,
}: Props) {
  // Engine URL is stored relative (e.g. "/tree/data?patch=...") — join with
  // the configured engine base so the browser can reach the right host.
  const engineUrl =
    engineBase && treeDataUrl
      ? treeDataUrl.startsWith("http")
        ? treeDataUrl
        : `${engineBase}${treeDataUrl}`
      : undefined;
  const state = useTreeData({ engine: engineUrl, github: dataJsonUrl, patch });
  const [hovered, setHovered] = useState<{
    node: PositionedNode | null;
    screenX: number;
    screenY: number;
  }>({ node: null, screenX: 0, screenY: 0 });
  const [highlighted, setHighlighted] = useState<Set<number>>(() => new Set());

  // Stable callback identity so PassiveTreeSearch's useMemo doesn't thrash.
  const handleHighlight = useCallback((ids: Set<number>) => {
    setHighlighted(ids);
  }, []);

  const layoutNodes = useMemo(() => {
    if (state.status !== "ready") return [];
    return computeLayout(state.doc).nodes;
  }, [state]);

  const handleNodeClick = useCallback((node: PositionedNode) => {
    // Copy the engine placeholder to the clipboard so the user can paste
    // it into a post draft directly.
    const placeholder = `{{passive:${node.name}}}`;
    void navigator.clipboard?.writeText(placeholder);
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400">
        Loading tree data…
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
        Failed to load tree: {state.error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Patch: <span className="font-mono text-neutral-200">{patch}</span>
          </span>
          <span>
            Nodes: <span className="font-mono text-neutral-200">{nodeCount}</span>
          </span>
          <span>
            Loaded in: <span className="font-mono text-neutral-200">{state.durationMs}ms</span>
          </span>
          <span>
            Source:{" "}
            <span className="font-mono text-neutral-200" title={sourceLabel(state.source)}>
              {state.source}
            </span>
          </span>
        </div>
        <a
          href={dataJsonUrl}
          target="_blank"
          rel="noreferrer"
          className="text-neutral-500 hover:text-neutral-300"
        >
          data.json ↗
        </a>
      </div>

      <PassiveTreeSearch nodes={layoutNodes} onHighlight={handleHighlight} />

      <PassiveTreeViewer
        doc={state.doc}
        assetBaseUrl={assetBaseUrl}
        highlightedIds={highlighted}
        height={680}
        onNodeHover={(node, screenX, screenY) => setHovered({ node, screenX, screenY })}
        onNodeClick={handleNodeClick}
      />

      <p className="text-xs text-neutral-500">
        Tip: click any node to copy its <code className="bg-neutral-900 px-1">{"{{passive:Name}}"}</code> placeholder to the clipboard.
      </p>

      <PassivePortalTooltip
        node={hovered.node}
        screenX={hovered.screenX}
        screenY={hovered.screenY}
      />
    </div>
  );
}

function sourceLabel(source: "idb" | "engine" | "github"): string {
  switch (source) {
    case "idb":
      return "IndexedDB cache (zero network on this visit)";
    case "engine":
      return "Engine /api/tree/data (trimmed + gzipped)";
    case "github":
      return "GitHub raw data.json (full 6.7MB fallback)";
  }
}
