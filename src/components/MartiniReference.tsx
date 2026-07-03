"use client";

import { ALL_CLASSES, SIZE_REFERENCE } from "@/lib/martiniExamples";
import StructureThumb from "@/components/StructureThumb";

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
              Quick guide to bead sizes and chemical types (Souza et al., Nat.
              Methods 2021). Illustrative examples — not the full building-block
              table.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-700 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Close
          </button>
        </div>

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
            Prefix the type with the size: e.g. <span className="font-mono">P2</span>{" "}
            (Regular), <span className="font-mono">SP2</span> (Small),{" "}
            <span className="font-mono">TP2</span> (Tiny). Within a class a higher
            number = more polar; add a/d labels for H-bond acceptor/donor.
          </p>
        </section>

        <section className="mt-6 space-y-5">
          <h3 className="text-sm font-semibold text-neutral-200">
            Chemical types (polar → apolar)
          </h3>
          {ALL_CLASSES.map((cls) => (
            <div
              key={cls.className}
              className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4"
            >
              <div className="font-medium text-white">{cls.className}</div>
              <div className="mt-0.5 text-sm text-neutral-400">
                {cls.description}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {cls.examples.map((ex) => (
                  <div
                    key={ex.name}
                    className="w-32 rounded-lg border border-neutral-800 bg-neutral-950/60 p-2 text-center"
                  >
                    <div className="flex justify-center">
                      <StructureThumb smiles={ex.smiles} />
                    </div>
                    <div className="mt-1 text-xs font-medium text-neutral-100">
                      {ex.name}
                    </div>
                    <div className="text-[11px] leading-tight text-neutral-400">
                      {ex.maps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
