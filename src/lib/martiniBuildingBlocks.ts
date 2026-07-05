// Martini 3 building-block reference data transcribed from the Martini building-block
// table (bead subtype -> example molecule -> coarse-grained mapping). Factual data.

export type BuildingBlock = { type: string; name: string; mapping: string };

export const BUILDING_BLOCKS: BuildingBlock[] = [
  { type: "P5", name: "4-bromobenzenesulfonamide", mapping: "{[#SX2]1[#TC5][#TC5A]1[#P5]}" },
  { type: "P4", name: "benzenesulfonamide", mapping: "{[#TC5]1[#TC5][#TC5A]1[#P4]}" },
  { type: "P4", name: "4-methylsulfonylchlorobenzene", mapping: "{[#SX3]1[#TC5][#TC5A]1[#P4]}" },
  { type: "N4a", name: "Methyl-benzoate", mapping: "{[#TC5A]21[#TC5][#TC5A]2[#N4a]1}" },
  { type: "N4a", name: "benzenesulfonamide_decoy", mapping: "{[#TC5]1[#TC5][#TC5A]1[#N4a]}" },
  { type: "C2", name: "n-butyl acetate", mapping: "{[#C2][#SN4a]}" },
  { type: "C1", name: "hexanal", mapping: "{[#C1][#SN6a]}" },
  { type: "X1", name: "Iodobenzene", mapping: "{[#X1]1[#TC5][#TC5]1}" },
  { type: "X1", name: "2-Iodophenol", mapping: "{[#X1]1[#SN6][#TC5]1}" },
  { type: "SP4r", name: "D-xylose", mapping: "{[#SP4r]1.2[#TP1].3[#SP1r]1.[#TC4]23}" },
  { type: "SP1", name: "butanol", mapping: "{[#TC2][#SP1]}" },
  { type: "SP1r", name: "D-xylose", mapping: "{[#SP4r]1.2[#TP1].3[#SP1r]1.[#TC4]23}" },
  { type: "SN6", name: "Cyclopentanol", mapping: "{[#SN6]=[#SC3]}" },
  { type: "SN6", name: "2-Iodophenol", mapping: "{[#X1]1[#SN6][#TC5]1}" },
  { type: "SN6a", name: "hexanal", mapping: "{[#C1][#SN6a]}" },
  { type: "SN6d", name: "n-pentylamine", mapping: "{[#SC2][#SN6d]}" },
  { type: "SN6d", name: "Aniline", mapping: "{[#SN6d]1[#TC5][#TC5]1}" },
  { type: "SN6d", name: "Piperidine", mapping: "{[#SN6d]=[#SC3]}" },
  { type: "SN6d", name: "benzene-1,2-diamine", mapping: "{[#SN6d]1[#SN6d][#TC5]1}" },
  { type: "SN5a", name: "Butanone", mapping: "{[#TC3][#SN5a]}" },
  { type: "SN5a", name: "1,3-Dioxolane", mapping: "{[#SN5a]=[#TC3]}" },
  { type: "SN4a", name: "ethylacetate", mapping: "{[#TC3][#SN4a]}" },
  { type: "SN4a", name: "Tetrahydropyran", mapping: "{[#SC3]=[#SN4a]}" },
  { type: "SN4a", name: "Methyl propanoate", mapping: "{[#TC3][#SN4a]}" },
  { type: "SN4a", name: "Acetophenone", mapping: "{[#TC5A]21[#TC5][#TC5A]2[#SN4a]1}" },
  { type: "SN3a", name: "2-Nitro-m-xylene", mapping: "{[#SC4]21[#TC5][#SC4]2[#SN3a]1}" },
  { type: "SN3a", name: "4-Nitroanisole", mapping: "{[#SN3a]1[#TC5]2[#SN2a][#TC5]12}" },
  { type: "SN2a", name: "4-Nitroanisole", mapping: "{[#SN3a]1[#TC5]2[#SN2a][#TC5]12}" },
  { type: "SC6", name: "hexyne", mapping: "{[#SC2][#SC6]}" },
  { type: "SC6", name: "dimethylsulfoxide", mapping: "{[#SC6][#TP6]}" },
  { type: "SC6", name: "Thiophenol", mapping: "{[#SC6]1[#TC5][#TC5]1}" },
  { type: "SC6", name: "2-aminobenzenethiol", mapping: "{[#SN6d]1[#SC6][#TC5]1}" },
  { type: "SC4", name: "hexene", mapping: "{[#SC2][#SC4]}" },
  { type: "SC4", name: "12-Butadiene", mapping: "{[#TC3][#SC4]}" },
  { type: "SC4", name: "2-Methyl-pyridine", mapping: "{[#SC4]1[#TN6a][#TC5]1}" },
  { type: "SC4", name: "2-Nitro-m-xylene", mapping: "{[#SC4]21[#TC5][#SC4]2[#SN3a]1}" },
  { type: "SC4", name: "Cyclohexene", mapping: "{[#SC4]=[#SC3]}" },
  { type: "SC4", name: "2,5-dimethyl-1,4-benzoquinone", mapping: "{[#TN6a]1[#SC4]2[#TN6a][#SC4A]12}" },
  { type: "SC3", name: "Tetrahydropyran", mapping: "{[#SC3]=[#SN4a]}" },
  { type: "SC3", name: "Cyclohexene", mapping: "{[#SC4]=[#SC3]}" },
  { type: "SC2", name: "hexyne", mapping: "{[#SC2][#SC6]}" },
  { type: "SX4e", name: "trifluoroethanol", mapping: "{[#SX4e][#TP1d]}" },
  { type: "SX4e", name: "Benzotrifluoride", mapping: "{[#TC5A]21[#TC5][#TC5A]2[#SX4e]1}" },
  { type: "SX3", name: "Chlorobenzene", mapping: "{[#SX3]1[#TC5][#TC5]1}" },
  { type: "SX3", name: "2-chloroaniline", mapping: "{[#SN6d]1[#SX3][#TC5]1}" },
  { type: "SX2", name: "Bromobenzene", mapping: "{[#SX2]1[#TC5][#TC5]1}" },
  { type: "SX2", name: "2-bromophenol", mapping: "{[#SX2]1[#SN6][#TC5]1}" },
  { type: "TP6", name: "dimethylsulfoxide", mapping: "{[#SC6][#TP6]}" },
  { type: "TP6a", name: "Propaneamide", mapping: "{[#TC3][#TP6a]}" },
  { type: "TP2a", name: "propionic acid", mapping: "{[#TC3][#TP2a]}" },
  { type: "TP1", name: "D-xylose", mapping: "{[#SP4r]1.2[#TP1].3[#SP1r]1.[#TC4]23}" },
  { type: "TP1d", name: "trifluoroethanol", mapping: "{[#SX4e][#TP1d]}" },
  { type: "TN6", name: "p-Cresol", mapping: "{[#TN6]1[#TC5]2[#TC5A][#TC5]12}" },
  { type: "TN6a", name: "2-Ethylpyrdine", mapping: "{[#TC3][#TN6a]1[#TC5][#TC5]1}" },
  { type: "TN6a", name: "2-Methyl-pyridine", mapping: "{[#SC4]1[#TN6a][#TC5]1}" },
  { type: "TN6a", name: "Para-benzoquinone", mapping: "{[#TN6a]1[#TC5]2[#TN6a][#TC5]12}" },
  { type: "TN6a", name: "Cyclopentanone", mapping: "{[#TN6a]=[#SC3]}" },
  { type: "TN6d", name: "Pyrrolidine", mapping: "{[#TN6d]=[#SC3]}" },
  { type: "TN6a", name: "2-methylhydroquinone", mapping: "{[#TN6a]1[#SC4]2[#TN6a][#TC5]12}" },
  { type: "TN5a", name: "4-Methylimidazole", mapping: "{[#TN5a]1[#TC4][#TN6d]1}" },
  { type: "TN4a", name: "Benzaldehyde", mapping: "{[#TC5A]21[#TC5][#TC5A]2[#TN4a]1}" },
  { type: "TN4a", name: "Benzonitrile", mapping: "{[#TC5A]21[#TC5][#TC5A]2[#TN4a]1}" },
  { type: "TN4a", name: "Tetrahydrofuran", mapping: "{[#TN4a]=[#SC3]}" },
  { type: "TN3a", name: "2-methoxyfuran", mapping: "{[#TC5]1[#TN2a][#TC5]1[#TN3a]}" },
  { type: "TN2a", name: "Methoxybenzene", mapping: "{[#TC5A]21[#TC5][#TC5A]2[#TN2a]1}" },
  { type: "TN1", name: "1-Methylimidazole", mapping: "{[#TN6a]1[#TC5][#TN1]1}" },
  { type: "TN1a", name: "Pyridazine", mapping: "{[#TN1a]1[#TC5][#TC5]1}" },
  { type: "TC5", name: "Ethylbenzene", mapping: "{[#TC3][#TC5]1[#TC5][#TC5]1}" },
  { type: "TC5", name: "2-Methyl-pyridine", mapping: "{[#SC4]1[#TN6a][#TC5]1}" },
  { type: "TC5", name: "Pyrrole", mapping: "{[#TN5a]1[#TC5][#TN6d]1}" },
  { type: "TC5", name: "p-Cresol", mapping: "{[#TN6]1[#TC5]2[#TC5A][#TC5]12}" },
  { type: "TC4", name: "Methyl acrylate", mapping: "{[#TC4][#SN4a]}" },
  { type: "TC4", name: "4-Methylimidazole", mapping: "{[#TN5a]1[#TC4][#TN6d]1}" },
  { type: "TC4", name: "ortho-Methylanisole", mapping: "{[#TC4]1[#SN2a]2[#TC5][#TC5]12}" },
  { type: "TC3", name: "butanal", mapping: "{[#TC3][#SN6a]}" },
  { type: "TC2", name: "butanol", mapping: "{[#TC2][#SP1]}" },
  { type: "TX3", name: "pyridazine, 3,6-dichloro-", mapping: "{[#TX3]1[#TC5]2[#TX3][#TN1a]12}" },
  { type: "TX2", name: "4-Bromoanisole", mapping: "{[#SN2a]1[#TC5]2[#TX2][#TC5]12}" },
];

const CLASS_NAMES: Record<string, string> = {
  Q: "Q — charged",
  P: "P — polar",
  N: "N — intermediate",
  C: "C — apolar",
  X: "X — halo-compound",
};
const CLASS_ORDER = ["Q", "P", "N", "C", "X"];

export function parseBeadType(type: string) {
  let prefix = "";
  let rest = type;
  if (rest.length >= 2 && (rest[0] === "S" || rest[0] === "T") && "QPNCX".includes(rest[1])) {
    prefix = rest[0];
    rest = rest.slice(1);
  }
  const cls = rest[0] ?? "";
  const mm = rest.slice(1).match(/^(\d+)([A-Za-z]*)$/);
  return { prefix, cls, num: mm ? mm[1] : "", labels: mm ? mm[2] : "" };
}

export function blocksForType(type: string, limit = 6): BuildingBlock[] {
  const p = parseBeadType(type);
  const out: BuildingBlock[] = [];
  const seen = new Set<string>();
  const push = (b: BuildingBlock) => {
    const k = b.type + "|" + b.name;
    if (!seen.has(k)) { seen.add(k); out.push(b); }
  };
  for (const b of BUILDING_BLOCKS) if (b.type === type) push(b);
  for (const b of BUILDING_BLOCKS) {
    const q = parseBeadType(b.type);
    if (q.cls === p.cls && q.num === p.num) push(b);
  }
  for (const b of BUILDING_BLOCKS) {
    if (parseBeadType(b.type).cls === p.cls) push(b);
  }
  return out.slice(0, limit);
}

export type BlockClassGroup = {
  cls: string;
  className: string;
  types: { type: string; examples: BuildingBlock[] }[];
};

export const BUILDING_BLOCK_CLASSES: BlockClassGroup[] = (() => {
  const byType = new Map<string, BuildingBlock[]>();
  for (const b of BUILDING_BLOCKS) {
    const list = byType.get(b.type) ?? [];
    list.push(b);
    byType.set(b.type, list);
  }
  const groups: BlockClassGroup[] = CLASS_ORDER.map((cls) => ({
    cls, className: CLASS_NAMES[cls], types: [] as { type: string; examples: BuildingBlock[] }[],
  }));
  const byCls = new Map(groups.map((g) => [g.cls, g]));
  const typeSort = (a: string, b: string) => {
    const pa = parseBeadType(a); const pb = parseBeadType(b);
    const order = (x: string) => (x === "" ? 0 : x === "S" ? 1 : 2);
    return order(pa.prefix) - order(pb.prefix) || (pa.num || "").localeCompare(pb.num || "") || a.localeCompare(b);
  };
  for (const t of [...byType.keys()].sort(typeSort)) {
    const g = byCls.get(parseBeadType(t).cls);
    if (g) g.types.push({ type: t, examples: byType.get(t)! });
  }
  return groups.filter((g) => g.types.length > 0);
})();
