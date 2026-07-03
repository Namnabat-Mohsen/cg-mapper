// Representative example molecules for each Martini 3 bead class, used to
// illustrate a suggestion. These are common, well-established mappings from the
// Martini 3 framework (Souza et al., Nat. Methods 2021) shown as illustrative
// references — not a verbatim copy of the paper's building-block table.

export type MartiniExample = {
  name: string;
  smiles: string;
  maps: string; // short note on how it maps
};

type ClassInfo = {
  className: string;
  description: string;
  examples: MartiniExample[];
};

const BY_CLASS: Record<string, ClassInfo> = {
  C: {
    className: "C — apolar",
    description: "Hydrophobic groups: alkanes and aromatic carbons.",
    examples: [
      { name: "Butane", smiles: "CCCC", maps: "4 C → 1 C1 (Regular)" },
      { name: "Cyclohexane", smiles: "C1CCCCC1", maps: "6 C → 3 tiny C beads" },
      { name: "Benzene", smiles: "c1ccccc1", maps: "6 C → 3 TC5 (aromatic)" },
    ],
  },
  N: {
    className: "N — intermediate",
    description:
      "Weakly polar groups with a single heteroatom: ethers, esters, amides, ketones.",
    examples: [
      { name: "Diethyl ether", smiles: "CCOCC", maps: "ether O → N bead" },
      { name: "Ethyl acetate", smiles: "CCOC(C)=O", maps: "ester → N bead" },
      { name: "Acetone", smiles: "CC(C)=O", maps: "ketone → N bead" },
    ],
  },
  P: {
    className: "P — polar",
    description:
      "Strongly polar / H-bonding groups: alcohols, acids, amines, and water.",
    examples: [
      { name: "Ethanol", smiles: "CCO", maps: "hydroxyl → small P bead" },
      { name: "1-Propanol", smiles: "CCCO", maps: "alcohol → P bead" },
      { name: "Water (×4)", smiles: "O", maps: "4 H₂O → 1 W bead" },
    ],
  },
  Q: {
    className: "Q — charged",
    description: "Ionized groups: carboxylates, ammoniums, phosphates.",
    examples: [
      { name: "Acetate", smiles: "CC(=O)[O-]", maps: "carboxylate → Q" },
      { name: "Methylammonium", smiles: "C[NH3+]", maps: "ammonium → Q" },
      { name: "Phosphate", smiles: "OP(=O)([O-])[O-]", maps: "phosphate → Q5" },
    ],
  },
  X: {
    className: "X — halo-compound",
    description: "Halogenated groups on a carbon framework.",
    examples: [
      { name: "Chloroform", smiles: "ClC(Cl)Cl", maps: "halocarbon → X" },
      { name: "Chlorobenzene", smiles: "Clc1ccccc1", maps: "aryl halide → X" },
      { name: "Bromoethane", smiles: "CCBr", maps: "alkyl halide → X" },
    ],
  },
};

// Given a bead type like "P4", return the example set for its class ("P").
export function examplesForType(type: string): ClassInfo | null {
  const classLetter = type.charAt(0).toUpperCase();
  return BY_CLASS[classLetter] ?? null;
}

// Ordered class list (most polar → least) for the reference panel.
export const ALL_CLASSES: ClassInfo[] = [
  BY_CLASS.Q,
  BY_CLASS.P,
  BY_CLASS.N,
  BY_CLASS.C,
  BY_CLASS.X,
];

// Martini 3 bead sizes for the reference panel.
export const SIZE_REFERENCE = [
  { id: "R", label: "Regular", mapping: "~4 heavy atoms (default resolution)" },
  { id: "S", label: "Small", mapping: "~3 heavy atoms (rings, tighter packing)" },
  { id: "T", label: "Tiny", mapping: "~2 heavy atoms (aromatic rings, small groups)" },
];
