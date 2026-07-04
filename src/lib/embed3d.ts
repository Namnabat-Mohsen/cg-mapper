import type { Atom, ExplicitBond } from "@/types/molecule";

// Lightweight 3D embedding for molecules whose connectivity is known (SMILES /
// RDKit) but whose coordinates are only 2D. It sets target distances for bonded
// (1-2) and angle (1-3) atom pairs from covalent radii + hybridization, adds
// weak non-bonded repulsion, and enforces sp2/aromatic planarity by direct
// projection. Minimizes with gradient descent. Not an MD force field — a fast,
// self-contained conformer good enough for CG mapping.

const RCOV: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  P: 1.07,
  S: 1.05,
  CL: 1.02,
  BR: 1.2,
  I: 1.39,
};
const TWO_LETTER = new Set(["CL", "BR"]);

function elementOf(a: Atom): string {
  let s = (a.element || a.name).trim().toUpperCase();
  if (s.length >= 2 && TWO_LETTER.has(s.slice(0, 2))) return s.slice(0, 2);
  return s.slice(0, 1);
}
function rcov(sym: string): number {
  return RCOV[sym] ?? 0.75;
}

// Deterministic small PRNG so results are reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pair = { i: number; j: number; target: number; k: number };
type PlanarCenter = { i: number; a: number; b: number; c: number };

function sub3(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross3(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// Connected components of the aromatic-only adjacency graph — each is a ring
// (or fused ring system).
function findAromaticRings(
  n: number,
  isAromatic: boolean[],
  aromaticAdj: number[][]
): number[][] {
  const visited = new Array(n).fill(false);
  const rings: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (!isAromatic[s] || visited[s]) continue;
    const comp: number[] = [];
    const queue = [s];
    visited[s] = true;
    while (queue.length) {
      const u = queue.shift()!;
      comp.push(u);
      for (const v of aromaticAdj[u]) {
        if (!visited[v]) {
          visited[v] = true;
          queue.push(v);
        }
      }
    }
    if (comp.length >= 3) rings.push(comp);
  }
  return rings;
}

// Reorder a ring's atoms into cyclic (bond-connectivity) order, needed for
// Newell's method. Only succeeds for simple (non-fused) rings where every
// member has exactly 2 in-ring aromatic neighbors; otherwise returns the
// input order as a best-effort fallback.
function orderRingCycle(comp: number[], aromaticAdj: number[][]): number[] {
  const compSet = new Set(comp);
  const degOk = comp.every(
    (u) => aromaticAdj[u].filter((v) => compSet.has(v)).length === 2
  );
  if (!degOk) return comp;

  const order: number[] = [comp[0]];
  const visited = new Set([comp[0]]);
  let prev = -1;
  let cur = comp[0];
  while (order.length < comp.length) {
    const nbrs = aromaticAdj[cur].filter((v) => compSet.has(v));
    const next = nbrs.find((v) => v !== prev && !visited.has(v));
    if (next === undefined) break;
    order.push(next);
    visited.add(next);
    prev = cur;
    cur = next;
  }
  return order.length === comp.length ? order : comp;
}

// Newell's method: a robust average normal for a (possibly non-planar)
// polygon, given its vertices in cyclic order.
function newellNormal(pts: number[][]): number[] {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const nxt = pts[(i + 1) % n];
    nx += (cur[1] - nxt[1]) * (cur[2] + nxt[2]);
    ny += (cur[2] - nxt[2]) * (cur[0] + nxt[0]);
    nz += (cur[0] - nxt[0]) * (cur[1] + nxt[1]);
  }
  return [nx, ny, nz];
}

export function embed3D(atoms: Atom[], bonds: ExplicitBond[]): Atom[] {
  const n = atoms.length;
  if (n <= 1) return atoms;

  const rng = mulberry32(1234);
  const idx = new Map<number, number>();
  atoms.forEach((a, i) => idx.set(a.serial, i));

  // Positions: start from the 2D layout with a small random z kick.
  const pos: number[][] = atoms.map((a) => [a.x, a.y, (rng() - 0.5) * 0.8]);

  const sym = atoms.map(elementOf);
  const neighbors: number[][] = atoms.map(() => []);
  const bonded = new Set<string>();
  const keyOf = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`);

  // Per-atom hybridization hints from bond orders / aromaticity.
  const hasDouble = new Array(n).fill(false);
  const hasTriple = new Array(n).fill(false);
  const isAromatic = new Array(n).fill(false);

  const aromaticAdj: number[][] = atoms.map(() => []);

  const bondPairs: Pair[] = [];
  for (const b of bonds) {
    const i = idx.get(b.a);
    const j = idx.get(b.b);
    if (i === undefined || j === undefined) continue;
    neighbors[i].push(j);
    neighbors[j].push(i);
    bonded.add(keyOf(i, j));
    if (b.aromatic) {
      aromaticAdj[i].push(j);
      aromaticAdj[j].push(i);
    }
    const scale = b.aromatic
      ? 0.92
      : b.order === 3
      ? 0.78
      : b.order === 2
      ? 0.87
      : 1;
    const target = (rcov(sym[i]) + rcov(sym[j])) * scale;
    bondPairs.push({ i, j, target, k: 1.0 });
    if (b.aromatic) {
      isAromatic[i] = isAromatic[j] = true;
    }
    if (b.order === 2) hasDouble[i] = hasDouble[j] = true;
    if (b.order === 3) hasTriple[i] = hasTriple[j] = true;
  }

  // Angle (1-3) targets via the law of cosines.
  const anglePairs: Pair[] = [];
  for (let k = 0; k < n; k++) {
    const nb = neighbors[k];
    let theta: number;
    if (hasTriple[k]) theta = Math.PI; // 180°
    else if (isAromatic[k] || hasDouble[k]) theta = (120 * Math.PI) / 180;
    else theta = (109.47 * Math.PI) / 180;
    for (let a = 0; a < nb.length; a++) {
      for (let b = a + 1; b < nb.length; b++) {
        const i = nb[a];
        const j = nb[b];
        if (bonded.has(keyOf(i, j))) continue; // small ring: skip
        const dik = rcov(sym[i]) + rcov(sym[k]);
        const djk = rcov(sym[j]) + rcov(sym[k]);
        const target = Math.sqrt(
          dik * dik + djk * djk - 2 * dik * djk * Math.cos(theta)
        );
        anglePairs.push({ i, j, target, k: 0.6 });
      }
    }
  }

  // Planar (sp2) centers: aromatic atoms and double-bond carbons should keep
  // their substituents coplanar (e.g. ring flatness, carbonyl geometry).
  // Enforced by direct projection below, not as a soft energy term.
  const planarCenters: PlanarCenter[] = [];
  for (let i = 0; i < n; i++) {
    if (!(isAromatic[i] || hasDouble[i])) continue;
    const nb = neighbors[i];
    if (nb.length < 3) continue;
    planarCenters.push({ i, a: nb[0], b: nb[1], c: nb[2] });
  }

  // Aromatic rings (or fused ring systems), ordered into a cycle where
  // possible, for a ring-wide planarity restraint (per-atom restraints alone
  // don't stop the whole ring from puckering, since bond/angle terms fix
  // lengths and local angles but not the ring's dihedral/pucker freedom).
  const aromaticRings = findAromaticRings(n, isAromatic, aromaticAdj).map(
    (comp) => orderRingCycle(comp, aromaticAdj)
  );

  const VDW_MIN = 2.4;
  const iters = n > 120 ? 260 : 700;
  const PLANAR_DAMP = 0.3;
  const RING_PLANE_DAMP = 0.5;
  let step = 0.06;

  const grad: number[][] = atoms.map(() => [0, 0, 0]);

  const addHarmonic = (p: Pair) => {
    const dv = [
      pos[p.i][0] - pos[p.j][0],
      pos[p.i][1] - pos[p.j][1],
      pos[p.i][2] - pos[p.j][2],
    ];
    const d = Math.hypot(dv[0], dv[1], dv[2]) || 1e-6;
    const coef = (2 * p.k * (d - p.target)) / d;
    for (let c = 0; c < 3; c++) {
      grad[p.i][c] += coef * dv[c];
      grad[p.j][c] -= coef * dv[c];
    }
  };

  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < n; i++) grad[i][0] = grad[i][1] = grad[i][2] = 0;

    for (const p of bondPairs) addHarmonic(p);
    for (const p of anglePairs) addHarmonic(p);

    // Non-bonded repulsion (only when closer than VDW_MIN).
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (bonded.has(keyOf(i, j))) continue;
        const dv = [
          pos[i][0] - pos[j][0],
          pos[i][1] - pos[j][1],
          pos[i][2] - pos[j][2],
        ];
        const d = Math.hypot(dv[0], dv[1], dv[2]) || 1e-6;
        if (d >= VDW_MIN) continue;
        const coef = (2 * 0.35 * (d - VDW_MIN)) / d;
        for (let c = 0; c < 3; c++) {
          grad[i][c] += coef * dv[c];
          grad[j][c] -= coef * dv[c];
        }
      }
    }

    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 3; c++) {
        let g = grad[i][c];
        if (g > 5) g = 5;
        else if (g < -5) g = -5;
        pos[i][c] -= step * g;
      }
    }

    // Planarity (improper/out-of-plane restraint): project the sp2 CENTER
    // atom onto the plane spanned by its own 3 neighbors, damped so it
    // settles gently alongside the bond/angle relaxation. This is the
    // standard out-of-plane restraint used in real force fields — restraining
    // a neighbor instead of the center (tried first) barely propagates around
    // a ring; restraining the center creates a mutually-reinforcing pull that
    // actually flattens the whole ring.
    for (const pc of planarCenters) {
      const A = pos[pc.a];
      const B = pos[pc.b];
      const C = pos[pc.c];
      const vab = sub3(B, A);
      const vac = sub3(C, A);
      const normal = cross3(vab, vac);
      const nlen = Math.hypot(normal[0], normal[1], normal[2]) || 1e-6;
      const nx = normal[0] / nlen;
      const ny = normal[1] / nlen;
      const nz = normal[2] / nlen;
      const vi = sub3(pos[pc.i], A);
      const dev = vi[0] * nx + vi[1] * ny + vi[2] * nz;
      const corr = dev * PLANAR_DAMP;
      pos[pc.i][0] -= corr * nx;
      pos[pc.i][1] -= corr * ny;
      pos[pc.i][2] -= corr * nz;
    }

    // Ring-wide planarity: pull every ring member toward the ring's own
    // best-fit plane (Newell's method), recomputed each iteration. This is
    // what actually removes whole-ring pucker, not just per-atom deviation.
    for (const ring of aromaticRings) {
      const pts = ring.map((i) => pos[i]);
      const centroid = [0, 0, 0];
      for (const p of pts)
        for (let c = 0; c < 3; c++) centroid[c] += p[c] / pts.length;
      const normal = newellNormal(pts);
      const nlen = Math.hypot(normal[0], normal[1], normal[2]) || 1e-6;
      const nx = normal[0] / nlen;
      const ny = normal[1] / nlen;
      const nz = normal[2] / nlen;
      for (const i of ring) {
        const dx = pos[i][0] - centroid[0];
        const dy = pos[i][1] - centroid[1];
        const dz = pos[i][2] - centroid[2];
        const dev = dx * nx + dy * ny + dz * nz;
        const corr = dev * RING_PLANE_DAMP;
        pos[i][0] -= corr * nx;
        pos[i][1] -= corr * ny;
        pos[i][2] -= corr * nz;
      }
    }

    step *= 0.999;
  }

  // Center on the origin.
  const centroid = [0, 0, 0];
  for (const p of pos) for (let c = 0; c < 3; c++) centroid[c] += p[c] / n;

  return atoms.map((a, i) => ({
    ...a,
    x: pos[i][0] - centroid[0],
    y: pos[i][1] - centroid[1],
    z: pos[i][2] - centroid[2],
  }));
}
