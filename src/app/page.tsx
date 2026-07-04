"use client";

import { useState, useCallback, useMemo, type ChangeEvent } from "react";
import MoleculeViewer from "@/components/MoleculeViewer";
import MappingTable from "@/components/MappingTable";
import ExportPanel from "@/components/ExportPanel";
import MdRunPanel from "@/components/MdRunPanel";
import ParametrizePanel from "@/components/ParametrizePanel";
import SuggestionCard from "@/components/SuggestionCard";
import MartiniReference from "@/components/MartiniReference";
import Stepper, { type StepDef } from "@/components/Stepper";
import { parsePDB } from "@/lib/pdbParser";
import { geometricCenter } from "@/lib/geometry";
import {
  BEAD_PALETTE,
  BEAD_SIZES,
  DEFAULT_BEAD_SIZE,
  DEFAULT_BEAD_TYPE,
  MARTINI3_TYPE_GROUPS,
  beadRadiusForSize,
  type BeadSize,
} from "@/lib/beads";
import { suggestBead } from "@/lib/suggest";
import { inferBonds } from "@/lib/chem";
import { smilesToMolecule } from "@/lib/smiles";
import type { FittedParams } from "@/lib/itp";
import type { Atom, Bead, ExplicitBond } from "@/types/molecule";

const STEPS: StepDef[] = [
  { id: 1, label: "Load" },
  { id: 2, label: "Map beads" },
  { id: 3, label: "Export" },
  { id: 4, label: "Reference MD" },
  { id: 5, label: "Parametrize" },
];

export default function Home() {
  const [fileName, setFileName] = useState<string>("");
  const [modelText, setModelText] = useState<string>("");
  const [modelFormat, setModelFormat] = useState<"pdb" | "sdf">("pdb");
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [explicitBonds, setExplicitBonds] = useState<ExplicitBond[] | undefined>(
    undefined
  );
  const [smilesInput, setSmilesInput] = useState<string>("");
  const [sourceSmiles, setSourceSmiles] = useState<string>("");
  const [smilesError, setSmilesError] = useState<string>("");
  const [smilesLoading, setSmilesLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [beads, setBeads] = useState<Bead[]>([]);
  const [beadCounter, setBeadCounter] = useState<number>(1);
  const [pendingSize, setPendingSize] = useState<BeadSize>(DEFAULT_BEAD_SIZE);
  const [pendingType, setPendingType] = useState<string>(DEFAULT_BEAD_TYPE);
  const [showReference, setShowReference] = useState(false);
  const [step, setStep] = useState(1);
  const [fitted, setFitted] = useState<FittedParams | undefined>(undefined);

  function resetForNewMolecule() {
    setSelected([]);
    setBeads([]);
    setBeadCounter(1);
    setFitted(undefined);
    setStep(2);
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSmilesError("");
    const text = await file.text();
    setModelText(text);
    setModelFormat("pdb");
    setAtoms(parsePDB(text));
    setExplicitBonds(undefined);
    setSourceSmiles("");
    resetForNewMolecule();
  }

  async function handleLoadSmiles() {
    const smiles = smilesInput.trim();
    if (!smiles) return;
    setSmilesError("");
    setSmilesLoading(true);
    try {
      const { atoms: parsedAtoms, modelText: text, format, bonds } =
        await smilesToMolecule(smiles);
      setFileName(`SMILES: ${smiles}`);
      setModelText(text);
      setModelFormat(format);
      setAtoms(parsedAtoms);
      setExplicitBonds(bonds);
      setSourceSmiles(smiles);
      resetForNewMolecule();
    } catch {
      setSmilesError(
        "Could not parse that SMILES. Check the syntax and try again."
      );
    } finally {
      setSmilesLoading(false);
    }
  }

  const toggleSelect = useCallback((serial: number) => {
    setSelected((prev) =>
      prev.includes(serial)
        ? prev.filter((s) => s !== serial)
        : [...prev, serial]
    );
  }, []);

  const clearSelection = useCallback(() => setSelected([]), []);

  function createBeadFromSelection() {
    if (selected.length === 0) return;
    const selectedSetLocal = new Set(selected);
    const selAtoms = atoms.filter((a) => selectedSetLocal.has(a.serial));
    const center = geometricCenter(selAtoms);
    const bead: Bead = {
      id: `B${beadCounter}`,
      name: "BB",
      size: pendingSize,
      type: pendingType,
      atoms: [...selected].sort((a, b) => a - b),
      position: center,
      radius: beadRadiusForSize(pendingSize),
      color: BEAD_PALETTE[(beadCounter - 1) % BEAD_PALETTE.length],
    };
    setBeads((prev) => [...prev, bead]);
    setBeadCounter((n) => n + 1);
    setSelected([]);
  }

  const updateBead = useCallback((id: string, patch: Partial<Bead>) => {
    setBeads((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const deleteBead = useCallback((id: string) => {
    setBeads((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const selectedSet = new Set(selected);
  const assignedSet = new Set<number>();
  for (const b of beads) for (const s of b.atoms) assignedSet.add(s);
  const assignedCount = assignedSet.size;
  const totalAtoms = atoms.length;

  const bonds = useMemo(
    () => inferBonds(atoms, explicitBonds),
    [atoms, explicitBonds]
  );

  const suggestion = useMemo(
    () => suggestBead(atoms, bonds, new Set(selected)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, atoms, bonds]
  );

  const loaded = modelText !== "";
  const maxReachable = loaded ? STEPS.length : 1;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">CG Molecule Mapper</h1>
        <p className="mt-3 max-w-2xl text-neutral-300">
          Map an all-atom molecule to Martini 3 beads, export the topology, and
          refine bonded parameters from a reference simulation — one step at a
          time.
        </p>

        <Stepper
          steps={STEPS}
          current={step}
          maxReachable={maxReachable}
          onSelect={setStep}
        />

        {/* Step 1 — Load */}
        {step === 1 && (
          <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">Load AA molecule</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-neutral-300">
                  Option A — PDB file
                </p>
                <input
                  type="file"
                  accept=".pdb"
                  onChange={handleFileUpload}
                  className="mt-2 block w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-300"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-300">
                  Option B — SMILES string
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={smilesInput}
                    onChange={(e) => setSmilesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLoadSmiles();
                    }}
                    placeholder="e.g. CCO, c1ccccc1, CC(=O)O"
                    className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                  <button
                    onClick={handleLoadSmiles}
                    disabled={smilesLoading || smilesInput.trim() === ""}
                    className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:opacity-60"
                  >
                    {smilesLoading ? "Loading…" : "Load"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Try:{" "}
                  {["CCO", "c1ccccc1", "CC(=O)Oc1ccccc1C(=O)O"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSmilesInput(s)}
                      className="mr-2 font-mono text-sky-400 hover:underline"
                    >
                      {s}
                    </button>
                  ))}
                </p>
              </div>
            </div>
            {smilesError && (
              <p className="mt-4 text-sm text-red-400">{smilesError}</p>
            )}
            {fileName && (
              <p className="mt-4 text-sm text-neutral-400">
                Loaded: <span className="text-white">{fileName}</span>
              </p>
            )}
            {atoms.length > 0 && (
              <p className="mt-2 text-sm text-green-400">
                Parsed {atoms.length} atoms
                {explicitBonds ? ` and ${explicitBonds.length} bonds` : ""}{" "}
                successfully.
              </p>
            )}
          </section>
        )}

        {/* Step 2 — Map beads */}
        {step === 2 && loaded && (
          <>
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Select atoms</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Click atoms in the 3D view or the table. Selected atoms turn
                    yellow; assigned atoms take their bead color.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-300">
                    {selected.length} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    disabled={selected.length === 0}
                    className="rounded-lg border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <MoleculeViewer
                modelText={modelText}
                format={modelFormat}
                selected={selected}
                beads={beads}
                onToggleSelect={toggleSelect}
              />
            </section>

            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">CG beads</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    {assignedCount} of {totalAtoms} atoms assigned to{" "}
                    {beads.length} bead{beads.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <button
                  onClick={() => setShowReference(true)}
                  className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                >
                  📖 Martini 3 reference
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                <label className="flex flex-col gap-1 text-xs text-neutral-400">
                  Size
                  <select
                    value={pendingSize}
                    onChange={(e) => setPendingSize(e.target.value as BeadSize)}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100"
                  >
                    {BEAD_SIZES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} · {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-neutral-400">
                  Type
                  <select
                    value={pendingType}
                    onChange={(e) => setPendingType(e.target.value)}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100"
                  >
                    {MARTINI3_TYPE_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.types.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <span className="pb-1.5 font-mono text-sm text-neutral-300">
                  = {pendingSize === "R" ? "" : pendingSize}
                  {pendingType}
                </span>
                <button
                  onClick={() => createBeadFromSelection()}
                  disabled={selected.length === 0}
                  className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:opacity-60"
                >
                  Create bead ({selected.length})
                </button>
              </div>

              {selected.length > 0 && (
                <SuggestionCard
                  suggestion={suggestion}
                  onUse={(size, type) => {
                    setPendingSize(size);
                    setPendingType(type);
                  }}
                />
              )}
              <MappingTable
                beads={beads}
                onUpdate={updateBead}
                onDelete={deleteBead}
              />
            </section>

            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold">Atom list</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700 text-left text-neutral-400">
                      <th className="py-2 pr-4">Sel</th>
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Atom</th>
                      <th className="py-2 pr-4">Residue</th>
                      <th className="py-2 pr-4">Res ID</th>
                      <th className="py-2 pr-4">Chain</th>
                      <th className="py-2 pr-4">X</th>
                      <th className="py-2 pr-4">Y</th>
                      <th className="py-2 pr-4">Z</th>
                      <th className="py-2 pr-4">Element</th>
                      <th className="py-2 pr-4">Bead</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atoms.slice(0, 50).map((atom) => {
                      const isSel = selectedSet.has(atom.serial);
                      const atomBeads = beads.filter((b) =>
                        b.atoms.includes(atom.serial)
                      );
                      return (
                        <tr
                          key={atom.serial}
                          onClick={() => toggleSelect(atom.serial)}
                          className={
                            "cursor-pointer border-b border-neutral-800 " +
                            (isSel
                              ? "bg-yellow-500/10 text-yellow-200"
                              : "text-neutral-200 hover:bg-neutral-800/60")
                          }
                        >
                          <td className="py-2 pr-4">
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSel}
                              className="pointer-events-none accent-yellow-400"
                            />
                          </td>
                          <td className="py-2 pr-4">{atom.serial}</td>
                          <td className="py-2 pr-4">{atom.name}</td>
                          <td className="py-2 pr-4">{atom.residueName}</td>
                          <td className="py-2 pr-4">{atom.residueId}</td>
                          <td className="py-2 pr-4">{atom.chainId || "-"}</td>
                          <td className="py-2 pr-4">{atom.x.toFixed(3)}</td>
                          <td className="py-2 pr-4">{atom.y.toFixed(3)}</td>
                          <td className="py-2 pr-4">{atom.z.toFixed(3)}</td>
                          <td className="py-2 pr-4">{atom.element}</td>
                          <td className="py-2 pr-4">
                            {atomBeads.length > 0 ? (
                              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                                {atomBeads.map((b) => (
                                  <span
                                    key={b.id}
                                    className="inline-flex items-center gap-1"
                                  >
                                    <span
                                      className="inline-block h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: b.color }}
                                    />
                                    {b.id}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-neutral-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {atoms.length > 50 && (
                <p className="mt-4 text-sm text-neutral-500">
                  Showing first 50 atoms. Use the 3D view to select atoms
                  further down the structure.
                </p>
              )}
            </section>
          </>
        )}

        {/* Step 3 — Export */}
        {step === 3 && loaded && (
          <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">Export</h2>
            <p className="mt-1 mb-4 text-sm text-neutral-400">
              Save the mapping (JSON), the coarse-grained structure (PDB / GRO),
              or the Martini topology (.itp).
            </p>
            <ExportPanel
              beads={beads}
              bonds={bonds}
              atomCount={atoms.length}
              fileName={fileName}
              fitted={fitted}
            />
          </section>
        )}

        {/* Step 4 — Reference MD */}
        {step === 4 && loaded && (
          <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">
              Reference MD (for parametrization)
            </h2>
            <p className="mt-1 mb-4 text-sm text-neutral-400">
              Generate the files and steps to run a short all-atom simulation,
              whose trajectory you upload in the next step.
            </p>
            <MdRunPanel
              atoms={atoms}
              fileName={fileName}
              sourceSmiles={sourceSmiles}
            />
          </section>
        )}

        {/* Step 5 — Parametrize */}
        {step === 5 && loaded && (
          <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">
              Parametrize from trajectory
            </h2>
            <p className="mt-1 mb-4 text-sm text-neutral-400">
              Upload the reference trajectory (multi-model PDB). Each frame is
              mapped to your beads and the bonded parameters are fitted by
              Boltzmann inversion; the Export step&apos;s .itp then uses them.
            </p>
            <ParametrizePanel
              atoms={atoms}
              beads={beads}
              bonds={bonds}
              onFitted={setFitted}
            />
          </section>
        )}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
            disabled={step === STEPS.length || (step === 1 && !loaded)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      <MartiniReference
        open={showReference}
        onClose={() => setShowReference(false)}
      />
    </main>
  );
}
