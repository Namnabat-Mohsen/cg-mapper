import type { Atom } from "@/types/molecule";

// Geometric (unweighted) center of a set of atoms.
export function geometricCenter(atoms: Atom[]): {
  x: number;
  y: number;
  z: number;
} {
  if (atoms.length === 0) return { x: 0, y: 0, z: 0 };
  let x = 0;
  let y = 0;
  let z = 0;
  for (const a of atoms) {
    x += a.x;
    y += a.y;
    z += a.z;
  }
  const n = atoms.length;
  return { x: x / n, y: y / n, z: z / n };
}
