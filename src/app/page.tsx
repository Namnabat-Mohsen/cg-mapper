"use client";

import { useState, useCallback, useMemo, type ChangeEvent } from "react";
import MoleculeViewer from "@/components/MoleculeViewer";
import MappingTable from "@/components/MappingTable";
import ExportPanel from "@/components/ExportPanel";
import SuggestionCard from "@/components/SuggestionCard";
import MartiniReference from "@/components/MartiniReference";
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
import type { Atom, Bead } from "@/types/molecule";

export default function Home() {
  const [fileName, setFileName] = useState<string>("");
  const [pdbText, setPdbText] = useState<string>("");
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [beads, setBeads] = useState<Bead[]>([]);
  const [beadCounter, setBeadCounter] = useState<number>(1);
  // The bead type/size the user intends to create (kept independent of the
  // suggestion, so suggestions never override the user's choice).
  const [pendingSize, setPendingSize] = useState<BeadSize>(DEFAULT_BEAD_SIZE);
  const [pendingType, setPendingType] = useState<string>(DEFAULT_BEAD_TYPE);
  const [showReference, setShowReference] = useState(false);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setPdbText(text);
    setAtoms(parsePDB(text));
    setSelected([]);
    setBeads([]);
    setBeadCounter(1);
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
    setBeads((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  }, []);

  const deleteBead = useCallback((id: string) => {
    setBeads((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const selectedSet = new Set(selected);
  const assignedSet = new Set<number>();
  for (const b of beads) for (const s of b.atoms) assignedSet.add(s);
  const assignedCount = assignedSet.size;
  const totalAtoms = atoms.length;

  const bonds = useMemo(() => inferBonds(atoms), [atoms]);

  const suggestion = useMemo(
    () => suggestBead(atoms, bonds, new Set(selected)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, atoms, bonds]
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">CG Molecule Mapper</h1>
        <p className="mt-3 max-w-2xl text-neutral-300">
          Upload an all-atom PDB, select atoms, and group them into
          coarse-grained beads.
        </p>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold">1. Upload AA molecule</h2>
          <input
            type="file"
            accept=".pdb"
            onChange={handleFileUpload}
            className="mt-4 block w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-300"
          />
          {fileName && (
            <p className="mt-4 text-sm text-neutral-400">
              Loaded file: <span className="text-white">{fileName}</span>
            </p>
          )}
          {atoms.length > 0 && (
            <p className="mt-2 text-sm text-green-400">
              Parsed {atoms.length} atoms successfully.
            </p>
          )}
        </section>

        {pdbText && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">2. Select atoms</h2>
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
              pdbText={pdbText}
              selected={selected}
              beads={beads}
              onToggleSelect={toggleSelect}
            />
          </section>
        )}

        {pdbText && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">3. CG beads</h2>
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
        )}

        {pdbText && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">4. Export mapping</h2>
            <p className="mt-1 mb-4 text-sm text-neutral-400">
              Download the current bead mapping as JSON to save your work.
            </p>
            <ExportPanel
              beads={beads}
              atomCount={atoms.length}
              fileName={fileName}
            />
          </section>
        )}

        {atoms.length > 0 && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
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
                Showing first 50 atoms. Use the 3D view to select atoms further
                down the structure.
              </p>
            )}
          </section>
        )}
      </div>

      <MartiniReference
        open={showReference}
        onClose={() => setShowReference(false)}
      />
    </main>
  );
}
