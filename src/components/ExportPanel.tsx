"use client";

import { useMemo, useState } from "react";
import type { Bead } from "@/types/molecule";
import type { Bonds } from "@/lib/chem";
import {
  buildMapping,
  mappingToJSON,
  buildCgPdb,
  buildCgGro,
  downloadTextFile,
} from "@/lib/exporters";
import { buildItp, DEFAULT_ITP_OPTIONS, type FittedParams } from "@/lib/itp";

type ExportPanelProps = {
  beads: Bead[];
  bonds: Bonds;
  atomCount: number;
  fileName: string;
  fitted?: FittedParams;
};

type PreviewKind = "json" | "pdb" | "gro" | "itp" | null;

export default function ExportPanel({
  beads,
  bonds,
  atomCount,
  fileName,
  fitted,
}: ExportPanelProps) {
  const [preview, setPreview] = useState<PreviewKind>(null);
  const [copied, setCopied] = useState(false);
  const [ringConstraints, setRingConstraints] = useState(true);
  const [properDih, setProperDih] = useState(true);
  const [impropers, setImpropers] = useState(true);

  const json = useMemo(
    () => mappingToJSON(buildMapping(beads, atomCount, fileName)),
    [beads, atomCount, fileName]
  );
  const cgPdb = useMemo(() => buildCgPdb(beads, fileName), [beads, fileName]);
  const cgGro = useMemo(() => buildCgGro(beads, fileName), [beads, fileName]);
  const itp = useMemo(
    () =>
      buildItp(
        beads,
        bonds,
        fileName,
        {
          ...DEFAULT_ITP_OPTIONS,
          ringBondsAsConstraints: ringConstraints,
          properDihedrals: properDih,
          planarityImpropers: impropers,
        },
        fitted
      ),
    [beads, bonds, fileName, ringConstraints, properDih, impropers, fitted]
  );

  const disabled = beads.length === 0;
  const base = fileName.replace(/^SMILES:\s*/i, "").replace(/\.[^.]+$/, "") ||
    "molecule";

  function togglePreview(kind: Exclude<PreviewKind, null>) {
    setPreview((cur) => (cur === kind ? null : kind));
  }

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const previewText =
    preview === "json"
      ? json
      : preview === "pdb"
      ? cgPdb
      : preview === "gro"
      ? cgGro
      : preview === "itp"
      ? itp
      : "";

  const btn =
    "rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40";
  const primaryBtn =
    "rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:opacity-60";

  return (
    <div>
      {disabled && (
        <p className="text-sm text-neutral-500">
          Create at least one bead to export.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-neutral-300">
            Mapping (atoms → beads)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                downloadTextFile(`${base}_mapping.json`, json)
              }
              disabled={disabled}
              className={primaryBtn}
            >
              Download .json
            </button>
            <button
              onClick={handleCopyJson}
              disabled={disabled}
              className={btn}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => togglePreview("json")}
              disabled={disabled}
              className={btn}
            >
              {preview === "json" ? "Hide" : "Preview"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-300">
            CG structure (bead coordinates)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                downloadTextFile(
                  `${base}_cg.pdb`,
                  cgPdb,
                  "chemical/x-pdb"
                )
              }
              disabled={disabled}
              className={primaryBtn}
            >
              Download .pdb
            </button>
            <button
              onClick={() =>
                downloadTextFile(
                  `${base}_cg.gro`,
                  cgGro,
                  "chemical/x-gromacs"
                )
              }
              disabled={disabled}
              className={primaryBtn}
            >
              Download .gro
            </button>
            <button
              onClick={() => togglePreview("pdb")}
              disabled={disabled}
              className={btn}
            >
              {preview === "pdb" ? "Hide" : "PDB"}
            </button>
            <button
              onClick={() => togglePreview("gro")}
              disabled={disabled}
              className={btn}
            >
              {preview === "gro" ? "Hide" : "GRO"}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            One bead per particle · PDB in Å, GRO in nm.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm font-medium text-neutral-300">
            CG topology (.itp)
            {fitted && fitted.size > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                using fitted parameters
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                downloadTextFile(`${base}.itp`, itp, "text/plain")
              }
              disabled={disabled}
              className={primaryBtn}
            >
              Download .itp
            </button>
            <button
              onClick={() => togglePreview("itp")}
              disabled={disabled}
              className={btn}
            >
              {preview === "itp" ? "Hide" : "Preview"}
            </button>
            <label className="ml-2 flex items-center gap-1.5 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={ringConstraints}
                onChange={(e) => setRingConstraints(e.target.checked)}
                className="accent-sky-500"
              />
              Ring constraints
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={properDih}
                onChange={(e) => setProperDih(e.target.checked)}
                className="accent-sky-500"
              />
              Proper dihedrals
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={impropers}
                onChange={(e) => setImpropers(e.target.checked)}
                className="accent-sky-500"
              />
              Planarity impropers
            </label>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Template topology — force constants are defaults to tune; equilibrium
            values measured from the current conformer.
          </p>
        </div>
      </div>

      {preview && !disabled && (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-300">
          {previewText}
        </pre>
      )}
    </div>
  );
}
