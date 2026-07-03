import type { Bead } from "@/types/molecule";
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
