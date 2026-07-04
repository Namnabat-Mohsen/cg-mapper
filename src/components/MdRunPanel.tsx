"use client";

import { useMemo, useState } from "react";
import type { Atom } from "@/types/molecule";
import { buildAtomisticPdb, downloadTextFile } from "@/lib/exporters";
import {
  buildRunScript,
  buildEnvYml,
  buildReadme,
  DEFAULT_MD_OPTIONS,
} from "@/lib/mdbundle";

type MdRunPanelProps = {
  atoms: Atom[];
  fileName: string;
  sourceSmiles: string;
};

export default function MdRunPanel({
  atoms,
  fileName,
  sourceSmiles,
}: MdRunPanelProps) {
  const [temperature, setTemperature] = useState(DEFAULT_MD_OPTIONS.temperature);
  const [productionNs, setProductionNs] = useState(
    DEFAULT_MD_OPTIONS.productionNs
  );
  const [showScript, setShowScript] = useState(false);

  const opts = useMemo(
    () => ({ temperature, productionNs }),
    [temperature, productionNs]
  );
  const script = useMemo(
    () => buildRunScript(fileName, sourceSmiles, opts),
    [fileName, sourceSmiles, opts]
  );
  const envYml = useMemo(() => buildEnvYml(), []);
  const readme = useMemo(
    () => buildReadme(fileName, sourceSmiles, opts),
    [fileName, sourceSmiles, opts]
  );
  const moleculePdb = useMemo(
    () => buildAtomisticPdb(atoms, fileName),
    [atoms, fileName]
  );

  const btn =
    "rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800";
  const primaryBtn =
    "rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500";

  return (
    <div>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-neutral-300">
        <li>Download the bundle below.</li>
        <li>
          <span className="font-mono text-xs text-neutral-400">
            conda env create -f environment.yml &amp;&amp; conda activate cg-refmd
          </span>
        </li>
        <li>
          <span className="font-mono text-xs text-neutral-400">
            python run_md.py
          </span>{" "}
          — writes <span className="font-mono text-xs">traj.pdb</span>.
        </li>
        <li>
          Come back and upload <span className="font-mono text-xs">traj.pdb</span>{" "}
          to fit parameters (next step).
        </li>
      </ol>

      <div className="mb-4 flex flex-wrap items-end gap-4">
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
          Production (ns)
          <input
            type="number"
            value={productionNs}
            min={0.1}
            step={0.5}
            onChange={(e) => setProductionNs(Number(e.target.value))}
            className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100"
          />
        </label>
        <span className="pb-1.5 text-xs text-neutral-500">
          {sourceSmiles
            ? "Parametrized from SMILES at runtime (OpenFF)."
            : "No SMILES — script reads molecule.pdb."}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => downloadTextFile("run_md.py", script, "text/x-python")}
          className={primaryBtn}
        >
          run_md.py
        </button>
        <button
          onClick={() =>
            downloadTextFile("environment.yml", envYml, "text/yaml")
          }
          className={primaryBtn}
        >
          environment.yml
        </button>
        <button
          onClick={() => downloadTextFile("README.md", readme, "text/markdown")}
          className={primaryBtn}
        >
          README.md
        </button>
        <button
          onClick={() =>
            downloadTextFile("molecule.pdb", moleculePdb, "chemical/x-pdb")
          }
          className={btn}
        >
          molecule.pdb
        </button>
        <button onClick={() => setShowScript((v) => !v)} className={btn}>
          {showScript ? "Hide script" : "Preview script"}
        </button>
      </div>

      {showScript && (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-300">
          {script}
        </pre>
      )}
    </div>
  );
}
