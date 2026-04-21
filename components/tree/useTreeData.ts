"use client";

import { useEffect, useRef, useState } from "react";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { GggTreeDocument } from "./tree-types";

/**
 * Client-side fetcher for the GGG tree document. Caching strategy:
 *
 *  1. **IndexedDB** keyed by patch version — parsed doc lives across
 *     sessions/tabs. Zero network on cache hit.
 *  2. **Engine endpoint** `/tree/data?patch=X` — trimmed (~1.5MB plain,
 *     ~400KB gzip) + HTTP `immutable` cache. Preferred source.
 *  3. **GitHub raw** `data.json` — ~6.7MB fallback when the engine is
 *     unavailable (legacy behaviour, still works).
 *
 * Stale entries for prior patches are cleaned up when a new patch loads
 * so the IDB store doesn't balloon over time.
 */

export type TreeDataState =
  | { status: "loading"; source?: "idb" | "engine" | "github"; patch?: string }
  | { status: "error"; error: string }
  | {
      status: "ready";
      doc: GggTreeDocument;
      source: "idb" | "engine" | "github";
      durationMs: number;
    };

interface Sources {
  /** Engine endpoint (trimmed, gzipped). e.g. https://api.../api/tree/data?patch=3.28.0&game=poe1 */
  engine?: string;
  /** GGG raw data.json fallback. */
  github: string;
  /** Patch version — IDB cache key. */
  patch: string;
}

const IDB_KEY_PREFIX = "pot:tree:v1:";
const IDB_INDEX_KEY = "pot:tree:v1:index";

export function useTreeData(sources: Sources | null): TreeDataState {
  const [state, setState] = useState<TreeDataState>({ status: "loading" });
  // Guard re-runs across StrictMode double-invocations.
  const inFlight = useRef<string | null>(null);

  // Depend on primitives so callers can pass a fresh `{engine, github, patch}`
  // object each render without triggering an infinite loop.
  const patch = sources?.patch ?? null;
  const engineUrl = sources?.engine ?? null;
  const githubUrl = sources?.github ?? null;

  useEffect(() => {
    if (!patch || !githubUrl) return;
    const key = `${IDB_KEY_PREFIX}${patch}`;
    if (inFlight.current === key) return;
    inFlight.current = key;
    setState({ status: "loading", patch });
    const controller = new AbortController();

    (async () => {
      // 1. IndexedDB first — instant if we've loaded this patch before.
      const idbStart = performance.now();
      try {
        const cached = (await idbGet(key)) as GggTreeDocument | undefined;
        if (cached && cached.nodes) {
          setState({
            status: "ready",
            doc: cached,
            source: "idb",
            durationMs: Math.round(performance.now() - idbStart),
          });
          // Clean up older patch snapshots (best-effort, fire-and-forget).
          void pruneStaleCaches(patch);
          return;
        }
      } catch {
        // IDB unavailable (private mode?) — fall through.
      }

      // 2. Engine endpoint — trimmed + gzipped.
      if (engineUrl) {
        const fetchStart = performance.now();
        try {
          const res = await fetch(engineUrl, {
            signal: controller.signal,
            cache: "force-cache",
          });
          if (res.ok) {
            const doc = (await res.json()) as GggTreeDocument;
            if (doc && doc.nodes) {
              setState({
                status: "ready",
                doc,
                source: "engine",
                durationMs: Math.round(performance.now() - fetchStart),
              });
              void idbSet(key, doc).catch(() => {});
              void markCached(patch);
              return;
            }
          }
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          // fall through to GitHub raw
        }
      }

      // 3. GitHub raw fallback.
      const fetchStart = performance.now();
      try {
        const res = await fetch(githubUrl, {
          signal: controller.signal,
          cache: "force-cache",
        });
        if (!res.ok) {
          setState({ status: "error", error: `GGG data.json: ${res.status}` });
          return;
        }
        const doc = (await res.json()) as GggTreeDocument;
        setState({
          status: "ready",
          doc,
          source: "github",
          durationMs: Math.round(performance.now() - fetchStart),
        });
        void idbSet(key, doc).catch(() => {});
        void markCached(patch);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", error: (err as Error).message });
      }
    })();

    return () => {
      controller.abort();
      inFlight.current = null;
    };
  }, [patch, engineUrl, githubUrl]);

  return state;
}

// ---------------------------------------------------------------------------
// Simple index so we can prune stale snapshots — IndexedDB doesn't have a
// native TTL and we don't want to hoard 5MB per obsolete patch forever.
// ---------------------------------------------------------------------------

async function markCached(patch: string) {
  try {
    const idx = ((await idbGet(IDB_INDEX_KEY)) as string[] | undefined) ?? [];
    if (!idx.includes(patch)) {
      idx.push(patch);
      await idbSet(IDB_INDEX_KEY, idx);
    }
  } catch {}
}

async function pruneStaleCaches(keepPatch: string) {
  try {
    const idx = ((await idbGet(IDB_INDEX_KEY)) as string[] | undefined) ?? [];
    const toDelete = idx.filter((p) => p !== keepPatch);
    if (!toDelete.length) return;
    for (const p of toDelete) {
      await idbDel(`${IDB_KEY_PREFIX}${p}`).catch(() => {});
    }
    await idbSet(IDB_INDEX_KEY, [keepPatch]);
  } catch {}
}
