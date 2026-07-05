"use client";

import { SIZE_REFERENCE, LABEL_REFERENCE } from "@/lib/martiniExamples";
import { BUILDING_BLOCK_CLASSES, BUILDING_BLOCKS } from "@/lib/martiniBuildingBlocks";

type MartiniReferenceProps = {
  open: boolean;
  onClose: () => void;
};

export default function MartiniReference({
  open,
  onClose,
}: MartiniReferenceProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border border-neutral-700 bg-neutral-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Martini 3 bead reference
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Bead sizes, sub-label conventions, and the building-block table:
              every bead subtype with example molecules and their CG mapping
              ({BUILDING_BLOCKS.length} entries).
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Close
          </button>
        </div>

        {/* Sizes */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-200">
            Sizes (mapping resolution)
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {SIZE_REFERENCE.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3"
              >
                <div className="font-mono text-sm text-white">
                  {s.id} · {s.label}
                </div>
                <div className="text-xs text-neutral-400">{s.mapping}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Prefix the type with the size: <span className="font-mono">P2</span>{" "}
            (Regular), <span className="font-mono">SP2</span> (Small),{" "}
            <span className="font-mono">TP2</span> (Tiny).
          </p>
        </section>

        {/* Labels */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-200">
            Sub-labels (after the number)
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {LABEL_REFERENCE.map((l) => (
              <span
                key={l.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs text-neutral-300"
              >
                <span className="font-mono text-white">{l.id}</span> — {l.meaning}
              </span>
            ))}
          </div>
        </section>

        {/* Building-block table */}
        <section className="mt-6 space-y-6">
          <h3 className="text-sm font-semibold text-neutral-200">
            Building-block table (bead subtype → example molecule → CG mapping)
          </h3>
          {BUILDING_BLOCK_CLASSES.map((group) => (
            <div
              key={group.cls}
              className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4"
            >
              <div className="font-medium text-white">{group.className}</div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-left text-neutral-500">
                      <th className="py-1.5 pr-4">Type</th>
                      <th className="py-1.5 pr-4">Example molecule</th>
                      <th className="py-1.5 pr-4">CG mapping</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.types.flatMap((t) =>
                      t.examples.map((ex, i) => (
                        <tr
                          key={t.type + ex.name}
                          className="border-b border-neutral-900 text-neutral-200"
                        >
                          <td className="py-1.5 pr-4 align-top">
                            {i === 0 ? (
                              <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-white">
                                {t.type}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-1.5 pr-4 align-top">{ex.name}</td>
                          <td className="py-1.5 pr-4 align-top font-mono text-xs text-neutral-400">
                            {ex.mapping}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
