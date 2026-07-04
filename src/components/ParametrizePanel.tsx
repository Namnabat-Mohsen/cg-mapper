"use client";

import { useState, type ChangeEvent } from "react";
import type { Atom, Bead } from "@/types/molecule";
import type { Bonds } from "@/lib/chem";
import { DEFAULT_ITP_OPTIONS } from "@/lib/itp";
import type { FittedParams } from "@/lib/itp";
import { parseMultiModelPdb } from "@/lib/trajectory";
import { fitFromTrajectory, type FitResult, type TermFit } from "@/lib/boltzmann";

type ParametrizePanelProps = {
  atoms: Atom[];
  beads: Bead[];
  bonds: Bonds;
  onFitted: (fitted: FittedParams | undefined) => void;
};

function Sparkline({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  const w = 80;
  const h = 22;
  const bw = w / counts.length;
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      {counts.map((c, i) => {
        const bh = (c / max) * (h - 2);
        return (
          <rect
            key={i}
            x={i * bw}
            y={h - bh}
            width={Math.max(bw - 0.5, 0.5)}
            height={bh}
            fill="#38bdf8"
          />
        );
      })}
    </svg>
  );
}

const KIND_LABEL: Record<TermFit["kind"], string> = {
  bond: "bond",
  angle: "angle",
  proper: "dihedral",
};

export default function ParametrizePanel({
  atoms,
  beads,
  bonds,
  onFitted,
}: ParametrizePanelProps) {
  const [temperature, setTemperature] = useState(300);
  const [result, setResult] = useState<FitResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      const traj = parseMultiModelPdb(text);
      const res = fitFromTrajectory(
        atoms,
        beads,
        bonds,
        DEFAULT_ITP_OPTIONS,
        traj,
        temperature
      );
      setResult(res);
      onFitted(res.fitted.size > 0 ? res.fitted : undefined);
    } finally {
      setBusy(false);
    }
  }

  function clearFit() {
    setResult(null);
    setFileName("");
    onFitted(undefined);
  }

  if (beads.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Create beads first (Map step), then upload a trajectory to fit their
        bonded parameters.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Temperature (K)
          <input
            type="number"
            value={temperature}
            min={1}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Trajectory (multi-model PDB)
          <input
            type="file"
            accept=".pdb"
            onChange={handleFile}
            className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-300"
          />
        </label>
        {result && (
          <button
            onClick={clearFit}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Clear fit
          </button>
        )}
      </div>

      {busy && <p className="mt-4 text-sm text-neutral-400">Fitting…</p>}

      {result && (
        <div className="mt-5">
          <p className="text-sm text-neutral-300">
            {fileName}: <span className="text-white">{result.frameCount}</span>{" "}
            frames · <span className="text-white">{result.fits.length}</span>{" "}
            terms fitted. The Export step&apos;s .itp now uses these values.
          </p>

          {result.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-amber-300">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-700 text-left text-neutral-400">
                  <th className="py-2 pr-4">Term</th>
                  <th className="py-2 pr-4">Beads</th>
                  <th className="py-2 pr-4">Equil.</th>
                  <th className="py-2 pr-4">Force const.</th>
                  <th className="py-2 pr-4">Mean ± SD</th>
                  <th className="py-2 pr-4">Distribution</th>
                  <th className="py-2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {result.fits.map((fit) => (
                  <tr
                    key={fit.key}
                    className="border-b border-neutral-800 text-neutral-200"
                  >
                    <td className="py-2 pr-4">{KIND_LABEL[fit.kind]}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{fit.label}</td>
                    <td className="py-2 pr-4">
                      {fit.kind === "bond"
                        ? `${fit.equil.toFixed(3)} nm`
                        : `${fit.equil.toFixed(1)}°`}
                    </td>
                    <td className="py-2 pr-4">
                      {fit.force.toFixed(1)}{" "}
                      <span className="text-neutral-500">{fit.unit}</span>
                    </td>
                    <td className="py-2 pr-4 text-neutral-400">
                      {fit.mean.toFixed(fit.kind === "bond" ? 3 : 1)} ±{" "}
                      {fit.std.toFixed(fit.kind === "bond" ? 3 : 1)}
                    </td>
                    <td className="py-2 pr-4">
                      <Sparkline counts={fit.histogram.counts} />
                    </td>
                    <td className="py-2 pr-4 text-xs text-amber-300">
                      {fit.warnings.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Direct Boltzmann inversion (q₀ = mean, k = kT/σ²). Bond r² / angle
            sinθ Jacobians are omitted (small for stiff terms); dihedrals use
            circular statistics with a multi-modality warning. Validate before
            production.
          </p>
        </div>
      )}
    </div>
  );
}
