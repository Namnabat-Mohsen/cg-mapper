import type { Atom } from "@/types/molecule";

// Minimal fixed-column PDB parser (ATOM / HETATM records).
// Column ranges follow the PDB format specification.
export function parsePDB(pdbText: string): Atom[] {
  const atoms: Atom[] = [];
  const lines = pdbText.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith("ATOM") && !line.startsWith("HETATM")) continue;

    const atom: Atom = {
      serial: Number(line.slice(6, 11).trim()),
      name: line.slice(12, 16).trim(),
      residueName: line.slice(17, 20).trim(),
      chainId: line.slice(21, 22).trim(),
      residueId: Number(line.slice(22, 26).trim()),
      x: Number(line.slice(30, 38).trim()),
      y: Number(line.slice(38, 46).trim()),
      z: Number(line.slice(46, 54).trim()),
      element: line.slice(76, 78).trim() || line.slice(12, 14).trim(),
    };
    atoms.push(atom);
  }

  return atoms;
}
