import type { Bead } from "@/types/molecule";
import type { Bonds } from "@/lib/chem";

// Bead-level connectivity and Martini bonded-term enumeration. Shared by the
// .itp writer and the Boltzmann-inversion fitter so both act on exactly the
// same terms (and fitted parameters land on the right entries). Pure
// connectivity — no coordinates.

export type TopologyOptions = {
  ringBondsAsConstraints: boolean;
  properDihedrals: boolean;
  planarityImpropers: boolean;
};

export type Terms = {
  bonds: [number, number][]; // flexible bonds (bead indices)
  constraints: [number, number][]; // rigid in-ring bonds
  angles: [number, number, number][]; // (a, center, c)
  propers: [number, number, number, number][];
  impropers: [number, number, number, number][];
  rigidSystems: number[][]; // constrained ring systems (for exclusions)
  fusedSkipped: number; // aromatic ring systems not auto-flattened
};

export function edgeKey(i: number, j: number): string {
  return i < j ? `${i}-${j}` : `${j}-${i}`;
}

type Graph = { adj: number[][]; edges: Set<string> };

function buildBeadGraph(beads: Bead[], bonds: Bonds): Graph {
  const atomBeads = new Map<number, number[]>();
  beads.forEach((bead, bi) => {
    for (const s of bead.atoms) {
      const list = atomBeads.get(s) ?? [];
      list.push(bi);
      atomBeads.set(s, list);
    }
  });

  const edges = new Set<string>();
  for (const [a, nbrs] of bonds.adj) {
    const ba = atomBeads.get(a);
    if (!ba) continue;
    for (const b of nbrs) {
      const bb = atomBeads.get(b);
      if (!bb) continue;
      for (const i of ba) for (const j of bb) if (i !== j) edges.add(edgeKey(i, j));
    }
  }
  for (const [, list] of atomBeads) {
    const uniq = [...new Set(list)];
    for (let x = 0; x < uniq.length; x++)
      for (let y = x + 1; y < uniq.length; y++)
        edges.add(edgeKey(uniq[x], uniq[y]));
  }

  const adj: number[][] = beads.map(() => []);
  for (const e of edges) {
    const [i, j] = e.split("-").map(Number);
    adj[i].push(j);
    adj[j].push(i);
  }
  return { adj, edges };
}

function ringBonds(graph: Graph): Set<string> {
  const ring = new Set<string>();
  for (const e of graph.edges) {
    const [i, j] = e.split("-").map(Number);
    if (altPath(graph.adj, i, j, e)) ring.add(e);
  }
  return ring;
}

function altPath(
  adj: number[][],
  start: number,
  goal: number,
  excludeEdge: string
): boolean {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const u = queue.shift()!;
    for (const v of adj[u]) {
      if (edgeKey(u, v) === excludeEdge) continue;
      if (v === goal) return true;
      if (!seen.has(v)) {
        seen.add(v);
        queue.push(v);
      }
    }
  }
  return false;
}

function ringSystems(nBeads: number, ring: Set<string>): number[][] {
  const radj: number[][] = Array.from({ length: nBeads }, () => []);
  for (const e of ring) {
    const [i, j] = e.split("-").map(Number);
    radj[i].push(j);
    radj[j].push(i);
  }
  const seen = new Array(nBeads).fill(false);
  const systems: number[][] = [];
  for (let s = 0; s < nBeads; s++) {
    if (seen[s] || radj[s].length === 0) continue;
    const comp: number[] = [];
    const queue = [s];
    seen[s] = true;
    while (queue.length) {
      const u = queue.shift()!;
      comp.push(u);
      for (const v of radj[u]) if (!seen[v]) ((seen[v] = true), queue.push(v));
    }
    systems.push(comp);
  }
  return systems;
}

function orderCycle(comp: number[], ring: Set<string>): number[] | null {
  const set = new Set(comp);
  const nb = (u: number) =>
    comp.filter((v) => v !== u && ring.has(edgeKey(u, v)) && set.has(v));
  if (!comp.every((u) => nb(u).length === 2)) return null;
  const order = [comp[0]];
  const visited = new Set([comp[0]]);
  let prev = -1;
  let cur = comp[0];
  while (order.length < comp.length) {
    const next = nb(cur).find((v) => v !== prev && !visited.has(v));
    if (next === undefined) break;
    order.push(next);
    visited.add(next);
    prev = cur;
    cur = next;
  }
  return order.length === comp.length ? order : null;
}

export function enumerateTerms(
  beads: Bead[],
  bonds: Bonds,
  options: TopologyOptions
): Terms {
  const graph = buildBeadGraph(beads, bonds);
  const ring = ringBonds(graph);
  const systems = ringSystems(beads.length, ring);
  const beadAromatic = beads.map((b) =>
    b.atoms.some((s) => bonds.aromatic.has(s))
  );

  // Constraints only for genuinely rigid rings (aromatic, or 3-bead triangles).
  const rigidSystems = systems.filter(
    (comp) =>
      options.ringBondsAsConstraints &&
      (comp.every((bi) => beadAromatic[bi]) || comp.length <= 3)
  );
  const constraintSet = new Set<string>();
  for (const comp of rigidSystems) {
    const set = new Set(comp);
    for (const e of ring) {
      const [i, j] = e.split("-").map(Number);
      if (set.has(i) && set.has(j)) constraintSet.add(e);
    }
  }
  const isConstraint = (i: number, j: number) =>
    constraintSet.has(edgeKey(i, j));

  const edgeList = [...graph.edges]
    .map((e) => e.split("-").map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const bondsOut: [number, number][] = [];
  const constraintsOut: [number, number][] = [];
  for (const [i, j] of edgeList) {
    if (isConstraint(i, j)) constraintsOut.push([i, j]);
    else bondsOut.push([i, j]);
  }

  // Angles: skip only fully-constrained triangles (all three sides rigid).
  const angles: [number, number, number][] = [];
  for (let b = 0; b < beads.length; b++) {
    const nbrs = [...new Set(graph.adj[b])];
    for (let x = 0; x < nbrs.length; x++) {
      for (let y = x + 1; y < nbrs.length; y++) {
        const a = nbrs[x];
        const c = nbrs[y];
        if (isConstraint(a, b) && isConstraint(b, c) && isConstraint(a, c))
          continue;
        angles.push(a < c ? [a, b, c] : [c, b, a]);
      }
    }
  }

  // Proper dihedrals: one per flexible (non-ring) central bond.
  const propers: [number, number, number, number][] = [];
  if (options.properDihedrals) {
    for (const [b, c] of edgeList) {
      if (isConstraint(b, c) || ring.has(edgeKey(b, c))) continue;
      const a = [...new Set(graph.adj[b])].find((x) => x !== c);
      const d = [...new Set(graph.adj[c])].find((x) => x !== b && x !== a);
      if (a === undefined || d === undefined) continue;
      propers.push(a < d ? [a, b, c, d] : [d, c, b, a]);
    }
  }

  // Improper dihedrals: planarity of aromatic ring systems with >= 4 beads.
  const impropers: [number, number, number, number][] = [];
  let fusedSkipped = 0;
  if (options.planarityImpropers) {
    for (const comp of systems) {
      if (!comp.every((bi) => beadAromatic[bi]) || comp.length < 4) continue;
      const ordered = orderCycle(comp, ring);
      if (!ordered) {
        fusedSkipped++;
        continue;
      }
      for (let k = 0; k <= ordered.length - 4; k++) {
        impropers.push([
          ordered[k],
          ordered[k + 1],
          ordered[k + 2],
          ordered[k + 3],
        ]);
      }
    }
  }

  return {
    bonds: bondsOut,
    constraints: constraintsOut,
    angles,
    propers,
    impropers,
    rigidSystems,
    fusedSkipped,
  };
}
