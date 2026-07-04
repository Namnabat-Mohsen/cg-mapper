// Core data model for the CG Molecule Mapper.

export type Atom = {
  serial: number;
  name: string;
  residueName: string;
  chainId: string;
  residueId: number;
  x: number;
  y: number;
  z: number;
  element: string;
};

import type { BeadSize } from "@/lib/beads";

// An explicit chemical bond (from SMILES / RDKit), when connectivity is known
// rather than inferred from geometry.
export type ExplicitBond = {
  a: number; // atom serial
  b: number; // atom serial
  order: number; // 1, 2, 3 (aromatic encoded via `aromatic`)
  aromatic: boolean;
};

// A coarse-grained bead groups one or more all-atom atoms.
// Atoms may be shared across beads (e.g. ring mappings in Martini).
export type Bead = {
  id: string;
  name: string; // e.g. "BB"
  size: BeadSize; // Martini 3 bead size (R / S / T)
  type: string; // Martini 3 base type, e.g. "P2" (label becomes "SP2")
  atoms: number[]; // atom serials assigned to this bead
  position: { x: number; y: number; z: number };
  radius: number; // sphere radius (Angstrom) for the 3D view
  color: string; // hex, used in 3D view and mapping table
};
