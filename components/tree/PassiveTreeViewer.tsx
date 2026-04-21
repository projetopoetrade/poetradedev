"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GggTreeDocument, PositionedNode } from "./tree-types";
import { computeLayout } from "./tree-positioning";
import { ACTIVE_COLOR, nodeFill } from "./tree-colors";

/**
 * PassiveTreeViewer — Canvas 2D renderer for the full PoE passive tree,
 * styled after pobb.in: colour-coded dots by stat theme, white connectors,
 * gold highlight on the allocated path.
 *
 * Sprite-sheet icons are optional — the GGG data.json publishes sheets at
 * poecdn.com but CORS doesn't allow drawing them onto a canvas cleanly.
 * We keep the coloured-dot base layer as the primary visual.
 *
 * Rendering layers (back to front):
 *  1. Background
 *  2. Group halos (subtle blobs behind multi-node clusters)
 *  3. Connection lines (arc if same group+orbit, line otherwise)
 *  4. Node dots coloured by stat type (see tree-colors.ts)
 *  5. Notable / keystone outlines
 *  6. Hover ring
 */

interface Props {
  doc: GggTreeDocument;
  allocatedIds?: ReadonlySet<number>;
  highlightedIds?: ReadonlySet<number>;
  /** Kept for API compatibility — sprite rendering currently disabled. */
  assetBaseUrl?: string;
  height?: number;
  onNodeHover?: (node: PositionedNode | null, screenX: number, screenY: number) => void;
  onNodeClick?: (node: PositionedNode) => void;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const DEFAULT_SCALE = 0.18;
const MIN_SCALE = 0.05;
const MAX_SCALE = 1.0;

// Sprite sheet rendering was intentionally disabled — the GGG data.json
// points at web.poecdn.com sprite sheets that don't send CORS headers,
// so drawImage either taints the canvas or fails silently under strict
// browsers. pobb.in, poe.ninja, and the in-game tree all render the
// overview as coloured dots; we follow the same play here. Individual
// node icons live in Item.iconUrl on the engine and power the tooltip.

export function PassiveTreeViewer({
  doc,
  allocatedIds,
  highlightedIds,
  assetBaseUrl: _assetBaseUrl,
  height = 600,
  onNodeHover,
  onNodeClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ViewState>({ scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 });
  const [isReady, setIsReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; moved: boolean }>({
    active: false,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const layout = useMemo(() => computeLayout(doc), [doc]);

  // Initial camera centering — middle of extents, default scale.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (doc.min_x + doc.max_x) / 2;
    const cy = (doc.min_y + doc.max_y) / 2;
    viewRef.current = {
      scale: DEFAULT_SCALE,
      offsetX: rect.width / 2 - cx * DEFAULT_SCALE,
      offsetY: rect.height / 2 - cy * DEFAULT_SCALE,
    };
    setIsReady(true);
  }, [doc]);

  const worldToScreen = useCallback((x: number, y: number) => {
    const v = viewRef.current;
    return { x: x * v.scale + v.offsetX, y: y * v.scale + v.offsetY };
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear — slightly warm near-black to match poe.ninja's tree bg
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const view = viewRef.current;
    const scale = view.scale;

    // ─── Connections ─────────────────────────────────────────────────
    // poe.ninja style: warm-dark bronze for inactive, bright gold for
    // allocated pairs. Round caps + butt joins keep arcs looking clean.
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const c of layout.connections) {
      const a = layout.byId.get(c.a);
      const b = layout.byId.get(c.b);
      if (!a || !b) continue;
      const aAlloc = allocatedIds?.has(a.id) ?? false;
      const bAlloc = allocatedIds?.has(b.id) ?? false;
      const bothAlloc = aAlloc && bAlloc;
      const sa = worldToScreen(a.x, a.y);
      const sb = worldToScreen(b.x, b.y);

      // Cull off-screen
      if (
        (sa.x < 0 && sb.x < 0) ||
        (sa.x > rect.width && sb.x > rect.width) ||
        (sa.y < 0 && sb.y < 0) ||
        (sa.y > rect.height && sb.y > rect.height)
      ) {
        continue;
      }

      if (bothAlloc) {
        // Allocated path — warm gold
        ctx.strokeStyle = c.isAscendancy ? "#b0d4ff" : "#f2c94c";
        ctx.lineWidth = Math.max(2, 4 * scale);
        ctx.shadowColor = "rgba(242, 201, 76, 0.4)";
        ctx.shadowBlur = 6;
      } else if (c.isAscendancy) {
        ctx.strokeStyle = "#24344a";
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        ctx.shadowBlur = 0;
      } else {
        // Inactive tan/bronze — matches poe.ninja's desaturated warm grey
        ctx.strokeStyle = "#54452f";
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      if (c.arc) {
        const ccx = c.arc.cx * scale + view.offsetX;
        const ccy = c.arc.cy * scale + view.offsetY;
        const cr = c.arc.radius * scale;
        ctx.arc(ccx, ccy, cr, c.arc.startAngle, c.arc.endAngle, c.arc.counterclockwise);
      } else {
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ─── Nodes ───────────────────────────────────────────────────────
    // Coloured dot per node (red Str / green Dex / blue Int / etc).
    // Notables get a thin cream ring, keystones a thicker gold ring,
    // allocated nodes flip to warm gold fill + subtle glow.
    const highlightMode = (highlightedIds?.size ?? 0) > 0;
    for (const node of layout.nodes) {
      const s = worldToScreen(node.x, node.y);
      const radius = nodeRadiusFor(node.kind, scale);
      if (s.x < -40 || s.x > rect.width + 40 || s.y < -40 || s.y > rect.height + 40) continue;

      const active = allocatedIds?.has(node.id) ?? false;
      const highlighted = highlightedIds?.has(node.id) ?? false;
      const dim = highlightMode && !highlighted && !active;

      if (active) {
        ctx.shadowColor = "rgba(248, 213, 107, 0.6)";
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = dim ? "#222018" : nodeFill(node, active);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Outlines by kind — keystones / notables / jewel sockets.
      // Inactive keystones stay plain (matching pobb.in: no glow until
      // allocated). Active ones get the warm cream ring.
      if (node.kind === "keystone" && active) {
        ctx.lineWidth = Math.max(1.25, 2.5 * scale);
        ctx.strokeStyle = "#ffedb0";
        ctx.stroke();
      } else if (node.kind === "notable") {
        ctx.lineWidth = Math.max(0.75, 1.75 * scale);
        ctx.strokeStyle = active ? "#ffedb0" : dim ? "#2a2a2a" : "#8e7a4c";
        ctx.stroke();
      } else if (node.kind === "jewel_socket") {
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeStyle = dim ? "#2a2a2a" : "#6f6f76";
        ctx.stroke();
      }

      if (highlighted && !active) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#fef3c7";
        ctx.stroke();
      }
    }

    // Hover ring on top
    if (hoveredId != null) {
      const h = layout.byId.get(hoveredId);
      if (h) {
        const s = worldToScreen(h.x, h.y);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, nodeRadiusFor(h.kind, scale) * 1.2 + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [layout, allocatedIds, highlightedIds, hoveredId, worldToScreen, doc.constants, doc.groups, doc.nodes]);

  // Debounced render trigger via rAF
  const pendingRenderRef = useRef(false);
  const requestRender = useCallback(() => {
    if (pendingRenderRef.current) return;
    pendingRenderRef.current = true;
    requestAnimationFrame(() => {
      pendingRenderRef.current = false;
      render();
    });
  }, [render]);

  useEffect(() => {
    if (isReady) requestRender();
  }, [isReady, requestRender]);

  // ------------------------------------------------------------------
  // Interactions
  // ------------------------------------------------------------------

  const findNodeAt = useCallback(
    (sx: number, sy: number): PositionedNode | null => {
      const v = viewRef.current;
      let best: PositionedNode | null = null;
      let bestDist = Infinity;
      for (const node of layout.nodes) {
        const wx = node.x * v.scale + v.offsetX;
        const wy = node.y * v.scale + v.offsetY;
        const radius = nodeRadiusFor(node.kind, v.scale) * 1.4;
        const dx = sx - wx;
        const dy = sy - wy;
        const dist = dx * dx + dy * dy;
        if (dist < radius * radius && dist < bestDist) {
          bestDist = dist;
          best = node;
        }
      }
      return best;
    },
    [layout],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX - viewRef.current.offsetX,
      startY: e.clientY - viewRef.current.offsetY,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX - viewRef.current.offsetX;
      const dy = e.clientY - dragRef.current.startY - viewRef.current.offsetY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
      viewRef.current.offsetX = e.clientX - dragRef.current.startX;
      viewRef.current.offsetY = e.clientY - dragRef.current.startY;
      requestRender();
      return;
    }

    const node = findNodeAt(sx, sy);
    const nextId = node?.id ?? null;
    if (nextId !== hoveredId) {
      setHoveredId(nextId);
      onNodeHover?.(node, e.clientX, e.clientY);
    } else if (node) {
      onNodeHover?.(node, e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(e.pointerId);
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (!wasMoved && onNodeClick) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const node = findNodeAt(sx, sy);
      if (node) onNodeClick(node);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const v = viewRef.current;

    const delta = -e.deltaY * 0.002;
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * (1 + delta)));
    if (nextScale === v.scale) return;

    // Anchor zoom at mouse cursor
    const worldX = (sx - v.offsetX) / v.scale;
    const worldY = (sy - v.offsetY) / v.scale;
    v.scale = nextScale;
    v.offsetX = sx - worldX * nextScale;
    v.offsetY = sy - worldY * nextScale;
    requestRender();
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    onNodeHover?.(null, 0, 0);
  };

  const zoomBy = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const v = viewRef.current;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
    const worldCX = (rect.width / 2 - v.offsetX) / v.scale;
    const worldCY = (rect.height / 2 - v.offsetY) / v.scale;
    v.scale = next;
    v.offsetX = rect.width / 2 - worldCX * next;
    v.offsetY = rect.height / 2 - worldCY * next;
    requestRender();
  };

  const resetView = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (doc.min_x + doc.max_x) / 2;
    const cy = (doc.min_y + doc.max_y) / 2;
    viewRef.current = {
      scale: DEFAULT_SCALE,
      offsetX: rect.width / 2 - cx * DEFAULT_SCALE,
      offsetY: rect.height / 2 - cy * DEFAULT_SCALE,
    };
    requestRender();
  };

  // Pan on resize
  useEffect(() => {
    const onResize = () => requestRender();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [requestRender]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="h-full w-full touch-none select-none"
        style={{ cursor: dragRef.current.active ? "grabbing" : "grab" }}
      />
      <div className="absolute right-3 bottom-3 flex gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          className="rounded bg-neutral-900/80 px-2 py-1 text-sm text-neutral-200 backdrop-blur hover:bg-neutral-800"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          className="rounded bg-neutral-900/80 px-2 py-1 text-sm text-neutral-200 backdrop-blur hover:bg-neutral-800"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded bg-neutral-900/80 px-2 py-1 text-xs text-neutral-200 backdrop-blur hover:bg-neutral-800"
        >
          Fit
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nodeRadiusFor(kind: PositionedNode["kind"], scale: number): number {
  // Sized to mimic pobb.in — small dots, notables a touch bigger with a
  // ring outline, keystones the largest.
  switch (kind) {
    case "keystone":
      return Math.max(5, 26 * scale);
    case "notable":
      return Math.max(3.5, 14 * scale);
    case "jewel_socket":
      return Math.max(4, 20 * scale);
    case "mastery":
      return Math.max(3, 12 * scale);
    case "class_start":
      return Math.max(5, 32 * scale);
    case "ascendancy":
      return Math.max(2.5, 11 * scale);
    default:
      return Math.max(2, 7 * scale);
  }
}
