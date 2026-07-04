import type { Atom, Bead } from "@/types/molecule";
import { beadLabel } from "@/lib/beads";

export type MappingExport = {
  format: "cg-mapper-mapping";
  version: 1;
  forcefield: "martini3";
  molecule: string;
  source: string;
  createdAt: string;
  counts: {
    atoms: number;
    beads: number;
    assignedAtoms: number;
  };
  beads: {
    id: string;
    name: string;
    size: Bead["size"];
    type: string;
    label: string;
    atoms: number[];
    position: { x: number; y: number; z: number };
    radius: number;
    color: string;
  }[];
};

// Strip a file extension for a friendlier molecule name.
function stripExt(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") || "molecule";
}

export function buildMapping(
  beads: Bead[],
  atomCount: number,
  fileName: string
): MappingExport {
  const assigned = new Set<number>();
  for (const b of beads) for (const s of b.atoms) assigned.add(s);

  return {
    format: "cg-mapper-mapping",
    version: 1,
    forcefield: "martini3",
    molecule: stripExt(fileName),
    source: fileName || "unknown",
    createdAt: new Date().toISOString(),
    counts: {
      atoms: atomCount,
      beads: beads.length,
      assignedAtoms: assigned.size,
    },
    beads: beads.map((b) => ({
      id: b.id,
      name: b.name,
      size: b.size,
      type: b.type,
      label: beadLabel(b.size, b.type),
      atoms: b.atoms,
      position: b.position,
      radius: b.radius,
      color: b.color,
    })),
  };
}

export function mappingToJSON(mapping: MappingExport): string {
  return JSON.stringify(mapping, null, 2);
}

// ---- CG structure export ----
//
// Bead positions are in Ångström (PDB input and the SMILES embedder both work
// in Å). PDB output stays in Å; GRO output is converted to nm (÷10), as
// GROMACS expects. All beads are written as a single residue (the molecule).

// A short residue code (uppercase alphanumerics) from the source name.
function residueCode(fileName: string, maxLen: number): string {
  const base = stripExt(fileName).replace(/^smiles:\s*/i, "");
  const code = base.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (code || "MOL").slice(0, maxLen);
}

function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s.padStart(width);
}
function padEnd(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s.padEnd(width);
}
function f83(v: number): string {
  return v.toFixed(3).padStart(8);
}

// Build a CG structure in PDB format (Å). One HETATM record per bead.
export function buildCgPdb(beads: Bead[], fileName: string): string {
  const resName = residueCode(fileName, 3);
  const lines: string[] = [];
  lines.push(
    `REMARK    Coarse-grained structure (Martini 3) from CG Molecule Mapper`
  );
  lines.push(`REMARK    source: ${fileName || "unknown"}`);

  beads.forEach((bead, i) => {
    const serial = (i + 1) % 100000;
    const name = padEnd(bead.name.slice(0, 4), 4);
    const line =
      "HETATM" +
      pad(String(serial), 5) +
      " " +
      name +
      " " +
      padEnd(resName, 3) +
      " A" +
      pad("1", 4) +
      "    " +
      f83(bead.position.x) +
      f83(bead.position.y) +
      f83(bead.position.z) +
      "  1.00  0.00          ";
    lines.push(line);
  });

  lines.push("END");
  return lines.join("\n") + "\n";
}

// Build an all-atom PDB (Å) from parsed atoms — used for the reference-MD
// bundle when no SMILES is available.
export function buildAtomisticPdb(atoms: Atom[], fileName: string): string {
  const resName = residueCode(fileName, 3);
  const lines: string[] = [];
  lines.push(`REMARK    All-atom structure from CG Molecule Mapper`);
  atoms.forEach((a, i) => {
    const serial = (i + 1) % 100000;
    const name = padEnd(a.name.slice(0, 4), 4);
    const element = a.element.toUpperCase().padStart(2);
    lines.push(
      "HETATM" +
        pad(String(serial), 5) +
        " " +
        name +
        " " +
        padEnd(resName, 3) +
        " A" +
        pad("1", 4) +
        "    " +
        f83(a.x) +
        f83(a.y) +
        f83(a.z) +
        "  1.00  0.00          " +
        element
    );
  });
  lines.push("END");
  return lines.join("\n") + "\n";
}

// Build a CG structure in GROMACS .gro format (nm).
export function buildCgGro(beads: Bead[], fileName: string): string {
  const resName = residueCode(fileName, 5);
  const n = beads.length;

  const posNm = beads.map((b) => ({
    x: b.position.x / 10,
    y: b.position.y / 10,
    z: b.position.z / 10,
  }));

  const lines: string[] = [];
  lines.push(`${stripExt(fileName)} coarse-grained (Martini 3)`);
  lines.push(String(n));

  beads.forEach((bead, i) => {
    const p = posNm[i];
    const resNum = pad("1", 5);
    const res = padEnd(resName, 5);
    const atomName = pad(bead.name.slice(0, 5), 5);
    const atomNum = pad(String((i + 1) % 100000), 5);
    lines.push(
      resNum +
        res +
        atomName +
        atomNum +
        p.x.toFixed(3).padStart(8) +
        p.y.toFixed(3).padStart(8) +
        p.z.toFixed(3).padStart(8)
    );
  });

  lines.push(groBoxLine(posNm));
  return lines.join("\n") + "\n";
}

// Rectangular box vectors (nm) sized to fit all beads with 1 nm padding each
// side, minimum 1 nm per edge so the file is always valid.
function groBoxLine(posNm: { x: number; y: number; z: number }[]): string {
  const PADDING = 1.0;
  const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
  const sizes = axes.map((ax) => {
    if (posNm.length === 0) return 1;
    let min = Infinity;
    let max = -Infinity;
    for (const p of posNm) {
      if (p[ax] < min) min = p[ax];
      if (p[ax] > max) max = p[ax];
    }
    return Math.max(max - min + 2 * PADDING, 1);
  });
  return sizes.map((s) => s.toFixed(5).padStart(10)).join("");
}

// Trigger a client-side download of the given text as a file.
export function downloadTextFile(
  filename: string,
  text: string,
  mime = "application/json"
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
