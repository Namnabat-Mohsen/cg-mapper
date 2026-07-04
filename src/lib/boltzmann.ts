import type { Atom, Bead } from "@/types/molecule";
import type { Bonds } from "@/lib/chem";
import { elementSymbol } from "@/lib/chem";
import { enumerateTerms, type TopologyOptions } from "@/lib/topology";
import {
  bondKeyOf,
  angleKeyOf,
  properKeyOf,
  type FittedParams,
} from "@/lib/itp";
import { distNm, angleDeg, dihedralDeg, type V } from "@/lib/geom3";
import type { Trajectory } from "@/lib/trajectory";

// Direct Boltzmann inversion of a mapped CG trajectory into Martini bonded
// parameters. For a harmonic well, a Gaussian gives q0 = mean and k = kT/var.
// Simplifications (documented to the user): bond r^2 / angle sin(theta)
// Jacobian corrections are omitted (small for stiff terms); dihedrals use
// circular statistics and a single-well approximation with a multimodality
// warning.

const KB = 0.0083145; // kJ/mol/K

const MASS: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  P: 30.974,
  S: 32.06,
  CL: 35.45,
  BR: 79.904,
  I: 126.904,
};

export type TermFit = {
  kind: "bond" | "angle" | "proper";
  key: string;
  label: string; // e.g. "1-2" bead indices (1-based)
  equil: number; // nm (bond) or deg (angle/dihedral)
  force: number; // Kb / Ka / Kd
  unit: string;
  mean: number;
  std: number;
  nSamples: number;
  warnings: string[];
  histogram: { centers: number[]; counts: number[] };
};

export type FitResult = {
  fits: TermFit[];
  fitted: FittedParams;
  frameCount: number;
  atomMismatch: number;
  warnings: string[];
};

function histogram(values: number[], nBins = 24) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const counts = new Array(nBins).fill(0);
  for (const v of values) {
    let b = Math.floor(((v - min) / span) * nBins);
    if (b >= nBins) b = nBins - 1;
    if (b < 0) b = 0;
    counts[b]++;
  }
  const centers = counts.map((_, i) => min + ((i + 0.5) / nBins) * span);
  return { centers, counts };
}

function meanStd(values: number[]) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const varr =
    values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(n - 1, 1);
  return { mean, varr, std: Math.sqrt(varr) };
}

// Circular stats for dihedrals (degrees in/out).
function circularStats(deg: number[]) {
  const rad = deg.map((d) => (d * Math.PI) / 180);
  const c = rad.reduce((a, r) => a + Math.cos(r), 0) / rad.length;
  const s = rad.reduce((a, r) => a + Math.sin(r), 0) / rad.length;
  const R = Math.sqrt(c * c + s * s); // resultant length, 0..1
  const meanRad = Math.atan2(s, c);
  const circVarRad = -2 * Math.log(Math.max(R, 1e-6)); // circular variance ~ std^2
  return {
    meanDeg: (meanRad * 180) / Math.PI,
    R,
    varRad: circVarRad,
    stdDeg: (Math.sqrt(circVarRad) * 180) / Math.PI,
  };
}

export function fitFromTrajectory(
  atoms: Atom[],
  beads: Bead[],
  bonds: Bonds,
  options: TopologyOptions,
  traj: Trajectory,
  temperatureK: number
): FitResult {
  const kT = KB * temperatureK;
  const warnings: string[] = [];

  // Atom serial -> position index in the loaded structure (== trajectory order).
  const serialToIndex = new Map<number, number>();
  atoms.forEach((a, i) => serialToIndex.set(a.serial, i));
  const massOf = atoms.map((a) => MASS[elementSymbol(a)] ?? 12);

  // Validate that the trajectory lines up with the loaded molecule.
  let atomMismatch = 0;
  if (traj.frames.length > 0 && traj.frames[0].length !== atoms.length) {
    warnings.push(
      `Trajectory has ${traj.frames[0].length} atoms but the molecule has ${atoms.length}. Atom order must match — generate the MD from the provided molecule.pdb.`
    );
  } else {
    atoms.forEach((a, i) => {
      const el = elementSymbol(a);
      if (traj.elements[i] && traj.elements[i] !== el) atomMismatch++;
    });
    if (atomMismatch > 0)
      warnings.push(
        `${atomMismatch} atom(s) differ in element between the trajectory and the molecule — results may be misaligned.`
      );
  }

  // Map every frame to CG bead centers (mass-weighted).
  const beadTraj: V[][] = beads.map(() => []); // beadTraj[bead][frame]
  for (const frame of traj.frames) {
    beads.forEach((bead, bi) => {
      let mx = 0,
        my = 0,
        mz = 0,
        mtot = 0;
      for (const serial of bead.atoms) {
        const idx = serialToIndex.get(serial);
        if (idx === undefined || idx >= frame.length) continue;
        const m = massOf[idx];
        mx += m * frame[idx].x;
        my += m * frame[idx].y;
        mz += m * frame[idx].z;
        mtot += m;
      }
      if (mtot === 0) mtot = 1;
      beadTraj[bi].push({ x: mx / mtot, y: my / mtot, z: mz / mtot });
    });
  }

  const nFrames = traj.frames.length;
  const terms = enumerateTerms(beads, bonds, options);
  const fits: TermFit[] = [];
  const fitted: FittedParams = new Map();
  const fewFrames = nFrames < 50;

  // Bonds.
  for (const [i, j] of terms.bonds) {
    const vals = beadTraj[i].map((_, f) => distNm(beadTraj[i][f], beadTraj[j][f]));
    const { mean, varr, std } = meanStd(vals);
    const force = kT / Math.max(varr, 1e-9);
    const w: string[] = [];
    if (fewFrames) w.push("few frames — noisy");
    const key = bondKeyOf(i, j);
    fitted.set(key, { equil: mean, force });
    fits.push({
      kind: "bond",
      key,
      label: `${i + 1}-${j + 1}`,
      equil: mean,
      force,
      unit: "kJ/mol/nm²",
      mean,
      std,
      nSamples: vals.length,
      warnings: w,
      histogram: histogram(vals),
    });
  }

  // Angles (Martini cosine form: K = kT / (var_rad * sin^2(theta0))).
  for (const [a, b, c] of terms.angles) {
    const vals = beadTraj[a].map((_, f) =>
      angleDeg(beadTraj[a][f], beadTraj[b][f], beadTraj[c][f])
    );
    const { mean, varr, std } = meanStd(vals);
    const meanRad = (mean * Math.PI) / 180;
    const varRad = varr * (Math.PI / 180) * (Math.PI / 180);
    const sin2 = Math.max(Math.sin(meanRad) ** 2, 0.03);
    const force = kT / (Math.max(varRad, 1e-9) * sin2);
    const w: string[] = [];
    if (fewFrames) w.push("few frames — noisy");
    if (mean > 155) w.push("near-linear — consider restricted bending (funct 10)");
    const key = angleKeyOf(a, b, c);
    fitted.set(key, { equil: mean, force });
    fits.push({
      kind: "angle",
      key,
      label: `${a + 1}-${b + 1}-${c + 1}`,
      equil: mean,
      force,
      unit: "kJ/mol",
      mean,
      std,
      nSamples: vals.length,
      warnings: w,
      histogram: histogram(vals),
    });
  }

  // Proper dihedrals (single-well approximation; multimodality warned).
  for (const [a, b, c, d] of terms.propers) {
    const vals = beadTraj[a].map((_, f) =>
      dihedralDeg(beadTraj[a][f], beadTraj[b][f], beadTraj[c][f], beadTraj[d][f])
    );
    const cs = circularStats(vals);
    const force = kT / Math.max(cs.varRad, 1e-9);
    const w: string[] = [];
    if (fewFrames) w.push("few frames — noisy");
    if (cs.R < 0.6)
      w.push("broad/multi-modal — a single proper term is a poor fit (use funct 3 or tabulated)");
    const key = properKeyOf(a, b, c, d);
    fitted.set(key, { equil: cs.meanDeg, force });
    fits.push({
      kind: "proper",
      key,
      label: `${a + 1}-${b + 1}-${c + 1}-${d + 1}`,
      equil: cs.meanDeg,
      force,
      unit: "kJ/mol",
      mean: cs.meanDeg,
      std: cs.stdDeg,
      nSamples: vals.length,
      warnings: w,
      histogram: histogram(vals),
    });
  }

  if (nFrames === 0) warnings.push("No frames parsed from the file.");

  return { fits, fitted, frameCount: nFrames, atomMismatch, warnings };
}
