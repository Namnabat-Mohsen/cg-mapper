import type { Atom } from "@/types/molecule";
import { beadLabel, type BeadSize } from "@/lib/beads";
import { analyzeSelection, type Analysis, type Bonds } from "@/lib/chem";

// Heuristic bead suggestion based on the Martini 3 mapping guidelines
// (Souza et al., Nat. Methods 2021). Now bond-aware: uses functional groups,
// aromaticity and branching from the geometry-inferred analysis. Still a guide,
// not an exact building-block lookup — the user decides.
//
//  R1. Default mapping is ~4 heavy atoms per Regular (R) bead.
//  R2. 3-to-1 -> Small (S), 2-to-1 -> Tiny (T) (rings / better shape).
//  R3. Chemistry sets the class: apolar C, intermediate N, polar P, charged Q,
//      halo X. Aromatic carbons use C5/C6.
//  R4. Higher subtype number = more polar.

export type Suggestion = {
  size: BeadSize;
  type: string;
  label: string;
  confidence: "high" | "medium" | "low";
  sizeReason: string;
  typeReason: string;
  warnings: string[];
  detected: string[];
  profile: Analysis;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function suggestBead(
  atoms: Atom[],
  bonds: Bonds,
  selected: Set<number>
): Suggestion | null {
  if (selected.size === 0) return null;
  const a = analyzeSelection(atoms, bonds, selected);
  const { heavy, O, N, P, halogen, groups, aromatic, charged, donor } = a;
  const has = (g: string) => groups.includes(g);

  const warnings: string[] = [];

  // ---- Size (R1 / R2) ----
  let size: BeadSize;
  let sizeReason: string;
  if (heavy >= 4) {
    size = "R";
    sizeReason = `${heavy} heavy atoms → Regular bead (~4 heavy atoms per R bead).`;
    if (heavy > 4) {
      warnings.push(
        `Selection has ${heavy} heavy atoms — Martini 3 maps ~2–4 per bead. Consider splitting.`
      );
    }
  } else if (heavy === 3) {
    size = "S";
    sizeReason = "3 heavy atoms → Small (S) bead (3-to-1 mapping).";
  } else if (heavy === 2) {
    size = "T";
    sizeReason = "2 heavy atoms → Tiny (T) bead (2-to-1 mapping).";
  } else if (heavy === 1) {
    size = "T";
    sizeReason = "1 heavy atom → Tiny (T) bead, but beads usually group 2–4 atoms.";
    warnings.push("Only one heavy atom selected — most beads group 2–4 heavy atoms.");
  } else {
    size = "T";
    sizeReason = "No heavy atoms detected in the selection.";
    warnings.push("Selection contains only hydrogens — select the heavy atoms too.");
  }

  if (aromatic && heavy >= 5) {
    warnings.push(
      "Aromatic ring detected — 6-membered rings are usually split into 3 tiny (T) beads."
    );
  }

  // ---- Type / chemistry (R3 / R4), driven by functional groups ----
  const heteroPolar = O + N + a.S;
  const polarity = heavy > 0 ? heteroPolar / heavy : 0;
  let type: string;
  let typeReason: string;
  let confidence: Suggestion["confidence"] = "medium";

  if (has("phosphate")) {
    type = "Q5";
    confidence = "high";
    typeReason =
      "Phosphate group → charged Q bead. Use Q0 if it stays protonated/neutral.";
  } else if (has("ammonium")) {
    type = "Q4";
    confidence = "high";
    typeReason = "Protonated amine (ammonium) → charged Q bead.";
  } else if (aromatic && O === 0 && N === 0) {
    type = "C5";
    confidence = "high";
    typeReason =
      "Aromatic carbons → C5/C6. Benzene maps to 3× TC5 (tiny beads).";
  } else if (halogen >= 1 && heteroPolar === 0) {
    type = "X" + clamp(halogen >= 2 ? 2 : 1, 1, 4);
    confidence = "high";
    typeReason = "Halogen(s) on carbon → Martini 3 halo-compound (X) bead.";
  } else if (has("carboxyl")) {
    type = "P" + clamp(3 + (has("possible-carboxylate") ? 2 : 0), 2, 6);
    confidence = "high";
    typeReason =
      "Carboxyl group → strongly polar P bead (use a charged Q bead if it is deprotonated/carboxylate).";
  } else if (has("hydroxyl") || has("amine")) {
    const num = clamp(Math.round(3 + polarity * 3), 2, 6);
    type = "P" + num;
    confidence = "high";
    typeReason = has("hydroxyl")
      ? "Hydroxyl (alcohol) → polar, H-bond donor+acceptor P bead."
      : "Amine → polar, H-bond donor P bead.";
  } else if (has("amide") || has("ester") || has("carbonyl") || has("ether")) {
    const num = clamp(Math.round(3 + polarity * 3), 2, 6);
    type = "N" + num;
    confidence = "high";
    const grp = has("amide")
      ? "Amide"
      : has("ester")
      ? "Ester"
      : has("carbonyl")
      ? "Carbonyl"
      : "Ether";
    typeReason = `${grp} group → intermediate N bead (weakly polar, H-bond acceptor).`;
  } else if (heteroPolar === 0 && halogen === 0) {
    type = "C1";
    confidence = "high";
    typeReason = "Only carbon/hydrogen → apolar C bead.";
  } else if (polarity >= 0.3) {
    const num = clamp(Math.round(2 + polarity * 4), 2, 6);
    type = "P" + num;
    typeReason = "Heteroatom-rich group → polar P bead (fallback estimate).";
  } else {
    const num = clamp(Math.round(3 + polarity * 3), 2, 6);
    type = "N" + num;
    typeReason = "Diluted heteroatom → intermediate N bead (fallback estimate).";
  }

  if (a.branched) {
    typeReason += " Branched (iso-form) skeleton detected.";
  }
  if ((donor || O > 0 || N > 0) && !charged) {
    typeReason += " Consider a 'd'/'a' label for H-bond donor/acceptor (advanced).";
  }

  return {
    size,
    type,
    label: beadLabel(size, type),
    confidence,
    sizeReason,
    typeReason,
    warnings,
    detected: groups,
    profile: a,
  };
}

// ---- Multiple ranked candidates ----

export type BeadCandidate = {
  size: BeadSize;
  type: string;
  label: string;
  variant: string; // short tag describing this alternative
};

export type SuggestionResult = {
  primary: Suggestion;
  alternatives: BeadCandidate[];
};

const CLASS_RANGE: Record<string, number> = { P: 6, N: 6, C: 6, Q: 5, X: 4 };

export function suggestCandidates(
  atoms: Atom[],
  bonds: Bonds,
  selected: Set<number>
): SuggestionResult | null {
  const primary = suggestBead(atoms, bonds, selected);
  if (!primary) return null;
  const a = primary.profile;
  const cls = primary.type.charAt(0);
  const num = parseInt(primary.type.slice(1), 10) || 0;
  const has = (g: string) => a.groups.includes(g);

  const alts: BeadCandidate[] = [];
  const seen = new Set<string>([`${primary.size}${primary.type}`]);
  const add = (
    type: string,
    variant: string,
    size: BeadSize = primary.size
  ) => {
    const key = `${size}${type}`;
    if (seen.has(key) || alts.length >= 5) return;
    seen.add(key);
    alts.push({ size, type, label: beadLabel(size, type), variant });
  };

  // Polarity neighbours within the class.
  const range = CLASS_RANGE[cls];
  if (range && num) {
    if (num + 1 <= range) add(`${cls}${num + 1}`, "more polar");
    if (num - 1 >= 1) add(`${cls}${num - 1}`, "less polar");
  }

  // H-bond donor / acceptor labels (Martini 3 sub-labels).
  if (!a.charged && cls !== "C" && cls !== "X") {
    if (a.donor && a.acceptor) add(`${primary.type}da`, "H-bond donor+acceptor");
    else if (a.donor) add(`${primary.type}d`, "H-bond donor");
    else if (a.acceptor) add(`${primary.type}a`, "H-bond acceptor");
  }

  // Class alternatives on borderline chemistry.
  if (cls === "N") add(`P${clamp(num, 1, 6)}`, "if more polar (P)");
  if (
    cls === "P" &&
    !a.charged &&
    (has("ether") || has("carbonyl") || has("ester"))
  )
    add(`N${clamp(num, 1, 6)}`, "if less polar (N)");
  if (aromaticOnlyCarbon(a)) add("C6", "alt aromatic (C6)");

  // (De)protonation → charged alternatives.
  if (has("carboxyl")) add("Q5", "if deprotonated (carboxylate)");
  if (has("amine")) add("Q4", "if protonated (ammonium)");

  // Size alternative when the heavy-atom count is borderline.
  if (a.heavy === 4) add(primary.type, "tighter packing (Small)", "S");
  if (a.heavy === 3) add(primary.type, "regular size (R)", "R");
  if (a.heavy === 2) add(primary.type, "small size (S)", "S");

  return { primary, alternatives: alts };
}

function aromaticOnlyCarbon(a: Analysis): boolean {
  return a.aromatic && a.O === 0 && a.N === 0;
}
