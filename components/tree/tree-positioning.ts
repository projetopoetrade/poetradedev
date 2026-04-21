import type {
  GggTreeDocument,
  GggNode,
  PositionedNode,
  Connection,
  PassiveKind,
} from './tree-types';

/**
 * Convert a GGG tree document into a flat list of positioned nodes ready to
 * render. Node world coords are derived from the group position plus the
 * polar (orbit, orbitIndex) offset — this is the same math PoBB and the
 * official tree viewer use.
 *
 * For orbits 2 and 3 (16-slot orbits) PoE uses a non-uniform angle table,
 * not a simple equal division, so we emulate that here.
 */

/** Custom angle map for 16-slot orbits (orbits 2 and 3). Degrees. */
const ORBIT_16_ANGLES_DEG = [
  0, 30, 45, 60, 90, 120, 135, 150,
  180, 210, 225, 240, 270, 300, 315, 330,
];

/** Custom angle map for 40-slot orbit (orbit 4). Degrees. */
const ORBIT_40_ANGLES_DEG = [
  0, 10, 20, 30, 40, 45, 50, 60, 70, 80,
  90, 100, 110, 120, 130, 135, 140, 150, 160, 170,
  180, 190, 200, 210, 220, 225, 230, 240, 250, 260,
  270, 280, 290, 300, 310, 315, 320, 330, 340, 350,
];

/**
 * Polar angle of a node relative to its group centre. Returned in my
 * convention (0 = up, clockwise increasing), same formula used to compute
 * node world coords.
 */
export function orbitAngle(orbit: number, orbitIndex: number, skillsPerOrbit: number[]): number {
  if (orbit === 2 || orbit === 3) {
    const deg = ORBIT_16_ANGLES_DEG[orbitIndex % 16] ?? 0;
    return (deg * Math.PI) / 180;
  }
  if (orbit === 4) {
    const deg = ORBIT_40_ANGLES_DEG[orbitIndex % 40] ?? 0;
    return (deg * Math.PI) / 180;
  }
  const slots = skillsPerOrbit[orbit] || 1;
  return (2 * Math.PI * orbitIndex) / slots;
}

/**
 * Converts a polar angle (my convention: 0 = up, CW-positive) to the canvas
 * angle convention (0 = right, CCW-positive) so `ctx.arc()` draws it
 * correctly. Relation: (x = cx + r·sin θ, y = cy − r·cos θ) maps to
 * (x = cx + r·cos φ, y = cy + r·sin φ) with φ = θ − π/2.
 */
function toCanvasAngle(theta: number): number {
  return theta - Math.PI / 2;
}

export function classifyKind(n: GggNode): PassiveKind {
  if (n.classStartIndex !== undefined) return 'class_start';
  if (n.isKeystone) return 'keystone';
  if (n.isNotable) return 'notable';
  if (n.isJewelSocket) return 'jewel_socket';
  if (n.isMastery) return 'mastery';
  if (n.ascendancyName) return 'ascendancy';
  return 'small';
}

/**
 * Walk every node in the doc, compute absolute (world) x/y, and flatten
 * `in`/`out` edges into dedup'd connection pairs.
 *
 * Skips proxy nodes (timeless jewel expansion anchors) — they have group
 * coords but no intended visual on the base tree.
 */
export function computeLayout(doc: GggTreeDocument): {
  nodes: PositionedNode[];
  connections: Connection[];
  byId: Map<number, PositionedNode>;
} {
  const orbitRadii = doc.constants?.orbitRadii ?? [];
  const skillsPerOrbit = doc.constants?.skillsPerOrbit ?? [];
  const positioned: PositionedNode[] = [];
  const byId = new Map<number, PositionedNode>();

  for (const [idStr, node] of Object.entries(doc.nodes)) {
    if (node.isProxy) continue;
    const gid = node.group;
    if (gid === undefined) continue;
    const group = doc.groups?.[String(gid)];
    if (!group) continue;

    const orbit = node.orbit ?? 0;
    const orbitIndex = node.orbitIndex ?? 0;
    const radius = orbitRadii[orbit] ?? 0;
    const angle = orbitAngle(orbit, orbitIndex, skillsPerOrbit);

    const x = group.x + radius * Math.sin(angle);
    const y = group.y - radius * Math.cos(angle);

    const id = Number(idStr);
    const p: PositionedNode = {
      id,
      name: node.name ?? `Node ${id}`,
      x,
      y,
      kind: classifyKind(node),
      ascendancyName: node.ascendancyName ?? null,
      stats: Array.isArray(node.stats) ? node.stats : [],
      flavourText: node.flavourText?.join('\n') ?? null,
      isActiveSpec: false,
      raw: node,
    };
    positioned.push(p);
    byId.set(id, p);
  }

  // Build connections from `out` edges, dedup via sorted (low, high) key.
  //
  // The GGG data.json wires class_start → ascendancyStart and wormhole-like
  // pairs across the tree for game-logic purposes. Those aren't meant to
  // be drawn as visible lines — if an edge crosses region boundaries (main
  // tree ↔ ascendancy, or different ascendancies) we skip it.
  //
  // An `isAscendancyStart` node bridges classes to their ascendancy tree;
  // its edges to the main tree shouldn't render either.
  const seen = new Set<string>();
  const connections: Connection[] = [];
  for (const node of positioned) {
    const outs = node.raw.out ?? [];
    for (const otherStr of outs) {
      const other = Number(otherStr);
      const b = byId.get(other);
      if (!b) continue;

      // Skip region-crossing edges — main tree and ascendancy trees live in
      // visually separate areas and shouldn't have visible connectors.
      const aAsc = node.ascendancyName ?? null;
      const bAsc = b.ascendancyName ?? null;
      if (aAsc !== bAsc) continue;

      // Masteries sit at the centre of their cluster; in-game and on
      // pobb.in they render as a floating dot without any line to the
      // surrounding wheel. Suppress any edge that touches a mastery.
      if (node.kind === 'mastery' || b.kind === 'mastery') continue;

      // isAscendancyStart bridges the two regions; its edges to the main
      // tree fall out of the filter above. Its edges within the ascendancy
      // region DO render (they link to the first notable), which is what
      // we want.
      const lo = Math.min(node.id, other);
      const hi = Math.max(node.id, other);
      const key = `${lo}|${hi}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const isAscendancy = !!(aAsc && bAsc);

      // Nodes on the same orbit inside the same group are connected by an
      // arc segment along that orbit — rendering them as straight chords
      // (our previous behaviour) made clusters look boxy and jagged. Only
      // applies when both endpoints share (group, orbit) and the orbit has
      // a non-zero radius.
      let arc: Connection['arc'];
      const gid = node.raw.group;
      if (
        gid !== undefined &&
        gid === b.raw.group &&
        node.raw.orbit !== undefined &&
        node.raw.orbit === b.raw.orbit &&
        node.raw.orbit > 0
      ) {
        const group = doc.groups?.[String(gid)];
        const radius = orbitRadii[node.raw.orbit] ?? 0;
        if (group && radius > 0) {
          const thetaA = orbitAngle(node.raw.orbit, node.raw.orbitIndex ?? 0, skillsPerOrbit);
          const thetaB = orbitAngle(b.raw.orbit, b.raw.orbitIndex ?? 0, skillsPerOrbit);
          const canvasA = toCanvasAngle(thetaA);
          const canvasB = toCanvasAngle(thetaB);
          // Shortest arc direction
          let diff = canvasB - canvasA;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          arc = {
            cx: group.x,
            cy: group.y,
            radius,
            startAngle: canvasA,
            endAngle: canvasA + diff,
            counterclockwise: diff < 0,
          };
        }
      }

      connections.push({ a: node.id, b: other, isAscendancy, arc });
    }
  }

  return { nodes: positioned, connections, byId };
}

/**
 * Picks the closest zoom level available in the GGG sprite map. `scale`
 * is the current canvas-space scale factor (world units → screen px). The
 * map publishes typical levels [0.1246, 0.2109, 0.2972, 0.3835, 0.5].
 */
export function pickSpriteZoom(scale: number, zoomLevels: number[]): string {
  if (!zoomLevels.length) return '0.3835';
  let best = zoomLevels[0];
  let bestDiff = Math.abs(scale - best);
  for (const z of zoomLevels) {
    const d = Math.abs(scale - z);
    if (d < bestDiff) {
      bestDiff = d;
      best = z;
    }
  }
  return best.toString();
}
