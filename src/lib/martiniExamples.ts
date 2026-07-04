// Reference data for the Martini 3 bead classes: every chemical class with its
// subtype labels and representative example molecules. The molecules are a
// curated, illustrative set of common compounds (public chemical facts) chosen
// to convey each class — NOT a reproduction of the Martini 3 paper's
// building-block table. For definitive bead assignments consult the Martini 3
// papers and the official ITP/database.

export type MoleculeExample = {
  name: string;
  smiles: string;
  maps: string;
};

export type SubtypeEntry = {
  label: string;
  note: string;
};

export type ClassEntry = {
  key: string; // "Q" | "P" | "N" | "C" | "X" | "W"
  className: string;
  description: string;
  polarity: string; // description of the numeric gradient
  subtypes: SubtypeEntry[];
  examples: MoleculeExample[];
};

export const MARTINI3_CLASSES: ClassEntry[] = [
  {
    key: "Q",
    className: "Q — charged",
    description:
      "Fully charged (ionic) groups: carboxylates, ammoniums, phosphates, guanidiniums and small ions.",
    polarity: "Q1 → Q5: charged subtypes with differing interaction strength.",
    subtypes: [
      { label: "Q1", note: "charged" },
      { label: "Q2", note: "charged" },
      { label: "Q3", note: "charged" },
      { label: "Q4", note: "charged (e.g. ammonium-like)" },
      { label: "Q5", note: "charged (e.g. carboxylate / phosphate-like)" },
    ],
    examples: [
      { name: "Acetate", smiles: "CC(=O)[O-]", maps: "carboxylate → Q" },
      { name: "Methylammonium", smiles: "C[NH3+]", maps: "ammonium → Q" },
      { name: "Guanidinium", smiles: "NC(=[NH2+])N", maps: "→ Q" },
      { name: "Phosphate", smiles: "OP(=O)([O-])[O-]", maps: "phosphate → Q5" },
      { name: "Dimethyl phosphate", smiles: "COP(=O)([O-])OC", maps: "→ Q" },
    ],
  },
  {
    key: "P",
    className: "P — polar",
    description:
      "Strongly polar, hydrogen-bonding groups: alcohols, acids, amides, amines and water.",
    polarity: "P1 → P6: increasing polarity (P6 is the most polar, water-like).",
    subtypes: [
      { label: "P1", note: "least polar in class" },
      { label: "P2", note: "polar" },
      { label: "P3", note: "polar" },
      { label: "P4", note: "polar" },
      { label: "P5", note: "polar" },
      { label: "P6", note: "most polar (water-like)" },
    ],
    examples: [
      { name: "Methanol", smiles: "CO", maps: "alcohol → P" },
      { name: "Ethanol", smiles: "CCO", maps: "alcohol → small P bead" },
      { name: "Ethylene glycol", smiles: "OCCO", maps: "diol → P" },
      { name: "Formamide", smiles: "C(=O)N", maps: "amide → P" },
      { name: "Acetic acid", smiles: "CC(=O)O", maps: "acid → P (Q if ionized)" },
      { name: "Urea", smiles: "NC(=O)N", maps: "→ P" },
    ],
  },
  {
    key: "N",
    className: "N — intermediate",
    description:
      "Weakly polar groups with a single heteroatom: ethers, esters, ketones, amides and nitriles.",
    polarity: "N1 → N6: increasing polarity within the intermediate class.",
    subtypes: [
      { label: "N1", note: "least polar in class" },
      { label: "N2", note: "intermediate" },
      { label: "N3", note: "intermediate" },
      { label: "N4", note: "intermediate" },
      { label: "N5", note: "intermediate" },
      { label: "N6", note: "most polar in class" },
    ],
    examples: [
      { name: "Diethyl ether", smiles: "CCOCC", maps: "ether → N" },
      { name: "Ethyl acetate", smiles: "CCOC(C)=O", maps: "ester → N" },
      { name: "Acetone", smiles: "CC(C)=O", maps: "ketone → N" },
      { name: "Acetamide", smiles: "CC(N)=O", maps: "amide → N/P" },
      { name: "Tetrahydrofuran", smiles: "C1CCOC1", maps: "cyclic ether → N" },
      { name: "Acetonitrile", smiles: "CC#N", maps: "nitrile → N" },
    ],
  },
  {
    key: "C",
    className: "C — apolar",
    description:
      "Hydrophobic groups: aliphatic chains, rings and aromatic carbons.",
    polarity: "C1 → C6: C1 is the most apolar; higher numbers are less hydrophobic.",
    subtypes: [
      { label: "C1", note: "most apolar (alkanes)" },
      { label: "C2", note: "apolar" },
      { label: "C3", note: "apolar" },
      { label: "C4", note: "apolar" },
      { label: "C5", note: "aromatic carbons (e.g. benzene → TC5)" },
      { label: "C6", note: "least apolar in class" },
    ],
    examples: [
      { name: "Butane", smiles: "CCCC", maps: "4 C → 1 C1" },
      { name: "Hexane", smiles: "CCCCCC", maps: "alkane → C1" },
      { name: "Cyclohexane", smiles: "C1CCCCC1", maps: "ring → C beads" },
      { name: "Propene", smiles: "CC=C", maps: "alkene → C" },
      { name: "Benzene", smiles: "c1ccccc1", maps: "6 C → 3 TC5" },
      { name: "Toluene", smiles: "Cc1ccccc1", maps: "aromatic → C" },
    ],
  },
  {
    key: "X",
    className: "X — halo-compound",
    description: "Halogenated groups on a carbon framework.",
    polarity: "X1 → X4: halo-compound subtypes.",
    subtypes: [
      { label: "X1", note: "halo-compound" },
      { label: "X2", note: "halo-compound" },
      { label: "X3", note: "halo-compound" },
      { label: "X4", note: "halo-compound" },
    ],
    examples: [
      { name: "Chloroform", smiles: "ClC(Cl)Cl", maps: "→ X" },
      { name: "Dichloromethane", smiles: "ClCCl", maps: "→ X" },
      { name: "Chlorobenzene", smiles: "Clc1ccccc1", maps: "aryl halide → X" },
      { name: "Bromoethane", smiles: "CCBr", maps: "alkyl halide → X" },
      { name: "Fluorobenzene", smiles: "Fc1ccccc1", maps: "→ X" },
    ],
  },
  {
    key: "W",
    className: "W — water",
    description: "Water. One regular W bead represents ~4 water molecules.",
    polarity: "Single water bead type.",
    subtypes: [{ label: "W", note: "water (~4 H₂O per bead)" }],
    examples: [{ name: "Water (×4)", smiles: "O", maps: "4 H₂O → 1 W" }],
  },
];

export const ALL_CLASSES = MARTINI3_CLASSES;

// Given a bead type like "P4" or "SP2", return the example set for its class.
export function examplesForType(type: string): ClassEntry | null {
  const letter = type.replace(/^[STR]?/, "").charAt(0).toUpperCase();
  return MARTINI3_CLASSES.find((c) => c.key === letter) ?? null;
}

// Bead sizes (mapping resolution).
export const SIZE_REFERENCE = [
  { id: "R", label: "Regular", mapping: "~4 heavy atoms (default resolution)" },
  { id: "S", label: "Small", mapping: "~3 heavy atoms (rings, tighter packing)" },
  { id: "T", label: "Tiny", mapping: "~2 heavy atoms (aromatic rings, small groups)" },
];

// Common sub-labels appended after the number.
export const LABEL_REFERENCE = [
  { id: "d", meaning: "hydrogen-bond donor" },
  { id: "a", meaning: "hydrogen-bond acceptor" },
  {
    id: "e / h / r / v / p / q",
    meaning:
      "additional labels that fine-tune specific interactions — see the Martini 3 documentation",
  },
];
