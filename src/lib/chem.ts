import type { Atom } from "@/types/molecule";

// Lightweight cheminformatics: infer bonds from 3D geometry (covalent radii),
// perceive rings, and detect functional groups so bead suggestions can account
// for bonds, aromaticity, branching (iso-forms) and functional groups.
// Everything here is distance-based inference — approximate, not a true
// chemical perception engine.

// Cordero covalent radii (Angstrom).
const COVALENT_RADII: Record<string, number> = {
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

const HALOGENS = new Set(["F", "CL", "BR", "I"]);
const TWO_LETTER = new Set(["CL", "BR", "NA", "MG", "CA", "FE", "ZN", "MN", "SE"]);

export function elementSymbol(atom: Atom): string {
  let sym = (atom.element || "").trim().toUpperCase();
  if (!sym) sym = atom.name.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (sym.length >= 2 && TWO_LETTER.has(sym.slice(0, 2))) return sym.slice(0, 2);
  return sym.slice(0, 1);
}

function radius(sym: string): number {
  return COVALENT_RADII[sym] ?? 0.75;
}

function key(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export type Bonds = {
  adj: Map<number, number[]>;
  double: Set<string>; // bonds that look like double/aromatic (short)
  ringBond: Set<string>;
  aromatic: Set<number>; // serials of aromatic atoms
  symbol: Map<number, string>;
};

export function inferBonds(atoms: Atom[]): Bonds {
  const adj = new Map<number, number[]>();
  const double = new Set<string>();
  const symbol = new Map<number, string>();
  for (const a of atoms) {
    adj.set(a.serial, []);
    symbol.set(a.serial, elementSymbol(a));
  }

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const ai = atoms[i];
      const aj = atoms[j];
      const dx = ai.x - aj.x;
      const dy = ai.y - aj.y;
      const dz = ai.z - aj.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 0.4) continue;
      const si = symbol.get(ai.serial)!;
      const sj = symbol.get(aj.serial)!;
      const cutoff = radius(si) + radius(sj) + 0.45;
      if (d > cutoff) continue;

      adj.get(ai.serial)!.push(aj.serial);
      adj.get(aj.serial)!.push(ai.serial);

      // Short bond => double / aromatic.
      const pair = [si, sj].sort().join("");
      const isShort =
        ((pair === "CO" && d < 1.3) ||
          (pair === "CN" && d < 1.35) ||
          (pair === "CC" && d < 1.4) ||
          (pair === "NO" && d < 1.3));
      if (isShort) double.add(key(ai.serial, aj.serial));
    }
  }

  const ringBond = computeRingBonds(adj);
  const aromatic = computeAromatic(adj, double, ringBond, symbol);
  return { adj, double, ringBond, aromatic, symbol };
}

// A bond is a ring bond if its two atoms are still connected after removing it
// (within a short path, so we only catch rings up to ~6 atoms).
function computeRingBonds(adj: Map<number, number[]>): Set<string> {
  const ring = new Set<string>();
  for (const [u, neighbors] of adj) {
    for (const v of neighbors) {
      if (u >= v) continue;
      if (pathExists(adj, u, v, key(u, v), 5)) ring.add(key(u, v));
    }
  }
  return ring;
}

function pathExists(
  adj: Map<number, number[]>,
  start: number,
  goal: number,
  excludeKey: string,
  maxHops: number
): boolean {
  const queue: [number, number][] = [[start, 0]];
  const visited = new Set<number>([start]);
  while (queue.length) {
    const [node, depth] = queue.shift()!;
    if (depth >= maxHops) continue;
    for (const n of adj.get(node) ?? []) {
      if (key(node, n) === excludeKey) continue;
      if (n === goal) return true;
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([n, depth + 1]);
      }
    }
  }
  return false;
}

// Aromatic atoms: C/N in a ring with >=2 incident short (double) ring bonds.
function computeAromatic(
  adj: Map<number, number[]>,
  double: Set<string>,
  ringBond: Set<string>,
  symbol: Map<number, string>
): Set<number> {
  const aromatic = new Set<number>();
  for (const [atom, neighbors] of adj) {
    const sym = symbol.get(atom)!;
    if (sym !== "C" && sym !== "N") continue;
    let count = 0;
    for (const n of neighbors) {
      const k = key(atom, n);
      if (ringBond.has(k) && double.has(k)) count++;
    }
    if (count >= 2) aromatic.add(atom);
  }
  return aromatic;
}

export type Analysis = {
  heavy: number;
  C: number;
  O: number;
  N: number;
  S: number;
  P: number;
  halogen: number;
  bondsInSelection: number;
  branched: boolean;
  maxCarbonDegree: number;
  aromatic: boolean;
  charged: boolean;
  donor: boolean;
  acceptor: boolean;
  groups: string[];
};

export function analyzeSelection(
  atoms: Atom[],
  bonds: Bonds,
  selected: Set<number>
): Analysis {
  const inSel = atoms.filter((a) => selected.has(a.serial));
  const sym = (s: number) => bonds.symbol.get(s) ?? "C";
  const neigh = (s: number) => bonds.adj.get(s) ?? [];
  const isDouble = (a: number, b: number) => bonds.double.has(key(a, b));

  let C = 0,
    O = 0,
    N = 0,
    S = 0,
    P = 0,
    halogen = 0,
    heavy = 0;
  for (const a of inSel) {
    const s = sym(a.serial);
    if (s === "H") continue;
    heavy++;
    if (s === "C") C++;
    else if (s === "O") O++;
    else if (s === "N") N++;
    else if (s === "S") S++;
    else if (s === "P") P++;
    else if (HALOGENS.has(s)) halogen++;
  }

  // Bonds fully inside the selection.
  let bondsInSelection = 0;
  const seen = new Set<string>();
  for (const a of inSel) {
    for (const n of neigh(a.serial)) {
      if (selected.has(n) && sym(a.serial) !== "H" && sym(n) !== "H") {
        const k = key(a.serial, n);
        if (!seen.has(k)) {
          seen.add(k);
          bondsInSelection++;
        }
      }
    }
  }

  // Branching / iso-forms: a selected carbon bonded to >=3 other carbons.
  let maxCarbonDegree = 0;
  for (const a of inSel) {
    if (sym(a.serial) !== "C") continue;
    const cDeg = neigh(a.serial).filter((n) => sym(n) === "C").length;
    if (cDeg > maxCarbonDegree) maxCarbonDegree = cDeg;
  }
  const branched = maxCarbonDegree >= 3;

  const aromatic = inSel.some((a) => bonds.aromatic.has(a.serial));

  const groups = new Set<string>();
  let charged = false;
  let donor = false;
  let acceptor = false;

  for (const a of inSel) {
    const s = sym(a.serial);
    const ns = neigh(a.serial);

    if (s === "O") {
      const cN = ns.filter((n) => sym(n) === "C");
      const hN = ns.filter((n) => sym(n) === "H");
      const dblToC = cN.some((c) => isDouble(a.serial, c));
      if (dblToC) {
        groups.add("carbonyl");
        acceptor = true;
      } else if (cN.length === 2) {
        groups.add("ether");
        acceptor = true;
      } else if (cN.length === 1) {
        groups.add("hydroxyl");
        donor = true;
        acceptor = true;
        if (hN.length === 0 && ns.length === 1) {
          // Terminal O with no explicit H — could be a carboxylate oxygen.
          groups.add("possible-carboxylate");
        }
      }
    }

    if (s === "C") {
      const oN = ns.filter((n) => sym(n) === "O");
      const dblO = oN.filter((o) => isDouble(a.serial, o));
      if (oN.length >= 2 && dblO.length >= 1) {
        // C(=O)-O : carboxyl / ester
        const singleO = oN.find((o) => !isDouble(a.serial, o));
        const esterLike =
          singleO !== undefined &&
          neigh(singleO).some((x) => x !== a.serial && sym(x) === "C");
        groups.add(esterLike ? "ester" : "carboxyl");
        acceptor = true;
      }
    }

    if (s === "N") {
      const heavyDeg = ns.filter((n) => sym(n) !== "H").length;
      const totalDeg = ns.length;
      const adjCarbonyl = ns.some(
        (c) =>
          sym(c) === "C" &&
          neigh(c).some((o) => sym(o) === "O" && isDouble(c, o))
      );
      if (totalDeg >= 4 || (heavyDeg <= 1 && totalDeg === 4)) {
        groups.add("ammonium");
        charged = true;
        donor = true;
      } else if (adjCarbonyl) {
        groups.add("amide");
        donor = true;
        acceptor = true;
      } else {
        groups.add("amine");
        donor = true;
        acceptor = true;
      }
    }

    if (HALOGENS.has(s)) groups.add("halide");
  }

  if (P >= 1 && O >= 3) {
    groups.add("phosphate");
    charged = true;
  }
  if (aromatic) groups.add("aromatic ring");
  if (branched) groups.add("branched");

  return {
    heavy,
    C,
    O,
    N,
    S,
    P,
    halogen,
    bondsInSelection,
    branched,
    maxCarbonDegree,
    aromatic,
    charged,
    donor,
    acceptor,
    groups: [...groups],
  };
}
