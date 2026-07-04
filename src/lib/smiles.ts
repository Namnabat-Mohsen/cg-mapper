/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadRDKit } from "@/lib/rdkit";
import { embed3D } from "@/lib/embed3d";
import type { Atom, ExplicitBond } from "@/types/molecule";

export type MoleculeInput = {
  atoms: Atom[];
  modelText: string;
  format: "sdf";
  bonds: ExplicitBond[];
};

// Convert a SMILES string into atoms, explicit bonds, and a 3D molfile (SDF)
// the viewer can render with real bond orders. RDKit only lays out in 2D, so
// after parsing we relax the structure into 3D ourselves (embed3D) and write
// our own molfile with those coordinates + RDKit's Kekulized bond orders
// (needed so double/triple bonds actually render as such).
export async function smilesToMolecule(
  smiles: string
): Promise<MoleculeInput> {
  const RDKit = await loadRDKit();
  const clean = smiles.trim();
  const mol = RDKit.get_mol(clean);
  if (!mol || !mol.is_valid()) {
    if (mol) mol.delete();
    throw new Error("Invalid SMILES");
  }
  try {
    // Add explicit hydrogens first: without them, most atoms (aromatic CH,
    // terminal CH3, etc.) have too few neighbors for angle/planarity
    // restraints in embed3D to do anything, and the shown "all-atom"
    // molecule would be missing its hydrogens entirely.
    mol.add_hs_in_place();
    mol.set_new_coords();

    // Aromatic-preserving molblock: bond type 4 marks aromatic bonds, which
    // we need for chemistry classification and for embed3D's uniform ring
    // bond-length treatment.
    let aromaticMolblock: string;
    try {
      aromaticMolblock = mol.get_molblock(JSON.stringify({ kekulize: false }));
    } catch {
      aromaticMolblock = mol.get_molblock();
    }
    // Kekulized molblock: concrete single/double/triple bonds, needed so the
    // 3D viewer can actually draw double-bond lines (plain PDB/aromatic type 4
    // can't represent that).
    let kekuleMolblock: string;
    try {
      kekuleMolblock = mol.get_kekule_form();
    } catch {
      kekuleMolblock = aromaticMolblock;
    }

    const { bonds: aromaticBonds } = parseMolblock(aromaticMolblock);
    const { atoms: atoms2d, bonds: kekuleBonds } = parseMolblock(kekuleMolblock);
    if (atoms2d.length === 0) throw new Error("No atoms parsed");

    const aromaticKeys = new Set(
      aromaticBonds.filter((b) => b.aromatic).map((b) => bondKey(b.a, b.b))
    );
    const bonds: ExplicitBond[] = kekuleBonds.map((b) => ({
      ...b,
      aromatic: aromaticKeys.has(bondKey(b.a, b.b)),
    }));

    let atoms = atoms2d;
    try {
      atoms = embed3D(atoms2d, bonds);
    } catch {
      atoms = atoms2d; // fall back to the 2D layout
    }

    return {
      atoms,
      bonds,
      format: "sdf",
      modelText: buildMolblock(atoms, bonds),
    };
  } finally {
    mol.delete();
  }
}

function bondKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function parseMolblock(molblock: string): {
  atoms: Atom[];
  bonds: ExplicitBond[];
} {
  const lines = molblock.split(/\r?\n/);
  const counts = lines[3] ?? "";
  const nAtoms = parseInt(counts.substring(0, 3), 10) || 0;
  const nBonds = parseInt(counts.substring(3, 6), 10) || 0;

  const atoms: Atom[] = [];
  for (let i = 0; i < nAtoms; i++) {
    const line = lines[4 + i] ?? "";
    const x = parseFloat(line.substring(0, 10));
    const y = parseFloat(line.substring(10, 20));
    const z = parseFloat(line.substring(20, 30));
    const element = line.substring(31, 34).trim();
    atoms.push({
      serial: i + 1,
      name: element,
      residueName: "LIG",
      chainId: "A",
      residueId: 1,
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      z: Number.isFinite(z) ? z : 0,
      element,
    });
  }

  const bonds: ExplicitBond[] = [];
  for (let j = 0; j < nBonds; j++) {
    const line = lines[4 + nAtoms + j] ?? "";
    const a = parseInt(line.substring(0, 3), 10);
    const b = parseInt(line.substring(3, 6), 10);
    const t = parseInt(line.substring(6, 9), 10);
    if (!a || !b) continue;
    bonds.push({
      a,
      b,
      order: t === 4 ? 2 : t, // aromatic (type 4) approximated as double here
      aromatic: t === 4,
    });
  }

  return { atoms, bonds };
}

// Build a minimal, valid MDL V2000 molfile (single record, "$$$$"-terminated
// so it also reads as a one-entry SDF) from our own 3D coordinates + bonds.
function buildMolblock(atoms: Atom[], bonds: ExplicitBond[]): string {
  const lines: string[] = [];
  lines.push(""); // molecule name
  lines.push("     CGMapper        3D"); // program line
  lines.push(""); // comment
  lines.push(
    String(atoms.length).padStart(3) +
      String(bonds.length).padStart(3) +
      "  0  0  0  0  0  0  0  0999 V2000"
  );
  // V2000 atom line tail: mass-diff (width 2, incl. leading space) + 11 more
  // default fields (width 3 each) — matches RDKit's own writer exactly.
  const ATOM_LINE_TAIL = " 0  0  0  0  0  0  0  0  0  0  0  0";
  for (const a of atoms) {
    lines.push(
      fmtCoord(a.x) +
        fmtCoord(a.y) +
        fmtCoord(a.z) +
        " " +
        (a.element || "C").padEnd(3) +
        ATOM_LINE_TAIL
    );
  }
  for (const b of bonds) {
    const order = Math.min(Math.max(b.order, 1), 3);
    lines.push(
      String(b.a).padStart(3) +
        String(b.b).padStart(3) +
        String(order).padStart(3) +
        "  0"
    );
  }
  lines.push("M  END");
  lines.push("$$$$");
  return lines.join("\n");
}

function fmtCoord(v: number): string {
  return v.toFixed(4).padStart(10);
}
