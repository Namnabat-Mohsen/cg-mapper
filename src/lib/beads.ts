// Distinct colors cycled through as beads are created.
export const BEAD_PALETTE = [
  "#38bdf8", // sky
  "#f472b6", // pink
  "#a3e635", // lime
  "#fbbf24", // amber
  "#c084fc", // purple
  "#fb7185", // rose
  "#2dd4bf", // teal
  "#f97316", // orange
];

// ---- Martini 3 bead model ----

export type BeadSize = "R" | "S" | "T";

// Martini 3 bead sizes. Radius (Angstrom) is roughly sigma/2, used only for
// how large the bead sphere is drawn in the 3D view.
export const BEAD_SIZES: {
  id: BeadSize;
  label: string;
  mapping: string;
  radius: number;
}[] = [
  { id: "R", label: "Regular", mapping: "~4 heavy atoms", radius: 2.35 },
  { id: "S", label: "Small", mapping: "~3 heavy atoms", radius: 2.05 },
  { id: "T", label: "Tiny", mapping: "~2 heavy atoms", radius: 1.7 },
];

// Prefix used in the bead label, e.g. size "S" + type "P2" -> "SP2".
export const SIZE_PREFIX: Record<BeadSize, string> = {
  R: "",
  S: "S",
  T: "T",
};

// Martini 3 bead chemical types, grouped by nature. Numbers run from more
// apolar (low) to more polar (high) within each class.
export const MARTINI3_TYPE_GROUPS: { label: string; types: string[] }[] = [
  { label: "Charged (Q)", types: ["Q1", "Q2", "Q3", "Q4", "Q5"] },
  { label: "Polar (P)", types: ["P1", "P2", "P3", "P4", "P5", "P6"] },
  {
    label: "Intermediate (N)",
    types: ["N1", "N2", "N3", "N4", "N5", "N6"],
  },
  { label: "Apolar (C)", types: ["C1", "C2", "C3", "C4", "C5", "C6"] },
  { label: "Halo (X)", types: ["X1", "X2", "X3", "X4"] },
  { label: "Water (W)", types: ["W"] },
];

export const DEFAULT_BEAD_SIZE: BeadSize = "R";
export const DEFAULT_BEAD_TYPE = "P2";

export function beadRadiusForSize(size: BeadSize): number {
  return BEAD_SIZES.find((s) => s.id === size)?.radius ?? 2.35;
}

// Full Martini 3 label, e.g. { size: "T", type: "C5" } -> "TC5".
export function beadLabel(size: BeadSize, type: string): string {
  return SIZE_PREFIX[size] + type;
}
